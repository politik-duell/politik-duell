-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
-- Teil von supabase/seed.sql: Thema 35 „Kosten für den Führerschein“ – Instrumente, Maßnahmen, Prüfeinheiten, Abdeckung.
-- Nach 0-gemeinsam.sql ausführen. Mehrfach ausführbar, gespielte Runden bleiben erhalten.

begin;

delete from public.massnahmen where thema_id = 35;
delete from public.abdeckung where thema_id = 35;
delete from public.pruef_einheiten where thema_id = 35;

-- Lösungswege für die Forderungskarte (ohne Punkte). Upsert, damit gespeicherte Forderungen ihren Verweis behalten.
insert into public.instrumente (id, thema_id, name, begruendung, evidenz, beleg_studie_url, ebene, entspricht, ki_entwurf, entwurf_herkunft, nebenwirkungen) values
  (9944, 35, 'Finanzielle Förderung des Führerscheinerwerbs für junge Menschen (Bund)', 'Entlastet einzelne Gruppen bei den Kosten, senkt aber weder Preise noch Wiederholungsprüfungen; ohne mehr Wettbewerb kann ein Zuschuss teilweise in Preisen aufgehen. Bund kann finanzieren, Haushaltsmittel nötig.', 'offen', null, 'bund', null, true, 'blind', null),
  (9945, 35, 'Ausbildung entlasten: digitale Theorie, Simulatoren, keine Tagesgrenze (Bund)', 'Setzt direkt an Ausbildungsaufwand und Kosten an, per Verordnung änderbar. Der Kosteneffekt von Digitaltheorie und Simulatoren ist kaum untersucht; Preise bestimmen weiter die Fahrschulen.', 'offen', null, 'bund', null, true, 'blind', null)
on conflict (id) do update set thema_id = excluded.thema_id, name = excluded.name, begruendung = excluded.begruendung,
  evidenz = excluded.evidenz, beleg_studie_url = excluded.beleg_studie_url, ebene = excluded.ebene,
  entspricht = excluded.entspricht, ki_entwurf = excluded.ki_entwurf, entwurf_herkunft = excluded.entwurf_herkunft,
  nebenwirkungen = excluded.nebenwirkungen;

delete from public.instrumente where thema_id = 35 and id not in (9944, 9945);

insert into public.massnahmen (id, thema_id, partei_id, land, beschreibung, ursachen_ids, instrument_id, wirksamkeit, umsetzbarkeit,
  rollen_modifikator, begruendung, beleg_programm_url, beleg_studie_url, evidenz, stand, geprueft, ki_entwurf, entwurf_herkunft, nebenwirkungen) values
  (9946, 35, 11, null, 'Bürokratie abbauen und die Ausbildung effizient gestalten, damit der Führerschein für junge Menschen bezahlbar bleibt.', '{3501}', null, 1, 3, null, 'Allgemeine Zusage ohne konkrete Schritte; Bürokratieabbau kann Kosten etwas senken, der Effekt auf Fahrschulpreise ist unbestimmt und kaum untersucht.', 'https://www.cdu.de/app/uploads/2025/01/km_btw_2025_wahlprogramm_langfassung_ansicht.pdf#page=74', null, 'offen', '2026-10-14', false, true, 'blind', null),
  (9947, 35, 12, null, 'Fahrausbildung samt Theorieunterricht reformieren, auch mit dem Ziel, die Kosten der Fahrausbildung spürbar zu senken', '{3501,3502}', null, 1, 3, null, 'Benennt Kosten und Durchfallquoten als Anlass, bleibt aber ohne konkrete Änderungen; Wirkung hängt vom Inhalt der Reform ab. Bund kann die Ausbildungsregeln selbst ändern.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=36', null, 'offen', '2026-10-14', false, true, 'blind', null),
  (9948, 35, 12, null, 'Alle Jugendlichen im 17. Lebensjahr erhalten 500 Euro Guthaben, unter anderem für Führerscheinkosten', '{3501}', 9944, 1, 2, null, 'Entlastet einzelne Gruppen bei den Kosten, senkt aber weder Preise noch Wiederholungsprüfungen; ohne mehr Wettbewerb kann ein Zuschuss teilweise in Preisen aufgehen. Bund kann finanzieren, Haushaltsmittel nötig.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=36', null, 'offen', '2026-10-14', false, true, 'blind', null),
  (9949, 35, 12, null, 'Arbeitgeber sollen einen steuer- und abgabenfreien Führerscheinzuschuss bis 2.000 Euro an Auszubildende und junge Beschäftigte zahlen können', '{3501}', 9944, 1, 2, null, 'Entlastet einzelne Gruppen bei den Kosten, senkt aber weder Preise noch Wiederholungsprüfungen; ohne mehr Wettbewerb kann ein Zuschuss teilweise in Preisen aufgehen. Bund kann finanzieren, Haushaltsmittel nötig.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=36', null, 'offen', '2026-10-14', false, true, 'blind', null),
  (9950, 35, 13, null, 'Förderung des Führerscheinerwerbs für Menschen in Ausbildung', '{3501}', 9944, 1, 2, null, 'Entlastet einzelne Gruppen bei den Kosten, senkt aber weder Preise noch Wiederholungsprüfungen; ohne mehr Wettbewerb kann ein Zuschuss teilweise in Preisen aufgehen. Bund kann finanzieren, Haushaltsmittel nötig.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=78', null, 'offen', '2026-10-14', false, true, 'blind', null),
  (9951, 35, 14, null, 'Führerschein sowie Lkw- und Bus-Qualifikation günstiger machen: Obergrenze für Theorieunterricht entfällt, Theorie digital, Fahrsimulatoren in der Ausbildung.', '{3501}', 9945, 2, 3, null, 'Setzt direkt an Ausbildungsaufwand und Kosten an, per Verordnung änderbar. Der Kosteneffekt von Digitaltheorie und Simulatoren ist kaum untersucht; Preise bestimmen weiter die Fahrschulen.', 'https://www.fdp.de/sites/default/files/2024-12/fdp-wahlprogramm_2025.pdf#page=42', null, 'offen', '2026-10-14', false, true, 'blind', null),
  (9952, 35, 14, null, 'Prüfungsmarkt für weitere Anbieter öffnen, Fahrprüfer ohne Ingenieursstudium weiterbilden, mehr Prüftermine und kürzere Wartezeiten.', '{3501}', null, 1, 2, null, 'Mehr Anbieter und Prüfer können Wettbewerb und Termine verbessern; die Prüfgebühr macht aber nur einen kleinen Teil der Gesamtkosten aus. Wirkung kaum untersucht, Umsetzung braucht Bund-Länder-Abstimmung.', 'https://www.fdp.de/sites/default/files/2024-12/fdp-wahlprogramm_2025.pdf#page=42', null, 'offen', '2026-10-14', false, true, 'blind', null);

select setval(pg_get_serial_sequence('public.massnahmen', 'id'), (select max(id) from public.massnahmen));

-- Was Prüfende je Thema bewerten (auch ungeprüfte Einträge): Instrumente und Maßnahmen ohne Instrument.
insert into public.pruef_einheiten (id, thema_id) values
  (9944, 35),
  (9945, 35),
  (9946, 35),
  (9947, 35),
  (9952, 35);

insert into public.abdeckung (thema_id, partei_id, land, art, begruendung, stand, ki_entwurf, durchsucht_fuer) values
  (35, 11, null, 'massnahmen', null, '2026-10-14', true, '{3501,3502}'),
  (35, 12, null, 'massnahmen', null, '2026-10-14', true, '{3501,3502}'),
  (35, 13, null, 'massnahmen', null, '2026-10-14', true, '{3501,3502}'),
  (35, 14, null, 'massnahmen', null, '2026-10-14', true, '{3501,3502}'),
  (35, 15, null, 'keine', 'Erfasste Stellen (S. 43) setzen laut Bewertung ohne Parteinamen an keiner der Ursachen an.', '2026-10-14', true, '{3501,3502}'),
  (35, 16, null, 'keine', 'Kapitel 9 Mobilität (S. 36–37) und Kapitel 10 Bildung (S. 38–39) gelesen, Fundstellen S. 10, 14, 39 geprüft. Führerschein, Fahrschule, Fahrerlaubnis, Fahrausbildung und Fahrprüfung kommen im Programm nicht vor.', '2026-10-14', true, '{3501,3502}'),
  (35, 17, null, 'keine', 'Kapitel „Verkehrspolitik für alle statt Bevormundung und Verbote“ (S. 28–30) gelesen; Stichwörter Führerschein, Fahrschule, Fahrerlaubnis, Prüfung, Ausbildung im ganzen Programm ohne Treffer zu Fahrausbildung.', '2026-10-14', true, '{3501,3502}');

commit;
