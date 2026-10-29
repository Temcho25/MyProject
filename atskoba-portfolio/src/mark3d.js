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
  EdgesGeometry, LineSegments, LineBasicMaterial, GridHelper, Vector3, Vector2,
  IcosahedronGeometry, PointLight, BackSide,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

// Mirror floor shader: the planar reflection fades with distance from the object standing on
// it, so the mirror dissolves into the page instead of showing a hard edge.
const MirrorShader = {
  name: 'AtskobaMirror',
  uniforms: {
    color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    uCenter: { value: new Vector2() }, uRadius: { value: 1 }, uOpacity: { value: 0.4 },
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform float uRadius;
    uniform float uOpacity;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vec4 base = texture2DProj(tDiffuse, vUv);
      // Seen at a grazing angle the reflection lands on the floor in front of the object (towards
      // the camera), so fade sideways by x, softly towards the viewer, and quickly behind.
      float dx = abs(vWorld.x - uCenter.x);
      float dz = vWorld.z - uCenter.y;
      float fade = (1.0 - smoothstep(uRadius * 0.2, uRadius, dx))
        * (1.0 - smoothstep(0.0, uRadius * 0.25, -dz))
        * (1.0 - smoothstep(uRadius * 0.3, uRadius * 3.2, dz));
      gl_FragColor = vec4(base.rgb, base.a * fade * uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

// 3D simplex noise (Ashima Arts, MIT) for the liquid chrome surface.
const NOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+2.0*C.xxx;vec3 x3=x0-1.0+3.0*C.xxx;
  i=mod(i,289.0);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=1.0/7.0;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

// Studio environment for chrome: soft light strips, a wine panel and dark gaps, so the
// mirror surface has something beautiful to reflect.
function chromeEnvironment(pmrem) {
  const env = new Scene();
  env.add(new Mesh(new BoxGeometry(20, 20, 20), new MeshBasicMaterial({ color: 0x8f8b83, side: BackSide })));
  const panel = (w, h, color, x, y, z, ry = 0) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color, side: 2 }));
    m.position.set(x, y, z); m.rotation.y = ry; m.lookAt(0, 0, 0); env.add(m);
  };
  panel(14, 2.2, 0xffffff, 0, 7, 3);        // long top softbox
  panel(2, 12, 0xfff3e2, -8.5, 0, 2);        // warm side strip
  panel(2, 12, 0xffffff, 8.5, 1, -1);        // cool side strip
  panel(9, 6, 0x7d1d2c, 0, -2, -9);          // wine panel behind
  panel(20, 5, 0x141412, 0, -8, 0);          // dark floor bounce
  return pmrem.fromScene(env, 0.035).texture;
}

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

  // ---- Mirror floor (skipped on low-end devices: it renders the scene a second time).
  let mirror = null;
  if (!lowEnd) {
    const res = mobile ? 384 : 1024;
    mirror = new Reflector(new PlaneGeometry(60, 60), {
      textureWidth: res, textureHeight: res, clipBias: 0.003, shader: MirrorShader, multisample: mobile ? 0 : 2,
    });
    mirror.material.transparent = true;
    mirror.material.depthWrite = false;
    mirror.rotation.x = -Math.PI / 2;
    mirror.renderOrder = -1;
    scene.add(mirror);
  }

  // ---- Lab: liquid chrome object with real-time normals.
  const chromeEnv = chromeEnvironment(pmrem);
  const blobU = { uTime: { value: 0 }, uAmp: { value: 0.2 }, uFreq: { value: 1.4 } };
  const blobMat = new MeshPhysicalMaterial({
    color: 0xffffff, metalness: 1, roughness: 0.05, envMap: chromeEnv, envMapIntensity: 1.25, clearcoat: 1, clearcoatRoughness: 0.04,
  });
  blobMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, blobU);
    sh.vertexShader = 'uniform float uTime; uniform float uAmp; uniform float uFreq;\n' + NOISE + `
      float bump(vec3 p){ return snoise(p * uFreq + vec3(0.0, uTime * 0.35, uTime * 0.2)) * uAmp; }
      vec3 orth(vec3 v){ return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y)); }
    ` + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `
        vec3 nrm = normalize(position);
        vec3 tg = orth(nrm); vec3 bt = normalize(cross(nrm, tg));
        vec3 pa = normalize(position + tg * 0.01), pb = normalize(position + bt * 0.01);
        vec3 d0 = nrm * (1.0 + bump(nrm)), da = pa * (1.0 + bump(pa)), db = pb * (1.0 + bump(pb));
        vec3 objectNormal = normalize(cross(da - d0, db - d0));
        if (dot(objectNormal, nrm) < 0.0) objectNormal = -objectNormal;
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`)
      .replace('#include <begin_vertex>', 'vec3 transformed = d0;');
  };
  const blob = new Mesh(new IcosahedronGeometry(1, mobile || lowEnd ? 24 : 64), blobMat);
  blob.visible = false;
  scene.add(blob);
  const lightA = new PointLight(0xff4d5e, 0, 0, 2);
  const lightB = new PointLight(0xfff1dc, 0, 0, 2);
  const bulbGeo = new SphereGeometry(0.06, 24, 16);
  const bulbA = new Mesh(bulbGeo, new MeshBasicMaterial({ color: 0xff6b78 }));
  const bulbB = new Mesh(bulbGeo, new MeshBasicMaterial({ color: 0xffffff }));
  lightA.add(bulbA);
  lightB.add(bulbB);
  scene.add(lightA, lightB);
  // Compile every program once up front (blob, lit materials with both lights, mirror), so the
  // first visit to the lab doesn't freeze on shader compilation mid-scroll. Lights stay in the
  // scene at intensity 0 — toggling their visibility would trigger recompiles.
  blob.visible = true;
  renderer.compile(scene, camera);
  blob.visible = false;

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
    labOn: 0,                 // lab scene on screen, 0 → 1
    scrollY: 0,               // written by the page ticker (no layout read here)
    lab: 0,                   // chapter position inside the lab, 0 → 3
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
  const sm = { out: 0, fin: 0, on: 0, k: 0, labOn: 0, lab: 0, vel: 0 };
  let lastScroll = 0;
  const BB = { x: 0, y: 0, r: 1, o: 0 }, MB = { x: 0, y: 0, r: 1, o: 0 }; // reused per frame

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
    sm.labOn = damp(sm.labOn, state.labOn, 7, dt);
    sm.lab = damp(sm.lab, state.lab, 5, dt);
    const sy = state.scrollY;
    sm.vel = damp(sm.vel, Math.min(3, Math.abs(sy - lastScroll) / Math.max(dt, 0.001) / 1500), 5, dt);
    lastScroll = sy;
    const { out, fin, on, k } = sm;
    const labOn = sm.labOn;

    const heroVis = 1 - out;
    const visible = heroVis > 0.005 || on > 0.005 || fin > 0.005 || labOn > 0.005;
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

    // ---- Lab: liquid chrome in three modes (flow → mirror → moving light).
    blob.visible = labOn > 0.005;
    const lk = sm.lab;
    const L0 = 1 - sstep(0.65, 1.15, lk), L2 = sstep(1.65, 2.15, lk), L1 = Math.max(0, 1 - L0 - L2);
    let blobOn = false;
    if (blob.visible) {
      const rad = mobile ? Math.min(worldW * 0.26, worldH * 0.15) : Math.min(worldW * 0.15, worldH * 0.27);
      const dir = state.lab < 1.5 ? 1 : -1; // enter from below, leave upward
      const bx = mobile ? 0 : worldW * 0.2;
      const by = (mobile ? worldH * 0.18 : 0.02 * worldH) - (1 - labOn) * worldH * 0.9 * dir;
      blob.position.set(bx, by + Math.sin(time * 0.8) * 0.04 * idle, 0);
      blob.scale.setScalar(rad);
      blob.rotation.set(time * 0.15 * idle + mouse.y * 0.4, time * 0.22 * idle + mouse.x * 0.6, 0);
      const mo = reduced ? 0 : 1; // reduced motion: a still sculpture, no flow
      blobU.uTime.value += dt * (0.6 + L0 * 0.9 + sm.vel * 1.5) * mo;
      blobU.uAmp.value = 0.24 * L0 + 0.015 * L1 + 0.09 * L2 + sm.vel * 0.05 * (1 - L1) * mo;
      blobU.uFreq.value = 1.25 * L0 + 0.8 * L1 + 2.1 * L2;
      blobMat.roughness = 0.05 + L2 * 0.08;
      const a = time * 1.1;
      lightA.position.set(bx + Math.cos(a) * rad * 1.9, by + Math.sin(a * 0.7) * rad * 0.6, Math.sin(a) * rad * 1.9);
      lightB.position.set(bx + Math.cos(a + Math.PI) * rad * 1.7, by + rad * 0.5, Math.sin(a + Math.PI) * rad * 1.7);
      lightA.intensity = lightB.intensity = L2 * labOn * 18 * rad * rad;
      bulbA.visible = bulbB.visible = L2 * labOn > 0.05; // unlit meshes: toggling is free
      blobOn = true;
      BB.x = bx; BB.y = by - rad * 1.12; BB.r = rad * 2.2; BB.o = 0.28 + L1 * 0.32;
    } else {
      lightA.intensity = lightB.intensity = 0;
      bulbA.visible = bulbB.visible = false;
    }

    // ---- Mirror floor under whichever object owns the screen.
    if (mirror) {
      const markOn = (1 - fin) * Math.max(heroVis * Math.min(r, s), on * (1 - w2));
      MB.x = mark.position.x; MB.y = mark.position.y - sc * 0.42; MB.r = sc * 1.4; MB.o = 0.34;
      const lo = blobOn ? labOn : 0;
      const wB = lo / (lo + markOn + 1e-5); // blend smoothly between the two owners: no pop
      const bx2 = MathUtils.lerp(MB.x, BB.x, wB), by2 = MathUtils.lerp(MB.y, BB.y, wB);
      const strength = Math.max(lo, markOn);
      mirror.visible = strength > 0.01;
      mirror.position.set(bx2, by2, 0);
      mirror.material.uniforms.uCenter.value.set(bx2, 0);
      mirror.material.uniforms.uRadius.value = MathUtils.lerp(MB.r, BB.r, wB);
      mirror.material.uniforms.uOpacity.value = MathUtils.lerp(MB.o, BB.o, wB) * strength;
      shadow.material.opacity *= 0.55; // the reflection now carries most of the grounding
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
