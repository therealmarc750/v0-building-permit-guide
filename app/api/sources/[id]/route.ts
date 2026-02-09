import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Kilde ikke funnet" },
      { status: 404 }
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
    contentHash: data.content_hash,
    status: data.status,
    category: data.category,
    tags: data.tags || [],
    internalNotes: data.internal_notes || "",
    curatorSummary: data.curator_summary || "",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    reviewFlags: data.review_flags || {
      is_official: false,
      is_relevant: false,
      has_clear_rules: false,
      is_current: false,
    },
    keyExcerpts: data.key_excerpts || [],
    relatedFlows: data.related_flows || [],
  };

  return NextResponse.json(source);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Transform camelCase to snake_case for database
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.internalNotes !== undefined) updateData.internal_notes = body.internalNotes;
    if (body.curatorSummary !== undefined) updateData.curator_summary = body.curatorSummary;
    if (body.reviewFlags !== undefined) updateData.review_flags = body.reviewFlags;
    if (body.keyExcerpts !== undefined) updateData.key_excerpts = body.keyExcerpts;
    if (body.relatedFlows !== undefined) updateData.related_flows = body.relatedFlows;
    if (body.fetchedHtml !== undefined) updateData.fetched_html = body.fetchedHtml;
    if (body.extractedText !== undefined) updateData.extracted_text = body.extractedText;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.fetchStatus !== undefined) updateData.fetch_status = body.fetchStatus;
    if (body.fetchError !== undefined) updateData.fetch_error = body.fetchError;
    if (body.fetchedAt !== undefined) updateData.fetched_at = body.fetchedAt;
    if (body.contentHash !== undefined) updateData.content_hash = body.contentHash;

    const { data, error } = await supabase
      .from("sources")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("Update source error:", error);
      return NextResponse.json(
        { error: "Kilde ikke funnet" },
        { status: 404 }
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

    return NextResponse.json(source);
  } catch (error) {
    console.error("Update source error:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere kilde" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("sources")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete source error:", error);
    return NextResponse.json(
      { error: "Kunne ikke slette kilde" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
