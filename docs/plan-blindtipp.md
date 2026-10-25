# Plan: Duell mit Blindtipp – erst urteilen, dann aufdecken

Stand: 25. 10. 2026 · Plan, nichts umgesetzt. Entscheidungen der Betreiberin vom 25. 10. 2026 sind eingearbeitet (Bundesland je Partie, mehrere Wege je Partei, „gleichauf“ statt knapper Sieger, ein oder zwei Geräte); Zahlen, die mit **Vorschlag** markiert sind, sind noch zu bestätigen.

## Anlass

Kritischer Blick auf das Konzept (Oktober 2026): Das offene Duell – ich spiele für Partei A, du für Partei B – passt zur Zielgruppe der politisch Interessierten und soll bleiben. Es hat aber eine bekannte Schwäche: Wer für die eigene Partei antritt, prüft ein schlechtes Ergebnis kritischer als ein gutes und hält die Methode schnell für parteiisch. Dann bleibt jede Person bei ihrer Meinung, und die Belege kommen nicht an.

Die Methode schützt die **Prüfenden** davor, indem sie ohne Parteinamen bewerten (`docs/methode.md` → „Prüfverfahren“). Der Blindtipp überträgt das auf die **Spielenden**: Erst urteilt jede Person über die Lösungswege ohne Namen, dann kommt die Bewertung, dann wird aufgedeckt. Wer sich vorher festgelegt hat, kann ein Ergebnis schlechter als „parteiisch“ abtun – und kann gewinnen, auch wenn die eigene Partei verliert.

Maßstab ist der Beutelsbacher Konsens der politischen Bildung: kein Überwältigen, Strittiges strittig zeigen, die Person zum eigenen Urteil befähigen. Der Blindtipp lässt die Person zuerst selbst urteilen; die Regel „gleichauf“ (unten) sorgt dafür, dass das Spiel keinen Sieger ausruft, wo die Bewertung das nicht trägt.

## Ablauf einer Partie

**Vor dem Spiel:**

1. **Ein Gerät oder zwei?** Auswahl auf dem Startbildschirm (Abschnitt „Ein Gerät oder zwei“).
2. **Bundesland der Partie** (optional, einmal für beide): „Wir spielen in Sachsen-Anhalt“ oder „nur Bundesprogramme“.
3. **Je Person:** Name, Partei (nicht dieselbe), Rolle (optional, je Person eigene).
4. Schalter **„Mit Blindtipp“** (Voreinstellung an).

**Je Runde** – unverändert bis zur Bestätigung der Ursachen (`docs/plan-zuordnung.md`). Neu dazwischen, bei Runden mit Status `gewertet`:

1. **Blindtipp.** Die Lösungswege zu den bestätigten Ursachen erscheinen als Karten „Lösung A, B, C …“ – ohne Parteinamen, in zufälliger Reihenfolge, ohne Punkte. Je Karte: der Lösungsweg in neutralen Worten und an welchen der bestätigten Alltagssätze er ansetzt.
2. **Verdeckt tippen.** Frage: „Welche Lösung hilft hier am meisten?“ Eine Karte oder „Keine überzeugt mich“. Auf einem Gerät nacheinander („Alex tippt – Kim schaut bitte weg“, dann ein Zwischenbildschirm); auf zwei Geräten gleichzeitig, jede Person auf ihrem.
3. **Bewertung.** Je Karte: Wirksamkeit, Umsetzbarkeit, Punkte, Forschungsstand, Begründung, Folgen über das Thema hinaus – weiter ohne Parteinamen. Markiert: die Tipps beider Personen und die besten Karten (mit „gleichauf“).
4. **Aufdecken.** Je Karte die Parteien, aus deren Programmen sie stammt, mit Beleg-Link. Danach die Auflösung des Duells (Rundenpunkte der beiden gewählten Parteien, „Beste Lösung insgesamt“).

Ohne Blindtipp bleiben Runden ohne Wertung (`ungeprueft`, `unvollstaendig`, `forderung`, `wert`, `grenze`) und Runden mit weniger als zwei Karten.

## Zwei Punktestände

| | Wofür | Änderung |
| --- | --- | --- |
| **Parteien-Duell** | Rundenpunkte nach Wirksamkeit × Umsetzbarkeit (`docs/methode.md` → „Punkte in der Runde“) | Rechnung unverändert; neu: „gleichauf“ bei einem Abstand innerhalb einer Bewertungsstufe (unten) |
| **Einschätzung** | 1 Punkt je Person, wenn die getippte Karte zu den besten der Runde gehört – für die Rolle dieser Person, mit „gleichauf“ | neu |

Endbildschirm: „SPD liefert in diesem Spiel mehr (3 : 2). Beste Einschätzung: Kim (4 von 5).“ Die Person gewinnt damit für etwas, das sie selbst tut; die Partei für ihr Programm. Beides steht getrennt.

## Entscheidungen

| Frage | Entscheidung |
| --- | --- |
| Bleibt die Bewertung nach Wirksamkeit × Umsetzbarkeit? | **Ja.** Der Blindtipp kommt vor der Bewertung und ersetzt sie nicht. Die Rundenpunkte der Parteien rechnet weiter `bewertePartei`. |
| Bundesland | **Eines für die ganze Partie** statt je Seite. Wer ein Problem nennt, erfasst das Spiel nicht – ein Land je Partie ist die einfachste Regel, bei der beide Parteien und alle Karten an denselben Programmen gemessen werden. Die Regel „Es zählt immer genau ein Programm je Partei und Ursache“ (`docs/methode.md` → „Bund und Länder“) bleibt. |
| Rolle | **Je Person eine eigene**, wie heute je Seite: Jede Partei im Duell wird mit der Rolle der Person gewertet, die sie gewählt hat. Im Blindtipp zählt für die Einschätzung jeder Person ihre eigene Rolle („Welche Lösung hilft am meisten – für dich?“). Ändert die Rolle den Wert einer Karte, zeigt die Bewertung beide Werte („Mieter:in 6 · Eigentümer:in 4“). |
| Welche Karten erscheinen? | **Mehrere Wege je Partei:** je Partei ihre besten Lösungswege der Runde, **Vorschlag: höchstens zwei** (`WEGE_JE_PARTEI = 2`), nur Parteien, für die das Thema erfasst ist. Haben mehrere Parteien denselben Weg (Instrument), ist das **eine** Karte. Damit höchstens 14 Karten; die Obergrenze gilt für alle gleich, sodass ein langes Programm nicht mehr Karten bekommt als zwei. Rangfolge der Wege ohne Rolle (damit beide dieselben Karten sehen), bei Gleichstand niedrigste Maßnahmen-ID. |
| Text der Karte | Name des Instruments; bei einer Maßnahme ohne Instrument ihre `beschreibung`. **Nie das Zitat** (das kommt erst beim Aufdecken). Wörter, die auf eine Partei hindeuten, prüft dieselbe Liste wie die Blindliste der Bewertung (`scripts/entwurf/blind.ts`: Parteinamen, Personen, Länder, Restwörter wie „liberal“); als gemeinsame Funktion herauslösen und in `npm run daten:pruefen` für alle Kartentexte als Fehler melden. |
| Wiedererkennen | **Wird hingenommen.** Politisch Interessierte erkennen manche Wege ihrer Partei auch ohne Namen. Dann tippt man bewusst die eigene, und die Bewertung zeigt sofort, ob sie trägt – auch das ist der gewünschte Moment. |
| „Steht in 3 Programmen“ | **Erst beim Aufdecken.** Vorher würde die Zahl als Beliebtheit gelesen und den Tipp lenken. |
| Kartenwert | Summe der Punkte des Wegs (Wirksamkeit × Umsetzbarkeit, 0–9) über die bestätigten Ursachen, an denen er ansetzt – so, wie er als bester Weg in die Rundenwertung einginge. Bei einem Instrument die beste Maßnahme der vertretenen Parteien. |
| Gibt es eine „Übereinstimmung mit Partei X“? | **Nein, nur die Herkunft der Tipps** (Abschnitt unten). |

## Gleichauf statt knapper Sieger

Entschieden: Wo der Abstand nicht trägt, ruft das Spiel keinen Sieger aus – im Duell nicht und bei der Einschätzung nicht.

**Was „trägt nicht“ heißt – Vorschlag: eine Bewertungsstufe.** Im Prüfverfahren gilt ein Unterschied von einer Stufe zwischen zwei Prüfenden als normal; erst ab zwei Stufen wird der Maßstab geklärt (`docs/methode.md` → „Prüfverfahren“). Ein Abstand, den eine einzige Stufe schließen würde, liegt also innerhalb der Unschärfe der Bewertung.

- **Duell:** Die Runde ist gleichauf (beide 1 Punkt, wie heute bei Gleichstand), wenn die unterlegene Partei gleichziehen würde, sobald bei **einem** ihrer gezählten Wege Wirksamkeit oder Umsetzbarkeit eine Stufe höher läge (höchstens 3). Anzeige: „Gleichauf – der Abstand liegt innerhalb einer Bewertungsstufe“, mit der Rechnung im Detail.
- **Einschätzung:** Eine Karte gehört zu den besten, wenn sie den Höchstwert der Runde erreicht oder mit einer Stufe mehr bei Wirksamkeit oder Umsetzbarkeit erreichen würde.
- **„Beste Lösung insgesamt“:** dieselbe Regel; genannt werden alle Parteien, die gleichauf mit der besten liegen.
- **Umstrittene Forschung** braucht keine eigene Regel: Wirksamkeit 3 setzt `belegt` voraus, ein Weg mit `gemischt` oder `offen` hat also höchstens 2. Die Anzeige „Wirkung in der Forschung umstritten“ bleibt.

Das ist eine Änderung der Methode (Rundenpunkte, gespeichert in `runden`). **Vor dem Umschalten an den Daten rechnen:** über alle Themen und Parteipaare, wie oft aus einem Sieg „gleichauf“ wird – und ob das alle Parteien ähnlich trifft. Das Ergebnis kommt mit der Änderung in `docs/methode.md`.

## Herkunft der Tipps statt Übereinstimmung

Die Erkenntnis „meine Lieblingslösungen kommen nicht nur von meiner Partei“ ist das wertvollste Ergebnis des Blindtipps. Eine Zahl „72 % Übereinstimmung mit Partei X“ wäre aber nicht haltbar:

- **Zu wenig Grundlage.** Fünf Tipps, je Runde nur die besten Wege jeder Partei. Der Wahl-O-Mat braucht dafür 38 Thesen zu allen Politikfeldern.
- **Wahlempfehlung durch die Hintertür.** Das Spiel ist ausdrücklich keine (`docs/methode.md` → „Worum es geht“), und ein Prozentwert je Partei würde genau so gelesen und geteilt.
- **Geteilte Wege.** Steht ein Instrument in drei Programmen, „stimmt“ man mit allen dreien überein – eine Rangfolge daraus wäre Zufall.

Deshalb zeigt der Endbildschirm je Person, ohne Prozent und ohne Rangfolge:

> **Woher deine Tipps kamen:** Deine 5 Tipps stehen in den Programmen von SPD (3), Grünen (2), Linke (2), Union (1). Aus dem Programm deiner Partei: 2 von 5.
> *Je Runde waren von jeder Partei höchstens zwei Lösungswege dabei. Fünf Tipps sind keine Wahlempfehlung – die Belege zu jeder Runde stehen oben.*

Parteien in der festen Reihenfolge des Spiels, gleiche Farben wie überall, keine Hervorhebung. Auf zwei Geräten sieht jede Person nur ihre eigene Herkunft.

## Ein Gerät oder zwei

Entschieden: Beim Start wählen die Spielenden „Ein Gerät“ oder „Zwei Geräte“. Umsetzung in zwei Stufen – erst Blindtipp auf einem Gerät, dann zwei Geräte.

**Ein Gerät** – wie heute, Tippen nacheinander mit Zwischenbildschirm.

**Zwei Geräte:**

- **Verbinden ohne Konto:** Gerät A startet die Partie und zeigt einen QR-Code mit Link; Gerät B öffnet ihn (oder den Link aus einem Messenger). Der Link enthält einen zufälligen Partienamen (128 Bit). Ein kurzer Zifferncode bräuchte eine gespeicherte Zuordnung – deshalb nicht.
- **Übertragung:** Supabase Realtime **Broadcast** (Nachrichten von Gerät zu Gerät, ohne Tabelle, nichts gespeichert). Presence zählt die Geräte; ein drittes wird abgewiesen.
- **Ein Gerät führt:** Gerät A hält den Spielstand, ruft die Edge Function `analyse` auf (Rate-Limit und Prüfungen wie heute) und schickt den Stand an B. B schickt nur Eingaben: Problemtext, Ursachenauswahl, Tipp. Beide können ein Problem eingeben; A nimmt das erste an, solange die Runde offen ist.
- **Tipps verdeckt:** Jedes Gerät meldet zuerst nur „fertig“; erst wenn beide fertig sind, gehen die Tipps hinüber und die Bewertung erscheint auf beiden.
- **Jede Person sieht ihre Seite:** eigene Partei und Rolle oben; „Woher deine Tipps kamen“ nur auf dem eigenen Gerät.
- **Verbindung weg:** B tritt über denselben Link wieder bei und bekommt den Stand von A. Schließt A die Seite, endet die Partie – gespeichert ist nichts.
- **Datenschutz:** Über den Server laufen auch Problemtexte und Tipps, aber nur durch (Broadcast speichert nicht). Die Datenschutzseite nennt das.

## Datenschutz

Welche Lösung jemand bevorzugt, ist eine politische Meinung (Art. 9 DSGVO).

- Tipps und Einschätzungspunkte bleiben **nur im Zustand der laufenden Seite** (bei zwei Geräten zusätzlich die Übertragung per Broadcast, oben): nicht an die Edge Function, nicht in `runden`, nicht in `localStorage`.
- Nicht im Teilen-Text: weder Tipps noch Herkunft. Der Teilen-Text darf höchstens „Einschätzung 4 : 3“ enthalten.
- Für den Blindtipp auf einem Gerät ist keine Backend-Änderung nötig: Die App hat Maßnahmen, Instrumente und Abdeckung bereits (`besteParteien` rechnet heute schon alle Parteien im Browser). Die Regel „gleichauf“ ändert dagegen die Wertung auch in der Edge Function (gemeinsame `_shared/bewertung.ts`).

## Umsetzung

**Stufe 1 – Bundesland je Partie, gleichauf, Blindtipp auf einem Gerät**

| Stelle | Änderung |
| --- | --- |
| `src/components/Setup.tsx`, `src/spiel.ts` | Bundesland einmal je Partie (aus `Spieler` in den Partiezustand); Rolle bleibt je Person; Schalter „Mit Blindtipp“. Die Edge Function bekommt weiter `seiten` – mit demselben Land auf beiden Seiten, ohne Änderung am Server. |
| `supabase/functions/_shared/bewertung.ts` | `werteRunde` und `besteParteien` mit „gleichauf“ (eine Stufe bei einem gezählten Weg); Unit-Tests mit Grenzfällen (Deckel bei 9, Rolle, Gewichte ½, ¼). Edge Function `analyse` neu ausrollen. |
| Auswertung vorab (Skript) | Wie oft wird aus Sieg „gleichauf“, je Partei – Ergebnis in `docs/methode.md` |
| `src/logic/blindtipp.ts` (neu) | `blindKarten` → Karten (Instrument oder Maßnahme, Parteien, Ursachen, Kartenwert je Rolle); `besteKarten` mit „gleichauf“; `einschaetzungsPunkt`; `herkunft(tipps)`. Reihenfolge zufällig je Runde. Unit-Tests: höchstens `WEGE_JE_PARTEI` je Partei, Zusammenlegen gleicher Instrumente, Rolle ändert Wert, Partei ohne Maßnahme, keine Karte bei weniger als zwei Wegen. |
| gemeinsame Prüfung auf Parteihinweise | aus `scripts/entwurf/blind.ts` herauslösen; `npm run daten:pruefen` prüft damit alle Instrumentnamen und Beschreibungen von Maßnahmen ohne Instrument |
| `src/components/Blindtipp.tsx` (neu) | Karten, verdecktes Tippen nacheinander mit Zwischenbildschirm, „Keine überzeugt mich“; zugänglich (Fokus wandert beim Wechsel, Auswahl als Radiogruppe) |
| `src/components/Runde.tsx` | Schritt zwischen bestätigter Auswahl und `Aufloesung` |
| `src/components/Aufloesung.tsx` | Abschnitt „Die Lösungen aufgedeckt“: erst Bewertung je Karte mit den Tipps, dann Parteien und Belege; danach wie heute, mit „gleichauf“ |
| `src/components/Ende.tsx`, `Punktestand.tsx` | zweiter Punktestand „Einschätzung“; „Woher deine Tipps kamen“ je Person; Teilen-Text ohne Tipps |
| `docs/konzept.md`, `docs/methode.md`, Methodenseite in der App | Spielablauf, Bundesland je Partie, „gleichauf“, Abschnitt „Blindtipp“ |

**Stufe 2 – zwei Geräte**

| Stelle | Änderung |
| --- | --- |
| `src/logic/partie.ts` (neu) | Spielstand als reiner Zustand mit Ereignissen (Eingabe, Auswahl, Tipp, „fertig“), damit ein Gerät oder zwei dieselbe Logik nutzen; Unit-Tests ohne Netz |
| `src/verbindung/` (neu) | Broadcast-Kanal, Presence (höchstens zwei), Wiederbeitritt, Prüfung eingehender Nachrichten wie bei der Edge Function |
| `src/components/Start.tsx`, `Setup.tsx` | Auswahl „Ein Gerät / Zwei Geräte“, QR-Code und Link, Warten auf das zweite Gerät |
| `src/rechtliches/` | Datenschutzseite: Übertragung zwischen zwei Geräten |

## Prüfen, ob es wirkt

Gespeichert wird nichts, also auch keine Statistik über Tipps. Geprüft wird in begleiteten Testpartien mit Paaren aus verschiedenen Lagern (wie bei den Haltungen, `docs/methode.md` → „Grenzen der Methode“):

- Wird ein Ergebnis gegen die eigene Partei mit Blindtipp eher angenommen als ohne? (Je Paar eine Partie mit und eine ohne, Reihenfolge gewechselt; kurze Fragen danach.)
- Wie oft tippen Spielende auf eine Karte, die nicht aus dem Programm ihrer Partei stammt – und überrascht sie das?
- Verraten Kartentexte die Partei? (Spielende raten nach dem Tipp, von wem die Karte stammt.)
- Sind bis zu 14 Karten auf dem Handy zu viele? Zieht der Schritt das Spiel zu sehr in die Länge? (Dauer je Runde; danach `WEGE_JE_PARTEI` festlegen.)
- Wird „gleichauf“ verstanden und als fair empfunden?

## Offen

1. **Zahlen bestätigen:** zwei Wege je Partei, eine Stufe als Grenze für „gleichauf“.
2. **Wer nennt das Problem?** Das Spiel erfasst es bewusst nicht. Falls es später eine Reihenfolge gibt („Alex ist dran“), ließe sich die Rolle an das Problem statt an die Seite binden – erst dann neu entscheiden.
3. **Private Kanäle:** Supabase bietet Realtime-Kanäle mit Zugriffsregeln; ob das bei zwei Geräten ohne Konto mehr bringt als ein zufälliger Name, vor Stufe 2 prüfen.
