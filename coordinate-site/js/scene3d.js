/* Coordinate — WebGL scenes: the scroll-driven hero (map → pin → towers rise → orbit) and the apartment-selector tower.
   The inline script in index.html publishes the hero scroll progress in window.COORD.heroP and
   selector state through the `coord:sel` event ({block, floor}). */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildTower, buildCommercial, buildSite, floorBand, lights, TOWER_POS, LOBBY_H, FLOOR_H, towerHeight } from "./complex.js";

const C = window.COORD, BLOCKS = C.BLOCKS;
const touch = matchMedia("(pointer:coarse)").matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const lowEnd = touch && (navigator.hardwareConcurrency || 4) <= 4;
const SHADOWS = !touch;                 // real-time shadows only on desktop; phones get a painted soft shadow
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const range = (p, a, b) => clamp((p - a) / (b - a));
const eo = t => 1 - Math.pow(1 - t, 3), eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eback = t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const D2R = Math.PI / 180;

// iPhones drop a WebGL page when GPU memory runs out: keep phones at ≤1.5× resolution and recover if the context is lost.
function makeRenderer(canvas, { shadows, onRestore }) {
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); r._lost = true; document.documentElement.classList.add("gl-lost"); }, false);
  canvas.addEventListener("webglcontextrestored", () => { r._lost = false; document.documentElement.classList.remove("gl-lost"); if (onRestore) onRestore(); }, false);
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  r.setClearColor(0x000000, 0);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = shadows; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r._maxDpr = Math.min(devicePixelRatio || 1, touch ? 1.5 : 2);
  r._dpr = touch ? Math.min(1.5, r._maxDpr) : r._maxDpr; r.setPixelRatio(r._dpr);   // phones start lighter, sharpen if fast
  return r;
}
function envFor(renderer, scene) {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .55; pm.dispose();
}
// Drop resolution when frames are slow, recover when fast.
function adaptive(renderer, dt) {
  renderer._avg = lerp(renderer._avg || 16, dt, .05);
  if (renderer._avg > 40 && renderer._dpr > 1) { renderer._dpr = Math.max(1, renderer._dpr - .25); renderer.setPixelRatio(renderer._dpr); renderer._avg = 16; return true; }
  if (renderer._avg < 14 && renderer._dpr < renderer._maxDpr) { renderer._dpr = Math.min(renderer._maxDpr, renderer._dpr + .25); renderer.setPixelRatio(renderer._dpr); renderer._avg = 20; return true; }
  return false;
}

/* Blueprint ground grid (minor 10 m, major 50 m, accent axes), fading out radially. */
function gridPlane(size = 2400) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, extensions: {},
    uniforms: { uFade: { value: 1 }, uR: { value: size * .42 } },
    vertexShader: `varying vec2 vP; void main(){ vec4 w=modelMatrix*vec4(position,1.); vP=w.xz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `varying vec2 vP; uniform float uFade,uR;
      float line(vec2 p,float s,float w){ vec2 g=abs(fract(p/s-.5)-.5)*s/fwidth(p); return 1.-min(min(g.x,g.y)/w,1.); }
      void main(){
        float minor=line(vP,10.,1.)*.16, major=line(vP,50.,1.)*.30;
        vec2 a=abs(vP)/fwidth(vP); float axis=1.-min(min(a.x,a.y)/1.4,1.);
        float m=1.-smoothstep(uR*.25,uR,length(vP));
        vec3 col=mix(vec3(.937,.91,.847),vec3(.847,.769,.604),axis);
        float al=max(max(minor,major),axis*.8)*m*uFade;
        if(al<.003) discard; gl_FragColor=vec4(col,al); }`
  });
  const o = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat); o.rotation.x = -Math.PI / 2; o.renderOrder = -1;
  return o;
}

function pinModel() {
  const g = new THREE.Group(), glow = 0xf3dfae;
  const basic = (op = 1) => new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
  const dot = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 12), basic()); dot.position.y = 2.2; g.add(dot);
  const r1 = new THREE.Mesh(new THREE.RingGeometry(24, 25, 64), basic(.6)), r2 = new THREE.Mesh(new THREE.RingGeometry(46, 47, 64), basic(.4));
  for (const r of [r1, r2]) { r.rotation.x = -Math.PI / 2; r.position.y = .3; g.add(r); }
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 90, 6, 1, true), basic(.5)); needle.position.y = 45; g.add(needle);
  g.userData = { dot, r1, r2, needle };
  return g;
}

/* Compile every shader and upload every texture up front (while the page is idle), so nothing stalls
   the first time the towers, park or selector appear mid-scroll — that stall is what felt like a pause on phones. */
async function warmUp(renderer, scene, camera, extra = []) {
  const hidden = [];
  for (const o of extra) scene.add(o);
  scene.traverse(o => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  scene.traverse(o => { if (!o.material) return; for (const m of [].concat(o.material)) for (const k of ["map", "emissiveMap"]) if (m[k]) renderer.initTexture(m[k]); });
  try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera); } catch (e) {}
  hidden.forEach(o => { o.visible = false; });
  for (const o of extra) scene.remove(o);
}

/* Painted soft shadow (a radial gradient on the ground) for devices without real-time shadows. */
let shadowTex = null;
function softShadow(x, z, r) {
  if (!shadowTex) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(0,0,0,.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); shadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, .09, z); m.renderOrder = 1; return m;
}

/* ===================== HERO ===================== */
function initHero() {
  const stage = document.getElementById("stage"), track = document.querySelector(".world-track");
  if (!stage) return;
  const canvas = document.createElement("canvas"); canvas.className = "hero3d"; canvas.setAttribute("aria-hidden", "true");
  stage.insertBefore(canvas, stage.querySelector(".hero-layer"));
  let alive = true;
  const renderer = makeRenderer(canvas, { shadows: SHADOWS, onRestore: () => {        // rebuild the whole scene on a fresh context
    alive = false; canvas.remove(); labels.forEach(l => l.remove()); try { renderer.dispose(); } catch (e) {} initHero(); } });
  const scene = new THREE.Scene(); envFor(renderer, scene);
  const sun = lights(scene, { shadow: SHADOWS, mapSize: 2048, extent: 130 });
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 6000);

  const grid = gridPlane(); scene.add(grid);
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ opacity: .35 }));
  shadowCatcher.rotation.x = -Math.PI / 2; shadowCatcher.position.y = .01; shadowCatcher.receiveShadow = true; scene.add(shadowCatcher);
  const pin = pinModel(); scene.add(pin);
  const site = buildSite({ trees: touch ? 70 : 150, noShadow: !SHADOWS }); scene.add(site);
  if (!SHADOWS) BLOCKS.forEach(b => { const [x, z] = TOWER_POS[b.id]; site.add(softShadow(x + 9, z - 8, 30 + b.floors * .6)); });
  const towers = BLOCKS.map(b => { const t = buildTower(b.floors, { lowPoly: touch, noShadow: !SHADOWS }); const [x, z] = TOWER_POS[b.id]; t.position.set(x, 0, z); scene.add(t); return t; });
  const com = buildCommercial(); com.position.set(10, 0, 30); com.rotation.y = -.12; scene.add(com);
  if (!SHADOWS) site.add(softShadow(16, 24, 46));

  // HTML labels A/B/C that follow the tower tops
  const labels = BLOCKS.map(b => { const d = document.createElement("div"); d.className = "t3label"; d.textContent = b.id; stage.insertBefore(d, stage.querySelector(".hero-layer")); return d; });

  let W = 0, H = 0;
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  }
  resize(); addEventListener("resize", resize);
  camera.position.set(200, 260, 260); camera.lookAt(0, 30, 0);
  warmUp(renderer, scene, camera).then(() => dispatchEvent(new CustomEvent("coord:heroready")));

  const v = new THREE.Vector3(), target = new THREE.Vector3();
  let lastKey = "", last = performance.now(), visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: "200px" }).observe(track);

  function frame(now) {
    if (!alive) return;
    requestAnimationFrame(frame);
    const dt = Math.min(64, now - last); last = now;
    if (!visible || renderer._lost) return;
    const p = C.heroP ?? 0;
    const wide = W > 700, aspect = W / H;

    // camera path (mirrors the old CSS timeline): top-down map → tilt → towers rise → orbit
    const tilt = lerp(.5, 64, eio(range(p, .03, .24))) - lerp(0, 8, eio(range(p, .5, .8)));
    const spin = -lerp(0, 18, eio(range(p, .1, .35))) + lerp(0, 70, eio(range(p, .38, .92)));
    let dist = lerp(1900, 700, eo(range(p, 0, .2))) + lerp(0, 160, eio(range(p, .2, .34))) - lerp(0, 380, eio(range(p, .34, .58))) + lerp(0, 70, eio(range(p, .82, 1)));
    // keep ~150 m of the complex in frame on narrow screens
    const hf = 2 * Math.atan(Math.tan(camera.fov * D2R / 2) * aspect), need = 95 / Math.tan(hf / 2);
    dist = Math.max(dist, need * lerp(.6, 1, range(p, .3, .5)));
    const lift = lerp(0, 34, eio(range(p, .4, .7)));
    target.set(6, lift, 0);
    const pol = tilt * D2R, az = (spin + 20) * D2R;
    camera.position.set(target.x + dist * Math.sin(pol) * Math.sin(az), target.y + dist * Math.cos(pol), target.z + dist * Math.sin(pol) * Math.cos(az));
    camera.up.set(-Math.sin(az), 0, -Math.cos(az)).lerp(new THREE.Vector3(0, 1, 0), range(tilt, 0, 25)).normalize();
    camera.lookAt(target);
    // shift the composition so captions/facts have room
    const offX = wide ? (lerp(0, -.1, eio(range(p, .2, .3))) * (1 - eio(range(p, .38, .5))) + lerp(0, .13, eio(range(p, .5, .68)))) : 0;
    const offY = wide ? 0 : lerp(0, .05, eio(range(p, .55, .68)));
    camera.setViewOffset(W, H, offX * W, offY * H, W, H);

    // pin drop + ripple
    const pd = range(p, .18, .3), fadePin = 1 - range(p, .44, .52);
    pin.visible = pd > 0 && fadePin > 0;
    pin.position.y = lerp(220, 0, eback(pd));
    const rp = (now / 1600) % 1, { r1, r2, needle, dot } = pin.userData;
    r1.scale.setScalar(.4 + rp * 1.4); r1.material.opacity = (1 - rp) * .6 * fadePin;
    const rp2 = (rp + .5) % 1; r2.scale.setScalar(.6 + rp2 * 1.2); r2.material.opacity = (1 - rp2) * .5 * fadePin;
    needle.material.opacity = .5 * fadePin; dot.material.opacity = fadePin;

    // towers rise, staggered; commercial block and park follow
    towers.forEach((t, i) => {
      const g = eback(range(p, .42 + i * .04, .56 + i * .04));
      t.scale.y = Math.max(.001, g); t.visible = p > .415 + i * .04;
      const lb = labels[i], show = p > .52 + i * .04 && p < .97;
      let y = 0;
      if (show) {
        v.set(t.position.x, t.userData.height * t.scale.y + 16, t.position.z).project(camera);
        y = (-v.y * .5 + .5) * H;
        lb.style.transform = `translate3d(${(v.x * .5 + .5) * W}px,${y}px,0) translate(-50%,-100%)`;
      }
      lb.style.opacity = show && y > 150 ? 1 : 0;              // never under the header/logo
    });
    const gc = eback(range(p, .5, .64)); com.scale.y = Math.max(.001, gc); com.visible = p > .5;
    const gs = eo(range(p, .4, .55)); site.visible = gs > 0; site.scale.set(1, Math.max(.001, gs), 1);
    grid.material.uniforms.uFade.value = 1 - .55 * range(p, .45, .6);
    shadowCatcher.visible = SHADOWS && p > .42;

    const key = [p.toFixed(5), W, H].join();
    const animating = (pd > 0 && fadePin > 0) || adaptive(renderer, dt);
    if (key === lastKey && !animating) return;
    lastKey = key;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

/* ===================== SELECTOR ===================== */
function initSelector() {
  const host = document.getElementById("sel3d");
  if (!host) return;
  const canvas = document.createElement("canvas"); canvas.className = "sel3d-canvas"; host.prepend(canvas);
  const renderer = makeRenderer(canvas, { shadows: SHADOWS });
  const scene = new THREE.Scene(); envFor(renderer, scene);
  lights(scene, { shadow: SHADOWS, mapSize: 1024, extent: 40 });
  if (!SHADOWS) scene.add(softShadow(6, -4, 34));
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);
  const grid = gridPlane(700); grid.material.uniforms.uR.value = 260; scene.add(grid);
  const catcher = new THREE.Mesh(new THREE.CircleGeometry(80, 48), new THREE.ShadowMaterial({ opacity: .35 }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.y = .02; catcher.receiveShadow = true; scene.add(catcher);
  const band = floorBand(); scene.add(band);

  const cache = {}; let tower = null, grow = 1, state = { block: BLOCKS[0].id, floor: 14 }, bandY = 0, bandTo = 0;
  const floorY = f => f <= 1 ? LOBBY_H / 2 : LOBBY_H + (f - 2) * FLOOR_H + FLOOR_H / 2;
  function setBlock(id) {
    if (tower && tower.userData.block === id) return;
    if (tower) scene.remove(tower);
    const b = BLOCKS.find(x => x.id === id);
    tower = cache[id] || (cache[id] = buildTower(b.floors, { lowPoly: touch, noShadow: !SHADOWS }));
    tower.userData.block = id; scene.add(tower); grow = reduce ? 1 : 0;
  }
  addEventListener("coord:sel", e => { state = { ...state, ...e.detail }; setBlock(state.block); bandTo = floorY(state.floor); dirty = true; });
  BLOCKS.forEach(b => { if (!cache[b.id]) cache[b.id] = buildTower(b.floors, { lowPoly: touch, noShadow: !SHADOWS }); });
  setBlock(state.block); bandY = bandTo = floorY(state.floor);
  camera.position.set(0, 60, 160); camera.lookAt(0, 40, 0);
  warmUp(renderer, scene, camera, BLOCKS.map(b => cache[b.id]).filter(t => t !== tower));

  // drag to rotate (horizontal), vertical swipes still scroll the page on phones
  let rot = -30, vel = .05, drag = false, lx = 0, dirty = true;
  canvas.style.touchAction = "pan-y";
  canvas.addEventListener("pointerdown", e => { drag = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); host.classList.add("grabbing"); });
  canvas.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - lx; lx = e.clientX; rot -= dx * .35; vel = -dx * .35; dirty = true; });
  const up = () => { drag = false; host.classList.remove("grabbing"); };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);

  let W = 0, H = 0;
  function resize() { W = host.clientWidth; H = host.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); dirty = true; }
  new ResizeObserver(resize).observe(host); resize();
  let visible = false, last = performance.now();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: "100px" }).observe(host);

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(64, now - last); last = now;
    if (!visible || !tower || renderer._lost) return;
    if (!drag && !reduce) { vel = lerp(vel, .05, .03); rot += vel * dt / 16; dirty = true; }
    if (grow < 1) { grow = Math.min(1, grow + dt / 1100); dirty = true; }
    tower.scale.y = Math.max(.001, eback(grow));
    bandY = lerp(bandY, bandTo, 1 - Math.pow(.001, dt / 1000)); if (Math.abs(bandY - bandTo) > .01) dirty = true;
    band.position.y = bandY * tower.scale.y; band.visible = grow > .6;
    const Ht = tower.userData.height, fitV = (Ht * .62) / Math.tan(camera.fov * D2R / 2);
    const fitH = 26 / Math.tan(Math.atan(Math.tan(camera.fov * D2R / 2) * camera.aspect));
    const dist = Math.max(fitV, fitH) * 1.08, ty = Ht * .46, a = rot * D2R, el = 18 * D2R;
    camera.position.set(Math.sin(a) * dist * Math.cos(el), ty + dist * Math.sin(el), Math.cos(a) * dist * Math.cos(el));
    camera.lookAt(0, ty, 0);
    if (adaptive(renderer, dt)) dirty = true;
    if (!dirty) return; dirty = false;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

function boot() {
  try { initHero(); } catch (e) { console.error(e); document.documentElement.classList.add("no-webgl"); dispatchEvent(new CustomEvent("coord:heroready")); }
  const sel = document.getElementById("sel3d");
  if (sel) {
    let done = false;
    const go = () => { if (done) return; done = true; try { initSelector(); dispatchEvent(new CustomEvent("coord:selready")); } catch (err) { console.error(err); } };
    // build while idle a few seconds after load; if the visitor gets there first, build it then
    setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(go, { timeout: 4000 }) : go()), 2500);
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); go(); } }, { rootMargin: "900px" }).observe(sel);
  }
}
// let the page paint first
// start right away: the intro screen covers the preparation time
boot();
