import type {
  ConditionNode,
  ConditionOperator,
  EvaluateInput,
  EvaluateOutput,
  GuidanceRule,
  Outcome,
} from "./types";

function compareValues(
  fieldValue: unknown,
  op: ConditionOperator,
  value: unknown,
): boolean {
  switch (op) {
    case "==":
      return fieldValue === value;
    case "!=":
      return fieldValue !== value;
    case ">":
      return typeof fieldValue === "number" && typeof value === "number"
        ? fieldValue > value
        : false;
    case ">=":
      return typeof fieldValue === "number" && typeof value === "number"
        ? fieldValue >= value
        : false;
    case "<":
      return typeof fieldValue === "number" && typeof value === "number"
        ? fieldValue < value
        : false;
    case "<=":
      return typeof fieldValue === "number" && typeof value === "number"
        ? fieldValue <= value
        : false;
    case "in":
      return Array.isArray(value) ? value.includes(fieldValue) : false;
    case "contains":
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value);
      }
      if (typeof fieldValue === "string") {
        return fieldValue.includes(String(value));
      }
      return false;
    default:
      return false;
  }
}

function evaluateCondition(node: ConditionNode, answers: Record<string, unknown>): boolean {
  if ("and" in node) {
    return node.and.every((child) => evaluateCondition(child, answers));
  }

  if ("or" in node) {
    return node.or.some((child) => evaluateCondition(child, answers));
  }

  if ("field" in node) {
    const fieldValue = answers[node.field];

    // Missing answers should not match the rule.
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    return compareValues(fieldValue, node.op, node.value);
  }

  // Empty condition objects are treated as always-true.
  return true;
}

export function evaluateRules(
  rules: GuidanceRule[],
  input: EvaluateInput,
): EvaluateOutput {
  const sortedRules = rules
    .filter((rule) => rule.isActive && rule.projectType === input.projectType)
    .sort((a, b) => a.priority - b.priority);

  const matchedRule = sortedRules.find((rule) =>
    evaluateCondition(rule.conditions, input.answers),
  );

  if (!matchedRule) {
    return {
      outcome: "avhenger",
      explanation: "Ingen regel matchet svarene. Trenger en manuell vurdering.",
      sources: [],
    };
  }

  return {
    outcome: matchedRule.outcome as Outcome,
    explanation: matchedRule.explanation,
    sources: [],
    matchedRuleId: matchedRule.id,
    matchedRuleTitle: matchedRule.title,
  };
}
