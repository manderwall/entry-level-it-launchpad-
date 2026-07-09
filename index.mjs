import { renderChrome, loadJSON, escapeHtml } from "./common.mjs";
import { renderProgressBadge, renderChecklist } from "./progress.mjs";
import { getSettings } from "./settings.mjs";
import { computeNextStep } from "./next-step.mjs";

renderChrome("index.html");
renderProgressBadge();
renderChecklist(document.getElementById("progress-checklist"));

function updateHeroPayFloor() {
  document.getElementById("hero-pay-floor").textContent = `$${getSettings().payFloor}/hr`;
}
updateHeroPayFloor();
// Without this, changing your pay floor in Settings and closing the
// dialog left the hero still showing the old number until a reload —
// looked like the change hadn't saved, even though it had.
document.addEventListener("settings:changed", updateHeroPayFloor);

function renderNextStep() {
  const step = computeNextStep();
  document.getElementById("next-step").innerHTML = `
    <p>${escapeHtml(step.text)}</p>
    <a class="btn primary" href="${step.href}">${escapeHtml(step.label)} →</a>`;
}
renderNextStep();
document.addEventListener("progress:changed", renderNextStep);
document.addEventListener("settings:changed", renderNextStep);
window.addEventListener("storage", (e) => {
  if (e.key === "entry-level-it-launchpad:progress" || e.key === "entry-level-it-launchpad:tracker-rows") renderNextStep();
});

const GUIDE_PAGES = [
  { href: "roles.html", title: "Best-Fit Roles & Pay", desc: "The five best target roles, full role details, what the work looks like, and salary targets." },
  { href: "search-toolkit.html", title: "Search Toolkit", desc: "Copy-paste search strings, a zone/city link generator, an application scorecard, and scam red flags." },
  { href: "zones.html", title: "Houston Zones & Getting There", desc: "The metro broken into zones — where the jobs are, transit access, and how to search when transportation is a barrier." },
  { href: "resume.html", title: "Resume, LinkedIn & Cover Letter", desc: "Resume headline, summary, bullets, LinkedIn About, and a short cover letter." },
  { href: "projects-certs.html", title: "Skill-Building Projects & Next Certs", desc: "Five small projects with ready-made resume bullets, plus a cert cost/payoff calculator." },
  { href: "employers.html", title: "Employers, Pipelines & Apprenticeships", desc: "Staffing agencies, remote support pipelines, apprenticeships, and outreach/networking scripts." },
  { href: "gov-contractors.html", title: "Government Contractors & Subcontractors", desc: "Federal contract awards near Houston/JSC, pulled live from USAspending.gov — not a hiring board, but a place to start researching employers." },
  { href: "interview-prep.html", title: "Interview Prep", desc: "The 60-second pitch, strong answers to common questions, STAR prompts, quick technical definitions, and negotiation scripts." },
  { href: "story-bank.html", title: "STAR Story Bank", desc: "Build 5-10 reusable interview stories from your own real experience." },
  { href: "plan-tracker.html", title: "Application Plan & Weekly Tracker", desc: "A 2-week plan, a browser-local application tracker, and weekly goals." },
  { href: "trust-safety.html", title: "Trust & Safety", desc: "What this site and its optional AI assistant will never do, in plain language." },
];

document.getElementById("guide-contents").innerHTML = GUIDE_PAGES.map((p) => `
  <div class="card">
    <h3><a href="${p.href}">${escapeHtml(p.title)}</a></h3>
    <p>${escapeHtml(p.desc)}</p>
  </div>
`).join("");

loadJSON("data/roles.json").then((roles) => {
  const rows = roles.map((r) => `
    <tr>
      <td>${r.rank}</td>
      <td><span aria-hidden="true">${r.icon || "🛠️"}</span> <strong>${escapeHtml(r.role)}</strong></td>
      <td>${escapeHtml(r.payTarget)}</td>
      <td>${escapeHtml(r.remoteOdds)}</td>
    </tr>`).join("");
  document.getElementById("roles-preview").innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Rank</th><th>Target role</th><th>Realistic pay target</th><th>Remote odds</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}).catch(() => {
  document.getElementById("roles-preview").textContent = "Could not load role data.";
});
