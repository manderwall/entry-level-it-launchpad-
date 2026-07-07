// Unit tests for pure/near-pure logic, as opposed to tests/data.test.mjs
// (which validates data/*.json shapes) or manual Playwright smoke passes
// (which cover full-page rendering). Node has no DOM, so this only
// imports modules that don't execute DOM-touching code at module top
// level — common.mjs, settings.mjs, progress.mjs define functions/consts
// only and are safe; the page-entry .mjs files (index.mjs, roles.mjs,
// etc.) call renderChrome() immediately on import and would need a real
// browser, so they're covered by Playwright instead, not here.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../common.mjs";

describe("escapeHtml", () => {
  test("escapes all five reserved HTML characters", () => {
    assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
  });

  test("leaves plain text untouched", () => {
    assert.equal(escapeHtml("CompTIA A+ certified"), "CompTIA A+ certified");
  });

  test("neutralizes a script-tag injection attempt", () => {
    const input = '<script>alert(1)</script>';
    const out = escapeHtml(input);
    assert.ok(!out.includes("<script>"), "raw <script> tag must not survive escaping");
    assert.equal(out, "&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  test("coerces non-string input instead of throwing", () => {
    assert.equal(escapeHtml(42), "42");
    assert.equal(escapeHtml(null), "null");
  });
});

// --- settings.mjs needs minimal localStorage + document stubs, since it
// touches both inside function bodies (never at module top level, which
// is what makes it safe to import at all in a DOM-less environment).
function installBrowserStubs() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const classes = new Set();
  const attrs = new Map();
  const dispatched = [];
  globalThis.document = {
    documentElement: {
      classList: {
        add: (...names) => names.forEach((n) => classes.add(n)),
        remove: (...names) => names.forEach((n) => classes.delete(n)),
        toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
        contains: (name) => classes.has(name),
      },
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
      getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
    },
    dispatchEvent: (evt) => dispatched.push(evt),
  };
  return { store, classes, attrs, dispatched };
}

describe("settings.mjs", () => {
  test("getSettings returns documented defaults when localStorage is empty", async () => {
    installBrowserStubs();
    const { getSettings } = await import(`../settings.mjs?t=${Date.now()}-a`);
    const s = getSettings();
    assert.equal(s.payFloor, 19, "the $19 Foxconn-based default must stay the fallback");
    assert.equal(s.theme, "auto");
    assert.equal(s.dyslexiaFont, false);
  });

  test("saveSettings merges into existing settings instead of replacing them", async () => {
    installBrowserStubs();
    const { getSettings, saveSettings } = await import(`../settings.mjs?t=${Date.now()}-b`);
    saveSettings({ payFloor: 25 });
    saveSettings({ city: "Houston, TX" });
    const s = getSettings();
    assert.equal(s.payFloor, 25, "earlier saved field must survive a later unrelated save");
    assert.equal(s.city, "Houston, TX");
  });

  test("applyAccessibility sets data-theme only for explicit light/dark, not auto", async () => {
    const stubs = installBrowserStubs();
    const { saveSettings } = await import(`../settings.mjs?t=${Date.now()}-c`);
    saveSettings({ theme: "dark" });
    assert.equal(stubs.attrs.get("data-theme"), "dark");
    saveSettings({ theme: "auto" });
    assert.equal(stubs.attrs.has("data-theme"), false, "auto must not force either theme via the attribute");
  });

  test("applyAccessibility toggles font-scale classes correctly, never both at once", async () => {
    const stubs = installBrowserStubs();
    const { saveSettings } = await import(`../settings.mjs?t=${Date.now()}-d`);
    saveSettings({ fontScale: "xlarge" });
    assert.ok(stubs.classes.has("font-xlarge"));
    assert.ok(!stubs.classes.has("font-large"));
    saveSettings({ fontScale: "large" });
    assert.ok(stubs.classes.has("font-large"));
    assert.ok(!stubs.classes.has("font-xlarge"), "switching to large must clear the previous xlarge class");
  });

  test("corrupt localStorage JSON falls back to defaults instead of throwing", async () => {
    installBrowserStubs();
    globalThis.localStorage.setItem("entry-level-it-launchpad:settings", "{not valid json");
    const { getSettings } = await import(`../settings.mjs?t=${Date.now()}-e`);
    assert.doesNotThrow(() => getSettings());
    assert.equal(getSettings().payFloor, 19);
  });
});

describe("progress.mjs MILESTONES", () => {
  test("every milestone has a unique id and points at a real page", async () => {
    installBrowserStubs();
    const { MILESTONES } = await import(`../progress.mjs?t=${Date.now()}`);
    const ids = MILESTONES.map((m) => m.id);
    assert.equal(new Set(ids).size, ids.length, "milestone ids must be unique");
    for (const m of MILESTONES) {
      assert.ok(m.page.endsWith(".html"), `milestone "${m.id}" should point at an .html page`);
    }
  });
});
