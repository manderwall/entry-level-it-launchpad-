// Shared chrome (header/nav/footer) + small utilities used by every page.
// Zero dependencies, zero build step — plain ES modules loaded by <script type="module">.
import { getSettings, applyAccessibility, renderSettingsPanel } from "./settings.mjs";
import { maybeShowSplash, showSplash } from "./splash.mjs";
import { showHelp } from "./help.mjs";
import { renderChatWidget } from "./chat-widget.mjs";
import { trapModal } from "./modal.mjs";

export const PAGES = [
  { href: "index.html", label: "Start Here" },
  { href: "roles.html", label: "Best-Fit Roles" },
  { href: "search-toolkit.html", label: "Search Toolkit" },
  { href: "zones.html", label: "Houston Zones" },
  { href: "resume.html", label: "Resume & LinkedIn" },
  { href: "projects-certs.html", label: "Projects & Certs" },
  { href: "employers.html", label: "Employers" },
  { href: "gov-contractors.html", label: "Gov Contractors" },
  { href: "interview-prep.html", label: "Interview Prep" },
  { href: "plan-tracker.html", label: "Plan & Tracker" },
  { href: "trust-safety.html", label: "Trust & Safety" },
];

// Grouped view of PAGES for nav rendering. index.html sits outside the
// groups since it's the persistent "home" link, not a step in the flow.
export const NAV_GROUPS = [
  { label: "Find", hrefs: ["roles.html", "search-toolkit.html", "zones.html", "employers.html", "gov-contractors.html"] },
  { label: "Prepare", hrefs: ["resume.html", "projects-certs.html", "interview-prep.html"] },
  { label: "Track", hrefs: ["plan-tracker.html"] },
  { label: "About", hrefs: ["trust-safety.html"] },
];

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%231f6feb'/%3E%3Ctext x='50' y='68' font-size='58' font-family='sans-serif' font-weight='700' fill='white' text-anchor='middle'%3EIT%3C/text%3E%3C/svg%3E";

// Cloudflare Web Analytics beacon token — free, cookieless, privacy-friendly
// (no personal data, no cross-site tracking; Cloudflare's own product, not
// a third-party ad-tech tracker). This token is meant to be public (it's
// embedded in page source on every Cloudflare Web Analytics site, same as
// a Google Analytics measurement ID), so it's fine to commit — but it only
// works once you've added this site under Cloudflare dashboard > Analytics
// & Logs > Web Analytics and swapped in the real token below.
const CF_BEACON_TOKEN = ""; // <-- paste your token here once you've added the site in the dashboard

export function renderChrome(activeHref) {
  applyAccessibility(); // apply saved font-size/dyslexia/contrast/motion prefs before paint

  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.href = FAVICON;
  document.head.appendChild(favicon);

  const manifestLink = document.createElement("link");
  manifestLink.rel = "manifest";
  manifestLink.href = "manifest.json";
  document.head.appendChild(manifestLink);

  if (CF_BEACON_TOKEN) {
    const beacon = document.createElement("script");
    beacon.defer = true;
    beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
    beacon.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_BEACON_TOKEN }));
    document.head.appendChild(beacon);
  }

  // A single non-conditional theme-color meta, recomputed whenever the
  // effective theme changes (explicit Settings choice, or the OS setting
  // when left on "auto") — more reliable than two prefers-color-scheme
  // conditioned tags, which some mobile browsers resolve inconsistently
  // when a page also sets an explicit color-scheme via CSS/JS.
  const themeColorMeta = document.createElement("meta");
  themeColorMeta.name = "theme-color";
  document.head.appendChild(themeColorMeta);
  const darkMedia = window.matchMedia("(prefers-color-scheme: dark)");
  function updateThemeColorMeta() {
    const theme = getSettings().theme;
    const isDark = theme === "dark" || (theme === "auto" && darkMedia.matches);
    themeColorMeta.content = isDark ? "#14171a" : "#ffffff";
  }
  updateThemeColorMeta();
  darkMedia.addEventListener("change", updateThemeColorMeta);
  document.addEventListener("settings:changed", updateThemeColorMeta);

  const payFloor = getSettings().payFloor;
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="site-header-inner">
      <a class="site-title" href="index.html">Entry-Level IT <span>Launchpad</span></a>
      <span style="font-size:0.8rem;color:var(--text-muted)">CompTIA A+ · Per Scholas · $${payFloor}+/hr target</span>
      <div class="header-actions">
        <button id="settings-btn" type="button" aria-label="Settings" title="Settings &amp; accessibility">⚙</button>
        <button id="help-btn" type="button" aria-label="Help" title="Help &amp; navigation">?</button>
      </div>
    </div>`;
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Main sections");
  const homeCurrent = activeHref === "index.html" ? ' aria-current="page"' : "";
  const groupsHtml = NAV_GROUPS.map((group) => {
    const links = group.hrefs.map((href) => {
      const page = PAGES.find((p) => p.href === href);
      const current = href === activeHref ? ' aria-current="page"' : "";
      return `<a href="${href}"${current}>${page.label}</a>`;
    }).join("");
    return `<span class="nav-group"><span class="nav-group-label">${group.label}</span>${links}</span>`;
  }).join("");
  nav.innerHTML = `<a href="index.html"${homeCurrent}>Start Here</a>${groupsHtml}`;
  document.body.insertBefore(nav, document.body.firstChild);
  document.body.insertBefore(header, document.body.firstChild);

  const skip = document.createElement("a");
  skip.className = "skip-link";
  skip.href = "#main";
  skip.textContent = "Skip to main content";
  document.body.insertBefore(skip, document.body.firstChild);

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <p>Built by <strong>Amanda Kondrat'yev</strong> · Open source under
    <a href="https://github.com/manderwall/entry-level-it-launchpad-/blob/main/LICENSE">MIT</a>
    (code) / <a href="https://github.com/manderwall/entry-level-it-launchpad-/blob/main/content/LICENSE">CC BY 4.0</a>
    (guide content). Not affiliated with CompTIA, Per Scholas, or any employer named on this site.</p>
    <p>General information only — not legal, financial, immigration, or
    career-counseling advice. Salary and pay figures are benchmarks, not
    promises — always confirm on the live posting, and confirm program
    rules (unemployment, workforce assistance, etc.) with the issuing
    agency before relying on them.</p>
    <p><a href="https://github.com/manderwall/entry-level-it-launchpad-">Source on GitHub</a></p>`;
  document.body.appendChild(footer);

  header.querySelector("#help-btn").addEventListener("click", showHelp);
  header.querySelector("#settings-btn").addEventListener("click", () => {
    const overlay = document.createElement("div");
    overlay.className = "splash-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Settings");
    overlay.innerHTML = `<div class="splash-card" style="text-align:left;max-width:480px;" id="settings-panel-container"></div>`;
    document.body.appendChild(overlay);
    renderSettingsPanel(overlay.querySelector("#settings-panel-container"));
    const closeBtn = document.createElement("button");
    closeBtn.className = "primary";
    closeBtn.textContent = "Done";
    closeBtn.style.marginTop = "1rem";
    overlay.querySelector("#settings-panel-container").appendChild(closeBtn);
    const close = trapModal(overlay);
    closeBtn.addEventListener("click", close);
  });

  maybeShowSplash();

  // Opt-in only — the chat widget stays completely absent from the page
  // (not just hidden) until a visitor turns it on in Settings, so it's
  // never the first thing anyone sees. Mounts immediately if already
  // enabled from a past visit, or the moment someone flips it on live.
  let chatMounted = false;
  function mountChatIfEnabled() {
    if (chatMounted || !getSettings().aiChatEnabled) return;
    chatMounted = true;
    renderChatWidget();
  }
  mountChatIfEnabled();
  document.addEventListener("settings:changed", mountChatIfEnabled);

  // Force every collapsed <details> section open when printing (CSS alone
  // can't reliably override native details/summary hiding across browser
  // engines), then restore whatever the visitor actually had open.
  let detailsClosedBeforePrint = [];
  window.addEventListener("beforeprint", () => {
    detailsClosedBeforePrint = [...document.querySelectorAll("details:not([open])")];
    detailsClosedBeforePrint.forEach((d) => { d.open = true; });
  });
  window.addEventListener("afterprint", () => {
    detailsClosedBeforePrint.forEach((d) => { d.open = false; });
    detailsClosedBeforePrint = [];
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // offline/installability is a nice-to-have — never block the page on it
    });
  }
}

export async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

// Event-delegated so it works regardless of whether [data-copy] buttons
// exist yet at call time (most pages render them after an async fetch).
export function wireCopyButtons(root = document) {
  root.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const text = btn.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = original; }, 1500);
    } catch {
      window.prompt("Copy this text:", text);
    }
  });
}
