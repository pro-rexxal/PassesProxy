
export default async function handler(req, res) {
  try {
    const placeId = (req.query.placeId || req.query.placeid || "").toString().trim();
    if (!placeId || !/^\d{1,20}$/.test(placeId)) {
      return res.status(400).json({ error: "Missing or invalid placeId" });
    }

    // simple in-memory cache (per serverless instance) - TTL 60s
    // NOTE: serverless instances may be recycled; this is fine as short cache.
    if (!global._passesCache) global._passesCache = {};
    const cacheKey = `passes:${placeId}`;
    const now = Date.now();
    const cached = global._passesCache[cacheKey];
    if (cached && (now - cached.t) < 60_000) {
      res.setHeader("x-cache", "HIT");
      return res.status(200).json(cached.v);
    }

    const apiUrl = `https://games.roblox.com/v1/games/${placeId}/game-passes?limit=100`;
    const r = await fetch(apiUrl, { method: "GET" });

    // handle upstream errors
    const contentType = r.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await r.json();
    } else {
      data = { raw: await r.text() };
    }

    if (!r.ok) {
      // Return the Roblox API status and body for debugging (but do not leak sensitive info)
      return res.status(r.status).json({ error: "Upstream error", upstream: data });
    }

    // store in cache
    global._passesCache[cacheKey] = { t: now, v: data };

    // CORS: allow Roblox to call this from in-experience
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("x-cache", "MISS");
    return res.status(200).json(data);

  } catch (err) {
    console.error("passes handler error:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
}
