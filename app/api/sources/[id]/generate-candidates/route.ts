import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRuleCandidates } from "@/lib/sources/ingest";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: chunks, error: chunkError } = await supabase
      .from("source_chunks")
      .select("*")
      .eq("source_id", id);

    if (chunkError) {
      console.error("Fetch chunks error:", chunkError);
      return NextResponse.json(
        { error: "Kunne ikke hente tekstutdrag" },
        { status: 500 },
      );
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "Ingen tekstutdrag funnet for kilden" },
        { status: 404 },
      );
    }

    const chunkMap = chunks.map((row) => ({
      id: row.id as string,
      heading: row.heading as string | null,
      text: row.text as string,
      startOffset: Number(row.start_offset),
      endOffset: Number(row.end_offset),
      hash: row.hash as string,
    }));

    const candidates = generateRuleCandidates(chunkMap, id);

    await supabase
      .from("rule_candidates")
      .delete()
      .eq("source_id", id)
      .eq("status", "draft");

    if (candidates.length > 0) {
      const candidateRows = candidates.map((candidate) => ({
        source_id: id,
        chunk_id: candidate.citations[0].chunkId,
        project_type: candidate.projectType,
        outcome: candidate.outcome,
        title: candidate.title,
        explanation: candidate.explanation,
        conditions: candidate.conditions,
        citations: candidate.citations,
        confidence: candidate.confidence,
        status: "draft",
      }));

      const { error: candidateError } = await supabase
        .from("rule_candidates")
        .insert(candidateRows);

      if (candidateError) {
        console.error("Insert candidates error:", candidateError);
        return NextResponse.json(
          { error: "Kunne ikke lagre regelutkast" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      candidatesCreated: candidates.length,
    });
  } catch (error) {
    console.error("Generate candidates error:", error);
    return NextResponse.json(
      { error: "Kunne ikke generere regelutkast" },
      { status: 500 },
    );
  }
}
