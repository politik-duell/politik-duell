# Datenschutz-Folgenabschätzung (Art. 35 DSGVO)

Entwurf, Stand 3. November 2026. Gilt für die Spielfunktion (KI-Einordnung, gespeicherte Runden,
Review-Warteschlangen) und die Prüfung von Bewertungen. Verarbeitungen im Einzelnen:
`docs/verarbeitungsverzeichnis.md`. KI-Verordnung: `docs/ki-verordnung.md`.

> Kein Rechtsrat. Die DSFA ist vom Verantwortlichen (Trägerverein) zu beschließen und vor dem
> öffentlichen Start, danach bei jeder wesentlichen Änderung, zu überprüfen.

## 1. Ist eine DSFA nötig?

Ja. Gründe:

- **Besondere Kategorien (Art. 9):** Eingaben, Forderungen und Haltungen können politische Meinungen
  erkennen lassen; ebenso die Bewertungen der Prüfenden.
- **Neue Technologie / KI:** Ein KI-System steuert das Gespräch mit den Betroffenen. Die Muss-Liste der
  Datenschutzkonferenz (DSK, Art. 35 Abs. 4) nennt den Einsatz künstlicher Intelligenz zur Steuerung der
  Interaktion mit Betroffenen.
- **Potenziell schutzbedürftige Personen:** Das Spiel kann Jugendliche erreichen (Schule).

Zwei Kriterien der Leitlinien der Art.-29-Gruppe (WP 248) sind damit sicher erfüllt (sensible Daten, neue
Technologie). Das genügt in der Regel für eine DSFA-Pflicht.

## 2. Systematische Beschreibung

1. Startseite: Hinweis, ausdrückliche Einwilligung (Kontrollkästchen, ab 16 Jahren).
2. Spielende tippen ein Problem ein (Diktieren über die Tastatur des Geräts möglich; die App selbst nimmt kein Audio auf).
3. Die App schickt Text, Gesprächsverlauf der Runde, Parteien und Bundesland an die Edge Function
   `analyse` (Supabase, Frankfurt). Diese fragt Mistral AI (Paris) mit festem Katalog, striktem JSON,
   Temperatur 0,1.
4. Die KI schlägt Typ, Thema und Ursachen vor; die Person bestätigt. Punkte kommen deterministisch aus
   der kuratierten Datenbank – nie von der KI.
5. Gespeichert wird eine anonyme Runde (Kurzfassung ≤ 200 Zeichen ohne Namen, Thema, Parteien, Punkte,
   Zeitpunkt). Runden ohne Wertung zusätzlich im Wortlaut in `review_eingaben` (nur Admins, ohne
   Parteien und ohne Verbindung zur Runde, gelöscht beim Sichten, spätestens nach 30 Tagen).
6. Rate-Limit über eine zufällige Sitzungsnummer (sessionStorage, Server ≤ 1 Tag).

Keine Konten für Spielende, keine Cookies, kein Tracking, keine IP-Adressen in eigenen Tabellen, kein
Audio, keine Fremd-Skripte.

## 3. Notwendigkeit und Verhältnismäßigkeit

| Grundsatz | Umsetzung |
|---|---|
| Zweckbindung | Text nur für Einordnung, Rückfragen und Prüfung der Einordnung; kein Training bei Mistral, keine Werbung, keine Weitergabe |
| Datenminimierung | statt Originaltext nur Kurzfassung ohne Namen; Wortlaut nur bei Runden ohne Wertung; keine Kennungen, keine Verknüpfung von Runden einer Person; `review_eingaben` ohne Parteien |
| Speicherbegrenzung | Wortlaut ≤ 30 Tage; Rate-Limit ≤ 1 Tag; Testzugänge bis Ende der Testphase |
| Transparenz | Kurzhinweis auf der Startseite, Datenschutzerklärung, Methode offen, Quellcode öffentlich, KI-Kennzeichnung im Spiel |
| Rechtsgrundlage | ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a), freiwillig: ohne Einwilligung kein Spiel, aber keine Nachteile; Widerruf durch Abbruch oder E-Mail |
| Betroffenenrechte | Art. 11 DSGVO für anonyme Daten; für Prüfende Auskunft und Löschung per Prüfseite oder E-Mail |

## 4. Risiken für die Betroffenen

Bewertung: Eintrittswahrscheinlichkeit × Schwere, jeweils gering / mittel / hoch – **nach** den Maßnahmen
in Abschnitt 5.

| # | Risiko | Wahrscheinlichkeit | Schwere | Restrisiko |
|---|---|---|---|---|
| R1 | Rückschluss auf die politische Meinung einer bestimmten Person aus gespeicherten Runden | gering (keine Kennung, keine IP, keine Verknüpfung) | hoch | gering |
| R2 | Personenbezogene Details Dritter oder der Person selbst im Freitext (Namen, Adressen, Gesundheit) | mittel | mittel | mittel → Maßnahmen M2, M3 |
| R3 | Verarbeitung bei Mistral über den Zweck hinaus (Training, lange Aufbewahrung) | gering, **wenn** Training abgeschaltet und AVV wirksam | hoch | gering (unter Vorbehalt O2) |
| R4 | Unbefugter Zugriff auf `review_eingaben` (Wortlaut) | gering (RLS, nur Admins) | hoch | gering |
| R5 | Wortlaut bleibt länger als 30 Tage, wenn niemand spielt | mittel, wenn `pg_cron` fehlt | mittel | gering, wenn O3 erledigt |
| R6 | Jugendliche unter 16 willigen ohne Zustimmung der Eltern ein | mittel | mittel | mittel (Selbstauskunft, Hinweis) |
| R7 | Fehleinordnung durch die KI führt zu falschem Eindruck über Parteien | mittel | gering für die Person (Punkte nicht von der KI; Person bestätigt) | gering |
| R8 | Server-Logs von Vercel/Supabase (IP) in Verbindung mit Eingaben | gering (keine Verknüpfung durch uns) | mittel | gering |
| R9 | Freigegebene Runden sind über die Datenbank öffentlich lesbar (Policy „Freigegebene Probleme lesen“), obwohl die Wortwolke keine Eingaben mehr zeigt | gering (nur nach Admin-Freigabe) | mittel | gering → O5 |

## 5. Maßnahmen

| # | Maßnahme | Status |
|---|---|---|
| M1 | Ausdrückliche Einwilligung vor Spielstart, Mindestalter 16, Hinweis für Jüngere | umgesetzt |
| M2 | Bitte, keine Namen/Kontaktdaten einzugeben (Start, Datenschutzerklärung) | umgesetzt |
| M3 | KI formuliert Kurzfassung ohne Namen; Moderationsfilter (`_shared/moderation.ts`) | umgesetzt |
| M4 | Keine IPs, keine Konten, keine Cookies; Rate-Limit nur mit Zufallsnummer | umgesetzt |
| M5 | RLS: Frontend liest nur, schreibt über die Edge Function; Review-Tabellen nur für Admins | umgesetzt |
| M6 | Löschung `review_eingaben` nach 30 Tagen (bei jedem Eintrag + täglich mit `pg_cron`) | umgesetzt, `pg_cron` prüfen (O3) |
| M7 | Hosting der Datenbank und Edge Functions in Frankfurt, KI bei EU-Anbieter | umgesetzt |
| M8 | KI vergibt keine Punkte; Bestätigung durch die Person; Methode und Daten offen | umgesetzt |
| M9 | KI-Kennzeichnung im Spiel (sichtbar und maschinenlesbar, `src/components/KiText.tsx`) | umgesetzt |
| M10 | Admin-Konten nur für das Moderationsteam, starke Passwörter, Zahl der Admins klein halten | organisatorisch |

## 6. Offene Punkte vor dem öffentlichen Start

- **O1 Verantwortlicher:** Betreiberangaben in `src/rechtliches/betreiber.ts` eintragen (Trägerverein).
- **O2 Mistral:** In der Mistral-Konsole prüfen und festhalten (Datum, Screenshot): Training abgeschaltet,
  Datenverarbeitungsvertrag (DPA) akzeptiert, Region EU. Ohne das stimmen Datenschutzerklärung und R3
  nicht.
- **O3 `pg_cron`:** In Supabase aktivieren und den Job `review_eingaben_aufraeumen` prüfen
  (`select * from cron.job;`).
- **O4 AVV:** Auftragsverarbeitungsverträge mit Vercel und Supabase abschließen bzw. dokumentieren.
- **O5 Freigegebene Runden:** Die Lese-Policy für `freigegeben` entfernen, falls die Wortwolke keine
  Eingaben mehr braucht (`docs/konzept.md`: Wortwolke zeigt nur Themen).
- **O6 Datenschutzbeauftragte:r:** siehe unten.

## 7. Datenschutzbeauftragte:r

Nach § 38 Abs. 1 Satz 2 BDSG muss ein:e Datenschutzbeauftragte:r unabhängig von der Zahl der Beschäftigten
benannt werden, wenn Verarbeitungen einer DSFA nach Art. 35 DSGVO unterliegen. Nach Abschnitt 1 ist das hier
der Fall. **Empfehlung:** Der Trägerverein benennt eine Person (intern, nicht der Vorstand selbst, oder
extern, z. B. ehrenamtlich über ein Netzwerk), veröffentlicht die Kontaktdaten in der Datenschutzerklärung
und meldet sie der Aufsichtsbehörde (Art. 37 Abs. 7 DSGVO).

## 8. Ergebnis

Mit den umgesetzten Maßnahmen und nach Erledigung von O1–O6 ist das Restrisiko **gering bis mittel**
(R2, R6). Eine vorherige Konsultation der Aufsichtsbehörde (Art. 36) ist dann nicht erforderlich.

| | |
|---|---|
| Beschlossen durch | offen (Vorstand des Trägervereins) |
| Stellungnahme DSB | offen |
| Nächste Überprüfung | bei Änderung der Datenflüsse, spätestens nach einem Jahr |
