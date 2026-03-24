import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    googleId: v.optional(v.string()),
    picture: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("staff")),
    isActive: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_phone", ["phone"])
    .index("by_email", ["email"])
    .index("by_googleId", ["googleId"]),

  trips: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    totalBudget: v.number(),
    categoryBudgets: v.optional(v.any()), // Record<string, number>
    createdBy: v.id("users"),
    team: v.array(v.id("users")),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed")
    ),
    createdAt: v.string(),
  }).index("by_status", ["status"]),

  expenses: defineTable({
    tripId: v.id("trips"),
    amount: v.number(),
    category: v.string(),
    subCategory: v.optional(v.string()),
    description: v.string(),
    imageUrl: v.string(),
    createdBy: v.id("users"),
    location: v.object({ lat: v.number(), lng: v.number() }),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("flagged")
    ),
    paymentMethod: v.union(
      v.literal("Cash"),
      v.literal("UPI"),
      v.literal("Card"),
      v.literal("Other")
    ),
    rejectionReason: v.optional(v.string()),
    manualDate: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_trip", ["tripId"])
    .index("by_status", ["status"])
    .index("by_creator", ["createdBy"]),

  alerts: defineTable({
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
    createdAt: v.string(),
  }).index("by_trip", ["tripId"]),

  audit_logs: defineTable({
    action: v.string(),
    userId: v.id("users"),
    metadata: v.any(), // Record<string, unknown>
    createdAt: v.string(),
  }).index("by_user", ["userId"]),

  discipline_scores: defineTable({
    userId: v.id("users"),
    onTime: v.number(),
    late: v.number(),
    rejected: v.number(),
    score: v.number(),
  }).index("by_user", ["userId"]),

  categories: defineTable({
    name: v.string(),
    subCategories: v.array(v.string()),
  }).index("by_name", ["name"]),
});
