// cohereAction.ts
import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateFeedback = action({
  args: { duration: v.number(), badHabit: v.string() },
  handler: async (ctx, { duration, badHabit }) => {
    const response = await fetch("https://api.cohere.ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "xlarge",
        prompt: `Generate a motivational and powerful feedback for me. I have been struggling with my bad habit of ${badHabit} for quite a while and I just did it again for ${duration} seconds.`,
        max_tokens: 50,
      }),
    });

    const data = await response.json();
    return data.generations[0].text;
  },
});