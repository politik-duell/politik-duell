-- Politik-Duell – KI-Entwürfe öffentlich (Alpha/Beta, CLAUDE.md Grundprinzip 2)
--
-- In der Entwicklungsphase zählen KI-Entwürfe auch ohne Zugangslink – mit deutlichem Hinweis am Ergebnis.
-- Ein Schalter für alles: `einstellungen.ki_entwuerfe_oeffentlich`. Ausgeliefert ist er AUS; diese Migration
-- ändert also nichts, bis ein Admin ihn einschaltet:
--   update public.einstellungen set ki_entwuerfe_oeffentlich = true;
-- Dann lesen alle Maßnahmen, Abdeckung, Instrumente und Haltungspositionen auch als Entwurf, und die Edge
-- Function `analyse` wertet mit Entwürfen. Zurück: denselben Befehl mit `false`.

create table public.einstellungen (
  id                        boolean primary key default true check (id),   -- genau eine Zeile
  ki_entwuerfe_oeffentlich  boolean not null default false
);
insert into public.einstellungen default values;
alter table public.einstellungen enable row level security;

create policy "Einstellungen lesen"         on public.einstellungen for select to anon, authenticated using (true);
create policy "Admins ändern Einstellungen" on public.einstellungen for update to authenticated using (public.ist_admin()) with check (public.ist_admin());
revoke insert, delete, update on public.einstellungen from anon, authenticated;
grant update (ki_entwuerfe_oeffentlich) on public.einstellungen to authenticated;

create or replace function public.ki_entwuerfe_oeffentlich()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select ki_entwuerfe_oeffentlich from einstellungen), false);
$$;
revoke all on function public.ki_entwuerfe_oeffentlich() from public;
grant execute on function public.ki_entwuerfe_oeffentlich() to anon, authenticated;

drop policy "Maßnahmen lesen" on public.massnahmen;
create policy "Maßnahmen lesen" on public.massnahmen for select to anon, authenticated
  using (not ki_entwurf or public.ki_entwuerfe_oeffentlich());
drop policy "Abdeckung lesen" on public.abdeckung;
create policy "Abdeckung lesen" on public.abdeckung for select to anon, authenticated
  using (not ki_entwurf or public.ki_entwuerfe_oeffentlich());
drop policy "Instrumente lesen" on public.instrumente;
create policy "Instrumente lesen" on public.instrumente for select to anon, authenticated
  using (not ki_entwurf or public.ki_entwuerfe_oeffentlich());
drop policy "Positionen lesen" on public.haltung_positionen;
create policy "Positionen lesen" on public.haltung_positionen for select to anon, authenticated
  using (not ki_entwurf or public.ki_entwuerfe_oeffentlich());
