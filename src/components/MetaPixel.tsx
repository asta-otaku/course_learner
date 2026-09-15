"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const MARKETING_AND_CONVERSION_PREFIXES = [
  "/about",
  "/contact",
  "/faqs",
  "/pricing",
  "/select-plan",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/admin/sign-in",
  "/admin/sign-up",
  "/admin/forgot-password",
  "/tutor/sign-in",
  "/tutor/sign-up",
  "/tutor/forgot-password",
];

function shouldEnablePixel(
  pathname: string | null,
  searchParams: URLSearchParams | null,
): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  if (
    MARKETING_AND_CONVERSION_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return true;
  }
  // Stripe returns here with ?paymentSuccess; do not track other learner routes.
  return pathname === "/dashboard" && Boolean(searchParams?.get("paymentSuccess"));
}

function MetaPixelInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!PIXEL_ID) return null;
  if (!shouldEnablePixel(pathname, searchParams)) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

/**
 * Marketing and conversion pages only (home, auth, pricing, select-plan,
 * Stripe return on /dashboard?paymentSuccess). Not loaded on homework/quiz/
 * tutor/admin learner surfaces.
 */
export default function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <MetaPixelInner />
    </Suspense>
  );
}

/**
 * Call this to fire a Meta standard or custom event.
 *
 * Standard events: https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 *
 * Examples:
 *   trackPixelEvent("CompleteRegistration");
 *   trackPixelEvent("Purchase", { value: 69.99, currency: "GBP" });
 *   trackPixelEvent("InitiateCheckout");
 *   trackPixelEvent("Lead");
 */
export function trackPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  if (typeof (window as any).fbq !== "function") return;
  (window as any).fbq("track", eventName, params);
}
