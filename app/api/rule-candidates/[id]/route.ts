import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function hasConditions(value: unknown) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.length > 0;
  return Object.keys(value as Record<string, unknown>).length > 0;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Ugyldig status" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: candidate, error: candidateError } = await supabase
      .from("rule_candidates")
      .select("*")
      .eq("id", id)
      .single();

    if (candidateError || !candidate) {
      console.error("Fetch candidate error:", candidateError);
      return NextResponse.json(
        { error: "Regelutkast ikke funnet" },
        { status: 404 },
      );
    }

    if (status === "approved") {
      if (!candidate.project_type) {
        return NextResponse.json(
          { error: "Prosjekttype må settes før godkjenning" },
          { status: 400 },
        );
      }

      const isActive = hasConditions(candidate.conditions);

      const { error: ruleError } = await supabase
        .from("guidance_rules")
        .insert({
          project_type: candidate.project_type,
          title: candidate.title,
          conditions: candidate.conditions,
          outcome: candidate.outcome,
          explanation: candidate.explanation,
          source_ids: [candidate.source_id],
          citations: candidate.citations || [],
          priority: 100,
          is_active: isActive,
        });

      if (ruleError) {
        console.error("Insert guidance rule error:", ruleError);
        return NextResponse.json(
          { error: "Kunne ikke lagre godkjent regel" },
          { status: 500 },
        );
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("rule_candidates")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error("Update candidate error:", updateError);
      return NextResponse.json(
        { error: "Kunne ikke oppdatere regelutkast" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("Update candidate error:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere regelutkast" },
      { status: 500 },
    );
  }
}
