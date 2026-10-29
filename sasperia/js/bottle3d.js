// "From our vineyards": a glass bottle that turns with scroll. Each full turn shows the label of
// one of the wines listed with producer "Sasperia" on sasperia.ge/wine. The label is swapped
// while it faces away from the guest.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function loadImage(src) {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}

export async function initBottle(canvas, { emblemUrl, patternUrl, quality = 'high' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.02).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 1.55, 9.2);
  camera.lookAt(0, 1.45, 0);

  const bottle = new THREE.Group();
  scene.add(bottle);

  // Burgundy-style profile (radius, height)
  const pts = [
    [0.0, 0.0], [0.36, 0.0], [0.41, 0.03], [0.42, 0.12], [0.42, 1.55], [0.415, 1.72], [0.38, 1.95], [0.3, 2.2],
    [0.2, 2.45], [0.15, 2.65], [0.14, 2.95], [0.145, 3.05], [0.155, 3.08], [0.155, 3.14], [0.13, 3.16], [0.0, 3.16],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x0c1a11, metalness: 0.2, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03,
    sheen: 0.25, sheenColor: new THREE.Color(0x6f9a88), envMapIntensity: 0.9,
  });
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), glass);
  bottle.add(body);

  // Gold capsule over the neck
  const capPts = [[0.0, 3.17], [0.162, 3.17], [0.165, 3.12], [0.158, 2.9], [0.152, 2.7], [0.0, 2.7]].map(([r, y]) => new THREE.Vector2(r, y)).reverse();
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xd5b784, metalness: 1, roughness: 0.3, envMapIntensity: 1.3 });
  bottle.add(new THREE.Mesh(new THREE.LatheGeometry(capPts, 64), goldMat));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.157, 0.012, 8, 64), goldMat);
  ring.rotation.x = Math.PI / 2; ring.position.y = 2.72; bottle.add(ring);

  // Label
  const LW = 1024, LH = 840;
  const lc = document.createElement('canvas'); lc.width = LW; lc.height = LH;
  const lctx = lc.getContext('2d');
  const labelTex = new THREE.CanvasTexture(lc);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = 4;
  const ARC = Math.PI * 1.05;
  const labelGeo = new THREE.CylinderGeometry(0.4255, 0.4255, 0.98, 96, 1, true, -ARC / 2 + Math.PI, ARC);
  const label = new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.75, metalness: 0.0 }));
  label.position.y = 0.95;
  bottle.add(label);

  const [emblemImg, patternImg] = await Promise.all([loadImage(emblemUrl), loadImage(patternUrl)]);
  try { await document.fonts.load('80px Forum'); await document.fonts.load('italic 40px "Cormorant Garamond"'); } catch (e) { /* fonts optional */ }

  function drawLabel(w) {
    const c = lctx;
    c.clearRect(0, 0, LW, LH);
    c.fillStyle = '#ece3d1'; c.fillRect(0, 0, LW, LH);
    if (patternImg) { c.globalAlpha = 0.07; const s = 300; for (let x = 0; x < LW; x += s) for (let y = 0; y < LH; y += s) c.drawImage(patternImg, x, y, s, s); c.globalAlpha = 1; }
    c.strokeStyle = '#a8895a'; c.lineWidth = 3; c.strokeRect(70, 40, LW - 140, LH - 80);
    c.lineWidth = 1; c.strokeRect(84, 54, LW - 168, LH - 108);
    const cx = LW / 2;
    if (emblemImg) c.drawImage(emblemImg, cx - 90, 92, 180, 180);
    c.textAlign = 'center'; c.fillStyle = '#1b1712';
    c.font = '54px Forum, Georgia, serif';
    c.fillText('S A S P E R I A', cx, 340);
    c.fillStyle = '#7a1f2b';
    let size = 104; c.font = `${size}px Forum, Georgia, serif`;
    while (c.measureText(w.name).width > LW - 240 && size > 50) { size -= 4; c.font = `${size}px Forum, Georgia, serif`; }
    c.fillText(w.name, cx, 480);
    c.fillStyle = '#3b3326';
    c.font = 'italic 44px "Cormorant Garamond", Georgia, serif';
    c.fillText(w.kind, cx, 560);
    c.font = '30px Manrope, sans-serif';
    c.fillText(w.region, cx, 640);
    c.fillStyle = '#a8895a'; c.fillRect(cx - 60, 690, 120, 2);
    labelTex.needsUpdate = true;
  }

  // Shadow
  const sh = document.createElement('canvas'); sh.width = sh.height = 128;
  const shc = sh.getContext('2d'); const grd = shc.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); shc.fillStyle = grd; shc.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.01; scene.add(shadow);

  const key = new THREE.SpotLight(0xffe0b0, 90, 30, 0.45, 0.6, 1.2); key.position.set(-4, 6, 6); scene.add(key);
  const rim = new THREE.SpotLight(0x9fd0c4, 70, 30, 0.5, 0.8, 1.2); rim.position.set(4, 4, -5); scene.add(rim);
  const rim2 = new THREE.PointLight(0xd5b784, 12, 10, 1.5); rim2.position.set(-2.5, 1.5, -2); scene.add(rim2);
  scene.add(new THREE.AmbientLight(0x404038, 0.5));

  let wines = [];
  let current = -1;
  const state = { progress: 0, running: true, t: 0, external: false, visible: true };
  const clock = new THREE.Clock();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.7 ? 34 : 28;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  function frame(t) {
    const n = Math.max(1, wines.length);
    const total = state.progress * n;              // one full turn per wine
    const seg = Math.min(n - 1, Math.floor(total));
    const local = Math.min(1, total - seg);
    const eased = local + 0.12 * Math.sin(2 * Math.PI * local); // lingers when the label faces front
    if (seg !== current && wines[seg]) { current = seg; drawLabel(wines[seg]); }
    bottle.rotation.y = (seg + eased) * Math.PI * 2 + Math.sin(t * 0.5) * 0.05;
    bottle.rotation.z = Math.sin(t * 0.4) * 0.025 + 0.04;
    bottle.position.y = Math.sin(t * 0.8) * 0.03;
    key.position.x = -4 + Math.sin(t * 0.3) * 1.5;
    renderer.render(scene, camera);
  }

  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!state.running || !state.visible || state.external) return;
    state.t += Math.min(clock.getDelta(), 0.05);
    frame(state.t);
  }
  loop();

  return {
    setWines(list) { wines = list; current = -1; },
    setProgress(p) { state.progress = Math.max(0, Math.min(0.9999, p)); },
    get index() { return current; },
    setVisible(v) { state.visible = v; clock.getDelta(); },
    renderAt(t) { state.external = true; frame(t); },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); },
  };
}
