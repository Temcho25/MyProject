import * as THREE from 'three';
import { quality } from './quality.js';

// Cities where the studio is present (from the Instagram profile name).
export const CITIES = [
  { lat: 44.2233, lon: 42.0578 }, // Cherkessk
  { lat: 38.4237, lon: 27.1428 }, // Izmir
  { lat: 41.6168, lon: 41.6367 }  // Batumi (home)
];

const R = 2;
function toVec(lat, lon, r = R) {
  const phi = (90 - lat) * Math.PI / 180;
  const th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

function arcCurve(a, b) {
  const va = toVec(a.lat, a.lon), vb = toVec(b.lat, b.lon);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const h = va.distanceTo(vb) * 0.55;
  mid.setLength(R + h);
  return new THREE.QuadraticBezierCurve3(va, mid, vb);
}

export async function initGlobe(canvas, labelsEl) {
  const q = quality();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(q.dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.y = 0;
  camera.position.set(0, 0, 9.2);

  const globe = new THREE.Group();
  scene.add(globe);

  // Dark core + fresnel atmosphere
  const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 96, 96), new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0-max(dot(vN,vV),0.0), 2.4); vec3 c = mix(vec3(0.055,0.048,0.04), vec3(0.79,0.64,0.42), f*0.9); gl_FragColor = vec4(c,1.0);} `
  }));
  globe.add(core);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.16, 64, 64), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(max(dot(vN,vV),0.0), 3.0); gl_FragColor = vec4(0.86,0.68,0.42, f*0.55);} `
  }));
  scene.add(atmo);

  // Land dots
  const { LAND_B64 } = await import('./land-data.js');
  const bin = atob(LAND_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const raw = new Int16Array(bytes.buffer);
  const n = raw.length / 2;
  const pos = new Float32Array(n * 3);
  const near = new Float32Array(n);
  const home = toVec(CITIES[2].lat, CITIES[2].lon);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.copy(toVec(raw[i * 2] / 100, raw[i * 2 + 1] / 100, R * 1.003));
    pos.set([v.x, v.y, v.z], i * 3);
    near[i] = Math.max(0, 1 - v.distanceTo(home) / 2.4);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dg.setAttribute('aNear', new THREE.BufferAttribute(near, 1));
  const dotMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uPx: { value: renderer.getPixelRatio() }, uTime: { value: 0 }, uReveal: { value: 0 } },
    vertexShader: `
      uniform float uPx; uniform float uTime; uniform float uReveal;
      attribute float aNear; varying float vA; varying float vNear;
      void main(){
        vec4 mv = modelViewMatrix*vec4(position,1.0);
        vec3 n = normalize(normalMatrix*normalize(position));
        float facing = dot(n, normalize(-mv.xyz));
        vA = smoothstep(-0.05, 0.35, facing);
        float wave = smoothstep(uReveal*2.2-0.2, uReveal*2.2, aNear*2.0 + (1.0-uReveal));
        vA *= mix(0.0, 1.0, clamp(uReveal*1.6 - (1.0-aNear)*0.6, 0.0, 1.0));
        vNear = aNear;
        gl_PointSize = uPx * (1.6 + aNear*1.6);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying float vA; varying float vNear;
      void main(){
        float d = length(gl_PointCoord-0.5);
        if(d>0.5) discard;
        vec3 c = mix(vec3(0.78,0.72,0.64), vec3(1.0,0.84,0.58), vNear);
        gl_FragColor = vec4(c, vA*(0.7+vNear*0.3));
      }`
  });
  const dots = new THREE.Points(dg, dotMat);
  globe.add(dots);

  // City markers + pulsing rings
  const cityVecs = CITIES.map(c => toVec(c.lat, c.lon, R * 1.01));
  const markers = [];
  const ringGeo = new THREE.RingGeometry(0.05, 0.065, 48);
  cityVecs.forEach((cv, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(i === 2 ? 0.035 : 0.026, 16, 12), new THREE.MeshBasicMaterial({ color: i === 2 ? 0xffe0a8 : 0xe6cc9a }));
    m.position.copy(cv);
    globe.add(m);
    const rings = [];
    for (let k = 0; k < 2; k++) {
      const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xc9a46c, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      r.position.copy(cv);
      r.lookAt(cv.clone().multiplyScalar(2));
      globe.add(r);
      rings.push(r);
    }
    markers.push({ m, rings });
  });

  // Animated arcs from Batumi
  const arcs = [];
  for (const target of [0, 1]) {
    const curve = arcCurve(CITIES[2], CITIES[target]);
    const geo = new THREE.TubeGeometry(curve, 96, 0.008, 8, false);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uP: { value: 0 }, uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `uniform float uP; uniform float uTime; varying vec2 vUv;
        void main(){
          float drawn = step(vUv.x, uP);
          float pulse = smoothstep(0.12, 0.0, abs(fract(uTime*0.35) - vUv.x)) * step(0.99, uP);
          vec3 c = vec3(0.95,0.78,0.5);
          gl_FragColor = vec4(c + pulse, drawn*(0.75 + pulse));
        }`
    });
    const tube = new THREE.Mesh(geo, mat);
    globe.add(tube);
    arcs.push(mat);
  }

  // Orient so the Black Sea region faces the camera with north up
  const focus = toVec(41.0, 35.5);
  const az = Math.atan2(focus.x, focus.z);
  const LAT = 41.0 * Math.PI / 180;
  // tilt a little so north is up-ish
  const state = { reveal: 0, target: 0, mx: 0, my: 0, tmx: 0, tmy: 0, visible: false, drag: null, rotY: 0, vel: 0 };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { state.tmx = e.clientX / innerWidth * 2 - 1; state.tmy = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { state.drag = e.clientX; canvas.setPointerCapture(e.pointerId); } });
  canvas.addEventListener('pointermove', e => { if (state.drag !== null) { state.vel = (e.clientX - state.drag) * 0.004; state.drag = e.clientX; state.rotY += state.vel; } });
  canvas.addEventListener('pointerup', () => { state.drag = null; });
  new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; }, { rootMargin: '80px' }).observe(canvas);

  const pins = [...labelsEl.querySelectorAll('.pin')];
  const clock = new THREE.Clock();
  const tmpQ = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3(1, 0, 0);
  const wp = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    if (window.__mgPaused) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!state.visible) return;
    const t = clock.elapsedTime;
    state.reveal += (state.target - state.reveal) * Math.min(1, dt * 2.2);
    state.mx += (state.tmx - state.mx) * Math.min(1, dt * 2.5);
    state.my += (state.tmy - state.my) * Math.min(1, dt * 2.5);
    if (state.drag === null) { state.vel *= 0.94; state.rotY += state.vel; state.rotY *= 0.985; }
    const r = state.reveal;

    // spin in from far side, settle on the region with a gentle idle sway
    const spin = (1 - r) * -2.4 + Math.sin(t * 0.25) * 0.12 + state.mx * 0.25 + state.rotY;
    tmpQ.setFromAxisAngle(yAxis, -az + spin);
    globe.quaternion.setFromAxisAngle(xAxis, LAT * (0.75 + r * 0.25) + state.my * 0.12).multiply(tmpQ);
    camera.position.z = THREE.MathUtils.lerp(12.5, 8.6, r);

    dotMat.uniforms.uReveal.value = r;
    arcs.forEach((m, i) => { m.uniforms.uP.value = THREE.MathUtils.clamp((r - 0.55 - i * 0.12) * 3.2, 0, 1); m.uniforms.uTime.value = t + i * 0.5; });
    markers.forEach(({ rings }, i) => rings.forEach((rg, k) => {
      const ph = (t * 0.6 + k * 0.5 + i * 0.2) % 1;
      rg.scale.setScalar(1 + ph * 3.2);
      rg.material.opacity = (1 - ph) * 0.8 * r;
    }));

    // project HTML labels
    const w = canvas.clientWidth, h = canvas.clientHeight;
    markers.forEach(({ m }, i) => {
      m.getWorldPosition(wp);
      const facing = wp.clone().normalize().dot(camera.position.clone().sub(wp).normalize());
      wp.project(camera);
      const x = (wp.x * 0.5 + 0.5) * w, y = (-wp.y * 0.5 + 0.5) * h;
      const el = pins[i];
      if (!el) return;
      const dx = i === 1 ? -el.offsetWidth - 14 : 14;
      el.style.transform = `translate(${x + dx}px, ${y - el.offsetHeight / 2 + (i === 0 ? -14 : i === 2 ? 12 : 0)}px)`;
      el.style.opacity = facing > 0.15 && r > 0.75 ? 1 : 0;
    });

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  return { setReveal(v) { state.target = v; } };
}
