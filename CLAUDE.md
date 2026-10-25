# Projekt: „Politik-Duell"

Slogan: *„Versprechen kann jeder."*

Ein Zwei-Spieler-Webspiel: Spieler nennen reale Alltagsprobleme, das Spiel prüft, welche Partei dafür die **wirksamste und umsetzbare** Lösung bietet – mit Beleg-Link nach jeder Runde.

## Grundprinzipien (nicht verhandelbar)

1. **Neutrale Methode, kein vorgegebenes Ergebnis.** Alle Parteien werden nach denselben Kriterien bewertet. Bietet eine Partei nachweislich die beste Lösung, gewinnt sie – egal welche.
2. **Die KI vergibt keine Punkte.** Sie führt nur das Gespräch und schlägt Themen/Ursachen vor; gewertet wird nur, was die Person bestätigt hat. Punkte kommen deterministisch aus der kuratierten Datenbank. (KI-gestützte Entwürfe für Maßnahmen und Bewertungen im Datenkatalog sind erlaubt, sind gekennzeichnet und zählen in der Alpha-/Beta-Phase auch ungeprüft – öffentlich, mit deutlichem Hinweis am Ergebnis; Schalter `einstellungen.ki_entwuerfe_oeffentlich`, vorher nur mit Zugangslink zur geschlossenen Testphase. Spätestens zum regulären Betrieb zählen sie erst nach menschlicher Prüfung, `docs/methode.md` → „KI-Entwürfe“.)
3. **Die KI erfindet niemals Quellen oder Links.** Alle Belege stammen ausschließlich aus der Datenbank.
4. **Forderung ≠ Problem.** Nennt ein Spieler eine Forderung („weniger X"), fragt die KI nach dem konkreten Alltagsproblem dahinter.
5. **Datenschutz:** Politische Meinungen sind besondere Daten (Art. 9 DSGVO). Keine Konten, keine IPs, kein Audio speichern – nur anonymen Problemtext. Ausnahme: Runden ohne Wertung (auch `grenze`) landen im Wortlaut in der Review-Warteschlange `review_eingaben` – nur Admins, ohne Parteien und ohne Verbindung zur Runde, gelöscht beim Sichten oder nach 30 Tagen.

## Kurzfassung

- **Parteien:** CDU/CSU, SPD, Grüne, FDP, AfD, Linke, BSW. Grundlage: Wahlprogramme zur Bundestagswahl 2025 (wo vorhanden ergänzt um neuere Grundsatzprogramme); für Ursachen in Länderzuständigkeit Landtagswahlprogramme der laufenden Wahlperiode (zuerst ST, MV, BE).
- **Runde:** Die KI ordnet eine Äußerung als `problem` | `forderung` | `wert` | `grenze` ein. Nur `problem` mit Thema und Ursachen wird gewertet – nach Bestätigung durch die Person (Vorauswahl nur, wenn die KI sicher ist; immer „Nichts davon passt“, kein Wechsel zu einem anderen Thema, `docs/plan-zuordnung.md`); `forderung` kann die Forderungskarte, `wert` die Haltungskarte zeigen (beide ohne Punkte); `grenze` ohne Wiedergabe und ohne Inhalt in `runden`. 5 Runden, danach Gesamtsieger.
- **Punkte:** je Maßnahme `wirksamkeit × umsetzbarkeit` (je 0–3; Rollen-Modifikatoren sind vorerst ausgesetzt, `docs/methode.md`); je Ursache mehrere Lösungswege mit abnehmendem Gewicht (1, ½, ¼ …, höchstens 9); Rundenpunkte = Summe über die zugeordneten Ursachen (höchstens 3 einzeln; eine **Symptomgruppe** – Folge mehrerer Ursachen, kuratiert in `daten/` – zählt ganz, `docs/plan-symptome.md`). Ist ein Thema für eine der Parteien **nicht erfasst** (Tabelle `abdeckung`), wird die Runde nicht gewertet. Unbekanntes Thema: Einschätzung „ungeprüft – keine Wertung“, ohne Punkte und Links.
- **Technik:** React + Vite + TypeScript (PWA, Vercel); Supabase Frankfurt (Postgres mit RLS, Edge Functions); KI nur aus der Edge Function `analyse`, striktes JSON, Temperatur 0,1. Frontend liest nur, schreibt über die Edge Function.
- **Daten:** kuratiert als JSON in `daten/` → Pull Request mit Quellenpflicht und automatischer Prüfung → `npm run seed` erzeugt `supabase/seed.sql`. Erfassung über die Skills in `.claude/skills/` (Übersicht: `.claude/skills/README.md`).
- **Branding:** Name „Politik-Duell“ (nicht „Wer liefert?“); Quizshow-Anmutung, aber nichts von „Wer wird Millionär“ nachbilden; Tonalität neutral, freundlich, leicht spielerisch, keine Seitenhiebe auf Parteien. Domain politik-duell.de; Supabase-Projekt heißt technisch `wer-liefert`.

## Arbeitsweise (Kontext sparen)

- Kommandoausgaben kurz halten: `npm run -s …`, `npm test -- --reporter=dot`, bei langen Ausgaben nur Ende oder Treffer (`| tail -20`, `grep`).
- Große Dateien nur in Ausschnitten lesen (Zeilenbereich, Grep zuerst); erzeugte Dateien (`supabase/seed.sql`, `supabase/seed-teile/`, `dist/`) gar nicht – Quelle ist `daten/`.
- Breite Suchen über viele Dateien an einen Subagenten (Explore) geben; im Hauptkontext nur das Ergebnis.
- Antworten knapp: Ergebnis zuerst, keine Wiederholung von Plan oder Diff, keine Zusammenfassung dessen, was gerade zu sehen war.

## Wo steht was

- `docs/konzept.md` – Spielablauf im Detail, Bewertungslogik, Datenmodell-Entwurf, KI-Schnittstelle, Moderation, Branding, Meilensteine, offene Punkte
- `docs/datenmodell.md` – Schema, Views und Rechte (Stand der Migrationen)
- `docs/methode.md` – Methode, Lösungswege je Ursache, Bund und Länder, „Grenze“
- `daten/README.md` – Datenformat und Prüfung; `docs/plan-*.md` – Pläne (Haltungen, Prüfung, Sicherungen)
- `docs/verein/` – Trägerverein, Lizenzen (Code AGPL-3.0-or-later, Daten CC BY 4.0)
