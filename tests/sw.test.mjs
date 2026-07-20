// Guards the Safari service-worker fix: a SW response with redirected===true
// cannot be used for a navigation in Safari ("Response served by service
// worker has redirections"), so pages served through Cloudflare's clean-URL
// redirect fail to open. sw.js must strip the redirect flag by rebuilding the
// response. This test fails if that handling is removed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sw = await readFile(new URL("../sw.js", import.meta.url), "utf8");

test("service worker clears the redirect flag before serving/caching", () => {
  assert.match(sw, /response\.redirected/, "must detect redirected responses");
  assert.match(sw, /new Response\(/, "must rebuild the response to clear the redirect flag");
  assert.match(sw, /cleanResponse/, "must route responses through the redirect-stripping helper");
});

test("service worker still refuses to cache non-GET and /api/ requests", () => {
  assert.match(sw, /method\s*!==\s*["']GET["']/, "non-GET requests must pass through");
  assert.match(sw, /\/api\//, "API calls must not be cached");
});
