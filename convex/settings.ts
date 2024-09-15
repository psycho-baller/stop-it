import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import type { ExpressionOrValue } from "convex/server";

export const getNotificationEmails = query(async (ctx) => {
  const userId = await getAuthUserId(ctx);
  const settings = await ctx.db.query("settings").filter((s) => s.eq("userId", userId as ExpressionOrValue<'users'>)).first();
  return settings?.notificationEmails || [];
});
