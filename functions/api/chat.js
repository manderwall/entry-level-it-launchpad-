// Cloudflare Pages Function — an optional "ask a question" chat box
// grounded in this site's own content (roles, pay floor, zones, certs).
// Runs on Cloudflare Workers AI (open-source models, e.g. Llama), bound
// as `AI` in the Cloudflare Pages dashboard — Settings > Functions >
// Bindings > Add > Workers AI, variable name "AI". This is genuinely
// free (a daily neuron quota, no billing, no separate account/API key)
// — unlike Anthropic/OpenAI's pay-per-token APIs. Quality is a step
// below a frontier model, but plenty for "what cert should I get next"
// style questions grounded in this site's own content.
//
// Request:  POST /api/chat  { messages: [{role: "user"|"assistant", content: string}, ...] }
// Response: { reply: string }
//
// Deliberately small and stateless: no conversation is stored server-side,
// the browser resends the last few turns each time (see chat-widget.mjs).
// If the AI binding isn't set, returns 501 so the widget can show a
// "not configured yet" state instead of a broken chat box.

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MAX_TURNS = 8; // cap how much history we forward, keeps latency bounded

const SYSTEM_PROMPT = `You are the built-in help assistant for "Entry-Level IT Launchpad," a free job-search site for CompTIA A+ certified / Per Scholas grads in the Houston, TX area, breaking into entry-level IT support roles.

Ground your answers in this site's own content and general public knowledge. Be concise, practical, and encouraging without being saccharine. If asked something outside job-search/IT-career scope, gently redirect.

Site facts you can rely on:
- Target roles (best to worst fit): Remote Technical Support Specialist, Help Desk Analyst I / Service Desk Analyst, SaaS/Product Support Specialist, Application Support Analyst, IT Asset Coordinator.
- Default pay floor is $19/hr (each visitor can change this in Settings — don't assume it's fixed).
- The site has pages for: Best-Fit Roles & Pay, Search Toolkit (live job search + scam checklist), Houston Zones (transit/commute), Resume & LinkedIn, Projects & Certs (with a cert cost calculator), Employers & networking scripts, Government Contractors (USAspending.gov data), Interview Prep, and a private Application Tracker.
- Recommended next certs after A+, in order: Microsoft 365 Fundamentals (MS-900), Network+, Security+, ITIL Foundation.
- All user data (tracker, settings, progress) is stored only in the visitor's own browser — nothing is uploaded or shared.

You do not have live access to current job postings yourself — point users to the Search Toolkit page for that. You are not a lawyer, financial advisor, or immigration consultant — say so if asked. Keep answers under ~150 words unless the question genuinely needs more.`;

export async function onRequestPost({ request, env }) {
  if (!env.AI) {
    return new Response(
      JSON.stringify({ error: "Chat is not configured yet — bind Workers AI (variable name AI) in the Cloudflare Pages dashboard." }),
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

  let result;
  try {
    result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })),
      ],
      max_tokens: 400,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `Chat request failed: ${err.message}` }), {
      status: 502, headers: { "Content-Type": "application/json" },
    });
  }

  const reply = result?.response || "Sorry, I didn't get a response — try again.";
  return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } });
}
