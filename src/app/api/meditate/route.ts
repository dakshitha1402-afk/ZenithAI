export const runtime = "edge";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Ensure messages exist and are formatted correctly for OpenRouter
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array provided" }, { status: 400 });
    }

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role || "user",
      content: msg.content,
    }));

    // HACKATHON SYSTEM FIX: Tells Qwen to output simple text/HTML snippets, never whole layouts
    const finalMessages = [
      {
        role: "system",
        content: "You are a conversational AI assistant for mental wellness. Provide short, concise, empathetic responses. Respond ONLY in plain paragraph text using raw text or basic HTML strings like <p> lines, <br>, or <strong> tags for accentuation. NEVER output full boilerplate structure blocks like <!DOCTYPE html>, <html>, <head>, or <body> tags."
      },
      ...formattedMessages
    ];

    const response = await openai.chat.completions.create({
      model: "qwen/qwen-plus",
      messages: finalMessages,
    });

    // Extract text safely with multiple fallbacks
    const textOutput = response.choices?.[0]?.message?.content || "No response text found.";

    // Return as a clean JSON structure that your frontend can read
    return NextResponse.json({ text: textOutput });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown backend error";
    console.error("OpenRouter Production Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
