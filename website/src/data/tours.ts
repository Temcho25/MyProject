import type { Locale, Localized } from "@/i18n/locales";

/**
 * The three fixed-departure group tours.
 * Price and duration are the source of truth for the whole site
 * (cards, tour pages, structured data, forms). Change them only here.
 *
 * Deliberately NOT included: day-by-day programme and departure dates.
 * Add them here once confirmed (see README → "Editing tours").
 */

export type TourSlug =
  | "china-grand-tour-13-days"
  | "winter-china-harbin-12-days"
  | "china-nature-zhangjiajie-guilin-7-days";

export type RouteStop = {
  city: Localized;
  note: Localized;
  photo: string;
};

export type Tour = {
  slug: TourSlug;
  days: number;
  priceUsd: number;
  season: "all" | "winter";
  cover: string;
  gallery: string[];
  route: RouteStop[];
  title: Localized;
  short: Localized; // card subtitle
  tagline: Localized; // hero line
  seoTitle: Localized;
  seoDescription: Localized;
  intro: Localized<string[]>; // paragraphs
  highlights: Localized<string[]>;
  included: Localized<string[]>;
  notIncluded: Localized<string[]>;
  faq: Localized<{ q: string; a: string }[]>;
  relatedArticles: string[];
};

/* ── Shared lists ──────────────────────────────────────────────────── */

const notIncludedBase: Localized<string[]> = {
  ru: [
    "Международный авиаперелёт до Китая и обратно",
    "Визовые сборы и оформление документов — если для вашего гражданства нужна виза",
    "Медицинская страховка",
    "Личные расходы: сувениры, напитки и блюда сверх трёхразового питания",
    "Дополнительные экскурсии и развлечения, которых нет в программе",
  ],
  en: [
    "International flights to China and back",
    "Visa fees and paperwork, if your citizenship requires a visa",
    "Travel medical insurance",
    "Personal expenses: souvenirs, drinks and food beyond the three daily meals",
    "Optional excursions and activities that are not part of the programme",
  ],
  ka: [
    "საერთაშორისო ავიაფრენა ჩინეთამდე და უკან",
    "სავიზო მოსაკრებელი და დოკუმენტების მომზადება — თუ თქვენი მოქალაქეობისთვის ვიზაა საჭირო",
    "სამედიცინო დაზღვევა",
    "პირადი ხარჯები: სუვენირები, სასმელი და კერძები სამჯერადი კვების გარდა",
    "დამატებითი ექსკურსიები და გართობა, რომელიც პროგრამაში არ შედის",
  ],
};

const flightFaq: Localized<{ q: string; a: string }> = {
  ru: {
    q: "Входит ли авиабилет в стоимость?",
    a: "Нет. Международный перелёт до Китая и обратно оплачивается отдельно. Все переезды внутри Китая по маршруту уже включены. Мы подскажем, к какому городу и времени лучше прилететь, чтобы спокойно встретиться с группой.",
  },
  en: {
    q: "Is the international flight included?",
    a: "No. Flights to China and back are paid separately. All travel inside China along the route is already included. We will tell you which city to fly into and when, so you meet the group without stress.",
  },
  ka: {
    q: "შედის თუ არა ავიაბილეთი ფასში?",
    a: "არა. საერთაშორისო ფრენა ჩინეთამდე და უკან ცალკე იხდება. ჩინეთის შიგნით ყველა გადაადგილება მარშრუტის მიხედვით უკვე შედის ფასში. გეტყვით, რომელ ქალაქში და როდის ჯობია ჩამოფრენა, რომ ჯგუფს მშვიდად შეხვდეთ.",
  },
};

const programmeFaq: Localized<{ q: string; a: string }> = {
  ru: {
    q: "Где посмотреть программу по дням и даты выезда?",
    a: "Подробная программа и ближайшие даты согласуются перед каждым выездом. Оставьте заявку или напишите нам — пришлём актуальную информацию и ответим на вопросы.",
  },
  en: {
    q: "Where can I see the day-by-day programme and departure dates?",
    a: "The detailed programme and the next departure dates are confirmed before each trip. Send an enquiry or message us and we will share the current details and answer your questions.",
  },
  ka: {
    q: "სად ვნახო დღეების მიხედვით პროგრამა და გამგზავრების თარიღები?",
    a: "დეტალური პროგრამა და უახლოესი თარიღები ყოველი ტურის წინ დგინდება. დაგვიტოვეთ განაცხადი ან მოგვწერეთ — გამოგიგზავნით აქტუალურ ინფორმაციას და ვუპასუხებთ თქვენს კითხვებს.",
  },
};

const soloFaq: Localized<{ q: string; a: string }> = {
  ru: {
    q: "Можно ли поехать одному?",
    a: "Да, к группе можно присоединиться одному. Условия размещения в номере обсудим при бронировании.",
  },
  en: {
    q: "Can I join on my own?",
    a: "Yes, you can join the group as a solo traveller. We will discuss room arrangements when you book.",
  },
  ka: {
    q: "შეიძლება თუ არა მარტო წასვლა?",
    a: "დიახ, ჯგუფს მარტოც შეუერთდებით. ნომერში განთავსების პირობებს დაჯავშნისას შევათანხმებთ.",
  },
};

/* ── Tours ─────────────────────────────────────────────────────────── */

export const tours: Tour[] = [
  {
    slug: "china-grand-tour-13-days",
    days: 13,
    priceUsd: 1800,
    season: "all",
    cover: "zhangjiajie-pillars",
    gallery: ["avatar-mountains", "chengdu-panda", "chongqing-hongyadong", "terracotta-army", "changsha-orange-isle", "xian-city-wall"],
    route: [
      {
        city: { ru: "Чанша", en: "Changsha", ka: "ჩანშა" },
        note: {
          ru: "Столица провинции Хунань и удобные ворота к горам Чжанцзяцзе.",
          en: "Capital of Hunan province and the gateway to the Zhangjiajie mountains.",
          ka: "ჰუნანის პროვინციის დედაქალაქი და ჟანძიაძიეს მთების კარიბჭე.",
        },
        photo: "changsha-orange-isle",
      },
      {
        city: { ru: "Чжанцзяцзе", en: "Zhangjiajie", ka: "ჟანძიაძიე" },
        note: {
          ru: "Каменные столбы-великаны, которые называют «горами Аватара».",
          en: "Giant sandstone pillars known as the “Avatar mountains”.",
          ka: "გიგანტური ქვის სვეტები, რომლებსაც „ავატარის მთებს“ უწოდებენ.",
        },
        photo: "avatar-mountains",
      },
      {
        city: { ru: "Чэнду", en: "Chengdu", ka: "ჩენდუ" },
        note: {
          ru: "Город больших панд, чайных домов и сычуаньской кухни.",
          en: "Home of giant pandas, tea houses and Sichuan cuisine.",
          ka: "დიდი პანდების, ჩაის სახლებისა და სიჩუანური სამზარეულოს ქალაქი.",
        },
        photo: "chengdu-panda",
      },
      {
        city: { ru: "Чунцин", en: "Chongqing", ka: "ჩუნცინი" },
        note: {
          ru: "Многоуровневый мегаполис на холмах с яркими ночными видами.",
          en: "A multi-level megacity on the hills with spectacular night views.",
          ka: "მრავალდონიანი მეგაპოლისი ბორცვებზე, შთამბეჭდავი ღამის ხედებით.",
        },
        photo: "chongqing-hongyadong",
      },
      {
        city: { ru: "Сиань", en: "Xi'an", ka: "სიანი" },
        note: {
          ru: "Древняя столица Китая и знаменитая Терракотовая армия.",
          en: "China's ancient capital and the famous Terracotta Army.",
          ka: "ჩინეთის ძველი დედაქალაქი და ცნობილი ტერაკოტას არმია.",
        },
        photo: "terracotta-army",
      },
    ],
    title: {
      ru: "Большое путешествие по Китаю",
      en: "Grand China Journey",
      ka: "დიდი მოგზაურობა ჩინეთში",
    },
    short: {
      ru: "Горы Аватара, панды, мегаполисы и древний Сиань за одну поездку",
      en: "Avatar mountains, pandas, megacities and ancient Xi'an in one trip",
      ka: "ავატარის მთები, პანდები, მეგაპოლისები და ძველი სიანი ერთ მოგზაურობაში",
    },
    tagline: {
      ru: "Природа, современный Китай и история — за 13 дней",
      en: "Nature, modern China and history — in 13 days",
      ka: "ბუნება, თანამედროვე ჩინეთი და ისტორია — 13 დღეში",
    },
    seoTitle: {
      ru: "Тур по Китаю на 13 дней — $1 800 | Insta Tour",
      en: "13-Day China Small-Group Tour — $1,800 | Insta Tour",
      ka: "13-დღიანი ტური ჩინეთში — $1 800 | Insta Tour",
    },
    seoDescription: {
      ru: "Групповой тур по Китаю на 13 дней: Чанша, горы Аватара в Чжанцзяцзе, Чэнду, Чунцин и Сиань. Группа 5–7 человек, отели, питание и поезда включены.",
      en: "13-day small-group China tour: Changsha, Zhangjiajie's Avatar mountains, Chengdu, Chongqing and Xi'an. 5–7 travellers; hotels, meals and trains included.",
      ka: "13-დღიანი ჯგუფური ტური ჩინეთში: ჩანშა, ჟანძიაძიეს ავატარის მთები, ჩენდუ, ჩუნცინი და სიანი. ჯგუფი 5–7 კაცი, სასტუმრო, კვება და მატარებლები შედის.",
    },
    intro: {
      ru: [
        "Это самое насыщенное путешествие Insta Tour. За 13 дней вы увидите очень разный Китай: невероятные каменные столбы Чжанцзяцзе, живой и вкусный Чэнду, многоуровневый Чунцин, который кажется городом из будущего, и Сиань — одну из древнейших столиц страны.",
        "Между городами группа передвигается на скоростных поездах, а все организационные вопросы — отели, питание, билеты и переезды — берём на себя мы. Вам остаётся смотреть, пробовать и фотографировать.",
        "Мы путешествуем небольшой группой из 5–7 человек: так проще держать комфортный темп, не теряться в толпе и успевать больше.",
      ],
      en: [
        "This is Insta Tour's most complete journey. In 13 days you will see very different sides of China: the surreal stone pillars of Zhangjiajie, lively and delicious Chengdu, multi-level Chongqing that looks like a city from the future, and Xi'an, one of the country's oldest capitals.",
        "The group travels between cities by high-speed train, and we take care of everything else: hotels, meals, tickets and transfers. Your job is to look, taste and take photos.",
        "We travel in a small group of 5–7 people. It keeps the pace comfortable, makes crowds easier to handle and leaves more time for what matters.",
      ],
      ka: [
        "ეს Insta Tour-ის ყველაზე სრული მოგზაურობაა. 13 დღეში ნახავთ სრულიად განსხვავებულ ჩინეთს: ჟანძიაძიეს წარმოუდგენელ ქვის სვეტებს, ცოცხალ და გემრიელ ჩენდუს, მრავალდონიან ჩუნცინს, რომელიც მომავლის ქალაქს ჰგავს, და სიანს — ქვეყნის ერთ-ერთ უძველეს დედაქალაქს.",
        "ქალაქებს შორის ჯგუფი ჩქაროსნული მატარებლებით მოძრაობს, ხოლო ყველა ორგანიზაციულ საკითხს — სასტუმროს, კვებას, ბილეთებსა და გადაადგილებას — ჩვენ ვკისრულობთ. თქვენ მხოლოდ უყურებთ, აგემოვნებთ და იღებთ ფოტოებს.",
        "ვმოგზაურობთ პატარა ჯგუფით, 5–7 ადამიანით: ასე უფრო მარტივია კომფორტული ტემპის შენარჩუნება და მეტის მოსწრება.",
      ],
    },
    highlights: {
      ru: [
        "Горы Аватара в национальном парке Чжанцзяцзе",
        "Город панд Чэнду и сычуаньская кухня",
        "Ночной Чунцин и его многоуровневая архитектура",
        "Древний Сиань и Терракотовая армия",
        "Поездки на скоростных поездах между городами",
      ],
      en: [
        "The Avatar mountains of Zhangjiajie National Forest Park",
        "Chengdu, the city of pandas and Sichuan food",
        "Chongqing at night and its multi-level architecture",
        "Ancient Xi'an and the Terracotta Army",
        "High-speed train rides between cities",
      ],
      ka: [
        "ავატარის მთები ჟანძიაძიეს ეროვნულ პარკში",
        "პანდების ქალაქი ჩენდუ და სიჩუანური სამზარეულო",
        "ღამის ჩუნცინი და მისი მრავალდონიანი არქიტექტურა",
        "ძველი სიანი და ტერაკოტას არმია",
        "მგზავრობა ჩქაროსნული მატარებლებით ქალაქებს შორის",
      ],
    },
    included: {
      ru: [
        "Проживание в отелях",
        "Трёхразовое питание",
        "Внутренние переезды",
        "Скоростные поезда по маршруту",
        "Входные билеты на основные достопримечательности по программе",
        "Услуги гида-переводчика",
        "Сопровождение группы",
        "Организация путешествия",
      ],
      en: [
        "Hotel accommodation",
        "Three meals a day",
        "Ground transfers inside China",
        "High-speed trains along the route",
        "Entrance tickets to the main sights in the programme",
        "Guide-interpreter",
        "Tour leader accompanying the group",
        "Full trip organisation",
      ],
      ka: [
        "განთავსება სასტუმროებში",
        "სამჯერადი კვება",
        "შიდა ტრანსფერები",
        "ჩქაროსნული მატარებლები მარშრუტის მიხედვით",
        "შესასვლელი ბილეთები პროგრამის მთავარ ღირსშესანიშნაობებზე",
        "გიდ-თარჯიმნის მომსახურება",
        "ჯგუფის თანხლება",
        "მოგზაურობის ორგანიზება",
      ],
    },
    notIncluded: notIncludedBase,
    faq: {
      ru: [
        flightFaq.ru,
        {
          q: "Подойдёт ли тур тем, кто впервые едет в Китай?",
          a: "Да. Маршрут охватывает самые разные стороны страны, а всю логистику — отели, поезда, билеты и питание — организуем мы. Гид-переводчик помогает с языком на протяжении поездки.",
        },
        {
          q: "Насколько физически сложный маршрут?",
          a: "Особой подготовки не нужно, но в Чжанцзяцзе и Чунцине много ходьбы и лестниц. Возьмите удобную обувь. Если есть ограничения по здоровью, напишите нам заранее.",
        },
        soloFaq.ru,
        programmeFaq.ru,
      ],
      en: [
        flightFaq.en,
        {
          q: "Is this tour good for a first trip to China?",
          a: "Yes. The route shows very different sides of the country, and we organise all the logistics: hotels, trains, tickets and meals. A guide-interpreter helps with the language throughout the trip.",
        },
        {
          q: "How physically demanding is it?",
          a: "No special fitness is needed, but Zhangjiajie and Chongqing involve plenty of walking and stairs. Bring comfortable shoes, and tell us in advance about any health limitations.",
        },
        soloFaq.en,
        programmeFaq.en,
      ],
      ka: [
        flightFaq.ka,
        {
          q: "შესაფერისია თუ არა ტური მათთვის, ვინც ჩინეთში პირველად მიდის?",
          a: "დიახ. მარშრუტი ქვეყნის სხვადასხვა მხარეს მოიცავს, ლოჯისტიკას კი — სასტუმროებს, მატარებლებს, ბილეთებსა და კვებას — ჩვენ ვაწყობთ. გიდ-თარჯიმანი მთელი მოგზაურობის განმავლობაში გეხმარებათ ენასთან დაკავშირებით.",
        },
        {
          q: "რამდენად რთულია მარშრუტი ფიზიკურად?",
          a: "განსაკუთრებული მომზადება არ არის საჭირო, მაგრამ ჟანძიაძიესა და ჩუნცინში ბევრი სიარული და კიბეებია. წაიღეთ კომფორტული ფეხსაცმელი. თუ ჯანმრთელობის შეზღუდვები გაქვთ, წინასწარ მოგვწერეთ.",
        },
        soloFaq.ka,
        programmeFaq.ka,
      ],
    },
    relatedArticles: [
      "zhangjiajie-avatar-mountains-guide",
      "chengdu-pandas-guide",
      "chongqing-travel-guide",
      "xian-terracotta-army-guide",
    ],
  },

  {
    slug: "winter-china-harbin-12-days",
    days: 12,
    priceUsd: 2200,
    season: "winter",
    cover: "harbin-ice-festival",
    gallery: ["great-wall-winter", "forbidden-city", "shaolin-temple", "terracotta-army", "harbin-st-sophia", "longmen-grottoes"],
    route: [
      {
        city: { ru: "Харбин", en: "Harbin", ka: "ხარბინი" },
        note: {
          ru: "Зимняя столица Китая и знаменитый ледовый фестиваль.",
          en: "China's winter capital and its famous ice festival.",
          ka: "ჩინეთის ზამთრის დედაქალაქი და ცნობილი ყინულის ფესტივალი.",
        },
        photo: "harbin-ice-festival",
      },
      {
        city: { ru: "Пекин", en: "Beijing", ka: "პეკინი" },
        note: {
          ru: "Великая Китайская стена и Запретный город.",
          en: "The Great Wall and the Forbidden City.",
          ka: "ჩინეთის დიდი კედელი და აკრძალული ქალაქი.",
        },
        photo: "great-wall-winter",
      },
      {
        city: { ru: "Лоян", en: "Luoyang", ka: "ლოიანი" },
        note: {
          ru: "Одна из древних столиц Китая, родина буддийских гротов Лунмэнь.",
          en: "One of China's ancient capitals, home of the Longmen Grottoes.",
          ka: "ჩინეთის ერთ-ერთი ძველი დედაქალაქი, ლუნმენის გამოქვაბულების სამშობლო.",
        },
        photo: "longmen-grottoes",
      },
      {
        city: { ru: "Шаолинь", en: "Shaolin", ka: "შაოლინი" },
        note: {
          ru: "Легендарный монастырь в горах Суншань — колыбель кунг-фу.",
          en: "The legendary monastery in the Song Mountains, cradle of kung fu.",
          ka: "ლეგენდარული მონასტერი სუნშანის მთებში — კუნგ-ფუს აკვანი.",
        },
        photo: "shaolin-temple",
      },
      {
        city: { ru: "Сиань", en: "Xi'an", ka: "სიანი" },
        note: {
          ru: "Терракотовая армия и городская стена древней столицы.",
          en: "The Terracotta Army and the walls of the ancient capital.",
          ka: "ტერაკოტას არმია და ძველი დედაქალაქის გალავანი.",
        },
        photo: "terracotta-army",
      },
    ],
    title: {
      ru: "Зимний Китай и Харбин",
      en: "Winter China & Harbin",
      ka: "ზამთრის ჩინეთი და ხარბინი",
    },
    short: {
      ru: "Ледовый фестиваль, Великая стена, Шаолинь и Терракотовая армия",
      en: "Ice festival, the Great Wall, Shaolin and the Terracotta Army",
      ka: "ყინულის ფესტივალი, დიდი კედელი, შაოლინი და ტერაკოტას არმია",
    },
    tagline: {
      ru: "Ледовые города Харбина и великие символы Китая — за 12 дней",
      en: "Harbin's ice cities and China's great icons — in 12 days",
      ka: "ხარბინის ყინულის ქალაქები და ჩინეთის დიდი სიმბოლოები — 12 დღეში",
    },
    seoTitle: {
      ru: "Зимний тур в Китай и Харбин на 12 дней — $2 200 | Insta Tour",
      en: "Winter China Tour with Harbin Ice Festival, 12 Days | Insta Tour",
      ka: "ზამთრის ტური ჩინეთში და ხარბინში, 12 დღე | Insta Tour",
    },
    seoDescription: {
      ru: "Зимний групповой тур: ледовый фестиваль Харбина, Пекин и Великая стена, Лоян, Шаолинь и Сиань. 12 дней, $2 200, группа 5–7 человек, отели 4–5★.",
      en: "Winter small-group tour: Harbin Ice Festival, Beijing and the Great Wall, Luoyang, Shaolin and Xi'an. 12 days, $2,200, 5–7 travellers, 4–5★ hotels.",
      ka: "ზამთრის ჯგუფური ტური: ხარბინის ყინულის ფესტივალი, პეკინი და დიდი კედელი, ლოიანი, შაოლინი და სიანი. 12 დღე, $2 200, ჯგუფი 5–7 კაცი, 4–5★ სასტუმრო.",
    },
    intro: {
      ru: [
        "Зимой Китай открывается с неожиданной стороны. В Харбине из льда и снега вырастают целые города с подсветкой, а в Пекине Великая Китайская стена и Запретный город выглядят особенно графично и спокойно.",
        "Дальше маршрут ведёт к истокам китайской культуры: в древний Лоян, к легендарному монастырю Шаолинь и в Сиань, где ждёт Терракотовая армия.",
        "Переезды на скоростных поездах и, при необходимости, внутренние перелёты, отели категории 4–5 звёзд, трёхразовое питание и гид-переводчик уже включены. Группа — 5–7 человек.",
      ],
      en: [
        "Winter shows China from an unexpected angle. In Harbin entire illuminated cities rise from ice and snow, while in Beijing the Great Wall and the Forbidden City look especially graphic and calm.",
        "From there the route leads to the roots of Chinese culture: ancient Luoyang, the legendary Shaolin Monastery and Xi'an, home of the Terracotta Army.",
        "High-speed trains and, where needed, domestic flights, 4–5 star hotels, three meals a day and a guide-interpreter are all included. The group is 5–7 people.",
      ],
      ka: [
        "ზამთარში ჩინეთი მოულოდნელი მხრიდან იხსნება. ხარბინში ყინულისა და თოვლისგან მთელი განათებული ქალაქები იზრდება, პეკინში კი დიდი კედელი და აკრძალული ქალაქი განსაკუთრებით მშვიდად და გრაფიკულად გამოიყურება.",
        "შემდეგ მარშრუტი ჩინური კულტურის სათავეებისკენ მიდის: ძველ ლოიანში, ლეგენდარულ შაოლინის მონასტერსა და სიანში, სადაც ტერაკოტას არმია გელოდებათ.",
        "ჩქაროსნული მატარებლები და საჭიროების შემთხვევაში შიდა ფრენები, 4–5 ვარსკვლავიანი სასტუმროები, სამჯერადი კვება და გიდ-თარჯიმანი უკვე შედის ფასში. ჯგუფი — 5–7 ადამიანი.",
      ],
    },
    highlights: {
      ru: [
        "Ледовый фестиваль Харбина",
        "Великая Китайская стена",
        "Запретный город в Пекине",
        "Храм Шаолинь",
        "Терракотовая армия в Сиане",
      ],
      en: [
        "Harbin Ice and Snow Festival",
        "The Great Wall of China",
        "The Forbidden City in Beijing",
        "Shaolin Temple",
        "The Terracotta Army in Xi'an",
      ],
      ka: [
        "ხარბინის ყინულის ფესტივალი",
        "ჩინეთის დიდი კედელი",
        "აკრძალული ქალაქი პეკინში",
        "შაოლინის ტაძარი",
        "ტერაკოტას არმია სიანში",
      ],
    },
    included: {
      ru: [
        "Отели категории 4–5 звёзд",
        "Трёхразовое питание",
        "Внутренние трансферы",
        "Скоростные поезда",
        "Внутренние авиаперелёты при необходимости",
        "Входные билеты на основные достопримечательности по программе",
        "Гид-переводчик",
        "Сопровождение группы",
        "Полная организация путешествия",
      ],
      en: [
        "4–5 star hotels",
        "Three meals a day",
        "Ground transfers inside China",
        "High-speed trains",
        "Domestic flights where needed",
        "Entrance tickets to the main sights in the programme",
        "Guide-interpreter",
        "Tour leader accompanying the group",
        "Complete trip organisation",
      ],
      ka: [
        "4–5 ვარსკვლავიანი სასტუმროები",
        "სამჯერადი კვება",
        "შიდა ტრანსფერები",
        "ჩქაროსნული მატარებლები",
        "შიდა ავიაფრენები საჭიროების შემთხვევაში",
        "შესასვლელი ბილეთები პროგრამის მთავარ ღირსშესანიშნაობებზე",
        "გიდ-თარჯიმანი",
        "ჯგუფის თანხლება",
        "მოგზაურობის სრული ორგანიზება",
      ],
    },
    notIncluded: notIncludedBase,
    faq: {
      ru: [
        flightFaq.ru,
        {
          q: "Когда проходит ледовый фестиваль в Харбине?",
          a: "Фестиваль проходит в самые холодные зимние месяцы, обычно с конца декабря — начала января до февраля. Точные даты открытия, часы работы и доступность площадок объявляются каждый год, поэтому даты тура мы подтверждаем только после официальных объявлений.",
        },
        {
          q: "Насколько холодно в Харбине?",
          a: "Зимой в Харбине очень холодно — морозы около −20 °C и ниже обычное дело. Нужны тёплая многослойная одежда, термобельё, зимняя обувь, шапка и перчатки. Перед поездкой пришлём список вещей.",
        },
        soloFaq.ru,
        programmeFaq.ru,
      ],
      en: [
        flightFaq.en,
        {
          q: "When does the Harbin Ice Festival take place?",
          a: "The festival runs during the coldest winter months, usually from late December or early January into February. Exact opening dates, hours and venue availability are announced every year, so we confirm tour dates only after the official announcements.",
        },
        {
          q: "How cold is Harbin?",
          a: "Harbin winters are very cold, and temperatures around −20 °C or lower are normal. You need warm layered clothing, thermal underwear, winter boots, a hat and gloves. We will send a packing list before the trip.",
        },
        soloFaq.en,
        programmeFaq.en,
      ],
      ka: [
        flightFaq.ka,
        {
          q: "როდის იმართება ხარბინის ყინულის ფესტივალი?",
          a: "ფესტივალი ზამთრის ყველაზე ცივ თვეებში იმართება, ჩვეულებრივ დეკემბრის ბოლოდან ან იანვრის დასაწყისიდან თებერვლამდე. გახსნის ზუსტი თარიღები, სამუშაო საათები და მოედნების ხელმისაწვდომობა ყოველწლიურად ცხადდება, ამიტომ ტურის თარიღებს მხოლოდ ოფიციალური განცხადებების შემდეგ ვადასტურებთ.",
        },
        {
          q: "რამდენად ცივა ხარბინში?",
          a: "ზამთარში ხარბინში ძალიან ცივა — −20 °C და უფრო დაბალი ტემპერატურა ჩვეულებრივი ამბავია. საჭიროა თბილი მრავალშრიანი ტანსაცმელი, თერმოსაცვალი, ზამთრის ფეხსაცმელი, ქუდი და ხელთათმანი. მოგზაურობამდე ნივთების სიას გამოგიგზავნით.",
        },
        soloFaq.ka,
        programmeFaq.ka,
      ],
    },
    relatedArticles: [
      "harbin-ice-festival-guide",
      "beijing-great-wall-forbidden-city-guide",
      "xian-terracotta-army-guide",
      "china-high-speed-trains-guide",
    ],
  },

  {
    slug: "china-nature-zhangjiajie-guilin-7-days",
    days: 7,
    priceUsd: 1450,
    season: "all",
    cover: "li-river",
    gallery: ["zhangjiajie-pillars", "avatar-mountains", "tianmen-mountain", "yangshuo-karst", "yangshuo-yulong-river", "guilin-karst"],
    route: [
      {
        city: { ru: "Чанша", en: "Changsha", ka: "ჩანშა" },
        note: {
          ru: "Начало путешествия в провинции Хунань.",
          en: "The start of the journey in Hunan province.",
          ka: "მოგზაურობის დასაწყისი ჰუნანის პროვინციაში.",
        },
        photo: "changsha-orange-isle",
      },
      {
        city: { ru: "Чжанцзяцзе", en: "Zhangjiajie", ka: "ჟანძიაძიე" },
        note: {
          ru: "Горы Аватара и национальный парк Чжанцзяцзе.",
          en: "The Avatar mountains and Zhangjiajie National Forest Park.",
          ka: "ავატარის მთები და ჟანძიაძიეს ეროვნული პარკი.",
        },
        photo: "zhangjiajie-pillars",
      },
      {
        city: { ru: "Гуйлинь", en: "Guilin", ka: "გუილინი" },
        note: {
          ru: "Карстовые горы и живописная река Ли.",
          en: "Karst peaks and the scenic Li River.",
          ka: "კარსტული მთები და თვალწარმტაცი მდინარე ლი.",
        },
        photo: "guilin-karst",
      },
      {
        city: { ru: "Яншо", en: "Yangshuo", ka: "იანშუო" },
        note: {
          ru: "Сельские пейзажи, рисовые поля и неспешная атмосфера.",
          en: "Countryside views, rice fields and an unhurried atmosphere.",
          ka: "სოფლის პეიზაჟები, ბრინჯის მინდვრები და აუჩქარებელი ატმოსფერო.",
        },
        photo: "yangshuo-karst",
      },
    ],
    title: {
      ru: "Природа Китая: Чжанцзяцзе, Гуйлинь и Яншо",
      en: "Nature of China: Zhangjiajie, Guilin & Yangshuo",
      ka: "ჩინეთის ბუნება: ჟანძიაძიე, გუილინი და იანშუო",
    },
    short: {
      ru: "Горы Аватара, река Ли и карстовые пейзажи Яншо за неделю",
      en: "Avatar mountains, the Li River and Yangshuo's karst in one week",
      ka: "ავატარის მთები, მდინარე ლი და იანშუოს კარსტი ერთ კვირაში",
    },
    tagline: {
      ru: "Самые впечатляющие пейзажи Китая — за 7 дней",
      en: "China's most breathtaking landscapes — in 7 days",
      ka: "ჩინეთის ყველაზე შთამბეჭდავი პეიზაჟები — 7 დღეში",
    },
    seoTitle: {
      ru: "Тур Чжанцзяцзе, Гуйлинь и Яншо на 7 дней — $1 450 | Insta Tour",
      en: "Zhangjiajie, Guilin & Yangshuo Tour, 7 Days — $1,450 | Insta Tour",
      ka: "ტური ჟანძიაძიე, გუილინი, იანშუო — 7 დღე | Insta Tour",
    },
    seoDescription: {
      ru: "Тур по природе Китая на 7 дней: горы Аватара в Чжанцзяцзе, река Ли, карстовые горы Гуйлиня и Яншо. $1 450, группа 5–7 человек, отели и питание включены.",
      en: "7-day China nature tour: Zhangjiajie's Avatar mountains, the Li River and the karst peaks of Guilin and Yangshuo. $1,450, 5–7 travellers, hotels and meals included.",
      ka: "7-დღიანი ტური ჩინეთის ბუნებაში: ავატარის მთები, მდინარე ლი, გუილინისა და იანშუოს კარსტული მთები. $1 450, ჯგუფი 5–7 კაცი, სასტუმრო და კვება შედის.",
    },
    intro: {
      ru: [
        "Неделя среди пейзажей, которые трудно представить, пока не увидишь их своими глазами. Сначала — Чжанцзяцзе: сотни каменных столбов, уходящих в облака, те самые «горы Аватара».",
        "Потом — Гуйлинь и Яншо: зелёные карстовые горы, извилистая река Ли, рисовые поля и спокойная атмосфера южного Китая.",
        "Это идеальный маршрут для тех, кто любит природу и фотографию и хочет увидеть самое красивое за короткий отпуск. Проживание, трёхразовое питание, переезды и гид-переводчик включены.",
      ],
      en: [
        "A week among landscapes that are hard to imagine until you see them. First comes Zhangjiajie: hundreds of stone pillars rising into the clouds, the famous “Avatar mountains”.",
        "Then Guilin and Yangshuo: green karst peaks, the winding Li River, rice fields and the calm atmosphere of southern China.",
        "It is the ideal route for nature and photography lovers who want to see the most beautiful places on a short holiday. Hotels, three meals a day, transfers and a guide-interpreter are included.",
      ],
      ka: [
        "ერთი კვირა პეიზაჟებს შორის, რომელთა წარმოდგენაც ძნელია, სანამ საკუთარი თვალით არ ნახავ. ჯერ ჟანძიაძიე: ასობით ქვის სვეტი, რომლებიც ღრუბლებში იკარგება — სწორედ ის „ავატარის მთები“.",
        "შემდეგ გუილინი და იანშუო: მწვანე კარსტული მთები, კლაკნილი მდინარე ლი, ბრინჯის მინდვრები და სამხრეთ ჩინეთის მშვიდი ატმოსფერო.",
        "იდეალური მარშრუტია მათთვის, ვისაც ბუნება და ფოტოგრაფია უყვარს და მოკლე შვებულებაში ყველაზე ლამაზის ნახვა სურს. სასტუმრო, სამჯერადი კვება, გადაადგილება და გიდ-თარჯიმანი შედის ფასში.",
      ],
    },
    highlights: {
      ru: [
        "Горы Аватара",
        "Национальный парк Чжанцзяцзе",
        "Карстовые горы Гуйлиня",
        "Живописные пейзажи реки Ли",
        "Природа и атмосфера Яншо",
      ],
      en: [
        "The Avatar mountains",
        "Zhangjiajie National Forest Park",
        "Guilin's karst mountains",
        "Scenic Li River landscapes",
        "Yangshuo's nature and atmosphere",
      ],
      ka: [
        "ავატარის მთები",
        "ჟანძიაძიეს ეროვნული პარკი",
        "გუილინის კარსტული მთები",
        "მდინარე ლის თვალწარმტაცი პეიზაჟები",
        "იანშუოს ბუნება და ატმოსფერო",
      ],
    },
    included: {
      ru: [
        "Проживание в отелях",
        "Трёхразовое питание",
        "Внутренние авиаперелёты при необходимости",
        "Скоростные поезда",
        "Внутренние трансферы",
        "Входные билеты на основные достопримечательности по программе",
        "Гид-переводчик",
        "Сопровождение группы",
        "Организация путешествия",
      ],
      en: [
        "Hotel accommodation",
        "Three meals a day",
        "Domestic flights where needed",
        "High-speed trains",
        "Ground transfers inside China",
        "Entrance tickets to the main sights in the programme",
        "Guide-interpreter",
        "Tour leader accompanying the group",
        "Trip organisation",
      ],
      ka: [
        "განთავსება სასტუმროებში",
        "სამჯერადი კვება",
        "შიდა ავიაფრენები საჭიროების შემთხვევაში",
        "ჩქაროსნული მატარებლები",
        "შიდა ტრანსფერები",
        "შესასვლელი ბილეთები პროგრამის მთავარ ღირსშესანიშნაობებზე",
        "გიდ-თარჯიმანი",
        "ჯგუფის თანხლება",
        "მოგზაურობის ორგანიზება",
      ],
    },
    notIncluded: notIncludedBase,
    faq: {
      ru: [
        flightFaq.ru,
        {
          q: "Когда лучше ехать в Чжанцзяцзе и Гуйлинь?",
          a: "Самое комфортное время — весна и осень. Летом жарко и чаще идут дожди, зато зелень особенно яркая. В горах Чжанцзяцзе бывает туман: он может закрыть виды, но и создаёт ту самую атмосферу «парящих гор».",
        },
        {
          q: "Хватит ли 7 дней, чтобы всё увидеть?",
          a: "Маршрут построен так, чтобы увидеть главные природные места без лишних переездов. Если хотите задержаться дольше или добавить другие города, мы можем собрать индивидуальную поездку.",
        },
        soloFaq.ru,
        programmeFaq.ru,
      ],
      en: [
        flightFaq.en,
        {
          q: "When is the best time for Zhangjiajie and Guilin?",
          a: "Spring and autumn are the most comfortable. Summer is hot with more rain, but the greenery is at its brightest. Zhangjiajie is often misty: fog can hide some views, but it also creates the famous “floating mountains” look.",
        },
        {
          q: "Are 7 days enough?",
          a: "The route is designed to cover the main natural highlights without unnecessary transfers. If you want to stay longer or add other cities, we can build a private trip for you.",
        },
        soloFaq.en,
        programmeFaq.en,
      ],
      ka: [
        flightFaq.ka,
        {
          q: "როდის ჯობია ჟანძიაძიესა და გუილინში წასვლა?",
          a: "ყველაზე კომფორტული დრო გაზაფხული და შემოდგომაა. ზაფხულში ცხელა და უფრო ხშირად წვიმს, სამაგიეროდ სიმწვანე განსაკუთრებით ნათელია. ჟანძიაძიეს მთებში ხშირად ნისლია: შეიძლება ხედები დაფაროს, მაგრამ სწორედ ის ქმნის „მფრინავი მთების“ ატმოსფეროს.",
        },
        {
          q: "საკმარისია თუ არა 7 დღე?",
          a: "მარშრუტი ისეა აწყობილი, რომ მთავარი ბუნებრივი ადგილები ზედმეტი გადაადგილების გარეშე ნახოთ. თუ მეტ ხანს დარჩენა ან სხვა ქალაქების დამატება გსურთ, ინდივიდუალურ მოგზაურობას შეგიდგენთ.",
        },
        soloFaq.ka,
        programmeFaq.ka,
      ],
    },
    relatedArticles: [
      "zhangjiajie-avatar-mountains-guide",
      "guilin-yangshuo-li-river-guide",
      "china-high-speed-trains-guide",
      "group-vs-private-china-tour",
    ],
  },
];

export const getTour = (slug: string) => tours.find((t) => t.slug === slug);

export function formatPrice(usd: number, locale: Locale) {
  // "$1,800" (en) / "$1 800" (ru, ka) — always USD.
  return `$${new Intl.NumberFormat("en-US").format(usd).replace(/,/g, locale === "en" ? "," : " ")}`;
}
