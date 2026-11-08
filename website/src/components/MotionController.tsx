"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * One lightweight controller for the whole site (no animation library):
 *  - .reveal / .wipe elements get .is-in when they enter the viewport
 *  - .hero gets --sy (scroll progress), --mx/--my (pointer) and --vel (scroll speed)
 *  - [data-parallax] elements get --p (-1…1 through the viewport)
 *  - delegated click tracking for WhatsApp / phone / email / social / data-track
 * Everything is skipped for users who prefer reduced motion.
 */
export default function MotionController() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.remove("no-js");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const targets = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .wipe, [data-inview]"));
    let io: IntersectionObserver | null = null;
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io?.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );
      targets.forEach((el) => io!.observe(el));
    }
    if (reduce) return () => io?.disconnect();

    const hero = document.querySelector<HTMLElement>(".hero");
    const parallax = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    let lastY = window.scrollY;
    let vel = 0;

    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      vel = vel * 0.8 + Math.min(1, Math.abs(y - lastY) / 60) * 0.2;
      lastY = y;
      if (hero) {
        const h = hero.offsetHeight || vh;
        hero.style.setProperty("--sy", Math.min(1, Math.max(0, y / h)).toFixed(4));
        hero.style.setProperty("--vel", vel.toFixed(3));
      }
      for (const el of parallax) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        el.style.setProperty("--p", Math.max(-1, Math.min(1, p)).toFixed(4));
      }
      if (vel > 0.01) raf = requestAnimationFrame(frame); // let blur settle back to 0
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onPointer = (e: PointerEvent) => {
      if (!hero || e.pointerType !== "mouse") return;
      hero.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      hero.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    };

    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    hero?.addEventListener("pointermove", onPointer);
    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      hero?.removeEventListener("pointermove", onPointer);
    };
  }, [pathname]);

  // Delegated conversion tracking (works for links rendered anywhere).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLElement>("a, button");
      if (!a) return;
      const custom = a.dataset.track;
      const link = a.getAttribute("href") ?? "";
      const where = a.dataset.trackLabel ?? window.location.pathname;
      if (custom) track(custom, { label: where });
      else if (link.startsWith("https://wa.me")) track("whatsapp_click", { label: where });
      else if (link.startsWith("tel:") || link.startsWith("mailto:")) track("contact_click", { method: link.split(":")[0], label: where });
      else if (/instagram\.com|ig\.me|tiktok\.com|t\.me|facebook\.com/.test(link)) track("social_click", { network: new URL(link).hostname, label: where });
      else if (link.includes("/custom-tours/")) track("custom_tour_click", { label: where });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
