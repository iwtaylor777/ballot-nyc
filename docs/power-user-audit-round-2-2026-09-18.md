# Ballot NYC — second pressure-test and improvement log

Audited September 17–18, 2026, against https://ballotnyc.org and local commit `6401ea4`. This follows the fixes in `eec6ecd`, `b7ba23c`, and `6401ea4`. Assessment and documentation only; no application changes or deployment.

**Assessment:** the updates materially improve voter accuracy and the main experience. The address fixes hold up in the sampled journeys, the serious dependency findings from the first audit are gone from the current audit, and every candidate is now visible in results. There are still release-quality issues: partial quizzes misdescribe the research, the responsive card clips its content, the focus fix runs at the wrong point in the animation, and clearing data leaves stale address choices visible. The product also needs more candidate research and a more useful voting plan before visual polish alone will take it much further.

Priority: **P1** affects voting guidance or substantive trust; **P2** affects usability, accessibility, or correctness; **P3** is lower-impact maintenance. “Live” means reproduced through the public interface. “Code/logic” means established from source or deterministic calculations, without claiming a live-device reproduction. Risks and product ideas are listed separately.

## Test coverage and results

| Check | Result |
|---|---|
| Type check and existing geography tests | Passed; all 27 geography tests passed. These do not cover the new React interaction failures below. |
| Production build | `next build --webpack` passed: 131 static pages generated. Default Turbopack build was blocked by this execution environment’s local-port restriction. A sandboxed webpack attempt could not fetch Google Fonts; the network-enabled retry succeeded. This is not proof the default build fails on the deployment host. |
| Build warnings | Big Shoulders font-override values were unavailable; Edge Runtime deprecation warning also appeared. Neither prevented the successful build. |
| Dependency audit | No high or critical findings reported; one moderate transitive finding remains, R2-09. |
| Address coverage | Complete district sets returned for public addresses in all five boroughs, including the Manhattan journey and the four borough requests in the evidence file. This is sampled coverage, not independent verification of every boundary. |
| Outside NYC | Albany and Yonkers returned `outside_nyc`, rather than NYC ballots. |
| Ambiguous / incorrect addresses | `350 5th Ave` offered Manhattan and Brooklyn; `365 Bond St, Manhattan` asked before offering Brooklyn; ZIP-only requested a street; `9999 Bond St, Brooklyn` returned no match. |
| Manual edits | Changing Brooklyn to Manhattan manually removed the saved Brooklyn address and changed the poll-site link to the generic official lookup. |
| Quiz | One-answer → skip → results, editing priorities, keyboard question advance, and a full seven-answer → priorities → results journey exercised. See defects below. |
| Voting plan | Registration and registration-check actions are separate; one assigned NYC early-voting site is explained; checked progress survived a reload. |
| Mobile | Live review at 320px and 375px browser widths. At 320px the results document fits, but the card content does not. Browser resizing is not a physical iPhone/Android test. |
| Route / icon / discovery | Invalid `/race/governor/ush-12` returns HTTP 404; `/apple-icon` returns HTTP 200 and a real PNG; robots and sitemap return HTTP 200. |
| Date boundaries | Five New York midnight / DST cases passed, plus correct summer and November poll-closing instants. Share-card day calculation still disagrees; R2-06. |

Evidence: [browser observations](round-2-browser-observations-2026-09-18.json), [address responses](round-2-address-checks-2026-09-17.json), [logic and partial-score checks](round-2-logic-checks-2026-09-18.json), [route responses](round-2-route-checks-2026-09-18.json). The address evidence keeps the date on which that run began. Only public-building and synthetic addresses were used.

## Confirmed findings

### R2-01 · P1 · Partial quizzes falsely describe candidates as having no sourced positions

**Live + logic; introduced by the revised unscored-results presentation.** With the Manhattan ballot for `476 5th Ave`, answer only the rent question, choose “Skip the rest,” then skip priorities. Results say **7 of 25** candidates can be scored, but only **4** actually receive a score. Saritha Komatireddy, Thomas DiNapoli, and Joseph Hernandez say **NO POSITIONS SOURCED** despite having positions in the data. The entire comptroller race says nobody has sourced positions; its race page immediately shows both candidates’ sourced positions.

The distinction is between research absent and no overlap with the questions this user answered. Combining them misrepresents the product’s evidence and the candidates. Judicial candidates are intentionally unscored and should also be distinguished from research gaps in the overall explanation.

Source: [coverage count](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/results/page.tsx:43), [empty-race message](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/results/page.tsx:213), [unscored label](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/results/page.tsx:265).

**Fix / acceptance:** distinguish “No positions researched,” “No overlap with your answers,” and “Not scored — judicial office.” Say how many candidates have research and how many can be compared using this response set. In this reproduction, show 7 researched and 4 comparable; the comptroller race should offer to answer a relevant question, not claim no research exists. Verify one-answer, full-answer, and zero-answer states.

### R2-02 · P2 · The responsive share-card fix hides overflow rather than fitting the card

**Live + code; incomplete B09 fix.** At 320px the document’s width is correctly 320px. However, the preview’s content area is **274px** wide while the scaled card remains **324 × 576px** (`scale(0.3)`). Its outer container is approximately **280 × 498px**, with hidden overflow. A screenshot showed the election date cut off and the card footer missing; the right edge is also clipped.

At 375px, a settled second check still showed a 324px card inside a 318px content area. The full seven-answer results loaded successfully with seven scored entries in that test ballot and no captured browser warnings/errors, but the sizing remained wrong.

The mount-only effect runs while hydration displays “LOADING.” The preview ref is null then, so the effect returns without attaching its observer. It never reruns when the actual card mounts. Passing a horizontal-scroll test alone missed this.

Source: [observer effect](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/results/page.tsx:27), [preview container](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/results/page.tsx:298).

**Fix / acceptance:** attach sizing when the preview element actually mounts, using a callback ref or a dedicated mounted component; account for border and usable height as well as width. Inspect all four edges, date, and footer at 320px, 375px, and desktop, on direct load and client navigation. Independently verify that downloaded output remains 1080 × 1920; a clipped preview does not establish that the exported file is clipped.

### R2-03 · P2 · Quiz focus moves to the outgoing question and is then lost

**Live keyboard reproduction + code; attempted accessibility fix does not work.** Activate a first-question answer with Enter. After the animation finishes, the new transit heading is present but `document.activeElement` is `BODY`. The heading is not focused. During another transition, the interface briefly reported question 3 while the focused heading was still the outgoing transit question.

The effect tied to `idx` runs before `AnimatePresence mode="wait"` mounts the replacement. It focuses the old heading, which then disappears. The progress live region announces a number but does not replace correctly placed focus. Returning to index zero is also excluded by the `idx > 0` guard.

Source: [focus effect](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/page.tsx:17), [transition](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/page.tsx:71).

**Fix / acceptance:** focus the newly mounted heading after the transition/mount lifecycle, for both forward and previous navigation. Verify with keyboard and a real screen reader that the new prompt is announced and the next Tab reaches an answer. Respect reduced-motion preferences at the animation-library level too.

### R2-04 · P2 · “Clear my saved data” leaves address choices on screen and shows no confirmation

**Live + code; new clear-data feature.** Look up `350 5th Ave` until the Manhattan/Brooklyn choices appear, then click Clear. The saved ballot and input disappear, but **WHICH ONE?** and both address buttons remain. The stale Brooklyn button still works and creates a ballot. No success message appears in the default address tab.

The handler clears storage and some state, but not `choices`, `lookupErr`, or `outside`. Its `notice` is rendered only inside the manual form. Separately, submitted lookups have no cancellation or generation guard: a response arriving after Clear could repopulate the ballot. That late-response case is a **code risk**, not a claimed live reproduction.

Source: [submitted lookup](/Users/iantaylor/Documents/political/ballot-nyc/app/onboarding/page.tsx:160), [manual-only notice](/Users/iantaylor/Documents/political/ballot-nyc/app/onboarding/page.tsx:471), [clear handler](/Users/iantaylor/Documents/political/ballot-nyc/app/onboarding/page.tsx:549).

**Fix / acceptance:** reset all lookup UI, cancel or invalidate pending requests, and announce confirmation in either tab. Test Clear after a match, ambiguity, error, outside-city result, and while a request is pending. Navigation/reload must not revive cleared answers or address information.

### R2-05 · P2 · Saved priority weighting cannot be reset to none

**Live + code; existing behavior still unresolved.** Save Rent & Housing and Climate, reopen Edit, then remove both. “See my matches” becomes disabled. “Skip — just show me” returns results with **both old priorities restored**. The page promises “up to 3,” but there is no way to save zero without clearing all site data.

Source: [disabled save and skip](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/priorities/page.tsx:173).

**Fix / acceptance:** allow saving an empty selection or provide an explicit “Use equal weighting / reset priorities” action. Make “Skip” semantics clear when edits or previous saved choices exist. Verify the empty state survives reopening, and distinguish equal scoring weights from auto-selected topics on the share card.

### R2-06 · P2 · Date fixes are not applied consistently

**Deterministic logic + code; partial B11 fix.** At `2026-09-18T00:30:00Z` (September 17, 8:30 PM in New York), the new helper returns **47 calendar days** until November 3, while ShareCard returns **46**. ShareCard still rounds a UTC-midnight interval. The new `NextDeadline` calendar arithmetic passes the tested boundaries, but its effect still runs only once: a homepage left open across midnight can retain yesterday’s deadline text. The dates page refreshes every ten minutes, so it can also lag a boundary briefly.

Source: [ShareCard](/Users/iantaylor/Documents/political/ballot-nyc/components/ShareCard.tsx:32), [NextDeadline](/Users/iantaylor/Documents/political/ballot-nyc/components/NextDeadline.tsx:22). Exact deterministic cases are in the logic evidence file.

**Fix / acceptance:** use the same New York calendar-day helper for “days left,” keeping duration-to-polls-close deliberately distinct. Refresh at the next date/deadline boundary and when a suspended tab becomes visible. Check 8:30 PM, midnight, the DST transition, and 9 PM on Election Day. After the election, avoid a permanently zero-countdown “upcoming” experience.

### R2-07 · P1 · Moving-address guidance still collapses two different processes

**Live copy + official-source comparison; carried forward from the first audit’s additional risks.** Plan step 1 combines new registration and address updates under October 24. The FAQ still says that anyone who moved within NY should “re-register” by that date. The NYS BOE separately explains changes for existing registrations and says address-change notices received at least 15 days before an election must be processed in time. October 24 is the general registration deadline, not a complete explanation of moving-address processing. [Official registration and voting deadlines](https://elections.ny.gov/registration-and-voting-deadlines).

Source: [plan step](/Users/iantaylor/Documents/political/ballot-nyc/app/plan/page.tsx:25), [moving FAQ](/Users/iantaylor/Documents/political/ballot-nyc/app/plan/page.tsx:69).

**Fix / acceptance:** separate “Register for the first time” from “Already registered and moved,” link to official update guidance, and encourage checking the current record and contacting the board for late moves. Do not convert the 15-day processing rule into a claim that someone moving later cannot vote. Have the final wording checked against current BOE guidance in both locations.

### R2-08 · P2 · Small hover text still uses the failing orange/cream pair

**Code + contrast calculation; partial B10 fix, not a complete accessibility certification.** The darker stamp and priority-row colors improve the default states. Address-choice buttons still switch 14px semibold street names and 12px captions to cream on bright orange on hover. The full-opacity pair is **3.030:1**; the faded caption is worse. The unselected priority tiles also retain the bright hover treatment.

Source: [address choices](/Users/iantaylor/Documents/political/ballot-nyc/app/onboarding/page.tsx:407), [priority tiles](/Users/iantaylor/Documents/political/ballot-nyc/app/quiz/priorities/page.tsx:157). The new deep orange measures **4.765:1** against paper. [W3C minimum contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

**Fix / acceptance:** use ink or the accessible dark-orange treatment for normal-sized text in active hover/focus states. Check computed text size, weight, opacity, and actual background. Large display text and disabled controls should not be counted as the same failure.

### R2-09 · P3 · One moderate transitive dependency advisory remains

**Dependency audit.** The old Next.js critical/high findings were not present in this run. The remaining item is `baseline-browser-mapping`, affected range `>=2.0.0 <2.11.0`, with a fix available. It concerns process termination on invalid input. [Advisory GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv).

**Fix / acceptance:** update the affected transitive tooling dependency/lockfile and rerun the audit and build. Treat this as dependency hygiene unless a reachable production path is established; this audit did not demonstrate a public-site exploit. The old report’s “B07 — needs npm” entry is superseded by the later upgrade commits and this result.

## Status of the original 13 issues

| Original ID | Second-pass status |
|---|---|
| B01 — early voting sites | Fixed in current copy and key-date data; assigned-site distinction is present. |
| B02 — registration CTA | Fixed; registration and checking status lead to different appropriate pages. Moving-address wording is separately R2-07. |
| B03 — NYC boundary | Fixed for new sampled Albany/Yonkers lookups. Legacy saved-address migration remains a risk below. |
| B04 — merged districts | Fixed in source: successful lookup replaces the complete district object. Partial upstream failure was not artificially injected live. |
| B05 — manual borough / old address | Fixed in live retest; old identity and deep link cleared. |
| B06 — hidden candidates | Omission fixed: all 25 entries appeared on the sampled Manhattan results. Research-status semantics still fail for partial answers: R2-01. |
| B07 — dependencies | Major upgrade completed; earlier critical/high audit findings absent. Moderate maintenance item remains: R2-09. |
| B08 — completeness promise | Acquisition copy and scope explanation improved. Ballot-page local-contest limitation still comes after the race list; make it visible at the decision point. |
| B09 — mobile preview | Document overflow fixed; card clipping remains: R2-02. |
| B10 — contrast | Default stamps/selected rows improved; smaller hover states remain: R2-08. |
| B11 — date logic | Main helper fixed and tested; share-card and open-tab consistency remain: R2-06. |
| B12 — invalid race | Fixed: tested URL returns HTTP 404. |
| B13 — nearby addresses | Sample regression fixed: `9999 Bond St` no longer offers distant buildings; misleading same-district assurance removed. A nearby building still cannot establish the user’s exact district near a boundary. |

## Other risks and verification still needed

- **Exports:** results now have busy/error handling and non-cancellation fallback, which addresses the first audit’s code weakness. Actual PNG saving, iOS share-sheet behavior, camera-roll wording, and calendar import still need physical-device checks. The previous browser download observer did not establish that a saved file arrived. Do not mark native exports passed from button clicks alone.
- **Sharing the tool:** the new quiz-independent share action is valuable. `ShareLink` catches every error without visible recovery, including denied clipboard access. Offer a selectable URL or copy fallback for failures other than user cancellation. This is source-confirmed error handling, not a reproduced permission-denial failure. [ShareLink](/Users/iantaylor/Documents/political/ballot-nyc/components/ShareLink.tsx:11).
- **Partner embed:** fallback link is now present. Verify it on a separate publisher origin, in a restrictive iframe, with popup blocking and a narrow 340px-high embed. Check that editing the address after one submit updates the fallback target. No full publisher/browser matrix was completed here.
- **Stored data and multiple tabs:** validation now catches several invalid shapes, but it does not enforce every district type, known quiz ID/value, or priority enum. Existing non-NYC saved home addresses are not migrated as one unit with districts. No storage-event subscription updates another open tab after Clear. These are hardening/migration risks, not claims of observed corruption in this pass.
- **Manual ballot coherence:** individual district menus are limited to covered IDs, but do not enforce geographically compatible combinations. Label the result as manually selected, make the official check easy, and consider warning about obvious borough conflicts without pretending every legislative district lies in just one borough.
- **Editorial completeness:** candidate research files did not change in this batch. The first audit’s counts therefore remain relevant: 22 of 209 entries scorable on quiz topics, 16 of 114 races with any scorable candidate, and 5 races fully covered. No fresh row-by-row reconciliation of all candidate names, positions, proposals, and official certification was completed.
- **Accessibility / resilience:** physical mobile Safari/Chrome, full screen-reader navigation, text zoom, reduced motion, offline behavior, blocked storage, and slow upstream recovery are not signed off. Priorities now expose pressed state and descriptive reorder/remove controls; plan checkboxes have contextual names. Those improvements do not resolve R2-03.
- **Build maintenance:** investigate the font-override warning and replace deprecated Edge Runtime where appropriate. Keep a successful default production-build check in the normal deployment environment; the successful webpack fallback here is useful but does not exercise Turbopack.

## Highest-value next improvements

These are product proposals, not measured conversion or turnout gains.

| Order | Improvement | Concrete next version / success check |
|---|---|---|
| 1 | Put the primary task in the first screen | At 320 × 740, “Build my ballot” starts around y=888. Move an address/ballot action above the long countdown/deadline stack. Offer “Continue my ballot” when one is saved. Check first-time and returning journeys with people who have not seen the site. |
| 2 | Make research depth visible and useful | Add evidence-by-issue, last-reviewed dates, and a short scoring explanation. A one-issue 95% should clearly read as a limited comparison. Add “Not sure / skip this question” rather than only “skip the rest.” Prioritize comparable coverage within races over adding one isolated profile to many races. |
| 3 | Turn the checklist into an actual voting plan | Let users choose method, day/time, and their verified site; then export that plan with the correct hours and official link. Keep data local. A checkbox saying “Pick when, where, how” does not record any of those decisions. |
| 4 | Add a practical ballot companion | Provide a printable/phone-friendly checklist of races and proposals, clearly separated from an official ballot. Put the local-race coverage warning and official sample-ballot check near the ballot headline. Help voters notice Civil Court and multi-seat judge instructions. |
| 5 | Reduce navigation and long-page effort | Add persistent access to Ballot, Dates, and Plan; add proposal/race jump links. In the 375px full-quiz check, the results document was about 5,343px high and the plan action began around y=5,017. Keep every candidate visible but use compact research-status sections and an earlier plan action. Link to a specific candidate/evidence section from that candidate’s result. |
| 6 | Build a trustworthy editorial workflow | Track source, publication date, last check, scope, and confidence for each claim. Maintain a correction workflow and distinguish certified ballot presence from curated policy research. Recheck official guidance before voting begins and define a post-election state. |
| 7 | Make distribution accessible | Prioritize Spanish with reviewed voting-language translations, an accessible partner embed, and ordinary link sharing that works without quiz completion or clipboard permission. Retain the distinctive typography while completing contrast/focus/mobile QA. |

## Suggested next fix batch

1. Correct R2-01 and R2-07 before further promotion: results must describe the evidence accurately and moving voters need appropriately qualified guidance.
2. Resolve R2-02 through R2-06 and R2-08 as one interaction/accessibility pass. Add meaningful regression coverage for partial quiz results, preview mounting after hydration, question focus after animation, clearing stale/in-flight lookups, saving empty priorities, and calendar boundaries.
3. Refresh the remaining dependency, then verify the default production build in its normal environment and native exports on actual devices.
4. Start the product work with the first-screen ballot action, research transparency/coverage, and a plan that stores a concrete voting decision.

Do not close a finding solely because source code now contains an intended fix. Re-run its reproduction and acceptance check; the clipped preview and outgoing-heading focus both survived apparently reasonable fixes.
