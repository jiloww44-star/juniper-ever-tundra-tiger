import type { BusinessKnowledgeObject } from "@/types/intake";

export interface SeoSection {
  heading: string;
  points: string[];
}

export interface SeoArtifacts {
  pageTitle: string;
  metaDescription: string;
  h1: string;
  sections: SeoSection[];
  localBusinessJsonLd: Record<string, unknown>;
}

function kebab(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "profile";
}

function brief(value: string | undefined, max: number): string {
  if (!value) return "";
  const flat = value.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0,max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut) + "…";
}

function servicePoints(services: BusinessKnowledgeObject["services"]): string[] {
  const points: string[] = [];
  for (const s of services) {
    const parts = [s.name];
    if (s.startingPrice) parts.push(`from ${s.startingPrice}`);
    if (s.deliveryTime) parts.push(s.deliveryTime);
    points.push(parts.join(" — "));
  }
  return points;
}

function customerPoints(customers: BusinessKnowledgeObject["customers"]): string[] {
  const points: string[] = [];
  for (const c of customers) {
    const parts = [c.name];
    if (c.buyingTrigger) parts.push(c.buyingTrigger);
    if (c.channels && c.channels.length > 0) parts.push(c.channels.join(", "));
    points.push(parts.join(" — "));
  }
  return points;
}

function credibilityPoints(cred: BusinessKnowledgeObject["credibility"]): string[] {
  const points: string[] = [];
  for (const c of cred) {
    points.push(`${c.kind}: ${c.value}`);
  }
  return points;
}

function contactPoints(contact: BusinessKnowledgeObject["contact"]): string[] {
  const points: string[] = [];
  if (contact.website) points.push(contact.website);
  if (contact.email) points.push(contact.email);
  if (contact.phone) points.push(contact.phone);
  if (contact.availability) points.push(contact.availability);
  if (contact.socialUrls.length > 0) points.push(contact.socialUrls.join(", "));
  return points;
}

export function generateSeoArtifacts(bko: BusinessKnowledgeObject): SeoArtifacts {

  const name = bko.business.name || "Your business";
  const industry = bko.business.industry || "Services";
  const location = bko.business.location ? ` in ${bko.business.location}` : "";
  const pageTitle = brief(`${name} — AI Visibility Profile`, 58) || "AI Visibility Profile";
  const serviceBlurb = bko.services.length > 0 ? ` ${bko.services.length} service${bko.services.length > 1 ? "s" : ""}` : "";
  const h1 = name;
  const sections: SeoSection[] = [
    { heading: "What we do", points: servicePoints(bko.services) },
    { heading: "Who we serve", points: customerPoints(bko.customers) },
    { heading: "Why choose us", points: credibilityPoints(bko.credibility) },
    { heading: "Get in touch", points: contactPoints(bko.contact) },
  ];

  const metaLead = `${name}${serviceBlurb} — ${industry}${location}.`;
  const metaTail = " Structured profile ready for AI search, LLMO and Google Business visibility.";
  const metaDescription = brief(`${metaLead}${metaTail}`,155);

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": bko.business.location ? "LocalBusiness" : "ProfessionalService",
    "name": name,
    "description": brief(bko.business.shortDescription || metaLead, 200),
    "url": bko.contact.website || undefined,
    "email": bko.contact.email || undefined,
    "telephone": bko.contact.phone || undefined,
    "address": bko.business.location
      ? { "@type": "PostalAddress", address: bko.business.location }
      : undefined,
    "areaServed": bko.business.serviceAreas.length > 0 ? bko.business.serviceAreas : undefined,
    "foundingDate": bko.business.founded || undefined,
    "knowsAbout": bko.business.tags.length > 0 ? bko.business.tags : undefined,
    "makesOffer": bko.services.map((s) => ({
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": s.name,
        "description": s.description || undefined,
        "areaServed": s.serviceAreas && s.serviceAreas.length > 0 ? s.serviceAreas : undefined,
      },
    })),
  };

  return { pageTitle, metaDescription, h1, sections, localBusinessJsonLd };
}

export interface ProfileFile {
  fileName: string;
  content: string;
}

export function buildProfileFile(bko: BusinessKnowledgeObject): ProfileFile {
  const artifact = generateSeoArtifacts(bko);
  const profile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    business: bko.business,
    services: bko.services,
    customers: bko.customers,
    credibility: bko.credibility,
    contact: bko.contact,
    existingMaterial: bko.existingMaterial,
    rawNotes: bko.rawNotes,
    seo: {
      pageTitle: artifact.pageTitle,
      metaDescription: artifact.metaDescription,
      headline: artifact.h1,
      sections: artifact.sections,
      structuredData: artifact.localBusinessJsonLd,
    },
  };
  return { fileName: `${kebab(bko.business.name)}-ai-visibility-profile.json`, content: JSON.stringify(profile, null, 2) };
}