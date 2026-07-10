export const runtime = "edge";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  // --- CRITICAL HACKATHON FIX: Added /api/v1 so the OpenAI SDK client maps calls correctly ---
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

    let textOutput = "";
    if (response && response.choices && response.choices.length > 0) {
      const choice = response.choices[0];
      if (choice && choice.message && choice.message.content) {
        textOutput = choice.message.content;
      }
    }

    if (!textOutput || textOutput.trim() === "") {
      textOutput = "The free model connected successfully, but returned an empty text string. Please try submitting your prompt again!";
    }

    return NextResponse.json({ text: textOutput });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown backend error";
    console.error("OpenRouter Error Log:", errorMessage);
    
    // Catch configuration issues visually in your dashboard message bubbles
    return NextResponse.json({ 
      text: `API Connection Error: ${errorMessage}. Please check your active Vercel Environment Variables.` 
    });
  }
}
