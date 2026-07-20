// Guards the Safari service-worker fix: a SW response with redirected===true
// cannot be used for a navigation in Safari ("Response served by service
// worker has redirections"), so pages served through Cloudflare's clean-URL
// redirect fail to open. sw.js must strip the redirect flag by rebuilding the
// response. This test fails if that handling is removed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sw = await readFile(new URL("../sw.js", import.meta.url), "utf8");
const common = await readFile(new URL("../common.mjs", import.meta.url), "utf8");

test("service worker clears the redirect flag before serving/caching", () => {
  assert.match(sw, /response\.redirected/, "must detect redirected responses");
  assert.match(sw, /new Response\(/, "must rebuild the response to clear the redirect flag");
  assert.match(sw, /cleanResponse/, "must route responses through the redirect-stripping helper");
});

test("service worker still refuses to cache non-GET and /api/ requests", () => {
  assert.match(sw, /method\s*!==\s*["']GET["']/, "non-GET requests must pass through");
  assert.match(sw, /\/api\//, "API calls must not be cached");
});

// Update-prompt flow: the new worker must WAIT (no install-time skipWaiting)
// and only take over when the page asks it to, so a long-lived tab is never
// swapped silently mid-task.
test("service worker waits instead of activating silently on install", () => {
  const installBlock = sw.slice(sw.indexOf('addEventListener("install"'), sw.indexOf('addEventListener("message"'));
  // Match an actual call (self.skipWaiting / skipWaiting()), not the prose
  // comment explaining why it was removed.
  assert.doesNotMatch(installBlock, /self\.skipWaiting\s*\(/, "install handler must NOT call self.skipWaiting()");
});

test("service worker activates on a SKIP_WAITING message and claims clients", () => {
  assert.match(sw, /addEventListener\(\s*["']message["']/, "must listen for messages from the page");
  assert.match(sw, /SKIP_WAITING/, "must handle the SKIP_WAITING message");
  assert.match(sw, /skipWaiting\s*\(\)/, "the message handler must call skipWaiting()");
  assert.match(sw, /clients\.claim\(\)/, "activate must still claim clients");
});

// The shared chrome module hosts the banner so it works on every page.
test("common.mjs detects a waiting worker and drives the refresh banner", () => {
  assert.match(common, /reg\.waiting/, "must check for an already-waiting worker at boot");
  assert.match(common, /updatefound/, "must listen for a newly-installing worker");
  assert.match(common, /["']installed["']/, "must react to the installed state transition");
  assert.match(common, /controllerchange/, "must reload once when the new worker takes control");
  assert.match(common, /postMessage\(\s*\{\s*type:\s*["']SKIP_WAITING["']/, "Refresh must post SKIP_WAITING");
  assert.match(common, /role["']?\s*,\s*["']status["']|setAttribute\(["']role["'],\s*["']status["']\)/, "banner must be an accessible status region");
});
