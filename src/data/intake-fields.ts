import {
  CUSTOMER_CHANNEL_OPTIONS,
  CUSTOMER_TRIGGER_OPTIONS,
  INDUSTRY_OPTIONS,
  MATERIAL_KIND_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  SERVICE_DELIVERY_OPTIONS,
  SERVICE_PRICE_OPTIONS,
} from "@/data/intake-options";
import type { IntakeStepId } from "@/types/intake";

export type FieldKind = "text" | "textarea" | "select" | "chips";

export type StructureKind = "list" | "sentences" | "none";

export interface IntakeFieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  hint?: string;
  options?: readonly string[];
  structure?: StructureKind;
  optional?: boolean;
}

export interface IntakeStepDef {
  id: IntakeStepId;
  short: string;
  label: string;
  lead: string;
  fields: IntakeFieldDef[];
}

export const INTRO_DEMO_MESSY =
  `we help restaurants in lagos get found on chatgpt— we do websites, social media,
  google business and even the menu!! check our insta @lagon_food_co, been around since 2018,
  customers mostly hotels and parties, we won best caterer 2022`;

export const INTAKE_STEP_DEFS: IntakeStepDef[] = [
  {
    id: "business",
    short: "Business",
    label: "Your business",
    lead: "Tell us about the business in your own words — however messy. We'll structure it.",
    fields: [
      { name: "businessName", label: "Business name", kind: "text", placeholder: "e.g. Legon Food Co." },
      { name: "legalName", label: "Legal / registered name", kind: "text", placeholder: "Optional", optional: true },
      { name: "about", label: "What does the business do?", kind: "textarea", placeholder: "Paste your messy pitch here…", structure: "sentences" },
      { name: "industry", label: "Industry", kind: "select", options: INDUSTRY_OPTIONS },
      { name: "location", label: "City, country", kind: "text", placeholder: "e.g. Lagos, Nigeria" },
      { name: "founded", label: "Founded (year)", kind: "text", placeholder: "e.g. 2018", optional: true },
      { name: "serviceAreas", label: "Areas served", kind: "chips", placeholder: "e.g. Lagos, Abuja, Remote — comma-separated", optional: true },
      { name: "tags", label: "Keyword tags", kind: "chips", placeholder: "e.g. catering, event food, ChatGPT visibility — comma-separated", optional: true },
    ],
  },
  {
    id: "services",
    short: "Services",
    label: "Services & offers",
    lead: "What do you offer — and in what way?",
    fields: [
      { name: "services", label: "Services offered", kind: "textarea", placeholder: "One service per line,however wordy", structure: "list" },
      { name: "category", label: "Primary category", kind: "select", options: SERVICE_CATEGORY_OPTIONS },
      { name: "offerDetails", label: "What's included in each service?", kind: "textarea", placeholder: "Deliverables, process, outcomes…", structure: "sentences", optional: true },
      { name: "pricing", label: "Starting price guidance", kind: "select", options: SERVICE_PRICE_OPTIONS, optional: true },
      { name: "delivery", label: "How fast do customers see results?", kind: "select", options: SERVICE_DELIVERY_OPTIONS, optional: true },
      { name: "areasPerService", label: "Areas served per service", kind: "chips", placeholder: "e.g. Lagos, Remote — comma-separated", optional: true },
    ],
  },
  {
    id: "customers",
    short: "Customers",
    label: "Customers & audiences",
    lead: "Who actually buys — described truthfully, not aspirationally.",
    fields: [
      { name: "customers", label: "Who buys from you?", kind: "textarea", placeholder: "One customer type per line", structure: "list" },
      { name: "who", label: "Describe the ideal customer", kind: "textarea", placeholder: "Their situation, pain, budget…", structure: "sentences", optional: true },
      { name: "buyingTrigger", label: "What pushes them to buy?", kind: "select", options: CUSTOMER_TRIGGER_OPTIONS, optional: true },
      { name: "channels", label: "Where do they find you?", kind: "chips", placeholder: "e.g. Instagram, Google Search, WhatsApp — comma-separated", optional: true },
    ],
  },
  {
    id: "credibility",
    short: "Credibility",
    label: "Proof, trust & credibility",
    lead: "Anything that makes a buyer believe you. One line each — rough is fine.",
    fields: [
      { name: "years", label: "Years in business", kind: "text", placeholder: "e.g. 7 years", optional: true },
      { name: "awards", label: "Awards & honours", kind: "text", placeholder: "e.g. Best Caterer 2022", optional: true },
      { name: "reviews", label: "Reviews & ratings", kind: "text", placeholder: "e.g. 4.9 on Google, 120 reviews", optional: true },
      { name: "certifications", label: "Certifications & accreditations", kind: "text", placeholder: "Optional", optional: true },
      { name: "press", label: "Press & media mentions", kind: "text", placeholder: "e.g. featured on TechCabal", optional: true },
      { name: "team", label: "Team expertise", kind: "text", placeholder: "e.g. 12 chefs, ex-Radisson", optional: true },
      { name: "clients", label: "Notable clients", kind: "text", placeholder: "e.g. GTBank canteen", optional: true },
      { name: "results", label: "Case studies & results", kind: "text", placeholder: "e.g. 2x orders in month one", optional: true },
    ],
  },
  {
    id: "contact",
    short: "Contact",
    label: "Contact & details",
    lead: "How should agents and humans reach you?",
    fields: [
      { name: "website", label: "Website", kind: "text", placeholder: "yourcompany.com", optional: true },
      { name: "email", label: "Email", kind: "text", placeholder: "hello@yourcompany.com", optional: true },
      { name: "phone", label: "Phone", kind: "text", placeholder: "+234...", optional: true },
      { name: "socials", label: "Social profiles", kind: "chips", placeholder: "e.g. instagram.com/yourco, linkedin.com/company/yourco — comma-separated", optional: true },
      { name: "availability", label: "Availability & hours", kind: "text", placeholder: "e.g. Mon–Sat, 9am–6pm WAT", optional: true },
    ],
  },
  {
    id: "material",
    short: "Materials",
    label: "Existing material",
    lead: "Links, files or pasted copy you already have — we'll fold it into the profile.",
    fields: [
      { name: "materials", label: "Links or titles of existing material", kind: "textarea", placeholder: "One per line — a blog post, a flyer, a Notion page…", structure: "list", optional: true },
      { name: "materialKind", label: "What kind of material is it mostly?", kind: "select", options: MATERIAL_KIND_OPTIONS, optional: true },
      { name: "attachments", label: "Paste material text", kind: "textarea", placeholder: "Paste chunks of copy, reviews, articles…", structure: "sentences", optional: true },
      { name: "additional", label: "Anything else we should know?", kind: "textarea", placeholder: "Optional context", structure: "sentences", optional: true },
    ],
  },
  {
    id: "review",
    short: "Review",
    label: "Review & download",
    lead: "See your structured profile, download it, and send it to BeameAI for the full audit.",
    fields: [],
  },
];

