import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitAuditLead } from "@/lib/audit-lead.functions";
import { auditLeadSchema } from "@/lib/audit-lead";

const STORAGE_KEY = "beame.audit-lead";

type FieldErrors = Partial<Record<"name" | "email" | "website" | "company" | "phone" | "goals", string>>;

type Props = {
  variant?: "home" | "landing";
};

export function AuditLeadForm({ variant = "home" }: Props) {
  const run = useServerFn(submitAuditLead);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { reference?: string; at?: number };
      if (parsed.reference) {
        setSent(true);
        setReference(parsed.reference);
      }
    } catch {
      // ignore storage failures
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setFieldErrors({});

    const form = new FormData(e.currentTarget);
    const raw = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      website: String(form.get("website") ?? ""),
      company: String(form.get("company") ?? "") || undefined,
      phone: String(form.get("phone") ?? "") || undefined,
      goals: String(form.get("goals") ?? "") || undefined,
      websiteConfirm: String(form.get("websiteConfirm") ?? "") || undefined,
    };

    const parsed = auditLeadSchema.safeParse(raw);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in next)) {
          next[key as keyof FieldErrors] = issue.message;
        }
      }
      setFieldErrors(next);
      setError("Please fix the highlighted fields.");
      return;
    }

    setPending(true);
    try {
      const res = await run({ data: parsed.data });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSent(true);
      setReference(res.reference);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ reference: res.reference, at: Date.now() }),
        );
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the request. Try again.");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    variant === "home"
      ? "mt-1.5 w-full rounded-none [clip-path:var(--chamfer-4)] border border-border bg-background px-4 py-3 text-foreground"
      : "mt-1.5 w-full rounded-none [clip-path:var(--chamfer-4)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary";

  if (sent) {
    return (
      <div className="mx-auto mt-6 max-w-[520px] rounded-none [clip-path:var(--chamfer-4)] bg-surface-2 p-6 text-center sm:col-span-2">
        <p className="text-lg font-bold text-primary">Request received — thank you.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll send your AI Visibility Health Check within two business days.
          {reference ? ` Reference ${reference}.` : ""}
        </p>
      </div>
    );
  }

  return (
    <form
      aria-busy={pending}
      className={
        variant === "home"
          ? "mx-auto mt-8 grid max-w-[620px] gap-3 text-left sm:grid-cols-2"
          : "mx-auto mt-6 grid max-w-[520px] gap-3.5"
      }
      onSubmit={onSubmit}
      noValidate
    >
      <label className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Your name *
        <input
          required
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={80}
          placeholder="Your name"
          className={inputClass}
        />
        {fieldErrors.name && <span className="mt-1 block text-[0.7rem] font-semibold normal-case tracking-normal text-destructive">{fieldErrors.name}</span>}
      </label>
      <label className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Work email *
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          maxLength={120}
          placeholder="Work email"
          className={inputClass}
        />
        {fieldErrors.email && <span className="mt-1 block text-[0.7rem] font-semibold normal-case tracking-normal text-destructive">{fieldErrors.email}</span>}
      </label>
      <label
        className={
          variant === "home"
            ? "text-left text-xs font-bold uppercase tracking-widest text-muted-foreground sm:col-span-2"
            : "text-left text-xs font-bold uppercase tracking-widest text-muted-foreground"
        }
      >
        Your website *
        <input
          required
          name="website"
          autoComplete="url"
          inputMode="url"
          maxLength={200}
          placeholder="yourcompany.com"
          className={inputClass}
        />
        {fieldErrors.website && <span className="mt-1 block text-[0.7rem] font-semibold normal-case tracking-normal text-destructive">{fieldErrors.website}</span>}
      </label>
      {variant === "landing" && (
        <>
          <label className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Company
            <input name="company" autoComplete="organization" maxLength={120} placeholder="Company name" className={inputClass} />
          </label>
          <label className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Phone (optional)
            <input name="phone" autoComplete="tel" maxLength={40} placeholder="+234 ..." className={inputClass} />
          </label>
          <label className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Tell us about your goals
            <textarea name="goals" rows={3} maxLength={1000} placeholder="Which topics or markets matter most to you?" className={inputClass} />
          </label>
        </>
      )}
      <div aria-hidden="true" className="hidden">
        <input name="websiteConfirm" tabIndex={-1} autoComplete="off" />
      </div>
      {error && (
        <p className={variant === "home" ? "sm:col-span-2 text-sm font-semibold text-destructive" : "text-sm font-semibold text-destructive"} role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={
          variant === "home"
            ? "btn-beame btn-solid sm:col-span-2 disabled:cursor-not-allowed disabled:opacity-60"
            : "btn-beame mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {pending ? "Sending…" : variant === "home" ? "Get my free health check" : "Request AI Search Audit"}
      </button>
    </form>
  );
}
