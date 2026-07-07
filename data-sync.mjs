// Cross-device data portability — export everything this site stores in
// localStorage (settings, progress, tracker) as a single file, and import
// it back on another device/browser. This is NOT automatic cloud sync —
// there's no backend, nothing is uploaded anywhere. It's a manual,
// zero-infrastructure way to move your data between your own devices
// (e.g. phone → laptop), which is the realistic version of "cloud sync"
// for a site with no accounts and no server-side storage.
//
// True automatic sync (edit on phone, see it instantly on laptop) would
// need a real backend — Cloudflare KV/D1 or a service like Supabase — a
// bigger infrastructure decision than this file makes on its own.
export const PREFIX = "entry-level-it-launchpad:";

/** Collects every entry-level-it-launchpad:* localStorage key into one bundle. Shared with cloud-sync.mjs. */
export function collect() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) data[key] = localStorage.getItem(key);
  }
  return { exportedAt: new Date().toISOString(), data };
}

/** Writes a bundle's data back into localStorage. Shared with cloud-sync.mjs. Returns the number of keys restored. */
export function restore(data) {
  const entries = Object.entries(data || {}).filter(([k]) => k.startsWith(PREFIX));
  if (!entries.length) throw new Error("No recognizable data found.");
  for (const [key, value] of entries) localStorage.setItem(key, value);
  return entries.length;
}

export function exportToFile() {
  const bundle = collect();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "entry-level-it-launchpad-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

/** Reads a File (from an <input type="file">) and restores it into localStorage. */
export function importFromFile(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const bundle = JSON.parse(reader.result);
      onDone(null, restore(bundle.data));
    } catch (err) {
      onDone(err, 0);
    }
  };
  reader.onerror = () => onDone(new Error("Could not read that file."), 0);
  reader.readAsText(file);
}

/** Renders the export/import controls into a container (used in the Settings panel). */
export function renderSyncControls(container) {
  container.innerHTML = `
    <h3>Or move a file manually</h3>
    <p style="font-size:0.85rem;color:var(--text-muted);">If you'd rather not
    use a sync code above (or cloud sync isn't set up on this deployment),
    this downloads a file with your settings, progress, and tracker, which
    you then import on your other device/browser. Nothing is uploaded to
    any server in either direction.</p>
    <div class="toolbar">
      <div><button id="sync-export" type="button">Export my data</button></div>
      <div>
        <label for="sync-import-file">Import a file</label>
        <input type="file" id="sync-import-file" accept="application/json">
      </div>
    </div>
    <p id="sync-status" role="status" aria-live="polite" style="font-size:0.85rem;"></p>`;

  container.querySelector("#sync-export").addEventListener("click", exportToFile);
  container.querySelector("#sync-import-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = container.querySelector("#sync-status");
    importFromFile(file, (err, count) => {
      statusEl.textContent = err
        ? `Import failed: ${err.message}`
        : `Imported ${count} item(s) — reload the page to see them.`;
    });
  });
}
