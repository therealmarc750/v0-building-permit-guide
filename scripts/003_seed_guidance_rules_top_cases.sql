-- Seed top 10 common cases with safe default rules for prototype use.
-- These rules are intentionally conservative ("avhenger") and can be
-- overridden by more specific rules with lower priority values.

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
  'Garasje/carport - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Standardregel for garasje/carport. Krever ofte vurdering av areal, avstand og høyde. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
),
(
  'tilbygg',
  'Tilbygg - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Tilbygg vurderes ofte ut fra areal, utnyttelse og avstand. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
),
(
  'paabygg',
  'Påbygg - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Påbygg påvirker høyde og volum og krever som regel nærmere vurdering. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
),
(
  'terrasse',
  'Terrasse/veranda - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Terrasser vurderes ofte ut fra høyde over terreng og avstand. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
),
(
  'bod',
  'Bod/uthus/anneks - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Små frittstående bygg vurderes ofte ut fra areal, høyde og plassering. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
),
(
  'fasadeendring',
  'Fasadeendring - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Fasadeendringer må vurderes opp mot vesentlig utseende og eventuelle vernekrav. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
),
(
  'takendring',
  'Takendring - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Takendringer kan påvirke høyde, volum og estetikk. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
),
(
  'stottemur',
  'Støttemur/gjerde - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Støttemur og gjerder vurderes ofte ut fra høyde og terrengendring. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
),
(
  'bruksendring',
  'Bruksendring - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Bruksendring krever ofte dokumentasjon av TEK-krav, lys og rømningsvei. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
),
(
  'riving',
  'Rivning - standard vurdering (prototype)',
  '{}'::jsonb,
  'avhenger',
  'Rivning kan kreve søknad og dokumentasjon av avfallshåndtering. Denne regelen er en trygg prototyp-standard og overstyres av mer spesifikke regler.',
  ARRAY[]::uuid[],
  999,
  TRUE
)
ON CONFLICT DO NOTHING;
