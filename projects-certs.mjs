import { renderChrome, loadJSON, escapeHtml, wireCopyButtons } from "./common.mjs";
import { renderProgressBadge, renderMilestoneToggle } from "./progress.mjs";

renderChrome("projects-certs.html");
renderProgressBadge();
renderMilestoneToggle(document.getElementById("milestone"), "picked-cert");

async function init() {
  const certs = await loadJSON("data/certs.json");

  document.getElementById("projects").innerHTML = certs.skillProjects.map((p) => `
    <div class="card">
      <h3>${escapeHtml(p.title)}</h3>
      <p><strong>Do:</strong> ${escapeHtml(p.instructions)}</p>
      <p><strong>Resume bullet:</strong> ${escapeHtml(p.resumeBullet)}
        <button class="copy-btn" data-copy="${escapeHtml(p.resumeBullet)}">Copy</button></p>
    </div>`).join("");

  const calcEl = document.getElementById("certs-calc");
  calcEl.innerHTML = certs.certifications.map((c) => `
    <label style="display:flex;gap:0.6rem;align-items:flex-start;margin:0.5rem 0;">
      <input type="checkbox" class="cert-check" data-cost="${c.cost}">
      <span>
        <strong>${escapeHtml(c.name)}</strong> — $${c.cost}${c.tier === "bonus" ? ' <span class="pill">bonus</span>' : ""}<br>
        <span style="color:var(--text-muted);font-size:0.85rem;">${escapeHtml(c.prepTime)} · ${escapeHtml(c.bestFor)}. ${escapeHtml(c.note)}</span>
      </span>
    </label>`).join("");

  const targetPayInput = document.getElementById("target-pay");
  function recalc() {
    const checks = calcEl.querySelectorAll(".cert-check");
    let total = 0;
    checks.forEach((c) => { if (c.checked) total += Number(c.dataset.cost); });
    const pay = Number(targetPayInput.value) || 1;
    document.getElementById("calc-total").textContent = `$${total.toFixed(0)}`;
    document.getElementById("calc-hours").textContent = (total / pay).toFixed(1);
  }
  calcEl.addEventListener("change", recalc);
  targetPayInput.addEventListener("input", recalc);
  recalc();

  document.getElementById("price-disclaimer").textContent = certs.priceDisclaimer;
}

init().catch((err) => console.error(err));
wireCopyButtons();
