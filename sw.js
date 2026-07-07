// Service worker: caches the app shell + data so the site works offline
// and can be installed to a home screen (iPad/iPhone/Android/desktop).
// No build step in this project, so the cache list is maintained by hand
// below — bump CACHE_VERSION whenever you add/remove/rename a file.
const CACHE_VERSION = "v1";
const CACHE_NAME = `entry-level-it-launchpad-${CACHE_VERSION}`;

const APP_SHELL = [
  "index.html", "roles.html", "search-toolkit.html", "zones.html", "resume.html",
  "projects-certs.html", "employers.html", "gov-contractors.html", "interview-prep.html", "plan-tracker.html",
  "common.mjs", "settings.mjs", "splash.mjs", "help.mjs", "progress.mjs", "live-search.mjs", "chat-widget.mjs", "data-sync.mjs",
  "index.mjs", "roles.mjs", "search-toolkit.mjs", "zones.mjs", "resume.mjs",
  "projects-certs.mjs", "employers.mjs", "gov-contractors.mjs", "interview-prep.mjs", "plan-tracker.mjs",
  "styles.css", "manifest.json",
  "data/application-scorecard.json", "data/certs.json", "data/employers.json",
  "data/financial-resources.json", "data/houston-zones.json", "data/interview-prep.json",
  "data/job-boards.json", "data/networking-scripts.json", "data/roles.json",
  "data/scam-checklist.json", "data/search-strings.json", "data/stretch-roles.json",
  "data/transportation-strategies.json", "data/weekly-tracker-schema.json", "data/video-resources.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
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

  // Cache-first for the app shell, falling back to network + cache-fill
  // for anything else same-origin (e.g. a data file added after this
  // service worker's list was last updated).
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
