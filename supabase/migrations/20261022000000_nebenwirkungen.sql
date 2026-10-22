-- Folgen über das Thema hinaus (docs/plan-nebenwirkungen.md): belegte Hinweise je Lösungsweg, ohne Punkte.
-- Liste aus { bereich, richtung, text, quelle_url, belegstufe, zweite_quelle_url? }; leere Liste = geprüft,
-- nichts Wesentliches belegt; null = noch nicht geprüft. Bei Maßnahmen mit Instrument steht hier dessen Liste.
alter table public.instrumente add column if not exists nebenwirkungen jsonb;
alter table public.massnahmen add column if not exists nebenwirkungen jsonb;
