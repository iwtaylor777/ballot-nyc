// Regression tests for address parsing/matching (lib/geo).
// Run: npm run test:geo   (no network; uses the project's TypeScript to transpile)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import ts from "typescript";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "geo-"));
for (const f of ["address", "places", "resolve"]) {
  const src = fs.readFileSync(path.join(root, "lib/geo", `${f}.ts`), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText.replace(/from "\.\/(address|places)"/g, 'from "./$1.mjs"');
  fs.writeFileSync(path.join(out, `${f}.mjs`), js);
}
const a = await import(pathToFileURL(path.join(out, "address.mjs")).href);
const p = await import(pathToFileURL(path.join(out, "places.mjs")).href);
const r = await import(pathToFileURL(path.join(out, "resolve.mjs")).href);

let n = 0;
const t = (name, fn) => {
  try {
    fn();
    n++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
};

// Input normalization
t("queens typed with space", () => assert.equal(a.normalizeAddressInput("37 17 30th St"), "37-17 30th St"));
t("queens en dash", () => assert.equal(a.normalizeAddressInput("37–17 30th St"), "37-17 30th St"));
t("numbered street not hyphenated", () => assert.equal(a.normalizeAddressInput("350 55 St"), "350 55 St"));
t("apartment stripped", () => assert.equal(a.normalizeAddressInput("365 Bond St Apt 4B, Brooklyn"), "365 Bond St, Brooklyn"));
t("flushing is not a unit", () => assert.equal(a.normalizeAddressInput("100 Flushing Ave"), "100 Flushing Ave"));

// Parsing
t("no city", () => {
  const x = a.parseAddress("365 Bond St");
  assert.deepEqual([x.houseNumber, x.street, x.hasLocality], ["365", "Bond St", false]);
});
t("'New York' is a weak hint", () => {
  const x = a.parseAddress("365 Bond St, New York, NY");
  assert.deepEqual([x.weakManhattan, x.borough], [true, undefined]);
});
t("comma-less tail", () => {
  const x = a.parseAddress("365 bond st brooklyn ny 11231");
  assert.deepEqual([x.street, x.zip, x.borough], ["bond st", "11231", "Brooklyn"]);
});
t("New York Ave kept", () => assert.equal(a.parseAddress("123 New York Ave").street, "New York Ave"));
t("zip only", () => assert.equal(a.parseAddress("11231").zipOnly, true));

// Street matching (>= 10 means same street)
const same = (x, y) => a.compareStreets(x, y).score >= 10;
t("30th St ≠ 30th Ave", () => assert.equal(same("30th St", "30 AVENUE"), false));
t("5th Ave = 5 AVENUE", () => assert.equal(same("5th Ave", "5 AVENUE"), true));
t("St Marks = SAINT MARKS", () => assert.equal(same("St Marks Pl", "SAINT MARKS PLACE"), true));
t("E 7th ≠ W 7th", () => assert.equal(same("E 7th St", "WEST 7 STREET"), false));
t("W 4th ≠ 4th St", () => assert.equal(same("W 4th St", "4TH ST"), false));
t("typing street type", () => assert.equal(same("Bond S", "BOND STREET"), true));
t("typo tolerated", () => assert.equal(same("Bnod St", "BOND STREET"), true));
t("Bay St ≠ Bayridge Pkwy", () => assert.equal(same("Bay St", "BAYRIDGE PARKWAY"), false));

// Ranking never swaps in a different number or street
const mk = (hn, st, b, z) => ({ label: "", line1: "", houseNumber: hn, street: st, borough: b, zip: z, lat: 40.7, lon: -73.9 });
t("wrong-number fallbacks dropped", () => {
  const res = p.rankPlaces(a.parseAddress("37 17 30th St"), [
    mk("37-17", "30 STREET", "Queens", "11101"),
    mk("37-17", "30 AVENUE", "Queens", "11103"),
    mk("37-37", "30 STREET", "Queens", "11101"),
  ]);
  assert.deepEqual(res.exact.map((x) => x.street), ["30 STREET"]);
});
t("nearby only when no exact", () => {
  const res = p.rankPlaces(a.parseAddress("88-15 Parsons Blvd"), [
    mk("88-14", "PARSONS BOULEVARD", "Queens", "11432"),
    mk("88-30", "PARSONS BOULEVARD", "Queens", "11432"),
  ]);
  assert.equal(res.exact.length, 0);
  assert.equal(res.nearby[0].houseNumber, "88-14");
});
t("borough hint mismatch flagged", () => {
  const res = p.rankPlaces(a.parseAddress("365 Bond St, Manhattan"), [mk("365", "BOND STREET", "Brooklyn", "11231")]);
  assert.equal(res.hintMismatch, true);
});
t("queens number hyphenated for display", () => assert.equal(p.formatHouseNumber("3717", "Queens"), "37-17"));

// Census geographies → districts
t("districts from census", () => {
  const d = r.districtsFromGeographies({
    "119th Congressional Districts": [{ BASENAME: "10" }],
    "2024 State Legislative Districts - Upper": [{ BASENAME: "26" }],
    "2024 State Legislative Districts - Lower": [{ BASENAME: "52" }],
    Counties: [{ GEOID: "36047" }],
  });
  assert.deepEqual(d.districts, { us_house: "ush-10", state_senate: "ss-26", state_assembly: "ad-52", judicial: "jd-2" });
});

fs.rmSync(out, { recursive: true, force: true });
console.log(process.exitCode ? "geo tests FAILED" : `geo tests passed (${n})`);
