import { createFileRoute } from "@tanstack/react-router";

import { Eyebrow } from "@/components/site-ui";
import { IntakeWizard } from "@/components/audit/IntakeWizard";
import { INTRO_DEMO_MESSY } from "@/data/intake-fields";
import { OG_IMAGE, SITE_URL } from "@/lib/site-meta";

const TITLE = "Free AI Visibility Audit — BeameAI by LOGON";
const DESC =
  "Paste your messy business story; get a structured AI Visibility Profile back — business object, keyword tags, LocalBusiness structured data, section outline and downloadable profile. Free, no account needed.";

const DEMO_BUSINESS = {
  name: "Legon Food Co.",
  industry: "Food & beverage",
  founded: "2018",
  location: "Lagos, Nigeria",
  customers: ["Hotels", "Event parties"].join(", "),
  wins: "Best Caterer 2022",
};

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "author", content: "BeameAI by LOGON" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/audit` },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/audit" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Free AI Visibility Audit",
          description: DESC,
          provider: {
            "@type": "Organization",
            name: "BeameAI by LOGON",
            url: SITE_URL,
          },
          areaServed: "Worldwide",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: AuditPage,
});

function DemoChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-none border border-paper/20 bg-paper/10 px-3 py-1.5 font-mono text-[0.72rem] font-semibold text-paper">
      <span className="text-paper/50">{label}</span>
      {value}
    </span>
  );
}

function AuditPage() {
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="container-beame py-16 md:py-20">
          <div className="max-w-3xl">
            <Eyebrow>Free AI Visibility Audit</Eyebrow>
            <h1 className="text-4xl md:text-5xl">Messy words in. Structured business out.</h1>
            <p className="mt-4 max-w-2xl text-lg text-paper/70">
              The exact promise we sell BeameAI on itself: spam in a messy sentence —
              and watch it become the structured knowledge that ChatGPT, Perplexity and Google
              can actually cite. Seven quick steps, no account needed.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="rounded-none border border-paper/15 bg-paper/5 p-4 [clip-path:var(--chamfer-4)]">
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-paper/50">You write</p>
                <p className="mt-2 font-mono text-[0.9rem] leading-relaxed text-paper/80">{INTRO_DEMO_MESSY}</p>
              </div>
              <p className="hidden text-center text-2xl text-paper/50 md:block" aria-hidden="true">→</p>
              <p className="text-center text-2xl text-paper/50 md:hidden" aria-hidden="true">↓</p>
              <div className="rounded-none border border-paper/15 bg-paper/5 p-4 [clip-path:var(--chamfer-4)]">
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-paper/50">We structure</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  <li><DemoChip label="Business" value={DEMO_BUSINESS.name} /></li>
                  <li><DemoChip label="Industry" value={DEMO_BUSINESS.industry} /></li>
                  <li><DemoChip label="Founded" value={DEMO_BUSINESS.founded} /></li>
                  <li><DemoChip label="Where" value={DEMO_BUSINESS.location} /></li>
                  <li><DemoChip label="Customers" value={DEMO_BUSINESS.customers} /></li>
                  <li><DemoChip label="Proof" value={DEMO_BUSINESS.wins} /></li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-beame btn-solid"
                onClick={() => document.getElementById("engine")?.scrollIntoView({ behavior: "smooth" })}
              >
                Start the audit ↓
              </button>
              <p className="text-sm text-paper/60">7 short steps · ~4 minutes · drafts autosave</p>
            </div>
          </div>
        </div>
      </section>

      <section id="engine" className="section-beame pt-12">
        <div className="container-beame">
          <IntakeWizard />
          <p className="mt-8 text-center font-mono text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your answers become a structured Business Knowledge Object — live, as you type.
          </p>
        </div>
      </section>
    </>
  );
}