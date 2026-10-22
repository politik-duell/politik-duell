---
name: nebenwirkungen-erfassen
description: Erfasst für ein oder mehrere Themen des Politik-Duells die belegten Folgen der Lösungswege über das Thema hinaus (sechs Bereiche nach § 44 GGO, ergänzt um Verteilung und Grundrechte) – ohne Parteinamen, ohne Punkte, als KI-Entwurf. Aufruf mit Themen-IDs, z. B. /nebenwirkungen-erfassen 3 oder /nebenwirkungen-erfassen 3 4 7; mit --alle auch schon erfasste KI-Entwürfe neu.
argument-hint: <Thema-ID> [<Thema-ID> …] [--alle]
disable-model-invocation: true
---

# Nebenwirkungen erfassen

Aufruf: **$ARGUMENTS**

Läuft als Schritt 5 von `/thema-erfassen` für jedes neu erfasste Thema mit; einzeln aufrufen nur zum Nachholen, für ältere Themen oder mit `--alle`. Aus `/thema-erfassen` heraus entfällt hier Schritt 5 (Abschluss) – Prüfung, Commit und Pull Request macht `/thema-erfassen`.

Du bist Koordination: Recherchieren nur die Agenten `nebenwirkungen-recherche`, und zwar ohne zu wissen, welche Partei einen Lösungsweg vorschlägt. Du recherchierst und formulierst nicht selbst. Ergebnis: KI-Entwurf für die Testphase (`ki_entwurf: true`); die Punkte ändern sich nie. Regeln und Begründung: `docs/plan-nebenwirkungen.md`.

## 0. Voraussetzung

Das Thema hat bewertete Instrumente bzw. Maßnahmen (`npm run -s themen:ueberblick -- --kurz`). Ein Lauf nimmt standardmäßig nur Lösungswege ohne Hinweise; `--alle` erneuert auch KI-Entwürfe. Menschlich geprüfte Hinweise bleiben immer stehen.

## 1. Blindlisten

Je Thema:

```bash
npm run -s nebenwirkungen:blind -- <ID> [--alle]
```

Das Skript teilt die Lösungswege in Teile zu höchstens sechs (`.cache/nebenwirkungen/<ID>/teil-<n>.json`) – nur Name, Ebene und Begründung, keine Partei, kein Zitat – und bricht ab, wenn eine Begründung einen Parteibezug enthält. Es gibt je Teil den Auftrag aus.

## 2. Recherche

Je Teil ein Agent `nebenwirkungen-recherche` (bis zu sieben gleichzeitig, ohne Parameter `model`), Auftrag nur die Zeile aus Schritt 1:

> Recherchiere `.cache/nebenwirkungen/<ID>/teil-<n>.json`. Antwort in `.cache/nebenwirkungen/<ID>/protokoll/antwort-<n>.txt`, Prüfung mit `npm run -s nebenwirkungen:antwort-pruefen -- <ID> <n>`.

Der Hook sperrt dem Agenten alles außer Teil-Liste, eigener Antwort, Selbstprüfung und Websuche (Parteiserver gesperrt). Die Selbstprüfung verlangt je Lösungsweg alle sechs Bereiche mit Suchanfragen **in beide Richtungen**, höchstens drei Hinweise, einen wörtlichen Beleg aus der Quelle, Belegstufe C nur mit zweiter Quelle, keine Parteiquellen und -namen.

## 3. Urteil der Koordination (einmal, nach dem Prüfmuster in `../README.md`)

Je Teil ruft `npm run -s nebenwirkungen:antwort-pruefen -- <ID> <n>` die Bilanz ab (je Lösungsweg Bereiche mit `+`/`−`/`±`). Kurz „passt“ oder „passt nicht: <Punkte>“, nur zu dem, was kein Skript prüfen kann:

- **Abgrenzung:** Steht ein Hinweis eigentlich für die Wirkung auf das Thema selbst (gehört in die Bewertung)? Dann raus.
- **Gleiche Maßstäbe:** Bekommen ähnliche Lösungswege ähnliche Hinweise – etwa beide Steuersenkungen eine Haushaltsangabe? Fehlt bei einem, was beim anderen steht?
- **Bilanz:** Meldet die Prüfung „einseitig“ oder haben Wege einer Richtung nur Nachteile und die der anderen nur Vorteile, frag gezielt nach der Gegenrichtung.
- **Stichprobe:** Öffne bei zwei Hinweisen je Teil die Quelle (WebFetch) und prüfe, ob `beleg` dort steht.

Bei „passt nicht“ **eine** gebündelte Rückfrage an denselben Agenten (SendMessage), danach ein letztes Urteil. Was dann nicht passt, wird verworfen – der Agent setzt `hinweis: null` und prüft erneut.

## 4. Eintragen

```bash
npm run -s nebenwirkungen:eintragen -- <ID>
```

Prüft alle Antworten erneut, trägt die Hinweise als KI-Entwurf ein (ohne Beleg-Zitat), prüft den Katalog (bei Fehlern zurück) und legt Teil-Listen und Antworten unter `daten/protokolle/nebenwirkungen-<ID>/<Datum>/` ab.

## 5. Abschluss

```bash
npm run -s daten:pruefen && npm run -s seed && npm test -- --reporter=dot
```

Im Pull Request je Thema: Zahl der Lösungswege mit Hinweisen und ohne, die Bilanz (Vorteile/Nachteile/gemischt), verworfene Hinweise mit Grund. Gegenlesen sollten zwei Personen mit unterschiedlicher politischer Haltung; erst dann entfällt `ki_entwurf`.
