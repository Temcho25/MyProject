import { socialLinks } from "@/config/site";
import { InstagramIcon, TikTokIcon, TelegramIcon, FacebookIcon } from "./Icons";

const ICONS = { instagram: InstagramIcon, tiktok: TikTokIcon, telegram: TelegramIcon, facebook: FacebookIcon } as const;
const NAMES = { instagram: "Instagram", tiktok: "TikTok", telegram: "Telegram", facebook: "Facebook" } as const;

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex gap-3 ${className}`}>
      {socialLinks().map(([key, url]) => {
        const Icon = ICONS[key];
        return (
          <li key={key}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={NAMES[key]}
              className="grid h-11 w-11 place-items-center rounded-full border border-current/25 transition-colors hover:bg-red hover:border-red hover:text-white"
            >
              <Icon />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
