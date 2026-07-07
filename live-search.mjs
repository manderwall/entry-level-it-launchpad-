// Optional live job results via the Adzuna API (https://developer.adzuna.com/).
// Adzuna was picked because Indeed and LinkedIn no longer offer free public
// search APIs. Adzuna's free tier needs an app_id + app_key, which only the
// site owner can obtain (registration requires a real account) — so this
// stores the keys in the *visitor's own* browser (localStorage) and no-ops
// with setup instructions until they're entered. Nothing is sent anywhere
// except straight to Adzuna's API, over HTTPS, from the visitor's browser.
import { escapeHtml } from "./common.mjs";

const STORAGE_KEY = "entry-level-it-launchpad:adzuna-keys";

function loadKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return { appId: "", appKey: "" };
}

function saveKeys(keys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

async function fetchResults(query, location, keys) {
  const isRemote = /^remote$/i.test(location.trim());
  const params = new URLSearchParams({
    app_id: keys.appId,
    app_key: keys.appKey,
    what: query,
    results_per_page: "10",
  });
  if (!isRemote) params.set("where", location);
  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`);
  return res.json();
}

/**
 * Renders a "Live results" widget into `container`. Call `refresh(query, location)`
 * (returned) whenever the role/location selection changes elsewhere on the page.
 */
export function renderLiveSearch(container) {
  let keys = loadKeys();

  function renderSetupForm() {
    container.innerHTML = `
      <div class="card">
        <h3>Live results (optional)</h3>
        <p>Get a free API key at <a href="https://developer.adzuna.com/" target="_blank" rel="noopener">developer.adzuna.com</a>
           (Indeed and LinkedIn no longer offer free public search APIs, so this uses Adzuna's aggregator instead).
           Your key is stored only in this browser — never uploaded anywhere but Adzuna's API.</p>
        <div class="toolbar">
          <div><label for="adzuna-app-id">App ID</label><input type="text" id="adzuna-app-id" value="${escapeHtml(keys.appId)}"></div>
          <div><label for="adzuna-app-key">App Key</label><input type="text" id="adzuna-app-key" value="${escapeHtml(keys.appKey)}"></div>
          <div><button class="primary" id="adzuna-save">Save key</button></div>
        </div>
      </div>
      <div id="live-results"></div>`;
    container.querySelector("#adzuna-save").addEventListener("click", () => {
      keys = {
        appId: container.querySelector("#adzuna-app-id").value.trim(),
        appKey: container.querySelector("#adzuna-app-key").value.trim(),
      };
      saveKeys(keys);
      if (keys.appId && keys.appKey) renderResultsPanel();
    });
  }

  function renderResultsPanel() {
    container.innerHTML = `
      <div class="card">
        <h3>Live results (optional) <button class="copy-btn" id="adzuna-reset">Change API key</button></h3>
        <div id="live-results">Loading…</div>
      </div>`;
    container.querySelector("#adzuna-reset").addEventListener("click", renderSetupForm);
  }

  if (keys.appId && keys.appKey) renderResultsPanel();
  else renderSetupForm();

  return async function refresh(query, location) {
    if (!keys.appId || !keys.appKey) return; // setup form is showing instead
    const resultsEl = container.querySelector("#live-results");
    if (!resultsEl) return;
    resultsEl.textContent = "Loading…";
    try {
      const data = await fetchResults(query, location, keys);
      if (!data.results || !data.results.length) {
        resultsEl.innerHTML = "<p>No live results for that search — try a broader query.</p>";
        return;
      }
      resultsEl.innerHTML = `<ul class="link-list">${data.results.map((r) => `
        <li><a href="${r.redirect_url}" target="_blank" rel="noopener">${escapeHtml(r.title)}</a>
            — ${escapeHtml(r.company?.display_name || "Unknown company")}
            ${r.location?.display_name ? `· ${escapeHtml(r.location.display_name)}` : ""}
            ${r.salary_min ? `· ~$${Math.round(r.salary_min).toLocaleString()}${r.salary_max && r.salary_max !== r.salary_min ? `-$${Math.round(r.salary_max).toLocaleString()}` : ""}` : ""}
        </li>`).join("")}</ul>`;
    } catch (err) {
      resultsEl.innerHTML = `<p>Couldn't load live results (${escapeHtml(err.message)}). Double-check your API key, or use the board links above instead.</p>`;
    }
  };
}
