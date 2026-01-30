-- Create guidance_rules table for rule-based decision engine
CREATE TABLE IF NOT EXISTS guidance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type TEXT NOT NULL,                    -- e.g. 'garasje', 'tilbygg'
  title TEXT NOT NULL,                           -- Human-readable rule name
  conditions JSONB NOT NULL DEFAULT '{}'::JSONB, -- Rule conditions (and/or tree)
  outcome TEXT NOT NULL CHECK (outcome IN ('søknadspliktig', 'unntatt', 'avhenger')),
  explanation TEXT NOT NULL,                     -- Why this outcome applies
  source_ids UUID[] NOT NULL DEFAULT '{}'::UUID[], -- References to sources table
  priority INT NOT NULL DEFAULT 100,             -- Lower = checked first
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_guidance_rules_project_type ON guidance_rules(project_type);
CREATE INDEX IF NOT EXISTS idx_guidance_rules_is_active ON guidance_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_guidance_rules_priority ON guidance_rules(priority);

-- Reuse existing updated_at trigger function
DROP TRIGGER IF EXISTS update_guidance_rules_updated_at ON guidance_rules;
CREATE TRIGGER update_guidance_rules_updated_at
  BEFORE UPDATE ON guidance_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed rules for project_type = 'garasje'
-- Rule 1: AND condition - small garage exempt (area <= 50 AND distance >= 1.0)
INSERT INTO guidance_rules (project_type, title, conditions, outcome, explanation, source_ids, priority)
VALUES (
  'garasje',
  'Liten frittliggende garasje unntatt søknadsplikt',
  '{
    "and": [
      {"field": "area_m2", "op": "<=", "value": 50},
      {"field": "distance_to_boundary_m", "op": ">=", "value": 1.0},
      {"field": "height_m", "op": "<=", "value": 4.0},
      {"field": "is_detached", "op": "==", "value": true}
    ]
  }'::JSONB,
  'unntatt',
  'Frittliggende garasje på inntil 50 m² som er plassert minst 1 meter fra nabogrense og har mønehøyde under 4 meter, er unntatt fra søknadsplikt etter SAK10 § 4-1.',
  ARRAY[]::UUID[],  -- Will update with real source_ids after checking existing sources
  10
);

-- Rule 2: AND condition - larger garage requires application
INSERT INTO guidance_rules (project_type, title, conditions, outcome, explanation, source_ids, priority)
VALUES (
  'garasje',
  'Større garasje krever søknad',
  '{
    "and": [
      {"field": "area_m2", "op": ">", "value": 50}
    ]
  }'::JSONB,
  'søknadspliktig',
  'Garasje over 50 m² er søknadspliktig etter plan- og bygningsloven § 20-2. Du må sende byggesøknad til kommunen.',
  ARRAY[]::UUID[],
  20
);

-- Rule 3: OR condition - multiple disqualifying factors
INSERT INTO guidance_rules (project_type, title, conditions, outcome, explanation, source_ids, priority)
VALUES (
  'garasje',
  'Garasje nær nabogrense eller for høy krever søknad',
  '{
    "or": [
      {"field": "distance_to_boundary_m", "op": "<", "value": 1.0},
      {"field": "height_m", "op": ">", "value": 4.0}
    ]
  }'::JSONB,
  'søknadspliktig',
  'Garasje plassert nærmere enn 1 meter fra nabogrense, eller med høyde over 4 meter, er søknadspliktig. Du må ha nabosamtykke eller dispensasjon for plassering nærmere enn 1 meter.',
  ARRAY[]::UUID[],
  15
);

-- Rule 4: Fallback rule - uncertain cases
INSERT INTO guidance_rules (project_type, title, conditions, outcome, explanation, source_ids, priority)
VALUES (
  'garasje',
  'Vurdering avhenger av flere faktorer',
  '{
    "and": [
      {"field": "in_regulated_area", "op": "==", "value": true}
    ]
  }'::JSONB,
  'avhenger',
  'Din eiendom ligger i et regulert område. Sjekk reguleringsplanen for din eiendom for eventuelle begrensninger på bebygd areal, plassering eller utforming.',
  ARRAY[]::UUID[],
  50
);

-- Update source_ids with actual IDs from sources table (if they exist)
UPDATE guidance_rules 
SET source_ids = (
  SELECT ARRAY_AGG(id) 
  FROM sources 
  WHERE status = 'godkjent' 
    AND 'garasje' = ANY(related_flows)
  LIMIT 2
)
WHERE project_type = 'garasje' AND source_ids = '{}'::UUID[];
