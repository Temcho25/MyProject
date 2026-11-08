import { NextResponse } from "next/server";
import { isLocale } from "@/i18n/locales";
import { getTour } from "@/data/tours";

/**
 * Receives enquiries from all site forms and forwards them to every
 * configured channel (see .env.example):
 *   - Telegram bot   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 *   - Email (Resend) RESEND_API_KEY + LEAD_EMAIL_TO (+ LEAD_EMAIL_FROM)
 *   - Any webhook    LEAD_WEBHOOK_URL  (Make, Zapier, n8n, Google Sheets…)
 * With no channel configured it answers 503 {code:"not_configured"} and the
 * form offers WhatsApp / Instagram instead, so no enquiry is silently lost.
 */

const TYPES = ["tour", "custom", "contact"] as const;
const FIELD_KEYS = [
  "name", "phone", "email", "tour", "tourTitle", "people", "message", "country",
  "cities", "dates", "duration", "budget", "wishes", "contactLang",
] as const;
const LABELS: Record<string, string> = {
  name: "Имя", phone: "Телефон / WhatsApp", email: "Email", tourTitle: "Тур", people: "Человек",
  message: "Сообщение", country: "Страна", cities: "Города", dates: "Даты", duration: "Продолжительность",
  budget: "Бюджет", wishes: "Пожелания", contactLang: "Язык общения",
};
const TYPE_LABEL = { tour: "Заявка на тур", custom: "Индивидуальный тур", contact: "Сообщение с сайта" };

// Best-effort rate limit (per server instance): 5 enquiries / 10 min per IP.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

const clip = (v: unknown, max = 1000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  // Spam traps: hidden field filled, or the form submitted inhumanly fast.
  // Pretend success so bots learn nothing.
  const elapsed = Number(body.elapsed ?? 0);
  if (clip(body.company) || (Number.isFinite(elapsed) && elapsed < 2500)) {
    return NextResponse.json({ ok: true });
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });

  const type = TYPES.includes(body.type as (typeof TYPES)[number]) ? (body.type as (typeof TYPES)[number]) : "contact";
  const locale = typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "ru";
  const raw = (body.fields ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  for (const k of FIELD_KEYS) {
    const v = clip(raw[k], k === "message" || k === "wishes" ? 3000 : 300);
    if (v) fields[k] = v;
  }
  if (fields.tour) fields.tourTitle = getTour(fields.tour)?.title.ru ?? fields.tourTitle ?? fields.tour;

  if (!fields.name || !fields.phone || fields.phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 422 });
  }

  const page = clip(body.page, 300);
  const lines = Object.entries(fields)
    .filter(([k]) => k !== "tour")
    .map(([k, v]) => [LABELS[k] ?? k, v] as const);
  const lead = {
    type,
    typeLabel: TYPE_LABEL[type],
    locale,
    page,
    receivedAt: new Date().toISOString(),
    fields,
  };

  const tasks: Promise<Response>[] = [];
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, RESEND_API_KEY, LEAD_EMAIL_TO, LEAD_EMAIL_FROM, LEAD_WEBHOOK_URL } = process.env;

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const text = [
      `<b>🐼 ${esc(lead.typeLabel)}</b> · ${locale.toUpperCase()}`,
      ...lines.map(([l, v]) => `<b>${esc(l)}:</b> ${esc(v)}`),
      page ? `\n<i>${esc(page)}</i>` : "",
    ].join("\n");
    tasks.push(
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
      }),
    );
  }

  if (RESEND_API_KEY && LEAD_EMAIL_TO) {
    const html = `<h2>${esc(lead.typeLabel)} (${locale.toUpperCase()})</h2><table cellpadding="6">${lines
      .map(([l, v]) => `<tr><td><b>${esc(l)}</b></td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`)
      .join("")}</table><p style="color:#888">${esc(page)} · ${lead.receivedAt}</p>`;
    tasks.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: LEAD_EMAIL_FROM || "Insta Tour <onboarding@resend.dev>",
          to: LEAD_EMAIL_TO.split(",").map((s) => s.trim()),
          subject: `${lead.typeLabel}: ${fields.name}${fields.tourTitle ? ` — ${fields.tourTitle}` : ""}`,
          html,
          ...(fields.email ? { reply_to: fields.email } : {}),
        }),
      }),
    );
  }

  if (LEAD_WEBHOOK_URL) {
    tasks.push(
      fetch(LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      }),
    );
  }

  if (tasks.length === 0) {
    return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503 });
  }

  const results = await Promise.allSettled(tasks);
  const delivered = results.some((r) => r.status === "fulfilled" && r.value.ok);
  if (!delivered) {
    console.error("[lead] delivery failed on every channel", results.map((r) => (r.status === "fulfilled" ? r.value.status : String(r.reason))));
    return NextResponse.json({ ok: false, code: "delivery_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
