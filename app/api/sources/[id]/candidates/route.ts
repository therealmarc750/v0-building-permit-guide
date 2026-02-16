import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("rule_candidates")
      .select("*")
      .eq("source_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch candidates error:", error);
      return NextResponse.json(
        { error: "Kunne ikke hente regelutkast" },
        { status: 500 },
      );
    }

    const candidates = (data || []).map((row) => ({
      id: row.id,
      sourceId: row.source_id,
      chunkId: row.chunk_id,
      projectType: row.project_type,
      title: row.title,
      explanation: row.explanation,
      outcome: row.outcome,
      conditions: row.conditions,
      citations: row.citations || [],
      confidence: row.confidence,
      status: row.status,
      createdAt: row.created_at,
    }));

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("Fetch candidates error:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente regelutkast" },
      { status: 500 },
    );
  }
}
