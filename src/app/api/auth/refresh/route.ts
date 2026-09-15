import { NextRequest, NextResponse } from "next/server";
import { isSessionBucket, ROLE_HEADER } from "@/lib/auth/session-constants";
import {
  clearSessionCookies,
  isSameOriginRequest,
  readRefreshToken,
  refreshUpstreamTokens,
  setSessionCookies,
  type SessionTokens,
} from "@/lib/auth/session-cookies.server";

/**
 * POST /api/auth/refresh  (header: x-ll-role)
 *
 * Exchanges the httpOnly refresh cookie for a new token pair and rotates the
 * cookies. Returns 200 `{ status: "success" }` or 401 with cookies cleared.
 * Never returns a token to the browser.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Refresh tokens rotate upstream, so two concurrent refreshes with the same
 * token would invalidate each other. Dedupe per token within this process.
 */
const inFlight = new Map<string, Promise<SessionTokens | null>>();

function refreshOnce(refreshToken: string) {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;
  const promise = refreshUpstreamTokens(refreshToken).finally(() => {
    inFlight.delete(refreshToken);
  });
  inFlight.set(refreshToken, promise);
  return promise;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { status: "error", message: "Cross-site requests are not allowed" },
      { status: 403 },
    );
  }

  const header = request.headers.get(ROLE_HEADER);
  const bucket = isSessionBucket(header) ? header : "user";

  const refreshToken = readRefreshToken(request, bucket);
  if (!refreshToken) {
    const res = NextResponse.json(
      { status: "error", message: "No session" },
      { status: 401 },
    );
    clearSessionCookies(res, bucket);
    return res;
  }

  const tokens = await refreshOnce(refreshToken);
  if (!tokens) {
    const res = NextResponse.json(
      { status: "error", message: "Session expired" },
      { status: 401 },
    );
    clearSessionCookies(res, bucket);
    return res;
  }

  const res = NextResponse.json(
    { status: "success" },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
  setSessionCookies(res, bucket, tokens);
  return res;
}
