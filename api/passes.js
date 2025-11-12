export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    // 1️⃣ Use v2 endpoint without accessFilter for reliability
    const gamesRes = await fetch(
      `https://games.roblox.com/v2/users/${userId}/games?limit=100`
    );
    const gamesData = await gamesRes.json();

    if (!gamesData.data || gamesData.data.length === 0) {
      return res.status(404).json({ error: "No public games found or Roblox API blocked response" });
    }

    const allPasses = [];

    // 2️⃣ Loop through each game and fetch its passes
    for (const game of gamesData.data) {
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
              placeId: placeId,
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
