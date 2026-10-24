// Republic's food menu, transcribed from the official PDF served by the
// restaurant's QR menu: https://qr.silkhospitality.com/assets/68e8c389c9210866b7fc41cb
// (file: Republic_Menu_Food_and_Drinks.pdf, checked 24 Oct 2026).
// Names keep the menu's own English and Georgian wording. Prices in GEL incl. 18% VAT.
// `a` = allergen codes exactly as printed (see `allergens`).

export const allergens = {
  1: { en: 'Gluten', ka: 'გლუტენი' },
  2: { en: 'Eggs', ka: 'კვერცხი' },
  3: { en: 'Nuts', ka: 'თხილი' },
  4: { en: 'Dairy', ka: 'რძის პროდუქტები' },
  5: { en: 'Celery', ka: 'ნიახური' },
  6: { en: 'Sulphites', ka: 'სულფიტები' },
  7: { en: 'Peppers', ka: 'წიწაკა' },
  8: { en: 'Mustard', ka: 'მდოგვი' },
  9: { en: 'Alcohol', ka: 'ალკოჰოლი' },
  10: { en: 'Citrus', ka: 'ციტრუსი' },
  11: { en: 'Honey', ka: 'თაფლი' },
};

const d = (ka, en, price, a = [], note) => ({ name: { ka, en }, price, a, ...(note ? { note } : {}) });

export const menu = {
  updated: '2026-10-24',
  source: 'https://qr.silkhospitality.com/assets/68e8c389c9210866b7fc41cb',
  pdfs: {
    cocktails: 'https://silkhospitality.com/media/shpnmeer/cocktails-menu-34-_compressed.pdf',
    drinks: 'https://silkhospitality.com/media/ac1d5jon/drinks-menu.pdf',
  },
  categories: [
    { id: 'starters', name: { en: 'Starters', ka: 'სტარტერი' }, items: [
      d('ეკალა ტყემლით', 'Ekala with walnuts & tkemali', 30, [3, 6]),
      d('ნადუღი პიტნით და აჯიკის პურით', 'Georgian ricotta with adjika bread', 23, [1, 4, 7]),
      d('კიტრი და პომიდვრის სალათი', 'Cucumber & tomato salad', 24, [3, 6, 7]),
      d('ფხალის დაფა', 'Pkhali board', 31, [3, 4, 6], { en: 'Spinach, red bell pepper, pumpkin, unripe tomato', ka: 'ისპანახი, წითელი ბულგარული, გოგრა, მკვახე პომიდორი' }),
      d('აჯაფსანდალი', 'Adjapsandali', 19, [7]),
      d('გრილზე მომზადებული ენის სალათი', 'Grilled beef tongue salad', 27, [6, 7]),
      d('ბადრიჯანი პესტოს სოუსით', 'Eggplant with pesto sauce', 29, [3, 6]),
      d('რაჭული ლორი', 'Racha ham board', 46),
      d('ქათმის კუჭმაჭი მაყვლის სოუსით და ჭვიშტარით', 'Chicken liver pkhali with blackberry sauce & chvishtari', 27, [1, 3, 7]),
      d('გადაზელილი სულგუნი პიტნით', 'Mint-infused sulguni cheese', 25, [7]),
    ] },
    { id: 'soups', name: { en: 'Soups', ka: 'წვნიანი' }, items: [
      d('ჩიხირთმა', 'Chicken soup chikhirtma', 24, [1, 2, 4, 5, 6]),
      d('სუპ-ხარჩო', 'Soup kharcho', 26, [5, 6, 7], { en: 'Traditional Georgian beef broth', ka: 'ტრადიციული ქართული ძროხის ბულიონი' }),
      d('თათარიახნი', 'Tatariakhni', 27, [7]),
      d('ბორში', 'Borscht', 20, [5, 6]),
    ] },
    { id: 'baked', name: { en: 'Baked', ka: 'ღუმელიდან' }, items: [
      d('იმერული ხაჭაპური', 'Imeretian khachapuri', 26, [1, 4]),
      d('იმერული ლობიანი', 'Imeretian lobiani', 19, [1, 7]),
      d('ფენოვანი ხაჭაპური', 'Puff pastry khachapuri', 24, [1, 4]),
      d('ფენოვანი ლობიანი', 'Puff pastry lobiani', 20, [1, 7]),
      d('აჭარული ხაჭაპური', 'Adjarian khachapuri', 26, [1, 2, 4]),
      d('ნეშოს მჭადი და ყველი', 'Nesho leaf-baked cornbread with cheese', 13),
      d('შოთის პური (კარაქი აჯიკით)', 'Georgian shoti bread with adjika butter', 8, [1, 4, 7]),
      d('ხაჭაპური შამფურზე', 'Khachapuri on a skewer', 27, [1, 4]),
    ] },
    { id: 'khinkali', name: { en: 'Khinkali', ka: 'ხინკალი' }, items: [
      d('ქალაქური ხინკალი', 'Kalakuri khinkali', 21, [1, 7], { en: '6 pieces', ka: '6 ცალი' }),
      d('მოხევური ხინკალი', 'Mokhevuri khinkali', 21, [1, 7], { en: '6 pieces', ka: '6 ცალი' }),
      d('სოკოს ხინკალი', 'Mushroom khinkali', 19, [1, 7], { en: '6 pieces', ka: '6 ცალი' }),
      d('ყველის და ხაჭოს ხინკალი', 'Khinkali with cottage cheese and cheese', 19, [1, 4], { en: '6 pieces', ka: '6 ცალი' }),
      d('კარტოფილის ხინკალი', 'Potato khinkali', 18, [1, 4, 7], { en: '6 pieces', ka: '6 ცალი' }),
      d('პილმენი ქოთანში', 'Dumplings in a pot', 25, [1, 4]),
      d('ჩებურეკი', 'Cheburek', 23, [1, 7], { en: '4 pieces', ka: '4 ცალი' }),
    ] },
    { id: 'mains', name: { en: 'Mains', ka: 'ძირითადი კერძები' }, items: [
      d('წიწილა იმერული აჯიკით', 'Chicken tabaka with Imeretian adjika', 49, [3, 7]),
      d('აფხაზურა კოწახურის სოუსით', 'Apkhazura with barberry sauce', 29, [7]),
      d('სიბასი გრილზე ისპანახით და ნიგვზით', 'Grilled seabass with spinach and walnuts', 47, [3, 4, 6, 7]),
      d('შერეული ქაბაბი', 'Mixed kebab', 29, [1, 4, 6]),
      d('ცხვრის ქაბაბი', 'Lamb kebab', 27, [7]),
      d('ტაბაკა შქმერულად', 'Chicken shkmeruli', 49, [4]),
      d('გოჭი', 'Piglet', 47),
      d('ღორის მწვადი', 'Pork BBQ', 37, [6]),
      d('ხბოს მწვადი', 'Veal BBQ', 39, [6]),
      d('ქათმის მწვადი', 'Chicken BBQ', 29, [2, 6]),
      d('ოჯახური ღორის ხორცით', 'Family style potato with pork', 31, [6, 7]),
      d('ლობიო და მწნილი', 'Beans & pickles', 26, [5, 6, 7]),
      d('ლოქოს მწვადი', 'Catfish BBQ', 37, [7]),
      d('ხარჩო და ელარჯი', 'Kharcho & elarji', 45, [4, 7]),
      d('ხბოს ჩანახი', 'Veal chanakhi', 33, [1, 2, 7, 9]),
      d('მწვადის დაფა', 'Mixed BBQ board', 115, [7], { en: 'Veal, pork, chicken, mixed kebab', ka: 'ხბო, ღორი, ქათამი, შერეული ქაბაბი' }),
      d('ხბოს ღვიძლი ბადეკონში', 'Veal liver wrapped in caul fat', 31, [5, 7, 9]),
      d('ცხვრის ნეკნები ყაბაყით და კარტოფილით', 'Lamb ribs with zucchini & potatoes', 45, [7]),
      d('ბატკნის ბეჭი პიურეთი და ბროკოლით', 'Braised lamb shank with mashed potatoes & broccoli', 95, [4, 5, 7, 9]),
      d('ხის სოკოს ჩაშუშული', 'Braised wood ear mushrooms', 29, [7]),
    ] },
    { id: 'sides', name: { en: 'Sides', ka: 'გარნირი' }, items: [
      d('თაშმიჯაბი', 'Tashmijabi mashed potatoes', 21, [4], { en: 'With smoked melted cheese and cream', ka: 'შებოლილი სულგუნით და ნაღებით' }),
      d('ჭვიშტარის ჩხირები', 'Chvishtari sticks', 10, [1, 4]),
      d('ოჯახურად მომზადებული კარტოფილი', 'Family style potatoes', 18),
      d('ბოსტნეული გრილზე', 'Grilled veggies', 18),
    ] },
    { id: 'dessert', name: { en: 'Dessert', ka: 'დესერტი' }, items: [
      d('სეზონური ხილის თეფში', 'Seasonal fruit plate', 38),
      d('მედოკი', 'Honey cake', 20, [1, 2, 4, 11]),
      d('ნიგვზის ტარტი', 'Walnut tart', 21, [1, 2, 3, 4]),
      d('შოკმანჟე', 'Chocolate mousse with biscuit crumble', 25, [1, 2, 4]),
    ] },
  ],
};

// A few dishes shown large before the full menu. Chosen from the menu above;
// they are not labelled "signature" because the restaurant does not mark any.
export const featured = [
  ['starters', 'Pkhali board'],
  ['mains', 'Chicken shkmeruli'],
  ['khinkali', 'Kalakuri khinkali'],
  ['mains', 'Braised lamb shank with mashed potatoes & broccoli'],
];
