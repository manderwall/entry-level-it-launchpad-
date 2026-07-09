# Contributing

Thanks for considering it. This is a small, zero-build static site, so contributing doesn't require much setup.

## Before you start

For anything more than a typo fix, open an issue first describing what you want to change — saves both of us from a PR that doesn't fit the project's direction.

## Local setup

```bash
git clone https://github.com/manderwall/entry-level-it-launchpad-.git
cd entry-level-it-launchpad-
npm install
npm run serve      # plain static server, no build step, for the site itself
npm run check      # syntax-check every .mjs/functions/api/*.js file and every JSON data file
npm test           # data-shape + logic unit tests, fast, no browser needed
npx playwright install --with-deps chromium   # one-time, for the smoke suite below
npm run test:smoke # real-browser crawl of every page + key interactions
```

## Guidelines

- No build step, no framework, no runtime dependencies — keep it that way. Plain HTML/CSS/ES modules only.
- Every user-entered value that gets rendered back into the page must go through `escapeHtml()` (see `common.mjs`). This isn't optional — it's the whole XSS defense.
- Match the existing pattern for a new page: copy an existing `*.html`/`*.mjs` pair, wire it into `common.mjs`'s `PAGES`/`NAV_GROUPS`, and add both files to `sw.js`'s `APP_SHELL` (bump `CACHE_VERSION`).
- If you touch `data/*.json`, run `npm test` — several files have shape assertions.
- If you touch anything that renders in the browser (a page's `.mjs`, `common.mjs`, `styles.css`), run `npm run test:smoke` too — CI does.
- Run `npm run check && npm test && npm run test:smoke` before opening a PR. CI runs the same three.
- Keep the tone of any new user-facing copy plain and direct — no corporate-speak, no unearned hype. This project is for people under real financial pressure.

## What this project won't do

See [Trust & Safety](trust-safety.html) (or `trust-safety.html` in the repo) for the standing list of things the app itself won't do (auto-apply on someone's behalf, invent experience, etc.) — contributions that cross those lines won't be merged regardless of how well-built they are.

## Reporting a security issue

Don't open a public issue — see [SECURITY.md](SECURITY.md) for how to report it privately.
