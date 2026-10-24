// Single source of truth for business facts.
// Every value here was checked against the research log (docs/RESEARCH.md).
// `confirmed: false` values are kept out of structured data and shown with a
// "please confirm" framing. Replace them once the restaurant confirms.

export const site = {
  name: 'Republic',
  nameKa: 'რესპუბლიკა',
  url: 'https://restaurant.republic.ge/',

  phone: { display: '+995 591 08 71 72', tel: '+995591087172', confirmed: true },
  email: { value: 'reservations@republic.ge', confirmed: false },

  address: {
    street: { en: '6 First Republic Square', ka: 'პირველი რესპუბლიკის მოედანი 6' },
    city: { en: 'Tbilisi', ka: 'თბილისი' },
    postalCode: '0108',
    country: 'GE',
    // Sources disagree between No. 6 and No. 1. See RESEARCH.md.
    confirmed: false,
  },

  maps: {
    google: 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Republic Restaurant, First Republic Square, Tbilisi'),
    apple: 'https://maps.apple.com/?q=' +
      encodeURIComponent('Republic Restaurant') + '&address=' +
      encodeURIComponent('First Republic Square, Tbilisi, Georgia'),
  },

  social: {
    instagram: { url: 'https://www.instagram.com/republic.tbilisi/', handle: '@republic.tbilisi', confirmed: true },
    facebook: { url: 'https://www.facebook.com/RepublicRestaurantGeorgia/', confirmed: false },
  },

  // Official menu asset (operator QR menu). Confirm it is the current menu.
  menuUrl: 'https://qr.silkhospitality.com/assets/68e8c389c9210866b7fc41cb',

  // No booking platform was found. When one exists, put its URL here and every
  // "Reserve" CTA will link to it instead of the on-page request form.
  bookingUrl: null,

  // Opening hours conflict between sources, so none are published.
  // Fill as { days: { en, ka }, open: '12:00', close: '00:00' } rows when confirmed.
  hours: { confirmed: false, rows: [] },

  // Live evenings exist (piano, vocals) but no current dates are verified.
  // Add { date: 'YYYY-MM-DD', time: '21:00', title: { en, ka } } entries to publish.
  // Entries with a date in the past are never shown.
  events: [],

  // Shown as small labels on empty image slots while official photography is pending.
  showAssetLabels: true,
};
