# Round-2 audit fixes — 18 Sep 2026

Findings from `power-user-audit-round-2-2026-09-18.md`. The audit's closing
instruction was not to close a finding because the source now contains an
intended fix, so every P1/P2 here has an acceptance check that runs the real
page in a real browser, and each check was first confirmed to fail against a
deliberately broken build (see "Proving the checks work" below).

## What changed

| Finding | Fix | Acceptance check |
|---|---|---|
| R2-01 · partial quizzes misdescribe candidates | New `lib/quizStatus.ts` gives every candidate one of four states — scored, researched-but-no-overlap, unresearched, judicial. Results rows and the coverage sentence both read from it: "We have sourced positions for N, and M of those line up with the X questions you answered." | `test:ui` — with one answer: singular copy, three distinct labels present, no row showing both a score and a status, and the coverage numbers matching the rows on screen. `test:quiz` covers the classifier offline. |
| R2-02 · share-card preview clipped | The preview measures itself in a callback ref, not a mount effect (the page renders a loading gate first, so an effect ran while the element did not exist yet) and keeps a `ResizeObserver` attached. | `test:ui` — card width equals the box width at 320/375/414 and refits when the window changes. |
| R2-03 · quiz focus lost | `wantsFocus` flag plus a callback ref on the heading: focus happens when the incoming heading attaches, not when `idx` changes (AnimatePresence still holds the outgoing one at effect time). PREVIOUS sets the same flag. | `test:ui` — after answering, `document.activeElement` is the only heading in the DOM and is the new question; the first render does not steal focus. |
| R2-04 · clear-my-data left stale state | Clear resets choices, errors, loading, suggestions and the outside-NYC notice, and shows its own confirmation in both tabs. A `lookupGeneration` counter makes a lookup that was cleared or replaced unable to repopulate the ballot. | Code review plus `typecheck`; the in-flight race needs a network fixture the harness does not have yet. |
| R2-05 · priorities could not be reset to none | The save button is never disabled; with nothing picked it reads "WEIGH EVERYTHING EQUALLY →" and explains what that does. The skip link is now "CANCEL — KEEP MY LAST PICKS". | `test:ui` — enabled with nothing picked, honest label, label switches once something is picked. |
| R2-06 · inconsistent date arithmetic | `ShareCard` uses `daysUntil` from `lib/nyTime` like the rest of the site. `NextDeadline` recomputes every 10 minutes and on `visibilitychange`, so a page left open past midnight stops showing yesterday's deadline. | `test:quiz` — 8:30 PM and midnight boundary cases. |
| R2-07 · moving-address guidance | Registration and address change are described as different processes, with the statutory 15-day window (Oct 19 for Nov 3) and a link to the state's deadline page. | Verified against elections.ny.gov, which states changes received at least 15 days before the election are processed in time for it. |
| R2-08 · hover contrast | Remaining `hover:bg-ember` pairs on small text moved to `emberDeep` (4.77:1). | SSR render + review. |
| R2-09 · transitive advisory | Not fixed here: `baseline-browser-mapping` is pinned by `next` and `browserslist`. Needs `npm update baseline-browser-mapping` where the registry is reachable. | — |

Also moved the ballot coverage boundary above the race list, took the geocode
route off the deprecated Edge Runtime, and gave `ShareLink` a selectable URL
when the clipboard is blocked (a cancelled share sheet is no longer treated as
a failure).

## How the checks run

```
npm run build          # self-hosts the fonts the harness measures with
npm run test:ui        # builds .preview-tmp/harness.html, then drives it
```

`scripts/ui-harness.mjs` bundles the real client pages with the real React,
react-dom and framer-motion from `node_modules` into one HTML file; only
storage, routing and the PNG export are stubbed, so AnimatePresence timing and
ResizeObserver behave as they do in the app. The site's own woff2 subsets are
inlined, so text measures at production widths — measuring in a fallback font
had been reporting overflow on the home and race pages that does not exist.

`test:ui` needs Playwright (`npm i -D playwright && npx playwright install
chromium`); it is deliberately not part of `npm run check`, which stays
offline-only.

## Proving the checks work

`PATCH_JSON` lets the harness build a deliberately broken bundle. Both
regressions the audit said survived a reasonable-looking fix were reproduced:

- preview measurement disabled → card 324px inside a 318px box, four checks fail;
- focus moved into an effect keyed on `idx` → focus lands on the outgoing
  heading, which then unmounts and drops focus to `<body>`, two checks fail.

Both pass on the current source.

## Still open

- R2-09 dependency refresh, then re-audit.
- Device-level verification the sandbox cannot do: native share/export on real
  iOS and Android, calendar import, cross-origin embed matrix, a full
  screen-reader pass, and a row-by-row reconciliation of candidate records
  against the certified list.
