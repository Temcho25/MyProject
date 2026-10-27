// Hero + finale 3D scene: liquid-glass sculpture, orbit of real project screens, dust.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';



export function createHero(canvas, { textures, mobile }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07070a, 0.045);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(mobile ? 50 : 38, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const world = new THREE.Group();
  scene.add(world);

  // Colored lights give the glass something to refract and pick up.
  const l1 = new THREE.PointLight(0x7c5cff, 60, 20); l1.position.set(-4, 3, 3); scene.add(l1);
  const l2 = new THREE.PointLight(0x00e0ff, 50, 20); l2.position.set(4, -2, 2); scene.add(l2);
  const l3 = new THREE.PointLight(0xc6ff4a, 30, 20); l3.position.set(0, 4, -4); scene.add(l3);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  // ---- Glass logo: the Atskoba "A" as a thick bevelled glass slab ----
  // Shape follows the SVG mark (40x40 viewBox), centred and flipped to Y-up.
  const S = 0.085;
  const P = (x, y) => new THREE.Vector2((x - 20) * S, (19 - y) * S);
  const shape = new THREE.Shape([P(20, 3), P(37, 35), P(27.5, 35), P(20, 20.5), P(12.5, 35), P(3, 35)]);
  const logoGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.42, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.12, bevelSegments: mobile ? 6 : 12, curveSegments: 8,
  });
  logoGeo.center();
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03,
    transmission: 1, thickness: 0.9, ior: 1.5, dispersion: 4,
    iridescence: 0.9, iridescenceIOR: 1.5, iridescenceThicknessRange: [180, 620],
    clearcoat: 1, clearcoatRoughness: 0.04,
    attenuationColor: new THREE.Color(0xcff6ff), attenuationDistance: 3,
    envMapIntensity: 0.9,
  });
  const logo = new THREE.Mesh(logoGeo, glassMat);
  const logoPivot = new THREE.Group();
  logoPivot.add(logo);
  world.add(logoPivot);

  // Glowing iris disc behind the logo: gives the glass colour to bend.
  const gc = document.createElement('canvas'); gc.width = gc.height = 512;
  const g2 = gc.getContext('2d');
  const grad = g2.createRadialGradient(256, 256, 10, 256, 256, 256);
  grad.addColorStop(0, '#c6ff4a'); grad.addColorStop(0.28, '#00e0ff'); grad.addColorStop(0.55, '#7c5cff'); grad.addColorStop(1, '#07070a');
  g2.fillStyle = grad; g2.fillRect(0, 0, 512, 512);
  const haloTex = new THREE.CanvasTexture(gc); haloTex.colorSpace = THREE.SRGBColorSpace;
  const halo = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ map: haloTex, toneMapped: false }));
  halo.position.z = -2.2;
  world.add(halo);

  // The dot of the mark becomes a chrome ball resting in the notch.
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.08, envMapIntensity: 2.2 })
  );
  dot.position.set(0, (19 - 29) * S, 0);
  logoPivot.add(dot);

  // Thin orbit rings.
  const rings = new THREE.Group();
  [2.15, 2.5, 2.9].forEach((r, i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.006 + i * 0.002, 8, 220),
      new THREE.MeshBasicMaterial({ color: [0x7c5cff, 0x00e0ff, 0xc6ff4a][i], transparent: true, opacity: 0.55 })
    );
    m.rotation.set(Math.PI / 2 + (i - 1) * 0.35, i * 0.4, 0);
    rings.add(m);
  });
  world.add(rings);

  // ---- Orbit of project screens (real screenshots) ----
  const screens = new THREE.Group();
  const n = Math.min(textures.length, mobile ? 8 : 12);
  const R = mobile ? 4.4 : 5.6;
  for (let i = 0; i < n; i++) {
    const tex = textures[i];
    const w = 1.6, h = 1.0;
    const g = new THREE.PlaneGeometry(w, h, 16, 1);
    // bend each screen to follow the orbit
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k); p.setZ(k, -(x * x) / (2 * R) * 1.2); }
    g.computeVertexNormals();
    // opaque so the glass logo can refract them (transmission only sees opaque objects)
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false });
    const m = new THREE.Mesh(g, mat);
    const a = (i / n) * Math.PI * 2;
    m.position.set(Math.cos(a) * R, Math.sin(i * 1.7) * 0.9, Math.sin(a) * R);
    m.lookAt(0, m.position.y, 0);
    m.rotateY(Math.PI);
    // thin glowing frame
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(w * 1.02, h * 1.03)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
    );
    frame.position.z = -0.01;
    m.add(frame);
    screens.add(m);
  }
  screens.rotation.x = 0.38; // near side of the orbit passes below the logo, not across it
  world.add(screens);

  // ---- Dust (foreground / background parallax) ----
  const count = mobile ? 900 : 2600;
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
    seed[i] = Math.random();
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float aSeed; uniform float uTime; uniform float uPR; varying float vS;
      void main(){ vec3 p = position; p.y += sin(uTime*0.3 + aSeed*20.)*0.25; p.x += cos(uTime*0.2 + aSeed*12.)*0.25;
      vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
      gl_PointSize = (2. + aSeed*5.) * uPR * (6. / -mv.z); vS = aSeed; }`,
    fragmentShader: `varying float vS; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d);
      vec3 c = mix(vec3(.49,.36,1.), vec3(0.,.88,1.), vS); c = mix(c, vec3(.78,1.,.29), step(.93,vS));
      gl_FragColor = vec4(c, a*(.25+vS*.45)); }`,
  });
  const dust = new THREE.Points(dg, dustMat);
  scene.add(dust);

  // ---- State driven from the page ----
  const state = { scroll: 0, finale: 0, mx: 0, my: 0, tmx: 0, tmy: 0, visible: true, intro: 0 };
  const clock = new THREE.Clock();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // keep the sculpture in frame on narrow screens
    world.position.x = w > 900 ? 2.5 : 0;
    world.position.y = w > 900 ? -0.1 : 1.5;
    world.scale.setScalar(w > 900 ? 1 : 0.72);
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    state.tmx = (e.clientX / window.innerWidth) * 2 - 1;
    state.tmy = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function frame() {
    requestAnimationFrame(frame);
    if (!state.visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    state.mx += (state.tmx - state.mx) * 0.05;
    state.my += (state.tmy - state.my) * 0.05;

    dustMat.uniforms.uTime.value = t;
    const f = state.finale; // 0..1 on the closing section
    const s = state.scroll * (1 - f); // hero dolly, released as the finale pulls back
    const intro = state.intro;

    // Camera: slow orbit drift + mouse parallax; scroll dollies through the sculpture.
    const orbit = t * 0.06 + s * 1.2;
    const dist = THREE.MathUtils.lerp(9, 3.2, s) + (1 - intro) * 6 + f * 1.2;
    camera.position.x = Math.sin(orbit) * 0.8 + state.mx * 0.9;
    camera.position.y = state.my * -0.6 + s * 1.2 - f * 0.4;
    camera.position.z = dist;
    camera.lookAt(world.position.x * (1 - s * 0.7), world.position.y + s * 0.6, 0);
    camera.rotation.z += Math.sin(t * 0.3) * 0.01 + state.mx * -0.04;

    // slow turntable with a weighted sway; scroll adds a half turn
    logoPivot.rotation.y = Math.sin(t * 0.35) * 0.55 + s * Math.PI * 0.9 + f * Math.PI * 2 + state.mx * 0.35;
    logoPivot.rotation.x = Math.sin(t * 0.27) * 0.12 + state.my * 0.15;
    logoPivot.position.y = Math.sin(t * 0.8) * 0.06;
    halo.rotation.z = t * 0.2; halo.scale.setScalar(1 + Math.sin(t * 0.9) * 0.04 + s * 0.3);
    dot.position.y = (19 - 29) * S + Math.abs(Math.sin(t * 1.6)) * 0.12; // the ball bounces in its notch
    rings.rotation.y = t * 0.12; rings.rotation.z = Math.sin(t * 0.25) * 0.2;
    screens.rotation.y = t * 0.05 + s * 2.2 + f * 1.5;
    screens.position.y = -0.2 - s * 0.5;
    dust.rotation.y = t * 0.01 + s * 0.4;
    dust.position.z = s * 4; // foreground dust rushes past while dollying in

    renderer.render(scene, camera);
  }
  frame();

  return {
    state,
  };
}
