// elevenLabsAction.ts
import { v } from "convex/values";
import { action } from "./_generated/server";

import { ElevenLabsClient, ElevenLabs, play } from "elevenlabs";

export  const speakText = action({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
// const response = await client.textToSpeech.convert("FbYWQmQRr6mS5EQQdVnT", {
//     optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Zero,
//     output_format: ElevenLabs.OutputFormat.Mp32205032,
//     text,
//     voice_settings: {
//         stability: 0.1,
//         similarity_boost: 0.3,
//         style: 0.2,
//     }
// });
const response = await client.generate({
  voice: 'Rachel',
  text: 'Hello! 你好! Hola! नमस्ते! Bonjour! こんにちは! مرحبا! 안녕하세요! Ciao! Cześć! Привіт! வணக்கம்!',
  model_id: 'eleven_multilingual_v2',
});

const chunks = [];
for await (const chunk of response) {
  chunks.push(chunk);
}

const audioBuffer = Buffer.concat(chunks);
return audioBuffer.toString('base64');
  }
});