// Dream Palace — content data.
// Every factual item carries its source. See docs/RESEARCH.md before editing.
// Text fields are { ka, en, ru }.

export const milestones = [
  {
    at: 0.06,
    date: { ka: '12.11.2021', en: '12 Nov 2021', ru: '12.11.2021' },
    title: { ka: 'მშენებლობის ნებართვა', en: 'Construction permit', ru: 'Разрешение на строительство' },
    src: { ka: 'წყარო: flatmarket.ge', en: 'Source: flatmarket.ge', ru: 'Источник: flatmarket.ge' },
  },
  {
    at: 0.5,
    date: { ka: 'IV კვ. 2024', en: 'Q4 2024', ru: 'IV кв. 2024' },
    title: { ka: 'კორპუსი 1 დასრულდა', en: 'Block 1 completed', ru: 'Блок 1 завершён' },
    src: { ka: 'წყარო: korter.ge', en: 'Source: korter.ge', ru: 'Источник: korter.ge' },
  },
  {
    at: 0.78,
    date: { ka: 'IV კვ. 2025', en: 'Q4 2025', ru: 'IV кв. 2025' },
    title: { ka: 'კორპუსი 2 დასრულდა', en: 'Block 2 completed', ru: 'Блок 2 завершён' },
    src: { ka: 'წყარო: korter.ge', en: 'Source: korter.ge', ru: 'Источник: korter.ge' },
  },
  {
    at: 0.94,
    date: { ka: 'შემდეგი ეტაპი', en: 'Next phase', ru: 'Следующий этап' },
    title: { ka: 'კორპუსი 4 — დაგეგმილი', en: 'Block 4 — planned', ru: 'Блок 4 — запланирован' },
    src: { ka: 'ვადებს ადასტურებს გაყიდვების გუნდი', en: 'Timing confirmed by the sales team', ru: 'Сроки подтверждает отдел продаж' },
  },
];

export const phases = {
  foundation: { ka: 'საძირკველი', en: 'Foundation', ru: 'Фундамент' },
  frame1: { ka: 'კორპუსი 1 · კარკასი და გადახურვები', en: 'Block 1 · frame and slabs', ru: 'Блок 1 · каркас и перекрытия' },
  frame2: { ka: 'კორპუსი 2 · კარკასი და გადახურვები', en: 'Block 2 · frame and slabs', ru: 'Блок 2 · каркас и перекрытия' },
  facade: { ka: 'ფასადი და მინა · შემდეგი ეტაპი', en: 'Facade and glazing · next phase', ru: 'Фасад и остекление · следующий этап' },
};

// Indicative areas per avezor.ge (page dated 10.07.2026). Georgian room-count convention.
export const apartments = [
  {
    id: 'r1', min: 32.4, max: 34.7,
    name: { ka: '1-ოთახიანი', en: '1-room (studio)', ru: '1-комнатная (студия)' },
    rooms: { ka: 'ერთიანი საცხოვრებელი სივრცე', en: 'One open living space', ru: 'Единое жилое пространство' },
    plan: null, // path to an official floor-plan image, e.g. 'assets/media/plans/r1.webp'
  },
  {
    id: 'r2', min: 56.9, max: 85.1,
    name: { ka: '2-ოთახიანი', en: '2-room', ru: '2-комнатная' },
    rooms: { ka: 'მისაღები + 1 საძინებელი', en: 'Living room + 1 bedroom', ru: 'Гостиная + 1 спальня' },
    plan: null,
  },
  {
    id: 'r3', min: 96.8, max: 145.2,
    name: { ka: '3-ოთახიანი', en: '3-room', ru: '3-комнатная' },
    rooms: { ka: 'მისაღები + 2 საძინებელი', en: 'Living room + 2 bedrooms', ru: 'Гостиная + 2 спальни' },
    plan: null,
  },
  {
    id: 'r4', min: 147, max: 147,
    name: { ka: '4-ოთახიანი', en: '4-room', ru: '4-комнатная' },
    rooms: { ka: 'მისაღები + 3 საძინებელი', en: 'Living room + 3 bedrooms', ru: 'Гостиная + 3 спальни' },
    plan: null,
  },
];

export const blocks = [
  {
    id: 'b1', status: 'done', floors: 8, units: 60,
    name: { ka: 'კორპუსი 1', en: 'Block 1', ru: 'Блок 1' },
    when: { ka: 'დასრულდა IV კვ. 2024', en: 'Completed Q4 2024', ru: 'Завершён в IV кв. 2024' },
  },
  {
    id: 'b2', status: 'done', floors: 8, units: 60,
    name: { ka: 'კორპუსი 2', en: 'Block 2', ru: 'Блок 2' },
    when: { ka: 'დასრულდა IV კვ. 2025', en: 'Completed Q4 2025', ru: 'Завершён в IV кв. 2025' },
  },
  {
    id: 'b4', status: 'planned', floors: null, units: null,
    name: { ka: 'კორპუსი 4', en: 'Block 4', ru: 'Блок 4' },
    when: { ka: 'დაგეგმილი · ვადა დასაზუსტებელია', en: 'Planned · timing to be confirmed', ru: 'Запланирован · сроки уточняются' },
  },
];

export const features = [
  { id: 'frame',
    t: { ka: 'მონოლითური კარკასი', en: 'Monolithic frame', ru: 'Монолитный каркас' },
    d: { ka: 'კორპუსები აგებულია მონოლითურ-კარკასული ტექნოლოგიით.', en: 'The blocks are built with monolithic-frame technology.', ru: 'Корпуса построены по монолитно-каркасной технологии.' } },
  { id: 'ceiling',
    t: { ka: '2,9 მ ჭერი', en: '2.9 m ceilings', ru: 'Потолки 2,9 м' },
    d: { ka: 'ჭერის სიმაღლე — 2,9 მეტრი.', en: 'Ceiling height is 2.9 metres.', ru: 'Высота потолков — 2,9 метра.' } },
  { id: 'elevator',
    t: { ka: 'ლიფტი', en: 'Elevator', ru: 'Лифт' },
    d: { ka: 'კორპუსებში ლიფტია.', en: 'The blocks have elevators.', ru: 'В корпусах есть лифты.' } },
  { id: 'parking',
    t: { ka: 'პარკინგი', en: 'Parking', ru: 'Паркинг' },
    d: { ka: 'მიწისქვეშა და მიწისზედა პარკინგი.', en: 'Underground and surface parking.', ru: 'Подземный и наземный паркинг.' } },
  { id: 'cctv',
    t: { ka: 'ვიდეოთვალთვალი', en: 'CCTV', ru: 'Видеонаблюдение' },
    d: { ka: 'ტერიტორია ვიდეოთვალთვალის ქვეშაა.', en: 'The grounds are covered by video surveillance.', ru: 'Территория под видеонаблюдением.' } },
  { id: 'yard',
    t: { ka: 'ეზო და საბავშვო მოედანი', en: 'Courtyard and playground', ru: 'Двор и детская площадка' },
    d: { ka: 'დასასვენებელი ზონა და საბავშვო სათამაშო მოედანი.', en: 'A recreation area and a children’s playground.', ru: 'Зона отдыха и детская игровая площадка.' } },
  { id: 'green',
    t: { ka: 'მწვანე კარკასი', en: 'Green frame', ru: 'Зелёный каркас' },
    d: { ka: 'ბინა გადაეცემა მწვანე კარკასით — მოსაპირკეთებლად მზად. შემადგენლობას აზუსტებს გაყიდვების გუნდი.', en: 'Apartments are handed over as “green frame”, ready for interior finishing. The sales team confirms exactly what is included.', ru: 'Квартиры сдаются в «зелёном каркасе» — под чистовую отделку. Состав уточняет отдел продаж.' } },
];

export const places = [
  { id: 'dp', x: 300, y: 210,
    t: { ka: 'Dream Palace', en: 'Dream Palace', ru: 'Dream Palace' },
    d: { ka: 'ბობ უოლშის ქ. 10', en: '10 Bob Walsh St', ru: 'ул. Боба Уолша, 10' } },
  { id: 'embassy', x: 120, y: 90,
    t: { ka: 'აშშ-ის საელჩო', en: 'US Embassy', ru: 'Посольство США' },
    d: { ka: 'ქართულ-ამერიკული მეგობრობის გამზ. 29, დიდი დიღომი. დეველოპერის ცნობით, კომპლექსი საელჩოს მახლობლადაა.', en: '29 Georgian-American Friendship Ave, Didi Dighomi. The developer describes the complex as near the embassy.', ru: 'пр. Грузино-американской дружбы, 29, Диди Дигоми. По словам застройщика, комплекс расположен рядом с посольством.' } },
  { id: 'olympic', x: 480, y: 80,
    t: { ka: 'ოლიმპიური პარკი, დიღომი', en: 'Olympic Park, Dighomi', ru: 'Олимпийский парк, Дигоми' },
    d: { ka: 'ოლიმპიური წყლის სპორტის კომპლექსი 50-მეტრიანი, სავარჯიშო და საბავშვო აუზებით — აშენდა 2015 წლის ევროპის ახალგაზრდული ოლიმპიური ფესტივალისთვის.', en: 'The Olympic Water Sports Complex — 50 m, training and children’s pools — built for the 2015 European Youth Olympic Festival.', ru: 'Олимпийский комплекс водных видов спорта — 50-метровый, тренировочный и детский бассейны — построен к Европейскому юношескому олимпийскому фестивалю 2015 года.' } },
  { id: 'nikora', x: 500, y: 210,
    t: { ka: 'სუპერმარკეტი „ნიკორა“', en: 'Nikora supermarket', ru: 'Супермаркет «Никора»' },
    d: { ka: 'ბობ უოლშის ქ. 30ბ — იმავე ქუჩაზე.', en: '30b Bob Walsh St — on the same street.', ru: 'ул. Боба Уолша, 30б — на той же улице.' } },
];

export const faq = [
  { q: { ka: 'რა მდგომარეობაში გადაეცემა ბინა?', en: 'In what condition are apartments handed over?', ru: 'В каком состоянии сдаются квартиры?' },
    a: { ka: 'ბინები გადაეცემა მწვანე კარკასით, ანუ მოსაპირკეთებლად მზად (korter.ge). ზუსტ შემადგენლობას გაყიდვების გუნდი დაგიზუსტებთ.', en: 'Apartments are handed over as “green frame”, ready for interior finishing (korter.ge). The sales team will confirm exactly what is included.', ru: 'Квартиры сдаются в «зелёном каркасе», то есть под отделку (korter.ge). Точный состав уточнит отдел продаж.' } },
  { q: { ka: 'რომელი კორპუსებია დასრულებული?', en: 'Which blocks are completed?', ru: 'Какие корпуса уже завершены?' },
    a: { ka: 'korter.ge-ის მიხედვით, კორპუსი 1 დასრულდა 2024 წლის IV კვარტალში, კორპუსი 2 — 2025 წლის IV კვარტალში, ხოლო კორპუსი 4 დაგეგმილია. წყაროებში კორპუსების საერთო რაოდენობა განსხვავდება, ამიტომ მიმდინარე სტატუსი გადაამოწმეთ გაყიდვების გუნდთან.', en: 'According to korter.ge, Block 1 was completed in Q4 2024, Block 2 in Q4 2025, and Block 4 is planned. Sources disagree on the total number of blocks, so please check the current status with the sales team.', ru: 'По данным korter.ge, блок 1 завершён в IV квартале 2024 года, блок 2 — в IV квартале 2025 года, блок 4 запланирован. Источники расходятся в общем числе корпусов, поэтому актуальный статус уточните в отделе продаж.' } },
  { q: { ka: 'რა ზომის ბინებია?', en: 'What apartment sizes are there?', ru: 'Какие площади у квартир?' },
    a: { ka: 'საორიენტაციოდ 32,4-დან 147 მ²-მდე: 1-ოთახიანი 32,4–34,7 მ², 2-ოთახიანი 56,9–85,1 მ², 3-ოთახიანი 96,8–145,2 მ², 4-ოთახიანი 147 მ² (avezor.ge, 10.07.2026). თავისუფალ ბინებს და ზუსტ გეგმებს გაყიდვების გუნდი გაგიზიარებთ.', en: 'Roughly 32.4 to 147 m²: 1-room 32.4–34.7 m², 2-room 56.9–85.1 m², 3-room 96.8–145.2 m², 4-room 147 m² (avezor.ge, 10 Jul 2026). The sales team can share available units and exact plans.', ru: 'Ориентировочно от 32,4 до 147 м²: 1-комнатные 32,4–34,7 м², 2-комнатные 56,9–85,1 м², 3-комнатные 96,8–145,2 м², 4-комнатная 147 м² (avezor.ge, 10.07.2026). Свободные квартиры и точные планировки предоставит отдел продаж.' } },
  { q: { ka: 'არის პარკინგი?', en: 'Is there parking?', ru: 'Есть ли паркинг?' },
    a: { ka: 'დიახ, მიწისქვეშა და მიწისზედა (korter.ge). ადგილების პირობებს გაყიდვების გუნდი დაგიზუსტებთ.', en: 'Yes, underground and surface parking (korter.ge). Ask the sales team about the terms for spaces.', ru: 'Да, подземный и наземный (korter.ge). Условия по машиноместам уточнит отдел продаж.' } },
  { q: { ka: 'შესაძლებელია განვადება ან იპოთეკა?', en: 'Are instalments or a mortgage possible?', ru: 'Возможна ли рассрочка или ипотека?' },
    a: { ka: 'მესამე მხარის პორტალებზე მითითებული იყო 10% პირველადი შენატანი, 15–18 თვემდე განვადება და საბანკო იპოთეკა. პირობები იცვლება — მიმდინარე შეთავაზებას მხოლოდ გაყიდვების გუნდი ადასტურებს.', en: 'Third-party portals have listed a 10% down payment, instalments of up to 15–18 months and a bank mortgage. Terms change, and only the sales team can confirm the current offer.', ru: 'На сторонних порталах указывались первый взнос 10%, рассрочка до 15–18 месяцев и банковская ипотека. Условия меняются — актуальное предложение подтверждает только отдел продаж.' } },
  { q: { ka: 'როგორ დავათვალიერო ბინა?', en: 'How can I view an apartment?', ru: 'Как посмотреть квартиру?' },
    a: { ka: 'დაგვირეკეთ +995 598 52 22 22 ან შეავსეთ მოთხოვნის ფორმა — შევათანხმებთ დათვალიერების დროს ბობ უოლშის ქ. 10-ში.', en: 'Call +995 598 52 22 22 or fill in the inquiry form, and we will arrange a time for a viewing at 10 Bob Walsh St.', ru: 'Позвоните по номеру +995 598 52 22 22 или заполните форму — согласуем время просмотра на ул. Боба Уолша, 10.' } },
  { q: { ka: 'რა ღირს ბინა?', en: 'What do apartments cost?', ru: 'Сколько стоят квартиры?' },
    a: { ka: 'ფასები იცვლება და საიტზე არ ქვეყნდება. აქტუალურ ფასს კონკრეტულ ბინაზე გაყიდვების გუნდი გეტყვით.', en: 'Prices change, so they are not published here. The sales team will quote the current price for a specific apartment.', ru: 'Цены меняются и на сайте не публикуются. Актуальную цену конкретной квартиры сообщит отдел продаж.' } },
  { q: { ka: 'სად ვნახო მშენებლობის ახალი ფოტოები?', en: 'Where can I see recent construction photos?', ru: 'Где посмотреть свежие фото стройки?' },
    a: { ka: 'კომპანია აქვეყნებს განახლებებს Instagram-ზე (@dream_palace_geo) და Facebook-ზე. korter.ge-ზე უახლესი ფოტოები 2025 წლის ნოემბრით თარიღდება.', en: 'The company posts updates on Instagram (@dream_palace_geo) and Facebook. The newest photos on korter.ge are dated November 2025.', ru: 'Компания публикует новости в Instagram (@dream_palace_geo) и Facebook. Самые свежие фото на korter.ge датированы ноябрём 2025 года.' } },
];

// Official media manifest. Add only material the company is authorised to publish.
// type: 'photo' | 'render' | 'progress' | 'video'; date: ISO; src: path inside assets/media.
// Progress items with a date also appear in the construction chronicle.
export const media = [
  // { type: 'progress', src: 'assets/media/progress-2025-11.webp', date: '2025-11-01',
  //   alt: { ka: '...', en: '...', ru: '...' }, credit: 'Dream Palace' },
];
