# Roblox Game Passes Proxy

Endpoint:
`GET /api/passes?placeId=<PLACE_ID>`

Returns the JSON response from:
`https://games.roblox.com/v1/games/<PLACE_ID>/game-passes?limit=100`

Cache: 60s in serverless instance.

Usage from Roblox:
`HttpService:GetAsync("https://<your-domain>/api/passes?placeId=" .. placeId)`
