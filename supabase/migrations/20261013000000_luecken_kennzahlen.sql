-- Politik-Duell – Lücken und Kennzahlen für die Admin-Ansicht (Reiter „Lücken“)
--
-- Beide Sichten zählen nur Runden aus `runden` (dort steht kein Wortlaut, nur Kurzfassung und Stichwort der KI)
-- und geben nur Zahlen je Thema bzw. Stichwort zurück, keine einzelnen Runden. Anders als `review_eingaben`
-- (30 Tage) bleiben die Zahlen deshalb erhalten. Lesen dürfen nur Admins: security_invoker wendet die Row Level
-- Security von `runden` an, `ist_admin()` schließt angemeldete Nicht-Admins aus, anon hat keinen Zugriff.

-- Wo das Spiel keine Wertung liefern konnte – Grundlage für die Reihenfolge der Erfassung.
--   kein_thema                 Problem ohne passendes Thema               → /thema-anlegen (Stichwort)
--   unvollstaendig             Thema erkannt, eine Partei nicht erfasst   → /thema-erfassen <thema_id>
--   forderung_ohne_loesungsweg Forderung zu einem Thema ohne Instrument   → /forderung-erfassen
--   forderung_ohne_thema       Forderung ohne erkennbares Thema           → /thema-anlegen (Stichwort)
--   haltung_ohne_karte         Haltung ohne erfasste Wertfrage            → /haltung-anlegen (Stichwort)
-- Grenzfälle zählen nicht: Sie sind keine Lücke im Katalog.
create view public.luecken
with (security_invoker = true)
as
with einordnung as (
  select
    case
      when status = 'ungeprueft' and thema_id is null then 'kein_thema'
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

-- Runden je Woche (Montag, deutsche Zeit) und Testphase, nach Status. Die Quoten rechnet die Admin-Ansicht
-- (src/admin/kennzahlen.ts), damit sich Wochen und Testphase frei zusammenfassen lassen.
create view public.kennzahlen_woche
with (security_invoker = true)
as
select
  date_trunc('week', created_at at time zone 'Europe/Berlin')::date as woche,
  testphase,
  count(*)::int as runden,
  count(*) filter (where status = 'gewertet')::int as gewertet,
  count(*) filter (where status = 'unvollstaendig')::int as unvollstaendig,
  count(*) filter (where status = 'ungeprueft')::int as ungeprueft,
  count(*) filter (where status = 'forderung')::int as forderung,
  count(*) filter (where status = 'forderung' and instrument_id is not null)::int as forderung_mit_karte,
  count(*) filter (where status = 'wert')::int as wert,
  count(*) filter (where status = 'wert' and haltung_id is not null)::int as wert_mit_karte,
  count(*) filter (where status = 'grenze')::int as grenze
from public.runden
where public.ist_admin()
group by 1, 2;

revoke all on public.luecken, public.kennzahlen_woche from anon, authenticated;
grant select on public.luecken, public.kennzahlen_woche to authenticated;
