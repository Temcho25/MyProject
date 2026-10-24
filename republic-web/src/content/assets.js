// Image slots → official Republic photographs (see scripts/fetch-originals.mjs
// for each source URL and docs/ASSETS.md for the manifest).
// `focal` keeps the subject in frame when a slot crops the photograph.

export const slots = {
  hero: { file: 'hero', ratio: '16/9', mobileRatio: '4/5', focal: '64% 40%',
    alt: { en: 'Republic’s rooftop terrace with the Radisson Blu Iveria tower and the Tbilisi skyline', ka: 'რესპუბლიკის სახურავის ტერასა „რედისონ ბლუ ივერიის“ კოშკით და თბილისის ხედით' } },
  intro: { file: 'intro', ratio: '2/3', focal: '50% 60%',
    alt: { en: 'Set tables in Republic’s dining room, the Republic emblem on the window', ka: 'გაშლილი მაგიდები რესპუბლიკის დარბაზში, ფანჯარაზე რესპუბლიკის ემბლემით' } },
  'seq-1': { file: 'seq-1', ratio: '4/5', focal: '62% 50%',
    alt: { en: 'The glazed dining room in the afternoon, tables laid with white linen', ka: 'შუშის დარბაზი დღისით, თეთრი სუფრებით გაშლილი მაგიდები' } },
  'seq-2': { file: 'seq-2', ratio: '4/5', focal: '50% 55%',
    alt: { en: 'A waiter serving in the evening beside a lit candle', ka: 'მიმტანი საღამოს მომსახურებისას, ანთებულ სანთელთან' } },
  'seq-3': { file: 'seq-3', ratio: '4/5', focal: '62% 58%',
    alt: { en: 'A plated dessert carried to the table', ka: 'დესერტი სუფრისკენ მიაქვთ' } },
  terrace: { file: 'terrace', ratio: '21/9', mobileRatio: '4/5', focal: '45% 55%',
    alt: { en: 'Republic’s terrace with planters, outdoor heaters and a view over Tbilisi', ka: 'რესპუბლიკის ტერასა მცენარეებით და თბილისის ხედით' } },
  'room-1': { file: 'room-1', ratio: '2/3', focal: '50% 60%',
    alt: { en: 'The Republic building on First Republic Square, the TV tower on the hill above', ka: 'შენობა „რესპუბლიკა“ პირველი რესპუბლიკის მოედანზე, ზემოთ — სატელევიზიო ანძა' } },
  'room-2': { file: 'room-2', ratio: '3/2', focal: '50% 50%',
    alt: { en: 'The facade of the Republic building', ka: 'შენობა „რესპუბლიკის“ ფასადი' } },
  'room-3': { file: 'room-3', ratio: '16/9', focal: '55% 45%',
    alt: { en: 'The Republic Restaurant & Terrace sign at night', ka: 'რესტორან „რესპუბლიკის“ აბრა ღამით' } },
  evenings: { file: 'evenings', ratio: '40/13', mobileRatio: '4/3', focal: '50% 30%',
    alt: { en: 'Republic’s dining room at night, the emblem glowing above the tables', ka: 'რესპუბლიკის დარბაზი ღამით, მაგიდების თავზე განათებული ემბლემა' } },
  'square-1': { file: 'square-1', ratio: '3/2', focal: '50% 50%',
    alt: { en: 'The concrete arches on Republic Square, 1980s', ka: 'ბეტონის თაღები რესპუბლიკის მოედანზე, 1980-იანები' } },
  'square-2': { file: 'square-2', ratio: '3/2', focal: '40% 50%',
    alt: { en: 'A parade on Republic Square in front of the arches', ka: 'აღლუმი რესპუბლიკის მოედანზე, თაღების წინ' } },
  'square-3': { file: 'square-3', ratio: '3/2', focal: '50% 50%',
    alt: { en: 'Republic Square from above, archive photograph', ka: 'რესპუბლიკის მოედანი ზემოდან, საარქივო ფოტო' } },
};
