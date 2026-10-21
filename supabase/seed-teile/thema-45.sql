-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
-- Teil von supabase/seed.sql: Thema 45 „Klimaschutz“ – Instrumente, Maßnahmen, Prüfeinheiten, Abdeckung.
-- Nach 0-gemeinsam.sql ausführen. Mehrfach ausführbar, gespielte Runden bleiben erhalten.

begin;

delete from public.massnahmen where thema_id = 45;
delete from public.abdeckung where thema_id = 45;
delete from public.pruef_einheiten where thema_id = 45;

delete from public.instrumente where thema_id = 45 and id not in (0);

commit;
