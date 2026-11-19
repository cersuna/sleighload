# Sleighload launch plan

Live: https://cersuna.github.io/sleighload/

## How it makes money (players never pay)
1. **Display ads (AdSense)**: apply today, since approval takes days to weeks. A daily game builds repeat pageviews: every player returns every day, and archive play adds more views per visit. Typical casual-game RPM is $2–10 per 1,000 pageviews, so $100 takes roughly 15k–40k pageviews.
2. **Day sponsorships** (fastest route to real money). Sell "Today's puzzle is supported by ___" to local businesses, Etsy shops, newsletters and indie apps. Pitch: "$25–50 for one day, your link under the puzzle and in our social post." One sale pays most of the monthly bill. Set up a Stripe Payment Link and put it in `config.js` → `sponsorPitchUrl`, then fill in `sponsor` on the days you sell.
3. Later: an optional "Supporter" tip, or a no-ads pass once traffic exists.

## Setup checklist
- [ ] AdSense: sign up, then uncomment the AdSense block in `index.html` and add `ads.txt`.
- [ ] GA4: uncomment the block in `index.html`. Events: `puzzle_start`, `puzzle_complete`, `share`, `hint`.
- [ ] Google Search Console + Bing Webmaster: submit `sitemap.xml`.
- [ ] Optional: a custom domain (e.g. sleighload.com), which makes shares look more trustworthy.

## Growth: the share card is the engine
Every finish produces a copyable result:
```
Sleighload #3 (6×6) 🛷 ⭐⭐⭐
🎁 Packed in 1:42 · 14 moves
🔥 3-day streak
https://cersuna.github.io/sleighload/
```
Get it into group chats, where daily-puzzle games spread.

**Where to post** (as yourself, saying you made it, following each community's rules)
- r/WebGames, r/puzzles, r/incremental_games (no), r/IndieGaming, r/SideProject, r/christmas, r/casualgames
- Hacker News "Show HN: A daily Christmas packing puzzle (seeded, always solvable)"
- Product Hunt (launch on a weekday)
- TikTok/Reels/Shorts: 10-second speed solve of today's puzzle with "can you beat 0:48?" Post daily; the daily format is built-in content.
- Facebook groups for puzzle fans, teachers ("brain break for class"), and seniors' puzzle groups
- Family and work group chats: "new Christmas puzzle every day until Christmas, race me"
- Newsletters that list web games (e.g. game-roundup Substacks): email the authors

**Post copy**
> I made a free daily Christmas puzzle: pack all the presents into Santa's sleigh. Everyone gets the same puzzle each day, so you can race friends. No download, no sign-up. Today's took me 1:12, can you beat it? https://cersuna.github.io/sleighload/

## Realistic expectations
The traffic spike runs Dec 1–25. Ads alone need a few posts to catch on. Sponsorships don't depend on traffic luck: sell 2–4 days to people you know.
