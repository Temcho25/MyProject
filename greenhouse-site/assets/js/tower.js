// 3D tower built from the logo's slabs.
// The scroll code only writes `target` values; the render loop damps toward them,
// so every change has weight and inertia instead of snapping.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const FLOORS = 7;          // Green House Isani — 7 storeys
const H = 1, GAP = 0.34;   // same proportions as the generated logo mark
const W = 2, D = 1.5;
const STEP = H + GAP;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const bounce = t => {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

// camera states as orbit coordinates around a target
function orbitState(p, t, fov, shiftX, shiftY = 0) {
  const rel = new THREE.Vector3(p[0] - t[0], p[1] - t[1], p[2] - t[2]);
  return {
    az: Math.atan2(rel.x, rel.z),
    el: Math.atan2(rel.y, Math.hypot(rel.x, rel.z)),
    r: rel.length(),
    tx: t[0], ty: t[1], tz: t[2], fov, shiftX, shiftY,
  };
}

export function createTower(canvas, { mobile = false, onLand = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  // ---- light ----
  const hemi = new THREE.HemisphereLight(0xffffff, 0x16774c, 1.15);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-5, 11, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.camera.left = -8; key.shadow.camera.right = 8;
  key.shadow.camera.top = 12; key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 1; key.shadow.camera.far = 40;
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9be3b9, 0.6);
  rim.position.set(8, 4, -6);
  scene.add(rim);

  // facade up-lights for the night state (architectural lighting)
  const ups = [-0.8, 0.8].map(x => {
    const s = new THREE.SpotLight(0xffc68a, 0, 14, 0.55, 0.9, 1.4);
    s.position.set(x, 0.05, D / 2 + 1.1);
    s.target.position.set(x * 0.6, 6, D / 2 - 0.2);
    scene.add(s, s.target);
    return s;
  });

  // ---- tower ----
  const tower = new THREE.Group();
  scene.add(tower);

  const slabGeo = new RoundedBoxGeometry(W, H, D, 4, 0.045);
  const slabMat = new THREE.MeshStandardMaterial({ color: 0xf6f6f1, roughness: 0.58, metalness: 0, envMapIntensity: 0.55 });
  const DAY = new THREE.Color(0xf6f6f1), NIGHT = new THREE.Color(0x26332d);
  const CORE_DAY = new THREE.Color(0x9a6a4c), CORE_NIGHT = new THREE.Color(0x5a2e12);
  const stripGeo = new THREE.BoxGeometry(W * 0.94, 0.03, 0.02);
  const slabs = [];
  for (let i = 0; i < FLOORS; i++) {
    const m = new THREE.Mesh(slabGeo, slabMat);
    m.castShadow = true; m.receiveShadow = true;
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0, toneMapped: false });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, -H / 2 - 0.05, D / 2 - 0.06);
    m.add(strip);
    tower.add(m);
    slabs.push({ mesh: m, strip, baseY: i * STEP + H / 2, seed: Math.random() * Math.PI * 2 });
  }

  // warm core: the balcony niches with warm-toned panels show through the gaps
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x9a6a4c, roughness: 0.8, emissive: 0xff8a3d, emissiveIntensity: 0 });
  const core = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, FLOORS * STEP - GAP, D * 0.8), coreMat);
  core.position.y = (FLOORS * STEP - GAP) / 2;
  core.castShadow = true;
  tower.add(core);

  // ground: only the contact shadow
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // dust in the light: three depths for parallax
  const COUNT = mobile ? 260 : 520;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 1] = Math.random() * 16 - 2;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 26;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // ---- camera path ----
  const port = () => window.innerWidth / window.innerHeight < 0.9;
  const S = () => {
    const p = port();
    const sx = p ? 0.14 : 0.2;
    const sy = p ? -0.3 : 0;
    return [
      orbitState([3.6, -3.0, 7.0], [0.25, 3.9, 0], p ? 64 : 46, sx, sy),               // 0: the logo angle
      orbitState([9.0, 1.0, 12.5], [0, 4.6, 0], p ? 60 : 42, sx + 0.02, sy),           // 1: pulling out
      orbitState([12.5, 4.2, 15.0], [0, 4.5, 0], p ? 58 : 38, p ? 0.27 : 0.24, p ? -0.08 : 0), // 2: build
      orbitState([-7.0, 11.0, 16.0], [0, 4.1, 0], p ? 58 : 38, p ? 0.27 : 0.24, p ? -0.08 : 0),// 3: build end
      orbitState([-11.5, 1.2, 12.5], [0, 4.9, 0], p ? 66 : 40, p ? 0.12 : 0.26, p ? -0.27 : 0),// 4: night
    ];
  };
  let states = S();

  const target = { camT: 0, explode: 0, spread: 0.32, thin: 1, drop: 0, core: 0, night: 0, strips: 0, vis: 1 };
  const cur = { ...target };
  const intro = { v: 0 };
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let active = true;
  let landed = false;
  let shake = 0;

  window.addEventListener('pointermove', e => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function camAt(t) {
    const i = clamp(Math.floor(t), 0, states.length - 2);
    const f = smooth(clamp(t - i));
    const a = states[i], b = states[i + 1];
    const o = {};
    for (const k in a) o[k] = a[k] + (b[k] - a[k]) * f;
    return o;
  }

  let lastW = 0, lastH = 0;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    // iOS toolbar show/hide: ignore small height-only changes
    if (w === lastW && Math.abs(h - lastH) < 120) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    states = S();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    // frame-rate independent damping
    const k = 1 - Math.exp(-dt * 4.2);
    for (const key in target) cur[key] += (target[key] - cur[key]) * k;
    mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 2.5));
    mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 2.5));

    canvas.style.opacity = cur.vis.toFixed(3);
    if (!active && cur.vis < 0.01) { requestAnimationFrame(frame); return; }

    // the 7th slab drops in with a bounce; the logo itself has six
    const dropRaw = clamp(target.drop);
    const dropE = dropRaw <= 0 ? 0 : bounce(dropRaw);
    if (dropRaw > 0.36 && !landed) { landed = true; shake = 1; onLand(); }
    if (dropRaw < 0.05) landed = false;
    shake *= Math.exp(-dt * 7);

    const ex = cur.explode;
    slabs.forEach((s, i) => {
      const introLocal = clamp(intro.v * 1.9 - i * 0.12);
      const introOff = (1 - easeOutExpo(introLocal)) * (5 + i * 0.6);
      const sp = cur.spread * i * 1.05;
      let y = s.baseY + ex * i * 0.95 + sp + introOff;
      let vis = introLocal > 0 ? 1 : 0;
      if (i === FLOORS - 1) {
        y = s.baseY + ex * i * 0.95 + sp + (1 - dropE) * 11;
        vis = dropRaw > 0.001 ? 1 : 0;
      }
      s.mesh.visible = vis > 0;
      s.mesh.position.set(
        Math.sin(s.seed + time * 0.6) * 0.06 * ex,
        y + Math.sin(time * 0.9 + s.seed) * 0.03 * ex,
        Math.cos(s.seed) * 0.12 * ex,
      );
      s.mesh.scale.z = 1 - cur.thin * 0.62;
      s.mesh.rotation.y = (i % 2 ? 1 : -1) * 0.22 * ex + Math.sin(time * 0.5 + s.seed) * 0.03 * ex;
      const lit = clamp(cur.strips - i);
      s.strip.material.opacity = lit * (0.5 + cur.night * 0.5);
      s.strip.scale.y = 1 + cur.night * 1.5;
    });

    const coreS = Math.max(0.0001, cur.core);
    const coreH = (FLOORS - 1 + clamp((dropE - 0.8) / 0.2)) / FLOORS;
    core.scale.set(coreS, Math.max(0.001, coreH), coreS);
    core.position.y = (FLOORS * STEP - GAP) * coreH / 2;
    core.visible = cur.core > 0.01;
    coreMat.emissiveIntensity = cur.night * 3.2;
    slabMat.color.copy(DAY).lerp(NIGHT, cur.night * 0.85);
    coreMat.color.copy(CORE_DAY).lerp(CORE_NIGHT, cur.night);

    hemi.intensity = 1.15 - cur.night * 0.95;
    key.intensity = 2.4 - cur.night * 2.15;
    rim.intensity = 0.6 + cur.night * 0.6;
    ups.forEach(s => { s.intensity = cur.night * 60; });
    dustMat.opacity = 0.55 - cur.night * 0.2;
    dust.rotation.y = time * 0.012;
    dust.position.y = Math.sin(time * 0.2) * 0.3;

    // camera: orbit coordinates + idle drift + pointer parallax
    const c = camAt(cur.camT);
    const r = c.r * (1 + (1 - easeOutExpo(intro.v)) * 0.35);
    const az = c.az + Math.sin(time * 0.17) * 0.05 + mouse.sx * 0.12;
    const el = c.el + Math.cos(time * 0.13) * 0.025 - mouse.sy * 0.06;
    tmp.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(r);
    camera.position.set(c.tx + tmp.x, c.ty + tmp.y, c.tz + tmp.z);
    camera.position.y += (Math.random() - 0.5) * shake * 0.08;
    camera.lookAt(c.tx, c.ty, c.tz);
    camera.fov = c.fov;
    const w = window.innerWidth, h = window.innerHeight;
    camera.setViewOffset(w, h, -c.shiftX * w, c.shiftY * h, w, h);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    target, intro,
    setActive(v) { active = v; },
  };
}
