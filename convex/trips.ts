import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all trips
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("trips").collect();
  },
});

// Get trip by ID
export const getById = query({
  args: { id: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get active trip
export const getActive = query({
  handler: async (ctx) => {
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    return trips[0] || null;
  },
});

// Create trip
export const create = mutation({
  args: {
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    totalBudget: v.number(),
    categoryBudgets: v.optional(v.any()),
    createdBy: v.id("users"),
    team: v.array(v.id("users")),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    // If creating active trip, set other active trips to completed
    if (args.status === "active") {
      const activeTrips = await ctx.db
        .query("trips")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect();
      for (const trip of activeTrips) {
        await ctx.db.patch(trip._id, { status: "completed" });
      }
    }
    return await ctx.db.insert("trips", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

// Update trip fields
export const update = mutation({
  args: {
    id: v.id("trips"),
    name: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    totalBudget: v.optional(v.number()),
    categoryBudgets: v.optional(v.any()),
    team: v.optional(v.array(v.id("users"))),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("completed"))
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    if (updates.status === "active") {
      const activeTrips = await ctx.db
        .query("trips")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect();
      for (const trip of activeTrips) {
        if (trip._id !== id) {
          await ctx.db.patch(trip._id, { status: "completed" });
        }
      }
    }
    await ctx.db.patch(id, updates);
  },
});

// Update trip status
export const updateStatus = mutation({
  args: {
    id: v.id("trips"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    if (args.status === "active") {
      const activeTrips = await ctx.db
        .query("trips")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect();
      for (const trip of activeTrips) {
        if (trip._id !== args.id) {
          await ctx.db.patch(trip._id, { status: "completed" });
        }
      }
    }
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// Get trip budget status (computed server-side)
export const getBudgetStatus = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) return null;
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    const totalSpent = expenses
      .filter((e) => e.status !== "rejected")
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      budget: trip.totalBudget,
      spent: totalSpent,
      remaining: trip.totalBudget - totalSpent,
      percentage: trip.totalBudget > 0 ? (totalSpent / trip.totalBudget) * 100 : 0,
    };
  },
});

// Get category breakdown for a trip
export const getCategoryBreakdown = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    const breakdown: Record<string, number> = {};
    expenses
      .filter((e) => e.status !== "rejected")
      .forEach((e) => {
        breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
      });
    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
    }));
  },
});

// Delete trip and its associated data
export const remove = mutation({
  args: { id: v.id("trips") },
  handler: async (ctx, args) => {
    // Delete associated expenses
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_trip", (q) => q.eq("tripId", args.id))
      .collect();
    for (const exp of expenses) {
      await ctx.db.delete(exp._id);
    }
    
    // Delete associated alerts
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_trip", (q) => q.eq("tripId", args.id))
      .collect();
    for (const alert of alerts) {
      await ctx.db.delete(alert._id);
    }

    // Delete the trip
    await ctx.db.delete(args.id);
  },
});
