---
name: thema-erfassen
description: Phasen B–D für ein Thema des Politik-Duells mit freigegebenen Ursachen – Maßnahmen aus allen Wahlprogrammen erfassen (ein Agent je Programm), ohne Parteinamen bewerten, eintragen und automatisch prüfen. Endet mit einem Pull Request. Aufruf mit der Themen-ID, optional nur für Länder, z. B. /thema-erfassen 17 oder /thema-erfassen 4 --land NI.
argument-hint: <Themen-ID> [--bund | --land XX …]
disable-model-invocation: true
---

# Thema erfassen (Phasen B–D: Maßnahmen)

Aufruf: **$ARGUMENTS**

Du koordinierst nur. Programme lesen die Agenten `programm-erfassung`, bewerten tut der Agent `blind-bewertung`. Du selbst liest keine Programme und vergibst keine Werte. Maßgeblich sind `daten/README.md` („Ablauf für ein neues Thema“, „Erfassen“, „Bewertungsmaßstab“, „Instrumente“) und `docs/methode.md`.

Arbeitsdateien liegen in `.cache/entwurf/<ID>/` (nicht im Repository – dort stehen Programmtexte). Was du mit den Agenten austauschst, kommt in `.cache/entwurf/<ID>/protokoll/` – ohne dieses Protokoll trägt `entwurf:eintragen` nichts ein. Es macht sichtbar, wo du eingegriffen hast; du kennst die Parteien, die Agenten nicht.

**Windows/PowerShell 7:** npm verschluckt Optionen mit Wert, wenn das erste `--` nicht in Anführungszeichen steht (`--partei SPD` wird zum Suchbegriff „SPD“, `--seiten 2-4` zur Ausgabedatei „2-4“ – im Projektstamm entstehen Textdateien). Schreibe `npm run <skript> '--' <Argumente> '--option' wert` oder rufe das Skript direkt auf (`node --experimental-strip-types scripts/entwurf/<name>.ts …`). Umleitungen mit `>` können die Kodierung zerstören; benutze `--ausgabe <datei>` bzw. Dateiargumente. In den Beispielen unten steht deshalb `'--'`.

**Kosten im Blick:** Jeder Agentenlauf liest sein Programm. Teuer wird es durch Wiederholung, nicht durch den ersten Durchgang. Darum: Grenzfälle einmal im Pilot entscheiden (Regeln), Aufträge als Dateien statt langer Prompts, Antworten ohne Modell prüfen, **eine** Rückfragerunde nur mit Anlass.

## 0. Freigabe prüfen

```bash
git fetch origin main
npm run ursachen:freigegeben '--' <ID>
```

Schlägt das fehl: **abbrechen**. Die Ursachen sind noch nicht freigegeben (erst `/thema-anlegen`, dann Merge und `freigabe` mit Datum und bestätigten Quellen durch die Betreiberin) oder wurden verändert – das gilt auch für die `abgrenzung` der Ursachen. Ursachen werden beim Erfassen nicht ergänzt oder umformuliert. Fällt beim Erfassen auf, dass eine Ursache fehlt, halte es im Pull Request fest – die Entscheidung trifft die Betreiberin.

## 1. Programme und Suchbegriffe festlegen

- **Programme:** alle Bundesprogramme (`daten/parteien.json`); hat das Thema Ursachen mit `ebene: land`, zusätzlich alle aktuellen Landesprogramme (Liste: `npm run -s programme:suche '--' x '--zaehlen'`). Mit `--bund` nur Bund, mit `--land XX` nur diese Länder. Programme, zu denen schon ein Abdeckungseintrag besteht, auslassen (die ergänzt man von Hand); `entwurf:auftrag` überspringt sie selbst.
- **Textdateien:** `npm run -s programme:texte '--' .cache/entwurf/<ID>/texte` schreibt den Text jedes Programms als `<Partei>-<Bund|XX>.txt` mit Seitenmarken. Die Agenten lesen diese Dateien mit Read/Grep (nicht per Konsolenausgabe). Meldet das Skript ein Programm als `NICHT GELADEN` (Server gesperrt oder Datei weicht von der Prüfsumme ab), mach mit den übrigen weiter: Dieses Programm bleibt „noch nicht erfasst“ und steht im Pull Request. Nennt es Seiten fast ohne Text, steht das im Dossier des Programms.
- **Suchbegriffe je Lösungsrichtung**, **bevor** ein Agent startet – für alle Programme dieselben. Nimm für jede Ursache die Lösungsrichtungen aus der Spalte „Diagnose aus der Debatte“ in `docs/perspektiven-ursachen.md` (jede durch „;“ getrennte Richtung einzeln) und gib jeder eigene Begriffe. Format in `erfassung.json`: `"suchbegriffe": { "1705": { "Beitragsfreiheit": ["beitragsfrei", "gebührenfrei"], "Beiträge nach Einkommen": ["einkommensabhängig", "sozial gestaffelt"] } }`. Wortteile genügen („sozialarbeit“ findet „Schulsozialarbeit“), bei Umlautpluralen den Stamm nehmen („betreuungspl“). Begriffe aus der Sprache aller politischen Richtungen (etwa „Zuwanderung“, „Migration“, „Einwanderung“, „Asyl“), möglichst spezifisch (allgemeine Wörter wie „Fachkräfte“ treffen auch andere Themen). `entwurf:blind` lehnt Ursachen ohne Richtung und Richtungen ohne Begriffe ab.
  - **Höchstens 8 Begriffe je Richtung**, lieber wenige spezifische als viele. Mehr Begriffe füllen die Treffermatrix mit Rauschen und lösen Rückfragen aus, die nichts finden.
  - **Kurze Begriffe markieren:** unter 5 Zeichen mit `^` (nur am Wortanfang: `^auen`) oder `=` (nur als ganzes Wort: `=auen`) schreiben, sonst trifft „auen“ auch „bauen“. `entwurf:auftrag` und `entwurf:treffer` weisen darauf hin.
  - Begriffe, die in einem Programm auf mindestens 20 % der Seiten stehen („kommunen“), zählen nicht für Leseplan und Hinweise; `entwurf:treffer` nennt sie. Grenze sie ein oder streiche sie.
- **Startdatei:** `.cache/entwurf/<ID>/erfassung.json` beginnt als `{ "thema_id": <ID>, "suchbegriffe": { … }, "programme": [] }`. Die Agenten bekommen sie nie zu lesen.

## 2. Erfassen (Phase B)

### Dossiers und Aufträge

```bash
npm run entwurf:auftrag '--' .cache/entwurf/<ID>/erfassung.json            # alle Programme; mit '--bund' oder '--land' XX wie oben
```

Das schreibt je Programm ein **Dossier** (`dossier/<Name>.md`: Leseplan, Seiten nach Treffern mit Ausschnitt, Treffer je Begriff – dieselbe Rechnung für alle Programme) und eine **Auftragsdatei** (`auftraege/<Name>.md`: Thema, Ziel, nur die Ursachen der Ebene samt `abgrenzung`, die `regeln` der Erfassung, Pfade). Hinweise zu den Begriffen (zu viele, zu kurz) behebst du jetzt in `suchbegriffe` und erzeugst neu – nicht erst, wenn alle Agenten gelaufen sind. Programme, die sich nicht laden ließen, bleiben „noch nicht erfasst“. Wer nur ein Dossier braucht: `npm run entwurf:dossier`.

### Pilot und Regeln

Starte zuerst zwei Agenten: das Bundesprogramm einer Partei und – hat das Thema Landesursachen – das Landesprogramm einer anderen. Prüfe ihre Antworten (siehe unten) und lies sie auf **Grenzfälle**: Zusagen, bei denen unklar ist, ob sie zählen oder an welcher Ursache sie ansetzen (typisch bei Themen, die an ein breites Politikfeld grenzen). Entscheide jeden Grenzfall **einmal**, formuliere die Entscheidung als allgemeine Regel ohne Parteinamen („Maßnahmen zur Emissionsminderung zählen nur für 1801.“) und trage sie in `regeln` der `erfassung.json` ein. Die Regeln gelten zusammen mit der `abgrenzung` der Ursachen für alle Programme, ändern weder Ursache noch Ziel und kommen mit Begründung in den Pull Request. Danach `entwurf:auftrag` erneut ausführen und die Pilot-Programme erneut befragen, **wenn** eine Regel ihr Ergebnis ändert. Gab es keine Grenzfälle, gelten die Pilot-Antworten.

### Agenten

Starte je übrigem Programm einen Agenten `programm-erfassung`, bis zu sieben gleichzeitig. Der Auftrag ist ein Satz: „Lies `.cache/entwurf/<ID>/auftraege/<Name>.md` und führe ihn aus.“ Mehr gibst du nicht mit – was für ein Programm zusätzlich gesagt wird, fehlt den anderen. Die Agenten lesen nur Auftrag, Dossier und Programmtext, nicht `erfassung.json` (darin stehen die Ergebnisse der anderen).

Speichere jede Antwort unverändert als `protokoll/erfassung-<Name>.txt` (Name wie die Textdatei; Antworten auf Rückfragen als `erfassung-<Name>-rueckfrage-N.txt`), bevor du sie auswertest.

### Antworten prüfen

```bash
npm run entwurf:antwort-pruefen '--' .cache/entwurf/<ID>/protokoll/erfassung-<Name>.txt
```

Ohne Modell: gültiges JSON, richtiges Programm, Längen, Ebenen der Ursachen, Zahlen im Zitat, und ob jedes Zitat auf der genannten Seite steht. Ende mit 1: Die Fehler sind der Anlass für die Rückfrage. Ende mit 2: `nicht_durchsucht` – Programm **weglassen** (bleibt „noch nicht erfasst“), im Pull Request nennen, nie in `keine_massnahme` umwandeln.

Prüfe außerdem selbst, mit demselben Maßstab für alle Programme:
- Unplausibel (Zitat passt nicht zur Beschreibung, Ursache falsch, Landesmaßnahme zu Bundesursache, allgemeines Ziel oder Satzfragment statt Maßnahme, Stelle aus anderem Zusammenhang, Zusage fällt nach `abgrenzung` oder `regeln` nicht unter die Ursache) → Rückfrage mit konkretem Anlass. Streichen ohne Rückfrage tust du nicht.
- **Jede Rückfrage** – an Erfassungs- und Bewertungs-Agenten – kommt mit Programm bzw. Kennung, Anlass und Ergebnis in `protokoll/rueckfragen.md` (gibt es keine: „keine“). Die Zahl der Rückfragen je Programm steht im Pull Request.
- Maßnahmenbeschreibungen einheitlich knapp (höchstens 200 Zeichen) und ohne Parteinamen.
- Weicht der Programmstand im PDF von `parteien.json` ab (Hinweis im Protokoll), im Pull Request nennen.
- **Eigene Synonyme** eines Agenten (Protokoll, „Eigene Synonyme“) übernimmst du unter der passenden Ursache und Richtung in `suchbegriffe` – sie gelten dann für alle Programme (Treffermatrix neu zählen; Dossiers der Programme, die noch Rückfragen bekommen, mit `entwurf:auftrag` erneuern).

### Treffermatrix und Rückfragen: eine Runde

Wenn alle Antworten da sind und du sie in `erfassung.json` unter `programme` eingetragen hast (Format unten): `npm run -s entwurf:treffer '--' .cache/entwurf/<ID>/erfassung.json`. Das zählt jeden Begriff in jedem Programm, schreibt `treffer` in die Erfassung (nach jeder Änderung an `suchbegriffe` erneut) und nennt unspezifische Begriffe. Hinweise haben die Form „Ursache N ohne Maßnahme, aber mindestens 3 Begriffe zugleich auf S. …“ und sind der Anlass für Rückfragen.

Rückfragen sind teuer, weil jeder Agent sein Programm erneut liest. Deshalb höchstens **eine Runde**, nur mit Anlass: ein Fehler aus `entwurf:antwort-pruefen`, ein Hinweis der Treffermatrix (bei **allen** Programmen mit Hinweis, nicht nur bei auffälligen) oder eine unplausible Maßnahme. Nicht: alle Programme „zur Sicherheit“ ein zweites Mal. Die Rückfrage ist ebenfalls eine Auftragsdatei:

```bash
npm run entwurf:auftrag '--' .cache/entwurf/<ID>/erfassung.json '--partei' SPD '--land' ST '--rueckfrage' "Anlass" '--ursache' 1803 '--seiten' "22–24"
```

Sie nennt Anlass, Ursachen und Seiten, damit der Agent nur diese Stellen liest, und verweist auf seine bisherige Antwort. Danach gibt es keine weitere Runde, außer `entwurf:antwort-pruefen` meldet einen neuen Fehler; offene Zweifel kommen als Frage in den Pull Request. Hat der Pilot eine Regel geändert, werden nur Programme erneut befragt, deren Maßnahmen zu den betroffenen Ursachen zählen. Unspezifische Begriffe behebst du in `suchbegriffe`, nicht mit Agenten.

Schreibe das Ergebnis nach `.cache/entwurf/<ID>/erfassung.json` (Format: `Erfassung` in `scripts/entwurf.ts`):

```json
{ "thema_id": 17, "suchbegriffe": { "1701": { "Platzausbau": ["kitaplätze", "^betreuungspl"] } }, "regeln": ["Allgemeine Zusagen zum Wohnungsbau zählen nur, wenn das Programm Kitas nennt."], "programme": [ { "partei_id": 11, "land": null, "massnahmen": [ { "beschreibung": "…", "ursachen_ids": [1701], "zitat": "…", "seite": 12 } ] } ] }
```

Zitate gleich prüfen lässt sich vollständig erst nach dem Eintragen (Schritt 4); `entwurf:antwort-pruefen` hat sie aber schon gegen die Seite geprüft, und grobe Fehler (Längen, fehlende Felder, falsche Ebene, Zahlen in der Beschreibung, die nicht im Zitat stehen) fängt `npm run entwurf:blind` ab.

## 3. Bewerten ohne Parteinamen (Phase C)

```bash
npm run -s entwurf:blind '--' .cache/entwurf/<ID>/erfassung.json '--ausgabe' .cache/entwurf/<ID>/blind.json
```

Das Skript ersetzt Parteinamen (samt Artikel und „Wir“), Personen und Länder und meldet verdächtige Reste („Rest: M07: Fraktion“). Über der Schwelle bricht es ab: Formuliere die betroffenen **Beschreibungen** neutral (Zitate bleiben wörtlich) oder bestätige mit `'--schwelle' N` und begründe jeden Rest im Pull Request. Es speichert die Kennungen (M01 …) als `.cache/entwurf/<ID>/kennungen.json` und benutzt sie danach weiter. `blind.json` trägt eine `pruefsumme` über den ganzen Inhalt. **Ab jetzt ist die Erfassung eingefroren:** Änderst du danach eine Beschreibung, ein Zitat, eine Seite oder eine Ursachenzuordnung, passt die Prüfsumme nicht mehr, und `entwurf:bewertung-pruefen` und `entwurf:eintragen` lehnen die Bewertung ab. Dann `entwurf:blind` erneut ausführen und neu bewerten lassen. Fügst du Maßnahmen hinzu, streichst oder sortierst sie um, erzeugt `entwurf:blind` neue Kennungen – eine frühere Bewertung ist dann ganz ungültig. Korrekturen also vor `entwurf:blind`.

Starte **einen** Agenten `blind-bewertung` und gib ihm **nur** den Inhalt von `blind.json` und das heutige Datum – keine Parteinamen, keine Hinweise auf die Herkunft, nichts aus der Erfassung. (Der Agent hat keinen Dateizugriff; die Liste gehört in den Auftrag. Bei vielen Maßnahmen über 100 kann das ein großer Auftrag werden.) Die `ursachen` der Liste enthalten die `abgrenzung`, falls die Themendatei eine hat; sie gilt auch für die Zuordnung des Bewertungs-Agenten. Schreibe den Auftrag **vorher wörtlich** nach `protokoll/bewertung-auftrag.txt` – das Skript prüft, dass er die Blindliste mit ihrer Prüfsumme und keinen Parteinamen enthält – und die Antwort nach `protokoll/bewertung-antwort.txt`. Hole das JSON mit `npm run entwurf:json '--' .cache/entwurf/<ID>/protokoll/bewertung-antwort.txt .cache/entwurf/<ID>/bewertung.json`. Es muss `blind_pruefsumme` enthalten (die `pruefsumme` aus `blind.json`); fehlt sie, den Agenten erneut fragen. Bei einem zweiten Auftrag: auch ihn und die Antwort speichern (`bewertung-auftrag-2.txt` …) und in `rueckfragen.md` eintragen; `bewertung-auftrag.txt` und `bewertung-antwort.txt` sind dann die letzte Fassung.

```bash
npm run -s entwurf:bewertung-pruefen '--' .cache/entwurf/<ID>/erfassung.json .cache/entwurf/<ID>/bewertung.json
```

Das Skript lehnt ab bei: unbestätigter Zuordnung zu einer Ursache (der Bewertungs-Agent nennt je Kennung die `ursachen`, an denen die Maßnahme ansetzt; fehlt eine aus der Erfassung, den zuständigen Erfassungs-Agenten die Stelle prüfen lassen, Zuordnung korrigieren, `entwurf:blind` neu), fehlender oder doppelter Kennung, Instrument über Bund und Land, unbenutztem Instrument, Wirksamkeit 3 ohne `belegt`, zu langen Feldern. Es **warnt** bei fast nur `offen` (Forschungsstand nicht recherchiert), fehlenden Quellen, viel zu vielen Instrumenten, zusätzlich gesehenen Ursachen und unterschiedlicher Mehrfachzuordnung (gleiches Instrument, verschiedene Ursachen; ein Programm deutlich öfter mehreren Ursachen zugeordnet). Hinweise zur Zuordnung gleichst du für **alle** Programme gleich aus. Bei Fehlern oder Hinweisen den Agenten erneut beauftragen (wieder nur mit `blind.json` und deiner Rückfrage; bei einem zweiten Auftrag darfst du ihm seine Maßnahmen-Beschreibungen mit Kennungen ohne Zitate nochmals senden). Prüfe außerdem selbst auf Methode, nicht auf Ergebnis: gleiche Lösungswege im selben Instrument, vorhandene Instrumente wiederverwendet, neutrale Begründungen. Werte änderst du nicht selbst. Muss ein Wert später mit Kenntnis der Partei geändert werden (etwa auf Entscheidung der Betreiberin), steht am Instrument bzw. der Maßnahme `"entwurf_herkunft": "nicht_blind"` und im Pull Request der Grund – sonst lehnt die CI die Änderung ab.

## 4. Eintragen und prüfen (Phase D)

```bash
npm run entwurf:eintragen '--' .cache/entwurf/<ID>/erfassung.json .cache/entwurf/<ID>/bewertung.json
npm run daten:pruefen
npm run zitate:pruefen '--' '--thema' <ID>
npm run punkte '--' <ID>
npm run seed
npm test
git status --short
```

- `entwurf:eintragen` prüft das Protokoll, vergibt die IDs, setzt `ki_entwurf: true`, `geprueft: false`, `durchsucht_fuer` und `entwurf_herkunft: blind` und baut die Beleg-Links mit `#page=N`. Es schreibt nur, wenn der Katalog danach gültig ist.
- `git status --short` zeigt nur die erwarteten Dateien (Themendatei, `supabase/seed.sql`, Dokumentation). Fremde Dateien im Projektstamm (etwa `1-6`, `Kita`) sind Reste verschluckter Optionen – löschen, nie committen.
- Unter Windows kann `npm test` wegen CRLF-Zeilenenden bei `01-arzttermine.json` und `seed.sql` scheitern; das hat mit der Erfassung nichts zu tun (siehe `.gitattributes`).
- Meldet `zitate:pruefen` ein Zitat auf einer anderen Seite oder gar nicht: in der Themendatei korrigieren (Seite) oder den zuständigen Agenten die Stelle neu zitieren lassen. Zitate nie „passend machen“, ohne die Seite zu lesen.
- `punkte`: auf Auffälligkeiten achten (eine Partei überall 0, obwohl das Programm viel zum Thema hat? Dann die Erfassung dieses Programms prüfen lassen). Werte nicht nachträglich anpassen, um ein Ergebnis zu verändern.

## 5. Dokumentieren und Pull Request

- `docs/perspektiven-ursachen.md`, Abschnitt des Themas: Absatz **„Erfassung“** mit Datum, „KI-Entwurf, nach dem Festlegen der Ursachen“, erfasste Programme, Suchbegriffe je Ursache und Lösungsrichtung (Richtungen ohne Maßnahme ausdrücklich nennen), **`regeln` der Erfassung mit Begründung**, Ergebnis (Zahl der Maßnahmen und Instrumente mit ID-Bereich), welche Parteien zu welchen Ursachen nichts haben, nicht durchsuchte Programme und „Nicht erfasst wurden: …“ mit Gründen (aus den Protokollen der Agenten).
- `daten/README.md`: Hinweis „Echte Daten, im Aufbau“ oben aktualisieren (Themen, Zahl der Instrumente).
- Commit und Pull Request („<Thema>: Maßnahmen aus N Programmen (KI-Entwurf)“). Schreibe die Beschreibung nach `.cache/entwurf/<ID>/pr.md` und aktualisiere sie **bei jedem Push** (Datei und Pull Request), damit sie zum Stand passt. Vorlage: `.github/pull_request_template.md` mit der Ja/Nein-Checkliste. In der Beschreibung: Übersicht je Partei (Zahl der Maßnahmen oder „keine Maßnahme“, Zahl der Rückfragen), Ausgabe von `npm run punkte`, offene Fragen und schwierige Einstufungen aus der Bewertung, nicht durchsuchte Programme, Seiten ohne Text, die Prüfsumme der Blindliste, die Treffermatrix je Ursache und Richtung (Summen je Programm) mit den Hinweisen und wie sie erledigt wurden, die Regeln der Erfassung, verdächtige Reste mit Begründung, die Hinweise zur Zuordnung. Hinweis: Die Werte sind Entwürfe; es folgen die Bewertung durch eingeladene Prüfende und die Belegprüfung (`npm run pruefliste -- <ID>`).
