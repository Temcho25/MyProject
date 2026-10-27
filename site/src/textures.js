import * as THREE from 'three';

// Small value-noise / fbm helpers for procedural canvas textures.
function makeNoise(seed = 1) {
  const perm = new Uint8Array(512);
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const p = Array.from({ length: 256 }, (_, i) => i).sort(() => rnd() - 0.5);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = perm[X] + Y, b = perm[X + 1] + Y;
    const l1 = grad(perm[a], x, y) + u * (grad(perm[b], x - 1, y) - grad(perm[a], x, y));
    const l2 = grad(perm[a + 1], x, y - 1) + u * (grad(perm[b + 1], x - 1, y - 1) - grad(perm[a + 1], x, y - 1));
    return l1 + v * (l2 - l1);
  };
}

function fbm(n, x, y, oct = 5) {
  let a = 0.5, f = 1, sum = 0;
  for (let i = 0; i < oct; i++) { sum += a * n(x * f, y * f); f *= 2.02; a *= 0.5; }
  return sum;
}

// Tileable-ish dark Nero Marquina style marble with warm veins.
export function marbleTexture(renderer, size = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const n = makeNoise(7), n2 = makeNoise(13);
  const sc = 4 / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x * sc, ny = y * sc;
      const turb = fbm(n, nx * 1.2, ny * 1.2, 6);
      const v = Math.abs(Math.sin((nx * 1.6 + ny * 0.9) * 2.4 + turb * 6.5));
      const vein = Math.pow(1 - v, 22) * 0.9 + Math.pow(1 - v, 6) * 0.12;
      const cloud = fbm(n2, nx * 2.5, ny * 2.5, 4) * 0.5 + 0.5;
      const base = 16 + cloud * 14;
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, base + vein * 205);
      img.data[i + 1] = Math.min(255, base * 0.92 + vein * 182);
      img.data[i + 2] = Math.min(255, base * 0.82 + vein * 140);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // subtle slab joints
  ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// Soft lime-plaster texture (used as color + bump).
export function plasterTexture(renderer, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const n = makeNoise(3);
  const sc = 8 / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = fbm(n, x * sc, y * sc, 5) * 0.5 + 0.5;
      const g = 200 + v * 55;
      const i = (y * size + x) * 4;
      img.data[i] = g; img.data[i + 1] = g * 0.97; img.data[i + 2] = g * 0.92; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
