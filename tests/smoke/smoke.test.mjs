// Real-browser smoke suite (Playwright + Chromium), separate from the
// fast node:test data/logic suite so `npm test` stays instant and
// dependency-free for everyday work. Run with `npm run test:smoke`.
// Mirrors the pre-publish browser-smoke pass this project's sibling app
// (aplusstudyapp) runs before every release: crawl every page for
// console/page errors, confirm no mobile horizontal overflow, and
// exercise the interactive bits that are easy to silently break
// (tracker persistence, the computed next-step widget, the rejection
// nudge) instead of relying on a human re-clicking through it by hand.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const ROOT = new URL("../../", import.meta.url).pathname;
const PORT = 8931;
const BASE = `http://localhost:${PORT}`;

const MIME = {
  ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".txt": "text/plain", ".xml": "application/xml",
};

let server;
let browser;

before(async () => {
  server = createServer(async (req, res) => {
    try {
      const path = req.url.split("?")[0];
      const filePath = join(ROOT, path === "/" ? "index.html" : path.slice(1));
      let body = await readFile(filePath);
      if (path === "/common.mjs") {
        // The real Cloudflare Web Analytics beacon fires an unload-time
        // sendBeacon-style call to cloudflareinsights.com, which is
        // notoriously unreliable to intercept cleanly in browser
        // automation (route stubbing doesn't survive the unload timing
        // consistently) and only ever succeeds against the real
        // registered production domain anyway. These tests exist to
        // verify this app's own code, not a third party's beacon
        // reliability under rapid synthetic navigation no real visitor
        // would ever do - so serve common.mjs with the token forced
        // empty here, same inert state the real file ships in by
        // default. Every other file (including common.mjs's actual
        // beacon-injection code path) is served unmodified.
        body = Buffer.from(body.toString("utf8").replace(/const CF_BEACON_TOKEN = ".*?";/, 'const CF_BEACON_TOKEN = "";'));
      }
      res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });
  await new Promise((resolve) => server.listen(PORT, resolve));
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

async function newPage(browserCtx, viewport) {
  const ctx = await browserCtx.newContext(viewport ? { viewport } : undefined);
  await ctx.addInitScript(() => {
    try { localStorage.setItem("entry-level-it-launchpad:seen-splash", "1"); } catch { /* ignore */ }
  });
  return ctx.newPage();
}

// /api/* 404s are the documented graceful-degradation path on a plain
// static server with no Cloudflare Functions, not a bug - Chromium logs
// them both as a "Failed to load resource" console message (generic text,
// no URL in the message itself) and as a >=400 response event, so both
// listeners need this same exclusion, not just the one with the URL.
// (The Web Analytics beacon's third-party requests are handled by
// stubbing them in newPage() above, not here - its failure message
// varies by exact network condition, so text-matching it was fragile.)
const EXPECTED_ERROR = /Failed to load resource.*40[14]|Failed to load resource.*501/;

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !EXPECTED_ERROR.test(m.text())) errors.push(m.text()); });
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("/api/")) errors.push(`${r.status()} ${r.url()}`);
  });
  return errors;
}

test("every page loads with no console/page errors, desktop and mobile", async () => {
  const htmlFiles = (await readdir(new URL("../../", import.meta.url)))
    .filter((f) => f.endsWith(".html"));
  assert.ok(htmlFiles.length >= 13, "expected at least 13 html pages");

  for (const width of [375, 1280]) {
    const page = await newPage(browser, { width, height: 900 });
    for (const file of htmlFiles) {
      const errors = collectErrors(page);
      await page.goto(`${BASE}/${file}`, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      assert.equal(errors.length, 0, `${file} at ${width}px had console errors: ${JSON.stringify(errors)}`);
      assert.equal(overflow, false, `${file} at ${width}px has horizontal overflow`);
      page.removeAllListeners("pageerror");
      page.removeAllListeners("console");
      page.removeAllListeners("response");
    }
    await page.close();
  }
});

test("nav is a single scrollable row on mobile, not stacked wrapping", async () => {
  const page = await newPage(browser, { width: 375, height: 900 });
  await page.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });
  const nav = page.locator("nav.site-nav");
  const scrollWidth = await nav.evaluate((el) => el.scrollWidth);
  const clientWidth = await nav.evaluate((el) => el.clientWidth);
  assert.ok(scrollWidth > clientWidth, "nav should be wider than the viewport (scrollable), not wrapped");
  await page.close();
});

test("tracker: a new row persists across reload, and a real Rejected row triggers the supportive note", async () => {
  const page = await newPage(browser);
  await page.goto(`${BASE}/plan-tracker.html`, { waitUntil: "networkidle" });
  await page.fill('input[data-row="0"][data-key="company"]', "Test Co");
  await page.selectOption('select[data-row="0"][data-key="status"]', "Rejected");
  const note = await page.locator("#rejection-note").innerText();
  assert.ok(note.length > 0, "rejection note should appear");

  await page.reload({ waitUntil: "networkidle" });
  const persisted = await page.inputValue('input[data-row="0"][data-key="company"]');
  assert.equal(persisted, "Test Co");
  await page.close();
});

test("tracker: a genuinely new visitor starts blank, not pre-seeded with a fake application", async () => {
  const page = await newPage(browser);
  await page.goto(`${BASE}/plan-tracker.html`, { waitUntil: "networkidle" });
  const companyValue = await page.inputValue('input[data-row="0"][data-key="company"]');
  const companyPlaceholder = await page.locator('input[data-row="0"][data-key="company"]').getAttribute("placeholder");
  assert.equal(companyValue, "", "a brand-new visitor's first tracker row must be empty, not pre-filled");
  assert.ok(companyPlaceholder, "the example company name should still show as a placeholder hint");
  const banner = await page.locator("#followup-banner").innerText();
  assert.equal(banner, "", "a brand-new visitor should never see a false follow-up-due banner");
  await page.close();
});

test("homepage next-step widget recommends setup before logging applications", async () => {
  const page = await newPage(browser);
  await page.goto(`${BASE}/index.html`, { waitUntil: "networkidle" });
  const text = await page.locator("#next-step").innerText();
  assert.match(text, /settings/i);
  await page.close();
});

test("story bank: add, edit, and remove a story", async () => {
  const page = await newPage(browser);
  await page.goto(`${BASE}/story-bank.html`, { waitUntil: "networkidle" });
  await page.click("#add-story");
  await page.fill("#story-0-title", "Smoke test story");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.inputValue("#story-0-title"), "Smoke test story");

  page.on("dialog", (d) => d.accept());
  await page.click('[data-remove="0"]');
  const count = await page.locator("#story-count").innerText();
  assert.match(count, /^0 stories/);
  await page.close();
});
