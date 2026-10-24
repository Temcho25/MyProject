// Menu data. Ships EMPTY on purpose: no current menu, dish names, prices or
// allergens could be verified (see docs/RESEARCH.md). Never fill this with
// guessed dishes. When the restaurant supplies its menu, add categories:
//
// {
//   id: 'starters',
//   name: { en: 'Starters', ka: 'სტარტერები' },
//   items: [{
//     name: { en: '…', ka: '…' },
//     description: { en: '…', ka: '…' },   // optional
//     price: 0,                              // GEL, number, optional
//     signature: true,                       // shows in the signature-dish spread
//     image: 'kitchen-3',                    // slot id, ONLY if the photo is this exact dish
//   }],
// }
export const menu = {
  updated: null, // 'YYYY-MM-DD' of the menu version supplied by the restaurant
  categories: [],
};
