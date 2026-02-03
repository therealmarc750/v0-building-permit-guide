export type Outcome = "søknadspliktig" | "unntatt" | "avhenger";

export type ConditionOperator =
  | "=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "in"
  | "contains";

export type ConditionNode =
  | { and: ConditionNode[] }
  | { or: ConditionNode[] }
  | {
      field: string;
      op: ConditionOperator;
      value: unknown;
    };

export interface GuidanceRule {
  id: string;
  projectType: string;
  title: string;
  conditions: ConditionNode;
  outcome: Outcome;
  explanation: string;
  sourceIds: string[];
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluateInput {
  projectType: string;
  answers: Record<string, unknown>;
}

export interface EvaluateOutput {
  outcome: Outcome;
  explanation: string;
  sources: unknown[];
  matchedRuleId?: string;
  matchedRuleTitle?: string;
  hint?: string;
}
