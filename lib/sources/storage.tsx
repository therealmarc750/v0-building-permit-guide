import type { Source, CreateSourceInput, UpdateSourceInput } from "./types";
import { DEFAULT_REVIEW_FLAGS } from "./types";

// Use globalThis to persist across hot reloads and API calls in v0 runtime
declare global {
  // biome-ignore lint/style/noVar: needed for global persistence
  var __sourcesStore: Source[] | undefined;
}

// Initialize global store if not exists
if (!globalThis.__sourcesStore) {
  globalThis.__sourcesStore = [];
}

// Reference to the global store
const sources = globalThis.__sourcesStore;

export function getAllSources(): Source[] {
  return [...sources].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getSourceById(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}

export function createSource(
  input: CreateSourceInput & {
    title: string;
    domain: string;
    fetchedHtml: string;
    extractedText: string;
  }
): Source {
  const now = new Date().toISOString();
  const source: Source = {
    id: crypto.randomUUID(),
    url: input.url,
    domain: input.domain,
    title: input.title,
    fetchedHtml: input.fetchedHtml,
    extractedText: input.extractedText,
    status: "ubehandlet",
    category: input.category || null,
    tags: input.tags || [],
    internalNotes: "",
    curatorSummary: "",
    createdAt: now,
    updatedAt: now,
    reviewFlags: { ...DEFAULT_REVIEW_FLAGS },
    keyExcerpts: [],
    relatedFlows: [],
  };
  sources.push(source);
  return source;
}

export function updateSource(
  id: string,
  input: UpdateSourceInput
): Source | undefined {
  const index = sources.findIndex((s) => s.id === id);
  if (index === -1) return undefined;

  const current = sources[index];
  const updated: Source = {
    ...current,
    ...input,
    // Merge reviewFlags instead of replacing
    reviewFlags: input.reviewFlags
      ? { ...current.reviewFlags, ...input.reviewFlags }
      : current.reviewFlags,
    updatedAt: new Date().toISOString(),
  };
  sources[index] = updated;
  return updated;
}

export function deleteSource(id: string): boolean {
  const index = sources.findIndex((s) => s.id === id);
  if (index === -1) return false;
  sources.splice(index, 1);
  return true;
}

// Seed with sample data for demo
function seedSampleData() {
  if (globalThis.__sourcesStore && globalThis.__sourcesStore.length > 0) return;

  const sampleSources: Omit<Source, "id">[] = [
    {
      url: "https://dibk.no/regelverk/byggteknisk-forskrift-tek17/",
      domain: "dibk.no",
      title: "Byggteknisk forskrift (TEK17)",
      fetchedHtml: "<html><body><h1>TEK17</h1><p>Byggteknisk forskrift fastsetter tekniske krav til byggverk. Forskriften gjelder for oppføring av nye byggverk og for hovedombygging av eksisterende byggverk.</p></body></html>",
      extractedText:
        "Byggteknisk forskrift (TEK17) fastsetter tekniske krav til byggverk.\n\nForskriften gjelder for oppføring av nye byggverk og for hovedombygging av eksisterende byggverk.\n\nKravene skal sikre at tiltak planlegges, prosjekteres og utføres slik at det oppnås tilfredsstillende sikkerhet, helse, miljø og tilgjengelighet.",
      status: "godkjent",
      category: "forskrift",
      tags: ["TEK17", "byggteknisk"],
      internalNotes: "Hovedforskrift for tekniske krav",
      curatorSummary:
        "TEK17 er den gjeldende byggtekniske forskriften som stiller minimumskrav til byggverk.",
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-16T14:30:00Z",
      reviewFlags: { is_official: true, is_relevant: true, has_clear_rules: true, is_current: true },
      keyExcerpts: ["Kravene skal sikre at tiltak planlegges, prosjekteres og utføres slik at det oppnås tilfredsstillende sikkerhet"],
      relatedFlows: ["garasje", "tilbygg", "fasadeendring"],
    },
    {
      url: "https://oslo.kommune.no/plan-bygg-og-eiendom/byggesaksveiledere/",
      domain: "oslo.kommune.no",
      title: "Byggesaksveiledere - Oslo kommune",
      fetchedHtml: "<html><body><h1>Byggesaksveiledere</h1><p>Oslo kommune har utarbeidet veiledere for ulike typer byggesaker for å hjelpe deg gjennom søknadsprosessen.</p></body></html>",
      extractedText:
        "Oslo kommune har utarbeidet veiledere for ulike typer byggesaker for å hjelpe deg gjennom søknadsprosessen.\n\nHer finner du informasjon om hva du kan bygge uten å søke, hva som krever søknad, og hvordan du går frem for å søke.",
      status: "ubehandlet",
      category: "veileder",
      tags: ["Oslo", "veileder"],
      internalNotes: "",
      curatorSummary: "",
      createdAt: "2025-01-20T09:15:00Z",
      updatedAt: "2025-01-20T09:15:00Z",
      reviewFlags: { is_official: true, is_relevant: false, has_clear_rules: false, is_current: false },
      keyExcerpts: [],
      relatedFlows: [],
    },
    {
      url: "https://dibk.no/regelverk/sak/",
      domain: "dibk.no",
      title: "Byggesaksforskriften (SAK10)",
      fetchedHtml: "<html><body><h1>SAK10</h1><p>Forskrift om byggesak regulerer saksbehandlingsregler for byggesaker, ansvar og kontroll.</p></body></html>",
      extractedText:
        "Forskrift om byggesak (byggesaksforskriften) regulerer saksbehandling, ansvar, kontroll og tilsyn i byggesaker.\n\nForskriften utfyller plan- og bygningslovens bestemmelser og gir detaljerte regler for hvordan byggesaker skal behandles.",
      status: "godkjent",
      category: "forskrift",
      tags: ["SAK10", "saksbehandling"],
      internalNotes: "Viktig for prosessregler",
      curatorSummary:
        "SAK10 regulerer saksbehandlingsregler, ansvar og kontroll i byggesaker.",
      createdAt: "2025-01-10T11:00:00Z",
      updatedAt: "2025-01-18T16:45:00Z",
      reviewFlags: { is_official: true, is_relevant: true, has_clear_rules: true, is_current: true },
      keyExcerpts: ["Forskriften utfyller plan- og bygningslovens bestemmelser"],
      relatedFlows: ["garasje", "tilbygg"],
    },
  ];

  for (const sample of sampleSources) {
    sources.push({
      ...sample,
      id: crypto.randomUUID(),
    });
  }
}

// Initialize with sample data on first load
seedSampleData();
