"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { GA_ID } from "@/lib/analytics";

/**
 * GA4 page views, with Google's ad features denied. Skipped on /embed (it runs
 * inside newsroom pages) and for visitors who send Global Privacy Control.
 * Client-side navigations are counted by GA4's built-in history tracking.
 */
export function Analytics() {
  const pathname = usePathname();
  if (!GA_ID || pathname?.startsWith("/embed")) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
if (navigator.globalPrivacyControl) { window['ga-disable-${GA_ID}'] = true; }
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
gtag('js', new Date());
gtag('config', '${GA_ID}', { allow_google_signals: false, allow_ad_personalization_signals: false });
`}
      </Script>
    </>
  );
}
