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

    // --- MODIFICATION: Updated model to a guaranteed permanent free tier endpoint ---
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct:free", 
      messages: finalMessages,
    });

    // Safe multi-layer check to pull the response text accurately from the OpenRouter return array
    let textOutput = "";
    if (response && response.choices && response.choices.length > 0) {
      const choice = response.choices[0];
      if (choice && choice.message && choice.message.content) {
        textOutput = choice.message.content;
      }
    }

    // Direct fallback layer check if text remains empty 
    if (!textOutput || textOutput.trim() === "") {
      textOutput = "The model connected successfully, but returned an empty response. Please try sending your message again.";
    }

    return NextResponse.json({ text: textOutput });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown backend error";
    console.error("OpenRouter Production Error Log:", errorMessage);
    
    // Prints real error logs directly into the frontend bubble if your Vercel Environment key is disconnected
    return NextResponse.json({ 
      text: `API Connection Error: ${errorMessage}. Make sure your OPENROUTER_API_KEY is configured in your active Vercel project settings.` 
    });
  }
}
