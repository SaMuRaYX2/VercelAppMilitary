"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { validateAnswer } from "@/lib/questions";
import { getAdmin } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

const DENIED: Result = { ok: false, error: "Доступ заборонено." };

export async function deleteRespondent(userId: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (admin.id === userId) return { ok: false, error: "Не можна видалити власний акаунт." };

  // Cascades to survey_response, account and session via ON DELETE CASCADE.
  await pool.query(`delete from "user" where id = $1`, [userId]);
  revalidatePath("/admin");
  return { ok: true };
}

export async function adminUpdateAnswer(userId: string, questionId: string, value: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return DENIED;

  const clean = validateAnswer(questionId, value);
  if (clean === null) return { ok: false, error: "Некоректна відповідь." };

  const { rowCount } = await pool.query(
    clean === ""
      ? `update survey_response set answers = answers - $2::text, updated_at = now() where user_id = $1`
      : `update survey_response set answers = answers || jsonb_build_object($2::text, $3::text), updated_at = now() where user_id = $1`,
    clean === "" ? [userId, questionId] : [userId, questionId, clean],
  );
  return rowCount ? { ok: true } : { ok: false, error: "Анкету не знайдено." };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function adminUpdateUser(
  userId: string,
  patch: { name: string; email: string; role: string },
): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return DENIED;

  const name = patch.name.trim();
  const email = patch.email.trim().toLowerCase();
  const role = patch.role;

  if (!name || name.length > 200) return { ok: false, error: "Вкажіть ім'я (до 200 символів)." };
  if (!EMAIL_RE.test(email) || email.length > 320) return { ok: false, error: "Некоректна пошта." };
  if (role !== "user" && role !== "admin") return { ok: false, error: "Невідома роль." };
  if (admin.id === userId && role !== "admin") return { ok: false, error: "Не знімайте роль адміністратора із себе." };

  try {
    const { rowCount } = await pool.query(`update "user" set name = $2, email = $3, role = $4 where id = $1`, [
      userId,
      name,
      email,
      role,
    ]);
    if (!rowCount) return { ok: false, error: "Користувача не знайдено." };
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { ok: false, error: "Ця пошта вже зайнята." };
    throw e;
  }
  revalidatePath(`/admin/${userId}`);
  return { ok: true };
}
