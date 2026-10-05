# Haltungen: Kandidaten aus Straßenumfragen

Stand: 5. 10. 2026. Vorschlag zur Sichtung, **noch keine Entscheidung** über die Aufnahme.

## Herkunft und Grenzen der Liste

Die Betreiberin hat mit NotebookLM aus Straßenumfragen des YouTube-Kanals *Marcant* Äußerungen extrahiert und gezählt (rund 100 Einträge). Die Liste ist wertvoll, weil sie zeigt, **was Spielende tatsächlich sagen werden** – in ihren eigenen Worten. Für die Auswahl von Haltungen taugt sie nur als Anstoß:

- **Stichprobe:** Straßenumfragen eines Kanals, Schwerpunkt Ostdeutschland und AfD-Umfeld. Häufigkeiten sagen etwas über die Videos, nicht über die Bevölkerung. Die Aufnahme richtet sich deshalb wie bisher nach den Kriterien in `docs/methode.md` (Wertfrage, mindestens drei Programme mit Position, keine Tatsachen- oder Würdefrage), nicht nach der Zahl der Nennungen.
- **Zählung:** Die Zahlen stammen von NotebookLM und sind nicht nachgeprüft (ein Eintrag hat „90 %“ statt einer Zahl, zwei „Quellennachweise“).
- **Ausgewogenheit:** Fragen, die vor allem eine Seite bewegen, werden neutral als Ja/Nein-Frage gestellt. Damit die Karten nicht nur Themen aus einem Lager abbilden, sollte vor einer Freigabe eine zweite Quelle mit anderem Schwerpunkt dazukommen (siehe „Vorgehen“, Schritt 1).

## Ergebnis der Sichtung

Von rund 100 Einträgen sind nur etwa 20 Wertfragen, wie sie die Haltungskarte braucht. Die übrigen sind keineswegs wertlos – sie bekommen im Spiel einen anderen Weg und eignen sich als **Testfälle für die KI-Einordnung**:

| Gruppe | Anzahl Einträge | Was das Spiel tut | Nutzen der Einträge |
| --- | --- | --- | --- |
| A Haltung (Wertfrage) | ≈ 20 → 17 Fragen | Haltungskarte | Neue Haltungen, siehe unten |
| B Forderung (Lösungsweg) | ≈ 12 | Forderungskarte, wenn Instrument erfasst | Abgleich mit Instrumenten; fehlende ergänzen |
| C Alltagsproblem | ≈ 6 | Gewertete Runde | Themen- oder Ursachenkandidaten |
| D Pauschalurteil über eine Gruppe | ≈ 10 | Nachfrage nach dem Erlebten (`pauschal`) | Testfälle |
| E Grenze | ≈ 8 | „Darauf geht das Spiel nicht ein …“ | Testfälle |
| F Tatsachenbehauptung | ≈ 10 | Keine Bestätigung, keine Widerlegung (Teil C) | Testfälle; Material für einen späteren Faktenteil |
| G Urteil über Parteien, Politik, Geschichte | ≈ 30 | `wert` ohne Karte | Testfälle; das Spiel bewertet keine Parteien |

### A Haltungen

Konsolidiert, neutral als Ja/Nein-Frage formuliert (Entwurf für Phase A; Wortlaut wird dort mit Beschreibung und Zielkonflikten festgelegt). „Welle“ ist ein Vorschlag für die Reihenfolge: Welle 1 = viele Nennungen und voraussichtlich in mindestens drei Bundesprogrammen mit Position; ob das stimmt, zeigt erst Phase B (wie bei Haltung 3).

| Welle | Frage (Entwurf) | Aus den Einträgen (Nennungen) | Verwandte Themen |
| --- | --- | --- | --- |
| – | *Schon da:* Soll Zuwanderung nach Deutschland stärker begrenzt werden? (Haltung 2) | Zuwanderung, Abschiebung, Grenzen (9); Integrationswille (3); „gut integrierte dürfen bleiben“ (2) | 6, 2, 5, 9 |
| 1 | Soll der Ausbau der Windkraft an Land weitergehen? | Windkraft stoppen/zurückbauen (9) | 3 |
| 1 | Soll Deutschland am Ziel festhalten, bis 2045 klimaneutral zu werden? | Klimaskepsis (5, als Wertfrage gefasst), Umweltschutz nachrangig (1), Doppelmoral (1) | 3, 16, 18 |
| 1 | Soll Deutschland die Ukraine weiter mit Waffen unterstützen? | Frieden/keine Waffenlieferungen (5), Unterstützung von Diktaturen (1) | 3 |
| 1 | Soll die Wehrpflicht wieder eingeführt werden? | Wehrpflicht (1); aktuelle Debatte | – |
| 1 | Soll es wieder eine Vermögensteuer geben? | Erbschafts- und Vermögensteuer ablehnen (3), Steuerlast (1) | 11 |
| 1 | Sollen die Regeln für die Einbürgerung wieder strenger werden? | Geburtsortprinzip infrage (3, ohne den Grenzfall „Entzug“), Staatsangehörigkeit im GG (2) | 6 |
| 1 | Soll man Geschlechtseintrag und Vornamen durch eine Erklärung beim Standesamt ändern können? | LGBTQ/Gender (8) – auf die konkrete Rechtsfrage zugespitzt, ohne die Rechte einer Gruppe zur Abstimmung zu stellen | – |
| 1 | Sollen Kinder mit Behinderung in der Regel an allgemeinen Schulen lernen statt an Förderschulen? | Inklusion infrage (4), Sonderschulen erhalten (1) | 4 |
| 2 | Soll der Staat in Behörden und Schulen auf Gendersprache verzichten? | LGBTQ/Gender (8), Werteverfall (4) | 4, 14 |
| 2 | Soll sich Kulturförderung und Integration an einer deutschen Leitkultur ausrichten? | Heimatkultur fördern (8), Kunstfreiheit nur für deutsche Kultur (8), Brauchtum (1) | 6 |
| 2 | Sollen Zugewanderte erst nach einer Wartezeit volle Sozialleistungen bekommen? | Bevorzugung Deutscher (2), Sozialleistungsmissbrauch (7, ohne das Pauschalurteil) | 6, 7 |
| 2 | Sollen die Wirtschaftssanktionen gegen Russland gelockert werden? | Wirtschaftsbeziehungen zu Russland (1), Gas aus Russland (3, als Lösungsweg Instrument 6828) | 3, 11 |
| 2 | Sollen die Staatsleistungen an die Kirchen beendet werden? | Kirchenfinanzierung beenden (2) | – |
| 2 | Soll der öffentlich-rechtliche Rundfunk deutlich verkleinert werden? | Neutrale Berichterstattung (2) | – |
| 3 | Soll Deutschland aus der EU / der NATO austreten? (zwei Fragen) | EU und NATO ablehnen (1), Neutralität nach Schweizer Vorbild (1), Euro behalten (1) | – |
| 3 | Soll Unterricht zu Hause statt Schulbesuch erlaubt werden? | Homeschooling (2), Schulpflicht abschaffen (1) | 4 |
| 3 | Sollen Lehrerinnen und Beamtinnen im Dienst ein Kopftuch tragen dürfen? | Islamisierung (2), Kopftuch (1) – nur als Rechtsfrage, nicht als Urteil über Musliminnen | 4 |

Welle 3 erfüllt das Kriterium „mindestens drei Programme“ voraussichtlich nicht oder hat wenige Nennungen; erst nach Welle 1 und 2 prüfen. Nicht aufgenommen werden Grundsätze, über die es keinen Programmstreit gibt („Grundgesetz einhalten“, „Gesetze befolgen“, „alle Extremismusformen gleich behandeln“, „Dialog statt Beleidigung“) – sie unterscheiden keine Partei.

Offen: Haltungen ohne verwandtes Thema (Wehrpflicht, Kirchen, Rundfunk, EU/NATO). Die Karte endet mit Themen zum Antippen; ohne Thema fehlt die Brücke zum Alltag. Entweder ein Thema mit lose verwandten Ursachen nennen oder die Brücke dort nur als Frage anbieten.

### B Forderungen (Lösungswege)

Kein eigener Katalogeintrag, sondern Forderungskarte über ein Instrument. Erfasst sind schon:

| Eintrag (Nennungen) | Instrument |
| --- | --- |
| Konsequent abschieben, Grenzen schließen (9) | 6099 Zurückweisung an den Binnengrenzen, 6105 Abschiebungshaft |
| Straffällige Ausländer abschieben (3) | 6111 (Thema 6), 7497 (Thema 9) |
| Härter durchgreifen, Polizei stärken (4, 2) | 7482, 7506 (Bund) |
| Atomkraft wieder einsteigen (8) | 6708 Kohle- und Kernkraftwerke länger oder wieder betreiben |
| Gas aus Russland (3) | 6828 |
| Schuldenbremse erhalten (1) | 6098 (Gegenrichtung „lockern oder abschaffen“) |
| Mindestlohn ablehnen (1) | 6094/6181/6889 (Gegenrichtung „anheben“) |
| Bürokratieabbau (1) | 6091 |
| Steuern senken (3) | 6885 Einkommensteuertarif abflachen |
| Gewerkschaften, Tarifbindung (2, 3) | 6890 Tarifbindung stärken (Gegenrichtung) |

Zu prüfen in `/thema-erfassen`: Gibt es die **Gegenrichtung** jeweils als Instrument, wenn ein Programm sie fordert (z. B. „Mindestlohn nicht politisch festsetzen“, „Schuldenbremse unverändert“)? Sonst zeigt die Forderungskarte nur die eine Seite. Ohne Thema: Renteneintrittsalter nicht erhöhen (1, Thema 7 prüfen), Zuckersteuer (1), Düngeregeln lockern (3, kein Thema Landwirtschaft), Bürgerstreifen (1, Grenzfall zu E).

### C Alltagsprobleme

| Eintrag | Weg |
| --- | --- |
| Arbeitslosigkeit durch KI und Digitalisierung (2), KI ersetzt Fachkräfte im Gesundheitswesen (1) | Ursache in Thema 5 prüfen |
| Schulgebäude, Leistungsdruck (1) | Thema 4 |
| Fehlende Infrastruktur auf dem Land (1), Agrarflächen für Infrastruktur und Solarparks (2, 3) | Kandidat „Ländlicher Raum“ (`daten/README.md` → „Kandidaten für später“) |
| Hohe Steuerlast, Auswanderung (1, 1) | Ggf. Themenkandidat „Steuern und Abgaben“, abgrenzen von Thema 11 |
| Seit Corona von der Politik vernachlässigt (1) | Nachfrage nach dem konkreten Problem |

### D–G Kein Katalogeintrag

Diese Einträge bekommen keine Karte. Sie werden hier nicht wiederholt, sondern nur der Gruppe zugeordnet:

- **D Pauschalurteil** (Nachfrage nach dem Erlebten, keine Ursachenauswahl): Arbeitsverweigerung/Sozialmissbrauch durch Ausländer, Kriminalität durch Ausländer (zwei Einträge), Islam = Islamismus, Islamisierung, Kopftuchträgerinnen, Stadtbild, Westdeutsche, Frauenrechtlerinnen, „Ausländer raus“ als allgemeine Ablehnung (Grenzfall zu E, je nach Wortlaut).
- **E Grenze** (Abwertung, gleiche Rechte, Gewalt, Beleidigung): rechtsextreme Symbolik und Parolen, Entzug der Staatsbürgerschaft wegen Migrationshintergrund, „Passdeutsche“, „Gesindel“/„linke Zecken“, Verharmlosung von Gewalt gegen politische Gegner, Selbstjustiz, Holocaust-Relativierung, Behauptung jüdischer Herrschaft über Banken.
- **F Tatsachenbehauptung** (KI bestätigt und widerlegt nicht): Leugnung des menschengemachten Klimawandels, gekaufte Klimaforschung, Wahlmanipulation, Nationalsozialisten „links“, Kriegsschuld, „kein Krieg in Teilen der Ukraine“, staatlich gesteuerte Demonstrationen, „Rassismus gibt es nicht“, Bevorzugung von Migranten gegenüber Rentnern (mit möglichem Problem dahinter: Rente, Thema 7).
- **G Urteil über Parteien, Politik oder Geschichte** (`wert` ohne Karte; das Spiel bewertet keine Parteien): Unzufriedenheit mit „Altparteien“, Ablehnung der AfD, Ausgrenzung von AfD-Sympathisanten, Gleichsetzung mit Faschismus/Diktatur, Koalitionsbetrug, „AfD hört zu“, „erstmal machen lassen“, Aufschwung unter AfD, Grüne als Hauptfeind, CDU als „Kommunisten“, AfD nutzt Armut aus, Instrumentalisierung, Antifa als linksextrem, Antikommunismus aus DDR-Erfahrung, Weimarer Parteien, Kaiserreich, 1990er Jahre, Beeinflussung von Wählerinnen, Parteipolitik im Fußball, Simson-Kultur, Unterstützung „Die Heimat“, Nächstenliebe/Selbsterhaltung, Kirche entfremdet, Kirchenasyl, studentische Fachschaften abschaffen, traditionelle Rollenbilder (Grenzfall zu A: ließe sich als Frage nach Familienpolitik fassen; Haltung 3 hatte zu wenige Programme).

## Vorgehen

Der vorhandene Ablauf (Phase A ohne Programme → Freigabe → Phase B aus allen sieben Bundesprogrammen → Prüfung) trägt auch viele Haltungen. Er ist aber bisher Handarbeit; für 15–20 Haltungen lohnen sich zwei Skills nach dem Muster von `/thema-anlegen` und `/thema-erfassen`.

1. **Auswahl festlegen** (Betreiberin): Welle 1 bestätigen, streichen oder ergänzen. Empfehlung: eine zweite Liste aus anderer Richtung dazunehmen (z. B. Umfragen zu Streitfragen wie im Wahl-O-Mat oder Politbarometer), damit der Katalog nicht nur die Themen eines Kanals abbildet.
2. **Skill `/haltung-anlegen` (Phase A)**: unter Programmsperre (`npm run phase-a -- start`), je Haltung ein Rechercheagent ohne Programmzugriff für Beschreibung und Zielkonflikte mit unabhängigen Quellen (wie `ursachen-recherche`). Ergebnis: JSON-Datei mit neuer ID und Abschnitt in `docs/haltungen.md`. Gebündelt **ein Pull Request je Welle**, Freigabe je Haltung.
3. **Vorprüfung „mindestens drei Programme“** (optional, spart Arbeit wie bei Haltung 3): ein Agent zählt nur, in wie vielen Bundesprogrammen Suchbegriffe zur Frage vorkommen, und meldet keine Zitate oder Positionen. So bleibt Phase A blind, und aussichtslose Fragen fallen früh heraus.
4. **Skill `/haltung-erfassen` (Phase B)**: je Haltung sieben parallele Agenten, einer je Bundesprogramm (wie `programm-erfassung`), die Position, Zitat, Seite und bei „keine Aussage“ die Suchbegriffe liefern; danach `npm run daten:pruefen` und `zitate:pruefen`. Ein Pull Request je Welle. Voraussetzung: das BSW-Bundesprogramm liegt im Zwischenspeicher (derzeit nicht ladbar, ggf. `--lokal`).
5. **Prüfung gebündelt**: `npm run haltung:pruefliste` erzeugt die Blindblätter für alle Haltungen einer Welle auf einmal; zwei Prüfende beantworten sie in einem Durchgang.
6. **Testfälle für die KI**: Die Einträge aus D–G (und Beispielsätze zu A und B) als Regressionstests für die Einordnung `problem`/`forderung`/`wert`/`grenze`/`pauschal` aufnehmen. So zeigt sich vor dem Start, ob die KI genau die Äußerungen richtig behandelt, die in der Zielgruppe vorkommen.

Hinweis zum Plan: `docs/plan-haltungen.md` (Schritt 5) sieht weitere Haltungen erst nach Tests mit Spielenden aus verschiedenen Lagern vor. Schritt 2 und 3 kosten keine Programmarbeit und können vorher laufen; ob Phase B für Welle 1 schon vor den Tests beginnt, entscheidet die Betreiberin.
