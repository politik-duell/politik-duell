# Evaluationen für `/thema-erfassen`

Szenarien im Format der Skill-Best-Practices (`skills`, `query`, `files`, `expected_behavior`). Sie stammen aus echten Fehlern beim Erfassen von Thema 9 (Sicherheit; Bundes- und Landesdurchgang). Jedes Szenario ist zusätzlich als automatischer Test umgesetzt (`scripts/entwurf.test.ts` → „Evaluationen des Skills“, dort wird auch das Format dieser Dateien geprüft). Das Verhalten der Koordination selbst (`expected_behavior`) lässt sich nur in einem Durchlauf beobachten; die Tests sichern die Skripte, auf die sich dieses Verhalten stützt.

| Datei | Szenario | Automatisch geprüft |
| --- | --- | --- |
| [a-buendel-belegt.json](a-buendel-belegt.json) | Bündel belegt, zweite *verschiedene* Zusage → nicht zusammenfassen | Fehlermeldung von `entwurf:programm-pruefen`, Liste „ohne Bündel“, Vergleich meldet „zusammengefasst?“ |
| [b-kennungen-stabil.json](b-kennungen-stabil.json) | Maßnahme nach Rückfrage eingefügt → Kennungen stabil, Meldung neu/entfallen | eine neue Kennung, alte Bewertung passt nicht mehr, Teil-Neubewertung nur für die neue |
| [c-programm-nicht-erreichbar.json](c-programm-nicht-erreichbar.json) | Programm online nicht erreichbar → lokale Kopie mit Prüfsumme, sonst „noch nicht erfasst“ | kein Abdeckungseintrag, lokale Kopie nur über die Prüfsumme |
| [d-parteiname-im-zitat.json](d-parteiname-im-zitat.json) | Rest eines Parteinamens im Zitat → Meldung, Begründung im Pull Request | Rest gemeldet, Zitat wörtlich, Parteiname in Rückfrage erkannt; Hook-Tests in `scripts/sperre.test.ts` |
| [e-pflichtursache-begruendet.json](e-pflichtursache-begruendet.json) | Pflichtursache ohne Maßnahme und ohne gelesene Seiten → Agent ergänzt `nicht_erfasst`, keine Rückfrage | Format, Hinweis erledigt, Kurzbericht |
| [f-formfehler-bewertung.json](f-formfehler-bewertung.json) | Formfehler der Bewertung → Rückfrage an denselben Agenten, Selbstprüfung | `pruefeAntwort` = `pruefeBewertung`, Skript mit Zeile/Spalte, Hook erlaubt nur den Prüfbefehl |

## Vergleichstest: kleinste Modellstufe bei der Erfassung

**Frage:** Erkennt die kleinste Stufe der Modellfamilie (in Claude Code: `model: haiku`) Zusagen und Zitate so verlässlich, dass `programm-erfassung` mit ihr laufen kann?

**Aufbau (3. 10. 2026):** Bundesprogramm der FDP, Thema 9, Suchbegriffe aus `docs/perspektiven-ursachen.md` („Erfassung“), Leitfaden `daten/leitfaeden/9.json`, Auftrag mit `auftragText` wie bei `entwurf:auftrag` (Arbeitsordner `.cache/vergleich/9/`, nicht im Repository). Ein Agent `programm-erfassung` mit `model: haiku`, Auftrag wie im Skill. Vergleich mit den 11 Maßnahmen in `daten/themen/09-sicherheit.json` (Erfassung mit der mittleren Stufe, nach der Bewertung ohne Parteinamen).

**Ergebnis:** 20 Maßnahmen, alle Zitate bestanden `entwurf:programm-pruefen` (wörtlich, richtige Seite).

| | Anzahl | Einzelheiten |
| --- | --- | --- |
| Gleiche Stelle wie die vorhandene Erfassung | 6 von 11 | Europol (S. 22), Geldwäsche/Einziehung, Strafgesetzbuch (S. 23), islamistische Influencer (S. 26), Frauenhäuser (S. 29); Quick Freeze mit einem anderen Satz derselben Seite |
| Ähnlich, andere Stelle | 2 | Videoüberwachung (S. 24) statt der Ablehnung flächendeckender Überwachung; Organisationsverbote S. 26 statt S. 51 |
| Fehlt | 3 | Rechtsgrundlagen der Nachrichtendienste (S. 22), Digitalisierung der Gerichte (S. 23, stattdessen Aufzeichnung von Verhandlungen), Schutz gefährdeter Gruppen (S. 26) |
| Zusätzlich, gegen den Leitfaden | 7 | sechs Maßnahmen zu Asyl, Grenze, Sprachkursen und Einbürgerung aus dem Migrationskapitel (S. 28–29) ohne Straftaten- oder Sicherheitsbezug (Regel 8: nur „wenn Zitat oder Abschnitt Straftaten oder Sicherheit nennt“); ein Prüfauftrag („Islamverbände einer kritischen Prüfung unterziehen“, S. 25) |
| Zusätzlich, vertretbar | 4 | Imam-Ausbildung, Evaluation von Präventionsprogrammen, Arbeitsdefinition Antisemitismus, Abschiebungen beim Bund bündeln |
| Kurzbericht | – | Der feste Block war korrekt; der Agent hängte aber eine frei formulierte Zusammenfassung an |

**Schluss:** Zitate und Seiten erkennt die kleinste Stufe verlässlich (die Selbstprüfung erzwingt das ohnehin). Zusagen und Leitfaden-Regeln nicht: Rund ein Drittel der Maßnahmen widerspricht dem Leitfaden oder ist ein Prüfauftrag, drei Zusagen fehlen. Das würde Rückfragen und Bewertung belasten und Programme ungleich behandeln, wenn nicht alle mit derselben Stufe laufen. **Der Skill bleibt unverändert:** Erfassung mit der nächstkleineren Stufe (mittlere), die kleinste nicht. Ein neuer Vergleichstest lohnt sich mit einer neuen Modellgeneration.

## Vergleichstest: vorsortierter Auszug statt ganzer Textdatei

**Frage:** Findet `programm-erfassung` dieselben Maßnahmen mit weniger Tokens, wenn die Textdatei nur die Seiten mit Treffern der Suchbegriffe enthält (Vorschlag aus dem Konzept „Einmal lesen, oft antworten“)?

**Aufbau (9. 10. 2026):** Themen 30 (Sucht und Glücksspiel) und 33 (Mediennutzung von Kindern und Jugendlichen), sechs Bundesprogramme (BSW nicht ladbar: HTTP 503). Je Programm und Thema zwei Agenten `programm-erfassung` mit demselben Modell, Arbeitsordner `.cache/vergleich/<variante>/<ID>/` (nicht im Repository):

- **voll:** Auftrag wie `entwurf:auftrag`, ganze Textdatei.
- **auszug:** derselbe Auftrag, aber die Textdatei enthält nur Seiten mit Treffern und je eine Nachbarseite (Thema 30: 12–44 Seiten je Programm, Thema 33: 3–21; zusammen 11–55 % der Seiten). Zusatz im Auftrag: kein Inhaltsverzeichnis, nichts außerhalb des Auszugs lesen.

Vergleich mit den 34 Bundes-Maßnahmen dieser sechs Parteien in der archivierten Erfassung vom 6. 10. 2026 (`daten/protokolle/30|33/2026-10-06-bund-land-BE-MV-ST/erfassung.json`). Gleich heißt: Seite ±1 und mindestens 60 % gemeinsame Wörter (bezogen auf das kürzere Zitat). Tokens laut Agentenabschluss.

**Ergebnis:**

| | voll | auszug |
| --- | --- | --- |
| Maßnahmen gefunden | 33 | 30 |
| davon wie im Archiv | 31 von 34 | 25 von 34 |
| im Archiv, hier fehlend | 3 (SPD S. 30 zu 30; Grüne S. 77 und AfD S. 50 zu 33) | 9 |
| Tokens (12 Agenten) | 434.869 (Ø 36.239) | 575.500 (Ø 47.958) |
| Laufzeit (Summe) | 346 s | 286 s |

- **Der Auszug verliert Maßnahmen, die keinen Suchbegriff enthalten.** Grüne zu Thema 33: Die drei Zusagen auf S. 85 (Altersgrenzen, sichere Voreinstellungen, Bürgerrat) stehen auf einer Seite ohne Treffer; der volle Agent fand sie über das Kapitel im Inhaltsverzeichnis. Grüne zu Thema 30: Die Zusagen beginnen auf S. 94, der Auszug enthielt nur S. 95–97. Mehr Nachbarseiten würden den zweiten Fall auffangen, den ersten nicht.
- **Der Auszug ist teurer, nicht billiger.** Der volle Agent liest gezielt: Fundstellen-Auszüge im Auftrag, Inhaltsverzeichnis, passende Seiten. Der Auszugs-Agent liest den ganzen Auszug, der bei vielen Treffern (Union zu Thema 30: 44 Seiten) größer ist als das, was der volle Agent tatsächlich liest.
- **Streuung zwischen zwei vollen Läufen:** 31 von 34 gleich. SPD S. 30 und AfD S. 50 fehlen in beiden Varianten; das ist Streuung des Agenten, nicht Folge des Auszugs.
- Die Schätzung im Konzept (rund 8.000 statt 48.000 Tokens je Thema und Programm) trifft nicht zu: Ein Erfassungs-Agent kostet schon mit ganzer Textdatei rund 36.000 Tokens, davon ein großer fester Teil für Agentenbeschreibung, Auftrag und Selbstprüfung.

**Schluss:** **Der Skill bleibt unverändert.** Ein Auszug nach Suchbegriffen spart nichts und übersieht Zusagen, die anders formuliert sind als die Suchbegriffe. Dasselbe Risiko trägt Hebel 1 in `docs/token-verbrauch-erfassung.md` (Programme ohne Treffer überspringen): Seiten ohne Treffer enthielten hier drei Maßnahmen eines Programms.

## Vergleichstest: Sammelaufträge mit verwandten Themen

**Frage:** Sammelaufträge (ein Agent je Programm für mehrere Themen, `entwurf:lauf auftraege --sammel`) waren im Vergleichslauf mit den Themen 18 und 30 teurer als Einzelaufträge (806.752 statt 580.227 Tokens, Pull Request #84). Gilt das auch für zwei Themen, die inhaltlich nah beieinanderliegen?

**Aufbau (9. 10. 2026):** Themen 30 (Sucht und Glücksspiel) und 33 (Mediennutzung von Kindern und Jugendlichen), dieselben sechs Bundesprogramme und Aufträge wie im Test „vorsortierter Auszug“. Je Programm ein Sammelauftrag aus den beiden Einzelaufträgen (`sammelauftrag-text.ts`), Arbeitsordner `.cache/vergleich/sammel/` (nicht im Repository). Vergleich mit dem Lauf „voll“ von demselben Tag und mit den 34 archivierten Maßnahmen, Regeln wie oben.

**Ergebnis:**

| | Einzelaufträge (12 Agenten) | Sammelaufträge (6 Agenten) |
| --- | --- | --- |
| Maßnahmen gefunden | 33 | 32 |
| davon wie im Archiv | 31 von 34 | 32 von 34 (Skript: 31; Union S. 47 dieselbe Zusage mit längerem Zitat) |
| im Archiv, hier fehlend | SPD S. 30 (30); Grüne S. 77, AfD S. 50 (33) | Grüne S. 85, Linke S. 57 (33) |
| Tokens | 434.869 (Ø 36.239 je Agent) | 332.347 (Ø 55.391 je Agent) |
| Laufzeit (Summe / längster Agent) | 346 s / 38 s | 303 s / 62 s |

- **24 % weniger Tokens bei gleicher Fundquote.** Der frühere Lauf mit 18 und 30 (+39 %) gilt nach Entscheidung der Betreiberin als nicht repräsentativ und dient nicht als Vergleich; Sammelaufträge sind seitdem Standard bei mehreren Themen. Ein Erfassungs-Agent hat einen großen festen Teil (Agentenbeschreibung, Auftrag, Inhaltsverzeichnis, Selbstprüfung); den spart der Sammelauftrag einmal je Programm.
- **Überschneidung der Trefferseiten erklärt den Unterschied nicht.** Anteil gemeinsamer Trefferseiten (bezogen auf das Thema mit weniger Seiten): 18+30 38 %, 30+33 41 % (mit Nachbarseite 63 % bzw. 68 %). Eine Prüfung „Sammelaufträge nur bei gemeinsamen Kapiteln“ würde beide Paare gleich behandeln und wurde deshalb nicht gebaut.
- **Wahrscheinlicher ist die Menge der Fundstellen.** Thema 18 hat in den sechs Programmen 137 Trefferseiten (Grüne 45), Thema 30 60, Thema 33 23. Bei kleinen Themen überwiegt der feste Teil, den das Bündeln spart; bei großen wächst der Kontext des ersten Themas im zweiten mit. Belegt ist das mit zwei Läufen nicht.
- **Wartezeit etwa gleich:** Ein Sammel-Agent braucht länger, dafür laufen bei höchstens sieben gleichzeitigen Agenten 6 Sammelaufträge in einer Welle, 12 Einzelaufträge in zwei.
- Fehlende Stellen unterscheiden sich zwischen den Läufen, aber nicht in der Zahl; das ist Streuung des Agenten wie im Test oben.

**Schluss:** **Einzelaufträge bleiben Standard.** `--sammel` kann sich bei kleinen Themen (wenige Fundstellen je Programm) lohnen; ob die Grenze bei der Zahl der Fundstellen liegt, zeigt erst ein weiterer Lauf mit zwei kleinen Themen und einem großen Thema.

## Vergleichslauf: Programmkatalog mit Haiku (`docs/plan-programmkatalog.md`)

**Frage:** Erfasst ein themenunabhängiger Katalog (Haiku, je Kapitelblock ein Agent) die schon erfassten Maßnahmen und Haltungs-Positionen vollständig – und was kostet er im Vergleich zur Erfassung je Thema?

**Aufbau (9. 10. 2026):** Bundesprogramme SPD (68 Seiten, 8 Blöcke) und AfD (177 Seiten, 9 Blöcke), zerlegt mit `katalog:absaetze` (30.000 Zeichen je Block), Agent `programm-katalog` (Haiku), Selbstprüfung `katalog:pruefen` (jeder Absatz erfasst, Satzverweise gültig, eigene Worte). Abgleich mit `katalog:vergleich` gegen die Bundes-Maßnahmen dieser Parteien in den Themen 6 und 27 und gegen alle Haltungs-Positionen. Gleich heißt: Aussage auf Seite ±1, die mindestens 60 % der Wörter des Zitats enthält.

**Ergebnis:**

| | SPD | AfD |
| --- | --- | --- |
| Aussagen im Katalog | 1.170 (zusage 626, ziel 369, lage 77, ablehnung 29, pruefauftrag 35, rueckblick 28, bedingung 6) | 1.099 (zusage 539, ziel 205, lage 199, ablehnung 122, bedingung 17, pruefauftrag 16, rueckblick 1) |
| Themen-Maßnahmen (6, 27) wiedergefunden | 17 von 17 (16 als Zusage/Ablehnung/Bedingung) | 15 von 15 (alle) |
| Haltungs-Positionen wiedergefunden | 19 von 19 | 20 von 20 |
| Tokens (laut Agentenabschluss) | 728.661 (8 Agenten; Block 3 als Test mit allgemeinem Agenten: 136.318) | 669.266 (9 Agenten) |
| Korrekturrunden | 0–1 je Block, alle „In Ordnung“ | 0–1 je Block |

- **Wiederfund vollständig.** Die eine SPD-Maßnahme ohne passende Art (T6/M6016, S. 55: „Grenzverfahren müssen hohe rechtliche Standards gewährleisten“) hat Haiku mit Zielen desselben Absatzes zu einer `ziel`-Aussage zusammengefasst. Folge: Kandidaten für Themen auch aus `ziel` ziehen, wenn ein Suchbegriff trifft (steht im Plan unter Risiken), und in der Agentenbeschreibung das Zusammenfassen nur für `lage` und `rueckblick` erlauben.
- **Stichprobe (Opus, 12 Aussagen):** Art und Kurzbeschreibung stimmen; Kurzbeschreibungen in eigenen Worten, ohne Parteinamen.
- **Schwäche der Zerlegung:** Ein Satz über einen Seitenwechsel wird in zwei Absätze geteilt (AfD Block 1/2). Für die Zuordnung harmlos, für Zitate über die Seitengrenze nachbessern.
- **Kosten:** Ø 78.851 Tokens je Block mit dem eigenen Agenten (ohne den Testblock), also rund 670.000 Tokens (Haiku) je Programm, einmalig. Die bisherige Erfassung kostet Ø 36.239 Tokens (Sonnet) je Thema und Programm (Vergleichstest oben). Der Katalog eines Programms entspricht damit in Tokens rund 18–19 Themen-Erfassungen; die Zuordnung je Thema (ein Haiku-Agent für alle Programme) kommt hinzu und ist noch nicht gemessen.

**Schluss:** Der Katalog findet alles, was die bisherige Erfassung gefunden hat. In Tokens lohnt er sich erst über viele künftige Themen, Forderungen und Haltungen – für die schon erfassten 37 Themen spart er nichts mehr. Vor dem Ausrollen auf alle Programme: Ausgabe verdichten (Zeilenformat statt JSON, `lage`/`rueckblick` nur unter `ohne`) und die Zuordnung je Thema messen.
