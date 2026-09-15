"use client";

import {
  AUTH_CHANGE_EVENT,
  resolveMeetBucket,
  ROLE_HEADER,
  sessionMarkerCookieName,
  type SessionBucket,
} from "./session-constants";

/**
 * Browser-side view of the cookie session. Nothing here ever sees a token
 * (except `fetchSocketToken`, which exists only for the Socket.IO handshake).
 */

/**
 * Which bucket the current page belongs to. `/meet/*` is shared by every role,
 * so it acts as whichever session exists; `?role=` only breaks ties.
 */
export function getBucketFromRoute(): SessionBucket {
  if (typeof window === "undefined") return "user";
  const pathname = window.location.pathname;

  if (pathname.startsWith("/meet/")) {
    const hint = new URLSearchParams(window.location.search).get("role");
    return resolveMeetBucket(hint, hasSession) ?? "user";
  }
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/tutor")) return "tutor";
  return "user";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/** True when the non-secret session marker for the bucket is present. */
export function hasSession(bucket: SessionBucket): boolean {
  return readCookie(sessionMarkerCookieName(bucket)) === "1";
}

export function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

/** Subscribe to session changes (login, logout, cross-tab, tab focus). */
export function subscribeToAuthChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onVisibility = () => {
    if (document.visibilityState === "visible") callback();
  };
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("focus", callback);
  window.addEventListener("storage", callback);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("focus", callback);
    window.removeEventListener("storage", callback);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/** Ask the server to rotate the token pair for a bucket. */
export async function refreshSession(bucket: SessionBucket): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { [ROLE_HEADER]: bucket },
      credentials: "same-origin",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Clear the cookies for one bucket or all of them. */
export async function endSession(bucket: SessionBucket | "all"): Promise<void> {
  try {
    await fetch(`/api/auth/session?bucket=${bucket}`, {
      method: "DELETE",
      credentials: "same-origin",
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // Cookies are also bounded by maxAge; a failed logout call is not fatal.
  } finally {
    notifyAuthChange();
  }
}

/**
 * Access token for the Socket.IO `jwtToken` query param (finding H3). This is
 * the single JS-visible token surface and should be removed once the socket
 * gateway supports cookie or ticket auth.
 */
export async function fetchSocketToken(
  bucket: SessionBucket,
): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/socket-token", {
      headers: { [ROLE_HEADER]: bucket },
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { token?: string } };
    return json.data?.token ?? null;
  } catch {
    return null;
  }
}
