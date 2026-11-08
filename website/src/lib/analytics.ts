"use client";

/**
 * One call for every conversion event. Sends to whichever tools are
 * configured (GA4 via gtag, GTM via dataLayer, Meta Pixel via fbq).
 * Does nothing when no analytics IDs are set.
 *
 * Event names:
 *  view_tour, whatsapp_click, contact_click, social_click,
 *  custom_tour_click, form_start, generate_lead
 */
type Params = Record<string, string | number | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const META_EVENTS: Record<string, string> = {
  generate_lead: "Lead",
  whatsapp_click: "Contact",
  contact_click: "Contact",
  view_tour: "ViewContent",
};

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  try {
    if (window.gtag) window.gtag("event", event, params);
    else if (window.dataLayer) window.dataLayer.push({ event, ...params });
    const meta = META_EVENTS[event];
    if (window.fbq && meta) window.fbq("track", meta, params);
  } catch {
    // Analytics must never break the page.
  }
}
