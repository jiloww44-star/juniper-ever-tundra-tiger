import { useState } from "react";

import { Tabs } from "@/components/site-ui";
import type { BusinessKnowledgeObject } from "@/types/intake";

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing written yet.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <li key={it} className="chip-beame">{it}</li>
      ))}
    </ul>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-3">
      <h3 className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function EntitiesView({ bko }: { bko: BusinessKnowledgeObject }) {
  return (
    <div className="grid gap-4">
      <Block title="Business">
        <p className="text-lg font-bold leading-snug">{bko.business.name || "Untitled business"}</p>
        {bko.business.industry && <p className="mt-1 text-sm text-muted-foreground">{bko.business.industry}</p>}
        {bko.business.location && <p className="text-sm text-muted-foreground">{bko.business.location}</p>}
        <div className="mt-2"><ChipList items={bko.business.tags} /></div>
      </Block>
      <Block title="Services">
        {bko.services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing written yet.</p>
        ) : (
          <ul className="grid gap-2">
            {bko.services.map((s) => (
              <li key={s.name} className="border border-border [clip-path:var(--chamfer-chip)] bg-background p-2 text-sm">
                <span className="font-bold">{s.name}</span>
                {s.startingPrice ? ` — from ${s.startingPrice}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Block>
      <Block title="Customers">
        <ChipList items={bko.customers.map((c) => c.name)} />
      </Block>
      <Block title="Credibility">
        {bko.credibility.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing written yet.</p>
        ) : (
          <ul className="grid gap-1.5">
            {bko.credibility.map((cr) => (
              <li key={`${cr.kind}:${cr.value}`} className="text-sm">
                <span className="font-semibold">{cr.kind}</span> — {cr.value}
              </li>
            ))}
          </ul>
        )}
      </Block>
      <Block title="Contact">
        <ChipList items={[bko.contact.website, bko.contact.email, bko.contact.phone]
          .filter((v): v is string => Boolean(v))}
        />
      </Block>
      <Block title="Existing material">
        {bko.existingMaterial.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing written yet.</p>
        ) : (
          <ul className="grid gap-1.5">
            {bko.existingMaterial.map((m) => (
              <li key={m.title} className="text-sm">
                <span className="font-semibold">{m.title}</span> — {m.kind}
              </li>
            ))}
          </ul>
        )}
      </Block>
    </div>
  );
}

export function KnowledgePanel({ bko, completeness }: { bko: BusinessKnowledgeObject; completeness: number }) {
  const [view, setView] = useState<"entities" | "json">("entities");
  const json = JSON.stringify(bko, null, 2);

  return (
    <aside className="border border-ink bg-surface [clip-path:var(--chamfer-4)] p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-hidden="true" />
          Live knowledge object
        </p>
        <p className="font-mono text-2xl font-bold text-primary">{completeness}%</p>
      </div>
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-none border border-border bg-muted"
        role="progressbar"
        aria-valuenow={completeness}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Audit completeness ${completeness} percent`}
      >
        <div className="h-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
      </div>
      <div className="mt-4">
        <Tabs
          label="Knowledge object view"
          tabs={[
            { id: "entities", label: "Entities" },
            { id: "json", label: "JSON" },
          ]}
          active={view}
          onChange={(id) => setView(id as "entities" | "json")}
        />
        <div className="tab-panel mt-0">
          {view === "entities" ? (
            <EntitiesView bko={bko} />
          ) : (
            <pre className="max-h-[420px] overflow-auto font-mono text-[0.72rem] leading-relaxed text-foreground">{json}</pre>
          )}
        </div>
      </div>
    </aside>
  );
}