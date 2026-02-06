import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Get sources error:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente kilder" },
      { status: 500 }
    );
  }

  // Transform snake_case to camelCase for frontend
  const sources = data.map((row) => ({
    id: row.id,
    url: row.url,
    domain: row.domain,
    title: row.title,
    fetchedHtml: row.fetched_html,
    extractedText: row.extracted_text,
    fetchedAt: row.fetched_at,
    fetchStatus: row.fetch_status,
    fetchError: row.fetch_error,
    error: row.error,
    contentHash: row.content_hash,
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
  }));

  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, category, tags, title, domain, fetchedHtml, extractedText } = body;

    if (!url || !title || !domain || !fetchedHtml || !extractedText) {
      return NextResponse.json(
        { error: "Manglende påkrevde felter" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sources")
      .insert({
        url,
        domain,
        title,
        fetched_html: fetchedHtml,
        extracted_text: extractedText,
        fetched_at: new Date().toISOString(),
        fetch_status: "fetched",
        fetch_error: null,
        content_hash: null,
        status: "ubehandlet",
        category: category || null,
        tags: tags || [],
        internal_notes: "",
        curator_summary: "",
        review_flags: {
          is_official: false,
          is_relevant: false,
          has_clear_rules: false,
          is_current: false,
        },
        key_excerpts: [],
        related_flows: [],
      })
      .select()
      .single();

    if (error) {
      console.error("Create source error:", error);
      return NextResponse.json(
        { error: "Kunne ikke opprette kilde" },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const source = {
      id: data.id,
      url: data.url,
      domain: data.domain,
      title: data.title,
      fetchedHtml: data.fetched_html,
      extractedText: data.extracted_text,
      fetchedAt: data.fetched_at,
      fetchStatus: data.fetch_status,
      fetchError: data.fetch_error,
      error: data.error,
      contentHash: data.content_hash,
      status: data.status,
      category: data.category,
      tags: data.tags || [],
      internalNotes: data.internal_notes || "",
      curatorSummary: data.curator_summary || "",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      reviewFlags: data.review_flags,
      keyExcerpts: data.key_excerpts || [],
      relatedFlows: data.related_flows || [],
    };

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error("Create source error:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette kilde" },
      { status: 500 }
    );
  }
}
