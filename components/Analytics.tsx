"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { analyticsPath, GA_ID } from "@/lib/analytics";

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; }
}

/** Manual, sanitized public-page views. Private flows are never measured. */
export function Analytics() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!GA_ID) return;
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
    const path = analyticsPath(pathname || "/");
    const enabled = !gpc && !!path;
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = !enabled;
    setAllowed(enabled);
    if (!enabled) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer!.push(arguments); };
    const page = { page_location: `https://ballotnyc.org${path}`, page_referrer: "", page_title: "Ballot NYC" };
    window.gtag("set", page);
    if (!ready) {
      window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
      window.gtag("js", new Date());
      window.gtag("config", GA_ID, { ...page, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
      setReady(true);
    }
    window.gtag("event", "page_view", page);
    // Disable collection before an outbound personalized link or private SPA
    // navigation can be observed by an already-loaded tag.
    const beforeLink = (event: Event) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor) return;
      const url = new URL(anchor.href, location.href);
      if (url.search || url.hash || (url.origin === location.origin && !analyticsPath(url.pathname))) {
        (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true;
      }
    };
    document.addEventListener("click", beforeLink, true);
    return () => document.removeEventListener("click", beforeLink, true);
    // Initialization is once per document; route changes emit one page_view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  if (!GA_ID || !allowed) return null;
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />;
}
