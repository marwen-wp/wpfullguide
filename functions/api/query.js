/**
 * frontend/functions/api/query.js
 * ─────────────────────────────────────────────────────────────────────────
 * Cloudflare Pages Function: A secure proxy for Sanity API calls.
 * This runs on Cloudflare's server, so it can see your secret SANITY_TOKEN
 * without ever showing it to users or on GitHub.
 * ─────────────────────────────────────────────────────────────────────────
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN } = env;

  try {
    const { query } = await request.json();
    if (!query) return new Response("Missing query", { status: 400 });

    const apiVersion = "2024-03-31";
    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${apiVersion}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SANITY_TOKEN}`
      }
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
