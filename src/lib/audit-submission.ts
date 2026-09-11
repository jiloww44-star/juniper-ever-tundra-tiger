import { z } from "zod";

import type { BusinessKnowledgeObject, IntakeAnswers } from "@/types/intake";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BARE_DOMAIN = /^([a-z0-9-]+\.)+[a-z0-9-]{2,}(\/[^\s]*)?$/i;
const WEBSITE = /^https?:\/\/[^\s]+$/i;

export const auditSubmissionSchema = z.object({
  contactName: z.string().trim().max(120).optional(),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => !v || EMAIL.test(v), "Enter a valid email address.")
    .optional(),
  website: z
    .string()
    .trim()
    .max(200)
    .refine((v) => !v || WEBSITE.test(v) || BARE_DOMAIN.test(v) || v.startsWith("www.") || v.startsWith("mailto:"), "Enter a valid website or social URL.")
    .optional(),
  answers: z.custom<IntakeAnswers>(),
  bko: z.custom<BusinessKnowledgeObject>(),
  completeness: z.number().int().min(0).max(100),
  websiteConfirm: z.string().max(200).optional(),
});

export type AuditSubmissionInput = z.input<typeof auditSubmissionSchema>;
export type AuditSubmission = z.output<typeof auditSubmissionSchema>;

export function summarizeAudit(bko: BusinessKnowledgeObject): Record<string, unknown> {
  return {
    businessName: bko.business.name || "Untitled",
    industry: bko.business.industry || "Other",
    location: bko.business.location || "",
    serviceCount: bko.services.length,
    customerCount: bko.customers.length,
    credibilityCount: bko.credibility.length,
    materialCount: bko.existingMaterial.length,
    tags: bko.business.tags.slice(0, 6),
    website: bko.contact.website || "",
    email: bko.contact.email || "",
  };
}