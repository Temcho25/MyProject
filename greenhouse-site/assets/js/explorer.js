// Green House Isani — 3D explorer: building → floor → apartment.
// Massing follows the published renders; every floor plan and unit layout here is
// ILLUSTRATIVE (the real per-floor split, areas and plans are not public).
// Known facts used: 7 storeys, 25 apartments, commercial ground floor, 3.0 m ceilings,
// open balconies, 1/2/3-bedroom types, 13 underground parking spaces, green frame, Q2 2028.

const STR = {
  ka: {
    eyebrow: 'Green House Isani',
    title: '3D ტური',
    lead: 'დაატრიალე მოდელი, აირჩიე სართული და გაიარე ბინაში. გეგმარებები საილუსტრაციოა.',
    loading: '3D მოდელი იტვირთება…',
    nogl: '3D ხედი ამ მოწყობილობაზე მიუწვდომელია.',
    illustrative: 'საილუსტრაციო გეგმარება',
    illustrativeShort: 'საილუსტრაციო',
    disclaimer: 'ზუსტი გეგმარებები და ფართები — დეველოპერისგან',
    addr: 'ლეხ კაჩინსკის ქ. 2ა, თბილისი',
    building: 'Green House Isani',
    floor: n => `სართული ${n}`,
    apts: n => `${n} ბინა`,
    apt: c => `ბინა ${c}`,
    commercial: 'კომერციული ფართები',
    parking: 'მიწისქვეშა პარკინგი — 13 ავტოსადგომი',
    types: { 1: '1-საძინებლიანი', 2: '2-საძინებლიანი', 3: '3-საძინებლიანი' },
    typeShort: { 1: '1 საძ.', 2: '2 საძ.', 3: '3 საძ.' },
    all: 'ყველა',
    typeGroup: 'ბინის ტიპი',
    floorsGroup: 'სართულები',
    pickFloor: 'აირჩიე სართული',
    pickUnit: 'აირჩიე ბინა',
    rooms: 'ოთახები',
    about: 'შენობის შესახებ',
    f_floors: 'სართული', f_apts: 'ბინა', f_ceil: 'ჭერი, მ',
    facts: ['ჭერის სიმაღლე — 3.0 მ', 'ღია, შეუმინავი აივნები', 'ჩაბარება — მწვანე კარკასი', 'ჩაბარება — 2028, II კვარტალი'],
    back: 'უკან',
    prev: 'წინა ბინა', next: 'შემდეგი ბინა',
    plan: 'გეგმა', tour: 'ტური', stop: 'გაჩერება',
    room: { living: 'საცხოვრებელი ოთახი', kitchen: 'სამზარეულო', bed: 'საძინებელი', bath: 'სააბაზანო', balcony: 'აივანი', hall: 'შესასვლელი' },
    hint_b: 'გადაატრიალე მოდელი · მონიშნე სართული',
    hint_f: 'მონიშნე ბინა · გადაატრიალე',
    hint_c: 'პირველი სართული · კომერციული ფართები',
    hint_u: 'გადაატრიალე · მიუახლოვდი',
    hint_p: 'გეგმა · ზედხედი',
    hint_t: 'Esc — გაჩერება',
    canvas: 'Green House Isani — ინტერაქტიული 3D მოდელი',
  },
  en: {
    eyebrow: 'Green House Isani',
    title: '3D tour',
    lead: 'Orbit the model, pick a floor and walk through an apartment. Layouts are illustrative.',
    loading: 'Loading 3D model…',
    nogl: '3D view is unavailable on this device.',
    illustrative: 'Illustrative layout',
    illustrativeShort: 'Illustrative',
    disclaimer: 'Exact plans and areas — from the developer',
    addr: '2a Lech Kaczyński St, Tbilisi',
    building: 'Green House Isani',
    floor: n => `Floor ${n}`,
    apts: n => `${n} apartments`,
    apt: c => `Apartment ${c}`,
    commercial: 'Commercial premises',
    parking: 'Underground parking — 13 spaces',
    types: { 1: '1 bedroom', 2: '2 bedrooms', 3: '3 bedrooms' },
    typeShort: { 1: '1 bed', 2: '2 bed', 3: '3 bed' },
    all: 'All',
    typeGroup: 'Apartment type',
    floorsGroup: 'Floors',
    pickFloor: 'Choose a floor',
    pickUnit: 'Choose an apartment',
    rooms: 'Rooms',
    about: 'About the building',
    f_floors: 'storeys', f_apts: 'apartments', f_ceil: 'ceiling, m',
    facts: ['Ceiling height — 3.0 m', 'Open, non-glazed balconies', 'Handover — green frame', 'Delivery — Q2 2028'],
    back: 'Back',
    prev: 'Previous apartment', next: 'Next apartment',
    plan: 'Plan', tour: 'Tour', stop: 'Stop',
    room: { living: 'Living room', kitchen: 'Kitchen', bed: 'Bedroom', bath: 'Bathroom', balcony: 'Balcony', hall: 'Entrance' },
    hint_b: 'Drag to orbit · select a floor',
    hint_f: 'Select an apartment · drag to orbit',
    hint_c: 'Ground floor · commercial premises',
    hint_u: 'Drag to orbit · scroll to zoom',
    hint_p: 'Plan · top view',
    hint_t: 'Esc — stop',
    canvas: 'Green House Isani — interactive 3D model',
  },
};

// ---------------------------------------------------------------- geometry constants (m)
const HALF_W = 12, HALF_D = 7.5, CORR = 0.8, CORE = 2.2;
const UNIT_D = HALF_D - CORR;            // 6.7
const GROUND_H = 4.2, FLOOR_H = 3.3, CEIL = 3.0, BALC = 1.4, TH = 0.3;
const BV = (UNIT_D - BALC) / UNIT_D;     // balcony line as a fraction of unit depth
const ROOF_Y = GROUND_H + 6 * FLOOR_H;   // 24
const GI = 0.5;                          // ground floor set-back under the cantilever
const floorBase = f => (f === 1 ? 0 : GROUND_H + (f - 2) * FLOOR_H);
const floorH = f => (f === 1 ? GROUND_H : FLOOR_H);
const WALL_SCALE = { floor: 0.4, unit: 0.72, plan: 1, tour: 1 };

// ---------------------------------------------------------------- illustrative layout templates
// rooms: [id, kind, u0, v0, u1, v1] in unit fractions; v=0 corridor side, v=1 facade.
// doors: [a, b, t, width] (a='entry' → b is the room on the corridor).
// furn:  [type, room, ax, az, facing, w, d]; ax/az: 0|1 touch wall, (0,1) fraction,
//        >1 metres from min wall to centre, <0 metres from max wall to centre.
const TPL = {
  1: {
    rooms: [
      ['bath', 'bath', 0, 0, 0.40, 0.38],
      ['hall', 'hall', 0.40, 0, 1, 0.30],
      ['bed', 'bed', 0, 0.38, 0.40, 1],
      ['living', 'living', 0.40, 0.30, 1, BV],
      ['balc', 'balcony', 0.40, BV, 1, 1],
    ],
    doors: [['entry', 'hall', 0.62, 0.95], ['hall', 'bath', 0.5, 0.8], ['hall', 'living', 0.45, 1.5], ['living', 'bed', 0.3, 0.85]],
    furn: [
      ['bed', 'bed', 0, 0.58, 'e', 1.6, 2.0], ['wardrobe', 'bed', 0.42, 0, 's', 1.5, 0.6], ['plant', 'bed', 1, 1, 's', 0.5, 0.5],
      ['sofa', 'living', 0, 0.66, 'e', 1.9, 0.9], ['rug', 'living', 1.55, 0.66, 's', 1.7, 2.2], ['coffee', 'living', 1.55, 0.66, 's', 0.55, 0.95],
      ['kitchen', 'living', 1, 0, 'w', 2.1, 0.62], ['dining', 'living', -1.6, -0.75, 's', 1.0, 0.75],
      ['tub', 'bath', 0, 0, 's', 1.7, 0.75], ['vanity', 'bath', 0.55, 1, 'n', 0.9, 0.48], ['wc', 'bath', 0, 1, 'n', 0.4, 0.6],
      ['lounge', 'balc', 0.22, 0.5, 'e', 0.7, 0.7], ['side', 'balc', 0.42, 0.5, 's', 0.42, 0.42], ['lounge', 'balc', 0.62, 0.5, 'w', 0.7, 0.7], ['plant', 'balc', 1, 0.5, 's', 0.55, 0.55],
      ['console', 'hall', 1, 0.5, 'w', 1.0, 0.35],
    ],
    tour: [
      { r: 'hall', p: [0.55, 0.45], L: 'hall', k: [0.45, 2.4] }, { d: 'hall>bath' }, { r: 'bath', p: [0.62, 0.55], L: 'bath', k: [0.1, 0.25] }, { d: 'bath>hall' },
      { d: 'hall>living' }, { r: 'living', p: [0.4, 0.5], L: 'living', k: [0.62, 1.0] }, { r: 'living', p: [0.62, 0.45], L: 'kitchen', k: [1.0, 0.22] },
      { d: 'living>bed' }, { r: 'bed', p: [0.7, 0.3], L: 'bed', k: [0.2, 0.62] }, { d: 'bed>living' }, { d: 'living>balc' }, { r: 'balc', p: [0.45, 0.62], L: 'balcony', k: [0.5, 8, -8] },
    ],
  },
  2: {
    rooms: [
      ['bath', 'bath', 0, 0, 0.31, 0.36],
      ['bed1', 'bed', 0, 0.36, 0.31, 1],
      ['hall', 'hall', 0.31, 0, 0.64, 0.30],
      ['living', 'living', 0.31, 0.30, 0.64, BV],
      ['balc', 'balcony', 0.31, BV, 0.64, 1],
      ['bed2', 'bed', 0.64, 0, 1, 1],
    ],
    doors: [['entry', 'hall', 0.5, 0.95], ['hall', 'bath', 0.5, 0.8], ['hall', 'living', 0.3, 1.2], ['living', 'bed1', 0.3, 0.85], ['living', 'bed2', 0.82, 0.85]],
    furn: [
      ['bed', 'bed1', 0, 0.6, 'e', 1.6, 2.0], ['wardrobe', 'bed1', 0.42, 0, 's', 1.4, 0.6],
      ['bed', 'bed2', 1, 0.6, 'w', 1.6, 2.0], ['wardrobe', 'bed2', 0.5, 0, 's', 1.8, 0.6], ['desk', 'bed2', 0.32, 1, 'n', 1.1, 0.55], ['plant', 'bed2', 1, 1, 's', 0.5, 0.5],
      ['sofa', 'living', 0, 0.7, 'e', 1.8, 0.88], ['rug', 'living', 1.45, 0.7, 's', 1.5, 2.0], ['coffee', 'living', 1.45, 0.7, 's', 0.5, 0.9],
      ['kitchen', 'living', 1, 0, 'w', 1.9, 0.62],
      ['tub', 'bath', 0, 0, 's', 1.7, 0.75], ['vanity', 'bath', 0.62, 1, 'n', 0.8, 0.48], ['wc', 'bath', 0, 1, 'n', 0.4, 0.6],
      ['lounge', 'balc', 0.3, 0.5, 'e', 0.7, 0.7], ['side', 'balc', 0.62, 0.5, 's', 0.42, 0.42], ['plant', 'balc', 1, 0.5, 's', 0.5, 0.5],
      ['console', 'hall', 0.5, 0, 's', 1.0, 0.35],
    ],
    tour: [
      { r: 'hall', p: [0.5, 0.45], L: 'hall', k: [0.45, 2.4] }, { d: 'hall>bath' }, { r: 'bath', p: [0.7, 0.62], L: 'bath', k: [0.15, 0.2] }, { d: 'bath>hall' },
      { d: 'hall>living' }, { r: 'living', p: [0.5, 0.45], L: 'living', k: [0.5, 1.0] }, { r: 'living', p: [0.45, 0.4], L: 'kitchen', k: [1.0, 0.2] },
      { d: 'living>bed1' }, { r: 'bed1', p: [0.72, 0.3], L: 'bed', k: [0.2, 0.62] }, { d: 'bed1>living' },
      { d: 'living>bed2' }, { r: 'bed2', p: [0.25, 0.45], L: 'bed', k: [0.85, 0.65] }, { d: 'bed2>living' }, { d: 'living>balc' }, { r: 'balc', p: [0.45, 0.62], L: 'balcony', k: [0.5, 8, -8] },
    ],
  },
  3: {
    rooms: [
      ['bed3', 'bed', 0, 0, 0.30, 0.48],
      ['bed1', 'bed', 0, 0.48, 0.30, 1],
      ['hall', 'hall', 0.30, 0, 0.50, 0.34],
      ['bath', 'bath', 0.50, 0, 0.72, 0.34],
      ['living', 'living', 0.30, 0.34, 0.72, BV],
      ['balc', 'balcony', 0.30, BV, 0.72, 1],
      ['bath2', 'bath', 0.72, 0, 1, 0.42],
      ['bed2', 'bed', 0.72, 0.42, 1, 1],
    ],
    doors: [['entry', 'hall', 0.55, 0.95], ['hall', 'bed3', 0.5, 0.8], ['hall', 'bath', 0.5, 0.8], ['hall', 'living', 0.5, 1.3],
      ['living', 'bed1', 0.35, 0.85], ['living', 'bed2', 0.4, 0.85], ['bed2', 'bath2', 0.5, 0.75]],
    furn: [
      ['bed', 'bed3', 0.42, 0, 's', 1.4, 2.0], ['wardrobe', 'bed3', 0.42, 1, 'n', 1.4, 0.55],
      ['bed', 'bed1', 0, 0.56, 'e', 1.6, 2.0], ['wardrobe', 'bed1', 0.45, 0, 's', 1.6, 0.6], ['plant', 'bed1', 1, 1, 's', 0.5, 0.5],
      ['bed', 'bed2', 1, 0.56, 'w', 1.6, 2.0], ['desk', 'bed2', 0.3, 1, 'n', 1.0, 0.55],
      ['sofa', 'living', 0, 0.62, 'e', 2.2, 0.9], ['rug', 'living', 1.45, 0.62, 's', 1.9, 2.5], ['coffee', 'living', 1.55, 0.62, 's', 0.55, 1.0],
      ['kitchen', 'living', -1.35, 0, 's', 2.4, 0.62], ['dining', 'living', -1.5, 0.66, 's', 1.4, 0.9], ['plant', 'living', 1, 1, 's', 0.5, 0.5],
      ['shower', 'bath', 1, 0, 's', 0.9, 0.9], ['vanity', 'bath', 0.3, 0, 's', 0.8, 0.48], ['wc', 'bath', 1, 1, 'n', 0.4, 0.6],
      ['tub', 'bath2', 1, 0, 'w', 1.7, 0.75], ['vanity', 'bath2', 0.32, 0, 's', 0.8, 0.48], ['wc', 'bath2', 0, 0.42, 'e', 0.4, 0.6],
      ['lounge', 'balc', 0.25, 0.5, 'e', 0.7, 0.7], ['side', 'balc', 0.4, 0.5, 's', 0.42, 0.42], ['lounge', 'balc', 0.55, 0.5, 'w', 0.7, 0.7], ['plant', 'balc', 1, 0.5, 's', 0.55, 0.55],
    ],
    tour: [
      { r: 'hall', p: [0.5, 0.4], L: 'hall', k: [0.5, 2.6] }, { d: 'hall>bath' }, { r: 'bath', p: [0.42, 0.7], L: 'bath', k: [0.65, 0.05] }, { d: 'bath>hall' },
      { d: 'hall>bed3' }, { r: 'bed3', p: [0.7, 0.75], L: 'bed', k: [0.35, 0.15] }, { d: 'bed3>hall' },
      { d: 'hall>living' }, { r: 'living', p: [0.4, 0.4], L: 'living', k: [0.55, 1.0] }, { r: 'living', p: [0.62, 0.6], L: 'kitchen', k: [0.75, 0.0] },
      { d: 'living>bed1' }, { r: 'bed1', p: [0.72, 0.3], L: 'bed', k: [0.2, 0.62] }, { d: 'bed1>living' },
      { d: 'living>bed2' }, { r: 'bed2', p: [0.25, 0.35], L: 'bed', k: [0.85, 0.62] }, { d: 'bed2>living' }, { d: 'living>balc' }, { r: 'balc', p: [0.42, 0.62], L: 'balcony', k: [0.5, 8, -8] },
    ],
  },
};

// Illustrative distribution: floors 2–6 × 4 + floor 7 × 5 = 25 apartments.
function floorPlan(f) {
  if (f === 1) return [];
  if (f < 7) return [
    { tpl: 3, band: 'S', x0: -12, w: 12, mirror: false },
    { tpl: 2, band: 'S', x0: 0, w: 12, mirror: true },
    { tpl: 2, band: 'N', x0: CORE, w: HALF_W - CORE, mirror: false },
    { tpl: 1, band: 'N', x0: -HALF_W, w: HALF_W - CORE, mirror: false },
  ];
  return [
    { tpl: 1, band: 'S', x0: -12, w: 7.4, mirror: false },
    { tpl: 2, band: 'S', x0: -4.6, w: 9.2, mirror: false },
    { tpl: 1, band: 'S', x0: 4.6, w: 7.4, mirror: true },
    { tpl: 2, band: 'N', x0: CORE, w: HALF_W - CORE, mirror: false },
    { tpl: 1, band: 'N', x0: -HALF_W, w: HALF_W - CORE, mirror: true },
  ];
}

// palette (sRGB hex)
const C = {
  paper: 0xF2F0E9, facade: 0xE6E3DC, slab: 0xDCD8CF, wall: 0xF6F5F1, poche: 0x0B3D27, lime: 0x9BE3B9,
  linen: 0xEFEBE3, oak: 0xC9A47E, oakL: 0xD9BC98, walnut: 0x8A6447, oat: 0xD8CFC0, oatD: 0xC6BCAA, sage: 0x9FB7A1,
  charcoal: 0x2F3633, stone: 0xE9E5DC, worktop: 0x3B403C, white: 0xF8F7F3, water: 0xD5E3E1, plant: 0x7FA889, plantD: 0x5E8C6C,
  pot: 0xCFC6B8, rug: 0xE4DDD0, mirror: 0xCAD5D3, deck: 0xC9A27C, tile: 0xDAD8D2, corridor: 0xD7D3C9, steel: 0x9AA19E,
};
const TYPE_TINT = { 1: 0xEBDDC4, 2: 0xD5E4D3, 3: 0xE8D5C8 };
const TYPE_DOT = { 1: '#D2AE7A', 2: '#7DB88B', 3: '#CF957B' };

export function initExplorer(rootEl) {
  const root = rootEl;
  if (!root || root.__explorer) return;
  root.__explorer = true;
  const lang = document.body.classList.contains('lang-en') ? 'en' : 'ka';
  const T = STR[lang];
  root.classList.add(`ex-${lang}`);
  root.querySelectorAll('[data-ex]').forEach(el => { const v = T[el.dataset.ex]; if (typeof v === 'string') el.textContent = v; });
  const view = root.querySelector('.ex-view');
  view.setAttribute('aria-label', T.canvas);
  let started = false;
  const io = new IntersectionObserver(es => {
    if (!started && es.some(e => e.isIntersecting)) {
      started = true; io.disconnect();
      build(root, T).catch(err => { console.error('[explorer]', err); fail(root, T); });
    }
  }, { rootMargin: '600px 0px' });
  io.observe(root);
}

function fail(root, T) {
  root.classList.add('ex-failed');
  const l = root.querySelector('.ex-loading');
  if (l) { l.innerHTML = ''; l.textContent = T.nogl; }
}

async function build(root, T) {
  const THREE = await import('three');
  const [{ OrbitControls }, { RoomEnvironment }, { RoundedBoxGeometry }, { mergeGeometries }, { CSS2DRenderer, CSS2DObject }] = await Promise.all([
    import('three/addons/controls/OrbitControls.js'),
    import('three/addons/environments/RoomEnvironment.js'),
    import('three/addons/geometries/RoundedBoxGeometry.js'),
    import('three/addons/utils/BufferGeometryUtils.js'),
    import('three/addons/renderers/CSS2DRenderer.js'),
  ]);
  const gsap = window.gsap;
  const V3 = THREE.Vector3;
  const $ = s => root.querySelector(s);
  const view = $('.ex-view'), panel = $('.ex-panel'), body = $('.ex-body'), crumbs = $('.ex-crumbs');
  const tip = $('.ex-tip'), caption = $('.ex-caption'), hint = $('.ex-hint');
  const modes = $('.ex-modes');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mq = matchMedia('(max-width: 820px)');
  const DUR = s => (reduced ? 0.01 : s);

  // ---------------------------------------------------------------- renderer
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { fail(root, T); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mq.matches ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  view.appendChild(renderer.domElement);
  renderer.domElement.classList.add('ex-canvas');

  const labels = new CSS2DRenderer();
  labels.domElement.className = 'ex-labels';
  view.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  camera.position.set(40, 24, 50);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.8;
  controls.target.set(0, 11, 0);

  // lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mq.matches ? 1024 : 2048, mq.matches ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xe8f0ff, 0.45);
  fill.position.set(-30, 18, -20);
  scene.add(fill);
  const SUN_DIR = new V3(0.55, 1, 0.42).normalize();
  function aimSun(target, half) {
    sun.target.position.copy(target);
    sun.position.copy(target).addScaledVector(SUN_DIR, 60);
    const c = sun.shadow.camera;
    c.left = -half; c.right = half; c.top = half; c.bottom = -half; c.near = 1; c.far = 140;
    c.updateProjectionMatrix();
    sun.target.updateMatrixWorld();
    sun.shadow.needsUpdate = true;
  }
  aimSun(new V3(0, 10, 0), 26);

  // ---------------------------------------------------------------- textures (canvas, crisp, no network)
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  function canvasTex(w, h, draw, srgb = true) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, maxAniso);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  // facade panels: tile = 3.0 m × 3.3 m, joints every 1.5 m and at mid-height
  const facadeTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(70,64,52,.16)';
    g.fillRect(0, 0, 3, h); g.fillRect(w / 2, 0, 2, h);
    g.fillRect(0, 0, w, 3); g.fillRect(0, h / 2, w, 2);
  });
  const woodTex = canvasTex(512, 256, (g, w, h) => {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const l = 52 + Math.sin(i * 12.9898) * 4 + (i % 3) * 2;
      g.fillStyle = `hsl(23, 48%, ${l}%)`;
      g.fillRect((i / n) * w, 0, w / n, h);
      g.fillStyle = 'rgba(60,28,10,.45)';
      g.fillRect((i / n) * w, 0, 3, h);
    }
    g.globalAlpha = 0.07;
    for (let y = 0; y < h; y += 3) { g.fillStyle = y % 6 ? '#fff' : '#000'; g.fillRect(0, y, w, 1); }
  });
  const plankTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    const rows = 12;
    for (let r = 0; r < rows; r++) {
      const y = (r / rows) * h, off = (r % 3) * (w / 3);
      g.fillStyle = `rgba(0,0,0,${0.015 + ((r * 7) % 5) * 0.008})`;
      g.fillRect(0, y, w, h / rows);
      g.fillStyle = 'rgba(0,0,0,.09)';
      g.fillRect(0, y, w, 1.5);
      g.fillRect((off) % w, y, 1.5, h / rows);
      g.fillRect((off + w / 2) % w, y, 1.5, h / rows);
    }
  });
  const railTex = canvasTex(128, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, 12); g.fillRect(0, h - 8, w, 8);
    for (let i = 0; i < 4; i++) g.fillRect(i * (w / 4) + 12, 0, 6, h);
  });
  const shadowTex = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(20,40,30,.55)'); gr.addColorStop(0.55, 'rgba(20,40,30,.22)'); gr.addColorStop(1, 'rgba(20,40,30,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });

  // ---------------------------------------------------------------- geometry helpers
  const tmpC = new THREE.Color();
  function prep(g) { return g.index ? g.toNonIndexed() : g; }
  function box(x0, y0, z0, x1, y1, z1) {
    const sx = Math.max(Math.abs(x1 - x0), 0.002), sy = Math.max(Math.abs(y1 - y0), 0.002), sz = Math.max(Math.abs(z1 - z0), 0.002);
    const g = new THREE.BoxGeometry(sx, sy, sz);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return g;
  }
  function rbox(w, h, d, r, x, y, z) {
    const rr = Math.max(0.004, Math.min(r, Math.min(w, h, d) / 2 - 0.002));
    const g = new RoundedBoxGeometry(w, h, d, 2, rr);
    g.translate(x, y, z);
    return g;
  }
  // world-scaled UVs so textures keep their real size on any box
  function wuv(g, su, sv, oy = 0) {
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
      if (ay > 0.5) uv.setXY(i, x / su, z / su);
      else if (ax > 0.5) uv.setXY(i, z / su, (y - oy) / sv);
      else uv.setXY(i, x / su, (y - oy) / sv);
    }
    uv.needsUpdate = true;
    return g;
  }
  // vertex colours; optional different colour for upward faces (wall "poché" tops)
  function paint(g, hex, topHex) {
    g = prep(g);
    const n = g.attributes.normal, a = new Float32Array(n.count * 3);
    const c1 = new THREE.Color(hex), c2 = topHex != null ? new THREE.Color(topHex) : c1;
    for (let i = 0; i < n.count; i++) {
      const c = n.getY(i) > 0.7 ? c2 : c1;
      a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  }
  function merge(list) {
    if (!list.length) return null;
    const m = mergeGeometries(list.map(prep), false);
    list.forEach(g => g.dispose());
    return m;
  }

  // ---------------------------------------------------------------- materials
  const M = {
    facade: new THREE.MeshStandardMaterial({ color: C.facade, map: facadeTex, roughness: 0.82, envMapIntensity: 0.75 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xffffff, map: woodTex, roughness: 0.7, envMapIntensity: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1d2b27, roughness: 0.08, metalness: 0.55, envMapIntensity: 1.5 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1f2522, roughness: 0.5, metalness: 0.3 }),
    rail: new THREE.MeshStandardMaterial({ color: 0x1b201e, alphaMap: railTex, alphaTest: 0.5, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide }),
    led: new THREE.MeshBasicMaterial({ color: 0xffcf9a, toneMapped: false }),
    slab: new THREE.MeshStandardMaterial({ color: C.slab, roughness: 0.9, envMapIntensity: 0.6 }),
  };
  const iGlass = new THREE.MeshStandardMaterial({ color: 0xcfe3dc, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false, envMapIntensity: 1.2 });
  const iRail = M.rail;
  const siteMat = new THREE.MeshStandardMaterial({ color: 0xE9E6DD, roughness: 0.95, envMapIntensity: 0.5 });
  const streetMat = new THREE.MeshStandardMaterial({ color: 0xD3CFC5, roughness: 0.95, envMapIntensity: 0.5 });
  const treeMat = new THREE.MeshStandardMaterial({ color: 0xB4CBAE, roughness: 0.9, flatShading: true, envMapIntensity: 0.6 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8C7A66, roughness: 0.9 });
  const coreMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, envMapIntensity: 0.6 });
  const corrMat = new THREE.MeshStandardMaterial({ color: C.corridor, map: plankTex, roughness: 0.9, envMapIntensity: 0.5 });

  // ---------------------------------------------------------------- site
  const world = new THREE.Group();
  scene.add(world);
  {
    const base = new THREE.Mesh(rbox(46, 0.6, 36, 0.3, 0, -0.3, 0.5), siteMat);
    base.receiveShadow = true;
    world.add(base);
    const street = new THREE.Mesh(box(-23, 0, 11.5, 23, 0.012, 18.4), streetMat);
    street.receiveShadow = true;
    world.add(street);
    const walk = new THREE.Mesh(box(-23, 0, 9.4, 23, 0.06, 11.3), new THREE.MeshStandardMaterial({ color: 0xEEECE5, roughness: 0.9 }));
    walk.receiveShadow = true; walk.castShadow = true;
    world.add(walk);
    const dash = [];
    for (let x = -21; x < 22; x += 3.2) dash.push(box(x, 0.012, 14.9, x + 1.6, 0.02, 15.05));
    world.add(new THREE.Mesh(merge(dash), new THREE.MeshBasicMaterial({ color: 0xF4F2EC })));
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(64, 52), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55 }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(0, -0.62, 1.5);
    world.add(sh);
    // stylised model trees
    const foli = [], trunks = [];
    [[-18, 8.2, 1.15], [-20.5, -6, 1.5], [-17, -12.5, 1.25], [18.5, 7.6, 1.3], [20, -3, 1.05], [17.5, -12, 1.45], [-8, -13.6, 1.1], [7, -13.8, 1.2]].forEach(([x, z, s], i) => {
      trunks.push(box(x - 0.09, 0, z - 0.09, x + 0.09, 2.2 * s, z + 0.09));
      const a = new THREE.IcosahedronGeometry(1.5 * s, 1); a.translate(x, 3.2 * s, z);
      const b = new THREE.IcosahedronGeometry(1.05 * s, 1); b.translate(x + 0.6 * s * (i % 2 ? 1 : -1), 2.5 * s, z + 0.4 * s);
      foli.push(a, b);
    });
    const tm = new THREE.Mesh(merge(trunks), trunkMat); tm.castShadow = true;
    const fm = new THREE.Mesh(merge(foli), treeMat); fm.castShadow = true; fm.receiveShadow = true;
    world.add(tm, fm);
  }

  // ---------------------------------------------------------------- unit layouts
  const layoutCache = new Map();
  function layoutFor(tpl, W, D, extL, extR) {
    const key = `${tpl}|${W}|${extL}|${extR}`;
    if (layoutCache.has(key)) return layoutCache.get(key);
    const t = TPL[tpl];
    const rooms = {}, order = [];
    t.rooms.forEach(([id, kind, u0, v0, u1, v1]) => {
      const r = { id, kind, x0: u0 * W, z0: v0 * D, x1: u1 * W, z1: v1 * D };
      r.cx = (r.x0 + r.x1) / 2; r.cz = (r.z0 + r.z1) / 2;
      rooms[id] = r; order.push(r);
    });
    const E = 1e-3;
    const gaps = [], doors = {};
    const addDoor = (a, b, axis, c, s, w, kind) => {
      const g = { axis, c, a: s - w / 2, b: s + w / 2, kind };
      gaps.push(g);
      const pos = axis === 'v' ? [c, s] : [s, c];
      doors[`${a}|${b}`] = doors[`${b}|${a}`] = { axis, c, s, pos };
      return g;
    };
    const shared = (ra, rb) => {
      if (Math.abs(ra.x1 - rb.x0) < E || Math.abs(ra.x0 - rb.x1) < E) {
        const c = Math.abs(ra.x1 - rb.x0) < E ? ra.x1 : ra.x0;
        const lo = Math.max(ra.z0, rb.z0), hi = Math.min(ra.z1, rb.z1);
        if (hi - lo > E) return { axis: 'v', c, lo, hi };
      }
      if (Math.abs(ra.z1 - rb.z0) < E || Math.abs(ra.z0 - rb.z1) < E) {
        const c = Math.abs(ra.z1 - rb.z0) < E ? ra.z1 : ra.z0;
        const lo = Math.max(ra.x0, rb.x0), hi = Math.min(ra.x1, rb.x1);
        if (hi - lo > E) return { axis: 'h', c, lo, hi };
      }
      return null;
    };
    t.doors.forEach(([a, b, tt, w]) => {
      if (a === 'entry') {
        const r = rooms[b];
        const s = r.x0 + (r.x1 - r.x0) * tt;
        addDoor('corr', b, 'h', 0, s, w, 'door');
        return;
      }
      const e = shared(rooms[a], rooms[b]);
      if (!e) return;
      const s = Math.min(e.hi - w / 2 - 0.12, Math.max(e.lo + w / 2 + 0.12, e.lo + (e.hi - e.lo) * tt));
      addDoor(a, b, e.axis, e.c, s, Math.min(w, e.hi - e.lo - 0.2), 'door');
    });
    // windows + balcony glazing
    const facadeWins = [];      // for the massing: [{axis, c, a, b, kind}]
    const balc = order.find(r => r.kind === 'balcony');
    order.forEach(r => {
      if (r.kind === 'balcony') { facadeWins.push({ axis: 'h', a: r.x0, b: r.x1, kind: 'niche' }); return; }
      const lit = r.kind !== 'hall';
      if (Math.abs(r.z1 - D) < E && lit) {
        const len = r.x1 - r.x0, w = Math.min(r.kind === 'bath' ? 0.7 : 1.7, len * 0.55);
        const g = { axis: 'h', c: D, a: r.cx - w / 2, b: r.cx + w / 2, kind: 'win' };
        gaps.push(g); facadeWins.push({ ...g });
      }
      if (balc) {
        const e = shared(r, balc);
        if (e && e.axis === 'h') {
          const len = e.hi - e.lo, w = len * 0.74, s = (e.lo + e.hi) / 2;
          addDoor(r.id, balc.id, 'h', e.c, s, w, 'glaze');
        }
      }
      const side = (cond, c) => {
        if (!cond || !lit || r.kind === 'bath') return;
        const len = r.z1 - r.z0, w = Math.min(1.3, len * 0.42);
        const g = { axis: 'v', c, a: r.cz - w / 2, b: r.cz + w / 2, kind: 'win' };
        gaps.push(g); facadeWins.push({ ...g });
      };
      side(extL && Math.abs(r.x0) < E, 0);
      side(extR && Math.abs(r.x1 - W) < E, W);
    });

    // wall lines from room edges (balcony front edge = railing, not wall)
    const lines = { h: new Map(), v: new Map() };
    const addLine = (axis, c, a, b) => {
      const k = c.toFixed(3), m = lines[axis];
      if (!m.has(k)) m.set(k, { c, iv: [] });
      m.get(k).iv.push([a, b]);
    };
    order.forEach(r => {
      addLine('h', r.z0, r.x0, r.x1);
      if (!(r.kind === 'balcony' && Math.abs(r.z1 - D) < E)) addLine('h', r.z1, r.x0, r.x1);
      addLine('v', r.x0, r.z0, r.z1);
      addLine('v', r.x1, r.z0, r.z1);
    });
    const wallParts = [], glassParts = [];
    const H = CEIL;
    for (const axis of ['h', 'v']) {
      for (const { c, iv } of lines[axis].values()) {
        iv.sort((p, q) => p[0] - q[0]);
        let merged = [];
        iv.forEach(([a, b]) => {
          const last = merged[merged.length - 1];
          if (last && a <= last[1] + E) last[1] = Math.max(last[1], b); else merged.push([a, b]);
        });
        const lineGaps = gaps.filter(g => g.axis === axis && Math.abs(g.c - c) < E);
        lineGaps.forEach(g => {
          const out = [];
          merged.forEach(([a, b]) => {
            if (g.b <= a || g.a >= b) { out.push([a, b]); return; }
            if (g.a > a) out.push([a, g.a]);
            if (g.b < b) out.push([g.b, b]);
          });
          merged = out;
        });
        // thickness & placement: boundary walls sit inside the unit
        const max = axis === 'h' ? D : W;
        const isLo = Math.abs(c) < E, isHi = Math.abs(c - max) < E;
        const t = isHi && axis === 'h' ? 0.24 : (isLo || isHi) ? 0.11 : 0.1;
        const c0 = isLo ? c : isHi ? c - t : c - t / 2, c1 = c0 + t;
        merged.forEach(([a, b]) => {
          if (b - a < 0.02) return;
          const ea = Math.max(0, a - 0.05), eb = Math.min(axis === 'h' ? W : D, b + 0.05);
          wallParts.push(paint(axis === 'h' ? box(ea, 0, c0, eb, H, c1) : box(c0, 0, ea, c1, H, eb), C.wall, C.poche));
        });
        lineGaps.forEach(g => {
          if (g.kind === 'door') return;
          // slim dark frames + glass
          const fr = 0.05;
          const pieces = axis === 'h'
            ? [box(g.a, 0, c0, g.a + fr, H, c1), box(g.b - fr, 0, c0, g.b, H, c1), box(g.a, H - 0.06, c0, g.b, H, c1)]
            : [box(c0, 0, g.a, c1, H, g.a + fr), box(c0, 0, g.b - fr, c1, H, g.b), box(c0, H - 0.06, g.a, c1, H, g.b)];
          pieces.forEach(p => wallParts.push(paint(p, C.charcoal)));
          const mid = (c0 + c1) / 2;
          if (g.kind === 'glaze') {
            // sliding door: one fixed pane, the other half open
            const m = (g.a + g.b) / 2;
            glassParts.push(axis === 'h' ? box(g.a + fr, 0.02, mid - 0.015, m, H - 0.06, mid + 0.015) : box(mid - 0.015, 0.02, g.a + fr, mid + 0.015, H - 0.06, m));
            wallParts.push(paint(axis === 'h' ? box(m - 0.025, 0, c0, m + 0.025, H, c1) : box(c0, 0, m - 0.025, c1, H, m + 0.025), C.charcoal));
          } else {
            glassParts.push(axis === 'h' ? box(g.a + fr, 0.02, mid - 0.015, g.b - fr, H - 0.06, mid + 0.015) : box(mid - 0.015, 0.02, g.a + fr, mid + 0.015, H - 0.06, g.b - fr));
            wallParts.push(paint(axis === 'h' ? box(g.a, 0.95, mid - 0.02, g.b, 1.0, mid + 0.02) : box(mid - 0.02, 0.95, g.a, mid + 0.02, 1.0, g.b), C.charcoal));
          }
        });
      }
    }
    // floors (tinted by type), entry threshold
    const floorParts = [];
    order.forEach(r => {
      const col = r.kind === 'bath' ? C.tile : r.kind === 'balcony' ? C.deck : TYPE_TINT[tpl];
      floorParts.push(paint(wuv(box(r.x0, 0, r.z0, r.x1, 0.03, r.z1), 2.4, 2.4), col));
    });
    // furniture
    const fparts = [];
    t.furn.forEach(spec => furniture(fparts, spec, rooms));
    const ed = doors['corr|hall'];
    if (ed) fparts.push(paint(box(ed.s - 0.47, 0.03, 0, ed.s + 0.47, 0.045, 0.12), C.charcoal));
    // railing at the open balcony
    const railParts = [];
    if (balc) {
      railParts.push(railGeo(balc.x0, balc.x1, D - 0.06, 1.05));
    }
    const res = {
      rooms, order, doors, gaps, facadeWins,
      walls: merge(wallParts), glass: merge(glassParts), floors: merge(floorParts), furn: merge(fparts), rail: merge(railParts),
    };
    layoutCache.set(key, res);
    return res;
  }

  function railGeo(a, b, z, h) {
    const g = box(a, 0, z - 0.015, b, h, z + 0.015);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.5, p.getY(i) / h);
    return g;
  }

  // ---------------------------------------------------------------- furniture (muted, soft-edged)
  const ROT = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };
  function furniture(out, [type, roomId, ax, az, face, w, d], rooms) {
    const r = rooms[roomId]; if (!r) return;
    const rot = face === 'e' || face === 'w';
    const fx = rot ? d : w, fz = rot ? w : d;
    const gap = 0.06;
    const place = (v, lo, hi, f) => {
      if (v === 0) return lo + gap + f / 2;
      if (v === 1) return hi - gap - f / 2;
      if (v > 1) return lo + v;
      if (v < 0) return hi + v;
      return lo + (hi - lo) * v;
    };
    const px = place(ax, r.x0, r.x1, fx), pz = place(az, r.z0, r.z1, fz);
    const parts = [];
    const add = (g, col) => parts.push(paint(g, col));
    const hw = w / 2, hd = d / 2;
    switch (type) {
      case 'bed':
        add(rbox(w, 0.28, d - 0.04, 0.03, 0, 0.14, 0.02), C.oakL);
        add(rbox(w - 0.08, 0.2, d - 0.16, 0.07, 0, 0.37, 0.06), C.linen);
        add(rbox(w + 0.06, 1.0, 0.08, 0.02, 0, 0.5, -hd + 0.04), C.oak);
        add(rbox(hw - 0.14, 0.13, 0.36, 0.06, -w / 4 + 0.02, 0.53, -hd + 0.34), C.white);
        add(rbox(hw - 0.14, 0.13, 0.36, 0.06, w / 4 - 0.02, 0.53, -hd + 0.34), C.white);
        add(rbox(w - 0.04, 0.06, d * 0.34, 0.03, 0, 0.49, hd - d * 0.17 - 0.06), C.sage);
        break;
      case 'sofa':
        add(rbox(w, 0.2, d, 0.03, 0, 0.14, 0), C.oatD);
        add(rbox((w - 0.36) / 2 - 0.01, 0.16, d - 0.24, 0.06, -(w - 0.36) / 4, 0.32, 0.1), C.oat);
        add(rbox((w - 0.36) / 2 - 0.01, 0.16, d - 0.24, 0.06, (w - 0.36) / 4, 0.32, 0.1), C.oat);
        add(rbox(w - 0.36, 0.42, 0.22, 0.08, 0, 0.45, -hd + 0.12), C.oat);
        add(rbox(0.18, 0.5, d, 0.07, -hw + 0.09, 0.29, 0), C.oatD);
        add(rbox(0.18, 0.5, d, 0.07, hw - 0.09, 0.29, 0), C.oatD);
        add(rbox(0.4, 0.34, 0.12, 0.05, -hw + 0.45, 0.5, -hd + 0.3), C.poche);
        break;
      case 'coffee':
        add(rbox(w, 0.05, d, 0.02, 0, 0.38, 0), C.oak);
        add(rbox(w - 0.16, 0.34, d - 0.16, 0.02, 0, 0.18, 0), C.charcoal);
        break;
      case 'rug':
        add(box(-hw, 0.03, -hd, hw, 0.042, hd), C.rug);
        break;
      case 'console':
        add(rbox(w, 0.8, d, 0.02, 0, 0.4, 0), C.oak);
        break;
      case 'kitchen': {
        add(box(-hw, 0.0, -hd, hw, 0.1, hd - 0.06), C.charcoal);
        add(rbox(w, 0.76, d - 0.02, 0.01, 0, 0.48, 0), C.stone);
        add(box(-hw - 0.01, 0.86, -hd, hw + 0.01, 0.9, hd + 0.01), C.worktop);
        add(box(w * 0.12, 0.9, -0.17, w * 0.12 + 0.5, 0.905, 0.17), C.steel);
        add(box(-w * 0.38, 0.9, -0.2, -w * 0.38 + 0.56, 0.906, 0.2), 0x151816);
        add(box(-hw, 1.5, -hd, hw, 2.25, -hd + 0.34), C.stone);
        for (let x = -hw + 0.6; x < hw - 0.1; x += 0.6) add(box(x - 0.004, 0.14, hd - 0.012, x + 0.004, 0.84, hd), 0xC9C3B6);
        break;
      }
      case 'dining': {
        add(rbox(w, 0.045, d, 0.02, 0, 0.75, 0), C.oak);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => add(box(sx * (hw - 0.1) - 0.025, 0, sz * (hd - 0.1) - 0.025, sx * (hw - 0.1) + 0.025, 0.73, sz * (hd - 0.1) + 0.025), C.charcoal));
        const xs = w > 1.2 ? [-w / 4, w / 4] : [0];
        xs.forEach(x => [-1, 1].forEach(s => {
          add(rbox(0.44, 0.07, 0.42, 0.03, x, 0.45, s * (hd + 0.18)), C.oat);
          add(rbox(0.44, 0.42, 0.05, 0.02, x, 0.68, s * (hd + 0.38)), C.oat);
          add(box(x - 0.18, 0, s * (hd + 0.18) - 0.15, x + 0.18, 0.42, s * (hd + 0.18) + 0.15), C.charcoal);
        }));
        break;
      }
      case 'wardrobe':
        add(rbox(w, 2.25, d, 0.015, 0, 1.125, 0), 0xE6E0D4);
        add(box(-0.004, 0.08, hd - 0.004, 0.004, 2.2, hd + 0.004), 0xB9B2A4);
        add(box(-0.06, 1.0, hd, -0.03, 1.4, hd + 0.02), C.charcoal);
        add(box(0.03, 1.0, hd, 0.06, 1.4, hd + 0.02), C.charcoal);
        break;
      case 'desk':
        add(box(-hw, 0.72, -hd, hw, 0.76, hd), C.oak);
        add(box(-hw, 0, -hd, -hw + 0.04, 0.72, hd), C.charcoal);
        add(box(hw - 0.04, 0, -hd, hw, 0.72, hd), C.charcoal);
        add(rbox(0.46, 0.46, 0.46, 0.06, 0, 0.23, hd + 0.08), C.sage);
        break;
      case 'tub':
        add(rbox(w, 0.56, d, 0.08, 0, 0.28, 0), C.white);
        add(box(-hw + 0.09, 0.561, -hd + 0.09, hw - 0.09, 0.566, hd - 0.09), C.water);
        break;
      case 'shower':
        add(rbox(w, 0.05, d, 0.02, 0, 0.025, 0), C.white);
        add(box(-hw, 0, hd - 0.02, -hw + 0.03, 2.05, hd + 0.01), C.charcoal);
        add(box(-hw, 2.02, hd - 0.02, hw, 2.05, hd + 0.01), C.charcoal);
        break;
      case 'vanity':
        add(rbox(w, 0.42, d, 0.02, 0, 0.62, 0), C.oak);
        add(rbox(w * 0.6, 0.1, d * 0.72, 0.04, 0, 0.88, 0.02), C.white);
        add(box(-w * 0.4, 1.2, -hd, w * 0.4, 1.95, -hd + 0.02), C.mirror);
        break;
      case 'wc':
        add(box(-0.26, 0, -hd, 0.26, 1.1, -hd + 0.16), C.stone);
        add(rbox(0.38, 0.32, 0.52, 0.12, 0, 0.36, -hd + 0.4), C.white);
        break;
      case 'lounge':
        add(rbox(w, 0.34, d, 0.08, 0, 0.17, 0), C.walnut);
        add(rbox(w - 0.1, 0.1, d - 0.12, 0.05, 0, 0.38, 0.03), C.linen);
        add(rbox(w - 0.06, 0.4, 0.12, 0.05, 0, 0.55, -hd + 0.08), C.walnut);
        break;
      case 'side': {
        const g = new THREE.CylinderGeometry(hw, hw * 0.8, 0.48, 24); g.translate(0, 0.24, 0); add(g, C.oak);
        break;
      }
      case 'plant': {
        const p = new THREE.CylinderGeometry(w * 0.36, w * 0.28, 0.42, 20); p.translate(0, 0.21, 0); add(p, C.pot);
        const a = new THREE.IcosahedronGeometry(w * 0.5, 1); a.translate(0, 0.42 + w * 0.55, 0); add(a, C.plant);
        const b = new THREE.IcosahedronGeometry(w * 0.32, 1); b.translate(w * 0.18, 0.42 + w * 1.05, -w * 0.08); add(b, C.plantD);
        break;
      }
    }
    const m = new THREE.Matrix4().makeRotationY(ROT[face] || 0).setPosition(px, 0.03, pz);
    parts.forEach(g => { g.applyMatrix4(m); out.push(g); });
  }

  // ---------------------------------------------------------------- units (illustrative distribution)
  const units = [];
  const floors = {};
  for (let f = 1; f <= 7; f++) {
    floors[f] = { f, units: [], y: floorBase(f), h: floorH(f), interior: null, shell: null, mats: null };
    floorPlan(f).forEach((p, i) => {
      const W = p.w, D = UNIT_D;
      const u = { ...p, f, i, id: `${f}0${i + 1}`, W, D };
      // local (x along width, z from corridor to facade) → world XZ
      u.toWorld = (x, z, out) => {
        const X = p.band === 'S' ? (p.mirror ? p.x0 + W - x : p.x0 + x) : (p.mirror ? p.x0 + x : p.x0 + W - x);
        const Z = p.band === 'S' ? CORR + z : -CORR - z;
        return out.set(X, floorBase(f), Z);
      };
      const a = u.toWorld(0, 0, new V3()), b = u.toWorld(W, 0, new V3());
      u.extL = Math.abs(Math.abs(a.x) - HALF_W) < 0.01;
      u.extR = Math.abs(Math.abs(b.x) - HALF_W) < 0.01;
      u.layout = layoutFor(p.tpl, W, D, u.extL, u.extR);
      u.center = u.toWorld(W / 2, D / 2, new V3());
      u.n = p.band === 'S' ? 1 : -1;                         // facade normal (z)
      floors[f].units.push(u); units.push(u);
    });
  }

  // ---------------------------------------------------------------- building massing (per floor)
  const FACES = {
    S: { o: [-HALF_W, HALF_D], t: [1, 0], n: [0, 1], L: 2 * HALF_W },
    N: { o: [HALF_W, -HALF_D], t: [-1, 0], n: [0, -1], L: 2 * HALF_W },
    E: { o: [HALF_W, HALF_D], t: [0, -1], n: [1, 0], L: 2 * HALF_D },
    W: { o: [-HALF_W, -HALF_D], t: [0, 1], n: [-1, 0], L: 2 * HALF_D },
  };
  function fbox(P, key, F, s0, s1, y0, y1, d0, d1, inset = 0) {
    const ox = F.o[0] - F.n[0] * inset, oz = F.o[1] - F.n[1] * inset;
    const ax = ox + F.t[0] * s0 - F.n[0] * d0, az = oz + F.t[1] * s0 - F.n[1] * d0;
    const bx = ox + F.t[0] * s1 - F.n[0] * d1, bz = oz + F.t[1] * s1 - F.n[1] * d1;
    P[key].push(box(Math.min(ax, bx), y0, Math.min(az, bz), Math.max(ax, bx), y1, Math.max(az, bz)));
  }
  function frail(P, F, s0, s1, y0, h, d, inset = 0) {
    const g = railGeo(0, s1 - s0, 0, h);
    const ang = Math.atan2(-F.t[1], F.t[0]);
    g.rotateY(ang);
    const ox = F.o[0] - F.n[0] * inset, oz = F.o[1] - F.n[1] * inset;
    g.translate(ox + F.t[0] * s0 - F.n[0] * d, y0, oz + F.t[1] * s0 - F.n[1] * d);
    P.rail.push(g);
  }

  function buildShell(fl) {
    const P = { facade: [], wood: [], glass: [], dark: [], rail: [], led: [], slab: [] };
    const y0 = fl.y, H = fl.h;
    if (fl.f === 1) {
      // ground floor: wood-clad, set back, storefront glazing, cantilever soffit with warm light
      const feats = { S: [[1.0, 9.0, 'store'], [10.2, 12.8, 'door'], [14.0, 22.0, 'store']], N: [[3, 8, 'store']], E: [[2.5, 8.5, 'store']], W: [[2.5, 8.5, 'store']] };
      for (const k of Object.keys(FACES)) {
        const F = FACES[k];
        const L = F.L - 2 * GI;
        const Fi = { ...F, o: [F.o[0] - F.t[0] * -GI, F.o[1] - F.t[1] * -GI] };
        const gs = k === 'E' || k === 'W';
        let s = gs ? 0.3 : 0;
        const end = gs ? L - 0.3 : L;
        const solid = (a, b) => fbox(P, 'wood', Fi, a, b, y0, y0 + 3.9, 0, 0.3, GI);
        (feats[k] || []).forEach(([a, b, type]) => {
          if (a > s) solid(s, a);
          fbox(P, 'dark', Fi, a, b, y0, y0 + 0.1, 0, 0.3, GI);
          fbox(P, 'wood', Fi, a, b, y0 + 3.4, y0 + 3.9, 0, 0.3, GI);
          fbox(P, 'glass', Fi, a, b, y0 + 0.1, y0 + 3.4, 0.14, 0.18, GI);
          const step = type === 'door' ? (b - a) / 2 : 1.6;
          for (let x = a; x <= b + 0.01; x += step) fbox(P, 'dark', Fi, Math.max(a, x - 0.03), Math.min(b, x + 0.03), y0 + 0.1, y0 + 3.4, 0.1, 0.16, GI);
          if (type !== 'door') fbox(P, 'dark', Fi, a, b, y0 + 2.86, y0 + 2.92, 0.1, 0.16, GI);
          s = b;
        });
        if (s < end) solid(s, end);
      }
      P.slab.push(box(-HALF_W + GI + 0.3, y0 + 3.86, -HALF_D + GI + 0.3, HALF_W - GI - 0.3, y0 + 3.9, HALF_D - GI - 0.3));
      P.facade.push(wuv(box(-HALF_W, y0 + 3.9, -HALF_D, HALF_W, y0 + H, HALF_D), 3, 3.3, GROUND_H));
      P.led.push(box(-HALF_W + 0.2, y0 + 3.87, HALF_D - 0.16, HALF_W - 0.2, y0 + 3.9, HALF_D - 0.1));
      P.led.push(box(HALF_W - 0.16, y0 + 3.87, -HALF_D + 0.2, HALF_W - 0.1, y0 + 3.9, HALF_D - 0.2));
      P.led.push(box(-HALF_W + 0.1, y0 + 3.87, -HALF_D + 0.2, -HALF_W + 0.16, y0 + 3.9, HALF_D - 0.2));
    } else {
      // residential floor: openings derived from the illustrative plan of this floor
      const feats = { S: [], N: [], E: [], W: [] };
      const p = new V3(), q = new V3();
      fl.units.forEach(u => {
        u.layout.facadeWins.forEach(g => {
          if (g.axis === 'h') {
            u.toWorld(g.a, u.D, p); u.toWorld(g.b, u.D, q);
            const F = FACES[u.band];
            const sa = (p.x - F.o[0]) * F.t[0], sb = (q.x - F.o[0]) * F.t[0];
            feats[u.band].push([Math.min(sa, sb), Math.max(sa, sb), g.kind]);
          } else {
            u.toWorld(g.c, g.a, p); u.toWorld(g.c, g.b, q);
            const k = p.x > 0 ? 'E' : 'W', F = FACES[k];
            const sa = (p.z - F.o[1]) * F.t[1], sb = (q.z - F.o[1]) * F.t[1];
            feats[k].push([Math.min(sa, sb), Math.max(sa, sb), g.kind]);
          }
        });
      });
      for (const k of Object.keys(FACES)) {
        const F = FACES[k];
        const side = k === 'E' || k === 'W';
        const lo = side ? 0 : TH, hi = side ? F.L : F.L - TH;
        const list = feats[k].sort((a, b) => a[0] - b[0]);
        let s = lo;
        const solid = (a, b) => { if (b - a > 0.005) fbox(P, 'facade', F, a, b, y0, y0 + H, 0, TH); };
        list.forEach(([a, b, kind]) => {
          a = Math.max(a, lo); b = Math.min(b, hi);
          if (a > s) solid(s, a);
          if (kind === 'niche') {
            fbox(P, 'facade', F, a, b, y0 + CEIL, y0 + H, 0, TH);
            fbox(P, 'facade', F, a, b, y0, y0 + 0.05, 0, BALC);
            fbox(P, 'wood', F, a, b, y0, y0 + CEIL, BALC, BALC + 0.12);
            if (a > lo + 0.01) fbox(P, 'wood', F, a, a + 0.12, y0, y0 + CEIL, 0, BALC);
            if (b < hi - 0.01) fbox(P, 'wood', F, b - 0.12, b, y0, y0 + CEIL, 0, BALC);
            fbox(P, 'wood', F, a, b, y0 + CEIL - 0.06, y0 + CEIL, 0, BALC);
            fbox(P, 'led', F, a + 0.14, b - 0.14, y0 + CEIL - 0.085, y0 + CEIL - 0.06, 0.04, 0.09);
            const w = b - a;
            fbox(P, 'glass', F, a + w * 0.13, a + w * 0.87, y0 + 0.05, y0 + 2.62, BALC - 0.03, BALC + 0.005);
            fbox(P, 'dark', F, a + w * 0.5 - 0.03, a + w * 0.5 + 0.03, y0 + 0.05, y0 + 2.62, BALC - 0.06, BALC);
            frail(P, F, a + 0.12, b - 0.12, y0 + 0.05, 1.05, 0.05);
          } else {
            fbox(P, 'facade', F, a, b, y0, y0 + 0.12, 0, TH);
            fbox(P, 'facade', F, a, b, y0 + 2.62, y0 + H, 0, TH);
            fbox(P, 'glass', F, a, b, y0 + 0.12, y0 + 2.62, TH - 0.12, TH - 0.08);
            fbox(P, 'dark', F, a - 0.0, b, y0 + 2.58, y0 + 2.62, TH - 0.16, TH - 0.08);
            if (b - a > 1.1) fbox(P, 'dark', F, (a + b) / 2 - 0.025, (a + b) / 2 + 0.025, y0 + 0.12, y0 + 2.62, TH - 0.14, TH - 0.08);
            frail(P, F, a, b, y0 + 0.12, 0.98, 0.05);
          }
          s = b;
        });
        if (s < hi) solid(s, hi);
      }
      P.slab.push(box(-HALF_W + TH, y0 + H - 0.3, -HALF_D + TH, HALF_W - TH, y0 + H, HALF_D - TH));
      // slim shadow-gap at each floor line
      P.dark.push(box(-HALF_W - 0.004, y0 - 0.012, -HALF_D - 0.004, HALF_W + 0.004, y0 + 0.012, HALF_D + 0.004));
    }
    if (fl.f === 7) {
      const y = ROOF_Y;
      // parapet, roof, lift overrun, pergola over a roof terrace
      P.facade.push(box(-HALF_W, y, HALF_D - 0.22, HALF_W, y + 0.5, HALF_D), box(-HALF_W, y, -HALF_D, HALF_W, y + 0.5, -HALF_D + 0.22));
      P.facade.push(box(-HALF_W, y, -HALF_D + 0.22, -HALF_W + 0.22, y + 0.5, HALF_D - 0.22), box(HALF_W - 0.22, y, -HALF_D + 0.22, HALF_W, y + 0.5, HALF_D - 0.22));
      P.slab.push(box(-HALF_W + 0.22, y, -HALF_D + 0.22, HALF_W - 0.22, y + 0.06, HALF_D - 0.22));
      P.facade.push(box(-2, y, -6.6, 2.4, y + 2.6, -2.6));
      P.wood.push(box(-10.6, y + 0.06, 0.2, -0.8, y + 0.12, 6.6));
      [[-10.4, 0.4], [-1, 0.4], [-10.4, 6.4], [-1, 6.4]].forEach(([x, z]) => P.wood.push(box(x - 0.09, y, z - 0.09, x + 0.09, y + 2.7, z + 0.09)));
      P.wood.push(box(-10.6, y + 2.5, 0.25, -0.8, y + 2.7, 0.55), box(-10.6, y + 2.5, 6.25, -0.8, y + 2.7, 6.55));
      for (let x = -10.5; x <= -0.9; x += 0.42) P.wood.push(box(x - 0.04, y + 2.7, 0.1, x + 0.04, y + 2.86, 6.7));
    }
    // materials are per floor so each floor can fade / glow independently
    const mats = {};
    const g = new THREE.Group();
    for (const k of Object.keys(P)) {
      if (!P[k].length) continue;
      if (k === 'facade') P[k].forEach(x => wuv(x, 3, 3.3, GROUND_H));
      if (k === 'wood') P[k].forEach(x => wuv(x, 1.4, 1.4, 0));
      const mat = M[k].clone();
      mats[k] = mat;
      const mesh = new THREE.Mesh(merge(P[k]), mat);
      mesh.castShadow = k !== 'led';
      mesh.receiveShadow = true;
      g.add(mesh);
    }
    fl.mats = mats;
    fl.shell = g;
    // invisible hit volume for floor picking
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF_W + 0.3, H, 2 * HALF_D + 0.3), new THREE.MeshBasicMaterial());
    hit.position.set(0, y0 + H / 2, 0);
    hit.visible = false;
    hit.userData.floor = fl.f;
    fl.hit = hit;
    world.add(g, hit);
  }
  for (let f = 1; f <= 7; f++) buildShell(floors[f]);
  const hitList = Object.values(floors).map(f => f.hit);

  // hover cage (lime) for floors
  function cageGeo(w, h, d, t) {
    const parts = [];
    const x = w / 2, z = d / 2;
    [[-x, -z], [x, -z], [-x, z], [x, z]].forEach(([a, b]) => parts.push(box(a - t, 0, b - t, a + t, h, b + t)));
    [0, h].forEach(y => {
      parts.push(box(-x - t, y - t, -z - t, x + t, y + t, -z + t), box(-x - t, y - t, z - t, x + t, y + t, z + t));
      parts.push(box(-x - t, y - t, -z - t, -x + t, y + t, z + t), box(x - t, y - t, -z - t, x + t, y + t, z + t));
    });
    return merge(parts);
  }
  const cageMat = new THREE.MeshBasicMaterial({ color: C.lime, toneMapped: false, transparent: true, opacity: 0.95 });
  const cages = { 1: new THREE.Mesh(cageGeo(2 * HALF_W + 0.12, GROUND_H, 2 * HALF_D + 0.12, 0.05), cageMat), r: new THREE.Mesh(cageGeo(2 * HALF_W + 0.12, FLOOR_H, 2 * HALF_D + 0.12, 0.05), cageMat) };
  cages[1].visible = cages.r.visible = false;
  world.add(cages[1], cages.r);

  // ---------------------------------------------------------------- floor interiors (lazy)
  function makeTag(u) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ex-tag';
    el.tabIndex = -1;
    el.dataset.unit = u.id;
    el.innerHTML = `<b>${u.id}</b><span><i style="background:${TYPE_DOT[u.tpl]}"></i>${T.typeShort[u.tpl]}</span>`;
    const o = new CSS2DObject(el);
    o.position.set(u.W / 2, 1.9, u.D * 0.55);
    return o;
  }
  function buildInterior(fl) {
    const g = new THREE.Group();
    g.position.y = fl.y;
    const core = [];
    if (fl.f === 1) {
      const y = 0;
      const fm = new THREE.Mesh(wuv(box(-HALF_W + GI, y, -HALF_D + GI, HALF_W - GI, 0.03, HALF_D - GI), 2.4, 2.4), new THREE.MeshStandardMaterial({ color: 0xE6E1D6, map: plankTex, roughness: 0.85 }));
      fm.receiveShadow = true; g.add(fm);
      for (const x of [-8, -4, 4, 8]) for (const z of [-3.2, 3.2]) core.push(paint(box(x - 0.2, 0, z - 0.2, x + 0.2, CEIL, z + 0.2), C.wall, C.poche));
      core.push(paint(box(-CORE, 0, -HALF_D + GI, CORE, CEIL, -1.2), 0xDDD9D0, 0xBDB7AA));
      // storefront line
      const gl = [];
      gl.push(box(-HALF_W + GI, 0, HALF_D - GI - 0.03, HALF_W - GI, CEIL, HALF_D - GI));
      gl.push(box(-HALF_W + GI, 0, -HALF_D + GI, -HALF_W + GI + 0.03, CEIL, HALF_D - GI), box(HALF_W - GI - 0.03, 0, -HALF_D + GI, HALF_W - GI, CEIL, HALF_D - GI));
      core.push(paint(box(-HALF_W + GI, 0, -HALF_D + GI, HALF_W - GI, CEIL, -HALF_D + GI + 0.2), C.wall, C.poche));
      for (let x = -HALF_W + GI; x <= HALF_W - GI + 0.01; x += 1.6) core.push(paint(box(x - 0.03, 0, HALF_D - GI - 0.06, x + 0.03, CEIL, HALF_D - GI), C.charcoal));
      const glass = new THREE.Mesh(merge(gl), iGlass);
      const walls = new THREE.Group();
      const wm = new THREE.Mesh(merge(core), coreMat); wm.castShadow = wm.receiveShadow = true;
      walls.add(wm, glass);
      g.add(walls);
      fl.walls = walls;
      const el = document.createElement('div');
      el.className = 'ex-zone';
      el.innerHTML = `<b>${T.commercial}</b><span>${T.illustrativeShort}</span>`;
      const o = new CSS2DObject(el); o.position.set(0, 1.6, 2.2); g.add(o);
      fl.zone = o;
    } else {
      const cm = new THREE.Mesh(wuv(box(-HALF_W + 0.1, 0, -CORR, HALF_W - 0.1, 0.025, CORR), 2.4, 2.4), corrMat);
      cm.receiveShadow = true; g.add(cm);
      core.push(paint(box(-CORE, 0, -HALF_D + TH, CORE, CEIL, -CORR), 0xDDD9D0, 0xBDB7AA));
      core.push(paint(box(-HALF_W, 0, -CORR, -HALF_W + 0.2, CEIL, CORR), C.wall, C.poche));
      core.push(paint(box(HALF_W - 0.2, 0, -CORR, HALF_W, CEIL, CORR), C.wall, C.poche));
      // lift + stair hint on the core top
      const walls = new THREE.Group();
      const wm = new THREE.Mesh(merge(core), coreMat); wm.castShadow = wm.receiveShadow = true;
      walls.add(wm);
      g.add(walls);
      fl.walls = walls;
      fl.units.forEach(u => {
        const L = u.layout;
        const ug = new THREE.Group();
        const pos = u.toWorld(0, 0, new V3());
        ug.position.set(pos.x, 0, pos.z);
        ug.rotation.y = u.band === 'N' ? Math.PI : 0;
        ug.scale.x = u.mirror ? -1 : 1;
        const mats = {
          wall: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, envMapIntensity: 0.65 }),
          floor: new THREE.MeshStandardMaterial({ vertexColors: true, map: plankTex, roughness: 0.8, envMapIntensity: 0.55 }),
          furn: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, envMapIntensity: 0.6 }),
        };
        const wallG = new THREE.Group();
        const wm2 = new THREE.Mesh(L.walls, mats.wall); wm2.castShadow = wm2.receiveShadow = true;
        const gm = new THREE.Mesh(L.glass, iGlass);
        wallG.add(wm2, gm);
        wallG.scale.y = WALL_SCALE.floor;
        const fm = new THREE.Mesh(L.floors, mats.floor); fm.receiveShadow = true; fm.userData.unit = u;
        const fu = new THREE.Mesh(L.furn, mats.furn); fu.castShadow = fu.receiveShadow = true; fu.userData.unit = u;
        const rail = new THREE.Mesh(L.rail, iRail); rail.castShadow = true;
        const ceil = new THREE.Mesh(box(0, CEIL, 0, u.W, CEIL + 0.02, u.D), new THREE.MeshStandardMaterial({ color: 0xF7F6F2, emissive: 0xE9E6DE, emissiveIntensity: 0.55, roughness: 1, side: THREE.DoubleSide }));
        ceil.visible = false;
        ug.add(wallG, fm, fu, rail, ceil);
        const tag = makeTag(u);
        ug.add(tag);
        g.add(ug);
        Object.assign(u, { group: ug, walls: wallG, glassMesh: gm, mats, floorMesh: fm, furnMesh: fu, ceil, tag, pick: [fm, fu, wm2] });
      });
    }
    g.visible = false;
    world.add(g);
    fl.interior = g;
    fl.interior.updateMatrixWorld(true);
  }

  // ---------------------------------------------------------------- render loop
  let w = 1, h = 1, panelShift = 0, running = false, raf = 0, dirtyN = 2;
  const dirty = (n = 2) => { dirtyN = Math.max(dirtyN, n); };
  controls.addEventListener('change', () => dirty());
  function resize() {
    const r = view.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    panelShift = mq.matches ? 0 : Math.min(w * 0.3, panel.offsetWidth + 24) / 2;
    if (panelShift) camera.setViewOffset(w, h, -panelShift, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    dirty();
  }
  new ResizeObserver(resize).observe(view);
  resize();

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hits = [];
  let pointerIn = false, pointerDirty = false, px = 0, py = 0;

  let lastT = 0, frameDt = 0.016;
  function loop(now) {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(loop);
    frameDt = Math.min(0.5, Math.max(0.001, ((now || 0) - lastT) / 1000)); lastT = now || 0;
    if (tour.active) tourFrame();
    else if (controls.enabled && controls.update()) dirty();
    if (pointerDirty) { pointerDirty = false; pick(); }
    if (dirtyN > 0) {
      dirtyN--;
      renderer.render(scene, camera);
      labels.render(scene, camera);
    }
  }
  new IntersectionObserver(es => {
    running = es[0].isIntersecting;
    if (running && !raf) { dirty(); raf = requestAnimationFrame(loop); }
  }, { rootMargin: '100px 0px' }).observe(view);

  // ---------------------------------------------------------------- state
  const S = { level: 'building', floor: 0, unit: null, mode: '3d', filter: 0, hoverFloor: 0, hoverUnit: null };
  let flight = null;
  const fly = { p: 0 };
  const fP = new V3(), tP = new V3(), fT = new V3(), tT = new V3();
  const tmpV = new V3(), tmpV2 = new V3();
  let fFov = 30, tFov = 30;
  const fS = new THREE.Spherical(), tS = new THREE.Spherical(), cS = new THREE.Spherical();
  function tween(target, vars) {
    if (gsap) return gsap.to(target, { overwrite: 'auto', ...vars });
    const { duration, ease, onUpdate, onComplete, onStart, delay, ...rest } = vars;
    onStart && onStart(); Object.assign(target, rest); onUpdate && onUpdate(); onComplete && onComplete();
    return { kill() {} };
  }
  function fitDist(radius, fov) {
    const vf = (fov * Math.PI) / 180;
    const effW = Math.max(1, w - panelShift * 2);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * (effW / h));
    return radius / Math.sin(Math.min(vf, hf) / 2);
  }
  function setLimits(level) {
    const d = camera.position.distanceTo(controls.target);
    controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
    controls.enableRotate = true; controls.enableZoom = true;
    if (level === 'building') { controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.42; controls.minDistance = d * 0.55; controls.maxDistance = d * 1.35; }
    else if (level === 'floor') { controls.minPolarAngle = 0.12; controls.maxPolarAngle = 1.2; controls.minDistance = d * 0.45; controls.maxDistance = d * 1.4; }
    else if (level === 'unit') { controls.minPolarAngle = 0.08; controls.maxPolarAngle = 1.3; controls.minDistance = d * 0.4; controls.maxDistance = d * 1.6; }
    else if (level === 'plan') { controls.minPolarAngle = 0; controls.maxPolarAngle = 0.02; controls.enableRotate = false; controls.minDistance = d * 0.5; controls.maxDistance = d * 1.4; }
  }
  function looseLimits() {
    controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI; controls.minDistance = 0; controls.maxDistance = Infinity;
  }
  function flyTo(pos, tgt, fov, dur, after) {
    if (flight) flight.kill();
    controls.enabled = false;
    looseLimits();
    fP.copy(camera.position); fT.copy(controls.target); tP.copy(pos); tT.copy(tgt);
    fFov = camera.fov; tFov = fov;
    fS.setFromVector3(tmpV.subVectors(fP, fT));
    tS.setFromVector3(tmpV.subVectors(tP, tT));
    let dTh = tS.theta - fS.theta;
    while (dTh > Math.PI) dTh -= 2 * Math.PI;
    while (dTh < -Math.PI) dTh += 2 * Math.PI;
    const lr0 = Math.log(Math.max(1e-3, fS.radius)), lr1 = Math.log(Math.max(1e-3, tS.radius));
    fly.p = 0;
    root.classList.add('is-flying');
    flight = tween(fly, {
      p: 1, duration: DUR(dur), ease: 'power3.inOut',
      onUpdate() {
        const k = fly.p;
        controls.target.lerpVectors(fT, tT, k);
        cS.radius = Math.exp(lr0 + (lr1 - lr0) * k);
        cS.phi = fS.phi + (tS.phi - fS.phi) * k;
        cS.theta = fS.theta + dTh * k;
        camera.position.setFromSpherical(cS).add(controls.target);
        camera.fov = fFov + (tFov - fFov) * fly.p;
        camera.updateProjectionMatrix();
        camera.lookAt(controls.target);
        dirty();
      },
      onComplete() { flight = null; root.classList.remove('is-flying'); after && after(); },
    });
  }
  const DIR_B = new V3(0.6, 0.36, 0.72).normalize();
  const DIR_F = new V3(0.36, 1.2, 0.78).normalize();
  
  function fadeMat(mat, to, dur) {
    if (!mat) return;
    if (to < 1 && !mat.transparent) { mat.transparent = true; mat.needsUpdate = true; }
    tween(mat, {
      opacity: to, duration: DUR(dur), ease: 'power2.inOut', onUpdate: dirty,
      onComplete() { if (to >= 1 && mat.transparent) { mat.transparent = false; mat.needsUpdate = true; } mat.depthWrite = to > 0.5; },
    });
  }
  function setShellState(sel, dur = 1.3) {
    for (let f = 1; f <= 7; f++) {
      const fl = floors[f];
      const above = sel && f > sel, me = sel && f === sel;
      const ty = above ? 16 + (f - sel) * 2.2 : 0;
      const op = above || me ? 0 : 1;
      if (op > 0) fl.shell.visible = true;
      fl.shell.children.forEach(m => { m.castShadow = op > 0 && m.material !== fl.mats.led; });
      tween(fl.shell.position, { y: ty, duration: DUR(dur), ease: 'power3.inOut', onUpdate: dirty });
      Object.values(fl.mats).forEach(m => fadeMat(m, op, dur * (op ? 1 : 0.7)));
      if (!op) {
        if (gsap) gsap.delayedCall(DUR(dur), () => { if (S.floor === sel) fl.shell.visible = false; dirty(); });
        else fl.shell.visible = false;
      }
    }
  }
  function showInterior(f, on) {
    const fl = floors[f];
    if (!fl.interior) { if (!on) return; buildInterior(fl); }
    const g = fl.interior;
    if (on) {
      g.visible = true;
      fl.walls.scale.y = 0.01;
      tween(fl.walls.scale, { y: WALL_SCALE.floor, duration: DUR(1.1), delay: DUR(0.35), ease: 'power3.out', onUpdate: dirty });
      fl.units.forEach(u => {
        u.walls.scale.y = 0.01;
        tween(u.walls.scale, { y: WALL_SCALE.floor, duration: DUR(1.1), delay: DUR(0.4 + u.i * 0.06), ease: 'power3.out', onUpdate: dirty });
        u.group.visible = true;
        Object.values(u.mats).forEach(m => { m.transparent = true; m.opacity = 0; m.needsUpdate = true; fadeMat(m, 1, 0.9); });
        u.tag.visible = true;
      });
      if (fl.zone) fl.zone.visible = true;
    } else {
      fl.units.forEach(u => { u.tag.visible = false; clearRoomLabels(u); });
      if (fl.zone) fl.zone.visible = false;
      g.visible = false;
    }
    dirty();
  }

  function clearHover() { hoverFloor(0); hoverUnit(null); tip.classList.remove('is-on'); }
  function goBuilding() {
    stopTour(); clearHover();
    const prev = S.floor;
    S.level = 'building'; S.floor = 0; S.unit = null; S.mode = '3d';
    if (prev) showInterior(prev, false);
    setShellState(0);
    aimSun(new V3(0, 10, 0), 26);
    const tgt = new V3(0, 10.8, 0);
    const pos = tgt.clone().addScaledVector(DIR_B, fitDist(21, 30));
    flyTo(pos, tgt, 30, 1.5, () => { setLimits('building'); controls.enabled = true; controls.autoRotate = !reduced; });
    ui();
  }
  function goFloor(f, opts = {}) {
    stopTour(); clearHover();
    controls.autoRotate = false;
    const prev = S.floor;
    if (prev && prev !== f) showInterior(prev, false);
    if (prev !== f) { setShellState(f); showInterior(f, true); }
    else floors[f].units.forEach(u => restoreUnit(u));
    S.level = 'floor'; S.floor = f; S.unit = null; S.mode = '3d';
    applyFilter();
    const y = floors[f].y;
    aimSun(new V3(0, y, 0), 17);
    const tgt = new V3(0, y + 0.6, 0.4);
    const pos = tgt.clone().addScaledVector(DIR_F, fitDist(15.6, 30));
    flyTo(pos, tgt, 30, opts.dur || 1.5, () => { setLimits('floor'); controls.enabled = true; });
    ui();
  }
  function restoreUnit(u) {
    clearRoomLabels(u);
    u.group.visible = true;
    u.ceil.visible = false;
    u.tag.visible = true;
    u.furnMesh.visible = true;
    tween(u.walls.scale, { y: WALL_SCALE.floor, duration: DUR(1), ease: 'power3.inOut', onUpdate: dirty });
  }
  function goUnit(u) {
    stopTour(); clearHover();
    controls.autoRotate = false;
    if (S.floor !== u.f) { goFloor(u.f, { dur: 0.01 }); }
    S.level = 'unit'; S.unit = u; S.mode = '3d';
    floors[u.f].units.forEach(o => {
      if (o === u) {
        o.group.visible = true; o.tag.visible = false; o.furnMesh.visible = true;
        Object.values(o.mats).forEach(m => fadeMat(m, 1, 0.6));
        tween(o.walls.scale, { y: WALL_SCALE.unit, duration: DUR(1.2), ease: 'power3.inOut', onUpdate: dirty });
      } else {
        o.group.visible = true; o.ceil.visible = false; o.tag.visible = false; clearRoomLabels(o);
        o.furnMesh.visible = false;
        fadeMat(o.mats.floor, 0.55, 0.6); fadeMat(o.mats.wall, 0.55, 0.6);
        tween(o.walls.scale, { y: 0.03, duration: DUR(1), ease: 'power3.inOut', onUpdate: dirty });
      }
    });
    makeRoomLabels(u);
    aimSun(u.center, 9);
    flyUnit3D(u, 1.5);
    ui();
  }
  function unitBasis(u) {
    const n = tmpV.set(0, 0, u.n);
    const t = tmpV2.set(u.n, 0, 0);
    return { n, t };
  }
  function flyUnit3D(u, dur) {
    const { n, t } = unitBasis(u);
    const tgt = u.center.clone(); tgt.y += 0.4;
    const dir = new V3().addScaledVector(n, 0.95).addScaledVector(t, 0.38).add(new V3(0, 1.3, 0)).normalize();
    const pos = tgt.clone().addScaledVector(dir, fitDist(Math.max(u.W, u.D) * 0.74, 32));
    flyTo(pos, tgt, 32, dur, () => { setLimits('unit'); controls.enabled = true; });
  }
  function setMode(m) {
    const u = S.unit; if (!u) return;
    if (m === S.mode && m !== 'tour') return;
    if (S.mode === 'tour') stopTour(true);
    S.mode = m;
    floors[u.f].units.forEach(o => { if (o !== u) o.group.visible = m !== 'tour'; });
    if (m === '3d') {
      u.ceil.visible = false;
      tween(u.walls.scale, { y: WALL_SCALE.unit, duration: DUR(1), ease: 'power3.inOut', onUpdate: dirty });
      setRoomLabels(u, true);
      flyUnit3D(u, 1.3);
    } else if (m === 'plan') {
      u.ceil.visible = false;
      tween(u.walls.scale, { y: WALL_SCALE.plan, duration: DUR(1), ease: 'power3.inOut', onUpdate: dirty });
      setRoomLabels(u, true);
      const fov = 11;
      const vf = (fov * Math.PI) / 180;
      const effW = Math.max(1, w - panelShift * 2);
      const hf = 2 * Math.atan(Math.tan(vf / 2) * (effW / h));
      const d = Math.max((u.D / 2 + 0.6) / Math.tan(vf / 2), (u.W / 2 + 0.6) / Math.tan(hf / 2)) + CEIL;
      const tgt = u.center.clone();
      const pos = tgt.clone().add(new V3(0, d, u.n * 0.002 * d));
      flyTo(pos, tgt, fov, 1.4, () => { setLimits('plan'); controls.enabled = true; });
    } else if (m === 'tour') {
      startTour(u);
    }
    ui();
  }

  // ---------------------------------------------------------------- room labels
  function makeRoomLabels(u) {
    clearRoomLabels(u);
    const L = u.layout;
    const counts = {};
    u.roomLabels = L.order.map(r => {
      const el = document.createElement('div');
      el.className = `ex-room ex-room--${r.kind}`;
      const k = r.kind;
      counts[k] = (counts[k] || 0) + 1;
      el.textContent = T.room[k];
      const o = new CSS2DObject(el);
      o.position.set(r.cx, 0.15, r.cz);
      u.group.add(o);
      return o;
    });
    dirty();
  }
  function setRoomLabels(u, on) { (u.roomLabels || []).forEach(o => { o.visible = on; }); dirty(); }
  function clearRoomLabels(u) {
    (u.roomLabels || []).forEach(o => { o.removeFromParent(); o.element.remove(); });
    u.roomLabels = null;
  }

  // ---------------------------------------------------------------- tour
  const tour = { active: false, u: 0, look: null, curve: null, tl: null, eye: new V3(), ahead: new V3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(), dir: new V3(), up: new V3(0, 1, 0) };
  function tourPath(u) {
    const L = u.layout, tpl = TPL[u.tpl];
    const pts = [], marks = [];
    const local = [];
    u.group.updateMatrixWorld(true);
    tpl.tour.forEach(it => {
      if (it.r) {
        const r = L.rooms[it.r];
        local.push([r.x0 + (r.x1 - r.x0) * it.p[0], r.z0 + (r.z1 - r.z0) * it.p[1]]);
        if (it.L) {
          const k = it.k || [0.5, 1];
          const look = u.group.localToWorld(new V3(r.x0 + (r.x1 - r.x0) * k[0], k[2] ?? 1.15, r.z0 + (r.z1 - r.z0) * k[1]));
          marks.push({ i: local.length - 1, key: it.L, room: it.r, look });
        }
      } else if (it.d) {
        const [a, b] = it.d.split('>');
        const dr = L.doors[`${a}|${b}`]; if (!dr) return;
        const rb = L.rooms[b];
        if (dr.axis === 'v') {
          const sg = Math.sign(rb.cx - dr.c) || 1;
          local.push([dr.c - sg * 0.4, dr.s], [dr.c + sg * 0.4, dr.s]);
        } else {
          const sg = Math.sign(rb.cz - dr.c) || 1;
          local.push([dr.s, dr.c - sg * 0.4], [dr.s, dr.c + sg * 0.4]);
        }
      }
    });
    u.group.updateMatrixWorld(true);
    local.forEach(([x, z]) => pts.push(u.group.localToWorld(new V3(x, 1.6, z))));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    const N = 600, lens = curve.getLengths(N), tot = lens[N];
    marks.forEach(mk => { mk.u = lens[Math.round((mk.i / (pts.length - 1)) * N)] / tot; });
    return { curve, marks, tot };
  }
  function startTour(u) {
    if (!gsap) return;
    const { curve, marks, tot } = tourPath(u);
    tour.curve = curve;
    tour.u = 0;
    setRoomLabels(u, false);
    u.ceil.visible = true;
    interiorLight(true);
    tween(u.walls.scale, { y: WALL_SCALE.tour, duration: DUR(0.9), ease: 'power3.inOut', onUpdate: dirty });
    const p0 = curve.getPointAt(0, new V3()), p1 = curve.getPointAt(0.02, new V3());
    controls.enabled = false;
    flyTo(p0, p1, 64, 1.6, () => {
      tour.active = true;
      camera.lookAt(p1);
      const tl = gsap.timeline({ onComplete: () => { gsap.delayedCall(1.4, () => { if (S.mode === 'tour') setMode('3d'); }); } });
      let last = 0;
      const counts = {};
      marks.forEach((mk, k) => {
        counts[mk.key] = (counts[mk.key] || 0) + 1;
        const name = T.room[mk.key];
        const dist = (mk.u - last) * tot;
        if (dist > 0.05) tl.to(tour, { u: mk.u, duration: reduced ? 0.01 : Math.min(4.2, Math.max(1.1, dist / 1.05)), ease: 'sine.inOut', onStart: () => { tour.look = null; caption.classList.remove('is-on'); } });
        tl.call(() => { tour.look = mk.look; showCaption(name, k + 1, marks.length); });
        tl.to({}, { duration: 1.9 });
        last = mk.u;
      });
      tour.tl = tl;
    });
  }
  // walk-through: soft even daylight instead of hard sun shadows inside closed rooms
  function interiorLight(on) {
    sun.castShadow = !on;
    tween(hemi, { intensity: on ? 1.5 : 0.55, duration: DUR(0.8), onUpdate: dirty });
    tween(sun, { intensity: on ? 1.2 : 2.3, duration: DUR(0.8), onUpdate: dirty });
  }
  function showCaption(name, i, n) {
    caption.innerHTML = `<b>${name}</b>`;
    caption.classList.add('is-on');
  }
  function tourFrame() {
    const c = tour.curve;
    c.getPointAt(Math.min(1, tour.u), tour.eye);
    c.getPointAt(Math.min(1, tour.u + 0.03), tour.ahead);
    tour.dir.subVectors(tour.ahead, tour.eye);
    if (tour.dir.lengthSq() < 0.0025) c.getTangentAt(Math.min(1, tour.u), tour.dir);
    tour.dir.y = -0.06; tour.dir.normalize();
    camera.position.copy(tour.eye);
    if (tour.look) tour.ahead.copy(tour.look); else tour.ahead.copy(tour.eye).add(tour.dir);
    tour.m.lookAt(tour.eye, tour.ahead, tour.up);
    tour.q.setFromRotationMatrix(tour.m);
    camera.quaternion.slerp(tour.q, reduced ? 1 : 1 - Math.exp(-frameDt * 3.2));
    dirty();
  }
  function stopTour(silent) {
    caption.classList.remove('is-on');
    if (!tour.active && !tour.tl) return;
    tour.active = false;
    if (tour.tl) { tour.tl.kill(); tour.tl = null; }
    // controls take over from the current eye position
    tmpV.set(0, 0, -1).applyQuaternion(camera.quaternion);
    controls.target.copy(camera.position).addScaledVector(tmpV, 2);
    if (S.unit) { S.unit.ceil.visible = false; }
    interiorLight(false);
    if (!silent && S.unit && S.mode === 'tour') S.mode = '3d';
  }

  // ---------------------------------------------------------------- picking & hover
  function pick() {
    if (!pointerIn || flight || tour.active) return;
    ndc.set((px / w) * 2 - 1, -(py / h) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    hits.length = 0;
    if (S.level === 'building') {
      ray.intersectObjects(hitList, false, hits);
      const f = hits.length ? hits[0].object.userData.floor : 0;
      hoverFloor(f, true);
    } else if (S.level === 'floor' && S.floor > 1) {
      const list = [];
      floors[S.floor].units.forEach(u => { if (passes(u)) list.push(...u.pick); });
      ray.intersectObjects(list, false, hits);
      const hu = hits.length ? (hits[0].object.userData.unit || unitOfMesh(hits[0].object)) : null;
      hoverUnit(hu);
    }
  }
  function unitOfMesh(m) { return units.find(u => u.pick && u.pick.includes(m)) || null; }
  function hoverFloor(f, fromCanvas) {
    if (S.hoverFloor === f) { if (fromCanvas) moveTip(); return; }
    const prev = floors[S.hoverFloor];
    if (prev && prev.mats.facade) { prev.mats.facade.emissive.setHex(0); if (prev.mats.wood) prev.mats.wood.emissive.setHex(0); }
    S.hoverFloor = f;
    cages[1].visible = cages.r.visible = false;
    renderer.domElement.style.cursor = f ? 'pointer' : '';
    if (f && S.level === 'building') {
      const fl = floors[f];
      const c = f === 1 ? cages[1] : cages.r;
      c.visible = true; c.position.y = fl.y;
      if (fl.mats.facade) fl.mats.facade.emissive.setHex(0x1d3a2a);
      if (fl.mats.wood) fl.mats.wood.emissive.setHex(0x1d3a2a);
      tip.innerHTML = `<b>${T.floor(f)}</b><span>${f === 1 ? T.commercial : T.apts(fl.units.length)}</span><em>${T.illustrativeShort}</em>`;
      tip.classList.add('is-on');
      if (fromCanvas) moveTip(); else placeTipAtFloor(f);
    } else tip.classList.remove('is-on');
    root.querySelectorAll('[data-floor]').forEach(b => b.classList.toggle('is-hot', +b.dataset.floor === f));
    dirty();
  }
  function moveTip() { tip.style.transform = `translate(${Math.round(px + 18)}px, ${Math.round(py - 14)}px)`; }
  function placeTipAtFloor(f) {
    const fl = floors[f];
    tmpV.set(HALF_W, fl.y + fl.h / 2, HALF_D).project(camera);
    const x = (tmpV.x * 0.5 + 0.5) * w, y = (-tmpV.y * 0.5 + 0.5) * h;
    tip.style.transform = `translate(${Math.round(x + 16)}px, ${Math.round(y - 14)}px)`;
  }
  function hoverUnit(u) {
    if (S.hoverUnit === u) return;
    const prev = S.hoverUnit;
    if (prev) { prev.mats.floor.emissive.setHex(0); prev.mats.wall.emissive.setHex(0); prev.tag.element.classList.remove('is-hot'); }
    S.hoverUnit = u;
    renderer.domElement.style.cursor = u ? 'pointer' : '';
    if (u) { u.mats.floor.emissive.setHex(0x2f6b49); u.mats.wall.emissive.setHex(0x0e2a1c); u.tag.element.classList.add('is-hot'); }
    root.querySelectorAll('[data-unit]').forEach(b => b.classList.toggle('is-hot', !!u && b.dataset.unit === u.id));
    dirty();
  }
  const passes = u => !S.filter || u.tpl === S.filter;
  function applyFilter() {
    const fl = floors[S.floor]; if (!fl || !fl.interior) return;
    fl.units.forEach(u => {
      const ok = passes(u);
      if (S.level === 'floor') Object.values(u.mats).forEach(m => fadeMat(m, ok ? 1 : 0.16, 0.5));
      u.tag.element.classList.toggle('is-dim', !ok);
    });
    if (S.hoverUnit && !passes(S.hoverUnit)) hoverUnit(null);
  }

  const cvs = renderer.domElement;
  let down = null;
  cvs.addEventListener('pointermove', e => {
    const r = cvs.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top; pointerIn = e.pointerType !== 'touch'; pointerDirty = true;
  });
  cvs.addEventListener('pointerleave', () => { pointerIn = false; hoverFloor(0); hoverUnit(null); });
  cvs.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; controls.autoRotate = false; });
  cvs.addEventListener('pointerup', e => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
    down = null;
    if (moved > 6 || dt > 600 || flight || tour.active) return;
    const r = cvs.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top; pointerIn = true;
    pick();
    if (S.level === 'building' && S.hoverFloor) { const f = S.hoverFloor; hoverFloor(0); goFloor(f); }
    else if (S.level === 'floor' && S.hoverUnit) { const u = S.hoverUnit; hoverUnit(null); goUnit(u); }
    if (e.pointerType === 'touch') { pointerIn = false; }
  });
  view.addEventListener('click', e => {
    const t = e.target.closest('.ex-tag');
    if (t) { const u = units.find(x => x.id === t.dataset.unit); if (u && passes(u)) { hoverUnit(null); goUnit(u); } }
  });
  view.addEventListener('pointerover', e => {
    const t = e.target.closest('.ex-tag');
    if (t && S.level === 'floor') hoverUnit(units.find(x => x.id === t.dataset.unit) || null);
  });

  // ---------------------------------------------------------------- panel UI
  const arrow = '<svg class="ex-arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const backIc = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function ui(focus = true) {
    const { level, floor: f, unit: u } = S;
    const hadFocus = focus && root.contains(document.activeElement) && !modes.contains(document.activeElement);
    root.dataset.level = level;
    root.classList.toggle('is-unit', level === 'unit');
    root.dataset.mode = S.mode;
    // breadcrumb
    const cr = [];
    cr.push(level === 'building' ? `<li><span aria-current="page">${T.building}</span></li>` : `<li><button type="button" data-go="building">${T.building}</button></li>`);
    if (f) cr.push(level === 'floor' ? `<li><span aria-current="page">${T.floor(f)}</span></li>` : `<li><button type="button" data-go="floor" data-f="${f}">${T.floor(f)}</button></li>`);
    if (u) cr.push(`<li><span aria-current="page">${u.id}</span></li>`);
    crumbs.innerHTML = `<ol>${cr.join('')}</ol>`;
    let html = '';
    if (level === 'building') {
      html += `<p class="ex-k">${T.addr}</p><h3 class="ex-h" tabindex="-1">${T.building}</h3>`;
      html += `<dl class="ex-facts"><div><dt>${T.f_floors}</dt><dd>7</dd></div><div><dt>${T.f_apts}</dt><dd>25</dd></div><div><dt>${T.f_ceil}</dt><dd>3.0</dd></div></dl>`;
      html += `<p class="ex-label" id="ex-fl-l">${T.pickFloor}</p><ul class="ex-floors" aria-labelledby="ex-fl-l">`;
      for (let k = 7; k >= 1; k--) {
        html += `<li><button type="button" class="ex-floor" data-go="floor" data-f="${k}" data-floor="${k}"><span class="ex-fn">${k}</span><span class="ex-ft"><b>${T.floor(k)}</b><small>${k === 1 ? T.commercial : T.apts(floors[k].units.length)}</small></span>${arrow}</button></li>`;
      }
      html += '</ul>';
    } else if (level === 'floor') {
      html += `<button type="button" class="ex-back" data-go="building">${backIc}<span>${T.back}</span></button>`;
      html += `<h3 class="ex-h" tabindex="-1">${T.floor(f)}</h3><p class="ex-sub">${f === 1 ? T.commercial : `${T.apts(floors[f].units.length)} · ${T.illustrativeShort}`}</p>`;
      html += `<div class="ex-fsw" role="group" aria-label="${T.floorsGroup}">`;
      for (let k = 7; k >= 1; k--) html += `<button type="button" data-go="floor" data-f="${k}" data-floor="${k}" ${k === f ? 'aria-current="true"' : ''}>${k}</button>`;
      html += '</div>';
      if (f === 1) {
        html += `<ul class="ex-list"><li>${T.commercial}</li><li>${T.parking}</li></ul>`;
      } else {
        html += `<div class="ex-chips" role="group" aria-label="${T.typeGroup}">`;
        html += `<button type="button" data-filter="0" aria-pressed="${S.filter === 0}">${T.all}</button>`;
        [1, 2, 3].forEach(k => { html += `<button type="button" data-filter="${k}" aria-pressed="${S.filter === k}"><i style="background:${TYPE_DOT[k]}"></i>${T.types[k]}</button>`; });
        html += '</div>';
        html += `<p class="ex-label" id="ex-un-l">${T.pickUnit}</p><ul class="ex-units" aria-labelledby="ex-un-l">`;
        floors[f].units.forEach(x => {
          const dim = !passes(x);
          html += `<li><button type="button" class="ex-unit${dim ? ' is-dim' : ''}" data-go="unit" data-unit="${x.id}" ${dim ? 'aria-disabled="true"' : ''}><i style="background:${TYPE_DOT[x.tpl]}"></i><b>${x.id}</b><span>${T.types[x.tpl]}</span>${arrow}</button></li>`;
        });
        html += '</ul>';
      }
    } else if (level === 'unit') {
      const list = floors[u.f].units, idx = list.indexOf(u);
      html += `<button type="button" class="ex-back" data-go="floor" data-f="${u.f}">${backIc}<span>${T.floor(u.f)}</span></button>`;
      html += `<p class="ex-k"><i style="background:${TYPE_DOT[u.tpl]}"></i>${T.types[u.tpl]}</p><h3 class="ex-h" tabindex="-1">${T.apt(u.id)}</h3>`;
      const kinds = {};
      u.layout.order.forEach(r => { kinds[r.kind] = (kinds[r.kind] || 0) + 1; });
      html += `<p class="ex-label">${T.rooms}</p><ul class="ex-rooms">`;
      ['living', 'bed', 'bath', 'balcony', 'hall'].forEach(k => { if (kinds[k]) html += `<li>${T.room[k]}${kinds[k] > 1 ? ` <small>×${kinds[k]}</small>` : ''}</li>`; });
      html += `<li>${T.room.kitchen}</li></ul>`;
      html += `<p class="ex-label">${T.about}</p><ul class="ex-list">${T.facts.map(x => `<li>${x}</li>`).join('')}</ul>`;
      html += `<div class="ex-pn"><button type="button" data-go="unit" data-unit="${list[(idx - 1 + list.length) % list.length].id}" aria-label="${T.prev}">${backIc}</button><span>${idx + 1} / ${list.length}</span><button type="button" data-go="unit" data-unit="${list[(idx + 1) % list.length].id}" aria-label="${T.next}">${arrow}</button></div>`;
    }
    body.innerHTML = html;
    body.scrollTop = 0;
    // modes
    modes.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)));
    const tb = modes.querySelector('[data-mode="tour"] span');
    if (tb) tb.textContent = S.mode === 'tour' ? T.stop : T.tour;
    hint.textContent = level === 'building' ? T.hint_b : level === 'floor' ? (f === 1 ? T.hint_c : T.hint_f) : S.mode === 'plan' ? T.hint_p : S.mode === 'tour' ? T.hint_t : T.hint_u;
    if (hadFocus) { const hd = body.querySelector('.ex-h'); if (hd) hd.focus({ preventScroll: true }); }
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !root.contains(b) || b.closest('.ex-view')) return;
    if (b.dataset.filter != null) {
      S.filter = +b.dataset.filter;
      applyFilter();
      ui(false);
      const nb = body.querySelector(`[data-filter="${S.filter}"]`); if (nb) nb.focus({ preventScroll: true });
      dirty();
      return;
    }
    if (b.dataset.mode) {
      if (b.dataset.mode === 'tour' && S.mode === 'tour') { setMode('3d'); return; }
      setMode(b.dataset.mode);
      return;
    }
    const go = b.dataset.go;
    if (go === 'building') goBuilding();
    else if (go === 'floor') goFloor(+b.dataset.f);
    else if (go === 'unit') {
      const u = units.find(x => x.id === b.dataset.unit);
      if (u && (S.level === 'unit' || passes(u))) goUnit(u);
    }
  });
  root.addEventListener('pointerover', e => {
    const b = e.target.closest('[data-floor],[data-unit]');
    if (!b || b.closest('.ex-view')) return;
    if (S.level === 'building' && b.dataset.floor) hoverFloor(+b.dataset.floor, false);
    if (S.level === 'floor' && b.dataset.unit) hoverUnit(units.find(x => x.id === b.dataset.unit) || null);
  });
  root.addEventListener('pointerout', e => {
    const b = e.target.closest('[data-floor],[data-unit]');
    if (!b || b.closest('.ex-view') || (e.relatedTarget && b.contains(e.relatedTarget))) return;
    if (S.level === 'building') hoverFloor(0); else if (S.level === 'floor') hoverUnit(null);
  });
  root.addEventListener('focusin', e => {
    const b = e.target.closest && e.target.closest('[data-floor],[data-unit]');
    if (!b || b.closest('.ex-view')) return;
    if (S.level === 'building' && b.dataset.floor) hoverFloor(+b.dataset.floor, false);
    if (S.level === 'floor' && b.dataset.unit) hoverUnit(units.find(x => x.id === b.dataset.unit) || null);
  });
  root.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (S.mode === 'tour') setMode('3d');
    else if (S.level === 'unit') goFloor(S.unit.f);
    else if (S.level === 'floor') goBuilding();
    else return;
    e.preventDefault();
  });
  controls.addEventListener('start', () => { controls.autoRotate = false; tip.classList.remove('is-on'); });

  // ---------------------------------------------------------------- go
  controls.autoRotateSpeed = 0.45;
  const tgt0 = new V3(0, 10.8, 0);
  camera.position.copy(tgt0).addScaledVector(DIR_B, fitDist(21, 30));
  controls.target.copy(tgt0);
  camera.lookAt(tgt0);
  setLimits('building');
  controls.autoRotate = !reduced;
  ui(false);
  root.classList.add('is-ready');
  renderer.compile(scene, camera);
  dirty(3);
  if (running && !raf) raf = requestAnimationFrame(loop);

  // test/automation hook (no-op for users)
  root.__ex = { goBuilding, goFloor: f => goFloor(f), goUnit: id => goUnit(units.find(u => u.id === id)), setMode, state: S, hoverFloor: f => hoverFloor(f, false), tour,
    cam: () => ({ p: camera.position.toArray().map(v => +v.toFixed(2)), t: controls.target.toArray().map(v => +v.toFixed(2)), fov: camera.fov, rot: camera.rotation.toArray().slice(0, 3).map(v => +v.toFixed(3)), flight: !!flight, ctl: controls.enabled }) };
}
