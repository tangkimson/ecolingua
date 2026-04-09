import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { assertSecurityEnv } from "@/lib/env";

const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; connect-src 'self' https:; font-src 'self' data:; frame-src 'self' https://challenges.cloudflare.com https://docs.google.com https://forms.google.com;"
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isProtectedAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login/precheck";
  const isAuthOrPrecheckPath = pathname.startsWith("/api/auth") || pathname === "/api/admin/login/precheck";

  if (isProtectedAdminPage || isProtectedAdminApi || isAuthOrPrecheckPath) {
    // Keep public pages online even if admin secrets are misconfigured.
    // Security-sensitive flows still fail closed.
    assertSecurityEnv();
  }

  if (isProtectedAdminPage || isProtectedAdminApi) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isAuthorizedAdmin = Boolean(token?.id && token?.role === "ADMIN");

    if (!isAuthorizedAdmin) {
      if (isProtectedAdminApi) {
        const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => unauthorized.headers.set(key, value));
        if (process.env.NODE_ENV === "production") {
          unauthorized.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }
        return unauthorized;
      }

      const url = new URL("/admin/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      const redirectResponse = NextResponse.redirect(url);
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => redirectResponse.headers.set(key, value));
      if (process.env.NODE_ENV === "production") {
        redirectResponse.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      }
      return redirectResponse;
    }
  }

  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
