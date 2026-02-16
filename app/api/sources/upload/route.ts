import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chunkText, extractReadableText, extractTitle, hashContent } from "@/lib/sources/ingest";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_HTML_LENGTH = 100000;
const MAX_TEXT_LENGTH = 50000;

const SUPPORTED_TYPES = new Set([
  "text/plain",
  "text/html",
  "text/markdown",
  "application/xhtml+xml",
]);

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

function isHtmlType(type: string, name: string) {
  const lowerName = name.toLowerCase();
  return type.includes("html") || lowerName.endsWith(".html") || lowerName.endsWith(".htm");
}

export async function POST(request: Request) {
  let sourceId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  try {
    supabase = await createClient();

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Fil mangler" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ ok: false, error: "Filen er tom" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Filen er for stor (maks 2 MB)" },
        { status: 400 },
      );
    }

    const fileType = file.type || "";
    const fileName = file.name || "opplastet-kilde";

    if (!SUPPORTED_TYPES.has(fileType) && !fileName.toLowerCase().match(/\.(txt|md|html|htm)$/)) {
      return NextResponse.json(
        { ok: false, error: "Kun txt, md og html-filer støttes" },
        { status: 415 },
      );
    }

    const rawText = await file.text();
    const extractedText = (isHtmlType(fileType, fileName) ? extractReadableText(rawText) : rawText)
      .trim()
      .slice(0, MAX_TEXT_LENGTH);

    if (!extractedText) {
      return NextResponse.json(
        { ok: false, error: "Fant ingen lesbar tekst i filen" },
        { status: 422 },
      );
    }

    const title = isHtmlType(fileType, fileName) ? extractTitle(rawText) : fileName;
    const contentHash = hashContent(extractedText);
    const url = `local-upload://${encodeURIComponent(fileName)}-${contentHash.slice(0, 12)}`;

    const { data: existing } = await supabase
      .from("sources")
      .select("id")
      .eq("url", url)
      .maybeSingle();

    const upsertPayload = {
      url,
      domain: "lokal-fil",
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

    const now = new Date().toISOString();

    const { data: updatedSource, error: sourceUpdateError } = await supabase
      .from("sources")
      .update({
        title,
        fetched_html: isHtmlType(fileType, fileName) ? rawText.slice(0, MAX_HTML_LENGTH) : null,
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
      throw new Error("Kunne ikke lagre opplastet innhold");
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
    const message = error instanceof Error ? error.message : "Ukjent feil ved filopplasting";

    if (sourceId && supabase) {
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
