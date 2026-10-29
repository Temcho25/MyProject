// 3D scene: the logo's slabs, which turn into a detailed model of Green House Isani.
// Scroll code only writes `target` values; the render loop damps toward them.
// Facade language follows the developer's renders: light panels, warm-wood balcony
// niches with LED soffits, black railings, wood-clad ground floor, roof pergola.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const FLOORS = 7;            // Green House Isani — 7 storeys
const H = 1, GAP = 0.34;     // logo slab proportions
const STEP = H + GAP;        // one storey
const W = 2, D = 1.5;        // logo slab footprint
const BW = 3.6, BD = 2.8;    // building footprint
const TOP = FLOORS * STEP;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const bounce = t => {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
// deterministic random so the model is identical on every load
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function orbitState(p, t, fov, shiftX, shiftY = 0) {
  const rel = new THREE.Vector3(p[0] - t[0], p[1] - t[1], p[2] - t[2]);
  return { az: Math.atan2(rel.x, rel.z), el: Math.atan2(rel.y, Math.hypot(rel.x, rel.z)), r: rel.length(), tx: t[0], ty: t[1], tz: t[2], fov, shiftX, shiftY };
}

function woodTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#b97a4f'; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 8) {
    const l = 0.82 + Math.random() * 0.3;
    g.fillStyle = `rgb(${185 * l | 0},${120 * l | 0},${78 * l | 0})`;
    g.fillRect(x, 0, 6, 256);
    g.fillStyle = 'rgba(40,20,10,.35)'; g.fillRect(x + 6, 0, 2, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

// ---------- procedural building ----------
function buildModel(mobile) {
  const B = { facade: [], band: [], wood: [], metal: [], glass: [], glassLit: [], led: [], core: [], plinth: [], slat: [] };
  const box = (bucket, cx, cy, cz, sx, sy, sz) => {
    const g = new THREE.BoxGeometry(Math.max(sx, 0.001), Math.max(sy, 0.001), Math.max(sz, 0.001));
    g.translate(cx, cy, cz); B[bucket].push(g);
  };
  // facade sides: origin, along-vector, outward normal
  const SIDES = [
    { o: [-BW / 2, BD / 2], a: [1, 0], n: [0, 1], L: BW },   // front (+z)
    { o: [BW / 2, BD / 2], a: [0, -1], n: [1, 0], L: BD },   // right (+x)
    { o: [BW / 2, -BD / 2], a: [-1, 0], n: [0, -1], L: BW }, // back
    { o: [-BW / 2, -BD / 2], a: [0, 1], n: [-1, 0], L: BD }, // left
  ];
  // box in facade space: s along facade, o offset (positive outward), y up
  const fbox = (bucket, side, s0, s1, y0, y1, o0, o1) => {
    const xs = [], zs = [];
    for (const s of [s0, s1]) for (const o of [o0, o1]) {
      xs.push(side.o[0] + side.a[0] * s + side.n[0] * o);
      zs.push(side.o[1] + side.a[1] * s + side.n[1] * o);
    }
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    box(bucket, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0);
  };
  const bars = []; // railing bars as instances: [x,y,z,h]
  const fbars = (side, s0, s1, y0, h, o) => {
    const n = Math.max(2, Math.round((s1 - s0) / 0.055));
    for (let k = 0; k <= n; k++) {
      const s = s0 + (s1 - s0) * k / n;
      bars.push([side.o[0] + side.a[0] * s + side.n[0] * o, y0 + h / 2, side.o[1] + side.a[1] * s + side.n[1] * o, h]);
    }
    fbox('metal', side, s0, s1, y0 + h, y0 + h + 0.025, o - 0.012, o + 0.012); // top rail
  };

  // bay rhythm per side (W = window, N = balcony niche), widths sum to side length
  const PLANS = [
    ['W', 'N', 'W', 'W', 'N'],
    ['N', 'W', 'W', 'N'],
    ['W', 'W', 'W', 'W', 'W'],
    ['W', 'N', 'W', 'W'],
  ];
  const T = 0.1;          // wall thickness
  const ND = 0.46;        // niche depth

  // interior volume (blocks views through the shell)
  box('core', 0, TOP / 2, 0, BW - 2 * ND - 0.02, TOP - 0.02, BD - 2 * ND - 0.02);

  for (let f = 0; f < FLOORS; f++) {
    const y0 = f * STEP, y1 = y0 + STEP;
    SIDES.forEach((side, si) => {
      // floor band: the light horizontal line between storeys
      fbox('band', side, -0.02, side.L + 0.02, y0, y0 + 0.11, -T, 0.035);
      if (f === 0) {
        // ground floor: concrete plinth, then wood slats or shopfront glass
        fbox('plinth', side, 0, side.L, y0, y0 + 0.24, -T, 0.02);
        const glassy = si === 0 || si === 1;
        if (glassy) {
          const n = Math.round(side.L / 0.62);
          for (let k = 0; k < n; k++) {
            const s0 = side.L * k / n, s1 = side.L * (k + 1) / n;
            fbox(k % 3 === 1 ? 'slat' : 'glass', side, s0 + 0.02, s1 - 0.02, y0 + 0.24, y1 - 0.1, -0.08, -0.06);
            fbox('metal', side, s0 - 0.012, s0 + 0.012, y0 + 0.24, y1 - 0.1, -0.08, -0.03);
          }
          fbox('metal', side, 0, side.L, y1 - 0.11, y1 - 0.08, -0.08, -0.02);
        } else {
          fbox('slat', side, 0, side.L, y0 + 0.24, y1, -T, -0.02);
        }
        // LED line under the first-floor band
        fbox('led', side, 0.02, side.L - 0.02, y1 - 0.03, y1 - 0.005, 0.02, 0.05);
        return;
      }
      const plan = PLANS[si];
      const bw = side.L / plan.length;
      plan.forEach((t, b) => {
        const s0 = b * bw, s1 = s0 + bw;
        const wy0 = y0 + 0.11, wy1 = y1;
        if (t === 'W') {
          const ww = Math.min(0.36, bw * 0.48), c = (s0 + s1) / 2, a = c - ww / 2, z = c + ww / 2;
          const g0 = y0 + 0.2, g1 = y0 + 1.14;
          fbox('facade', side, s0 + 0.004, a, wy0, wy1, -T, 0);
          fbox('facade', side, z, s1 - 0.004, wy0, wy1, -T, 0);
          fbox('facade', side, a, z, wy0, g0, -T, 0);
          fbox('facade', side, a, z, g1, wy1, -T, 0);
          fbox(rnd() < 0.42 ? 'glassLit' : 'glass', side, a, z, g0, g1, -T + 0.02, -T + 0.03);
          fbox('metal', side, a, z, g0, g0 + 0.02, -T, -0.03);
          fbox('metal', side, a, z, g1 - 0.02, g1, -T, -0.03);
          fbox('metal', side, a, a + 0.02, g0, g1, -T, -0.03);
          fbox('metal', side, z - 0.02, z, g0, g1, -T, -0.03);
          fbox('metal', side, c - 0.008, c + 0.008, g0, g1, -T, -0.04);
          fbars(side, a + 0.02, z - 0.02, g0, 0.42, -0.02);
        } else {
          const p = 0.07, a = s0 + p, z = s1 - p, top = y1 - 0.1;
          fbox('facade', side, s0 + 0.004, a, wy0, wy1, -T, 0);
          fbox('facade', side, z, s1 - 0.004, wy0, wy1, -T, 0);
          fbox('facade', side, a, z, top, wy1, -T, 0);
          // warm wood lining: back, sides, soffit
          fbox('wood', side, a, z, wy0, top, -ND - 0.04, -ND);
          fbox('wood', side, a, a + 0.03, wy0, top, -ND, -0.0);
          fbox('wood', side, z - 0.03, z, wy0, top, -ND, -0.0);
          fbox('wood', side, a, z, top - 0.03, top, -ND, 0);
          // balcony door glass at the back of the niche
          const dw = (z - a) * 0.62;
          fbox(rnd() < 0.5 ? 'glassLit' : 'glass', side, a + 0.06, a + 0.06 + dw, wy0 + 0.02, top - 0.12, -ND + 0.005, -ND + 0.015);
          // LED soffit line
          fbox('led', side, a + 0.03, z - 0.03, top - 0.045, top - 0.03, -0.06, -0.02);
          fbars(side, a, z, wy0, 0.45, -0.015);
        }
      });
    });
  }
  // roof: parapet + timber pergola
  SIDES.forEach(side => fbox('band', side, -0.02, side.L + 0.02, TOP, TOP + 0.22, -T, 0.035));
  box('band', 0, TOP + 0.02, 0, BW - 0.1, 0.04, BD - 0.1);
  for (let k = 0; k < 4; k++) box('wood', -BW / 2 + 0.35 + k * 0.42, TOP + 0.5, -0.35, 0.06, 1.0, 0.06);
  for (let k = 0; k < 4; k++) box('wood', -BW / 2 + 0.35 + k * 0.42, TOP + 0.5, -BD / 2 + 0.3, 0.06, 1.0, 0.06);
  for (let k = 0; k < 14; k++) box('wood', -BW / 2 + 0.85, TOP + 1.02, -BD / 2 + 0.25 + k * 0.08, 1.45, 0.05, 0.035);

  return { B, bars };
}

export function createTower(canvas, { mobile = false, onLand = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: mobile, powerPreference: 'high-performance' });
  const DPR = Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const BG_DAY = new THREE.Color(0x16774c), BG_NIGHT = new THREE.Color(0x04170f);
  scene.background = BG_DAY.clone();
  scene.fog = new THREE.Fog(scene.background, 24, 52);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  // ---- light ----
  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a6b4a, 0.9);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff4e6, 2.2);
  key.position.set(-7, 14, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 14, bottom: -6, near: 1, far: 50 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025; key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfeedd, 0.7);
  rim.position.set(9, 5, -8);
  scene.add(rim);

  // ---- materials ----
  const buildPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);   // keeps y < h
  const slabPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);     // keeps y > h
  const clip = [buildPlane];
  const wood = woodTexture();
  const M = {
    facade: new THREE.MeshStandardMaterial({ color: 0xd2d0ca, roughness: 0.82, clippingPlanes: clip }),
    band: new THREE.MeshStandardMaterial({ color: 0xeceae5, roughness: 0.7, clippingPlanes: clip }),
    wood: new THREE.MeshStandardMaterial({ color: 0xffffff, map: wood, roughness: 0.62, clippingPlanes: clip }),
    slat: new THREE.MeshStandardMaterial({ color: 0xffffff, map: wood, roughness: 0.6, clippingPlanes: clip }),
    metal: new THREE.MeshStandardMaterial({ color: 0x1b1e1d, roughness: 0.42, metalness: 0.6, clippingPlanes: clip }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x24343a, roughness: 0.06, metalness: 0.2, envMapIntensity: 1.6, clearcoat: 1, clippingPlanes: clip }),
    glassLit: new THREE.MeshPhysicalMaterial({ color: 0x2a3438, roughness: 0.08, metalness: 0.15, envMapIntensity: 1.4, emissive: 0xffc98a, emissiveIntensity: 0, clearcoat: 1, clippingPlanes: clip }),
    led: new THREE.MeshBasicMaterial({ color: 0xffd7a0, toneMapped: false, clippingPlanes: clip }),
    core: new THREE.MeshStandardMaterial({ color: 0x2c2724, roughness: 0.9, clippingPlanes: clip }),
    plinth: new THREE.MeshStandardMaterial({ color: 0x8e8e88, roughness: 0.9, clippingPlanes: clip }),
  };
  const LED_DAY = new THREE.Color(0xffd7a0).multiplyScalar(1.5), LED_NIGHT = new THREE.Color(0xffc178).multiplyScalar(4.5);

  // ---- building ----
  const building = new THREE.Group();
  scene.add(building);
  const { B, bars } = buildModel(mobile);
  for (const k in B) {
    if (!B[k].length) continue;
    const mesh = new THREE.Mesh(mergeGeometries(B[k]), M[k]);
    mesh.castShadow = k !== 'led' && k !== 'glass' && k !== 'glassLit';
    mesh.receiveShadow = true;
    building.add(mesh);
    B[k].forEach(g => g.dispose());
  }
  const barGeo = new THREE.BoxGeometry(0.012, 1, 0.012);
  const barMesh = new THREE.InstancedMesh(barGeo, M.metal, bars.length);
  const mtx = new THREE.Matrix4();
  bars.forEach(([x, y, z, h], i) => { mtx.makeScale(1, h, 1).setPosition(x, y, z); barMesh.setMatrixAt(i, mtx); });
  barMesh.castShadow = true;
  building.add(barMesh);

  // scan frame: the line where the logo becomes the building
  const scanMat = new THREE.MeshBasicMaterial({ color: 0x9be3b9, transparent: true, opacity: 0, toneMapped: false });
  const scan = new THREE.Group();
  [[BW + 0.5, 0.02, 0.02, 0, BD / 2 + 0.25], [BW + 0.5, 0.02, 0.02, 0, -BD / 2 - 0.25], [0.02, 0.02, BD + 0.5, BW / 2 + 0.25, 0], [0.02, 0.02, BD + 0.5, -BW / 2 - 0.25, 0]]
    .forEach(([sx, sy, sz, x, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), scanMat); m.position.set(x, 0, z); scan.add(m); });
  scene.add(scan);

  // ---- logo slabs ----
  const slabGeo = new RoundedBoxGeometry(W, H, D, 5, 0.05);
  const slabMat = new THREE.MeshPhysicalMaterial({ color: 0xf7f7f3, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.35, envMapIntensity: 0.7, clippingPlanes: [slabPlane] });
  const slabs = [];
  for (let i = 0; i < FLOORS; i++) {
    const m = new THREE.Mesh(slabGeo, slabMat);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    slabs.push({ mesh: m, baseY: i * STEP + H / 2, seed: rnd() * Math.PI * 2 });
  }

  // ---- site: plaza, lawn, road, trees, street lights ----
  const site = new THREE.Group();
  scene.add(site);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x135f3d, roughness: 1, envMapIntensity: 0.25 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
  scene.add(ground);
  const plaza = new THREE.Mesh(new RoundedBoxGeometry(BW + 3.2, 0.06, BD + 3.0, 3, 0.03), new THREE.MeshStandardMaterial({ color: 0xd3cfc6, roughness: 0.95 }));
  plaza.position.set(0.3, 0.0, 0.3); plaza.receiveShadow = true; site.add(plaza);
  const road = new THREE.Mesh(new THREE.BoxGeometry(60, 0.03, 2.2), new THREE.MeshStandardMaterial({ color: 0x27302c, roughness: 0.85 }));
  road.position.set(0, 0, BD / 2 + 3.4); road.receiveShadow = true; site.add(road);
  const kerb = new THREE.Mesh(new THREE.BoxGeometry(60, 0.08, 0.12), new THREE.MeshStandardMaterial({ color: 0xbdb9b0, roughness: 0.9 }));
  kerb.position.set(0, 0.02, BD / 2 + 2.25); site.add(kerb);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xd8d6cf });
  for (let k = -12; k <= 12; k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.035, 0.05), lineMat); l.position.set(k * 1.4, 0.0, BD / 2 + 3.4); site.add(l); }

  const TREES = [[-3.4, 2.6, 1.0], [3.6, 2.4, 1.15], [-4.2, -1.2, 1.25], [4.5, -0.6, 1.05], [-2.4, -3.4, 0.95], [2.6, -3.6, 1.2], [-6.5, 2.2, 1.3], [6.8, 2.6, 1.1], [-7.2, -3.0, 1.4], [7.4, -2.6, 1.3], [0.5, -5.2, 1.2], [-5.0, 5.8, 1.0], [5.6, 6.2, 1.15]].slice(0, mobile ? 9 : 13);
  const crownGeo = new THREE.IcosahedronGeometry(0.62, 4);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x3f8f5c, roughness: 0.9 });
  const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.3, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4a3c, roughness: 0.9 });
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, TREES.length * 3);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, TREES.length);
  crowns.castShadow = trunks.castShadow = true; crowns.receiveShadow = true;
  site.add(crowns, trunks);
  const crownCol = new THREE.Color();
  const treeData = TREES.map(([x, z, s], i) => ({ x, z, s, delay: i * 0.05, lumps: [0, 1, 2].map(() => [(rnd() - 0.5) * 0.5, 0.2 + rnd() * 0.5, (rnd() - 0.5) * 0.5, 0.7 + rnd() * 0.45]) }));
  treeData.forEach((t, i) => t.lumps.forEach((_, j) => { crownCol.setHSL(0.38 + rnd() * 0.05, 0.42, 0.3 + rnd() * 0.12); crowns.setColorAt(i * 3 + j, crownCol); }));

  // street lights for the night state
  const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xffe2b8, toneMapped: false });
  const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x1b1e1d, roughness: 0.5, metalness: 0.5 });
  const LAMPS = [-6, -2, 2, 6].map(x => {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.6, 8), lampPostMat); post.position.y = 0.8;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.08), lampHeadMat); head.position.set(0, 1.6, 0);
    g.add(post, head); g.position.set(x, 0, BD / 2 + 2.05); site.add(g);
    return g;
  });

  // dust in the light
  const COUNT = mobile ? 200 : 420;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) { pos[i * 3] = (rnd() - 0.5) * 28; pos[i * 3 + 1] = rnd() * 16; pos[i * 3 + 2] = (rnd() - 0.5) * 28; }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.5, depthWrite: false });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // every lit material, so the environment light can dim at night
  const envMats = [];
  scene.traverse(o => { if (o.material && o.material.envMapIntensity !== undefined && !envMats.includes(o.material)) { o.material.userData.env = o.material.envMapIntensity; envMats.push(o.material); } });

  // ---- post-processing (desktop): bloom for LED soffits and lit windows ----
  let composer = null, bloom = null;
  if (!mobile) {
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType, samples: 4 }));
    composer.setPixelRatio(DPR);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.45, 1.0);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // ---- camera path ----
  const port = () => window.innerWidth / window.innerHeight < 0.9;
  const S = () => {
    const p = port();
    const sx = p ? 0.14 : 0.2, sy = p ? -0.3 : 0;
    return [
      orbitState([3.6, -3.0, 7.0], [0.25, 3.9, 0], p ? 64 : 46, sx, sy),                       // 0: the logo angle
      orbitState([10.5, 1.4, 14.0], [0, 4.6, 0], p ? 60 : 42, sx + 0.02, sy),                 // 1: pulling out
      orbitState([14.5, 3.4, 17.5], [0, 4.6, 0], p ? 58 : 38, p ? 0.24 : 0.24, p ? -0.1 : 0),  // 2: build
      orbitState([-9.5, 12.5, 18.5], [0, 3.8, 0], p ? 58 : 36, p ? 0.24 : 0.24, p ? -0.1 : 0), // 3: build end
      orbitState([-13.5, 0.9, 13.5], [0, 5.2, 0], p ? 66 : 40, p ? 0.12 : 0.25, p ? -0.27 : 0),// 4: night
    ];
  };
  let states = S();

  const target = { camT: 0, explode: 0, spread: 0.32, thin: 1, drop: 0, core: 0, night: 0, strips: 0, vis: 1 };
  const cur = { ...target };
  const intro = { v: 0 };
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let active = true, landed = false, shake = 0;

  window.addEventListener('pointermove', e => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  const camOut = { az: 0, el: 0, r: 0, tx: 0, ty: 0, tz: 0, fov: 0, shiftX: 0, shiftY: 0 };
  function camAt(t) {
    const i = clamp(Math.floor(t), 0, states.length - 2);
    const f = smooth(clamp(t - i));
    const a = states[i], b = states[i + 1];
    for (const k in camOut) camOut[k] = a[k] + (b[k] - a[k]) * f;
    return camOut;
  }

  let lastW = 0, lastH = 0;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    if (w === lastW && Math.abs(h - lastH) < 120) return;   // iOS toolbar show/hide
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    camera.aspect = w / h;
    states = S();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  const bg = new THREE.Color();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 4.2);
    for (const key in target) cur[key] += (target[key] - cur[key]) * k;
    mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-dt * 2.5));
    mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-dt * 2.5));

    canvas.style.opacity = cur.vis.toFixed(3);
    if (!active && cur.vis < 0.01) { requestAnimationFrame(frame); return; }

    // 7th slab drops in with a bounce; the logo itself has six
    const dropRaw = clamp(target.drop);
    const dropE = dropRaw <= 0 ? 0 : bounce(dropRaw);
    if (dropRaw > 0.36 && !landed) { landed = true; shake = 1; onLand(); }
    if (dropRaw < 0.05) landed = false;
    shake *= Math.exp(-dt * 7);

    // the construction line: building below, logo slabs above
    const built = clamp(cur.strips / FLOORS);
    const h = built <= 0.001 ? -1 : built * (TOP + 1.7) - 0.05;
    buildPlane.constant = h;
    slabPlane.constant = -h;
    building.visible = h > 0;
    scan.position.y = h;
    scanMat.opacity = h > 0.05 && h < TOP + 1.5 ? 0.95 : 0;

    // slabs grow from logo footprint to the building footprint
    const fp = smooth(clamp(cur.core));
    const ex = cur.explode;
    slabs.forEach((s, i) => {
      const introLocal = clamp(intro.v * 1.9 - i * 0.12);
      const introOff = (1 - easeOutExpo(introLocal)) * (5 + i * 0.6);
      const sp = cur.spread * i * 1.05;
      let y = s.baseY + ex * i * 0.95 + sp + introOff;
      let vis = introLocal > 0;
      if (i === FLOORS - 1) { y = s.baseY + ex * i * 0.95 + sp + (1 - dropE) * 11; vis = dropRaw > 0.001; }
      s.mesh.visible = vis && h < s.baseY + H / 2 + 0.01;
      s.mesh.position.set(Math.sin(s.seed + time * 0.6) * 0.06 * ex, y + Math.sin(time * 0.9 + s.seed) * 0.03 * ex, Math.cos(s.seed) * 0.12 * ex);
      s.mesh.scale.set(lerp(1, BW / W, fp), 1, lerp(1 - cur.thin * 0.62, BD / D, fp));
      s.mesh.rotation.y = (i % 2 ? 1 : -1) * 0.22 * ex + Math.sin(time * 0.5 + s.seed) * 0.03 * ex;
    });

    // site grows in with the footprint
    site.visible = fp > 0.01;
    site.scale.setScalar(Math.max(0.001, fp));
    treeData.forEach((t, i) => {
      const g = easeOutExpo(clamp((fp - t.delay) / 0.5)) * t.s;
      mtx.makeScale(1, Math.max(0.001, g), 1).setPosition(t.x, 0.65 * g, t.z);
      trunks.setMatrixAt(i, mtx);
      t.lumps.forEach(([lx, ly, lz, ls], j) => {
        const sc = Math.max(0.001, g * ls);
        mtx.makeScale(sc, sc * 0.9, sc).setPosition(t.x + lx * g, (1.35 + ly) * g, t.z + lz * g);
        crowns.setMatrixAt(i * 3 + j, mtx);
      });
    });
    trunks.instanceMatrix.needsUpdate = true; crowns.instanceMatrix.needsUpdate = true;

    // day → night
    const n = cur.night;
    bg.copy(BG_DAY).lerp(BG_NIGHT, n);
    scene.background.copy(bg); scene.fog.color.copy(bg);
    hemi.intensity = 0.9 - n * 0.78;
    key.intensity = 2.2 - n * 2.08;
    rim.intensity = 0.7 + n * 0.3;
    M.led.color.copy(LED_DAY).lerp(LED_NIGHT, n);
    M.glassLit.emissiveIntensity = n * 2.6;
    lampHeadMat.color.setRGB(1, 0.88, 0.72).multiplyScalar(0.6 + n * 4);
    slabMat.color.setRGB(0.97, 0.97, 0.95).lerp(bg, n * 0.6);
    if (bloom) { bloom.strength = 0.2 + n * 0.45; bloom.radius = 0.35 - n * 0.1; }
    envMats.forEach(m => { m.envMapIntensity = m.userData.env * (1 - n * 0.9); });
    dustMat.opacity = 0.5 - n * 0.25;
    dust.rotation.y = time * 0.012;
    dust.position.y = Math.sin(time * 0.2) * 0.3;

    // camera: orbit coordinates + idle drift + pointer parallax
    const c = camAt(cur.camT);
    const r = c.r * (1 + (1 - easeOutExpo(intro.v)) * 0.35);
    const az = c.az + Math.sin(time * 0.17) * 0.05 + mouse.sx * 0.12;
    const el = c.el + Math.cos(time * 0.13) * 0.025 - mouse.sy * 0.06;
    tmp.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(r);
    camera.position.set(c.tx + tmp.x, c.ty + tmp.y + (Math.random() - 0.5) * shake * 0.08, c.tz + tmp.z);
    camera.lookAt(c.tx, c.ty, c.tz);
    camera.fov = c.fov;
    const w = window.innerWidth, hh = window.innerHeight;
    camera.setViewOffset(w, hh, -c.shiftX * w, c.shiftY * hh, w, hh);
    camera.updateProjectionMatrix();

    if (composer) composer.render(); else renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return { target, intro, setActive(v) { active = v; } };
}
