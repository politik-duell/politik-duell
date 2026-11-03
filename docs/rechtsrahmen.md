# Rechtsrahmen – Überblick und offene Aufgaben

Stand 3. November 2026. Überblick, welche Regelungen auf EU- und Bundesebene für das Politik-Duell gelten,
wo sie umgesetzt sind und was vor dem öffentlichen Start bzw. mit dem Trägerverein noch zu tun ist.
Vertieft geprüft sind Datenschutz (`docs/datenschutz-folgenabschaetzung.md`,
`docs/verarbeitungsverzeichnis.md`) und KI-Verordnung (`docs/ki-verordnung.md`).

> Kein Rechtsrat. Vom Verantwortlichen (später Vorstand des Trägervereins) zu prüfen; bei unklaren Punkten
> (MStV, Gemeinnützigkeit, politische Werbung) fachkundige Beratung einholen.

## 1. Anwendbar und umgesetzt

| Regelung | Inhalt | Umsetzung |
|---|---|---|
| DSGVO, BDSG | Politische Meinungen sind besondere Daten (Art. 9); Einwilligung ab 16 (Art. 8); DSFA (Art. 35); DSB (§ 38 BDSG) | DSFA, Verarbeitungsverzeichnis, Datenschutzerklärung (`src/rechtliches/Rechtliches.tsx`); offene Punkte O1–O7 in der DSFA |
| KI-Verordnung (EU) 2024/1689 | Kein Hochrisiko-System (Art. 6 Abs. 3), Transparenz (Art. 50), KI-Kompetenz (Art. 4) | `docs/ki-verordnung.md`; Registrierung nach Art. 49 Abs. 2 bis 2. 12. 2027 |
| § 5 DDG | Impressum | Impressum (`#/impressum`, Angaben in `src/rechtliches/betreiber.ts`) |
| § 25 TDDDG | Speichern im Endgerät | Nur Zugangscode (`localStorage`) und Sitzungsnummer (`sessionStorage`), unbedingt erforderlich (Abs. 2 Nr. 2), in der Datenschutzerklärung genannt |
| §§ 18–20 MStV | Journalistisch-redaktionelles Telemedium: verantwortliche Person, Sorgfaltspflichten, Gegendarstellung | Verantwortliche Person im Impressum; Sorgfalt über Quellenpflicht und Prüfung in `daten/`; Abschnitt „Korrekturen und Gegendarstellung“ im Impressum |
| Äußerungsrecht (§§ 823, 1004 BGB analog) | Falsche Tatsachenbehauptungen über Parteiprogramme sind angreifbar; Wertungen durch Art. 5 GG geschützt | Tatsachen nur mit wörtlichem Zitat und Seite; Wertung nach offener Methode; Korrekturweg im Impressum (Aufgabe A1) |
| §§ 51, 63 UrhG | Wahlprogramme sind keine amtlichen Werke (§ 5): nur kurze Zitate mit Belegzweck und Quelle | Katalog ohne Programmtext (`docs/plan-programmkatalog.md`); Zitate mit Quelle und Seite |
| Marken- und Namensrecht (§ 12 BGB, MarkenG) | Parteilogos und -namen | Nur Parteinamen im Text, keine Logos, nichts, was eine Unterstützung durch Parteien nahelegt |
| §§ 52, 55 AO | Gemeinnützigkeit nur bei parteipolitischer Neutralität | Satzung § „parteipolitisch neutral“ (`docs/verein/satzung.md`); Hinweis „keine Wahlempfehlung“ am Ergebnis und in der Methode |

## 2. Abhängig vom Betrieb

- **Politische Werbung, Verordnung (EU) 2024/900** (gilt seit 10. 10. 2025): Das Spiel selbst ist keine
  politische Werbung – kein Auftrag einer Partei, keine Bezahlung. Bezahlte Anzeigen *für* das Spiel,
  besonders vor Wahlen, können darunter fallen; Meta und Google nehmen in der EU seit Oktober 2025 keine
  politischen Anzeigen mehr an. Keine Sponsoren oder Förderer aus dem Umfeld von Parteien.
- **Chancengleichheit der Parteien** (Art. 21 GG, § 5 PartG): bindet den Staat. Bei öffentlicher Förderung
  (Bundes- oder Landeszentrale für politische Bildung) gelten Maßstäbe wie beim Wahl-O-Mat (VG Köln,
  Beschluss vom 20. 5. 2019) und meist der Beutelsbacher Konsens. Abdeckungsregel (Runde wird nicht
  gewertet, wenn ein Thema für eine Partei nicht erfasst ist) und gleiche Kriterien für alle sprechen dafür;
  Auswahl der Parteien (sieben, Begründung in `docs/methode.md`) gegebenenfalls nachschärfen.
- **Schulen:** Einwilligung erst ab 16 (Art. 8 DSGVO). Für jüngere Klassen bräuchte es einen Modus ohne KI
  oder die Einwilligung der Eltern; eine Lehrkraft kann nicht für Schüler:innen einwilligen.
- **Barrierefreiheit:** Das BFSG (seit 28. 6. 2025) gilt für kommerzielle Dienste an Verbraucher – für ein
  kostenloses Vereinsangebot wohl nicht. Öffentliche Förderer verlangen oft WCAG 2.1 AA (BITV 2.0);
  ohnehin anstreben.
- **Wechsel des KI-Anbieters:** KI-Dokument, DSFA und Verarbeitungsverzeichnis anpassen (AVV,
  Drittlandübermittlung, Training abgeschaltet).

## 3. Wohl nicht einschlägig

| Regelung | Grund | Neu prüfen, wenn … |
|---|---|---|
| Digital Services Act | Keine öffentlich sichtbaren Inhalte von Nutzenden; Themenvorschläge gehen nur an den Betreiber | Kommentare, öffentliche Ergebnisseiten oder Ähnliches dazukommen |
| § 32 BWahlG | Keine Erhebung von Wahlabsichten | Ergebnisse gespeichert oder ausgewertet werden (widerspräche ohnehin Grundprinzip 5) |
| JuSchG, JMStV | Keine entwicklungsbeeinträchtigenden Inhalte | – |
| Glücksspielrecht | Kein Einsatz | Preise oder Einsätze dazukommen |
| UWG | Kein geschäftliches Handeln | Werbung oder Bezahlangebote dazukommen |
| Cyber Resilience Act | Webdienst, kein Produkt; nicht-kommerzielle Open-Source-Software | eine installierbare App kommerziell vertrieben wird |

## 4. Aufgaben

| Nr. | Aufgabe | Stand |
|---|---|---|
| A1 | Korrekturweg festlegen: wer Hinweise von Parteien prüft, Antwortfrist (Vorschlag: 14 Tage), Berichtigung per Pull Request, kurze Antwort an die Absender | Hinweis im Impressum umgesetzt; Ablauf offen |
| A2 | Mit dem Trägerverein Impressum ergänzen (Vereinsname, Registergericht und -nummer, Vertretungsberechtigte, verantwortliche Person nach § 18 Abs. 2 MStV) | offen |
| A3 | Gemeinnützigkeit: Satzungszweck (politische Bildung, § 52 Abs. 2 Nr. 7 bzw. Nr. 24 AO) vorab mit dem Finanzamt abstimmen; Zeigen eines Gesamtsiegers ansprechen | offen |
| A4 | Vor bezahlter Werbung prüfen, ob sie als politische Werbung nach Verordnung (EU) 2024/900 gilt | offen |
| A5 | Vor Einsatz in Schulen: Modus für unter 16 klären | offen |
| A6 | Barrierefreiheit nach WCAG 2.1 AA prüfen | offen |
| A7 | Bei öffentlicher Förderung: Förderbedingungen (Neutralität, Barrierefreiheit) gegen dieses Dokument prüfen | offen |

| | |
|---|---|
| Beschlossen durch | offen (Arne Baron; später Vorstand des Trägervereins) |
| Nächste Überprüfung | bei neuen Funktionen (öffentliche Inhalte, Werbung, Förderung, Schulen), spätestens nach einem Jahr |
