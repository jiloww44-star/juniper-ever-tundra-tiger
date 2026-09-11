import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { KnowledgePanel } from "@/components/audit/KnowledgePanel";
import { FieldControl, INPUT_CLASS, StructureModal } from "@/components/audit/IntakeFields";
import { INTAKE_STEP_DEFS, type IntakeFieldDef } from "@/data/intake-fields";
import { useIntakeForm } from "@/hooks/useIntakeForm";
import { submitAuditWizard } from "@/lib/audit-submission.functions";
import type { IntakeStepId } from "@/types/intake";
import type { BusinessKnowledgeObject, IntakeAnswers } from "@/types/intake";
import { buildProfileFile, generateSeoArtifacts, type SeoArtifacts } from "@/utils/intake-seo";

function StepRail({
  current,
  onNavigate,
}: {
  current: IntakeStepId;
  onNavigate: (id: IntakeStepId) => void;
}) {
  const currentIndex = INTAKE_STEP_DEFS.findIndex((s) => s.id === current);
	  return (
		    <nav aria-label="Audit steps" className="flex flex-wrap items-center gap-2">
		      {INTAKE_STEP_DEFS.map((s, i) => {
		          const done = i < currentIndex;
		          const active = s.id === current;
		          return (
			            <button
			              key={s.id}
			              type="button"
			              onClick={() => onNavigate(s.id)}
			              className={active ? "chip-beame accent" : "chip-beame"}
			              aria-current={active ? "step" : undefined}
			            >
			              <span className="mr-1.5 inline-grid h-4 w-4 place-items-center font-mono text-[0.65rem]">
			                {done ? "✓" : i + 1}
			              </span>
			              {s.short}
			            </button>
		          );
		      })}
		    </nav>
	  );
}

function ArtifactRow({ label, value }: { label: string; value: string }) {
	  if (!value) return null;
	  return (
		    <div className="border-b border-border pb-3">
		      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
		      <p className="mt-1 text-[0.95rem] font-semibold leading-snug">{value}</p>
		    </div>
	  );
}

function ReviewPanel({
  bko,
  answers,
  completeness,
}: {
  bko: BusinessKnowledgeObject;
  answers: IntakeAnswers;
  completeness: number;
}) {
	  const artifacts: SeoArtifacts = generateSeoArtifacts(bko);
	  const runSubmit = useServerFn(submitAuditWizard);
	  const [pending, setPending] = useState(false);
	  const [error, setError] = useState<string | null>(null);
	  const [reference, setReference] = useState<string | null>(null);

	  function download() {
		    const file = buildProfileFile(bko);
		    const blob = new Blob([file.content], { type: "application/json" });
		    const url = URL.createObjectURL(blob);
		    const a = document.createElement("a");
		    a.href = url;
		    a.download = file.fileName;
		    document.body.appendChild(a);
		    a.click();
		    a.remove();
		    URL.revokeObjectURL(url);
	  }

	  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		    e.preventDefault();
		    if (pending) return;
		    setError(null);
		    const form = new FormData(e.currentTarget);
		    const websiteConfirm = String(form.get("websiteConfirm") ?? "");
		    const payload = {
		      contactName: String(form.get("contactName") ?? "").trim() || undefined,
		      email: String(form.get("email") ?? "").trim() || undefined,
		      website: String(form.get("website") ?? "").trim() || undefined,
		      answers,
		      bko,
		      completeness,
		      websiteConfirm,
		    };
		    
		    setPending(true);
		    try {
		      const res = await runSubmit({ data: payload });
		      if (!res.ok) {
		          setError(res.error);
		          return;
		      }
		      setReference(res.reference);
		    } catch (err) {
		      setError(err instanceof Error ? err.message : "Could not send your audit. Please try again.");
		    } finally {
		      setPending(false);
		    }
	  }

	  if (reference) {
		    return (
		      <div className="mx-auto max-w-xl text-center">
		          <p className="text-2xl font-bold text-primary">Audit received — thank you.</p>
		          <p className="mt-2 text-sm text-muted-foreground">
		            Your AI Visibility Profile has been sent.{reference ? ` Reference ${reference}.` : ""} We will follow up by email.
		          </p>
		      </div>
		    );
	  }

	  return (
		    <div className="grid gap-6">
		      <div className="grid gap-4 md:grid-cols-2">
		          <section className="border border-border [clip-path:var(--chamfer-4)] bg-background p-5">
		            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">AI Visibility Profile</p>
		            <div className="mt-3 grid gap-3">
		              <ArtifactRow label="Page title" value={artifacts.pageTitle} />
		              <ArtifactRow label="Meta description" value={artifacts.metaDescription} />
		              <ArtifactRow label="H1" value={artifacts.h1} />
		            </div>
		          </section>
		          <section className="border border-border [clip-path:var(--chamfer-4)] bg-background p-5">
		            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">Section outline</p>
		            <ul className="mt-3 grid gap-2">
		              {artifacts.sections.filter((s) => s.points.length > 0).map((s) => (
			                <li key={s.heading} className="text-sm">
			                  <span className="font-bold">{s.heading}</span>
			                  <ul className="mt-1 grid gap-1 pl-4 text-muted-foreground">
			                    {s.points.slice(0, 4).map((p) => (
			                      <li key={p}>• {p}</li>
			                    ))}
			                    {s.points.length > 4 ? <li className="text-muted-foreground">+{s.points.length - 4} more</li> : null}
			                  </ul>
			                </li>
		              ))}
		            </ul>
		          </section>
		      </div>

		      <section className="border border-border [clip-path:var(--chamfer-4)] bg-background p-5">
		          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">LocalBusiness structured data</p>
		          <details className="mt-3">
		            <summary className="cursor-pointer font-mono text-[0.8rem] font-semibold text-primary">View JSON-LD</summary>
		            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap border border-border bg-muted p-3 font-mono text-[0.72rem] leading-relaxed">{JSON.stringify(artifacts.localBusinessJsonLd, null, 2)}</pre>
		          </details>
		          <div className="mt-4 flex flex-wrap gap-2">
		            <button type="button" className="btn-beame btn-solid" onClick={download}>
		              Download profile (.json)
		            </button>
		          </div>
		      </section>

		      <section className="border border-border [clip-path:var(--chamfer-4)] bg-background p-5">
		          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">Send to BeameAI</p>
		          <form className="mt-4 grid gap-3.5" onSubmit={onSubmit} noValidate>
		            <label className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
		              Your name
		              <input name="contactName" autoComplete="name" maxLength={120} placeholder="Your name" className={INPUT_CLASS} />
		            </label>
		            <label className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
		              Email
		              <input name="email" type="email" autoComplete="email" maxLength={120} placeholder="Work email" className={INPUT_CLASS} />
		            </label>
		            <label className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
		              Website
		              <input name="website" autoComplete="url" inputMode="url" maxLength={200} placeholder="yourcompany.com" className={INPUT_CLASS} />
		            </label>
		            <div aria-hidden="true" className="hidden">
		              <input name="websiteConfirm" tabIndex={-1} autoComplete="off" />
		            </div>
		            {error ? <p className="text-sm font-semibold text-destructive" role="alert">{error}</p> : null}
		            <button type="submit" disabled={pending} className="btn-beame btn-solid w-full disabled:cursor-not-allowed disabled:opacity-60">
		              {pending ? "Sending…" : "Send my audit profile"}
		            </button>
		          </form>
		      </section>
		    </div>
	  );
}

export function IntakeWizard() {
	  const { answers, stepId, bko, completeness, setField, goTo } = useIntakeForm();
  const currentDef = INTAKE_STEP_DEFS.find((s) => s.id === stepId) ?? INTAKE_STEP_DEFS[0]!;
	  const [structureField, setStructureField] = useState<IntakeFieldDef | null>(null);

	  const index = INTAKE_STEP_DEFS.findIndex((s) => s.id === stepId);
	  const isReview = stepId === "review";
	  const valueOf = (f: IntakeFieldDef) => {
		    const group = answers[stepId];
		    return group ? (group[f.name] ?? "") : "";
	  };

	  return (
		    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
		      <div className="grid gap-5">
		          <StepRail current={stepId} onNavigate={goTo} />
		          <section aria-labelledby={`step-${stepId}`} className="card-beame p-6 md:p-8">
		            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
		              Step {index + 1} of {INTAKE_STEP_DEFS.length}
		            </p>
		            <h2 id={`step-${stepId}`} className="mt-1 text-3xl">{currentDef.label}</h2>
		            <p className="mt-2 text-muted-foreground">{currentDef.lead}</p>

		            {isReview ? (
			              <div className="mt-6">
			                <ReviewPanel bko={bko} answers={answers} completeness={completeness} />
			              </div>
		            ) : (
			              <div className="mt-6 grid gap-4">
			                {currentDef.fields.map((f) => (
			                  <FieldControl
			                    key={f.name}
			                    field={f}
			                    stepId={stepId}
			                    value={valueOf(f)}
			                    onChange={(v) => setField(f.name, v)}
			                    onStructure={setStructureField}
			                  />
			                ))}
			              </div>
		            )}

		            <div className="mt-8 flex items-center justify-between gap-3">
		              {index > 0 ? (
			                <button type="button" className="btn-beame" onClick={() => goTo(INTAKE_STEP_DEFS[index - 1]!.id)}>
			                  ← Back
			                </button>
		              ) : (
			                <span />
		              )}
		              {!isReview ? (
			                <button
			                  type="button"
			                  className="btn-beame btn-solid"
			                  onClick={() => goTo(INTAKE_STEP_DEFS[Math.min(index + 1, INTAKE_STEP_DEFS.length - 1)]!.id)}
			                >
			                  {index + 1 === INTAKE_STEP_DEFS.length - 1 ? "Review your profile" : "Continue"} →
			                </button>
			              ) : null}
		            </div>
		          </section>
		      </div>
		      <KnowledgePanel bko={bko} completeness={completeness} />
		      {structureField ? (
			          <StructureModal
			            field={structureField}
			            value={valueOf(structureField)}
			            onUse={(next) => {
			              setField(structureField.name, next);
			              setStructureField(null);
			            }}
			            onCancel={() => setStructureField(null)}
			          />
		      ) : null}
		    </div>
	  );
}