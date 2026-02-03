import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateRules } from "@/lib/guide/evaluate";
import type { EvaluateInput, GuidanceRule } from "@/lib/guide/types";

function isValidInput(value: unknown): value is EvaluateInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as EvaluateInput;
  return (
    typeof input.projectType === "string" &&
    input.projectType.length > 0 &&
    typeof input.answers === "object" &&
    input.answers !== null
  );
}

function mapGuidanceRule(row: Record<string, unknown>): GuidanceRule {
  return {
    id: String(row.id),
    projectType: String(row.project_type),
    title: String(row.title),
    conditions: row.conditions as GuidanceRule["conditions"],
    outcome: row.outcome as GuidanceRule["outcome"],
    explanation: String(row.explanation),
    sourceIds: (row.source_ids as string[]) || [],
    priority: Number(row.priority),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSource(row: Record<string, unknown>) {
  return {
    id: row.id,
    url: row.url,
    domain: row.domain,
    title: row.title,
    fetchedHtml: row.fetched_html,
    extractedText: row.extracted_text,
    status: row.status,
    category: row.category,
    tags: row.tags || [],
    internalNotes: row.internal_notes || "",
    curatorSummary: row.curator_summary || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewFlags: row.review_flags || {
      is_official: false,
      is_relevant: false,
      has_clear_rules: false,
      is_current: false,
    },
    keyExcerpts: row.key_excerpts || [],
    relatedFlows: row.related_flows || [],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isValidInput(body)) {
      return NextResponse.json(
        { error: "Ugyldig input. Forventet projectType og answers." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: ruleRows, error: ruleError } = await supabase
      .from("guidance_rules")
      .select("*")
      .eq("project_type", body.projectType)
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (ruleError) {
      console.error("Fetch guidance rules error:", ruleError);
      return NextResponse.json(
        { error: "Kunne ikke hente regler" },
        { status: 500 },
      );
    }

    const rules = (ruleRows || []).map((row) =>
      mapGuidanceRule(row as Record<string, unknown>),
    );

    const evaluation = evaluateRules(rules, body);

    const matchedRule = evaluation.matchedRuleId
      ? rules.find((rule) => rule.id === evaluation.matchedRuleId)
      : undefined;

    let sources = [] as ReturnType<typeof mapSource>[];

    if (matchedRule && matchedRule.sourceIds.length > 0) {
      const { data: sourceRows, error: sourceError } = await supabase
        .from("sources")
        .select("*")
        .in("id", matchedRule.sourceIds);

      if (sourceError) {
        console.error("Fetch sources error:", sourceError);
        return NextResponse.json(
          { error: "Kunne ikke hente kilder" },
          { status: 500 },
        );
      }

      sources = (sourceRows || []).map((row) =>
        mapSource(row as Record<string, unknown>),
      );
    }

    const response = {
      ...evaluation,
      sources,
      // Frontend: POST { projectType, answers } to this endpoint to evaluate rules.
      hint: "POST /api/guide/evaluate med { projectType, answers }",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Guide evaluate error:", error);
    return NextResponse.json(
      { error: "Uventet feil ved evaluering" },
      { status: 500 },
    );
  }
}
