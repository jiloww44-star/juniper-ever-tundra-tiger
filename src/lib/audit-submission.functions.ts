import { createServerFn } from "@tanstack/react-start";

import { auditSubmissionSchema, summarizeAudit } from "./audit-submission.ts";
import { env } from "./env.server.ts";
import { logger } from "./logger.ts";
import { auditSubmissionLimiter } from "./rate-limit.ts";

async function notifyAuditEmail(
  summary: Record<string, unknown>,
  reference: string,
): Promise<void> {
  const apiKey = env("RESEND_API_KEY");
  const to = env("AUDIT_NOTIFY_EMAIL");
  if (!apiKey || !to) {
    logger.info("audit.notification_skipped", { reference, reason: "no email env" });
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env("AUDIT_NOTIFY_FROM") ?? to,
        to,
        subject: `New AI Visibility Audit: ${String(summary.businessName ?? "Untitled")}`,
        html: `<p>A new audit was submitted${reference ? ` (ref ${reference})` : ""}.</p><pre>${JSON.stringify(summary, null, 2)}</pre>`,
      }),
    });
  } catch (err) {
    logger.error("audit.notification_failed", { reference, error: String(err instanceof Error ? err.message : err) });
  }
}

export const submitAuditWizard = createServerFn({ method: "POST" })
  .validator((data: unknown) => auditSubmissionSchema.parse(data))
  .handler(async ({ data }) => {
    const { getClientKey } = await import("./client-key.server.ts");
    const { getRequestId } = await import("./request-context.ts");

    if (data.websiteConfirm) {
      return { ok: false as const, error: "Rejected." };
    }

    const clientKey = getClientKey();
    const limited = auditSubmissionLimiter.limit(`audit:${clientKey}`);
    if (!limited.ok) {
      const seconds = Math.max(1, Math.ceil(limited.retryAfterMs / 1000));
      return { ok: false as const, error: `Too many audits. Try again in ${seconds}s.` };
    }

    const { getSql } = await import("./db.ts");
    const id = crypto.randomUUID();
    const reference = id.slice(0, 8).toUpperCase();
    const summary = summarizeAudit(data.bko);

    try {
      const sql = await getSql();
      await sql.query(
        "insert into audit_submissions (id, reference, payload, contact, summary, completeness) values ($1,$2,$3,$4,$5,$6)",
        [
          id,
          reference,
          JSON.stringify({ answers: data.answers, bko: data.bko }),
          JSON.stringify({
            contactName: data.contactName ?? "",
            email: data.email ?? "",
            website: data.website ?? "",
          }),
          JSON.stringify(summary),
          data.completeness,
        ],
      );
    } catch (err) {
      logger.error("audit.persist_failed", { reference, message: String(err instanceof Error ? err.message : err) });
      return { ok: false as const, error: "Could not save your audit. Please try again." };
    }

    logger.info("audit.wizard_submission", {
      requestId: getRequestId(),
      reference,
      completeness: data.completeness,
      businessName: summary.businessName,
    });

    await notifyAuditEmail(summary, reference);

    return { ok: true as const, reference };
  });