import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all audit logs (sorted newest first)
export const list = query({
  handler: async (ctx) => {
    const logs = await ctx.db.query("audit_logs").collect();
    return logs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
});

// Get audit logs by user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audit_logs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Create audit log
export const create = mutation({
  args: {
    action: v.string(),
    userId: v.id("users"),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("audit_logs", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});
