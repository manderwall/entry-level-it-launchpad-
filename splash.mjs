// First-visit splash/welcome screen. Shows once per browser (localStorage
// flag), dismissable immediately, and re-openable anytime from the Help
// button so it's not a one-shot annoyance.
import { trapModal } from "./modal.mjs";

const STORAGE_KEY = "entry-level-it-launchpad:seen-splash";

function buildSplash() {
  const overlay = document.createElement("div");
  overlay.className = "splash-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Welcome to Entry-Level IT Launchpad");
  overlay.innerHTML = `
    <div class="splash-card">
      <svg width="72" height="72" viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="20" fill="#1656c0"/>
        <text x="50" y="68" font-size="58" font-family="sans-serif" font-weight="700" fill="white" text-anchor="middle">IT</text>
      </svg>
      <h1>Entry-Level IT Launchpad</h1>
      <p>Job-search tools built for CompTIA A+ / Per Scholas grads in the
      Houston area — best-fit roles, live search links, resume templates,
      interview prep, and a private application tracker.</p>
      <p style="font-size:0.85rem;color:var(--text-muted);">Everything you
      enter (your pay floor, your tracker, your settings) stays only in
      this browser — nothing is uploaded or shared.</p>
      <button class="primary" id="splash-dismiss">Get started</button>
    </div>`;
  return overlay;
}

/** Shows the splash once per browser. Call from every page's chrome setup. */
export function maybeShowSplash() {
  if (localStorage.getItem(STORAGE_KEY)) return;
  showSplash();
}

/** Force-shows the splash regardless of the "seen" flag (used by the Help button). */
export function showSplash() {
  const overlay = buildSplash();
  document.body.appendChild(overlay);
  const close = trapModal(overlay, () => {
    localStorage.setItem(STORAGE_KEY, "1");
    // On the homepage, land the visitor straight on the one recommended
    // next action instead of leaving them to scroll and guess where to
    // start — the whole point of that widget is removing that guesswork.
    const reducedMotion = document.documentElement.classList.contains("reduced-motion")
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("next-step")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
  });
  overlay.querySelector("#splash-dismiss").addEventListener("click", close);
}
