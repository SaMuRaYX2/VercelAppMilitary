import Link from "next/link";
import { SECTIONS, TOTAL } from "@/lib/questions";
import { getUser } from "@/lib/session";

export default async function Home() {
  const user = await getUser();

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-12 sm:py-20">
      <p className="text-sm font-medium tracking-wide text-muted">Опитування особового складу</p>
      <h1 className="mt-3 font-display text-3xl font-semibold leading-[1.1] sm:text-5xl">
        Умови служби —<br />
        з перших вуст
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
        Анкета щодо проживання, харчування, укриттів, навчання, забезпечення та морально-психологічного стану.
        {TOTAL} питань, згрупованих у {SECTIONS.length} розділів. Відповіді зберігаються автоматично.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href={user ? "/survey" : "/sign-in"}
          className="rounded-xl bg-olive px-6 py-3.5 font-medium text-olive-ink transition-opacity hover:opacity-90"
        >
          {user ? "Продовжити анкету" : "Почати"}
        </Link>
        {user?.role === "admin" && (
          <Link href="/admin" className="rounded-xl border border-line px-6 py-3.5 font-medium hover:bg-paper">
            Панель адміністратора
          </Link>
        )}
      </div>

      <ol className="mt-14 divide-y divide-line border-y border-line">
        {SECTIONS.map((s) => (
          <li key={s.id} className="flex items-baseline gap-4 py-3.5">
            <span className="font-display text-sm text-muted tabular-nums">{s.id.padStart(2, "0")}</span>
            <span className="font-medium">{s.title}</span>
            <span className="ml-auto text-sm text-muted tabular-nums">{s.questions.length}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
