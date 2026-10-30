# UX + SEO/AEO update — October 30, 2026

Implemented locally from the supplied nine-part brief. Not deployed.

## Changes

1. **Date-aware guidance:** Home, Dates, and Plan share one election configuration and New York time calculations. Expired registration guidance points to checking existing registration. Address-change processing deadlines are explicitly distinguished from eligibility. Open tabs refresh at date/cutoff boundaries and on return from background. After polls close, the 2026 guide is labeled archived and active countdowns are removed or replaced.
2. **Homepage:** Shorter introduction and hero put Build my ballot ahead of the countdown and secondary actions, preserving the existing typography and colors.
3. **Guide limitations:** Independent-guide, omitted-contest, and eligibility caveats plus official sample-ballot verification appear before the race list.
4. **Public discovery:** Added `/races`, linking to the existing 114 race URLs. Shared navigation and homepage links expose races and proposals. Proposal and quiz headings/metadata now describe their contents.
5. **Long-page navigation:** Added Question 1–5 jump links, descriptive official-abstract and candidate/source link labels, and larger important supporting text. Preserved proposal structure and citations.
6. **Trust/privacy:** Added `/about` and `/privacy`, visible methodology/corrections links, review-date distinctions, and a saved-data reset. Disclosures explain lookup services, browser persistence, external links, analytics, and correction-email forwarding. Removed unqualified “no tracking” language.
7. **Quiz:** Added per-question uncertainty/skip. Skipping removes an earlier answer; skipping the rest clears remaining saved answers. Explained scoring, double weighting, missing information, and limits. Reframed overlapping housing options as priorities and accurately labeled general AP topic hubs.
8. **Lookup recovery:** Connection failures, service failures, invalid input, and no matches have distinct states. Retry retains input, with manual selection and borough disambiguation preserved.
9. **Public HTML/indexing:** Plan instructions and FAQ render in the initial server response. Personalized pages retain noindex and sitemap exclusion. Analytics permits only sanitized public-page paths; private flows are excluded. Added actual interface/methodology review dates without implying a fresh candidate/proposal fact check.

## Verification

- `npm run check`: passed type checking and 62 checks (27 geography, 10 quiz integration, 19 election/scoring/analytics, 6 lookup).
- `npx next build --webpack`: production build passed.
- `npm run test:public` against the final local production build: **154 HTML/link checks passed**, including all 114 race URLs, initial Plan instructions/FAQ and structured data, new public pages, proposal anchors, noindex/sitemap rules, and invalid-route 404s.
- Deadline checks cover before/on/at/after boundaries, New York midnight, the daylight-saving transition, final early-voting closure, Election Day polls closing, and archive behavior.
- Browser: Build my ballot spans y=368–435 at **1180×757** and y=392–459 at **390×844**; both fit completely in the first viewport without horizontal overflow.
- Browser: proposals fit **320px** width; Question 3 jump link lands at the corresponding section.
- Browser: with the local server deliberately unavailable, lookup shows **Connection problem**, retains the public test address, and exposes Retry/manual fallback. After restoring the server, Retry returns Manhattan/Brooklyn choices; selecting Manhattan opens the guide with the disclaimer before the race list.
- Browser: revisiting and skipping an answered quiz question removes that answer; skipping all remaining answers reaches the correct no-answers result.
- Final homepage browser log inspection returned no errors or warnings.
- `git diff --check`: passed.

Local screenshot evidence (ignored QA artifacts):

- `../.preview-tmp/home-mobile-2026-10-30.jpg`
- `../.preview-tmp/home-desktop-2026-10-30.jpg`

## Implementation notes and limits

- The root layout renders on request so date-sensitive public HTML cannot remain frozen at build time. This changes public pages from static delivery to server rendering; assess hosting/cache performance after deployment.
- Google Analytics was not configured in the local build. URL filtering and private-route exclusion were checked in code/tests; a real collector request and the production Google Analytics account’s enhanced-measurement settings were not inspected. Review those settings before relying on production analytics privacy guarantees.
- Existing candidate positions, ballot proposal claims, and candidate certification data were preserved, not independently re-researched. The About page makes the absence of recorded claim-by-claim review dates explicit. Scoring tests establish calculation behavior, not the editorial validity of each position’s numeric placement.
- Browser checks used the local production build and public test data. They are not a full screen-reader/device compatibility audit. Native share/download behavior was not re-tested in this pass.
- No production deployment, analytics-account change, or outbound communication was performed.

## Official guidance consulted

- [New York registration and voting deadlines](https://elections.ny.gov/registration-and-voting-deadlines)
- [NYC election dates and voting hours](https://vote.nyc/elections)
- [New York mail-ballot options](https://elections.ny.gov/request-ballot)

These support the date-sensitive registration, address-processing, early-voting, and election-day guidance. They do not imply a new review of every historical date or content claim in the repository.
