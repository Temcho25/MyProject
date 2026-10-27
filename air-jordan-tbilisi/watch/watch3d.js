// Часы (Submariner): настоящие 3D-детали, построенные по контурам фото; лицевые поверхности — само фото.
// Перенесено с rolex-submariner.vercel.app; работает в своей секции #watch со своим canvas.
import * as THREE from 'three';

const PX = 210, CX = 430, CY = 640, IW = 859, IH = 1280;      // фото: 1 ед. = 210 px, центр часов
const toUV = (x, y) => [(x * PX + CX) / IW, 1 - (CY - y * PX) / IH];

const canvas = document.getElementById('wc');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

// студийное окружение: тёмная комната с софтбоксами (для металла и стекла)
scene.environment = (() => {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x050506);
  const g = new THREE.PlaneGeometry(1, 1);
  const add = (w, h, pos, k, col = 0xffffff) => {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.scale.set(w, h, 1); m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  add(12, 3.5, [0, 8, 2], 3.6);
  add(2.4, 12, [-7, 1, 3], 6.0);
  add(1.4, 12, [7, 0, 2], 3.6, 0xfff2e4);
  add(3, 9, [2.5, 2, -8], 4.0, 0xe9f0ff);
  add(7, 4, [0, 1.5, 9], 1.1);
  add(14, 2, [0, -7, 4], 0.5);
  const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(s, 0.02).texture; pm.dispose(); return t;
})();

// ── текстуры
const loader = new THREE.TextureLoader();
const loadTex = url => new Promise(r => loader.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); r(t); }));
await Promise.all(['600 80px "Cormorant Garamond"', '500 40px Manrope', '600 40px Manrope', '700 40px Manrope'].map(f => document.fonts.load(f, 'ROLEX 0123')));
const [photo, caseTex, outlines] = await Promise.all([
  loadTex('watch/assets/tex/photo.jpg'), loadTex('watch/assets/tex/case.jpg'), fetch('watch/assets/tex/outlines.json').then(r => r.json()),
]);
// плавное растворение концов браслета (фото обрезано по краю кадра)
const fadeTex = (() => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  const yv = py => py / IH;
  g.addColorStop(0, '#000'); g.addColorStop(yv(318), '#000'); g.addColorStop(yv(380), '#fff');
  g.addColorStop(yv(1050), '#fff'); g.addColorStop(yv(1120), '#000'); g.addColorStop(1, '#000');
  x.fillStyle = g; x.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.flipY = true; return t;
})();

// ── материалы
const faceMat = (map, extra = {}) => new THREE.MeshPhysicalMaterial({
  color: 0x000000, emissive: 0xffffff, emissiveMap: map, roughness: 0.5, metalness: 0, specularIntensity: 0.12,
  clearcoat: 0.08, clearcoatRoughness: 0.3, toneMapped: false, ...extra,
});
const steel = new THREE.MeshPhysicalMaterial({ color: 0xdfe3e6, metalness: 1, roughness: 0.2 });
const steelDark = new THREE.MeshPhysicalMaterial({ color: 0x9aa0a5, metalness: 1, roughness: 0.32 });
const black = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0b, roughness: 0.25, clearcoat: 1 });

// ── геометрия
function uvFromXY(g) {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const [u, v] = toUV(p.getX(i), p.getY(i)); uv[i * 2] = u; uv[i * 2 + 1] = v; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
function shapeFrom(pts, holes = []) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  holes.forEach(h => s.holes.push(h)); return s;
}
function slab(shape, depth, bevel = 0.018, curve = 64) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 4, curveSegments: curve });
  g.translate(0, 0, -depth);              // лицо на z = 0 (+фаска)
  return g;
}
const ring = (r0, r1) => { const s = new THREE.Shape(); s.absarc(0, 0, r1, 0, Math.PI * 2); const h = new THREE.Path(); h.absarc(0, 0, r0, 0, Math.PI * 2, true); s.holes.push(h); return s; };

const watch = new THREE.Group(); scene.add(watch);
const parts = {};
function part(name, mesh, home) { const g = new THREE.Group(); g.add(mesh); g.position.copy(home); g.userData.home = home.clone(); watch.add(g); parts[name] = g; return g; }

// корпус с ушками и головкой — контур по фото, толщина 0.5
{
  const hole = new THREE.Path(); hole.absarc(0, 0, 162 / PX, 0, Math.PI * 2, true);
  const CROWN_X = (655 - CX) / PX;            // всё правее — сама головка, она теперь отдельная деталь
  const g = uvFromXY(slab(shapeFrom(outlines.case.map(([x, y]) => [Math.min(x, CROWN_X), y]), [hole]), 0.5, 0.03));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const ay = Math.abs(p.getY(i)); if (ay > 0.72) { const q = (ay - 0.72) / 0.4; p.setZ(i, p.getZ(i) - q * q * 0.16); } }
  g.computeVertexNormals();
  const grp = new THREE.Group(); grp.add(new THREE.Mesh(g, [faceMat(caseTex), steel]));
  // полость: внутренняя стенка и дно
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(162 / PX, 162 / PX, 0.34, 160, 1, true).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x8b9095, metalness: 1, roughness: 0.38, side: THREE.BackSide }));
  wall.position.z = -0.17; grp.add(wall);
  const floorTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    const g2 = x.createRadialGradient(256, 256, 0, 256, 256, 256); g2.addColorStop(0, '#2a2c30'); g2.addColorStop(0.7, '#141518'); g2.addColorStop(0.92, '#0b0b0d'); g2.addColorStop(1, '#3a3d42');
    x.fillStyle = g2; x.fillRect(0, 0, 512, 512);
    x.strokeStyle = 'rgba(255,255,255,0.07)'; for (let r = 40; r < 240; r += 22) { x.beginPath(); x.arc(256, 256, r, 0, Math.PI * 2); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(162 / PX, 120), new THREE.MeshPhysicalMaterial({ map: floorTex, metalness: 0.6, roughness: 0.45 }));
  floor.position.z = -0.34; grp.add(floor);
  // трубка, на которую накручивается головка
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 48).rotateZ(Math.PI / 2), steel);
  tube.position.set(CROWN_X + 0.02, -0.01, -0.2); grp.add(tube);
  part('case', grp, new THREE.Vector3(0, 0, 0));
}
// заводная головка Triplock: рифлёный цилиндр, при разборке выкручивается вправо
{
  const R = 37 / PX, LEN = 0.13;
  const g = new THREE.CylinderGeometry(R, R, LEN, 192, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z), y = p.getY(i);
    if (r > R * 0.98 && Math.abs(y) < LEN * 0.42) { const a = Math.atan2(z, x); const k = 1 - 0.07 * (0.5 + 0.5 * Math.cos(a * 36)); p.setX(i, x * k); p.setZ(i, z * k); }
  }
  g.computeVertexNormals(); g.rotateZ(-Math.PI / 2);          // ось вдоль X
  const spin = new THREE.Group();
  spin.add(new THREE.Mesh(g, steel));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.95, 0.018, 96).rotateZ(-Math.PI / 2), steel); cap.position.x = LEN / 2 + 0.008; spin.add(cap);
  const ringM = new THREE.Mesh(new THREE.TorusGeometry(R * 0.55, 0.006, 8, 64).rotateY(Math.PI / 2), steelDark); ringM.position.x = LEN / 2 + 0.018; spin.add(ringM);
  const grp = new THREE.Group(); grp.add(spin); grp.userData.spin = spin;
  part('crown', grp, new THREE.Vector3((655 - CX) / PX + LEN / 2, -2 / PX, -0.2));
}
// циферблат: векторная отрисовка в 4K + объёмные метки и стрелки (фото циферблата слишком мелкое)
const DIAL_R = 140 / PX, REH_R = 162 / PX;
const hands = {};
{
  const S = 4096, R = REH_R, k = S / (2 * R);
  const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const P = (u, v) => [S / 2 + u * k, S / 2 - v * k];
  // рехаут: светлая сталь с кольцевой шлифовкой и гравировкой
  const rg = x.createRadialGradient(S / 2, S / 2, DIAL_R * k, S / 2, S / 2, R * k);
  rg.addColorStop(0, '#2c2f33'); rg.addColorStop(0.3, '#6f747a'); rg.addColorStop(0.75, '#a9aeb3'); rg.addColorStop(1, '#5d6268');
  x.fillStyle = rg; x.beginPath(); x.arc(S / 2, S / 2, R * k, 0, Math.PI * 2); x.fill();
  x.save(); x.translate(S / 2, S / 2);
  x.font = `600 ${0.03 * k}px Manrope`; x.fillStyle = 'rgba(30,32,36,0.5)'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < 24; i++) { x.save(); x.rotate(i / 24 * Math.PI * 2); x.fillText('ROLEX', 0, -(R - 0.045) * k); x.restore(); }
  x.restore();
  // чёрный лак
  const dg = x.createRadialGradient(S * 0.44, S * 0.4, 0, S / 2, S / 2, DIAL_R * k);
  dg.addColorStop(0, '#141516'); dg.addColorStop(0.6, '#08090a'); dg.addColorStop(1, '#040405');
  x.fillStyle = dg; x.beginPath(); x.arc(S / 2, S / 2, DIAL_R * k, 0, Math.PI * 2); x.fill();
  // минутная дорожка по краю
  x.save(); x.translate(S / 2, S / 2); x.fillStyle = '#e9e9e4';
  for (let m = 0; m < 60; m++) {
    if (m % 5 === 0) continue;
    x.save(); x.rotate(m / 60 * Math.PI * 2); x.fillRect(-0.0028 * k, -(DIAL_R - 0.004) * k, 0.0056 * k, 0.026 * k); x.restore();
  }
  x.restore();
  // надписи: подгоняем ширину строки под замер с фото
  const line = (str, v, width, weight, font, track = 0.08) => {
    let size = 100; x.font = `${weight} ${size}px ${font}`; x.letterSpacing = `${track * size}px`;
    const w = x.measureText(str).width; size *= (width * k) / w;
    x.font = `${weight} ${size}px ${font}`; x.letterSpacing = `${track * size}px`;
    x.fillStyle = '#f2f2ee'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const [px, py] = P(0, v); x.fillText(str, px + track * size / 2, py);
  };
  // корона-эмблема
  {
    const [cx, cy] = P(0, 0.262), s = 0.07 * k;
    x.save(); x.translate(cx, cy + 0.02 * k); x.scale(s, -s); x.fillStyle = '#ecebe6';
    x.beginPath(); x.moveTo(-0.42, 0); x.quadraticCurveTo(0, 0.07, 0.42, 0); x.lineTo(0.40, 0.17); x.quadraticCurveTo(0, 0.23, -0.40, 0.17); x.closePath(); x.fill();
    const tips = [[-0.52, 0.6], [-0.26, 0.78], [0, 0.86], [0.26, 0.78], [0.52, 0.6]], bx = [-0.3, -0.15, 0, 0.15, 0.3];
    tips.forEach(([tx, ty], i) => { const by = 0.17, dx = tx - bx[i], dy = ty - by, L = Math.hypot(dx, dy), nx = -dy / L * 0.06, ny = dx / L * 0.06;
      x.beginPath(); x.moveTo(bx[i] + nx, by + ny); x.lineTo(tx + nx * 0.35, ty + ny * 0.35); x.lineTo(tx - nx * 0.35, ty - ny * 0.35); x.lineTo(bx[i] - nx, by - ny); x.closePath(); x.fill();
      x.beginPath(); x.arc(tx + dx / L * 0.05, ty + dy / L * 0.05, 0.065, 0, Math.PI * 2); x.fill(); });
    x.restore();
  }
  line('ROLEX', 0.186, 0.31, 600, '"Cormorant Garamond"', 0.06);
  line('OYSTER PERPETUAL DATE', 0.128, 0.40, 600, 'Manrope', 0.08);
  line('SUBMARINER', -0.198, 0.33, 700, 'Manrope', 0.05);
  line('1000ft = 300m', -0.252, 0.27, 500, 'Manrope', 0.02);
  line('SUPERLATIVE CHRONOMETER', -0.293, 0.40, 600, 'Manrope', 0.05);
  line('OFFICIALLY CERTIFIED', -0.333, 0.32, 600, 'Manrope', 0.06);
  line('SWISS   MADE', -0.585, 0.16, 600, 'Manrope', 0.12);
  // окно даты
  {
    const [ax, ay] = P(0.312, 0.045), [bx, by] = P(0.512, -0.098);
    x.fillStyle = '#b9bcbf'; x.beginPath(); x.roundRect(ax - 0.012 * k, ay - 0.012 * k, bx - ax + 0.024 * k, by - ay + 0.024 * k, 0.012 * k); x.fill();
    x.fillStyle = '#fbfbf8'; x.beginPath(); x.roundRect(ax, ay, bx - ax, by - ay, 0.006 * k); x.fill();
    x.fillStyle = '#0c0c0c'; x.font = `700 ${0.105 * k}px Manrope`; x.letterSpacing = '0px'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('28', (ax + bx) / 2, (ay + by) / 2 + 0.004 * k);
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;

  const grp = new THREE.Group();
  const faceG = new THREE.CircleGeometry(REH_R, 256); // UV круга = (x/R+1)/2 — совпадает с отрисовкой
  grp.add(new THREE.Mesh(faceG, faceMat(tex, { clearcoat: 0.22, clearcoatRoughness: 0.05, roughness: 0.55, specularIntensity: 0.05 })));
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(REH_R, REH_R, 0.05, 160, 1, true).rotateX(Math.PI / 2), black);
  edge.position.z = -0.025; grp.add(edge);

  // накладные метки: оправа из белого золота + люминесцентная масса
  const wgold = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, metalness: 1, roughness: 0.12 });
  const lume = new THREE.MeshStandardMaterial({ color: 0xf4f3ec, roughness: 0.5, emissive: 0xb9b9b1 });
  const cyl = (r, h) => new THREE.CylinderGeometry(r, r, h, 64).rotateX(Math.PI / 2);
  const Rm = 0.518;
  for (let h = 1; h <= 12; h++) {
    if (h === 3) continue;
    const a = Math.PI / 2 - h * Math.PI / 6, cx = Math.cos(a) * Rm, cy = Math.sin(a) * Rm;
    if (h === 12) {
      const tri = (w, r0, r1) => { const s = new THREE.Shape(); s.moveTo(-w, r1); s.lineTo(w, r1); s.lineTo(0, r0); s.closePath(); return s; };
      const e = (sh, d) => new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 });
      grp.add(new THREE.Mesh(e(tri(0.077, 0.375, 0.562), 0.012), wgold));
      const l = new THREE.Mesh(e(tri(0.06, 0.402, 0.549), 0.014), lume); grp.add(l);
    } else if (h === 6 || h === 9) {
      const len = 0.19, mid = 0.488;
      const o = new THREE.Mesh(new THREE.BoxGeometry(0.07, len, 0.013), wgold), l = new THREE.Mesh(new THREE.BoxGeometry(0.052, len - 0.018, 0.016), lume);
      [o, l].forEach(m => { m.position.set(Math.cos(a) * mid, Math.sin(a) * mid, 0.008); m.rotation.z = a - Math.PI / 2; grp.add(m); });
    } else {
      const o = new THREE.Mesh(cyl(0.054, 0.013), wgold), l = new THREE.Mesh(cyl(0.043, 0.016), lume);
      o.position.set(cx, cy, 0.007); l.position.set(cx, cy, 0.009); grp.add(o, l);
    }
  }
  // стрелки (размеры сняты с фото)
  const flat = (shape, d) => new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 48 });
  const poly = pts => { const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); s.closePath(); return s; };
  { // часовая «Mercedes»
    const g = new THREE.Group(); g.position.z = 0.026;
    g.add(new THREE.Mesh(flat(poly([[-0.018, -0.06], [0.018, -0.06], [0.018, 0.19], [-0.018, 0.19]]), 0.005), wgold));
    const ring = new THREE.Shape(); ring.absarc(0, 0.244, 0.054, 0, Math.PI * 2); const hole = new THREE.Path(); hole.absarc(0, 0.244, 0.041, 0, Math.PI * 2, true); ring.holes.push(hole);
    g.add(new THREE.Mesh(flat(ring, 0.005), wgold));
    for (const d of [90, 210, 330]) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.045, 0.006), wgold); const r = d * Math.PI / 180; sp.position.set(Math.cos(r) * 0.021, 0.244 + Math.sin(r) * 0.021, 0.003); sp.rotation.z = r - Math.PI / 2; g.add(sp); }
    const lz = new THREE.Mesh(cyl(0.041, 0.004), lume); lz.position.set(0, 0.244, 0.001); g.add(lz);
    g.add(new THREE.Mesh(flat(poly([[-0.02, 0.296], [0.02, 0.296], [0, 0.356]]), 0.005), wgold));
    const ls = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.17, 0.004), lume); ls.position.set(0, 0.095, 0.006); g.add(ls);
    const hub = new THREE.Mesh(cyl(0.032, 0.008), wgold); hub.position.z = 0.003; g.add(hub);
    grp.add(g); hands.hour = g;
  }
  { // минутная «меч»
    const g = new THREE.Group(); g.position.z = 0.036;
    g.add(new THREE.Mesh(flat(poly([[-0.014, -0.08], [-0.024, 0.32], [0, 0.56], [0.024, 0.32], [0.014, -0.08]]), 0.005), wgold));
    const l = new THREE.Mesh(flat(poly([[-0.008, 0.03], [-0.015, 0.32], [0, 0.49], [0.015, 0.32], [0.008, 0.03]]), 0.004), lume); l.position.z = 0.004; g.add(l);
    const hub = new THREE.Mesh(cyl(0.027, 0.008), wgold); hub.position.z = 0.003; g.add(hub);
    grp.add(g); hands.minute = g;
  }
  { // секундная с «леденцом»
    const g = new THREE.Group(); g.position.z = 0.046;
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.83, 0.004), wgold); rod.position.y = 0.185; g.add(rod);
    const lr = new THREE.Shape(); lr.absarc(0, 0.363, 0.031, 0, Math.PI * 2); g.add(new THREE.Mesh(flat(lr, 0.004), wgold));
    const ll = new THREE.Mesh(cyl(0.022, 0.006), lume); ll.position.set(0, 0.363, 0.004); g.add(ll);
    const hub = new THREE.Mesh(cyl(0.018, 0.016), wgold); hub.position.z = 0.006; g.add(hub);
    grp.add(g); hands.second = g;
  }
  // 10:10, как на фото
  hands.hour.rotation.z = -(10 + 10 / 60) / 12 * Math.PI * 2;
  hands.minute.rotation.z = -(10 / 60) * Math.PI * 2;
  part('dial', grp, new THREE.Vector3(0, 0, 0.012));
}
// безель: кольцо со вставкой, насечка по внешней кромке
{
  const g = uvFromXY(slab(ring(162 / PX, 213 / PX), 0.13, 0.02, 360));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y), z = p.getZ(i);
    if (r > 0.99 && z < -0.02 && z > -0.12) { const a = Math.atan2(y, x); const k = 1 - 0.012 * Math.abs(((a / (Math.PI * 2)) * 120) % 1 - 0.5) * 2; p.setX(i, x * k); p.setY(i, y * k); }
  }
  g.computeVertexNormals();
  part('bezel', new THREE.Mesh(g, [faceMat(photo, { clearcoat: 0.4, clearcoatRoughness: 0.06 }), steel]), new THREE.Vector3(0, 0, 0.1));
}
// сапфировое стекло
{
  const fill = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.02, clearcoat: 0.4, envMapIntensity: 0.7, depthWrite: false });
  const rimM = new THREE.MeshPhysicalMaterial({ color: 0xf4f7ff, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.55, envMapIntensity: 2.5, depthWrite: false });
  const grp = new THREE.Group();
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(160 / PX, 160 / PX, 0.05, 160).rotateX(Math.PI / 2), fill);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(160 / PX, 0.012, 12, 200), rimM); rim.position.z = 0.0;
  const cyc = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 48).rotateX(Math.PI / 2), fill); cyc.scale.set(1.25, 0.95, 1); cyc.position.set(90 / PX, 0, 0.04);
  grp.add(disk, rim, cyc); grp.renderOrder = 5;
  part('glass', grp, new THREE.Vector3(0, 0, 0.13));
}
// браслет: две половины, изгибаются назад, как на руке
for (const [name, key, sgn] of [['braceletTop', 'braceletTop', 1], ['braceletBottom', 'braceletBottom', -1]]) {
  const g = uvFromXY(slab(shapeFrom(outlines[key]), 0.15, 0.025, 12));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const d = Math.max(0, Math.abs(p.getY(i)) - 1.08); p.setZ(i, p.getZ(i) - 0.16 - d * d * 0.55); }
  g.computeVertexNormals();
  const m1 = faceMat(photo, { alphaMap: fadeTex, transparent: true }), m2 = steelDark.clone(); m2.alphaMap = fadeTex; m2.transparent = true;
  part(name, new THREE.Mesh(g, [m1, m2]), new THREE.Vector3(0, 0, 0));
}

// ── разлёт (в осях часов) и камера
const OFF = {
  glass: [0, 0, 2.05], bezel: [0, 0, 1.45], dial: [0, 0, 0.8], case: [0, 0, 0], crown: [0.95, 0, 0],
  braceletTop: [0, 0.75, -0.55], braceletBottom: [0, -0.75, -0.55],
};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const eio = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const lerp = (a, b, k) => a + (b - a) * k;

function apply(p, time) {
  const turn = eio(seg(p, 0, 0.5)), ex = eio(seg(p, 0.18, 0.82)), drift = seg(p, 0.6, 1);
  for (const k in parts) {
    const P = parts[k], o = OFF[k], h = P.userData.home;
    const stag = { glass: 0, bezel: 0.04, dial: 0.08, case: 0, crown: -0.06, braceletTop: 0.1, braceletBottom: 0.1 }[k];
    const e = eio(seg(p, 0.18 + stag, 0.82 + stag * 0.3));
    if (k === 'crown') P.children[0].userData.spin.rotation.x = -e * Math.PI * 5;   // выкручивается
    P.position.set(h.x + o[0] * e, h.y + o[1] * e, h.z + o[2] * e);
  }
  // камера: из почти фронтального ракурса в ¾ к разобранной стопке
  const az = lerp(-14, 42, turn) + 10 * drift + Math.sin(time * 0.35) * 0.6;
  const el = lerp(5, 16, turn) + Math.sin(time * 0.27 + 1) * 0.4;
  const asp = canvas.clientWidth / canvas.clientHeight;
  const fit = asp < 1 ? Math.pow(1 / Math.max(0.4, asp), 0.72) : 1;   // узкий экран — отъезжаем ровно настолько, чтобы влезло
  const dist = lerp(8.4, 10.6, ex) * fit;
  const tz = 0.8 * ex, ty = 0;
  const a = az * Math.PI / 180, b = el * Math.PI / 180;
  camera.position.set(dist * Math.sin(a) * Math.cos(b), ty + dist * Math.sin(b), tz + dist * Math.cos(a) * Math.cos(b));
  camera.lookAt(0, ty, tz);
  scene.environmentRotation.set(0, -0.6 + p * 1.6, 0);
}

// ── размер и качество: суперсэмплинг ×1.25 к плотности экрана
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight, dpr = window.devicePixelRatio || 1;
  let pr = Math.min(3, dpr * 1.25); if (w * h * pr * pr > 9e6) pr = Math.sqrt(9e6 / (w * h));
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const sec = document.getElementById('watch'), wSec = sec;
const target = () => { const r = sec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
let cur = target(), last = performance.now();
renderer.compile(scene, camera);
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const rr = wSec.getBoundingClientRect();
  if (rr.bottom < -innerHeight * 0.5 || rr.top > innerHeight * 1.5) { requestAnimationFrame(frame); return; }   // вне экрана — не рисуем
  const t = target();
  cur += (t - cur) * (1 - Math.exp(-dt * 7)); if (Math.abs(t - cur) < 0.0004) cur = t;
  apply(cur, now / 1000);
  const sec = 30 + Math.floor((now / 1000) * 8) / 8; hands.second.rotation.z = -sec / 60 * Math.PI * 2;
  renderer.render(scene, camera);
  window.__watchP = cur;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
sec.classList.add('is-ready');
window.__watchRender = (p, time = 0) => { apply(p, time); hands.second.rotation.z = -Math.PI; renderer.render(scene, camera); };
