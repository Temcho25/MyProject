import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { marbleTexture, plasterTexture } from './textures.js';
import { quality } from './quality.js';

// ---- Architecture dimensions ----
const HALL_W = 11;       // inner width of the hall
const HALL_H = 7.6;      // ceiling height
const GAP = 6.5;         // distance between portals
const PORTALS = 7;
const OPEN_W = 3.8;      // arch opening width
const OPEN_SPRING = 3.6; // height where the arch springs

function archShape(w, spring, offset = 0) {
  const r = w / 2 + offset;
  const s = new THREE.Shape();
  s.moveTo(-r, 0);
  s.lineTo(-r, spring);
  s.absarc(0, spring, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.lineTo(-r, 0);
  return s;
}

function buildPortalWall() {
  // Wall slab traced around the arched opening (single contour, no holes).
  const r = OPEN_W / 2;
  const s = new THREE.Shape();
  s.moveTo(-HALL_W / 2, 0);
  s.lineTo(-r, 0);
  s.lineTo(-r, OPEN_SPRING);
  s.absarc(0, OPEN_SPRING, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.lineTo(HALL_W / 2, 0);
  s.lineTo(HALL_W / 2, HALL_H);
  s.lineTo(-HALL_W / 2, HALL_H);
  s.lineTo(-HALL_W / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: false, curveSegments: 48 });
  g.translate(0, 0, -0.35);
  return g;
}

function archRing(inner, outer) {
  // Horseshoe-shaped band between two arch outlines (single contour).
  const ri = OPEN_W / 2 + inner, ro = OPEN_W / 2 + outer;
  const s = new THREE.Shape();
  s.moveTo(-ro, 0);
  s.lineTo(-ro, OPEN_SPRING);
  s.absarc(0, OPEN_SPRING, ro, Math.PI, 0, true);
  s.lineTo(ro, 0);
  s.lineTo(ri, 0);
  s.lineTo(ri, OPEN_SPRING);
  s.absarc(0, OPEN_SPRING, ri, 0, Math.PI, false);
  s.lineTo(-ri, 0);
  s.lineTo(-ro, 0);
  return s;
}

function buildArchitrave() {
  // Moulded frame around the arch: three stepped bands + keystone.
  const parts = [];
  const steps = [
    { o: 0.0, w: 0.18, d: 0.92 },
    { o: 0.18, w: 0.12, d: 0.84 },
    { o: 0.30, w: 0.08, d: 0.98 }
  ];
  for (const st of steps) {
    const g = new THREE.ExtrudeGeometry(archRing(st.o, st.o + st.w), {
      depth: st.d, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 3, curveSegments: 64
    });
    g.translate(0, 0, -st.d / 2);
    parts.push(g.index ? g.toNonIndexed() : g);
  }
  const ks = new THREE.Shape();
  ks.moveTo(-0.22, 0); ks.lineTo(0.22, 0); ks.lineTo(0.32, 0.62); ks.lineTo(-0.32, 0.62); ks.lineTo(-0.22, 0);
  const kg = new THREE.ExtrudeGeometry(ks, { depth: 1.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
  kg.translate(0, OPEN_SPRING + OPEN_W / 2 - 0.05, -0.53);
  parts.push(kg.index ? kg.toNonIndexed() : kg);
  return mergeGeometries(parts);
}

function panelFrame(w, h, bw = 0.09) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.lineTo(-w / 2, -h / 2);
  const hole = new THREE.Path();
  const iw = w / 2 - bw, ih = h / 2 - bw;
  hole.moveTo(-iw, -ih); hole.lineTo(-iw, ih); hole.lineTo(iw, ih); hole.lineTo(iw, -ih); hole.lineTo(-iw, -ih);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2 });
  return g.index ? g.toNonIndexed() : g;
}

function buildColumn() {
  // Classical column via lathe: base (torus + plinth), fluted-like shaft, capital.
  const pts = [];
  const add = (r, y) => pts.push(new THREE.Vector2(r, y));
  add(0.0, 0); add(0.46, 0); add(0.46, 0.14); add(0.40, 0.16);
  // torus
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI; add(0.36 + Math.cos(a) * 0.07, 0.24 + Math.sin(a) * 0.07); }
  add(0.31, 0.34); add(0.30, 0.42);
  // shaft with slight entasis
  for (let i = 0; i <= 12; i++) { const t = i / 12; add(0.30 - 0.04 * t * t, 0.42 + t * 4.2); }
  // capital (echinus + abacus)
  add(0.27, 4.66); add(0.30, 4.7);
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); add(0.30 + Math.sin(a) * 0.14, 4.7 + (1 - Math.cos(a)) * 0.16); }
  add(0.46, 4.9); add(0.46, 5.04); add(0.0, 5.04);
  const g = new THREE.LatheGeometry(pts, 48);
  return g;
}

function buildCornice() {
  // Long cornice running along the hall where wall meets ceiling (profile extruded along Z).
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(0.05, 0); s.quadraticCurveTo(0.1, 0.1, 0.2, 0.12);
  s.lineTo(0.22, 0.2); s.bezierCurveTo(0.34, 0.22, 0.32, 0.38, 0.46, 0.42);
  s.lineTo(0.48, 0.5); s.lineTo(0, 0.5); s.lineTo(0, 0);
  const len = GAP * (PORTALS + 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -len + GAP * 1.5);
  return g;
}

function dustMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
    vertexShader: `
      uniform float uTime; uniform float uPx;
      attribute float aSeed;
      varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime*0.15 + aSeed*12.0)*0.35;
        p.y += mod(uTime*0.06*(0.4+aSeed) + aSeed*10.0, 7.0) - 3.5 + 3.6;
        p.z += cos(uTime*0.1 + aSeed*7.0)*0.3;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.2*uPx*(0.5+aSeed*1.5)) * (6.0 / max(-mv.z, 1.5));
        vA = smoothstep(26.0, 2.0, -mv.z) * (0.35 + 0.65*fract(aSeed*91.7));
      }`,
    fragmentShader: `
      varying float vA;
      void main(){
        float d = length(gl_PointCoord-0.5);
        float a = smoothstep(0.5,0.0,d);
        gl_FragColor = vec4(1.0,0.86,0.62, a*a*vA*0.75);
      }`
  });
}

function shaftMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.22 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `
      uniform float uTime; uniform float uOpacity; varying vec2 vUv;
      void main(){
        float edge = smoothstep(0.0,0.35,vUv.x)*smoothstep(1.0,0.65,vUv.x);
        float fall = pow(vUv.y, 1.6);
        float flick = 0.85 + 0.15*sin(uTime*0.7 + vUv.x*9.0);
        gl_FragColor = vec4(1.0,0.84,0.58, edge*fall*flick*uOpacity);
      }`
  });
}

export function initHero(canvas) {
  const q = quality();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: q.tier !== 'high', powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(q.dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = q.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0b0a);
  scene.fog = new THREE.FogExp2(0x0d0b09, 0.05);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.22;

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);

  // ---- Materials ----
  const plasterMap = plasterTexture(renderer);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xb9a990, roughness: 0.92, metalness: 0, bumpMap: plasterMap, bumpScale: 0.25 });
  const mouldMat = new THREE.MeshStandardMaterial({ color: 0xe6dac6, roughness: 0.55, metalness: 0 });
  const mouldMatDS = mouldMat.clone(); mouldMatDS.side = THREE.DoubleSide;
  const columnMat = new THREE.MeshPhysicalMaterial({ color: 0xece2d2, roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.4 });
  const marble = marbleTexture(renderer, q.tier === 'high' ? 1024 : 512);
  const floorMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: marble, roughness: 0.14, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.4 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x2a241e, roughness: 0.9 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xc9a46c, roughness: 0.28, metalness: 1 });

  const world = new THREE.Group();
  scene.add(world);

  // Floor
  const floorLen = GAP * (PORTALS + 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, floorLen), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -floorLen / 2 + GAP * 2;
  floor.receiveShadow = true;
  world.add(floor);
  marble.repeat.set(1.4, floorLen / HALL_W * 1.4);

  // Ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, floorLen), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, HALL_H, floor.position.z);
  world.add(ceil);

  const pwAll = (HALL_W / 2 - OPEN_W / 2 - 1.7);
  const panelGeoTall = panelFrame(pwAll - 0.25, 3.9);
  const panelGeoSmall = panelFrame(pwAll - 0.25, 1.5);
  const sidePanel = panelFrame(GAP - 1.6, 3.6);
  const sidePanelHi = panelFrame(GAP - 1.6, 1.3);
  // Side walls
  const sideGeo = new THREE.PlaneGeometry(floorLen, HALL_H);
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(sideGeo, wallMat);
    w.rotation.y = side * -Math.PI / 2;
    w.position.set(side * HALL_W / 2, HALL_H / 2, floor.position.z);
    w.receiveShadow = true;
    world.add(w);
    const c = new THREE.Mesh(buildCornice(), side > 0 ? mouldMatDS : mouldMat);
    c.scale.x = side > 0 ? -1 : 1;
    c.position.set(side * HALL_W / 2, HALL_H - 0.5, 0);
    world.add(c);
    // Skirting
    const sk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, floorLen), mouldMat);
    sk.position.set(side * (HALL_W / 2 - 0.04), 0.15, floor.position.z);
    world.add(sk);
    for (let i = -1; i < PORTALS; i++) {
      const z = -i * GAP - GAP / 2;
      const a = new THREE.Mesh(sidePanel, mouldMat);
      a.rotation.y = side * -Math.PI / 2;
      a.position.set(side * (HALL_W / 2 - 0.02), 2.35, z);
      world.add(a);
      const b = new THREE.Mesh(sidePanelHi, mouldMat);
      b.rotation.y = side * -Math.PI / 2;
      b.position.set(side * (HALL_W / 2 - 0.02), 5.6, z);
      world.add(b);
    }
  }

  // Portals
  const wallGeo = buildPortalWall();
  const traveGeo = buildArchitrave();
  const colGeo = buildColumn();
  const portals = [];
  for (let i = 0; i < PORTALS; i++) {
    const z = -i * GAP;
    const g = new THREE.Group();
    g.position.z = z;
    const wall = new THREE.Mesh(wallGeo, wallMat); wall.castShadow = q.shadows; wall.receiveShadow = true; g.add(wall);
    const tr = new THREE.Mesh(traveGeo, mouldMat); tr.castShadow = q.shadows; tr.receiveShadow = true; g.add(tr);
    for (const sx of [-1, 1]) {
      const col = new THREE.Mesh(colGeo, columnMat);
      col.position.set(sx * (OPEN_W / 2 + 0.95), 0, 0.62);
      col.scale.setScalar(1.06);
      col.castShadow = q.shadows; col.receiveShadow = true;
      g.add(col);
      // entablature block above column
      const ent = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.34, 0.5), mouldMat);
      ent.position.set(sx * (OPEN_W / 2 + 0.95), 5.52, 0.62);
      ent.castShadow = q.shadows;
      g.add(ent);
    }
    // boiserie panels on both faces of the portal wall
    const pw = (HALL_W / 2 - OPEN_W / 2 - 1.7);
    for (const face of [1, -1]) {
      for (const sx of [-1, 1]) {
        const cx = sx * (OPEN_W / 2 + 1.7 + pw / 2);
        const up = new THREE.Mesh(panelGeoTall, mouldMat); up.position.set(cx, 2.55, face * 0.36); g.add(up);
        const hi = new THREE.Mesh(panelGeoSmall, mouldMat); hi.position.set(cx, 5.75, face * 0.36); g.add(hi);
      }
    }
    // brass inlay line on the floor under each arch
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(OPEN_W + 1.2, 0.006, 0.05), brassMat);
    inlay.position.set(0, 0.004, 0.55);
    g.add(inlay);
    world.add(g);
    portals.push(g);
  }

  // End window (warm glow) + light shafts
  const endZ = -PORTALS * GAP + 1.2;
  const winGeo = new THREE.ShapeGeometry(archShape(OPEN_W * 1.15, OPEN_SPRING * 1.05), 64);
  const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.82, 0.58).multiplyScalar(3.2), toneMapped: true });
  const win = new THREE.Mesh(winGeo, winMat);
  win.position.set(0, 0, endZ - 0.6);
  world.add(win);
  // Muntins
  const munt = new THREE.Group();
  const mm = new THREE.MeshStandardMaterial({ color: 0x1b1611, roughness: 0.6 });
  for (const x of [-0.75, 0.75]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 6.3, 0.06), mm); b.position.set(x, 3.1, endZ - 0.5); munt.add(b); }
  for (const y of [1.6, 3.2, 4.6]) { const b = new THREE.Mesh(new THREE.BoxGeometry(OPEN_W * 1.2, 0.06, 0.06), mm); b.position.set(0, y, endZ - 0.5); munt.add(b); }
  world.add(munt);
  const endWall = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, HALL_H), wallMat);
  endWall.position.set(0, HALL_H / 2, endZ - 0.62);
  world.add(endWall);

  const shaftMat = shaftMaterial();
  const shafts = [];
  for (let i = 0; i < 0; i++) {
    const len = 26;
    const geo = new THREE.PlaneGeometry(1.4 + i * 0.4, len, 1, 1);
    geo.translate(0, -len / 2, 0);
    const m = new THREE.Mesh(geo, shaftMat);
    m.position.set(-1.2 + i * 0.8, 5.6, endZ - 0.4);
    m.rotation.x = -1.32 - i * 0.03;
    m.rotation.z = 0.06 * (i - 1.5);
    world.add(m);
    shafts.push(m);
  }

  // Dust
  const dustCount = q.tier === 'low' ? 500 : 1400;
  const dp = new Float32Array(dustCount * 3);
  const ds = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dp[i * 3] = (Math.random() - 0.5) * HALL_W * 0.9;
    dp[i * 3 + 1] = 0;
    dp[i * 3 + 2] = 4 - Math.random() * (PORTALS * GAP + 2);
    ds[i] = Math.random();
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
  const dmat = dustMaterial();
  dmat.uniforms.uPx.value = renderer.getPixelRatio();
  const dust = new THREE.Points(dg, dmat);
  dust.frustumCulled = false;
  world.add(dust);

  // ---- Lights ----
  scene.add(new THREE.HemisphereLight(0xffe7c4, 0x1a140e, 0.1));
  const sun = new THREE.DirectionalLight(0xffd59a, 2.4);
  sun.position.set(2.5, 8, endZ - 6);
  sun.target.position.set(-1, 0, 4);
  sun.castShadow = q.shadows;
  sun.shadow.mapSize.set(q.tier === 'high' ? 2048 : 1024, q.tier === 'high' ? 2048 : 1024);
  sun.shadow.camera.left = -8; sun.shadow.camera.right = 8; sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 70;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const lamps = [];
  for (let i = 0; i < PORTALS; i++) {
    for (const sx of [-1, 1]) {
      const l = new THREE.PointLight(0xffb06a, 3.2, 6.5, 2);
      l.position.set(sx * (HALL_W / 2 - 0.9), 3.4, -i * GAP + GAP / 2);
      world.add(l);
      lamps.push(l);
      // sconce
      const sc = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.75, 0.45).multiplyScalar(4) }));
      sc.position.copy(l.position).setX(sx * (HALL_W / 2 - 0.18));
      world.add(sc);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), brassMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.copy(sc.position).setX(sx * (HALL_W / 2 - 0.05));
      world.add(arm);
    }
  }
  const glow = new THREE.PointLight(0xffc88a, 18, 22, 1.8);
  glow.position.set(0, 3.2, endZ + 1.5);
  world.add(glow);

  // ---- Post ----
  let composer = null, bokeh = null, bloom = null;
  if (q.post) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.38, 0.55, 0.85);
    composer.addPass(bloom);
    if (q.dof) {
      bokeh = new BokehPass(scene, camera, { focus: 9, aperture: 0.0016, maxblur: 0.006 });
      composer.addPass(bokeh);
    }
    composer.addPass(new OutputPass());
  }

  // ---- State ----
  const state = { progress: 0, target: 0, mx: 0, my: 0, tmx: 0, tmy: 0, intro: 0, visible: true };
  const startZ = 9.5, endCamZ = endZ + 11.5;
  const look = new THREE.Vector3();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // wider FOV on portrait screens so the arches stay in frame
    camera.fov = w / h < 0.8 ? 66 : w / h < 1.2 ? 58 : 50;
    camera.updateProjectionMatrix();
    if (composer) { composer.setSize(w, h); composer.setPixelRatio(renderer.getPixelRatio()); }
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', e => {
    state.tmx = (e.clientX / window.innerWidth) * 2 - 1;
    state.tmy = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const io = new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; }, { rootMargin: '100px' });
  io.observe(canvas);

  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const clock = new THREE.Clock();
  let frames = 0, acc = 0, downgraded = false;

  function frame() {
    requestAnimationFrame(frame);
    if (window.__mgPaused) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!state.visible) return;

    // adaptive quality: drop DOF / DPR if we cannot hold ~40fps
    if (!downgraded && t > 1.5 && t < 6) { frames++; acc += dt; if (frames > 90 && acc / frames > 1 / 38) { downgraded = true; if (bokeh) bokeh.enabled = false; renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() * 0.75)); resize(); } }

    state.progress += (state.target - state.progress) * Math.min(1, dt * 4.5);
    state.mx += (state.tmx - state.mx) * Math.min(1, dt * 3);
    state.my += (state.tmy - state.my) * Math.min(1, dt * 3);
    state.intro = Math.min(1, state.intro + dt * 0.35);

    const p = state.progress;
    const ip = ease(state.intro);
    // camera path: intro push-in, then glide through the enfilade with a soft S-curve
    const z = THREE.MathUtils.lerp(startZ + (1 - ip) * 5, endCamZ, ease(Math.min(1, p * 1.02)));
    const sway = Math.sin(p * Math.PI * 2.2) * 0.9 * (1 - p * 0.6);
    const x = sway + state.mx * 0.55;
    const y = 1.75 + Math.sin(t * 0.6) * 0.04 - state.my * 0.25 + (1 - ip) * 0.8 + Math.sin(p * Math.PI) * 0.35;
    camera.position.set(x, y, z);
    look.set(-sway * 0.4 + state.mx * 0.3, 2.35 - state.my * 0.15, z - 8);
    camera.lookAt(look);
    camera.rotation.z += Math.cos(p * Math.PI * 2.2) * 0.025 + state.mx * -0.01;

    if (bokeh) {
      // focus on the next portal ahead
      const nextPortal = Math.ceil((-(z - 0.6)) / GAP) ;
      const fz = -Math.max(0, nextPortal) * GAP;
      bokeh.uniforms.focus.value = THREE.MathUtils.clamp(z - fz, 2, 30);
    }

    dmat.uniforms.uTime.value = t;
    shaftMat.uniforms.uTime.value = t;
    shaftMat.uniforms.uOpacity.value = 0.07 + 0.06 * p;
    winMat.color.setRGB(1.0, 0.82, 0.58).multiplyScalar(1.05 + p * 0.25);
    glow.intensity = 14 + p * 16;
    for (let i = 0; i < lamps.length; i++) lamps[i].intensity = 3.1 + Math.sin(t * 2.3 + i * 1.7) * 0.18;

    if (composer) composer.render(dt); else renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    setProgress(v) { state.target = v; },
    compileAsync: () => renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve()
  };
}
