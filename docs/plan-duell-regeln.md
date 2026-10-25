# Plan: Duell-Regeln – gleichauf, Bundesland je Partie, Teilen ohne Parteistand

Stand: 25. 10. 2026 · Umgesetzt: alle drei Regeln. Entscheidungen der Betreiberin vom 25. 10. 2026.

## Anlass

Kritischer Blick auf das Konzept (Oktober 2026). Das offene Duell – ich spiele für Partei A, du für Partei B, wir nennen Probleme und sehen die Punkte – bleibt, und es bleibt einfach. Drei Regeln ändern sich, damit das Ergebnis nicht mehr behauptet, als die Bewertung trägt, und nicht als Wahlwerbung taugt.

Maßstab ist der Beutelsbacher Konsens der politischen Bildung: kein Überwältigen, Strittiges strittig zeigen, die Person zum eigenen Urteil befähigen. Ein Sieger bei einem Abstand innerhalb der Bewertungsunschärfe und ein geteilter Parteien-Punktestand ohne Zusammenhang widersprechen dem.

## 1. Gleichauf statt knapper Sieger

Wo der Abstand nicht trägt, ruft das Spiel keinen Sieger aus: Beide bekommen den Punkt der Runde, wie bei Gleichstand.

**Entschieden (25. 10. 2026): höchstens 10 % Abstand.** Liegt die niedrigere Summe höchstens 10 % unter der höheren, sind beide gleichauf. Gewählt nach der Auswertung unten: Die Regel ist einfach zu erklären, macht nur die knappsten Siege (5 %) zu „gleichauf“ und lässt den Duellcharakter bestehen; die Regel „eine Bewertungsstufe“ hätte fast vier von zehn Runden zum Gleichstand gemacht.

- **Runde:** `rundenpunkte` in `supabase/functions/_shared/bewertung.ts` (`gleichauf`, in Zehnteln gerechnet). Mit 0 Punkten ist niemand gleichauf.
- **„Beste Lösung insgesamt“:** `besteParteien` nennt alle Parteien, die gleichauf mit der besten liegen (im Schnitt 1,9 statt 1,6 je Runde).
- **Anzeige:** „Gleichauf – höchstens 10 % Abstand, beide bekommen einen Punkt.“ Die Punkte beider Parteien bleiben sichtbar.
- **Umstrittene Forschung** braucht keine eigene Regel: Wirksamkeit 3 setzt `belegt` voraus, ein Weg mit `gemischt` oder `offen` hat also höchstens 2.
- **Endstand** bleibt die Summe der Spielpunkte; die Regel wirkt nur je Runde.
- **Edge Function:** speichert in `runden` die Rundensummen, nicht die Spielpunkte – ihr Verhalten ändert sich nicht. Der gemeinsame Code ist trotzdem neu; beim nächsten Ausrollen kommt er mit.

### Auswertung (25. 10. 2026)

`node --experimental-strip-types scripts/gleichauf-auswertung.ts [--themen]` – alle 45 Themen, je Einzelursache und je Symptomgruppe, alle Parteipaare, ohne Rolle, Bund sowie BE, MV, ST (469 Ursachensätze), mit KI-Entwürfen (noch nichts geprüft). Eine Stufe gilt je Bewertungsteil – Instrument (für alle Parteien, die es haben) oder Maßnahme ohne Instrument.

| Regel | Siege, die „gleichauf“ werden (von 7 367) | Gleichstände insgesamt (heute 12 %) |
| --- | --- | --- |
| **A:** eine Stufe höher bei der unterlegenen Partei | 2 203 (30 %) | 39 % |
| **B:** wie A, oder eine Stufe niedriger bei der führenden | 3 444 (47 %) | 53 % |
| Abstand ≤ 1 Punkt | 1 177 (16 %) | 26 % |
| Abstand ≤ 2 Punkte | 2 603 (35 %) | 43 % |
| **Abstand ≤ 10 % der höheren Summe (gewählt)** | 377 (5 %) | 17 % |
| Abstand ≤ 20 % der höheren Summe | 1 046 (14 %) | 25 % |

„Beste Lösung insgesamt“ nennt heute im Schnitt 1,6 Parteien je Runde, mit A 2,9, mit B 3,2, mit 10 % 1,9.

Je Partei (10 %): Von den Siegen werden 4 % (SPD, Grüne, FDP) bis 7 % (AfD, BSW) gleichauf, von den Niederlagen 2 % (AfD) bis 9 % (SPD); absolut gewinnt jede Partei 37 (AfD) bis 79 (SPD) Punkte dazu. Wie bei A liegt der niedrige Wert der AfD bei den Niederlagen daran, dass sie bei vielen Ursachen keine Maßnahme hat – gegen 0 Punkte ist niemand gleichauf.

Je Partei (Regel A): Von den Siegen werden 26 % (Grüne) bis 35 % (BSW) gleichauf; von den Niederlagen 22 % (AfD) bis 40 % (SPD, Grüne). Absolut gewinnt jede Partei ähnlich viele Punkte dazu (273 Grüne bis 347 SPD), die Regel staucht also vor allem die Abstände. Wo eine Partei gar keine Maßnahme hat, kann keine Stufe den Abstand schließen – deshalb der niedrige Wert bei den Niederlagen der AfD. Je Thema reicht der Anteil von 6 % (Schutz im Krisen- und Kriegsfall) bis 57 % (Abwanderung).

**Einschätzung vor der Entscheidung:** Die Regel mit einer Stufe ist methodisch am besten begründet, macht aber fast vier von zehn Runden zum Gleichstand; das schwächt den Duellcharakter deutlich. Eine feste Schwelle ist leichter zu erklären („weniger als 1 Punkt Abstand“), aber nicht aus dem Prüfverfahren abgeleitet.

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

## 4. Gespräch auf Augenhöhe

Vorbild ist die Gesprächshaltung, wie sie Marcant in seinen Videos zeigt: zuhören, das Problem ernst nehmen, ruhig bleiben, mit überprüfbaren Belegen antworten, niemanden vorführen. Das Spiel übernimmt die Haltung, nicht eine Schlussfolgerung: Die Methode bleibt neutral (Grundprinzip 1). Gerade das macht es für Menschen aus einem anderen Lager glaubwürdig.

Umgesetzt (25. 10. 2026, Entscheidung der Betreiberin):

- **Leitfaden im Setup** (aufklappbar): „Ihr wählt verschiedene Parteien? So klappt das Gespräch“ – fünf Sätze zu Zuhören, Belegen, kein Triumph.
- **„Was heißt das für euch?“** in der Auflösung (`src/logic/fuerEuch.ts`): Die Rolle *jeder* Seite wird auf die gezählten Maßnahmen *beider* Parteien angewandt (`rollen_modifikator`), dazu belegte Folgen für die Verteilung (`nebenwirkungen`, Bereich `verteilung`). Für alle Parteien gleich, ohne Punkte; gezählt wird weiter nur mit der eigenen Rolle.
- **Gründe bei 0 Punkten sichtbar** statt aufklappbar: „Das Programm enthält keine Maßnahme …“ mit „Durchsucht: …“ und Link zum Programm. 0 Punkte ohne Grund wirken wie Schiebung.
- **„Fehler melden“ an jeder Maßnahme**: E-Mail mit Maßnahme im Betreff, ohne Angaben zur Person.
- **Endbildschirm**: zuerst die Themen („Ihr habt über … gesprochen“), dann der Stand; „hatte öfter die wirksamere Lösung“ statt „gewinnt!“; eine Gesprächsfrage.

Offen (Daten, kein Code):

- **Rollen-Modifikatoren** sind erst bei 11 Maßnahmen erfasst (Mieter:in, Eigentümer:in), Verteilungsfolgen bei wenigen Lösungswegen. Bis dahin zeigt „Was heißt das für euch?“ meist „keine Abweichung erfasst“. Nachtragen mit `/rollen-erfassen <Thema-ID>` (25. 10. 2026): blind wie die Nebenwirkungen, zuerst mit den Quellen, die der Katalog schon hat, sonst gezielte Websuche; jeder Modifikator nur mit Quelle und wörtlichem Beleg. Reihenfolge: häufigste Themen (Rente, Energie, Gesundheit, Arbeit), dann `--alle` für die elf Miete-Modifikatoren ohne Quelle.
- **Themen der Zielgruppe zuerst:** Die Admin-Ansicht „Lücken“ zeigt, wo Runden ohne Wertung enden; dort zuerst erfassen und prüfen.

## Umsetzung

| Stelle | Änderung |
| --- | --- |
| Auswertung vorab (Skript) | Wie oft wird aus Sieg „gleichauf“, je Partei und Thema – Ergebnis in `docs/methode.md` |
| `supabase/functions/_shared/bewertung.ts` | `gleichauf` (höchstens 10 %, in Zehnteln), genutzt von `rundenpunkte` und `besteParteien`; Unit-Tests in `src/logic/logik.test.ts`; `supabase/dashboard` neu erzeugt |
| `src/components/Aufloesung.tsx`, `Ende.tsx` | Anzeige „gleichauf“ in Runde, „Beste Lösung insgesamt“ und Zusammenfassung |
| `src/components/Setup.tsx`, `src/spiel.ts` | Bundesland einmal je Partie (aus `Spieler` in den Partiezustand), Rolle bleibt je Person. Die Edge Function bekommt weiter `seiten` – mit demselben Land auf beiden Seiten, ohne Änderung am Server. |
| `src/components/Ende.tsx` → `teilen` | Text mit Themen statt Parteistand |
| `docs/konzept.md`, `docs/methode.md`, Methodenseite in der App | Bundesland je Partie, „gleichauf“, Teilen |

## Verworfen

- **Blindtipp** (Lösungswege vor der Auflösung ohne Parteinamen tippen, zweiter Punktestand „Einschätzung“, Herkunft der Tipps am Ende): zu komplex und abschreckend für ein Spiel, dessen Kern „Problem nennen, Punkte sehen“ ist.
- **Spiel auf zwei Geräten:** aus demselben Grund; das Spiel bleibt auf einem Gerät.

## Offen

Nichts. Die Auswertung lässt sich nach jeder größeren Datenänderung wiederholen (`node --experimental-strip-types scripts/gleichauf-auswertung.ts --themen`); verschiebt sich die Verteilung je Partei deutlich, kommt die Schwelle vor den Methodenbeirat.
