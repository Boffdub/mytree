// Not to be confused with GameContext's `score` (0-5 clamped net-correct,
// the single "growing tree" visualization) — this is a separate, unclamped
// lifetime stat used by the Statistics screen and leaderboard rows.
export function treesEarnedFromCorrect(totalCorrect) {
  return Math.floor(totalCorrect / 5);
}
