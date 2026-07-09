// STAR-format interview story bank, stored only in this browser
// (localStorage) — same privacy model as the tracker and progress
// checklist. A handful of real "master stories" answer a wide range of
// behavioral interview questions, which also reduces on-the-spot
// improvisation pressure (a neurodivergent-affirming design goal called
// out in this project's accessibility notes).
import { renderChrome, escapeHtml } from "./common.mjs";
import { renderProgressBadge, renderMilestoneToggle } from "./progress.mjs";

renderChrome("story-bank.html");
renderProgressBadge();
renderMilestoneToggle(document.getElementById("milestone"), "wrote-star-story");

const STORAGE_KEY = "entry-level-it-launchpad:star-stories";

const SUGGESTED_TAGS = ["Teamwork", "Conflict", "Failure", "Leadership", "Initiative", "Learning something new"];

const FIELDS = [
  { key: "title", label: "Short title", placeholder: "e.g. \"The billing complaint that escalated\"", type: "text" },
  { key: "tags", label: "Tags (comma-separated)", placeholder: "e.g. Conflict, Initiative", type: "text" },
  { key: "situation", label: "Situation", placeholder: "What was going on? Where and when did this happen?", type: "textarea" },
  { key: "task", label: "Task", placeholder: "What were you responsible for in that moment?", type: "textarea" },
  { key: "action", label: "Action", placeholder: "What did you actually do, step by step?", type: "textarea" },
  { key: "result", label: "Result", placeholder: "What happened? A number, an outcome, a compliment, a lesson.", type: "textarea" },
  { key: "reflection", label: "Reflection (optional, extra credit)", placeholder: "What would you do differently, or what did this teach you?", type: "textarea" },
];

function blankStory() {
  return Object.fromEntries(FIELDS.map((f) => [f.key, ""]));
}

function loadStories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return [];
}

function saveStories(stories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

let stories = loadStories();
const listEl = document.getElementById("story-list");

function render() {
  if (!stories.length) {
    listEl.innerHTML = `<p>No stories yet. Add your first one below &mdash; pull from real work, school, volunteering, personal projects, or life experience. Five to ten stories can usually answer most behavioral questions you'll be asked.</p>`;
  } else {
    listEl.innerHTML = stories.map((s, idx) => `
      <div class="card" data-idx="${idx}">
        ${FIELDS.map((f) => `
          <label for="story-${idx}-${f.key}">${escapeHtml(f.label)}</label>
          ${f.type === "textarea"
            ? `<textarea id="story-${idx}-${f.key}" data-key="${f.key}" placeholder="${escapeHtml(f.placeholder)}">${escapeHtml(s[f.key] || "")}</textarea>`
            : `<input type="text" id="story-${idx}-${f.key}" data-key="${f.key}" placeholder="${escapeHtml(f.placeholder)}" value="${escapeHtml(s[f.key] || "")}">`}
        `).join("")}
        <div class="toolbar no-print">
          <button data-remove="${idx}">Remove this story</button>
        </div>
      </div>`).join("");
  }
  document.getElementById("story-count").textContent = `${stories.length} ${stories.length === 1 ? "story" : "stories"} saved`;
}

listEl.addEventListener("input", (e) => {
  const card = e.target.closest("[data-idx]");
  if (!card) return;
  const idx = Number(card.dataset.idx);
  const key = e.target.dataset.key;
  if (!key) return;
  stories[idx][key] = e.target.value;
  saveStories(stories);
});

listEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove]");
  if (!btn) return;
  if (!confirm("Remove this story? This cannot be undone.")) return;
  stories.splice(Number(btn.dataset.remove), 1);
  saveStories(stories);
  render();
});

document.getElementById("add-story").addEventListener("click", () => {
  stories.push(blankStory());
  saveStories(stories);
  render();
  document.getElementById(`story-${stories.length - 1}-title`)?.focus();
});

document.getElementById("suggested-tags").innerHTML = SUGGESTED_TAGS.map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join(" ");

render();
