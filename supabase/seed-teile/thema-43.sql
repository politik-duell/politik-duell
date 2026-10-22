-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
-- Teil von supabase/seed.sql: Thema 43 „Künstliche Intelligenz“ – Instrumente, Maßnahmen, Prüfeinheiten, Abdeckung.
-- Nach 0-gemeinsam.sql ausführen. Mehrfach ausführbar, gespielte Runden bleiben erhalten.

begin;

delete from public.massnahmen where thema_id = 43;
delete from public.abdeckung where thema_id = 43;
delete from public.pruef_einheiten where thema_id = 43;

-- Lösungswege für die Forderungskarte (ohne Punkte). Upsert, damit gespeicherte Forderungen ihren Verweis behalten.
insert into public.instrumente (id, thema_id, name, begruendung, evidenz, beleg_studie_url, ebene, entspricht, ki_entwurf, entwurf_herkunft, nebenwirkungen) values
  (10825, 43, 'Kennzeichnungspflicht für KI-Inhalte und Bots durchsetzen (Bund)', 'Kennzeichnung senkt in Experimenten die Glaubwürdigkeit markierter Inhalte etwas, trifft aber auch wahre Inhalte; Kriminelle umgehen Kennzeichnungen leicht. Die Pflicht besteht schon (KI-Verordnung), Aufsicht ist national.', 'gemischt', 'https://academic.oup.com/pnasnexus/article/3/10/pgae403/7795946', 'bund', null, true, 'blind', null),
  (10826, 43, 'EU-Regeln zu KI und Plattformen national umsetzen und durchsetzen (Bund)', 'Aufsicht nach KI-Verordnung und DSA kann Täuschung und illegale Inhalte eindämmen; die Zusage bleibt allgemein und die Wirkung auf KI-gestützte Kriminalität ist kaum untersucht.', 'offen', null, 'bund', null, true, 'blind', null)
on conflict (id) do update set thema_id = excluded.thema_id, name = excluded.name, begruendung = excluded.begruendung,
  evidenz = excluded.evidenz, beleg_studie_url = excluded.beleg_studie_url, ebene = excluded.ebene,
  entspricht = excluded.entspricht, ki_entwurf = excluded.ki_entwurf, entwurf_herkunft = excluded.entwurf_herkunft,
  nebenwirkungen = excluded.nebenwirkungen;

delete from public.instrumente where thema_id = 43 and id not in (10825, 10826);

insert into public.massnahmen (id, thema_id, partei_id, land, beschreibung, ursachen_ids, instrument_id, wirksamkeit, umsetzbarkeit,
  rollen_modifikator, begruendung, beleg_programm_url, beleg_studie_url, evidenz, stand, geprueft, ki_entwurf, entwurf_herkunft, nebenwirkungen) values
  (10827, 43, 12, null, 'Betriebsräte bei der Einführung von Künstlicher Intelligenz mit echtem Mitbestimmungsrecht ausstatten (Einigungserfordernis).', '{4301}', null, 2, 3, null, 'Betriebsräte senken bei Automatisierung das Jobverlustrisiko und erhöhen Weiterbildung, ohne Einführung zu bremsen; wirkt nur in Betrieben mit Betriebsrat. Änderung des BetrVG liegt beim Bund.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=13', 'https://www.zew.de/PU89075', 'belegt', '2026-10-22', false, true, 'blind', null),
  (10828, 43, 12, null, 'Bot-Kennzeichnungspflicht aus der KI-Verordnung strikt durchsetzen.', '{4303}', 10825, 1, 3, null, 'Kennzeichnung senkt in Experimenten die Glaubwürdigkeit markierter Inhalte etwas, trifft aber auch wahre Inhalte; Kriminelle umgehen Kennzeichnungen leicht. Die Pflicht besteht schon (KI-Verordnung), Aufsicht ist national.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=50', 'https://academic.oup.com/pnasnexus/article/3/10/pgae403/7795946', 'gemischt', '2026-10-22', false, true, 'blind', null),
  (10829, 43, 12, null, 'Dafür sorgen, dass KI-generierte Inhalte klar erkennbar sind.', '{4303}', 10825, 1, 3, null, 'Kennzeichnung senkt in Experimenten die Glaubwürdigkeit markierter Inhalte etwas, trifft aber auch wahre Inhalte; Kriminelle umgehen Kennzeichnungen leicht. Die Pflicht besteht schon (KI-Verordnung), Aufsicht ist national.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=51', 'https://academic.oup.com/pnasnexus/article/3/10/pgae403/7795946', 'gemischt', '2026-10-22', false, true, 'blind', null),
  (10830, 43, 12, null, 'Europäische Plattform- und KI-Regeln durchsetzen und Plattformen zum Vorgehen gegen illegale Inhalte verpflichten.', '{4303}', 10826, 1, 3, null, 'Aufsicht nach KI-Verordnung und DSA kann Täuschung und illegale Inhalte eindämmen; die Zusage bleibt allgemein und die Wirkung auf KI-gestützte Kriminalität ist kaum untersucht.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=50', null, 'offen', '2026-10-22', false, true, 'blind', null),
  (10831, 43, 13, null, 'KI-Entwicklung und -Anwendung gezielt fördern und digitale Kompetenzen in Unternehmen und Hochschulen stärken.', '{4302}', null, 1, 3, null, 'Mittelstandsdigitalzentren werden schon vom Bund gefördert und können KI-Kompetenz in kleinen Betrieben stärken; die Zusage ist unbestimmt und erreicht Beschäftigte ohne Abschluss kaum gezielt.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=23', null, 'offen', '2026-10-22', false, true, 'blind', null),
  (10832, 43, 13, null, 'Verbreitung von Nacktbildern gegen den Willen Betroffener, auch KI-generierter, grundsätzlich strafbar machen.', '{4303}', null, 2, 3, null, 'Schließt eine Strafbarkeitslücke bei Deepfake-Nacktbildern, umsetzbar mit der EU-Richtlinie; ob Strafdrohung allein abschreckt, ist kaum untersucht, die Verfolgung im Netz bleibt schwierig.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=119', null, 'offen', '2026-10-22', false, true, 'blind', null),
  (10833, 43, 16, null, 'Lernsoftware nicht als Ersatz für Lehrpersonal einsetzen; KI nicht zur Bewertung von Lernerfolgen nutzen', '{4301}', null, 1, 1, null, 'Schützt Lehrkräfte vor Ersatz durch Software, betrifft aber nur einen Beruf; Schulen liegen in Länderzuständigkeit, der Bund kann das nicht regeln.', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf#page=39', null, 'offen', '2026-10-22', false, true, 'blind', null),
  (10834, 43, 16, null, 'KI-Wissen als Teil der beruflichen Ausbildung verankern', '{4302}', null, 2, 2, null, 'Verankerung in Ausbildungsordnungen erreicht viele Beschäftigte ohne Hochschulabschluss früh; bereits Beschäftigte erreicht sie nicht, Berufsschulen sind Ländersache. Wirkung kaum evaluiert.', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf#page=40', null, 'offen', '2026-10-22', false, true, 'blind', null),
  (10835, 43, 16, null, 'KI-erzeugte Medieninhalte kennzeichnen; Plattformen haften für Falschinformationen und Rechtsverstöße solcher Inhalte', '{4303}', null, 2, 1, null, 'Haftung schafft Anreiz zur Entfernung täuschender KI-Inhalte, Kennzeichnung wirkt nur begrenzt; Plattformhaftung ist im DSA EU-weit geregelt, eine nationale Verschärfung kaum möglich.', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf#page=55', 'https://academic.oup.com/pnasnexus/article/3/10/pgae403/7795946', 'gemischt', '2026-10-22', false, true, 'blind', null),
  (10836, 43, 16, null, 'Kriminalpolizei und Staatsanwaltschaft so ausstatten, dass sie KI-gestützte Manipulation verfolgen können', '{4303}', null, 2, 2, null, 'Bessere Ausstattung erhöht die Chance, KI-gestützte Taten aufzuklären; konkrete Mittel fehlen, und Polizei und Justiz liegen großteils bei den Ländern. Wirkung auf diese Taten kaum untersucht.', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf#page=48', null, 'offen', '2026-10-22', false, true, 'blind', null),
  (10837, 43, 16, null, 'EU-Gesetze zu KI und digitalen Diensten zügig in nationales Recht überführen', '{4303}', 10826, 1, 3, null, 'Aufsicht nach KI-Verordnung und DSA kann Täuschung und illegale Inhalte eindämmen; die Zusage bleibt allgemein und die Wirkung auf KI-gestützte Kriminalität ist kaum untersucht.', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf#page=57', null, 'offen', '2026-10-22', false, true, 'blind', null);

select setval(pg_get_serial_sequence('public.massnahmen', 'id'), (select max(id) from public.massnahmen));

-- Was Prüfende je Thema bewerten (auch ungeprüfte Einträge): Instrumente und Maßnahmen ohne Instrument.
insert into public.pruef_einheiten (id, thema_id) values
  (10825, 43),
  (10826, 43),
  (10827, 43),
  (10831, 43),
  (10832, 43),
  (10833, 43),
  (10834, 43),
  (10835, 43),
  (10836, 43);

insert into public.abdeckung (thema_id, partei_id, land, art, begruendung, stand, ki_entwurf, durchsucht_fuer) values
  (43, 11, null, 'keine', 'Erfasste Stellen (S. 29, 40) setzen laut Bewertung ohne Parteinamen an keiner der Ursachen an.', '2026-10-22', true, '{4301,4302,4303}'),
  (43, 12, null, 'massnahmen', null, '2026-10-22', true, '{4301,4302,4303}'),
  (43, 13, null, 'massnahmen', null, '2026-10-22', true, '{4301,4302,4303}'),
  (43, 14, null, 'keine', 'Erfasste Stellen (S. 23, 39, 9) setzen laut Bewertung ohne Parteinamen an keiner der Ursachen an.', '2026-10-22', true, '{4301,4302,4303}'),
  (43, 15, null, 'keine', 'Erfasste Stellen (S. 51) setzen laut Bewertung ohne Parteinamen an keiner der Ursachen an.', '2026-10-22', true, '{4301,4302,4303}'),
  (43, 16, null, 'massnahmen', null, '2026-10-22', true, '{4301,4302,4303}'),
  (43, 17, null, 'keine', 'Erfasste Stellen (S. 43, 35) setzen laut Bewertung ohne Parteinamen an keiner der Ursachen an.', '2026-10-22', true, '{4301,4302,4303}');

commit;
