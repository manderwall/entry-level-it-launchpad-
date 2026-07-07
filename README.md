# Entry-Level IT Launchpad

An open-source, ready-to-fork job-search launchpad for **CompTIA A+
certified / Per Scholas grads** — and anyone else breaking into
entry-level IT support with limited hands-on experience (for example,
coming from remote customer service).

![Build](https://img.shields.io/badge/build_step-none-4ade80)
![Dependencies](https://img.shields.io/badge/runtime_deps-0-4ade80)
![License](https://img.shields.io/badge/license-MIT-blue)
![Content License](https://img.shields.io/badge/content-CC--BY--4.0-lightgrey)

**🔗 Live demo:** deploy your own on Cloudflare Pages (see below) — no
build step, so it's a one-click connect.

## What this is

A static site version of the "Shareable A+ Entry-Level Tech Job Guide,"
turned into real interactive tools instead of a static document:

- **Best-Fit Roles & Pay** — the five strongest target roles, with a
  live pay/remote-odds filter.
- **Search Toolkit** — a live link generator that builds ready-to-click
  searches on Indeed, LinkedIn, Dice, ZipRecruiter, Built In, and more
  for any role + location; an application scorecard; a printable scam
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
  prompts, and quick technical definitions.
- **Application Plan & Weekly Tracker** — a 2-week plan and a browser-local
  application tracker (stored only in your own browser via
  `localStorage`, exportable to CSV — nothing is uploaded or shared
  between visitors).

Houston is used as the worked example metro throughout, but the Zones
page includes an explicit method for rebuilding the same zone/pay/transit
breakdown for any city.

## Tech stack

| Layer | Choice |
|---|---|
| **Language** | Vanilla JavaScript (ES modules), HTML, CSS — no framework, no bundler |
| **Data** | Plain JSON files in `data/` — edit them directly, no CMS |
| **Tests** | Node's built-in test runner (`node --test`) validates every data file's shape |
| **CI** | GitHub Actions runs syntax checks + data tests on every push |
| **Hosting** | Static files — works on Cloudflare Pages, GitHub Pages, Netlify, or any static host |

No `npm install` is required to run the site itself — `data/*.json` is
fetched at runtime by plain `fetch()` calls. `npm` is only used for the
test suite.

## Project layout

```
content/guide/   Prose export of the original guide (Markdown, source of truth for wording)
content/LICENSE  CC BY 4.0 — covers the written guide content
data/            Structured JSON data the site reads at runtime
scripts/         check-syntax.mjs — CI syntax gate
tests/           node --test data validation suite
*.html / *.mjs   One page + one script per section, plus common.mjs (shared header/nav/footer)
styles.css       Single stylesheet, light/dark via prefers-color-scheme
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
npm run check   # syntax-check every .mjs file
npm test        # validate every data/*.json file's shape
```

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. In Cloudflare Pages, create a project connected to the repo.
3. Build command: *(none)*. Build output directory: `/` (repo root).
4. Deploy — `_headers` is picked up automatically for CSP/security headers.

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
