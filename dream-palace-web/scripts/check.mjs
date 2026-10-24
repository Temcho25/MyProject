// Static checks (no browser): JS syntax, i18n completeness, script mixing, asset paths.
// Run: npm run check
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failures++; };

// 1. Syntax of every module.
for (const f of readdirSync(join(root, 'js'))) {
  try { execFileSync(process.execPath, ['--check', join(root, 'js', f)], { stdio: 'pipe' }); ok(true, `syntax js/${f}`); }
  catch (e) { ok(false, `syntax js/${f}\n${e.stderr}`); }
}

// 2. Every data-i18n key in the HTML has an EN and RU translation.
const html = readFileSync(join(root, 'index.html'), 'utf8');
const keys = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]));
[...html.matchAll(/data-i18n-attr="([^"]+)"/g)].forEach((m) => m[1].split(',').forEach((p) => keys.add(p.split(':')[1])));
const i18nSrc = readFileSync(join(root, 'js', 'i18n.js'), 'utf8');
const block = (lang) => i18nSrc.slice(i18nSrc.indexOf(`  ${lang}: {`), i18nSrc.indexOf('\n  },', i18nSrc.indexOf(`  ${lang}: {`)));
for (const lang of ['en', 'ru']) {
  const src = block(lang);
  const missing = [...keys].filter((k) => !new RegExp(`\\b${k}:`).test(src));
  ok(missing.length === 0, `${lang}: all ${keys.size} static keys translated ${missing.join(', ')}`);
}

// 3. No Latin/Cyrillic letters glued inside Georgian words (typo guard).
const mixed = /[ა-ჿ][A-Za-zЀ-ӿ]|[A-Za-zЀ-ӿ][ა-ჿ]/;
for (const f of ['index.html', 'js/data.js', 'js/i18n.js']) {
  const lines = readFileSync(join(root, f), 'utf8').split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => mixed.test(l));
  ok(lines.length === 0, `${f}: no mixed-script words ${lines.map(([n]) => `line ${n}`).join(', ')}`);
}

// 4. Local asset references exist.
const refs = [...html.matchAll(/(?:href|src)="((?:assets|css|js)\/[^"]+)"/g)].map((m) => m[1]);
const fontCss = readFileSync(join(root, 'css', 'fonts.css'), 'utf8');
refs.push(...[...fontCss.matchAll(/url\(\.\.\/([^)]+)\)/g)].map((m) => m[1]));
const absent = refs.filter((r) => !existsSync(join(root, r)));
ok(absent.length === 0, `all ${refs.length} local asset references exist ${absent.join(', ')}`);

// 5. No secrets in client code.
const client = readdirSync(join(root, 'js')).map((f) => readFileSync(join(root, 'js', f), 'utf8')).join('\n');
ok(!/(api[_-]?key|secret|token)\s*[:=]\s*['"][^'"]{8,}/i.test(client), 'no API keys or secrets in client code');

console.log(failures ? `\n${failures} check(s) failed` : '\nAll static checks passed');
process.exit(failures ? 1 : 0);
