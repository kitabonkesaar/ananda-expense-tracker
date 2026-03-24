import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all alerts
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("alerts").collect();
  },
});

// Get alerts by trip
export const getByTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

// Get alerts by severity
export const getBySeverity = query({
  args: {
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
  },
  handler: async (ctx, args) => {
    const allAlerts = await ctx.db.query("alerts").collect();
    return allAlerts.filter((a) => a.severity === args.severity);
  },
});

// Create alert
export const create = mutation({
  args: {
    tripId: v.id("trips"),
    type: v.union(
      v.literal("budget"),
      v.literal("inactivity"),
      v.literal("suspicious")
    ),
    message: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alerts", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});
