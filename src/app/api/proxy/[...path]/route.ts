import { NextRequest, NextResponse } from "next/server";
import {
  bucketForRole,
  isSessionBucket,
  ROLE_HEADER,
  type SessionBucket,
} from "@/lib/auth/session-constants";
import {
  getApiBaseUrl,
  isSameOriginRequest,
  readAccessToken,
  setSessionCookies,
} from "@/lib/auth/session-cookies.server";

/**
 * Same-origin proxy in front of the Leap Learners API.
 *
 * The browser never holds a JWT. `axiosInstance` sends requests here with an
 * `x-ll-role` header; we look up the httpOnly access cookie for that bucket,
 * attach it as `Authorization: Bearer …`, and stream the upstream response
 * back unchanged — except for sign-in / sign-up responses, whose tokens are
 * moved into cookies and stripped from the JSON body.
 *
 * Token refresh is NOT done here (see `/api/auth/refresh`) so the client can
 * keep a single in-flight refresh per tab and avoid rotating the refresh
 * token concurrently.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const UPSTREAM_TIMEOUT_MS = 60_000;

/** Request headers we must not forward to the API. */
const STRIPPED_REQUEST_HEADERS = new Set([
  "host",
  "cookie",
  "connection",
  "content-length",
  "accept-encoding",
  "origin",
  "referer",
  "sec-fetch-site",
  "sec-fetch-mode",
  "sec-fetch-dest",
  "sec-fetch-user",
  ROLE_HEADER,
]);

/** Response headers that would corrupt the re-streamed body or leak upstream cookies. */
const STRIPPED_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "set-cookie",
  "keep-alive",
]);

/** Upstream auth endpoints whose success payload carries a token pair. */
function isTokenIssuingPath(path: string) {
  return path === "auth/sign-in" || path.startsWith("auth/signup/");
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ status: "error", message }, { status });
}

function bucketFromRequest(request: NextRequest): SessionBucket {
  const header = request.headers.get(ROLE_HEADER);
  return isSessionBucket(header) ? header : "user";
}

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!isSameOriginRequest(request)) {
    return jsonError(403, "Cross-site requests are not allowed");
  }

  const { path: segments } = await context.params;
  const path = (segments ?? []).map(encodeURIComponent).join("/");
  if (!path) return jsonError(404, "Not found");

  let upstreamBase: string;
  try {
    upstreamBase = getApiBaseUrl();
  } catch (error) {
    return jsonError(500, (error as Error).message);
  }
  const upstreamUrl = `${upstreamBase}/${path}${request.nextUrl.search}`;

  const bucket = bucketFromRequest(request);
  const accessToken = readAccessToken(request, bucket);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  if (!headers.has("accept")) headers.set("accept", "application/json, text/plain, */*");

  const method = request.method.toUpperCase();
  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const buffer = await request.arrayBuffer();
    body = buffer.byteLength > 0 ? buffer : undefined;
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = (error as Error)?.name === "TimeoutError";
    return jsonError(
      timedOut ? 504 : 502,
      timedOut ? "Upstream request timed out" : "Upstream API is unreachable",
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });
  responseHeaders.set("cache-control", "no-store");

  // Sign-in / sign-up: move the token pair into httpOnly cookies and never let
  // it reach the browser.
  if (
    isTokenIssuingPath(path) &&
    upstream.ok &&
    (upstream.headers.get("content-type") ?? "").includes("application/json")
  ) {
    const payload = (await upstream.json()) as {
      data?: {
        userRole?: string;
        accessToken?: string;
        refreshToken?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    const tokens = payload?.data;
    if (!tokens?.accessToken || !tokens?.refreshToken) {
      return NextResponse.json(payload, {
        status: upstream.status,
        headers: responseHeaders,
      });
    }
    const { accessToken: at, refreshToken: rt, ...safeData } = tokens;
    const response = NextResponse.json(
      { ...payload, data: safeData },
      { status: upstream.status, headers: responseHeaders },
    );
    setSessionCookies(response, bucketForRole(tokens.userRole), {
      accessToken: at,
      refreshToken: rt,
    });
    return response;
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
};
