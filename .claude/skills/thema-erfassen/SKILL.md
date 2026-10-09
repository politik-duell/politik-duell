---
name: thema-erfassen
description: Erfasst für ein oder mehrere Themen des Politik-Duells mit freigegebenen Ursachen (auch KI-Freigabe) die Maßnahmen aus allen Wahlprogrammen – je Programm ein Erfassungs-Agent, Bewertung ohne Parteinamen durch einen Blind-Agenten, Eintragen als ungeprüfter KI-Entwurf, automatische Prüfung, Pull Request. Aufruf mit Themen-IDs, z. B. /thema-erfassen 17 oder /thema-erfassen 19 20 --bund.
argument-hint: <Themen-ID> [<Themen-ID> …] [--bund | --land XX …]
disable-model-invocation: true
model: opus
---

# Thema erfassen (Maßnahmen, KI-Entwurf)

Aufruf: **$ARGUMENTS**

Du bist die **Koordination**: Du startest Skripte und Agenten und prüfst, ob die Skripte bestehen. Programme lesen nur die Agenten `programm-erfassung`, bewerten nur der Agent `blind-bewertung`. Du liest keine Programme, vergibst keine Werte, keine Zuordnungen und stellst keine inhaltlichen Rückfragen – was ein Skript nicht beanstandet, gilt. Das Ergebnis ist ein KI-Entwurf für die geschlossene Testphase; Menschen prüfen später (`daten/README.md` → „Prüfung“).

Alle Befehle **führst du aus** (`npm run -s …`), die Skripte musst du nicht lesen. Arbeitsordner: `.cache/entwurf/<ID>/`. Lange Ausgaben stehen in Dateien – hole sie nicht in deinen Kontext, wenn die Zahlen der Skriptausgabe genügen. Windows: [reference/windows.md](reference/windows.md). Fehlermeldungen: [reference/fehlerbilder.md](reference/fehlerbilder.md).

Bund und Länder in einem Durchgang (ohne `--bund`/`--land` laufen alle Programme; Landesprogramme nur, wenn das Thema Landesursachen hat). **Mehrere Themen** – auch Nachträge aus `/forderung-erfassen`, deren Arbeitsdatei mit `nachtrag` schon steht – laufen **gemeinsam** durch dieselben Schritte; je Programm und Thema ein Agent, die Bewertung mischt keine Themen.

Jeder Schritt ist **ein** Befehl für alle Themen des Laufs: `npm run -s entwurf:lauf '--' <schritt> <Arbeitsdateien>` startet die Einzelskripte nacheinander und bricht beim ersten Fehler ab (Ausgabe des Skripts darüber). Nach dem Beheben denselben Schritt erneut starten. `<Arbeitsdateien>` = `.cache/entwurf/<ID>/erfassung.json …`, im Folgenden kurz `$E` – im Befehl immer ausschreiben (die Shell merkt sich keine Variablen zwischen Aufrufen).

Fortschritt in `.cache/entwurf/<erste ID>/fortschritt.md` (eine Zeile je Schritt: erledigt, nächster Befehl); bei Unterbrechung dort weitermachen.

## 1. Freigabe, Suchbegriffe, Aufträge

Arbeitsdatei je neues Thema: `.cache/entwurf/<ID>/erfassung.json` = `{ "thema_id": <ID>, "programme": [] }`. Die Suchbegriffe stehen im Leitfaden `daten/leitfaeden/<ID>.json` (aus `/thema-anlegen`). Fehlen sie, eine Regel je Ursache oder eine Hebel-Checkliste (`hebel`) für eine Ursache mit Bündeln nach Bereichen (etwa „Verkehr und Antriebe“): **vor** dem Erfassen unter Phase-A-Sperre (`npm run phase-a -- start`) ergänzen – aus der Spalte „Diagnose aus der Debatte“ in `docs/perspektiven-ursachen.md`, ohne Blick in Programme **und ohne frühere Erfassungen** (`daten/protokolle/` enthält Programmstellen); eigener Commit „<Thema>: Leitfaden (Phase A)“.

```bash
npm run -s entwurf:lauf '--' vorab $E
```

Prüft die Freigabe (`ursachen:freigegeben --gegen HEAD`: `freigabe` auch mit `art: "ki"` im letzten Commit, Ursachen unverändert; Fehler → abbrechen, erst `/thema-anlegen`) und zählt die Suchbegriffe vorab. **Eine Runde:** Gemeldete zu allgemeine Begriffe genauer fassen oder ersetzen (für alle gleich); was danach noch gemeldet wird, mit kurzem Grund unter `suchbegriffe_geprueft`. Dann:

```bash
npm run -s entwurf:lauf '--' auftraege $E
```

Legt je Thema die Aufträge an. (`'--sammel'` legt zusätzlich Sammelaufträge an – ein Agent je Programm für alle Themen. Nur für Vergleichsläufe: Im Vergleichslauf mit den Themen 18 und 30 brauchten sie 39 % mehr Tokens und fast viermal so lange wie Einzelaufträge, mit den kleineren Themen 30 und 33 24 % weniger; siehe `evals/README.md`.) `NICHT GELADEN` → „Programm nicht erreichbar“ unten. Lehnt der Schritt ab, weil einer Ursache eine Regel oder Suchbegriffe fehlen: wie oben unter Phase-A-Sperre ergänzen. Meldet er einen Begriff bei mehreren Ursachen, prüfe, ob die Regeln die Fundstellen eindeutig zuordnen; sonst gemeinsame Regel oder `gekoppelt` – jetzt, nicht als Rückfrage an jedes Programm. Meldet er eine Ursache mit vielen Bündeln ohne Hebel-Checkliste: Sind die Bündel Bereiche (etwa „Verkehr und Antriebe“) statt einzelner Instrumente, die Hebel je Bereich unter Phase-A-Sperre als `hebel` ergänzen (wie oben); sonst weiter.

## 2. Erfassen

Je Auftrag ein Agent `programm-erfassung`, bis zu sieben gleichzeitig. Das Modell steht in der Agentenbeschreibung – **keinen** Parameter `model` setzen, damit alle Programme mit demselben Modell laufen. Auftrag nur dieser Satz:

> Erledige den Erfassungsauftrag `.cache/entwurf/<ID>/auftraege/<Name>.md` nach `.claude/agents/programm-erfassung.md`.

Der Agent prüft sich selbst und speichert `programme/<Name>.json`. Fehlt eine Datei, denselben Agenten (SendMessage) die Fehler beheben lassen. Was die Selbstprüfung bestanden hat, prüfst du nicht noch einmal.

```bash
npm run -s entwurf:lauf '--' erfasst $E
```

Führt je Thema zusammen und zählt die Treffer.

- **Rückfragen nur bei Skriptfehlern** (`zusammenfuehren` lehnt ein Programm ab) oder bei Hinweisen „viele Treffer, aber keine Maßnahme“: eine gebündelte Rückfrage an dieses Programm, Antwort nach `protokoll/erfassung-<Name>-rueckfrage-1.txt`. Keine Rückfragen zu Inhalt oder Zuordnung – das entscheidet die Bewertung.
- **Eigene Synonyme, neue Bündel:** in den Leitfaden übernehmen (gilt für spätere Durchgänge); keine erneute Erfassung.
- Nach einer Rückfrage `erfasst` erneut; meldet der Vergleich **entfallene** Maßnahmen, die die Rückfrage nicht betraf, mit derselben Rückfrage-Datei korrigieren lassen.
- `protokoll/rueckfragen.md` je Thema: je Rückfrage eine Zeile `| Programm | Anlass | Ergebnis |`, sonst nur „keine“. Die Modelle liest der Bericht aus den Agentenbeschreibungen.

## 3. Bewerten ohne Parteinamen

Erst wenn **alle** Programme aller Themen zusammengeführt sind und keine Rückfrage mehr aussteht – sonst wird später doppelt bewertet.

```bash
npm run -s entwurf:lauf '--' blind $E
```

Meldet `entwurf:blind` Reste über der Schwelle: Beschreibung neutral formulieren (Zitate bleiben), dann `blind` erneut (oder für dieses Thema einzeln `entwurf:blind … '--schwelle' N`). Ab jetzt ist die Erfassung eingefroren.

Je Thema **ein** Agent `blind-bewertung` (ohne Parameter `model`), alle gleichzeitig, Auftrag = genau der Text von `.cache/entwurf/<ID>/protokoll/bewertung-auftrag.txt`.

## 4. Eintragen, prüfen, abschließen

```bash
npm run -s entwurf:lauf '--' bewertet $E
```

Wandelt die Antworten um und prüft **alle** Bewertungen, bevor das erste Thema eingetragen wird; dann Eintragen, `daten:pruefen`, `zitate:pruefen` je Thema, Seed, Bericht, Archiv und ein Testlauf.

- **Bewertung fehlerhaft:** Meldungen in `.cache/entwurf/<ID>/rueckfrage-bewertung.txt`, `npm run -s entwurf:bewertung-auftrag '--' .cache/entwurf/<ID>/erfassung.json '--rueckfrage' .cache/entwurf/<ID>/rueckfrage-bewertung.txt`, den neuen Auftragstext per SendMessage an **denselben** Agenten; dann `bewertet` erneut.
- **`zitate:pruefen` meldet ein Zitat:** Themendatei zurücksetzen (`git checkout -- daten/themen/<Datei>`, sonst lehnt das zweite Eintragen ab), Rückfrage an das Programm (neu zitieren), `erfasst`, Teil-Neubewertung (unten), dann `bewertet '--bewertung-fertig'`. Nie selbst „passend machen“.

Commit für den Lauf („<Themen>: Maßnahmen aus N Programmen (KI-Entwurf)“) mit Themendateien, Leitfäden, `supabase/seed.sql`, `supabase/seed-teile/` und `daten/protokolle/<ID>/…`. Keine weiteren Dokumente. Aus `/liste-ausfuehren` aufgerufen: nur committen – Push und Pull Request macht die Liste. Sonst Pull Request: je Thema zwei, drei Sätze (Programme, Maßnahmen, Instrumente, nicht erfasste Programme) und darunter `pr-daten.md` unverändert ([reference/pull-request.md](reference/pull-request.md)).

## Sonderfälle

**Programm nicht erreichbar** (`NICHT GELADEN`): mit den übrigen weiterarbeiten; die Betreiberin nach einer lokalen Kopie fragen (URL und Prüfsumme aus `daten/parteien.json`), dann `'--lokal' <ordner>` bei `entwurf:lauf` (gibt es an `entwurf:treffer`, `entwurf:auftrag` und `zitate:pruefen` weiter) und bei `entwurf:programm-pruefen`. Ohne Kopie bleibt das Programm „noch nicht erfasst“ – nie `keine_massnahme`, nie eine andere Fassung.

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
