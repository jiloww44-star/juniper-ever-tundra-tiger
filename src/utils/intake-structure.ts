import type {
  BusinessKnowledgeObject,
  CredibilitySignal,
  ExistingMaterial,
  CustomerSegment,
  ServiceOffer,
  IntakeAnswers,
  IntakeStepId,
} from "@/types/intake";
import {
  CUSTOMER_TRIGGER_OPTIONS,
  INDUSTRY_OPTIONS,
  MATERIAL_KIND_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
} from "@/data/intake-options";

export function cleanText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim();}
export function isMeaningful(value: string): boolean {
  const v = cleanText(value).toLowerCase();
  if (!v) return false;
  return !/^(n\/?a|none|nil|n\/o|tbd|not sure|i don't know|unknown|na|no|\u2014|-|,)+$/.test(v);
}

export function splitList(value: string): string[] {
  if (!isMeaningful(value)) return [];
  return cleanText(value)
    .split(/[,\n|;]+/)
    .map(cleanText)
    .filter(isMeaningful)
    .filter((v, i, a) => a.indexOf(v) === i);
}

const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"'\\)]\]+/gi;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/g;

export function extractUrls(value: string): string[] {
  const out: string[] = [];
  if (!value) return out;
  for (const m of value.matchAll(URL_RE)) {
    out.push(m[0].trim().replace(/[.,]+$/g, ""));
  }
  return [...new Set(out.map(u => u.startsWith("http") ? u : `https://${u}`))];
}

export function extractEmails(value: string): string[] {
  const out: string[] = [];
  if (!value) return out;
  for (const m of value.matchAll(EMAIL_RE)) out.push(m[0].toLowerCase());
  return [...new Set(out)];
}

export function extractPhones(value: string): string[] {
  const out: string[] = [];
  if (!value) return out;
  for (const m of value.matchAll(PHONE_RE)) {
    out.push(m[0].trim().replace(/\s+/g, " "));
  }
  return [...new Set(out)];
}

function inList(value: string, options: readonly string[]): string | undefined {
  const v = cleanText(value).toLowerCase();
  if (!v) return undefined;
  for (const opt of options) {
    if (opt.toLowerCase() === v) return opt;
    if (v.length >= 3 && opt.toLowerCase().includes(v)) return opt;
  }
  if (/e-?com|shop|retail|store/i.test(v)) return "Ecommerce & retail";
  if (/consult|agency|advis/i.test(v)) return "Professional services";
  if (/health|clinic|medic|dentist|therapy/i.test(v)) return "Healthcare";
  if (/hotel|lodge|travel|tour|restaurant|cafe|food|bar/i.test(v)) return /food|restaurant|cafe|bar/.test(v) ? "Food & beverage" : "Hospitality & travel";
  if (/school|academy|train|tutor|educat/i.test(v)) return "Education & training";
  if (/bank|finance|insur|invest|loan/i.test(v)) return "Finance & insurance";
  if (/real estate|property|construction|build/i.test(v)) return "Real estate & construction";
  if (/soft|saas|tech|dev|digital|platform/i.test(v)) return "Technology & SaaS";
  if (/manufact|fact|production/i.test(v)) return "Manufacturing";
  if (/logistic|transport|deliver|shipping/i.test(v)) return "Transportation & logistics";
  if (/media|creative|film|music|design/i.test(v)) return "Creative & media";
  if (/nonprofit|ngo|charity|foundation/i.test(v)) return "Nonprofit";
  return undefined;
}

function inferTags(b: Record<string, string>, s: Record<string, string>): string[] {
  const tags: string[] = [];
  const name = cleanText(b.businessName ?? "");
  if (name) tags.push(name);
  const industry = inList(b.industry ?? "", INDUSTRY_OPTIONS);
  if (industry) tags.push(industry);
  const areas = splitList(b.serviceAreas ?? "");
  if (areas.length > 0) tags.push(...areas.slice(0, 3));
  const services = splitList(s.services ?? "");
  if (services.length > 0) tags.push(...services.slice(0, 3));
  return tags.filter(Boolean).slice(0,  6);
}

function buildCredibility(cr: Record<string, string>): CredibilitySignal[] {
  const out: CredibilitySignal[] = [];
  const notGiven = (v: string) => !v || /^n\/?a|none|no$/.test(v.trim());
  const add = (kind: string, value: string) => {
    if (isMeaningful(value) && !notGiven(value)) out.push({ kind, value: cleanText(value) });
  };
  add("Years in business", cr.years ?? "");
  add("Awards & honours", cr.awards ?? "");
  add("Reviews & ratings", cr.reviews ?? "");
  add("Certifications & accreditations", cr.certifications ?? "");
  add("Press & media mentions", cr.press ?? "");
  add("Team expertise", cr.team ?? "");
  add("Notable clients", cr.clients ?? "");
  add("Case studies & results", cr.results ?? "");
  return out;
}

function buildMaterial(m: Record<string, string>): ExistingMaterial[] {
  const out: ExistingMaterial[] = [];
  const rows = splitList(m.materials ?? "");
  if (rows.length > 0) {
    for (const title of rows) {
      out.push({ title: cleanText(title), kind: inList(m.materialKind ?? "", MATERIAL_KIND_OPTIONS) ?? "Other" });
    }
  }
  if (isMeaningful(m.attachments ?? "") && !/^n\/?a|none$/i.test(m.attachments ?? "")) {
    out.push({ title: "Additional files & links", kind: "Other", notes: cleanText(m.attachments ?? "") });
  }
  if (isMeaningful(m.additional ?? "") && !/^n\/?a|none$/i.test(m.additional ?? "")) {
    out.push({ title: "Additional context", kind: "Other", notes: cleanText(m.additional ?? "") });
  }
  return out;
}















export function structureDomainObject(answers: IntakeAnswers): BusinessKnowledgeObject {
  const b = answers["business"] ?? {};
  const s = answers["services"] ?? {};
  const c = answers["customers"] ?? {};
  const cr = answers["credibility"] ?? {};
  const ct = answers["contact"] ?? {};
  const m = answers["material"] ?? {};

  const serviceNames = splitList(s.services ?? "");
  const tags = splitList(b.tags ?? "");
  const derivedTags = tags.length > 0 ? tags : inferTags(b, s);

  const services: ServiceOffer[] = [];
  for (const name of serviceNames) {
    services.push({
      name: cleanText(name),
      category: inList(s.category ?? "", SERVICE_CATEGORY_OPTIONS) ?? "Service",
      description: isMeaningful(s.offerDetails ?? "") ? cleanText(s.offerDetails ?? "") : "",
      startingPrice: isMeaningful(s.pricing ?? "") ? cleanText(s.pricing ?? "") : undefined,
      deliveryTime:isMeaningful(s.delivery ?? "") ? cleanText(s.delivery ?? "") : undefined,
      serviceAreas: splitList(s.areasPerService ?? ""),
    });
  }

  const customers: CustomerSegment[] = [];
  for (const name of splitList(c.customers ?? "")) {
    customers.push({
      name: cleanText(name),
      description:isMeaningful(c.who ?? "") ? cleanText(c.who ?? "") : "",
      buyingTrigger:inList(c.buyingTrigger ?? "", CUSTOMER_TRIGGER_OPTIONS) ?? (isMeaningful(c.buyingTrigger ?? "") ? cleanText(c.buyingTrigger ?? "") : undefined),
      channels: splitList(c.channels ?? ""),
    });
  }

  const knowledge: BusinessKnowledgeObject = {
    business: {
      name: cleanText(b.businessName ?? ""),
      legalName:isMeaningful(b.legalName ?? "") ? cleanText(b.legalName ?? "") : undefined,
      shortDescription: cleanText(b.about ?? ""),
      founded:isMeaningful(b.founded ?? "") ? cleanText(b.founded ?? "") : undefined,
      location:isMeaningful(b.location ?? "") ? cleanText(b.location ?? "") : undefined,
      serviceAreas: splitList(b.serviceAreas ?? ""),
      industry:inList(b.industry ?? "", INDUSTRY_OPTIONS) ?? "Other",
      tags: derivedTags,
    },
    services: services,
    customers: customers,
    credibility: buildCredibility(cr),
    contact: {
      website:isMeaningful(ct.website ?? "") ? cleanText(ct.website ?? "") : undefined,
      email:isMeaningful(ct.email ?? "") ? cleanText(ct.email ?? "") : undefined,
      phone:isMeaningful(ct.phone ?? "") ? cleanText(ct.phone ?? "") : undefined,
      socialUrls: splitList(ct.socials ?? ""),
      availability:isMeaningful(ct.availability ?? "") ? cleanText(ct.availability ?? "") : undefined,
    },
    existingMaterial: buildMaterial(m),
    rawNotes: buildRawNotes(answers),
  };
  return knowledge;
}



function buildRawNotes(answers: IntakeAnswers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [stepId, fields] of Object.entries(answers)) {
    const bits: string[] = [];
    for (const [k, v] of Object.entries(fields)) {
      if (isMeaningful(v)) bits.push(`${k}: ${cleanText(v)}`);
    }
    if (bits.length > 0) out[stepId] = bits.join("\n");
  }
  return out;
}

export interface CompletenessScore {
  total: number;
  earned: number;
  percent: number;
}

const SCORED_FIELDS: [IntakeStepId, string][] = [
  ["business", "businessName"],
  ["business", "about"],
  ["business", "industry"],
  ["business", "serviceAreas"],
  ["services", "services"],
  ["services", "pricing"],
  ["services", "offerDetails"],
  ["customers", "customers"],
  ["customers", "buyingTrigger"],
  ["customers", "channels"],
  ["credibility", "years"],
  ["credibility", "reviews"],
  ["credibility", "certifications"],
  ["credibility", "clients"],
  ["contact", "website"],
  ["contact", "email"],
  ["contact", "phone"],
  ["material", "materials"],
  ["material", "attachments"],
];

export function scoreCompleteness(answers: IntakeAnswers): CompletenessScore {
  const scored = SCORED_FIELDS.filter((item) => {
    const fields = answers[item[0]];
    return fields && isMeaningful(fields[item[1]] ?? "");
  });
  const total = SCORED_FIELDS.length;
  const earned = scored.length;
  const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { total, earned, percent };
}



