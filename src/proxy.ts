import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/adminAuth";
import { sessionCookieName } from "@/lib/adminAuth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage =
    pathname.startsWith("/admin") && !pathname.startsWith("/api/");

  if (isAdminPage) {
    const isLoginPage = pathname === "/admin/login";
    const token = request.cookies.get(sessionCookieName)?.value;
    if (!isLoginPage && (!token || !verifySessionToken(token))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
