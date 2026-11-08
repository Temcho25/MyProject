import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Locale, Localized } from "@/i18n/locales";

export type Photo = {
  key: string;
  file: string;
  width: number;
  height: number;
  category: string;
  place: string;
  alt: Localized;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
  focal?: "center" | "top" | "bottom";
};

/**
 * Real photos come from src/data/photo-manifest.json.
 * Until it exists, branded placeholders (photo-manifest.placeholder.json) keep the site viewable.
 */
function loadManifest(): Photo[] {
  const dir = path.join(process.cwd(), "src", "data");
  const real = path.join(dir, "photo-manifest.json");
  const file = fs.existsSync(real) ? real : path.join(dir, "photo-manifest.placeholder.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as Photo[];
}

export const photos = loadManifest();
const byKey = new Map(photos.map((p) => [p.key, p]));

/** Fallback order when a key is missing (so a typo never breaks a page). */
const FALLBACK = ["zhangjiajie-pillars", "li-river", "great-wall"];

export function getPhoto(key: string | undefined): Photo {
  const found = key ? byKey.get(key) : undefined;
  if (found) return found;
  for (const k of FALLBACK) {
    const f = byKey.get(k);
    if (f) return f;
  }
  return photos[0];
}

export const hasPhoto = (key: string) => byKey.has(key);

export const photoAlt = (p: Photo, locale: Locale) => p.alt[locale] || p.alt.en || p.place;

export const objectPosition = (p: Photo) =>
  p.focal === "top" ? "center 25%" : p.focal === "bottom" ? "center 75%" : "center";
