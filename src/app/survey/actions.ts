"use server";

import { pool } from "@/lib/db";
import { validateAnswer } from "@/lib/questions";
import { getUser, requestMeta } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

export async function saveAnswer(questionId: string, value: string): Promise<Result> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Сесія завершилась. Увійдіть знову." };
  const clean = validateAnswer(questionId, value);
  if (clean === null) return { ok: false, error: "Некоректна відповідь." };

  const { ip } = await requestMeta();
  const { rowCount } = await pool.query(
    clean === ""
      ? `update survey_response set answers = answers - $2::text, updated_at = now(), last_ip = $3 where user_id = $1`
      : `update survey_response set answers = answers || jsonb_build_object($2::text, $4::text), updated_at = now(), last_ip = $3 where user_id = $1`,
    clean === "" ? [user.id, questionId, ip] : [user.id, questionId, ip, clean],
  );
  return rowCount ? { ok: true } : { ok: false, error: "Анкету не знайдено. Оновіть сторінку." };
}

export async function submitSurvey(): Promise<Result> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Сесія завершилась. Увійдіть знову." };
  await pool.query(`update survey_response set submitted_at = now(), updated_at = now() where user_id = $1`, [user.id]);
  return { ok: true };
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);

export async function saveClientInfo(info: Record<string, unknown>): Promise<void> {
  const user = await getUser();
  if (!user || typeof info !== "object" || info === null) return;
  const clean = {
    timezone: str(info.timezone, 64),
    language: str(info.language, 35),
    languages: str(info.languages, 200),
    screen: str(info.screen, 20),
    platform: str(info.platform, 64),
    touch: typeof info.touch === "boolean" ? info.touch : null,
  };
  await pool.query(`update survey_response set client_info = $2 where user_id = $1`, [user.id, clean]);
}
