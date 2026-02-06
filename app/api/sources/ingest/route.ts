import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_DOMAINS } from "@/lib/sources/types";
import { chunkText, extractReadableText, extractTitle, hashContent } from "@/lib/sources/ingest";

const MAX_HTML_LENGTH = 100000;
const MAX_TEXT_LENGTH = 50000;
const FETCH_TIMEOUT_MS = 15000;

function toSourcePayload(row: Record<string, unknown>) {
  return {
    id: row.id,
    url: row.url,
    domain: row.domain,
    title: row.title,
    status: row.fetch_status,
    fetched_at: row.fetched_at,
    error: row.error,
  };
}

export async function POST(request: Request) {
  let sourceId: string | null = null;
  const supabase = await createClient();

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ ok: false, error: "URL er påkrevd" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ ok: false, error: "Ugyldig URL-format" }, { status: 400 });
    }

    const domain = parsedUrl.hostname.replace("www.", "");
    const isAllowed = ALLOWED_DOMAINS.some(
      (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          ok: false,
          error: `Domenet ${domain} er ikke støttet. Tillatte domener: ${ALLOWED_DOMAINS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const { data: existing } = await supabase
      .from("sources")
      .select("id")
      .eq("url", url)
      .maybeSingle();

    const upsertPayload = {
      url,
      domain,
      fetch_status: "fetching",
      error: null,
      fetch_error: null,
      fetched_at: null,
      content_hash: null,
      status: "ubehandlet",
    };

    let sourceRow: Record<string, unknown> | null = null;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("sources")
        .update(upsertPayload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) throw new Error(`Kunne ikke oppdatere kilde: ${error.message}`);
      sourceRow = data as Record<string, unknown>;
    } else {
      const { data, error } = await supabase
        .from("sources")
        .insert({
          ...upsertPayload,
          title: null,
          extracted_text: null,
          fetched_html: null,
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
        .select("*")
        .single();

      if (error) throw new Error(`Kunne ikke opprette kilde: ${error.message}`);
      sourceRow = data as Record<string, unknown>;
    }

    sourceId = String(sourceRow.id);

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

    let html = "";
    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "byggesak-guide/1.0 (+https://oslo.kommune.no)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        throw new Error(`Nettsted svarte med ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        throw new Error(`Kun HTML støttes (fikk ${contentType || "ukjent"})`);
      }

      html = await response.text();
    } finally {
      clearTimeout(timeout);
    }

    const title = extractTitle(html);
    const extractedText = extractReadableText(html).slice(0, MAX_TEXT_LENGTH);

    if (!extractedText.trim()) {
      throw new Error("Fant ingen lesbar hovedtekst i dokumentet");
    }

    const contentHash = hashContent(extractedText);
    const now = new Date().toISOString();

    const { data: updatedSource, error: sourceUpdateError } = await supabase
      .from("sources")
      .update({
        title,
        fetched_html: html.slice(0, MAX_HTML_LENGTH),
        extracted_text: extractedText,
        fetched_at: now,
        fetch_status: "fetched",
        error: null,
        fetch_error: null,
        content_hash: contentHash,
      })
      .eq("id", sourceId)
      .select("*")
      .single();

    if (sourceUpdateError || !updatedSource) {
      throw new Error("Kunne ikke lagre hentet innhold");
    }

    const { error: deleteChunkError } = await supabase
      .from("source_chunks")
      .delete()
      .eq("source_id", sourceId);

    if (deleteChunkError) {
      throw new Error("Kunne ikke oppdatere tekstblokker");
    }

    const chunks = chunkText(extractedText);
    const chunkRows = chunks.map((chunk, index) => ({
      source_id: sourceId,
      ordinal: index + 1,
      heading: chunk.heading,
      text: chunk.text,
      start_offset: chunk.startOffset,
      end_offset: chunk.endOffset,
      hash: chunk.hash,
    }));

    if (chunkRows.length > 0) {
      const { error: insertChunkError } = await supabase
        .from("source_chunks")
        .insert(chunkRows);

      if (insertChunkError) {
        throw new Error("Kunne ikke lagre tekstblokker i databasen");
      }
    }

    return NextResponse.json({
      ok: true,
      source: toSourcePayload(updatedSource as Record<string, unknown>),
      chunks_created: chunkRows.length,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Tidsavbrudd ved henting av kilde"
          : error.message
        : "Ukjent feil ved ingest";

    if (sourceId) {
      await supabase
        .from("sources")
        .update({ fetch_status: "failed", error: message, fetch_error: message })
        .eq("id", sourceId);

      const { data: failedRow } = await supabase
        .from("sources")
        .select("*")
        .eq("id", sourceId)
        .single();

      return NextResponse.json(
        {
          ok: false,
          source: failedRow ? toSourcePayload(failedRow as Record<string, unknown>) : null,
          chunks_created: 0,
          error: message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
