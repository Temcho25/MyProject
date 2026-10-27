import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const range = (v, a, b) => clamp((v - a) / (b - a));

const isMobile = matchMedia('(max-width: 760px)').matches || /Mobi|Android/i.test(navigator.userAgent);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// ?render=<0..1> renders a clean still of the scene at that scroll point (used to make card images)
const RENDER = new URLSearchParams(location.search).get('render');
if (RENDER !== null) document.documentElement.classList.add('render');

/* ------------------------------------------------------------------ */
/* Split text into characters                                          */
/* ------------------------------------------------------------------ */
function split(el) {
  const text = el.textContent;
  el.textContent = '';
  let i = 0;
  text.split(' ').forEach((word, wi) => {
    if (wi) el.appendChild(document.createTextNode(' '));
    const w = document.createElement('span');
    w.style.display = 'inline-block'; w.style.whiteSpace = 'nowrap';
    [...word].forEach(c => {
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', i++);
      w.appendChild(s);
    });
    el.appendChild(w);
  });
  return $$('.ch', el);
}
const wmChars = split($('.wm-main'));
const h2Chars = split($('#objects .h2'));
const phoneChars = split($('[data-digits]'));

/* ------------------------------------------------------------------ */
/* Renderer / scene                                                    */
/* ------------------------------------------------------------------ */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: RENDER !== null });
const DPR = RENDER !== null ? devicePixelRatio : Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(isMobile ? 62 : 48, innerWidth / innerHeight, 1, 6000);

const SUN_DIR = new THREE.Vector3(-0.25, 0.10, -1).normalize();
const COL = {
  horizon: new THREE.Color('#f2a868'),
  rose: new THREE.Color('#b46a73'),
  top: new THREE.Color('#0b1224'),
  fog: new THREE.Color('#6b5a6a'),
};

const U = {
  uTime: { value: 0 },
  uLights: { value: 0.15 },
  uDusk: { value: 0 },          // 0 golden hour -> 1 blue hour
  uSun: { value: SUN_DIR },
  uFogCol: { value: COL.fog.clone() },
  uHorizon: { value: COL.horizon.clone() },
};

/* ---------- sky ---------- */
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(5000, 48, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { ...U },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec3 vDir; uniform vec3 uSun; uniform float uDusk; uniform float uTime;
      void main(){
        float h = vDir.y;
        vec3 horizon = mix(vec3(.78,.46,.30), vec3(.30,.20,.28), uDusk);
        vec3 rose    = mix(vec3(.32,.20,.27), vec3(.10,.10,.19), uDusk);
        vec3 top     = mix(vec3(.03,.04,.09), vec3(.01,.015,.04), uDusk);
        vec3 c = mix(horizon, rose, smoothstep(0.0, .12, h));
        c = mix(c, top, smoothstep(.08, .45, h));
        c = mix(c, vec3(.08,.07,.1), smoothstep(0., -.2, h));
        float s = max(dot(normalize(vDir), uSun), 0.);
        c += vec3(1.,.72,.45) * pow(s, 900.) * 6.;     // sun disc
        c += vec3(1.,.55,.3) * pow(s, 24.) * .45 * (1.-uDusk*.6);   // glow
        c += vec3(1.,.5,.28) * pow(s, 4.) * .08;
        // stars as dusk deepens
        vec3 p = floor(vDir*420.);
        float st = fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453);
        c += step(.9985, st) * smoothstep(.15,.5,h) * uDusk * (.6+.4*sin(uTime*2.+st*60.));
        gl_FragColor = vec4(c, 1.);
      }`
  })
);
scene.add(sky);

/* ---------- mountains (atmospheric layers) ---------- */
function ridge(radius, height, seed, color, fogAmt) {
  const seg = 360, g = new THREE.BufferGeometry();
  const pos = [], idx = [];
  const n = a => {
    let v = 0, amp = 1, f = 1;
    for (let k = 0; k < 5; k++) { v += Math.sin(a * f * 3 + seed * (k + 1) * 1.7) * amp + Math.sin(a * f * 7.3 + seed * 3.1 * k) * amp * .5; amp *= .5; f *= 2.1; }
    return v;
  };
  for (let i = 0; i <= seg; i++) {
    const a = i / seg * Math.PI * 2;
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    const h = height * (0.55 + 0.45 * n(a)) ;
    pos.push(x, -20, z, x, Math.max(10, h), z);
    if (i < seg) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...U, uCol: { value: new THREE.Color(color) }, uFog: { value: fogAmt } },
    vertexShader: `varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying float vY; uniform vec3 uCol; uniform float uFog; uniform float uDusk;
      void main(){ vec3 haze = mix(vec3(.50,.32,.28), vec3(.17,.14,.21), uDusk);
        float f = uFog + (1.-uFog)*smoothstep(240., -10., vY)*.35;
        vec3 c = mix(uCol*(1.-uDusk*.5), haze, clamp(f,0.,1.)); gl_FragColor = vec4(c,1.); }`
  });
  return new THREE.Mesh(g, m);
}
scene.add(ridge(3300, 520, 1.3, '#3a2d3a', .78));
scene.add(ridge(2600, 380, 4.7, '#2a2230', .58));
scene.add(ridge(1900, 230, 9.1, '#1d1923', .38));

/* ---------- ground ---------- */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(8000, 8000).rotateX(-Math.PI / 2),
  new THREE.ShaderMaterial({
    uniforms: { ...U },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `varying vec3 vW; uniform float uDusk; uniform float uLights;
      void main(){
        vec3 c = vec3(.035,.035,.05);
        // avenue
        float av = smoothstep(16.,13.,abs(vW.x)) * step(vW.z, 900.);
        c = mix(c, vec3(.06,.055,.065), av);
        float dash = step(.5, fract(vW.z/12.)) * smoothstep(.6,.3,abs(vW.x)) * av;
        c += vec3(.5,.4,.25)*dash*.25;
        // street grid glow
        vec2 g = abs(fract(vW.xz/36.+.5)-.5)*36.;
        float st = smoothstep(2.4,.8,min(g.x,g.y));
        c += vec3(1.,.62,.32) * st * .05 * uLights;
        float d = length(vW.xz);
        vec3 haze = mix(vec3(.34,.22,.22), vec3(.10,.10,.15), uDusk);
        c = mix(c, haze*.9, 1.-exp(-d*.0011));
        gl_FragColor = vec4(c,1.);
      }`
  })
);
scene.add(ground);

/* ---------- city (instanced, procedural windows) ---------- */
const TOWER_POS = new THREE.Vector3(0, 0, -150);
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }

const buildingMat = new THREE.ShaderMaterial({
  uniforms: { ...U },
  vertexShader: `
    attribute float aSeed;
    varying vec3 vW; varying vec3 vN; varying float vSeed; varying vec3 vLocal; varying vec3 vScale;
    void main(){
      vec4 w = modelMatrix * instanceMatrix * vec4(position,1.);
      vW = w.xyz; vSeed = aSeed; vLocal = position;
      vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
      vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: `
    varying vec3 vW; varying vec3 vN; varying float vSeed; varying vec3 vLocal; varying vec3 vScale;
    uniform vec3 uSun; uniform float uLights; uniform float uDusk; uniform float uTime;
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    void main(){
      vec3 n = normalize(vN);
      vec3 base = mix(vec3(.05,.055,.075), vec3(.09,.085,.10), vSeed);
      // light: warm sun from horizon + cool sky fill
      float sun = max(dot(n, -uSun*vec3(1.,-1.,1.)), 0.);
      float lam = max(dot(n, normalize(vec3(-uSun.x, .35, -uSun.z))), 0.);
      vec3 col = base * (vec3(.30,.33,.45) + vec3(1.3,.75,.45) * lam * (1.-uDusk*.7));
      // rim toward sun
      col += vec3(1.,.6,.35) * pow(1.-abs(n.y), 3.) * lam * .25 * (1.-uDusk);
      if (n.y < .5) {
        vec2 f = abs(n.x) > .5 ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
        vec2 cell = f / vec2(3.2, 3.8);
        vec2 id = floor(cell);
        vec2 q = fract(cell);
        float win = step(.18, q.x) * step(q.x, .82) * step(.28, q.y) * step(q.y, .86);
        float rnd = h21(id + vSeed*91.7);
        float on = step(rnd, uLights * (.18 + .42*vSeed));
        vec3 warm = mix(vec3(1.,.72,.42), vec3(.85,.9,1.), step(.82, h21(id+3.1)));
        float flick = .85 + .15*sin(uTime*(1.+rnd*3.) + rnd*40.);
        col = mix(col, col*.55 + vec3(.05,.06,.09)*(1.-uDusk), win);   // dark glass
        col += warm * win * on * (.55 + .9*rnd) * flick;
        // floor lines
        col *= .92 + .08*step(.06, q.y);
      } else {
        col = base*.55 + vec3(.02);
        // roof beacons
        float r = length(vLocal.xz);
        col += vec3(1.,.15,.1) * smoothstep(.06,.0,r) * step(.92, vSeed) * (.6+.4*sin(uTime*3.+vSeed*20.)) * 6.;
      }
      // fog
      float d = distance(vW, cameraPosition);
      vec3 haze = mix(vec3(.30,.20,.21), vec3(.09,.09,.14), uDusk);
      float fog = 1. - exp(-pow(d*.0011, 1.5));
      fog *= 1. - smoothstep(30., 160., vW.y)*.25;
      col = mix(col, haze, clamp(fog,0.,1.));
      gl_FragColor = vec4(col, 1.);
    }`
});

const boxGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
const grid = isMobile ? 26 : 38, spacing = 34;
const mats = [], seeds = [];
const dummy = new THREE.Object3D();
for (let ix = -grid; ix <= grid; ix++) for (let iz = -grid; iz <= grid; iz++) {
  for (let k = 0; k < 2; k++) {
    const r1 = hash(ix * 3 + k, iz * 7), r2 = hash(iz * 5 + k, ix * 11), r3 = hash(ix + iz * 13, k * 17);
    let x = ix * spacing + (r1 - .5) * 10 + (k ? 9 : -6);
    let z = iz * spacing + (r2 - .5) * 10 + (k ? -8 : 5);
    if (Math.abs(x) < 24) continue;                       // avenue
    const dT = Math.hypot(x - TOWER_POS.x, z - TOWER_POS.z);
    if (dT < 110) continue;                                // plaza around hero tower
    const dist = Math.hypot(x, z + 150);
    const centre = Math.exp(-dist / 380);
    let h = 10 + Math.pow(r3, 2.2) * 70 * (0.35 + centre * 1.6) + centre * 40;
    if (r3 > .97 && dist < 700) h *= 1.8;
    const w = 10 + r1 * 12, d = 10 + r2 * 12;
    dummy.position.set(x, 0, z);
    dummy.rotation.y = 0;
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    mats.push(dummy.matrix.clone());
    seeds.push(r3);
  }
}
const city = new THREE.InstancedMesh(boxGeo, buildingMat, mats.length);
mats.forEach((m, i) => city.setMatrixAt(i, m));
boxGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1));
scene.add(city);

/* ---------- hero tower: assembles floor by floor ---------- */
const FLOORS = 46, FLOOR_H = 4.2, TW = 30;
const towerMat = new THREE.ShaderMaterial({
  uniforms: { ...U },
  vertexShader: `
    attribute float aFloor;
    varying vec3 vW; varying vec3 vN; varying float vF;
    void main(){
      vec4 w = modelMatrix * instanceMatrix * vec4(position,1.);
      vW = w.xyz; vF = aFloor; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
      gl_Position = projectionMatrix*viewMatrix*w;
    }`,
  fragmentShader: `
    varying vec3 vW; varying vec3 vN; varying float vF;
    uniform vec3 uSun; uniform float uDusk; uniform float uLights; uniform float uTime;
    void main(){
      vec3 n = normalize(vN);
      vec3 V = normalize(cameraPosition - vW);
      float fres = pow(1. - max(dot(n, V), 0.), 3.);
      // glass reflects sky gradient
      vec3 R = reflect(-V, n);
      vec3 skyC = mix(vec3(.85,.52,.34), vec3(.05,.07,.14), smoothstep(-.05,.4,R.y));
      skyC = mix(skyC, mix(skyC, vec3(.3,.25,.35), .6), uDusk);
      float sunSpec = pow(max(dot(R, uSun), 0.), 60.);
      vec3 col = vec3(.02,.025,.04) + skyC * (.12 + .45*fres) + vec3(1.,.75,.5)*sunSpec*2.5*(1.-uDusk*.6);
      // mullions
      vec2 f = abs(n.x) > .5 ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
      float mul = smoothstep(.06,.0,abs(fract(f.x/3.75)-.5)-.44);
      col = mix(col, vec3(.72,.58,.38)*.5, mul*.6*step(n.y,.5));
      // interior lights per floor
      float lit = step(fract(sin(vF*12.9898)*43758.5)*.9, uLights);
      col += vec3(1.,.78,.5) * lit * .22 * step(n.y,.5) * (.7 + .3*sin(f.x*.7+vF));
      // gold slab edge
      float yl = fract(vW.y / ${FLOOR_H.toFixed(1)});
      col += vec3(1.,.78,.45) * smoothstep(.05,.0,yl) * 1.1;
      if (n.y > .5) col = vec3(.12,.1,.09);
      float d = distance(vW, cameraPosition);
      vec3 haze = mix(vec3(.30,.20,.21), vec3(.09,.09,.14), uDusk);
      col = mix(col, haze, clamp(1.-exp(-pow(d*.0007,1.4)),0.,1.));
      gl_FragColor = vec4(col,1.);
    }`
});
const slabGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
const tower = new THREE.InstancedMesh(slabGeo, towerMat, FLOORS);
slabGeo.setAttribute('aFloor', new THREE.InstancedBufferAttribute(new Float32Array([...Array(FLOORS).keys()]), 1));
tower.position.copy(TOWER_POS);
scene.add(tower);
// slender gold crown edges
const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(TW + 1.2, FLOORS * FLOOR_H, TW + 1.2).translate(0, FLOORS * FLOOR_H / 2, 0));
const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(2.2, 1.6, 0.9), transparent: true, opacity: 0 });
const towerEdges = new THREE.LineSegments(edgeGeo, edgeMat);
towerEdges.position.copy(TOWER_POS);
scene.add(towerEdges);

function setTowerBuild(b) {
  for (let i = 0; i < FLOORS; i++) {
    const t = easeOut(clamp(b * (FLOORS + 8) / 1 - i, 0, 1) );
    // taper toward the crown
    const taper = 1 - Math.pow(i / FLOORS, 3) * .28;
    dummy.position.set(0, i * FLOOR_H + (1 - t) * 26, 0);
    dummy.rotation.y = (1 - t) * .6;
    dummy.scale.set(TW * taper * (0.6 + .4 * t), FLOOR_H * .985 * t + 0.0001, TW * taper * (0.6 + .4 * t));
    dummy.updateMatrix();
    tower.setMatrixAt(i, dummy.matrix);
  }
  tower.instanceMatrix.needsUpdate = true;
  edgeMat.opacity = clamp((b - .85) * 6) * .9;
}

/* ---------- avenue: street lamps + traffic light streaks ---------- */
function makePoints(count, fill, size, opts = {}) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), c = new Float32Array(count * 3), s = new Float32Array(count);
  fill(p, c, s);
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.setAttribute('aRnd', new THREE.BufferAttribute(s, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...U, uSize: { value: size * DPR }, uMove: { value: opts.move || 0 } },
    vertexShader: `
      attribute vec3 color; attribute float aRnd; varying vec3 vC; varying float vA;
      uniform float uSize; uniform float uTime; uniform float uMove; uniform float uLights;
      void main(){
        vec3 p = position;
        if (uMove > 0.) {             // traffic: loop along z
          float dir = aRnd > .5 ? 1. : -1.;
          p.z = mod(p.z + dir*uTime*uMove*(.6+aRnd*.6) + 1200., 2100.) - 1200.;
        }
        if (uMove < 0.) {             // dust: slow drift
          p += vec3(sin(uTime*.2+aRnd*30.)*6., sin(uTime*.15+aRnd*12.)*4., cos(uTime*.18+aRnd*20.)*6.);
        }
        vec4 mv = modelViewMatrix*vec4(p,1.);
        gl_PointSize = uSize * (300. / -mv.z);
        vC = color; vA = uMove < 0. ? .55 : mix(.35, 1., uLights);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d); a*=a; gl_FragColor = vec4(vC*a*vA, a*vA); }`
  });
  return new THREE.Points(g, m);
}
const lamps = makePoints(220, (p, c) => {
  for (let i = 0; i < 220; i++) {
    const side = i % 2 ? 1 : -1;
    p.set([side * 17, 7, -1100 + Math.floor(i / 2) * 18], i * 3);
    c.set([1.0, .7, .4], i * 3);
  }
}, 3.2);
scene.add(lamps);
const traffic = makePoints(isMobile ? 260 : 420, (p, c, s) => {
  for (let i = 0; i < s.length; i++) {
    const r = Math.random(), lane = r > .5 ? 1 : -1;
    s[i] = r;
    p.set([lane * (4 + Math.random() * 6), 1.2, -1200 + Math.random() * 2100], i * 3);
    const col = r > .5 ? [1.3, .12, .08] : [1.2, 1.05, .9];
    c.set(col, i * 3);
  }
}, 1.6, { move: 38 });
scene.add(traffic);
const dust = makePoints(isMobile ? 500 : 900, (p, c, s) => {
  for (let i = 0; i < s.length; i++) {
    s[i] = Math.random();
    p.set([(Math.random() - .5) * 500, 5 + Math.random() * 260, -500 + Math.random() * 900], i * 3);
    const w = .5 + Math.random() * .5;
    c.set([w, w * .8, w * .6], i * 3);
  }
}, 1.1, { move: -1 });
scene.add(dust);

/* ------------------------------------------------------------------ */
/* Post-processing: bloom + speed blur + tilt DOF + vignette           */
/* ------------------------------------------------------------------ */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(DPR);
composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .5, .45, .55);
composer.addPass(bloom);
const lens = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uSpeed: { value: 0 }, uDof: { value: 0 }, uFocusY: { value: .5 },
    uRes: { value: new THREE.Vector2(innerWidth, innerHeight) }, uTime: { value: 0 }
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uSpeed; uniform float uDof; uniform float uFocusY; uniform vec2 uRes; uniform float uTime;
    varying vec2 vUv;
    void main(){
      vec2 c = vec2(.5,.48);
      vec2 dir = vUv - c;
      float r = length(dir);
      // radial speed blur: stronger toward the edges (relative motion is larger there)
      float sb = uSpeed * smoothstep(.05,.6,r);
      // tilt-shift depth of field around a focus band
      float db = uDof * smoothstep(.12,.55,abs(vUv.y-uFocusY));
      vec3 acc = vec3(0.); float wsum = 0.;
      for (int i = 0; i < 12; i++){
        float t = float(i)/11.;
        float a = t*6.2831*2.618;
        vec2 o = -dir * sb * t * .09 + vec2(cos(a),sin(a)) * db * t * 9. / uRes;
        float w = 1. - t*.5;
        acc += texture2D(tDiffuse, vUv + o).rgb * w; wsum += w;
      }
      vec3 col = acc/wsum;
      // subtle chromatic split with speed
      float ca = sb*.004 + .0006;
      col.r = mix(col.r, texture2D(tDiffuse, vUv + dir*ca).r, .5);
      col.b = mix(col.b, texture2D(tDiffuse, vUv - dir*ca).b, .5);
      // vignette
      col *= mix(1., .55, smoothstep(.35, .95, r*1.25));
      gl_FragColor = vec4(col,1.);
    }`
});
composer.addPass(lens);
composer.addPass(new OutputPass());

/* ------------------------------------------------------------------ */
/* Camera path: keyframes evenly spaced in scroll progress             */
/* ------------------------------------------------------------------ */
const T = TOWER_POS;
const camKeys = [
  [0, 520, 900],          // 0.000 high in the haze
  [60, 300, 520],         // 0.083 crane down
  [0, 110, 300],          // 0.167 tower complete in frame
  [-4, 24, 230],          // 0.250 drop into the avenue
  [5, 16, 120],           // 0.333 flying down the avenue
  [-3, 20, 10],           // 0.417 approaching tower
  [70, 70, -95],          // 0.500 swing right around tower
  [60, 130, -230],        // 0.583 behind / above
  [-75, 110, -190],       // 0.667 completing the orbit
  [-160, 150, 60],        // 0.750 pull out above the city (objects: readable drift)
  [-120, 170, 200],       // 0.833 slow drift
  [0, 210, 420],          // 0.917 rising
  [0, 260, 520],          // 1.000 final panorama to sunset
].map(a => new THREE.Vector3(...a));
const lookKeys = [
  [0, 40, -150],
  [0, 80, -150],
  [0, 120, -150],
  [0, 40, -150],
  [0, 30, -150],
  [0, 110, -150],
  [0, 140, -150],
  [0, 150, -150],
  [0, 110, -150],
  [0, 90, -200],
  [0, 70, -400],
  [-120, 120, -1400],
  [-200, 140, -2400],
].map(a => new THREE.Vector3(...a));
const camCurve = new THREE.CatmullRomCurve3(camKeys, false, 'catmullrom', .35);
const lookCurve = new THREE.CatmullRomCurve3(lookKeys, false, 'catmullrom', .35);

/* ------------------------------------------------------------------ */
/* Scroll + section progress                                           */
/* ------------------------------------------------------------------ */
const sections = $$('[data-scene]');
const secMap = Object.fromEntries(sections.map(s => [s.id, s]));
let target = 0, prog = 0, vel = 0, lastProg = 0;
let pointer = { x: 0, y: 0, sx: 0, sy: 0 };
function docProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? scrollY / max : 0;
}
function local(el) {   // 0 when section top hits viewport top, 1 when its bottom hits viewport bottom
  const r = el.getBoundingClientRect();
  const span = r.height - innerHeight;
  return span > 0 ? clamp(-r.top / span) : clamp(1 - r.top / innerHeight);
}
function enter(el) {   // 0 when top enters bottom of viewport, 1 when top reaches viewport top
  const r = el.getBoundingClientRect();
  return clamp(1 - r.top / innerHeight);
}
addEventListener('pointermove', e => { pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

/* ------------------------------------------------------------------ */
/* DOM motion                                                          */
/* ------------------------------------------------------------------ */
const heroInner = $('.hero-inner');
const wmSub = $('.wm-sub');
const heroLine = $('.hero-line');
const terms = $$('.term');
const steps = $$('.term-steps i');
const rows = $$('.row');
const cards = $$('.card');
const rail = $('.rail');
const railItems = $$('.rail li');
const counters = $$('[data-count]');
const facts = $('.facts'), ctaRow = $('.cta-row'), contactLogo = $('.contact-logo'), foot = $('.foot');
let currentChapter = -1;

function updateDOM(dt, t) {
  const sp = Math.min(1, Math.abs(vel) * 4);

  /* hero: letters gather from wide tracking + depth blur, then leave upward */
  const hIn = loaded ? clamp((performance.now() - loadedAt) / 2200) : 0;
  const hp = local(secMap.hero);
  wmChars.forEach((c, i) => {
    const n = wmChars.length, mid = (n - 1) / 2, off = i - mid;
    const a = easeOut(clamp(hIn * 1.4 - Math.abs(off) * .08));
    const out = easeInOut(range(hp, .45, 1));
    const spread = (1 - a) * off * 46 + out * off * 60;
    const z = (1 - a) * 240 + out * (i % 2 ? 1 : -1) * 120;
    c.style.transform = `translate3d(${spread}px, ${(1 - a) * 30 - out * 80 * (1 + Math.abs(off) * .3)}px, 0) scale(${1 - out * .1}) rotate(${(1 - a) * off * 2}deg)`;
    c.style.opacity = a * (1 - out);
    c.style.filter = `blur(${((1 - a) * 14 + out * 10 + sp * 2).toFixed(1)}px)`;
    void z;
  });
  wmSub.style.setProperty('--sub-track', (1.2 - easeOut(clamp(hIn * 1.2 - .3)) * .55 + range(hp, .5, 1) * .8).toFixed(3) + 'em');
  wmSub.style.opacity = clamp(hIn * 2 - .6) * (1 - range(hp, .45, .8));
  heroLine.style.opacity = clamp(hIn * 2 - 1) * (1 - range(hp, .35, .7));
  heroLine.style.transform = `translateY(${(1 - easeOut(clamp(hIn * 2 - 1))) * 20 - range(hp, .35, .9) * 60}px)`;
  heroInner.style.transform = `translate3d(${pointer.sx * -10}px, ${pointer.sy * -6 - hp * 40}px, 0)`;

  /* terms: three chapters with counter + depth transitions */
  const tp = local(secMap.terms);
  const tPos = tp * 3;            // 0..3
  terms.forEach((el, i) => {
    const d = tPos - i - .5;      // centered at 0 while active
    const vis = 1 - smooth(clamp(Math.abs(d) * 2.2 - .3));
    const dir = d < 0 ? 1 : -1;
    const k = clamp(Math.abs(d) * 2.2 - .3);
    el.style.opacity = vis;
    el.style.transform = `translate3d(0, ${dir * k * 18}vh, 0) scale(${1 + (d > 0 ? k * .25 : -k * .35)}) rotateX(${dir * k * 18}deg)`;
    el.style.filter = `blur(${(k * 16 + sp * 3).toFixed(1)}px)`;
    const counter = counters[i];
    const cv = easeOut(clamp((tPos - i) * 1.6));
    const val = +counter.dataset.count * cv;
    counter.textContent = counter.dataset.dec === '1' ? val.toFixed(1) : Math.round(val);
    steps[i].style.setProperty('--f', clamp(tPos - i).toFixed(3));
  });

  /* directions: opposing rows, skew from scroll velocity, active row */
  const dp = local(secMap.directions);
  const dEnter = enter(secMap.directions);
  rows.forEach((row, i) => {
    const dir = +row.dataset.dir;
    const x = (dp - .5) * dir * 38 + (1 - dEnter) * dir * 30 - 33;
    row.style.transform = `translate3d(${x}%,0,0) skewX(${(-vel * 260 * dir).toFixed(2)}deg)`;
    const active = Math.min(4, Math.floor(dp * 5));
    row.classList.toggle('on', i === active && dp > 0 && dp < 1);
  });

  /* objects: heading letters + cards fly from depth */
  const oEnter = enter(secMap.objects);
  h2Chars.forEach((c, i) => {
    const a = easeOut(clamp(oEnter * 2.2 - .5 - i * .03));
    c.style.transform = `translate3d(0, ${(1 - a) * 60}px, 0) rotateX(${(1 - a) * -70}deg)`;
    c.style.opacity = a;
    c.style.filter = `blur(${((1 - a) * 8).toFixed(1)}px)`;
  });
  cards.forEach((card, i) => {
    const r = card.getBoundingClientRect();
    const e = clamp(1 - (r.top - innerHeight * .15) / (innerHeight * .85));
    const a = easeOut(e);
    const tilt = card._tilt || { x: 0, y: 0 };
    const side = i % 2 ? 1 : -1;
    card.style.transform = `perspective(1400px) translate3d(${(1 - a) * side * 60}px, ${(1 - a) * 160}px, ${(1 - a) * -500}px) rotateX(${(1 - a) * 22 + tilt.y}deg) rotateY(${(1 - a) * side * -14 + tilt.x}deg)`;
    card.style.opacity = clamp(a * 1.4);
    card.style.filter = a < .999 ? `blur(${((1 - a) * 12).toFixed(1)}px)` : 'none';
    const img = card.querySelector('img');
    if (img) img.style.setProperty('--py', ((r.top + r.height / 2 - innerHeight / 2) * -.06).toFixed(1) + 'px');
  });

  /* contact: digits build, then buttons */
  const cEnter = enter(secMap.contact), cp = local(secMap.contact);
  const cA = clamp(cEnter * 1.3 - .25 + cp);
  contactLogo.style.opacity = easeOut(clamp(cA * 2));
  contactLogo.style.transform = `translateY(${(1 - easeOut(clamp(cA * 2))) * 40}px) rotate(${(1 - easeOut(clamp(cA * 2))) * -40}deg)`;
  phoneChars.forEach((c, i) => {
    const a = easeOut(clamp(cA * 2.4 - .4 - i * .045));
    c.style.transform = `translate3d(0, ${(1 - a) * .7}em, 0) rotateX(${(1 - a) * 90}deg)`;
    c.style.opacity = a;
  });
  const fA = easeOut(clamp(cA * 2.2 - 1.1));
  facts.style.opacity = fA; facts.style.transform = `translateY(${(1 - fA) * 24}px)`;
  const bA = easeOut(clamp(cA * 2.2 - 1.3));
  ctaRow.style.opacity = bA; ctaRow.style.transform = `translateY(${(1 - bA) * 30}px)`;
  foot.style.opacity = bA;

  /* rail */
  rail.style.setProperty('--prog', prog.toFixed(4));
  let ch = 0;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .5) ch = i; });
  railItems.forEach((li, i) => li.classList.toggle('on', i === ch));
  if (ch !== currentChapter) { if (currentChapter !== -1) audio.accent(ch); currentChapter = ch; }
}

/* card pointer tilt */
cards.forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card._tilt = { x: ((e.clientX - r.left) / r.width - .5) * 10, y: -((e.clientY - r.top) / r.height - .5) * 10 };
  });
  card.addEventListener('pointerenter', () => audio.tick());
  card.addEventListener('pointerleave', () => { card._tilt = { x: 0, y: 0 }; });
});

/* ------------------------------------------------------------------ */
/* Sound: generative pad + chapter accents + speed whoosh (WebAudio)   */
/* ------------------------------------------------------------------ */
const audio = (() => {
  let ctx, master, padBus, filter, noiseGain, noiseFilter, verb, on = false;
  let voices = [];
  const chords = [            // Am9, Fmaj7(#11), Cmaj9, G6/B, Am(add9) — one per chapter
    [57, 64, 67, 71, 72],
    [53, 60, 64, 69, 71],
    [48, 55, 59, 62, 64],
    [47, 55, 59, 62, 64],
    [45, 57, 60, 64, 71],
  ];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function impulse(sec = 3.2) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return b;
  }
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    verb = ctx.createConvolver(); verb.buffer = impulse();
    const verbGain = ctx.createGain(); verbGain.gain.value = .55;
    verb.connect(verbGain).connect(master);
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900; filter.Q.value = .6;
    padBus = ctx.createGain(); padBus.gain.value = .16;
    padBus.connect(filter); filter.connect(master); filter.connect(verb);
    // slow filter LFO
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .07; lfoG.gain.value = 260;
    lfo.connect(lfoG).connect(filter.frequency); lfo.start();
    // noise bed for whoosh
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(); ns.buffer = nb; ns.loop = true;
    noiseFilter = ctx.createBiquadFilter(); noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 600; noiseFilter.Q.value = .8;
    noiseGain = ctx.createGain(); noiseGain.gain.value = 0;
    ns.connect(noiseFilter).connect(noiseGain); noiseGain.connect(master); noiseGain.connect(verb); ns.start();
    setChord(Math.max(0, currentChapter));
    // slow arpeggio "piano" keeps the pad alive
    let step = 0;
    setInterval(() => { if (!on) return; const c = chords[Math.max(0, currentChapter)]; if (Math.random() < .7) bell(mtof(c[(step * 3) % c.length] + 12), .05, 2.6); step++; }, 1350);
  }
  function setChord(i) {
    const now = ctx.currentTime;
    voices.forEach(v => { v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(0, now, .9); v.o.forEach(o => o.stop(now + 5)); });
    voices = chords[i % chords.length].map((m, k) => {
      const g = ctx.createGain(); g.gain.value = 0; g.connect(padBus);
      const o = [-6, 6].map(det => { const osc = ctx.createOscillator(); osc.type = k === 0 ? 'triangle' : 'sawtooth'; osc.frequency.value = mtof(m); osc.detune.value = det + (Math.random() - .5) * 4; osc.connect(g); osc.start(); return osc; });
      g.gain.setTargetAtTime(k === 0 ? .5 : .16, now + .05, 1.2);
      return { g, o };
    });
  }
  function bell(f, vol = .12, dec = 3.5) {
    const now = ctx.currentTime;
    [1, 2.01, 3.98].forEach((h, k) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * h;
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol / (k * 2 + 1), now + .008);
      g.gain.exponentialRampToValueAtTime(.0001, now + dec / (k + 1));
      o.connect(g); g.connect(master); g.connect(verb); o.start(now); o.stop(now + dec + .1);
    });
  }
  return {
    async toggle() {
      if (!ctx) init();
      on = !on;
      if (ctx.state === 'suspended') await ctx.resume();
      master.gain.setTargetAtTime(on ? .9 : 0, ctx.currentTime, on ? .6 : .25);
      if (on) bell(mtof(chords[Math.max(0, currentChapter)][4] + 12), .1);
      return on;
    },
    accent(i) {
      if (!on) return;
      setChord(i);
      const c = chords[i % chords.length];
      bell(mtof(c[0] + 24), .11, 4); setTimeout(() => on && bell(mtof(c[2] + 24), .07, 3.5), 140);
    },
    tick() { if (on) bell(1760, .025, .4); },
    update(speed, dusk) {
      if (!on) return;
      const t = ctx.currentTime;
      noiseGain.gain.setTargetAtTime(Math.min(.22, speed * .5), t, .08);
      noiseFilter.frequency.setTargetAtTime(400 + speed * 2600, t, .1);
      filter.frequency.setTargetAtTime(700 + speed * 1800 + (1 - dusk) * 300, t, .3);
    }
  };
})();
const soundBtn = $('#sound');
soundBtn.addEventListener('click', async () => { const on = await audio.toggle(); soundBtn.setAttribute('aria-pressed', on); });

/* ------------------------------------------------------------------ */
/* Loop                                                                */
/* ------------------------------------------------------------------ */
let loaded = false, loadedAt = 0;
const clock = new THREE.Clock();
const camPos = new THREE.Vector3(), look = new THREE.Vector3(), lookSm = new THREE.Vector3();
let first = true, renderFrames = 0;

function frame() {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  const time = clock.elapsedTime;
  target = RENDER !== null ? +RENDER : docProgress();
  const k = RENDER !== null ? 1 : 1 - Math.exp(-dt * (reduced ? 20 : 3.2));   // inertia on the camera
  prog += (target - prog) * k;
  vel = lerp(vel, (prog - lastProg) / Math.max(dt, 1e-3) * .016, .2);
  lastProg = prog;
  pointer.sx = lerp(pointer.sx, pointer.x, .05);
  pointer.sy = lerp(pointer.sy, pointer.y, .05);

  // camera on path + idle breathing + pointer parallax
  const u = clamp(prog);
  camCurve.getPoint(u, camPos);
  lookCurve.getPoint(u, look);
  const breathe = reduced ? 0 : 1;
  camPos.x += Math.sin(time * .21) * 3 * breathe + pointer.sx * 6;
  camPos.y += Math.sin(time * .17) * 2 * breathe - pointer.sy * 4;
  if (first) { lookSm.copy(look); first = false; }
  lookSm.lerp(look, 1 - Math.exp(-dt * 6));
  camera.position.copy(camPos);
  camera.lookAt(lookSm);
  // banking roll proportional to lateral motion
  camera.rotateZ(clamp(-vel * 6, -.08, .08) + Math.sin(time * .13) * .006);

  // world state
  const intro = loaded ? clamp((performance.now() - loadedAt) / 3000) : 0;
  const build = clamp(range(prog, 0, .16) * .85 + intro * .25);
  setTowerBuild(easeInOut(clamp(build)));
  U.uTime.value = time;
  U.uLights.value = lerp(.35, 1, smooth(range(prog, .17, .45)));
  U.uDusk.value = smooth(range(prog, .2, .95)) * .85;

  // optics
  const speed = clamp(Math.abs(vel) * 9);
  lens.uniforms.uSpeed.value = reduced ? 0 : lerp(lens.uniforms.uSpeed.value, speed, .15);
  const dofObjects = range(prog, .62, .7) * (1 - range(prog, .84, .9));
  const dofDirections = range(prog, .45, .5) * (1 - range(prog, .6, .64));
  lens.uniforms.uDof.value = reduced ? 0 : (dofObjects * 1.0 + dofDirections * .7 + (1 - intro) * .8) * (isMobile ? 1.6 : 2.6);
  lens.uniforms.uTime.value = time;
  if (RENDER !== null) { lens.uniforms.uSpeed.value = 0; lens.uniforms.uDof.value = 0; }
  bloom.strength = .38 + U.uLights.value * .3;

  updateDOM(dt, time);
  audio.update(speed, U.uDusk.value);
  composer.render();
  if (RENDER !== null && ++renderFrames > 12) { document.title = 'rendered'; return; }
  requestAnimationFrame(frame);
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = innerWidth < 760 ? 62 : 48;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  lens.uniforms.uRes.value.set(innerWidth, innerHeight);
}
addEventListener('resize', resize);

/* loader */
const loader = $('#loader');
const lbar = $('.loader-bar');
let lp = 0;
const ltimer = setInterval(() => { lp = Math.min(.9, lp + .12); lbar.style.setProperty('--lp', lp); }, 120);
Promise.all([document.fonts.ready, new Promise(r => setTimeout(r, 700))]).then(() => {
  clearInterval(ltimer); lbar.style.setProperty('--lp', 1);
  setTimeout(() => { document.body.classList.add('ready'); loaded = true; loadedAt = performance.now(); }, 350);
});
setTowerBuild(0);
requestAnimationFrame(frame);
