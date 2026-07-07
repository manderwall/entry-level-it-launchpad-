// Cloudflare Pages Function — runs server-side at the edge. Proxies
// USAspending.gov's public award-search API (no key required, it's an
// open federal data source) to list government contractors/subcontractors
// with contracts performed in a given Texas county, optionally filtered
// to a specific awarding agency (e.g. NASA for the Houston/Clear Lake/
// JSC area). Proxied (rather than called directly from the browser) so
// we control caching and can normalize the response shape for the
// frontend regardless of upstream API changes.
//
// Request:  GET /api/contractors?agency=<top-tier agency name>&county=<3-digit FIPS>&naics=<comma-separated codes>
//   Defaults: agency=National Aeronautics and Space Administration, county=201 (Harris County, TX)
// Response: { results: [{ recipientName, awardAmount, awardType, naicsCode, naicsDescription, awardId }] }
//
// IMPORTANT — this reflects federal CONTRACT AWARDS, not open job postings.
// A company on this list may not be hiring right now, may not have local
// entry-level IT roles, or (rarely) may not be a fit for a given visitor
// for reasons specific to them. Always verify independently before relying
// on this list; the frontend surfaces this caveat directly to visitors.

const USASPENDING_URL = "https://api.usaspending.gov/api/v2/search/spending_by_award/";

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const agency = url.searchParams.get("agency") || "National Aeronautics and Space Administration";
  const county = url.searchParams.get("county") || "201"; // Harris County, TX (Houston/JSC area)
  const naics = (url.searchParams.get("naics") || "").split(",").map((s) => s.trim()).filter(Boolean);

  const body = {
    filters: {
      award_type_codes: ["A", "B", "C", "D"], // contracts (BPA, purchase order, delivery order, definitive contract)
      agencies: [{ type: "awarding", tier: "toptier", name: agency }],
      place_of_performance_locations: [{ country: "USA", state: "TX", county }],
      ...(naics.length ? { naics_codes: naics } : {}),
    },
    fields: ["Award ID", "Recipient Name", "Award Amount", "Award Type", "NAICS Code", "NAICS Description"],
    page: 1,
    limit: 50,
    sort: "Award Amount",
    order: "desc",
  };

  let upstream;
  try {
    upstream = await fetch(USASPENDING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `Could not reach USAspending: ${err.message}` }), {
      status: 502, headers: { "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: `USAspending API error: ${upstream.status}` }), {
      status: upstream.status, headers: { "Content-Type": "application/json" },
    });
  }

  const data = await upstream.json();
  const rows = data.results || [];

  // Dedupe by recipient name (a company can hold many separate award line
  // items) and keep the largest award per recipient as the representative row.
  const byRecipient = new Map();
  for (const r of rows) {
    const name = r["Recipient Name"];
    if (!name) continue;
    const amount = Number(r["Award Amount"]) || 0;
    const existing = byRecipient.get(name);
    if (!existing || amount > existing.awardAmount) {
      byRecipient.set(name, {
        recipientName: name,
        awardAmount: amount,
        awardType: r["Award Type"] || null,
        naicsCode: r["NAICS Code"] || null,
        naicsDescription: r["NAICS Description"] || null,
        awardId: r["Award ID"] || null,
      });
    }
  }

  const results = [...byRecipient.values()].sort((a, b) => b.awardAmount - a.awardAmount);

  return new Response(JSON.stringify({ results, agency, county }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" }, // contract award data changes slowly — cache a day
  });
}
