import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all categories
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

// Get categories as a map (name -> subCategories)
export const getMap = query({
  handler: async (ctx) => {
    const cats = await ctx.db.query("categories").collect();
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
    name: v.string(),
    subCategories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if category already exists
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
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
