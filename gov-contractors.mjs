import { renderChrome, escapeHtml } from "./common.mjs";
import { renderProgressBadge } from "./progress.mjs";

renderChrome("gov-contractors.html");
renderProgressBadge();

const listEl = document.getElementById("contractors-list");

function searchUrl(company) {
  return `https://www.indeed.com/jobs?q=${encodeURIComponent(`"${company}" IT support`)}&l=Houston%2C+TX`;
}

async function refresh() {
  const agency = document.getElementById("agency-select").value;
  const county = document.getElementById("county-select").value;
  listEl.textContent = "Loading…";
  try {
    const res = await fetch(`/api/contractors?${new URLSearchParams({ agency, county })}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
    if (!data.results || !data.results.length) {
      listEl.innerHTML = "<p>No contract awards found for that agency/county combination.</p>";
      return;
    }
    listEl.innerHTML = `<div class="grid two">${data.results.slice(0, 30).map((r) => `
      <div class="card">
        <h3>${escapeHtml(r.recipientName)}</h3>
        ${r.naicsDescription ? `<p class="pill">${escapeHtml(r.naicsDescription)}</p>` : ""}
        ${r.awardAmount ? `<p>Contract value: ~$${Math.round(r.awardAmount).toLocaleString()}</p>` : ""}
        <p><a href="${searchUrl(r.recipientName)}" target="_blank" rel="noopener">Search openings →</a></p>
      </div>`).join("")}</div>`;
  } catch (err) {
    listEl.innerHTML = `<p>Live contractor data isn't available right now (${escapeHtml(err.message)}). This feature only works on the deployed Cloudflare Pages site, not a local static server — try the live URL, or check <a href="https://www.usaspending.gov/" target="_blank" rel="noopener">USAspending.gov</a> directly.</p>`;
  }
}

document.getElementById("agency-select").addEventListener("change", refresh);
document.getElementById("county-select").addEventListener("change", refresh);
refresh();
