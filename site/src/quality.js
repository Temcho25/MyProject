// Picks a render tier for the device so phones stay smooth and desktops look their best.
let cached = null;
export function quality() {
  if (cached) return cached;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tier = 'high';
  if (coarse || small) tier = 'mid';
  if (mem <= 3 || cores <= 4) tier = 'low';
  const forced = new URLSearchParams(location.search).get('q');
  if (forced) tier = forced;
  const dprCap = tier === 'high' ? 2 : tier === 'mid' ? 1.75 : 1.25;
  cached = {
    tier,
    reduced,
    dpr: Math.min(devicePixelRatio || 1, dprCap),
    shadows: tier !== 'low',
    post: tier !== 'low',
    dof: tier === 'high'
  };
  return cached;
}
