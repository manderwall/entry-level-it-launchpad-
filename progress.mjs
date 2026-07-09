// Shared cross-page progress tracking. Same pattern as the application
// tracker: stored only in the visitor's own browser (localStorage),
// nothing uploaded. This is the realistic version of "engagement" for a
// static, no-backend site — a persistent checklist, not a fake streak.
import { escapeHtml } from "./common.mjs";

const STORAGE_KEY = "entry-level-it-launchpad:progress";

export const MILESTONES = [
  { id: "set-area", label: "Set your area, commute, and pay floor", page: "index.html" },
  { id: "pick-roles", label: "Picked 2 primary + 1 backup target role", page: "roles.html" },
  { id: "set-alerts", label: "Set up 2-3 job search alerts", page: "search-toolkit.html" },
  { id: "checked-zones", label: "Identified your commute zone(s)", page: "zones.html" },
  { id: "update-resume", label: "Updated resume headline, summary, and LinkedIn", page: "resume.html" },
  { id: "picked-cert", label: "Picked your next certification", page: "projects-certs.html" },
  { id: "shortlisted-employers", label: "Shortlisted employers/pipelines to watch", page: "employers.html" },
  { id: "practiced-pitch", label: "Practiced the 60-second pitch out loud", page: "interview-prep.html" },
  { id: "wrote-star-story", label: "Wrote at least one STAR-format story", page: "story-bank.html" },
  { id: "started-tracking", label: "Logged your first application in the tracker", page: "plan-tracker.html" },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return {};
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function countDone(state) {
  return MILESTONES.filter((m) => state[m.id]).length;
}

/** Renders a small "X/N done" badge (N = MILESTONES.length) into the header and keeps it live. */
export function renderProgressBadge() {
  const target = document.querySelector(".site-header-inner");
  if (!target) return;
  const badge = document.createElement("a");
  badge.href = "index.html#progress";
  badge.className = "progress-badge";
  badge.setAttribute("aria-live", "polite");
  target.appendChild(badge);

  function update() {
    const state = loadState();
    badge.textContent = `${countDone(state)}/${MILESTONES.length} steps done`;
  }
  update();
  window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEY) update(); });
  document.addEventListener("progress:changed", update);
}

/** Renders the full checklist (used on index.html). */
export function renderChecklist(container) {
  const state = loadState();
  container.innerHTML = MILESTONES.map((m) => `
    <li>
      <input type="checkbox" id="ms-${m.id}" ${state[m.id] ? "checked" : ""}>
      <label for="ms-${m.id}">${escapeHtml(m.label)} — <a href="${m.page}">go to page</a></label>
    </li>`).join("");

  container.addEventListener("change", (e) => {
    const input = e.target.closest("input[type=checkbox]");
    if (!input) return;
    const id = input.id.replace("ms-", "");
    const s = loadState();
    s[id] = input.checked;
    saveState(s);
    document.dispatchEvent(new CustomEvent("progress:changed"));
  });
}

/** Renders a single milestone checkbox for embedding on its own page (e.g. Roles, Resume). */
export function renderMilestoneToggle(container, milestoneId) {
  const milestone = MILESTONES.find((m) => m.id === milestoneId);
  if (!milestone) return;
  const state = loadState();
  container.innerHTML = `
    <label style="display:flex;gap:0.5rem;align-items:center;font-size:0.95rem;">
      <input type="checkbox" id="ms-toggle-${milestoneId}" ${state[milestoneId] ? "checked" : ""}>
      <span>Mark "${escapeHtml(milestone.label)}" as done</span>
    </label>`;
  container.querySelector("input").addEventListener("change", (e) => {
    const s = loadState();
    s[milestoneId] = e.target.checked;
    saveState(s);
    document.dispatchEvent(new CustomEvent("progress:changed"));
  });
}
