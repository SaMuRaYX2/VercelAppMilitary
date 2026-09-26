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
        <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {rows.map((r) => (
            <Link
              key={r.user_id}
              href={`/admin/${r.user_id}`}
              className="block p-4 transition-colors hover:bg-paper focus-visible:bg-paper sm:px-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.name}</p>
                  <p className="truncate text-sm text-muted">{r.email}</p>
                </div>
                {r.submitted_at ? (
                  <span className="shrink-0 rounded-md bg-olive/15 px-2 py-0.5 text-xs text-olive">Надіслано</span>
                ) : (
                  <span className="shrink-0 rounded-md bg-signal/20 px-2 py-0.5 text-xs">Чернетка</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted">
                <Chip>
                  <span className="tabular-nums text-ink">
                    {r.answered} / {TOTAL}
                  </span>{" "}
                  заповнено
                </Chip>
                <Chip>{(r.providers?.split(",") ?? []).map((p) => PROVIDER_LABEL[p] ?? p).join(", ") || "—"}</Chip>
                <VisitorBadge label={visitorLabel(r.first_seen_at, r.started_at)} firstSeen={r.first_seen_at} />
                {[r.city, r.country].filter(Boolean).length > 0 && (
                  <Chip>{[r.city, r.country].filter(Boolean).join(", ")}</Chip>
                )}
                {r.ip && <Chip mono>{r.ip}</Chip>}
                <span className="ml-auto whitespace-nowrap">{r.updated_at.toLocaleString("uk-UA")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function Chip({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span className={`rounded-md bg-canvas px-2 py-0.5 ${mono ? "font-mono" : ""}`}>{children}</span>
  );
}

function VisitorBadge({ label, firstSeen }: { label: "Новий" | "Повторний" | null; firstSeen: Date | null }) {
  if (!label) return null;
  const cls = label === "Новий" ? "bg-olive/15 text-olive" : "bg-line text-muted";
  return (
    <span
      className={`rounded-md px-2 py-0.5 ${cls}`}
      title={firstSeen ? `Перший візит: ${firstSeen.toLocaleString("uk-UA")}` : ""}
    >
      {label}
    </span>
  );
}
