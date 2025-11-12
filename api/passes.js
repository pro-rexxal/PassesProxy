export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    // 1️⃣ Get all public games of the user
    const gamesRes = await fetch(
      `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=100`
    );
    const gamesData = await gamesRes.json();

    if (!gamesData.data || gamesData.data.length === 0) {
      return res.status(404).json({ error: "No public games found" });
    }

    // 2️⃣ Fetch all game passes for each game
    const allPasses = [];
    for (const game of gamesData.data) {
      const placeId = game.rootPlace?.id;
      if (!placeId) continue;

      const passesRes = await fetch(
        `https://apis.roblox.com/game-passes/v1/game-passes?placeId=${placeId}`
      );
      const passesData = await passesRes.json();

      if (passesData.data) {
        // Add place name to each pass for clarity
        passesData.data.forEach((p) => {
          p.gameName = game.name;
          allPasses.push(p);
        });
      }
    }

    // 3️⃣ Return merged results
    res.status(200).json({ userId, total: allPasses.length, passes: allPasses });
  } catch (err) {
    console.error("Error fetching passes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
