import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all categories (optionally for a specific trip)
export const list = query({
  args: { tripId: v.optional(v.id("trips")) },
  handler: async (ctx, args) => {
    let cats = await ctx.db.query("categories").collect();
    if (args.tripId) {
      cats = cats.filter(c => !c.tripId || c.tripId === args.tripId);
    }
    return cats;
  },
});

// Get categories as a map (name -> subCategories)
export const getMap = query({
  args: { tripId: v.optional(v.id("trips")) },
  handler: async (ctx, args) => {
    let cats = await ctx.db.query("categories").collect();
    if (args.tripId) {
      cats = cats.filter(c => !c.tripId || c.tripId === args.tripId);
    }
    const result: Record<string, string[]> = {};
    for (const cat of cats) {
      result[cat.name] = cat.subCategories;
    }
    return result;
  },
});

// Create category
export const create = mutation({
  args: {
    tripId: v.optional(v.id("trips")),
    name: v.string(),
    subCategories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if category already exists for this trip
    const allExisting = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .collect();
      
    const existing = allExisting.find(c => c.tripId === args.tripId || !c.tripId);
    
    if (existing) {
      throw new Error(`Category "${args.name}" already exists`);
    }
    return await ctx.db.insert("categories", args);
  },
});

// Update category subcategories
export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    subCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    await ctx.db.patch(id, updates);
  },
});

// Delete category
export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
