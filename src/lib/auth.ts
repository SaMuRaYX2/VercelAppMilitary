import { betterAuth } from "better-auth";
import { pool } from "./db.ts";

const google = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account" as const,
      mapProfileToUser: (p: { given_name?: string; family_name?: string; locale?: string; sub?: string }) => ({
        givenName: p.given_name ?? null,
        familyName: p.family_name ?? null,
        locale: p.locale ?? null,
        googleId: p.sub ?? null,
      }),
    }
  : undefined;

const profileField = { type: "string" as const, required: false, input: false as const };

export const googleEnabled = !!google;

export const auth = betterAuth({
  database: pool,
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: google ? { google } : {},
  // Let a Google sign-in attach to an existing email/password account with the
  // same address (Google verifies the email), so one person = one account.
  // ponytail: opens a narrow pre-registration takeover vector because we don't
  // verify email/password signups; close it by enabling email verification.
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"], requireLocalEmailVerified: false },
  },
  // On Vercel each instance has its own memory, so keep the counter in Postgres.
  // Limits are generous enough for normal use but still curb password brute-force.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 120,
    customRules: {
      "/sign-in/email": { window: 60, max: 15 },
      "/sign-up/email": { window: 60, max: 15 },
      "/sign-in/social": { window: 60, max: 30 },
    },
  },
  user: {
    additionalFields: {
      // Promoted to "admin" only by hand in the database, never from the client.
      role: { type: "string", defaultValue: "user", input: false },
      // Filled from the Google profile on sign-in; null for email/password users.
      givenName: profileField,
      familyName: profileField,
      locale: profileField,
      googleId: profileField,
    },
  },
});
