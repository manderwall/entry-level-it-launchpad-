import { renderChrome, loadJSON, escapeHtml } from "./common.mjs";

renderChrome("search-toolkit.html");

function buildLinks(query, location) {
  return loadJSON("data/job-boards.json").then((boards) => {
    const isRemote = /^remote$/i.test(location.trim());
    const list = document.getElementById("board-links");
    list.innerHTML = boards.map((b) => {
      const template = isRemote ? b.remoteUrlTemplate : (b.localUrlTemplate || b.remoteUrlTemplate);
      if (!template) return "";
      const url = template
        .replace("{query}", encodeURIComponent(query))
        .replace("{location}", encodeURIComponent(location));
      return `<li><a href="${url}" target="_blank" rel="noopener">${escapeHtml(b.name)}</a> — ${escapeHtml(b.note)}</li>`;
    }).join("");
    return boards;
  });
}

async function init() {
  const params = new URLSearchParams(location.search);
  const presetRole = params.get("role");

  const [roles, searchStrings, boards, scorecard, scamChecklist] = await Promise.all([
    loadJSON("data/roles.json"),
    loadJSON("data/search-strings.json"),
    loadJSON("data/job-boards.json"),
    loadJSON("data/application-scorecard.json"),
    loadJSON("data/scam-checklist.json"),
  ]);

  const roleSelect = document.getElementById("role-select");
  const allQueries = [
    ...roles.map((r) => ({ label: r.role, value: r.searchTerms[0] })),
    ...searchStrings.remote.map((s) => ({ label: s, value: s })),
  ];
  roleSelect.innerHTML = allQueries.map((q) => `<option value="${escapeHtml(q.value)}">${escapeHtml(q.label)}</option>`).join("");
  if (presetRole) {
    const match = roles.find((r) => r.role === presetRole);
    if (match) roleSelect.value = match.searchTerms[0];
  }

  const locationInput = document.getElementById("location-input");
  const refresh = () => buildLinks(roleSelect.value, locationInput.value || "Remote");
  roleSelect.addEventListener("change", refresh);
  locationInput.addEventListener("input", refresh);
  refresh();

  document.getElementById("filters").innerHTML = `
    <ul>
      <li><strong>Pay:</strong> ${searchStrings.filters.pay.join(" or ")}</li>
      <li><strong>Experience:</strong> ${searchStrings.filters.experience.join(", ")}</li>
      <li><strong>Work setting:</strong> ${searchStrings.filters.workSetting.join(", ")}</li>
      <li><strong>Keywords:</strong> ${searchStrings.filters.keywords.join(", ")}</li>
    </ul>`;

  document.getElementById("job-boards").innerHTML = boards.map((b) =>
    `<li><a href="${b.remoteUrlTemplate ? b.remoteUrlTemplate.split("?")[0] : "#"}" target="_blank" rel="noopener">${escapeHtml(b.name)}</a> — ${escapeHtml(b.note)}</li>`
  ).join("");

  document.getElementById("alert-setup").innerHTML = boards.filter((b) => b.alertSteps).map((b) =>
    `<p><strong>${escapeHtml(b.name)}:</strong> ${escapeHtml(b.alertSteps)}</p>`
  ).join("");

  const scorecardEl = document.getElementById("scorecard");
  scorecardEl.innerHTML = scorecard.questions.map((q) => `
    <label style="display:flex;gap:0.5rem;align-items:flex-start;font-size:1rem;color:var(--text);margin:0.4rem 0;">
      <input type="checkbox" data-points="${q.points}" class="score-check">
      <span>${escapeHtml(q.text)} <span class="pill">${q.points} pt${q.points > 1 ? "s" : ""}</span></span>
    </label>`).join("");
  const resultEl = document.getElementById("scorecard-result");
  function updateScore() {
    const checks = scorecardEl.querySelectorAll(".score-check");
    let total = 0;
    checks.forEach((c) => { if (c.checked) total += Number(c.dataset.points); });
    resultEl.innerHTML = `Score: <span class="score-badge ${total >= scorecard.prioritizeThreshold ? "pass" : ""}">${total} / ${scorecard.maxScore}</span> ${total >= scorecard.prioritizeThreshold ? "— prioritize this one." : ""}`;
  }
  scorecardEl.addEventListener("change", updateScore);
  updateScore();

  document.getElementById("red-flags").innerHTML = scamChecklist.redFlags.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
  document.getElementById("verification-steps").innerHTML = scamChecklist.verificationSteps.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
}

init().catch((err) => {
  console.error(err);
});
