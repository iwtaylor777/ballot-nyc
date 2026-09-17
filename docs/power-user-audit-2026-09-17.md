# Ballot NYC: power-user audit and improvement log

Audited September 17, 2026. Live site: https://ballotnyc.org. Local baseline: `f54b666` in `ballot-nyc`. Status: assessment complete; the findings below remain open. This audit added documentation and evidence files, with no application changes or deployment.

**Assessment:** the core address-to-ballot experience works, the visual identity is distinctive, and the official-source links are useful. It is not ready for an “everything is working” sign-off. The most consequential weaknesses concern voting instructions, geographic eligibility, stale saved districts, and how incomplete candidate research is presented in the quiz. Fix these before expanding distribution.

Priority definitions: **P1** = fix before promotion because it affects voter accuracy, trust, or operational security; **P2** = important usability, accessibility, or correctness issue; **P3** = lower-impact defect or hardening. “Live” means reproduced on the website; “code” means established from the implementation; “risk” means a plausible failure still requiring targeted reproduction. Product opportunities are proposals, not measured conversion improvements.

**What was tested**

| Area | Result and evidence |
|---|---|
| Production build | Passed; 131 pages generated. |
| Type checking | Passed. |
| Existing address tests | All 23 passed. These mostly cover parsing, ranking, and geography extraction, not complete user journeys. |
| Main voter journey | Completed home → address lookup → ballot → race → all seven quiz questions → priorities → results → plan. |
| Manhattan lookup | `476 5th Ave, Manhattan` returned House 12, Senate 28, Assembly 75, judicial district 1. Independently matched all four to the official NYC BOE lookup. |
| Other boroughs | Public-building lookups in Brooklyn, Queens, Bronx, and Staten Island returned complete district sets. This is sample coverage, not proof of every address or boundary. |
| Ambiguous address | `350 5th Ave` correctly offered Manhattan and Brooklyn choices. |
| ZIP only | `11231` correctly requested a street address. |
| Nonexistent building | `9999 Bond St, Brooklyn` did not silently substitute a building, but its “closest” choices were misleadingly distant in numbering; see B13. |
| Outside New York | Washington, DC test correctly returned `outside_ny`. |
| Outside NYC, inside NY | Yonkers and Albany were incorrectly accepted for this NYC-specific experience; see B03. |
| Persistence | Address/district state and a checked voting-plan item survived reloads. Borough editing and replacing an address exposed state bugs. |
| Responsive layouts | Inspected desktop, 375px phone, and 320px phone widths. Results overflow at 320px; primary home CTA starts below the first 812px viewport at 375px. |
| Official handoff | Address parameters populated the BOE form and its search returned the expected Manhattan districts and an Election Day poll site. Sample-ballot contents were not fully verified. |
| Calendar | Source-generated calendar contains seven all-day events and correct exclusive next-day end dates. Download click produced no captured console error, but browser download observation timed out. Real calendar import remains unverified. |
| Share image | Clicked image-save control; no captured console error. Actual image contents, saving to Photos, and native sharing remain unverified. |
| Partner embed | Preview rendered; copy button changed to “COPIED”; input accepted a public address. New-tab handoff was not observable in the available browser session, so end-to-end embed completion remains unverified. |
| Browser console | No errors/warnings captured during the inspected results/export/date flows. This is not a whole-site error guarantee. |
| Data integrity | 114 certified race records, 209 candidate entries, no duplicate race keys, and no invalid office/district references in those records. Candidate-list source opened successfully; selected entries checked, not all 209 independently reconciled. |
| Dependency audit | Public npm audit reported 3 affected production dependency packages: 1 critical, 2 high. See B07 for applicability limits. |

The [coverage evidence](/Users/iantaylor/Documents/political/ballot-nyc/docs/audit-data-coverage-2026-09-17.json) includes every race. The [logic evidence](/Users/iantaylor/Documents/political/ballot-nyc/docs/audit-logic-checks-2026-09-17.json) records calendar structure, deadline boundary examples, and priority-order behavior.

**Bug and issue log — all open**

| ID | Priority | Finding | Evidence |
|---|---|---|---|
| B01 | P1 | Early-voting instructions send people to any site in their borough | Live + official source |
| B02 | P1 | “Register” actions lead to an existing-voter lookup | Live + destination verified |
| B03 | P1 | Out-of-city addresses receive NYC proposals and poll-site links | Live UI + API |
| B04 | P1 | A new address can inherit old districts | Live + code |
| B05 | P1 | Manual borough edits preserve a contradictory saved address | Live |
| B06 | P1 | Quiz hides unscored candidates and entire races | Live + dataset count |
| B07 | P1 | Installed dependencies have published security advisories | npm audit; exploitability not tested |
| B08 | P2 | “Every race” promise exceeds actual coverage | Live + code |
| B09 | P2 | Share-card preview overflows small phones | Live measurement |
| B10 | P2 | Small orange/cream text misses normal-text contrast threshold | Color calculation + source |
| B11 | P2 | Deadline labels use the wrong local day near midnight | Deterministic code check |
| B12 | P3 | Invalid office/district combinations render plausible race pages | Live |
| B13 | P2 | “Closest building” suggestions overstate confidence | Live API |

**B01 — Early-voting location guidance is wrong.** On `/dates`, the October 24 entry says “Any early voting site in your borough.” NYC assigns each voter one early-voting site. The incorrect text is also exported to calendars. [NYS BOE early-voting guidance](https://elections.ny.gov/early-voting) confirms the NYC-specific restriction.

Location: [keyDates.json:20](/Users/iantaylor/Documents/political/ballot-nyc/data/keyDates.json:20). Fix the shared note to direct voters to their assigned early-voting site and explain that it may differ from their Election Day site. Verify both the rendered date entry and the exported calendar description.

**B02 — Registration calls to action do not start registration.** The home deadline banner, registration deadline entry, and plan’s “Register / check status” link all lead to `voterlookup.elections.ny.gov`. That destination explicitly requires an already registered voter. Someone attempting to register reaches the wrong task.

Locations: [keyDates.json:7](/Users/iantaylor/Documents/political/ballot-nyc/data/keyDates.json:7), [plan/page.tsx:24](/Users/iantaylor/Documents/political/ballot-nyc/app/plan/page.tsx:24). Split “Register to vote” and “Check registration.” Use the official [registration page](https://elections.ny.gov/register-vote) for the first and retain the [voter lookup](https://voterlookup.elections.ny.gov/) for the second. The homepage’s existing “Registered? Check…” link is correctly labeled.

**B03 — NYC coverage is not enforced.** The live API accepted `40 South Broadway, Yonkers, NY 10701` and `24 Eagle Street, Albany, NY 12207`. Entering the Albany address in the UI produced an Albany-labeled ballot with five NYC Charter proposals and a NYC poll-site link. Non-NYC district races had no catalogued candidates. This is misleading even in a fresh session; stale judicial state makes it worse.

Locations: [resolve.ts:367](/Users/iantaylor/Documents/political/ballot-nyc/lib/geo/resolve.ts:367), [resolve.ts:383](/Users/iantaylor/Documents/political/ballot-nyc/lib/geo/resolve.ts:383), [ballot/page.tsx](/Users/iantaylor/Documents/political/ballot-nyc/app/ballot/page.tsx). Validate the returned county against the five NYC counties before accepting a match. Return an explicit outside-NYC result with an appropriate statewide official lookup. Restrict manual choices to supported coverage or clearly label the limits. Acceptance: neither Albany nor Yonkers gets NYC proposals or a NYC sample-ballot link.

**B04 — Replacing the address merges districts instead of replacing them.** A successful lookup executes `{ ...prev, ...result.districts }`. If a new lookup omits a district, the previous one survives. Reproduced by looking up a NYC address, selecting Brooklyn, then looking up Albany: the Albany ballot retained Brooklyn Supreme Court candidates. A partial lookup during an upstream failure can similarly retain old legislative districts.

Location: [onboarding/page.tsx:112](/Users/iantaylor/Documents/political/ballot-nyc/app/onboarding/page.tsx:112). Replace the entire resolved selection on a new address and require explicit completion of missing districts. Save address and districts as one coherent record where practical. Acceptance: missing fields remain unset after an address change, and no old race appears under a new address.

**B05 — Editing only the borough leaves the old address and poll link.** Reproduction: look up `476 5th Ave, Manhattan`; choose “Pick manually”; change borough to Brooklyn; show ballot. Result: “FOR 476 5TH AVENUE, MANHATTAN” remains above Brooklyn judicial candidates, and the poll-site URL still uses the Manhattan address. The other three district selectors clear the address; the borough selector does not.

Location: [onboarding/page.tsx:476](/Users/iantaylor/Documents/political/ballot-nyc/app/onboarding/page.tsx:476). Clear the saved address on any manual district edit, or validate the edit against it. Acceptance: manually changed ballots are explicitly identified as manual, without an address-specific poll-site link.

**B06 — Quiz results silently remove candidates without research.** For House District 12, the race page listed four candidates; results showed only Micah Lasher. State Senate, Assembly, and judicial races disappeared entirely. The implementation filters out zero-overlap candidates and returns nothing for an unscored race. A disclaimer that results are not recommendations does not explain these omissions.

Only 22 of 209 candidate entries have positions on quiz-covered issues. Only 16 of 114 races have any scorable candidate, and only 5 have coverage for every candidate. The coverage is 6/6 statewide entries, 16/32 congressional entries, 0/43 Senate entries, 0/104 Assembly entries, and 0/24 judicial entries. These counts describe entries in this dataset, not party lines or independently deduplicated people.

Location: [results/page.tsx:138](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/results/page.tsx:138). Keep every race and candidate visible, distinguish “not enough sourced information” from disagreement, and state coverage prominently. A 90% result based on one issue also needs a stronger limited-evidence treatment; do not present scores based on different issue sets as equally comprehensive. Judicial research should have an appropriate informational format rather than forcing judges onto legislative policy scales. Acceptance: the four NY-12 candidates remain visible, and every omitted race has a clear research-status explanation.

**B07 — Framework and transitive dependencies need a security update.** The project pins Next.js 14.2.15. `npm audit --omit=dev --json` reported Next as critical, and nanoid and Next’s nested PostCSS as high. The maintainer’s [Server Components advisory](https://github.com/vercel/next.js/security/advisories/GHSA-8h8q-6873-q5fj) explicitly includes affected Next 14 App Router versions.

Location: [package.json:16](/Users/iantaylor/Documents/political/ballot-nyc/package.json:16). Upgrade to a currently patched, supported release and refresh the lockfile, then rerun the build and voter journeys. Advisory severity is not proof that every listed exploit applies to this deployment: middleware, custom-server, image-optimizer, and hosting conditions differ. No exploit testing was performed. Avoid blindly applying a forced major upgrade without compatibility work.

**B08 — The completeness promise is stronger than the product.** Home, embed, and partner copy promise every race and proposal. The ballot page itself says Civil Court races may be available only through the official sample ballot. That limitation appears after the race list. A user can reasonably mistake the list for their complete ballot.

Locations: [home/page.tsx:54](/Users/iantaylor/Documents/political/ballot-nyc/app/page.tsx:54), [ballot/page.tsx](/Users/iantaylor/Documents/political/ballot-nyc/app/ballot/page.tsx), [partners/page.tsx](/Users/iantaylor/Documents/political/ballot-nyc/app/partners/page.tsx). Either cover the missing local contests or state the coverage boundary beside the ballot headline and soften the acquisition copy. Make the official sample-ballot check an obvious completion step. Acceptance: users learn what is missing before relying on the race count.

**B09 — Results overflow at 320px.** At a 320px viewport, the page’s measured scroll width was 344px. The preview has a fixed width of 324px inside a layout with 20px side padding. At 375px there was no page overflow.

Location: [results/page.tsx:202](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/results/page.tsx:202). Make the preview fit its available width while retaining the intended aspect ratio. Keep export dimensions separate from the responsive preview. Acceptance: no horizontal page scroll at 320px, 375px, or increased text size; exported image remains 1080×1920.

**B10 — Brand colors are insufficient for small text in several uses.** Cream `#f2ede3` against orange `#ff3d1f` measures approximately 3.03:1. Small orange eyebrow labels on cream and small cream labels on orange therefore miss the 4.5:1 normal-text threshold. Large headings can meet the separate 3:1 threshold; this is not a finding that all orange use fails. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Locations: [globals.css:5](/Users/iantaylor/Documents/political/ballot-nyc/app/globals.css:5), [NextDeadline.tsx:60](/Users/iantaylor/Documents/political/ballot-nyc/components/NextDeadline.tsx:60). Use ink for small text on orange, or a darker accessible orange for text on cream. Test actual rendered states including hover and focus. Disabled controls have different requirements and were not counted as failures here.

**B11 — Deadline logic mixes UTC dates and a fixed Eastern offset.** For registration on October 24, at October 23, 8:30 PM New York time, the calculation returns zero days and displays “today.” At October 25, 12:30 AM New York time, registration is still displayed. Adding 29 hours to UTC midnight assumes standard time, but October is daylight time. The same cutoff pattern appears on the dates page.

Locations: [NextDeadline.tsx:26](/Users/iantaylor/Documents/political/ballot-nyc/components/NextDeadline.tsx:26), [dates/page.tsx](/Users/iantaylor/Documents/political/ballot-nyc/app/dates/page.tsx). Use New York calendar-day comparisons and explicit deadlines. Add boundary cases for the evening before a deadline, midnight after it, daylight-saving transition, and polls closing. Recompute when an open page crosses a boundary. The November 3 countdown’s 9 PM EST target is correct for that particular election date.

**B12 — Invalid race combinations render real-looking pages.** Visiting `/race/governor/ush-12` produced “Governor & Lt. Governor — U.S. House District 12,” an uncatalogued-race message, and a congressional Ballotpedia link. Office and district exist individually, but their scopes do not match.

Location: [race/page.tsx:75](/Users/iantaylor/Documents/political/ballot-nyc/app/race/[officeId]/[districtId]/page.tsx:75). Reject incompatible office/district combinations in both page rendering and metadata. Acceptance: this URL resolves to the not-found experience rather than an indexable fictitious race.

**B13 — “Closest” address suggestions can imply unjustified district equivalence.** `9999 Bond St, Brooklyn` returned 28, 26, and 25 Bond Street with “pick the closest building (usually the same districts).” These are alternatives from the provider’s returned list; there is no maximum distance or district-boundary verification. The test number is synthetic and does not identify a real nearby residence. The copy nevertheless encourages choosing a different building for an exact ballot.

Location: [resolve.ts](/Users/iantaylor/Documents/political/ballot-nyc/lib/geo/resolve.ts), [places.ts](/Users/iantaylor/Documents/political/ballot-nyc/lib/geo/places.ts). Require confirmation of the actual building, remove the unsupported same-district reassurance, and prefer official lookup/manual recovery when no exact address exists. Acceptance: a nonexistent house number never becomes a confidently described personalized ballot merely because the user selected an unrelated number.

**Additional risks and confusing behaviors to verify or resolve**

- **Export reliability:** image generation has no outer error handling or busy/error state. All native-share errors are treated as user cancellation. A font/canvas failure or permission failure can appear as a dead button. Calendar and image exports need real Safari/iOS/Android and desktop download checks; the browser harness did not verify saved files. [Results export functions](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/results/page.tsx:58).
- **Partner popup recovery:** the embed uses `window.open` without a visible fallback if the popup is blocked. The current harness did not expose a new tab. Verify on a separate publisher origin, with a restrictive iframe sandbox, and with popup blocking; offer an ordinary link fallback. [Embed](/Users/iantaylor/Documents/political/ballot-nyc/app/embed/page.tsx:12).
- **Storage robustness:** JSON parsing is caught, but successfully parsed values are not schema-validated or versioned. A stored `null`/wrong shape can break consumers. Storage-write failures are swallowed even though the UI promises device persistence. There is no visible clear-device-data action or election-specific migration. [Storage](/Users/iantaylor/Documents/political/ballot-nyc/lib/storage.ts:20).
- **Autocomplete concurrency:** an in-flight request is only aborted after the next debounce fires, and cleanup clears the timer rather than the request. Older results can race with a newer input, especially after shortening it below the minimum. Reproduce with delayed requests and reject results that do not correspond to the current input. [Onboarding](/Users/iantaylor/Documents/political/ballot-nyc/app/onboarding/page.tsx:81).
- **Accessible control state:** priority tiles visually indicate selection without `aria-pressed`; repeated “Remove,” “Move up,” and plan “Mark done” labels lack item context. Quiz transitions have no explicit focus transfer or announcement of the new question. Complete a keyboard and screen-reader pass, including reduced motion and 200% text zoom. [Priorities](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/priorities/page.tsx:102), [quiz](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/page.tsx).
- **Priority ordering is cosmetic for scores:** reversing all three priorities did not change any candidate score. Every selected issue receives the same 2× weight. This can be intentional, but numbered reorder controls imply ranked importance. Explain that order affects presentation, remove ranking, or adopt and document rank-dependent weights. Also, “skip” after an earlier visit preserves previous saved priorities. [Scoring](/Users/iantaylor/Documents/political/ballot-nyc/lib/scoreQuiz.ts:25).
- **Voting guidance needs separate moving-address guidance:** the plan combines new registration and address updates into “re-register by Oct 24.” The [official deadlines page](https://elections.ny.gov/registration-and-voting-deadlines) separately describes address-change processing. Link to that guidance and distinguish the tasks rather than compressing them into a blanket rule.
- **Privacy language deserves precision:** the app has no evident analytics integration, but autocomplete sends address queries directly to GeoSearch, and saved addresses and political quiz answers persist locally. Document those flows, offer a clear-data action, and verify hosting/log retention before making categorical server-storage promises. This audit did not inspect production logs or hosting retention settings.
- **The existing feature-audit CSV is not reliable regression evidence:** some “PASS” rows explicitly say they were not tested live, and several describe old primary-election, Photon, or GitHub-contact behavior. Keep historical notes, but distinguish source inspection, current automated checks, and current live verification. [Earlier checklist](/Users/iantaylor/Documents/political/ballot-nyc/docs/feature-audit.csv).

**Design assessment and upside opportunities**

Preserve the paper/orange palette, bold typography, plain-language office stakes, no-account entry, and address-first intent. The opportunity is to make the useful next action more obvious and the information more trustworthy.

| Opportunity | Concrete change | Why it matters | Suggested order |
|---|---|---|---|
| Put the main action on the first screen | Place address entry or “Build my ballot” directly under the hero; move the large timer below it | At 375×812, the CTA starts at y=920. The first prominent action sends visitors offsite to registration lookup | After P1 fixes |
| Offer a clear path through the tool | Persistent Ballot / Dates / Plan navigation; “View my saved ballot” for returning visitors; proposals discoverable without onboarding | Avoids requiring backtracking or remembering where a page lives | Next |
| Make research completeness visible | Coverage badge per race, last-reviewed date, editorial methodology, equal candidate presentation, missing-research explanation | Makes the nonpartisan claim assessable and prevents data scarcity from looking like preference | Highest product priority |
| Improve the quiz’s explanation | Show which answers contributed, corresponding candidate evidence, and limitations; add “Not sure / skip this question” | The current single 0–100 axis mixes policies that can coexist; percentage precision can overstate confidence | With B06 |
| Build an actual voting plan | Save method, chosen date/time, assigned site, and a calendar event with a reminder; support a mail-voting branch | Three checkboxes record completion but do not store the decision they ask users to make | Next |
| Create a take-to-the-polls checklist | Printable/mobile summary, optional locally saved candidate choices, judicial seat limits, proposal decisions, official ballot link | Helps users complete the final practical task; the current share card contains issues/date, not ballot selections | After coverage and state fixes |
| Make sharing independent of political profiling | Share the useful lookup or date guide without taking the quiz; plain URL and optional QR; clear download labels | “Share my ballot” currently routes through quiz results and may lead a quiz-skipping voter to “No answers yet” | Quick improvement |
| Add language access deliberately | Start with a reviewed Spanish core flow and official multilingual resources; prioritize larger, readable explanatory text | Extends usability without requiring candidate research in every language immediately | Following core reliability |
| Improve proposal navigation | Jump links to questions 1–5, consistent Yes/No summaries, a neutral explanation of practical tradeoffs and implementation limits | A long five-proposal page is difficult to compare and revisit on a phone | Next |
| Strengthen distribution through partners | Test the real cross-origin embed, provide accessible fallback links, publication-ready copy, and data freshness notes | The newsroom offering already exists; reliability and clarity make it usable | After P1 fixes |
| Maintain election data as a repeatable process | Preserve dated source snapshots, structured import/diff review, missing-candidate checks, and a change log | A hand-maintained certified list can become stale after amendments without obvious UI symptoms | Before wider promotion |
| Observe failures without collecting political profiles | Aggregate operational failure counts, synthetic public-address checks, and visible user error reporting; document any added collection | Detects breakage while preserving the product’s privacy intent | With reliability work |

Potential success measures: address lookup completion and ambiguous-address recovery, time from landing to first race, whether users understand research coverage, successful official-ballot handoffs, and completion of a concrete voting plan. Do not collect home addresses or political answers for product analytics. Validate the measurement design against the published privacy promise before adding anything.

**Recommended implementation sequence**

1. Correct B01/B02 immediately; fix city-boundary and saved-state logic B03–B05; make quiz coverage honest B06; update affected dependencies B07. These are prerequisites for promoting the tool.
2. Align coverage promises B08, fix small-screen layout/contrast B09–B10, centralize New York deadline logic B11, reject invalid races B12, and make unmatched-address recovery conservative B13.
3. Move the primary action up, add persistent task navigation, and make the voting plan save a real choice. Add a useful printable summary and sharing without requiring quiz answers.
4. Establish source refresh and release checks, then expand candidate research, language support, and newsroom distribution.

**Regression checks to add when fixing the issues:** all five boroughs; a mismatched borough hint; ambiguous and nonexistent buildings; out-of-city and out-of-state rejection; NYC-to-new-address replacement; partial lookup after saved state; manual borough edits; all candidates retained with zero/partial coverage; deadline boundaries in New York time; invalid race pairs; 320px layout; accessible selected states; actual calendar import and image export. The previous green checklist should not substitute for these checks.

**Limits of this audit:** sampled addresses and routes, one automated browser engine, desktop and emulated phone viewport sizes, no physical iOS/Android testing, no full screen-reader certification, no production load testing or exploit attempts, no production-log access, and no full editorial fact-check of every candidate position or legal abstract. The official certification and proposal source URLs opened successfully, but a complete row-by-row reconciliation is separate work. Export and cross-origin embed handoff remain specifically unverified rather than passed.

---

## Resolution log — September 17, 2026 (later same day)

Worked through the log above on branch `audit-fixes`. Verification for this pass: `npm run typecheck`, `npm run test:geo` (27 checks, extended with same-block and outside-NYC cases), server-rendering all 14 page states, and measuring layout at 320px and 375px. `next build` still cannot run in this environment.

| ID | Status | What changed |
|---|---|---|
| B01 | Fixed | Key-date note (and therefore the calendar description) now says NYC assigns one early voting site and it may differ from the Election Day site. Confirmed against the NYS BOE early-voting page: "except in New York City, where voters are assigned to one early voting site." |
| B02 | Fixed | Registration actions point to `elections.ny.gov/register-vote` (online registration, including address updates); checking status keeps `voterlookup`. The plan's step 1 now carries both, and says what to do if you moved. |
| B03 | Fixed | A match outside the five boroughs returns `outside_nyc` with a state voter-lookup handoff, and clears any saved NYC ballot. Manual pickers list only covered districts; a saved uncovered district is called out on the ballot page. |
| B04 | Fixed | A successful lookup replaces the whole district selection instead of merging into the previous one. |
| B05 | Fixed | Any manual district change — borough included — clears the saved address, so no ballot shows an address it doesn't match. |
| B06 | Fixed | Results list every race and every candidate. Unscored candidates are labeled "no positions sourced", each score says how many of your answers it rests on, low-overlap scores are de-emphasized, and judicial races are explicitly not scored. A coverage line states how many candidates on your ballot we have sourced positions for. |
| B07 | **Open — needs npm** | Neither sandbox here can reach the npm registry, so the upgrade and lockfile refresh have to run on a machine that can: `npm install next@latest && npm audit --omit=dev`, then rebuild and re-walk the voter journey. |
| B08 | Fixed | Home, ballot, embed and partner copy state the five-borough scope and point to the official sample ballot for local contests we don't carry. |
| B09 | Fixed | The share-card preview scales to its container (ResizeObserver) instead of a fixed 324px; export remains 1080×1920. Measured scroll width is now 320 at 320px. |
| B10 | Fixed | New `--ember-deep` (#c4300f, 4.77:1 on paper) is used for small text and for paper-on-orange labels; the brand orange stays for large headlines. |
| B11 | Fixed | `lib/nyTime.ts` compares New York calendar days with a DST-correct offset; the countdown targets 9 PM New York. The dates page re-checks every 10 minutes so an open page doesn't show a passed deadline. |
| B12 | Fixed | A race page requires the office's scope to match the district's type and the district to be covered; otherwise it 404s, in the page and in metadata. |
| B13 | Fixed | Nearby buildings are limited to the same block (Queens block prefix, otherwise ±20) and the "usually the same districts" reassurance is gone. |

From the risks section: export failures now surface a message and a busy state; the embed falls back to a plain link when `window.open` is blocked; autocomplete aborts in-flight requests and ignores stale responses; stored values are shape-checked and there's a "Clear my saved data" action; priority tiles expose `aria-pressed`, reorder/remove/plan controls name their item, and the quiz moves focus to each new question. Priority order is now described accurately (all picks weigh the same; order sets the share card) rather than implying ranked weights. Sharing no longer requires taking the quiz — the plan page has a direct share-this-tool action.

Still open, and honestly still unverified: the dependency upgrade (B07); real iOS/Android export and calendar-import checks; a cross-origin embed test on a publisher page; a full screen-reader pass; and row-by-row reconciliation of candidate data against the certification.
