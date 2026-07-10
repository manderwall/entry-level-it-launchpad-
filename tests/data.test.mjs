import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

function loadJSON(name) {
  return JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url)));
}

test("every file in data/ is valid JSON", () => {
  const files = readdirSync(new URL("../data/", import.meta.url)).filter((f) => f.endsWith(".json"));
  assert.ok(files.length >= 12, "expected at least 12 data files");
  for (const file of files) {
    assert.doesNotThrow(() => loadJSON(file), `${file} should parse as JSON`);
  }
});

test("roles.json has 5 ranked roles with required fields", () => {
  const roles = loadJSON("roles.json");
  assert.equal(roles.length, 5);
  const ranks = roles.map((r) => r.rank).sort();
  assert.deepEqual(ranks, [1, 2, 3, 4, 5]);
  for (const r of roles) {
    for (const key of ["role", "whyFit", "payTarget", "payType", "payMin", "payMax", "remoteOdds", "typicalWork", "searchTerms"]) {
      assert.ok(key in r, `role "${r.role}" missing "${key}"`);
    }
    assert.ok(["hourly", "salary"].includes(r.payType));
    assert.ok(r.payMax >= r.payMin);
    assert.ok(Array.isArray(r.searchTerms) && r.searchTerms.length > 0);
  }
});

test("houston-zones.json zones each have transit + pay data", () => {
  const { zones } = loadJSON("houston-zones.json");
  assert.ok(zones.length >= 5);
  for (const z of zones) {
    for (const key of ["id", "name", "areas", "whatsThere", "transit", "payRange", "payMin", "payMax"]) {
      assert.ok(key in z, `zone "${z.name}" missing "${key}"`);
    }
    assert.ok(z.payMax >= z.payMin);
  }
});

test("job-boards.json entries have at least one usable URL template", () => {
  const boards = loadJSON("job-boards.json");
  assert.ok(boards.length > 0);
  for (const b of boards) {
    assert.ok(b.remoteUrlTemplate || b.localUrlTemplate, `${b.name} has no URL template`);
    const template = b.remoteUrlTemplate || b.localUrlTemplate;
    assert.match(template, /^https:\/\//);
  }
});

test("application-scorecard.json points sum matches maxScore", () => {
  const scorecard = loadJSON("application-scorecard.json");
  const sum = scorecard.questions.reduce((acc, q) => acc + q.points, 0);
  assert.equal(sum, scorecard.maxScore);
  assert.ok(scorecard.prioritizeThreshold <= scorecard.maxScore);
});

test("certs.json certifications have positive cost and prep time", () => {
  const certs = loadJSON("certs.json");
  assert.ok(certs.certifications.length > 0);
  for (const c of certs.certifications) {
    assert.ok(c.cost > 0, `${c.name} should have a positive cost`);
    assert.ok(c.prepTime && c.prepTime.length > 0);
  }
});

test("certs.json alreadyEarned entries have a resume bullet and no cost field", () => {
  const certs = loadJSON("certs.json");
  assert.ok(certs.alreadyEarned.length > 0);
  for (const c of certs.alreadyEarned) {
    assert.ok(c.name && c.resumeBullet, `${c.id} missing name/resumeBullet`);
    assert.ok(!("cost" in c), `${c.id} is something you already have, not something to buy`);
  }
});

test("weekly-tracker-schema.json exampleRow has a value for every column", () => {
  const schema = loadJSON("weekly-tracker-schema.json");
  for (const col of schema.columns) {
    assert.ok(col.key in schema.exampleRow, `exampleRow missing column "${col.key}"`);
  }
  assert.ok(schema.paceNote && schema.paceNote.length > 0);
  for (const key of ["days1to2", "days3to7", "days8to14"]) {
    assert.ok(schema.twoWeekPlan[key].estimatedTime, `twoWeekPlan.${key} missing estimatedTime`);
  }
});

test("negotiation-scripts.json has non-empty scripts and rules", () => {
  const negotiation = loadJSON("negotiation-scripts.json");
  assert.ok(negotiation.intro.length > 0);
  assert.ok(negotiation.scripts.length > 0);
  for (const s of negotiation.scripts) {
    assert.ok(s.moment && s.moment.length > 0);
    assert.ok(s.script && s.script.length > 0);
  }
  assert.ok(negotiation.rules.length > 0);
});
