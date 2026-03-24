import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all users
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get user by ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get user by phone
export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_phone")
      .collect();
    return users.find((u) => u.phone?.includes(args.phone)) || null;
  },
});

// Create a user
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

// Update user
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("staff"))),
    isActive: v.optional(v.boolean()),
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

// Login: find user by phone or return first admin
export const login = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const found = allUsers.find((u) => u.phone?.includes(args.phone));
    if (found) return found;
    // Default to first admin
    return allUsers.find((u) => u.role === "admin") || allUsers[0] || null;
  },
});

// Delete user
export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Google sign in / sign up
export const googleLogin = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    googleId: v.string(),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists by email or googleId
    const existingByGoogle = await ctx.db
      .query("users")
      .withIndex("by_googleId", (q) => q.eq("googleId", args.googleId))
      .first();

    if (existingByGoogle) {
      await ctx.db.patch(existingByGoogle._id, {
        picture: args.picture,
        name: args.name,
      });
      return existingByGoogle._id;
    }

    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingByEmail) {
      await ctx.db.patch(existingByEmail._id, {
        googleId: args.googleId,
        picture: args.picture,
        name: args.name,
      });
      return existingByEmail._id;
    }

    // Sign up: Create new user
    const adminEmails = ["dev.satyajitmohanty@gmail.com", "satya1999@gmail.com"];
    const role = adminEmails.includes(args.email) ? "admin" : "staff";
    
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      googleId: args.googleId,
      picture: args.picture,
      role: role,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    return userId;
  },
});
