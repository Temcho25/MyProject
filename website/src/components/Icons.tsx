type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const ArrowRight = ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" className={`arrow ${className}`} {...base}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Check = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const Cross = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const Clock = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Users = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 010 6.8M18.5 14.8c1.7.8 2.8 2.5 3 5.2" /></svg>
);
export const Pin = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const Plane = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M10.5 13.5L3 11l1.5-1.5 8 1 4-4.5c1-1 2.6-1.4 3.2-.7.7.6.3 2.2-.7 3.2l-4.5 4 1 8L14 22l-2.5-7.5" /></svg>
);
export const Snow = ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5L4.9 17.5M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5" /></svg>
);
export const Menu = ({ className = "w-6 h-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M4 8h16M4 16h10" /></svg>
);
export const Train = ({ className = "w-6 h-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M6 15V7a5 5 0 015-5h2a5 5 0 015 5v8a3 3 0 01-3 3H9a3 3 0 01-3-3zM6 11h12M8.5 21l1.5-3M15.5 21L14 18" /><circle cx="9" cy="14.5" r=".6" /><circle cx="15" cy="14.5" r=".6" /></svg>
);
export const Bed = ({ className = "w-6 h-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 00-3-3h-7v5" /><circle cx="7" cy="11" r="2" /></svg>
);
export const Bowl = ({ className = "w-6 h-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M3 11h18a9 9 0 01-18 0zM8 7l1-4M12 7V3M16 7l-1-4" /></svg>
);
export const Ticket = ({ className = "w-6 h-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z" /><path d="M14 6v12" strokeDasharray="2 2" /></svg>
);
export const Guide = ({ className = "w-6 h-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M4 5h11a3 3 0 013 3v7H8l-4 4z" /><path d="M8 9.5h6M8 12.5h4" /></svg>
);
export const Shield = ({ className = "w-6 h-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const Route = ({ className = "w-6 h-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3 3 0 000-6H9a3 3 0 010-6h6.5" /></svg>
);
export const Sparkle = ({ className = "w-6 h-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></svg>
);

export const WhatsAppIcon = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.06c-.24.68-1.42 1.3-1.96 1.34-.5.05-.98.24-3.3-.69-2.8-1.1-4.56-3.95-4.7-4.13-.14-.18-1.12-1.49-1.12-2.85 0-1.35.71-2.02.96-2.29.25-.27.55-.34.73-.34l.53.01c.17.01.4-.06.62.48.24.56.8 1.94.86 2.08.07.14.12.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.12.59-.07.16-.18.68-.8.86-1.07.18-.27.36-.23.61-.14.25.09 1.6.75 1.87.89.27.14.46.2.52.32.07.11.07.66-.17 1.34z" /></svg>
);
export const InstagramIcon = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>
);
export const TikTokIcon = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M16.6 5.82A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 01-2.59 2.5 2.6 2.6 0 01-2.6-2.6 2.6 2.6 0 013.37-2.48V9.66a5.7 5.7 0 00-.77-.05A5.73 5.73 0 004.14 15.3 5.73 5.73 0 009.86 21a5.73 5.73 0 005.73-5.73V8.96a7.3 7.3 0 004.27 1.37V7.24a4.3 4.3 0 01-3.26-1.42z" /></svg>
);
export const TelegramIcon = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M21.9 4.3l-3.2 15.1c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13 1.4 11.5c-1-.3-1.1-1 .2-1.5L20.6 2.9c.9-.3 1.6.2 1.3 1.4z" /></svg>
);
export const FacebookIcon = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M14 8.5V6.8c0-.8.5-1 .9-1h2.4V2.1L14 2c-3.6 0-4.4 2.7-4.4 4.4v2.1H7.5v3.8h2.1V22H14v-9.7h3l.4-3.8z" /></svg>
);
export const Mail = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></svg>
);
export const Phone = ({ className = "w-5 h-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M5 3h3.5l1.5 4.5-2.2 1.3a12 12 0 006.4 6.4l1.3-2.2L20 14.5V18a2 2 0 01-2 2A15 15 0 013 5a2 2 0 012-2z" /></svg>
);
