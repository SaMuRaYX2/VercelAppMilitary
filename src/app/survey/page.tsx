import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { getUser, requestMeta } from "@/lib/session";
import { SurveyForm } from "./form";

export default async function SurveyPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const meta = await requestMeta();
  const { rows } = await pool.query<{ answers: Record<string, string>; submitted_at: Date | null }>(
    `insert into survey_response (user_id, ip, country, city, user_agent, accept_language, last_ip, visitor_id, first_seen_at)
       values ($1, $2, $3, $4, $5, $6, $2, $7, $8)
     on conflict (user_id) do update set last_ip = excluded.last_ip, updated_at = now()
     returning answers, submitted_at`,
    [user.id, meta.ip, meta.country, meta.city, meta.userAgent, meta.acceptLanguage, meta.visitorId, meta.firstSeenAt],
  );

  return <SurveyForm initialAnswers={rows[0].answers} submitted={!!rows[0].submitted_at} />;
}
