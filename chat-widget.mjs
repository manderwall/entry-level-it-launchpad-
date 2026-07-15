// Floating "Ask a question" chat widget, present on every page. Calls
// /api/chat (a Cloudflare Pages Function running on Cloudflare Workers AI,
// model Llama 3.1 8B via the account's AI binding — see functions/api/chat.js;
// no API key involved). If the Function isn't configured yet (no AI binding)
// or isn't available (e.g. local static server), it shows a friendly
// explanation instead of failing silently — unlike the job-search widgets,
// this is a marquee feature so it should be visible even when dormant.
// From escape.mjs (not common.mjs) — common.mjs imports this module during
// renderChrome(), so importing common.mjs back would create a cycle.
import { escapeHtml } from "./escape.mjs";

const STORAGE_KEY = "entry-level-it-launchpad:chat-history";
const MAX_STORED_TURNS = 8;

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return [];
}

function saveHistory(history) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_STORED_TURNS)));
}

export function renderChatWidget() {
  const bubble = document.createElement("button");
  bubble.className = "chat-bubble";
  bubble.type = "button";
  bubble.setAttribute("aria-label", "Ask a question");
  bubble.setAttribute("aria-expanded", "false");
  bubble.title = "Ask a question";
  bubble.textContent = "💬";
  document.body.appendChild(bubble);

  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.hidden = true;
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", "Chat with the site assistant");
  panel.innerHTML = `
    <div class="chat-panel-header">
      <strong>Ask a question</strong>
      <button type="button" class="chat-close" aria-label="Close chat">✕</button>
    </div>
    <div class="chat-messages" id="chat-messages" aria-live="polite"></div>
    <form class="chat-input-row" id="chat-form">
      <input type="text" id="chat-input" placeholder="e.g. What cert should I get after A+?" autocomplete="off">
      <button type="submit" class="primary">Send</button>
    </form>
    <p class="chat-footnote">Runs on Llama 3.1 8B (Cloudflare Workers AI) — a small, free, open-source model, not Claude/GPT-4-class. Answers may be wrong, always verify anything important. Nothing you type is saved after you close this tab. Turn this off anytime in ⚙ Settings.</p>`;
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#chat-messages");
  const formEl = panel.querySelector("#chat-form");
  const inputEl = panel.querySelector("#chat-input");
  let history = loadHistory();
  let notConfigured = false;

  function renderMessages() {
    messagesEl.innerHTML = history.map((m) =>
      `<div class="chat-msg chat-msg-${m.role}">${escapeHtml(m.content)}</div>`
    ).join("") || `<div class="chat-msg chat-msg-assistant">Hi! Ask me anything about this site — target roles, pay, certs, the tracker, whatever. I'm an AI model grounded in this site's content, not a live job search — use the Search Toolkit page for that.</div>`;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  renderMessages();

  function openPanel() {
    panel.hidden = false;
    bubble.setAttribute("aria-expanded", "true");
    inputEl.focus();
  }
  function closePanel() {
    panel.hidden = true;
    bubble.setAttribute("aria-expanded", "false");
    bubble.focus();
  }

  bubble.addEventListener("click", () => { panel.hidden ? openPanel() : closePanel(); });
  panel.querySelector(".chat-close").addEventListener("click", closePanel);
  panel.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (notConfigured) return;
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    history.push({ role: "user", content: text });
    renderMessages();
    saveHistory(history);

    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "chat-msg chat-msg-assistant";
    thinkingMsg.textContent = "Thinking…";
    messagesEl.appendChild(thinkingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      // A plain static server (local dev, or any deployment without the
      // Function) answers with an HTML error page, not JSON — parsing
      // that would throw a confusing "Unexpected token '<'" error
      // instead of the intended graceful fallback. Same fix as
      // cloud-sync.mjs's parseSyncResponse().
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("not configured: this deployment doesn't have the chat Function available");
      }
      if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
      history.push({ role: "assistant", content: data.reply });
    } catch (err) {
      // Match both "not configured" and "isn't configured" (and 501)
      // rather than one exact phrase — a future wording tweak on the
      // Function side shouldn't silently break this detection again.
      notConfigured = /not configured|isn.t configured|\b501\b/i.test(err.message);
      history.push({
        role: "assistant",
        content: notConfigured
          ? "Chat isn't set up yet on this deployment — the site owner needs to bind Workers AI (variable name AI) in the Cloudflare Pages dashboard. In the meantime, try the Interview Prep or Search Toolkit pages directly."
          : `Something went wrong (${err.message}). Try again in a moment, or use the site's regular pages instead.`,
      });
    }
    saveHistory(history);
    renderMessages();
  });
}
