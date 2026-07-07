import { renderChrome, loadJSON, escapeHtml, wireCopyButtons } from "./common.mjs";

renderChrome("employers.html");

const ZONE_LABELS = {
  "inner-loop": "Inner Loop / Medical Center (TMC)",
  "uptown-galleria": "Uptown / Galleria / Westchase",
  "energy-corridor": "Energy Corridor / Katy / West",
  "north-woodlands": "North / Woodlands / Spring",
  "clear-lake": "Southeast / Clear Lake / Bay Area",
  "southwest-sugarland": "Southwest / Sugar Land / Fort Bend",
};

async function init() {
  const employers = await loadJSON("data/employers.json");

  document.getElementById("staffing").innerHTML = employers.staffingContractToHire.map((s) => `<li>${escapeHtml(s)}</li>`).join("");

  document.getElementById("remote-pipelines").innerHTML = employers.remotePipelines.map((p) => `
    <li><strong>${p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${escapeHtml(p.name)}</a>` : escapeHtml(p.name)}</strong> — ${escapeHtml(p.note)}</li>
  `).join("");

  document.getElementById("by-zone").innerHTML = Object.entries(employers.byZone)
    .filter(([, list]) => list.length)
    .map(([zoneId, list]) => `<p><strong>${escapeHtml(ZONE_LABELS[zoneId] || zoneId)}:</strong> ${list.map(escapeHtml).join(", ")}</p>`)
    .join("");

  document.getElementById("also-anywhere").textContent = employers.alsoCheckAnywhere.join(", ");
  document.getElementById("national-firms").textContent = employers.nationalStaffingBpo.join(", ");

  const app = employers.apprenticeships;
  document.getElementById("apprenticeships").innerHTML = `
    <p><a href="${app.primaryResource.url}" target="_blank" rel="noopener">${escapeHtml(app.primaryResource.name)}</a>
       lists tracks including ${app.tracks.map(escapeHtml).join(", ")}.</p>
    <p><strong>Search terms:</strong> ${app.searchTerms.map(escapeHtml).join(" · ")}</p>
    <p>${escapeHtml(app.payBenchmark)}</p>`;

  document.getElementById("per-scholas").innerHTML = employers.perScholasAdvantage.map((s) => `<li>${escapeHtml(s)}</li>`).join("");

  const scripts = employers.networkingScripts;
  document.getElementById("scripts").innerHTML = `
    <div class="card"><h3>LinkedIn connection request</h3><p>${escapeHtml(scripts.linkedinConnectionRequest)} <button class="copy-btn" data-copy="${escapeHtml(scripts.linkedinConnectionRequest)}">Copy</button></p></div>
    <div class="card"><h3>Informational interview request</h3><p>${escapeHtml(scripts.informationalInterviewRequest)} <button class="copy-btn" data-copy="${escapeHtml(scripts.informationalInterviewRequest)}">Copy</button></p></div>
    <div class="card"><h3>Referral ask</h3><p>${escapeHtml(scripts.referralAsk)} <button class="copy-btn" data-copy="${escapeHtml(scripts.referralAsk)}">Copy</button></p></div>`;
}

init().catch((err) => console.error(err));
wireCopyButtons();
