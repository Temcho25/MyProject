// Image slots. Each position on the page that needs official photography is
// a slot. Drop the original file into assets-src/originals/ using the name in
// `file`, run `npm run images`, and the slot switches from its abstract light
// study to the real photograph with responsive AVIF/WebP/JPEG derivatives.
//
// `need` describes the photograph the slot was designed for, so the
// restaurant's photographer or social team can pick from their library.
// `study` picks the placeholder palette — an abstract light composition,
// never a picture of food or of the venue.

export const slots = {
  hero: {
    file: 'hero', category: 'Hero', ratio: '16/9', mobileRatio: '4/5', study: 'dusk',
    need: 'Widest, highest-resolution evening shot of the dining room or terrace (min 2560 px wide).',
    alt: { en: 'Republic at dusk', ka: 'რესპუბლიკა შებინდებისას' },
  },
  'kitchen-1': {
    file: 'kitchen-1', category: 'Kitchen', ratio: '3/2', study: 'ember',
    need: 'Kitchen at work: hands, fire or preparation (no posed portrait required).',
    alt: { en: 'In the kitchen at Republic', ka: 'რესპუბლიკის სამზარეულოში' },
  },
  'kitchen-2': {
    file: 'kitchen-2', category: 'Kitchen', ratio: '3/2', study: 'lamp',
    need: 'Close-up of a dish being finished or plated.',
    alt: { en: 'A dish being prepared', ka: 'კერძის მომზადება' },
  },
  'kitchen-3': {
    file: 'kitchen-3', category: 'Food', ratio: '3/2', study: 'candle',
    need: 'A signature dish on the table, plated as served. Name the dish in the filename note.',
    alt: { en: 'A signature dish at the table', ka: 'ავტორული კერძი სუფრაზე' },
  },
  'room-1': { file: 'room-1', category: 'Interiors', ratio: '4/5', study: 'lamp', need: 'Dining room, evening, wide.', alt: { en: 'The dining room in the evening', ka: 'დარბაზი საღამოს' } },
  'room-2': { file: 'room-2', category: 'Interiors', ratio: '1/1', study: 'candle', need: 'Glassware or table detail.', alt: { en: 'Table detail', ka: 'სუფრის დეტალი' } },
  'room-3': { file: 'room-3', category: 'Interiors', ratio: '3/2', study: 'dusk', need: 'Guests dining (with consent), atmosphere.', alt: { en: 'An evening at Republic', ka: 'საღამო რესპუბლიკაში' } },
  'room-4': { file: 'room-4', category: 'Interiors', ratio: '4/5', study: 'ember', need: 'Bar, drinks or wine service.', alt: { en: 'Drinks at Republic', ka: 'სასმელი რესპუბლიკაში' } },
  'room-5': { file: 'room-5', category: 'Food', ratio: '1/1', study: 'lamp', need: 'A second dish, top-down or 45°.', alt: { en: 'A dish from the kitchen', ka: 'კერძი სამზარეულოდან' } },
  evenings: {
    file: 'evenings', category: 'Live events', ratio: '4/5', study: 'night',
    need: 'Live evening at Republic: piano, vocalist, the room listening.',
    alt: { en: 'A live evening at Republic', ka: 'ცოცხალი მუსიკის საღამო რესპუბლიკაში' },
  },
  terrace: {
    file: 'terrace', category: 'Terrace & location', ratio: '21/9', mobileRatio: '4/5', study: 'city',
    need: 'Terrace with the city view, dusk or night (min 2560 px wide).',
    alt: { en: 'The terrace above First Republic Square', ka: 'ტერასა პირველი რესპუბლიკის მოედნის თავზე' },
  },
  closing: {
    file: 'closing', category: 'Interiors', ratio: '3/4', study: 'candle',
    need: 'Late-evening table, candle or low light.',
    alt: { en: 'A table late in the evening', ka: 'სუფრა გვიან საღამოს' },
  },
};
