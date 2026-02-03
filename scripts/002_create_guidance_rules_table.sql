-- Create guidance rules table for decision layer
CREATE TABLE IF NOT EXISTS guidance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type TEXT NOT NULL,
  title TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome TEXT NOT NULL CHECK (outcome IN ('søknadspliktig', 'unntatt', 'avhenger')),
  explanation TEXT NOT NULL,
  source_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  priority INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for filtering and ordering
CREATE INDEX IF NOT EXISTS idx_guidance_rules_project_type ON guidance_rules(project_type);
CREATE INDEX IF NOT EXISTS idx_guidance_rules_is_active ON guidance_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_guidance_rules_priority ON guidance_rules(priority);

-- Seed example rules for garasje
INSERT INTO guidance_rules (
  project_type,
  title,
  conditions,
  outcome,
  explanation,
  source_ids,
  priority,
  is_active
)
VALUES
(
  'garasje',
  'Garasje opptil 50 m² og minst 1 m fra nabogrense',
  '{"and":[{"field":"area_m2","op":"<=","value":50},{"field":"distance_to_boundary_m","op":">=","value":1.0}]}'::jsonb,
  'unntatt',
  'Garasje som er 50 m² eller mindre og plassert minst 1 meter fra nabogrense er unntatt søknadsplikt i denne forenklede regelen.',
  ARRAY['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222']::uuid[],
  10,
  TRUE
),
(
  'garasje',
  'Garasje større enn 50 m²',
  '{"and":[{"field":"area_m2","op":">","value":50}]}'::jsonb,
  'søknadspliktig',
  'Garasje over 50 m² er søknadspliktig i denne forenklede regelen.',
  ARRAY['33333333-3333-3333-3333-333333333333']::uuid[],
  20,
  TRUE
),
(
  'garasje',
  'Garasje nær nabogrense eller høyde over 4 m',
  '{"or":[{"field":"distance_to_boundary_m","op":"<","value":1.0},{"field":"height_m","op":">","value":4}]}'::jsonb,
  'avhenger',
  'Garasje som plasseres nærmere enn 1 meter fra nabogrensen eller er høyere enn 4 meter må vurderes nærmere.',
  ARRAY['44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555']::uuid[],
  30,
  TRUE
)
ON CONFLICT DO NOTHING;
