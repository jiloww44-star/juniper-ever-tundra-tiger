import { useCallback, useEffect, useMemo, useState } from "react";

import type { BusinessKnowledgeObject, IntakeAnswers, IntakeStepId } from "@/types/intake";
import { INTAKE_STEP_DEFS } from "@/data/intake-fields";
import { scoreCompleteness, structureDomainObject } from "@/utils/intake-structure";

const DRAFT_KEY = "beame.audit-draft.v1";

function emptyAnswers(): IntakeAnswers {
  const base: Record<string, Record<string, string>> = {};
  INTAKE_STEP_DEFS.forEach((step) => {
    base[step.id] = {};
  });
  return base as IntakeAnswers;
}

function loadDraft(): IntakeAnswers | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<IntakeAnswers>;
    if (!parsed || typeof parsed !== "object") return null;
    const next: Record<string, Record<string, string>> = {};
    INTAKE_STEP_DEFS.forEach((step) => {
      const v = parsed[step.id];
      next[step.id] = v && typeof v === "object" ? (v as Record<string, string>) : {};
    });
    return next as IntakeAnswers;
  } catch {
    return null;
  }
}

export function useIntakeForm(): {
  answers: IntakeAnswers;
  stepId: IntakeStepId;
  bko: BusinessKnowledgeObject;
  completeness: number;
  currentStep: (typeof INTAKE_STEP_DEFS)[number];
  setField: (field: string, value: string) => void;
  goTo: (step: IntakeStepId) => void;
  reset: () => void;
} {
  const [answers, setAnswers] = useState<IntakeAnswers>(() => loadDraft() ?? emptyAnswers());
	const [stepId, setStepId] = useState<IntakeStepId>("business");

	const bko = useMemo<BusinessKnowledgeObject>(
    () => structureDomainObject(answers),
    [answers],
  );

	const completeness = useMemo(
    () => scoreCompleteness(answers).percent,
    [answers],
  );

	useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    } catch {
      // autosave is best-effort — storage may be full or blocked
    }
  }, [answers]);

	function setField(field: string, value: string) {
    setAnswers((prev) => {
      const current = prev[stepId] ?? {};
      return { ...prev, [stepId]: { ...current, [field]: value } };
    });
  }

	function goTo(step: IntakeStepId) {
    setStepId(step);
  }

	function reset() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setAnswers(emptyAnswers());
    setStepId("business");
  }

	const currentStep = INTAKE_STEP_DEFS.find((s) => s.id === stepId) ?? INTAKE_STEP_DEFS[0]!;

  return { answers, stepId, bko, completeness, currentStep, setField, goTo, reset };
}