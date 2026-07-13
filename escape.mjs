// HTML-escaping for user-entered and API-returned text before it goes
// into innerHTML. Lives in its own zero-import module so that modules
// common.mjs itself imports (settings.mjs, chat-widget.mjs) can share
// the one copy without creating a circular dependency back into
// common.mjs. common.mjs re-exports it, so page modules can keep
// importing from either place.
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
