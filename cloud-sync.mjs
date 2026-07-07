// Automatic cross-device sync via /api/sync (a Cloudflare Pages Function
// backed by Cloudflare KV — see functions/api/sync.js). Each device gets
// a random "sync code"; entering the same code on a second device pulls
// the first device's data. There's no account system — the code itself
// is the credential, so it's shown with a warning to treat it like a
// password. This is additive to, not a replacement for, the manual
// file export/import in data-sync.mjs (which still works with zero
// server-side setup at all).
import { collect, restore } from "./data-sync.mjs";

const CODE_STORAGE_KEY = "entry-level-it-launchpad:cloud-sync-code";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid transcription mixups
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => chars[b % chars.length]).join("");
}

function getMyCode() {
  let code = localStorage.getItem(CODE_STORAGE_KEY);
  if (!code) {
    code = generateCode();
    localStorage.setItem(CODE_STORAGE_KEY, code);
  }
  return code;
}

// A plain static file server (local dev, or any host without the
// Function deployed) answers /api/sync with an HTML error page, not
// JSON — parsing that would throw a confusing "Unexpected token '<'"
// error. Treat any response that isn't parseable JSON the same as "not
// configured", since from the visitor's perspective the effect is
// identical: cloud sync isn't available here.
async function parseSyncResponse(res) {
  try {
    return await res.json();
  } catch {
    throw new Error("not configured: this deployment doesn't have the sync Function available");
  }
}

async function pushToCloud(code) {
  const bundle = collect();
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, data: bundle.data }),
  });
  const body = await parseSyncResponse(res);
  if (!res.ok) throw new Error(body.error || `Push failed: ${res.status}`);
  return body;
}

async function pullFromCloud(code) {
  const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);
  const body = await parseSyncResponse(res);
  if (!res.ok) throw new Error(body.error || `Pull failed: ${res.status}`);
  return restore(body.data);
}

export function renderCloudSyncControls(container) {
  const myCode = getMyCode();
  container.innerHTML = `
    <h3>Sync across your devices automatically</h3>
    <p style="font-size:0.85rem;color:var(--text-muted);">This device's sync code
    — enter it on your other device to link them, or type a code from
    another device below to pull its data here. Anyone with this code can
    read/write that data, so treat it like a password and don't share it
    outside your own devices.</p>
    <div class="toolbar">
      <div>
        <label for="cloud-sync-my-code">Your sync code</label>
        <input type="text" id="cloud-sync-my-code" value="${myCode}" readonly>
      </div>
      <div><button id="cloud-sync-copy-code" type="button">Copy</button></div>
      <div><button id="cloud-sync-push" type="button" class="primary">Push my data to this code</button></div>
    </div>
    <div class="toolbar">
      <div>
        <label for="cloud-sync-other-code">Code from another device</label>
        <input type="text" id="cloud-sync-other-code" placeholder="Paste a code here">
      </div>
      <div><button id="cloud-sync-pull" type="button">Pull that device's data here</button></div>
    </div>
    <p id="cloud-sync-status" role="status" aria-live="polite" style="font-size:0.85rem;"></p>`;

  const statusEl = container.querySelector("#cloud-sync-status");

  container.querySelector("#cloud-sync-copy-code").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      statusEl.textContent = "Code copied.";
    } catch {
      window.prompt("Copy this code:", myCode);
    }
  });

  container.querySelector("#cloud-sync-push").addEventListener("click", async () => {
    statusEl.textContent = "Pushing…";
    try {
      await pushToCloud(myCode);
      statusEl.textContent = "Pushed. Enter this code on your other device and pull to sync it there.";
    } catch (err) {
      const notConfigured = /not configured|501/i.test(err.message);
      statusEl.textContent = notConfigured
        ? "Cloud sync isn't set up on this deployment yet — use the file export/import above instead."
        : `Push failed: ${err.message}`;
    }
  });

  container.querySelector("#cloud-sync-pull").addEventListener("click", async () => {
    const code = container.querySelector("#cloud-sync-other-code").value.trim();
    if (!code) return;
    statusEl.textContent = "Pulling…";
    try {
      const count = await pullFromCloud(code);
      statusEl.textContent = `Pulled ${count} item(s) — reload the page to see them.`;
    } catch (err) {
      const notConfigured = /not configured|501/i.test(err.message);
      statusEl.textContent = notConfigured
        ? "Cloud sync isn't set up on this deployment yet — use the file export/import above instead."
        : `Pull failed: ${err.message}`;
    }
  });
}
