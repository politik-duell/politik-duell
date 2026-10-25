---
name: rollen-erfassen
description: Ruht, solange Rollen im Spiel ausgesetzt sind. Trägt für ein oder mehrere Themen des Politik-Duells belegte Rollen-Modifikatoren nach (Lösungsweg wirkt für Mieter:innen, Rentner:innen, Arbeitslose … nachweislich deutlich anders) – ohne Parteinamen, jeder mit Quelle und wörtlichem Beleg, als KI-Entwurf. Aufruf mit Themen-IDs, z. B. /rollen-erfassen 3 oder /rollen-erfassen 3 4 7; mit --alle auch KI-Entwürfe und Modifikatoren ohne Quelle neu.
argument-hint: <Thema-ID> [<Thema-ID> …] [--alle]
disable-model-invocation: true
---

# Rollen erfassen

Aufruf: **$ARGUMENTS**

> **Ruht (seit 25. 10. 2026):** Rollen sind im Spiel ausgesetzt, Modifikatoren zählen nicht (`docs/methode.md` → „Rollen“). Nicht ausführen, solange das gilt – außer die Betreiberin nimmt die Rollen ausdrücklich wieder auf.

Du bist Koordination: Recherchieren nur die Agenten `rollen-recherche`, ohne zu wissen, welche Partei einen Lösungsweg vorschlägt. Du recherchierst und formulierst nicht selbst. Anders als Nebenwirkungen **verändern Modifikatoren Punkte** (für Spielende mit dieser Rolle). Darum gilt „nachweislich“ streng: jeder Modifikator mit Quelle und wörtlichem Beleg, sonst keiner. Ergebnis: KI-Entwurf (`ki_entwurf: true` am Modifikator); geprüfte Bewertungen ändert der Skill nie. Hintergrund: `docs/plan-duell-regeln.md` → Abschnitt 4, Regeln: `daten/README.md` → „Rollen-Modifikator“.

## 0. Reihenfolge

Zuerst Themen, die im Spiel oft vorkommen (Admin → „Lücken“, `npm run -s themen:ueberblick -- --kurz`), dann die großen Alltagsthemen (Rente, Energie, Gesundheit, Arbeit, Miete).

## 1. Blindlisten

Je Thema:

```bash
npm run -s rollen:blind -- <ID> [--alle]
```

Teile zu höchstens sechs Lösungswegen, Wege zur selben Ursache möglichst zusammen (`.cache/rollen/<ID>/teil-<n>.json`) – Name, Ebene, Begründung, Grundwert der Wirksamkeit, Forschungsstand und unter `vorhanden` die Quellen, die der Katalog schon hat (Studie, Verteilungsfolgen); keine Partei, kein Zitat. Ohne `--alle` nur Wege ohne Modifikator, die noch kein Lauf bearbeitet hat (`daten/protokolle/rollen-<ID>/`).

## 2. Recherche

Je Teil ein Agent `rollen-recherche` (ohne Parameter `model`), **in Wellen zu höchstens vier gleichzeitig**. Auftrag nur die Zeile aus Schritt 1, ohne eigene Regeln – die stehen in der Agentendefinition:

> Prüfe `.cache/rollen/<ID>/teil-<n>.json`. Antwort in `.cache/rollen/<ID>/protokoll/antwort-<n>.txt`, Prüfung mit `npm run -s rollen:antwort-pruefen -- <ID> <n>`.

Der Hook sperrt dem Agenten alles außer Teil-Liste, eigener Antwort, Selbstprüfung, PDF-Text (`npm run -s nebenwirkungen:pdf`) und Websuche (Parteiserver gesperrt). Die Selbstprüfung verlangt je Modifikator bekannte Rolle, Wert −2 bis +2 (±2 nur mit Belegstufe A/B), Begründung ohne Parteinamen mit Zahlen nur aus dem Beleg, eine https-Quelle ohne Partei- und Presseserver, einen wörtlichen, zusammenhängenden Beleg (bei PDFs mit Seite, im Original gefunden), Belegstufe C nur mit zweiter Quelle; sie gleicht Suchen und geöffnete Quellen mit dem Transkript ab.

## 3. Urteil der Koordination (einmal, nach dem Prüfmuster in `../README.md`)

`npm run -s rollen:antwort-pruefen -- <ID> <n>` zeigt die Bilanz (je Weg Rollen mit Wert und Belegstufe). Kurz „passt“ oder „passt nicht: <Punkte>“, nur zu dem, was kein Skript prüfen kann:

- **Deutlich anders?** Belegt die Quelle einen Unterschied *für diese Gruppe beim Ziel des Themas* – oder nur, dass sie wie alle profitiert, oder nur Kosten außerhalb des Ziels (die gehören in die Nebenwirkungen)?
- **Gleiche Maßstäbe:** Meldet die Prüfung „nur bei einem Teil der Wege zur selben Ursache“, frag gezielt nach. Spiegelbildliche Rollen (Mieter:in/Eigentümer:in, angestellt/selbstständig) mit derselben Quelle geprüft?
- **Stichprobe:** Bei zwei Modifikatoren je Teil prüfen, ob der Beleg die Begründung trägt (Gruppe, Richtung, Zahl).

Bei „passt nicht“ **eine** gebündelte Rückfrage an denselben Agenten (SendMessage), danach ein letztes Urteil. Was dann nicht passt, wird gestrichen.

## 4. Eintragen

```bash
npm run -s rollen:eintragen -- <ID>
```

Prüft alle Antworten erneut, trägt die Modifikatoren als KI-Entwurf ein (Rolle, Wert, Begründung, Quelle – ohne Beleg-Zitat), entfernt bei `--alle` Modifikatoren ohne Beleg, prüft den Katalog (bei Fehlern zurück) und legt Teil-Listen und Antworten unter `daten/protokolle/rollen-<ID>/<Datum>/` ab.

## 5. Abschluss

```bash
npm run -s daten:pruefen && npm run -s seed && npm test -- --reporter=dot
```

Im Pull Request je Thema: Zahl der geprüften Wege, Modifikatoren je Rolle (+/−), gestrichene mit Grund. Gegenlesen sollten zwei Personen mit unterschiedlicher politischer Haltung; erst dann entfällt `ki_entwurf`.
