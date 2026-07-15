// Shared user settings: pay floor, city/zone, and accessibility prefs.
// Stored only in the visitor's own browser (localStorage) — same privacy
// model as the tracker and progress checklist. This is the single source
// of truth for "your minimum pay" so it doesn't need to be hardcoded on
// every page — set it once here, every page reads it from here.
// No import from common.mjs on purpose — common.mjs calls into this module
// during renderChrome(), so importing back would create a circular module
// dependency. escape.mjs imports nothing, so it's safe from here.
import { renderSyncControls } from "./data-sync.mjs";
import { renderCloudSyncControls } from "./cloud-sync.mjs";
import { escapeHtml } from "./escape.mjs";

const STORAGE_KEY = "entry-level-it-launchpad:settings";

const DEFAULTS = {
  payFloor: 19,
  city: "",
  theme: "auto", // auto | light | dark
  fontScale: "normal", // normal | large | xlarge
  dyslexiaFont: false,
  highContrast: false,
  reducedMotion: false,
  aiChatEnabled: false, // opt-in — the AI chat widget stays hidden until a visitor turns it on here
  essentialsOnly: false, // opt-in — starts every page's collapsible sections closed, for when full detail feels like too much at once
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
  if (settings.theme === "light" || settings.theme === "dark") root.setAttribute("data-theme", settings.theme);
  else root.removeAttribute("data-theme");
  root.classList.remove("font-large", "font-xlarge");
  if (settings.fontScale === "large") root.classList.add("font-large");
  if (settings.fontScale === "xlarge") root.classList.add("font-xlarge");
  root.classList.toggle("dyslexia-font", !!settings.dyslexiaFont);
  root.classList.toggle("high-contrast", !!settings.highContrast);
  root.classList.toggle("reduced-motion", !!settings.reducedMotion);
  // One-way "start simple" convenience, not a live density toggle — closes
  // whatever's open right now. Turning it back off doesn't reopen anything;
  // every section is still there, just a tap away under its heading.
  if (settings.essentialsOnly) {
    document.querySelectorAll("main details[open]").forEach((d) => { d.open = false; });
  }
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

    <h3>Appearance</h3>
    <div class="toolbar">
      <div>
        <label for="settings-theme">Theme</label>
        <select id="settings-theme">
          <option value="auto" ${s.theme === "auto" ? "selected" : ""}>Match my device</option>
          <option value="light" ${s.theme === "light" ? "selected" : ""}>Light</option>
          <option value="dark" ${s.theme === "dark" ? "selected" : ""}>Dark</option>
        </select>
      </div>
    </div>

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
    <label style="display:flex;gap:0.5rem;align-items:center;margin:0.5rem 0;">
      <input type="checkbox" id="settings-essentials-only" ${s.essentialsOnly ? "checked" : ""}>
      <span>Essentials-only mode (starts every page's sections closed, so it's less to look at)</span>
    </label>
    <p style="font-size:0.8rem;color:var(--text-muted);">Everything above is saved only in this browser — nothing is uploaded, and nothing is shared with other visitors.</p>

    <h3>AI chat assistant</h3>
    <label style="display:flex;gap:0.5rem;align-items:center;margin:0.5rem 0;">
      <input type="checkbox" id="settings-ai-chat" ${s.aiChatEnabled ? "checked" : ""}>
      <span>Enable the AI chat assistant</span>
    </label>
    <p style="font-size:0.8rem;color:var(--text-muted);">Off by default — this
    is an optional extra, not the main way to use the site. When enabled, a
    chat button appears in the corner of every page. It runs on Llama 3.1 8B
    via Cloudflare Workers AI (a small, free, open-source model — not
    Claude/GPT-4-class), answers are AI-generated and may be wrong, and
    nothing you type is saved past this browser tab.</p>

    <div id="settings-cloud-sync-controls"></div>
    <div id="settings-sync-controls"></div>`;

  container.querySelector("#settings-ai-chat").addEventListener("change", (e) => saveSettings({ aiChatEnabled: e.target.checked }));

  renderCloudSyncControls(container.querySelector("#settings-cloud-sync-controls"));
  renderSyncControls(container.querySelector("#settings-sync-controls"));

  const payFloorInput = container.querySelector("#settings-pay-floor");
  const cityInput = container.querySelector("#settings-city");
  payFloorInput.addEventListener("change", () => saveSettings({ payFloor: Number(payFloorInput.value) || 0 }));
  cityInput.addEventListener("change", () => saveSettings({ city: cityInput.value }));
  container.querySelector("#settings-theme").addEventListener("change", (e) => saveSettings({ theme: e.target.value }));
  container.querySelector("#settings-font-scale").addEventListener("change", (e) => saveSettings({ fontScale: e.target.value }));
  container.querySelector("#settings-dyslexia").addEventListener("change", (e) => saveSettings({ dyslexiaFont: e.target.checked }));
  container.querySelector("#settings-contrast").addEventListener("change", (e) => saveSettings({ highContrast: e.target.checked }));
  container.querySelector("#settings-motion").addEventListener("change", (e) => saveSettings({ reducedMotion: e.target.checked }));
  container.querySelector("#settings-essentials-only").addEventListener("change", (e) => saveSettings({ essentialsOnly: e.target.checked }));
}
