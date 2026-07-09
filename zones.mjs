import { renderChrome, loadJSON, escapeHtml } from "./common.mjs";
import { renderProgressBadge, renderMilestoneToggle } from "./progress.mjs";

renderChrome("zones.html");
renderProgressBadge();
renderMilestoneToggle(document.getElementById("milestone"), "checked-zones");

async function init() {
  const [zonesData, transport] = await Promise.all([
    loadJSON("data/houston-zones.json"),
    loadJSON("data/transportation-strategies.json"),
  ]);
  const { zones } = zonesData;

  const zoneSelect = document.getElementById("zone-select");
  zoneSelect.innerHTML = zones.map((z) => `<option value="${z.id}">${z.icon || "📍"} ${escapeHtml(z.name)}</option>`).join("");

  function renderZoneDetail(zoneId) {
    const z = zones.find((zz) => zz.id === zoneId);
    if (!z) return;
    const searchUrl = `search-toolkit.html?role=${encodeURIComponent("help desk CompTIA A+ " + (z.zips[0] || z.name))}`;
    document.getElementById("zone-detail").innerHTML = `
      <div class="card">
        <h3><span aria-hidden="true">${z.icon || "📍"}</span> ${escapeHtml(z.name)} ${z.tag ? `<span class="pill high">${escapeHtml(z.tag)}</span>` : ""}</h3>
        <p><strong>Areas:</strong> ${z.areas.map(escapeHtml).join(", ")}</p>
        <p><strong>What's there for you:</strong> ${escapeHtml(z.whatsThere)}</p>
        <p><strong>Getting there without a car:</strong> ${escapeHtml(z.transit)}</p>
        <p><strong>Typical entry support pay:</strong> ${escapeHtml(z.payRange)} — ${escapeHtml(z.payNotes)}</p>
        ${z.employers.length
          ? `<p><strong>Employers to check:</strong> ${z.employers.map(escapeHtml).join(", ")}</p>`
          : z.employersNote ? `<p><strong>Employers to check:</strong> ${escapeHtml(z.employersNote)}</p>` : ""}
        <p><a href="${searchUrl}">Search this zone on the Search Toolkit →</a></p>
      </div>`;
  }

  zoneSelect.addEventListener("change", () => renderZoneDetail(zoneSelect.value));
  renderZoneDetail(zones[0].id);

  document.getElementById("zones-table").innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Zone</th><th>Areas</th><th>What's there</th><th>Getting there</th></tr></thead>
      <tbody>${zones.map((z) => `
        <tr>
          <td><span aria-hidden="true">${z.icon || "📍"}</span> <strong>${escapeHtml(z.name)}</strong>${z.tag ? `<br><span class="pill high">${escapeHtml(z.tag)}</span>` : ""}</td>
          <td>${z.areas.map(escapeHtml).join(", ")}</td>
          <td>${escapeHtml(z.whatsThere)}</td>
          <td>${escapeHtml(z.transit)}</td>
        </tr>`).join("")}</tbody>
    </table></div>`;

  document.getElementById("pay-table").innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Zone</th><th>Typical pay</th><th>Notes</th></tr></thead>
      <tbody>${zones.map((z) => `
        <tr><td>${escapeHtml(z.name)}</td><td>${escapeHtml(z.payRange)}</td><td>${escapeHtml(z.payNotes)}</td></tr>`).join("")}</tbody>
    </table></div>
    <p class="disclaimer">${escapeHtml(zonesData.payDisclaimer)}</p>`;

  document.getElementById("example-listings").innerHTML = zonesData.recentExampleListings.map((l) => `<li>${escapeHtml(l)}</li>`).join("");

  document.getElementById("transport-reality").textContent = transport.realityCheck;
  document.getElementById("car-tips").innerHTML = transport.ifYouHaveACar.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  document.getElementById("no-car-strategies").innerHTML = transport.ifTransportationIsLimited.map((s) =>
    `<li><strong>${escapeHtml(s.strategy)}.</strong> ${escapeHtml(s.detail)}</li>`).join("");
  document.getElementById("other-metro-method").innerHTML = zonesData.otherMetroMethod.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
}

init().catch((err) => console.error(err));
