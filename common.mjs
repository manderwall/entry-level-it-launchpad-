// Shared chrome (header/nav/footer) + small utilities used by every page.
// Zero dependencies, zero build step — plain ES modules loaded by <script type="module">.

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
];

// Grouped view of PAGES for nav rendering. index.html sits outside the
// groups since it's the persistent "home" link, not a step in the flow.
export const NAV_GROUPS = [
  { label: "Find", hrefs: ["roles.html", "search-toolkit.html", "zones.html", "employers.html", "gov-contractors.html"] },
  { label: "Prepare", hrefs: ["resume.html", "projects-certs.html", "interview-prep.html"] },
  { label: "Track", hrefs: ["plan-tracker.html"] },
];

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%231f6feb'/%3E%3Ctext x='50' y='68' font-size='58' font-family='sans-serif' font-weight='700' fill='white' text-anchor='middle'%3EIT%3C/text%3E%3C/svg%3E";

export function renderChrome(activeHref) {
  const favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.href = FAVICON;
  document.head.appendChild(favicon);

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="site-header-inner">
      <a class="site-title" href="index.html">Entry-Level IT <span>Launchpad</span></a>
      <span style="font-size:0.8rem;color:var(--text-muted)">CompTIA A+ · Per Scholas · $19+/hr targets</span>
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
