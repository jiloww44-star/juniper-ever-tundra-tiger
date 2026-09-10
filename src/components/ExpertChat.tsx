import { useId, useState } from "react";

type Msg = { id: string; role: "user" | "bot"; text: string };

const canned: { match: string[]; reply: string }[] = [
  {
    match: ["price", "pricing", "cost", "budget"],
    reply:
      "The AI Visibility Health Check is free. Retainers and agentic commerce engineering are scoped after the audit, based on catalog size and integration depth.",
  },
  {
    match: ["audit", "health check", "start"],
    reply:
      "Start with the free AI Visibility Health Check — drop your name, work email and website in the form above and we'll send results within two business days.",
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

function answer(input: string) {
  const q = input.toLowerCase();
  const hit = canned.find((c) => c.match.some((m) => q.includes(m)));
  return (
    hit?.reply ??
    "Good question. A strategist can answer that properly — book the free AI Visibility Health Check and we'll cover it on the call."
  );
}

function nextId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ExpertChat() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi — I'm your AI commerce expert. Ask me about AEO, agentic commerce or how the audit works.",
    },
  ]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim().slice(0, 500);
    if (!text) return;
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "user", text },
      { id: nextId(), role: "bot", text: answer(text) },
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {open && (
        <div
          className="card-beame mb-3 flex h-[420px] w-[min(92vw,340px)] flex-col overflow-hidden p-0"
          role="dialog"
          aria-labelledby={titleId}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
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
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <p
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-none [clip-path:var(--chamfer-4)] bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[90%] rounded-none [clip-path:var(--chamfer-4)] bg-muted px-3 py-2 text-sm text-muted-foreground"
                }
              >
                {m.text}
              </p>
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
            <button type="submit" className="btn-beame btn-solid min-h-11 px-4 py-2 text-sm">
              Send
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-beame btn-solid min-h-11 shadow-lg"
      >
        {open ? "Hide expert" : "Ask an expert"}
      </button>
    </div>
  );
}
