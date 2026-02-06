-- Extend sources for ingest status + hashes
ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fetch_status TEXT DEFAULT 'pending' CHECK (fetch_status IN ('pending', 'fetched', 'failed')),
  ADD COLUMN IF NOT EXISTS fetch_error TEXT,
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_sources_fetch_status ON sources(fetch_status);

-- Store paragraph-level chunks
CREATE TABLE IF NOT EXISTS source_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  heading TEXT,
  text TEXT NOT NULL,
  start_offset INT,
  end_offset INT,
  hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_chunks_source_id ON source_chunks(source_id);

-- Store rule candidates generated from chunks
CREATE TABLE IF NOT EXISTS rule_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  chunk_id UUID NOT NULL REFERENCES source_chunks(id) ON DELETE CASCADE,
  project_type TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('søknadspliktig', 'unntatt', 'avhenger')),
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rule_candidates_source_id ON rule_candidates(source_id);
CREATE INDEX IF NOT EXISTS idx_rule_candidates_status ON rule_candidates(status);

-- Extend guidance rules with citations
ALTER TABLE guidance_rules
  ADD COLUMN IF NOT EXISTS citations JSONB NOT NULL DEFAULT '[]'::jsonb;
