import { strings } from '../content/i18n.js';

const KEY = 'republic.lang';
export let lang = 'en';
export const t = (k) => strings[lang]?.[k] ?? strings.en[k] ?? k;

export function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'ka' || q === 'en') return q;
  try { const s = localStorage.getItem(KEY); if (s === 'ka' || s === 'en') return s; } catch { /* storage blocked */ }
  return (navigator.languages || [navigator.language]).some((l) => /^ka\b/i.test(l)) ? 'ka' : 'en';
}

export function applyLang(next, { persist = false } = {}) {
  lang = next;
  const html = document.documentElement;
  html.lang = lang;
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n); // split headings are re-split afterwards
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
  if (persist) { try { localStorage.setItem(KEY, lang); } catch { /* ignore */ } }
}
