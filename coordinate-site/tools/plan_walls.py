"""Extract walls from the 2D floor plans for the 3D walkthrough.

Usage (from coordinate-site/):  python3 -I tools/plan_walls.py [debug_dir]
Reads plans/<id>-2d.png for every layout in js/data.js, writes plans/walls/<id>.json:
  {id, w, h, mpp, cell, rects:[[x,y,w,h],...] wall boxes (collision), polys:[{o:[[x,y]..], h:[holes]}] wall outlines (render), rails:[[[x,y]..]] glass railing polylines, spawn:[x,y], bounds:[x0,y0,x1,y1]}   (all in plan pixels)
mpp = metres per pixel, calibrated so the drawn footprint (rooms + balconies) equals the layout's total area.
"""
import json, os, re, sys
from collections import deque
import numpy as np
from PIL import Image

CELL = 4          # grid cell in px (walls are 15–35 px thick, thin lines 1–5 px)
OPEN_R = 4        # opening radius in px: removes strokes thinner than ~9 px (furniture, text, door swings, hatching)

def box_all(mask, r, pad=0):
    """True where the (2r+1)^2 box around the pixel is entirely True (= erosion). pad = value outside the image."""
    m = np.pad(mask.astype(np.int32), r + 1, constant_values=pad)
    c = m.cumsum(0).cumsum(1)
    k = 2 * r + 1
    s = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
    return s[: mask.shape[0], : mask.shape[1]] == k * k

def box_any(mask, r):
    return ~box_all(~mask, r, pad=1)

def erode(mask, r):  return box_all(mask, r)
def dilate(mask, r): return box_any(mask, r)

def to_grid(mask, cell, frac):
    h, w = mask.shape
    H, W = -(-h // cell), -(-w // cell)
    m = np.zeros((H * cell, W * cell), bool); m[:h, :w] = mask
    return m.reshape(H, cell, W, cell).mean((1, 3)) >= frac

def greedy_rects(g):
    """Merge True cells into axis-aligned rectangles (row runs extended downwards)."""
    g = g.copy(); H, W = g.shape; out = []
    for y in range(H):
        x = 0
        while x < W:
            if not g[y, x]: x += 1; continue
            x1 = x
            while x1 < W and g[y, x1]: x1 += 1
            y1 = y + 1
            while y1 < H and g[y1, x:x1].all(): y1 += 1
            g[y:y1, x:x1] = False
            out.append((x, y, x1 - x, y1 - y))
            x = x1
    return out

def boxsum(a, k):
    m = np.pad(a.astype(np.int32), k + 1); c = m.cumsum(0).cumsum(1); n = 2 * k + 1
    return (c[n:, n:] - c[:-n, n:] - c[n:, :-n] + c[:-n, :-n])[: a.shape[0], : a.shape[1]]

def speckle(g, k=12, e=6, dl=9):
    """Concrete walls/columns are drawn as a speckle texture: many tiny dots. Hatching (diagonal lines),
    wardrobes (parallel stripes) and furniture (long lines) have strongly connected strokes instead."""
    d = g < 200
    n = boxsum(d, k) + 1
    nb = lambda a, b: np.pad(a & b, ((0, d.shape[0] - (a & b).shape[0]), (0, d.shape[1] - (a & b).shape[1])))
    h = boxsum(nb(d[:, 1:], d[:, :-1]), k) / n
    v = boxsum(nb(d[1:, :], d[:-1, :]), k) / n
    a = boxsum(nb(d[1:, 1:], d[:-1, :-1]), k) / n
    b = boxsum(nb(d[1:, :-1], d[:-1, 1:]), k) / n
    dens = n / (2 * k + 1) ** 2
    m = (dens > .035) & (dens < .16) & (h < .62) & (v < .62) & (a < .42) & (b < .42)
    return dilate(erode(m, e), dl)

def keep_blobs(m, min_side):
    """Keep 4-connected blobs whose bounding box is at least min_side cells on its long side."""
    H, W = m.shape; seen = np.zeros_like(m); out = np.zeros_like(m)
    for y0, x0 in zip(*np.nonzero(m)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; cells = []
        while q:
            y, x = q.popleft(); cells.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True; q.append((yy, xx))
        ys, xs = zip(*cells)
        if max(max(ys) - min(ys), max(xs) - min(xs)) + 1 >= min_side:
            out[list(ys), list(xs)] = True
    return out

def trace_loops(m):
    """Boundary loops of a binary grid as vertex lists (grid-corner coords), inside kept on the left.
    Outer boundaries come out counter-clockwise in image coords (y down), holes clockwise."""
    H, W = m.shape; p = np.pad(m, 1); nxt = {}
    # directed unit edges with the filled cell on the left (y axis points down)
    ys, xs = np.nonzero(p[1:-1, 1:-1] & ~p[:-2, 1:-1]);  [nxt.setdefault((x + 1, y), []).append((x, y)) for y, x in zip(ys, xs)]       # top edge: right->left
    ys, xs = np.nonzero(p[1:-1, 1:-1] & ~p[2:, 1:-1]);   [nxt.setdefault((x, y + 1), []).append((x + 1, y + 1)) for y, x in zip(ys, xs)]  # bottom: left->right
    ys, xs = np.nonzero(p[1:-1, 1:-1] & ~p[1:-1, :-2]);  [nxt.setdefault((x, y), []).append((x, y + 1)) for y, x in zip(ys, xs)]       # left: down
    ys, xs = np.nonzero(p[1:-1, 1:-1] & ~p[1:-1, 2:]);   [nxt.setdefault((x + 1, y + 1), []).append((x + 1, y)) for y, x in zip(ys, xs)]  # right: up
    loops = []
    while nxt:
        start = next(iter(nxt)); loop = [start]; cur = start
        while True:
            outs = nxt.get(cur)
            if not outs: break
            n = outs.pop()
            if not outs: del nxt[cur]
            if n == start: break
            loop.append(n); cur = n
        if len(loop) >= 4: loops.append(loop)
    return loops

def simplify(pts, tol):
    """Douglas–Peucker on a closed loop."""
    P = np.array(pts, float)
    if len(P) < 4: return pts
    # split at the farthest pair so both halves are open polylines
    i = 0; j = int(np.argmax(((P - P[0]) ** 2).sum(1)))
    def dp(a):
        if len(a) < 3: return list(map(tuple, a))
        s, e = a[0], a[-1]; d = e - s; L = np.hypot(*d)
        dist = np.abs(d[0] * (a - s)[:, 1] - d[1] * (a - s)[:, 0]) / L if L > 1e-9 else np.hypot(*(a - s).T)
        k = int(np.argmax(dist))
        if dist[k] > tol: return dp(a[: k + 1])[:-1] + dp(a[k:])
        return [tuple(s), tuple(e)]
    A = dp(np.vstack([P[i:j + 1]])); B = dp(np.vstack([P[j:], P[:1]]))
    return A[:-1] + B[:-1]

def simplify_open(pts, tol):
    P = np.array(pts, float)
    def dp(a):
        if len(a) < 3: return [tuple(v) for v in a]
        s, e = a[0], a[-1]; d = e - s; L = np.hypot(*d)
        dist = np.abs(d[0] * (a - s)[:, 1] - d[1] * (a - s)[:, 0]) / L if L > 1e-9 else np.hypot(*(a - s).T)
        k = int(np.argmax(dist))
        if dist[k] > tol: return dp(a[: k + 1])[:-1] + dp(a[k:])
        return [tuple(s), tuple(e)]
    return dp(P)

def area2(loop):
    a = np.array(loop, float); return float(np.sum(a[:, 0] * np.roll(a[:, 1], -1) - np.roll(a[:, 0], -1) * a[:, 1]))

def inside(pt, loop):
    x, y = pt; c = False; n = len(loop)
    for i in range(n):
        x1, y1 = loop[i]; x2, y2 = loop[(i + 1) % n]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c

def flood_outside(barrier):
    H, W = barrier.shape; out = np.zeros_like(barrier); q = deque()
    for x in range(W):
        for y in (0, H - 1):
            if not barrier[y, x] and not out[y, x]: out[y, x] = True; q.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if not barrier[y, x] and not out[y, x]: out[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < H and 0 <= xx < W and not out[yy, xx] and not barrier[yy, xx]:
                out[yy, xx] = True; q.append((yy, xx))
    return out

def layouts():
    src = open('js/data.js', encoding='utf-8').read()
    return [dict(id=m[1], area=float(m[2]), living=float(m[3]))
            for m in re.finditer(r'\{id:"(\w+)".*?area:([\d.]+).*?living:([\d.]+)', src)]

def process(L, debug=None):
    im = Image.open(f"plans/{L['id']}-2d.png").convert('L')
    g = np.asarray(im).astype(np.int16); h, w = g.shape
    # footprint: everything enclosed by any drawn line (thin outlines of balconies included)
    barrier = to_grid(dilate(g < 215, 2), CELL, .01)
    outside = flood_outside(barrier)
    foot = ~outside
    mpp = (L['area'] / (foot.sum() * CELL * CELL)) ** .5
    # walls: solid dark strokes thicker than furniture/text lines. Opening radius scales with drawing scale
    # (typical plans ~130 px/m: partitions 13+ px, lines <=5 px; penthouses ~48 px/m: partitions 5–10 px, lines 1–2 px).
    r = int(min(4, max(2, round(0.025 / mpp))))
    walls = dilate(erode(g < 100, r), r)
    spk = to_grid(speckle(g) if mpp < .012 else speckle(g, 8, 3, 6), CELL, .5) & foot
    spk = keep_blobs(spk, .6 / (mpp * CELL))     # drop pillow / stove / bed-corner false positives
    grid = (to_grid(walls, CELL, .5) | spk) & foot
    rects = greedy_rects(grid)
    # wall outlines: traced and simplified so curved / diagonal walls are smooth (extruded in the viewer)
    polys = []
    loops = [simplify(l, 1.6) for l in trace_loops(grid)]
    outer = [l for l in loops if area2(l) < 0 and len(l) >= 3]      # y-down: CCW on screen = negative shoelace
    holes = [l for l in loops if area2(l) > 0 and len(l) >= 3]
    for o in outer: polys.append({'o': o, 'h': []})
    for hl in holes:
        for P in polys:
            if inside(hl[0], P['o']) or inside(((hl[0][0] + hl[1][0]) / 2, (hl[0][1] + hl[1][1]) / 2), P['o']): P['h'].append(hl); break
    # glass railing along the footprint outline where there is no wall (balcony edges, glazed facade gaps)
    near_wall = dilate(grid, 2)
    rails = []
    for l in trace_loops(foot):
        l = simplify(l, 1.2); run = []
        for i in range(len(l)):
            (x1, y1), (x2, y2) = l[i], l[(i + 1) % len(l)]
            n = max(1, int(np.hypot(x2 - x1, y2 - y1) / 2))
            for k_ in range(n):
                ax, ay = x1 + (x2 - x1) * k_ / n, y1 + (y2 - y1) * k_ / n
                bx, by = x1 + (x2 - x1) * (k_ + 1) / n, y1 + (y2 - y1) * (k_ + 1) / n
                mx, my = int(min(near_wall.shape[1] - 1, (ax + bx) / 2)), int(min(near_wall.shape[0] - 1, (ay + by) / 2))
                blocked = near_wall[max(0, my - 1):my + 1, max(0, mx - 1):mx + 1].any()
                if blocked:
                    if len(run) > 1: rails.append(run)
                    run = []
                else:
                    if not run: run = [(ax, ay)]
                    run.append((bx, by))
        if len(run) > 1: rails.append(run)
    rails = [simplify_open(r, 0.6) for r in rails if np.hypot(r[-1][0] - r[0][0], r[-1][1] - r[0][1]) + len(r) > 3]
    # spawn: open cell farthest from walls (largest room, normally the living room)
    free = foot & ~grid
    d = free.copy(); best = None; it = 0
    while d.any():
        best = d; it += 1; d = erode(d, 1)
    ys, xs = np.nonzero(best); sy, sx = int(ys.mean()), int(xs.mean())
    if not best[sy, sx]: i = np.argmin((ys - sy) ** 2 + (xs - sx) ** 2); sy, sx = int(ys[i]), int(xs[i])
    q = lambda pts: [[int(round(x * CELL)), int(round(y * CELL))] for x, y in pts]
    fy, fx = np.nonzero(foot)
    out = dict(id=L['id'], w=w, h=h, mpp=round(mpp, 6), cell=CELL,
               rects=[[x * CELL, y * CELL, ww * CELL, hh * CELL] for x, y, ww, hh in rects],
               polys=[{'o': q(P['o']), 'h': [q(hl) for hl in P['h']]} for P in polys],
               rails=[q(r) for r in rails],
               spawn=[sx * CELL + CELL // 2, sy * CELL + CELL // 2],
               bounds=[int(fx.min()) * CELL, int(fy.min()) * CELL, int(fx.max() + 1) * CELL, int(fy.max() + 1) * CELL])
    json.dump(out, open(f"plans/walls/{L['id']}.json", 'w'), separators=(',', ':'))
    # footprint mask at grid resolution (1 px = CELL plan px): trims the floor texture to the apartment outline
    Image.fromarray((foot * 255).astype(np.uint8)).save(f"plans/walls/{L['id']}-mask.png", optimize=True)
    # sanity: typical wall thickness in metres
    thick = sorted(min(r[2], r[3]) for r in out['rects'] if max(r[2], r[3]) > 60)
    med = thick[len(thick) // 2] * mpp if thick else 0
    print(f"{L['id']:>4}: {w}x{h}px  mpp={mpp:.5f} ({1/mpp:.0f} px/m)  footprint={L['area']}m²  "
          f"plan={w*mpp:.1f}x{h*mpp:.1f}m  rects={len(rects)}  wall~{med:.2f}m  spawn-clear~{it*CELL*mpp:.1f}m")
    if debug:
        vis = Image.open(f"plans/{L['id']}-2d.png").convert('RGB')
        ov = np.asarray(vis).copy()
        wm = np.zeros((h, w), bool)
        for x, y, ww, hh in out['rects']: wm[y:y + hh, x:x + ww] = True
        ov[wm] = (ov[wm] * .3 + np.array([230, 40, 40]) * .7).astype(np.uint8)
        fm = np.kron(outside, np.ones((CELL, CELL), bool))[:h, :w]
        ov[fm] = (ov[fm] * .7 + np.array([60, 120, 230]) * .3).astype(np.uint8)
        sx, sy = out['spawn']; ov[max(0, sy - 15):sy + 15, max(0, sx - 15):sx + 15] = (0, 200, 0)
        Image.fromarray(ov).resize((w // 2, h // 2)).save(os.path.join(debug, f"{L['id']}.png"))

if __name__ == '__main__':
    dbg = sys.argv[1] if len(sys.argv) > 1 else None
    os.makedirs('plans/walls', exist_ok=True)
    for L in layouts(): process(L, dbg)
