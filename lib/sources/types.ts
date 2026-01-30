export type SourceStatus = "ubehandlet" | "godkjent" | "avvist";

export type SourceCategory =
  | "lov"
  | "forskrift"
  | "veileder"
  | "rundskriv"
  | "tolkningsuttalelse"
  | "annet";

export type FlowType =
  | "garasje"
  | "tilbygg"
  | "fasadeendring"
  | "bruksendring"
  | "riving";

export interface ReviewFlags {
  is_official: boolean;
  is_relevant: boolean;
  has_clear_rules: boolean;
  is_current: boolean;
}

export interface Source {
  id: string;
  url: string;
  domain: string;
  title: string;
  fetchedHtml: string;
  extractedText: string;
  status: SourceStatus;
  category: SourceCategory | null;
  tags: string[];
  internalNotes: string;
  curatorSummary: string;
  createdAt: string;
  updatedAt: string;
  // New review fields
  reviewFlags: ReviewFlags;
  keyExcerpts: string[];
  relatedFlows: FlowType[];
}

export interface CreateSourceInput {
  url: string;
  category?: SourceCategory;
  tags?: string[];
}

export interface UpdateSourceInput {
  status?: SourceStatus;
  category?: SourceCategory | null;
  tags?: string[];
  internalNotes?: string;
  curatorSummary?: string;
  reviewFlags?: Partial<ReviewFlags>;
  keyExcerpts?: string[];
  relatedFlows?: FlowType[];
}

export const ALLOWED_DOMAINS = ["oslo.kommune.no", "dibk.no"];

export const CATEGORY_LABELS: Record<SourceCategory, string> = {
  lov: "Lov",
  forskrift: "Forskrift",
  veileder: "Veileder",
  rundskriv: "Rundskriv",
  tolkningsuttalelse: "Tolkningsuttalelse",
  annet: "Annet",
};

export const STATUS_LABELS: Record<SourceStatus, string> = {
  ubehandlet: "Ubehandlet",
  godkjent: "Godkjent",
  avvist: "Avvist",
};

export const FLOW_LABELS: Record<FlowType, string> = {
  garasje: "Garasje/Carport",
  tilbygg: "Tilbygg",
  fasadeendring: "Fasadeendring",
  bruksendring: "Bruksendring",
  riving: "Riving",
};

export const REVIEW_FLAG_LABELS: Record<keyof ReviewFlags, string> = {
  is_official: "Offisiell kilde",
  is_relevant: "Relevant for byggesak",
  has_clear_rules: "Klare regler/vilkår",
  is_current: "Oppdatert/gjeldende",
};

export const DEFAULT_REVIEW_FLAGS: ReviewFlags = {
  is_official: false,
  is_relevant: false,
  has_clear_rules: false,
  is_current: false,
};
