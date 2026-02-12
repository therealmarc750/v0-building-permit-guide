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
      .from("source_chunks")
      .select("*")
      .eq("source_id", id)
      .order("ordinal", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Kunne ikke hente tekstblokker" }, { status: 500 });
    }

    const chunks = (data || []).map((row) => ({
      id: row.id,
      sourceId: row.source_id,
      ordinal: row.ordinal,
      heading: row.heading,
      text: row.text,
      startOffset: row.start_offset,
      endOffset: row.end_offset,
      hash: row.hash,
    }));

    return NextResponse.json(chunks);
  } catch (error) {
    console.error("Get source chunks error:", error);
    return NextResponse.json({ error: "Kunne ikke hente tekstblokker" }, { status: 500 });
  }
}
