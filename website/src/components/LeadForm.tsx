"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n";
import { track } from "@/lib/analytics";
import { WhatsAppIcon, InstagramIcon, Check, ArrowRight } from "./Icons";

type Variant = "tour" | "custom" | "contact";
type Fields = Record<string, string>;

type Props = {
  variant: Variant;
  locale: Locale;
  f: Dictionary["forms"];
  tours: { slug: string; title: string }[];
  defaultTour?: string;
  privacyHref: string;
  /** Digits only, "" when WhatsApp is not configured */
  whatsapp: string;
  instagramDm: string;
  submitLabel?: string;
  dark?: boolean;
};

const FIELDS: Record<Variant, string[]> = {
  tour: ["name", "phone", "tour", "people", "message"],
  custom: ["name", "country", "phone", "people", "cities", "dates", "duration", "budget", "contactLang", "wishes"],
  contact: ["name", "phone", "email", "message"],
};

const REQUIRED = ["name", "phone"];

export default function LeadForm({ variant, locale, f, tours, defaultTour, privacyHref, whatsapp, instagramDm, submitLabel, dark }: Props) {
  const storageKey = `insta-tour:lead:${variant}`;
  const initial = useMemo<Fields>(() => {
    const base: Fields = Object.fromEntries(FIELDS[variant].map((k) => [k, ""]));
    if (variant === "tour") base.tour = defaultTour ?? "";
    if (variant === "tour" || variant === "custom") base.people = "2";
    if (variant === "custom") base.contactLang = locale;
    return base;
  }, [variant, defaultTour, locale]);

  const [values, setValues] = useState<Fields>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error" | "fallback">("idle");
  const [copied, setCopied] = useState(false);
  const [hp, setHp] = useState("");
  const startedAt = useRef(Date.now());
  const started = useRef(false);

  // Restore a saved draft (never lose what the visitor typed).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as Fields | null;
      if (saved) setValues((v) => ({ ...v, ...saved, ...(variant === "tour" && defaultTour ? { tour: defaultTour } : {}) }));
    } catch {
      /* storage unavailable */
    }
  }, [storageKey, variant, defaultTour]);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
      } catch {
        /* storage unavailable */
      }
    }, 300);
    return () => clearTimeout(id);
  }, [values, storageKey]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: "" }));
  };
  const onFocus = () => {
    if (!started.current) {
      started.current = true;
      track("form_start", { form: variant });
    }
  };

  const tourTitle = tours.find((t) => t.slug === values.tour)?.title;
  const typeLabel = variant === "tour" ? f.leadTypeTour : variant === "custom" ? f.leadTypeCustom : f.leadTypeContact;

  const labelOf = (k: string): string =>
    ({
      name: f.name, phone: f.phone, email: f.email, tour: f.tour, people: f.people, message: f.message,
      country: f.country, cities: f.cities, dates: f.dates, duration: f.duration, budget: f.budget,
      wishes: f.wishes, contactLang: f.contactLang,
    })[k] ?? k;

  const messageText = () => {
    const lines = [`Insta Tour — ${typeLabel}`];
    for (const k of FIELDS[variant]) {
      let v = values[k]?.trim();
      if (!v) continue;
      if (k === "tour") v = tourTitle ?? f.tourAny;
      if (k === "contactLang") v = f.langs[v as Locale] ?? v;
      lines.push(`${labelOf(k)}: ${v}`);
    }
    return lines.join("\n");
  };

  const validate = () => {
    const er: Record<string, string> = {};
    for (const k of REQUIRED) if (!values[k]?.trim()) er[k] = f.required;
    if (values.phone?.trim() && values.phone.replace(/\D/g, "").length < 7) er.phone = f.invalidPhone;
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      const first = document.querySelector<HTMLElement>(`#${variant}-form [data-invalid="true"] input, #${variant}-form [data-invalid="true"] textarea`);
      first?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: variant,
          locale,
          page: window.location.pathname,
          fields: { ...values, tour: variant === "tour" ? values.tour : undefined, tourTitle },
          company: hp, // honeypot
          elapsed: Date.now() - startedAt.current,
        }),
      });
      if (res.ok) {
        setStatus("success");
        track("generate_lead", { form: variant, tour: values.tour || undefined });
        try {
          localStorage.removeItem(storageKey);
        } catch {}
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { code?: string };
      setStatus(data.code === "not_configured" ? "fallback" : "error");
    } catch {
      setStatus("error");
    }
  };

  const waUrl = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(messageText())}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(messageText());
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {}
  };

  if (status === "success") {
    return (
      <div className={`rounded-[var(--radius)] p-8 text-center ${dark ? "bg-white/5" : "bg-white border border-line"}`} role="status" aria-live="polite">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red text-white"><Check className="w-8 h-8" /></div>
        <h3 className="font-display text-3xl mt-5">{f.successTitle}</h3>
        <p className={`mt-3 ${dark ? "text-white/75" : "text-muted"}`}>{f.successText}</p>
        <button type="button" className="mt-6 underline underline-offset-4" onClick={() => { setValues(initial); setStatus("idle"); }}>
          {f.again}
        </button>
      </div>
    );
  }

  const field = (k: string, el: React.ReactNode, wide = false) => (
    <div className={`field ${wide ? "sm:col-span-2" : ""}`} data-invalid={Boolean(errors[k])}>
      <label htmlFor={`${variant}-${k}`}>
        {labelOf(k)}
        {REQUIRED.includes(k) && <span className="text-red"> *</span>}
      </label>
      {el}
      {errors[k] && <p className="err" id={`${variant}-${k}-err`}>{errors[k]}</p>}
    </div>
  );
  const input = (k: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      id={`${variant}-${k}`}
      name={k}
      value={values[k] ?? ""}
      onChange={set(k)}
      onFocus={onFocus}
      aria-invalid={Boolean(errors[k])}
      aria-describedby={errors[k] ? `${variant}-${k}-err` : undefined}
      {...props}
    />
  );
  const textarea = (k: string, ph: string) => (
    <textarea id={`${variant}-${k}`} name={k} value={values[k] ?? ""} onChange={set(k)} onFocus={onFocus} placeholder={ph} rows={4} />
  );

  return (
    <form id={`${variant}-form`} onSubmit={onSubmit} noValidate className={`relative grid gap-5 sm:grid-cols-2 ${dark ? "[&_.field_label]:!text-white" : ""}`}>
      {field("name", input("name", { autoComplete: "name", placeholder: f.namePh, required: true }))}
      {variant === "custom" && field("country", input("country", { autoComplete: "country-name", placeholder: f.countryPh }))}
      {field("phone", input("phone", { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: f.phonePh, required: true }))}
      {variant === "contact" && field("email", input("email", { type: "email", autoComplete: "email", inputMode: "email" }))}
      {variant === "tour" &&
        field(
          "tour",
          <select id="tour-tour" name="tour" value={values.tour} onChange={set("tour")} onFocus={onFocus}>
            <option value="">{f.tourAny}</option>
            {tours.map((t) => (
              <option key={t.slug} value={t.slug}>{t.title}</option>
            ))}
          </select>,
        )}
      {(variant === "tour" || variant === "custom") && field("people", input("people", { type: "number", min: 1, max: 50, inputMode: "numeric" }))}
      {variant === "custom" && (
        <>
          {field("cities", input("cities", { placeholder: f.citiesPh }), true)}
          {field("dates", input("dates", { placeholder: f.datesPh }))}
          {field("duration", input("duration", { placeholder: f.durationPh }))}
          {field("budget", input("budget", { placeholder: f.budgetPh }))}
          {field(
            "contactLang",
            <select id="custom-contactLang" name="contactLang" value={values.contactLang} onChange={set("contactLang")} onFocus={onFocus}>
              {(Object.keys(f.langs) as Locale[]).map((l) => (
                <option key={l} value={l}>{f.langs[l]}</option>
              ))}
            </select>,
          )}
          {field("wishes", textarea("wishes", f.wishesPh), true)}
        </>
      )}
      {(variant === "tour" || variant === "contact") && field("message", textarea("message", f.messagePh), true)}

      {/* Honeypot: hidden from people, tempting for bots */}
      <div className="hp" aria-hidden>
        <label htmlFor={`${variant}-company`}>Company</label>
        <input id={`${variant}-company`} name="company" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>

      <div className="sm:col-span-2 flex flex-col gap-4">
        <button type="submit" className="btn btn-red w-full sm:w-auto sm:self-start" disabled={status === "sending"} aria-busy={status === "sending"}>
          {status === "sending" ? f.sending : submitLabel ?? (variant === "contact" ? f.submitContact : f.submit)}
          {status !== "sending" && <ArrowRight />}
        </button>
        <p className={`text-xs ${dark ? "text-white/60" : "text-muted"}`}>
          {f.consent}{" "}
          <Link href={privacyHref} className="underline underline-offset-2">{f.consentLink}</Link>.
        </p>
      </div>

      {(status === "fallback" || status === "error") && (
        <div className={`sm:col-span-2 rounded-2xl p-5 ${dark ? "bg-white/10" : "bg-red-soft"}`} role="alert" aria-live="assertive">
          {status === "error" && <p className="font-bold">{f.errorTitle}</p>}
          <p className="mt-1 text-sm">{status === "fallback" ? f.notConfiguredText : f.errorText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {waUrl ? (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn !bg-[#25D366] text-white" data-track-label={`form-fallback-${variant}`}>
                <WhatsAppIcon /> {f.sendViaWhatsapp}
              </a>
            ) : (
              <a href={instagramDm} target="_blank" rel="noopener noreferrer" className="btn btn-red" onClick={copy}>
                <InstagramIcon /> {f.sendViaInstagram}
              </a>
            )}
          </div>
          {copied && <p className="mt-3 text-sm font-semibold">{f.copied}</p>}
        </div>
      )}
    </form>
  );
}
