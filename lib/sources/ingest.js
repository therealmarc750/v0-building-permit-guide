const crypto = require("crypto");
const { z } = require("zod");
const { ALL_ANSWER_KEYS } = require("../guide/answer-keys.js");

const CitationSchema = z.object({
  sourceId: z.string(),
  chunkId: z.string(),
  excerpt: z.string().max(800),
  locationHint: z.string().optional().nullable(),
});

const RuleCandidateSchema = z.object({
  title: z.string().min(1),
  outcome: z.enum(["søknadspliktig", "unntatt", "avhenger"]),
  explanation: z.string().min(1),
  conditions: z.unknown(),
  citations: z.array(CitationSchema).min(1),
  projectType: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

const MAX_EXCERPT_LENGTH = 600;

const HTML_ENTITY_MAP = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": "\"",
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function hashContent(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function decodeHtmlEntities(value) {
  return Object.entries(HTML_ENTITY_MAP).reduce(
    (acc, [entity, replacement]) => acc.replaceAll(entity, replacement),
    value,
  );
}

function extractReadableText(html) {
  const sanitized = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");

  const withParagraphs = sanitized
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n\n## $1\n\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n\n");

  const text = decodeHtmlEntities(
    withParagraphs.replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text;
}

function chunkText(text) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let currentHeading = null;
  let currentText = "";
  let startOffset = 0;
  let cursor = 0;

  const flushChunk = () => {
    if (!currentText.trim()) return;
    const chunkTextValue = currentText.trim();
    const endOffset = startOffset + chunkTextValue.length;
    chunks.push({
      heading: currentHeading,
      text: chunkTextValue,
      startOffset,
      endOffset,
      hash: hashContent(chunkTextValue),
    });
    currentText = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.startsWith("## ")) {
      flushChunk();
      currentHeading = paragraph.replace(/^##\s*/, "").trim() || null;
      cursor += paragraph.length + 2;
      startOffset = cursor;
      continue;
    }

    const candidate = currentText ? `${currentText}\n\n${paragraph}` : paragraph;

    if (candidate.length > 1200 && currentText) {
      flushChunk();
      startOffset = cursor;
      currentText = paragraph;
    } else {
      currentText = candidate;
    }

    cursor += paragraph.length + 2;

    if (currentText.length >= 400) {
      flushChunk();
      startOffset = cursor;
    }
  }

  flushChunk();

  return chunks;
}

function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "Uten tittel";
}

function parseNumericCondition(text, field, keyword) {
  const match = text.match(keyword);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  if (Number.isNaN(value)) return null;

  const normalized = text.toLowerCase();
  if (/(maks|maksimalt|inntil|opptil|<=|mindre enn)/.test(normalized)) {
    return { field, op: "<=", value };
  }
  if (/(over|mer enn|>=|minimum|minst)/.test(normalized)) {
    return { field, op: ">=", value };
  }
  return { field, op: "==", value };
}

function guessProjectType(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes("garasje") || normalized.includes("carport")) {
    return "garasje";
  }
  if (normalized.includes("tilbygg")) return "tilbygg";
  if (normalized.includes("påbygg") || normalized.includes("paabygg")) return "paabygg";
  if (normalized.includes("terrasse") || normalized.includes("veranda")) return "terrasse";
  if (normalized.includes("bod") || normalized.includes("uthus") || normalized.includes("anneks")) {
    return "bod";
  }
  if (normalized.includes("tak") && normalized.includes("endring")) return "takendring";
  if (normalized.includes("støttemur") || normalized.includes("stottemur")) return "stottemur";
  if (normalized.includes("bruksendring")) return "bruksendring";
  if (normalized.includes("riving")) return "riving";
  if (normalized.includes("fasade") || normalized.includes("vindu")) return "fasadeendring";
  return null;
}

function deriveOutcome(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes("ikke søknadspliktig") || normalized.includes("unntatt")) {
    return "unntatt";
  }
  if (normalized.includes("søknadspliktig") || normalized.includes("søknad kreves")) {
    return "søknadspliktig";
  }
  return "avhenger";
}

function buildConditions(text, projectType) {
  if (!projectType) return null;
  const signals = [];
  const normalized = text.toLowerCase();

  const areaKey = projectType === "garasje" ? "g1" : `${projectType}-area`;
  const heightKey = projectType === "garasje" ? "g3" : `${projectType}-height`;
  const distanceKey = projectType === "garasje" ? "g4" : `${projectType}-distance`;

  const areaSignal = parseNumericCondition(normalized, areaKey, /(\d+(?:[.,]\d+)?)\s*(m2|m²|kvadratmeter)/);
  if (areaSignal) signals.push(areaSignal);

  const heightSignal = parseNumericCondition(normalized, heightKey, /(\d+(?:[.,]\d+)?)\s*(m|meter)\b/);
  if (heightSignal && normalized.includes("høy")) signals.push(heightSignal);

  const distanceSignal = parseNumericCondition(normalized, distanceKey, /(\d+(?:[.,]\d+)?)\s*(m|meter)\b/);
  if (distanceSignal && normalized.includes("nabogrense")) signals.push(distanceSignal);

  if (normalized.includes("regulert område") || normalized.includes("reguleringsplan")) {
    const key = projectType === "garasje" ? "g5" : `${projectType}-regulated`;
    signals.push({ field: key, op: "==", value: "ja" });
  }
  if (normalized.includes("spesielle hensyn")) {
    const key = projectType === "garasje" ? "g6" : `${projectType}-special`;
    signals.push({ field: key, op: "==", value: "ja" });
  }

  const allowedSignals = signals.filter((signal) => ALL_ANSWER_KEYS.has(signal.field));
  if (allowedSignals.length === 0) {
    return null;
  }

  if (allowedSignals.length === 1) {
    const signal = allowedSignals[0];
    return { field: signal.field, op: signal.op, value: signal.value };
  }

  return {
    and: allowedSignals.map((signal) => ({
      field: signal.field,
      op: signal.op,
      value: signal.value,
    })),
  };
}

function pruneInvalidConditions(node) {
  if ("field" in node) {
    if (!ALL_ANSWER_KEYS.has(node.field)) {
      return { node: null, hadUnknown: true };
    }
    return { node, hadUnknown: false };
  }

  if ("and" in node) {
    const results = node.and.map(pruneInvalidConditions);
    const valid = results.map((result) => result.node).filter(Boolean);
    const hadUnknown = results.some((result) => result.hadUnknown);
    return valid.length > 0 ? { node: { and: valid }, hadUnknown } : { node: null, hadUnknown };
  }

  if ("or" in node) {
    const results = node.or.map(pruneInvalidConditions);
    const valid = results.map((result) => result.node).filter(Boolean);
    const hadUnknown = results.some((result) => result.hadUnknown);
    return valid.length > 0 ? { node: { or: valid }, hadUnknown } : { node: null, hadUnknown };
  }

  return { node: null, hadUnknown: true };
}

function getLocationHint(chunk) {
  if (chunk.heading) return chunk.heading;
  const match = chunk.text.match(/§\s*\d+(-\d+)?/);
  if (match) return match[0];
  if (chunk.text.toLowerCase().includes("ledd")) return "Ledd";
  return null;
}

function generateRuleCandidates(chunks, sourceId) {
  const candidates = [];

  for (const chunk of chunks) {
    const projectType = guessProjectType(chunk.text);
    const outcome = deriveOutcome(chunk.text);
    const baseConditions = buildConditions(chunk.text, projectType);
    const pruned =
      baseConditions !== null ? pruneInvalidConditions(baseConditions) : { node: null, hadUnknown: false };

    const needsMapping = !pruned.node || pruned.hadUnknown;
    const confidence = needsMapping ? 0.3 : 0.6;

    const excerpt = chunk.text.slice(0, MAX_EXCERPT_LENGTH);
    const locationHint = getLocationHint(chunk);

    const title = projectType
      ? `${projectType} - regelutdrag`
      : "Regelutdrag fra kilde";

    const explanationBase =
      outcome === "unntatt"
        ? "Teksten antyder at tiltaket kan være unntatt søknadsplikt."
        : outcome === "søknadspliktig"
          ? "Teksten antyder at tiltaket er søknadspliktig."
          : "Teksten antyder at tiltaket må vurderes nærmere.";

    const explanation = needsMapping
      ? `${explanationBase} Trenger manuell kartlegging av vilkår.`
      : explanationBase;

    const candidate = {
      title,
      outcome,
      explanation,
      conditions: pruned.node ?? {},
      citations: [
        {
          sourceId,
          chunkId: chunk.id ?? chunk.hash,
          excerpt,
          locationHint,
        },
      ],
      projectType,
      confidence,
    };

    const parsed = RuleCandidateSchema.safeParse(candidate);
    if (parsed.success) {
      candidates.push(parsed.data);
    }
  }

  return candidates;
}

function validateRuleCandidate(value) {
  return RuleCandidateSchema.safeParse(value);
}

module.exports = {
  CitationSchema,
  RuleCandidateSchema,
  hashContent,
  extractReadableText,
  chunkText,
  extractTitle,
  generateRuleCandidates,
  validateRuleCandidate,
};
