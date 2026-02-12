-- Align ingest schema with production pipeline expectations.

-- Ensure source URL is unique for idempotent ingest when data allows it.
DO $$
DECLARE
  duplicate_count INT;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT url FROM sources GROUP BY url HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_url_unique ON sources(url);
  END IF;
END $$;

-- Align ingest status values expected by UI/API
ALTER TABLE sources
  DROP CONSTRAINT IF EXISTS sources_fetch_status_check;

UPDATE sources
SET fetch_status = CASE
  WHEN fetch_status = 'pending' THEN 'queued'
  WHEN fetch_status IS NULL THEN 'queued'
  ELSE fetch_status
END;

ALTER TABLE sources
  ADD CONSTRAINT sources_fetch_status_check
  CHECK (fetch_status IN ('queued', 'fetching', 'fetched', 'failed'));

ALTER TABLE sources
  ALTER COLUMN fetch_status SET DEFAULT 'queued';

-- API expects a generic error column
ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS error TEXT;

UPDATE sources
SET error = COALESCE(error, fetch_error)
WHERE fetch_error IS NOT NULL;

-- Chunks need stable ordering
ALTER TABLE source_chunks
  ADD COLUMN IF NOT EXISTS ordinal INT;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY source_id ORDER BY created_at, id) AS ord
  FROM source_chunks
)
UPDATE source_chunks sc
SET ordinal = ordered.ord
FROM ordered
WHERE sc.id = ordered.id AND sc.ordinal IS NULL;

ALTER TABLE source_chunks
  ALTER COLUMN ordinal SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_source_chunks_source_id_ordinal ON source_chunks(source_id, ordinal);
