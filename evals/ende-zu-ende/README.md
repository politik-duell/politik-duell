# End-to-End-Eval der Skills

Ein zentrales Eval für den ganzen Ablauf eines Skills – nicht für einzelne Skripte (die sichern die Tests unter `scripts/`, die Szenarien je Skill unter `.claude/skills/<skill>/evals/`). Es misst, was am Ende in `daten/` landet, und wie der Lauf dorthin kam. Grundlage für jede Änderung am Zuschnitt von Skills und Agenten, etwa einen Agenten in die Koordination einzufalten: erst messen, eine Sache ändern, mit und ohne vergleichen, behalten, was sich hält.

Bisher deckt es `/thema-erfassen` ab (Erfassung, Bewertung ohne Parteinamen, Eintragen), mit den Bundesprogrammen der Themen 30 und 33. Zu diesen Themen gibt es schon Vergleichstests (`.claude/skills/thema-erfassen/evals/README.md`), deren Streuung bekannt ist.

## Goldfälle

`faelle/<Thema>-<Partei>.json`, ein Fall je Thema und Bundesprogramm:

| Feld | Bedeutung |
|---|---|
| `erwartet` | Stellen, die als Maßnahme erfasst werden sollen: Seite, Zitat, Ursachen, blind vergebene Werte des Instruments. `pflicht: true` = muss jeder Lauf finden. |
| `verboten` | Stellen, die nicht als Maßnahme zählen dürfen. Erzeugt aus den Stellen, die die Bewertung ohne Parteinamen im Archiv verworfen hat. |
| `keine_massnahme` | Das Programm enthält nichts zum Thema; jede erfasste Maßnahme ist ein Fehlgriff. |
| `geprueft` | `{ "von": …, "am": "JJJJ-MM-TT" }` nach menschlicher Durchsicht, sonst `null`. |

**Stand: Alle Fälle sind aus KI-Entwürfen erzeugt** (`npm run -s eval:e2e -- gold 30 33`) und noch nicht von Menschen geprüft. Bis dahin misst das Eval nur, ob ein Lauf vom bisherigen Stand abweicht, nicht, ob er richtig ist. Bei der Durchsicht je Fall:

- Fehlt eine Zusage im Programm, kommt sie unter `erwartet` dazu.
- Die zentralen Zusagen bekommen `pflicht: true`. Gute Kandidaten sind Stellen, die in den Vergleichstests einzelnen Läufen fehlten und schon erwartet sind (Grüne S. 85 zu 33, Linke S. 20 zu 30).
- Bei verbotenen Stellen prüfen, ob die Bewertung sie zu Recht verworfen hat (etwa Union S. 47 zu 30).
- Werte, die nicht zum Maßstab in `docs/methode.md` passen, werden korrigiert. Das Urteil fällt ohne Blick auf den Parteinamen.
- Ist die Durchsicht fertig, wird `geprueft` gesetzt. `gold … --ueberschreiben` ersetzt auch geprüfte Fälle, darum danach nur noch von Hand ändern.

Gleich heißt wie in den Vergleichstests: Seite ±1 und mindestens 60 % gemeinsame Wörter, bezogen auf das kürzere Zitat.

## Urteil je Fall

Ein Fall ist **bestanden**, wenn

- mindestens 75 % der erwarteten Stellen gefunden sind und keine Pflichtstelle fehlt,
- jede gefundene Stelle mindestens eine Ursache mit dem Goldstandard teilt,
- Wirksamkeit und Umsetzbarkeit um höchstens 1 abweichen,
- keine verbotene Stelle als Maßnahme zählt (bei `keine_massnahme`: gar keine).

Zusätzliche Stellen (weder erwartet noch verboten) zählen nicht gegen den Fall, stehen aber in `ergebnis.json` zum Nachsehen. Was dort wiederholt als richtig auffällt, gehört in den Goldfall.

**Nicht erfasst** (Programm nicht ladbar, Lauf abgebrochen) zählt weder als bestanden noch als nicht bestanden und steht gesondert im Bericht. Hier betrifft das derzeit das BSW (HTTP 503).

Je Variante gilt ein Fall als bestanden, wenn er in mehr als der Hälfte der gewerteten Läufe bestand. Ein Lauf allein reicht nicht: Dieselbe Erfassung findet in zwei Läufen verschiedene Stellen (Vergleichstests: 31 bzw. 32 von 34).

## Ablauf

Aus `ereignisse.jsonl` (stream-json von `claude -p`, je Zeile mit `t` = ms seit Start):

- Agenten je Typ mit Anzahl und Dauer, Kosten, Tokens je Modell, Züge, Dauer
- Regelverstöße der Koordination:
  - liest Programmtexte selbst (`.cache/texte/`, `.cache/programme/`)
  - startet einen Agenten mit Parameter `model`
  - `git push` oder Pull Request im Eval-Lauf

## Befehle

```bash
npm run -s eval:e2e -- pruefen                       # Goldfälle gültig? (läuft auch in npm test)
npm run -s eval:e2e -- lauf --variante basis --trocken
npm run -s eval:e2e -- lauf --variante basis --wiederholungen 3
npm run -s eval:e2e -- auswerten basis
npm run -s eval:e2e -- vergleichen basis eingefaltet
```

`lauf` legt je Wiederholung eine Arbeitskopie (`git worktree`) von `--ref` (Standard `HEAD`) an. Darin entfernt es die Bundes-Einträge der Themen und die Instrumente, an denen danach keine Maßnahme mehr hängt, und committet das. Dann startet es `claude -p "/thema-erfassen 30 33 --bund"`:

- Ein Zusatz zum Systemprompt sagt dem Lauf: keine Rückfragen an die Betreiberin, nur committen.
- `git push` und Pull Requests sind gesperrt.
- `node_modules` und die geladenen Programme (`.cache/programme`, `.cache/texte`) werden verlinkt.

Ergebnis je Lauf unter `.cache/eval-e2e/<variante>/<nr>/`:

- `lauf.json`
- `ereignisse.jsonl`
- `thema-<ID>.json` (Themendatei nach dem Lauf)
- `entwurf/<ID>/` (Arbeitsordner der Erfassung)
- `ergebnis.json`

Danach wird die Arbeitskopie entfernt, außer mit `--behalten`. `auswerten` wertet alle Läufe neu aus, so gelten geänderte Goldfälle auch für alte Läufe.

- `--trocken` legt die Arbeitskopie nur an und prüft sie (`daten:pruefen`, `ursachen:freigegeben`), ohne `claude` zu starten.
- Rechte: Der Lauf ist unbeaufsichtigt, darum `--permission-mode dontAsk` mit einer festen Liste (`ERLAUBT` in `scripts/eval-e2e.ts`: npm-Skripte, `git add`/`commit`, Lesen und Schreiben, Agenten, Websuche). Alles andere wird ohne Rückfrage abgelehnt und steht im Ereignisprotokoll – braucht der Skill mehr, ist das ein Befund. `--rechte <Modus>` setzt einen anderen Modus.
- `--claude …` gibt weitere Argumente an `claude` weiter, etwa `--model`.

**Kosten:** Ein Lauf entspricht einem echten `/thema-erfassen` mit zwei Themen und sechs bis sieben Programmen, also Erfassung (Haiku), Bewertung (Opus) und Folgen (Sonnet). Grob ein bis zwei Millionen Tokens und rund eine halbe Stunde. Das Eval ist darum nicht Teil der CI. Geprüft werden dort nur die Goldfälle und die Auswertung (`scripts/eval-e2e.test.ts`).

## Varianten vergleichen

Eine Variante ist ein Stand der Skills und Agenten, etwa ein Zweig, in dem `ursachen-recherche` eingefaltet ist. So geht man vor:

1. `lauf --variante basis --wiederholungen 3` auf `main`.
2. `lauf --variante <name> --ref <zweig> --wiederholungen 3`.
3. `vergleichen basis <name>`: Fundquote, Kosten, Dauer und die **gekippten Fälle**, also in der einen Variante mehrheitlich bestanden, in der anderen nicht. Nicht nur den Gesamtwert ansehen: Eine Variante kann gleich viele Fälle bestehen und dabei andere verlieren.

Behalten wird die Änderung nur, wenn keine Fälle verloren gehen oder die verlorenen erklärt sind.

## Erweitern

- **Weitere Themen:** `gold <ID>`, dann durchsehen. Gut geeignet sind kleine Themen mit Archiv unter `daten/protokolle/<ID>/` (dort stehen die verworfenen Stellen).
- **Weitere Skills** (`/haltung-erfassen`, `/nebenwirkungen-erfassen`): eigener Wert für `skill`, eigene Vorbereitung und Auswertung in `scripts/eval-e2e/`.
