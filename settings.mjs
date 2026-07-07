// Shared user settings: pay floor, city/zone, and accessibility prefs.
// Stored only in the visitor's own browser (localStorage) — same privacy
// model as the tracker and progress checklist. This is the single source
// of truth for "your minimum pay" so it doesn't need to be hardcoded on
// every page — set it once here, every page reads it from here.
// No import from common.mjs on purpose — common.mjs calls into this module
// during renderChrome(), so importing back would create a circular module
// dependency. Tiny local copy instead.
import { renderSyncControls } from "./data-sync.mjs";

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

const STORAGE_KEY = "entry-level-it-launchpad:settings";

const DEFAULTS = {
  payFloor: 19,
  city: "",
  fontScale: "normal", // normal | large | xlarge
  dyslexiaFont: false,
  highContrast: false,
  reducedMotion: false,
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // ignore corrupt storage
  }
  return { ...DEFAULTS };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  applyAccessibility(next);
  document.dispatchEvent(new CustomEvent("settings:changed", { detail: next }));
  return next;
}

/** Applies font-scale/dyslexia/high-contrast/reduced-motion as classes on <html>. Call on every page load. */
export function applyAccessibility(settings = getSettings()) {
  const root = document.documentElement;
  root.classList.remove("font-large", "font-xlarge");
  if (settings.fontScale === "large") root.classList.add("font-large");
  if (settings.fontScale === "xlarge") root.classList.add("font-xlarge");
  root.classList.toggle("dyslexia-font", !!settings.dyslexiaFont);
  root.classList.toggle("high-contrast", !!settings.highContrast);
  root.classList.toggle("reduced-motion", !!settings.reducedMotion);
}

/** Renders the settings/accessibility panel into a <dialog> or container element. */
export function renderSettingsPanel(container) {
  const s = getSettings();
  container.innerHTML = `
    <h2 style="margin-top:0;">Settings</h2>
    <div class="toolbar">
      <div>
        <label for="settings-pay-floor">Your minimum pay ($/hr)</label>
        <input type="number" id="settings-pay-floor" value="${s.payFloor}" min="0" step="0.5">
      </div>
      <div>
        <label for="settings-city">Your city/metro (optional)</label>
        <input type="text" id="settings-city" value="${escapeHtml(s.city)}" placeholder="e.g. Houston, TX">
      </div>
    </div>
    <p style="font-size:0.85rem;color:var(--text-muted);">This becomes the default everywhere on the site — the Roles filter, the Search Toolkit, and the application scorecard all use your number instead of a fixed one. $19/hr is just the starting default (based on a real Foxconn entry-level offer) — set your own.</p>

    <h3>Accessibility</h3>
    <div class="toolbar">
      <div>
        <label for="settings-font-scale">Text size</label>
        <select id="settings-font-scale">
          <option value="normal" ${s.fontScale === "normal" ? "selected" : ""}>Normal</option>
          <option value="large" ${s.fontScale === "large" ? "selected" : ""}>Large</option>
          <option value="xlarge" ${s.fontScale === "xlarge" ? "selected" : ""}>Extra large</option>
        </select>
      </div>
    </div>
    <label style="display:flex;gap:0.5rem;align-items:center;margin:0.5rem 0;">
      <input type="checkbox" id="settings-dyslexia" ${s.dyslexiaFont ? "checked" : ""}>
      <span>Dyslexia-friendly font (Atkinson Hyperlegible)</span>
    </label>
    <label style="display:flex;gap:0.5rem;align-items:center;margin:0.5rem 0;">
      <input type="checkbox" id="settings-contrast" ${s.highContrast ? "checked" : ""}>
      <span>High contrast mode</span>
    </label>
    <label style="display:flex;gap:0.5rem;align-items:center;margin:0.5rem 0;">
      <input type="checkbox" id="settings-motion" ${s.reducedMotion ? "checked" : ""}>
      <span>Reduce motion/animations</span>
    </label>
    <p style="font-size:0.8rem;color:var(--text-muted);">Everything above is saved only in this browser — nothing is uploaded, and nothing is shared with other visitors.</p>
    <div id="settings-sync-controls"></div>`;

  renderSyncControls(container.querySelector("#settings-sync-controls"));

  const payFloorInput = container.querySelector("#settings-pay-floor");
  const cityInput = container.querySelector("#settings-city");
  payFloorInput.addEventListener("change", () => saveSettings({ payFloor: Number(payFloorInput.value) || 0 }));
  cityInput.addEventListener("change", () => saveSettings({ city: cityInput.value }));
  container.querySelector("#settings-font-scale").addEventListener("change", (e) => saveSettings({ fontScale: e.target.value }));
  container.querySelector("#settings-dyslexia").addEventListener("change", (e) => saveSettings({ dyslexiaFont: e.target.checked }));
  container.querySelector("#settings-contrast").addEventListener("change", (e) => saveSettings({ highContrast: e.target.checked }));
  container.querySelector("#settings-motion").addEventListener("change", (e) => saveSettings({ reducedMotion: e.target.checked }));
}
