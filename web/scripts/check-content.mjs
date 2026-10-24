// Content checks: both languages define the same keys, and plot data only uses allowed values.
import { copy } from '../src/content/copy.js';
import { plan, data, STATUS } from '../src/content/plots.js';

const errors = [];
const shape = (o, path = '') => {
  if (Array.isArray(o)) return o.flatMap((v, i) => shape(v, `${path}[${i}]`));
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => shape(v, `${path}.${k}`));
  return [path];
};
const strip = (keys) => new Set(keys.map((k) => k.replace(/\[\d+\]/g, '[]')));
const ka = strip(shape(copy.ka));
const en = strip(shape(copy.en));
for (const k of ka) if (!en.has(k)) errors.push(`en is missing ${k}`);
for (const k of en) if (!ka.has(k)) errors.push(`ka is missing ${k}`);

if (plan.plots.length !== 24) errors.push(`expected 24 plots, found ${plan.plots.length}`);
for (const [id, d] of Object.entries(data)) {
  if (!plan.plots.some((p) => p.id === Number(id))) errors.push(`data for unknown plot ${id}`);
  if (d.status && !STATUS.includes(d.status)) errors.push(`plot ${id}: unknown status "${d.status}"`);
  if (d.area != null && !(Number.isFinite(d.area) && d.area > 0)) errors.push(`plot ${id}: invalid area`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Content OK — ${ka.size} copy keys per language, ${plan.plots.length} plots, ${Object.keys(data).length} with official data.`);
