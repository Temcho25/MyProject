// 3D-сцена: кроссовок из 4 слоёв (разрез по высоте), сценарий движения задаётся прокруткой.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const COLORWAYS = [
  { key: 'bred', name: 'Bred', sub: 'Чёрный · Красный', accent: '#e3141e' },
  { key: 'royal', name: 'Royal', sub: 'Синий · Чёрный', accent: '#2f5bff' },
  { key: 'chicago', name: 'Chicago', sub: 'Красный · Белый', accent: '#ff2a36' },
  { key: 'shadow', name: 'Shadow', sub: 'Серый · Чёрный', accent: '#9aa0aa' },
  { key: 'pine', name: 'Pine Green', sub: 'Зелёный · Чёрный', accent: '#14a364' },
];

// слои по высоте (локальная Y модели), снизу вверх
const BANDS = [-0.6, -0.42, -0.27, -0.02, 0.62];
const SLICE_OFF = [  // разлёт: [dy, dx, rz, ry]
  [-0.62, 0.06, 0.05, -0.10],
  [-0.20, -0.04, -0.03, 0.06],
  [0.24, 0.05, 0.04, -0.05],
  [0.70, -0.08, -0.07, 0.12],
];

// ── ключевые кадры по оси сюжета s ∈ [0,5]; одинаковые s подряд = монтажная склейка
//      s     x     y     z     rx     ry     rz    sc   explode  az   el   dist  ty
const KEYS = [
  [0.00, 0.62, -0.02, 0.0, 0.10, -0.70, 0.16, 1.00, 0, -10, 6, 7.3, 0.0],
  [0.50, 0.78, 0.06, 0.0, 0.06, -0.10, 0.12, 1.00, 0, 4, 10, 7.0, 0.0],
  [1.00, 0.00, 0.02, 0.0, 0.00, 0.00, 0.02, 1.08, 0, 0, 4, 6.9, 0.0],
  [1.14, 0.00, 0.02, 0.0, 0.00, 0.10, 0.00, 1.06, 0.06, 6, 8, 7.0, 0.0],
  [1.44, 0.45, 0.06, 0.0, 0.05, 0.42, 0.00, 1.00, 1, 30, 20, 8.6, 0.1],
  [1.70, 0.45, 0.06, 0.0, 0.06, 0.78, 0.00, 1.00, 1, 42, 24, 8.8, 0.1],
  [1.90, 0.10, 0.00, 0.0, 0.00, 1.20, 0.00, 1.00, 0, 22, 10, 7.4, 0.0],
  [2.00, 0.30, 0.00, 0.0, 0.00, 1.45, 0.00, 1.02, 0, 14, 8, 7.2, 0.0],
  [2.50, 0.30, 0.04, 0.0, 0.06, 1.45 + 3.9, 0.04, 1.02, 0, 0, 12, 7.0, 0.0],
  [2.96, 0.30, 0.00, 0.0, 0.00, 1.45 + 7.85, 0.00, 1.02, 0, -8, 8, 7.2, 0.0],
  [3.10, -0.20, 0.70, 0.3, -0.45, 10.0, 0.55, 0.95, 0, -10, 6, 7.4, 0.0],
  [3.32, -1.20, 3.60, 0.6, -0.95, 10.9, 1.10, 0.85, 0, -10, 6, 7.4, 0.0],
  [3.32, 1.80, -3.60, 0.0, 0.40, 2.20, -0.40, 0.85, 0, 8, 10, 7.4, 0.0],
  [3.92, 1.80, -3.40, 0.0, 0.40, 2.20, -0.40, 0.85, 0, 8, 10, 7.4, 0.0],
  [4.45, 1.30, -0.10, 0.0, 0.12, 0.70, 0.14, 0.92, 0, 4, 8, 7.2, 0.0],
  [5.00, 1.25, 0.10, 0.0, 0.08, 0.20, 0.10, 0.92, 0, -6, 6, 7.0, 0.0],
];
const NCH = KEYS[0].length - 1;

function sample(s) {
  const out = new Array(NCH);
  const n = KEYS.length;
  if (s <= KEYS[0][0]) return KEYS[0].slice(1);
  if (s >= KEYS[n - 1][0]) return KEYS[n - 1].slice(1);
  let i = 0; while (i < n - 2 && !(s >= KEYS[i][0] && s < KEYS[i + 1][0])) i++;
  while (KEYS[i + 1][0] === KEYS[i][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1], h = b[0] - a[0], t = (s - a[0]) / h;
  const prev = i > 0 && KEYS[i - 1][0] < a[0] ? KEYS[i - 1] : null;
  const next = i + 2 < n && KEYS[i + 2][0] > b[0] ? KEYS[i + 2] : null;
  const t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  for (let c = 1; c <= NCH; c++) {
    const m0 = prev ? (b[c] - prev[c]) / (b[0] - prev[0]) : (b[c] - a[c]) / h;
    const m1 = next ? (next[c] - a[c]) / (next[0] - a[0]) : (b[c] - a[c]) / h;
    // монотонность: где соседние сегменты стоят на месте, не даём перелёта
    const flatL = prev && Math.abs(a[c] - prev[c]) < 1e-6, flatR = next && Math.abs(next[c] - b[c]) < 1e-6;
    out[c - 1] = h00 * a[c] + h10 * h * (flatL ? 0 : m0) + h01 * b[c] + h11 * h * (flatR ? 0 : m1);
  }
  return out;
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = x => x * x * (3 - 2 * x);
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

export async function createScene(canvas, { onProgress = () => {}, capture = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: capture });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pm.dispose();

  // свет: ключевой, контровой цветной, холодная заливка
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.PointLight(0xe3141e, 40, 14, 1.6); rim.position.set(1.5, 1.6, -2.6); scene.add(rim);
  const rim2 = new THREE.PointLight(0xe3141e, 18, 12, 1.6); rim2.position.set(-2.6, -0.4, -1.8); scene.add(rim2);
  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.5); fill.position.set(4, -1, 3); scene.add(fill);

  // ── загрузка
  const manager = new THREE.LoadingManager();
  let loaded = 0; const total = 1 + COLORWAYS.length;
  const tick = () => onProgress(++loaded / total);
  const texLoader = new THREE.TextureLoader(manager);
  const loadTex = url => new Promise((res, rej) => texLoader.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); tick(); res(t); }, undefined, rej));
  const gltfP = new Promise((res, rej) => new GLTFLoader(manager).load('assets/shoe-lite.glb', g => { tick(); res(g); }, undefined, rej));
  const [gltf, ...maps] = await Promise.all([gltfP, ...COLORWAYS.map(c => loadTex(`assets/cw-${c.key}.jpg`))]);

  let srcMesh; gltf.scene.traverse(o => { if (o.isMesh && !srcMesh) srcMesh = o; });
  const geo = srcMesh.geometry; geo.computeBoundingBox();
  const base = srcMesh.material;

  // общие юниформы для перекраски «волной»
  const U = {
    uMap2: { value: maps[0] }, uMix: { value: 0 }, uGlow: { value: new THREE.Color(0xe3141e) },
    uInner: { value: new THREE.Color(0x7a0a10) },
  };
  const makeMat = () => {
    const m = new THREE.MeshPhysicalMaterial({
      map: maps[0], normalMap: base.normalMap, roughnessMap: base.roughnessMap, metalnessMap: base.metalnessMap, aoMap: base.aoMap,
      roughness: 1, metalness: 1, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x777777),
      side: THREE.DoubleSide, clipShadows: true,
    });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;\nuniform sampler2D uMap2;\nuniform float uMix;\nuniform vec3 uGlow;\nuniform vec3 uInner;\nfloat gSweep;')
        .replace('#include <map_fragment>', `
          vec4 c1 = texture2D(map, vMapUv);
          vec4 c2 = texture2D(uMap2, vMapUv);
          float edge = mix(1.25, -1.25, uMix) + sin(vLocal.y * 9.0) * 0.04;
          float k = smoothstep(edge - 0.05, edge + 0.05, vLocal.x);
          gSweep = (1.0 - abs(k * 2.0 - 1.0)) * step(0.001, uMix) * step(uMix, 0.999);
          diffuseColor *= mix(c1, c2, k);`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uGlow * gSweep * 2.2;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (!gl_FrontFacing) gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.35, uInner, 0.55);');
    };
    return m;
  };

  // ── 4 слоя с плоскостями отсечения (плоскости живут в мировых координатах — обновляем каждый кадр)
  const shoe = new THREE.Group(); scene.add(shoe);
  const pivot = new THREE.Group(); shoe.add(pivot);
  const slices = [];
  for (let i = 0; i < 4; i++) {
    const mat = makeMat();
    const lo = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BANDS[i]);
    const hi = new THREE.Plane(new THREE.Vector3(0, -1, 0), BANDS[i + 1]);
    mat.clippingPlanes = [lo.clone(), hi.clone()];
    const holder = new THREE.Group();
    const mesh = new THREE.Mesh(geo, mat);
    holder.add(mesh); pivot.add(holder);
    // светящийся срез — тонкое кольцо по контуру среза задаём «кромкой» через плоскость отсечения
    slices.push({ holder, mesh, mat, local: [lo, hi] });
  }
  // модель: X — длина, Y — высота; носок смотрит в −X → разворачиваем носком вправо
  pivot.rotation.y = Math.PI;

  // мягкая тень на «полу»
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.45, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
  // светящаяся линия пола под кроссовком (цвет акцента)
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xe3141e, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, map: shadowTex }));
  floorGlow.rotation.x = -Math.PI / 2; scene.add(floorGlow);

  // пыль в луче: три глубинных плана
  const dust = (() => {
    const N = 520, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 14; pos[i * 3 + 1] = (Math.random() - 0.5) * 8; pos[i * 3 + 2] = -6 + Math.random() * 10; seed[i] = Math.random(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uVel: { value: 0 }, uColor: { value: new THREE.Color(0xffd9d9) }, uPR: { value: 1 } },
      vertexShader: `attribute float seed; uniform float uTime; uniform float uVel; uniform float uPR; varying float vA;
        void main(){ vec3 p = position; p.y += mod(uTime*0.05*(0.4+seed) + seed*8.0 + uVel*0.0, 8.0) - 4.0; p.x += sin(uTime*0.3+seed*20.0)*0.2;
          vec4 mv = modelViewMatrix * vec4(p,1.0); gl_Position = projectionMatrix * mv;
          float d = -mv.z; gl_PointSize = uPR * (1.5 + seed*3.0) * (1.0 + abs(d-7.0)*0.9) * (10.0/d);
          vA = (0.25 + seed*0.5) * smoothstep(15.0, 6.0, d) / (1.0 + abs(d-7.0)*0.6); }`,
      fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ vec2 c = gl_PointCoord-0.5; float r = length(c); float a = smoothstep(0.5,0.0,r); gl_FragColor = vec4(uColor, a*vA); }`,
    });
    const p = new THREE.Points(g, m); scene.add(p); return p;
  })();

  // ── состояние
  const st = {
    s: 0, mouseX: 0, mouseY: 0, cw: 0, intro: 0, vel: 0,
    accent: new THREE.Color(0xe3141e), accentTarget: new THREE.Color(0xe3141e),
  };
  let cwCur = 0, cwNext = 0, mixT = 1, queued = null;
  function setColorway(i) {
    if (i === cwNext && mixT < 1) return;
    if (mixT < 1) { queued = i; return; }
    if (i === cwCur) return;
    cwNext = i; U.uMap2.value = maps[i]; mixT = 0;
    st.accentTarget.set(COLORWAYS[i].accent);
  }

  const tmpM = new THREE.Matrix4(), tmpV = new THREE.Vector3();
  const anchorsLocal = [
    new THREE.Vector3(-0.55, -0.52, 0.3), new THREE.Vector3(0.45, -0.36, 0.34),
    new THREE.Vector3(-0.05, -0.05, 0.38), new THREE.Vector3(0.45, 0.32, 0.12),
  ];
  const anchorsScreen = anchorsLocal.map(() => ({ x: 0, y: 0, v: 0 }));

  let W = 1, H = 1;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let pr = dpr; if (W * H * pr * pr > 5.5e6) pr = Math.sqrt(5.5e6 / (W * H));
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    dust.material.uniforms.uPR.value = pr;
  }
  resize();

  let explodeOut = 0;
  function update(dt, time) {
    const asp = W / H, portrait = asp < 0.85;
    const k = sample(st.s);
    let [x, y, z, rx, ry, rz, sc, ex, az, el, dist, ty] = k;
    ex = clamp(ex); explodeOut = ex;
    if (portrait) {
      x *= 0.12;
      const sp = st.s;
      if (sp < 1) y += 0.62 * (1 - smooth(clamp(sp)));
      else if (sp > 3.9) y += 0.75 * smooth(clamp((sp - 3.9) / 0.5)) + 3.2 * smooth(clamp((sp - 4.5) / 0.45));
      else if (sp > 1.95 && sp < 3) y += 0.25;
      x += 0.42 * ex;
    }
    // вступление: пара «падает» в кадр с весом и оседает
    const it = st.intro, drop = 1 - it;
    const settle = Math.sin(it * Math.PI * 2.5) * Math.exp(-it * 4) * 0.12;
    y += drop * drop * 2.6 + settle;
    rz += drop * 0.6; ry -= drop * 1.4;

    // «дыхание» и реакция на мышь
    y += Math.sin(time * 1.1) * 0.035 * (1 - ex * 0.5);
    rz += Math.sin(time * 0.8 + 1) * 0.015;
    shoe.position.set(x, y, z);
    shoe.rotation.set(rx + st.mouseY * 0.08, ry + st.mouseX * 0.18, rz, 'YXZ');
    shoe.scale.setScalar(sc * (portrait ? 0.82 : 1) * 1.08);

    // разлёт слоёв со сдвигом по времени
    slices.forEach((sl, i) => {
      const e = smooth(clamp(ex * 1.35 - (3 - i) * 0.1));
      const o = SLICE_OFF[i];
      sl.holder.position.set(o[1] * e, o[0] * e, 0);
      sl.holder.rotation.set(0, o[3] * e, o[2] * e);
    });
    shoe.updateMatrixWorld(true);
    slices.forEach(sl => {
      tmpM.copy(sl.holder.matrixWorld);
      sl.mat.clippingPlanes[0].copy(sl.local[0]).applyMatrix4(tmpM);
      sl.mat.clippingPlanes[1].copy(sl.local[1]).applyMatrix4(tmpM);
    });

    // камера: облёт вокруг цели + параллакс мыши
    const fit = portrait ? Math.pow(1 / Math.max(0.42, asp), 0.62) : (asp < 1.25 ? 1.12 : 1);
    const A = (az + st.mouseX * 3) * Math.PI / 180, B = (el - st.mouseY * 2) * Math.PI / 180, D = dist * fit;
    camera.position.set(D * Math.sin(A) * Math.cos(B), ty + D * Math.sin(B), D * Math.cos(A) * Math.cos(B));
    camera.lookAt(0, ty, 0);

    // тень и свечение пола
    const floorY = -0.98;
    const hgt = Math.max(0, y - 0.5 * sc - floorY);
    shadow.position.set(x, floorY, z); floorGlow.position.set(x, floorY + 0.001, z);
    const sw = 2.6 * sc * (1 + hgt * 0.5);
    shadow.scale.set(sw, sw * 0.42, 1); floorGlow.scale.set(sw * 1.5, sw * 0.6, 1);
    const vis = clamp(1 - Math.abs(y) / 2.2);
    shadow.material.opacity = vis * clamp(1 - hgt * 0.6) * (1 - ex * 0.6) * 0.9;
    floorGlow.material.opacity = vis * 0.35 * (1 - ex * 0.5);

    // цвет: волна перекраски
    if (mixT < 1) {
      mixT = Math.min(1, mixT + dt / 1.05);
      U.uMix.value = smooth(mixT);
      if (mixT >= 1) {
        cwCur = cwNext; slices.forEach(sl => { sl.mat.map = maps[cwCur]; }); U.uMix.value = 0;
        if (queued !== null && queued !== cwCur) { const q = queued; queued = null; setColorway(q); } else queued = null;
      }
    }
    st.accent.lerp(st.accentTarget, 1 - Math.exp(-dt * 3));
    U.uGlow.value.copy(st.accent); rim.color.copy(st.accent); rim2.color.copy(st.accent); floorGlow.material.color.copy(st.accent);
    U.uInner.value.copy(st.accent).multiplyScalar(0.55);
    rim.intensity = 40 + ex * 30; key.intensity = 2.4 * (0.25 + 0.75 * smooth(clamp(st.intro * 1.4)));

    dust.material.uniforms.uTime.value = time;
    dust.rotation.y = st.s * 0.25 + st.mouseX * 0.05;

    // проекции якорей для подписей анатомии
    anchorsLocal.forEach((a, i) => {
      tmpV.copy(a); slices[i].holder.localToWorld(tmpV); tmpV.project(camera);
      anchorsScreen[i].x = (tmpV.x * 0.5 + 0.5) * W; anchorsScreen[i].y = (-tmpV.y * 0.5 + 0.5) * H;
      anchorsScreen[i].v = tmpV.z < 1 ? 1 : 0;
    });
    renderer.render(scene, camera);
  }

  renderer.compile(scene, camera);
  return {
    state: st, update, resize, setColorway, anchors: anchorsScreen,
    get explode() { return explodeOut; }, get colorway() { return cwNext; },
    snapshot(cwIndex, rotY, w, h) {           // для карточек
      slices.forEach(sl => { sl.mat.map = maps[cwIndex]; }); U.uMix.value = 0; cwCur = cwNext = cwIndex;
      st.accent.set(COLORWAYS[cwIndex].accent); st.accentTarget.copy(st.accent);
      shadow.visible = floorGlow.visible = dust.visible = false;
      st.s = 1; st.intro = 1;
      renderer.setPixelRatio(1); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); W = w; H = h;
      update(0, 0);
      shoe.position.set(0, 0.05, 0); shoe.rotation.set(0.08, rotY, 0.12, 'YXZ'); shoe.updateMatrixWorld(true);
      slices.forEach(sl => { sl.mat.clippingPlanes[0].copy(sl.local[0]).applyMatrix4(sl.holder.matrixWorld); sl.mat.clippingPlanes[1].copy(sl.local[1]).applyMatrix4(sl.holder.matrixWorld); });
      camera.position.set(0.6, 1.2, 6.2); camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    },
  };
}
