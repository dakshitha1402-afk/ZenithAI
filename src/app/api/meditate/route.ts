export const runtime = "edge";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai", // Using explicit v1 api endpoint routing
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
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
        content: "You are a conversational AI assistant for mental wellness. Provide short, concise, empathetic responses. Respond ONLY in plain paragraph text or basic HTML strings like <p> lines, <br>, or <strong> tags for accentuation. NEVER output full boilerplate structure blocks like <!DOCTYPE html>, <html>, <head>, or <body> tags."
      },
      ...formattedMessages
    ];

    const response = await openai.chat.completions.create({
      model: "qwen/qwen-plus",
      messages: finalMessages,
    });

    // --- FIX: Cleaned up the broken ?.?. syntax chain to a safe standard access check ---
    const textOutput = response.choices?.[0]?.message?.content || "";

    if (!textOutput) {
      return NextResponse.json({ 
        text: `Error Trace: API connected, but choices object was empty. Raw output stringified: ${JSON.stringify(response)}` 
      });
    }

    return NextResponse.json({ text: textOutput });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown backend error";
    console.error("OpenRouter Production Error:", errorMessage);
    
    // Sends the exact connection error straight into your chat bubble if your API Key is missing or broken
    return NextResponse.json({ text: `Connection Error Trace: ${errorMessage}` }, { status: 200 });
  }
}
