import { renderChrome, loadJSON, escapeHtml } from "./common.mjs";

renderChrome("index.html");

const GUIDE_PAGES = [
  { href: "roles.html", title: "Best-Fit Roles & Pay", desc: "The five best target roles, full role details, what the work looks like, and salary targets." },
  { href: "search-toolkit.html", title: "Search Toolkit", desc: "Copy-paste search strings, a zone/city link generator, an application scorecard, and scam red flags." },
  { href: "zones.html", title: "Houston Zones & Getting There", desc: "The metro broken into zones — where the jobs are, transit access, and how to search when transportation is a barrier." },
  { href: "resume.html", title: "Resume, LinkedIn & Cover Letter", desc: "Resume headline, summary, bullets; LinkedIn About; a short cover letter; and message templates." },
  { href: "projects-certs.html", title: "Skill-Building Projects & Next Certs", desc: "Five small projects with ready-made resume bullets, plus a cert cost/payoff calculator." },
  { href: "employers.html", title: "Employers, Pipelines & Apprenticeships", desc: "Staffing agencies, remote support pipelines, apprenticeships, and networking scripts." },
  { href: "interview-prep.html", title: "Interview Prep", desc: "The 60-second pitch, strong answers to common questions, STAR prompts, and quick technical definitions." },
  { href: "plan-tracker.html", title: "Application Plan & Weekly Tracker", desc: "A 2-week plan, a browser-local application tracker, and weekly goals." },
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
      <td><strong>${escapeHtml(r.role)}</strong></td>
      <td>${escapeHtml(r.payTarget)}</td>
      <td>${escapeHtml(r.remoteOdds)}</td>
    </tr>`).join("");
  document.getElementById("roles-preview").innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Target role</th><th>Realistic pay target</th><th>Remote odds</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}).catch(() => {
  document.getElementById("roles-preview").textContent = "Could not load role data.";
});
