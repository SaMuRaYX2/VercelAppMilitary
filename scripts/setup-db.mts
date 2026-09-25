import { readFileSync } from "node:fs";
import { getMigrations } from "better-auth/db/migration";
import { auth } from "../src/lib/auth.ts";
import { pool } from "../src/lib/db.ts";

const { runMigrations } = await getMigrations(auth.options);
await runMigrations();
await pool.query(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));

const adminEmail = process.argv[2];
if (adminEmail) {
  const { rowCount } = await pool.query(`update "user" set role = 'admin' where email = $1`, [adminEmail.toLowerCase()]);
  console.log(rowCount ? `${adminEmail} is now admin` : `No user with email ${adminEmail} — register on the site first`);
}

await pool.end();
console.log("Database ready");
