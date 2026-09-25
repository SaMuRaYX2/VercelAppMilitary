import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { QUESTIONS, SECTIONS } from "@/lib/questions";
import { getAdmin } from "@/lib/session";
import { visitorLabel } from "@/lib/visitor";

export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = { google: "Google", credential: "Email + пароль" };

type Detail = {
  name: string;
  email: string;
  email_verified: boolean;
  image: string | null;
  given_name: string | null;
  family_name: string | null;
  locale: string | null;
  google_id: string | null;
  providers: string | null;
  registered_at: Date;
  answers: Record<string, string>;
  ip: string | null;
  last_ip: string | null;
  country: string | null;
  city: string | null;
  user_agent: string | null;
  accept_language: string | null;
  client_info: Record<string, unknown> | null;
  visitor_id: string | null;
  first_seen_at: Date | null;
  started_at: Date;
  updated_at: Date;
  submitted_at: Date | null;
};

export default async function RespondentPage({ params }: PageProps<"/admin/[userId]">) {
  if (!(await getAdmin())) redirect("/");
  const { userId } = await params;

  const { rows } = await pool.query<Detail>(
    `select u.name, u.email, u."emailVerified" as email_verified, u.image,
            u."givenName" as given_name, u."familyName" as family_name, u.locale,
            u."googleId" as google_id, u."createdAt" as registered_at,
            (select string_agg(distinct a."providerId", ',') from account a where a."userId" = r.user_id) as providers,
            r.answers, r.ip, r.last_ip, r.country, r.city, r.user_agent,
            r.accept_language, r.client_info, r.visitor_id, r.first_seen_at,
            r.started_at, r.updated_at, r.submitted_at
     from survey_response r join "user" u on u.id = r.user_id where r.user_id = $1`,
    [userId],
  );
  const d = rows[0];
  if (!d) notFound();

  const ci = d.client_info ?? {};
  const label = visitorLabel(d.first_seen_at, d.started_at);
  const providers = (d.providers?.split(",") ?? [])
    .map((p) => PROVIDER_LABEL[p] ?? p)
    .join(", ");
  const meta: [string, string | null | undefined][] = [
    ["Email", d.email],
    ["Пошта підтверджена", d.email_verified ? "так" : "ні"],
    ["Спосіб входу", providers || null],
    ["Ім'я (Google)", d.given_name],
    ["Прізвище (Google)", d.family_name],
    ["Локаль (Google)", d.locale],
    ["Google ID", d.google_id],
    ["Зареєстровано", d.registered_at.toLocaleString("uk-UA")],
    ["Відвідувач", label && (label === "Новий" ? "Новий" : "Повторний")],
    ["Перший візит", d.first_seen_at?.toLocaleString("uk-UA")],
    ["IP (перше)", d.ip],
    ["IP (останнє)", d.last_ip],
    ["Локація", [d.city, d.country].filter(Boolean).join(", ") || null],
    ["Часовий пояс", str(ci.timezone)],
    ["Мова браузера", d.accept_language],
    ["Мови", str(ci.languages)],
    ["Екран", str(ci.screen)],
    ["Платформа", str(ci.platform)],
    ["Сенсорний екран", ci.touch == null ? null : ci.touch ? "так" : "ні"],
    ["User-Agent", d.user_agent],
    ["Почато", d.started_at.toLocaleString("uk-UA")],
    ["Оновлено", d.updated_at.toLocaleString("uk-UA")],
    ["Надіслано", d.submitted_at ? d.submitted_at.toLocaleString("uk-UA") : "—"],
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/admin" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
        ← До списку
      </Link>
      <div className="mt-4 flex items-center gap-3">
        {d.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.image} alt="" width={44} height={44} className="rounded-full" referrerPolicy="no-referrer" />
        )}
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{d.name}</h1>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-paper p-5">
        <h2 className="mb-3 font-display text-sm font-semibold text-muted">Дані респондента</h2>
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          {meta
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="break-words font-mono text-xs sm:text-sm">{v}</dd>
              </div>
            ))}
        </dl>
      </section>

      <div className="mt-10 flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.id}>
            <h2 className="mb-4 font-display text-base font-semibold">
              {section.id}. {section.title}
            </h2>
            <div className="flex flex-col gap-4">
              {section.questions.map((q) => {
                const a = d.answers[q.id];
                return (
                  <div key={q.id} className="border-l-2 border-line pl-4">
                    <p className="text-sm text-muted">{QUESTIONS.get(q.id)?.text}</p>
                    <p className={a ? "mt-1 whitespace-pre-wrap" : "mt-1 text-muted/60"}>{a || "— без відповіді —"}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function str(v: unknown) {
  return typeof v === "string" && v ? v : null;
}
