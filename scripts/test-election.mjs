// Deadline boundaries and scoring are tested without network or browser clocks.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
const root = path.resolve(import.meta.dirname, '..');
const cache = new Map();
function load(file) {
  if (!path.extname(file)) file += '.ts';
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const src = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'process', src)((spec) => load(path.resolve(path.dirname(file), spec)), module, module.exports, process);
  cache.set(file, module.exports);
  return module.exports;
}
const e = load(path.join(root, 'lib/election.ts'));
const n = load(path.join(root, 'lib/nyTime.ts'));
const scoring = load(path.join(root, 'lib/scoreQuiz.ts'));
const analytics = load(path.join(root, 'lib/analytics.ts'));
let count = 0;
function check(name, fn) { try { fn(); count++; } catch (err) { console.error(`FAIL ${name}: ${err.message}`); process.exitCode = 1; } }

// Every configured date: day before, the date itself, the exact cutoff, after.
for (const d of e.electionDates) {
  check(`${d.id}: before/on/after`, () => {
    const start = n.nyTime(d.date);
    assert.equal(e.deadlineStatus(d, start - 1), 'upcoming');
    assert.equal(e.deadlineStatus(d, start), 'today');
    const cutoff = e.deadlineCutoff(d);
    assert.equal(e.deadlineStatus(d, cutoff - 1), 'today');
    assert.equal(e.deadlineStatus(d, cutoff), 'passed');
    assert.equal(e.deadlineStatus(d, cutoff + 86400000), 'passed');
  });
}
check('registration remains open at 8:30 PM NY, expires at NY midnight', () => {
  assert.equal(e.electionState(Date.parse('2026-10-25T00:30:00Z')).registrationPassed, false);
  assert.equal(e.electionState(Date.parse('2026-10-25T04:00:00Z')).registrationPassed, true);
});
check('expired guidance does not urge new registration or address update by a past date', () => {
  const steps = e.planSteps(Date.parse('2026-10-30T16:00:00Z'));
  assert.match(steps[0].body, /deadline.*passed on Oct 24/);
  assert.match(steps[0].body, /processing date has passed/);
  assert.match(steps[0].body, /does not automatically make you ineligible/);
  assert.equal(steps[0].cta.href, e.ELECTION.registrationLookup);
  assert.doesNotMatch(steps[0].body, /so do it now|Register online by/);
});
check('on-deadline registration says today', () => assert.match(e.planSteps(n.nyTime('2026-10-24', 12))[0].body, /Oct 24 \(today\)/));
check('early voting does not begin early, and ends at 5 PM EST after DST change', () => {
  assert.equal(e.electionState(Date.parse('2026-10-24T03:59:59Z')).early, false);
  assert.equal(e.electionState(Date.parse('2026-10-24T04:00:00Z')).early, true);
  assert.equal(e.electionState(Date.parse('2026-11-01T21:59:59Z')).early, true);
  assert.equal(e.electionState(Date.parse('2026-11-01T22:00:00Z')).early, false);
});
check('November 2 offers Election Day, not early voting', () => {
  assert.match(e.planSteps(n.nyTime('2026-11-02', 12))[2].body, /Early voting has ended/);
  assert.doesNotMatch(e.planSteps(n.nyTime('2026-11-02', 12))[2].body, /period runs through/);
});
check('archive starts exactly at polls close; no stale voting invitation', () => {
  const closing = Date.parse('2026-11-04T02:00:00Z');
  assert.equal(e.electionState(closing - 1).archived, false);
  assert.equal(e.electionState(closing).archived, true);
  assert.match(e.planSteps(closing)[2].body, /has ended/);
  assert.notEqual(e.planSteps(closing)[2].cta.href, e.ELECTION.pollSite);
});
check('open-tab refresh schedules NY midnight and exact closing boundary', () => {
  assert.equal(e.nextElectionBoundary(Date.parse('2026-10-25T03:59:00Z')), Date.parse('2026-10-25T04:00:00Z'));
  assert.equal(e.nextElectionBoundary(Date.parse('2026-11-01T21:59:00Z')), Date.parse('2026-11-01T22:00:00Z'));
  assert.equal(e.nextElectionBoundary(Date.parse('2026-11-04T01:59:00Z')), Date.parse('2026-11-04T02:00:00Z'));
});

const qs = [{ id:'a', tag:'rent_housing' }, { id:'b', tag:'climate' }, { id:'c', tag:'healthcare' }];
const candidate = { positions: [{ tag:'rent_housing', value:100 }, { tag:'climate', value:0 }] };
check('scoring: exact/opposite, missing evidence, and unequal issue weights', () => {
  assert.deepEqual(scoring.scoreCandidate(candidate, {a:100,b:0,c:50}, qs), {match:100,overlap:2});
  assert.deepEqual(scoring.scoreCandidate(candidate, {a:0,b:100}, qs), {match:0,overlap:2});
  assert.deepEqual(scoring.scoreCandidate(candidate, {a:100,b:100}, qs), {match:50,overlap:2});
  assert.deepEqual(scoring.scoreCandidate(candidate, {a:100,b:100}, qs, ['rent_housing']), {match:67,overlap:2});
});
check('skip removes old answer immutably and does not become neutral or disagreement', () => {
  const old = {a:100,b:100};
  const skipped = scoring.withoutQuizAnswers(old, ['b']);
  assert.deepEqual(old, {a:100,b:100});
  assert.deepEqual(skipped, {a:100});
  assert.deepEqual(scoring.scoreCandidate(candidate, skipped, qs), {match:100,overlap:1});
  assert.deepEqual(scoring.scoreCandidate(candidate, {}, qs), {match:0,overlap:0});
  assert.deepEqual(scoring.scoreCandidate({positions:[]}, {a:100}, qs), {match:0,overlap:0});
});
check('priority ordering does not change weights', () => {
  assert.deepEqual(scoring.scoreCandidate(candidate,{a:80,b:40},qs,['climate','rent_housing']), scoring.scoreCandidate(candidate,{a:80,b:40},qs,['rent_housing','climate']));
});
check('private routes excluded, public URLs strip query/fragment', () => {
  for (const p of ['/onboarding', '/ballot', '/quiz', '/quiz/results', '/quiz/priorities', '/plan', '/embed']) assert.equal(analytics.analyticsPath(p+'?address=private#answers'), null);
  assert.equal(analytics.analyticsPath('/?address=private#a=secret'), '/');
  assert.equal(analytics.analyticsPath('/race/governor/statewide-ny?address=private'), '/race/governor/statewide-ny');
});
console.log(`${count} election/scoring/privacy checks passed`);
