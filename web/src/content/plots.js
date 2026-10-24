// Site plan, in metres (approximate), traced from the developer's official plan:
// presentation "Orientiri-ppt-GEO 15.04.2026" (orientiri.ge) and the Instagram post of
// 11 Aug 2026 (@orientirilisi). Plot numbers, areas and sold markers come from those sources.
// The outline is traced by hand, so shapes are approximate; areas are the official figures.
//
// Allowed statuses: 'available' | 'reserved' | 'sold'.

// Lower boundary of the site (a shallow V that bottoms out near plot 19).
const south = (x) => (x <= 145 ? 70 + 0.347 * (x + 5) : 122 - 0.273 * (x - 145));
const r = (n) => Math.round(n * 10) / 10;

// Northern row: plot 11 at the west end, plot 1 at the entrance.
const northEdges = [52, 72.6, 93, 113, 133.4, 153.6, 174, 194.4, 214.6, 235, 255, 275];
const north = northEdges.slice(0, -1).map((x, i) => ({
  id: 11 - i,
  pts: [[x, 0], [northEdges[i + 1], 0], [northEdges[i + 1], 49], [x, 49]],
}));

// Southern row: plot 15 at the west end, plot 24 at the entrance.
const southEdges = [52, 80.6, 104, 124.4, 141.6, 162, 180.6, 200.6, 221.4, 245.4, 275];
const southRow = southEdges.slice(0, -1).map((x0, i) => {
  const x1 = southEdges[i + 1];
  const pts = [[x0, 57], [x1, 57], [x1, r(south(x1))]];
  if (x0 < 145 && x1 > 145) pts.push([145, r(south(145))]);
  pts.push([x0, r(south(x0))]);
  return { id: 15 + i, pts };
});

const west = [
  { id: 12, pts: [[1, 0], [45, 0], [45, 26], [1, 26]] },
  { id: 13, pts: [[1, 26], [45, 26], [45, 50], [1, 50]] },
  { id: 14, pts: [[0, 57], [52, 57], [52, r(south(52))], [0, r(south(0))]] },
];

const withBox = (p) => {
  const xs = p.pts.map((q) => q[0]);
  const ys = p.pts.map((q) => q[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { ...p, x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
};

export const plan = {
  viewBox: [-12, -24, 318, 172],
  plots: [...north, ...west, ...southRow].map(withBox).sort((a, b) => a.id - b.id),
  roads: [
    { x: 45, y: 50, w: 232, h: 7 }, // main street
    { x: 45, y: 0, w: 7, h: 57 }, // western lane to plots 12–13
    { x: 277, y: -6, w: 10, h: 94 }, // access road along the entrance side
  ],
  gate: { x: 277, y: 53.5 },
  path: { from: [150, 0], to: [176, -16] },
  size: { width: 287, height: 122 },
};

const sold = [1, 2, 3, 4, 5, 11, 12, 15, 16, 19, 22, 23, 24];
const areas = { 12: 1277, 13: 1277, 14: 1266, 18: 1029, 19: 1285, 20: 1029 };

export const data = Object.fromEntries(
  plan.plots.map((p) => [p.id, { area: areas[p.id] ?? 1000, status: sold.includes(p.id) ? 'sold' : 'available' }]),
);

// Date of the latest official plan the statuses were taken from.
export const asOf = '2026-08-11';

export const STATUS = ['available', 'reserved', 'sold'];
