// Hero scene: Sasperia's own vector emblem, extruded in gold, floating over the night river.
// Planes: near dust (soft, out of focus) · emblem · river surface with a moving gold streak.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const INK = 0x0b100e;

export async function initHero(canvas, { emblemUrl, quality = 'high' } = {}) {
  const lowEnd = quality === 'low';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowEnd, powerPreference: 'high-performance' });
  const maxDpr = lowEnd ? 1.25 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(INK, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.FogExp2(INK, 0.075);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  // ---------- Emblem ----------
  const emblem = new THREE.Group();
  scene.add(emblem);
  const svgText = await (await fetch(emblemUrl)).text();
  const svg = new SVGLoader().parse(svgText);
  const shapes = [];
  svg.paths.forEach((p) => SVGLoader.createShapes(p).forEach((s) => shapes.push(s)));
  const relief = new THREE.ExtrudeGeometry(shapes, {
    depth: 16, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.6, bevelSegments: lowEnd ? 1 : 3, curveSegments: lowEnd ? 6 : 10,
  });
  relief.computeBoundingBox();
  const bb = relief.boundingBox;
  const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2;
  const size = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y);
  const S = 2.6 / size;
  relief.translate(-cx, -cy, 0);
  relief.scale(S, -S, S); // SVG y points down
  relief.computeVertexNormals();

  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xd9b67c, metalness: 1, roughness: 0.26, clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 1.25,
  });
  const reliefMesh = new THREE.Mesh(relief, gold);
  reliefMesh.position.z = 0.02;
  emblem.add(reliefMesh);

  // Dark enamel disc behind the gold lines.
  const R = 1.3 * 1.005;
  const discGeo = new THREE.CylinderGeometry(R, R, 0.07, 128, 1);
  discGeo.rotateX(Math.PI / 2);
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0x0d1411, metalness: 0.7, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.18 });
  const disc = new THREE.Mesh(discGeo, enamel);
  disc.position.z = -0.03;
  emblem.add(disc);

  // ---------- River surface ----------
  const riverUniforms = {
    uTime: { value: 0 },
    uGold: { value: new THREE.Color(0xe7c48c) },
    uDeep: { value: new THREE.Color(0x06100e) },
    uTeal: { value: new THREE.Color(0x2c4d49) },
    uStreak: { value: 0 },
    uFogColor: { value: scene.background },
  };
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60, 1, 1),
    new THREE.ShaderMaterial({
      uniforms: riverUniforms,
      vertexShader: /* glsl */`
        varying vec3 vWorld;
        void main(){ vec4 w = modelMatrix * vec4(position,1.); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uGold; uniform vec3 uDeep; uniform vec3 uTeal; uniform float uStreak; uniform vec3 uFogColor;
        varying vec3 vWorld;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
        void main(){
          vec2 p = vWorld.xz;
          float t = uTime;
          float w1 = fbm(vec2(p.x*0.9 + t*0.05, p.y*2.6 + t*0.55));
          float w2 = fbm(vec2(p.x*1.7 - t*0.08, p.y*4.0 + t*0.9) + w1);
          float ripple = w1*0.6 + w2*0.4;
          float dist = length(vWorld.xz - cameraPosition.xz);
          float streakX = exp(-pow((vWorld.x + (ripple-0.5)*0.9) * 1.25, 2.));
          float streakZ = smoothstep(-14., -1.0, vWorld.z) * smoothstep(5.5, 0.0, vWorld.z);
          float glints = smoothstep(0.62, 0.8, w2) * streakX * streakZ;
          vec3 col = mix(uDeep, uTeal, ripple*0.55);
          col += uGold * (streakX*streakZ*0.16 + glints*1.6) * (0.55 + uStreak*0.6);
          col += vec3(0.75,0.8,0.78) * smoothstep(0.86, 0.97, w2) * 0.05;
          float fog = 1.0 - exp(-pow(dist*0.075, 2.0));
          gl_FragColor = vec4(mix(col, uFogColor, clamp(fog,0.,1.)), 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    })
  );
  river.rotation.x = -Math.PI / 2;
  river.position.y = -1.85;
  scene.add(river);

  // ---------- Gold dust with depth of field ----------
  const COUNT = lowEnd ? 420 : 1100;
  const pos = new Float32Array(COUNT * 3), seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = Math.random() * 7 - 2;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    seed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const dustUniforms = { uTime: { value: 0 }, uFocus: { value: 6.2 }, uPx: { value: renderer.getPixelRatio() }, uVel: { value: 0 } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: dustUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uFocus; uniform float uPx; uniform float uVel;
      attribute float aSeed; varying float vBlur; varying float vA;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + uTime*(0.05 + aSeed*0.08) + uVel*aSeed*0.6 + 2.0, 7.0) - 2.0;
        p.x += sin(uTime*0.3 + aSeed*20.)*0.25;
        p.z += cos(uTime*0.25 + aSeed*13.)*0.25;
        vec4 mv = modelViewMatrix * vec4(p,1.);
        float d = -mv.z;
        vBlur = clamp(abs(d - uFocus) / 4.5, 0., 1.);
        vA = (0.35 + aSeed*0.65) * smoothstep(0.2, 1.2, d) * (1.0 - smoothstep(12., 18., d));
        gl_PointSize = uPx * (2.0 + vBlur*22.0) * (6.0 / d) * (0.6 + aSeed*0.6);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying float vBlur; varying float vA;
      void main(){
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float edge = mix(0.15, 0.95, vBlur);
        float a = 1.0 - smoothstep(1.0 - edge, 1.0, r);
        a *= mix(1.0, 0.22, vBlur) * vA;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * a, a);
      }`,
  }));
  scene.add(dust);

  // ---------- Light ----------
  const key = new THREE.SpotLight(0xffd59a, 60, 30, 0.5, 0.7, 1.4);
  key.position.set(-4, 5, 6);
  scene.add(key, key.target);
  const rimLight = new THREE.PointLight(0x7fb7ad, 18, 20, 1.6);
  rimLight.position.set(3.5, 1.2, -3);
  scene.add(rimLight);
  const sweep = new THREE.PointLight(0xffe2b0, 0, 12, 1.4);
  scene.add(sweep);
  scene.add(new THREE.AmbientLight(0x2a2620, 0.6));

  // ---------- Post ----------
  let composer = null, bloom = null;
  if (!lowEnd) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.6, 0.78);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // ---------- State ----------
  const state = { portrait: false, progress: 0, intro: 0, px: 0, py: 0, spx: 0, spy: 0, vel: 0, running: true, time: 0, external: false };
  const clock = new THREE.Clock();

  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer && composer.setSize(w, h);
    bloom && bloom.setSize(w / 2, h / 2);
    camera.aspect = w / h;
    state.portrait = camera.aspect < 0.75;
    camera.fov = state.portrait ? 50 : 34; // keep the emblem whole on tall phones
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const ease = (t) => t * t * (3 - 2 * t);
  const tmp = new THREE.Vector3();

  function frame(t) {
    const p = state.progress;
    const intro = ease(Math.min(1, state.intro));
    state.spx += (state.px - state.spx) * 0.05;
    state.spy += (state.py - state.spy) * 0.05;

    const orbit = Math.sin(t * 0.12) * 0.16 + state.spx * 0.22 + p * 0.95;
    const radius = (state.portrait ? 8.4 : 6.6) - p * 1.6 + (1 - intro) * 1.8;
    const height = 0.25 + Math.sin(t * 0.21) * 0.06 - state.spy * 0.25 - p * 0.9;
    camera.position.set(Math.sin(orbit) * radius, height, Math.cos(orbit) * radius);
    // Landscape: emblem sits right of the headline. Portrait: above it.
    const side = state.portrait ? 0 : -Math.min(2.4, (camera.aspect - 0.75) * 2.5) * (1 - p * 0.6);
    tmp.set(side, -p * 1.1 - (state.portrait ? 1.5 : 0.32) * (1 - p), 0);
    camera.lookAt(tmp);
    camera.rotation.z += Math.sin(t * 0.17) * 0.012 - state.spx * 0.02;

    emblem.position.y = (1 - intro) * -2.6 + Math.sin(t * 0.6) * 0.06 + p * p * -2.2;
    emblem.rotation.y = Math.sin(t * 0.3) * 0.18 + p * Math.PI * 0.85 + (1 - intro) * -1.2;
    emblem.rotation.x = Math.sin(t * 0.23) * 0.05 + p * 0.5;
    emblem.rotation.z = Math.sin(t * 0.19) * 0.03;
    emblem.scale.setScalar(1 - p * 0.15);

    sweep.position.set(Math.sin(t * 0.45) * 3.2, 1.4 + Math.cos(t * 0.3) * 0.6, 2.4);
    sweep.intensity = 14 * intro;
    key.intensity = 60 * intro;
    rimLight.intensity = 18 * (0.4 + intro * 0.6);

    riverUniforms.uTime.value = t;
    riverUniforms.uStreak.value = intro * (1 - p * 0.6);
    dustUniforms.uTime.value = t;
    dustUniforms.uVel.value += (state.vel - dustUniforms.uVel.value) * 0.08;
    dustUniforms.uFocus.value = camera.position.distanceTo(emblem.position);

    renderer.toneMappingExposure = 0.35 + intro * 0.7 - p * 0.25;
    if (composer) composer.render(); else renderer.render(scene, camera);
  }

  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!state.running || state.external) return;
    state.time += Math.min(clock.getDelta(), 0.05);
    frame(state.time);
  }
  loop();

  const onVis = () => { state.running = document.visibilityState === 'visible'; clock.getDelta(); };
  document.addEventListener('visibilitychange', onVis);

  return {
    setProgress(v) { state.progress = Math.max(0, Math.min(1, v)); },
    setIntro(v) { state.intro = v; },
    setPointer(x, y) { state.px = x; state.py = y; },
    setVelocity(v) { state.vel = v; },
    pause() { state.running = false; },
    resume() { state.running = true; clock.getDelta(); },
    // Deterministic frame for video capture (time in seconds).
    renderAt(t) { state.external = true; state.spx = state.px; state.spy = state.py; frame(t); },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis);
      renderer.dispose();
    },
  };
}
