import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { quality } from './quality.js';

// Ceiling medallion (rosette) + square cornice frame, built procedurally.
function medallionProfile() {
  const pts = [];
  const add = (r, y) => pts.push(new THREE.Vector2(r, y));
  add(0, 0.62);
  // central boss
  for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI / 2; add(Math.sin(a) * 0.32, 0.3 + Math.cos(a) * 0.32); }
  add(0.36, 0.28); add(0.4, 0.34); add(0.46, 0.3);
  // bead ring
  for (let i = 0; i <= 10; i++) { const a = Math.PI - (i / 10) * Math.PI; add(0.52 + Math.cos(a) * 0.05, 0.22 + Math.sin(a) * 0.05); }
  add(0.6, 0.18);
  // wide cavetto bowl
  for (let i = 0; i <= 16; i++) { const t = i / 16; add(0.6 + t * 0.9, 0.18 - Math.sin(t * Math.PI) * 0.07 + t * 0.02); }
  // egg-and-dart band (approximated by a torus ridge)
  for (let i = 0; i <= 12; i++) { const a = Math.PI - (i / 12) * Math.PI; add(1.6 + Math.cos(a) * 0.09, 0.2 + Math.sin(a) * 0.09); }
  add(1.72, 0.16); add(1.78, 0.2); add(1.84, 0.14);
  // outer ogee
  for (let i = 0; i <= 16; i++) { const t = i / 16; add(1.84 + t * 0.42, 0.14 - (Math.sin(t * Math.PI - Math.PI / 2) * 0.5 + 0.5) * 0.12); }
  add(2.3, 0.0); add(0, 0.0);
  return pts.reverse();
}

function leafGeometry() {
  // Smooth petal: a flattened, tapered ellipsoid bent up towards the tip, with a soft central vein.
  const g = new THREE.SphereGeometry(1, 32, 24);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = (y + 1) / 2;                        // 0 base .. 1 tip
    const taper = Math.sin(Math.min(1, t * 1.15) * Math.PI) * 0.9 + 0.1;
    x *= 0.17 * taper;
    z = Math.max(z, -0.15) * 0.07;
    z -= Math.exp(-Math.pow(x / 0.025, 2)) * 0.02 * (z > 0 ? 1 : 0); // vein groove
    y = t * 0.86;
    z += Math.sin(t * 2.6) * 0.17 - Math.abs(x) * 0.35;
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

function corniceFrame() {
  // Lathe with 4 segments = square frame with perfect mitred corners.
  const pts = [];
  const add = (r, y) => pts.push(new THREE.Vector2(r, y));
  const R = 3.7;
  add(R, 0); add(R + 0.08, 0);
  add(R + 0.08, 0.06);
  for (let i = 0; i <= 10; i++) { const a = Math.PI - (i / 10) * Math.PI; add(R + 0.16 + Math.cos(a) * 0.06, 0.1 + Math.sin(a) * 0.05); }
  add(R + 0.24, 0.1);
  for (let i = 0; i <= 14; i++) { const t = i / 14; add(R + 0.24 + t * 0.5, 0.12 + (Math.sin(t * Math.PI - Math.PI / 2) * 0.5 + 0.5) * 0.22); }
  add(R + 0.78, 0.38); add(R + 0.82, 0.3); add(R + 0.9, 0.3); add(R + 0.9, 0);
  const g = new THREE.LatheGeometry(pts.reverse(), 4, Math.PI / 4);
  return g;
}

export function initCraft(canvas) {
  const q = quality();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(q.dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = q.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.18;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const plaster = new THREE.MeshPhysicalMaterial({ color: 0xf1e8d8, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xfff2dc), sheenRoughness: 0.6 });
  const gilt = new THREE.MeshStandardMaterial({ color: 0xc9a46c, metalness: 1, roughness: 0.3 });

  const rig = new THREE.Group();
  scene.add(rig);

  // Ceiling plane
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x1c1915, roughness: 0.95 }));
  ceiling.receiveShadow = true;
  ceiling.position.z = -0.01;
  rig.add(ceiling);

  // Medallion (lathe axis = Y, rotate so it faces camera along +Z)
  const med = new THREE.Mesh(new THREE.LatheGeometry(medallionProfile(), 160), plaster);
  med.rotation.x = Math.PI / 2;
  med.castShadow = med.receiveShadow = true;
  rig.add(med);

  // Leaves ring
  const leafG = leafGeometry();
  const leaves = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const g = leafG.clone();
    g.scale(1.05, 1.05, 1.05);
    g.translate(0, 0.62, 0.12);
    g.rotateZ(a);
    leaves.push(g);
  }
  const leafMesh = new THREE.Mesh(mergeGeometries(leaves), plaster);
  leafMesh.castShadow = leafMesh.receiveShadow = true;
  rig.add(leafMesh);
  // Small outer leaves / dentils
  const dent = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const b = new THREE.SphereGeometry(0.055, 12, 8);
    b.scale(1, 1.6, 0.8);
    b.rotateZ(a);
    b.translate(Math.cos(a + Math.PI / 2) * 2.02, Math.sin(a + Math.PI / 2) * 2.02, 0.14);
    dent.push(b);
  }
  const dentMesh = new THREE.Mesh(mergeGeometries(dent), plaster);
  dentMesh.castShadow = true;
  rig.add(dentMesh);

  // Gilded central ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 16, 120), gilt);
  ring.position.z = 0.33;
  rig.add(ring);

  // Square cornice frame
  const cornice = new THREE.Mesh(corniceFrame(), plaster);
  cornice.rotation.x = Math.PI / 2;
  cornice.castShadow = cornice.receiveShadow = true;
  rig.add(cornice);
  // Inner fillet line (gilt)
  const sq = new THREE.Shape();
  const r = 2.95;
  sq.moveTo(-r, -r); sq.lineTo(r, -r); sq.lineTo(r, r); sq.lineTo(-r, r); sq.lineTo(-r, -r);
  const hole = new THREE.Path(); const r2 = 2.92;
  hole.moveTo(-r2, -r2); hole.lineTo(r2, -r2); hole.lineTo(r2, r2); hole.lineTo(-r2, r2); hole.lineTo(-r2, -r2);
  sq.holes.push(hole);
  const line = new THREE.Mesh(new THREE.ExtrudeGeometry(sq, { depth: 0.03, bevelEnabled: false }), gilt);
  rig.add(line);

  // Lights: raking key that sweeps with scroll, warm fill, cool rim
  const key = new THREE.DirectionalLight(0xffe0b0, 3.6);
  key.castShadow = q.shadows;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  scene.add(key);
  const fill = new THREE.PointLight(0xffb070, 6, 20, 1.5);
  fill.position.set(-4, -3, 4);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0xfff0e0, 0.12));

  const state = { p: 0, tp: 0, mx: 0, my: 0, tmx: 0, tmy: 0, visible: false };
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { state.tmx = e.clientX / innerWidth * 2 - 1; state.tmy = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (window.__mgPaused) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!state.visible) return;
    const t = clock.elapsedTime;
    state.p += (state.tp - state.p) * Math.min(1, dt * 4);
    state.mx += (state.tmx - state.mx) * Math.min(1, dt * 3);
    state.my += (state.tmy - state.my) * Math.min(1, dt * 3);
    const p = state.p;
    const portrait = camera.aspect < 0.9;

    // camera orbits from steep raking angle to almost frontal and back out
    const ang = THREE.MathUtils.lerp(1.05, 0.25, Math.sin(Math.min(1, p) * Math.PI * 0.5));
    const dist = (portrait ? 17 : 13.5) - p * 2.5;
    const yaw = THREE.MathUtils.lerp(-0.5, 0.35, p) + state.mx * 0.08;
    camera.position.set(Math.sin(yaw) * dist * Math.sin(ang) , -Math.cos(yaw) * dist * Math.sin(ang), Math.cos(ang) * dist);
    camera.up.set(0, 0, 1);
    const offX = portrait ? 0 : 3.0;
    const offY = portrait ? 3.4 : -1.4;
    camera.lookAt(offX * (1 - p * 0.3), offY, 0);

    rig.rotation.z = t * 0.03 + p * 0.6;
    // raking light sweeps around the relief
    const la = p * Math.PI * 1.4 + 0.6;
    key.position.set(Math.cos(la) * 8, Math.sin(la) * 8, 2.2 + state.my * 0.5);
    ring.material.roughness = 0.25 + Math.sin(t) * 0.05;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  return { setProgress(v) { state.tp = v; } };
}
