import type { Locale } from "./locales";
import ru, { type Dictionary } from "./dictionaries/ru";
import en from "./dictionaries/en";
import ka from "./dictionaries/ka";

const dictionaries: Record<Locale, Dictionary> = { ru, en, ka };

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];
export type { Dictionary };
