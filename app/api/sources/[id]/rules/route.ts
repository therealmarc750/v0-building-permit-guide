import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      chunkId,
      projectType,
      outcome,
      title,
      explanation,
      conditions,
      isActive,
      priority,
    } = body;

    if (!chunkId || !projectType || !outcome || !title || !explanation) {
      return NextResponse.json({ error: "Manglende påkrevde felter" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("id,url,title")
      .eq("id", id)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: "Kilde ikke funnet" }, { status: 404 });
    }

    const { data: chunk, error: chunkError } = await supabase
      .from("source_chunks")
      .select("id,heading,text")
      .eq("id", chunkId)
      .eq("source_id", id)
      .single();

    if (chunkError || !chunk) {
      return NextResponse.json({ error: "Tekstblokk ikke funnet" }, { status: 404 });
    }

    const citation = {
      sourceId: source.id,
      chunkId: chunk.id,
      excerpt: String(chunk.text).slice(0, 800),
      locationHint: chunk.heading,
      url: source.url,
    };

    const { data: rule, error: ruleError } = await supabase
      .from("guidance_rules")
      .insert({
        project_type: projectType,
        title,
        conditions: conditions || {},
        outcome,
        explanation,
        source_ids: [source.id],
        citations: [citation],
        priority: Number(priority) || 100,
        is_active: Boolean(isActive),
      })
      .select("id,title")
      .single();

    if (ruleError || !rule) {
      return NextResponse.json({ error: "Kunne ikke lagre regel" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, rule });
  } catch (error) {
    console.error("Create rule from chunk error:", error);
    return NextResponse.json({ error: "Kunne ikke opprette regel" }, { status: 500 });
  }
}
