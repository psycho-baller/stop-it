// elevenLabsAction.ts
import { v } from "convex/values";
import { action } from "./_generated/server";

export const speakText = action({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": "YOUR_ELEVENLABS_API_KEY",
      },
      body: JSON.stringify({
        text,
        voice: "en_us_male",
      }),
    });

    const data = await response.json();
    return data.audio_url;
  },
});