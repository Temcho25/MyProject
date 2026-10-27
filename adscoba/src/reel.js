// Pinned "fly-through" reel: camera travels along a helix of curved project screens.
// Scroll speed bends the screens and splits RGB — motion blur by relative movement.
import * as THREE from 'three';

export function createReel(canvas, { textures, mobile, onActive }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x07070a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07070a, 4, 17);
  const camera = new THREE.PerspectiveCamera(mobile ? 70 : 55, 1, 0.1, 60);

  const N = textures.length;
  const R = 6.2;            // helix radius
  const STEP_A = 0.62;      // angle between screens
  const STEP_Y = -1.25;     // vertical drop between screens
  const W = mobile ? 3.6 : 5.0, H = W * 0.625;

  const shared = { uVel: { value: 0 }, uTime: { value: 0 } };
  const items = [];
  const geo = new THREE.PlaneGeometry(W, H, 32, 8);

  for (let i = 0; i < N; i++) {
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, transparent: true, fog: true,
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        uMap: { value: textures[i] }, uVel: shared.uVel, uTime: shared.uTime,
        uFocus: { value: 0 }, uR: { value: R }, uAspect: { value: textures[i].image ? textures[i].image.width / textures[i].image.height : 1.6 },
      },
      vertexShader: `
        uniform float uVel; uniform float uTime; uniform float uR; varying vec2 vUv; varying float vBend;
        #include <fog_pars_vertex>
        void main(){
          vUv = uv; vec3 p = position;
          // curve screen along the helix + velocity wave
          p.z += (p.x*p.x)/(2.*uR);
          float wave = sin(uv.x*3.1416) * uVel * 1.4;
          p.z += wave; p.y += sin(uv.x*6.283 + uTime*2.)*uVel*0.15;
          vBend = wave;
          vec4 mvPosition = modelViewMatrix*vec4(p,1.);
          gl_Position = projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `
        uniform sampler2D uMap; uniform float uVel; uniform float uFocus; uniform float uAspect; varying vec2 vUv; varying float vBend;
        #include <fog_pars_fragment>
        void main(){
          // cover-fit 16:10 plane
          vec2 uv = vUv; float planeA = 1.6;
          if (uAspect > planeA) { uv.x = (uv.x-.5)*planeA/uAspect+.5; } else { uv.y = (uv.y-.5)*uAspect/planeA+.5; }
          float s = clamp(abs(uVel),0.,1.)*0.012;
          vec4 c;
          c.r = texture2D(uMap, uv + vec2(s,0.)).r;
          c.g = texture2D(uMap, uv).g;
          c.b = texture2D(uMap, uv - vec2(s,0.)).b;
          c.a = 1.;
          // soft rounded edges
          vec2 q = abs(vUv-.5)*2.; float r = .04;
          vec2 d = max(q - (1.-r), 0.); float edge = 1. - smoothstep(r*.6, r, length(d));
          float dim = mix(.3, 1., uFocus);
          gl_FragColor = vec4(c.rgb*dim, edge);
          #include <fog_fragment>
        }`,
    });
    const m = new THREE.Mesh(geo, mat);
    const a = i * STEP_A;
    m.position.set(Math.cos(a) * R, i * STEP_Y, Math.sin(a) * R);
    m.lookAt(0, m.position.y, 0);
    scene.add(m);
    items.push(m);
  }

  // Helix guide: a dotted spine of light running through the screens.
  const pts = [];
  for (let k = -20; k < N * 20 + 40; k++) {
    const a = (k / 20) * STEP_A; pts.push(new THREE.Vector3(Math.cos(a) * (R + 0.9), (k / 20) * STEP_Y - H * 0.62, Math.sin(a) * (R + 0.9)));
  }
  const spine = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.PointsMaterial({ color: 0x7c5cff, size: 0.05, transparent: true, opacity: 0.8, fog: true }));
  scene.add(spine);

  // Starfield for depth.
  const sp = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) {
    const a = Math.random() * Math.PI * 2, r = 10 + Math.random() * 20;
    sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = 5 - Math.random() * (N * 1.4 + 15); sp[i * 3 + 2] = Math.sin(a) * r;
  }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(sp, 3)),
    new THREE.PointsMaterial({ color: 0x9fb4ff, size: 0.06, transparent: true, opacity: 0.6, fog: false }));
  scene.add(stars);

  const state = { progress: 0, smooth: 0, visible: false, active: -1, mx: 0, my: 0 };
  let lastP = 0;
  const clock = new THREE.Clock();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    state.mx = (e.clientX / window.innerWidth) * 2 - 1;
    state.my = (e.clientY / window.innerHeight) * 2 - 1;
  });

  const look = new THREE.Vector3();
  function frame() {
    requestAnimationFrame(frame);
    if (!state.visible) { clock.getDelta(); return; }
    const t = clock.getElapsedTime();
    // inertia: camera follows scroll with weight
    state.smooth += (state.progress - state.smooth) * 0.08;
    const f = state.smooth * (N - 1);
    const vel = (state.smooth - lastP) * 60; lastP = state.smooth;
    shared.uVel.value += (THREE.MathUtils.clamp(vel * 1.6, -0.8, 0.8) - shared.uVel.value) * 0.12;
    shared.uTime.value = t;

    // Camera sits on the helix axis side, slightly inside, facing the current screen.
    const a = f * STEP_A;
    const camR = mobile ? 0.2 : 0.6;
    camera.position.set(Math.cos(a + Math.PI) * camR + state.mx * 0.25, f * STEP_Y + 0.15 - state.my * 0.15, Math.sin(a + Math.PI) * camR);
    look.set(Math.cos(a) * R, f * STEP_Y, Math.sin(a) * R);
    camera.lookAt(look);
    camera.rotateZ(-shared.uVel.value * 0.08 + Math.sin(t * 0.4) * 0.008);

    const idx = Math.round(f);
    items.forEach((m, i) => {
      const d = Math.abs(f - i);
      m.material.uniforms.uFocus.value = THREE.MathUtils.clamp(1 - d, 0, 1);
      const sc = 1 + Math.max(0, 1 - d) * 0.06;
      m.scale.setScalar(sc);
    });
    if (idx !== state.active) { state.active = idx; onActive && onActive(idx); }
    stars.rotation.y = t * 0.01;
    renderer.render(scene, camera);
  }
  frame();
  return { state };
}
