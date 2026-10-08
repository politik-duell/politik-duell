---
name: thema-erfassen
description: Erfasst für ein oder mehrere Themen des Politik-Duells mit freigegebenen Ursachen (auch KI-Freigabe) die Maßnahmen aus allen Wahlprogrammen – je Programm ein Erfassungs-Agent, Bewertung ohne Parteinamen durch einen Blind-Agenten, Eintragen als ungeprüfter KI-Entwurf, automatische Prüfung, Pull Request. Aufruf mit Themen-IDs, z. B. /thema-erfassen 17 oder /thema-erfassen 19 20 --bund.
argument-hint: <Themen-ID> [<Themen-ID> …] [--bund | --land XX …]
disable-model-invocation: true
---

# Thema erfassen (Maßnahmen, KI-Entwurf)

Aufruf: **$ARGUMENTS**

Du bist die **Koordination**: Du startest Skripte und Agenten und prüfst, ob die Skripte bestehen. Programme lesen nur die Agenten `programm-erfassung`, bewerten nur der Agent `blind-bewertung`. Du liest keine Programme, vergibst keine Werte, keine Zuordnungen und stellst keine inhaltlichen Rückfragen – was ein Skript nicht beanstandet, gilt. Das Ergebnis ist ein KI-Entwurf für die geschlossene Testphase; Menschen prüfen später (`daten/README.md` → „Prüfung“).

Alle Befehle **führst du aus** (`npm run -s …`), die Skripte musst du nicht lesen. Arbeitsordner: `.cache/entwurf/<ID>/`. Lange Ausgaben stehen in Dateien – hole sie nicht in deinen Kontext, wenn die Zahlen der Skriptausgabe genügen. Windows: [reference/windows.md](reference/windows.md). Fehlermeldungen: [reference/fehlerbilder.md](reference/fehlerbilder.md).

Bund und Länder in einem Durchgang (ohne `--bund`/`--land` laufen alle Programme; Landesprogramme nur, wenn das Thema Landesursachen hat).

**Mehrere Themen** (auch Nachträge aus `/forderung-erfassen`, deren Arbeitsdatei mit `nachtrag` schon steht): Schritte 0–1 je Thema, dann **gemeinsam erfassen** – jedes Programm wird einmal gelesen statt einmal je Thema:

```bash
npm run -s entwurf:sammelauftrag '--' .cache/entwurf/<ID>/erfassung.json .cache/entwurf/<ID>/erfassung.json …
```

Je Sammelauftrag ein Agent `programm-erfassung` (ohne Parameter `model`), Auftrag nur: „Erledige den Sammelauftrag `.cache/entwurf/sammel/auftraege/<Name>.md` nach `.claude/agents/programm-erfassung.md`.“ Er schreibt je Thema die gewohnte Ergebnisdatei und prüft sie selbst. Rückfragen gehen per SendMessage an denselben Agenten und nennen das Thema. Kosten je Agent in `protokoll/kosten.md` des ersten Themas, mit den Themen-IDs. Ab `zusammenfuehren` läuft alles **je Thema** weiter (eigene Blindliste, eigener Agent `blind-bewertung`, eigener Commit) – die Bewertung mischt keine Themen. `npm test` nur einmal nach dem letzten Thema, am Ende ein Pull Request.

Fortschritt je Thema in `.cache/entwurf/<ID>/fortschritt.md` (eine Zeile je Schritt: erledigt, nächster Befehl); bei Unterbrechung dort weitermachen.

## 0. Freigabe

```bash
npm run -s ursachen:freigegeben '--' <ID> '--gegen' HEAD
```

Verlangt `freigabe` (auch `art: "ki"`) im letzten Commit und unveränderte Ursachen. Fehler → abbrechen (erst `/thema-anlegen`, Phase A committen).

## 1. Suchbegriffe und Aufträge

Die Suchbegriffe stehen im Leitfaden `daten/leitfaeden/<ID>.json` (aus `/thema-anlegen`). Fehlen sie, schreibe sie jetzt ohne Blick in Programme aus der Spalte „Diagnose aus der Debatte“ in `docs/perspektiven-ursachen.md` (je Ursache jede Lösungsrichtung mit eigenen Begriffen). Hat eine Ursache Bündel nach Bereichen (etwa „Verkehr und Antriebe“), aber keine Hebel-Checkliste (`hebel`), ergänze sie **vor** dem Erfassen unter Phase-A-Sperre (`npm run phase-a -- start`): aus der Perspektivenprüfung, ohne Blick in Programme **und ohne frühere Erfassungen** (`daten/protokolle/` enthält Programmstellen); eigener Commit „<Thema>: Hebel-Checkliste (Phase A)“. Arbeitsdatei `.cache/entwurf/<ID>/erfassung.json` = `{ "thema_id": <ID>, "programme": [] }`.

```bash
npm run -s entwurf:treffer '--' .cache/entwurf/<ID>/erfassung.json '--vorab'
```

**Eine Runde:** Gemeldete zu allgemeine Begriffe genauer fassen oder ersetzen (für alle gleich); was danach noch gemeldet wird, mit kurzem Grund unter `suchbegriffe_geprueft`. Dann:

```bash
npm run -s entwurf:auftrag '--' .cache/entwurf/<ID>/erfassung.json
```

`NICHT GELADEN` → „Programm nicht erreichbar“ unten. `entwurf:auftrag` lehnt ab, solange eine Ursache der Programme keine Regel oder keine Suchbegriffe im Leitfaden hat: dann beides ohne Blick in Programme ergänzen (aus der Perspektivenprüfung, unter Phase-A-Sperre wie die Hebel-Checkliste, eigener Commit). Meldet es einen Begriff bei mehreren Ursachen, prüfe, ob die Regeln die Fundstellen eindeutig zuordnen; sonst gemeinsame Regel oder `gekoppelt` – jetzt, nicht als Rückfrage an jedes Programm.

## 2. Erfassen

Je Auftrag (bei mehreren Themen: je Sammelauftrag, siehe oben) ein Agent `programm-erfassung`, bis zu sieben gleichzeitig. Das Modell steht in der Agentenbeschreibung – **keinen** Parameter `model` setzen, damit alle Programme mit demselben Modell laufen. Auftrag nur dieser Satz:

> Erledige den Erfassungsauftrag `.cache/entwurf/<ID>/auftraege/<Name>.md` nach `.claude/agents/programm-erfassung.md`.

Der Agent prüft sich selbst und speichert `programme/<Name>.json`. Fehlt die Datei, denselben Agenten (SendMessage) die Fehler beheben lassen. Nach jedem Agenten eine Zeile in `protokoll/kosten.md`: `| Agent | Programm | Tokens | Dauer |`.

```bash
npm run -s entwurf:zusammenfuehren '--' .cache/entwurf/<ID>/erfassung.json
npm run -s entwurf:treffer '--' .cache/entwurf/<ID>/erfassung.json
```

- **Rückfragen nur bei Skriptfehlern** (`zusammenfuehren` lehnt ein Programm ab) oder bei Hinweisen „viele Treffer, aber keine Maßnahme“, die das Skript noch meldet: eine gebündelte Rückfrage an dieses Programm, Antwort nach `protokoll/erfassung-<Name>-rueckfrage-1.txt`. Keine Rückfragen zu Inhalt oder Zuordnung – das entscheidet die Bewertung.
- **Eigene Synonyme, neue Bündel:** in den Leitfaden übernehmen (gilt für spätere Durchgänge); keine erneute Erfassung.
- Nach einer Rückfrage `zusammenfuehren` und `treffer` erneut; meldet der Vergleich **entfallene** Maßnahmen, die die Rückfrage nicht betraf, mit derselben Rückfrage-Datei korrigieren lassen.
- `protokoll/rueckfragen.md`: erste Zeilen „Modell der Erfassung: …“, „Modell der Bewertung: …“ (aus der Agentenbeschreibung), danach je Rückfrage eine Zeile `| Programm | Anlass | Ergebnis |` oder „keine“.

## 3. Bewerten ohne Parteinamen

```bash
npm run -s entwurf:blind '--' .cache/entwurf/<ID>/erfassung.json
npm run -s entwurf:bewertung-auftrag '--' .cache/entwurf/<ID>/erfassung.json
```

Meldet `entwurf:blind` Reste über der Schwelle: Beschreibung neutral formulieren (Zitate bleiben) oder `'--schwelle' N`. Ab jetzt ist die Erfassung eingefroren.

**Ein** Agent `blind-bewertung` (ohne Parameter `model`), Auftrag = genau der Text von `protokoll/bewertung-auftrag.txt`. Danach:

```bash
npm run -s entwurf:json '--' .cache/entwurf/<ID>/protokoll/bewertung-antwort.txt .cache/entwurf/<ID>/bewertung.json
npm run -s entwurf:bewertung-pruefen '--' .cache/entwurf/<ID>/erfassung.json .cache/entwurf/<ID>/bewertung.json
```

Fehler → Meldungen in `rueckfrage-bewertung.txt`, `entwurf:bewertung-auftrag … '--rueckfrage' .cache/entwurf/<ID>/rueckfrage-bewertung.txt`, den neuen Auftragstext per SendMessage an **denselben** Agenten; wiederholen bis fehlerfrei.

## 4. Eintragen und prüfen

```bash
npm run -s entwurf:eintragen '--' .cache/entwurf/<ID>/erfassung.json .cache/entwurf/<ID>/bewertung.json
npm run daten:pruefen
npm run -s zitate:pruefen '--' '--thema' <ID>
npm run seed
```

Danach einmal je Lauf (bei mehreren Themen nach dem letzten): `npm test -- --reporter=dot`.

`zitate:pruefen` meldet ein Zitat: Rückfrage an das Programm (neu zitieren), dann ab Schritt 2 „zusammenführen“ und Teil-Neubewertung. Nie selbst „passend machen“.

## 5. Abschluss

```bash
npm run -s entwurf:bericht '--' .cache/entwurf/<ID>/erfassung.json .cache/entwurf/<ID>/bewertung.json
npm run -s entwurf:archivieren '--' .cache/entwurf/<ID>/erfassung.json
```

Commit je Thema („<Thema>: Maßnahmen aus N Programmen (KI-Entwurf)“) mit Themendatei, Leitfaden, `supabase/seed.sql`, `supabase/seed-teile/` und `daten/protokolle/<ID>/…`. Keine weiteren Dokumente. Aus `/liste-einordnen` aufgerufen: nur committen – Push und Pull Request macht die Liste. Sonst Pull Request: je Thema zwei, drei Sätze (Programme, Maßnahmen, Instrumente, nicht erfasste Programme) und darunter `pr-daten.md` unverändert ([reference/pull-request.md](reference/pull-request.md)).

## Sonderfälle

**Programm nicht erreichbar** (`NICHT GELADEN`): mit den übrigen weiterarbeiten; die Betreiberin nach einer lokalen Kopie fragen (URL und Prüfsumme aus `daten/parteien.json`), dann `'--lokal' <ordner>` bei `entwurf:auftrag`, `entwurf:treffer`, `entwurf:programm-pruefen` und `zitate:pruefen`. Ohne Kopie bleibt das Programm „noch nicht erfasst“ – nie `keine_massnahme`, nie eine andere Fassung.

**Teil-Neubewertung** (nach einer späten Rückfrage, wenige Kennungen neu oder geändert):

```bash
cp .cache/entwurf/<ID>/bewertung.json .cache/entwurf/<ID>/bewertung-vorher.json
npm run -s entwurf:blind '--' .cache/entwurf/<ID>/erfassung.json '--teil' .cache/entwurf/<ID>/bewertung-vorher.json
npm run -s entwurf:bewertung-auftrag '--' .cache/entwurf/<ID>/erfassung.json
# Agent blind-bewertung mit genau diesem Auftrag, dann:
npm run -s entwurf:json '--' .cache/entwurf/<ID>/protokoll/bewertung-antwort.txt .cache/entwurf/<ID>/bewertung-teil.json
npm run -s entwurf:bewertung-zusammenfuehren '--' .cache/entwurf/<ID>/erfassung.json .cache/entwurf/<ID>/bewertung-vorher.json .cache/entwurf/<ID>/bewertung-teil.json .cache/entwurf/<ID>/bewertung.json
npm run -s entwurf:bewertung-pruefen '--' .cache/entwurf/<ID>/erfassung.json .cache/entwurf/<ID>/bewertung.json
```

Lehnt ein Schritt ab (Maßstab geändert), vollständig neu bewerten.

**Kennungen nicht lesbar:** `entwurf:blind '--neue-kennungen'`, danach vollständig neu bewerten. Nie von Hand bearbeiten.

**Ein Lösungsweg fehlt nachträglich** (Programm schon erfasst): `/forderung-erfassen`.
