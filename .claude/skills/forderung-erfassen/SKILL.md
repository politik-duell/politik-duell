---
name: forderung-erfassen
description: Trägt für ein schon erfasstes Thema des Politik-Duells einen fehlenden Lösungsweg nach (Forderungskarte „Zeig mir, wer das fordert“) – prüft, ob es das Instrument schon gibt, ergänzt sonst Suchbegriffe im Leitfaden, durchsucht alle erfassten Programme nur danach, bewertet neue Fundstellen ohne Parteinamen und ergänzt die vorhandenen Einträge als KI-Entwurf. Aufruf z. B. /forderung-erfassen 2 "Mietendeckel" oder mehrere Forderungen eines Themas: /forderung-erfassen 2 "Mietendeckel"; "Wohngeld erhöhen"; mehrere Themen durch „|“ getrennt: /forderung-erfassen 2 "Mietendeckel" | 15 "Tempolimit" (dann ein Agent je Programm für alle Themen).
argument-hint: <Themen-ID> "<Forderung>"[; "<Forderung>" …] [| <Themen-ID> "<Forderung>" …]
disable-model-invocation: true
model: opus
---

# Forderung erfassen (Nachtrag eines Lösungswegs)

Aufruf: **$ARGUMENTS**

Eine Forderung („weniger X“, „Y einführen“) ist im Politik-Duell ein **Lösungsweg** (Instrument) eines Themas. Die Forderungskarte zeigt, welche Programme ihn haben. Fehlt er, wurde bisher nicht danach gesucht. Dieser Skill sucht nur danach – in **allen** Programmen, die zum Thema schon erfasst sind, mit denselben Begriffen – und ergänzt die Einträge. Vorhandenes bleibt unverändert. Ergebnis: KI-Entwurf für die Testphase.

Du bist Koordination wie in `/thema-erfassen` (liest keine Programme, vergibst keine Werte). Die Befehle und Agenten sind dieselben; Unterschiede stehen hier.

**Mehrere Themen** (durch „|“ getrennt): Schritte 1–2 je Thema, in Schritt 3 je Thema die Arbeitsdatei, dann ein gemeinsamer Lauf mit allen Arbeitsdateien (ein Agent je Programm für alle Themen).

**Zusammen mit neuen Themen** (aus `/liste-ausfuehren`): nur Schritte 1–2 und die Arbeitsdatei aus Schritt 3; erfasst wird im selben Lauf wie die neuen Themen (`/thema-erfassen` mit allen Arbeitsdateien) – ein Durchgang der Sammelbefehle, eine Bewertungsrunde.

## 1. Gibt es den Lösungsweg schon?

```bash
npm run -s instrumente '--' <ID>
```

Zeigt Ursachen und Instrumente des Themas (ohne Parteinamen). Ist die Forderung **derselbe Lösungsweg** wie ein Instrument (auch in anderen Worten): melden „schon erfasst als I<ID>“, für diese Forderung fertig. Die Gegenrichtung desselben Hebels (abschaffen statt einführen) ist ein eigener Lösungsweg.

Abbrechen und sagen, warum, wenn die Forderung
- an keiner Ursache des Themas ansetzt (dann fehlt eine Ursache – Entscheidung der Betreiberin – oder sie gehört zu einem anderen Thema),
- eine Wertfrage ist (→ `/haltung-anlegen`) oder ein Pauschalurteil über eine Gruppe.

## 2. Suchbegriffe ergänzen

Ohne Blick in Programme: im Leitfaden `daten/leitfaeden/<ID>.json` unter der passenden Ursache eine neue Lösungsrichtung mit neutralem Namen und Begriffen (Wortteile, auch übliche Gegenbegriffe derselben Richtung, möglichst spezifisch). Fehlt die **Gegenrichtung** desselben Hebels in den Suchbegriffen (etwa „Mietregulierung lockern“ zu „Mietendeckel“), ergänze sie ebenfalls – sonst fände der Nachtrag nur eine Seite. Ursachen und Ziel bleiben unverändert.

Mehrere Forderungen eines Themas in einem Durchgang: alle Richtungen in einen Nachtrag.

## 3. Nachtrag erfassen

Liegt schon ein Arbeitsordner `.cache/entwurf/<ID>/` vor, umbenennen (`mv .cache/entwurf/<ID> .cache/entwurf/<ID>-<Datum>`). Dann `.cache/entwurf/<ID>/erfassung.json`:

```json
{ "thema_id": 2, "nachtrag": { "forderung": "Mietendeckel", "richtungen": { "202": ["Mieten deckeln", "Mietregulierung lockern"] } }, "programme": [] }
```

Danach wie in `/thema-erfassen` die Schritte 1–4 mit `entwurf:lauf` (`vorab` – ohne Freigabeprüfung, das Thema ist schon erfasst –, `auftraege`, Agenten `programm-erfassung`, `erfasst`, `blind`, Agent `blind-bewertung`, `bewertet`). Die Skripte beschränken alles auf die Richtungen des Nachtrags:
- Aufträge nur für Programme, die schon einen Eintrag haben (andere erst mit `/thema-erfassen`), mit der Liste „Bereits erfasst“.
- Die Blindliste enthält die vorhandenen Instrumente; die Bewertung ordnet neue Fundstellen einem vorhandenen oder neuen Instrument zu.
- `entwurf:eintragen` **ergänzt** die Einträge: neue Maßnahmen dazu, gleiche Zitate nicht doppelt, „keine Maßnahme“ wird bei einem Fund zur Maßnahme, ohne Fund bleibt alles, wie es war.

## 4. Abschluss

Bericht und Archiv (`nachtrag-<Forderung>`) erledigt `bewertet`. Danach zur Kontrolle:

```bash
npm run -s instrumente '--' <ID>
```

Commit „<Thema>: Lösungsweg <Forderung> nachgetragen (KI-Entwurf)“ mit Themendatei, Leitfaden, `supabase/seed.sql`, `supabase/seed-teile/`, Protokoll. Aus `/liste-ausfuehren` aufgerufen: nur committen – Push und Pull Request macht die Liste. Sonst Pull Request: ein Satz je Forderung (Instrument-ID, in wie vielen Programmen gefunden) und `pr-daten.md`.
