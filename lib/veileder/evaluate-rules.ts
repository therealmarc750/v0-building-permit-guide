import type { 
  GuidanceRule, 
  ConditionGroup, 
  SingleCondition, 
  WizardAnswers, 
  EvaluationResult,
  OutcomeType 
} from "./types";

/**
 * Evaluates a single condition against the wizard answers
 */
function evaluateSingleCondition(
  condition: SingleCondition,
  answers: WizardAnswers
): boolean {
  const { field, operator, value } = condition;
  const answer = answers[field];

  // If the field hasn't been answered, condition fails
  if (answer === undefined || answer === null) {
    return false;
  }

  switch (operator) {
    case "eq":
      return answer === value;
    
    case "gt":
      return typeof answer === "number" && typeof value === "number" && answer > value;
    
    case "lt":
      return typeof answer === "number" && typeof value === "number" && answer < value;
    
    case "gte":
      return typeof answer === "number" && typeof value === "number" && answer >= value;
    
    case "lte":
      return typeof answer === "number" && typeof value === "number" && answer <= value;
    
    case "in":
      if (Array.isArray(value)) {
        return value.includes(answer as string);
      }
      return false;
    
    case "not_in":
      if (Array.isArray(value)) {
        return !value.includes(answer as string);
      }
      return true;
    
    default:
      return false;
  }
}

/**
 * Checks if an object is a SingleCondition (has field, operator, value)
 */
function isSingleCondition(obj: unknown): obj is SingleCondition {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "field" in obj &&
    "operator" in obj &&
    "value" in obj
  );
}

/**
 * Recursively evaluates a condition group (AND/OR logic)
 */
function evaluateConditionGroup(
  group: ConditionGroup,
  answers: WizardAnswers
): boolean {
  // Handle AND conditions - all must be true
  if (group.AND && group.AND.length > 0) {
    return group.AND.every((condition) => {
      if (isSingleCondition(condition)) {
        return evaluateSingleCondition(condition, answers);
      }
      // Nested group
      return evaluateConditionGroup(condition as ConditionGroup, answers);
    });
  }

  // Handle OR conditions - at least one must be true
  if (group.OR && group.OR.length > 0) {
    return group.OR.some((condition) => {
      if (isSingleCondition(condition)) {
        return evaluateSingleCondition(condition, answers);
      }
      // Nested group
      return evaluateConditionGroup(condition as ConditionGroup, answers);
    });
  }

  // Empty condition group - return true (matches everything)
  return true;
}

/**
 * Evaluates all rules and returns the first matching result
 * Rules are evaluated in priority order (lower number = higher priority)
 */
export function evaluateRules(
  rules: GuidanceRule[],
  answers: WizardAnswers
): EvaluationResult {
  // Sort by priority (ascending - lower number = higher priority)
  const sortedRules = [...rules]
    .filter((r) => r.is_active)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    const matches = evaluateConditionGroup(rule.conditions, answers);
    
    if (matches) {
      return {
        outcome: rule.outcome,
        matchedRule: rule,
        explanation: rule.explanation,
        sourceIds: rule.source_ids,
      };
    }
  }

  // No rule matched - return a default "needs review" response
  return {
    outcome: "soknad_ansvarlig" as OutcomeType,
    matchedRule: null,
    explanation: "Basert på svarene dine kan vi ikke gi et entydig svar. Vi anbefaler at du kontakter kommunen eller engasjerer en fagperson for veiledning.",
    sourceIds: [],
  };
}

/**
 * Fetches rules from the database and evaluates them
 */
export async function evaluateRulesFromDb(
  projectType: string,
  answers: WizardAnswers,
  supabaseClient: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: boolean) => {
            order: (column: string, options: { ascending: boolean }) => Promise<{ data: GuidanceRule[] | null; error: Error | null }>;
          };
        };
      };
    };
  }
): Promise<EvaluationResult> {
  const { data: rules, error } = await supabaseClient
    .from("guidance_rules")
    .select("*")
    .eq("project_type", projectType)
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (error || !rules) {
    console.error("[v0] Error fetching rules:", error);
    return {
      outcome: "soknad_ansvarlig",
      matchedRule: null,
      explanation: "Det oppstod en feil ved henting av regler. Kontakt kommunen for veiledning.",
      sourceIds: [],
    };
  }

  return evaluateRules(rules, answers);
}
