// The Atskoba "a." mark in 3D — the hero character of the page.
// Hero: it assembles (ring rolls in, stem drops, dot lands) and floats over a contact shadow,
//       with smaller lacquer parts drifting at several depths behind it (atmospheric depth).
// Services: a pinned scroll scene takes it apart, one chapter per service:
//   0 3D & WebGL — ring comes forward, wireframe edges show the construction
//   1 Motion     — the dot orbits the ring with a trail of ghost dots
//   2 Design     — pieces lie flat on a blueprint grid like a spec sheet
//   3 Launch     — everything snaps back together
// Contact: it returns in polished chrome on the dark section.
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, ACESFilmicToneMapping, SRGBColorSpace,
  Group, Shape, Path, ExtrudeGeometry, SphereGeometry, PlaneGeometry, TorusGeometry, BoxGeometry, Mesh,
  MeshPhysicalMaterial, MeshBasicMaterial, CanvasTexture, DirectionalLight, Color, MathUtils, Fog,
  EdgesGeometry, LineSegments, LineBasicMaterial, GridHelper, Vector3,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const damp = (a, b, k, dt) => MathUtils.lerp(a, b, 1 - Math.exp(-k * dt));
const sstep = (a, b, x) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// Weight of chapter i (0..3) at chapter position k (0..4): rises in, holds, hands over.
const bump = (k, i) => sstep(i - 0.35, i + 0.15, k) * (1 - sstep(i + 0.85, i + 1.35, k));

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(13,13,11,0.42)');
  grd.addColorStop(0.45, 'rgba(13,13,11,0.16)');
  grd.addColorStop(1, 'rgba(13,13,11,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function createMark(canvas, { mobile, reduced, lowEnd }) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  // Fog in the page colour: far parts melt into the background instead of being blurred.
  scene.fog = new Fog(0xeeece7, 12, 30);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 14);
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 5, 6);
  scene.add(key);

  // ---- Geometry in logo units (SVG viewBox), centred on the mark.
  const CX = 52.5, CY = 60;
  const ext = { depth: 12, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.4, bevelSegments: 12, curveSegments: 128 };
  const ringC = { x: 40 - CX, y: CY - 60 };

  const ringShape = new Shape();
  ringShape.absarc(ringC.x, ringC.y, 30, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(ringC.x, ringC.y, 15, 0, Math.PI * 2, true);
  ringShape.holes.push(hole);
  const ringGeo = new ExtrudeGeometry(ringShape, ext);
  ringGeo.translate(-ringC.x, -ringC.y, -6); // pivot at the ring centre
  const sx = 60 - CX, sy = CY - 30;
  const stemShape = new Shape();
  stemShape.moveTo(sx, sy); stemShape.lineTo(sx + 15, sy); stemShape.lineTo(sx + 15, sy - 60); stemShape.lineTo(sx, sy - 60); stemShape.closePath();
  const stemGeo = new ExtrudeGeometry(stemShape, ext);
  const stemC = { x: sx + 7.5, y: sy - 30 };
  stemGeo.translate(-stemC.x, -stemC.y, -6); // pivot at the stem centre
  const dotGeo = new SphereGeometry(8, 96, 64);

  const lacquer = new MeshPhysicalMaterial({
    color: 0x111110, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.1,
  });
  const wine = new MeshPhysicalMaterial({
    color: 0x7d1d2c, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2,
  });
  const black = new Color(0x111110), chrome = new Color(0xe9e7e1);
  const wineA = new Color(0x7d1d2c), wineB = new Color(0xc23a4b);
  const edgeMat = new LineBasicMaterial({ color: 0x7d1d2c, transparent: true, opacity: 0, depthTest: false });

  const mark = new Group();
  const inner = new Group();
  inner.scale.setScalar(1 / 85); // the mark is ~85 units wide → 1 world unit
  mark.add(inner);
  const ring = new Mesh(ringGeo, lacquer);
  const stem = new Mesh(stemGeo, lacquer);
  const dot = new Mesh(dotGeo, wine);
  ring.add(new LineSegments(new EdgesGeometry(ringGeo, 25), edgeMat));
  stem.add(new LineSegments(new EdgesGeometry(stemGeo, 25), edgeMat));
  const dotHome = { x: 88 - CX, y: CY - 83 };
  inner.add(ring, stem, dot);
  // "Construction" ghosts: wireframe copies that slide out behind the solid pieces.
  const wireMat = new MeshBasicMaterial({ color: 0x7d1d2c, wireframe: true, transparent: true, opacity: 0, depthWrite: false });
  const ringGhost = new Mesh(ringGeo, wireMat);
  const stemGhost = new Mesh(stemGeo, wireMat);
  inner.add(ringGhost, stemGhost);

  // Motion trail: ghost dots behind the orbiting dot.
  const trail = [];
  for (let i = 0; i < 9; i++) {
    const m = new Mesh(dotGeo, new MeshBasicMaterial({ color: 0x7d1d2c, transparent: true, opacity: 0 }));
    trail.push(m);
    inner.add(m);
  }

  // Blueprint grid for the design chapter.
  const grid = new GridHelper(200, 20, 0x7d1d2c, 0x0d0d0b);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -30;
  grid.material.transparent = true;
  grid.material.opacity = 0;
  grid.material.depthWrite = false;
  inner.add(grid);
  scene.add(mark);

  const shadow = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  // ---- Floating parts at several depths (mid and far planes).
  const parts = [];
  if (!lowEnd) {
    const geos = [new TorusGeometry(0.5, 0.22, 32, 96), new BoxGeometry(0.28, 1.1, 0.28), new SphereGeometry(0.26, 48, 32)];
    const count = mobile ? 6 : 12;
    for (let i = 0; i < count; i++) {
      const kind = i % 3;
      const m = new Mesh(geos[kind], kind === 2 ? wine : lacquer);
      const depth = -3 - Math.random() * 12;
      m.userData = {
        // x/y in viewport fractions: desktop keeps them right of the text column, phones above it.
        base: new Vector3(mobile ? (Math.random() - 0.5) * 0.9 : 0.17 + Math.random() * 0.31,
          mobile ? 0.12 + Math.random() * 0.3 : Math.random() * 0.72 - 0.42, depth), // clear of the nav band
        spin: new Vector3(Math.random() - 0.5, Math.random() - 0.5, 0).multiplyScalar(0.6),
        phase: Math.random() * Math.PI * 2,
        par: 0.4 + (1 + depth / 15) * 0.6, // nearer parts move more with scroll
      };
      m.userData.size = 0.5 + Math.random() * 0.7;
      m.scale.setScalar(m.userData.size);
      parts.push(m);
      scene.add(m);
    }
  }

  // ---- Public state, driven from home.js
  const state = {
    ring: 0, stem: 0, dot: 0, // intro assembly per piece, 0 → 1
    out: 0,                   // hero scrolled away, 0 → 1
    svcOn: 0,                 // services scene on screen, 0 → 1
    svc: 0,                   // chapter position inside services, 0 → 4
    fin: 0,                   // contact section in view, 0 → 1
  };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let vw = 0, vh = 0, worldH = 1, worldW = 1;
  function resize() {
    // The canvas is 100lvh tall, so mobile toolbars don't change it; always match its real CSS
    // box so the drawing buffer is never stretched.
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    if (w === vw && h === vh) return;
    vw = w; vh = h;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    worldH = 2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    worldW = worldH * camera.aspect;
  }
  resize();
  window.addEventListener('resize', resize);

  const O = { x: 0, y: 0, z: 0 }, O2 = { x: 0, y: 0, z: 0 };
  // Dot orbit around the ring (motion chapter), written into a reused object.
  function orbit(a, out) {
    out.x = ringC.x + Math.cos(a) * 52; out.y = ringC.y + Math.sin(a) * 40; out.z = Math.sin(a) * 18;
  }
  let time = 0, last = performance.now(), raf = 0, running = true;
  const sm = { out: 0, fin: 0, on: 0, k: 0 };

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    mouse.x = damp(mouse.x, mouse.tx, 2.5, dt);
    mouse.y = damp(mouse.y, mouse.ty, 2.5, dt);
    sm.out = damp(sm.out, state.out, 9, dt);
    sm.fin = damp(sm.fin, state.fin, 7, dt);
    sm.on = damp(sm.on, state.svcOn, 7, dt);
    sm.k = damp(sm.k, state.svc, 6, dt);
    const { out, fin, on, k } = sm;

    const heroVis = 1 - out;
    const visible = heroVis > 0.005 || on > 0.005 || fin > 0.005;
    canvas.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return; // nothing on screen: skip the GPU work

    const idle = reduced ? 0 : 1;
    const w0 = bump(k, 0) * on, w1 = bump(k, 1) * on, w2 = bump(k, 2) * on;

    // ---- Pieces: intro assembly + services chapter poses (in logo units).
    const r = state.ring, s = state.stem, d = state.dot;
    // Chapter 1 (3D): ring forward and turned, edges visible.
    // Chapter 3 (design): flat layout, spread apart on the grid.
    ring.position.set(
      ringC.x + (1 - r) * 110 + w2 * -26,
      ringC.y + w2 * 8,
      w0 * 34,
    );
    ring.rotation.set(w0 * 0.5, w0 * -0.7 + w1 * 0.25, (1 - r) * -Math.PI * 1.5);
    stem.position.set(stemC.x + w2 * 22 + w0 * 10, stemC.y + (1 - s) * 130 + w2 * 8, w0 * -14);
    stem.rotation.set(0, w0 * 0.4, w1 * 0.18);
    // Chapter 2 (motion): dot orbits the ring.
    const orbitA = time * 1.6;
    orbit(orbitA, O);
    const o = O;
    dot.position.set(
      MathUtils.lerp(dotHome.x + w2 * 30, o.x, w1),
      MathUtils.lerp(dotHome.y + (1 - d) * 150 + w2 * 8, o.y, w1),
      MathUtils.lerp(w0 * 8, o.z, w1),
    );
    dot.visible = d > 0.001;
    for (let i = 0; i < trail.length; i++) {
      const m = trail[i];
      orbit(orbitA - (i + 1) * 0.16, O2);
      m.position.set(O2.x, O2.y, O2.z);
      m.scale.setScalar(1 - (i + 1) * 0.08);
      m.material.opacity = w1 * (0.42 - i * 0.045);
      m.visible = w1 > 0.01;
    }
    edgeMat.opacity = Math.min(1, w0 * 1.1 + w2 * 0.8);
    wireMat.opacity = w0 * 0.28;
    ringGhost.visible = stemGhost.visible = w0 > 0.01;
    ringGhost.position.set(ring.position.x - w0 * 30, ring.position.y + w0 * 6, ring.position.z - w0 * 46);
    ringGhost.rotation.copy(ring.rotation);
    stemGhost.position.set(stem.position.x + w0 * 26, stem.position.y + w0 * 4, stem.position.z - w0 * 40);
    stemGhost.rotation.copy(stem.rotation);
    grid.material.opacity = w2 * 0.16;
    grid.visible = w2 > 0.01;

    // ---- Placement in world units from viewport fractions.
    const size = mobile ? Math.min(worldW * 0.46, worldH * 0.26) : Math.min(worldW * 0.27, worldH * 0.42);
    const svcSize = mobile ? Math.min(worldW * 0.62, worldH * 0.3) : Math.min(worldW * 0.3, worldH * 0.5);
    let px, py, sc;
    if (fin > 0.001) {
      px = mobile ? worldW * 0.2 : worldW * 0.25;
      py = (mobile ? worldH * 0.33 : worldH * 0.1) - (1 - fin) * worldH * 0.9; // rises from below
      sc = size * (mobile ? 0.72 : 1);
    } else if (on > 0.001 && out > 0.9) {
      px = mobile ? 0 : worldW * 0.2;
      py = (mobile ? worldH * 0.2 : 0) - (1 - on) * worldH * 0.9 * (state.svc < 2 ? 1 : -1);
      sc = svcSize;
    } else {
      px = mobile ? worldW * 0.18 : worldW * 0.23;
      py = (mobile ? worldH * 0.25 : worldH * 0.07) + out * worldH * 0.75; // drifts up and away
      sc = size * (1 - out * 0.12);
    }
    mark.position.set(px, py + Math.sin(time * 0.9) * 0.05 * idle, 0);
    mark.scale.setScalar(sc);

    // Continuous camera-like orbit: the mark turns through the services chapters.
    const flat = w2; // design chapter faces the viewer
    mark.rotation.set(
      (0.16 + Math.sin(time * 0.6) * 0.05 * idle + mouse.y * 0.2) * (1 - flat) - out * 0.5 * (1 - on) * (1 - fin),
      (-0.42 + Math.sin(time * 0.4) * 0.12 * idle + mouse.x * 0.32) * (1 - flat * 0.9)
        + out * 1.4 * (1 - on) * (1 - fin) + on * (k * 0.35 - 0.2) * (1 - flat) + fin * 0.1,
      Math.sin(time * 0.5) * 0.02 * idle,
    );

    // Soft contact shadow (hero only).
    shadow.position.set(mark.position.x, mark.position.y - sc * 0.6, -0.4);
    shadow.scale.set(sc * 1.3, sc * 0.55, 1);
    shadow.material.opacity = (1 - fin) * Math.max(heroVis * Math.min(r, s), on * (1 - w2) * 0.7);

    // Floating parts: visible in the hero and the services scene, parallax by depth.
    // Parts grow in/out smoothly while the hero or the pinned services scene owns the screen.
    const partsF = Math.max(sstep(0.2, 0.7, heroVis), sstep(0.75, 1, on)) * (1 - sstep(0, 0.05, fin));
    for (let i = 0; i < parts.length; i++) {
      const m = parts[i];
      const u = m.userData;
      m.visible = partsF > 0.01;
      if (!m.visible) continue;
      m.scale.setScalar(u.size * partsF);
      // Project the viewport fraction to the part's own depth so far parts stay on the same side.
      const zScale = (camera.position.z - u.base.z) / camera.position.z;
      m.position.set(
        u.base.x * worldW * zScale + Math.sin(time * 0.3 + u.phase) * 0.3,
        u.base.y * worldH * zScale + Math.cos(time * 0.25 + u.phase) * 0.25 + out * (1 - on) * u.par * 3,
        u.base.z,
      );
      m.rotation.x += u.spin.x * dt * idle;
      m.rotation.y += u.spin.y * dt * idle;
    }

    // Lacquer → chrome on the dark section.
    lacquer.color.lerpColors(black, chrome, fin);
    lacquer.metalness = fin;
    lacquer.roughness = MathUtils.lerp(0.2, 0.1, fin);
    wine.color.lerpColors(wineA, wineB, fin);
    renderer.toneMappingExposure = MathUtils.lerp(1.0, 1.15, fin);

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  const pause = () => { running = false; cancelAnimationFrame(raf); };
  const resume = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); pause(); });
  canvas.addEventListener('webglcontextrestored', resume);

  return { state };
}
