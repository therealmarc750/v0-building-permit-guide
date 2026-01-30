import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateRules } from "@/lib/veileder/evaluate-rules";
import type { GuidanceRule, WizardAnswers } from "@/lib/veileder/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectType, answers } = body as {
      projectType: string;
      answers: WizardAnswers;
    };

    if (!projectType) {
      return NextResponse.json(
        { error: "projectType er påkrevd" },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "answers er påkrevd og må være et objekt" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch active rules for this project type
    const { data: rules, error: rulesError } = await supabase
      .from("guidance_rules")
      .select("*")
      .eq("project_type", projectType)
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (rulesError) {
      console.error("[v0] Error fetching rules:", rulesError);
      return NextResponse.json(
        { error: "Kunne ikke hente regler" },
        { status: 500 }
      );
    }

    // Evaluate rules against answers
    const result = evaluateRules(rules as GuidanceRule[], answers);

    // If we have source IDs, fetch the source details
    let sources: Array<{ id: string; title: string; url: string; curatorSummary: string }> = [];
    
    if (result.sourceIds.length > 0) {
      const { data: sourcesData, error: sourcesError } = await supabase
        .from("sources")
        .select("id, title, url, curator_summary")
        .in("id", result.sourceIds);

      if (!sourcesError && sourcesData) {
        sources = sourcesData.map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          curatorSummary: s.curator_summary || "",
        }));
      }
    }

    return NextResponse.json({
      outcome: result.outcome,
      explanation: result.explanation,
      matchedRuleId: result.matchedRule?.id || null,
      matchedRuleTitle: result.matchedRule?.title || null,
      sources,
    });
  } catch (error) {
    console.error("[v0] Evaluate error:", error);
    return NextResponse.json(
      { error: "En feil oppstod under evaluering" },
      { status: 500 }
    );
  }
}
