import {
  AI_ENDPOINT,
  AI_MAX_REQUEST_BYTES,
  AI_MAX_RESPONSE_BYTES,
  AI_MAX_TOKENS,
  AI_MODEL,
  AI_REQUEST_TIMEOUT_MS,
} from "./ai-config.ts";
import { logger } from "./logger.ts";
import { getRequestId } from "./request-context.ts";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

class AiRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
  }
}

async function readLimitedText(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new AiRequestError("AI response exceeded the size limit.");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

export async function completeChat(messages: ChatMessage[], apiKey: string): Promise<string> {
  const body = JSON.stringify({
    model: AI_MODEL,
    messages,
    temperature: 0.4,
    max_tokens: AI_MAX_TOKENS,
    stream: false,
  });

  if (body.length > AI_MAX_REQUEST_BYTES) {
    throw new AiRequestError("Prompt is too large.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
  const requestId = getRequestId();

  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(requestId ? { "X-Request-Id": requestId } : {}),
      },
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.warn("ai.request_failed", {
        status: res.status,
        requestId,
        detail: detail.slice(0, 300),
      });
      if (res.status === 429) {
        throw new AiRequestError("Too many requests right now — try again in a moment.", 429);
      }
      if (res.status === 402) {
        throw new AiRequestError("AI credits are exhausted for this workspace.", 402);
      }
      throw new AiRequestError("AI request failed. Please try again.", res.status);
    }

    const raw = await readLimitedText(res, AI_MAX_RESPONSE_BYTES);
    let parsed: { choices?: { message?: { content?: string } }[] };
    try {
      parsed = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
    } catch {
      throw new AiRequestError("AI returned an unreadable response.");
    }

    const text = parsed.choices?.[0]?.message?.content?.trim() ?? "";
    return text;
  } catch (error) {
    if (error instanceof AiRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiRequestError("The AI request timed out. Please try again.");
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiRequestError("The AI request timed out. Please try again.");
    }
    logger.error("ai.request_exception", { requestId, error });
    throw new AiRequestError("AI is unavailable right now.");
  } finally {
    clearTimeout(timeout);
  }
}
