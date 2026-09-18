"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { requiredBucketForPath } from "@/lib/auth/session-constants";

const IDLE_MS = 5 * 60 * 1000;
const PREVIEW_IDLE_MS = 3_000;
const DISMISS_LOCK_MS = 400;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "wheel",
  "pointerdown",
] as const;

function idleDelayMs() {
  if (typeof window === "undefined") return IDLE_MS;
  if (process.env.NODE_ENV === "development") {
    const params = new URLSearchParams(window.location.search);
    if (params.has("idlePreview")) return PREVIEW_IDLE_MS;
  }
  return IDLE_MS;
}

function shouldTrackIdle(pathname: string | null): boolean {
  if (!pathname) return false;
  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    new URLSearchParams(window.location.search).has("idlePreview")
  ) {
    return true;
  }
  const required = requiredBucketForPath(pathname);
  return required === "user" || required === "admin" || required === "tutor";
}

export default function InactivityOverlay() {
  const pathname = usePathname();
  const enabled = shouldTrackIdle(pathname);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const exitingRef = useRef(false);
  const shownAtRef = useRef(0);

  const delayMs = idleDelayMs();

  const clearTimer = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const armTimer = useCallback(() => {
    clearTimer();
    const remaining = delayMs - (Date.now() - lastActivityRef.current);
    timeoutRef.current = window.setTimeout(() => {
      if (Date.now() - lastActivityRef.current >= delayMs) {
        visibleRef.current = true;
        exitingRef.current = false;
        shownAtRef.current = Date.now();
        setExiting(false);
        setVisible(true);
      }
    }, Math.max(remaining, 0));
  }, [clearTimer, delayMs]);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (!visibleRef.current) armTimer();
  }, [armTimer]);

  const dismiss = useCallback(() => {
    if (!visibleRef.current || exitingRef.current) return;
    if (Date.now() - shownAtRef.current < DISMISS_LOCK_MS) return;
    exitingRef.current = true;
    setExiting(true);
    window.setTimeout(() => {
      visibleRef.current = false;
      exitingRef.current = false;
      setVisible(false);
      setExiting(false);
      lastActivityRef.current = Date.now();
      armTimer();
    }, 280);
  }, [armTimer]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      visibleRef.current = false;
      setVisible(false);
      setExiting(false);
      return;
    }

    lastActivityRef.current = Date.now();
    armTimer();

    const onActivity = () => markActivity();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActivityRef.current >= delayMs) {
        visibleRef.current = true;
        exitingRef.current = false;
        shownAtRef.current = Date.now();
        setExiting(false);
        setVisible(true);
        return;
      }
      armTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimer();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, pathname, armTimer, clearTimer, markActivity, delayMs]);

  useEffect(() => {
    if (!visible) return;

    const onPointer = () => dismiss();
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("mousemove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("keydown", onPointer);
    window.addEventListener("touchstart", onPointer, { passive: true });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("mousemove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onPointer);
      window.removeEventListener("touchstart", onPointer);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
      aria-describedby="inactivity-copy"
      className={`inactivity-overlay ${exiting ? "is-exiting" : ""}`}
    >
      <div className="inactivity-overlay__wash" />
      <div className="inactivity-overlay__orb inactivity-overlay__orb--one" />
      <div className="inactivity-overlay__orb inactivity-overlay__orb--two" />
      <div className="inactivity-overlay__orb inactivity-overlay__orb--three" />
      <div className="inactivity-overlay__grid" />

      <div className="inactivity-overlay__card">
        <div className="inactivity-overlay__mark">
          <Image src="/logo.svg" alt="" width={112} height={36} priority />
        </div>

        <p className="inactivity-overlay__kicker">Still here</p>
        <h2 id="inactivity-title" className="inactivity-overlay__title">
          You&apos;ve been away
          <br />
          for a little while
        </h2>
        <p id="inactivity-copy" className="inactivity-overlay__copy">
          Dive right back in — everything is waiting exactly where you stopped.
        </p>

        <div className="inactivity-overlay__hint">
          <span className="inactivity-overlay__cursor" aria-hidden="true">
            <span className="inactivity-overlay__cursor-ring" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4.5 3.5 19 11.2l-6.4 1.5L10 21.5 4.5 3.5Z"
                fill="#286CFF"
                stroke="#1d4ed8"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>Move your cursor to continue</span>
        </div>
      </div>
    </div>
  );
}
