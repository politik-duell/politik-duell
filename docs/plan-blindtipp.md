# Plan: Duell mit Blindtipp – erst urteilen, dann aufdecken

Stand: 25. 10. 2026 · Plan, nichts umgesetzt.

## Anlass

Kritischer Blick auf das Konzept (Oktober 2026): Das offene Duell – ich spiele für Partei A, du für Partei B – passt zur Zielgruppe der politisch Interessierten und soll bleiben. Es hat aber eine bekannte Schwäche: Wer für die eigene Partei antritt, prüft ein schlechtes Ergebnis kritischer als ein gutes und hält die Methode schnell für parteiisch. Dann bleibt jede Person bei ihrer Meinung, und die Belege kommen nicht an.

Die Methode schützt die **Prüfenden** davor, indem sie ohne Parteinamen bewerten (`docs/methode.md` → „Prüfverfahren“). Der Blindtipp überträgt das auf die **Spielenden**: Erst urteilt jede Person über die Lösungswege ohne Namen, dann kommt die Bewertung, dann wird aufgedeckt. Wer sich vorher festgelegt hat, kann ein Ergebnis schlechter als „parteiisch“ abtun – und kann gewinnen, auch wenn die eigene Partei verliert.

Maßstab ist der Beutelsbacher Konsens der politischen Bildung: kein Überwältigen, Strittiges strittig zeigen, die Person zum eigenen Urteil befähigen. Der Blindtipp lässt die Person zuerst selbst urteilen; das Spiel ordnet danach ein.

## Ablauf einer Runde

Unverändert bis zur Bestätigung der Ursachen (`docs/plan-zuordnung.md`). Neu dazwischen, bei Runden mit Status `gewertet`:

1. **Blindtipp.** Die Lösungswege zu den bestätigten Ursachen erscheinen als Karten „Lösung A, B, C …“ – ohne Parteinamen, in zufälliger Reihenfolge, ohne Punkte. Je Karte: der Lösungsweg in neutralen Worten und an welchen der bestätigten Alltagssätze er ansetzt.
2. **Verdeckt tippen.** Beide spielen an einem Gerät: Erst tippt die eine Person („Alex tippt – Kim schaut bitte weg“), dann ein Zwischenbildschirm, dann die andere. Frage: „Welche Lösung hilft hier am meisten?“ Eine Karte oder „Keine überzeugt mich“.
3. **Bewertung.** Je Karte: Wirksamkeit, Umsetzbarkeit, Punkte, Forschungsstand, Begründung, Folgen über das Thema hinaus – weiter ohne Parteinamen. Markiert: die Tipps beider Personen und die bestbewertete Karte.
4. **Aufdecken.** Je Karte die Parteien, aus deren Programmen sie stammt, mit Beleg-Link. Danach die bisherige Auflösung des Duells (Rundenpunkte der beiden gewählten Parteien, „Beste Lösung insgesamt“).

Ohne Blindtipp bleiben Runden ohne Wertung (`ungeprueft`, `unvollstaendig`, `forderung`, `wert`, `grenze`) und Runden mit weniger als zwei Karten.

## Zwei Punktestände

| | Wofür | Änderung |
| --- | --- | --- |
| **Parteien-Duell** | Rundenpunkte nach Wirksamkeit × Umsetzbarkeit (`docs/methode.md` → „Punkte in der Runde“) | keine |
| **Einschätzung** | 1 Punkt je Person, wenn die getippte Karte den höchsten Kartenwert der Runde hat (bei Gleichstand zählen alle besten Karten) | neu |

Endbildschirm: „SPD liefert in diesem Spiel mehr (3 : 2). Beste Einschätzung: Kim (4 von 5).“ Die Person gewinnt damit für etwas, das sie selbst tut; die Partei für ihr Programm. Beides steht getrennt.

## Entscheidungen

| Frage | Entscheidung |
| --- | --- |
| Bleibt die Bewertung nach Wirksamkeit × Umsetzbarkeit? | **Ja, unverändert.** Der Blindtipp kommt vor der Bewertung und ersetzt sie nicht. Die Rundenpunkte der Parteien rechnet weiter `bewertePartei`. |
| Welche Karten erscheinen? | **Je Partei ihr bester Lösungsweg der Runde** (höchster Kartenwert, bei Gleichstand niedrigste Maßnahmen-ID), nur Parteien, für die das Thema erfasst ist. Haben mehrere Parteien als besten Weg dasselbe Instrument, ist das **eine** Karte. Damit höchstens sieben Karten, und jede Partei ist mit genau einem Weg vertreten – keine wird sichtbarer, weil ihr Programm länger ist. |
| Text der Karte | Name des Instruments; bei einer Maßnahme ohne Instrument ihre `beschreibung`. **Nie das Zitat** (das kommt erst beim Aufdecken). Wörter, die auf eine Partei hindeuten, prüft dieselbe Liste wie die Blindliste der Bewertung (`scripts/entwurf/blind.ts`: Parteinamen, Personen, Länder, Restwörter wie „liberal“); als gemeinsame Funktion herauslösen und in `npm run daten:pruefen` für alle Kartentexte als Fehler melden. |
| Wiedererkennen | **Wird hingenommen.** Politisch Interessierte erkennen manche Wege ihrer Partei auch ohne Namen. Dann tippt man bewusst die eigene, und die Bewertung zeigt sofort, ob sie trägt – auch das ist der gewünschte Moment. |
| „Steht in 3 Programmen“ | **Erst beim Aufdecken.** Vorher würde die Zahl als Beliebtheit gelesen und den Tipp lenken. |
| Kartenwert | Summe der Punkte des Wegs (Wirksamkeit × Umsetzbarkeit, mit Rolle, 0–9) über die bestätigten Ursachen, an denen er ansetzt – so, wie er als bester Weg in die Rundenwertung einginge. Bei einem Instrument die beste Maßnahme der vertretenen Parteien. |
| Rolle und Bundesland der Karten | Vorerst wie beim Vergleich aller Parteien: nur, was beide Seiten gleich gewählt haben (`vergleichsSeite` in `src/spiel.ts`). Weicht eine Karte dadurch von den Duellpunkten ab, sagt die Auflösung das. Empfehlung als eigene Entscheidung: Rolle und Land an die Person binden, die das Problem nennt, und **alle** Parteien damit werten – dann gibt es keine Abweichung mehr (Offen, Punkt 1). |
| Gibt es eine „Übereinstimmung mit Partei X“? | **Nein, nur die Herkunft der Tipps** (nächster Abschnitt). |

## Herkunft der Tipps statt Übereinstimmung

Die Erkenntnis „meine Lieblingslösungen kommen nicht nur von meiner Partei“ ist das wertvollste Ergebnis des Blindtipps. Eine Zahl „72 % Übereinstimmung mit Partei X“ wäre aber nicht haltbar:

- **Zu wenig Grundlage.** Fünf Tipps, je Runde nur der beste Weg jeder Partei. Der Wahl-O-Mat braucht dafür 38 Thesen zu allen Politikfeldern.
- **Wahlempfehlung durch die Hintertür.** Das Spiel ist ausdrücklich keine (`docs/methode.md` → „Worum es geht“), und ein Prozentwert je Partei würde genau so gelesen und geteilt.
- **Geteilte Wege.** Steht ein Instrument in drei Programmen, „stimmt“ man mit allen dreien überein – eine Rangfolge daraus wäre Zufall.

Deshalb zeigt der Endbildschirm je Person, ohne Prozent und ohne Rangfolge:

> **Woher deine Tipps kamen:** Deine 5 Tipps stehen in den Programmen von SPD (3), Grünen (2), Linke (2), Union (1). Aus dem Programm deiner Partei: 2 von 5.
> *Je Runde war von jeder Partei nur ihr bester Lösungsweg dabei. Fünf Tipps sind keine Wahlempfehlung – die Belege zu jeder Runde stehen oben.*

Parteien in der festen Reihenfolge des Spiels, gleiche Farben wie überall, keine Hervorhebung.

## Datenschutz

Welche Lösung jemand bevorzugt, ist eine politische Meinung (Art. 9 DSGVO).

- Tipps und Einschätzungspunkte bleiben **nur im Zustand der laufenden Seite**: nicht an die Edge Function, nicht in `runden`, nicht in `localStorage`.
- Nicht im Teilen-Text: weder Tipps noch Herkunft. Der Teilen-Text darf höchstens „Einschätzung 4 : 3“ enthalten.
- Keine Backend-Änderung nötig: Die App hat Maßnahmen, Instrumente und Abdeckung bereits (`besteParteien` rechnet heute schon alle Parteien im Browser).

## Umsetzung

| Stelle | Änderung |
| --- | --- |
| `src/logic/blindtipp.ts` (neu) | `blindKarten(ergebnisse, ursachenIds, instrumente)` → Karten (Instrument oder Maßnahme, Parteien, Kartenwert, Ursachen); `besteKarten`, `einschaetzungsPunkt`, `herkunft(tipps)`. Reihenfolge der Karten zufällig je Runde. Unit-Tests: je Partei genau ein Weg, Zusammenlegen gleicher Instrumente, Gleichstand, Partei ohne Maßnahme, keine Karte bei weniger als zwei Wegen. |
| gemeinsame Prüfung auf Parteihinweise | aus `scripts/entwurf/blind.ts` herauslösen; `npm run daten:pruefen` prüft damit alle Instrumentnamen und Beschreibungen von Maßnahmen ohne Instrument |
| `src/components/Blindtipp.tsx` (neu) | Karten, verdecktes Tippen nacheinander mit Zwischenbildschirm, „Keine überzeugt mich“; zugänglich (Fokus wandert beim Wechsel, Auswahl als Radiogruppe) |
| `src/components/Runde.tsx` | Schritt zwischen bestätigter Auswahl und `Aufloesung` |
| `src/components/Aufloesung.tsx` | Abschnitt „Die Lösungen aufgedeckt“: erst Bewertung je Karte mit den Tipps, dann Parteien und Belege; danach wie heute |
| `src/spiel.ts` | `RundenErgebnis.blindtipp?: { karten, tipps: [number \| null, number \| null], beste: number[] }` (nur im Speicher), `einschaetzungspunkte(runden)` |
| `src/components/Ende.tsx`, `Punktestand.tsx` | zweiter Punktestand „Einschätzung“; „Woher deine Tipps kamen“ je Person; Teilen-Text ohne Tipps |
| `src/components/Setup.tsx` | Schalter „Mit Blindtipp“ (Voreinstellung an), gilt für die Partie, nicht gespeichert |
| `docs/konzept.md`, `docs/methode.md`, Methodenseite in der App | Spielablauf und Abschnitt „Blindtipp“ nach der Umsetzung |

## Prüfen, ob es wirkt

Gespeichert wird nichts, also auch keine Statistik über Tipps. Geprüft wird in begleiteten Testpartien mit Paaren aus verschiedenen Lagern (wie bei den Haltungen, `docs/methode.md` → „Grenzen der Methode“):

- Wird ein Ergebnis gegen die eigene Partei mit Blindtipp eher angenommen als ohne? (Je Paar eine Partie mit und eine ohne, Reihenfolge gewechselt; kurze Fragen danach.)
- Wie oft tippen Spielende auf eine Karte, die nicht aus dem Programm ihrer Partei stammt – und überrascht sie das?
- Verraten Kartentexte die Partei? (Spielende raten nach dem Tipp, von wem die Karte stammt.)
- Zieht der zusätzliche Schritt das Spiel zu sehr in die Länge? (Dauer je Runde.)

## Offen

1. **Rolle und Bundesland an das Problem binden** statt an die Seite: Methodenänderung, nach Methodenbeirat. Bis dahin gilt die Regel aus der Tabelle oben.
2. **Mehr als ein Weg je Partei?** Nur der beste Weg hält die Karten übersichtlich, verdeckt aber zweitbeste Wege, die Spielenden besser gefallen könnten. Nach den Testpartien neu entscheiden.
3. **Bei knappem Abstand kein Sieger der Runde?** Unterscheiden sich die Kartenwerte kaum oder ist die Forschung „gemischt“, könnte die Einschätzung alle nahen Karten zählen lassen. Erst mit Daten aus Testpartien.
4. **Mehrere Geräte:** Verdecktes Tippen wäre auf zwei Handys einfacher, braucht aber eine gemeinsame Partie über Realtime – eigener Plan.
