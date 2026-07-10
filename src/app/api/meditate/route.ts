export const runtime = "edge";

import { NextResponse } from "next/server";
import OpenAI from "openai";

// --- FIX: Safely fallback to an empty string during build compilation so Vercel doesn't crash ---
const openai = new OpenAI({
  baseURL: "https://openrouter.ai",
  apiKey: process.env.OPENROUTER_API_KEY || "dummy_build_key",
});

export async function POST(req: Request) {
  try {
    // Safety check if the real key is missing during live runtime execution
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ text: "API Connection Error: Your OPENROUTER_API_KEY variable is not added to your Vercel project settings yet!" });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array provided" }, { status: 400 });
    }

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role || "user",
      content: msg.content,
    }));

    const finalMessages = [
      {
        role: "system",
        content: "You are an empathetic conversational AI assistant for mental wellness. Respond only in plain paragraph text or basic HTML structural blocks."
      },
      ...formattedMessages
    ];

    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct:free", 
      messages: finalMessages,
    });

    const textOutput = response.choices?.[0]?.message?.content || "";

    if (!textOutput || textOutput.trim() === "") {
      return NextResponse.json({ text: "The model connected successfully, but returned an empty response string. Please resubmit your message!" });
    }

    return NextResponse.json({ text: textOutput });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown backend error";
    return NextResponse.json({ text: `API Connection Error: ${errorMessage}` });
  }
}
