"use censor";
"use client";

import React, { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(false);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      
      // If the backend threw an error, read the text message or fallback safely
      const aiResponseText = data.text || data.error || "Something went wrong. Please check backend logs.";

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponseText }]);
    } catch (err) {
      console.error("Frontend Connection Error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to connect to server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* Top Header */}
      <header className="p-4 bg-gray-800 border-b border-gray-700 text-center font-bold text-xl tracking-wide text-cyan-400">
        ZenithAI Dashboard × Qwen Plus
      </header>

      {/* Chat Display Container */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl w-full mx-auto pb-24">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 mt-20">
            <p className="text-xl font-medium">Welcome to ZenithAI</p>
            <p className="text-sm">Type a message below to start chatting with Qwen Plus!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm tracking-wide leading-relaxed shadow-md ${
                  msg.role === "user"
                    ? "bg-cyan-600 text-white rounded-tr-none"
                    : "bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none whitespace-pre-wrap"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-cyan-400 animate-pulse">
              Qwen is thinking...
            </div>
          </div>
        )}
      </main>

      {/* Fixed Chat Input Form Area */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Qwen anything..."
            disabled={loading}
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:hover:bg-cyan-600"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
