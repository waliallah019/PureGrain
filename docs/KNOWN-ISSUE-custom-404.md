# Custom HTML 404 page — disabled, and why

`app/not-found.tsx` is parked at `docs/not-found.tsx.disabled`. It is NOT active.

## Symptom

With any custom root `app/not-found.tsx` present, every unmatched URL returns
**HTTP 500** instead of 404, with:

    TypeError: Cannot read properties of undefined (reading 'call')
        at Object.t [as require] (.next/server/webpack-runtime.js:1:143)

The build succeeds and reports `○ /_not-found` prerendered, so this only
appears when a 404 is actually requested — easy to ship by accident.

## What was ruled out

Each of these was tested with a full clean rebuild:

| Hypothesis | Result |
|---|---|
| Stale `.next` / corrupt build | No — reproduces from a clean `rm -rf .next` build, deterministically |
| Something the page imports (`AGENT_PAGES` → `lib/industries`) | No — still 500 with the import removed |
| Client components (`Header`/`Footer` are `"use client"`) | No — still 500 with them removed |
| Page complexity | No — still 500 with only `next/link` and a type import |
| Removing the file | **404 works correctly** (Next's built-in 404 page) |

The remaining difference is that `/_not-found` renders inside the root layout's
client-provider stack (`ReactLenis root` wrapping `<body>`, then `ThemeProvider`
→ `CurrencyProvider`, plus `ScrollManager`, `WhatsAppButton`, `SampleTrayBar`).
That stack is fine on every normal route and only fails on this one.

## Current behaviour, which is correct

- **HTML request to an unknown URL** → Next's default 404 page, real 404 status.
- **`Accept: text/markdown` request** → `app/api/agent/markdown/route.ts` returns
  **404 with a Markdown body** listing recovery links, llms.txt and sitemap.xml.
  This is the path the agent-readiness audit actually asked for, and it is
  covered by tests in `tests/agent-endpoints.test.mts`.

A 500 on every dead URL is materially worse for both crawlers and agents than a
plain-but-correct 404, so the custom page stays off until the root-layout
interaction is resolved.

## To re-enable

Move the file back to `app/not-found.tsx`, rebuild, and verify with:

    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/does-not-exist

It must print 404. If it prints 500, the underlying issue is still present.
