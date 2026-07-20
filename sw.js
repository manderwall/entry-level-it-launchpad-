// Service worker: caches the app shell + data so the site works offline
// and can be installed to a home screen (iPad/iPhone/Android/desktop).
// No build step in this project, so the cache list is maintained by hand
// below — bump CACHE_VERSION whenever you add/remove/rename a file.
const CACHE_VERSION = "v7";
const CACHE_NAME = `entry-level-it-launchpad-${CACHE_VERSION}`;

const APP_SHELL = [
  "index.html", "roles.html", "search-toolkit.html", "zones.html", "resume.html",
  "projects-certs.html", "employers.html", "gov-contractors.html", "interview-prep.html", "plan-tracker.html", "trust-safety.html", "story-bank.html", "404.html",
  "common.mjs", "settings.mjs", "splash.mjs", "help.mjs", "progress.mjs", "live-search.mjs", "chat-widget.mjs", "data-sync.mjs", "modal.mjs", "cloud-sync.mjs", "next-step.mjs",
  "index.mjs", "roles.mjs", "search-toolkit.mjs", "zones.mjs", "resume.mjs",
  "projects-certs.mjs", "employers.mjs", "gov-contractors.mjs", "interview-prep.mjs", "plan-tracker.mjs", "trust-safety.mjs", "story-bank.mjs", "404.mjs",
  "styles.css", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png",
  "data/application-scorecard.json", "data/certs.json", "data/employers.json",
  "data/financial-resources.json", "data/houston-zones.json", "data/interview-prep.json",
  "data/job-boards.json", "data/networking-scripts.json", "data/negotiation-scripts.json", "data/roles.json",
  "data/scam-checklist.json", "data/search-strings.json", "data/stretch-roles.json",
  "data/transportation-strategies.json", "data/weekly-tracker-schema.json", "data/video-resources.json",
];

// Rebuild a response with the "redirected" flag cleared. Safari refuses to use
// a service-worker response for a NAVIGATION when response.redirected is true
// ("Response served by service worker has redirections"), so any page that
// came back through a redirect can't be opened. Cloudflare Pages' clean-URL
// rewrites (/x.html <-> /x) make our precached and fetched pages redirected,
// so we copy the body into a fresh Response to strip the flag. Chrome tolerated
// the old behavior; Safari did not — this makes both work.
async function cleanResponse(response) {
  if (!response || !response.redirected) return response;
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Precache each entry individually (not cache.addAll) so we can strip the
    // redirect flag before storing, and so one missing file can't abort the
    // whole install.
    await Promise.all(APP_SHELL.map(async (path) => {
      try {
        const res = await fetch(new Request(path, { cache: "reload" }));
        if (res.ok) await cache.put(path, await cleanResponse(res));
      } catch (_) { /* skip individual failures */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls (live job search / contractors / anything
  // dynamic) — those must always hit the network.
  if (url.pathname.startsWith("/api/")) return;
  if (event.request.method !== "GET") return;

  // Cache-first for the app shell, falling back to network + cache-fill for
  // anything else same-origin. Every response we hand back or store is passed
  // through cleanResponse so a redirected response never reaches a navigation.
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok && url.origin === self.location.origin) {
        const toCache = await cleanResponse(response.clone());
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
      }
      return await cleanResponse(response);
    } catch (_) {
      // Offline and not precached: give navigations a cached page instead of
      // a hard failure.
      if (event.request.mode === "navigate") {
        return (await caches.match("index.html")) || (await caches.match("404.html")) || Response.error();
      }
      return Response.error();
    }
  })());
});
