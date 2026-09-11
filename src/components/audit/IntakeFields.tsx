import { useEffect, useState } from "react";

import type { IntakeFieldDef, StructureKind } from "@/data/intake-fields";
import { splitList } from "@/utils/intake-structure";

export const INPUT_CLASS =
  "mt-1.5 w-full rounded-none [clip-path:var(--chamfer-4)] border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary disabled:opacity-60";

export function restructureText(kind: StructureKind | undefined, value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
	  if (!clean) return "";
	  const lines: string[] = [];
	  if (kind === "list") {
		    for (const line of splitList(value)) {
		      lines.push("\u2022 " + line.trim());
		    }
	  } else {
		    for (const part of clean.split(/(?<=[.!?])\s+/)) {
		      lines.push("\u2022 " + part.trim());
		    }
	  }
	  return lines.join("\n");
}

function LongAnswerAction({
  field,
  value,
  onStructure,
}: {
  field: IntakeFieldDef;
  value: string;
  onStructure: () => void;
}) {
  if (!field.structure || !value.trim()) return null;
	  return (
		    <button
		      type="button"
		      className="mt-2 inline-flex items-center gap-1.5 font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
		      onClick={onStructure}
		    >
		      Structure this for me
		      <span aria-hidden="true">→</span>
		    </button>
	  );
}

export function FieldControl({
  field,
  stepId,
  value,
  onChange,
  onStructure,
}: {
  field: IntakeFieldDef;
  stepId: string;
  value: string;
  onChange: (next: string) => void;
  onStructure: (field: IntakeFieldDef) => void;
}) {
  const id = `f-${stepId}-${field.name}`;
	  const optional =
		    field.optional === true ? (
		      <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground">{"(optional)"}</span>
		    ) : null;

	  return (
		    <div>
		      {field.kind === "select" ? (
			        <label htmlFor={id} className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
			          {field.label}{optional}
			          <select
			            id={id}
			            name={field.name}
			            value={value}
			            onChange={(e) => onChange(e.target.value)}
			            className={INPUT_CLASS}
			          >
			            <option value="">Select…</option>
			            {field.options?.map((opt) => (
			              <option key={opt} value={opt}>{opt}</option>
			            ))}
			          </select>
			        </label>
		      ) : field.kind === "textarea" ? (
			        <label htmlFor={id} className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
			          {field.label}{optional}
			          <textarea
			            id={id}
			            name={field.name}
			            rows={field.structure ? 5 : 3}
			            value={value}
			            onChange={(e) => onChange(e.target.value)}
			            placeholder={field.placeholder}
			            className={INPUT_CLASS}
			          />
			          <LongAnswerAction field={field} value={value} onStructure={() => onStructure(field)} />
			        </label>
		      ) : (
			        <label htmlFor={id} className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
			          {field.label}{optional}
			          <input
			            id={id}
			            name={field.name}
			            type="text"
			            value={value}
			            onChange={(e) => onChange(e.target.value)}
			            placeholder={field.placeholder}
			            autoComplete={field.name === "email" ? "email" : field.name === "website" ? "url" : undefined}
			            inputMode={field.name === "email" ? "email" : undefined}
			            className={INPUT_CLASS}
			          />
			          {field.hint ? <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p> : null}
			        </label>
		      )}
		    </div>
	  );
}

export function StructureModal({
  field,
  value,
  onUse,
  onCancel,
}: {
  field: IntakeFieldDef;
  value: string;
  onUse: (next: string) => void;
  onCancel: () => void;
}) {
	  const [phase, setPhase] = useState<"pending" | "working" | "done">("pending");
	  const [result, setResult] = useState("");

	  useEffect(() => {
		    let alive = true;
		    setPhase("pending");
		    const t1 = window.setTimeout(() => setPhase("working"), 220);
		    const t2 = window.setTimeout(
		      () => {
			          if (!alive) return;
			          setResult(restructureText(field.structure, value));
			          setPhase("done");
		      },
		      620,
		    );
		    return () => {
		      alive = false;
		      window.clearTimeout(t1);
		      window.clearTimeout(t2);
		    };
	  }, [field, value]);

	  const steps = [
		    { key: "pending", label: "Reading your words" },
		    { key: "working", label: "Extracting the structure" },
		    { key: "done", label: "Rebuilding as a clean object" },
	  ] as const;

	  return (
		    <div
		      className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4"
		      role="dialog"
		      aria-modal="true"
		      aria-labelledby="structure-title"
		      onKeyDown={(e) => {
		          if (e.key === "Escape") onCancel();
		      }}
		    >
		      <div className="card-beame w-full max-w-xl p-6" tabIndex={-1}>
		          <p id="structure-title" className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
		            Structure this for me
		          </p>
		          <h3 className="mt-2 text-2xl">Turning your messy answer into clean copy</h3>
		          <ol className="mt-4 grid gap-2">
		            {steps.map((s) => {
		              const state =
				                phase === "done" ||
				                (phase === "working" && s.key === "pending") ||
				                (phase === "pending" && s.key === "done")
				                  ? "done"
				                  : phase === s.key
				                    ? "active"
				                    : "todo";
		              return (
				                <li key={s.key} className="flex items-center gap-2 text-sm">
				                  <span
				                    className={
					                      state === "done"
					                        ? "grid h-5 w-5 place-items-center rounded-none [clip-path:var(--chamfer-chip)] bg-primary text-xs font-bold text-primary-foreground"
					                        : state === "active"
					                          ? "h-5 w-5 animate-pulse rounded-none [clip-path:var(--chamfer-chip)] border border-primary bg-primary/10"
					                          : "h-5 w-5 rounded-none [clip-path:var(--chamfer-chip)] border border-border"
				                    }
				                    aria-hidden="true"
				                  >
				                    {state === "done" ? "✓" : ""}
				                  </span>
				                  {s.label}
				                </li>
		              );
		            })}
		          </ol>
		          {phase === "done" ? (
			            <div className="mt-5">
			              <p className="mb-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">Structured version</p>
			              <pre className="max-h-56 overflow-auto whitespace-pre-wrap border border-border bg-muted p-3 font-mono text-[0.8rem] leading-relaxed text-foreground">{result}</pre>
			              <div className="mt-4 flex flex-wrap gap-2">
			                <button type="button" className="btn-beame btn-solid" onClick={() => onUse(result)}>
			                  Use this version
			                </button>
			                <button type="button" className="btn-beame" onClick={onCancel}>
			                  Keep mine
			                </button>
			              </div>
			            </div>
		          ) : (
			            <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
			              {phase === "pending" ? "Reading…" : "Structuring…"}
			            </p>
		          )}
		      </div>
		    </div>
	  );
}