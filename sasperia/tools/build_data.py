#!/usr/bin/env python3
"""Builds js/data.js from Sasperia's own published content.

Sources (captured 2026-10-29): sasperia.ge/menu (Georgian + English toggle),
sasperia.ge/bar, sasperia.ge/wine, sasperia.ge/coctails.
Russian is a translation of that same text; nothing is added.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ru_menu import RU, RU_CATS, EN_FIX_NAME, EN_FIX_DESC, EN_FIX_CAT

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = json.load(open(os.path.join(ROOT, "tools/menu_source.json")))
placeholders = set(open(os.path.join(ROOT, "tools/placeholders.txt")).read().split())

CAT_KEYS = ["signature", "starters", "salads", "soups", "oven", "mains", "grill", "garnish", "sauces", "dessert"]

food = []
for key, ka_s, en_s in zip(CAT_KEYS, src["ka"], src["en"]):
    items = []
    for ka, en in zip(ka_s["items"], en_s["items"]):
        assert ka["id"] == en["id"]
        iid = ka["id"]
        fid = iid.lstrip("-")
        ru_name, ru_desc = RU[iid]
        img = None if fid in placeholders else f"assets/dish/{fid}.webp"
        items.append({
            "id": fid,
            "price": int(ka["price"].replace("₾", "").strip()),
            "img": img,
            "name": {"ka": ka["name"], "en": EN_FIX_NAME.get(iid, en["name"]), "ru": ru_name},
            "desc": {"ka": ka["desc"] or "", "en": EN_FIX_DESC.get(iid, en["desc"] or ""), "ru": ru_desc or ""},
        })
    food.append({
        "key": key,
        "title": {"ka": ka_s["title"], "en": EN_FIX_CAT.get(en_s["title"], en_s["title"]), "ru": RU_CATS[ka_s["title"]]},
        "items": items,
    })

def T(ka, en, ru=None):
    return {"ka": ka, "en": en, "ru": ru if ru is not None else en}

# ---- Bar (sasperia.ge/bar) ----
bar = [
    {"key": "soft", "title": T("გამაგრილებელი სასმელი", "Soft drinks", "Безалкогольные напитки"), "unit": None, "items": [
        (T("წყალი 0.5ლ", "Still water 0.5L", "Вода 0,5 л"), 5),
        (T("ბორჯომი 0.5ლ", "Borjomi 0.5L", "Боржоми 0,5 л"), 6),
        (T("წვენი 0.25ლ", "Juice 0.25L", "Сок 0,25 л"), 5),
        (T("კოკა-კოლა კლასიკი 0.33ლ", "Coca-Cola Classic 0.33L", "Coca-Cola Classic 0,33 л"), 5),
        (T("კოკა-კოლა ზერო 0.33ლ", "Coca-Cola Zero 0.33L", "Coca-Cola Zero 0,33 л"), 5),
        (T("რედ ბული 0.25ლ", "Red Bull 0.25L", "Red Bull 0,25 л"), 10),
        (T("ტონიკი 0.33ლ", "Tonic 0.33L", "Тоник 0,33 л"), 8)]},
    {"key": "fresh", "title": T("ახლად დაწურული წვენი", "Freshly squeezed juice", "Свежевыжатые соки"), "unit": None, "items": [
        (T("ანანასი", "Pineapple", "Ананас"), 30), (T("ბროწეული", "Pomegranate", "Гранат"), 48),
        (T("ფორთოხალი", "Orange", "Апельсин"), 15), (T("გრეიფრუტი", "Grapefruit", "Грейпфрут"), 25),
        (T("მწვანე ვაშლი", "Green apple", "Зелёное яблоко"), 20), (T("სტაფილო", "Carrot", "Морковь"), 10)]},
    {"key": "lemonade", "title": T("სახლური ლიმონათი", "Homemade lemonade", "Домашний лимонад"),
     "unit": T("ჭიქა 12–15 ₾ · ბოთლი 30 ₾", "Glass 12–15 ₾ · Bottle 30 ₾", "Бокал 12–15 ₾ · Бутылка 30 ₾"), "items": [
        (T("ტროპიკული ლიმონათი", "Tropical lemonade", "Тропический лимонад"), 12),
        (T("ციტრუსის ლიმონათი", "Citrus lemonade", "Цитрусовый лимонад"), 12),
        (T("შავი მოცხარის ლიმონათი", "Blackcurrant lemonade", "Лимонад из чёрной смородины"), 15),
        (T("სეზონური ხილის ლიმონათი", "Seasonal fruit lemonade", "Лимонад из сезонных фруктов"), 15)]},
    {"key": "beer", "title": T("ლუდი", "Beer", "Пиво"), "unit": None, "items": [
        (T("ჩამოსასხმელი ესტრელა (0.4ლ)", "Estrella draught (0.4L)", "Estrella разливное (0,4 л)"), 18),
        (T("ჩამოსასხმელი შავი ლომი (0.4ლ)", "Black Lion draught (0.4L)", "Black Lion разливное (0,4 л)"), 15),
        (T("შავი ლომი იპა/აპა 0.5ლ", "Black Lion IPA/APA 0.5L", "Black Lion IPA/APA 0,5 л"), 16),
        (T("ჰეინეკენი 0.33ლ", "Heineken 0.33L", "Heineken 0,33 л"), 14)]},
    {"key": "vermouth", "title": T("ვერმუტი", "Vermouth", "Вермут"), "unit": T("100 გრ", "100 g", "100 г"), "items": [
        (T("მარტინი ბიანკო", "Martini Bianco"), 15), (T("მარტინი როსო", "Martini Rosso"), 15),
        (T("მარტინი ექსტრა დრაი", "Martini Extra Dry"), 15), (T("კამპარი ბიტერია 50მლ", "Campari bitteria 50ml", "Campari bitteria 50 мл"), 15)]},
    {"key": "gin", "title": T("ჯინი", "Gin", "Джин"), "unit": T("50 გრ", "50 g", "50 г"), "items": [
        (T("თენქერეი ლ.დ.", "Tanqueray London Dry"), 15), (T("თენქერეი თენ", "Tanqueray No. Ten"), 19),
        (T("ჰენდრიქსი", "Hendrick’s"), 20), (T("მანქი 47", "Monkey 47"), 22)]},
    {"key": "tequila", "title": T("ტეკილა", "Tequila", "Текила"), "unit": T("50 გრ", "50 g", "50 г"), "items": [
        (T("აზული რეპოსადო", "Azul Reposado"), 135), (T("აზული პლატინიუმი", "Azul Platinum"), 110),
        (T("ხოსე კუერო გოლდი", "Jose Cuervo Gold"), 16), (T("ხოსე კუერო ბლანკო", "Jose Cuervo Blanco"), 14),
        (T("ოლმეკა გოლდი", "Olmeca Gold"), 16), (T("ოლმეკა ბლანკო", "Olmeca Blanco"), 14)]},
    {"key": "rum", "title": T("რომი", "Rum", "Ром"), "unit": T("50 გრ", "50 g", "50 г"), "items": [
        (T("კაპიტან მორგანი თეთრი", "Captain Morgan White"), 14), (T("კაპიტან მორგანი შავი", "Captain Morgan Black"), 15),
        (T("კაპიტან მორგანი გოლდი", "Captain Morgan Gold"), 16), (T("ბაკარდი თეთრი", "Bacardi Carta Blanca"), 15),
        (T("ბაკარდი შავი", "Bacardi Carta Negra"), 16)]},
    {"key": "liqueur", "title": T("ლიქიორი", "Liqueur", "Ликёр"), "unit": T("50 გრ", "50 g", "50 г"), "items": [
        (T("ამარეტო დისარონო", "Amaretto Disaronno"), 15), (T("იაგერმაისტერი", "Jägermeister"), 14),
        (T("მალიბუ", "Malibu"), 14), (T("კვანტრო", "Cointreau"), 14), (T("კალუა", "Kahlúa"), 14), (T("ბეილისი", "Baileys"), 15)]},
    {"key": "whisky", "title": T("ვისკი / ბურბონი", "Whisky / bourbon", "Виски / бурбон"), "unit": T("50 გრ", "50 g", "50 г"), "items": [
        (T("მაკალანი 12 წ.", "The Macallan 12 y.o.", "The Macallan 12 лет"), 52),
        (T("ჩივას რეგალი 12 წ.", "Chivas Regal 12 y.o.", "Chivas Regal 12 лет"), 17),
        (T("ჩივას რეგალი 18 წ.", "Chivas Regal 18 y.o.", "Chivas Regal 18 лет"), 48),
        (T("გლენფიდიჩი 12 წ.", "Glenfiddich 12 y.o.", "Glenfiddich 12 лет"), 32),
        (T("გლენფიდიჩი 15 წ.", "Glenfiddich 15 y.o.", "Glenfiddich 15 лет"), 49),
        (T("გლენმორანჟი ნექტარი", "Glenmorangie Nectar d’Or"), 51), (T("გლენმორანჟი ორიგინალი", "Glenmorangie Original"), 28),
        (T("მანქი შოლდერი", "Monkey Shoulder"), 19), (T("მანქი შოლდერი სმოუქი", "Monkey Shoulder Smokey"), 33),
        (T("ჯონი ვოლქერი გოლდ რეზერვი", "Johnnie Walker Gold Reserve"), 55), (T("ჯონი ვოლქერი შავი", "Johnnie Walker Black"), 18),
        (T("ჯონი ვოლქერი წითელი", "Johnnie Walker Red"), 14), (T("ჯეიმსონი", "Jameson"), 17),
        (T("ჯეკ დენიელსი", "Jack Daniel’s"), 15), (T("ჯეკ დენიელსი თაფლი", "Jack Daniel’s Honey"), 23),
        (T("ბულეტ რაი", "Bulleit Rye"), 31), (T("მეიქერს მარკი", "Maker’s Mark"), 33)]},
    {"key": "chacha", "title": T("ჭაჭა / არაყი", "Chacha / vodka", "Чача / водка"), "unit": T("50 გრ", "50 g", "50 г"), "items": [
        (T("შატო მუხრანის ჭაჭა", "Château Mukhrani chacha", "Чача Château Mukhrani"), 25),
        (T("ქართული ლეგენდა", "Georgian Legend"), 12),
        (T("მუხის ჭაჭა | ქართული ლეგენდა", "Aged in oak chacha | Georgian Legend", "Чача из дуба | Georgian Legend"), 15),
        (T("ჭაჭა ჭური ჩინებული", "Qvevri Chinebuli chacha", "Чача Qvevri Chinebuli"), 16),
        (T("ჭაჭა ჭური ჩინებული OAK", "Qvevri Chinebuli OAK chacha", "Чача Qvevri Chinebuli OAK"), 17),
        (T("გრეი გუსი", "Grey Goose"), 27), (T("ბელუგა", "Beluga"), 25), (T("აბსოლუტი", "Absolut"), 17), (T("ფინლანდია", "Finlandia"), 15)]},
    {"key": "brandy", "title": T("ბრენდი / კონიაკი", "Brandy / cognac", "Бренди / коньяк"), "unit": T("50 გრ", "50 g", "50 г"), "items": [
        (T("სარაჯიშვილი X.O.", "Sarajishvili X.O."), 47), (T("სარაჯიშვილი V.S.O.P.", "Sarajishvili V.S.O.P."), 18),
        (T("სარაჯიშვილი V.S.", "Sarajishvili V.S."), 16), (T("სარაჯიშვილი 5★", "Sarajishvili 5★"), 14),
        (T("ჰენესი X.O.", "Hennessy X.O."), 185), (T("ჰენესი V.S.O.P.", "Hennessy V.S.O.P."), 58), (T("ჰენესი V.S.", "Hennessy V.S."), 45),
        (T("რემი მარტინი X.O.", "Rémy Martin X.O."), 175), (T("რემი მარტინი V.S.O.P.", "Rémy Martin V.S.O.P."), 55)]},
    {"key": "coffee", "title": T("ყავა / ჩაი", "Coffee / tea", "Кофе / чай"), "unit": None, "items": [
        (T("ესპრესო", "Espresso", "Эспрессо"), 7), (T("ორმაგი ესპრესო", "Double espresso", "Двойной эспрессо"), 11),
        (T("ესპრესო მაკიატო", "Espresso macchiato", "Эспрессо макиато"), 7), (T("ამერიკანო", "Americano", "Американо"), 8),
        (T("კაპუჩინო", "Cappuccino", "Капучино"), 10),
        (T("კაპუჩინო ნუშის / შვრიის რძით", "Cappuccino with almond / oat milk", "Капучино на миндальном / овсяном молоке"), 11),
        (T("ფლეთ ვაითი", "Flat white", "Флэт уайт"), 12), (T("ლატე მაკიატო", "Latte macchiato", "Латте макиато"), 11),
        (T("ლატე", "Latte", "Латте"), 13),
        (T("ლატე ნუშის / შვრიის რძით", "Latte with almond / oat milk", "Латте на миндальном / овсяном молоке"), 13),
        (T("ცივი ყავა", "Iced coffee", "Холодный кофе"), 13), (T("ცივი ყავა ნაყინით", "Iced coffee with ice cream", "Холодный кофе с мороженым"), 15),
        (T("თურქული ყავა", "Turkish coffee", "Кофе по-турецки"), 7), (T("თურქული ყავა ორმაგი", "Double Turkish coffee", "Двойной кофе по-турецки"), 11),
        (T("ცხელი შოკოლადი", "Hot chocolate", "Горячий шоколад"), 10),
        (T("დასაყენებელი ჩაი — მაყვალი / მწვანე / ერლ გრეი / ჟასმინი / ხილი", "Brewed tea — blackberry / green / Earl Grey / jasmine / fruit", "Заварной чай — ежевика / зелёный / Earl Grey / жасмин / фруктовый"), 9),
        (T("ერთჯერადი ჩაი — მაყვალი / მწვანე / ხილი", "Tea bag — blackberry / green / fruit", "Чай в пакетике — ежевика / зелёный / фруктовый"), 5),
        (T("ცივი ჩაი", "Iced tea", "Холодный чай"), 8)]},
]
for s in bar:
    s["items"] = [{"name": n, "price": p} for n, p in s["items"]]

sasperia_art = {
    "name": T("სპეციალური კაპუჩინო", "Signature cappuccino", "Фирменный капучино"),
    "price": 12,
    "desc": T("კაპუჩინოს ქაფზე საკვები პრინტერით დაიტანება სასპერიას ლოგო ან თქვენ მიერ შერჩეული ფოტო — პატარა პერსონალური ნამუშევარი, რომელიც ფინჯანთან ერთად იქმნება.",
              "We print the Sasperia logo or a photo you choose in edible ink on the cappuccino foam — a small, personal artwork made with your cup.",
              "На пенке капучино съедобными чернилами печатается логотип Sasperia или выбранное вами фото — маленькая личная работа, созданная вместе с вашей чашкой."),
}

# ---- Cocktails (sasperia.ge/coctails, published in English only) ----
cocktails = [
    ("signature", "Sasperia Sour", 35, "Gin, Cointreau, lime juice, Blue Curaçao, foam or egg white", "Джин, Cointreau, сок лайма, Blue Curaçao, пена или яичный белок", "017A3112"),
    ("signature", "Pink Vanilla Colada", 35, "Malibu, white rum, vanilla ice cream, pineapple juice, grenadine", "Malibu, белый ром, ванильное мороженое, ананасовый сок, гренадин", "017A3080"),
    ("signature", "Sasperia Sunset", 35, "Tequila Blanco, orange juice, passion fruit syrup, grenadine", "Tequila Blanco, апельсиновый сок, сироп маракуйи, гренадин", "017A3146"),
    ("signature", "Smoked Apple", 35, "Bourbon, apple juice, honey, lime, Angostura", "Бурбон, яблочный сок, мёд, лайм, Angostura", "017A3163"),
    ("signature", "Signature Saspresso", 35, "Kahlúa, bourbon, Amaretto Disaronno, Baileys, Malibu", "Kahlúa, бурбон, Amaretto Disaronno, Baileys, Malibu", "017A3023"),
    ("signature", "Rose Garden", 35, "Gin, watermelon purée, raspberry syrup, almond syrup", "Джин, арбузное пюре, малиновый сироп, миндальный сироп", "017A3095"),
    ("classic", "Tropical Mai Tai", 30, "Dark rum, white rum, Disaronno, pineapple, lemon juice", "Тёмный ром, белый ром, Disaronno, ананас, лимонный сок", None),
    ("classic", "Negroni", 30, "Campari, Martini Rosso, gin, orange peel", "Campari, Martini Rosso, джин, апельсиновая цедра", None),
    ("classic", "Margarita", 30, "Tequila, Cointreau, fresh lime juice, sugar syrup", "Текила, Cointreau, свежий сок лайма, сахарный сироп", None),
    ("classic", "Whiskey Sour", 30, "Whiskey, lemon juice, egg-white substitute, sugar syrup", "Виски, лимонный сок, заменитель яичного белка, сахарный сироп", None),
    ("classic", "Aperol Spritz", 30, "Aperol, sparkling wine, Schweppes, orange slice", "Aperol, игристое вино, Schweppes, долька апельсина", None),
    ("classic", "Espresso Martini", 30, "Vodka, Kahlúa, sugar syrup, espresso", "Водка, Kahlúa, сахарный сироп, эспрессо", None),
]
# Photos from the cocktail page are shown as atmosphere, not as a claim about which drink they are.
cocktails = [{"kind": k, "name": n, "price": p, "desc": {"en": d, "ka": d, "ru": r}} for k, n, p, d, r, _ in cocktails]

# ---- Wine (sasperia.ge/wine) ----
REG = {"KARTLI": ("ქართლი", "Картли"), "KAKHETI": ("კახეთი", "Кахетия"), "IMERETI": ("იმერეთი", "Имеретия"),
       "RACHA": ("რაჭა", "Рача"), "LECHKHUMI": ("ლეჩხუმი", "Лечхуми")}
PROD = {"Georgian Legend": "ქართული ლეგენდა", "Sasperia": "სასპერია", "Zedasheli": "ზედაშელი", "Shumi": "შუმი",
        "Anemo": "ანემო", "Peradze Winery": "მეღვინეობა ფერაძე"}
def gw(ka, en, ru, region, prod, bottle, glass=None):
    r = REG.get(region)
    return {"name": T(ka, en, ru), "region": T(r[0], region.title(), r[1]) if r else None,
            "producer": T(PROD[prod], prod), "bottle": bottle, "glass": glass}

georgian_wine = [
    {"key": "sparkling", "title": T("ცქრიალა ღვინო", "Sparkling wine", "Игристое вино"), "items": [
        gw("პრიმოსეკო ბრუტი თეთრი", "Primosecco Brut White", "Primosecco брют белое", None, "Georgian Legend", 52, 17),
        gw("პრიმოსეკო ბრუტი როზე", "Primosecco Brut Rosé", "Primosecco брют розе", None, "Georgian Legend", 62),
        gw("პრიმოსეკო ნახევრად ტკბილი თეთრი", "Primosecco White Semi-Sweet", "Primosecco белое полусладкое", None, "Georgian Legend", 63, 21)]},
    {"key": "white", "title": T("თეთრი", "White", "Белое"), "items": [
        gw("ჩინური", "Chinuri", "Чинури", "KARTLI", "Sasperia", 52, 17),
        gw("გორული მწვანე", "Goruli Mtsvane", "Горули мцване", "KARTLI", "Sasperia", 57, 19),
        gw("მუსკატი", "Muscat", "Мускат", "KARTLI", "Sasperia", 55, 18),
        gw("ქისი", "Kisi", "Киси", "KARTLI", "Zedasheli", 78),
        gw("წინანდალი", "Tsinandali", "Цинандали", "KAKHETI", "Shumi", 51, 18),
        gw("რქაწითელი", "Rkatsiteli", "Ркацители", "KAKHETI", "Anemo", 69, 23),
        gw("ხიხვი", "Khikhvi", "Хихви", "KARTLI", "Zedasheli", 75),
        gw("კრახუნა", "Krakhuna", "Крахуна", "IMERETI", "Peradze Winery", 90)]},
    {"key": "amber", "title": T("ქარვისფერი", "Amber", "Янтарное"), "items": [
        gw("ქისი", "Kisi", "Киси", "KARTLI", "Sasperia", 55, 18),
        gw("გორული მწვანე", "Goruli Mtsvane", "Горули мцване", "KARTLI", "Zedasheli", 81),
        gw("რქაწითელი-მწვანე", "Rkatsiteli-Mtsvane", "Ркацители-мцване", "KAKHETI", "Anemo", 65, 21),
        gw("ხიხვი", "Khikhvi", "Хихви", "KARTLI", "Zedasheli", 75),
        gw("ცოლიკოური", "Tsolikouri", "Цоликоури", "IMERETI", "Peradze Winery", 90)]},
    {"key": "rose", "title": T("ვარდისფერი", "Rosé", "Розовое"), "items": [
        gw("ვარდისფერი", "Rosé", "Розовое", "KARTLI", "Zedasheli", 84),
        gw("საფერავი როზე, ნახევრად მშრალი", "Saperavi Rosé, semi-dry", "Саперави розе, полусухое", "KAKHETI", "Shumi", 50, 17)]},
    {"key": "red", "title": T("წითელი", "Red", "Красное"), "items": [
        gw("მუკუზანი", "Mukuzani", "Мукузани", "KAKHETI", "Shumi", 60, 20),
        gw("საფერავი", "Saperavi", "Саперави", "KAKHETI", "Anemo", 65, 22),
        gw("ალექსანდროული-მუჯუირეთული", "Aleksandrouli-Mujuretuli", "Александроули-муджуретули", "RACHA", "Anemo", 83),
        gw("თავკვერი", "Tavkveri", "Тавквери", "KARTLI", "Peradze Winery", 98),
        gw("შავკაპიტო", "Shavkapito", "Шавкапито", "KARTLI", "Peradze Winery", 105)]},
    {"key": "semisweet", "title": T("ნახევრად ტკბილი", "Semi-sweet", "Полусладкое"), "items": [
        gw("ქინძმარაული", "Kindzmarauli", "Киндзмараули", "KAKHETI", "Shumi", 55, 18),
        gw("ტვიში", "Tvishi", "Твиши", "LECHKHUMI", "Anemo", 68, 23),
        gw("ხვანჭკარა", "Khvanchkara", "Хванчкара", "RACHA", "Anemo", 95),
        gw("ქისი, ნახევრად მშრალი", "Kisi, semi-dry", "Киси, полусухое", "KAKHETI", "Peradze Winery", 98)]},
]

def ww(ka, en, prod, bottle):
    return {"name": T(ka, en), "region": None, "producer": T(prod, prod) if prod else None, "bottle": bottle, "glass": None}
world_wine = [
    {"key": "champagne", "title": T("შამპანიური", "Champagne", "Шампанское"), "items": [
        ww("საირუს ვარდისფერი შამპანი, საფრანგეთი", "Cyrus Rosé Champagne, France", None, 185),
        ww("საირუს მილეზიმი 2015 შამპანი, საფრანგეთი", "Cyrus Millésime 2015 Champagne, France", None, 220),
        ww("საირუს თეთრის თეთრი შამპანი, საფრანგეთი", "Cyrus Blanc de Blanc Champagne, France", None, 225),
        ww("მოეტ შანდონ რეზერვ იმპერიალი შამპანი, საფრანგეთი", "Moët & Chandon Réserve Impérial Champagne, France", None, 327)]},
    {"key": "w-white", "title": T("თეთრი", "White", "Белое"), "items": [
        ww("შარდონე, პეი დ’ოკ, საფრანგეთი", "Chardonnay, Pays d’Oc, France", "Château de Pennautier", 81),
        ww("როკ-ეპინ ლირაკ ბლან, რონის ველი, საფრანგეთი", "Roc-Épine Lirac Blanc, Rhône Valley, France", "Domaine Lafond", 82),
        ww("კიმერიდ პუი ფუმე, ლუარის ველი, საფრანგეთი", "Kiméride Pouilly-Fumé, Loire Valley, France", "Jean Pabiot et Fils", 151),
        ww("კონდრიე, ჩრდილოეთ რონი, საფრანგეთი", "Condrieu, Northern Rhône, France", "Pierre Gaillard", 245)]},
    {"key": "w-rose", "title": T("როზე", "Rosé", "Розе"), "items": [
        ww("ლა შაპელ, კოტო ვარუა ან პროვანსი, საფრანგეთი", "La Chapelle, Coteaux Varois en Provence, France", "Domaine La Gayolle", 63),
        ww("ემ დე მინუტი, კოტ დე პროვანსი, საფრანგეთი", "M de Minuty, Côtes de Provence, France", "Château Minuty", 111)]},
    {"key": "w-red", "title": T("წითელი", "Red", "Красное"), "items": [
        ww("სირა, პეი დ’ოკ, საფრანგეთი", "Syrah, Pays d’Oc, France", "Les Découvertes", 61),
        ww("მერლო, პეი დ’ოკ, საფრანგეთი", "Merlot, Pays d’Oc, France", "Les Découvertes", 63),
        ww("მონტეპულჩანო დ’აბრუცო, იტალია", "Montepulciano d’Abruzzo, Italy", "Colimoro", 74),
        ww("პინო ნუარი, რეზერვი, ელზასი, საფრანგეთი", "Pinot Noir Réserve, Alsace, France", "Frey-Sohler", 84),
        ww("ტრადისიონ კაორი 2019, კაორი, საფრანგეთი", "Tradition Cahors 2019, Cahors, France", "Château La Coustarelle", 107),
        ww("ლ’ეტუალი, ბორდო სუპერიორი, საფრანგეთი", "L’Étoile, Bordeaux Supérieur, France", "Château Baron", 215),
        ww("შატო ბერნესი მაგნუმი 1.5ლ, 2019, ბორდო, საფრანგეთი", "Château Bernès Magnum 1.5L, 2019, Bordeaux, France", None, 658),
        ww("შატო პონტე-კანე 2017, გრან კრუ კლასე 1855, პოიაკი, ბორდო", "Château Pontet-Canet 2017, Grand Cru Classé 1855, Pauillac, Bordeaux, France", None, 658)]},
]

data = {
    "source": "sasperia.ge — captured 2026-10-29",
    "food": food, "bar": bar, "sasperiaArt": sasperia_art, "cocktails": cocktails,
    "wine": {"georgian": georgian_wine, "world": world_wine},
}
out = os.path.join(ROOT, "js/data.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("/* Generated by tools/build_data.py from sasperia.ge content. Do not edit by hand. */\n")
    f.write("window.SASPERIA_DATA = ")
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
n = sum(len(c["items"]) for c in food)
print("dishes", n, "with photo", sum(1 for c in food for i in c["items"] if i["img"]), "->", out, os.path.getsize(out))
