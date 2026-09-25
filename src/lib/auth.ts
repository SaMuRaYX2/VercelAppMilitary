import { betterAuth } from "better-auth";
import { pool } from "./db.ts";
import { sendVerificationEmail } from "./email.ts";

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

// Origins allowed to call the auth endpoints. Vercel gives each deployment its
// own host, so trust the current deployment and the stable production domain
// from its env vars — otherwise sign-in fails with "Invalid origin".
const vercelHost = (h?: string) => (h ? `https://${h}` : undefined);
const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  vercelHost(process.env.VERCEL_URL),
  vercelHost(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  vercelHost(process.env.VERCEL_BRANCH_URL),
  "http://localhost:3000",
].filter((o): o is string => !!o);

export const googleEnabled = !!google;

export const auth = betterAuth({
  database: pool,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Email/password users must confirm their address before they can sign in.
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: ({ user, url }) => sendVerificationEmail(user.email, url),
  },
  socialProviders: google ? { google } : {},
  // A Google sign-in attaches to an existing email/password account with the
  // same address only once that account's email is verified (requireLocalEmailVerified
  // defaults to true), so one person = one account without a takeover window.
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
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
