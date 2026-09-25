import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "visitor";
const YEAR = 60 * 60 * 24 * 365;

// Stamp every browser with a first-visit id on its first request, so a
// respondent can be marked new vs returning even before they register.
export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  if (!request.cookies.get(COOKIE)) {
    res.cookies.set(COOKIE, `${crypto.randomUUID()}.${Date.now()}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: YEAR,
      path: "/",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
