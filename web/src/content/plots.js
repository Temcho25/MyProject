// Schematic site plan, in metres.
//
// IMPORTANT: no current official plot data (numbers, areas, availability) could be accessed
// when this was built. The geometry below is an indicative diagram of 24 plots, NOT the
// cadastral plan, and every plot's area and status is left empty (null). The interface then
// shows "from 1,000 m²" and "availability confirmed by the sales team".
//
// To publish real data, replace `layout` with the official plan geometry and fill `data`:
//   data: { 7: { area: 1043, status: 'available' }, 8: { area: 1010, status: 'sold' }, … }
// Allowed statuses: 'available' | 'reserved' | 'sold'.

const W = 28; // outer plot frontage
const D = 36; // outer plot depth
const ROAD = 7;
const X0 = 20;

function row(startId, count, y, w, d, x0) {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    x: x0 + i * w,
    y,
    w,
    h: d,
  }));
}

const innerW = (7 * W - 2 * ROAD) / 5; // 36.4 m
const innerD = 28;
const yRoadN = D;
const yInner1 = D + ROAD;
const yInner2 = yInner1 + innerD;
const yRoadS = yInner2 + innerD;
const ySouth = yRoadS + ROAD;

export const plan = {
  viewBox: [-14, -18, 7 * W + X0 + 34, ySouth + D + 34],
  plots: [
    ...row(1, 7, 0, W, D, X0),
    ...row(8, 5, yInner1, innerW, innerD, X0 + ROAD),
    ...row(13, 5, yInner2, innerW, innerD, X0 + ROAD),
    ...row(18, 7, ySouth, W, D, X0),
  ],
  roads: [
    { x: X0, y: yRoadN, w: 7 * W, h: ROAD },
    { x: X0, y: yRoadS, w: 7 * W, h: ROAD },
    { x: X0, y: yRoadN, w: ROAD, h: yRoadS - yRoadN + ROAD },
    { x: X0 + 7 * W - ROAD, y: yRoadN, w: ROAD, h: yRoadS - yRoadN + ROAD },
    // entry road from the access gate
    { x: -14, y: yInner2 - ROAD / 2, w: X0 + 14, h: ROAD },
  ],
  gate: { x: 6, y: yInner2 },
  path: { from: [X0 + 7 * W, yInner2], to: [X0 + 7 * W + 30, yInner2 - 22] },
  size: { width: 7 * W, height: ySouth + D },
};

export const data = {};

export const STATUS = ['available', 'reserved', 'sold'];
