export const runtime = "edge";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  // --- CRITICAL REWRITE: Explicitly maps the v1 endpoint so choices array extracts safely ---
  baseURL: "https://openrouter.ai",
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
        content: "You are an empathetic conversational AI assistant for mental wellness. Respond only in plain paragraph text or basic HTML structural blocks (like <p> or <br>). Never write a complete webpage layout wrapper such as <!DOCTYPE html>, <html>, or <body> tags."
      },
      ...formattedMessages
    ];

    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct:free", 
      messages: finalMessages,
    });

    // --- REPAIR LAYER: Safely indexing first choice position without breaking JS chaining properties ---
    const textOutput = response.choices?.[0]?.message?.content || "";

    if (!textOutput || textOutput.trim() === "") {
      return NextResponse.json({ text: "The free model connected successfully, but returned an empty response string. Please resubmit your message prompt!" });
    }

    return NextResponse.json({ text: textOutput });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown backend error";
    console.error("OpenRouter Error Log:", errorMessage);
    
    // Transparent UI routing: Catches credential errors visually inside chat text bubbles
    return NextResponse.json({ 
      text: `API Connection Error: ${errorMessage}. Please check your active Vercel Environment Variables.` 
    });
  }
}
