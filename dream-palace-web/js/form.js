// Inquiry form. Submits to DP_CONFIG.formEndpoint when configured.
// Without a backend it NEVER shows a success state: it says so and offers a
// pre-filled email instead.
import { t, onLang } from './i18n.js';

export function validate(data) {
  const errors = {};
  if (!data.name || data.name.trim().length < 2) errors.name = 'errName';
  const digits = (data.phone || '').replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) errors.phone = 'errPhone';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) errors.email = 'errEmail';
  if (!data.consent) errors.consent = 'errConsent';
  return errors;
}

export function initForm() {
  const form = document.querySelector('[data-inquiry]');
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[data-submit]');
  const topic = form.querySelector('[data-topic-select]');
  const cfg = window.DP_CONFIG || {};
  let lastErrors = {};

  const renderTopics = () => {
    const sel = topic.selectedIndex;
    topic.innerHTML = t('topics').map((o, i) => `<option value="${i}">${o}</option>`).join('');
    topic.selectedIndex = Math.max(0, sel);
  };
  renderTopics();

  const read = () => ({
    name: form.name.value,
    phone: form.phone.value,
    email: form.email.value,
    topic: t('topics')[topic.selectedIndex] || '',
    message: form.message.value,
    consent: form.consent.checked,
    lang: document.documentElement.lang,
    page: location.href,
  });

  function showErrors(errors) {
    lastErrors = errors;
    form.querySelectorAll('[data-err]').forEach((el) => {
      const key = errors[el.dataset.err];
      el.textContent = key ? t(key) : '';
      const input = form.querySelector(`[name="${el.dataset.err}"]`);
      input?.setAttribute('aria-invalid', key ? 'true' : 'false');
      input?.closest('.field')?.classList.toggle('has-error', Boolean(key));
    });
  }

  const setStatus = (html, kind = '') => {
    status.className = `inquiry__status${kind ? ` inquiry__status--${kind}` : ''}`;
    status.innerHTML = html;
  };

  form.addEventListener('input', (e) => {
    if (!lastErrors[e.target.name]) return;
    const errs = validate(read());
    showErrors({ ...lastErrors, [e.target.name]: errs[e.target.name] });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = read();
    const errors = validate(data);
    showErrors(errors);
    if (Object.keys(errors).length) {
      form.querySelector(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }
    if (!cfg.formEndpoint) {
      const body = `${data.name}\n${data.phone}${data.email ? `\n${data.email}` : ''}\n${data.topic}\n\n${data.message}`;
      const href = `mailto:${cfg.salesEmail || 'info@dreampalace.ge'}?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(body)}`;
      setStatus(`${t('noBackend')}<br><a class="btn btn--dark btn--sm" href="${href}">${t('openEmail')}</a> <a href="tel:+995598522222">+995 598 52 22 22</a>`, 'warn');
      return;
    }
    submit.setAttribute('aria-busy', 'true');
    setStatus(t('sending'));
    try {
      const res = await fetch(cfg.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(t('sent'));
      form.reset();
      renderTopics();
    } catch (err) {
      setStatus(t('sendFail'), 'err');
    } finally {
      submit.removeAttribute('aria-busy');
    }
  });

  onLang(() => { renderTopics(); showErrors(lastErrors); status.innerHTML = ''; status.className = 'inquiry__status'; });

  return {
    prefill(text, topicIndex = 0) {
      topic.selectedIndex = topicIndex;
      if (!form.message.value.trim()) form.message.value = text;
      document.querySelector('#contact').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      setTimeout(() => form.name.focus({ preventScroll: true }), 700);
    },
  };
}
