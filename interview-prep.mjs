import { renderChrome, loadJSON, escapeHtml, wireCopyButtons } from "./common.mjs";
import { renderProgressBadge, renderMilestoneToggle } from "./progress.mjs";

renderChrome("interview-prep.html");
renderProgressBadge();
renderMilestoneToggle(document.getElementById("milestone"), "practiced-pitch");

async function init() {
  const [data, negotiation] = await Promise.all([
    loadJSON("data/interview-prep.json"),
    loadJSON("data/negotiation-scripts.json"),
  ]);

  document.getElementById("pitch").innerHTML = `${escapeHtml(data.pitch60Second)} <button class="copy-btn" data-copy="${escapeHtml(data.pitch60Second)}">Copy</button>`;

  document.getElementById("qa").innerHTML = data.commonQuestions.map((qa) => `
    <div class="card">
      <h3>"${escapeHtml(qa.question)}"</h3>
      <p>${escapeHtml(qa.answer)} <button class="copy-btn" data-copy="${escapeHtml(qa.answer)}">Copy</button></p>
    </div>`).join("");

  document.getElementById("tech-terms").innerHTML = data.technicalTerms.map((t) =>
    `<li><strong>${escapeHtml(t.term)}:</strong> ${escapeHtml(t.definition)}</li>`).join("");
  document.getElementById("interview-tip").innerHTML = `<strong>Interview tip:</strong> ${escapeHtml(data.interviewTip)}`;

  document.getElementById("star-prompts").innerHTML = data.starPrompts.map((s) => `
    <div class="card">
      <h3>"${escapeHtml(s.question)}"</h3>
      <p><strong>Situation:</strong> ${escapeHtml(s.situation)}</p>
      <p><strong>Task:</strong> ${escapeHtml(s.task)}</p>
      <p><strong>Action:</strong> ${escapeHtml(s.action)}</p>
      <p><strong>Result:</strong> ${escapeHtml(s.result)}</p>
    </div>`).join("");
  document.getElementById("star-tip").innerHTML = `<strong>Fill-in tip:</strong> ${escapeHtml(data.starFillInTip)}`;

  document.getElementById("negotiation-intro").textContent = negotiation.intro;
  document.getElementById("negotiation-scripts").innerHTML = negotiation.scripts.map((s) => `
    <div class="card">
      <h3>${escapeHtml(s.moment)}</h3>
      <p>"${escapeHtml(s.script)}" <button class="copy-btn" data-copy="${escapeHtml(s.script)}">Copy</button></p>
    </div>`).join("");
  document.getElementById("negotiation-rules").innerHTML = negotiation.rules.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
}

init().catch((err) => console.error(err));
wireCopyButtons();
