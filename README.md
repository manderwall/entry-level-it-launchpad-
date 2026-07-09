# Entry-Level IT Launchpad

An open-source, ready-to-fork job-search launchpad for **CompTIA A+
certified / Per Scholas grads** — and anyone else breaking into
entry-level IT support with limited hands-on experience (for example,
coming from remote customer service).

![Build](https://img.shields.io/badge/build_step-none-4ade80)
![Dependencies](https://img.shields.io/badge/runtime_deps-0-4ade80)
![License](https://img.shields.io/badge/license-MIT-blue)
![Content License](https://img.shields.io/badge/content-CC--BY--4.0-lightgrey)

**🔗 Live:** [it-launchpad.pages.dev](https://it-launchpad.pages.dev) — or deploy your own copy on Cloudflare Pages (see below), no build step, so it's a one-click connect.

## What this is

A static site version of the "Shareable A+ Entry-Level Tech Job Guide,"
turned into real interactive tools instead of a static document:

- **Best-Fit Roles & Pay** — the five strongest target roles, with a
  live pay/remote-odds filter.
- **Search Toolkit** — a live link generator that builds ready-to-click
  searches on Indeed, LinkedIn, Dice, ZipRecruiter, Built In, and more
  for any role + location, with separate remote and local/on-site query
  templates so a local or hybrid search gets tailored strings instead of
  remote-oriented ones; an application scorecard; a printable scam
  checklist.
- **Houston Zones & Getting There** — the metro broken into 6 job zones
  with transit access and pay benchmarks, plus a 5-step method to build
  the same map for any city.
- **Resume, LinkedIn & Cover Letter** — copy-to-clipboard templates for
  every section, with role-specific bullet swaps.
- **Skill-Building Projects & Next Certs** — five small projects with
  ready resume bullets, plus a certification cost/payoff calculator.
- **Employers, Pipelines & Apprenticeships** — staffing agencies, remote
  support pipelines, apprenticeship search terms, and networking
  scripts.
- **Interview Prep** — a 60-second pitch, common Q&A, STAR-format
  prompts, quick technical definitions, and negotiation scripts for
  responding to an offer, asking for time, countering, or handling a
  competing offer.
- **Application Plan & Weekly Tracker** — a 2-week plan with time
  estimates per phase, weekly goals with an explicit "this is a floor,
  not a pass/fail test" note, and a browser-local application tracker
  (stored only in your own browser via `localStorage`, exportable to
  CSV — nothing is uploaded or shared between visitors).
- **Government Contractors & Subcontractors** — federal contract awards
  near Houston/JSC, live from USAspending.gov.
- **STAR Story Bank** — build 5-10 reusable STAR-format interview
  stories from your own real experience, saved only in your browser.
- **Trust & Safety** — a plain-language, permanent page listing exactly
  what this site and its optional AI assistant will never do (never
  auto-apply, never invent experience, never guess and present it as
  fact), with a direct link to the actual system prompt file so it's
  checkable, not just a claim.

Houston is used as the worked example metro throughout, but the Zones
page includes an explicit method for rebuilding the same zone/pay/transit
breakdown for any city.

## Cross-device, installable, accessible

- **Works everywhere** — it's a responsive web app, so it runs the same
  in any modern browser on iPad, iPhone, Android, Mac, or PC. No app
  store, no install required to use it.
- **Installable as an app** — `manifest.json` + a service worker
  (`sw.js`) make it installable to a home screen/dock like a native app,
  and it keeps working offline once you've loaded it once. iOS-specific
  meta tags (`apple-mobile-web-app-capable`, etc.) are included too, so a
  home-screen shortcut on an iPhone/iPad opens as a standalone app
  instead of inside Safari's browser chrome — many iOS versions still in
  use ignore the web manifest and need these instead.
- **Your own pay floor, not a hardcoded number** — the site defaults to
  $19/hr (based on a real entry-level offer), but every visitor sets
  their own in **⚙ Settings**, and it's used everywhere (Roles filter,
  header, scorecard) instead of being fixed.
- **Appearance/accessibility options** (in ⚙ Settings): an explicit
  light/dark theme toggle (independent of your device's setting), text
  size, a dyslexia-friendly font, high-contrast mode, and reduced motion.
- **Keyboard/screen-reader friendly modals** — Settings, Help, and the
  welcome screen all trap focus properly, close on Escape, and return
  focus to whatever you opened them from.
- **Follow-up reminders** — the tracker flags any application whose
  follow-up date has passed (and isn't already Rejected/Withdrawn).
- **Print-friendly** — the Resume page and the Search Toolkit's scam
  checklist both have a one-click print button; collapsed sections
  auto-expand for the printout and collapse back after.
- **A splash screen and a ? Help panel** explain the site's sections and
  privacy model — the splash shows once per browser and is reachable
  again anytime from Help.
- **Nothing you enter is uploaded** — your pay floor, city, accessibility
  prefs, progress checklist, and application tracker all live only in
  your own browser's `localStorage`. Nothing is shared between visitors,
  even if you and a friend both use the same deployed site.
- **Sync your data across devices** — ⚙ Settings has two options: an
  automatic code-based sync (via Cloudflare KV — see setup below) where
  entering the same code on two devices keeps them in sync, and a manual
  file Export/Import that needs zero setup at all as a fallback. No
  account system either way — a sync code is the only credential.

## Tech stack

| Layer | Choice |
|---|---|
| **Language** | Vanilla JavaScript (ES modules), HTML, CSS — no framework, no bundler |
| **Data** | Plain JSON files in `data/` — edit them directly, no CMS |
| **Tests** | Node's built-in test runner (`node --test`) validates data shapes and core UI logic |
| **CI** | GitHub Actions runs syntax checks (every `.mjs`/`functions/api/*.js` + every JSON file) and the test suite on every push |
| **Hosting** | Static files — works on Cloudflare Pages, GitHub Pages, Netlify, or any static host |

No `npm install` is required to run the site itself — `data/*.json` is
fetched at runtime by plain `fetch()` calls. `npm` is only used for the
test suite.

## Project layout

```
content/guide/   Prose export of the original guide (Markdown, source of truth for wording)
content/LICENSE  CC BY 4.0 — covers the written guide content
data/            Structured JSON data the site reads at runtime
functions/api/   Cloudflare Pages Functions — server-side proxies (jobs, contractors, chat)
scripts/         check-syntax.mjs — CI syntax gate
tests/           node --test data validation suite
*.html / *.mjs   One page + one script per section
common.mjs       Shared header/nav/footer/chrome, wired into every page
settings.mjs     Pay floor, city, and accessibility prefs (localStorage)
progress.mjs     Cross-page milestone checklist (localStorage)
splash.mjs       First-visit welcome screen
help.mjs         "?" help/navigation panel
modal.mjs        Shared focus-trap helper for Settings/Help/splash dialogs
chat-widget.mjs  Opt-in floating AI chat button (dormant until enabled in Settings and the AI binding is set)
data-sync.mjs    Manual export/import (file download, no setup needed)
cloud-sync.mjs   Automatic cross-device sync via a Cloudflare KV code (dormant until SYNC_KV is bound)
live-search.mjs  Search Toolkit's live job-results panel
manifest.json    PWA manifest — installable to a home screen/dock
sw.js            Service worker — offline caching + installability
styles.css       Single stylesheet, light/dark + accessibility modes via prefers-color-scheme / classes
_headers         Cloudflare Pages CSP + security headers
```

## Run it locally

```bash
git clone https://github.com/manderwall/entry-level-it-launchpad-.git
cd entry-level-it-launchpad-
npm run serve   # python3 -m http.server 8000
# open http://localhost:8000
```

No build step — any static file server works (`npx serve`, VS Code Live
Server, etc.).

## Test

```bash
npm run check      # syntax-check every .mjs/functions/api/*.js file + every JSON data file
npm test           # data/*.json shape validation + logic unit tests (settings, escapeHtml, milestones) - fast, no browser needed
npm run test:smoke # real-browser smoke suite (Playwright + Chromium) - crawls every page, checks mobile overflow, exercises the tracker/story-bank/next-step widget
```

`tests/data.test.mjs` validates every `data/*.json` file's shape.
`tests/logic.test.mjs` unit-tests the pure/near-pure logic in modules that
don't touch the DOM at module load time (`common.mjs`, `settings.mjs`,
`progress.mjs`) — things like XSS-safe escaping, settings defaults/merge
behavior, and theme/font-scale class toggling.

`tests/smoke/smoke.test.mjs` is the one that needs a real browser (the
page-entry `.mjs` files call `renderChrome()` immediately on load): it
spins up a plain static server, crawls every page at both a phone and
desktop width checking for console/page errors and horizontal overflow,
and exercises the interactive bits that are easy to silently break —
tracker persistence, the "new visitor starts genuinely blank" guarantee,
the computed next-step widget, and the Story Bank. Kept in its own
`tests/smoke/` folder (not picked up by the plain `npm test` glob) so
day-to-day `npm test` stays instant and dependency-free; CI runs both.
First run needs `npx playwright install --with-deps chromium` once.

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. In Cloudflare Pages, create a project connected to the repo.
3. Build command: *(none)*. Build output directory: `/` (repo root).
4. Deploy — `_headers` is picked up automatically for CSP/security headers,
   and `functions/api/jobs.js` is picked up automatically as a Pages Function
   (no config needed — Cloudflare Pages auto-detects the `functions/` folder).

### Enable live job search results (optional)

The Search Toolkit page can show live results from the [Adzuna](https://developer.adzuna.com/)
API. This is optional — without it, the page still works fine with the
plain job-board links.

1. Register a free app at [developer.adzuna.com](https://developer.adzuna.com/) to get an **App ID** and **App Key**.
2. In the Cloudflare Pages dashboard: your project → **Settings** → **Environment variables** → **Add variable**.
3. Add two variables (mark them **Encrypted**): `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`.
4. Redeploy (or it picks them up on the next deploy automatically).

The key never touches this repo or the visitor's browser — `functions/api/jobs.js`
runs server-side on Cloudflare's edge and proxies the request. If the
variables aren't set, the live-results panel just quietly doesn't appear.

### Enable the Government Contractors page (no key needed)

`functions/api/contractors.js` proxies USAspending.gov's public award-search
API — no API key or account required. It works automatically once
deployed to Cloudflare Pages; nothing to configure.

### Enable the AI chat box (optional, free, opt-in)

An **opt-in** chat button (off by default — a visitor has to turn it on
in ⚙ Settings, it's never the first thing anyone sees) can answer
questions grounded in this site's content, via **Cloudflare Workers AI**
— genuinely free (a daily quota of "neurons," no billing, no separate
account or API key), running open-source models directly on
Cloudflare's own infrastructure.

1. Your Pages project → **Settings** → **Functions** → **Bindings** → **Add**.
2. Choose **Workers AI**.
3. Variable name: exactly `AI`.
4. Save, then redeploy.

That's it — no API key to create or paste anywhere, since Workers AI is
a Cloudflare-native binding rather than a third-party service.

**Model:** `@cf/meta/llama-3.1-8b-instruct-fast` (Meta's Llama 3.1 8B
Instruct) — a small, fast, free open-source model. Quality is a step
below a frontier model like Claude or GPT-4, but it's plenty for
grounded questions about this site's own content. Without the `AI`
binding set, the chat widget (once a visitor enables it) explains it
isn't configured yet instead of erroring.

**Rules/behavior:** entirely controlled by the `SYSTEM_PROMPT` constant
at the top of `functions/api/chat.js` — it's a plain string, edit it
directly to change what the assistant knows, how it should behave, or
what it should refuse to answer. No special syntax, just rewrite the
text.

If you ever want a stronger (but paid) model instead, swap the Workers
AI call in `functions/api/chat.js` for Anthropic's or OpenAI's API and
add the corresponding key as a Secret — same pattern as the Adzuna
integration above.

### Enable automatic cross-device sync (optional)

⚙ Settings has a "sync across your devices automatically" option: each
device gets a random code, and entering the same code on a second device
pulls the first device's settings/progress/tracker data. This needs a
Cloudflare KV namespace bound to the Pages project — no API key, since
KV is a Cloudflare-native resource rather than a third-party service.

1. Cloudflare dashboard → **Workers & Pages** → **KV** → **Create a namespace** (e.g. name it `entry-level-it-launchpad-sync`).
2. Your Pages project → **Settings** → **Functions** → **KV namespace bindings** → **Add binding**.
3. Variable name: `SYNC_KV`. KV namespace: the one you just created.
4. Redeploy.

`functions/api/sync.js` only ever reads/writes the exact code a visitor
provides — there's no account system, the sync code itself is the
credential (shown in the UI with a "treat it like a password" warning).
Codes expire after 180 days of inactivity. Without the KV binding, the
sync UI still appears but explains cloud sync isn't set up yet and
points to the manual file export/import instead, which needs no setup
at all.

### Enable usage analytics (optional, free)

Cloudflare Web Analytics gives you page-view/visitor counts with no
cookies and no personal data collected — Cloudflare's own product, not
third-party ad-tech.

1. Cloudflare dashboard → **Analytics & Logs** → **Web Analytics** → add this site.
2. Copy the beacon token it gives you.
3. Paste it into `common.mjs`, replacing the empty `CF_BEACON_TOKEN = ""` near the top of the file.
4. Commit and redeploy.

The token is meant to be public (same idea as a Google Analytics
measurement ID) — safe to commit. Until you set it, the beacon script
simply never gets injected, so there's zero overhead either way. CSP
(`_headers` and every page's meta tag) already allows
`static.cloudflareinsights.com` for when you do.

### Protecting the free API quotas (dashboard-only, no code)

`/api/jobs`, `/api/contractors`, `/api/chat`, and `/api/sync` are public
endpoints with no login — anyone (including a script) can call them
directly, which could burn through the Adzuna or Workers AI free daily
quotas. Cloudflare's **Security → WAF → Rate limiting rules** (free tier
available) can cap this:

1. Create a rule matching **URI Path** → **starts with** → `/api/`.
2. Rate: something like **30 requests per minute per IP** (generous for
   one real visitor clicking around, restrictive for a script).
3. Action: **Block** or **Managed Challenge**.

This is a dashboard setting, not something in this repo — there's no
Function code change needed.

### Preview deployments need their own bindings/secrets

Cloudflare Pages has separate **Production** and **Preview** environment
variable/binding sets. If you ever want a non-`main` branch's preview
URL (e.g. a feature branch) to also have working live search, chat, or
sync, you'll need to add the same `ADZUNA_APP_ID`/`ADZUNA_APP_KEY`,
`AI` binding, and `SYNC_KV` binding under the **Preview** tab too —
they don't carry over automatically from Production.

### Link previews when you share it

Every page has Open Graph and Twitter Card tags, so pasting a link into a
text/group chat, Discord, or social media shows a real title, description,
and icon instead of a bare URL. `og:image` and `apple-touch-icon` point at
real PNG files (`icon-512.png`, `apple-touch-icon.png`, generated from
`icon.svg`) rather than the SVG or a data URI directly — most social
crawlers (including X/Twitter) and iOS home-screen install don't reliably
render either of those. If you deploy to a custom domain, consider
changing `og:image`'s value from the relative path to an absolute URL for
maximum compatibility with older crawlers, though the relative path works
on all major ones (Facebook, Discord, Slack, iMessage) as-is.

### Before you submit this to search engines

`sitemap.xml` and `robots.txt`'s `Sitemap:` line point at
`https://it-launchpad.pages.dev`. If you ever move to a custom domain
instead, update both files to match before submitting to Google Search
Console/Bing Webmaster Tools — a wrong sitemap domain doesn't break the
site itself, it just means search engines get a bad hint. `404.html` is
a real file, so Cloudflare Pages automatically serves it (with the
site's own nav/header) for any unmatched path — no extra configuration
needed.

## Make it your own

- **Different metro:** replace `data/houston-zones.json` and
  `data/employers.json` with your city's zones/employers — the Zones
  page's "Not in Houston?" section documents the 5-step method used to
  build the Houston version.
- **Different target roles:** edit `data/roles.json` /
  `data/stretch-roles.json`.
- **Different certs:** edit `data/certs.json`.
- Every page reads its data from `data/*.json` at runtime, so most edits
  don't touch any HTML or JS at all.

## Contributing

Want to fix something or add a feature? See [CONTRIBUTING.md](CONTRIBUTING.md) — it's a short read, no build step to fight with.

## License

- **Code** (`*.html`, `*.mjs`, `*.css`, `data/*.json`): [MIT](LICENSE)
- **Guide content** (`content/guide/*.md`): [CC BY 4.0](content/LICENSE)

Not affiliated with CompTIA, Per Scholas, or any employer named in the
data files. Salary and pay figures are benchmarks from spot-checked
postings and general market data as of mid-2026, not promises — always
confirm pay, schedule, location, benefits, and requirements on the live
posting before applying.

## Origin

Built from Amanda Kondrat'yev's "Shareable A+ Entry-Level Tech Job
Guide" — originally a Notion hub for Per Scholas classmates, rebuilt
here as an open-source, forkable app so anyone can adapt it to their own
city and target roles.
