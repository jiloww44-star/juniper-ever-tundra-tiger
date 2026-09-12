import { useId, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { explainWithAi } from "@/lib/ai-explain.functions";

type Msg = { id: string; role: "user" | "bot"; text: string; ai?: boolean };

const canned: { match: string[]; reply: string }[] = [
  {
    match: ["price", "pricing", "cost", "budget"],
    reply:
      "The AI Visibility Health Check is free. Retainers and agentic commerce engineering are scoped after the audit, based on catalog size and integration depth.",
  },
  {
    match: ["audit", "health check", "start"],
    reply:
      "Start with the free AI Visibility Audit — paste your story in,and get a structured AI Visibility Profile back: business object,, tags, LocalBusiness structured data and a section outline. Then we'll go deeper on the full audit.",
  },
  {
    match: ["chatbot", "bot", "support", "whatsapp"],
    reply:
      "We build AI chatbots trained on your business, plus a unified support desk across WhatsApp, Messenger and web chat with human handover.",
  },
  {
    match: ["agentic", "commerce", "checkout", "mcp"],
    reply:
      "Agentic commerce means wiring your catalog into MCP servers and transaction protocols like ACP, UCP and AP2, so agents can recommend and buy without a human in the loop.",
  },
];

function cannedAnswer(input: string) {
  const q = input.toLowerCase();
  const hit = canned.find((c) => c.match.some((m) => q.includes(m)));
  return (
    hit?.reply ??
    "Good question. A strategist can answer that properly — book the free AI Visibility Audit and we'll cover it on the call."
  );
}

function nextId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pageText(): string {
  if (typeof document === "undefined") return "";
  const main = document.getElementById("main");
  const root = main ?? document.body;
  const text = (root?.innerText ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 12_000);
}

function modeLabel(mode: "explain" | "rewrite", hasSel: boolean) {
  if (mode === "explain") return hasSel ? "Explain this" : "Explain this page";
  return hasSel ? "Rewrite this" : "Rewrite this page";
}

export function ExpertChat() {
  const titleId = useId();
  const runAi = useServerFn(explainWithAi);
  const selectedRef = useRef("");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi — I'm your AI commerce expert. Ask me about AEO, agentic commerce or how the audit works. Select any text on the page,and tap Explain / Rewrite to run on it right now.",
    },
  ]);

  const addUser = (text: string) => {
    setMessages((m) => [...m, { id: nextId(), role: "user", text }]);
  };

  const addBot = (text: string, ai = false) => {
    setMessages((m) => [...m, { id: nextId(), role: "bot", text, ai }]);
  };

  const applyMode = async (mode: "explain" | "rewrite" | "ask") => {
    if (busy) return;
    const target = selectedRef.current.trim();
    const hasSel = target.length > 0;
    let userText = "";
    if (mode === "ask") {
      userText = input.trim();
      if (!userText) return;
      setInput("");
    } else {
      userText = modeLabel(mode, hasSel);
    }
    addUser(userText);
    setBusy(true);
    addBot("Thinking — reading the page context…", true);
    try {
      const res = await runAi({ data: {
        mode,
        target: hasSel ? target : "",
        pageTitle: document.title,
        pageUrl: location.href,
        question: userText,
        pageContent: pageText(),
      }});
      setMessages((m) => [...m.slice(0, m.length - 1), { id: nextId(), role: "bot", text: res.ok && res.text ? res.text : fallbackText(mode, input), ai: Boolean(res.ok)}]);
    } catch {
      setMessages((m) => [...m.slice(0, m.length - 1), { id: nextId(), role: "bot", text: "AI request failed — please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  function fallbackText(mode: "explain" | "rewrite" | "ask", rawInput: string) {
    if (mode === "ask") return cannedAnswer(rawInput);
    if (mode === "explain") {
      return "The AI helper is offline here. This demo ships built-in answers instead: try asking about 'audit', 'agentic commerce' or 'chatbots'.";
    }
    return "The AI helper is offline here, so nothing was rewritten. This demo ships built-in answers instead.";
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    void applyMode("ask");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {open && (
        <div
          className="card-beame mb-3 flex h-[440px] w-[min(92vw,360px)] flex-col overflow-hidden p-0"
          role="dialog"
          aria-labelledby={titleId}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <p id={titleId} className="text-sm font-bold">
              AI Commerce Expert
            </p>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-border px-4 py-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void applyMode("explain")}
              className="chip-beame disabled:opacity-50"
            >
              ✦ Explain
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void applyMode("rewrite")}
              className="chip-beame disabled:opacity-50"
            >
              ⇄ Rewrite
            </button>
            {selectedRef.current.length > 0 ? (
              <span className="ml-auto font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Selection active
              </span>
            ) : null}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[92%]"}>
                <p
                  className={
                    m.role === "user"
                      ? "rounded-none [clip-path:var(--chamfer-4)] bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "rounded-none [clip-path:var(--chamfer-4)] bg-muted px-3 py-2 text-sm text-muted-foreground"
                  }
                >
                  {m.text}
                </p>
                {m.ai && m.role === "bot" && !m.text.startsWith("Thinking") ? (
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard?.writeText(m.text)}
                    className="mt-1 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Copy
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              placeholder="Ask a question…"
              aria-label="Message"
              maxLength={500}
              className="flex-1 rounded-none [clip-path:var(--chamfer-4)] border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <button type="submit" disabled={busy} className="btn-beame btn-solid min-h-11 px-4 py-2 text-sm disabled:opacity-60">
              {busy ? "…" : "Send"}
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          const sel = window.getSelection()?.toString().trim() ?? "";
          selectedRef.current = sel;
          setOpen((o) => !o);
        }}
        className="btn-beame btn-solid min-h-11 shadow-lg"
      >
        {open ? "Hide expert" : "Ask an expert"}
      </button>
    </div>
  );
}