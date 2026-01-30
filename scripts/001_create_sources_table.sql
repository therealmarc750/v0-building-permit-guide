-- Create sources table for Kildebibliotek
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  fetched_html TEXT,
  extracted_text TEXT,
  status TEXT NOT NULL DEFAULT 'ubehandlet' CHECK (status IN ('ubehandlet', 'godkjent', 'avvist')),
  category TEXT CHECK (category IS NULL OR category IN ('lov', 'forskrift', 'veileder', 'rundskriv', 'tolkningsuttalelse', 'annet')),
  tags TEXT[] DEFAULT '{}',
  internal_notes TEXT DEFAULT '',
  curator_summary TEXT DEFAULT '',
  review_flags JSONB DEFAULT '{"is_official": false, "is_relevant": false, "has_clear_rules": false, "is_current": false}',
  key_excerpts TEXT[] DEFAULT '{}',
  related_flows TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_sources_status ON sources(status);

-- Create index on domain for filtering
CREATE INDEX IF NOT EXISTS idx_sources_domain ON sources(domain);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sources_updated_at ON sources;
CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO sources (url, domain, title, fetched_html, extracted_text, status, category, tags, internal_notes, curator_summary, review_flags, key_excerpts, related_flows)
VALUES 
(
  'https://dibk.no/regelverk/byggteknisk-forskrift-tek17/',
  'dibk.no',
  'Byggteknisk forskrift (TEK17)',
  '<html><body><h1>TEK17</h1><p>Byggteknisk forskrift fastsetter tekniske krav til byggverk.</p></body></html>',
  E'Byggteknisk forskrift (TEK17) fastsetter tekniske krav til byggverk.\n\nForskriften gjelder for oppføring av nye byggverk og for hovedombygging av eksisterende byggverk.\n\nKravene skal sikre at tiltak planlegges, prosjekteres og utføres slik at det oppnås tilfredsstillende sikkerhet, helse, miljø og tilgjengelighet.',
  'godkjent',
  'forskrift',
  ARRAY['TEK17', 'byggteknisk'],
  'Hovedforskrift for tekniske krav',
  'TEK17 er den gjeldende byggtekniske forskriften som stiller minimumskrav til byggverk.',
  '{"is_official": true, "is_relevant": true, "has_clear_rules": true, "is_current": true}',
  ARRAY['Kravene skal sikre at tiltak planlegges, prosjekteres og utføres slik at det oppnås tilfredsstillende sikkerhet'],
  ARRAY['garasje', 'tilbygg', 'fasadeendring']
),
(
  'https://oslo.kommune.no/plan-bygg-og-eiendom/byggesaksveiledere/',
  'oslo.kommune.no',
  'Byggesaksveiledere - Oslo kommune',
  '<html><body><h1>Byggesaksveiledere</h1><p>Oslo kommune har utarbeidet veiledere for ulike typer byggesaker.</p></body></html>',
  E'Oslo kommune har utarbeidet veiledere for ulike typer byggesaker for å hjelpe deg gjennom søknadsprosessen.\n\nHer finner du informasjon om hva du kan bygge uten å søke, hva som krever søknad, og hvordan du går frem for å søke.',
  'ubehandlet',
  'veileder',
  ARRAY['Oslo', 'veileder'],
  '',
  '',
  '{"is_official": true, "is_relevant": false, "has_clear_rules": false, "is_current": false}',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
),
(
  'https://dibk.no/regelverk/sak/',
  'dibk.no',
  'Byggesaksforskriften (SAK10)',
  '<html><body><h1>SAK10</h1><p>Forskrift om byggesak regulerer saksbehandlingsregler.</p></body></html>',
  E'Forskrift om byggesak (byggesaksforskriften) regulerer saksbehandling, ansvar, kontroll og tilsyn i byggesaker.\n\nForskriften utfyller plan- og bygningslovens bestemmelser og gir detaljerte regler for hvordan byggesaker skal behandles.',
  'godkjent',
  'forskrift',
  ARRAY['SAK10', 'saksbehandling'],
  'Viktig for prosessregler',
  'SAK10 regulerer saksbehandlingsregler, ansvar og kontroll i byggesaker.',
  '{"is_official": true, "is_relevant": true, "has_clear_rules": true, "is_current": true}',
  ARRAY['Forskriften utfyller plan- og bygningslovens bestemmelser'],
  ARRAY['garasje', 'tilbygg']
)
ON CONFLICT DO NOTHING;
