-- Symptomgruppen (docs/plan-symptome.md): Folgen, die mehrere Ursachen eines Themas gemeinsam haben. Nennt eine
-- Person nur die Folge, zählen alle Ursachen der Gruppe. Liste aus { nr, alltag, ursachen_ids, ki_entwurf? }.
alter table public.themen add column if not exists symptome jsonb not null default '[]'::jsonb;

-- Lage, für die eine Ursache gilt („Hausarztpraxen, nicht Fachärzte“): Grundlage für „passt nur teilweise“.
alter table public.ursachen add column if not exists gilt_fuer text;
