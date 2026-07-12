import { renderChrome, loadJSON, escapeHtml } from "./common.mjs";
import { renderProgressBadge, renderMilestoneToggle } from "./progress.mjs";

renderChrome("plan-tracker.html");
renderProgressBadge();
renderMilestoneToggle(document.getElementById("milestone"), "started-tracking");

const STORAGE_KEY = "entry-level-it-launchpad:tracker-rows";

function loadRows(columns) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage, fall through to default
  }
  // Start genuinely blank, not pre-filled with the "Example Co." sample
  // row — a filled row here used to look like a real logged application
  // to a brand-new visitor, and silently defeated the follow-up banner
  // and the homepage's "log your first application" prompt (both count
  // any row with a company/role as real). Column placeholders below show
  // the example values instead, without polluting actual saved data.
  return [Object.fromEntries(columns.map((c) => [c.key, ""]))];
}

function saveRows(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

async function init() {
  const schema = await loadJSON("data/weekly-tracker-schema.json");
  let rows = loadRows(schema.columns);

  const plan = schema.twoWeekPlan;
  const timeTag = (t) => t ? ` <span class="pill">${escapeHtml(t)}</span>` : "";
  document.getElementById("two-week-plan").innerHTML = `
    <div class="card"><h3>Days 1-2: ${escapeHtml(plan.days1to2.title)}${timeTag(plan.days1to2.estimatedTime)}</h3><ul>${plan.days1to2.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></div>
    <div class="card"><h3>Days 3-7: ${escapeHtml(plan.days3to7.title)}${timeTag(plan.days3to7.estimatedTime)}</h3><p>${escapeHtml(plan.days3to7.dailyTarget)}:</p><ul>${plan.days3to7.breakdown.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></div>
    <div class="card"><h3>Days 8-14: ${escapeHtml(plan.days8to14.title)}${timeTag(plan.days8to14.estimatedTime)}</h3><ul>${plan.days8to14.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul></div>`;

  document.getElementById("pace-note").textContent = schema.paceNote;
  document.getElementById("weekly-goals").innerHTML = schema.weeklyGoals.map((g) => `<li>${escapeHtml(g)}</li>`).join("");

  const financial = await loadJSON("data/financial-resources.json");
  document.getElementById("financial-resources").innerHTML = financial.map((f) => `
    <div class="card">
      <h3>${f.url ? `<a href="${f.url}" target="_blank" rel="noopener">${escapeHtml(f.name)}</a>` : escapeHtml(f.name)}</h3>
      <p>${escapeHtml(f.description)}</p>
    </div>`).join("");

  const tableEl = document.getElementById("tracker-table");
  const bannerEl = document.getElementById("followup-banner");
  const rejectionEl = document.getElementById("rejection-note");

  const REJECTION_NOTES = [
    "That's one \"no\" closer to a \"yes.\" Update the row and keep moving — no need to dwell on it.",
    "Rejection logged, not a verdict on you. Pick your next application whenever you're ready.",
    "Noted. Most people collect a lot of these before an offer — this is the process working as expected, not a sign to stop.",
  ];
  let rejectionTimer = null;
  function showRejectionNote() {
    const note = REJECTION_NOTES[Math.floor(Math.random() * REJECTION_NOTES.length)];
    rejectionEl.innerHTML = `<p class="callout">${escapeHtml(note)}</p>`;
    clearTimeout(rejectionTimer);
    rejectionTimer = setTimeout(() => { rejectionEl.innerHTML = ""; }, 8000);
  }

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
    const headCells = schema.columns.map((c) => `<th scope="col">${escapeHtml(c.label)}</th>`).join("") + "<th scope=\"col\" class=\"no-print\">Remove</th>";
    const bodyRows = rows.map((row, idx) => {
      const rowLabel = row.company || `row ${idx + 1}`;
      const cells = schema.columns.map((c) => {
        const val = row[c.key] ?? "";
        const fieldLabel = `${c.label} — ${rowLabel}`;
        if (c.type === "select") {
          const opts = c.options.map((o) => `<option value="${escapeHtml(o)}" ${o === val ? "selected" : ""}>${escapeHtml(o)}</option>`).join("");
          return `<td><select data-row="${idx}" data-key="${c.key}" aria-label="${escapeHtml(fieldLabel)}">${opts}</select></td>`;
        }
        const inputType = c.type === "date" ? "date" : "text";
        const placeholder = inputType === "text" ? ` placeholder="${escapeHtml(String(schema.exampleRow[c.key] ?? ""))}"` : "";
        return `<td><input type="${inputType}" data-row="${idx}" data-key="${c.key}" value="${escapeHtml(val)}" aria-label="${escapeHtml(fieldLabel)}"${placeholder}></td>`;
      }).join("");
      return `<tr>${cells}<td class="no-print"><button data-remove="${idx}" aria-label="Remove row for ${escapeHtml(rowLabel)}">✕</button></td></tr>`;
    }).join("");
    tableEl.innerHTML = `<thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody>`;
  }

  // Row aria-labels are keyed off the company name (renderTable's
  // rowLabel), but re-rendering the whole table on every keystroke would
  // reset focus/cursor mid-type. Patch just this row's labels in place
  // instead, so they stay accurate without disrupting typing.
  function updateRowAccessibleNames(rowIdx) {
    const tr = tableEl.querySelectorAll("tbody tr")[rowIdx];
    if (!tr) return;
    const rowLabel = rows[rowIdx].company || `row ${rowIdx + 1}`;
    tr.querySelectorAll("[data-key]").forEach((el) => {
      const col = schema.columns.find((c) => c.key === el.dataset.key);
      if (col) el.setAttribute("aria-label", `${col.label} — ${rowLabel}`);
    });
    const removeBtn = tr.querySelector("[data-remove]");
    if (removeBtn) removeBtn.setAttribute("aria-label", `Remove row for ${rowLabel}`);
  }

  function handleFieldChange(e) {
    const { row, key } = e.target.dataset;
    if (row === undefined) return;
    rows[Number(row)][key] = e.target.value;
    saveRows(rows);
    renderFollowupBanner();
    if (key === "company") updateRowAccessibleNames(Number(row));
    if (key === "status" && e.target.value === "Rejected") showRejectionNote();
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
