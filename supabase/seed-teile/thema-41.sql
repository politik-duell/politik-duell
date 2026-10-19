-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
-- Teil von supabase/seed.sql: Thema 41 „Schutz im Krisen- und Kriegsfall“ – Instrumente, Maßnahmen, Prüfeinheiten, Abdeckung.
-- Nach 0-gemeinsam.sql ausführen. Mehrfach ausführbar, gespielte Runden bleiben erhalten.

begin;

delete from public.massnahmen where thema_id = 41;
delete from public.abdeckung where thema_id = 41;
delete from public.pruef_einheiten where thema_id = 41;

delete from public.instrumente where thema_id = 41 and id not in (0);

commit;
