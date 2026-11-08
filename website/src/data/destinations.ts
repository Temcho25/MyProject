import type { Localized } from "@/i18n/locales";

/** Home-page destination tiles. `article` links each tile to its blog guide. */
export const destinations: { key: string; photo: string; name: Localized; line: Localized; article: string; size: "lg" | "md" | "sm" }[] = [
  {
    key: "zhangjiajie",
    photo: "avatar-mountains",
    name: { ru: "Чжанцзяцзе", en: "Zhangjiajie", ka: "ჟანძიაძიე" },
    line: { ru: "Горы Аватара", en: "The Avatar mountains", ka: "ავატარის მთები" },
    article: "zhangjiajie-avatar-mountains-guide",
    size: "lg",
  },
  {
    key: "harbin",
    photo: "harbin-ice-festival",
    name: { ru: "Харбин", en: "Harbin", ka: "ხარბინი" },
    line: { ru: "Ледовый фестиваль", en: "Ice & Snow Festival", ka: "ყინულის ფესტივალი" },
    article: "harbin-ice-festival-guide",
    size: "md",
  },
  {
    key: "beijing",
    photo: "great-wall",
    name: { ru: "Пекин", en: "Beijing", ka: "პეკინი" },
    line: { ru: "Великая стена и Запретный город", en: "Great Wall & Forbidden City", ka: "დიდი კედელი და აკრძალული ქალაქი" },
    article: "beijing-great-wall-forbidden-city-guide",
    size: "md",
  },
  {
    key: "guilin",
    photo: "li-river",
    name: { ru: "Гуйлинь и Яншо", en: "Guilin & Yangshuo", ka: "გუილინი და იანშუო" },
    line: { ru: "Река Ли и карстовые горы", en: "Li River & karst peaks", ka: "მდინარე ლი და კარსტული მთები" },
    article: "guilin-yangshuo-li-river-guide",
    size: "lg",
  },
  {
    key: "xian",
    photo: "terracotta-army",
    name: { ru: "Сиань", en: "Xi'an", ka: "სიანი" },
    line: { ru: "Терракотовая армия", en: "The Terracotta Army", ka: "ტერაკოტას არმია" },
    article: "xian-terracotta-army-guide",
    size: "sm",
  },
  {
    key: "chengdu",
    photo: "chengdu-panda",
    name: { ru: "Чэнду", en: "Chengdu", ka: "ჩენდუ" },
    line: { ru: "Большие панды", en: "Giant pandas", ka: "დიდი პანდები" },
    article: "chengdu-pandas-guide",
    size: "sm",
  },
  {
    key: "chongqing",
    photo: "chongqing-hongyadong",
    name: { ru: "Чунцин", en: "Chongqing", ka: "ჩუნცინი" },
    line: { ru: "Город на холмах", en: "The mountain megacity", ka: "ქალაქი ბორცვებზე" },
    article: "chongqing-travel-guide",
    size: "sm",
  },
];

/** Words for the kinetic marquee band. */
export const marqueeWords: Localized<string[]> = {
  ru: ["Чжанцзяцзе", "Харбин", "Пекин", "Сиань", "Гуйлинь", "Яншо", "Чэнду", "Чунцин", "Шаолинь", "Лоян", "Чанша"],
  en: ["Zhangjiajie", "Harbin", "Beijing", "Xi'an", "Guilin", "Yangshuo", "Chengdu", "Chongqing", "Shaolin", "Luoyang", "Changsha"],
  ka: ["ჟანძიაძიე", "ხარბინი", "პეკინი", "სიანი", "გუილინი", "იანშუო", "ჩენდუ", "ჩუნცინი", "შაოლინი", "ლოიანი", "ჩანშა"],
};
