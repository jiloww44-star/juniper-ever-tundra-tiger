import { createServerFn } from "@tanstack/react-start";
import { auditLeadSchema } from "./audit-lead.ts";
import { logger } from "./logger.ts";
import { auditLeadLimiter } from "./rate-limit.ts";

export const submitAuditLead = createServerFn({ method: "POST" })
  .validator((data: unknown) => auditLeadSchema.parse(data))
  .handler(async ({ data }) => {
    const { getClientKey } = await import("./client-key.server.ts");
    const { getRequestId } = await import("./request-context.ts");

    if (data.websiteConfirm) {
      return { ok: false as const, error: "Rejected." };
    }

    const clientKey = getClientKey();
    const limited = auditLeadLimiter.limit(`lead:${clientKey}`);
    if (!limited.ok) {
      const seconds = Math.max(1, Math.ceil(limited.retryAfterMs / 1000));
      return { ok: false as const, error: `Too many requests. Try again in ${seconds}s.` };
    }

    logger.info("audit.lead_received", {
      requestId: getRequestId(),
      nameLength: data.name.length,
      hasCompany: Boolean(data.company),
      websiteHost: (() => {
        try {
          return new URL(data.website).hostname;
        } catch {
          return "unknown";
        }
      })(),
    });

    return {
      ok: true as const,
      reference: crypto.randomUUID().slice(0, 8),
    };
  });
