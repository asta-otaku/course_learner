"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"

const TALLY_URL = "https://tally.so"
const LOCAL_STORAGE_KEY = "leadCaptured"
const SESSION_CLOSED_KEY = "leadModalClosed"

function isLikelyTallySuccessPayload(value: unknown): boolean {
  if (value == null) return false

  if (typeof value === "string") {
    const normalized = value.toLowerCase()
    return ["submit", "submitted", "success", "thank you", "thanks"].some((token) => normalized.includes(token))
  }

  if (typeof value !== "object") return false

  const seen = new WeakSet<object>()

  function walk(node: unknown): boolean {
    if (node == null) return false
    if (typeof node === "string") {
      const normalized = node.toLowerCase()
      return ["submit", "submitted", "success", "thank you", "thanks", "completed"].some((token) => normalized.includes(token))
    }
    if (typeof node !== "object") return false

    const obj = node as Record<string, unknown>
    if (seen.has(obj)) return false
    seen.add(obj)

    const keys = Object.keys(obj)
    for (const key of keys) {
      const normalizedKey = key.toLowerCase()
      const matchKey = ["type", "event", "action", "status", "state", "message", "payload", "submit", "submitted", "success"].some((token) => normalizedKey.includes(token))
      if (matchKey) {
        const val = obj[key]
        if (walk(val)) return true
      }

      if (typeof obj[key] === "object") {
        if (walk(obj[key])) return true
      }
    }

    return false
  }

  return walk(value)
}

export default function LeadCaptureModal(): JSX.Element | null {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<number | null>(null)
  const firedRef = useRef(false)

  const openModal = useCallback(() => {
    if (firedRef.current) return
    // don't open if already completed or closed this session
    if (typeof window === "undefined") return
    if (localStorage.getItem(LOCAL_STORAGE_KEY)) return
    if (sessionStorage.getItem(SESSION_CLOSED_KEY)) return
    firedRef.current = true
    setVisible(true)
  }, [])

  const closeModal = useCallback(() => {
    setVisible(false)
    try {
      sessionStorage.setItem(SESSION_CLOSED_KEY, "1")
    } catch (e) {}
  }, [])

  // Listen for postMessage from Tally (mark as submitted)
  useEffect(() => {
    function messageHandler(e: MessageEvent) {
      try {
        const data = e.data
        const origin = (e.origin || "").toLowerCase()

        if (origin.includes("tally.so") || origin.includes("tally.co") || origin.includes("tally")) {
          console.debug("[LeadCaptureModal] Tally message received:", {
            origin,
            data,
          })

          if (isLikelyTallySuccessPayload(data)) {
            localStorage.setItem(LOCAL_STORAGE_KEY, "1")
            return
          }
        }
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener("message", messageHandler)
    return () => window.removeEventListener("message", messageHandler)
  }, [])

  useEffect(() => {
    setMounted(true)

    if (typeof window === "undefined") return

    // if user already converted, don't attach listeners
    if (localStorage.getItem(LOCAL_STORAGE_KEY)) return
    if (sessionStorage.getItem(SESSION_CLOSED_KEY)) return

    // timer: 30s (30000ms)
    timerRef.current = window.setTimeout(() => openModal(), 30000)

    // scroll listener to detect 60% scroll
    function onScroll() {
      if (firedRef.current) return
      const doc = document.documentElement
      const scrollTop = window.scrollY || doc.scrollTop
      const winHeight = window.innerHeight || doc.clientHeight
      const fullHeight = Math.max(document.body.scrollHeight, doc.scrollHeight)
      const scrolled = (scrollTop + winHeight) / fullHeight
      if (scrolled >= 0.6) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        openModal()
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      window.removeEventListener("scroll", onScroll)
    }
  }, [openModal])

  // if already converted don't render
  if (!mounted) return null
  if (typeof window !== "undefined" && localStorage.getItem(LOCAL_STORAGE_KEY)) return null

  if (!visible) return null

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "auto",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={closeModal}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          transition: "opacity 300ms ease",
        }}
      />

      {/* Modal container */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative",
          width: "min(95%, 650px)",
          maxHeight: "90vh",
          background: "transparent",
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          overflow: "hidden",
          zIndex: 10000,
          transform: "translateY(0)",
          opacity: 1,
          animation: "lead-fade-in 300ms ease",
        }}
      >
        <button
          aria-label="Close lead capture"
          onClick={closeModal}
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            zIndex: 10001,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            border: "none",
            width: 36,
            height: 36,
            borderRadius: 18,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div style={{ width: "100%", height: "100%", background: "white", borderRadius: 8 }}>
          <iframe
            src="https://tally.so/r/68llaP"
            width="100%"
            height="650"
            frameBorder={0}
            title="Call Back Request"
            style={{ display: "block", border: 0, width: "100%", height: "650px" }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes lead-fade-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.995); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
