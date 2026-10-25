# Plan: Duell-Regeln – gleichauf, Bundesland je Partie, Teilen ohne Parteistand

Stand: 25. 10. 2026 · Plan, nichts umgesetzt. Entscheidungen der Betreiberin vom 25. 10. 2026; Zahlen, die mit **Vorschlag** markiert sind, sind noch zu bestätigen.

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

1. **Zahl bestätigen:** eine Stufe als Grenze für „gleichauf“ – nach der Auswertung an den Daten.
