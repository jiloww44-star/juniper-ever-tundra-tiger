/**
 * Prompt-injection defenses for user-supplied copy that is sent to an LLM.
 * Never interpolate raw user text into a system prompt.
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const INJECTION_MARKERS =
  /\b(ignore (all|any|previous|above|prior) (instructions|prompts)|system prompt|developer message|jailbreak|do not follow)\b/gi;

export const PROMPT_LIMITS = {
  category: 80,
  categoryBrief: 600,
  draft: 2000,
} as const;

export function sanitizePromptInput(text: string, maxLen: number): string {
  return text
    .replace(CONTROL_CHARS, "")
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(INJECTION_MARKERS, "[filtered]")
    .trim()
    .slice(0, maxLen);
}

/** Wrap untrusted text so the model treats it as data, not instructions. */
export function wrapUserContent(label: string, value: string, maxLen: number): string {
  const cleaned = sanitizePromptInput(value, maxLen);
  const tag = label.replace(/[^a-z0-9_]/gi, "_").slice(0, 32);
  return `<user_${tag}>${cleaned}</user_${tag}>`;
}

export function looksLikeInjection(text: string): boolean {
  INJECTION_MARKERS.lastIndex = 0;
  return INJECTION_MARKERS.test(text);
}
