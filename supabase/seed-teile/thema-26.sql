-- AUTOMATISCH ERZEUGT aus daten/ (npm run seed) – nicht von Hand bearbeiten.
-- Teil von supabase/seed.sql: Thema 26 „Barrieren für Menschen mit Behinderung“ – Instrumente, Maßnahmen, Prüfeinheiten, Abdeckung.
-- Nach 0-gemeinsam.sql ausführen. Mehrfach ausführbar, gespielte Runden bleiben erhalten.

begin;

delete from public.massnahmen where thema_id = 26;
delete from public.abdeckung where thema_id = 26;
delete from public.pruef_einheiten where thema_id = 26;

-- Lösungswege für die Forderungskarte (ohne Punkte). Upsert, damit gespeicherte Forderungen ihren Verweis behalten.
insert into public.instrumente (id, thema_id, name, begruendung, evidenz, beleg_studie_url, ebene, entspricht, ki_entwurf, entwurf_herkunft) values
  (10302, 26, 'Vermittlung und Förderung von Menschen mit Behinderung auf dem allgemeinen Arbeitsmarkt stärken (Bund)', 'Begleitete Vermittlung (Supported Employment/IPS) verdoppelt laut Übersichtsarbeit etwa die Chance auf reguläre Arbeit. Die Zusagen bleiben aber unbestimmt, und es fehlt ein konkretes Instrument oder ein Betrag.', 'belegt', 'https://www.fhi.no/en/publ/2017/supported-employment-for-arbeidssokere-med-bistandsbehov-en-systematisk-ove/', 'bund', null, true, 'blind')
on conflict (id) do update set thema_id = excluded.thema_id, name = excluded.name, begruendung = excluded.begruendung,
  evidenz = excluded.evidenz, beleg_studie_url = excluded.beleg_studie_url, ebene = excluded.ebene,
  entspricht = excluded.entspricht, ki_entwurf = excluded.ki_entwurf, entwurf_herkunft = excluded.entwurf_herkunft;

delete from public.instrumente where thema_id = 26 and id not in (10302);

insert into public.massnahmen (id, thema_id, partei_id, land, beschreibung, ursachen_ids, instrument_id, wirksamkeit, umsetzbarkeit,
  rollen_modifikator, begruendung, beleg_programm_url, beleg_studie_url, evidenz, stand, geprueft, ki_entwurf, entwurf_herkunft) values
  (10303, 26, 11, null, 'Barrieren in Bus und Bahn schneller beseitigen', '{2601}', null, 1, 2, null, 'Die Maßnahme setzt am richtigen Problem an, dem schleppenden Barriereabbau in Bus und Bahn. Sie nennt aber weder Mittel noch Steuerung oder Fristen, daher ist kaum eine Wirkung abzuschätzen.', 'https://www.cdu.de/app/uploads/2025/01/km_btw_2025_wahlprogramm_langfassung_ansicht.pdf#page=62', null, 'offen', '2026-10-20', false, true, 'blind'),
  (10304, 26, 11, null, 'Vermittlung auf den ersten Arbeitsmarkt, Inklusionsbetriebe und Werkstätten stärken', '{2602}', 10302, 2, 3, null, 'Begleitete Vermittlung (Supported Employment/IPS) verdoppelt laut Übersichtsarbeit etwa die Chance auf reguläre Arbeit. Die Zusagen bleiben aber unbestimmt, und es fehlt ein konkretes Instrument oder ein Betrag.', 'https://www.cdu.de/app/uploads/2025/01/km_btw_2025_wahlprogramm_langfassung_ansicht.pdf#page=61', 'https://www.fhi.no/en/publ/2017/supported-employment-for-arbeidssokere-med-bistandsbehov-en-systematisk-ove/', 'belegt', '2026-10-20', false, true, 'blind'),
  (10305, 26, 12, null, 'Mehr Kontrolle und Steuerung des Bundes bei der Deutschen Bahn und ihrer Infrastruktursparte', '{2601}', null, 1, 2, null, 'Der Bundesrechnungshof sieht mangelnde Steuerung durch den Bund als Hauptgrund für Verzögerungen. Die Maßnahme stärkt die Steuerung allerdings nur allgemein, ohne Bezug zur Barrierefreiheit von Bahnhöfen.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=35', 'https://correctiv.org/bundesrechnungshof/2025/07/30/hunderte-millionen-foerdergeld-fuer-barrierefreie-bahnhoefe-ungenutzt/', 'offen', '2026-10-20', false, true, 'blind'),
  (10306, 26, 12, null, 'Verstärkte Förderung der Aufnahme einer Arbeit auf dem allgemeinen Arbeitsmarkt für Menschen mit Behinderung', '{2602}', 10302, 2, 3, null, 'Begleitete Vermittlung (Supported Employment/IPS) verdoppelt laut Übersichtsarbeit etwa die Chance auf reguläre Arbeit. Die Zusagen bleiben aber unbestimmt, und es fehlt ein konkretes Instrument oder ein Betrag.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=39', 'https://www.fhi.no/en/publ/2017/supported-employment-for-arbeidssokere-med-bistandsbehov-en-systematisk-ove/', 'belegt', '2026-10-20', false, true, 'blind'),
  (10307, 26, 12, null, 'Weiterentwicklung der Werkstätten für behinderte Menschen und bessere Einkommen der Werkstattbeschäftigten', '{2602}', 10302, 2, 3, null, 'Begleitete Vermittlung (Supported Employment/IPS) verdoppelt laut Übersichtsarbeit etwa die Chance auf reguläre Arbeit. Die Zusagen bleiben aber unbestimmt, und es fehlt ein konkretes Instrument oder ein Betrag.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=39', 'https://www.fhi.no/en/publ/2017/supported-employment-for-arbeidssokere-med-bistandsbehov-en-systematisk-ove/', 'belegt', '2026-10-20', false, true, 'blind'),
  (10308, 26, 12, null, 'Schwerbehindertenvertretungen in den Betrieben stärken', '{2602}', null, 1, 3, null, 'Schwerbehindertenvertretungen können bei der Arbeitsplatzgestaltung und bei Förderanträgen helfen. Die Zusage ist aber unbestimmt und wirkt vor allem in Betrieben, die schon Menschen mit Behinderung beschäftigen.', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf#page=39', null, 'offen', '2026-10-20', false, true, 'blind'),
  (10309, 26, 13, null, 'Erhebliche Investitionen in umfassende Barrierefreiheit, Haltestellen und Mobilitätsangebote.', '{2601}', null, 2, 2, null, 'Investitionen in barrierefreie Haltestellen bauen Barrieren direkt ab. Laut Bundesrechnungshof fehlt es aber weniger an Geld als an Steuerung: Von 600 Mio. Euro wurden nur 84 Mio. abgerufen.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=47', 'https://correctiv.org/bundesrechnungshof/2025/07/30/hunderte-millionen-foerdergeld-fuer-barrierefreie-bahnhoefe-ungenutzt/', 'gemischt', '2026-10-20', false, true, 'blind'),
  (10310, 26, 13, null, 'Veraltete Regelwerke erneuern, um Ausnahmen bei der Barrierefreiheit im Nahverkehr zu beenden.', '{2601}', null, 1, 2, null, 'Weite Ausnahmen im PBefG verzögern die Barrierefreiheit im Nahverkehr, und sie zu streichen erhöht die Verbindlichkeit. Vor Ort fehlen aber vor allem Geld und Personal; umsetzen müssten Länder und Kommunen.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=48', null, 'offen', '2026-10-20', false, true, 'blind'),
  (10311, 26, 13, null, 'Ausgleichsabgabe anpassen und gesetzliche Schlupflöcher schließen, damit Arbeitgeber ihrer Beschäftigungspflicht nachkommen.', '{2602}', null, 1, 3, null, 'Laut IAB erhöht die Ausgleichsabgabe die Beschäftigung nur geringfügig (im Schnitt etwa 0,2 Personen je Betrieb). Eine ältere Studie fand bei Quotenänderungen keinen Effekt. Gesetzlich ist das leicht umsetzbar.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=123', 'https://iab.de/publication/?id=591316', 'gemischt', '2026-10-20', false, true, 'blind'),
  (10312, 26, 13, null, 'Werkstattsystem schrittweise zu Inklusionsunternehmen mit Mindestlohn und Rentenansprüchen weiterentwickeln.', '{2602}', null, 2, 1, null, 'Wenn Werkstätten zu Inklusionsunternehmen mit Mindestlohn werden, entstehen gemeinsame, geeignete Arbeitsplätze. Der Umbau für rund 300.000 Beschäftigte ist aber teuer, die Finanzierung ist ungeklärt, und die Wirkung ist kaum untersucht.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=123', null, 'offen', '2026-10-20', false, true, 'blind'),
  (10313, 26, 13, null, 'Modellprojekte zur beruflichen Integration von Menschen mit Behinderung in Bundesverwaltungen.', '{2602}', null, 1, 3, null, 'Modellprojekte in Bundesverwaltungen können geeignete Arbeitsplätze erproben. Ihre Reichweite ist aber klein und auf den öffentlichen Dienst begrenzt.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=123', null, 'offen', '2026-10-20', false, true, 'blind'),
  (10314, 26, 13, null, 'Bürokratische Hürden abbauen und durch Aufklärung Vorurteile gegenüber Beschäftigung von Menschen mit Behinderung abbauen.', '{2603}', null, 1, 3, null, 'Etwa 22 % der Betriebe erwarten Leistungseinschränkungen oder Sonderregeln, und Aufklärung und weniger Bürokratie setzen dort an. Die Wirkung von Aufklärung ist kaum belegt, und die Zusage nennt keine konkreten Schritte.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=19', 'https://www.wirtschaftsdienst.eu/inhalt/jahr/2025/heft/8/beitrag/aus-sicht-der-betriebe-was-es-braucht-damit-inklusion-besser-gelingt.html', 'offen', '2026-10-20', false, true, 'blind'),
  (10315, 26, 13, null, 'Hürden beim Eintritt und bei der Rückkehr ins Berufsleben sowie bei der Qualifizierung beseitigen.', '{2603}', null, 1, 2, null, 'Die Zusage benennt das Ziel, Hürden beim Berufseinstieg abzubauen, sagt aber nicht, welche Regeln oder Vorbehalte geändert werden sollen. Eine Wirkung lässt sich daher kaum abschätzen.', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf#page=123', null, 'offen', '2026-10-20', false, true, 'blind'),
  (10316, 26, 14, null, 'Praxisnahe Förderung und Arbeitsvermittlung für Menschen mit Behinderung auf dem ersten Arbeitsmarkt', '{2602}', 10302, 2, 3, null, 'Begleitete Vermittlung (Supported Employment/IPS) verdoppelt laut Übersichtsarbeit etwa die Chance auf reguläre Arbeit. Die Zusagen bleiben aber unbestimmt, und es fehlt ein konkretes Instrument oder ein Betrag.', 'https://www.fdp.de/sites/default/files/2024-12/fdp-wahlprogramm_2025.pdf#page=25', 'https://www.fhi.no/en/publ/2017/supported-employment-for-arbeidssokere-med-bistandsbehov-en-systematisk-ove/', 'belegt', '2026-10-20', false, true, 'blind'),
  (10317, 26, 16, null, 'Netz sanieren, elektrifizieren und ausbauen sowie Strecken reaktivieren, jeweils barrierefrei.', '{2601}', null, 1, 2, null, 'Barrierefreiheit wird nur als Begleitbedingung beim Netzausbau genannt, und bei Neubau ist sie ohnehin Standard. Den Rückstand an bestehenden Bahnhöfen und die Steuerungsmängel spricht die Zusage nicht an.', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf#page=37', null, 'offen', '2026-10-20', false, true, 'blind'),
  (10318, 26, 16, null, 'Beschäftigungspflicht für Menschen mit Behinderung wieder auf sechs Prozent anheben; Betriebe sollen sich nicht freikaufen können.', '{2602}', null, 1, 2, null, 'Eine Studie fand keinen Effekt der Quotensenkung von 6 auf 5 Prozent, eine neuere IAB-Studie dagegen einen kleinen positiven Effekt der Pflicht. Ohne Freikaufmöglichkeit wären neue Sanktionen nötig, und das Problem fehlender Tätigkeiten bliebe.', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf#page=54', 'https://iab.de/publication/?id=591316', 'gemischt', '2026-10-20', false, true, 'blind'),
  (10319, 26, 16, null, 'Inklusionsbetriebe besser öffentlich finanzieren.', '{2602}', null, 2, 3, null, 'Inklusionsbetriebe schaffen gezielt geeignete Arbeitsplätze mit Mindestlohn, und mehr Förderung kann sie ausweiten. Belastbare Wirkungsstudien fehlen, und die Zahl der Plätze ist bislang gering.', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf#page=54', 'https://www.betanet.de/inklusionsbetriebe.html', 'offen', '2026-10-20', false, true, 'blind');

select setval(pg_get_serial_sequence('public.massnahmen', 'id'), (select max(id) from public.massnahmen));

-- Was Prüfende je Thema bewerten (auch ungeprüfte Einträge): Instrumente und Maßnahmen ohne Instrument.
insert into public.pruef_einheiten (id, thema_id) values
  (10302, 26),
  (10303, 26),
  (10305, 26),
  (10308, 26),
  (10309, 26),
  (10310, 26),
  (10311, 26),
  (10312, 26),
  (10313, 26),
  (10314, 26),
  (10315, 26),
  (10317, 26),
  (10318, 26),
  (10319, 26);

insert into public.abdeckung (thema_id, partei_id, land, art, begruendung, stand, ki_entwurf, durchsucht_fuer) values
  (26, 11, null, 'massnahmen', null, '2026-10-20', true, '{2601,2602,2603}'),
  (26, 12, null, 'massnahmen', null, '2026-10-20', true, '{2601,2602,2603}'),
  (26, 13, null, 'massnahmen', null, '2026-10-20', true, '{2601,2602,2603}'),
  (26, 14, null, 'massnahmen', null, '2026-10-20', true, '{2601,2602,2603}'),
  (26, 15, null, 'keine', 'Erfasste Stellen (S. 23) setzen laut Bewertung ohne Parteinamen an keiner der Ursachen an.', '2026-10-20', true, '{2601,2602,2603}'),
  (26, 16, null, 'massnahmen', null, '2026-10-20', true, '{2601,2602,2603}');

commit;
