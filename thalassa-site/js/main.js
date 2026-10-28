import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DICT, FLOORS } from './i18n.js';

/* ---------------- helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const range = (p, a, b) => clamp((p - a) / (b - a));
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eo = t => 1 - Math.pow(1 - t, 3);
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(pointer:fine)').matches && !CAPTURE;
let VW = innerWidth, VH = innerHeight;
const MOBILE = () => VW < 760;
if (RM) document.documentElement.classList.add('rm');
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
};

/* ---------------- i18n ---------------- */
let lang = params.get('lang') || store.get('th-lang') || ({ ru: 'ru', en: 'en', ka: 'ka' })[(navigator.language || '').slice(0, 2)] || 'ka';
if (!DICT[lang]) lang = 'ka';
const t = k => DICT[lang][k] ?? DICT.en[k] ?? k;

const word = $('#word');
'THALASSA'.split('').forEach((ch, i) => {
  const s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); word.appendChild(s);
});

let revealLines = [];
function buildRevealTitle() {
  const h = $('#revealTitle'); h.innerHTML = '';
  revealLines = t('reveal.title').split(' ').map(w => {
    const ln = document.createElement('span'); ln.className = 'ln'; ln.style.display = 'inline-block'; ln.style.marginRight = '.24em';
    const s = document.createElement('span'); s.textContent = w; ln.appendChild(s); h.appendChild(ln); return s;
  });
}
let mWords = [];
function buildManifesto() {
  const m = $('#manifesto'); m.innerHTML = '';
  const acc = /\d|мор|sea|ზღვ|зел|green|მწვანე|сад|garden|ბაღ|гор|mountain|მთ|премиум|premium|პრემიუმ/i;
  mWords = t('about.text').split(' ').map(w => {
    const s = document.createElement('span'); s.textContent = w + ' '; if (acc.test(w)) s.className = 'acc'; m.appendChild(s); return s;
  });
  lastLit = -1;
}
function applyLang(l) {
  lang = l; store.set('th-lang', l); document.documentElement.lang = l;
  $$('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  $$('.langs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  $('#orbText').textContent = (t('vr.btn') + ' · ').repeat(3);
  buildRevealTitle(); buildManifesto(); renderFloorList(); renderPanel(true);
  if ($('#planModal').classList.contains('open')) renderPlan();
  heroCopy(lastCopyP, true);
  requestAnimationFrame(layout);
}
$$('.langs button').forEach(b => b.addEventListener('click', () => { applyLang(b.dataset.lang); blip(990); }));

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (!RM && !CAPTURE && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
  lenis.stop();
}
function go(target, offset = 0) {
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + offset;
  if (lenis) lenis.scrollTo(y, { duration: 1.8 });
  else scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const el = $(a.getAttribute('href')); if (!el) return;
  e.preventDefault(); closeAll();
  const id = a.getAttribute('href');
  if (id === '#hero') go(0);
  else if (id === '#gallery' || id === '#day') go(G[id === '#day' ? 'day' : 'ring'].top);
  else go(el);
}));

/* ---------------- sections geometry ---------------- */
const S = {
  hero: $('#hero'), sea: $('#sea'), day: $('#day'), ring: $('#gallery'), strip: $('#progress'), choose: $('#choose'), vr: $('#vr'), contact: $('#contact')
};
// Document-space geometry, measured in layout() so frame() never forces a reflow.
const G = {};
function measure() {
  for (const k in S) G[k] = { top: S[k].getBoundingClientRect().top + scrollY, h: S[k].offsetHeight };
  const box = el => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; };
  G.man = box($('#manifesto')); G.foot = box($('.foot'));
}
function trackP(k) {
  const g = G[k], h = g.h - VH;
  return h > 0 ? clamp((scrollY - g.top) / h) : (scrollY > g.top ? 1 : 0);
}

/* =========================================================
   OCEAN — Gerstner waves, dawn sky (hero)
   ========================================================= */
function createOcean(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 4000);
  const U = {
    uTime: { value: 0 }, uCam: { value: new THREE.Vector3() },
    uSun: { value: new THREE.Vector3(0.42, 0.075, -1).normalize() },
    uDeep: { value: new THREE.Color(0.02, 0.13, 0.19) }, uShallow: { value: new THREE.Color(0.16, 0.52, 0.68) },
    uHorizon: { value: new THREE.Color(0.99, 0.86, 0.72) }, uZenith: { value: new THREE.Color(0.33, 0.58, 0.77) },
    uSunCol: { value: new THREE.Color(1.0, 0.84, 0.6) }
  };
  const SKY = `
    uniform vec3 uSun,uHorizon,uZenith,uSunCol;
    vec3 sky(vec3 r){
      float y=max(r.y,0.0);
      vec3 c=mix(uHorizon,uZenith,pow(y,0.42));
      float s=max(dot(normalize(r),uSun),0.0);
      c+=uSunCol*(pow(s,900.0)*7.0+pow(s,60.0)*0.45+pow(s,6.0)*0.18);
      return c;
    }`;
  const seg = MOBILE() ? 150 : 260;
  const geo = new THREE.PlaneGeometry(700, 700, seg, seg); geo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `
      uniform float uTime; varying vec3 vW; varying vec3 vN; varying float vH;
      vec3 g(vec4 w, vec3 p, inout vec3 t, inout vec3 b){
        float k=6.28318/w.w; float c=sqrt(9.8/k); vec2 d=normalize(w.xy);
        float f=k*(dot(d,p.xz)-c*uTime); float a=w.z/k;
        t+=vec3(-d.x*d.x*(w.z*sin(f)), d.x*(w.z*cos(f)), -d.x*d.y*(w.z*sin(f)));
        b+=vec3(-d.x*d.y*(w.z*sin(f)), d.y*(w.z*cos(f)), -d.y*d.y*(w.z*sin(f)));
        return vec3(d.x*(a*cos(f)), a*sin(f), d.y*(a*cos(f)));
      }
      void main(){
        vec3 p=(modelMatrix*vec4(position,1.0)).xyz; vec3 q=p; vec3 t=vec3(1,0,0), b=vec3(0,0,1);
        q+=g(vec4(0.2,1.0,0.17,34.0),p,t,b);
        q+=g(vec4(0.7,0.8,0.14,19.0),p,t,b);
        q+=g(vec4(-0.5,0.9,0.12,11.0),p,t,b);
        q+=g(vec4(0.9,0.4,0.08,6.0),p,t,b);
        q+=g(vec4(-0.2,1.0,0.05,3.2),p,t,b);
        vN=normalize(cross(b,t)); vW=q; vH=q.y;
        gl_Position=projectionMatrix*viewMatrix*vec4(q,1.0);
      }`,
    fragmentShader: `
      uniform vec3 uCam,uDeep,uShallow; uniform float uTime; varying vec3 vW; varying vec3 vN; varying float vH;
      ${SKY}
      void main(){
        vec2 q=vW.xz*0.9+vec2(uTime*0.6,uTime*0.35);
        vec3 n=normalize(vN+vec3(sin(q.x*2.3+q.y*1.1)*0.05+sin(q.y*4.1-q.x*2.7+uTime)*0.03,0.0,cos(q.y*2.1-q.x*1.6)*0.05+cos(q.x*3.7+uTime*1.3)*0.03));
        vec3 v=normalize(uCam-vW);
        float fr=0.02+0.98*pow(1.0-max(dot(n,v),0.0),5.0);
        vec3 r=reflect(-v,n); r.y=abs(r.y);
        vec3 water=mix(uDeep,uShallow,clamp(vH*0.35+0.3,0.0,1.0)*0.75);
        float sss=pow(max(dot(v,-uSun),0.0),3.0)*clamp(vH*0.6+0.3,0.0,1.0);
        water+=uShallow*sss*0.35;
        vec3 col=mix(water,sky(r),clamp(fr,0.0,1.0));
        float foam=smoothstep(0.75,1.25,vH);
        col=mix(col,vec3(0.93,0.95,0.95),foam*0.45);
        float d=length(vW.xz-uCam.xz);
        float fog=1.0-exp(-d*0.0042);
        vec3 hz=sky(normalize(vec3(vW.x-uCam.x,0.015,vW.z-uCam.z)));
        col=mix(col,hz,clamp(fog,0.0,1.0));
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const water = new THREE.Mesh(geo, waterMat); scene.add(water);
  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vW; void main(){ vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.0);} `,
    fragmentShader: `uniform vec3 uCam; varying vec3 vW; ${SKY}
      void main(){ vec3 d=normalize(vW-uCam); vec3 c=sky(d);
        float cl=smoothstep(0.55,0.95,sin(d.x*9.0+d.y*30.0)*0.5+0.5)*smoothstep(0.03,0.12,d.y)*smoothstep(0.35,0.12,d.y);
        c=mix(c,vec3(1.0,0.93,0.86),cl*0.18);
        gl_FragColor=vec4(c,1.0);} `
  }));
  scene.add(skyMesh);
  const step = 700 / seg;
  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE() ? 1.25 : 1.5));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    cam.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight); cam.updateProjectionMatrix();
  }
  const look = new THREE.Vector3();
  function render(time, p, mx, my) {
    const k = ease(clamp(p * 1.35));
    cam.position.set(Math.sin(time * 0.13) * 2.2 + mx * 2.5, lerp(3.4, 30, k) + Math.sin(time * 0.55) * 0.22 - my * 0.6, 60 - time * 2.6);
    look.set(cam.position.x * 0.4 + mx * 9, lerp(9.5, -70, k), cam.position.z - 120);
    cam.lookAt(look); cam.rotateZ(Math.sin(time * 0.31) * 0.012 - mx * 0.015);
    water.position.set(Math.round(cam.position.x / step) * step, 0, Math.round(cam.position.z / step) * step);
    skyMesh.position.copy(cam.position);
    U.uTime.value = time; U.uCam.value.copy(cam.position);
    renderer.render(scene, cam);
  }
  let lost = false;
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; resize(); });
  resize();
  return { render(...a) { if (!lost) render(...a); }, resize };
}

/* =========================================================
   BUILDING — interactive 3D maquette for floor selection
   ========================================================= */
function createBuilding(host, cb) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdde5e2, 170, 430);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 1200);
  camera.position.set(95, 30, 120);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableZoom: false, enablePan: false, enableDamping: true, dampingFactor: 0.07, rotateSpeed: 0.55, minPolarAngle: 0.95, maxPolarAngle: 1.42, autoRotate: !RM, autoRotateSpeed: 0.5 });
  controls.target.set(0, 11, 4);
  renderer.domElement.style.touchAction = 'pan-y'; // let vertical swipes scroll the page
  let idleT = null;
  controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(idleT); });
  controls.addEventListener('end', () => { clearTimeout(idleT); idleT = setTimeout(() => { controls.autoRotate = !RM; }, 6000); });

  scene.add(new THREE.HemisphereLight(0xe6f0f5, 0x5f6b4c, 1.05));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
  sun.position.set(55, 80, 60); sun.castShadow = true;
  sun.shadow.mapSize.set(MOBILE() ? 1024 : 2048, MOBILE() ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 260 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun);

  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
  const M = {
    white: std(0xf2efe8), wood: std(0x9a5c35, { roughness: 0.6 }), dark: std(0x2a3036, { roughness: 0.5 }),
    glass: std(0x2b4554, { roughness: 0.08, metalness: 0.65 }), rail: std(0xb7d8e6, { transparent: true, opacity: 0.38, roughness: 0.1 }),
    leaf: std(0x93ab83), leaf2: std(0x7a9670), trunk: std(0x6b5135), deck: std(0xd8c6a6), water: std(0x3db6da, { roughness: 0.06, metalness: 0.1, emissive: 0x0f5a78, emissiveIntensity: 0.55 }),
    umb: std(0xf6f1e8), sea: std(0x7fb3cb, { roughness: 0.3, metalness: 0.05 })
  };
  const box = (w, h, d, m, cast = true) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.castShadow = cast; b.receiveShadow = true; return b; };
  const L = 46, D = 13, FH = 3.3, CORE = L - 7;
  const levels = FLOORS.slice().reverse();
  const groups = [];
  const SEA = new THREE.Color(0x2e8cb7);
  levels.forEach((f, i) => {
    const g = new THREE.Group(); const y = i * FH;
    const gm = M.glass.clone(); gm.emissive = SEA.clone(); gm.emissiveIntensity = 0;
    const core = box(CORE, FH - 0.4, D - 2.4, gm); core.position.set(0, y + 0.35 + (FH - 0.4) / 2, 0); g.add(core);
    const slab = box(L, 0.35, D, M.white); slab.position.set(0, y + 0.175, 0); g.add(slab);
    const cy = core.position.y;
    if (i > 0) {
      for (const s of [1, -1]) {
        const bal = box(CORE, 0.28, 2.1, M.white); bal.position.set(0, y + 0.14, s * (D / 2 + 1.05)); g.add(bal);
        const rail = box(CORE, 1.05, 0.06, M.rail, false); rail.position.set(0, y + 0.82, s * (D / 2 + 2.05)); g.add(rail);
        for (let x = -CORE / 2 + 3.25; x < CORE / 2 - 1; x += 3.25) {
          const m = box(0.14, FH - 0.4, 0.14, M.dark); m.position.set(x, cy, s * ((D - 2.4) / 2 + 0.07)); g.add(m);
        }
      }
      for (const s of [1, -1]) {
        const tw = box(3.4, FH, D, M.wood); tw.position.set(s * (L / 2 - 1.7), y + FH / 2, 0); g.add(tw);
        const w1 = box(1.7, FH * 0.6, 0.2, M.dark, false); w1.position.set(s * (L / 2 - 1.7), y + FH * 0.56, D / 2 + 0.02); g.add(w1);
        const w2 = w1.clone(); w2.position.z = -D / 2 - 0.02; g.add(w2);
        const w3 = box(0.2, FH * 0.6, 3.6, M.dark, false); w3.position.set(s * (L / 2 + 0.02), y + FH * 0.56, -2.6); g.add(w3);
        const w4 = w3.clone(); w4.position.z = 2.6; g.add(w4);
      }
    } else {
      for (const s of [1, -1]) { const tw = box(3.4, FH, D, M.white); tw.position.set(s * (L / 2 - 1.7), y + FH / 2, 0); g.add(tw); }
      const pl = box(CORE, 0.8, 1.1, M.leaf); pl.position.set(0, y + 0.75, D / 2 + 0.1); g.add(pl);
      for (let x = -CORE / 2 + 2; x < CORE / 2; x += 2.6) {
        const v = box(0.5, FH - 0.6, 0.5, M.leaf2); v.position.set(x, cy + 0.2, D / 2 - 0.4); g.add(v);
      }
    }
    g.userData = { id: f.id, mat: gm, hit: core, z: 0, glow: 0 };
    scene.add(g); groups.push(g);
  });
  const topY = levels.length * FH;
  const roof = box(L, 0.5, D, M.white); roof.position.y = topY + 0.25; scene.add(roof);
  const canopy = box(L * 0.55, 0.22, D * 0.8, M.wood); canopy.position.set(4, topY + 3.4, 0); scene.add(canopy);
  for (const [x, z] of [[-8, -4], [-8, 4], [16, -4], [16, 4]]) { const p = box(0.2, 3, 0.2, M.dark); p.position.set(x, topY + 1.9, z); scene.add(p); }
  const pent = box(14, 2.8, D - 4, M.glass); pent.position.set(-12, topY + 1.9, 0); scene.add(pent);

  // terrain: hill rises behind the building, slope falls towards the sea in front
  const height = (x, z) => {
    let h = 0;
    if (z < -14) h += (-14 - z) * 0.34;
    if (z > 34) h -= (z - 34) * 0.2;
    const far = clamp((Math.abs(x) - 34) / 20) + clamp((-z - 16) / 12) + clamp((z - 34) / 20);
    h += (Math.sin(x * 0.055) * Math.cos(z * 0.07) * 2.4 + Math.sin(x * 0.13 + z * 0.09) * 0.8) * clamp(far);
    return h;
  };
  const tg = new THREE.PlaneGeometry(460, 460, 120, 120); tg.rotateX(-Math.PI / 2);
  const pos = tg.attributes.position; const cols = [];
  const c1 = new THREE.Color(0xdcd8c6), c2 = new THREE.Color(0xc9cfb6), c3 = new THREE.Color(0xeee6d6);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i); const h = height(x, z); pos.setY(i, h);
    const c = c1.clone().lerp(c2, clamp(Math.sin(x * 0.11) * Math.cos(z * 0.13) * 0.5 + 0.5));
    if (Math.abs(x) < 31 && z > -11 && z < 30) c.lerp(c3, 0.55);
    cols.push(c.r, c.g, c.b);
  }
  tg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); tg.computeVertexNormals();
  const ground = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
  const seaPlane = new THREE.Mesh(new THREE.PlaneGeometry(3000, 1400), M.sea); seaPlane.rotation.x = -Math.PI / 2; seaPlane.position.set(0, -24, 800); scene.add(seaPlane);

  // pool deck in front
  const deck = box(36, 0.3, 13, M.deck, false); deck.position.set(-3, 0.15, D / 2 + 9.5); scene.add(deck);
  const pool = box(21, 0.34, 6.5, M.water, false); pool.position.set(-6, 0.2, D / 2 + 10); scene.add(pool);
  for (let k = 0; k < 7; k++) { const sb = box(0.9, 0.25, 2.1, M.umb); sb.position.set(-14 + k * 3, 0.42, D / 2 + 15); scene.add(sb); }
  for (let k = 0; k < 4; k++) {
    const pole = box(0.08, 2.4, 0.08, M.dark); pole.position.set(-12.5 + k * 6, 1.5, D / 2 + 15.4); scene.add(pole);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.6, 12), M.umb); cone.position.set(-12.5 + k * 6, 2.8, D / 2 + 15.4); cone.castShadow = true; scene.add(cone);
  }

  // trees (instanced) + a few palms
  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  const treeN = MOBILE() ? 110 : 190;
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std(0xffffff), treeN);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.22, 1, 5), M.trunk, treeN);
  crowns.castShadow = trunks.castShadow = true; crowns.receiveShadow = true;
  const o = new THREE.Object3D(); let n = 0;
  while (n < treeN) {
    const x = (rnd() - 0.5) * 220, z = (rnd() - 0.5) * 170 - 10;
    if (Math.abs(x) < 33 && z > -14 && z < 32) continue;
    const h = height(x, z), s = 1.6 + rnd() * 2.6;
    o.position.set(x, h + s * 0.9, z); o.scale.set(s, s * (1.1 + rnd() * 0.5), s); o.rotation.set(rnd(), rnd() * 6, 0); o.updateMatrix(); crowns.setMatrixAt(n, o.matrix);
    o.position.set(x, h + s * 0.45, z); o.scale.set(1, s * 0.9, 1); o.rotation.set(0, 0, 0); o.updateMatrix(); trunks.setMatrixAt(n, o.matrix);
    if (rnd() > 0.55) crowns.setColorAt(n, new THREE.Color(0x86a07a)); else crowns.setColorAt(n, new THREE.Color(0xa9bd9a));
    n++;
  }
  scene.add(crowns, trunks);
  for (const [x, z, r] of [[-26, 18, 0.1], [-24, 24, -0.12], [20, 20, 0.08], [26, 26, -0.1], [12, 24, 0.12]]) {
    const pt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 7, 6), M.trunk); pt.position.set(x, 3.5, z); pt.rotation.z = r; pt.castShadow = true; scene.add(pt);
    const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), M.leaf2); cr.scale.set(2.8, 0.7, 2.8); cr.position.set(x + r * -6, 7.1, z); cr.castShadow = true; scene.add(cr);
  }

  // interaction
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
  const hits = groups.map(g => g.userData.hit);
  let hover = null, listHover = null, selected = null, down = null;
  const el = renderer.domElement;
  function pick(e) {
    const r = el.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const h = ray.intersectObjects(hits, false)[0];
    return h ? groups.find(g => g.userData.hit === h.object).userData.id : null;
  }
  el.addEventListener('pointermove', e => {
    const id = pick(e);
    if (id !== hover) { hover = id; if (id) blip(520 + FLOORS.findIndex(f => f.id === id) * -40, 0.012); }
    el.style.cursor = id ? 'pointer' : 'grab';
    cb.hover(id, e.clientX, e.clientY);
  });
  el.addEventListener('pointerleave', () => { hover = null; cb.hover(null); });
  el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  el.addEventListener('pointerup', e => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved < 7 && performance.now() - down.t < 500) { const id = pick(e); if (id) cb.select(id); }
    down = null;
  });

  let visible = false, intro = 0;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(host);
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
  }
  const v = new THREE.Vector3();
  function tick(dt, p) {
    if (!visible) return;
    intro = damp(intro, p, 5, dt);
    controls.update();
    const dist = lerp(MOBILE() ? 250 : 200, MOBILE() ? 165 : 112, ease(intro));
    v.copy(camera.position).sub(controls.target); v.setLength(dist); camera.position.copy(controls.target).add(v);
    const active = hover || listHover;
    groups.forEach(g => {
      const u = g.userData; const isA = u.id === active, isS = u.id === selected;
      u.z = damp(u.z, isA ? 3.2 : (isS ? 1.8 : 0), 9, dt);
      u.glow = damp(u.glow, isA ? 1.1 : (isS ? 0.75 : 0), 9, dt);
      g.position.z = u.z; u.mat.emissiveIntensity = u.glow;
    });
    renderer.render(scene, camera);
  }
  let lost = false;
  el.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; });
  el.addEventListener('webglcontextrestored', () => { lost = false; resize(); });
  resize();
  return {
    tick(dt, p) { if (!lost) tick(dt, p); }, resize,
    setHover(id) { listHover = id; },
    setSelected(id) { selected = id; }
  };
}

/* =========================================================
   UI: floors panel, modals, lightbox, form
   ========================================================= */
let sel = '6';
const floorById = id => FLOORS.find(f => f.id === id);
function legendHTML(f) {
  let h = `<span class="f"><i></i><b>${f.free.length}</b>&nbsp;${t('ch.free')}</span><span><i></i><b>${f.sold}</b>&nbsp;${t('ch.sold')}</span>`;
  if (f.reserved) h += `<span class="r"><i></i><b>${f.reserved}</b>&nbsp;${t('ch.res')}</span>`;
  if (f.storage) h += `<span class="f"><i></i><b>${f.storage}</b>&nbsp;${t('ch.storage')}</span>`;
  return h;
}
function chipsHTML(f) {
  return f.free.length ? f.free.map(n => `<button data-apt="${n}">№ ${n}</button>`).join('') : `<p>${t('ch.none')}</p>`;
}
function renderFloorList() {
  $('#floorList').innerHTML = FLOORS.map(f => `<button data-f="${f.id}" aria-pressed="${f.id === sel}" aria-label="${t('ch.floor')} ${f.id}">${f.id}${f.free.length ? `<small>${f.free.length}</small>` : ''}</button>`).join('');
  $$('#floorList button').forEach(b => {
    b.addEventListener('click', () => select(b.dataset.f));
    b.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; bld?.setHover(b.dataset.f); blip(700, 0.01); });
    b.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') bld?.setHover(null); });
    b.addEventListener('focus', () => bld?.setHover(b.dataset.f));
    b.addEventListener('blur', () => bld?.setHover(null));
  });
}
function renderPanel(silent) {
  const f = floorById(sel);
  const n = $('#fNum'); n.textContent = f.id;
  if (!silent) { n.classList.remove('swap'); void n.offsetWidth; n.classList.add('swap'); }
  const cells = [];
  for (let k = 0; k < f.total; k++) cells.push(`<i class="${k < f.free.length ? 'f' : (k < f.free.length + f.reserved ? 'r' : '')}" style="--k:${k}"></i>`);
  $('#cells').innerHTML = cells.join('');
  $('#legend').innerHTML = legendHTML(f);
  $('#chips').innerHTML = chipsHTML(f);
}
function select(id) {
  sel = id; renderPanel(); bld?.setSelected(id);
  $$('#floorList button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === id)));
  blip(880);
}
function renderPlan() {
  const f = floorById(sel);
  $('#planTitle').textContent = f.id; $('#planImg').src = f.plan; $('#planImg').alt = `${t('ch.floor')} ${f.id}`;
  $('#planLegend').innerHTML = legendHTML(f); $('#planChips').innerHTML = chipsHTML(f);
}
function requestApt(n) {
  const f = floorById(sel);
  $('#fMsg').value = `${t('ch.floor')} ${f.id}${n ? `, № ${n}` : ''}`;
  closeAll(); go(S.contact);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-apt]'); if (b) requestApt(b.dataset.apt);
});
$('#openPlan').addEventListener('click', () => { renderPlan(); openModal($('#planModal')); });
$('#planReq').addEventListener('click', e => { e.preventDefault(); requestApt(null); });

let lastFocus = null;
let vrT = 0;
const bgEls = () => [$('main'), $('#top'), ...$$('.modal')];
function openModal(m) {
  lastFocus = document.activeElement; m.classList.add('open');
  bgEls().forEach(el => { if (el !== m) el.inert = true; }); lenis?.stop(); document.body.style.overflow = 'hidden';
  setTimeout(() => m.querySelector('.x')?.focus(), 50);
}
function closeModal(m) {
  if (!m.classList.contains('open')) return;
  m.classList.remove('open'); lenis?.start(); document.body.style.overflow = '';
  bgEls().forEach(el => { el.inert = false; });
  if (m.id === 'vrModal') vrT = setTimeout(() => { $('#vrSlot').innerHTML = ''; }, 460);
  lastFocus?.focus?.({ preventScroll: true });
}
function closeAll() { $$('.modal.open').forEach(closeModal); }
$$('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAll();
  if ($('#lightbox').classList.contains('open')) { if (e.key === 'ArrowRight') lbStep(1); if (e.key === 'ArrowLeft') lbStep(-1); }
});
$('#openVr').addEventListener('click', () => {
  clearTimeout(vrT);
  $('#vrSlot').innerHTML = '<iframe title="Thalassa VR tour" allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen" allowfullscreen src="https://kuula.co/share/5yJ1X?logo=-1&info=0&fs=1&vr=0&sd=1&gyro=0&thumbs=1&keys=0"></iframe>';
  openModal($('#vrModal'));
});

let lbList = [], lbI = 0;
function lightbox(list, i) { lbList = list; lbI = i; $('#lbImg').src = list[i]; openModal($('#lightbox')); }
function lbStep(d) { lbI = (lbI + d + lbList.length) % lbList.length; const im = $('#lbImg'); im.style.opacity = 0; setTimeout(() => { im.src = lbList[lbI]; im.style.opacity = 1; }, 160); }
$('#lbImg').style.transition = 'opacity .16s';
$('#lbPrev').addEventListener('click', () => lbStep(-1));
$('#lbNext').addEventListener('click', () => lbStep(1));

$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#fName').value.trim(), phone = $('#fPhone').value.trim(), msg = $('#fMsg').value.trim();
  if (!name && !phone) { $('#fName').focus(); return; }
  const body = `${t('f.name')}: ${name}\n${t('f.phone')}: ${phone}\n\n${msg}`;
  location.href = `mailto:sales@thalassagroup.ge?subject=${encodeURIComponent('Thalassa — ' + t('f.send'))}&body=${encodeURIComponent(body)}`;
  $('#formOk').textContent = t('f.ok');
});

/* ---------------- galleries ---------------- */
const VISION = ['front-day', 'pool-day', 'hero', 'corner', 'facade-day', 'front-night', 'pool-night', 'facade-night'];
const ringEl = $('#ring');
const cards = VISION.map((n, i) => {
  const c = document.createElement('div'); c.className = 'card';
  c.innerHTML = `<img src="img/${n}-s.webp" alt="Thalassa render ${i + 1}" loading="lazy" draggable="false"><em>${String(i + 1).padStart(2, '0')}</em>`;
  c.tabIndex = 0; c.setAttribute('role', 'button'); c.setAttribute('aria-label', `Render ${i + 1}`);
  c.addEventListener('click', () => lightbox(VISION.map(v => `img/${v}.webp`), i));
  c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); } });
  ringEl.appendChild(c); return c;
});
const SHOTS = ['site-5', 'site-1', 'site-4', 'site-6', 'site-3', 'site-7', 'site-2'];
const stripEl = $('#strip');
const shots = SHOTS.map((n, i) => {
  const s = document.createElement('div'); s.className = 'shot' + (i % 2 ? ' tall' : '');
  s.innerHTML = `<img src="img/${n}-s.webp" alt="Construction site, drone photo ${i + 1}" loading="lazy" draggable="false"><em>DRONE · ${String(i + 1).padStart(2, '0')}</em>`;
  s.tabIndex = 0; s.setAttribute('role', 'button'); s.setAttribute('aria-label', `Drone photo ${i + 1}`);
  s.addEventListener('click', () => lightbox(SHOTS.map(v => `img/${v}.webp`), i));
  s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.click(); } });
  stripEl.appendChild(s); return { el: s, img: s.querySelector('img') };
});
const endCard = document.createElement('a'); endCard.className = 'strip-end'; endCard.href = '#vr';
endCard.innerHTML = `<span class="kicker" data-i18n="vr.kicker">3D tour</span><div class="h2" style="margin-top:14px">→ 360°</div>`;
endCard.addEventListener('click', e => { e.preventDefault(); go(S.vr); });
stripEl.appendChild(endCard);

/* ---------------- ocean + building instances ---------------- */
let ocean = null;
try { ocean = createOcean($('#ocean')); } catch (e) { ocean = null; }
let bld = null;
try { bld = createBuilding($('#bld'), {
  hover(id, x, y) {
    const tip = $('#bldTip');
    if (!id) { tip.classList.remove('on'); return; }
    const f = floorById(id); const r = $('#bld').getBoundingClientRect();
    tip.innerHTML = `<b>${t('ch.floor')} ${f.id}</b> · ${f.free.length} ${t('ch.free')}`;
    tip.style.transform = `translate(${Math.min(x - r.left + 18, r.width - 200)}px, ${y - r.top + 18}px)`;
    tip.classList.add('on');
  },
  select(id) { select(id); }
}); } catch (e) { bld = null; }

/* ---------------- layout ---------------- */
let dist = 0, ringR = 0, ringStep = 360 / VISION.length;
function layout() {
  VW = innerWidth; VH = innerHeight;
  ocean?.resize(); bld?.resize();
  $('#foam').setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  dist = Math.max(0, stripEl.scrollWidth - VW);
  S.strip.style.height = (dist + VH) + 'px';
  const cw = MOBILE() ? VW * 0.78 : Math.min(VW * 0.5, 680);
  ringR = (cw / 2) / Math.tan(Math.PI / VISION.length) + (MOBILE() ? 10 : 40);
  ringEl.style.setProperty('--cw', cw + 'px');
  cards.forEach((c, i) => { c.style.transform = `rotateY(${i * ringStep}deg) translateZ(${ringR}px)`; });
  shots.forEach(sh => { sh.c = sh.el.offsetLeft + sh.el.offsetWidth / 2; });
  measure();
}
let rzT = 0, lastW = innerWidth, lastH = innerHeight;
addEventListener('resize', () => {
  // phones fire resize while the URL bar collapses: ignore small height-only changes
  const touch = !matchMedia('(pointer:fine)').matches;
  if (touch && innerWidth === lastW && Math.abs(innerHeight - lastH) < 160) return;
  lastW = innerWidth; lastH = innerHeight;
  clearTimeout(rzT); rzT = setTimeout(layout, 150);
});
addEventListener('load', layout);
document.fonts?.ready.then(layout);

/* ---------------- observers: reveals, counters, amenities ---------------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  if (e.target.id === 'stats') countUp();
}), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
$$('.rv, #amen, #stats').forEach(el => io.observe(el));
function countUp() {
  const t0 = performance.now();
  const els = $$('#stats b');
  (function step(now) {
    const k = eo(clamp((now - t0) / (RM ? 1 : 2000)));
    els.forEach(b => {
      const to = parseFloat(b.dataset.count), to2 = b.dataset.to;
      b.textContent = to2 ? `${(to * k).toFixed(1)}–${Math.round(+to2 * k)}` : Math.round(to * k);
    });
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}
$$('#amen li').forEach(li => li.addEventListener('pointermove', e => {
  const r = li.getBoundingClientRect(); li.style.setProperty('--mx', (e.clientX - r.left) + 'px'); li.style.setProperty('--my', (e.clientY - r.top) + 'px');
}));

/* ---------------- cursor ---------------- */
const cur = $('#cursor'); let mx = VW / 2, my = VH / 2, cx = mx, cy = my, nmx = 0, nmy = 0;
addEventListener('pointermove', e => {
  mx = e.clientX; my = e.clientY; nmx = mx / VW * 2 - 1; nmy = my / VH * 2 - 1;
  if (!FINE) return;
  const tgt = e.target;
  cur.classList.toggle('drag', !!tgt.closest('#bld canvas'));
  cur.classList.toggle('link', !!tgt.closest('a,button,.card,.shot') && !tgt.closest('#bld'));
}, { passive: true });

/* ---------------- sound: synthesized surf + pad ---------------- */
let actx = null, master = null, surfF = null, soundOn = false;
function initSound() {
  actx = new (window.AudioContext || window.webkitAudioContext)();
  master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination);
  const sr = actx.sampleRate, len = sr * 6, buf = actx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } }
  const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
  surfF = actx.createBiquadFilter(); surfF.type = 'lowpass'; surfF.frequency.value = 520; surfF.Q.value = 0.6;
  const swell = actx.createGain(); swell.gain.value = 0.55;
  const lfo = actx.createOscillator(); lfo.frequency.value = 0.085; const lg = actx.createGain(); lg.gain.value = 0.4; lfo.connect(lg); lg.connect(swell.gain);
  const lfo2 = actx.createOscillator(); lfo2.frequency.value = 0.085; const lg2 = actx.createGain(); lg2.gain.value = 260; lfo2.connect(lg2); lg2.connect(surfF.frequency);
  src.connect(surfF); surfF.connect(swell); swell.connect(master);
  const padF = actx.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 900;
  const padG = actx.createGain(); padG.gain.value = 0.05; padF.connect(padG); padG.connect(master);
  [110, 164.81, 220, 277.18, 329.63].forEach((fr, i) => {
    const o = actx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = fr; o.detune.value = (i - 2) * 4;
    const g = actx.createGain(); g.gain.value = 0.2;
    const tr = actx.createOscillator(); tr.frequency.value = 0.05 + i * 0.023; const tg = actx.createGain(); tg.gain.value = 0.12; tr.connect(tg); tg.connect(g.gain);
    o.connect(g); g.connect(padF); o.start(); tr.start();
  });
  src.start(); lfo.start(); lfo2.start();
}
function setSound(on) {
  soundOn = on; $('#sound').classList.toggle('on', on); $('#sound').setAttribute('aria-pressed', String(on));
  if (on) { if (!actx) initSound(); actx.resume(); master.gain.setTargetAtTime(0.8, actx.currentTime, 0.8); }
  else if (actx) master.gain.setTargetAtTime(0, actx.currentTime, 0.25);
  store.set('th-sound', on ? '1' : '0');
}
$('#sound').addEventListener('click', () => setSound(!soundOn));
function blip(freq = 880, vol = 0.02) {
  if (!soundOn || !actx) return;
  const o = actx.createOscillator(), g = actx.createGain(), n = actx.currentTime;
  o.type = 'sine'; o.frequency.setValueAtTime(freq, n); o.frequency.exponentialRampToValueAtTime(freq * 0.75, n + 0.12);
  g.gain.setValueAtTime(vol, n); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.22);
  o.connect(g); g.connect(master); o.start(n); o.stop(n + 0.25);
}
$$('.nav a, .btn, .chips, .dn-toggle button').forEach(el => el.addEventListener('mouseenter', () => blip(1180, 0.008)));

/* ---------------- day/night toggle ---------------- */
$('#dnDay').addEventListener('click', () => go(G.day.top + (G.day.h - VH) * 0.12));
$('#dnNightBtn').addEventListener('click', () => go(G.day.top + (G.day.h - VH) * 0.96));

/* =========================================================
   FRAME — every scroll-driven scene
   ========================================================= */
const st = { hero: 0, sea: 0, day: 0, ring: 0, strip: 0, bld: 0, vel: 0, skew: 0 };
let lastY = scrollY, lastLit = -1, lastCopyP = 0, lastClock = '';
const top = $('#top');
const wrap = $('#wordWrap'), cue = $('#cue'), revealImg = $('#revealImg'), revealPic = $('#revealPic');
const foam1 = $('#foam1'), foam2 = $('#foam2'), foamSvg = $('#foam');
const seaBg = $('#seaBg img'), seaLine = $('#seaLine'), seaNum = $('#seaNum'), pinA = $('#pinA'), pinB = $('#pinB');
const dnStage = $('#dnStage'), dnNight = $('#dnNight'), dnTint = $('#dnTint'), clock = $('#clock'), sunDot = $('#sun');
const dnDayBtn = $('#dnDay'), dnNightBtn = $('#dnNightBtn');
const ringBar = $('#ringBar'), ringCount = $('#ringCount'), vrBg = $('#vrBg');
const fw = [$('#fw1'), $('#fw2'), $('#fw3')];

function heroCopy(cp, force) {
  if (!force && Math.abs(cp - lastCopyP) < 0.0005) return;
  lastCopyP = cp;
  revealLines.forEach((s, i) => { s.style.transform = `translate3d(0,${(1 - eo(clamp(cp * 1.7 - i * 0.09))) * 110}%,0)`; });
  const tx = $('#revealText'), bt = $('#revealBtn');
  const k = eo(range(cp, 0.35, 1));
  tx.style.opacity = k; tx.style.transform = `translateY(${(1 - k) * 20}px)`;
  bt.style.opacity = k; bt.style.transform = `translateY(${(1 - k) * 20}px)`;
  bt.style.pointerEvents = k > 0.6 ? 'auto' : 'none';
}

function frame(time, dt) {
  if (RM) time = 4;
  const y = scrollY;
  const rawVel = (y - lastY) / Math.max(dt, 1 / 240); lastY = y;
  st.vel = damp(st.vel, rawVel, 6, dt);
  const K = RM ? 60 : 7;

  /* header */
  const heroEnd = G.hero.top + G.hero.h - VH;
  top.classList.toggle('light', y < G.hero.top + (G.hero.h - VH) * 0.3);
  top.classList.toggle('solid', y > heroEnd - 10);
  top.classList.toggle('hide', y > heroEnd + VH && st.vel > 60);

  /* hero: ocean + tide */
  if (y < G.hero.top + G.hero.h) {
    st.hero = damp(st.hero, trackP('hero'), K, dt);
    const p = st.hero;
    if (ocean && p < 0.7) ocean.render(RM ? 4 : time, p, nmx * 0.6, nmy * 0.6);
    const tp = range(p, 0, 0.2);
    wrap.style.transform = `translate3d(${nmx * -8}px,${-tp * 16}vh,0) scale(${1 + tp * 0.1})`;
    wrap.style.opacity = 1 - range(p, 0.05, 0.2);
    wrap.style.filter = tp > 0.01 ? `blur(${tp * 7}px)` : 'none';
    word.style.letterSpacing = (0.06 + tp * 0.22) + 'em';
    cue.style.opacity = 0.85 * (1 - range(p, 0, 0.04));
    const tide = range(p, 0.14, 0.6);
    const base = lerp(1.1, -0.18, ease(tide)) * VH;
    const A = VH * 0.07 * (0.35 + 0.65 * Math.sin(Math.PI * tide));
    const N = 36, pts = [];
    for (let i = 0; i < N; i++) {
      const xn = i / (N - 1);
      const yv = base + A * (Math.sin(xn * 6 + time * 1.3) * 0.55 + Math.sin(xn * 13 - time * 1.9) * 0.18 - Math.tanh((xn - 0.5) * 3.2) * 1.05);
      pts.push([xn * VW, yv]);
    }
    revealImg.style.clipPath = `polygon(${pts.map(([a, b]) => `${a.toFixed(1)}px ${b.toFixed(1)}px`).join(',')},${VW}px ${VH * 1.6}px,0px ${VH * 1.6}px)`;
    const fo = clamp(Math.sin(Math.PI * tide) * 1.6);
    foamSvg.style.opacity = fo;
    if (fo > 0) {
      foam1.setAttribute('d', 'M' + pts.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join('L'));
      foam2.setAttribute('d', 'M' + pts.map(([a, b], i) => `${a.toFixed(1)} ${(b + 10 + Math.sin(i * 0.9 + time * 2) * 4).toFixed(1)}`).join('L'));
    }
    const ip = ease(range(p, 0.14, 1));
    revealPic.style.transform = `translate3d(${nmx * -10}px,${(1 - ip) * 7}vh,0) scale(${lerp(1.32, 1.02, ip)})`;
    heroCopy(range(p, 0.56, 0.84));
  }

  /* 800 m */
  if (Math.abs(y - G.sea.top) < G.sea.h + VH) {
    st.sea = damp(st.sea, trackP('sea'), K, dt);
    const p = st.sea;
    seaBg.style.transform = `scale(${lerp(1.16, 1.0, ease(p))}) translate3d(${nmx * -6}px,${(0.5 - p) * 3}%,0)`;
    const lp = range(p, 0.12, 0.62);
    seaLine.style.strokeDashoffset = 1 - lp;
    seaNum.textContent = Math.round(800 * eo(lp));
    pinA.classList.toggle('on', p > 0.08); pinB.classList.toggle('on', p > 0.6);
  }

  /* manifesto */
  const mr = { top: G.man.top - y, bottom: G.man.top + G.man.h - y, height: G.man.h };
  if (mr.top < VH && mr.bottom > 0) {
    const mp = clamp((VH * 0.88 - mr.top) / (mr.height + VH * 0.3));
    const lit = Math.floor(mp * mWords.length * 1.04);
    if (lit !== lastLit) { mWords.forEach((w, i) => w.classList.toggle('lit', i < lit)); lastLit = lit; }
  }

  /* day → night */
  if (Math.abs(y - G.day.top) < G.day.h + VH) {
    st.day = damp(st.day, trackP('day'), K, dt);
    const p = st.day;
    dnStage.style.transform = `scale(${lerp(1.1, 1.0, p)}) translate3d(${nmx * -8}px,0,0)`;
    dnTint.style.opacity = Math.sin(Math.PI * range(p, 0.22, 0.78)) * 0.95;
    dnNight.style.setProperty('--m', lerp(-20, 112, ease(range(p, 0.4, 0.86))) + '%');
    const mins = 12 * 60 + Math.round(range(p, 0.04, 0.92) * 600);
    const c = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    if (c !== lastClock) { clock.textContent = c; lastClock = c; }
    const th = Math.PI * (1 - range(p, 0.04, 0.6));
    sunDot.setAttribute('cx', (60 + 54 * Math.cos(th)).toFixed(1));
    sunDot.setAttribute('cy', (60 - 54 * Math.sin(th) + range(p, 0.6, 0.75) * 30).toFixed(1));
    sunDot.style.opacity = 1 - range(p, 0.62, 0.74);
    const night = p > 0.62;
    dnDayBtn.classList.toggle('on', !night); dnNightBtn.classList.toggle('on', night);
  }

  /* building */
  if (bld) {
    st.bld = clamp((VH - (G.choose.top - y)) / (VH * 0.9));
    bld.tick(dt, st.bld);
  }

  /* ring */
  if (Math.abs(y - G.ring.top) < G.ring.h + VH) {
    st.ring = damp(st.ring, trackP('ring'), K * 0.8, dt);
    const p = st.ring, N = VISION.length;
    const rot = -ease(p) * ringStep * (N - 1) + (RM ? 0 : Math.sin(time * 0.4) * 1.2);
    ringEl.style.transform = `translateZ(${-ringR}px) rotateX(${-3 + nmy * 2}deg) rotateY(${rot + nmx * 3}deg)`;
    cards.forEach((c, i) => {
      const a = Math.abs(((i * ringStep + rot) % 360 + 540) % 360 - 180);
      const f = MOBILE() ? `brightness(${(1 - Math.min(a / 120, 1) * 0.55).toFixed(2)})`
        : `blur(${(Math.min(a / 45, 1) * 4).toFixed(1)}px) brightness(${(1 - Math.min(a / 120, 1) * 0.55).toFixed(2)})`;
      if (c._f !== f) { c.style.filter = f; c._f = f; }
    });
    ringBar.style.transform = `scaleX(${p})`;
    ringCount.textContent = `${String(Math.round(ease(p) * (N - 1)) + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
  }

  /* strip */
  if (Math.abs(y - G.strip.top) < G.strip.h + VH) {
    st.strip = damp(st.strip, trackP('strip'), K, dt);
    st.skew = damp(st.skew, RM ? 0 : clamp(-st.vel * 0.0012, -4, 4), 6, dt);
    const x = -st.strip * dist;
    stripEl.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${st.skew.toFixed(2)}deg)`;
    shots.forEach(s => {
      const c = s.c + x; const rel = (c - VW / 2) / VW;
      s.img.style.transform = `translate3d(${(-rel * 9).toFixed(2)}%,0,0) scale(${1 + Math.abs(rel) * 0.06})`;
    });
  }

  /* vr parallax */
  const vr = { top: G.vr.top - y, bottom: G.vr.top + G.vr.h - y, height: G.vr.h };
  if (vr.top < VH && vr.bottom > 0) {
    const p = (VH - vr.top) / (VH + vr.height);
    vrBg.style.transform = `translate3d(0,${(p - 0.5) * -14}%,0) scale(1.05)`;
  }

  /* footer waves */
  if (G.foot.top - y < VH && G.foot.top + G.foot.h - y > 0) {
    fw.forEach((path, k) => {
      let d = ''; const amp = 22 - k * 5, ph = k * 1.3;
      for (let x = 0; x <= 1000; x += 20) {
        const yy = 60 + Math.sin(x * 0.011 + time * (0.8 + k * 0.2) + ph) * amp + Math.sin(x * 0.027 - time * 1.1 + ph) * amp * 0.35 - Math.tanh((x - 500) / 180) * 14;
        d += (x ? 'L' : 'M') + x + ' ' + yy.toFixed(1);
      }
      path.setAttribute('d', d);
    });
  }

  /* cursor */
  if (FINE) { cx = damp(cx, mx, 14, dt); cy = damp(cy, my, 14, dt); cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; }

  /* sound reacts to scroll speed */
  if (soundOn && surfF) surfF.frequency.setTargetAtTime(520 + Math.min(Math.abs(st.vel), 3000) * 0.35, actx.currentTime, 0.3);
}

/* ---------------- boot ---------------- */
applyLang(lang);
setTimeout(() => select(sel), 0);
layout();
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  lenis?.raf(now);
  frame(now / 1000, dt);
  requestAnimationFrame(loop);
}
if (!CAPTURE) requestAnimationFrame(loop);
else {
  // Frame-exact recording: the recorder sets scroll + advances a virtual clock,
  // CSS transitions/animations are paused and stepped by the same delta.
  let vt = 0;
  window.__step = (y, dtMs) => {
    scrollTo(0, y);
    vt += dtMs;
    document.getAnimations().forEach(a => { a.pause(); a.currentTime = (a.currentTime || 0) + dtMs; });
    frame(vt / 1000, dtMs / 1000);
  };
  window.__go = () => document.body.classList.add('go');
  window.__hover = id => bld?.setHover(id);
  window.__select = id => select(id);
  window.__pointer = (x, y) => { nmx = x; nmy = y; };
}

// loader: wait for key images + fonts, show progress on the logo wave
const pre = ['img/hero.webp', 'img/logo.png', 'img/facade-day.webp', 'img/front-day-s.webp', 'img/site-2.webp'];
let got = 0, shown = 0;
const t0 = performance.now();
const loads = pre.map(src => new Promise(r => { const i = new Image(); i.onload = i.onerror = () => { got++; r(); }; i.src = src; }));
const wave = $('#loaderWave'), num = $('#loaderNum');
(function tickLoader() {
  shown = lerp(shown, got / pre.length, 0.08);
  wave.style.strokeDashoffset = 1 - shown; num.textContent = String(Math.round(shown * 100)).padStart(3, '0');
  if (!document.body.classList.contains('ready')) requestAnimationFrame(tickLoader);
})();
Promise.all([...loads, document.fonts?.ready]).then(() => {
  const wait = Math.max(0, (CAPTURE ? 300 : 1500) - (performance.now() - t0));
  setTimeout(() => {
    got = pre.length;
    setTimeout(() => {
      document.body.classList.add('ready');
      $('#loader').classList.add('out');
      document.body.classList.remove('locked');
      lenis?.start();
      if (!CAPTURE) setTimeout(() => document.body.classList.add('go'), RM ? 0 : 350);
      window.__ready = true;
    }, 450);
  }, wait);
});
if (store.get('th-sound') === '1') $('#sound').classList.add('hint');
