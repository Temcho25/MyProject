import { primaryChat } from "@/lib/contact";
import { WhatsAppIcon, InstagramIcon } from "./Icons";

/** Floating "message us" button: WhatsApp if a number is configured, else Instagram. */
export default function ChatFloat({ labels, message }: { labels: { whatsapp: string; instagram: string }; message: string }) {
  const chat = primaryChat(message);
  const isWa = chat.kind === "whatsapp";
  return (
    <a
      href={chat.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isWa ? labels.whatsapp : labels.instagram}
      data-track-label="floating-button"
      className={`fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_12px_30px_-8px_rgb(0_0_0/0.45)] transition-transform duration-500 hover:scale-110 fade-up ${
        isWa ? "bg-[#25D366]" : "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]"
      }`}
      style={{ "--d": "1600ms" } as React.CSSProperties}
    >
      {isWa ? <WhatsAppIcon className="w-7 h-7" /> : <InstagramIcon className="w-7 h-7" />}
      <span className="absolute inset-0 -z-10 rounded-full animate-ping bg-inherit opacity-20" />
    </a>
  );
}
