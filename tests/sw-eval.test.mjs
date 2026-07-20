// Evaluates sw.js in a minimal service-worker sandbox to catch RUNTIME load
// errors that a syntax-only check (node --check) and grep-based tests miss —
// e.g. a reference to an undefined CACHE_VERSION in the CACHE_NAME template
// literal. If sw.js would throw when the browser loads it, this fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("sw.js loads without throwing (no undefined top-level references)", async () => {
  const code = await readFile(new URL("../sw.js", import.meta.url), "utf8");
  const sandbox = {
    self: {
      addEventListener() {},
      location: { origin: "https://example.com" },
      clients: { claim() {} },
      skipWaiting() {},
    },
    caches: {
      open: async () => ({ addAll: async () => {}, put: async () => {} }),
      keys: async () => [],
      match: async () => undefined,
      delete: async () => {},
    },
    fetch: async () => ({ ok: true }),
    Request: class { constructor() {} },
    Response: class { constructor() {} static error() {} },
    Headers: class {},
    URL,
    console,
  };
  vm.createContext(sandbox);
  assert.doesNotThrow(
    () => vm.runInContext(code, sandbox, { filename: "sw.js" }),
    "sw.js must evaluate cleanly in a service-worker context",
  );
});
