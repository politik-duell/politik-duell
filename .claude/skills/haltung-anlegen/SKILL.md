---
name: haltung-anlegen
description: Phase A für eine oder viele Haltungen (Wertfragen) des Politik-Duells – je Haltung ein Agent haltung-recherche (parallel) für neutrale Ja/Nein-Frage, Beschreibung, Zielkonflikte mit unabhängigen Quellen, Maßstab der Einordnung und Suchbegriffe, ohne Blick in Wahlprogramme. Endet mit KI-Freigabe (Testphase) und eigenem Commit; mit --erfassen geht es direkt mit /haltung-erfassen weiter. Aufruf z. B. /haltung-anlegen Wehrpflicht; Schuldenbremse --erfassen oder mit einer Auswahl aus /liste-einordnen.
argument-hint: <Wertfrage oder Stichwort>[; …] | --liste <.cache/listen/…md> [--erfassen]
disable-model-invocation: true
model: opus
---

# Haltung anlegen (Phase A)

Aufruf: **$ARGUMENTS**

Eine **Haltung** ist eine Wertfrage, über die vernünftige Menschen verschieden urteilen; die Haltungskarte zeigt ohne Punkte, wo die Parteien stehen. Regeln: `docs/plan-haltungen.md` → B1–B3, Format: `daten/README.md` → „haltungen/NN-name.json“. Diese Phase legt Frage und Maßstab fest, **bevor** jemand in Programme schaut, und endet mit KI-Freigabe für die Testphase.

**Eingabe:** einzelne Stichwörter durch „;“ getrennt, oder mit `--liste <datei>` die bestätigten Zeilen einer Einordnungstabelle: `npm run -s liste:auswahl -- <datei> --art haltung` (Vorschlag für die Frage steht in der Tabelle). **Vor** `phase-a start` ausführen – während der Sperre ist `.cache/` nicht lesbar.

**Als Erstes:** `npm run phase-a -- start "Haltungen"` (sperrt Programme, auch für Agenten). **Zum Schluss:** `npm run phase-a -- ende`.

## Schritte

1. **Aufnahme prüfen** – nur bei Stichwörtern ohne Tabelle (die Tabelle ist schon geprüft): vorhandene Fragen mit `npm run -s themen:ueberblick -- --haltungen`, Themen mit `-- --kurz` (Haltungsdateien nicht lesen – sie enthalten Positionen aus Programmen). Nicht aufnehmen (ein Satz Grund): Tatsachenfrage, Alltagsproblem (→ `/thema-anlegen`), Forderung zu einem Thema (→ `/forderung-erfassen`), Frage über Würde oder gleiche Rechte einer Gruppe, schon vorhanden. Ob drei Programme eine Position haben, zeigt erst `/haltung-erfassen`.
2. **Recherche:** je Haltung ein Agent `haltung-recherche`, bis zu zehn gleichzeitig. Auftrag: Stichwort bzw. vorgeschlagene Frage, die Liste der vorhandenen Fragen (damit nichts doppelt wird), die Themen aus `themen:ueberblick -- --kurz` (für `verwandte_themen`), Datum. Der Agent gibt JSON zurück; bei `"abbruch"` die Haltung auslassen und den Grund notieren.
3. **Prüfen** nach dem Prüfmuster (`.claude/skills/README.md`), kurz „passt“ oder „passt nicht“, keine eigene Nachrecherche, keine eigenen Formulierungen. Maßstab: Frage endet mit „?“, ist neutral und ohne Partei oder wertende Wörter, beide Antworten sind vertretbar; zwei bis vier Zielkonflikte, je Seite mindestens einer, jeder mit https-Quelle, die zur Aussage passt; `einordnung` mit allen drei Werten, eindeutig unterscheidbar; 4–10 spezifische Suchbegriffe. **Passt nicht:** eine gebündelte Rückfrage mit allen Punkten an denselben Agenten (SendMessage), danach ein letztes Urteil; was dann nicht passt, auslassen (Grund notieren).
4. **Dateien** `daten/haltungen/NN-name.json`, IDs fortlaufend ab `npm run -s daten:id -- --haltung`: `id`, `frage`, `beschreibung`, `verwandte_themen` (aus dem Vorschlag des Agenten), `zielkonflikte`, `einordnung`, `suchbegriffe`, `schlagwoerter`, `freigabe: { "datum": "<heute>", "art": "ki" }`. Format wie `01-tempolimit.json`.
5. **Dokumentieren:** in `docs/haltungen.md` unter „Weitere Haltungen (KI-Entwurf)“ je Haltung eine Tabellenzeile: Nr., Frage, Quellen der Zielkonflikte, „KI-Freigabe <Datum>“. Ausgelassenes mit Grund darunter.
6. **Prüfen:** `npm run daten:pruefen`. Allein aufgerufen (ohne `--erfassen`, nicht aus `/liste-ausfuehren`) danach `npm run seed` und `npm test -- --reporter=dot`; sonst laufen Seed und Tests einmal am Ende.
7. **Abschließen:** `npm run phase-a -- ende`, **eigener Commit** nur mit Phase A („Haltungen: Fragen und Zielkonflikte (KI-Freigabe)“) – er belegt, dass die Fragen standen, bevor Positionen dazukamen.
8. **Weiter:** mit `--erfassen` `.claude/skills/haltung-erfassen/SKILL.md` lesen und für alle neuen IDs in **einem** Lauf folgen; sonst pushen und „Weiter mit `/haltung-erfassen <IDs>`“ melden. Aus `/liste-ausfuehren` aufgerufen: nur committen – Push und Pull Request macht die Liste.
