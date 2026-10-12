# Befunde aus dem Testlauf (Oktober 2026)

Grundlage: zwei Spiele à 5 Runden in der geschlossenen Testphase (Union–Grüne, SPD–AfD, mit Rolle, Bundesland Sachsen-Anhalt). Jeder Punkt wurde zuerst am Code und an `daten/` geprüft. Programmstellen stammen aus den PDFs im Zwischenspeicher (`npm run programm:text`, Seitenzahl = `#page=N`); das BSW-Programm war nicht abrufbar (Server 503) und ist deshalb nirgends geprüft.

Klassen: **a** Code oder Logik · **b** Daten · **c** Produktentscheidung.

## Übersicht

| # | Klasse | Ursache gefunden | Änderung oder Empfehlung | Test |
| --- | --- | --- | --- | --- |
| 1 | a + b | `ki.ts` → `systemPrompt`: „die ID, die am besten passt“ ohne Ausweg, wenn der genannte Grund im Katalog fehlt. In `daten/` gibt es kein Thema und keine Ursache zu Arbeitszeit, Erreichbarkeit, Vereinbarkeit (nächstliegend: T5, T28). | Prompt: Grund genannt, aber keine Ursache passt → kein Thema („ungeprüft“, Warteschlange). Zusätzlich Beleg-Pflicht je Ursache (siehe 4). Daten: neues Thema über `/thema-anlegen` nötig (unten). | Unit-Tests grün; KI-Testset: Fall bleibt falsch (jetzt T28 statt T5) → Datenlücke |
| 2 | b | Themen 1–5, 7, 8, 10–14, 16, 17 haben **keinen Leitfaden mit Suchbegriffen** (`daten/leitfaeden/` fehlt) – erfasst vor Regel 4 der Methode („in alle Richtungen suchen“). Die Anzeige trennt „noch nicht erfasst“ sauber (`forderung.ts` → `Fund`, `bewertung.ts` → `fehlt`). | Liste der Nachträge unten (mit Seite und Zitat). Empfehlung: Leitfaden nachziehen und `/thema-erfassen` für T2, T5, T10, T14 neu laufen lassen. | – |
| 3 | a (Anzeige) + b | Mehrfachzählung ist Absicht (`docs/methode.md` → „Wer über die Zuordnung entscheidet“). Sie war nur nicht sichtbar. Union 2005 bei U202 passt fachlich schlecht. | Auflösung: „Wirkt auf n der genannten Ursachen und zählt deshalb bei jeder davon“; Legende erklärt die Summe. Zuordnung 2005 zur Prüfung (unten). Variante „nur einmal“ als Entscheidungsvorlage. | `tsc`, `lint` grün |
| 4 | a | `bereinigeAntwort` kappte KI-Zuordnungen nicht (nur angetippte bei 3) und prüfte keinen Bezug zur Eingabe. Testset vorher: 6 Fälle „zu viele Ursachen“, bei vagen Eingaben bis zu 4 Ursachen. | KI liefert `ursachen_belege` (Wörter aus der Eingabe); Ursachen ohne nachweisbare Wörter oder mit denselben Wörtern wie eine andere fallen weg; höchstens 3. Die Auflösung zeigt „Deine Worte: …“. Prompt: Ursachen mit Lage-Voraussetzung (laufender Vertrag …) nur, wenn die Lage genannt ist. | 7 neue Unit-Tests; Testset „zu viele“ 6 → 3 |
| 5 | c | `bewertung.ts`: Deckel 9 je Ursache. Bei Schule/ST U401 haben fünf Parteien je eine Maßnahme mit 3 × 3 – der Gleichstand entsteht schon vor dem Deckel. | Entscheidungsvorlage unten | – |
| 6 | b + c | Union 6236 ist ein reiner Prüfauftrag („Wir prüfen …“), zählt nach Methode nicht; er erbt über Instrument 6225 die Werte der konkreten FDP-Zusage (U 3). SPD-ST 6782 „Ziel ist eine Mobilitätsgarantie“ ist ein Ziel und erbt Instrument 6751 („Stundentakt für jeden Ort“). Die Regel W 3 nur mit `belegt` wird eingehalten (W 2 mit `offen` ist erlaubt). | Liste zur Prüfung per Skill (unten); Regelvorschlag: Prüfauftrag/Ziel nie an ein Instrument mit konkreter Zusage hängen. | – |
| 7 | a | `antwortAusAuswahl` setzte bewusst „Thema: eine Ursache angetippt“. | Zusammenfassung = angetippter Alltagssatz aus dem Katalog (bei mehreren nacheinander). Kein Text der Person. | Unit-Test angepasst |
| 8 | c | U504 „Zu wenig Investitionen … Kommunen“ liegt unter T5 Arbeitsplätze; Antwortoptionen sind nach ID sortiert, nicht nach Relevanz (`UrsachenAuswahl.tsx`). | Entscheidungsvorlage unten | – |
| 9 | – (gewollt) | `spiel.ts` → `gespraechsKarten`: nur Karten. Die Pflege-Forderung entsprach Instrument 6233 (Karte), „Kommunen mehr Bundesmittel“ keinem Instrument (keine Karte). | Regel in `docs/konzept.md` dokumentiert. | – |
| 10 | c | Runde ohne Thema zählt als eine der fünf. | Entscheidungsvorlage unten | – |
| 11 | a | Zwei Wortlaute („KI-Entwurf“, „vorläufige Bewertung, nicht blind“), nur einer erklärt. | Einheitlich „KI-Entwurf“ / „KI-Entwurf, nicht blind“; beide in Auflösung, Endbildschirm und Forderungskarte erklärt (`belege.tsx`). | `tsc`, `lint` grün |
| 12 | – (kein Fehler belegbar) | SPD 11. 1. 2025 (S. 68) und AfD 11./12. 1. 2025 (S. 2, 177) stehen so im PDF. Union, FDP, Grüne, Linke nennen im PDF **kein** Datum; der Ordner `/2025/01/` im Union-Link ist das Upload-Datum der Layoutfassung, kein Beschlussdatum. | Keine Änderung. Optional: in `parteien.json` vermerken, woher `programm_stand` stammt (Beschluss, nicht PDF). | – |
| 13 | a | `zufall.ts`: Problem, Forderung, Haltung gleich wahrscheinlich → 2/3 keine Alltagsprobleme. | Gewichtung 3 : 1 : 1 und Schalter „nur Alltagsprobleme“ (gilt bis zum Neuladen, nicht im Browser gespeichert). | 2 neue Unit-Tests |

**Tests:** `npm test` 473 von 473 grün, `npm run daten:pruefen` ohne Fehler, `lint` und `typen` ohne Befund, `supabase/dashboard` neu erzeugt (`npm run dashboard`, Seed unverändert).

**KI-Testset** (`npm run ki:testset`, Mistral, 2 Durchgänge, vor dem Hinweis, Mistral nicht mehr zu nutzen):

| | vorher | nachher |
| --- | --- | --- |
| alles richtig | 86/92 (+ neue Fälle: Arbeitszeit 0/3, Wohnungssuche 3/3) | 85/96 |
| zu viele Ursachen | 6 | 3 |
| zu wenige | 0 | 2 |
| unnötig nachgefragt | 0 | 2 |

Die Gesamtquote ist im Rauschen gleich; zu viele Zuordnungen sind halbiert, dafür gibt es vereinzelt Nachfragen, wo eine Zuordnung möglich gewesen wäre. Der Wohnungssuche-Fall bekommt nicht mehr U204 („laufende Verträge“). Vor dem Deploy sollte das Testset mit `--runden 3` noch einmal laufen. Für das Testset in Cloud-Sitzungen braucht Node `NODE_USE_ENV_PROXY=1`; das Skript wiederholt jetzt bei Rate-Limit (429).

## Datenänderungen zur Prüfung per Skill (Punkte 1, 2, 3, 6)

Nichts davon ist in `daten/` eingetragen: Maßnahmen und Bewertungen entstehen nur über `/thema-erfassen` (Erfassung → Bewertung ohne Parteinamen). Seiten = `#page=N` im verlinkten PDF.

### Nachträge, die im Programm stehen, aber fehlen (Punkt 2)

| Thema / Ursache bzw. Instrument | Partei | Seite | Wörtliches Zitat | Einschätzung |
| --- | --- | --- | --- | --- |
| T5 / U507 Tarifbindung | Union | 33 | „Allgemeinverbindlichkeit von Tarifverträgen stärken. Die zentrale Rolle im Tarifausschuss müssen weiter die Sozialpartner spielen.“ | Maßnahme fehlt (Instrument wie SPD 5017 / Grüne 5028 prüfen; die Union nennt kein „erleichtern“) |
| T5 / U507 | Union | 33 | „Wir stützen durch Änderungen im Tarifvertragsgesetz die Bereitschaft, sich an Tarifverträge zu binden.“ | eigene Maßnahme (unbestimmt → Umsetzbarkeit) |
| T5 / U507 | Union | 32 | „Unser Ziel ist eine höhere Tarifbindung.“ | nur Ziel, zählt allein nicht |
| T5 / U504 Investitionen | Union | 74 | „Wir sorgen für dauerhafte Finanzierungsstabilität, die unabhängig von schwankenden Haushaltsmitteln ist. Zudem müssen wir kurzfristig mehr Kapital mobilisieren, um den Investitionsstau zu lösen. Dazu setzen wir auf starke Anreize für private Investoren.“ | Maßnahme fehlt |
| T5 / U504 | Union | 74 | „Wir stehen für eine auskömmliche Finanzierung von Autobahnen, Brücken- und Straßeninfrastruktur.“ | Grenzfall (Ziel ohne Betrag) |
| T14 / U1404 Verwaltung überladen | SPD | 37 | „Wir werden alle neuen Gesetze und größeren Novellierungen vor Verabschiedung auf Wirksamkeit, Bürgernähe, Praxistauglichkeit und Digitaltauglichkeit testen und bestehende Gesetze schrittweise entsprechend überprüfen. Dazu werden wir die Instrumente des Bürgerchecks, des Praxischecks und des Digitalchecks verzahnen und verbindlich in der Gesetzgebungsarbeit verankern.“ | Maßnahme fehlt |
| T14 / U1404 | AfD | 56 | „In der Praxis wird dieses Prinzip zulasten insbesondere der Kommunen nicht durchgehend eingehalten, was dort zu erheblichen finanziellen Belastungen führt. Wir fordern die strikte Einhaltung des verfassungsrechtlich geregelten Prinzips.“ (Konnexität) | Maßnahme fehlt (setzt am Aufgabenanstieg ohne Finanzierung an) |
| T14 / U1404 | Linke | 44 | „Kosten, die von Bund oder Ländern verursacht werden, müssen auch von dort finanziert werden (Konnexität).“ | Maßnahme fehlt |
| T20 / Instrument 9268 Kinder- und Jugendplan | Linke | 16 | „Die Mittel des Kinder- und Jugendplans des Bundes müssen dafür ebenfalls aufgestockt werden“ | Stelle steckt in Maßnahme 9324, ist aber nicht dem Instrument 9268 zugeordnet → Forderungskarte zeigt fälschlich „nicht gefunden“ |
| T10 / Instrument 6233 Bessere Bezahlung | FDP | 33 | „Zu einer Stärkung der flächendeckenden ambulanten Versorgung gehört für uns auch, dass die ungekürzte Vergütung aller Gesundheitsberufe leistungsgerecht erfolgen muss.“ | Grenzfall: zielt im Kontext auf die ambulante (ärztliche) Versorgung |
| T10 / Instrument 6233 | Grüne | 92 | „Unser Ziel sind eine starke berufsständische Vertretung der Pflege und eine hohe Tarifbindung in der Branche.“ | nur Ziel, zählt nicht – „nicht gefunden“ ist nach Methode richtig |

**Verdacht nicht bestätigt:** Pflege-Bezahlung bei Union, AfD (keine Fundstelle zu Löhnen in der Pflege; AfD S. 112 beschreibt nur die Lage); Kinder- und Jugendplan bei Union, FDP, AfD (keine Treffer zu Jugendverbänden, Jugendplan, Jugendarbeit). Linke bei Pflege-Bezahlung: in `daten/` steht Maßnahme 6276 mit Instrument 6233 („steht im Programm“) – der Befund im Spiel ist mit dem aktuellen Stand nicht nachvollziehbar (älterer Seed?). AfD S. 14 („Strangulierende Bürokratie … reduzieren wir durch …“) betrifft Unternehmen (T5/U505), nicht die Verwaltung (U1404).

### Zuordnung und Einzelwerte (Punkte 3 und 6)

| Maßnahme | Befund | Vorschlag |
| --- | --- | --- |
| Union 6236 (T10, Instrument 6225) | Zitat: „Wir prüfen die bessere steuerliche Absetzbarkeit solcher Modelle …“ – reiner Prüfauftrag; nach `docs/methode.md` zählt er nicht. Erbt W 1 / U 3 der konkreten FDP-Zusage 6266. | Streichen oder als Ziel ohne Maßnahme führen. |
| SPD-ST 6782 (T8, Instrument 6751) | S. 41: „Ziel ist eine Mobilitätsgarantie für alle Regionen. Dazu gehören die Sicherung der bestehenden Straßenbahnnetze, die Förderung der Neuanschaffung …“ – die Garantie ist ein Ziel; das Instrument verlangt einen festen Takt. | Vom Instrument lösen; die konkreten Teile (Straßenbahnnetze, Fahrzeuge) als eigene Maßnahmen bewerten. |
| Union 2005 (T2) | „Sozialen Wohnungsbau fördern und Wohngeld anpassen“ bei U201, U202, U206; ohne Instrument, obwohl Instrument 6642 „Sozialen … Wohnungsbau fördern“ existiert (dort W 2). Wohngeld lindert Folgen, setzt nicht am Neuvermietungsaufschlag (U202) an. | In zwei Maßnahmen teilen (Wohnungsbau → 6642, Wohngeld eigener Weg), U202 streichen. Neu bewerten ohne Parteinamen. |
| Grüne 6643 (T2) | Mietwucher (§ 5 WiStG) → U202, Indexmieten → U204: passt. | Keine Änderung. |
| Übrige „prüfen“-Zitate | Systematische Suche über alle Themen: 30 Zitate mit „prüf…“ (Bund und Länder); außer 6236 enthalten alle eine Handlung („überprüfen und anpassen“, „streichen“). Grenzfall: Linke 2056 „Wir wollen Regulierungen überprüfen“ (T2, W 1 / U 3). | 2056 mitprüfen. |

**Regelvorschlag (alle Parteien gleich):** Ein Prüfauftrag oder ein Ziel bekommt nie ein Instrument, dessen Bewertung von einer konkreten Zusage stammt – „Gleicher Vorschlag, gleiche Bewertung“ gilt nur bei gleichem Bindungsgrad. Ließe sich in `npm run daten:pruefen` als Hinweis prüfen (Zitat mit „wir prüfen“/„Ziel ist“ an einem Instrument mit Umsetzbarkeit 3).

### Neues Thema (Punkt 1)

„Arbeitszeit, Erreichbarkeit und Vereinbarkeit von Beruf und Familie“ über `/thema-anlegen` (Ursachen ohne Blick in die Programme, unabhängige Quellen). Erst danach sucht `/thema-erfassen` die Programmstellen (etwa Wochen- statt Tageshöchstarbeitszeit, Recht auf Nichterreichbarkeit) – sie jetzt einzutragen, hieße Ursachen passend zu Programmen zu schneiden.

## Entscheidungsvorlagen

### Punkt 3 – Maßnahme bei mehreren Ursachen

| Variante | Wirkung | Für alle gleich? |
| --- | --- | --- |
| **A (umgesetzt): zählt bei jeder Ursache, sichtbar gekennzeichnet** | wie Methode heute; Hinweis „Wirkt auf n der genannten Ursachen …“ | ja |
| B: je Runde nur einmal, bei der Ursache mit dem höchsten Beitrag | belohnt Breite eines Programms weniger; ändert die Methode | ja, braucht Methodenbeirat |
| C: zählt mehrfach, aber ab der zweiten Ursache mit halbem Gewicht | Mittelweg; Rechnung schwerer nachvollziehbar | ja |

Empfehlung: A beibehalten und mit der Beleg-Pflicht (Punkt 4) beobachten – Mehrfachzählung entsteht vor allem durch zu viele zugeordnete Ursachen.

### Punkt 5 – Gleichstand am Deckel

Rechnung an den echten Daten (Schule, Sachsen-Anhalt, U401): Union, SPD, Grüne, FDP, Linke je 9; ohne Deckel Union, Grüne, Linke 9,3, SPD und FDP 9,0, BSW 6,8, AfD 4,5. Der Gleichstand entsteht also, weil jede dieser Parteien eine Maßnahme mit 3 × 3 hat, nicht durch den Deckel.

| Variante | Auswirkung (neutral beschrieben) |
| --- | --- |
| A: Rohsumme nur anzeigen („9 (9,3)“), Wertung unverändert | macht Unterschiede sichtbar, ändert keine Punkte |
| B: Rohsumme werten (Deckel weg) | trennt kaum (9,0 gegen 9,3); belohnt Programme mit mehr Lösungswegen – genau das soll der Deckel verhindern |
| C: Mindest-Wirksamkeit 2 für jeden Lösungsweg | entfernt schwache Füllwege (z. B. „E-Sport-Leitlinie“); trifft Parteien unterschiedlich stark: bei Schule/ST verlieren alle außer der Union bei mindestens einer Ursache Punkte (z. B. U405: Linke 4,5 → 0, BSW 4,8 → 0, SPD 6 → 4); bei Jugend-Treffpunkten (T20, U2001) sinken SPD 6,8 → 4, AfD 2 → 0, BSW 3 → 0 |
| D: „Beste Lösung“ bei Gleichstand nach dem zweitbesten Weg ordnen oder alle nennen (heute) | ändert nur die Anzeige der besten Parteien |

Empfehlung: A sofort (nur Anzeige); C nur nach Methodenbeirat, weil es eine Mindestschwelle einführt, die Breite und Qualität anders gewichtet.

### Punkt 8 – Forderung „Kommunen mehr Bundesmittel“

| Variante | Folge |
| --- | --- |
| A: Ursache U504 bleibt bei T5; Forderung → T5 | wie heute; passt inhaltlich schlecht zu „Arbeitsplätze“ |
| B: neues Thema „Kommunalfinanzen / Zustand vor Ort“ über `/thema-anlegen` | Stellen gibt es in mehreren Programmen (Konnexität: Union S. 76, AfD S. 56, Linke S. 44) |
| C: Antwortoptionen nach Relevanz sortieren (zweiter, kurzer KI-Aufruf oder Stichwortnähe) | weniger Fehltipps; kostet einen KI-Aufruf oder liefert grobe Reihenfolge |

Empfehlung: B; C erst, wenn Themen mehr als acht Ursachen haben (dann sind ohnehin nicht alle sichtbar).

### Punkt 10 – Runde ohne bekanntes Thema

| Variante | Missbrauch | Datenschutz |
| --- | --- | --- |
| A: wie heute, Runde zählt | keiner | eine Eingabe je Runde in `review_eingaben` |
| B: einmal je Spieler:in wiederholbar | gering (eine Wiederholung) | bis zu eine Eingabe mehr in `review_eingaben` je Person |
| C: unbegrenzt wiederholbar | Rate-Limit belastet, Spiel zieht sich | beliebig viele Eingaben in `review_eingaben` |

Empfehlung: B – wie bei Haltungen und Forderungen geht die Runde dann weiter; die Wiederholung zählt weiter für das Rate-Limit je Sitzung, und die Eingabe landet wie bisher anonym und befristet (30 Tage) in `review_eingaben`.
