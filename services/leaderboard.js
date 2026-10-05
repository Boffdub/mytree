import { supabase } from "./supabase";
import { treesEarnedFromCorrect } from "../utils/stats";

const DAY_MS = 24 * 60 * 60 * 1000;

// Rolling window (last 7/30 days from right now, not calendar week/month).
function windowStartFor(range) {
  const now = new Date();
  if (range === "week")
    return new Date(now.getTime() - 7 * DAY_MS).toISOString();
  if (range === "month")
    return new Date(now.getTime() - 30 * DAY_MS).toISOString();
  return null; // 'all'
}

export async function getLeaderboard(range = "all") {
  const { data, error } = await supabase.rpc("get_leaderboard", {
    window_start: windowStartFor(range),
  });
  if (error) throw error;
  return data.map((row) => ({
    rank: row.rank,
    userId: row.user_id,
    displayName: row.display_name,
    totalCorrect: row.total_correct,
    accuracy: Number(row.accuracy),
    treesEarned: treesEarnedFromCorrect(row.total_correct),
  }));
}
