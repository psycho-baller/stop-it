import { QueryCtx } from './_generated/server.d';
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {  } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getBadHabits = query({
  args: {},
  handler: async (ctx) => {
    // Grab the most recent messages.
    const badHabits = await ctx.db.query("badHabits").order("desc").take(100);
    // Add the author's name to each message.
    return Promise.all(
      badHabits.map(async (badHabit) => {
        // const { _id, _creationTime } = (await ctx.db.get(badHabit._id))!;
        return { 
          ...badHabit, 
          // _id, 
          // _creationTime 
        };
      }),
    );
  },
});

export const getBadHabit = query({
  args: { _id: v.id('badHabits') },
  handler: async (ctx, { _id }) => {
    return ctx.db.get(_id);
  },
});


export const add = mutation({
  args: { name: v.string(), description: v.string(), detectionType: v.string(), isCustom: v.boolean(), notifyEnabled: v.boolean(), notifyEmails: v.array(v.string()) },
  handler: async (ctx, data) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }
    // create a new bad habit
    await ctx.db.insert("badHabits", {
      ...data,
      userId,
    });
  },
});
