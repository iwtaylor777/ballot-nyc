// Regression tests for quiz result semantics and date arithmetic.
// Run: npm run test:quiz
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import ts from "typescript";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-"));
for (const f of ["quizStatus", "nyTime", "scoreQuiz"]) {
  const src = fs.readFileSync(path.join(root, "lib", `${f}.ts`), "utf8");
  const js = ts
    .transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    })
    .outputText.replace(/from "\.\/(types|quizStatus|nyTime)"/g, 'from "./$1.mjs"');
  fs.writeFileSync(path.join(out, `${f}.mjs`), js);
}
fs.writeFileSync(path.join(out, "types.mjs"), "export {};\n");
const q = await import(pathToFileURL(path.join(out, "quizStatus.mjs")).href);
const t = await import(pathToFileURL(path.join(out, "nyTime.mjs")).href);

let n = 0;
const check = (name, fn) => {
  try {
    fn();
    n++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
};

const researched = { positions: [{ tag: "rent_housing" }] };
const bare = { positions: [] };

// The bug the second audit found: a one-answer quiz labelled researched
// candidates as unresearched.
check("researched but no overlap is its own state", () =>
  assert.equal(q.candidateStatus(researched, 0, false), "no_overlap"),
);
check("no research at all", () => assert.equal(q.candidateStatus(bare, 0, false), "unresearched"));
check("scored", () => assert.equal(q.candidateStatus(researched, 3, false), "scored"));
check("judicial is never scored", () => {
  assert.equal(q.candidateStatus(researched, 3, true), "judicial");
  assert.equal(q.candidateStatus(bare, 0, true), "judicial");
});

check("coverage separates researched from comparable", () => {
  const counts = q.coverageCounts([
    { ...researched, overlap: 2, judicial: false },
    { ...researched, overlap: 0, judicial: false }, // researched, not asked about
    { ...bare, overlap: 0, judicial: false },
    { ...researched, overlap: 0, judicial: true },
  ]);
  assert.deepEqual(counts, { total: 4, researched: 2, comparable: 1, judicial: 1 });
});

check("labels are distinct", () => {
  const labels = Object.values(q.STATUS_LABEL);
  assert.equal(new Set(labels).size, labels.length);
});

// Date arithmetic: the share card and the pages must agree.
check("8:30 PM in New York is still the previous day", () => {
  const eveningBefore = Date.parse("2026-09-18T00:30:00Z"); // Sept 17, 8:30 PM ET
  assert.equal(t.nyToday(eveningBefore), "2026-09-17");
  assert.equal(t.daysUntil("2026-11-03", eveningBefore), 47);
});
check("after New York midnight the count drops", () => {
  const afterMidnight = Date.parse("2026-09-18T04:30:00Z"); // Sept 18, 12:30 AM ET
  assert.equal(t.daysUntil("2026-11-03", afterMidnight), 46);
});
check("deadline day lasts until New York midnight", () => {
  assert.equal(t.isOnOrBefore("2026-10-24", Date.parse("2026-10-25T03:30:00Z")), true); // 11:30 PM ET
  assert.equal(t.isOnOrBefore("2026-10-24", Date.parse("2026-10-25T04:30:00Z")), false); // 12:30 AM ET
});
check("polls close 9 PM New York, DST-correct", () => {
  assert.equal(new Date(t.pollsClose("2026-11-03")).toISOString(), "2026-11-04T02:00:00.000Z"); // EST
  assert.equal(new Date(t.pollsClose("2026-06-23")).toISOString(), "2026-06-24T01:00:00.000Z"); // EDT
});

fs.rmSync(out, { recursive: true, force: true });
console.log(process.exitCode ? "quiz tests FAILED" : `quiz tests passed (${n})`);
