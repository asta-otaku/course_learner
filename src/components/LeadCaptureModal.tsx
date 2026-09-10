"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { isUserTypeAuthenticated } from "@/lib/services/axiosInstance";

const TALLY_ORIGINS = new Set(["https://tally.so", "https://www.tally.so"]);
const TALLY_WIDGET_SRC = "https://tally.so/widgets/embed.js";
const TALLY_FORM_SRC =
  "https://tally.so/embed/68llaP?alignLeft=1&transparentBackground=1&dynamicHeight=1";
const CONVERTED_KEY = "leadCaptured";
const SESSION_CLOSED_KEY = "leadModalClosed";
const OPEN_AFTER_MS = 30_000;
const SCROLL_THRESHOLD = 0.6;
const DEFAULT_FORM_HEIGHT = 520;

type TallyWindow = Window & { Tally?: { loadEmbeds: () => void } };

function storageGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Private mode / blocked storage
  }
}

function hasConverted(): boolean {
  return storageGet(localStorage, CONVERTED_KEY) === "1";
}

function hasClosedThisSession(): boolean {
  return storageGet(sessionStorage, SESSION_CLOSED_KEY) === "1";
}

function isSignedIn(): boolean {
  return (
    isUserTypeAuthenticated("user") ||
    isUserTypeAuthenticated("tutor") ||
    isUserTypeAuthenticated("admin")
  );
}

function shouldSuppressModal(): boolean {
  return isSignedIn() || hasConverted() || hasClosedThisSession();
}

function parseTallyPayload(data: unknown): Record<string, unknown> | null {
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return data.includes("Tally.FormSubmitted")
        ? { event: "Tally.FormSubmitted" }
        : null;
    }
  }
  if (data && typeof data === "object") {
    return data as Record<string, unknown>;
  }
  return null;
}

function isTallyFormSubmitted(data: unknown): boolean {
  const payload = parseTallyPayload(data);
  return payload?.event === "Tally.FormSubmitted";
}

function getTallyFormHeight(data: unknown): number | null {
  const payload = parseTallyPayload(data);
  if (!payload) return null;

  const nested = payload.payload;
  const heightCandidates = [
    payload.height,
    nested && typeof nested === "object"
      ? (nested as { height?: unknown }).height
      : null,
  ];

  for (const value of heightCandidates) {
    const height = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(height) && height > 80 && height < 1200) {
      return height;
    }
  }
  return null;
}

function getScrollProgress(): number {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const winHeight = window.innerHeight || doc.clientHeight;
  const fullHeight = Math.max(document.body.scrollHeight, doc.scrollHeight);
  if (fullHeight <= 0) return 0;
  return (scrollTop + winHeight) / fullHeight;
}

function loadTallyEmbeds() {
  const tallyWindow = window as TallyWindow;
  if (tallyWindow.Tally) {
    tallyWindow.Tally.loadEmbeds();
    return;
  }

  if (document.querySelector(`script[src="${TALLY_WIDGET_SRC}"]`)) return;

  const script = document.createElement("script");
  script.src = TALLY_WIDGET_SRC;
  script.async = true;
  script.onload = () => tallyWindow.Tally?.loadEmbeds();
  document.body.appendChild(script);
}

export default function LeadCaptureModal() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [formHeight, setFormHeight] = useState(DEFAULT_FORM_HEIGHT);
  const timerRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const openModal = useCallback(() => {
    if (firedRef.current || shouldSuppressModal()) return;
    firedRef.current = true;
    clearTimer();
    setOpen(true);
  }, [clearTimer]);

  const closeModal = useCallback(() => {
    setOpen(false);
    storageSet(sessionStorage, SESSION_CLOSED_KEY, "1");
  }, []);

  useEffect(() => {
    function messageHandler(event: MessageEvent) {
      if (!TALLY_ORIGINS.has(event.origin)) return;
      if (isTallyFormSubmitted(event.data)) {
        storageSet(localStorage, CONVERTED_KEY, "1");
      }
      const height = getTallyFormHeight(event.data);
      if (height) setFormHeight(height);
    }

    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !open) return;
    loadTallyEmbeds();
  }, [mounted, open]);

  useEffect(() => {
    if (!mounted) return;
    if (shouldSuppressModal()) return;

    const tryOpenFromScroll = () => {
      if (firedRef.current) return;
      if (getScrollProgress() >= SCROLL_THRESHOLD) {
        openModal();
      }
    };

    timerRef.current = window.setTimeout(openModal, OPEN_AFTER_MS);
    window.addEventListener("scroll", tryOpenFromScroll, { passive: true });
    tryOpenFromScroll();

    return () => {
      clearTimer();
      window.removeEventListener("scroll", tryOpenFromScroll);
    };
  }, [mounted, openModal, clearTimer]);

  if (!mounted) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeModal();
      }}
    >
      <DialogContent
        className="w-[min(calc(100%-2rem),36rem)] max-w-2xl gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none [&>button]:hidden"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="relative overflow-hidden rounded-2xl bg-white pt-12 shadow-2xl">
          <DialogTitle className="sr-only">
            Have questions about your child&apos;s maths?
          </DialogTitle>
          <DialogDescription className="sr-only">
            Leave your details and we will call within one working day.
          </DialogDescription>
          <DialogClose
            className="absolute right-4 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primaryBlue/40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <iframe
            data-tally-src={TALLY_FORM_SRC}
            src={TALLY_FORM_SRC}
            title="Have questions about your child's maths?"
            loading="lazy"
            className="block w-full border-0 px-4"
            style={{ height: formHeight }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
