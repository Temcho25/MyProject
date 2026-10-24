// Business facts, checked on 24 Oct 2026 against Republic's official pages:
// - https://silkhospitality.com/radisson-blu-tbilisi/restaurants-bars/republic-georgian-restaurant/
// - https://silkhospitality.com/republic/ (and /contact-page/, /about/, /about/history/)
// - the restaurant's QR menu page (booking + map links)
// See docs/RESEARCH.md for every source.

export const site = {
  name: 'Republic',
  nameKa: 'რესპუბლიკა',
  url: 'https://republic-concept.vercel.app/',

  phone: { display: '+995 591 08 71 72', tel: '+995591087172' },

  address: {
    street: { en: '6 First Republic Square', ka: 'პირველი რესპუბლიკის მოედანი 6' },
    building: { en: 'Republic building, 3rd floor', ka: 'შენობა „რესპუბლიკა“, მე-3 სართული' },
    city: { en: 'Tbilisi', ka: 'თბილისი' },
    postalCode: '0108',
    country: 'GE',
    geo: { lat: 41.7036675, lng: 44.7916982 },
  },

  maps: {
    // The restaurant's own Google Maps place link, from its QR menu page.
    google: 'https://www.google.com/maps/place/Republic+Restaurant/@41.7036715,44.7891233,17z/data=!3m1!4b1!4m6!3m5!1s0x40440cdb9c38a7df:0xa74f8098f09bf488!8m2!3d41.7036675!4d44.7916982!16s%2Fg%2F11ggfvz3v4',
    apple: 'https://maps.apple.com/?q=Republic%20Restaurant&ll=41.7036675,44.7916982',
  },

  social: {
    instagram: { url: 'https://www.instagram.com/republic.tbilisi/', handle: '@republic.tbilisi' },
    facebook: { url: 'https://www.facebook.com/RepublicRestaurantGeorgia' },
  },

  // Official booking (EatApp), linked from the restaurant's QR menu page.
  bookingUrl: 'https://eatapp.co/reserve/republic-roof-top-7a34d6',
  // "Order Delivery" on the official restaurant page.
  deliveryUrl: 'https://linktr.ee/RepublicRestaurant',
  menuUrl: 'https://qr.silkhospitality.com/assets/68e8c389c9210866b7fc41cb',

  // Official opening times (restaurant page). `last` = kitchen & bar close.
  hours: {
    confirmed: true,
    rows: [
      { days: { en: 'Mon – Thu', ka: 'ორშ – ხუთ' }, open: '12:00', close: '01:00', last: '00:00', spec: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'] },
      { days: { en: 'Friday', ka: 'პარასკევი' }, open: '12:00', close: '06:00', last: '05:00', spec: ['Friday'] },
      { days: { en: 'Saturday', ka: 'შაბათი' }, open: '11:00', close: '06:00', last: '05:00', spec: ['Saturday'] },
      { days: { en: 'Sunday', ka: 'კვირა' }, open: '11:00', close: '01:00', last: '00:00', spec: ['Sunday'] },
    ],
  },

  // No dated restaurant events are announced on official pages. Past Event Hall
  // concerts belong to a different venue and are never shown here.
  events: [],

  showAssetLabels: false,
};
