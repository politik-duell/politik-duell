## Daten aus den Arbeitsdateien (npm run entwurf:bericht)

**Modelle**:

- Modell der Erfassung: Claude Haiku 5.5 (Alias „haiku“ in der Agentendatei war in dieser Umgebung nicht verfügbar; ausdrücklich `claude-haiku-5.5`). Die Agenten hatten keine Shell, die Selbstprüfung (`entwurf:programm-pruefen`) führte die Koordination aus und gab die Meldungen weiter.
- Modell der Bewertung: Claude Sonnet 5.5 (Agent `blind-bewertung`; „opus“ war in dieser Umgebung nicht verfügbar; der Agent hatte weder Websuche noch Shell, daher ohne Quellenbelege, Forschungsstand aus Hintergrundwissen; `entwurf:antwort-pruefen` führte die Koordination aus)

**Übersicht je Programm** (erfasst → eingetragen; Rückfragen):

| Partei | Bund | BE | MV | ST |
| --- | --- | --- | --- | --- |
| Union | 4 → 2 | 9 → 7 | 5 → 4 | 5 → 3 |
| SPD | 4 → 3 | 11 → 9 | 7 → 6 | 4 → 4 |
| Grüne | 5 → 3 | 11 → 9 | 9 → 8 | 14 → 9 |
| FDP | 6 → 5 | 8 → 4 | 12 → 8 | 2 → 1 |
| AfD | 5 → 4 | 8 → 6 | 7 → 4 | 15 → 8 |
| Linke | 2 → 1 | 19 → 16 | 12 → 8 | 7 → 4 |
| BSW | 2 → 1 | 10 → 7 | 12 → 12 | 6 → 4 |

**Ohne Maßnahme zu einer Ursache:** **Bund** 2301 Union, Grüne, FDP, Linke, BSW; 2302 Union, Linke, BSW; 2303 FDP, AfD, Linke; 2304 SPD, BSW. **MV** 2302 Union. **ST** 2302 FDP; 2304 SPD, FDP.

**Nicht durchsucht:** keins

<details><summary>Meldungen der Erfassungs-Agenten (neue Bündel, Synonyme, Stand im PDF)</summary>

```
Union-Bund: neues Bündel 2304 „Vergleichsarbeiten und Lernstandserhebungen“ (S. 65)
Union-Bund: Synonym „Vergleichsarbeit“ → 2304 Prüfungen verbindlich ausbauen
Union-BE: neues Bündel 2301 „Ganztagsangebote ausbauen“ (S. 56)
Union-BE: neues Bündel 2301 „Vorschule stärken“ (S. 56)
Union-BE: neues Bündel 2302 „Gewaltstrategie für Schulen“ (S. 60)
Union-BE: neues Bündel 2301 „Schutz vor sozialem Druck in der Schule“ (S. 57)
Union-BE: neues Bündel 2301 „Schuldistanz-Teams ausbauen“ (S. 12)
Union-BE: Synonym „Fort- und Weiterbildung“ → 2302 Fortbildung und Handlungssicherheit der Lehrkräfte
Union-BE: Synonym „Konfliktlösung“ → 2301 Klassenklima und soziales Lernen stärken
Union-BE: Synonym „sozialer Druck“ → 2301 Schutz vor Gruppendruck
Union-MV: Synonym „Leistungsanforderungen“ → 2304 Leistungsdruck erhöhen
Union-MV: Synonym „Potenzialtest“ → 2304 Prüfungsdruck beim Gymnasialzugang
Union-MV: Synonym „psychotherapeutische Versorgung“ → 2304 Versorgung bei Angst und Depression
Union-ST: neues Bündel 2302 „Lehrkräfteausbildung“ (S. 25)
Union-ST: Synonym „Sozialverhalten“ → 2301 Klassenklima und soziales Lernen stärken
Union-ST: Synonym „Unterstützungskräfte“ → 2304 Belastung reduzieren
Union-ST: Synonym „mentale Gesundheit“ → 2304 Befähigung und Stressbewältigung
SPD-Bund: neues Bündel 2301 „Schutzkonzepte in Einrichtungen“ (S. 28)
SPD-Bund: neues Bündel 2301 „Demokratiebildung in Schulen“ (S. 40)
SPD-Bund: neues Bündel 2303 „Digitales Gewaltschutzgesetz“ (S. 44)
SPD-Bund: Synonym „Schutzkonzept“ → 2301 Klassenklima und soziales Lernen stärken
SPD-Bund: Synonym „Altersverifikation“ → 2303 Plattformen und Jugendschutz im Netz
SPD-BE: neues Bündel 2301 „Empathie-Wahlpflichtfach“ (S. 41)
SPD-BE: neues Bündel 2301 „Queere Bildung in Schulen und Jugendarbeit“ (S. 49)
SPD-BE: neues Bündel 2302 „Multiprofessionelle Teams an Schulen“ (S. 41)
SPD-BE: neues Bündel 2302 „Unabhängige Beschwerdestelle Schule“ (S. 41)
SPD-BE: neues Bündel 2304 „Lehrkräfte entlasten“ (S. 42)
SPD-BE: neues Bündel 2304 „Anlaufstellen für Jugendliche in seelischen Krisen“ (S. 38)
SPD-MV: neues Bündel 2301 „Konfliktlösung im Unterricht“ (S. 69)
SPD-MV: neues Bündel 2304 „Flexible Prüfungszeiträume“ (S. 70)
SPD-MV: neues Bündel 2304 „Entlastung von Lehrkräften“ (S. 68)
SPD-MV: Synonym „Mobbing“ → 2301 Prävention gegen Mobbing
SPD-MV: Synonym „Konfliktlösung“ → 2301 Konfliktkompetenz in der Schule stärken
SPD-MV: Synonym „Überlastung“ → 2304 Entlastung von Lehrkräften
SPD-MV: Synonym „Leistungsbewertung“ → 2304 lernförderliche Rückmeldungen
SPD-ST: neues Bündel 2301 „Schutzkonzepte gegen Gewalt und Diskriminierung“ (S. 32)
SPD-ST: Synonym „Beratungslehrkräfte“ → 2302 Unterstützung durch Fachkräfte und Beschwerdewege
SPD-ST: Synonym „Schulungen“ → 2302 Fortbildung und Handlungssicherheit der Lehrkräfte
Grune-Bund: Synonym „Mental Health Coach“ → 2304 Befähigung und Stressbewältigung
Grune-Bund: Synonym „Therapieplätze“ → 2304 Psychotherapie für Kinder und Jugendliche
Grune-BE: neues Bündel 2301 „Präventionsangebote gegen Ausgrenzung“ (S. 193)
Grune-BE: neues Bündel 2304 „Gemeinschaftsschulen verdoppeln“ (S. 220)
Grune-BE: neues Bündel 2304 „Übergang Grund- zu Oberschule reformieren“ (S. 188)
Grune-BE: neues Bündel 2304 „Prüfungsformate statt Ziffernoten“ (S. 187)
Grune-BE: neues Bündel 2304 „Lehrkräfte-Arbeitszeitmodell“ (S. 193)
Grune-BE: Synonym „Klassenräte“ → 2301 Klassenklima stärken (Klassenrat; Suche fand wegen Leerzeichen im Text nichts)
Grune-BE: Synonym „Hausaufgabenstress“ → 2304 Belastung reduzieren
Grune-BE: Synonym „Ziffernoten“ → 2304 Prüfungsdruck verringern
Grune-MV: Stand im PDF Stand: 16.07.2026
Grune-ST: neues Bündel 2301 „Schulklima im Schulgesetz verankern“ (S. 63)
Grune-ST: neues Bündel 2301 „Klassenräte und Schüler*innenparlamente“ (S. 64)
Grune-ST: neues Bündel 2301 „Gemeinsamer Unterricht statt Förderschulen“ (S. 59)
Grune-ST: neues Bündel 2304 „Versetzung und Sitzenbleiben“ (S. 60)
Grune-ST: neues Bündel 2304 „Schulzeit G9“ (S. 60)
Grune-ST: neues Bündel 2304 „Multiprofessionelle Teams zur Entlastung von Lehrkräften“ (S. 60)
Grune-ST: neues Bündel 2304 „Supervision für Lehrkräfte“ (S. 61)
Grune-ST: neues Bündel 2304 „Psychische Beratung und Krisenintervention für Jugendliche“ (S. 56)
Grune-ST: Synonym „ombudsstelle“ → 2302 unabhängige Meldestelle für Übergriffe an Schulen
Grune-ST: Synonym „sitzenbleiben“ → 2304 Wiederholen als freiwillige Entscheidung
Grune-ST: Synonym „benotung“ → 2304 Verringerung von Noten, dialogische Rückmeldung
Grune-ST: Synonym „achtsamkeit“ → 2304 Stressmanagement im Sportunterricht
FDP-BE: Synonym „Anti-Gewalt-Training“ → 2301 Prävention
FDP-BE: Synonym „Entbürokratisierung“ → 2304 Belastung reduzieren
FDP-BE: Synonym „G9“ → 2304 Belastung reduzieren
FDP-MV: neues Bündel 2302 „Standardisierte Verfahren und Schulaufsicht“ (S. 89)
FDP-MV: neues Bündel 2302 „Ansprechpartner bei Polizei und Rettungsdiensten“ (S. 89)
FDP-MV: neues Bündel 2302 „Schutz- und Notfallkonzepte verbindlich umsetzen“ (S. 89)
FDP-MV: neues Bündel 2301 „Bildungs- und Berufsangebote für gewaltauffällige Jugendliche“ (S. 89)
FDP-MV: neues Bündel 2304 „Prüfungen vor dem Wechsel aufs Gymnasium“ (S. 86)
FDP-MV: neues Bündel 2304 „Wahl des Bildungswegs am Gymnasium“ (S. 86)
FDP-MV: neues Bündel 2304 „Schulpsychologische Erstberatung“ (S. 101)
FDP-ST: Synonym „diskriminierung“ → 2301 Klassenklima und soziales Lernen stärken
FDP-ST: Stand im PDF Stand: 05.06.2026 (Beschluss 25.04.2026)
AfD-Bund: neues Bündel 2301 „Klassenstärke verringern“ (S. 159)
AfD-Bund: neues Bündel 2304 „Verbindliche Kriterien für den Gymnasium-Übergang“ (S. 160)
AfD-Bund: neues Bündel 2304 „Förderschulen erhalten“ (S. 161)
AfD-Bund: Synonym „disziplinarrecht“ → 2301 Konsequenzen durchsetzen
AfD-Bund: Synonym „bildungsstandard“ → 2304 anheben
AfD-BE: neues Bündel 2301 „Schulkleidung“ (S. 29)
AfD-BE: neues Bündel 2301 „Deutsch als Schulsprache“ (S. 28)
AfD-BE: neues Bündel 2302 „Inhalte der Lehrkräfteausbildung“ (S. 39)
AfD-BE: neues Bündel 2302 „Meldeverfahren bei Gewalt gegen Lehrkräfte“ (S. 31)
AfD-BE: neues Bündel 2304 „Leistungsselektion bei Schulplatzvergabe“ (S. 28)
AfD-BE: neues Bündel 2304 „Notengebung und Klassenwiederholung“ (S. 30)
AfD-BE: neues Bündel 2304 „Leistungsvergleiche bei Landesjugendspielen“ (S. 65)
AfD-BE: Synonym „Null-Toleranz“ → 2301 Regeln und Konsequenzen durchsetzen
AfD-BE: Synonym „Time-out“ → 2301 Regeln und Konsequenzen durchsetzen
AfD-MV: Synonym „schulverweis“ → 2302 Sanktionen durch Lehrkräfte
AfD-ST: neues Bündel 2301 „Symbole an Schulen“ (S. 77)
AfD-ST: neues Bündel 2301 „Wachdienst an Schulen“ (S. 88)
AfD-ST: neues Bündel 2301 „Sonderklassen für Flüchtlingskinder“ (S. 88)
AfD-ST: neues Bündel 2301 „Strafmündigkeit absenken“ (S. 124)
AfD-ST: neues Bündel 2302 „Lehrerausbildung an pädagogischer Hochschule“ (S. 84)
AfD-ST: neues Bündel 2302 „Neutralitätsgebot für Lehrkräfte“ (S. 77)
AfD-ST: neues Bündel 2304 „Bewertungsschlüssel anheben“ (S. 74)
AfD-ST: neues Bündel 2304 „Wettkampf und Benotung in der Grundschule“ (S. 82)
AfD-ST: neues Bündel 2304 „Verbindliche Schullaufbahnempfehlung“ (S. 73)
AfD-ST: neues Bündel 2304 „Leistungswettbewerbe mit Preisen“ (S. 75)
AfD-ST: neues Bündel 2304 „Mehr Sportunterricht“ (S. 81)
AfD-ST: Synonym „Bewertungsschlüssel“ → 2304 Leistungsanforderungen erhöhen
AfD-ST: Synonym „Wettkampf“ → 2304 Leistungsdruck erhöhen
Linke-Bund: Synonym „Hausaufgaben“ → 2304 Belastung reduzieren
Linke-MV: Synonym „Pausengestaltung“ → 2304 Belastung reduzieren
Linke-MV: Synonym „Leistungskontrolle“ → 2304 Belastung reduzieren
Linke-MV: Synonym „Benotung“ → 2304 Belastung reduzieren
Linke-MV: Stand im PDF Stand: Juni 2026 (Beschluss des Landesparteitags am 30. Mai 2026)
BSW-Bund: Synonym „social-media-gesetz“ → 2303 Plattformschutz für Kinder
BSW-BE: neues Bündel 2301 „Verbindliche Vorschulphase“ (S. 14)
BSW-BE: neues Bündel 2302 „Förderprogramm für Schulen in Brennpunktlagen“ (S. 14)
BSW-BE: neues Bündel 2302 „Friedensbildung als Pflichtinhalt der Lehrkräfteausbildung“ (S. 5)
BSW-BE: neues Bündel 2302 „Frühe Intervention bei Gewalt“ (S. 40)
BSW-BE: neues Bündel 2304 „Leistungsbewertung als Förderinstrument“ (S. 15)
BSW-BE: neues Bündel 2304 „Zentrales IT-System für Schulen“ (S. 16)
BSW-BE: Synonym „Anti-Gewalt“ → 2301 Klassenklima und soziales Lernen stärken
BSW-BE: Synonym „Entschlackung“ → 2304 Belastung reduzieren
BSW-MV: Synonym „Klassenleiterstunde“ → 2301 Klassenklima und soziales Lernen stärken
BSW-MV: Synonym „Klassennachmittage“ → 2301 Klassenklima und soziales Lernen stärken
BSW-MV: Synonym „Schultage nicht verlängern“ → 2304 Belastung reduzieren
BSW-MV: Synonym „Leistungsorientierung“ → 2304 Leistungs- und Prüfungsdruck
BSW-ST: neues Bündel 2302 „Lehramtsausbildung und Praxisbezug“ (S. 52)
BSW-ST: neues Bündel 2304 „Längeres gemeinsames Lernen“ (S. 45)
BSW-ST: neues Bündel 2304 „Sozialpsychiatrischer Dienst für Jugendliche“ (S. 59)
BSW-ST: neues Bündel 2304 „Arbeitszeiterfassung Lehrkräfte“ (S. 44)
BSW-ST: Synonym „Konfliktlösung“ → 2302 Unterstützung durch Fachkräfte und Beschwerdewege
```

</details>

<details><summary>Treffer je Programm und Ursache (Summe aller Begriffe; je Richtung in treffer.txt)</summary>

```
Programm        2301  2302  2303  2304
Union-Bund         0     4     2    13
Union-BE           4    18     –    15
Union-MV           1    21     –    17
Union-ST           3     8     –    14
SPD-Bund           3     4     1     7
SPD-BE             4    22     –    10
SPD-MV             4    27     –    26
SPD-ST             0    20     –     6
Grune-Bund         3    16     5    13
Grune-BE           7    38     –    37
Grune-MV           4    20     –     9
Grune-ST           4    30     –    12
FDP-Bund           0     4     1     4
FDP-BE             1     8     –     6
FDP-MV             5    23     –     9
FDP-ST             0     8     –    10
AfD-Bund           2     0     0     3
AfD-BE             3     2     –    14
AfD-MV             1     5     –     8
AfD-ST             3     8     –    10
Linke-Bund         3     6     1    10
Linke-BE          13    50     –    25
Linke-MV           4    15     –    11
Linke-ST          11    25     –    10
BSW-Bund           3     2     0     1
BSW-BE             7     8     –     7
BSW-MV             8    11     –    26
BSW-ST             6    25     –    25
```

</details>

**Offene Hinweise von entwurf:treffer** (erledigte haben `nicht_erfasst` mit Seiten): keine

<details><summary>Ursachen ohne Maßnahme mit gelesenen Fundstellen (nicht_erfasst)</summary>

```
Union-Bund 2301 (S. 63, 64, 65): Kindesschutz, Jugendhilfe und Kooperation Schule–Jugendhilfe nennen kein Mobbing, keine Gewalt unter Schülern und kein Klassenklima; keine Zusage zu Klassennormen oder Ausgrenzung.
Union-MV 2302 (S. 48, 50, 53, 56, 60): Schulsozialarbeit und Schulpsychologie nur ohne Bezug zu Mobbing, Gewalt oder Konflikt (R2); Fortbildung nur Medienbildung und MINT; kein Handeln von Lehrkräften bei Mobbing und kein Beschwerdeweg an Schulen. Anlaufstellen (S. 6, 24, 32, 73, 100) betreffen Wirtschaft, Verwaltung, Gesundheit und Barrierefreiheit.
Union-MV 2301 (S. 44, 45, 47, 53): Kita-Bildung und kleinere Klassen ohne Bezug zu Klassenklima oder Ausgrenzung; Smartphone-Regeln und Mediensensibilisierung sind Mediennutzung von Kindern (R2).
Union-MV 2304 (S. 47, 51, 56, 81): Entlastung der Lehrkräfte betrifft nicht den Druck auf Schülerinnen und Schüler; Bekenntnis zu Benotung und Vergleichsarbeiten ist Bestehendes ohne Handlung; Social-Media-Grenze (S. 81) gehört zu Mediennutzung.
SPD-Bund 2304 (S. 7, 26, 27, 30, 31, 46): Entlastung bei Steuern, Mindestlohn, Pflege und Familie; Resilienz im Kontext von Wirtschaft und Sicherheit; psychische Versorgung junger Menschen ohne Bezug zu Leistungs- oder Prüfungsdruck in der Schule.
SPD-BE 2301 (S. 41): Handyverbot an Grundschulen: Gesundheits- und Kinderschutz, kein Bezug zu Mobbing oder Klassenklima. Die Richtung Regeln und Konsequenzen hat keine Fundstelle mit Schulbezug.
SPD-ST 2304 (S. 15, 18, 19, 27, 28, 54): Gelesen: Schulkapitel S. 17-20, Fundstellen S. 15, 27, 28, 54. Entlastung betrifft Lehrkräfte (S. 18), Kita-Eltern, Jugendämter, Ärzte, Haushalte (Steuern). Leistungs- oder Prüfungsdruck von Schülern wird nicht genannt.
Grune-Bund 2301 (S. 76, 77, 84): Kapitel Für starke Schulen für alle Kinder (S. 76–78) und Kinder- und Jugendarbeit (S. 84) gelesen. Klassenklima und soziales Lernen nur als Ziel genannt (S. 76: Vielfalt und diskriminierungssensibles Lernen sollen gefördert werden); Kita-Mitbestimmung und Kinder- und Jugendarbeit ohne Schulbezug.
Grune-Bund 2302 (S. 77, 85): Schulsozialarbeit und Schulpsychologie (S. 77): Zitat nennt weder Mobbing, Gewalt noch Konflikte, daher nach R2 nicht 2302. Nummer gegen Kummer (S. 85): nur Forderung nach finanzieller Ausstattung ohne eigene Zusage.
Grune-Bund 2304 (S. 84, 91): Entlastung von Alleinerziehenden (S. 84) und Pflegebedürftigen (S. 91): kein Bezug zu Leistungs- oder Prüfungsdruck in der Schule.
Grune-BE 2301 (S. 187): Ziel „soziales Lernen … vermitteln“ ohne konkrete Handlung; gleichartig zum Klassenrat, nicht zusätzlich aufgenommen.
Grune-BE 2302 (S. 189, 190, 204): Schulsozialarbeit, Schulstationen und Schulpsychologie: nach R2 nur zu 2301/2302, wenn das Zitat Mobbing, Gewalt oder Konflikte nennt; die Stellen nennen das nicht.
Grune-BE 2302 (S. 188): Fortbildung und Beratung für inklusive Beschulung: gleiches Bündel wie die aufgenommene Fortbildung, dort nur eine Maßnahme; Bezug zu Mobbing oder Eingreifen fehlt.
Grune-BE 2302 (S. 190, 193): Feedback-Strukturen für Lehrkräfte bzw. Teams aus verschiedenen Professionen: kein Bezug zu Mobbing oder zum Eingreifen von Lehrkräften.
Grune-BE 2304 (S. 192): Schulstart später „werben“: Werbung in Gremien, keine Maßnahme gegen Schulbelastung im engeren Sinn; Biorhythmus-Begründung betrifft Lernen, nicht Druck.
FDP-Bund 2303 (S. 8, 9): Nur Medienkompetenz im Lehrplan und Schulfreiheit; Mediennutzung von Kindern ist nach Leitfaden R2 kein Cybermobbing-Thema. Kein Plattformschutz für Kinder.
FDP-ST 2302 (S. 28, 30, 37, 59): S. 28 Schulsozialarbeit/Schulpsychologie ohne Bezug zu Mobbing, Gewalt oder Konflikten (R2). S. 30 Seiteneinsteiger-Qualifizierung als Antwort auf den Lehrkräftemangel (R2). S. 37 Ansprechpersonen in der Polizei, S. 59 Anlaufstelle für Gesundheitsprävention: kein Schulbezug.
AfD-Bund 2303 (S. 161): Kapitel Bildung (S. 159–163) gelesen. Digitalfreie Grundschuljahre betreffen Mediennutzung von Kindern (R2), nichts gegen Cybermobbing oder Plattformschutz.
Linke-Bund 2302 (S. 39, 44): Schulpsychologie und Schulsozialarbeit (S. 39, 44): Zitat nennt kein Mobbing, Gewalt oder Konflikt (R2). Mehr-Pädagog*innen-System (S. 39) ohne Bezug zu Mobbing. Lehrkräfte-Schulung nur zu KI und Datenschutz (S. 39).
Linke-Bund 2303 (S. 39, 40): Medien- und Datenschutzkompetenz von Kindern ist Mediennutzung von Kindern (R2). Medienkompetenz in der beruflichen Ausbildung (S. 40) ohne Schulbezug zu Cybermobbing.
BSW-Bund 2301 (S. 24, 25): Sportvereins-Zuschuss ohne Schulbezug; Friedenspädagogik und Demokratiebildung ohne Bezug zu Ausgrenzung oder Klassenklima; Satz zu geborgenen Schutzräumen ist ein Ziel ohne Handlung.
BSW-Bund 2302 (S. 24, 25, 35): Entlastung der Lehrkräfte und Unterstützungsteams betrifft Arbeitsbedingungen und Lehrkräftemangel (R2); Zitate nennen kein Mobbing; Lehrerausbildung nur als „sollte“ ohne Zusage; Polizei-Fortbildung gehört nicht zur Schule.
BSW-Bund 2304 (S. 24, 25): Notengebung als Standard der Leistungsmessung setzt nicht an Leistungs- oder Prüfungsdruck an; keine Zusage zur Entlastung von Schülern.
BSW-ST 2301 (S. 12, 13, 15, 16, 43, 45, 73): Ausgrenzung nur politisch (Meinungsfreiheit, Förderstopp), soziales Lernen (S. 43) nur Ziel, Schülermitbestimmung (S. 73) ohne Klassenklima-Bezug; Smartphone-Verbot (S. 45) ist Mediennutzung, nach R2 eigenes Thema.
BSW-ST 2302 (S. 45, 46, 47, 72, 73): KI-Fortbildung (S. 45) nur Bedarfsaussage zu Prüfungsformaten, ohne Bezug zu Mobbing; Kita-Fortbildung (S. 46, 47) nicht Schule; Ombudsstellen (S. 72–73) betreffen Jugendhilfe, nicht Beschwerdewege an Schulen.
BSW-ST 2304 (S. 50, 51): Hochschul-Prüfungsdruck nur Lage und Prüfauftrag (Diplom ‚ernsthaft prüfen‘), keine Schulmaßnahme.
BSW-ST 2304 (S. 18, 20, 23, 27, 36, 38, 75, 76): Entlastung nur in Wirtschaft, Landwirtschaft, Berufsschule, Pflege, Steuern, Verwaltung, Justiz; kein Schülerdruck.
BSW-ST 2304 (S. 58, 80): Bündel Befähigung und Stressbewältigung: nur Lage zu psychischer Gesundheit Erwachsener bzw. Klimaresilienz in der Landwirtschaft; keine Zusage zur Stressbewältigung von Schülern.
```

</details>

**Vergleich nach Rückfragen** (`entwurf:zusammenfuehren`): keine Rückfrage, kein früherer Stand

Ohne Bündel an Ursachen mit Bündeln (0, nur zur Information – je Instrument zählt eine Maßnahme): keine

**Blindliste:** 221 Kennungen, Prüfsumme `19f4fcaaa69e6a5b3f8c6634652deeeed8dffbb82729d0faf2372fd5db48c4c1`. Entfallene Kennungen: keine.

**Verdächtige Reste:** keine

**Zuordnung** (`entwurf:bewertung-pruefen`):

```
Zuordnung: Union (Bund): 4 Maßnahmen, 4 Zuordnungen (davon 1 offen); nicht bestätigt 2 (M129 2302, M001 2304); offene bestätigt 0; verworfen 2
Zuordnung: Union (BE): 9 Maßnahmen, 12 Zuordnungen (davon 5 offen); nicht bestätigt 3 (M187 2301, M046 2301, M046 2304); offene bestätigt 2; verworfen 2
Zuordnung: Union (MV): 5 Maßnahmen, 5 Zuordnungen (davon 0 offen); nicht bestätigt 1 (M002 2304); offene bestätigt 0; verworfen 1
Zuordnung: Union (ST): 5 Maßnahmen, 5 Zuordnungen (davon 3 offen); nicht bestätigt 2 (M053 2302, M158 2304); offene bestätigt 2; verworfen 2
Zuordnung: SPD (Bund): 4 Maßnahmen, 5 Zuordnungen (davon 3 offen); nicht bestätigt 1 (M057 2301); offene bestätigt 2; verworfen 1
Zuordnung: SPD (BE): 11 Maßnahmen, 13 Zuordnungen (davon 3 offen); nicht bestätigt 2 (M100 2304, M135 2304); offene bestätigt 1; verworfen 2
Zuordnung: SPD (MV): 7 Maßnahmen, 8 Zuordnungen (davon 1 offen); nicht bestätigt 2 (M028 2304, M071 2304); offene bestätigt 1; verworfen 1
Zuordnung: SPD (ST): 4 Maßnahmen, 4 Zuordnungen (davon 0 offen); nicht bestätigt 0; offene bestätigt 0; verworfen 0
Zuordnung: Grüne (Bund): 5 Maßnahmen, 6 Zuordnungen (davon 3 offen); nicht bestätigt 3 (M054 2302, M039 2303, M073 2304); offene bestätigt 0; verworfen 2
Zuordnung: Grüne (BE): 11 Maßnahmen, 11 Zuordnungen (davon 3 offen); nicht bestätigt 2 (M177 2301, M140 2304); offene bestätigt 1; verworfen 2
Zuordnung: Grüne (MV): 9 Maßnahmen, 9 Zuordnungen (davon 7 offen); nicht bestätigt 1 (M128 2304); offene bestätigt 6; verworfen 1
Zuordnung: Grüne (ST): 14 Maßnahmen, 14 Zuordnungen (davon 6 offen); nicht bestätigt 5 (M137 2301, M132 2301, M172 2304, M142 2304, M012 2304); offene bestätigt 1; verworfen 5
Zuordnung: FDP (Bund): 6 Maßnahmen, 6 Zuordnungen (davon 4 offen); nicht bestätigt 1 (M196 2301); offene bestätigt 3; verworfen 1
Zuordnung: FDP (BE): 8 Maßnahmen, 8 Zuordnungen (davon 5 offen); nicht bestätigt 4 (M183 2304, M213 2304, M079 2302, M180 2302); offene bestätigt 2; verworfen 4
Zuordnung: FDP (MV): 12 Maßnahmen, 13 Zuordnungen (davon 8 offen); nicht bestätigt 4 (M010 2302, M111 2302, M051 2301, M192 2304); offene bestätigt 4; verworfen 4
Zuordnung: FDP (ST): 2 Maßnahmen, 2 Zuordnungen (davon 1 offen); nicht bestätigt 1 (M034 2304); offene bestätigt 0; verworfen 1
Zuordnung: AfD (Bund): 5 Maßnahmen, 6 Zuordnungen (davon 1 offen); nicht bestätigt 1 (M148 2304); offene bestätigt 1; verworfen 1
Zuordnung: AfD (BE): 8 Maßnahmen, 8 Zuordnungen (davon 6 offen); nicht bestätigt 2 (M041 2301, M043 2302); offene bestätigt 4; verworfen 2
Zuordnung: AfD (MV): 7 Maßnahmen, 10 Zuordnungen (davon 6 offen); nicht bestätigt 4 (M207 2301, M207 2302, M035 2304, M121 2301); offene bestätigt 2; verworfen 3
Zuordnung: AfD (ST): 15 Maßnahmen, 15 Zuordnungen (davon 9 offen); nicht bestätigt 7 (M171 2301, M211 2301, M219 2301, M138 2301, M123 2302, M194 2304, M037 2304); offene bestätigt 2; verworfen 7
Zuordnung: Linke (Bund): 2 Maßnahmen, 2 Zuordnungen (davon 1 offen); nicht bestätigt 1 (M097 2301); offene bestätigt 0; verworfen 1
Zuordnung: Linke (BE): 19 Maßnahmen, 22 Zuordnungen (davon 12 offen); nicht bestätigt 4 (M124 2304, M091 2302, M040 2301, M042 2301); offene bestätigt 8; verworfen 3
Zuordnung: Linke (MV): 12 Maßnahmen, 13 Zuordnungen (davon 7 offen); nicht bestätigt 4 (M031 2302, M173 2302, M154 2304, M193 2304); offene bestätigt 3; verworfen 4
Zuordnung: Linke (ST): 7 Maßnahmen, 7 Zuordnungen (davon 3 offen); nicht bestätigt 3 (M185 2301, M157 2304, M186 2304); offene bestätigt 1; verworfen 3
Zuordnung: BSW (Bund): 2 Maßnahmen, 2 Zuordnungen (davon 1 offen); nicht bestätigt 1 (M045 2301); offene bestätigt 0; verworfen 1
Zuordnung: BSW (BE): 10 Maßnahmen, 11 Zuordnungen (davon 4 offen); nicht bestätigt 3 (M188 2302, M143 2302, M068 2304); offene bestätigt 1; verworfen 3
Zuordnung: BSW (MV): 12 Maßnahmen, 16 Zuordnungen (davon 6 offen); nicht bestätigt 1 (M088 2304); offene bestätigt 5; verworfen 0
Zuordnung: BSW (ST): 6 Maßnahmen, 7 Zuordnungen (davon 2 offen); nicht bestätigt 2 (M066 2304, M218 2304); offene bestätigt 0; verworfen 2
```

**Hinweise zur Bewertung:** 

```
26 Bewertungen mit evidenz „belegt“ oder „gemischt“ ohne beleg_studie_url
M011: Bewertung sieht zusätzlich Ursache 2302 – zählt nicht (nur vorgeschlagene Ursachen); gleiche Stelle in anderen Programmen prüfen
M077: Bewertung sieht zusätzlich Ursache 2302 – zählt nicht (nur vorgeschlagene Ursachen); gleiche Stelle in anderen Programmen prüfen
M153: Bewertung sieht zusätzlich Ursache 2301 – zählt nicht (nur vorgeschlagene Ursachen); gleiche Stelle in anderen Programmen prüfen
M178: Bewertung sieht zusätzlich Ursache 2302 – zählt nicht (nur vorgeschlagene Ursachen); gleiche Stelle in anderen Programmen prüfen
M190: Bewertung sieht zusätzlich Ursache 2301 – zählt nicht (nur vorgeschlagene Ursachen); gleiche Stelle in anderen Programmen prüfen
Instrument I3: Maßnahmen mit unterschiedlichen Ursachen (M004 2304, M055 2304, M120 2304, M152 2301+2304, M167 2304, M189 2304, M203 2304) – gleicher Lösungsweg, gleiche Zuordnung?
Instrument I27: Maßnahmen mit unterschiedlichen Ursachen (M008 2301+2302, M067 2301, M070 2301, M078 2301, M099 2301, M155 2301) – gleicher Lösungsweg, gleiche Zuordnung?
Instrument I1: Maßnahmen mit unterschiedlichen Ursachen (M009 2301+2302, M029 2301+2302, M033 2301+2302, M048 2301+2302, M062 2301+2302+2304, M096 2301+2302, M153 2302, M199 2301+2302) – gleicher Lösungsweg, gleiche Zuordnung?
Instrument I30: Maßnahmen mit unterschiedlichen Ursachen (M011 2301, M080 2301+2302, M178 2301) – gleicher Lösungsweg, gleiche Zuordnung?
Instrument I31: Maßnahmen mit unterschiedlichen Ursachen (M023 2301+2302, M176 2301+2302, M209 2302, M217 2302) – gleicher Lösungsweg, gleiche Zuordnung?
Instrument I19: Maßnahmen mit unterschiedlichen Ursachen (M050 2302, M082 2301+2302, M103 2302, M130 2302, M147 2302, M162 2302, M163 2302) – gleicher Lösungsweg, gleiche Zuordnung?
Instrument I25: Maßnahmen mit unterschiedlichen Ursachen (M077 2301, M190 2302) – gleicher Lösungsweg, gleiche Zuordnung?
Instrument I23: Maßnahmen mit unterschiedlichen Ursachen (M081 2301+2302, M112 2302) – gleicher Lösungsweg, gleiche Zuordnung?
SPD (Bund): 1 von 3 Maßnahmen mehreren Ursachen zugeordnet (alle Programme: 10 %) – Mehrfachzuordnung prüfen
AfD (MV): 2 von 4 Maßnahmen mehreren Ursachen zugeordnet (alle Programme: 10 %) – Mehrfachzuordnung prüfen
```

**Punkte** (`npm run punkte`):

```
Mobbing und Druck in der Schule – Punkte je Ursache und für alle zusammen („–“ = noch nicht erfasst)

Bund     2301 2302 2303 2304   alle
Union       0    0    3    0      3
SPD         2    2  2.5    0    6.5
Grüne       0    2    2    2      6
FDP         0    2    0    1      3
AfD       1.5    1    0    0    2.5
Linke       0    0    0    1      1
BSW         0    0    1    0      1

BE       2301 2302 2303 2304   alle
Union       9  8.8    3    2   22.8
SPD         9    9  2.5    4   24.5
Grüne     7.5  4.5    2  6.6   20.6
FDP         6    4    0    3     13
AfD       4.5    2    0    0    6.5
Linke       9  6.8    0  6.9   22.7
BSW         9    9    1  4.5   23.5

MV       2301 2302 2303 2304   alle
Union       6    0    3    3     12
SPD         9    3  2.5    3   17.5
Grüne       6    7    2    5     20
FDP         9    9    0    4     22
AfD       5.5    6    0    0   11.5
Linke       9    6    0    9     24
BSW         9  5.5    1  6.3   21.8

ST       2301 2302 2303 2304   alle
Union       6    2    3    3     14
SPD       4.5  7.5  2.5    0   14.5
Grüne     7.5  7.5    2  6.6   23.6
FDP         3    0    0    0      3
AfD         3    4    0    2      9
Linke       7    3    0    1     11
BSW         4    5    1    3     13
```

<details><summary>Schwierige Einstufungen (Text der Bewertung unter dem JSON, wörtlich)</summary>

```
**Wichtiger Hinweis zur Arbeitsweise:** In dieser Sitzung standen mir nur die Werkzeuge view, create und edit zur Verfügung. WebSearch, WebFetch und die Selbstprüfung (Bash) waren nicht verfügbar. Ich habe deshalb keine Quelle geöffnet und keine `beleg_studie_url` angegeben; alle Werte zu `evidenz` beruhen auf meinem Hintergrundwissen und sind nicht anhand geöffneter Quellen verifiziert. Wirksamkeit 3 habe ich bewusst nirgends vergeben. Die Datei wurde nicht mit `entwurf:antwort-pruefen` geprüft. Die Prüfenden sollten die Evidenz-Einstufungen, vor allem „belegt“ bei I26 und I28, nachprüfen.

**Vorgeschlagene Ursachen, die ich nicht bestätige:**
- M002 (Psychotherapie-Versorgung): Außerschulische Gesundheitsversorgung lindert nur Folgen und setzt nicht an schulischem Druck an. Gleich behandelt: M001, M073, M012, M135, M192 (Hochschule).
- M021, M074, M110, M197, M208, M019, M150, M204: Bestätigt 2304, aber als Verschärfung der Anforderungen mit Wirksamkeit 0 (I15, I16). Das gilt auch für M013, M086, M094, M098, M141, M151, M169, M182 und M184.
- M028: Nur 2301, Gesundheitsvorsorge ist zu unbestimmt für 2304.
- M148: Förderschulen erhalten setzt an keiner Ursache an.

**Offene Ursachen:**
- Bestätigt: M008, M061, M065, M081 (2301 und 2302), M083, M088 (nur 2301), M089, M152, M166, M168 und M179.
- Allgemeine Lehrkräftefortbildung zählt als 2302 (Qualifikation): M014, M087, M145, M170, M209.
- Ohne Ursache: M010, M041, M042, M043, M046, M051, M097, M111, M121, M124, M132, M137, M138, M143, M173, M177, M180, M185, M187, M188, M196, M207, M211, M219 (Schulstruktur, Sicherheit, Politikthemen oder zu unbestimmt).
- Lehrkräfte-Entlastung und Arbeitszeit (M034, M035, M037, M066, M068, M071, M100, M128, M140, M142, M154, M157, M158, M172, M183, M186, M193, M213, M218) gehören nach Regel 2 zu „Schule“ und nicht zu 2304.
- M053, M129 (Medienkompetenz/Digitalpakt) und M039 haben keinen Mobbing-Bezug.
- M079 (Lehrkräftemangel) und M171 setzen an keiner Ursache an.
- M057 (politische Bildung) und M194 (Wettbewerbe) setzen an keiner Ursache an.

**Schwierig:**
- Leistungsverschärfungen: W0 mit Ursache 2304 statt leerer Ursachenliste, damit die fehlende Hilfe sichtbar bleibt.
- M146 (Förderende) analog W0.
- I6 (Notenabschaffung) mit gemischter Evidenz auf 2.
- Beschwerdestellen (I24) und Schutzkonzepte (I25) wegen fehlender Wirkungsstudien nur 1.
- Sanktionen (I30): Studien zu Null-Toleranz sind eher negativ, daher 1.
```

</details>

<details><summary>Rückfragen und Korrekturen (protokoll/rueckfragen.md, wörtlich)</summary>

```
# Rückfragen

Modell der Erfassung: Claude Haiku 5.5 (Alias „haiku“ in der Agentendatei war in dieser Umgebung nicht verfügbar; ausdrücklich `claude-haiku-5.5`). Die Agenten hatten keine Shell, die Selbstprüfung (`entwurf:programm-pruefen`) führte die Koordination aus und gab die Meldungen weiter.
Modell der Bewertung: Claude Sonnet 5.5 (Agent `blind-bewertung`; „opus“ war in dieser Umgebung nicht verfügbar; der Agent hatte weder Websuche noch Shell, daher ohne Quellenbelege, Forschungsstand aus Hintergrundwissen; `entwurf:antwort-pruefen` führte die Koordination aus)

| Programm bzw. Kennung | Anlass (Regel) | Ergebnis |
| --- | --- | --- |
| Union Bund, Union ST, BSW ST, AfD ST, AfD BE, FDP BE | Zitat nicht im Programm gefunden (Auslassung ohne „[…]“, Überschrift im Zitat) | Zitat korrigiert, Prüfung bestanden |
| Union Bund | Zahl „2.0“ in der Beschreibung, nicht im Zitat | Beschreibung angepasst |
| AfD ST, AfD MV | `ursachen_ids` fehlen (leer nur mit `ursachen_offen`) | Feld ergänzt |
| AfD ST | Zitat über Seitenwechsel 222/223 | Zitat auf eine Seite gekürzt |
| FDP MV | `hebel_nicht_gefunden` ohne Hebel-Checkliste im Auftrag | Feld entfernt |
| alle 28 Programme | Feld `buendel` gesetzt, obwohl die Leitfäden 23 und 25 keine Bündel haben (Richtungen der Trefferübersicht mit Bündeln verwechselt) | Feld `buendel` in allen Maßnahmen entfernt, Prüfung erneut bestanden |
```

</details>

Kosten je Agent (protokoll/kosten.md): keine

