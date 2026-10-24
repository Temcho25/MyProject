// Deterministic contour-line generator (runs at build time, in Node).
// Produces SVG path data for an abstract lake-basin topography — an illustration of
// "terrain around a lake", not a survey of the actual site.

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h, x, y) => {
    const a = (h & 7) * (Math.PI / 4);
    return Math.cos(a) * x + Math.sin(a) * y;
  };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    const x1 = grad(aa, xf, yf) + u * (grad(ba, xf - 1, yf) - grad(aa, xf, yf));
    const x2 = grad(ab, xf, yf - 1) + u * (grad(bb, xf - 1, yf - 1) - grad(ab, xf, yf - 1));
    return x1 + v * (x2 - x1);
  };
}

// Marching squares → chained polylines.
function contours(field, nx, ny, level, sx, sy) {
  const segs = [];
  const at = (i, j) => field[j * nx + i];
  const lerp = (a, b) => (level - a) / (b - a);
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      let idx = 0;
      if (a > level) idx |= 8;
      if (b > level) idx |= 4;
      if (c > level) idx |= 2;
      if (d > level) idx |= 1;
      if (idx === 0 || idx === 15) continue;
      const top = [i + lerp(a, b), j];
      const right = [i + 1, j + lerp(b, c)];
      const bottom = [i + lerp(d, c), j + 1];
      const left = [i, j + lerp(a, d)];
      const map = {
        1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]],
        5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]], 8: [[left, top]],
        9: [[top, bottom]], 10: [[left, bottom], [top, right]], 11: [[top, right]], 12: [[left, right]],
        13: [[bottom, right]], 14: [[left, bottom]],
      };
      for (const s of map[idx]) segs.push(s);
    }
  }
  // Chain segments by shared endpoints.
  const key = (p) => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;
  const ends = new Map();
  segs.forEach((s, n) => {
    for (const e of [0, 1]) {
      const k = key(s[e]);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push(n);
    }
  });
  const used = new Uint8Array(segs.length);
  const lines = [];
  for (let n = 0; n < segs.length; n++) {
    if (used[n]) continue;
    used[n] = 1;
    const line = [segs[n][0], segs[n][1]];
    for (const dir of [1, 0]) {
      let grow = true;
      while (grow) {
        grow = false;
        const tip = dir ? line[line.length - 1] : line[0];
        for (const m of ends.get(key(tip)) || []) {
          if (used[m]) continue;
          used[m] = 1;
          const s = segs[m];
          const next = key(s[0]) === key(tip) ? s[1] : s[0];
          if (dir) line.push(next);
          else line.unshift(next);
          grow = true;
          break;
        }
      }
    }
    if (line.length > 4) lines.push(line.map(([x, y]) => [x * sx, y * sy]));
  }
  return lines;
}

function simplify(line, step) {
  const out = [line[0]];
  for (let k = 1; k < line.length - 1; k++) {
    const [px, py] = out[out.length - 1];
    if (Math.hypot(line[k][0] - px, line[k][1] - py) >= step) out.push(line[k]);
  }
  out.push(line[line.length - 1]);
  return out;
}

function toPath(line) {
  // Quadratic smoothing through midpoints.
  const f = (n) => Math.round(n * 10) / 10;
  let d = `M${f(line[0][0])} ${f(line[0][1])}`;
  for (let k = 1; k < line.length - 1; k++) {
    const mx = (line[k][0] + line[k + 1][0]) / 2;
    const my = (line[k][1] + line[k + 1][1]) / 2;
    d += `Q${f(line[k][0])} ${f(line[k][1])} ${f(mx)} ${f(my)}`;
  }
  const last = line[line.length - 1];
  d += `L${f(last[0])} ${f(last[1])}`;
  return d;
}

/**
 * @param {object} o
 * @returns {{ lines: {d:string, level:number, major:boolean}[], lake: string }}
 */
export function topography({ width = 1600, height = 1000, nx = 96, ny = 60, seed = 7, levels = 18, freq = 2.2, lake = [0.37, 0.4], basin = 1, octaves = 3 } = {}) {
  const noise = makeNoise(seed);
  const field = new Float32Array(nx * ny);
  let min = Infinity, max = -Infinity;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const u = i / (nx - 1), v = j / (ny - 1);
      let h = 0, amp = 1, f = freq;
      for (let o = 0; o < octaves; o++) {
        h += noise(u * f * 1.6 + 11.3 * o, v * f + 3.7 * o) * amp;
        amp *= 0.5; f *= 2.05;
      }
      // Elongated basin (north–south), lake-like.
      const dx = (u - lake[0]) / 0.17, dy = (v - lake[1]) / 0.3;
      const r = Math.sqrt(dx * dx + dy * dy);
      h -= basin * Math.exp(-r * r * 1.1) * 1.25;
      h += basin * 0.35 * Math.min(r, 2.4) * 0.5;
      field[j * nx + i] = h;
      if (h < min) min = h;
      if (h > max) max = h;
    }
  }
  const sx = width / (nx - 1), sy = height / (ny - 1);
  const lines = [];
  for (let l = 1; l <= levels; l++) {
    const level = min + ((max - min) * l) / (levels + 1);
    for (const line of contours(field, nx, ny, level, sx, sy)) {
      lines.push({ d: toPath(simplify(line, 11)), level: l, major: l % 4 === 0 });
    }
  }
  // Lake = lowest closed contour near the basin centre.
  const lakeLevel = min + (max - min) * 0.085;
  const lakeLines = contours(field, nx, ny, lakeLevel, sx, sy).sort((a, b) => b.length - a.length);
  const lakePath = lakeLines.length ? toPath(simplify(lakeLines[0], 6)) + 'Z' : '';
  return { lines, lake: lakePath };
}
