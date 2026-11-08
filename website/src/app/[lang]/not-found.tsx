import Link from "next/link";
import { ArrowRight } from "@/components/Icons";

// Rendered inside the [lang] layout. The locale isn't passed to not-found
// files, so the text is shown in all three languages.
export default function NotFound() {
  return (
    <section className="container-x flex min-h-[80svh] flex-col justify-center pt-[var(--header-h)]">
      <p className="font-display text-[clamp(6rem,20vw,14rem)] leading-none text-red">404</p>
      <h1 className="font-display display-md mt-4">Страница не найдена · Page not found · გვერდი ვერ მოიძებნა</h1>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/ru/" className="btn btn-red">Главная <ArrowRight /></Link>
        <Link href="/en/" className="btn btn-ghost">Home</Link>
        <Link href="/ka/" className="btn btn-ghost">მთავარი</Link>
      </div>
    </section>
  );
}
