import { createServerFn } from "@tanstack/react-start";

import { env } from "./env.server";
import { BRAND, SITE_URL } from "@/lib/site-meta";

type Mode = "explain" | "rewrite" | "ask";

type ExplainInput = {
  mode: Mode;
  target: string;
  question?: string;
  pageTitle: string;
  pageUrl: string;
  pageContent: string;
};

const KNOWLEDGE_PAGES = [
  "/",
  "/services",
  "/insights",
  "/audit",
];

async function fetchPageText(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6_000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return "";
      const html = await res.text();
      const body = html
        .replace(/<script[\s\S]*?<\/script>/giu, " ")
        .replace(/<style[\s\S]*?<\/style>/giu, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return body.slice(0, 4_000);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return "";
  }
}

async function readSiteKnowledge(): Promise<string> {
  const base = SITE_URL;
  const results = await Promise.allSettled(
    [...KNOWLEDGE_PAGES.map((p) => fetchPageText(`${base}${p}`)), fetchPageText(`${base}/llms.txt`)],
  );
  const parts = results
    .map((r) => r.status === "fulfilled" ? r.value : "")
    .filter(Boolean)
    .slice(0, 16_000);
  return parts.join("\n\n").slice(0, 16_000);
}

async function fireSvixWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = env("SVIX_WEBHOOK_URL");
  if (!url) return;
  try {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const secret = env("SVIX_WEBHOOK_SECRET");
    if (secret) {
      const { createHmac } = await import("node:crypto");
      const signature = `v1,${createHmac("sha256", secret).update(body).digest("base64")}`;
      headers["svix-signature"] = signature;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    try {
      await fetch(url, { method: "POST", headers, body, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Best-effort relay; never block the chat answer.
  
  }
}

const SYSTEM = `You are ${BRAND}'s AI visibility expert — a friendly, practical consultant for
AI search (LLMO/GEO), crawlability, entity graphs and agentic commerce. You help visitors
understand what a page means for their business and make text clearer. Be concise and
specific; use bullets when helpful; plain English; never invent facts about the visitor.
Answer in the same language the visitor writes in — detect their language (English, French,, Spanish,, Portuguese,, Yoruba,, Hausa,, German,, Hindi,, etc), and reply fluently in that language, even though the site's pages are mostly English.`;

function buildPrompt(input: ExplainInput) {
  const target = input.target.trim().slice(0, 6_000);
  const page = input.pageContent.trim().slice(0, 12_000);
  const targetBlock = target
    ? `\n\nSelected content:\n"""\n${target}\n"""`
    : "";
  const pageBlock = page
    ? `\n\nPage context (page — "${input.pageTitle}""):\n"""\n${page}\n"""`
    : "";
  switch (input.mode) {
    case "explain":
      return [
        "Explain the above content the way you would to a busy founder who is not an SEO specialist:",
        "what it actually means, why it matters for being found by AI assistants, and what to do about it.",
        "Keep it under ~180 words. Use the page context only when needed; focus on the selected content when provided.",
        targetBlock,
        pageBlock,
      ].filter(Boolean).join("\n");
    case "rewrite":
      return [
        "Rewrite the above content to be clearer, more specific and more likely to be understood and cited by AI assistants.",
        "Keep its meaning and business facts; improve scannability with short sentences and bullets where natural.",
        "Return ONLY the rewritten text, no preamble,no commentary,no quotes around it.",
        targetBlock,
        pageBlock,
      ].filter(Boolean).join("\n");
    default:
      return [target ? "Question about the selected content:" : "Question:", `"${target}"`, pageBlock].join("\n");
  }
}

export const explainWithAi = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Missing input.");
    const raw = input as Record<string, unknown>;
    const mode = ["explain", "rewrite", "ask"].includes(String(raw.mode)) ? (raw.mode as Mode) : "explain";
    const target = typeof raw.target === "string" ? raw.target : "";
    const pageTitle = typeof raw.pageTitle === "string" ? raw.pageTitle : "";
    const pageUrl = typeof raw.pageUrl === "string" ? raw.pageUrl : "";
    const pageContent = typeof raw.pageContent === "string" ? raw.pageContent : "";
    const question = typeof raw.question === "string" ? raw.question : "";
    return { mode, target, question, pageTitle, pageUrl, pageContent };
  })
  .handler(async ({ data }) => {
    const apiKey = env("OPENROUTER_API_KEY");
    if (!apiKey) {
      return { ok: false as const, error: "not_configured" };
    }

    const knowledge = (await readSiteKnowledge()).trim();
    const model = env("OPENROUTER_MODEL") || "openai/gpt-4o-mini";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28_000);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": BRAND,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: buildPrompt(data) + (knowledge ? `\n\nWebsite knowledge (written pages):\n"""\n${knowledge}\n"""` : "") },
          ],
          temperature: 0.4,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false as const, error: `upstream_${res.status}`, detail: body.slice(0, 300) };
      }

      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        await fireSvixWebhook({
          event: "ai_lead",
          source: SITE_URL,
          page: data.pageUrl,
          pageTitle: data.pageTitle,
          question: data.question ?? data.target ?? "",
          answer: text,
          answered: text.length > 0,
          language: "auto-detect (matched by model)",
          asked_at: new Date().toISOString(),
          contact: { name: "", email: "", source: "ai_chat" },
        });
      if (!text) return { ok: false as const, error: "empty_response" };
      return { ok: true as const, text, mode: data.mode };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { ok: false as const, error: "timeout" };
      }
      return { ok: false as const, error: String(err instanceof Error ? err.message : err) };
    } finally {
      clearTimeout(timer);
    }
  });