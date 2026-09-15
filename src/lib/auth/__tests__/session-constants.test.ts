import { describe, expect, it } from "vitest";
import {
  bucketForRole,
  decideRouteGuard,
  isAuthPagePath,
  isSafeInternalPath,
  requiredBucketForPath,
  resolveMeetBucket,
  type SessionBucket,
} from "../session-constants";

const withSessions =
  (...buckets: SessionBucket[]) =>
  (bucket: SessionBucket) =>
    buckets.includes(bucket);

describe("bucketForRole", () => {
  it("maps API roles to session buckets", () => {
    expect(bucketForRole("parent")).toBe("user");
    expect(bucketForRole("tutor")).toBe("tutor");
    expect(bucketForRole("admin")).toBe("admin");
    expect(bucketForRole("teacher")).toBe("admin");
    expect(bucketForRole(undefined)).toBe("user");
  });
});

describe("requiredBucketForPath", () => {
  it("leaves marketing and auth pages public", () => {
    for (const path of ["/", "/about", "/faqs", "/contact", "/unauthorized"]) {
      expect(requiredBucketForPath(path)).toBeNull();
    }
    for (const path of [
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/reset-password",
      "/admin/sign-in",
      "/admin/forgot-password",
      "/tutor/sign-up",
    ]) {
      expect(isAuthPagePath(path)).toBe(true);
      expect(requiredBucketForPath(path)).toBeNull();
    }
  });

  it("gates parent, admin, tutor and meet routes", () => {
    expect(requiredBucketForPath("/dashboard")).toBe("user");
    expect(requiredBucketForPath("/dashboard/abc")).toBe("user");
    expect(requiredBucketForPath("/homework/123/review")).toBe("user");
    expect(requiredBucketForPath("/settings/profiles")).toBe("user");
    expect(requiredBucketForPath("/select-plan")).toBe("user");
    expect(requiredBucketForPath("/admin")).toBe("admin");
    expect(requiredBucketForPath("/admin/questions")).toBe("admin");
    expect(requiredBucketForPath("/tutor")).toBe("tutor");
    expect(requiredBucketForPath("/tutor/students")).toBe("tutor");
    expect(requiredBucketForPath("/meet/room-1")).toBe("any");
  });

  it("does not treat lookalike prefixes as protected", () => {
    expect(requiredBucketForPath("/dashboards")).toBeNull();
    expect(requiredBucketForPath("/administrator")).toBeNull();
    expect(requiredBucketForPath("/tutorials")).toBeNull();
  });
});

describe("decideRouteGuard", () => {
  it("allows public routes regardless of session", () => {
    expect(decideRouteGuard("/about", withSessions())).toEqual({
      required: null,
      redirectTo: null,
    });
  });

  it("redirects each area to its own sign-in when the bucket is missing", () => {
    expect(decideRouteGuard("/dashboard", withSessions()).redirectTo).toBe(
      "/sign-in",
    );
    expect(decideRouteGuard("/admin/users", withSessions()).redirectTo).toBe(
      "/admin/sign-in",
    );
    expect(decideRouteGuard("/tutor/sessions", withSessions()).redirectTo).toBe(
      "/tutor/sign-in",
    );
  });

  it("does not let one bucket's session unlock another area", () => {
    expect(
      decideRouteGuard("/admin", withSessions("user", "tutor")).redirectTo,
    ).toBe("/admin/sign-in");
    expect(decideRouteGuard("/dashboard", withSessions("admin")).redirectTo).toBe(
      "/sign-in",
    );
  });

  it("allows the route when the required bucket has a session", () => {
    expect(decideRouteGuard("/dashboard", withSessions("user")).redirectTo).toBeNull();
    expect(decideRouteGuard("/admin", withSessions("admin")).redirectTo).toBeNull();
    expect(decideRouteGuard("/tutor", withSessions("tutor")).redirectTo).toBeNull();
  });

  it("lets any signed-in bucket into /meet and redirects to the role's sign-in otherwise", () => {
    expect(
      decideRouteGuard("/meet/r", withSessions("tutor"), "tutor").redirectTo,
    ).toBeNull();
    expect(decideRouteGuard("/meet/r", withSessions("admin"), null).redirectTo).toBeNull();
    expect(decideRouteGuard("/meet/r", withSessions(), "tutor").redirectTo).toBe(
      "/tutor/sign-in",
    );
    expect(decideRouteGuard("/meet/r", withSessions(), "bogus").redirectTo).toBe(
      "/sign-in",
    );
  });
});

describe("resolveMeetBucket", () => {
  it("returns null when nothing is signed in, whatever the URL says", () => {
    expect(resolveMeetBucket("admin", withSessions())).toBeNull();
  });

  it("uses the only available session and ignores a ?role= that has none", () => {
    expect(resolveMeetBucket("admin", withSessions("user"))).toBe("user");
    expect(resolveMeetBucket(null, withSessions("tutor"))).toBe("tutor");
    expect(resolveMeetBucket("bogus", withSessions("admin"))).toBe("admin");
  });

  it("uses ?role= only as a tiebreaker between the user's own sessions", () => {
    expect(resolveMeetBucket("user", withSessions("user", "tutor"))).toBe("user");
    expect(resolveMeetBucket("tutor", withSessions("user", "tutor"))).toBe("tutor");
  });

  it("falls back to tutor > admin > user when there is no usable hint", () => {
    expect(resolveMeetBucket(null, withSessions("user", "tutor"))).toBe("tutor");
    expect(resolveMeetBucket(null, withSessions("user", "admin"))).toBe("admin");
    expect(resolveMeetBucket("bogus", withSessions("user", "admin", "tutor"))).toBe(
      "tutor",
    );
  });
});

describe("isSafeInternalPath", () => {
  it("accepts same-origin relative paths only", () => {
    expect(isSafeInternalPath("/dashboard?x=1")).toBe(true);
    expect(isSafeInternalPath("//evil.com")).toBe(false);
    expect(isSafeInternalPath("/\\evil.com")).toBe(false);
    expect(isSafeInternalPath("https://evil.com")).toBe(false);
    expect(isSafeInternalPath("/redirect?to=https://evil.com")).toBe(false);
    expect(isSafeInternalPath("dashboard")).toBe(false);
  });
});
