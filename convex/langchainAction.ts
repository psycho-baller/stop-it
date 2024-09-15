import { v } from "convex/values";
import { ChatCohere } from "@langchain/cohere";
import { internalAction } from "./_generated/server";

export const generateFeedback = internalAction({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    const llm = new ChatCohere({
      model: "command-r-plus",
      apiKey: process.env.COHERE_API_KEY,
      temperature: 0.1,
    });
    const result = await llm.invoke(message);
    console.log("result", result);
    return result.content;
  },
});