import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditLeadSchema, normalizeWebsite } from "./audit-lead.ts";

describe("normalizeWebsite", () => {
  it("adds https when missing", () => {
    assert.equal(normalizeWebsite("acme.com"), "https://acme.com");
  });

  it("rejects non-http schemes", () => {
    assert.throws(() => normalizeWebsite("javascript:alert(1)"));
  });
});

describe("auditLeadSchema", () => {
  it("accepts a valid lead", () => {
    const parsed = auditLeadSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      website: "example.com",
    });
    assert.equal(parsed.website, "https://example.com");
  });

  it("rejects a bad email", () => {
    const result = auditLeadSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      website: "example.com",
    });
    assert.equal(result.success, false);
  });
});
