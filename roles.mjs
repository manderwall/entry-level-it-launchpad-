import { renderChrome, loadJSON, escapeHtml, wireCopyButtons } from "./common.mjs";
import { renderProgressBadge, renderMilestoneToggle } from "./progress.mjs";
import { getSettings, saveSettings } from "./settings.mjs";

renderChrome("roles.html");
renderProgressBadge();
renderMilestoneToggle(document.getElementById("milestone"), "pick-roles");

document.getElementById("filter-min-pay").value = getSettings().payFloor;
// Keep the filter in sync if the pay floor is changed via the ⚙ Settings
// dialog while already on this page, not just on the next page load.
document.addEventListener("settings:changed", () => {
  document.getElementById("filter-min-pay").value = getSettings().payFloor;
  render();
});

let ROLES = [];

function hourlyEquivalentMax(role) {
  // Rough hourly-equivalent ceiling for comparing salaried roles (2080 hrs/yr).
  return role.payType === "salary" ? role.payMax / 2080 : role.payMax;
}

function render() {
  const minPay = Number(document.getElementById("filter-min-pay").value) || 0;
  const remoteFilter = document.getElementById("filter-remote").value;

  const filtered = ROLES
    .filter((r) => hourlyEquivalentMax(r) >= minPay)
    .filter((r) => !remoteFilter || r.remoteOdds.startsWith(remoteFilter));

  const list = document.getElementById("roles-list");
  if (!filtered.length) {
    list.innerHTML = "<p>No roles match that filter — try lowering the minimum pay.</p>";
    return;
  }

  list.innerHTML = filtered.map((r) => `
    <div class="card">
      <h3><span aria-hidden="true">${r.icon || "🛠️"}</span> ${r.rank}. ${escapeHtml(r.role)}</h3>
      <p><span class="pill ${r.remoteOdds.startsWith("High") ? "high" : ""}">${escapeHtml(r.remoteOdds)} remote odds</span>
         <span class="pill">${escapeHtml(r.payTarget)}</span></p>
      <p><strong>Why this fits:</strong> ${escapeHtml(r.whyFit)}</p>
      <p><strong>Typical work:</strong> ${escapeHtml(r.typicalWork)}</p>
      <p><strong>Best search terms:</strong> ${r.searchTerms.map(escapeHtml).join(", ")}
        <a href="search-toolkit.html?role=${encodeURIComponent(r.role)}">Search this role →</a></p>
    </div>
  `).join("");
}

Promise.all([
  loadJSON("data/roles.json"),
  loadJSON("data/stretch-roles.json"),
]).then(([roles, stretch]) => {
  ROLES = roles;
  render();
  document.getElementById("stretch-roles").innerHTML = stretch.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  document.getElementById("filter-min-pay").addEventListener("input", render);
  document.getElementById("filter-min-pay").addEventListener("change", (e) => saveSettings({ payFloor: Number(e.target.value) || 0 }));
  document.getElementById("filter-remote").addEventListener("change", render);
}).catch(() => {
  document.getElementById("roles-list").textContent = "Could not load role data.";
});

wireCopyButtons();
