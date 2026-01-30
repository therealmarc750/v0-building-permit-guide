// Types for the guidance rule system

export type ProjectType = "garasje" | "tilbygg" | "fasadeendring" | "bruksendring" | "riving";

export type OutcomeType = 
  | "unntak"           // No permit needed
  | "soknad_selv"      // Can apply yourself
  | "soknad_ansvarlig" // Need professional
  | "ikke_tillatt";    // Not allowed

export type ConditionOperator = "eq" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in";

export interface SingleCondition {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
}

export interface ConditionGroup {
  AND?: (SingleCondition | ConditionGroup)[];
  OR?: (SingleCondition | ConditionGroup)[];
}

export interface GuidanceRule {
  id: string;
  project_type: ProjectType;
  title: string;
  conditions: ConditionGroup;
  outcome: OutcomeType;
  explanation: string;
  source_ids: string[];
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvaluationResult {
  outcome: OutcomeType;
  matchedRule: GuidanceRule | null;
  explanation: string;
  sourceIds: string[];
}

export interface WizardAnswers {
  [key: string]: string | number | boolean | undefined;
}

// Norwegian labels for outcomes
export const OUTCOME_LABELS: Record<OutcomeType, string> = {
  unntak: "Unntatt søknadsplikt",
  soknad_selv: "Kan søke selv",
  soknad_ansvarlig: "Krever ansvarlig søker",
  ikke_tillatt: "Ikke tillatt",
};

export const OUTCOME_DESCRIPTIONS: Record<OutcomeType, string> = {
  unntak: "Du kan bygge uten å sende søknad til kommunen, men du må fortsatt følge alle tekniske krav og reguleringsplan.",
  soknad_selv: "Du kan selv sende inn søknad til kommunen uten å engasjere en ansvarlig søker.",
  soknad_ansvarlig: "Du må engasjere et foretak med ansvarsrett som sender søknad på dine vegne.",
  ikke_tillatt: "Tiltaket er ikke tillatt etter gjeldende regelverk eller reguleringsplan.",
};
