// WebGL background: the Atskoba mark built from three extruded pieces, floating in a
// foggy space with bokeh particles and small metal "parts". Scroll code drives it through
// `state` (assemble, flight, focus); the camera always drifts a little so the frame stays alive.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const PIECES = {
  l: [[4, 96], [34, 4], [46, 4], [17, 96]],
  r: [[96, 96], [66, 4], [54, 4], [83, 96]],
  x: [[30, 58], [70, 58], [73, 68], [27, 68]],
};

// Where each piece flies when the mark is taken apart.
const EXPLODE = {
  l: { p: [-3.4, 1.4, -1.6], r: [0.5, -0.9, 0.6] },
  r: { p: [3.6, -1.0, -1.2], r: [-0.4, 1.0, -0.5] },
  x: { p: [0.6, -2.8, 2.6], r: [1.4, 0.4, 0.3] },
};

const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

function softDot() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createScene(canvas, { mobile, reduced }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x0a0a0d, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0d, 0.055);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(mobile ? 50 : 38, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  // ---- Lights
  const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
  key.position.set(4, 6, 6);
  const rim = new THREE.DirectionalLight(0x8a7dff, 2.4);
  rim.position.set(-6, 2, -4);
  const glow = new THREE.PointLight(0xff5a1f, 18, 8, 1.6);
  scene.add(key, rim, glow, new THREE.AmbientLight(0x404050, 0.6));

  // ---- The mark
  const mark = new THREE.Group();
  scene.add(mark);
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0x2c2c35, metalness: 1, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.4,
  });
  const ember = new THREE.MeshPhysicalMaterial({
    color: 0xff5a1f, emissive: 0xff4a10, emissiveIntensity: 0.55, metalness: 0.1, roughness: 0.35, clearcoat: 1,
  });
  ember.toneMapped = false; // keep the brand orange exact instead of washed out by ACES
  const S = 0.034;
  const pieces = {};
  for (const [k, pts] of Object.entries(PIECES)) {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2((x - 50) * S, (50 - y) * S)));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: k === 'x' ? 0.5 : 0.7, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4,
    });
    geo.center();
    // Keep each piece's centre where it sits in the logo.
    const c = pts.reduce((a, [x, y]) => [a[0] + x / pts.length, a[1] + y / pts.length], [0, 0]);
    const mesh = new THREE.Mesh(geo, k === 'x' ? ember : metal);
    const holder = new THREE.Group();
    holder.add(mesh);
    holder.userData.home = new THREE.Vector3((c[0] - 50) * S, (50 - c[1]) * S, k === 'x' ? 0.1 : 0);
    holder.position.copy(holder.userData.home);
    mark.add(holder);
    pieces[k] = holder;
  }

  // ---- Floating parts: small bevelled blocks that drift around the mark (mid-ground depth)
  const partCount = mobile ? 18 : 42;
  const partGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const parts = new THREE.InstancedMesh(partGeo, metal, partCount);
  const partData = [];
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < partCount; i++) {
    partData.push({
      r: 2.6 + Math.random() * 4.5, a: Math.random() * Math.PI * 2, y: (Math.random() - 0.5) * 6,
      s: 0.4 + Math.random() * 1.4, sp: (Math.random() * 0.5 + 0.15) * (Math.random() < 0.5 ? -1 : 1),
      rot: new THREE.Euler(Math.random() * 3, Math.random() * 3, 0),
    });
  }
  scene.add(parts);

  // ---- Bokeh particles (front and back layers)
  const pCount = mobile ? 260 : 700;
  const pos = new Float32Array(pCount * 3);
  const col = new Float32Array(pCount * 3);
  const cA = new THREE.Color(0xece6da), cB = new THREE.Color(0xff5a1f), cC = new THREE.Color(0x8a7dff);
  for (let i = 0; i < pCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 2] = -18 + Math.random() * 26;
    const c = Math.random() < 0.12 ? cB : Math.random() < 0.18 ? cC : cA;
    col.set([c.r, c.g, c.b], i * 3);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pMat = new THREE.PointsMaterial({
    size: mobile ? 0.12 : 0.1, map: softDot(), vertexColors: true, transparent: true, opacity: 0.75,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const dust = new THREE.Points(pGeo, pMat);
  scene.add(dust);

  // ---- State driven from scroll code
  const state = {
    assemble: 0,   // 0 = apart, 1 = assembled
    flight: 0,     // 0..1 camera pushes through the mark
    side: mobile ? 0 : 1, // where the mark sits horizontally (1 = right of headline)
    finale: 0,     // 0..1 contact section: the mark grows behind the closing sentence
    focus: 1,      // 1 = mark visible, 0 = mark gone (between hero and contact)
    speed: 0,      // scroll velocity for streaks
  };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let w = 0, h = 0;
  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let time = 0, running = true, sm = { a: 0, f: 0, side: state.side, focus: 1, speed: 0, fin: 0 };
  const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    time += reduced ? dt * 0.2 : dt;
    mouse.x = damp(mouse.x, mouse.tx, 3, dt);
    mouse.y = damp(mouse.y, mouse.ty, 3, dt);
    sm.a = damp(sm.a, state.assemble, 6, dt);
    sm.f = damp(sm.f, state.flight, 5, dt);
    sm.side = damp(sm.side, state.side, 3, dt);
    sm.focus = damp(sm.focus, state.focus, 4, dt);
    sm.speed = damp(sm.speed, state.speed, 6, dt);
    sm.fin = damp(sm.fin, state.finale, 4, dt);

    // Pieces: interpolate between home pose and exploded pose, with a soft overshoot wobble.
    const apart = 1 - sm.a;
    for (const [k, g] of Object.entries(pieces)) {
      const ex = EXPLODE[k];
      const wob = Math.sin(time * 1.3 + k.charCodeAt(0)) * 0.06 * apart;
      g.position.set(
        g.userData.home.x + ex.p[0] * apart + wob,
        g.userData.home.y + ex.p[1] * apart + wob,
        g.userData.home.z + ex.p[2] * apart,
      );
      g.rotation.set(ex.r[0] * apart + wob, ex.r[1] * apart, ex.r[2] * apart);
    }

    // The whole mark: floats, follows the cursor, sits right of the headline on desktop.
    const markScale = (mobile ? 0.62 : 0.9) * lerp(0.55, 1, sm.focus) * lerp(1, mobile ? 1.9 : 1.5, sm.fin);
    mark.scale.setScalar(markScale);
    mark.position.set(
      lerp(0, mobile ? 0 : 3.9, sm.side),
      lerp(mobile ? 1.55 : 0.2, mobile ? 0.9 : 0.75, sm.fin) + Math.sin(time * 0.8) * 0.12 + lerp(-6, 0, sm.focus),
      lerp(-6, 0, sm.focus) - sm.fin * 3.5,
    );
    tmpE.set(
      Math.sin(time * 0.5) * 0.12 + mouse.y * 0.25,
      Math.sin(time * 0.35) * 0.35 + mouse.x * 0.5 + sm.f * 1.4 - 0.25 * sm.side,
      Math.sin(time * 0.4) * 0.05,
    );
    tmpQ.setFromEuler(tmpE);
    mark.quaternion.slerp(tmpQ, 1 - Math.exp(-4 * dt));
    glow.position.set(mark.position.x, mark.position.y - 0.4, mark.position.z + 1.4);
    glow.intensity = 18 * sm.focus;

    // Parts orbit; they spread out while the mark is apart.
    for (let i = 0; i < partCount; i++) {
      const d = partData[i];
      const a = d.a + time * d.sp * 0.25;
      const r = d.r * (1 + apart * 0.35);
      tmpE.set(d.rot.x + time * d.sp, d.rot.y + time * 0.3, 0);
      tmpQ.setFromEuler(tmpE);
      m4.compose(
        new THREE.Vector3(Math.cos(a) * r + mark.position.x * 0.6, d.y + Math.sin(time * d.sp + i) * 0.3, Math.sin(a) * r * 0.6 - 3),
        tmpQ,
        new THREE.Vector3(d.s, d.s, d.s),
      );
      parts.setMatrixAt(i, m4);
    }
    parts.instanceMatrix.needsUpdate = true;

    // Dust drifts toward the camera; faster with scroll speed (reads as motion streaks).
    const arr = pGeo.attributes.position.array;
    const v = (0.25 + Math.abs(sm.speed) * 0.02 + sm.f * 6) * dt;
    for (let i = 0; i < pCount; i++) {
      arr[i * 3 + 2] += v;
      if (arr[i * 3 + 2] > camera.position.z) arr[i * 3 + 2] -= 26;
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.size = (mobile ? 0.12 : 0.1) * (1 + Math.min(Math.abs(sm.speed) * 0.01, 1.2));

    // Camera: constant slow drift + cursor parallax + flight through the mark.
    camera.position.set(
      Math.sin(time * 0.21) * 0.5 + mouse.x * 0.6 + lerp(0, mark.position.x, sm.f),
      Math.cos(time * 0.17) * 0.35 - mouse.y * 0.4 + sm.f * 0.3,
      lerp(10, 1.2, sm.f),
    );
    const roll = Math.sin(time * 0.13) * 0.02 + sm.f * 0.15;
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(lerp(mark.position.x * 0.35, mark.position.x, sm.f), mark.position.y * 0.5, -2);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    const was = running;
    running = !document.hidden;
    if (running && !was) { clock.getDelta(); requestAnimationFrame(frame); }
  });

  return { state };
}
