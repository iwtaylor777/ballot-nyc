// Acceptance checks that run the real pages in a real browser. Build the
// harness first:
//
//   npm run build                 # so the self-hosted fonts exist
//   node scripts/ui-harness.mjs
//   node scripts/ui-checks.mjs
//
// Needs Playwright: npm i -D playwright && npx playwright install chromium
// HARNESS / CHROMIUM_PATH / PLAYWRIGHT_MODULE override the defaults.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let pw;
try {
  pw = require(process.env.PLAYWRIGHT_MODULE || "playwright");
} catch {
  console.error("Playwright is not installed.\n  npm i -D playwright && npx playwright install chromium");
  process.exit(2);
}
const { chromium } = pw;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HARNESS = process.env.HARNESS || `file://${path.join(ROOT, ".preview-tmp/harness.html")}`;

const DISTRICTS = { us_house: "ush-10", state_senate: "ss-26", state_assembly: "ad-52", judicial: "jd-2" };
const FULL = {
  quiz: { "q-rent": 75, "q-transit": 75, "q-safety": 40, "q-climate": 70, "q-edu": 80, "q-healthcare": 75, "q-immigration": 65 },
  priorities: ["rent_housing", "transit_fares", "climate"],
  districts: DISTRICTS,
};
const ONE = { quiz: { "q-rent": 75 }, priorities: [], districts: DISTRICTS };
const HEADING = "h1[tabindex='-1'], h2[tabindex='-1']";

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name} — ${detail}`);
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
page.on("pageerror", (e) => check("no page errors", false, e.message));
await page.goto(HARNESS);

async function mount(name, fixture) {
  await page.evaluate(([n, f]) => window.__mount(n, f), [name, fixture]);
  await page.waitForFunction(() => document.getElementById("root").children.length > 0, null, { timeout: 5000 });
  await page.waitForTimeout(150);
}

const measurePreview = () =>
  page.evaluate(() => {
    const box = document.querySelector('[style*="aspect-ratio"]');
    if (!box) return null;
    const inner = box.firstElementChild;
    const br = box.getBoundingClientRect();
    const ir = inner.getBoundingClientRect();
    return { boxClientWidth: box.clientWidth, innerWidth: ir.width, innerHeight: ir.height, transform: inner.style.transform, overflowRight: ir.right - br.right };
  });

// The share-card preview has to fit the phone it is on, at every width.
for (const width of [320, 375, 414]) {
  await page.setViewportSize({ width, height: 900 });
  await mount("results", FULL);
  const m = await measurePreview();
  if (!m) { check(`preview fits at ${width}`, false, "no preview element"); continue; }
  const fits = Math.abs(m.innerWidth - m.boxClientWidth) <= 1.5;
  const noClip = m.overflowRight <= 1.5;
  const tall = Math.abs(m.innerHeight - (m.boxClientWidth * 1920) / 1080) <= 3;
  check(`preview fits at ${width}`, fits && noClip && tall, `box ${m.boxClientWidth.toFixed(0)}, card ${m.innerWidth.toFixed(0)}×${m.innerHeight.toFixed(0)}, ${m.transform}`);
}

await page.setViewportSize({ width: 414, height: 900 });
await mount("results", FULL);
const before = await measurePreview();
await page.setViewportSize({ width: 320, height: 900 });
await page.waitForTimeout(300);
const after = await measurePreview();
check("preview refits when the window changes", Math.abs(after.innerWidth - after.boxClientWidth) <= 1.5 && after.innerWidth < before.innerWidth, `${before.innerWidth.toFixed(0)} → ${after.innerWidth.toFixed(0)} (box ${after.boxClientWidth.toFixed(0)})`);

// Every candidate is in exactly one of: scored, researched-but-no-overlap,
// unresearched, judicial — and the coverage sentence has to match the rows.
await page.setViewportSize({ width: 375, height: 900 });
const readResults = () =>
  page.evaluate(() => ({
    rows: [...document.querySelectorAll("a[href^='/race/']")].map((a) => ({ name: a.querySelector("div")?.innerText || "", right: a.lastElementChild?.innerText || "" })),
    coverage: [...document.querySelectorAll("p")].map((p) => p.innerText).find((t) => t.includes("Your ballot has")),
  }));

await mount("results", ONE);
const one = await readResults();
const pct = one.rows.filter((r) => /%/.test(r.right));
const label = (s) => one.rows.filter((r) => r.right.includes(s));
check("one answer: coverage sentence reads singular", /one question you answered/.test(one.coverage || ""), one.coverage || "missing");
check("one answer: researched but not comparable is its own label", label("NOT ON YOUR ANSWERS").length > 0, `${label("NOT ON YOUR ANSWERS").length} rows`);
check("one answer: unresearched candidates say so", label("NO POSITIONS RESEARCHED").length > 0, `${label("NO POSITIONS RESEARCHED").length} rows`);
check("one answer: judicial candidates are not scored", label("NOT SCORED").length > 0, `${label("NOT SCORED").length} rows`);
check("no row shows both a score and a status", pct.every((r) => !/NOT ON YOUR ANSWERS|NO POSITIONS RESEARCHED|NOT SCORED/.test(r.right)), `${pct.length} scored rows`);
const nums = (one.coverage || "").match(/(\d+) candidates.*?for (\d+), and (\d+)/s);
if (nums) {
  const [, total, researched, comparable] = nums.map(Number);
  check("coverage numbers match the rows on screen", total === one.rows.length && comparable === pct.length && researched >= comparable, `total ${total}/rows ${one.rows.length}, comparable ${comparable}/scored ${pct.length}, researched ${researched}`);
} else check("coverage numbers parse", false, one.coverage || "missing");

await mount("results", FULL);
const full = await readResults();
const fullPct = full.rows.filter((r) => /%/.test(r.right));
check("answering everything makes more candidates comparable", fullPct.length > pct.length, `${pct.length} → ${fullPct.length}`);
check("scored rows show the issues they are based on", fullPct.every((r) => /OF 7 ISSUES/.test(r.right)), fullPct[0]?.right.replace(/\n/g, " ") || "none");
check("judicial stays unscored with every answer in", full.rows.some((r) => r.right.includes("NOT SCORED")), `${full.rows.filter((r) => r.right.includes("NOT SCORED")).length} rows`);

// Focus has to land on the question that is on screen, not the one leaving.
await mount("quiz", { quiz: {} });
const q1 = await page.evaluate((s) => document.querySelector(s)?.innerText || "", HEADING);
const atMount = await page.evaluate(() => document.activeElement?.tagName);
check("first render does not steal focus", atMount === "BODY", `activeElement ${atMount}`);
await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => !/PREVIOUS|SKIP|BACK/i.test(b.innerText))[0].click());
await page.waitForTimeout(900);
const focused = await page.evaluate((s) => {
  const el = document.activeElement;
  const heads = [...document.querySelectorAll(s)].map((h) => h.innerText);
  return { tag: el?.tagName, text: el?.innerText || "", inDom: !!(el && document.body.contains(el)), heads };
}, HEADING);
check("answering moves focus to the new question", focused.inDom && /^H[12]$/.test(focused.tag || "") && focused.text !== q1 && focused.heads.length === 1 && focused.heads[0] === focused.text, `"${q1.slice(0, 22)}" → "${focused.text.slice(0, 30)}" (${focused.tag})`);

await page.evaluate(() => document.activeElement?.blur?.());
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /PREVIOUS/i.test(b.innerText))?.click());
await page.waitForTimeout(900);
const back = await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.innerText || "", inDom: document.body.contains(document.activeElement) }));
check("going back focuses the question it brings back", back.inDom && /^H[12]$/.test(back.tag || "") && back.text.trim() === q1.trim(), `"${back.text.slice(0, 30)}"`);

// Priorities are optional; saving none is a real choice.
await mount("priorities", { priorities: [], quiz: {}, districts: DISTRICTS });
const prio = await page.evaluate(() => ({
  btns: [...document.querySelectorAll("button")].map((b) => ({ text: b.innerText.replace(/\n/g, " "), disabled: b.disabled })),
  links: [...document.querySelectorAll("a")].map((a) => a.innerText.replace(/\n/g, " ")),
}));
const saveBtn = prio.btns.find((b) => /EQUALLY|SEE MY MATCHES|SAVE/i.test(b.text));
check("nothing picked still saves", !!saveBtn && !saveBtn.disabled, JSON.stringify(saveBtn));
check("the empty save says what it will do", /WEIGH EVERYTHING EQUALLY/i.test(saveBtn?.text || ""), saveBtn?.text || "none");
check("cancel is distinct from save", prio.links.some((l) => /CANCEL — KEEP MY LAST PICKS/.test(l)), prio.links.find((l) => /CANCEL/.test(l)) || "none");
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /CLIMATE/i.test(b.innerText))?.click());
await page.waitForTimeout(200);
const picked = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => ({ text: b.innerText.replace(/\n/g, " "), disabled: b.disabled })).find((b) => /EQUALLY|SEE MY MATCHES|SAVE/i.test(b.text)));
check("the label changes once something is picked", /SEE MY MATCHES/i.test(picked?.text || "") && !picked?.disabled, picked?.text || "none");

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} UI checks passed`);
if (failed.length) { console.log("failed: " + failed.map((f) => f.name).join(", ")); process.exit(1); }
