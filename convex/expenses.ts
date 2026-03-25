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
    manualDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { manualDate, ...other } = args;
    const expenseId = await ctx.db.insert("expenses", {
      ...other,
      status: "pending",
      createdAt: manualDate || new Date().toISOString(),
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

// Update expense
export const update = mutation({
  args: {
    id: v.id("expenses"),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    subCategory: v.optional(v.string()),
    description: v.optional(v.string()),
    paymentMethod: v.optional(v.union(
      v.literal("Cash"),
      v.literal("UPI"),
      v.literal("Card"),
      v.literal("Other")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("flagged")
    )),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Expense not found");

    const changes: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
      if ((existing as any)[key] !== value) {
        changes[key] = { from: (existing as any)[key], to: value };
      }
    }

    if (Object.keys(changes).length > 0) {
      await ctx.db.patch(id, { ...fields, status: "pending" }); // Reset to pending if edited

      await ctx.db.insert("audit_logs", {
        action: "expense_updated",
        userId,
        metadata: {
          expenseId: id,
          changes,
          description: existing.description
        },
        createdAt: new Date().toISOString(),
      });
    }
  },
});

// Delete expense
export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
