"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMemoryStats, sendChat, streamChat, type MemoryStats } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  /** Still being written by the agent. */
  streaming?: boolean;
}

const WELCOME =
  "Hi! I'm your business intelligence agent. Ask me anything about **Inventory**, **Marketing**, **Operations**, or **Finance** — I read the live store data and remember what we've discussed before.";

const SUGGESTIONS = [
  "What should I do first today?",
  "How healthy is the business right now?",
  "Which orders are awaiting fulfilment?",
  "Which channel brings the most revenue?",
];

const TOOL_LABELS: Record<string, string> = {
  get_inventory_data: "Checking inventory",
  get_marketing_data: "Checking campaigns",
  get_operations_data: "Checking orders and tasks",
  get_finance_data: "Checking the books",
  get_priority_actions: "Ranking priorities",
  get_business_health: "Scoring business health",
  search_store_knowledge: "Searching records and past conversations",
};

const markdownStyles =
  "space-y-2 [&_a]:underline [&_code]:rounded [&_code]:bg-ground [&_code]:px-1 [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-line [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold";

const MIN_W = 340;
const MIN_H = 420;
const SESSION_KEY = "bi-chat-session";

function BiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 4v14a2 2 0 0 0 2 2h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 14.5v2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12.5 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.5 7.5V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 3.2l.55 1.45L21 5.2l-1.45.55L19 7.2l-.55-1.45L17 5.2l1.45-.55L19 3.2z" fill="currentColor" />
    </svg>
  );
}

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState({ w: 420, h: 600 });
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [memory, setMemory] = useState<MemoryStats | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startX: number; startY: number; w: number; h: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  useEffect(() => {
    if (open && !memory) getMemoryStats().then(setMemory).catch(() => setMemory(null));
  }, [open, memory]);

  /** The thread survives a page reload within the same browser tab. */
  const savedSession = () => {
    try {
      return window.sessionStorage.getItem(SESSION_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  };

  const rememberSession = (id: string) => {
    setSessionId(id);
    try {
      window.sessionStorage.setItem(SESSION_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, w: size.w, h: size.h };
    const move = (ev: PointerEvent) => {
      const s = resizeRef.current;
      if (!s) return;
      setSize({
        w: Math.min(Math.max(s.w + (s.startX - ev.clientX), MIN_W), window.innerWidth - 48),
        h: Math.min(Math.max(s.h + (s.startY - ev.clientY), MIN_H), window.innerHeight - 48),
      });
    };
    const up = () => {
      resizeRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const updateLast = (fn: (m: Message) => Message) =>
    setMessages((ms) => {
      const copy = ms.slice();
      const last = copy[copy.length - 1];
      if (last?.role === "assistant" && last.streaming) copy[copy.length - 1] = fn(last);
      return copy;
    });

  const send = async (text: string) => {
    text = text.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "", streaming: true }]);
    setSending(true);
    setActivity("Thinking…");
    const sid = sessionId ?? savedSession();
    let finished = false;
    try {
      await streamChat(text, sid, (ev) => {
        switch (ev.type) {
          case "session":
            rememberSession(ev.session_id);
            break;
          case "token":
            setActivity(null);
            updateLast((m) => ({ ...m, content: m.content + ev.text }));
            break;
          case "reset":
            updateLast((m) => ({ ...m, content: "" }));
            break;
          case "tool":
            setActivity(ev.phase === "start" ? `${TOOL_LABELS[ev.name] ?? "Looking that up"}…` : "Writing the answer…");
            break;
          case "done":
            finished = true;
            rememberSession(ev.session_id);
            updateLast(() => ({ role: "assistant", content: ev.reply }));
            break;
          case "error":
            finished = true;
            updateLast(() => ({ role: "assistant", content: ev.message }));
            break;
        }
      });
      if (!finished) {
        // Stream closed without a done event (proxy buffering?). Fall back to the plain endpoint.
        const res = await sendChat(text, sid);
        rememberSession(res.session_id);
        updateLast(() => ({ role: "assistant", content: res.reply }));
      }
    } catch {
      try {
        const res = await sendChat(text, sid);
        rememberSession(res.session_id);
        updateLast(() => ({ role: "assistant", content: res.reply }));
      } catch {
        updateLast(() => ({
          role: "assistant",
          content: "The agent couldn't be reached. Check that the backend is running, then try again.",
        }));
      }
    } finally {
      setSending(false);
      setActivity(null);
      setMessages((ms) => ms.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    }
  };

  const newConversation = () => {
    setMessages([{ role: "assistant", content: WELCOME }]);
    setSessionId(undefined);
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Business Intelligence chat"
        title="Business Intelligence"
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white shadow-[0_8px_24px_rgba(16,24,40,0.28)] transition hover:scale-105 hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <BiIcon className="h-7 w-7" />
      </button>
    );
  }

  const memoryLabel = memory
    ? `${memory.backend === "pgvector" ? "pgvector" : "local"} memory · ${memory.chunks.chat ?? 0} remembered turns`
    : null;

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_12px_40px_rgba(16,24,40,0.22)]"
      style={{ width: size.w, height: size.h, maxWidth: "calc(100vw - 2rem)", maxHeight: "calc(100vh - 2rem)" }}
      role="dialog"
      aria-label="Business Intelligence chat"
    >
      <div
        onPointerDown={startResize}
        title="Drag to resize"
        className="absolute left-0 top-0 z-10 grid h-6 w-6 cursor-nwse-resize place-items-center text-ink-faint hover:text-ink-soft"
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
          <path d="M1 5V1h4M1 1l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex items-center gap-3 border-b border-line px-4 py-3 pl-7">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-white">
          <BiIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">Intelligence Agent</h2>
          <p className="truncate text-xs text-ink-soft" title={memory?.embedding_model}>
            {memoryLabel ?? "Inventory · Marketing · Operations · Finance"}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-good-soft px-2 py-0.5 text-[11px] font-medium text-good">
          <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden />
          Online
        </span>
        <button
          onClick={newConversation}
          title="Start a new conversation"
          aria-label="Start a new conversation"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-faint transition hover:bg-ground hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-faint transition hover:bg-ground hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-ground/60 p-4">
        {messages.map((msg, i) => {
          if (msg.role === "assistant" && msg.streaming && !msg.content) return null;
          return (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
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
          );
        })}
        {sending && activity && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-soft">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" aria-hidden />
              {activity}
            </div>
          </div>
        )}
        {messages.length === 1 && !sending && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft transition hover:border-brand hover:text-brand"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-line bg-surface p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about stock, campaigns, orders or profit…"
          className="flex-1 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink placeholder-ink-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
        <button
          onClick={() => send(input)}
          disabled={sending || !input.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
