import { z } from "zod";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeWebsite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Website is required.");
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProto);
  } catch {
    throw new Error("Enter a valid website URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Website must be an http(s) URL.");
  }
  if (!url.hostname.includes(".")) {
    throw new Error("Enter a valid website domain.");
  }
  return `${url.protocol}//${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
}

export const auditLeadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => EMAIL.test(v), "Enter a valid work email."),
  website: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .refine((v) => {
      try {
        normalizeWebsite(v);
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid website URL.")
    .transform((v) => normalizeWebsite(v)),
  company: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  goals: z.string().trim().max(1000).optional(),
  websiteConfirm: z.string().max(200).optional(),
});

export type AuditLeadInput = z.input<typeof auditLeadSchema>;
export type AuditLead = z.output<typeof auditLeadSchema>;
