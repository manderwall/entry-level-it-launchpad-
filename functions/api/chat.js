// Cloudflare Pages Function — server-side proxy to the Anthropic API for
// an optional "ask a question" chat box grounded in this site's own data
// (roles, pay floor, zones, certs). The API key lives only as a Cloudflare
// Pages environment variable (ANTHROPIC_API_KEY, set as a Secret in the
// dashboard) — never in this repo, never in the visitor's browser.
//
// Request:  POST /api/chat  { messages: [{role: "user"|"assistant", content: string}, ...] }
// Response: { reply: string }
//
// Deliberately small and stateless: no conversation is stored server-side,
// the browser resends the last few turns each time (see chat-widget.mjs).
// If ANTHROPIC_API_KEY isn't set, returns 501 so the widget can show a
// "not configured yet" state instead of a broken chat box.

const MODEL = "claude-sonnet-4-5";
const MAX_TURNS = 8; // cap how much history we forward, keeps cost/latency bounded

const SYSTEM_PROMPT = `You are the built-in help assistant for "Entry-Level IT Launchpad," a free job-search site for CompTIA A+ certified / Per Scholas grads in the Houston, TX area, breaking into entry-level IT support roles.

Ground your answers in this site's own content and general public knowledge. Be concise, practical, and encouraging without being saccharine. If asked something outside job-search/IT-career scope, gently redirect.

Site facts you can rely on:
- Target roles (best to worst fit): Remote Technical Support Specialist, Help Desk Analyst I / Service Desk Analyst, SaaS/Product Support Specialist, Application Support Analyst, IT Asset Coordinator.
- Default pay floor is $19/hr (each visitor can change this in Settings — don't assume it's fixed).
- The site has pages for: Best-Fit Roles & Pay, Search Toolkit (live job search + scam checklist), Houston Zones (transit/commute), Resume & LinkedIn, Projects & Certs (with a cert cost calculator), Employers & networking scripts, Government Contractors (USAspending.gov data), Interview Prep, and a private Application Tracker.
- Recommended next certs after A+, in order: Microsoft 365 Fundamentals (MS-900), Network+, Security+, ITIL Foundation.
- All user data (tracker, settings, progress) is stored only in the visitor's own browser — nothing is uploaded or shared.

You do not have live access to current job postings yourself — point users to the Search Toolkit page for that. You are not a lawyer, financial advisor, or immigration consultant — say so if asked.`;

export async function onRequestPost({ request, env }) {
  const { ANTHROPIC_API_KEY } = env;
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Chat isn't configured yet — set ANTHROPIC_API_KEY in the Cloudflare Pages dashboard." }),
      { status: 501, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_TURNS) : [];
  if (!messages.length) {
    return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })),
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    return new Response(JSON.stringify({ error: `Chat request failed (${upstream.status})`, detail: errText.slice(0, 300) }), {
      status: 502, headers: { "Content-Type": "application/json" },
    });
  }

  const data = await upstream.json();
  const reply = data.content?.[0]?.text || "Sorry, I didn't get a response — try again.";

  return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } });
}
