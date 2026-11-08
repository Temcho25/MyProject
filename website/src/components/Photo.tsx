import Image from "next/image";
import type { Locale } from "@/i18n/locales";
import { getPhoto, objectPosition, photoAlt } from "@/lib/photos";

type Props = {
  k: string;
  locale: Locale;
  sizes: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  alt?: string;
  quality?: number;
};

/** A manifest photo rendered through next/image (AVIF/WebP, responsive, no layout shift). */
export default function Photo({ k, locale, sizes, className, priority, fill = true, alt, quality }: Props) {
  const p = getPhoto(k);
  const altText = alt ?? photoAlt(p, locale);
  const common = {
    src: p.file,
    sizes,
    priority,
    quality,
    className,
    style: { objectFit: "cover" as const, objectPosition: objectPosition(p) },
  };
  return fill ? <Image {...common} alt={altText} fill /> : <Image {...common} alt={altText} width={p.width} height={p.height} />;
}
