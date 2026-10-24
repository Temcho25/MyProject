// Site configuration. Public values only — never put API keys or secrets here.
window.DP_CONFIG = {
  // POST endpoint that accepts JSON { name, phone, email, topic, message, consent, lang, page }
  // and returns 2xx on success, e.g. a serverless function or a form service.
  // While empty, the form validates input and offers a pre-filled email instead of sending.
  formEndpoint: '',
  salesEmail: 'info@dreampalace.ge',
  // Path to the official logo (SVG preferred), e.g. 'assets/brand/logo.svg'.
  // While empty, a temporary typographic wordmark is shown.
  logo: '',
};
