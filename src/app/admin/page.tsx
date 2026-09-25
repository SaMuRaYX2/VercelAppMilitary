import Link from "next/link";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { TOTAL } from "@/lib/questions";
import { getAdmin } from "@/lib/session";
import { visitorLabel } from "@/lib/visitor";

export const dynamic = "force-dynamic";

type Row = {
  user_id: string;
  name: string;
  email: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  answered: number;
  providers: string | null;
  first_seen_at: Date | null;
  started_at: Date;
  updated_at: Date;
  submitted_at: Date | null;
};

const PROVIDER_LABEL: Record<string, string> = { google: "Google", credential: "Email" };

export default async function AdminPage() {
  if (!(await getAdmin())) redirect("/");

  const { rows } = await pool.query<Row>(`
    select r.user_id, u.name, u.email, r.ip, r.country, r.city,
           (select count(*) from jsonb_object_keys(r.answers)) as answered,
           (select string_agg(distinct a."providerId", ',') from account a where a."userId" = r.user_id) as providers,
           r.first_seen_at, r.started_at, r.updated_at, r.submitted_at
    from survey_response r join "user" u on u.id = r.user_id
    order by r.updated_at desc
  `);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Відповіді</h1>
        <span className="text-sm text-muted tabular-nums">{rows.length} респондентів</span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-muted">Ще немає жодної відповіді.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-paper text-left text-muted">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium">
                <th>Респондент</th>
                <th>Заповнено</th>
                <th>Статус</th>
                <th>Вхід</th>
                <th>Відвідувач</th>
                <th>Локація</th>
                <th>IP</th>
                <th>Оновлено</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.user_id} className="transition-colors hover:bg-paper [&>td]:px-4 [&>td]:py-3">
                  <td>
                    <Link href={`/admin/${r.user_id}`} className="font-medium text-olive underline-offset-4 hover:underline">
                      {r.name}
                    </Link>
                    <div className="text-xs text-muted">{r.email}</div>
                  </td>
                  <td className="tabular-nums">
                    {r.answered} / {TOTAL}
                  </td>
                  <td>
                    {r.submitted_at ? (
                      <span className="rounded-md bg-olive/15 px-2 py-0.5 text-xs text-olive">Надіслано</span>
                    ) : (
                      <span className="rounded-md bg-signal/20 px-2 py-0.5 text-xs">Чернетка</span>
                    )}
                  </td>
                  <td className="text-muted">
                    {(r.providers?.split(",") ?? []).map((p) => PROVIDER_LABEL[p] ?? p).join(", ") || "—"}
                  </td>
                  <td>
                    <VisitorBadge label={visitorLabel(r.first_seen_at, r.started_at)} firstSeen={r.first_seen_at} />
                  </td>
                  <td className="text-muted">{[r.city, r.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="font-mono text-xs text-muted">{r.ip || "—"}</td>
                  <td className="whitespace-nowrap text-muted">{r.updated_at.toLocaleString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function VisitorBadge({ label, firstSeen }: { label: "Новий" | "Повторний" | null; firstSeen: Date | null }) {
  if (!label) return <span className="text-muted">—</span>;
  const cls = label === "Новий" ? "bg-olive/15 text-olive" : "bg-line text-muted";
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs ${cls}`}
      title={firstSeen ? `Перший візит: ${firstSeen.toLocaleString("uk-UA")}` : ""}
    >
      {label}
    </span>
  );
}
