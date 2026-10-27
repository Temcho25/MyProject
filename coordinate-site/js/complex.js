/* Coordinate — procedural model of the real complex, built from the official renders and floor plans.
   Units are metres. x = east, z = south, y = up.
   - Three round towers: glass core, floor slabs, 36 vertical fins that flare inward at the base and
     rise past the roof as an open crown, timber roof deck.
   - The stepped, rounded glass commercial building in front, with planted terraces.
   - Park, plaza paths and trees around. */
import * as THREE from "three";

export const FLOOR_H = 3.2, LOBBY_H = 5, TOWER_R = 14.5;
// Tower centres read off the aerial renders (A front-left, B behind, C right).
export const TOWER_POS = { A: [-25, 10], B: [6, -22], C: [35, -1] };
export const towerHeight = floors => LOBBY_H + (floors - 1) * FLOOR_H;

const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);

/* ---------- textures (generated, no downloads) ---------- */
function deckTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  g.fillStyle = "#6b4a33"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 8) { g.fillStyle = `rgba(0,0,0,${.12 + rnd() * .12})`; g.fillRect(0, i, 256, 1.5); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let shared = null;
function materials() {
  if (shared) return shared;
  shared = {
    fin: new THREE.MeshStandardMaterial({ color: 0xc2b9a8, roughness: .45, metalness: .1 }),
    finDark: new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: .5, metalness: .2 }),
    slab: new THREE.MeshStandardMaterial({ color: 0x34373d, roughness: .8 }),
    deck: new THREE.MeshStandardMaterial({ map: deckTexture(), roughness: .9 }),
    lobby: new THREE.MeshStandardMaterial({ color: 0x9fb2c4, roughness: .08, metalness: .6, emissive: 0xffc88a, emissiveIntensity: .25 }),
    comGlass: new THREE.MeshStandardMaterial({ color: 0x5f7488, roughness: .07, metalness: .75 }),
    comBand: new THREE.MeshStandardMaterial({ color: 0x8a7a66, roughness: .4, metalness: .5 }),
    green: new THREE.MeshStandardMaterial({ color: 0x55693f, roughness: 1, flatShading: false }),
    green2: new THREE.MeshStandardMaterial({ color: 0x3a4f2e, roughness: 1 }),
    paving: new THREE.MeshStandardMaterial({ color: 0x8e887d, roughness: .95 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 1 }),
    road: new THREE.MeshStandardMaterial({ color: 0x2b2f38, roughness: 1 }),
  };
  return shared;
}

/* Facade texture drawn once per tower: one cell per bay × floor, so nothing repeats.
   Mostly dark reflective glass, a few softly lit rooms, curtains, balcony railings and slab edges. */
function facadeTexture(floors, bays, seed) {
  const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(seed);
  const small = matchMedia("(pointer: coarse)").matches;             // phones: 4× less texture memory
  const cw = small ? 12 : 24, ch = small ? 18 : 36, W = bays * cw, H = floors * ch, u = cw / 24;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const e = document.createElement("canvas"); e.width = W; e.height = H;
  const g = c.getContext("2d"), ge = e.getContext("2d");
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#3a4658"); sky.addColorStop(1, "#1a2130");
  g.fillStyle = sky; g.fillRect(0, 0, W, H); ge.fillStyle = "#000"; ge.fillRect(0, 0, W, H);
  for (let y = 0; y < floors; y++) for (let x = 0; x < bays; x++) {
    const X = x * cw, Y = H - (y + 1) * ch, k = r();
    g.fillStyle = `rgba(${10 + r() * 30 | 0},${16 + r() * 30 | 0},${28 + r() * 34 | 0},${.25 + r() * .3})`; g.fillRect(X, Y, cw, ch);
    if (k < .055) { const a = .45 + r() * .4; ge.fillStyle = `rgba(255,${200 + r() * 30 | 0},150,${a})`; ge.fillRect(X + 2 * u, Y + 6 * u, cw - 4 * u, ch - 14 * u);
                    g.fillStyle = `rgba(255,214,160,${a * .5})`; g.fillRect(X + 2 * u, Y + 6 * u, cw - 4 * u, ch - 14 * u); }
    else if (k < .2) { g.fillStyle = "rgba(220,210,190,.14)"; g.fillRect(X + 2 * u, Y + 6 * u, cw - 4 * u, ch - 14 * u); }
    g.fillStyle = "rgba(170,190,210,.10)"; g.fillRect(X, Y + ch - 13 * u, cw, 8 * u);   // glass railing
    g.fillStyle = "#11151d"; g.fillRect(X, Y + ch - 4 * u, cw, 4 * u);                   // slab edge
  }
  const map = new THREE.CanvasTexture(c), emi = new THREE.CanvasTexture(e);
  for (const t of [map, emi]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping; }
  return { map, emi };
}
function glassMat(floors, bays, seed) {
  const { map, emi } = facadeTexture(Math.max(1, floors - 1), bays, seed);
  return new THREE.MeshStandardMaterial({ map, emissiveMap: emi, emissive: 0xffd9a8, emissiveIntensity: .45, roughness: .16, metalness: .45 });
}

/* One fin: a rounded vertical blade (elliptic section), bent inward over the bottom few metres
   — the vase-shaped base in the renders. */
function finGeometry(h, width, depth, flareH = 8, flare = 3.2) {
  const g = new THREE.CylinderGeometry(.5, .5, h, 12, 28);
  g.scale(depth, 1, width); g.translate(0, h / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < flareH) { const t = 1 - y / flareH; p.setX(i, p.getX(i) - flare * (1 - Math.sqrt(1 - t * t))); }
  }
  g.computeVertexNormals();
  return g;
}
/* ---------- tower ---------- */
export function buildTower(floors, opts = {}) {
  const m = materials(), R = opts.r || TOWER_R, H = towerHeight(floors), crown = 4.2;
  const grp = new THREE.Group(); grp.name = "tower";
  const seg = opts.lowPoly ? 40 : 64;

  // lobby (double height, recessed glass)
  const lobby = new THREE.Mesh(new THREE.CylinderGeometry(R - 3.6, R - 3.6, LOBBY_H, seg, 1, true), m.lobby);
  lobby.position.y = LOBBY_H / 2; grp.add(lobby);
  // glass core with window texture
  const coreH = H - LOBBY_H;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(R - 1.3, R - 1.3, coreH, seg, 1, true), glassMat(floors, 48, 11 + floors));
  core.position.y = LOBBY_H + coreH / 2; grp.add(core);
  // floor slabs (balcony edges)
  const slabs = new THREE.InstancedMesh(new THREE.CylinderGeometry(R - .25, R - .25, .28, seg), m.slab, floors);
  const M = new THREE.Matrix4();
  for (let f = 0; f < floors; f++) { M.makeTranslation(0, LOBBY_H + f * FLOOR_H, 0); slabs.setMatrixAt(f, M); }
  grp.add(slabs);
  // roof: slab + timber deck + plant room
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(R - .25, R - .25, .5, seg), m.slab); roof.position.y = H; grp.add(roof);
  const deck = new THREE.Mesh(new THREE.CircleGeometry(R - 1.6, seg), m.deck); deck.rotation.x = -Math.PI / 2; deck.position.y = H + .27; grp.add(deck);
  const plant = new THREE.Mesh(new THREE.BoxGeometry(9, 2.6, 7), m.finDark); plant.position.set(-2, H + 1.5, 1); grp.add(plant);

  // fins: alternating wide light / narrow dark (as in the renders)
  const N = opts.fins || 36, finH = H + crown;
  const iw = new THREE.InstancedMesh(finGeometry(finH, 1.0, .75), m.fin, N);
  const q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2;
    q.setFromAxisAngle(up, -a);
    M.compose(v.set(Math.cos(a) * (R - .2), 0, Math.sin(a) * (R - .2)), q, s);
    iw.setMatrixAt(i, M);
  }
  grp.add(iw);
  grp.traverse(o => { if (o.isMesh) { o.castShadow = !opts.noShadow; o.receiveShadow = true; } });
  grp.userData = { height: H, crown, R, floors };
  return grp;
}

/* ---------- stepped commercial building ---------- */
function roundedRect(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
export function buildCommercial() {
  const m = materials(), grp = new THREE.Group(); grp.name = "commercial";
  const levels = 10, fh = 4.0;
  let last = null;
  for (let i = 0; i < levels; i++) {
    const w = 44 - i * 1.1, d = 26 - i * 1.25, ox = i * .45, oz = -i * .7;   // terraces step back to the north-east
    const glass = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(w, d, Math.min(10, d / 2 - .1)), { depth: fh - .45, bevelEnabled: false, curveSegments: 10 }), m.comGlass);
    glass.rotation.x = -Math.PI / 2; glass.position.set(ox, i * fh, oz); grp.add(glass);
    const band = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(w + 1.2, d + 1.2, Math.min(10.6, d / 2 + .5)), { depth: .45, bevelEnabled: false, curveSegments: 10 }), m.comBand);
    band.rotation.x = -Math.PI / 2; band.position.set(ox, i * fh + fh - .45, oz); grp.add(band);
    last = { w, d, ox, oz };
  }
  const top = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(last.w - 1, last.d - 1, Math.min(9, last.d / 2 - .6)), { depth: .3, bevelEnabled: false }), m.deck);
  top.rotation.x = -Math.PI / 2; top.position.set(last.ox, levels * fh, last.oz); grp.add(top);
  grp.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  grp.userData = { height: levels * fh };
  return grp;
}

/* ---------- landscape ---------- */
export function buildSite(opts = {}) {
  const m = materials(), grp = new THREE.Group(); grp.name = "site";
  const flat = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); o.receiveShadow = true; grp.add(o); return o; };
  flat(new THREE.ShapeGeometry(roundedRect(170, 120, 26), 12), m.paving, 6, .03, 2);
  [[-58, 38, 40, 34, 14], [60, 36, 44, 30, 12], [-60, -34, 34, 40, 14], [62, -40, 38, 30, 12], [8, 50, 40, 12, 6]]
    .forEach(([x, z, w, d, r], i) => flat(new THREE.ShapeGeometry(roundedRect(w, d, r), 8), i % 2 ? m.green2 : m.green, x, .06, z));
  // trees (instanced): cypress cones and round canopies, kept off buildings and the road
  const nTrees = opts.trees ?? 140;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.25, .35, 2.4, 6), m.trunk, nTrees);
  const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(1.4, 9, 10), m.green2, nTrees);
  const balls = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3, 1), m.green, nTrees);
  const M = new THREE.Matrix4(), Z = new THREE.Matrix4().makeScale(0, 0, 0), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const blocked = (x, z) => Object.values(TOWER_POS).some(([tx, tz]) => Math.hypot(x - tx, z - tz) < TOWER_R + 5) ||
    (x > -16 && x < 38 && z > 8 && z < 46) ;
  let n = 0, tries = 0;
  while (n < nTrees && tries++ < 5000) {
    const x = (rnd() - .5) * 200, z = (rnd() - .5) * 150;
    if (blocked(x, z) || Math.hypot(x / 100, z / 75) > 1) continue;
    const k = .7 + rnd() * .6;
    q.identity(); M.compose(v.set(x, 1.2 * k, z), q, sc.set(k, k, k)); trunks.setMatrixAt(n, M);
    if (rnd() < .45) { M.compose(v.set(x, 6.5 * k, z), q, sc.set(k, k, k)); cones.setMatrixAt(n, M); balls.setMatrixAt(n, Z); }
    else { q.setFromAxisAngle(up, rnd() * 6); M.compose(v.set(x, 4.6 * k, z), q, sc.set(k, k * .85, k)); balls.setMatrixAt(n, M); cones.setMatrixAt(n, Z); }
    n++;
  }
  trunks.count = cones.count = balls.count = n;
  for (const o of [trunks, cones, balls]) { o.castShadow = !opts.noShadow; grp.add(o); }
  return grp;
}

/* Glowing band around one floor (apartment selector). */
export function floorBand(R = TOWER_R) {
  const mk = (r, h, op) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 72, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xf3dfae, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  const g = new THREE.Group(); g.add(mk(R + .9, FLOOR_H * .9, .85), mk(R + 2.2, FLOOR_H * 1.6, .18)); return g;
}

export function lights(scene, { shadow = true, mapSize = 2048, extent = 120 } = {}) {
  scene.add(new THREE.HemisphereLight(0xcfd8ec, 0x2a2418, .55));
  const sun = new THREE.DirectionalLight(0xffd6a0, 2.6);                   // low golden-hour sun from the south-west
  sun.position.set(-160, 120, 140);
  if (shadow) {
    sun.castShadow = true; sun.shadow.mapSize.set(mapSize, mapSize);
    const c = sun.shadow.camera; c.left = c.bottom = -extent; c.right = c.top = extent; c.near = 10; c.far = 520;
    sun.shadow.bias = -.0004; sun.shadow.normalBias = .4;
  }
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9db4ff, .5); rim.position.set(120, 80, -160); scene.add(rim);
  return sun;
}
