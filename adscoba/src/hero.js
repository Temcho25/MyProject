// Hero + finale 3D scene: liquid-glass sculpture, orbit of real project screens, dust.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

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

  // ---- Liquid glass sculpture ----
  const uniforms = { uTime: { value: 0 }, uAmp: { value: 0.32 }, uPulse: { value: 0 } };
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.04,
    transmission: 1, thickness: 1.6, ior: 1.45,
    iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [120, 700],
    clearcoat: 1, clearcoatRoughness: 0.05,
    attenuationColor: new THREE.Color(0x7a5cff), attenuationDistance: 1.6,
    envMapIntensity: 1,
  });
  glassMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; uniform float uAmp; uniform float uPulse; ${NOISE}
        float disp(vec3 p){ return snoise(p*0.9 + vec3(0., uTime*0.25, uTime*0.12))*uAmp + snoise(p*2.3 - uTime*0.2)*0.06 + uPulse*0.15; }`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        vec3 pos0 = position; float d0 = disp(pos0);
        vec3 tng = normalize(cross(normal, vec3(0.,1.,0.) + 0.001));
        vec3 btg = normalize(cross(normal, tng));
        float e = 0.02;
        vec3 pa = pos0 + tng*e; pa += normalize(pa)*disp(pa);
        vec3 pb = pos0 + btg*e; pb += normalize(pb)*disp(pb);
        vec3 pc = pos0 + normal*d0;
        objectNormal = normalize(cross(pa - pc, pb - pc));
        if (dot(objectNormal, normal) < 0.) objectNormal = -objectNormal;`)
      .replace('#include <begin_vertex>', `vec3 transformed = position + normal * d0;`);
  };
  const detail = mobile ? 48 : 96;
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, detail), glassMat);
  world.add(blob);

  // Chrome core seen through the glass.
  const core = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.42, 0.13, 160, 24, 2, 3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.12, envMapIntensity: 2 })
  );
  world.add(core);

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
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.92, toneMapped: false });
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
  screens.rotation.x = 0.18;
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

    uniforms.uTime.value = t;
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

    blob.rotation.y += dt * 0.15;
    blob.rotation.x = Math.sin(t * 0.2) * 0.3;
    uniforms.uAmp.value = 0.24 + s * 0.3 + f * 0.12 + Math.sin(t * 0.7) * 0.03;
    core.rotation.x += dt * 0.5; core.rotation.y += dt * 0.35;
    rings.rotation.y = t * 0.12; rings.rotation.z = Math.sin(t * 0.25) * 0.2;
    screens.rotation.y = t * 0.05 + s * 2.2 + f * 1.5;
    screens.position.y = -s * 0.5;
    dust.rotation.y = t * 0.01 + s * 0.4;
    dust.position.z = s * 4; // foreground dust rushes past while dollying in

    renderer.render(scene, camera);
  }
  frame();

  return {
    state,
    pulse(v) { uniforms.uPulse.value = v; },
  };
}
