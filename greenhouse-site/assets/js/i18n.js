// English copy. Georgian lives in index.html; both come from the
// Green House Isani / Vazisubani project listings and the brand's Instagram bio.
export const EN = {
  tagline: 'Development company',
  nav_contact: 'Contact',
  addr_isani: 'Isani, 2a Lech Kaczyński St',
  addr_office: '10 Ilori St, Tbilisi',
  isani_status: 'Under construction · delivery Q2 2028',
  isani_addr: 'Tbilisi, Lech Kaczyński St, 2a',
  s_floors: 'Number of floors',
  s_apts: 'Number of apartments',
  s_ceiling: 'Ceiling height',
  s_parking: 'Underground parking spaces',
  s_delivery: 'Delivery, Q2',
  isani_desc: 'Green House Isani residential complex in Tbilisi is a contemporary residential development offering spacious apartments with thoughtfully designed layouts.',
  adv_title: 'Advantages',
  a1: 'Metro station within walking distance',
  a2: 'Multi-level architectural lighting',
  a3: 'Landscaped courtyard',
  a4: 'Children’s playground area',
  a5: '24/7 security and surveillance',
  a6: 'Panoramic window systems',
  a7: 'European-style apartment layouts',
  a8: 'Limited number of apartments',
  a9: 'Low-noise elevators by international manufacturers',
  a10: 'Modern architectural design',
  a11: 'Reliable construction technologies',
  k_tech: 'Construction technology', v_tech: 'Monolithic frame',
  k_walls: 'External walls', v_walls: 'Thermal blocks',
  k_lift: 'Elevator', v_lift: 'Low-noise',
  k_balcony: 'Balconies', v_balcony: 'Open, non-glazed',
  k_ground: 'Ground floor', v_ground: 'Commercial premises',
  k_access: 'Entrances', v_access: 'Barrier-free for residents with limited mobility',
  frame_eyebrow: 'Apartment renovation',
  frame_title: 'Green frame',
  f1: 'Full engineering wiring is already installed',
  f2: 'Internal partitions are installed according to approved layouts',
  f3: 'Floors are leveled with screed',
  f4: 'Walls are prepared for final finishing',
  loc_eyebrow: 'Location',
  loc_title: 'Lech Kaczyński St, 2a',
  loc_text: 'The complex is located near the 300 Aragveli metro station, just over 600 meters away.',
  km: 'km', m: 'm',
  l_rail: 'Tbilisi-Passenger railway station',
  l_air: 'Tbilisi International Airport',
  r_bus: 'Public transport stops',
  r_metro: '300 Aragveli metro station',
  r_river: 'Kura River embankment',
  price_label: 'Price per m²',
  from_pre: 'from',
  from: '',
  buy_title: 'Purchase options',
  buy_text: 'Buyers may choose between full payment and mortgage financing.',
  buy_tbc: 'Mortgage — TBC Bank',
  stamp: 'Delivered 2025 · Apartments from the developer are sold ·',
  vaz_eyebrow: 'Delivered 2025',
  vaz_addr: 'Feofan Davitaia St, 16',
  vaz_area: 'Apartment areas, m²',
  vaz_sold: 'Apartments from the developer are sold',
  prog_title: 'Construction progress',
  prog_isani: 'March 2026 — October 2026',
  prog_vaz: 'November 2023 — February 2025',
  about_eyebrow: 'About the developer',
  about_text: 'Green House Development has been operating since 2021, focusing on the construction of in-demand residential properties across Georgia.',
  call: 'Call',
  concept: 'Concept · not the official Green House Development website',
};

export function getLang() {
  const h = location.hash.slice(1);
  const q = h === 'en' || h === 'ka' ? h : new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'ka') {
    try { localStorage.setItem('gh-lang', q); } catch (e) {}
    return q;
  }
  try { return localStorage.getItem('gh-lang') === 'en' ? 'en' : 'ka'; } catch (e) { return 'ka'; }
}

export function applyLang(lang) {
  document.querySelectorAll('.lang a').forEach(a => a.classList.toggle('is-on', a.dataset.lang === lang));
  if (lang !== 'en') return;
  document.documentElement.lang = 'en';
  document.body.classList.add('lang-en');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = EN[el.dataset.i18n];
    if (v !== undefined) el.textContent = v;
  });
  // stat units and the decimal comma
  document.querySelectorAll('[data-unit="მ"]').forEach(el => { el.dataset.unit = 'm'; });
  document.querySelectorAll('.vaz__n').forEach(el => { el.textContent = el.textContent.replace(/,/g, '.'); });
}
