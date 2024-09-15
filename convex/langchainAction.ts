import { v } from "convex/values";
import { ChatCohere } from "@langchain/cohere";
import { action } from "./_generated/server";

export const generateFeedback = action({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    const llm = new ChatCohere({
      model: "command-r",
      apiKey: process.env.COHERE_API_KEY,
      // temperature: 0.9,

    });
    const result = await llm.invoke(message, {
      maxTokens: 10,
    });
    return result.content;
  },
});