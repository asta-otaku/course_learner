import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import {
  accessCookieName,
  refreshCookieName,
  sessionMarkerCookieName,
  type SessionBucket,
} from "./session-constants";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** Upstream API origin, server-side. Falls back to the public var for local dev. */
export function getApiBaseUrl(): string {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("API_URL (or NEXT_PUBLIC_API_URL) is not configured");
  }
  return url.replace(/\/+$/, "");
}

const DEFAULT_ACCESS_MAX_AGE = 60 * 60 * 24; // 1 day
const DEFAULT_REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const MIN_MAX_AGE = 60;

/** Read the `exp` claim (seconds since epoch) from a JWT without verifying it. */
export function decodeJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * Cookie lifetime derived from the JWT `exp` when present, otherwise a
 * generous default. A cookie that outlives its token is harmless (the API
 * rejects it and we refresh); a cookie that dies early logs users out.
 */
export function maxAgeForToken(token: string, fallbackSeconds: number): number {
  const exp = decodeJwtExp(token);
  if (!exp) return fallbackSeconds;
  const remaining = exp - Math.floor(Date.now() / 1000);
  return Math.max(remaining, MIN_MAX_AGE);
}

function baseCookieOptions() {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function setSessionCookies(
  response: NextResponse,
  bucket: SessionBucket,
  tokens: SessionTokens,
) {
  const accessMaxAge = maxAgeForToken(tokens.accessToken, DEFAULT_ACCESS_MAX_AGE);
  const refreshMaxAge = maxAgeForToken(
    tokens.refreshToken,
    DEFAULT_REFRESH_MAX_AGE,
  );

  response.cookies.set(accessCookieName(bucket), tokens.accessToken, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: accessMaxAge,
  });
  response.cookies.set(refreshCookieName(bucket), tokens.refreshToken, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge: refreshMaxAge,
  });
  // Readable marker so the client can tell a session exists. Carries no secret.
  response.cookies.set(sessionMarkerCookieName(bucket), "1", {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge: refreshMaxAge,
  });
}

export function clearSessionCookies(response: NextResponse, bucket: SessionBucket) {
  for (const name of [
    accessCookieName(bucket),
    refreshCookieName(bucket),
    sessionMarkerCookieName(bucket),
  ]) {
    response.cookies.set(name, "", { ...baseCookieOptions(), maxAge: 0 });
  }
}

export function readAccessToken(
  request: NextRequest,
  bucket: SessionBucket,
): string | null {
  return request.cookies.get(accessCookieName(bucket))?.value || null;
}

export function readRefreshToken(
  request: NextRequest,
  bucket: SessionBucket,
): string | null {
  return request.cookies.get(refreshCookieName(bucket))?.value || null;
}

/**
 * Reject requests that did not originate from our own pages. Cookies are
 * SameSite=Lax already; this is defence in depth against cross-site POSTs
 * from browsers that do not enforce it.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return false;
  return true;
}

/** Call the upstream refresh endpoint. Returns the new pair or `null`. */
export async function refreshUpstreamTokens(
  refreshToken: string,
): Promise<SessionTokens | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: string;
      data?: { accessToken?: string; refreshToken?: string };
    };
    const accessToken = json.data?.accessToken;
    const newRefresh = json.data?.refreshToken;
    if (json.status !== "success" || !accessToken || !newRefresh) return null;
    return { accessToken, refreshToken: newRefresh };
  } catch {
    return null;
  }
}
