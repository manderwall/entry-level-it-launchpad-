// Optional live job results via /api/jobs, a Cloudflare Pages Function
// (functions/api/jobs.js) that proxies the Adzuna API server-side. Adzuna
// was picked because Indeed and LinkedIn no longer offer free public
// search APIs. The API key lives only as a Cloudflare Pages environment
// variable (set in the dashboard, never in this repo or in the visitor's
// browser) — this module never sees it, it just calls our own /api/jobs.
import { escapeHtml } from "./common.mjs";

async function fetchResults(query, location) {
  const isRemote = /^remote$/i.test(location.trim());
  const params = new URLSearchParams({ what: query });
  if (!isRemote) params.set("where", location);
  const res = await fetch(`/api/jobs?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

/**
 * Renders a "Live results" widget into `container`. Call the returned
 * `refresh(query, location)` whenever the role/location selection changes.
 */
export function renderLiveSearch(container) {
  container.innerHTML = `
    <div class="card">
      <h3>Live results</h3>
      <div id="live-results">Loading…</div>
    </div>`;
  const resultsEl = container.querySelector("#live-results");
  let notConfigured = false;

  return async function refresh(query, location) {
    if (notConfigured) return; // already told the visitor once, don't hammer /api/jobs
    resultsEl.textContent = "Loading…";
    try {
      const data = await fetchResults(query, location);
      if (!data.results || !data.results.length) {
        resultsEl.innerHTML = "<p>No live results for that search — try a broader query, or use the board links above.</p>";
        return;
      }
      resultsEl.innerHTML = `<ul class="link-list">${data.results.map((r) => `
        <li><a href="${r.redirect_url}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a>
            — ${escapeHtml(r.company?.display_name || "Unknown company")}
            ${r.location?.display_name ? `· ${escapeHtml(r.location.display_name)}` : ""}
            ${r.salary_min ? `· ~$${Math.round(r.salary_min).toLocaleString()}${r.salary_max && r.salary_max !== r.salary_min ? `-$${Math.round(r.salary_max).toLocaleString()}` : ""}` : ""}
        </li>`).join("")}</ul>`;
    } catch (err) {
      // 501 = ADZUNA_APP_ID/KEY not set as Cloudflare env vars yet; anything
      // else (network error, local `python -m http.server` with no
      // Functions support) gets the same quiet fallback.
      notConfigured = true;
      container.innerHTML = "";
    }
  };
}
