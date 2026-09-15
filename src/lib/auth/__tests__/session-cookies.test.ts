// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("server-only", () => ({}));

import {
  clearSessionCookies,
  decodeJwtExp,
  isSameOriginRequest,
  maxAgeForToken,
  readAccessToken,
  readRefreshToken,
  setSessionCookies,
} from "../session-cookies.server";

function fakeJwt(payload: Record<string, unknown>) {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.sig`;
}

const NOW = 1_800_000_000; // fixed "now" in seconds

describe("decodeJwtExp / maxAgeForToken", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW * 1000);
  });
  afterEach(() => vi.useRealTimers());

  it("reads exp from a JWT payload", () => {
    expect(decodeJwtExp(fakeJwt({ exp: NOW + 900 }))).toBe(NOW + 900);
  });

  it("returns null for opaque or malformed tokens", () => {
    expect(decodeJwtExp("not-a-jwt")).toBeNull();
    expect(decodeJwtExp("a.b.c")).toBeNull();
    expect(decodeJwtExp(fakeJwt({ sub: "x" }))).toBeNull();
  });

  it("derives cookie lifetime from exp, with a floor and a fallback", () => {
    expect(maxAgeForToken(fakeJwt({ exp: NOW + 900 }), 3600)).toBe(900);
    expect(maxAgeForToken(fakeJwt({ exp: NOW - 100 }), 3600)).toBe(60);
    expect(maxAgeForToken("opaque", 3600)).toBe(3600);
  });
});

describe("session cookies", () => {
  it("sets httpOnly token cookies plus a readable marker, and clears them", () => {
    const res = NextResponse.json({});
    setSessionCookies(res, "tutor", {
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });

    const access = res.cookies.get("ll_tutor_at");
    const refresh = res.cookies.get("ll_tutor_rt");
    const marker = res.cookies.get("ll_tutor_session");

    expect(access?.value).toBe("access-1");
    expect(access?.httpOnly).toBe(true);
    expect(access?.sameSite).toBe("lax");
    expect(access?.path).toBe("/");
    expect(refresh?.value).toBe("refresh-1");
    expect(refresh?.httpOnly).toBe(true);
    expect(marker?.value).toBe("1");
    expect(marker?.httpOnly).toBeFalsy();

    clearSessionCookies(res, "tutor");
    expect(res.cookies.get("ll_tutor_at")?.maxAge).toBe(0);
    expect(res.cookies.get("ll_tutor_rt")?.maxAge).toBe(0);
    expect(res.cookies.get("ll_tutor_session")?.maxAge).toBe(0);
  });

  it("reads tokens per bucket from the request", () => {
    const req = new NextRequest("http://localhost/api/proxy/x", {
      headers: { cookie: "ll_user_at=A; ll_user_rt=R; ll_admin_at=ADMIN" },
    });
    expect(readAccessToken(req, "user")).toBe("A");
    expect(readRefreshToken(req, "user")).toBe("R");
    expect(readAccessToken(req, "admin")).toBe("ADMIN");
    expect(readRefreshToken(req, "admin")).toBeNull();
    expect(readAccessToken(req, "tutor")).toBeNull();
  });
});

describe("isSameOriginRequest", () => {
  const url = "http://localhost:3000/api/proxy/x";

  it("accepts same-origin and direct navigations", () => {
    expect(
      isSameOriginRequest(
        new NextRequest(url, { headers: { "sec-fetch-site": "same-origin" } }),
      ),
    ).toBe(true);
    expect(isSameOriginRequest(new NextRequest(url))).toBe(true);
    expect(
      isSameOriginRequest(
        new NextRequest(url, { headers: { origin: "http://localhost:3000" } }),
      ),
    ).toBe(true);
  });

  it("rejects cross-site requests", () => {
    expect(
      isSameOriginRequest(
        new NextRequest(url, { headers: { "sec-fetch-site": "cross-site" } }),
      ),
    ).toBe(false);
    expect(
      isSameOriginRequest(
        new NextRequest(url, { headers: { origin: "https://evil.example" } }),
      ),
    ).toBe(false);
  });
});
