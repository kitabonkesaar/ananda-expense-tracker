import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all expenses
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("expenses").collect();
  },
});

// Get expenses by trip
export const getByTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

// Get expenses by status
export const getByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("flagged")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Create expense
export const create = mutation({
  args: {
    tripId: v.id("trips"),
    amount: v.number(),
    category: v.string(),
    subCategory: v.optional(v.string()),
    description: v.string(),
    imageUrl: v.string(),
    createdBy: v.id("users"),
    location: v.object({ lat: v.number(), lng: v.number() }),
    paymentMethod: v.union(
      v.literal("Cash"),
      v.literal("UPI"),
      v.literal("Card"),
      v.literal("Other")
    ),
  },
  handler: async (ctx, args) => {
    const expenseId = await ctx.db.insert("expenses", {
      ...args,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    // Create audit log
    await ctx.db.insert("audit_logs", {
      action: "expense_created",
      userId: args.createdBy,
      metadata: {
        expenseId,
        amount: args.amount,
        category: args.category,
      },
      createdAt: new Date().toISOString(),
    });

    return expenseId;
  },
});

// Update expense status (approve/reject/flag)
export const updateStatus = mutation({
  args: {
    id: v.id("expenses"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("flagged")
    ),
    rejectionReason: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };
    if (args.rejectionReason) {
      updates.rejectionReason = args.rejectionReason;
    }
    await ctx.db.patch(args.id, updates);

    // Create audit log
    const actionMap: Record<string, string> = {
      approved: "expense_approved",
      rejected: "expense_rejected",
      flagged: "expense_flagged",
      pending: "expense_status_changed",
    };
    await ctx.db.insert("audit_logs", {
      action: actionMap[args.status] || "expense_status_changed",
      userId: args.userId,
      metadata: {
        expenseId: args.id,
        newStatus: args.status,
        ...(args.rejectionReason ? { reason: args.rejectionReason } : {}),
      },
      createdAt: new Date().toISOString(),
    });
  },
});
