export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  async function fetchGames() {
    // Try v2 first
    let res1 = await fetch(`https://games.roblox.com/v2/users/${userId}/games?limit=100`);
    let data1 = await res1.json();
    if (data1?.data?.length) return data1.data;

    // Fallback to v1
    let res2 = await fetch(`https://games.roblox.com/v1/users/${userId}/games?limit=100`);
    let data2 = await res2.json();
    if (data2?.data?.length) return data2.data;

    return [];
  }

  try {
    const games = await fetchGames();
    if (!games.length)
      return res.status(404).json({ error: "No public games found or Roblox API blocked this region" });

    const allPasses = [];

    for (const game of games) {
      const placeId = game.rootPlace?.id;
      if (!placeId) continue;

      try {
        const passesRes = await fetch(
          `https://apis.roblox.com/game-passes/v1/game-passes?placeId=${placeId}`
        );
        const passesData = await passesRes.json();

        if (passesData?.data?.length) {
          passesData.data.forEach((p) => {
            allPasses.push({
              id: p.id,
              name: p.name,
              price: p.price,
              gameName: game.name,
              placeId,
            });
          });
        }
      } catch (innerErr) {
        console.warn(`Failed to fetch passes for place ${placeId}:`, innerErr);
      }
    }

    res.status(200).json({ userId, total: allPasses.length, passes: allPasses });
  } catch (err) {
    console.error("Error fetching passes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
