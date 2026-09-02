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
  "Hi! I'm your business intelligence agent. Ask me anything about **Inventory**, **Marketing**, **Operations**, or **Finance**.";

const markdownStyles =
  "space-y-2 [&_a]:underline [&_code]:rounded [&_code]:bg-ground [&_code]:px-1 [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-line [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold";

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
        { role: "assistant", content: "The agent couldn't be reached. Check that the backend is running, then try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand font-display text-sm font-semibold text-white">
          BI
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink">Intelligence Agent</h2>
          <p className="text-xs text-ink-soft">Inventory · Marketing · Operations · Finance</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-good-soft px-2 py-0.5 text-[11px] font-medium text-good">
          <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden />
          Online
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-ground/60 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-sidebar text-white"
                  : "border border-line bg-surface text-ink shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              }`}
            >
              <div className={markdownStyles}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-soft">
              Checking the books…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-line bg-surface p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about stock, campaigns, orders or profit…"
          className="flex-1 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink placeholder-ink-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
