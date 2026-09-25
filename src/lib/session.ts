import { cookies, headers } from "next/headers";
import { auth } from "./auth";

export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function getAdmin() {
  const user = await getUser();
  return user?.role === "admin" ? user : null;
}

export async function requestMeta() {
  const h = await headers();
  let city = h.get("x-vercel-ip-city");
  try {
    city = city && decodeURIComponent(city);
  } catch {}

  const raw = (await cookies()).get("visitor")?.value;
  const [visitorId, firstSeen] = raw ? raw.split(".") : [];
  const ms = Number(firstSeen);

  return {
    ip: h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip"),
    country: h.get("x-vercel-ip-country"),
    city,
    userAgent: h.get("user-agent"),
    acceptLanguage: h.get("accept-language"),
    visitorId: visitorId ?? null,
    firstSeenAt: Number.isFinite(ms) && ms > 0 ? new Date(ms) : null,
  };
}
