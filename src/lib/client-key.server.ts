import { getRequestHeader } from "@tanstack/react-start/server";

/** Best-effort client identity for rate limiting. Never trust it as auth. */
export function getClientKey(): string {
  const forwarded = getRequestHeader("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = getRequestHeader("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  const cf = getRequestHeader("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();
  return "unknown";
}
