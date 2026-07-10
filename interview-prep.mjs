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

  document.getElementById("pitch").innerHTML = `${escapeHtml(data.pitch60Second)} <button class="copy-btn" data-copy="${escapeHtml(data.pitch60Second)}" aria-label="Copy: 60-second pitch">Copy</button>`;

  document.getElementById("qa").innerHTML = data.commonQuestions.map((qa) => `
    <div class="card">
      <h3>"${escapeHtml(qa.question)}"</h3>
      <p>${escapeHtml(qa.answer)} <button class="copy-btn" data-copy="${escapeHtml(qa.answer)}" aria-label="Copy: answer to ${escapeHtml(qa.question)}">Copy</button></p>
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
      <p>"${escapeHtml(s.script)}" <button class="copy-btn" data-copy="${escapeHtml(s.script)}" aria-label="Copy: ${escapeHtml(s.moment)} script">Copy</button></p>
    </div>`).join("");
  document.getElementById("negotiation-rules").innerHTML = negotiation.rules.map((r) => `<li>${escapeHtml(r)}</li>`).join("");

  // A ready-made mock-interview prompt for whatever AI chat tool someone
  // already uses — pulls in real saved STAR stories from the Story Bank
  // (same localStorage key story-bank.mjs owns) when there are any,
  // falling back to this page's generic prompts otherwise, so the AI has
  // real material instead of generic filler to work from.
  let stories = [];
  try {
    stories = JSON.parse(localStorage.getItem("entry-level-it-launchpad:star-stories") || "[]")
      .filter((s) => s.title || s.situation);
  } catch {
    // ignore corrupt storage
  }
  const storyText = stories.length
    ? stories.map((s) => `- ${s.title || "Untitled story"}: ${s.situation || ""} ${s.task || ""} ${s.action || ""} ${s.result || ""}`.trim()).join("\n")
    : data.starPrompts.map((s) => `- ${s.situation}`).join("\n");

  const MOCK_INTERVIEW_PROMPT = `I'm interviewing for entry-level IT support roles (help desk, technical support, product support).

My 60-second pitch: ${data.pitch60Second}

Stories I can draw on:
${storyText}

Please act as my interviewer. Ask me one behavioral or light-technical question at a time, wait for my answer, then give brief, honest feedback (what was strong, what to add, whether my STAR structure was clear) before asking the next one. Only comment on what I actually say — don't assume details I haven't given you.`;

  document.getElementById("ai-prompt").innerHTML = `
    <pre style="white-space:pre-wrap;font-family:inherit;margin:0 0 0.75rem;">${escapeHtml(MOCK_INTERVIEW_PROMPT)}</pre>
    <button class="copy-btn" data-copy="${escapeHtml(MOCK_INTERVIEW_PROMPT)}" aria-label="Copy: mock interview AI prompt">Copy</button>`;
}

init().catch((err) => console.error(err));
wireCopyButtons();
