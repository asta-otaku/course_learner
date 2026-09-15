import { NextRequest, NextResponse } from "next/server";
import {
  isSessionBucket,
  SESSION_BUCKETS,
  type SessionBucket,
} from "@/lib/auth/session-constants";
import {
  clearSessionCookies,
  isSameOriginRequest,
  readAccessToken,
  readRefreshToken,
} from "@/lib/auth/session-cookies.server";

/**
 * GET    /api/auth/session            -> which buckets currently have a session
 * DELETE /api/auth/session?bucket=X   -> sign out bucket X (or `all`)
 *
 * Sessions are *created* by the proxy when the upstream sign-in / sign-up
 * responds with a token pair; there is deliberately no POST here so the
 * browser never has a token to hand us.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json(
    { status: "error", message: "Cross-site requests are not allowed" },
    { status: 403 },
  );
}

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbidden();

  const buckets = Object.fromEntries(
    SESSION_BUCKETS.map((bucket) => [
      bucket,
      Boolean(readAccessToken(request, bucket) || readRefreshToken(request, bucket)),
    ]),
  ) as Record<SessionBucket, boolean>;

  return NextResponse.json(
    { status: "success", data: buckets },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbidden();

  const param = request.nextUrl.searchParams.get("bucket");
  const targets: SessionBucket[] =
    param === "all" || !param
      ? [...SESSION_BUCKETS]
      : isSessionBucket(param)
        ? [param]
        : [];

  if (targets.length === 0) {
    return NextResponse.json(
      { status: "error", message: "Unknown session bucket" },
      { status: 400 },
    );
  }

  const res = NextResponse.json(
    { status: "success" },
    { headers: { "cache-control": "no-store" } },
  );
  for (const bucket of targets) clearSessionCookies(res, bucket);
  return res;
}
