# Datenschutz-Folgenabschätzung (Art. 35 DSGVO)

Entwurf, Stand 3. November 2026, nach dem Wegfall der Speicherung von Spieleingaben (Migration
`20261103000000_keine_eingaben_speichern.sql`). Gilt für die Spielfunktion (KI-Einordnung), die
Themenvorschläge und die Prüfung von Bewertungen. Verarbeitungen im Einzelnen:
`docs/verarbeitungsverzeichnis.md`. KI-Verordnung: `docs/ki-verordnung.md`.

> Kein Rechtsrat. Die DSFA ist vom Verantwortlichen (derzeit Arne Baron, später der Trägerverein) zu
> beschließen und vor dem öffentlichen Start, danach bei jeder wesentlichen Änderung, zu überprüfen.

## 1. Ist eine DSFA nötig?

Ja, auch ohne gespeicherte Spieleingaben:

- **Besondere Kategorien (Art. 9):** Eingaben, Forderungen und Haltungen können politische Meinungen
  erkennen lassen; sie gehen an die KI. Ebenso können Themenvorschläge und die Bewertungen der Prüfenden
  politische Meinungen zeigen.
- **Neue Technologie / KI:** Ein KI-System steuert das Gespräch mit den Betroffenen. Die Muss-Liste der
  Datenschutzkonferenz (DSK, Art. 35 Abs. 4) nennt den Einsatz künstlicher Intelligenz zur Steuerung der
  Interaktion mit Betroffenen.
- **Potenziell schutzbedürftige Personen:** Das Spiel kann Jugendliche erreichen (Schule).

Zwei Kriterien der Leitlinien der Art.-29-Gruppe (WP 248) sind sicher erfüllt (sensible Daten, neue
Technologie). Dass nichts gespeichert wird, senkt das Risiko deutlich, ändert aber nichts an der Pflicht zur
Abschätzung.

## 2. Systematische Beschreibung

1. Startseite: Hinweis, ausdrückliche Einwilligung (Kontrollkästchen, ab 16 Jahren).
2. Spielende tippen ein Problem ein (Diktieren über die Tastatur des Geräts möglich; die App selbst nimmt
   kein Audio auf).
3. Die App schickt Text, Gesprächsverlauf der Runde, Parteien und Bundesland an die Edge Function
   `analyse` (Supabase, Frankfurt). Diese fragt Mistral AI (Paris) mit festem Katalog, striktem JSON,
   Temperatur 0,1.
4. Die KI schlägt Typ, Thema und Ursachen vor; die Person bestätigt. Punkte rechnet die App
   deterministisch aus der kuratierten Datenbank – nie die KI.
5. **Nichts aus dem Spiel wird gespeichert** – weder Wortlaut noch Kurzfassung, Thema, Parteien oder
   Punkte. Der Spielverlauf liegt nur im Arbeitsspeicher des Tabs.
6. Wer ein Thema vermisst, kann es freiwillig über „Thema vorschlagen“ schicken – ohne KI, nur der selbst
   geschriebene Text und der Zeitpunkt (`themen_vorschlaege`, nur Admins, höchstens 180 Tage).
7. Rate-Limit über eine zufällige Sitzungsnummer (sessionStorage, Server ≤ 1 Tag; für Vorschläge ein
   abgeleiteter Schlüssel, getrennt von den Vorschlägen).

Keine Konten für Spielende, keine Cookies, kein Tracking, keine IP-Adressen in eigenen Tabellen, kein
Audio, keine Fremd-Skripte.

## 3. Notwendigkeit und Verhältnismäßigkeit

| Grundsatz | Umsetzung |
|---|---|
| Zweckbindung | Spieltext nur für Einordnung und Rückfragen; Vorschläge nur für die Themenauswahl; kein Training bei Mistral, keine Werbung, keine Weitergabe |
| Datenminimierung | aus dem Spiel nichts gespeichert; Vorschläge ohne Bezug zu Spiel, Sitzung oder Parteien; Wortfilter gegen Namen und Kontaktdaten |
| Speicherbegrenzung | Vorschläge ≤ 180 Tage; Rate-Limit ≤ 1 Tag; Testzugänge bis Ende der Testphase |
| Transparenz | Kurzhinweis auf der Startseite und am Vorschlagsformular, Datenschutzerklärung, Methode offen, Quellcode öffentlich, KI-Kennzeichnung im Spiel |
| Rechtsgrundlage | ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a): vor dem Spielstart bzw. mit „Vorschlag senden“; freiwillig, ohne Nachteile; Widerruf durch Abbruch |
| Betroffenenrechte | Art. 11 DSGVO für nicht zuordenbare Vorschläge; für Prüfende Auskunft und Löschung per Prüfseite oder E-Mail |

## 4. Risiken für die Betroffenen

Bewertung nach den Maßnahmen in Abschnitt 5.

| # | Risiko | Wahrscheinlichkeit | Schwere | Restrisiko |
|---|---|---|---|---|
| R1 | Rückschluss auf die politische Meinung einer bestimmten Person | sehr gering (keine Speicherung aus dem Spiel; Vorschläge ohne Kennung) | hoch | gering |
| R2 | Personenbezogene Details im Freitext (Spiel an Mistral; Vorschlag in der Datenbank) | mittel beim Spiel, gering bei Vorschlägen (Wortfilter) | mittel | gering bis mittel |
| R3 | Verarbeitung bei Mistral über den Zweck hinaus | gering (Training abgeschaltet, DPA) | hoch | gering |
| R4 | Unbefugter Zugriff auf `themen_vorschlaege` | gering (RLS, nur Admins) | mittel | gering |
| R5 | Auswertung der Vorschläge mit einem KI-Werkzeug ohne Vertrag zur Auftragsverarbeitung (O7) | mittel, solange offen | mittel | mittel → O7 |
| R6 | Jugendliche unter 16 willigen ohne Zustimmung der Eltern ein | mittel | gering (nichts gespeichert) | gering bis mittel |
| R7 | Fehleinordnung durch die KI führt zu falschem Eindruck über Parteien | mittel | gering für die Person (Punkte nicht von der KI; Person bestätigt) | gering |
| R8 | Server-Logs von Vercel/Supabase (IP) in Verbindung mit Anfragen | gering (keine Verknüpfung durch uns) | mittel | gering |

## 5. Maßnahmen

| # | Maßnahme | Status |
|---|---|---|
| M1 | Ausdrückliche Einwilligung vor Spielstart, Mindestalter 16, Hinweis für Jüngere | umgesetzt |
| M2 | Keine Speicherung von Spieleingaben, Kurzfassungen oder Ergebnissen | umgesetzt |
| M3 | Themenvorschlag nur freiwillig, ohne KI, ohne Bezug zum Spiel; ausdrückliche Einwilligung am Formular | umgesetzt |
| M4 | Wortfilter gegen Kontaktdaten, Links, Namen, Beleidigungen, Hetze (Browser und Edge Function) | umgesetzt |
| M5 | Keine IPs, keine Konten, keine Cookies; Rate-Limits nur mit Zufallsnummer bzw. abgeleitetem Schlüssel | umgesetzt |
| M6 | RLS: Frontend liest nur; Vorschläge lesen, abhaken, löschen nur Admins | umgesetzt |
| M7 | Löschung der Vorschläge nach 180 Tagen (Trigger + `pg_cron`) | umgesetzt |
| M8 | Datenbank und Edge Functions in Frankfurt, KI bei EU-Anbieter, Training abgeschaltet | umgesetzt |
| M9 | KI vergibt keine Punkte; Bestätigung durch die Person; Methode und Daten offen | umgesetzt |
| M10 | KI-Kennzeichnung im Spiel (sichtbar und maschinenlesbar, `src/components/KiText.tsx`) | umgesetzt |

## 6. Offene Punkte vor dem öffentlichen Start

- **O1 Verantwortlicher:** eingetragen (Arne Baron). Beim Übergang auf den Trägerverein Impressum,
  Datenschutzerklärung und diese Dokumente anpassen.
- ~~**O2 Mistral:**~~ Erledigt 3. November 2026: Training abgeschaltet (Screenshot), Bedingungen und
  Datenverarbeitungsvertrag (DPA) mit Datum abgelegt.
- ~~**O3 `pg_cron`:**~~ Erledigt 3. November 2026: aktiviert, Job `themen_vorschlaege_aufraeumen`
  eingetragen.
- ~~**O4 AVV:**~~ Erledigt 3. November 2026: Verträge zur Auftragsverarbeitung mit Supabase (unterzeichnet),
  Vercel und Mistral (Fassung mit Datum) abgelegt – privat, nicht im Repository.
- **O6 Datenschutzbeauftragte:r:** siehe Abschnitt 7.
- **O7 Auswertung der Vorschläge:** Festlegen, wer `npm run vorschlaege` ausführt. Läuft die Auswertung
  über einen KI-Agenten (z. B. Claude Code), gehen die Vorschläge an dessen Anbieter. Das ist nur mit einem
  Vertrag zur Auftragsverarbeitung (geschäftliches Konto/API, nicht ein Verbraucherkonto) und Nennung in
  der Datenschutzerklärung zulässig – oder die Auswertung bleibt bei Menschen bzw. bei Mistral.

## 7. Datenschutzbeauftragte:r

Nach § 38 Abs. 1 Satz 2 BDSG muss ein:e Datenschutzbeauftragte:r unabhängig von der Zahl der Beschäftigten
benannt werden, wenn Verarbeitungen einer DSFA nach Art. 35 DSGVO unterliegen. Nach Abschnitt 1 ist das hier
der Fall. **Empfehlung:** Spätestens mit dem öffentlichen Start bzw. dem Trägerverein eine Person benennen
(nicht der Verantwortliche oder Vorstand selbst; intern mit Fachkunde oder extern, z. B. ehrenamtlich),
Kontaktdaten in der Datenschutzerklärung veröffentlichen und der Aufsichtsbehörde melden (Art. 37 Abs. 7
DSGVO).

## 8. Ergebnis

Mit den umgesetzten Maßnahmen und nach Erledigung von O6 und O7 ist das Restrisiko **gering**. Eine vorherige
Konsultation der Aufsichtsbehörde (Art. 36) ist nicht erforderlich.

| | |
|---|---|
| Beschlossen durch | offen (Arne Baron; später Vorstand des Trägervereins) |
| Stellungnahme DSB | offen |
| Nächste Überprüfung | bei Änderung der Datenflüsse, spätestens nach einem Jahr |
