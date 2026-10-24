// Reservation request. There is no booking backend and no verified booking
// platform, so this never pretends to book: it validates, then opens the
// guest's email app with a prepared request to the restaurant, and shows the
// same text to copy if no email app opens. If site.bookingUrl is set, every
// reserve CTA links to that platform instead.
import { site } from '../content/site.js';
import { t, lang } from './lang.js';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function initReserve() {
  const form = document.querySelector('[data-reserve-form]');
  const done = document.querySelector('[data-reserve-done]');
  const summary = form.querySelector('[data-form-summary]');
  const out = done.querySelector('[data-reserve-text]');

  if (site.bookingUrl) {
    form.hidden = true;
    const b = document.querySelector('[data-booking-link]');
    b.hidden = false; b.href = site.bookingUrl;
    document.querySelectorAll('[data-reserve-link]').forEach((a) => { a.href = site.bookingUrl; a.target = '_blank'; a.rel = 'noopener'; });
    return;
  }

  const date = form.elements.date;
  date.min = today();
  const guests = form.elements.guests;
  form.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    const v = Math.min(20, Math.max(1, (parseInt(guests.value, 10) || 0) + Number(b.dataset.step)));
    guests.value = v;
    guests.dispatchEvent(new Event('input', { bubbles: true }));
    guests.closest('.stepper').animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.3,0,.2,1)' });
  }));

  let submitted = false;
  const rules = {
    date: (v) => (!v ? 'required' : v < today() ? 'past' : ''),
    time: (v) => (!v ? 'required' : ''),
    guests: (v) => { const n = parseInt(v, 10); return !v ? 'required' : n > 20 ? 'guests' : n < 1 || Number.isNaN(n) ? 'required' : ''; },
    name: (v) => (!v.trim() ? 'required' : ''),
    phone: (v) => (!v.trim() ? 'required' : v.replace(/\D/g, '').length < 7 ? 'phone' : ''),
    email: (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'email' : ''),
  };
  const check = (name) => {
    const el = form.elements[name];
    const code = rules[name](el.value);
    const err = document.getElementById(`r-${name}-err`);
    el.setAttribute('aria-invalid', String(!!code));
    el.closest('.field').classList.toggle('is-invalid', !!code);
    err.textContent = code ? t(`reserve.err.${code}`) : '';
    return !code;
  };
  Object.keys(rules).forEach((n) => {
    const el = form.elements[n];
    el.addEventListener(n === 'date' || n === 'time' ? 'change' : 'blur', () => submitted && check(n));
    el.addEventListener('input', () => submitted && el.getAttribute('aria-invalid') === 'true' && check(n));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitted = true;
    const bad = Object.keys(rules).filter((n) => !check(n));
    if (bad.length) {
      summary.hidden = false;
      summary.textContent = t('reserve.err.summary');
      form.elements[bad[0]].focus();
      return;
    }
    summary.hidden = true;
    const f = form.elements;
    const seatKey = { any: 'reserve.seating.any', inside: 'reserve.seating.inside', terrace: 'reserve.seating.terrace' }[f.seating.value];
    const lines = [
      t('reserve.mail.intro'), '',
      `${t('reserve.date')}: ${f.date.value}`,
      `${t('reserve.time')}: ${f.time.value}`,
      `${t('reserve.guests')}: ${f.guests.value}`,
      `${t('reserve.seating')}: ${t(seatKey)}`,
      `${t('reserve.name')}: ${f.name.value.trim()}`,
      `${t('reserve.phone')}: ${f.phone.value.trim()}`,
      f.email.value.trim() ? `${t('reserve.email').replace(/\s*\(.*\)/, '')}: ${f.email.value.trim()}` : null,
      f.notes.value.trim() ? `\n${f.notes.value.trim()}` : null,
      '', t('reserve.mail.outro'),
    ].filter((l) => l !== null);
    const body = lines.join('\n');
    const subject = `${t('reserve.mail.subject')} — ${f.date.value} ${f.time.value}, ${f.guests.value}`;
    out.textContent = body;
    const href = `mailto:${site.email.value}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
    document.documentElement.dataset.mailto = href; // exposed for QA
    window.location.href = href;
  });

  const copy = done.querySelector('[data-copy]');
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(out.textContent); }
    catch {
      const r = document.createRange(); r.selectNodeContents(out);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    const label = copy.querySelector('span');
    label.textContent = t('reserve.done.copied');
    setTimeout(() => (label.textContent = t('reserve.done.copy')), 1800);
  });
}

export const reserveLang = () => lang;
