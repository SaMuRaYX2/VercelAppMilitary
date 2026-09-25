import { Pool } from "pg";

const g = globalThis as unknown as { pgPool?: Pool };

const url = process.env.DATABASE_URL ?? "";
const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

// With the CA cert we verify Supabase's certificate; without it we still use TLS
// but skip verification so the app runs before the cert is configured.
// ponytail: rejectUnauthorized:false accepts any cert (MITM risk) — set
// DATABASE_CA_CERT in production to verify.
const ssl = process.env.DATABASE_CA_CERT
  ? { ca: process.env.DATABASE_CA_CERT }
  : isLocal
    ? undefined
    : { rejectUnauthorized: false };

export const pool =
  g.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") g.pgPool = pool;
