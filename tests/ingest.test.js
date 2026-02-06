const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  chunkText,
  generateRuleCandidates,
  validateRuleCandidate,
} = require("../lib/sources/ingest.js");

describe("chunkText", () => {
  it("creates paragraph-level chunks with offsets", () => {
    const text = [
      "## Kapittel 1",
      "Dette er første avsnitt med litt tekst for å fylle opp.",
      "",
      "Dette er andre avsnitt som fortsetter temaet i samme kapittel.",
      "",
      "## Kapittel 2",
      "Tredje avsnitt med ny overskrift.",
    ].join("\n\n");

    const chunks = chunkText(text);
    assert.ok(chunks.length >= 2);
    for (const chunk of chunks) {
      assert.ok(chunk.text.length > 0);
      assert.ok(chunk.endOffset >= chunk.startOffset);
    }
  });
});

describe("rule candidate validation", () => {
  it("accepts valid candidate output", () => {
    const chunks = chunkText("Garasje opptil 50 m² kan være unntatt søknad.");
    const candidates = generateRuleCandidates(chunks, "source-1");
    assert.ok(candidates.length > 0);
    const result = validateRuleCandidate(candidates[0]);
    assert.ok(result.success);
  });

  it("rejects invalid outcome", () => {
    const result = validateRuleCandidate({
      title: "Ugyldig",
      outcome: "kanskje",
      explanation: "Feil outcome.",
      conditions: {},
      citations: [
        {
          sourceId: "source-1",
          chunkId: "chunk-1",
          excerpt: "Utdrag",
        },
      ],
      projectType: null,
      confidence: 0.5,
    });

    assert.equal(result.success, false);
  });
});
