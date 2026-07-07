// Cloudflare Pages Function — cross-device sync backed by Cloudflare KV.
// Each visitor gets a random "sync code" (client-generated, see
// cloud-sync.mjs) that acts like a shared room key: whoever has the code
// can push/pull the JSON blob stored under it. No accounts, no login —
// the code IS the credential, so treat it like a password.
//
// Requires a KV namespace bound as SYNC_KV in the Cloudflare Pages
// dashboard (Settings > Functions > KV namespace bindings). Without that
// binding this returns 501, same "not configured yet" pattern as the
// Adzuna/Anthropic integrations, so the feature degrades to the existing
// manual export/import instead of breaking.
//
// Request:  GET  /api/sync?code=XXXXXXXXXX        -> { data } or 404
//           POST /api/sync  { code, data }         -> { ok: true }
//
// Codes are validated as 8-20 alphanumeric characters (matches the format
// cloud-sync.mjs generates) so they're safe to use directly as a KV key
// without any escaping concerns. Payloads are capped at 200KB — far more
// than settings+progress+tracker data will ever need — to bound abuse.

const CODE_PATTERN = /^[A-Za-z0-9]{8,20}$/;
const MAX_PAYLOAD_BYTES = 200_000;
const TTL_SECONDS = 60 * 60 * 24 * 180; // 180 days of inactivity before a code's data expires

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export async function onRequestGet({ request, env }) {
  if (!env.SYNC_KV) {
    return jsonResponse({ error: "Cloud sync isn't configured yet — bind a SYNC_KV namespace in the Cloudflare Pages dashboard." }, 501);
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  if (!CODE_PATTERN.test(code)) {
    return jsonResponse({ error: "Invalid sync code format." }, 400);
  }
  const stored = await env.SYNC_KV.get(`sync:${code}`);
  if (!stored) {
    return jsonResponse({ error: "No data found for that code yet — push from your other device first." }, 404);
  }
  return jsonResponse({ data: JSON.parse(stored) });
}

export async function onRequestPost({ request, env }) {
  if (!env.SYNC_KV) {
    return jsonResponse({ error: "Cloud sync isn't configured yet — bind a SYNC_KV namespace in the Cloudflare Pages dashboard." }, 501);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  const { code, data } = body;
  if (!CODE_PATTERN.test(code)) {
    return jsonResponse({ error: "Invalid sync code format." }, 400);
  }
  const serialized = JSON.stringify(data ?? {});
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ error: "Data too large to sync." }, 413);
  }
  await env.SYNC_KV.put(`sync:${code}`, serialized, { expirationTtl: TTL_SECONDS });
  return jsonResponse({ ok: true });
}
