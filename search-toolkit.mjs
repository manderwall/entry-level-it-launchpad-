import { renderChrome, loadJSON, escapeHtml, wireCopyButtons } from "./common.mjs";
import { renderProgressBadge, renderMilestoneToggle } from "./progress.mjs";
import { renderLiveSearch } from "./live-search.mjs";

renderChrome("search-toolkit.html");
renderProgressBadge();
renderMilestoneToggle(document.getElementById("milestone"), "set-alerts");
const refreshLiveSearch = renderLiveSearch(document.getElementById("live-search"));

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
  const locationInput = document.getElementById("location-input");

  // Local search strings (data/search-strings.json's localTemplate) need
  // the {city} placeholder filled in with whatever the visitor typed, so
  // this list has to rebuild whenever the location changes — unlike the
  // static role/remote options, which don't depend on it.
  function populateRoleSelect() {
    const previousValue = roleSelect.value;
    const cityRaw = locationInput.value.trim();
    const city = cityRaw && !/^remote$/i.test(cityRaw) ? cityRaw : "";
    const localOptions = city
      ? searchStrings.localTemplate.map((t) => {
          const value = t.replace("{city}", city);
          return `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`;
        }).join("")
      : "";
    const roleOptions = roles.map((r) => `<option value="${escapeHtml(r.searchTerms[0])}">${escapeHtml(r.role)}</option>`).join("");
    const remoteOptions = searchStrings.remote.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
    roleSelect.innerHTML = `
      <optgroup label="By target role">${roleOptions}</optgroup>
      <optgroup label="Remote search terms">${remoteOptions}</optgroup>
      ${localOptions ? `<optgroup label="Local search terms for ${escapeHtml(city)}">${localOptions}</optgroup>` : ""}`;
    if ([...roleSelect.options].some((o) => o.value === previousValue)) roleSelect.value = previousValue;
  }
  populateRoleSelect();
  if (presetRole) {
    const match = roles.find((r) => r.role === presetRole);
    if (match) roleSelect.value = match.searchTerms[0];
  }

  const refresh = () => {
    const loc = locationInput.value || "Remote";
    buildLinks(roleSelect.value, loc);
    refreshLiveSearch(roleSelect.value, loc);
  };
  roleSelect.addEventListener("change", refresh);
  locationInput.addEventListener("input", populateRoleSelect);
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

  // A ready-made "check this posting" prompt for whatever AI someone
  // already has, built from this page's own scam-checklist criteria.
  // Deliberately labeled as reasoning-only in the prompt itself (no
  // domain/portal verification is possible from pasted text alone) so
  // it doesn't overstate what any AI reading it can actually confirm.
  const LEGITIMACY_PROMPT = `I want a second opinion on whether a job posting looks legitimate or has red flags. Paste the full posting text below this line:
[PASTE THE JOB POSTING HERE]

Please give me a three-tier read - High confidence (normal signals present), Proceed with caution (some signals missing but explainable), or Suspicious (multiple red flags stacked together) - checking specifically for:
${scamChecklist.redFlags.map((f) => `- ${f}`).join("\n")}

Rules for your answer:
1. This is a signal, not an accusation - never say a company or posting "is a scam," just describe what you observed and let me decide.
2. Always name at least one legitimate explanation when flagging caution or suspicious, so I'm not needlessly scared off a real opportunity.
3. You cannot verify the company's real domain, look up other postings, or confirm the role is still open - you only have the text I pasted. Say so plainly rather than guessing at anything you can't actually check from the text alone.
4. If uncertain, default to "Proceed with caution" rather than "Suspicious."`;

  document.getElementById("legitimacy-prompt").innerHTML = `
    <pre style="white-space:pre-wrap;font-family:inherit;margin:0 0 0.75rem;">${escapeHtml(LEGITIMACY_PROMPT)}</pre>
    <button class="copy-btn" data-copy="${escapeHtml(LEGITIMACY_PROMPT)}" aria-label="Copy: posting legitimacy AI prompt">Copy</button>`;
}

document.getElementById("print-btn")?.addEventListener("click", () => window.print());
init().catch((err) => {
  console.error(err);
});
wireCopyButtons();
