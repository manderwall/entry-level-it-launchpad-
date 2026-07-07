# Security policy

## Threat model

This is a client-side static site with no user accounts and no shared
backend. Everything a visitor enters — pay floor, city, accessibility
prefs, progress checklist, application tracker — lives only in that
visitor's own browser (`localStorage`/`sessionStorage`). There is no
database, no login, and no way for one visitor's data to reach another
visitor or the site owner.

| ✅ In scope | ❌ Out of scope |
|---|---|
| Accidental exposure of the Adzuna or Anthropic API keys to the browser/repo | A targeted attacker with root access to a visitor's device |
| A malicious PR trying to smuggle a client-side secret into committed code | Anthropic/Adzuna/USAspending outages or rate limits |
| XSS via unescaped user input rendered back to the page (e.g. tracker fields) | Content of AI chat responses being factually wrong (it's disclosed as AI-generated, verify anything important) |
| CSP bypass attempts (inline script injection, external script loading) | Someone reading the open-source data files — they're public by design |

## Server-side secrets

Two optional features call third-party APIs that need a secret key:

- **Live job search** (`functions/api/jobs.js`) — Adzuna API key.
- **AI chat** (`functions/api/chat.js`) — Anthropic API key.

Both keys are read only from Cloudflare Pages environment variables
(`ADZUNA_APP_ID/APP_KEY`, `ANTHROPIC_API_KEY`), set as **Secret** type in
the Cloudflare dashboard, never as plain **Text**, and never committed to
this repo. Neither Function returns the key value in any response —
if a key isn't set, they return a 501 with a plain "not configured"
message and stop, rather than falling back to some other behavior.

The Government Contractors feature (`functions/api/contractors.js`) calls
USAspending.gov's public API, which needs no key at all.

## Cloud sync codes

`functions/api/sync.js` (cross-device sync) uses a Cloudflare KV
namespace bound as `SYNC_KV` rather than a secret key — it's a
Cloudflare-native resource, not a third-party credential. Instead, the
**sync code itself is the credential**: whoever holds it can read/write
that code's data blob, with no other authentication. Codes are
10 characters from a 32-character alphabet (~50 bits of entropy — not
brute-forceable at any practical rate against Cloudflare's KV request
limits), validated server-side against a strict `^[A-Za-z0-9]{8,20}$`
pattern before being used as a KV key (no injection surface), and expire
after 180 days of inactivity. The UI explicitly tells visitors to treat
their code like a password. This is an accepted trade-off for a site
with no account system — the alternative (real accounts) is a much
bigger addition than a personal job-search tool warrants.

## Content Security Policy

Every page ships a strict CSP (`default-src 'self'`) both as an inline
`<meta>` tag (works on any static host) and in `_headers` (Cloudflare
Pages' authoritative version, which additionally sets
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and
`Referrer-Policy: no-referrer`). No page loads a script, font, or
stylesheet from a third-party CDN — everything is same-origin. The only
same-origin network calls a browser makes are to `/api/*` (the three
Functions above); everything else is a plain link the visitor clicks.

## Data handling

- All user-entered data goes through `escapeHtml()` before being rendered
  back into the page — this includes the application tracker, which is
  the one place a visitor's own free-text input gets displayed back to
  them.
- The AI chat box forwards a capped, recent slice of the conversation to
  `/api/chat` and nothing else — no page content, no tracker data, no
  settings are sent along with it.
- Chat history is stored in `sessionStorage` (cleared when the tab
  closes), not `localStorage` — it's treated as more ephemeral than the
  tracker/progress/settings data.

## Reporting an issue

If you find a security-relevant bug, open a private GitHub Security
Advisory on this repo rather than a public issue. This is a small
open-source project, not a vendor with an SLA — a reasonable response
timeline is acknowledgement within about a week.

Things that are **not** vulnerabilities here:

- "I can see the data/*.json files in DevTools" — they're public static
  assets by design, that's the whole point of the site.
- "The AI chat gave a wrong or nonsensical answer" — it's disclosed as
  AI-generated in the UI; verify anything important the same way you'd
  verify any other pay/employer figure on this site.
- "I disabled the service worker and offline mode broke" — expected.
