"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Fires fbq("track", "PageView") on every client-side navigation.
 * Must be inside a <Suspense> boundary because it reads useSearchParams.
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!PIXEL_ID || typeof window === "undefined") return;
    if (typeof (window as any).fbq !== "function") return;
    (window as any).fbq("track", "PageView");
  }, [pathname, searchParams]);

  return null;
}

/**
 * Drop <MetaPixel /> anywhere in the layout — it injects the base pixel
 * snippet and automatically tracks every page view including soft navigations.
 *
 * Track custom events anywhere in the app:
 *   import { trackPixelEvent } from "@/components/MetaPixel";
 *   trackPixelEvent("Lead");
 *   trackPixelEvent("Purchase", { value: 29.99, currency: "GBP" });
 */
export default function MetaPixel() {
  if (!PIXEL_ID) return null;

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
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
