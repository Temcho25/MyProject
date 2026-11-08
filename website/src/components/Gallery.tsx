"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryItem = {
  key: string;
  file: string;
  width: number;
  height: number;
  category: string;
  alt: string;
  place: string;
  author: string;
  license: string;
  source: string;
};

type Props = {
  items: GalleryItem[];
  categories: { id: string; label: string }[];
  labels: { all: string; prev: string; next: string; close: string; open: string; credit: string };
};

export default function Gallery({ items, categories, labels }: Props) {
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);
  const list = cat === "all" ? items : items.filter((i) => i.category === cat);

  const go = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + list.length) % list.length)), [list.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  const current = open !== null ? list[open] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter">
        {[{ id: "all", label: labels.all }, ...categories].map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={cat === c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${cat === c.id ? "border-red bg-red text-white" : "border-line bg-white hover:border-ink"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
        {list.map((p, i) => (
          <li key={p.key} className="break-inside-avoid fade-up" style={{ "--d": `${Math.min(i, 8) * 50}ms` } as React.CSSProperties}>
            <button type="button" onClick={() => setOpen(i)} className="group relative block w-full overflow-hidden rounded-[var(--radius)] text-left" aria-label={`${labels.open}: ${p.alt}`}>
              <Image
                src={p.file}
                alt={p.alt}
                width={p.width}
                height={p.height}
                sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-1000 group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {p.place}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          className="fixed inset-0 z-[70] flex flex-col bg-black/95 text-white"
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-white/70">{(open ?? 0) + 1} / {list.length}</span>
            <button type="button" onClick={() => setOpen(null)} className="grid h-11 w-11 place-items-center rounded-full border border-white/30" aria-label={labels.close} autoFocus>
              ✕
            </button>
          </div>
          <div className="relative flex-1">
            <Image key={current.key} src={current.file} alt={current.alt} fill sizes="100vw" className="object-contain fade-up" />
            <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-red" aria-label={labels.prev}>←</button>
            <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-red" aria-label={labels.next}>→</button>
          </div>
          <div className="p-4 text-center text-sm">
            <p className="font-semibold">{current.alt}</p>
            <p className="mt-1 text-white/60">
              {labels.credit}: {current.author} ·{" "}
              <a href={current.source} target="_blank" rel="noopener noreferrer" className="underline">{current.license}</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
