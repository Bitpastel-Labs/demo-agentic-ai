"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendChat } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME =
  "Hi! I'm your all-in-one business intelligence agent. Ask me anything about **Inventory**, **Marketing**, **Operations**, or **Finance**.";

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await sendChat(text, sessionId);
      setSessionId(res.session_id);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, something went wrong reaching the agent. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[520px] flex-col rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-200">Business Intelligence Agent</h2>
        <p className="text-xs text-slate-500">Inventory · Marketing · Operations · Finance</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-amber-500/90 text-slate-900"
                  : "bg-slate-800 text-slate-200"
              }`}
            >
              <div className="space-y-2 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-950/60 [&_code]:px-1 [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-700 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-700 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-400">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-slate-800 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about inventory, marketing, operations or finance…"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
