import { renderChrome, loadJSON, escapeHtml } from "./common.mjs";
import { renderProgressBadge, renderMilestoneToggle } from "./progress.mjs";

renderChrome("plan-tracker.html");
renderProgressBadge();
renderMilestoneToggle(document.getElementById("milestone"), "started-tracking");

const STORAGE_KEY = "entry-level-it-launchpad:tracker-rows";

function loadRows(exampleRow) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage, fall through to default
  }
  return [{ ...exampleRow }];
}

function saveRows(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

async function init() {
  const schema = await loadJSON("data/weekly-tracker-schema.json");
  let rows = loadRows(schema.exampleRow);

  const plan = schema.twoWeekPlan;
  document.getElementById("two-week-plan").innerHTML = `
    <div class="card"><h3>Days 1-2: ${escapeHtml(plan.days1to2.title)}</h3><ul>${plan.days1to2.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></div>
    <div class="card"><h3>Days 3-7: ${escapeHtml(plan.days3to7.title)}</h3><p>${escapeHtml(plan.days3to7.dailyTarget)}:</p><ul>${plan.days3to7.breakdown.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></div>
    <div class="card"><h3>Days 8-14: ${escapeHtml(plan.days8to14.title)}</h3><ul>${plan.days8to14.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></div>`;

  document.getElementById("weekly-goals").innerHTML = schema.weeklyGoals.map((g) => `<li>${escapeHtml(g)}</li>`).join("");

  const financial = await loadJSON("data/financial-resources.json");
  document.getElementById("financial-resources").innerHTML = financial.map((f) => `
    <div class="card">
      <h3>${f.url ? `<a href="${f.url}" target="_blank" rel="noopener">${escapeHtml(f.name)}</a>` : escapeHtml(f.name)}</h3>
      <p>${escapeHtml(f.description)}</p>
    </div>`).join("");

  const tableEl = document.getElementById("tracker-table");
  const bannerEl = document.getElementById("followup-banner");

  function renderFollowupBanner() {
    const today = new Date().toISOString().slice(0, 10);
    const due = rows.filter((r) => r.followUpDate && r.followUpDate <= today && !["Rejected", "Withdrawn"].includes(r.status));
    if (!due.length) {
      bannerEl.innerHTML = "";
      return;
    }
    const names = due.map((r) => escapeHtml(r.company || "an application")).join(", ");
    bannerEl.innerHTML = `<p class="callout yellow">📌 <strong>${due.length} follow-up${due.length > 1 ? "s" : ""} due:</strong> ${names}. Update their status below once you've followed up.</p>`;
  }

  function renderTable() {
    const headCells = schema.columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("") + "<th class=\"no-print\">Remove</th>";
    const bodyRows = rows.map((row, idx) => {
      const cells = schema.columns.map((c) => {
        const val = row[c.key] ?? "";
        if (c.type === "select") {
          const opts = c.options.map((o) => `<option value="${escapeHtml(o)}" ${o === val ? "selected" : ""}>${escapeHtml(o)}</option>`).join("");
          return `<td><select data-row="${idx}" data-key="${c.key}">${opts}</select></td>`;
        }
        const inputType = c.type === "date" ? "date" : "text";
        return `<td><input type="${inputType}" data-row="${idx}" data-key="${c.key}" value="${escapeHtml(val)}"></td>`;
      }).join("");
      return `<tr>${cells}<td class="no-print"><button data-remove="${idx}" aria-label="Remove row">✕</button></td></tr>`;
    }).join("");
    tableEl.innerHTML = `<thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody>`;
  }

  function handleFieldChange(e) {
    const { row, key } = e.target.dataset;
    if (row === undefined) return;
    rows[Number(row)][key] = e.target.value;
    saveRows(rows);
    renderFollowupBanner();
  }
  tableEl.addEventListener("input", handleFieldChange);
  tableEl.addEventListener("change", handleFieldChange);

  tableEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    rows.splice(Number(btn.dataset.remove), 1);
    if (!rows.length) rows.push(Object.fromEntries(schema.columns.map((c) => [c.key, ""])));
    saveRows(rows);
    renderTable();
    renderFollowupBanner();
  });

  document.getElementById("add-row").addEventListener("click", () => {
    rows.push(Object.fromEntries(schema.columns.map((c) => [c.key, ""])));
    saveRows(rows);
    renderTable();
    renderFollowupBanner();
  });

  document.getElementById("clear-tracker").addEventListener("click", () => {
    if (!confirm("Clear all tracker rows? This cannot be undone.")) return;
    rows = [Object.fromEntries(schema.columns.map((c) => [c.key, ""]))];
    saveRows(rows);
    renderTable();
    renderFollowupBanner();
  });

  document.getElementById("export-csv").addEventListener("click", () => {
    const header = schema.columns.map((c) => c.label).join(",");
    const csvRows = rows.map((r) => schema.columns.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "job-search-tracker.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  renderTable();
  renderFollowupBanner();
}

init().catch((err) => console.error(err));
