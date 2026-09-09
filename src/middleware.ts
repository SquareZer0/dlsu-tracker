import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && cookie === (await expectedToken())) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api")) {
    // /api/cron/* and /api/companion check their own auth (bearer secret
    // for cron-fired requests) since the digest call has no browser cookie.
    if (pathname.startsWith("/api/cron") || pathname.startsWith("/api/companion")) return NextResponse.next();
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
