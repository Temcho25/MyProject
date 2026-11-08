/** Kinetic type band: city names drift past in outline serif with red markers. */
export default function Marquee({ words, dark = true, speed = "52s" }: { words: string[]; dark?: boolean; speed?: string }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {words.map((w, i) => (
        <li key={i} className="flex items-center">
          <span className={`font-display italic text-[clamp(2.6rem,7vw,5.5rem)] leading-none px-6 md:px-10 ${i % 2 ? `outline-text ${dark ? "on-dark" : ""}` : dark ? "text-white" : "text-ink"}`}>
            {w}
          </span>
          <span className="h-3 w-3 rotate-45 bg-red" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee overflow-hidden py-8 md:py-10 ${dark ? "bg-ink" : ""}`} style={{ "--speed": speed } as React.CSSProperties}>
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
