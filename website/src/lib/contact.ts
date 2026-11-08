import { site } from "@/config/site";
import { whatsappLink } from "./whatsapp";

/** Instagram direct-message link derived from the profile URL (ig.me/m/<user>). */
export function instagramDm(): string {
  const m = site.social.instagram.match(/instagram\.com\/([^/?#]+)/i);
  return m ? `https://ig.me/m/${m[1]}` : site.social.instagram;
}

/** Best "message us" link: WhatsApp when configured, otherwise Instagram DM. */
export function primaryChat(message?: string): { kind: "whatsapp" | "instagram"; url: string } {
  const wa = whatsappLink(message);
  return wa ? { kind: "whatsapp", url: wa } : { kind: "instagram", url: instagramDm() };
}
