import { NextRequest, NextResponse } from "next/server";
import { isSessionBucket, ROLE_HEADER } from "@/lib/auth/session-constants";
import {
  clearSessionCookies,
  isSameOriginRequest,
  readAccessToken,
  readRefreshToken,
  refreshUpstreamTokens,
  setSessionCookies,
} from "@/lib/auth/session-cookies.server";

/**
 * GET /api/auth/socket-token  (header: x-ll-role)
 *
 * Socket.IO connects straight to the API and authenticates with a `jwtToken`
 * query param (see finding H3), so the browser needs the access token for that
 * one handshake. This is the ONLY place a token is handed to client JS; it is
 * same-origin only, never cached, and goes away once the socket gateway
 * accepts cookie/ticket auth.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "cache-control": "no-store" };

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { status: "error", message: "Cross-site requests are not allowed" },
      { status: 403 },
    );
  }

  const header = request.headers.get(ROLE_HEADER);
  const bucket = isSessionBucket(header) ? header : "user";

  const accessToken = readAccessToken(request, bucket);
  if (accessToken) {
    return NextResponse.json(
      { status: "success", data: { token: accessToken } },
      { headers: NO_STORE },
    );
  }

  // Access cookie expired but refresh is alive: rotate and hand out the new one.
  const refreshToken = readRefreshToken(request, bucket);
  if (refreshToken) {
    const tokens = await refreshUpstreamTokens(refreshToken);
    if (tokens) {
      const res = NextResponse.json(
        { status: "success", data: { token: tokens.accessToken } },
        { headers: NO_STORE },
      );
      setSessionCookies(res, bucket, tokens);
      return res;
    }
  }

  const res = NextResponse.json(
    { status: "error", message: "No session" },
    { status: 401, headers: NO_STORE },
  );
  clearSessionCookies(res, bucket);
  return res;
}
