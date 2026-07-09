// Help/navigation overlay — explains the site's sections and privacy
// model. Opened from the "?" button common.mjs adds to every header.
import { showSplash } from "./splash.mjs";
import { trapModal } from "./modal.mjs";

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
        <li><strong>Prepare</strong> — Resume &amp; LinkedIn, Projects &amp; Certs, Interview Prep, and the STAR Story Bank: materials and practice.</li>
        <li><strong>Track</strong> — your application plan and tracker.</li>
        <li><strong>About</strong> — the <a href="trust-safety.html">Trust &amp; Safety</a> page: a plain-language list of what this site and its AI assistant will never do.</li>
      </ul>
      <p>The badge in the header (e.g. "3/10 steps done") tracks your
      progress through the guide — check items off on each page as you
      go.</p>
      <p>The ⚙ button opens <strong>Settings</strong>, where you can set
      your own pay floor (the site defaults to $19/hr, but that's just a
      starting point — set your own), your city, and accessibility
      options (text size, dyslexia-friendly font, high contrast, reduced
      motion).</p>
      <p>There's also an optional <strong>AI chat assistant</strong> —
      off by default, since it's an extra, not the main way to use the
      site. Turn it on in Settings if you want it; a chat button will
      then appear in the corner of every page.</p>
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
  const close = trapModal(overlay);
  overlay.querySelector("#help-close").addEventListener("click", close);
  overlay.querySelector("#help-show-splash").addEventListener("click", () => { close(); showSplash(); });
}
