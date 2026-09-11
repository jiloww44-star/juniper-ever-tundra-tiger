/**
 * Business Knowledge Object - the structured output of the intake wizard.
 */
export type ServiceOffer = {
  name: string;
  category: string;
  description: string;
  startingPrice?: string;
  deliveryTime?: string;
  serviceAreas?: string[];
};

export type CustomerSegment = {
  name: string;
  description: string;
  buyingTrigger?: string;
  channels?: string[];
};

export type CredibilitySignal = {
  kind: string;
  value: string;
};

export type ExistingMaterial = {
  title: string;
  kind: string;
  url?: string;
  notes?: string;
};

export type BusinessKnowledgeObject = {
  business: {
    name: string;
    legalName?: string;
    shortDescription: string;
    founded?: string;
    location?: string;
    serviceAreas: string[];
    industry: string;
    tags: string[];
  };
  services: ServiceOffer[];
  customers: CustomerSegment[];
  credibility: CredibilitySignal[];
  contact: {
    website?: string;
    email?: string;
    phone?: string;
    socialUrls: string[];
    availability?: string;
  };
  existingMaterial: ExistingMaterial[];
  rawNotes: Record<string, string>;
};

export type IntakeStepId =
  | "business"
  | "services"
  | "customers"
  | "credibility"
  | "contact"
  | "material"
  | "review";

export type RawAnswer = string;

export type IntakeAnswers = Record<IntakeStepId, Record<string, RawAnswer>>;

export const INTAKE_STEPS: { id: IntakeStepId; short: string; label: string }[] = [
  { id: "business", short: "Business", label: "Your business" },
  { id: "services", short: "Services", label: "Services & offers" },
  { id: "customers", short: "Customers", label: "Customers & audiences" },
  { id: "credibility", short: "Credibility", label: "Proof, trust & credibility" },
  { id: "contact", short: "Contact", label: "Contact & details" },
  { id: "material", short: "Materials", label: "Existing material" },
  { id: "review", short: "Review", label: "Review & download" },
];
