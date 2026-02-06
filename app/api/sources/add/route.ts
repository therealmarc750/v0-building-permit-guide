import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_DOMAINS } from "@/lib/sources/types";
import {
  chunkText,
  extractReadableText,
  extractTitle,
  generateRuleCandidates,
  hashContent,
} from "@/lib/sources/ingest";

const MAX_HTML_LENGTH = 100000;
const MAX_TEXT_LENGTH = 50000;

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL er påkrevd" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Ugyldig URL-format" }, { status: 400 });
    }

    const domain = parsedUrl.hostname.replace("www.", "");
    const isAllowed = ALLOWED_DOMAINS.some(
      (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: `Domenet "${domain}" er ikke tillatt. Kun ${ALLOWED_DOMAINS.join(", ")} er støttet.`,
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    let html = "";
    let title = "Uten tittel";
    let extractedText = "";
    let fetchError: string | null = null;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Oslo-Kommune-Kildebibliotek/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Kunne ikke hente innhold (HTTP ${response.status})`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        throw new Error("Kun HTML-innhold støttes");
      }

      html = await response.text();
      title = extractTitle(html);
      extractedText = extractReadableText(html).slice(0, MAX_TEXT_LENGTH);

      if (!extractedText.trim()) {
        throw new Error("Ingen lesbar tekst funnet i kilden");
      }
    } catch (error) {
      fetchError = error instanceof Error ? error.message : "Ukjent feil ved henting";
    }

    const contentHash = extractedText ? hashContent(extractedText) : null;
    const fetchStatus = fetchError ? "failed" : "fetched";

    const { data: sourceRow, error: sourceError } = await supabase
      .from("sources")
      .insert({
        url,
        domain,
        title,
        fetched_html: html ? html.slice(0, MAX_HTML_LENGTH) : null,
        extracted_text: extractedText || null,
        fetched_at: new Date().toISOString(),
        fetch_status: fetchStatus,
        fetch_error: fetchError,
        content_hash: contentHash,
        status: "ubehandlet",
        category: null,
        tags: [],
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

    if (sourceError || !sourceRow) {
      console.error("Create source error:", sourceError);
      return NextResponse.json(
        { error: "Kunne ikke opprette kilde" },
        { status: 500 },
      );
    }

    if (fetchError) {
      return NextResponse.json(
        {
          id: sourceRow.id,
          url: sourceRow.url,
          domain: sourceRow.domain,
          title: sourceRow.title,
          fetchedHtml: sourceRow.fetched_html,
          extractedText: sourceRow.extracted_text,
          fetchedAt: sourceRow.fetched_at,
          fetchStatus: sourceRow.fetch_status,
          fetchError: sourceRow.fetch_error,
          contentHash: sourceRow.content_hash,
          status: sourceRow.status,
          category: sourceRow.category,
          tags: sourceRow.tags || [],
          internalNotes: sourceRow.internal_notes || "",
          curatorSummary: sourceRow.curator_summary || "",
          createdAt: sourceRow.created_at,
          updatedAt: sourceRow.updated_at,
          reviewFlags: sourceRow.review_flags,
          keyExcerpts: sourceRow.key_excerpts || [],
          relatedFlows: sourceRow.related_flows || [],
          chunksCreated: 0,
          candidatesCreated: 0,
          error: fetchError,
        },
        { status: 201 },
      );
    }

    const chunks = chunkText(extractedText);
    const chunkRows = chunks.map((chunk) => ({
      source_id: sourceRow.id,
      heading: chunk.heading,
      text: chunk.text,
      start_offset: chunk.startOffset,
      end_offset: chunk.endOffset,
      hash: chunk.hash,
    }));

    const { data: insertedChunks, error: chunkError } = await supabase
      .from("source_chunks")
      .insert(chunkRows)
      .select();

    if (chunkError) {
      console.error("Insert chunks error:", chunkError);
      return NextResponse.json(
        { error: "Kunne ikke lagre tekstutdrag" },
        { status: 500 },
      );
    }

    const chunkMap = (insertedChunks || []).map((row) => ({
      id: row.id as string,
      heading: row.heading as string | null,
      text: row.text as string,
      startOffset: Number(row.start_offset),
      endOffset: Number(row.end_offset),
      hash: row.hash as string,
    }));

    const candidates = generateRuleCandidates(chunkMap, sourceRow.id);

    if (candidates.length > 0) {
      const candidateRows = candidates.map((candidate) => ({
        source_id: sourceRow.id,
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
          { error: "Kunne ikke generere regelutkast" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      id: sourceRow.id,
      url: sourceRow.url,
      domain: sourceRow.domain,
      title: sourceRow.title,
      fetchedHtml: sourceRow.fetched_html,
      extractedText: sourceRow.extracted_text,
      fetchedAt: sourceRow.fetched_at,
      fetchStatus: sourceRow.fetch_status,
      fetchError: sourceRow.fetch_error,
      contentHash: sourceRow.content_hash,
      status: sourceRow.status,
      category: sourceRow.category,
      tags: sourceRow.tags || [],
      internalNotes: sourceRow.internal_notes || "",
      curatorSummary: sourceRow.curator_summary || "",
      createdAt: sourceRow.created_at,
      updatedAt: sourceRow.updated_at,
      reviewFlags: sourceRow.review_flags,
      keyExcerpts: sourceRow.key_excerpts || [],
      relatedFlows: sourceRow.related_flows || [],
      chunksCreated: chunkMap.length,
      candidatesCreated: candidates.length,
    });
  } catch (error) {
    console.error("Add source error:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente og lagre kilde" },
      { status: 500 },
    );
  }
}
