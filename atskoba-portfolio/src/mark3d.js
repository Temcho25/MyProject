// The Atskoba "a." mark in 3D: a lacquered ring and stem plus a wine dot, with a soft contact
// shadow. It assembles on load, follows the cursor, turns away as the hero scrolls out, and
// returns in polished chrome on the dark contact section.
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, ACESFilmicToneMapping, SRGBColorSpace,
  Group, Shape, Path, ExtrudeGeometry, SphereGeometry, PlaneGeometry, Mesh, MeshPhysicalMaterial,
  MeshBasicMaterial, CanvasTexture, DirectionalLight, Color, MathUtils,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const damp = (a, b, k, dt) => MathUtils.lerp(a, b, 1 - Math.exp(-k * dt));

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

export function createMark(canvas, { mobile, reduced }) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
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

  const ringShape = new Shape();
  ringShape.absarc(40 - CX, CY - 60, 30, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(40 - CX, CY - 60, 15, 0, Math.PI * 2, true);
  ringShape.holes.push(hole);
  const ringGeo = new ExtrudeGeometry(ringShape, ext);
  ringGeo.translate(0, 0, -6);

  const sx = 60 - CX, sy = CY - 30;
  const stemShape = new Shape();
  stemShape.moveTo(sx, sy); stemShape.lineTo(sx + 15, sy); stemShape.lineTo(sx + 15, sy - 60); stemShape.lineTo(sx, sy - 60); stemShape.closePath();
  const stemGeo = new ExtrudeGeometry(stemShape, ext);
  stemGeo.translate(0, 0, -6);

  const lacquer = new MeshPhysicalMaterial({
    color: 0x111110, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.1,
  });
  const wine = new MeshPhysicalMaterial({
    color: 0x7d1d2c, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2,
  });
  const black = new Color(0x111110), chrome = new Color(0xe9e7e1);
  const wineA = new Color(0x7d1d2c), wineB = new Color(0xc23a4b);

  const mark = new Group();
  const inner = new Group();
  inner.scale.setScalar(1 / 85); // the mark is ~85 units wide → 1 world unit
  mark.add(inner);
  const ring = new Mesh(ringGeo, lacquer);
  const stem = new Mesh(stemGeo, lacquer);
  const dot = new Mesh(new SphereGeometry(8, 96, 64), wine);
  const dotHome = { x: 88 - CX, y: CY - 83 };
  inner.add(ring, stem, dot);
  scene.add(mark);

  const shadow = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  // ---- Public state, driven from home.js
  const state = {
    ring: 0, stem: 0, dot: 0, // assembly progress per piece, 0 → 1
    out: 0,                   // hero scrolled away, 0 → 1
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

  let time = 0, last = performance.now(), raf = 0, running = true;
  const sm = { out: 0, fin: 0 };

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
    const { out, fin } = sm;

    const visible = out < 0.995 || fin > 0.005;
    canvas.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return; // nothing on screen: skip the GPU work

    // Assembly: ring rolls in from the right, stem drops in, the dot lands last.
    const r = state.ring, s = state.stem, d = state.dot;
    ring.position.set((1 - r) * 110, 0, 0);
    ring.rotation.z = (1 - r) * -Math.PI * 1.5;
    stem.position.set(0, (1 - s) * 130, 0);
    dot.position.set(dotHome.x, dotHome.y + (1 - d) * 150, 0);
    dot.visible = d > 0.001;

    // Placement in world units from viewport fractions.
    const size = mobile ? Math.min(worldW * 0.46, worldH * 0.26) : Math.min(worldW * 0.27, worldH * 0.42);
    let px, py;
    const finSize = mobile ? 0.72 : 1;
    if (fin > 0.001) {
      px = mobile ? worldW * 0.2 : worldW * 0.25;
      py = (mobile ? worldH * 0.33 : worldH * 0.1) - (1 - fin) * worldH * 0.9; // rises from below
    } else {
      px = mobile ? worldW * 0.18 : worldW * 0.23;
      py = (mobile ? worldH * 0.25 : worldH * 0.07) + out * worldH * 0.75; // drifts up and away
    }
    const idle = reduced ? 0 : 1;
    mark.position.set(px, py + Math.sin(time * 0.9) * 0.05 * idle, 0);
    mark.scale.setScalar(size * (1 - out * 0.12 * (1 - fin)) * MathUtils.lerp(1, finSize, fin));
    mark.rotation.set(
      0.16 + Math.sin(time * 0.6) * 0.05 * idle + mouse.y * 0.2 - out * 0.5 * (1 - fin),
      -0.42 + Math.sin(time * 0.4) * 0.12 * idle + mouse.x * 0.32 + out * 1.4 * (1 - fin) + fin * 0.1,
      Math.sin(time * 0.5) * 0.02 * idle,
    );

    // Soft contact shadow (hidden on the dark section).
    shadow.position.set(mark.position.x, mark.position.y - size * 0.6, -0.4);
    shadow.scale.set(size * 1.3, size * 0.55, 1);
    shadow.material.opacity = (1 - fin) * (1 - out) * Math.min(r, s);

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
