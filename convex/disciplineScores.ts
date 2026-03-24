import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all discipline scores
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("discipline_scores").collect();
  },
});

// Get discipline score for a specific user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("discipline_scores")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return scores[0] || null;
  },
});

// Get leaderboard sorted by score
export const leaderboard = query({
  handler: async (ctx) => {
    const scores = await ctx.db.query("discipline_scores").collect();
    return scores.sort((a, b) => b.score - a.score);
  },
});
