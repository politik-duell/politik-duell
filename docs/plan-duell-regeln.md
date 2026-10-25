# Plan: Duell-Regeln – gleichauf, Bundesland je Partie, Teilen ohne Parteistand

Stand: 25. 10. 2026 · Umgesetzt: Bundesland je Partie (2) und Teilen ohne Parteistand (3). Offen: Schwelle für „gleichauf“ (1), Auswertung unten. Entscheidungen der Betreiberin vom 25. 10. 2026; Zahlen, die mit **Vorschlag** markiert sind, sind noch zu bestätigen.

## Anlass

Kritischer Blick auf das Konzept (Oktober 2026). Das offene Duell – ich spiele für Partei A, du für Partei B, wir nennen Probleme und sehen die Punkte – bleibt, und es bleibt einfach. Drei Regeln ändern sich, damit das Ergebnis nicht mehr behauptet, als die Bewertung trägt, und nicht als Wahlwerbung taugt.

Maßstab ist der Beutelsbacher Konsens der politischen Bildung: kein Überwältigen, Strittiges strittig zeigen, die Person zum eigenen Urteil befähigen. Ein Sieger bei einem Abstand innerhalb der Bewertungsunschärfe und ein geteilter Parteien-Punktestand ohne Zusammenhang widersprechen dem.

## 1. Gleichauf statt knapper Sieger

Wo der Abstand nicht trägt, ruft das Spiel keinen Sieger aus: Beide bekommen den Punkt der Runde, wie heute bei Gleichstand.

**Was „trägt nicht“ heißt – Vorschlag: eine Bewertungsstufe.** Im Prüfverfahren gilt ein Unterschied von einer Stufe zwischen zwei Prüfenden als normal; erst ab zwei Stufen wird der Maßstab geklärt (`docs/methode.md` → „Prüfverfahren“). Ein Abstand, den eine einzige Stufe schließen würde, liegt also innerhalb der Unschärfe der Bewertung.

- **Runde:** gleichauf, wenn die unterlegene Partei gleichziehen würde, sobald bei **einem** ihrer gezählten Lösungswege Wirksamkeit oder Umsetzbarkeit eine Stufe höher läge (höchstens 3). Gerechnet wie sonst auch: mit Rolle, Gewichten ½, ¼ … und Deckel 9 je Ursache.
- **„Beste Lösung insgesamt“:** dieselbe Regel; genannt werden alle Parteien, die gleichauf mit der besten liegen.
- **Anzeige:** „Gleichauf – der Abstand liegt innerhalb einer Bewertungsstufe.“ Die Punkte beider Parteien bleiben sichtbar; im Detail steht, welche Stufe den Abstand schließen würde.
- **Umstrittene Forschung** braucht keine eigene Regel: Wirksamkeit 3 setzt `belegt` voraus, ein Weg mit `gemischt` oder `offen` hat also höchstens 2. Die Anzeige „Wirkung in der Forschung umstritten“ bleibt.
- **Endstand** bleibt die Summe der Rundenpunkte; die Regel wirkt nur je Runde.

Das ist eine Änderung der Methode: Die Rundenpunkte werden auch in der Edge Function berechnet und in `runden` gespeichert. **Vor dem Umschalten an den Daten rechnen:** über alle Themen, Ursachen und Parteipaare, wie oft aus einem Sieg „gleichauf“ wird – und ob das alle Parteien ähnlich trifft. Das Ergebnis kommt mit der Änderung in `docs/methode.md`.

### Auswertung (25. 10. 2026)

`node --experimental-strip-types scripts/gleichauf-auswertung.ts [--themen]` – alle 45 Themen, je Einzelursache und je Symptomgruppe, alle Parteipaare, ohne Rolle, Bund sowie BE, MV, ST (469 Ursachensätze), mit KI-Entwürfen (noch nichts geprüft). Eine Stufe gilt je Bewertungsteil – Instrument (für alle Parteien, die es haben) oder Maßnahme ohne Instrument.

| Regel | Siege, die „gleichauf“ werden (von 7 367) | Gleichstände insgesamt (heute 12 %) |
| --- | --- | --- |
| **A:** eine Stufe höher bei der unterlegenen Partei | 2 203 (30 %) | 39 % |
| **B:** wie A, oder eine Stufe niedriger bei der führenden | 3 444 (47 %) | 53 % |
| Abstand ≤ 1 Punkt | 1 177 (16 %) | 26 % |
| Abstand ≤ 2 Punkte | 2 603 (35 %) | 43 % |
| Abstand ≤ 10 % der höheren Summe | 377 (5 %) | 17 % |
| Abstand ≤ 20 % der höheren Summe | 1 046 (14 %) | 25 % |

„Beste Lösung insgesamt“ nennt heute im Schnitt 1,6 Parteien je Runde, mit A 2,9, mit B 3,2.

Je Partei (Regel A): Von den Siegen werden 26 % (Grüne) bis 35 % (BSW) gleichauf; von den Niederlagen 22 % (AfD) bis 40 % (SPD, Grüne). Absolut gewinnt jede Partei ähnlich viele Punkte dazu (273 Grüne bis 347 SPD), die Regel staucht also vor allem die Abstände. Wo eine Partei gar keine Maßnahme hat, kann keine Stufe den Abstand schließen – deshalb der niedrige Wert bei den Niederlagen der AfD. Je Thema reicht der Anteil von 6 % (Schutz im Krisen- und Kriegsfall) bis 57 % (Abwanderung).

**Einschätzung:** Die Regel mit einer Stufe ist methodisch am besten begründet, macht aber fast vier von zehn Runden zum Gleichstand; das schwächt den Duellcharakter deutlich. Eine feste Schwelle ist leichter zu erklären („weniger als 1 Punkt Abstand“), aber nicht aus dem Prüfverfahren abgeleitet.

## 2. Bundesland je Partie

Das Bundesland wird einmal für die Partie gewählt statt je Seite: Wer gegeneinander spielt, sitzt in der Regel im selben Land. Beide Parteien werden dann an den Programmen desselben Landes gemessen. Die Rolle bleibt je Person.

- Setup: „Wo spielt ihr?“ – ein Land oder „nur Bundesprogramme“ (optional, wie heute).
- Die Regel „Es zählt immer genau ein Programm je Partei und Ursache“ (`docs/methode.md` → „Bund und Länder“) bleibt.
- „Beste Lösung insgesamt“ und Forderungskarte rechnen mit diesem Land; für das Land entfällt die Sonderregel „nur, wenn beide dasselbe gewählt haben“ (`vergleichsSeite` in `src/spiel.ts`, für die Rolle bleibt sie).
- Gespeichert wird das Land weiterhin nicht.

## 3. Teilen ohne Parteistand

Heute: „Politik-Duell – 5 Alltagsprobleme geprüft. Ergebnis: CDU 3 : 2 SPD. Versprechen kann jeder.“ (`src/components/Ende.tsx`). Ohne Zusammenhang ist das ein Parteien-Punktestand, der sich als „Spiel beweist …“ verbreiten lässt.

Neu – die Themen der Partie und eine Einladung, ohne Parteien, Punkte und Eingaben:

> Wir haben im Politik-Duell 5 Alltagsprobleme durchgespielt: Arzttermine, Miete, Bus und Bahn, Pflege, Rente. Welche Partei hat dafür die wirksamste Lösung – mit Beleg? Spielt es selbst. Versprechen kann jeder.

- Themen nur aus gewerteten Runden, je Thema einmal; ohne Wortlaut der Spielenden (Datenschutz) und ohne Haltungen.
- Der Hinweis der Testphase bleibt im Text.
- Im Spiel selbst ändert sich nichts: Endstand und Sieger stehen weiter auf dem Endbildschirm.

## Umsetzung

| Stelle | Änderung |
| --- | --- |
| Auswertung vorab (Skript) | Wie oft wird aus Sieg „gleichauf“, je Partei und Thema – Ergebnis in `docs/methode.md` |
| `supabase/functions/_shared/bewertung.ts` | `werteRunde` und `besteParteien` mit „gleichauf“; Angabe, welche Stufe den Abstand schließt (für die Anzeige). Unit-Tests: Grenzfälle mit Deckel, Rolle, Gewichten, Wert schon 3. Edge Function `analyse` neu ausrollen. |
| `src/components/Aufloesung.tsx`, `Ende.tsx` | Anzeige „gleichauf“ in Runde, „Beste Lösung insgesamt“ und Zusammenfassung |
| `src/components/Setup.tsx`, `src/spiel.ts` | Bundesland einmal je Partie (aus `Spieler` in den Partiezustand), Rolle bleibt je Person. Die Edge Function bekommt weiter `seiten` – mit demselben Land auf beiden Seiten, ohne Änderung am Server. |
| `src/components/Ende.tsx` → `teilen` | Text mit Themen statt Parteistand |
| `docs/konzept.md`, `docs/methode.md`, Methodenseite in der App | Bundesland je Partie, „gleichauf“, Teilen |

## Verworfen

- **Blindtipp** (Lösungswege vor der Auflösung ohne Parteinamen tippen, zweiter Punktestand „Einschätzung“, Herkunft der Tipps am Ende): zu komplex und abschreckend für ein Spiel, dessen Kern „Problem nennen, Punkte sehen“ ist.
- **Spiel auf zwei Geräten:** aus demselben Grund; das Spiel bleibt auf einem Gerät.

## Offen

1. **Schwelle wählen** (Auswertung oben), dann `werteRunde`, `besteParteien` und Anzeige umsetzen und Edge Function `analyse` neu ausrollen.
