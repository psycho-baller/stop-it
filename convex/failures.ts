import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getFailures = query({
  args: {},
  handler: async (ctx) => {
    // Grab the most recent messages.
    const failures = await ctx.db.query("failures").order("desc").take(100);
    // Add the author's name to each message.
    return Promise.all(
      failures.map(async (failure) => {
        // const { _id, _creationTime } = (await ctx.db.get(failure._id))!;
        return failure;
      }),
    );
  },
});

export const add = mutation({
  args: { feedback: v.string(), badHabitId: v.id('badHabits'), duration: v.number() },
  handler: async (ctx, data) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }
    await ctx.db.insert("failures", {
      ...data,
      userId,
    });
  },
});
