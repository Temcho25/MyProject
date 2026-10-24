// Language layer. Georgian (ka) is the source language and lives in index.html.
// Static strings: translations keyed by data-i18n. Dynamic strings: `ui` below.

const dict = {
  en: {
    skip: 'Skip to main content',
    brandHome: 'Dream Palace — home',
    navLabel: 'Main navigation',
    navLabelMobile: 'Mobile navigation',
    navProject: 'Project', navConstruction: 'Construction', navApartments: 'Apartments',
    navBuilding: 'Blocks', navLocation: 'Location', navPurchase: 'Purchase', navContact: 'Contact',
    langLabel: 'Language', ctaConsult: 'Consultation', menu: 'Menu',
    heroEyebrow: '10 Bob Walsh St · Tbilisi',
    heroTitle: '<span class="line"><span>From structure</span></span><span class="line"><span>to space</span></span>',
    heroLead: 'Dream Palace is a residential complex in Tbilisi: eight-floor monolithic blocks, 2.9&nbsp;m ceilings and apartments from 32.4 to 147&nbsp;m².',
    ctaApartments: 'Explore apartments', ctaConsultLong: 'Request a consultation',
    schematic: 'Schematic · not to scale', scroll: 'Scroll',
    projectTitle: '<span class="line"><span>The project</span></span>',
    projectStatement: 'Dream Palace is being built in phases on Bob Walsh Street. <em class="fact"><b data-count="2">2</b> eight-floor blocks</em> are already completed, each with <em class="fact"><b data-count="60">60</b> apartments</em>. Ceilings are <em class="fact"><b data-count="2.9" data-decimals="1">2.9</b> metres</em> high, and apartments are handed over as <em class="fact">green frame</em>.',
    factAddressK: 'Address', factAddressV: '10 Bob Walsh St, Tbilisi',
    factStructureK: 'Structure', factStructureV: 'Monolithic frame',
    factAreasK: 'Areas', sqm: 'm²', factParkingK: 'Parking', factParkingV: 'Underground and surface',
    projectSource: 'Sources: korter.ge, avezor.ge — collected 24 Oct 2026. The sales team confirms current status and availability.',
    buildTitle: '<span class="line"><span>Construction chronicle</span></span>',
    buildIntro: 'Scroll to follow how a monolithic frame is assembled, from the foundation to the facade.',
    floorLabel: 'Floor', milestonesLabel: 'Milestones',
    buildNote: 'This schematic animation shows the construction sequence, not the exact geometry of the building.',
    aptsTitle: '<span class="line"><span>Apartments and</span></span><span class="line"><span>floor plans</span></span>',
    aptTypeLabel: 'Apartment type', areaWanted: 'Preferred area', planLabel: 'Plan',
    planSchematic: 'Typology scheme — not an official floor plan',
    compareTitle: 'Area comparison',
    aptsSource: 'Areas are indicative (avezor.ge, 10 Jul 2026). The sales team confirms exact plans, floors and availability. Prices change, so they are not published.',
    blocksTitle: '<span class="line"><span>The blocks</span></span>',
    blocksLead: 'Select a block to see its status. Completed blocks are solid; planned blocks are drawn with a dashed line.',
    blocksLabel: 'Blocks',
    blocksSource: 'Numbering and status as listed on korter.ge. Sources disagree on the total number of blocks (3 or 5), so please check with the sales team.',
    featuresTitle: '<span class="line"><span>The building in section</span></span>',
    featuresLead: 'Each feature lights up on the section drawing to show where it is and how it works.',
    featuresSource: 'Features as listed on korter.ge. The sales team confirms exactly what “green frame” includes. The section is schematic.',
    locTitle: '<span class="line"><span>Location</span></span>',
    locLead: 'Bob Walsh Street, in the Dighomi area. The developer describes the complex as near the US Embassy.',
    locDiagramNote: 'Diagram shows no scale or directions', openMap: 'Open in maps',
    locSource: 'Check distances and routes on a map. Sources: Wikipedia, In Your Pocket, yell.ge, the Dream Palace Facebook page.',
    galleryTitle: '<span class="line"><span>Gallery</span></span>', galleryTitlePlain: 'Gallery',
    filterLabel: 'Filter', prev: 'Previous', next: 'Next', close: 'Close',
    purchaseTitle: '<span class="line"><span>How to buy</span></span>',
    step1T: 'Consultation', step1D: 'The sales team walks you through available apartments, prices and current conditions.',
    step2T: 'Viewing', step2D: 'See the apartment and the block in person at 10 Bob Walsh St.',
    step3T: 'Payment method', step3D: 'Full payment, instalments or a mortgage. The company confirms the exact terms.',
    step4T: 'Contract', step4D: 'Once the terms are agreed, the contract is signed.',
    calcTitle: 'Estimate', calcBadge: 'Illustrative · not an official offer',
    calcPrice: 'Apartment price (USD)', calcPricePh: 'e.g. 65,000', calcPriceHint: 'Enter the price you received from the sales team.',
    calcDown: 'Down payment', calcMonths: 'Term (months)',
    calcOutDown: 'Down payment', calcOutRest: 'Remaining amount', calcOutMonthly: 'Monthly payment',
    calcNote: 'This estimate assumes equal monthly payments with no interest and is for illustration only. Third-party portals have listed a 10% down payment, instalments of up to 15–18 months and a mortgage option. The sales team confirms the current terms.',
    faqTitle: '<span class="line"><span>Questions</span></span>',
    finalTitle: '<span class="line"><span>See the building</span></span><span class="line"><span>for yourself</span></span>',
    finalLead: 'Two blocks are already completed. Ask for a viewing, a list of available apartments or a consultation.',
    cPhone: 'Phone', cEmail: 'Email', cAddress: 'Address', cSocial: 'Social media',
    formTitle: 'Inquiry', fName: 'Name', fPhone: 'Phone', fEmail: 'Email', optional: '(optional)',
    fTopic: 'What are you interested in?', fMsg: 'Message',
    fConsent: 'I agree that the sales team may contact me on the number provided.',
    fSubmit: 'Send inquiry',
    footerNote: 'Drawings on this site are schematic and are not official design documentation. Information updated 24 Oct 2026.',
  },
  ru: {
    skip: 'Перейти к основному содержанию',
    brandHome: 'Dream Palace — главная',
    navLabel: 'Основная навигация', navLabelMobile: 'Мобильная навигация',
    navProject: 'Проект', navConstruction: 'Стройка', navApartments: 'Квартиры',
    navBuilding: 'Корпуса', navLocation: 'Расположение', navPurchase: 'Покупка', navContact: 'Контакты',
    langLabel: 'Язык', ctaConsult: 'Консультация', menu: 'Меню',
    heroEyebrow: 'ул. Боба Уолша, 10 · Тбилиси',
    heroTitle: '<span class="line"><span>От структуры —</span></span><span class="line"><span>к пространству</span></span>',
    heroLead: 'Dream Palace — жилой комплекс в Тбилиси: восьмиэтажные монолитные корпуса, потолки 2,9&nbsp;м и квартиры от 32,4 до 147&nbsp;м².',
    ctaApartments: 'Смотреть квартиры', ctaConsultLong: 'Запросить консультацию',
    schematic: 'Схема · без масштаба', scroll: 'Листайте',
    projectTitle: '<span class="line"><span>Проект</span></span>',
    projectStatement: 'Dream Palace строится поэтапно на улице Боба Уолша. <em class="fact"><b data-count="2">2</b> восьмиэтажных корпуса</em> уже завершены, в каждом <em class="fact"><b data-count="60">60</b> квартир</em>. Высота потолков — <em class="fact"><b data-count="2.9" data-decimals="1">2,9</b> метра</em>, квартиры сдаются в <em class="fact">зелёном каркасе</em>.',
    factAddressK: 'Адрес', factAddressV: 'ул. Боба Уолша, 10, Тбилиси',
    factStructureK: 'Конструкция', factStructureV: 'Монолитный каркас',
    factAreasK: 'Площади', sqm: 'м²', factParkingK: 'Паркинг', factParkingV: 'Подземный и наземный',
    projectSource: 'Источники: korter.ge, avezor.ge — данные собраны 24.10.2026. Актуальный статус и наличие подтверждает отдел продаж.',
    buildTitle: '<span class="line"><span>Хроника стройки</span></span>',
    buildIntro: 'Прокрутите и проследите, как собирается монолитный каркас — от фундамента до фасада.',
    floorLabel: 'Этаж', milestonesLabel: 'Этапы',
    buildNote: 'Схематичная анимация показывает последовательность строительства, а не точную геометрию здания.',
    aptsTitle: '<span class="line"><span>Квартиры</span></span><span class="line"><span>и планировки</span></span>',
    aptTypeLabel: 'Тип квартиры', areaWanted: 'Желаемая площадь', planLabel: 'Планировка',
    planSchematic: 'Схема типологии — не официальная планировка',
    compareTitle: 'Сравнение площадей',
    aptsSource: 'Площади ориентировочные (avezor.ge, 10.07.2026). Точную планировку, этаж и наличие подтверждает отдел продаж. Цены меняются и не публикуются.',
    blocksTitle: '<span class="line"><span>Корпуса</span></span>',
    blocksLead: 'Выберите корпус, чтобы увидеть его статус. Завершённые корпуса закрашены, запланированные показаны пунктиром.',
    blocksLabel: 'Корпуса',
    blocksSource: 'Нумерация и статусы — по данным korter.ge. Источники расходятся в общем числе корпусов (3 или 5) — уточните в отделе продаж.',
    featuresTitle: '<span class="line"><span>Здание в разрезе</span></span>',
    featuresLead: 'Каждая характеристика подсвечивается на разрезе — где она находится и как работает.',
    featuresSource: 'Характеристики — по данным korter.ge. Точный состав «зелёного каркаса» подтверждает отдел продаж. Разрез схематичный.',
    locTitle: '<span class="line"><span>Расположение</span></span>',
    locLead: 'Улица Боба Уолша в районе Дигоми. По словам застройщика, комплекс находится рядом с посольством США.',
    locDiagramNote: 'Схема не отражает масштаб и направления', openMap: 'Открыть на карте',
    locSource: 'Расстояния и маршруты проверяйте по карте. Источники: Wikipedia, In Your Pocket, yell.ge, страница Dream Palace в Facebook.',
    galleryTitle: '<span class="line"><span>Галерея</span></span>', galleryTitlePlain: 'Галерея',
    filterLabel: 'Фильтр', prev: 'Назад', next: 'Вперёд', close: 'Закрыть',
    purchaseTitle: '<span class="line"><span>Как купить</span></span>',
    step1T: 'Консультация', step1D: 'Отдел продаж расскажет о свободных квартирах, ценах и текущих условиях.',
    step2T: 'Просмотр', step2D: 'Осмотрите квартиру и корпус на месте — ул. Боба Уолша, 10.',
    step3T: 'Способ оплаты', step3D: 'Полная оплата, рассрочка или ипотека — точные условия подтверждает компания.',
    step4T: 'Договор', step4D: 'После согласования условий оформляется договор.',
    calcTitle: 'Ориентировочный расчёт', calcBadge: 'Иллюстрация · не официальное предложение',
    calcPrice: 'Цена квартиры (USD)', calcPricePh: 'напр. 65 000', calcPriceHint: 'Введите цену, полученную от отдела продаж.',
    calcDown: 'Первый взнос', calcMonths: 'Срок (мес.)',
    calcOutDown: 'Первый взнос', calcOutRest: 'Остаток', calcOutMonthly: 'Ежемесячный платёж',
    calcNote: 'Расчёт предполагает равные ежемесячные платежи без процентов и носит иллюстративный характер. На сторонних порталах указывались первый взнос 10%, рассрочка до 15–18 месяцев и ипотека — актуальные условия подтверждает отдел продаж.',
    faqTitle: '<span class="line"><span>Вопросы</span></span>',
    finalTitle: '<span class="line"><span>Посмотрите здание</span></span><span class="line"><span>своими глазами</span></span>',
    finalLead: 'Два корпуса уже завершены. Запросите просмотр, список свободных квартир или консультацию.',
    cPhone: 'Телефон', cEmail: 'Эл. почта', cAddress: 'Адрес', cSocial: 'Соцсети',
    formTitle: 'Заявка', fName: 'Имя', fPhone: 'Телефон', fEmail: 'Эл. почта', optional: '(необязательно)',
    fTopic: 'Что вас интересует?', fMsg: 'Сообщение',
    fConsent: 'Я согласен(на), чтобы отдел продаж связался со мной по указанному номеру.',
    fSubmit: 'Отправить заявку',
    footerNote: 'Чертежи на сайте схематичны и не являются официальной проектной документацией. Информация обновлена 24.10.2026.',
  },
};

export const ui = {
  ka: {
    metaTitle: 'Dream Palace — საცხოვრებელი კომპლექსი ბობ უოლშის ქუჩაზე, თბილისი',
    metaDesc: 'Dream Palace — რვასართულიანი მონოლითური კორპუსები ბობ უოლშის ქ. 10-ში, თბილისი. ბინები 32,4–147 მ², 2,9 მ ჭერი, მწვანე კარკასი, მიწისქვეშა პარკინგი.',
    sqm: 'მ²', range: (a, b) => (a === b ? `${fmt(a, 'ka')} მ²` : `${fmt(a, 'ka')}–${fmt(b, 'ka')} მ²`),
    matchIn: 'თქვენი ფართობი ამ ტიპის დიაპაზონშია',
    matchNear: 'უახლოესი ტიპი თქვენს ფართობთან',
    askType: 'ამ ტიპზე მოთხოვნა',
    planOfficial: 'ოფიციალური გეგმა',
    living: 'მისაღები', bedroom: 'საძინებელი', bath: 'სველი წ.', hall: 'შესასვლელი', kitchen: 'სამზარეულო',
    statusDone: 'დასრულებული', statusPlanned: 'დაგეგმილი',
    floorsK: 'სართულები', unitsK: 'ბინები', statusK: 'სტატუსი', tbc: 'დასაზუსტებელია',
    blockSrc: 'წყარო: korter.ge. მიმდინარე სტატუსს ადასტურებს გაყიდვების გუნდი.',
    gAll: 'ყველა', gDrawing: 'ნახაზები', gPhoto: 'ფოტოები', gRender: 'რენდერები', gProgress: 'პროგრესი',
    gEmpty: 'ამ კატეგორიაში ოფიციალური მასალა ჯერ არ დამატებულა. მშენებლობის უახლესი კადრები — Instagram-ზე @dream_palace_geo.',
    gNoteDrawings: 'ნახაზები სქემატურია. ოფიციალური ფოტოები და რენდერები დაემატება კომპანიის მიერ მოწოდების შემდეგ.',
    gTypeDrawing: 'სქემა', gTypePhoto: 'ფოტო', gTypeRender: 'რენდერი', gTypeProgress: 'პროგრესი', gTypeVideo: 'ვიდეო',
    plates: { elevation: 'ფასადის სქემა', frame: 'მონოლითური კარკასი', section: 'ჭრილი', plan: 'ტიპოლოგია', blocks: 'კორპუსები' },
    topics: ['ხელმისაწვდომი ბინები', 'დათვალიერება', 'კონსულტაცია', 'გადახდის პირობები', 'სხვა'],
    errName: 'შეიყვანეთ სახელი.', errPhone: 'შეიყვანეთ სწორი ტელეფონის ნომერი.', errEmail: 'ელფოსტის ფორმატი არასწორია.', errConsent: 'საჭიროა თანხმობა.',
    sending: 'იგზავნება…',
    sent: 'მადლობა! მოთხოვნა მიღებულია — გაყიდვების გუნდი მალე დაგიკავშირდებათ.',
    sendFail: 'გაგზავნა ვერ მოხერხდა. სცადეთ ხელახლა ან დაგვირეკეთ: +995 598 52 22 22.',
    noBackend: 'ონლაინ გაგზავნა ჯერ არ არის ჩართული, ამიტომ მოთხოვნა არ გაიგზავნა. შეგიძლიათ გაგზავნოთ ელფოსტით — ტექსტი უკვე მომზადებულია — ან დაგვირეკოთ.',
    openEmail: 'ელფოსტით გაგზავნა',
    mailSubject: 'მოთხოვნა საიტიდან — Dream Palace',
    lbOf: (i, n) => `${i} / ${n}`,
    floor: 'სართული',
    labels: { floors: '8 სართული', ceiling: '+2,90 მ ჭერი', frame: 'მონოლითური კარკასი', datum: '±0.00', planned: 'დაგეგმილი', street: 'ბობ უოლშის ქ.', parking: 'პარკინგი', lift: 'ლიფტი' },
  },
  en: {
    metaTitle: 'Dream Palace — residential complex on Bob Walsh Street, Tbilisi',
    metaDesc: 'Dream Palace — eight-floor monolithic blocks at 10 Bob Walsh St, Tbilisi. Apartments 32.4–147 m², 2.9 m ceilings, green frame, underground parking.',
    sqm: 'm²', range: (a, b) => (a === b ? `${fmt(a, 'en')} m²` : `${fmt(a, 'en')}–${fmt(b, 'en')} m²`),
    matchIn: 'Your area is within this type’s range',
    matchNear: 'Closest type to your area',
    askType: 'Ask about this type',
    planOfficial: 'Official floor plan',
    living: 'Living', bedroom: 'Bedroom', bath: 'Bath', hall: 'Hall', kitchen: 'Kitchen',
    statusDone: 'Completed', statusPlanned: 'Planned',
    floorsK: 'Floors', unitsK: 'Apartments', statusK: 'Status', tbc: 'To be confirmed',
    blockSrc: 'Source: korter.ge. The sales team confirms the current status.',
    gAll: 'All', gDrawing: 'Drawings', gPhoto: 'Photos', gRender: 'Renders', gProgress: 'Progress',
    gEmpty: 'No official material has been added to this category yet. The latest construction footage is on Instagram, @dream_palace_geo.',
    gNoteDrawings: 'Drawings are schematic. Official photos and renders will be added once the company supplies them.',
    gTypeDrawing: 'Schematic', gTypePhoto: 'Photo', gTypeRender: 'Render', gTypeProgress: 'Progress', gTypeVideo: 'Video',
    plates: { elevation: 'Facade scheme', frame: 'Monolithic frame', section: 'Section', plan: 'Typology', blocks: 'Blocks' },
    topics: ['Available apartments', 'Viewing', 'Consultation', 'Payment terms', 'Other'],
    errName: 'Please enter your name.', errPhone: 'Please enter a valid phone number.', errEmail: 'This email address doesn’t look right.', errConsent: 'Consent is required.',
    sending: 'Sending…',
    sent: 'Thank you! Your inquiry was received, and the sales team will contact you soon.',
    sendFail: 'The inquiry could not be sent. Please try again or call +995 598 52 22 22.',
    noBackend: 'Online sending isn’t connected yet, so your inquiry was not sent. You can send it by email — the text is already prepared — or call us.',
    openEmail: 'Send by email',
    mailSubject: 'Website inquiry — Dream Palace',
    lbOf: (i, n) => `${i} / ${n}`,
    floor: 'Floor',
    labels: { floors: '8 floors', ceiling: '+2.90 m ceiling', frame: 'Monolithic frame', datum: '±0.00', planned: 'Planned', street: 'Bob Walsh St', parking: 'Parking', lift: 'Lift' },
  },
  ru: {
    metaTitle: 'Dream Palace — жилой комплекс на улице Боба Уолша, Тбилиси',
    metaDesc: 'Dream Palace — восьмиэтажные монолитные корпуса на ул. Боба Уолша, 10, Тбилиси. Квартиры 32,4–147 м², потолки 2,9 м, зелёный каркас, подземный паркинг.',
    sqm: 'м²', range: (a, b) => (a === b ? `${fmt(a, 'ru')} м²` : `${fmt(a, 'ru')}–${fmt(b, 'ru')} м²`),
    matchIn: 'Ваша площадь входит в диапазон этого типа',
    matchNear: 'Ближайший тип к вашей площади',
    askType: 'Запрос по этому типу',
    planOfficial: 'Официальная планировка',
    living: 'Гостиная', bedroom: 'Спальня', bath: 'С/у', hall: 'Холл', kitchen: 'Кухня',
    statusDone: 'Завершён', statusPlanned: 'Запланирован',
    floorsK: 'Этажей', unitsK: 'Квартир', statusK: 'Статус', tbc: 'Уточняется',
    blockSrc: 'Источник: korter.ge. Актуальный статус подтверждает отдел продаж.',
    gAll: 'Все', gDrawing: 'Чертежи', gPhoto: 'Фото', gRender: 'Рендеры', gProgress: 'Ход стройки',
    gEmpty: 'В этой категории пока нет официальных материалов. Свежие кадры стройки — в Instagram @dream_palace_geo.',
    gNoteDrawings: 'Чертежи схематичны. Официальные фото и рендеры появятся после их предоставления компанией.',
    gTypeDrawing: 'Схема', gTypePhoto: 'Фото', gTypeRender: 'Рендер', gTypeProgress: 'Стройка', gTypeVideo: 'Видео',
    plates: { elevation: 'Схема фасада', frame: 'Монолитный каркас', section: 'Разрез', plan: 'Типология', blocks: 'Корпуса' },
    topics: ['Свободные квартиры', 'Просмотр', 'Консультация', 'Условия оплаты', 'Другое'],
    errName: 'Введите имя.', errPhone: 'Введите корректный номер телефона.', errEmail: 'Неверный формат эл. почты.', errConsent: 'Необходимо согласие.',
    sending: 'Отправка…',
    sent: 'Спасибо! Заявка получена — отдел продаж скоро свяжется с вами.',
    sendFail: 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните: +995 598 52 22 22.',
    noBackend: 'Онлайн-отправка пока не подключена, поэтому заявка не отправлена. Вы можете отправить её по почте — текст уже подготовлен — или позвонить нам.',
    openEmail: 'Отправить по почте',
    mailSubject: 'Заявка с сайта — Dream Palace',
    lbOf: (i, n) => `${i} / ${n}`,
    floor: 'Этаж',
    labels: { floors: '8 этажей', ceiling: '+2,90 м потолок', frame: 'Монолитный каркас', datum: '±0.00', planned: 'План', street: 'ул. Боба Уолша', parking: 'Паркинг', lift: 'Лифт' },
  },
};

export const LANGS = ['ka', 'en', 'ru'];
// Georgian convention: decimal comma, space as thousands separator. Some engines format
// 'ka-GE' with a decimal point, so ru-RU (same convention) is used for numbers.
export const NUM_LOCALES = { ka: 'ru-RU', en: 'en-GB', ru: 'ru-RU' };
const LOCALES = NUM_LOCALES;
let lang = 'ka';
const kaText = new Map();
const kaAttr = new Map();
const listeners = new Set();

export function fmt(n, l = lang, opts = {}) {
  // Georgian and Russian use a decimal comma; Intl handles this per locale.
  return new Intl.NumberFormat(LOCALES[l], { maximumFractionDigits: 1, ...opts }).format(n);
}
export const getLang = () => lang;
export const t = (key) => ui[lang][key] ?? ui.ka[key];
export const pick = (obj) => (obj ? obj[lang] ?? obj.ka : '');
export const onLang = (fn) => listeners.add(fn);

function capture() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    if (!kaText.has(k)) kaText.set(k, el.innerHTML);
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, k] = pair.split(':');
      if (!kaAttr.has(k)) kaAttr.set(k, el.getAttribute(attr) ?? '');
    });
  });
}

function apply() {
  const d = dict[lang];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    const v = lang === 'ka' ? kaText.get(k) : d[k];
    if (v != null && el.innerHTML !== v) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, k] = pair.split(':');
      const v = lang === 'ka' ? kaAttr.get(k) : d[k];
      if (v != null) el.setAttribute(attr, v);
    });
  });
  document.documentElement.lang = lang;
  document.title = t('metaTitle');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('metaDesc'));
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  listeners.forEach((fn) => fn(lang));
}

export function setLang(next, { animate = true } = {}) {
  if (!LANGS.includes(next)) return;
  lang = next;
  try { localStorage.setItem('dp-lang', next); } catch (_) { /* storage unavailable */ }
  const url = new URL(location.href);
  if (next === 'ka') url.searchParams.delete('lang'); else url.searchParams.set('lang', next);
  history.replaceState(null, '', url);
  const root = document.documentElement;
  if (!animate || root.classList.contains('reduced-motion')) { apply(); return; }
  root.classList.add('is-swapping');
  setTimeout(() => { apply(); requestAnimationFrame(() => root.classList.remove('is-swapping')); }, 180);
}

export function initI18n() {
  capture();
  let initial = new URLSearchParams(location.search).get('lang');
  if (!LANGS.includes(initial)) {
    try { initial = localStorage.getItem('dp-lang'); } catch (_) { initial = null; }
  }
  lang = LANGS.includes(initial) ? initial : 'ka';
  apply();
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
}
