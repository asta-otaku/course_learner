import { NextRequest, NextResponse } from "next/server";
import {
  accessCookieName,
  decideRouteGuard,
  isSafeInternalPath,
  refreshCookieName,
  type SessionBucket,
} from "@/lib/auth/session-constants";

/**
 * Server-side route protection (finding C2).
 *
 * Runs before any protected page renders and redirects to the matching
 * sign-in page when the bucket the route needs has no session cookie. This
 * is a presence check on our own httpOnly cookies — the API remains the
 * authority on whether a token is valid, and the proxy surfaces its 401s.
 */
export function middleware(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  const hasSession = (bucket: SessionBucket) =>
    Boolean(
      request.cookies.get(accessCookieName(bucket))?.value ||
        request.cookies.get(refreshCookieName(bucket))?.value,
    );

  const { redirectTo } = decideRouteGuard(
    pathname,
    hasSession,
    searchParams.get("role"),
  );
  if (!redirectTo) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = redirectTo;
  url.search = "";
  const intended = `${pathname}${search}`;
  if (isSafeInternalPath(intended)) url.searchParams.set("next", intended);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, static assets, our own API routes and
     * files with an extension (images, fonts, robots.txt, sitemap.xml...).
     */
    "/((?!_next/|api/|favicon\\.ico|.*\\..*).*)",
  ],
};
