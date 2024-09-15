import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal} from "./_generated/api";
import { Id } from "./_generated/dataModel";

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
  args: { badHabit: v.object({
    label: v.string(),
    value: v.string(),
  }), duration: v.number() },
  handler: async (ctx, data) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }
    
    const feedback: string = await ctx.scheduler.runAfter(0, internal.langchainAction.generateFeedback, {
      message: `I have been struggling with my bad habit of ${data.badHabit.label} for quite a while and I just did it again for ${data.duration} seconds.`,
  })
    console.log(feedback)
    await ctx.db.insert("failures", {
      badHabitId: data.badHabit.value as Id<"badHabits">,
      duration: data.duration,
      userId,
      feedback,
    });
    return feedback
  },
});
