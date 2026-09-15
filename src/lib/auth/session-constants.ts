/**
 * Isomorphic auth-session constants shared by the middleware, the Next route
 * handlers that own the session cookies, and the browser.
 *
 * Tokens are stored ONLY in httpOnly cookies set by our own route handlers.
 * The browser never sees an access or refresh token; it talks to the API via
 * `/api/proxy/*`, which reads the cookie and forwards the request.
 *
 * Each role signs in to its own "bucket" so a parent, tutor and admin can be
 * logged in at the same time in one browser (existing product behaviour).
 */

export const SESSION_BUCKETS = ["user", "admin", "tutor"] as const;
export type SessionBucket = (typeof SESSION_BUCKETS)[number];

export function isSessionBucket(value: unknown): value is SessionBucket {
  return (
    typeof value === "string" &&
    (SESSION_BUCKETS as readonly string[]).includes(value)
  );
}

/** Map the API's `userRole` claim to the bucket it should be stored under. */
export function bucketForRole(userRole: string | undefined | null): SessionBucket {
  switch (userRole) {
    case "tutor":
      return "tutor";
    case "admin":
    case "teacher":
      return "admin";
    case "parent":
    default:
      return "user";
  }
}

/** httpOnly cookie carrying the API access token for a bucket. */
export function accessCookieName(bucket: SessionBucket) {
  return `ll_${bucket}_at`;
}

/** httpOnly cookie carrying the API refresh token for a bucket. */
export function refreshCookieName(bucket: SessionBucket) {
  return `ll_${bucket}_rt`;
}

/**
 * Non-httpOnly, non-secret marker ("1") that lets client code know a session
 * for the bucket exists without a network round-trip. It carries no token.
 */
export function sessionMarkerCookieName(bucket: SessionBucket) {
  return `ll_${bucket}_session`;
}

/** Header the browser sets so the proxy knows which bucket to authenticate with. */
export const ROLE_HEADER = "x-ll-role";

/** Custom DOM event dispatched whenever a session is established or cleared. */
export const AUTH_CHANGE_EVENT = "ll:auth-change";

export const PROXY_BASE_PATH = "/api/proxy";

/** Auth pages that must stay reachable without a session. */
export const AUTH_PAGE_PATHS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/admin/sign-in",
  "/admin/sign-up",
  "/admin/forgot-password",
  "/tutor/sign-in",
  "/tutor/sign-up",
  "/tutor/forgot-password",
] as const;

export function isAuthPagePath(pathname: string): boolean {
  return AUTH_PAGE_PATHS.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
}

export function signInPathForBucket(bucket: SessionBucket): string {
  if (bucket === "admin") return "/admin/sign-in";
  if (bucket === "tutor") return "/tutor/sign-in";
  return "/sign-in";
}

/**
 * Parent-facing routes that live under `src/app/(dashboard)` and require the
 * `user` bucket. Kept explicit so marketing routes (/, /about, /faqs, ...) are
 * never accidentally gated.
 */
export const USER_PROTECTED_PREFIXES = [
  "/dashboard",
  "/baseline-results",
  "/glossary",
  "/homework",
  "/independent-learning",
  "/library",
  "/messages",
  "/pricing",
  "/quiz",
  "/select-plan",
  "/select-profile",
  "/sessions",
  "/settings",
  "/take-quiz",
  "/videos-quiz",
] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Preference order when a browser holds several sessions and `/meet` gives
 * no usable hint. Tutors and admins host sessions; parents attend.
 */
const MEET_BUCKET_PRIORITY: readonly SessionBucket[] = ["tutor", "admin", "user"];

/**
 * Which session `/meet/*` should act as. Derived from the sessions that exist,
 * not from the URL: `?role=` is only honoured as a tiebreaker when that bucket
 * has a session too. Returns `null` when nothing is signed in.
 */
export function resolveMeetBucket(
  roleHint: string | null | undefined,
  hasSession: (bucket: SessionBucket) => boolean,
): SessionBucket | null {
  const available = MEET_BUCKET_PRIORITY.filter((bucket) => hasSession(bucket));
  if (available.length === 0) return null;
  if (available.length === 1) return available[0];
  if (isSessionBucket(roleHint) && available.includes(roleHint)) return roleHint;
  return available[0];
}

/**
 * Decide which bucket a pathname requires, or `null` when the route is public.
 * `/meet/*` accepts any bucket (resolved via `resolveMeetBucket`), signalled by
 * the special value `"any"`.
 */
export function requiredBucketForPath(
  pathname: string,
): SessionBucket | "any" | null {
  if (isAuthPagePath(pathname)) return null;

  if (matchesPrefix(pathname, "/admin")) return "admin";
  if (matchesPrefix(pathname, "/tutor")) return "tutor";
  if (matchesPrefix(pathname, "/meet")) return "any";

  if (USER_PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return "user";
  }
  return null;
}

export interface RouteGuardDecision {
  /** Bucket the route needs, if any. */
  required: SessionBucket | "any" | null;
  /** `null` when access is allowed, otherwise the sign-in path to redirect to. */
  redirectTo: string | null;
}

/**
 * Pure routing decision used by `middleware.ts` (and unit tests). `hasSession`
 * reports whether the given bucket has an access OR refresh cookie — an
 * expired access token with a live refresh token is still a session, because
 * the first proxied request will refresh it.
 */
export function decideRouteGuard(
  pathname: string,
  hasSession: (bucket: SessionBucket) => boolean,
  meetRole?: string | null,
): RouteGuardDecision {
  const required = requiredBucketForPath(pathname);
  if (required === null) return { required, redirectTo: null };

  if (required === "any") {
    if (resolveMeetBucket(meetRole, hasSession)) return { required, redirectTo: null };
    const preferred = isSessionBucket(meetRole) ? meetRole : "user";
    return { required, redirectTo: signInPathForBucket(preferred) };
  }

  if (hasSession(required)) return { required, redirectTo: null };
  return { required, redirectTo: signInPathForBucket(required) };
}

/** Only allow same-origin relative paths as post-login redirect targets. */
export function isSafeInternalPath(url: string): boolean {
  if (!url.startsWith("/")) return false;
  if (url.startsWith("//") || url.startsWith("/\\")) return false;
  if (url.includes("://")) return false;
  return true;
}
