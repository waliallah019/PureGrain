import Script from "next/script"

/**
 * Google Analytics 4 — the base gtag.js tag, rendered once from the root layout.
 *
 * Google's own snippet is a raw `<script async>` plus an inline block. Pasting
 * that into the App Router would either block the critical path or run before
 * hydration, so it is expressed through `next/script` with
 * `strategy="afterInteractive"` instead: Next injects the loader after the page
 * becomes interactive, and guarantees the inline init runs after it.
 *
 * This component is rendered in exactly one place — `app/layout.tsx` — which is
 * what keeps a single Google tag on every page. Do not add gtag.js, GTM, or a
 * second `<GoogleAnalytics />` anywhere else; Google is explicit that a page
 * must carry only one Google tag.
 *
 * A measurement ID is not a secret — it ships in the page source by design — so
 * it follows the same pattern as `SITE_URL` in `lib/seo.ts`: read from the
 * environment, with the real value as the fallback. That means analytics works
 * on a fresh deploy without anyone remembering to set a Vercel env var, while
 * still allowing a separate property to be pointed at a staging environment.
 */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-0XLM79C8QT"

export function GoogleAnalytics() {
  // Lets the tag be switched off entirely by setting the env var to an empty
  // string, without editing the layout.
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      {/*
        `id` is required on an inline next/script — it is the key Next uses to
        guarantee the script is evaluated exactly once. Client-side navigations
        re-render the layout but do NOT re-run this block, so no duplicate
        gtag.js loader and no duplicate `config` call.

        Page views on client-side navigation are handled by GA4's Enhanced
        Measurement ("Page changes based on browser history events"), which is
        enabled by default on a GA4 web data stream and listens for the History
        API calls the App Router uses to navigate. Firing page_view manually
        here as well would double-count every in-app navigation.
      */}
      <Script id="google-analytics-base" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
}

export default GoogleAnalytics
