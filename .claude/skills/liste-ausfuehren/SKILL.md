---
name: liste-ausfuehren
description: Arbeitet die bestätigten Zeilen einer Einordnungstabelle aus /liste-einordnen ab – je Aufruf den nächsten offenen Block (Haltungen; Themen und Forderungen; Prompt-Evaluation) mit /haltung-anlegen, /haltung-erfassen, /thema-anlegen, /forderung-erfassen und /thema-erfassen, dann Commit, Push und Pull Request. Aufruf z. B. /liste-ausfuehren .cache/listen/2026-10-05-umfrage.md oder mit --alle für alle Blöcke.
argument-hint: <.cache/listen/….md> [--alle]
disable-model-invocation: true
model: sonnet
---

<!-- „sonnet“: Die Koordination startet Skripte und Agenten und überträgt deren Ergebnisse in Dateien. Urteile fallen in den Agenten (Modell fest in .claude/agents/), das Einordnen der Liste beim Modell der Sitzung in /liste-einordnen. -->

# Liste abarbeiten

Aufruf: **$ARGUMENTS**

Du bist Koordination: Du liest keine Programme, vergibst keine Werte und schreibst keine Fragen, Ursachen, Regeln oder Suchbegriffe selbst – das liefern die Agenten der Unterskills, du überträgst es und prüfst mit den Skripten. Grundlage ist die Tabelle aus `/liste-einordnen`; sie liegt unter `.cache/listen/` (nicht im Repository).

`npm run -s liste:auswahl -- <datei>` prüft die Tabelle und zählt die bestätigten Aufträge. Die Blöcke laufen in dieser Reihenfolge, jeweils nach dem genannten Skill (lies dessen `SKILL.md` und folge ihm), im selben Zweig mit eigenen Commits:

1. **Haltungen:** `/haltung-anlegen --liste <datei>` (Vorschläge aus `liste:auswahl -- <datei> --art haltung`), danach `/haltung-erfassen` für alle neuen IDs in einem Lauf (höchstens 15 je Lauf).
2. **Themen und Forderungen** – ein Block, ein gemeinsamer Erfassungslauf:
   1. `/thema-anlegen` mit allen Namen aus `--art thema` (durch „;“ getrennt) – Phase A mit eigenem Commit.
   2. `/forderung-erfassen` für alle Zeilen von `--art forderung` (je Zeile ein Thema mit seinen Forderungen, Themen durch „|“ getrennt), aber nur bis zur Arbeitsdatei (dort „Zusammen mit neuen Themen“).
   3. `/thema-erfassen` für die neuen Themen-IDs **und** die Nachträge in einem Lauf („Mehrere Themen“): dieselben Sammelbefehle für alle, je Programm und Thema ein Agent.
   Ohne neue Themen oder ohne Forderungen entfällt der jeweilige Teil.
3. **Prompt-Evaluation:** `npm run -s liste:auswahl -- <datei> --evaluation` liefert je bestätigter Zeile Art und erwartete Antwort. In `docs/prompt-evaluation.md` kommt ein Abschnitt (Datum, Art der Quelle ohne Namen) mit diesen Zeilen, aber die Äußerung **umschrieben**: der Kern in eigenen, sachlichen Worten, so dass die Einordnung erkennbar bleibt – keine Parolen, Beleidigungen, Symbole oder antisemitischen Behauptungen im Wortlaut, keine Namen von Personen („Abwertung einer Gruppe wegen ihrer Herkunft mit Ausweisungsforderung“ statt der Parole). Kommt die Liste überwiegend aus einem politischen Lager, das dort vermerken – die Evaluation braucht Äußerungen aus allen Lagern.

**Ein Block je Aufruf** (spart Kontext: ein Block schleppt die vorigen nicht mit). Welche Blöcke erledigt sind, steht unter der Tabelle im Abschnitt `## Stand` (eine Zeile je Block: `- Haltungen: erledigt (<Commit>)`; fehlt der Abschnitt, ist nichts erledigt). Blöcke ohne bestätigte Zeilen gelten als erledigt. Arbeite den ersten offenen Block ab, dann:
- committen und pushen; nach dem ersten Block den Pull Request anlegen, nach jedem weiteren seine Beschreibung ergänzen (Zählung je Art, je Block die Ergebnisse);
- die Zeile in `## Stand` eintragen;
- **stoppen** und melden: welcher Block fertig ist, welcher als Nächstes kommt, und „Weiter mit `/clear`, dann `/liste-ausfuehren <datei>`“.

Die Unterskills legen dabei **keinen eigenen** Pull Request an und pushen nicht selbst – das macht dieser Skill am Ende des Blocks. Getestet wird einmal je Block (der Testlauf am Ende von `/haltung-erfassen` bzw. `/thema-erfassen`); Phase-A-Schritte prüfen nur mit `daten:pruefen`. Mit `--alle` laufen alle offenen Blöcke in einem Aufruf (wie bisher); dann nach jedem Block committen und pushen.
