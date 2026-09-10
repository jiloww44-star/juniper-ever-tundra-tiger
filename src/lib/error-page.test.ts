import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeHtml, renderErrorPage } from "./error-page.ts";

describe("escapeHtml", () => {
  it("escapes markup", () => {
    const input = '<img src=x onerror="alert(1)">';
    const expected = "\u0026lt;img src=x onerror=\u0026quot;alert(1)\u0026quot;\u0026gt;";
    assert.equal(escapeHtml(input), expected);
  });
});

describe("renderErrorPage", () => {
  it("does not interpolate unsanitized HTML", () => {
    const html = renderErrorPage("<script>alert(1)</script>");
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /\u0026lt;script\u0026gt;/);
  });
});
