// Help/navigation overlay — explains the site's sections and privacy
// model. Opened from the "?" button common.mjs adds to every header.
import { showSplash } from "./splash.mjs";

export function showHelp() {
  const overlay = document.createElement("div");
  overlay.className = "splash-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Help and navigation");
  overlay.innerHTML = `
    <div class="splash-card" style="text-align:left;max-width:560px;">
      <h2 style="margin-top:0;">Getting around</h2>
      <ul>
        <li><strong>Find</strong> — Best-Fit Roles, Search Toolkit, Houston Zones, Employers, and Government Contractors: where to look and how to search.</li>
        <li><strong>Prepare</strong> — Resume &amp; LinkedIn, Projects &amp; Certs, Interview Prep: materials and practice.</li>
        <li><strong>Track</strong> — your application plan and tracker.</li>
      </ul>
      <p>The badge in the header (e.g. "3/9 steps done") tracks your
      progress through the guide — check items off on each page as you
      go.</p>
      <p>The ⚙ button opens <strong>Settings</strong>, where you can set
      your own pay floor (the site defaults to $19/hr, but that's just a
      starting point — set your own), your city, and accessibility
      options (text size, dyslexia-friendly font, high contrast, reduced
      motion).</p>
      <p><strong>Your data stays yours:</strong> your tracker, progress,
      and settings are stored only in this browser (localStorage) —
      nothing is uploaded, and nothing is shared between visitors, even
      if you and a friend both use this site.</p>
      <p><a href="https://github.com/manderwall/entry-level-it-launchpad-" target="_blank" rel="noopener">View the source / report an issue on GitHub</a></p>
      <div class="toolbar" style="margin-top:1rem;">
        <button class="primary" id="help-close">Close</button>
        <button id="help-show-splash">Show welcome screen again</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const dismiss = () => overlay.remove();
  overlay.querySelector("#help-close").addEventListener("click", dismiss);
  overlay.querySelector("#help-show-splash").addEventListener("click", () => { dismiss(); showSplash(); });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) dismiss(); });
  document.addEventListener("keydown", function onKey(e) {
    if (e.key === "Escape") { dismiss(); document.removeEventListener("keydown", onKey); }
  });
}
