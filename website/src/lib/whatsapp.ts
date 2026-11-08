import { site } from "@/config/site";

/** wa.me link with a prefilled message, or null when no number is configured. */
export function whatsappLink(message?: string): string | null {
  if (!site.contacts.whatsapp) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${site.contacts.whatsapp}${q}`;
}
