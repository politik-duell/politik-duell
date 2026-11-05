-- Politik-Duell – Keine Spieleingaben mehr speichern; Themenvorschläge (docs/datenmodell.md, docs/methode.md)
--
-- Datenschutz (Art. 9 DSGVO) und Transparenz (KI-Verordnung): Was jemand ins Sprach- oder Textfeld eingibt, wird
-- nur für die Einordnung an die KI geschickt und danach nirgends gespeichert – weder im Wortlaut noch als
-- Kurzfassung, Stichwort, Thema oder Punktestand. Deshalb entfallen samt allen bisher gespeicherten Einträgen:
--   runden                 abgeschlossene Runden (Kurzfassung, Stichwort, Thema, Parteien, Punkte)
--   review_warteschlange   Probleme ohne Thema
--   review_eingaben        Eingaben ohne Wertung im Wortlaut (30 Tage)
--   luecken, kennzahlen_woche   Zählungen aus `runden` für die Admin-Ansicht
--
-- Stattdessen: Wer ein Thema vermisst, kann es ausdrücklich vorschlagen (Knopf „Thema vorschlagen“). Der Vorschlag
-- geht ohne KI über die Edge Function `vorschlag` in `themen_vorschlaege` – ohne Verbindung zu einer Runde, ohne
-- Parteien, Sitzung oder IP. Texte mit Kontaktdaten, Namen, Beleidigungen oder Hetze nimmt die Funktion gar nicht
-- erst an (Wortfilter _shared/moderation.ts), die Person kann umformulieren. Nur Admins lesen ihn; abgehakt wird
-- er in der Admin-Ansicht, gelöscht spätestens nach 180 Tagen.

-- ---------------------------------------------------------------------------
-- Alte Speicherung entfernen
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute $q$select cron.unschedule(jobid) from cron.job where jobname = 'review_eingaben_aufraeumen'$q$;
  end if;
end;
$$;

drop view if exists public.luecken;
drop view if exists public.kennzahlen_woche;
drop table if exists public.review_eingaben;
drop table if exists public.review_warteschlange;
drop table if exists public.runden;
drop function if exists public.review_eingaben_nach_einfuegen();
drop function if exists public.review_eingaben_aufraeumen();

-- ---------------------------------------------------------------------------
-- Themenvorschläge
-- ---------------------------------------------------------------------------

create table public.themen_vorschlaege (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  -- Der Vorschlag im Wortlaut, wie die Person ihn abgeschickt hat
  text        text not null check (char_length(btrim(text)) between 3 and 500),
  -- Gesichtet bzw. in den Katalog übernommen (Admin-Ansicht oder Auswertung)
  erledigt    boolean not null default false
);

create index on public.themen_vorschlaege (created_at desc);

alter table public.themen_vorschlaege enable row level security;

create policy "Admins lesen Themenvorschläge" on public.themen_vorschlaege
  for select to authenticated using (public.ist_admin());
create policy "Admins haken Themenvorschläge ab" on public.themen_vorschlaege
  for update to authenticated using (public.ist_admin()) with check (public.ist_admin());
create policy "Admins löschen Themenvorschläge" on public.themen_vorschlaege
  for delete to authenticated using (public.ist_admin());

-- Schreiben nur mit dem Service-Role-Key (Edge Function `vorschlag`); Admins ändern nur `erledigt`.
revoke all on public.themen_vorschlaege from anon;
revoke insert, update on public.themen_vorschlaege from authenticated;
grant update (erledigt) on public.themen_vorschlaege to authenticated;

-- Speicherfrist: 180 Tage (bei jedem neuen Vorschlag und, falls pg_cron aktiv ist, täglich)
create or replace function public.themen_vorschlaege_aufraeumen()
returns void
language sql
security definer
set search_path = public
as $$
  delete from themen_vorschlaege where created_at < now() - interval '180 days';
$$;

revoke all on function public.themen_vorschlaege_aufraeumen() from public, anon, authenticated;

create or replace function public.themen_vorschlaege_nach_einfuegen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform themen_vorschlaege_aufraeumen();
  return null;
end;
$$;

create trigger themen_vorschlaege_frist
  after insert on public.themen_vorschlaege
  for each statement execute function public.themen_vorschlaege_nach_einfuegen();

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('themen_vorschlaege_aufraeumen', '23 3 * * *', 'select public.themen_vorschlaege_aufraeumen()');
  end if;
end;
$$;

-- Admin-Ansicht bekommt neue Vorschläge live (Realtime beachtet Row Level Security).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.themen_vorschlaege;
  end if;
end;
$$;
