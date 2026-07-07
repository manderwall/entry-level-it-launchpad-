// Cloudflare Pages Function — runs server-side at the edge, never in the
// visitor's browser. Proxies Adzuna job search so the API key stays secret:
// set ADZUNA_APP_ID and ADZUNA_APP_KEY as environment variables in the
// Cloudflare Pages dashboard (Settings > Environment variables), NOT in
// any file in this repo. If they're unset, this returns 501 so the
// frontend can fall back to plain job-board links.
//
// Request:  GET /api/jobs?what=<query>&where=<city or empty for remote>
// Response: Adzuna's raw JSON search response (see developer.adzuna.com/docs/search)

export async function onRequestGet({ request, env }) {
  const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = env;
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    return new Response(
      JSON.stringify({ error: "Live search isn't configured yet — set ADZUNA_APP_ID and ADZUNA_APP_KEY in the Cloudflare Pages dashboard." }),
      { status: 501, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(request.url);
  const what = url.searchParams.get("what") || "";
  const where = url.searchParams.get("where") || "";

  const adzunaUrl = new URL("https://api.adzuna.com/v1/api/jobs/us/search/1");
  adzunaUrl.searchParams.set("app_id", ADZUNA_APP_ID);
  adzunaUrl.searchParams.set("app_key", ADZUNA_APP_KEY);
  adzunaUrl.searchParams.set("results_per_page", "10");
  if (what) adzunaUrl.searchParams.set("what", what);
  if (where) adzunaUrl.searchParams.set("where", where);

  const upstream = await fetch(adzunaUrl.toString());
  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}
