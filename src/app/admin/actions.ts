"use server";

import { revalidatePath } from "next/cache";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { validateAnswer } from "@/lib/questions";
import { getAdmin, requestMeta } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

const OK: Result = { ok: true };
const DENIED: Result = { ok: false, error: "Доступ заборонено." };
const NOT_FOUND: Result = { ok: false, error: "Користувача не знайдено." };

async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("begin");
    const result = await fn(c);
    await c.query("commit");
    return result;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

type Actor = { id: string; email: string };

async function audit(
  c: PoolClient,
  actor: Actor,
  target: Actor,
  action: string,
  detail: Record<string, unknown>,
  ip: string | null | undefined,
) {
  await c.query(
    `insert into admin_audit (actor_id, actor_email, target_id, target_email, action, detail, ip)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [actor.id, actor.email, target.id, target.email, action, detail, ip ?? null],
  );
}

export async function deleteRespondent(userId: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (admin.id === userId) return { ok: false, error: "Не можна видалити власний акаунт." };
  const { ip } = await requestMeta();

  // One statement: admins are never deleted (demote first), and the audit row is
  // written only if the delete happened. Cascades to survey_response, account and session.
  const { rows } = await pool.query<{ n: number }>(
    `with d as (delete from "user" where id = $1 and role <> 'admin' returning id, email),
          a as (insert into admin_audit (actor_id, actor_email, target_id, target_email, action, ip)
                select $2, $3, id, email, 'delete', $4 from d)
     select count(*)::int as n from d`,
    [userId, admin.id, admin.email, ip ?? null],
  );
  if (!rows[0].n) {
    const { rowCount } = await pool.query(`select 1 from "user" where id = $1`, [userId]);
    return rowCount ? { ok: false, error: "Спершу зніміть роль адміністратора." } : NOT_FOUND;
  }
  revalidatePath("/admin");
  return OK;
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
  return rowCount ? OK : { ok: false, error: "Анкету не знайдено." };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function adminUpdateUser(userId: string, patch: { name: string; email: string }): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return DENIED;

  const name = patch.name.trim();
  const email = patch.email.trim().toLowerCase();

  if (!name || name.length > 200) return { ok: false, error: "Вкажіть ім'я (до 200 символів)." };
  if (!EMAIL_RE.test(email) || email.length > 320) return { ok: false, error: "Некоректна пошта." };
  const { ip } = await requestMeta();

  let result: Result;
  try {
    result = await tx(async (c) => {
      const { rows } = await c.query<{ email: string }>(`select email from "user" where id = $1 for update`, [userId]);
      const old = rows[0]?.email;
      if (old === undefined) return NOT_FOUND;
      if (old === email) {
        await c.query(`update "user" set name = $2 where id = $1`, [userId, name]);
        return OK;
      }
      // A new address is unconfirmed. Otherwise an admin could set someone's email to a
      // Google account they own and sign in as that person through Google account linking.
      await c.query(`update "user" set name = $2, email = $3, "emailVerified" = false where id = $1`, [
        userId,
        name,
        email,
      ]);
      await c.query(`delete from session where "userId" = $1`, [userId]);
      await audit(c, admin, { id: userId, email }, "email", { from: old, to: email }, ip);
      return OK;
    });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { ok: false, error: "Ця пошта вже зайнята." };
    throw e;
  }
  if (result.ok) revalidatePath(`/admin/${userId}`);
  return result;
}

export async function setUserRole(userId: string, role: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  if (role !== "user" && role !== "admin") return { ok: false, error: "Невідома роль." };
  if (admin.id === userId) return { ok: false, error: "Не можна змінювати власну роль." };
  const { ip } = await requestMeta();

  const result = await tx(async (c): Promise<Result> => {
    // Locks every admin row, so role changes run one at a time. If another admin removed
    // our role meanwhile, our row no longer matches and we stop: two admins demoting each
    // other at once can't leave the site without an admin.
    const { rows: admins } = await c.query<{ id: string }>(`select id from "user" where role = 'admin' for update`);
    if (!admins.some((a) => a.id === admin.id)) return DENIED;

    const { rows } = await c.query<{ email: string; role: string; emailVerified: boolean }>(
      `select email, role, "emailVerified" from "user" where id = $1 for update`,
      [userId],
    );
    const target = rows[0];
    if (!target) return NOT_FOUND;
    if (target.role === role) return OK;
    if (role === "admin" && !target.emailVerified) {
      return { ok: false, error: "Користувач ще не підтвердив пошту." };
    }

    await c.query(`update "user" set role = $2 where id = $1`, [userId, role]);
    await audit(c, admin, { id: userId, email: target.email }, "role", { from: target.role, to: role }, ip);
    return OK;
  });
  if (result.ok) revalidatePath(`/admin/${userId}`);
  return result;
}
