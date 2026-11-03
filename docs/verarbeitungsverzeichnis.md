# Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO)

Entwurf, Stand 3. November 2026. Grundlage: Code und Migrationen dieses Repositorys sowie die
Datenschutzerklärung (`src/rechtliches/Rechtliches.tsx`). Bei jeder Änderung an Datenflüssen alle drei
Stellen zusammen anpassen. Die Datenschutz-Folgenabschätzung steht in
`docs/datenschutz-folgenabschaetzung.md`.

> Kein Rechtsrat. Vor dem öffentlichen Start von einer fachkundigen Person prüfen lassen.

## Allgemeine Angaben

| Feld | Angabe |
|---|---|
| Verantwortlicher | **offen** – Betreiber bzw. Trägerverein (`src/rechtliches/betreiber.ts`, `docs/verein/`) |
| Kontakt | politik-duell@posteo.de |
| Datenschutzbeauftragte:r | **offen** – siehe DSFA, Abschnitt „Datenschutzbeauftragte:r“ |
| Auftragsverarbeiter | Vercel Inc. (USA, Hosting/CDN), Supabase Inc. (Datenbank, Edge Functions, Auth; Region Frankfurt), Mistral AI SAS (Paris, KI-Einordnung), Posteo e. K. (Berlin, E-Mail) |
| Drittlandübermittlung | Vercel (USA): EU-US Data Privacy Framework bzw. Standardvertragsklauseln; Supabase Inc. (USA) als Unternehmen mit Datenhaltung in Frankfurt: AVV mit Standardvertragsklauseln |

## Verarbeitungstätigkeiten

### V1 Auslieferung der Website

| Feld | Angabe |
|---|---|
| Zweck | Website ausliefern, Angriffe abwehren |
| Betroffene | Besucher:innen |
| Daten | IP-Adresse, Zeitpunkt, aufgerufene Datei, Browserkennung (Server-Logs bei Vercel) |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. f DSGVO |
| Empfänger | Vercel |
| Löschfrist | nach den Fristen von Vercel (kurzzeitige Logs) |
| TOM | HTTPS; keine eigenen Logs; keine Fremd-Skripte oder -Schriften |

### V2 KI-Einordnung der Eingaben (Edge Function `analyse`)

| Feld | Angabe |
|---|---|
| Zweck | Äußerung als Problem/Forderung/Wert/Grenze einordnen, Thema und Ursachen vorschlagen, Rückfragen stellen |
| Betroffene | Spielende (und ggf. Dritte, falls jemand trotz Hinweis Namen eingibt) |
| Daten | Eingabetext und Gesprächsverlauf der Runde, gewählte Parteien, Bundesland; kann politische Meinungen erkennen lassen (**Art. 9 DSGVO**) |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. a, Art. 9 Abs. 2 lit. a DSGVO (ausdrückliche Einwilligung vor Spielstart, ab 16 Jahren, Art. 8) |
| Empfänger | Supabase (Edge Function, Frankfurt), Mistral AI (Paris) |
| Löschfrist | Originaltext wird nach gewerteter Runde verworfen; Mistral: Aufbewahrung zur Missbrauchserkennung nach dessen Bedingungen (Training abgeschaltet – **prüfen**) |
| TOM | API-Schlüssel nur serverseitig; Temperatur 0,1, striktes JSON; Moderation auf Namen/Kontaktdaten; Logs nur mit Fehlermeldungen (bei Mistral-Fehlern bis 200 Zeichen der Fehlerantwort) |

### V3 Speicherung gespielter Runden (`runden`)

| Feld | Angabe |
|---|---|
| Zweck | Auswertung, welche Themen gespielt werden; Moderation |
| Daten | neutrale Kurzfassung (≤ 200 Zeichen, ohne Namen), Stichwort, Thema, Parteien, Punkte, Lösungsweg-/Haltungsnummer, Zeitpunkt, Testphasen-Markierung |
| Personenbezug | nach Gestaltung anonym (keine Kennung, keine IP, keine Verbindung zur Sitzung) |
| Rechtsgrundlage | Einwilligung (wie V2), soweit überhaupt Personenbezug besteht |
| Empfänger | Supabase; Admins |
| Löschfrist | keine feste – anonym; Admins können löschen |

### V4 Review-Warteschlangen (`review_eingaben`, `review_warteschlange`)

| Feld | Angabe |
|---|---|
| Zweck | Einordnung der KI prüfen, Themenkatalog verbessern |
| Daten | `review_eingaben`: Eingaben im Wortlaut bei Runden ohne Wertung, Grund, Thema, Kurzfassung, Zeitpunkt – ohne Parteien und ohne Verbindung zur Runde. `review_warteschlange`: Kurzfassung und vorläufige Einschätzung zu unbekannten Themen |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. a, Art. 9 Abs. 2 lit. a DSGVO |
| Empfänger | nur Admins (RLS) |
| Löschfrist | `review_eingaben`: beim Sichten, spätestens nach 30 Tagen (Funktion bei jedem Eintrag; täglich per `pg_cron` – **aktiv? prüfen**). `review_warteschlange`: anonym, keine feste Frist |

### V5 Missbrauchsschutz (`rate_limit`)

| Feld | Angabe |
|---|---|
| Zweck | Anfragen begrenzen, Kosten deckeln |
| Daten | zufällige Sitzungsnummer (sessionStorage) und Zähler |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. f DSGVO; Speichern im Browser § 25 Abs. 2 Nr. 2 TDDDG |
| Löschfrist | höchstens ein Tag auf dem Server; im Browser beim Schließen des Tabs |

### V6 Moderationskonten (`admins`, Supabase Auth)

| Feld | Angabe |
|---|---|
| Betroffene | Moderationsteam |
| Daten | E-Mail-Adresse, Passwort-Hash, Anmeldezeitpunkte |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b bzw. f DSGVO |
| Löschfrist | bei Ausscheiden aus dem Team |

### V7 Prüfung von Bewertungen (`pruef_einladungen`, `pruef_bewertungen`, `pruef_einheiten`)

| Feld | Angabe |
|---|---|
| Betroffene | eingeladene Prüfende |
| Daten | Name, zugeteilte Themen, Hash des Links, Einwilligungszeitpunkt, Einverständnis zur Namensnennung, Bewertungen und Notizen je Maßnahme, Zeitpunkte |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. a, Art. 9 Abs. 2 lit. a DSGVO |
| Empfänger | Betreiber (Admin-Ansicht); öffentlich nur Median, Anzahl, Spannweite, ggf. Name mit Zustimmung |
| Löschfrist | bei Widerruf sofort (Prüfseite oder E-Mail); sonst wenn für die Nachvollziehbarkeit nicht mehr nötig, spätestens Projektende |

### V8 Geschlossene Testphase (`testphase_zugaenge`)

| Feld | Angabe |
|---|---|
| Betroffene | eingeladene Testpersonen |
| Daten | Hash des Zugangscodes, Bezeichnung des Zugangs, Anlegedatum; Code im localStorage |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b/f DSGVO; § 25 Abs. 2 Nr. 2 TDDDG |
| Löschfrist | Ende der Testphase oder auf Wunsch |

### V9 E-Mail-Kontakt

| Feld | Angabe |
|---|---|
| Daten | E-Mail-Adresse, Nachricht |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. f DSGVO |
| Empfänger | Posteo |
| Löschfrist | wenn die Anfrage erledigt ist |
