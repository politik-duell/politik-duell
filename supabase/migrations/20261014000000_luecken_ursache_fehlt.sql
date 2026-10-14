-- Politik-Duell – Lücken: „Nichts davon passt“ (docs/plan-zuordnung.md)
--
-- Wählt jemand in der Bestätigung „Nichts davon passt“, speichert die Edge Function `analyse` die Runde als
-- `ungeprueft` mit Thema: Das Thema ist bekannt, aber keine erfasste Ursache trifft das geschilderte Problem.
-- Die Sicht `luecken` zählt solche Runden als neue Art je Thema:
--   ursache_fehlt              Thema erkannt, keine passende Ursache      → Ursache ergänzen (/thema-erfassen <thema_id>)
-- Sonst unverändert gegenüber 20261013000000_luecken_kennzahlen.sql (gleiche Spalten, Rechte bleiben erhalten).
create or replace view public.luecken
with (security_invoker = true)
as
with einordnung as (
  select
    case
      when status = 'ungeprueft' and thema_id is null then 'kein_thema'
      when status = 'ungeprueft' and thema_id is not null then 'ursache_fehlt'
      when status = 'unvollstaendig' then 'unvollstaendig'
      when status = 'forderung' and thema_id is not null and instrument_id is null then 'forderung_ohne_loesungsweg'
      when status = 'forderung' and thema_id is null then 'forderung_ohne_thema'
      when status = 'wert' and haltung_id is null then 'haltung_ohne_karte'
    end as art,
    thema_id,
    -- Ohne Thema wird nach Stichwort gezählt; Groß- und Kleinschreibung und Leerzeichen spielen keine Rolle.
    case when thema_id is null then nullif(lower(btrim(stichwort)), '') end as stichwort,
    created_at,
    testphase
  from public.runden
  where public.ist_admin()
)
select
  art,
  thema_id,
  stichwort,
  count(*) filter (where created_at >= now() - interval '30 days')::int as anzahl_30_tage,
  count(*)::int as anzahl,
  count(*) filter (where testphase)::int as anzahl_testphase,
  max(created_at) as zuletzt
from einordnung
where art is not null
group by art, thema_id, stichwort;
