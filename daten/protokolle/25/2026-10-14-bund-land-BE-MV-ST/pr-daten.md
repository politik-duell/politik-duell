## Daten aus den Arbeitsdateien (npm run entwurf:bericht)

**Modelle**:

- Modell der Erfassung: Claude Haiku 5.5 (Alias „haiku“ in der Agentendatei war in dieser Umgebung nicht verfügbar; ausdrücklich `claude-haiku-5.5`). Die Agenten hatten keine Shell, die Selbstprüfung (`entwurf:programm-pruefen`) führte die Koordination aus und gab die Meldungen weiter.
- Modell der Bewertung: Claude Sonnet 5.5 (Agent `blind-bewertung`; „opus“ war in dieser Umgebung nicht verfügbar; der Agent hatte weder Websuche noch Shell, daher ohne Quellenbelege, Forschungsstand aus Hintergrundwissen; `entwurf:antwort-pruefen` führte die Koordination aus)

**Übersicht je Programm** (erfasst → eingetragen; Rückfragen):

| Partei | Bund | BE | MV | ST |
| --- | --- | --- | --- | --- |
| Union | 2 → 2 | 6 → 5 | 4 → 4 | 1 → 1 |
| SPD | 8 → 8 | 4 → 4 | 2 → 2 | 3 → 3 |
| Grüne | 9 → 8 | 4 → 4 | 5 → 5 | 5 → 5 |
| FDP | 4 → 3 | 9 → 6 | 1 → 1 | 1 → 1 |
| AfD | 3 → 3 | 1 → 1 | 2 → 1 | 3 → 1 |
| Linke | 6 → 5 | 12 → 11 | 6 → 6 | 2 → 2 |
| BSW | 4 → 3 | 2 → 1 | 1 → 1 | 1 → 0 |

**Ohne Maßnahme zu einer Ursache:** **Bund** 2502 BSW; 2503 Union, AfD, Linke, BSW. **BE** 2503 AfD, BSW. **MV** 2501 BSW; 2503 FDP, AfD. **ST** 2501 Union, FDP, BSW; 2503 AfD, Linke, BSW.

**Nicht durchsucht:** keins

<details><summary>Meldungen der Erfassungs-Agenten (neue Bündel, Synonyme, Stand im PDF)</summary>

```
Union-Bund: Synonym „Volksverhetzung“ → 2501 Strafverfolgung verschärfen
Union-BE: neues Bündel 2501 „Staatsanwaltschaft Hasskriminalität ausbauen“ (S. 22)
Union-BE: neues Bündel 2501 „Schutz-Anlaufstellen fortführen“ (S. 110)
Union-BE: neues Bündel 2503 „Zivilcourage-Kampagnen“ (S. 110)
Union-BE: Synonym „Hetze“ → 2501 Strafverfolgung von Hass
Union-BE: Synonym „Zivilcourage“ → 2503 Prävention und Gegenrede
Union-MV: Synonym „Hassbotschaften“ → 2503 Schutz von Kindern vor Hassbotschaften in sozialen Netzwerken
Union-MV: Synonym „Deepfakes“ → 2501 Strafrecht gegen digitale sexualisierte Gewalt
Union-ST: Synonym „medienpädagogisch“ → 2503 Prävention, Medienkompetenz und Gesprächskultur
Union-ST: Synonym „Meldemöglichkeiten“ → 2501 Meldewege und Hilfe für Betroffene ausbauen
SPD-Bund: neues Bündel 2501 „Ermittlungsbefugnisse: Log-in-Falle“ (S. 45)
SPD-Bund: neues Bündel 2501 „Beratungsangebote für Betroffene von Diskriminierung“ (S. 41)
SPD-Bund: neues Bündel 2501 „Datenschutz für Betroffene von Hassdelikten“ (S. 48)
SPD-Bund: neues Bündel 2501 „Strafrecht gegen Volksverhetzung“ (S. 48)
SPD-Bund: Synonym „Gewaltschutzgesetz“ → 2501 Meldewege und Hilfe für Betroffene ausbauen
SPD-Bund: Synonym „Log-in-Falle“ → 2501 Strafverfolgung von Hass und Bedrohung im Netz
SPD-BE: neues Bündel 2503 „Digitale Präventionsstrategie gegen Hassrede“ (S. 29)
SPD-MV: Synonym „Hetze in sozialen Medien“ → 2503 entschieden entgegentreten, Aufklärung
SPD-MV: Synonym „digitales Gewaltschutzgesetz“ → 2501 Strafverfolgung im Netz, Betroffenenrechte
SPD-ST: Synonym „digitale Beratungsangebote“ → 2501 Meldewege und Hilfe für Betroffene ausbauen
SPD-ST: Synonym „konsequent verfolgt“ → 2501 Strafverfolgung von Hass und Bedrohung im Netz
Grune-Bund: neues Bündel 2502 „Ausstattung der Medienanstalten“ (S. 115)
Grune-Bund: neues Bündel 2501 „Strafbarkeit digitaler Gewalt“ (S. 119)
Grune-Bund: neues Bündel 2501 „Erfassung von Hasskriminalität in der Polizeistatistik“ (S. 133)
Grune-Bund: neues Bündel 2503 „Strategie für den digitalen Raum“ (S. 116)
Grune-Bund: Synonym „Accountsperr“ → 2501 Strafverfolgung von Hass und Bedrohung im Netz
Grune-Bund: Synonym „Gewaltschutzgesetz“ → 2502 Plattformen verbindlich in die Pflicht nehmen
Grune-Bund: Synonym „Nacktbild“ → 2501 Strafbarkeit digitaler Gewalt
Grune-Bund: Synonym „Löschung“ → 2502 Plattformen verbindlich in die Pflicht nehmen
Grune-BE: neues Bündel 2501 „Beratungsangebote für Betroffene digitaler Gewalt“ (S. 133)
Grune-BE: Synonym „Online-Beratung“ → 2501 Beratung und Hilfe für Betroffene
Grune-BE: Synonym „Digital Streetwork“ → 2503 Prävention
Grune-MV: Stand im PDF Stand: 16.07.2026
Grune-ST: neues Bündel 2503 „Landes-Demokratiefördergesetz“ (S. 74)
Grune-ST: neues Bündel 2501 „Schutzkonzepte für bedrohte Engagierte“ (S. 75)
Grune-ST: Synonym „opferarbeit“ → 2501 Unterstützung und Beratung für Betroffene
Grune-ST: Synonym „anlaufstelle“ → 2501 spezialisierte Anlaufstellen für Betroffene
Grune-ST: Synonym „medienbildung“ → 2503 Unterricht zum kritischen Umgang mit sozialen Medien
FDP-BE: Synonym „psychische Gewalt im Internet“ → 2503 Prävention, Medienkompetenz und Gesprächskultur
FDP-BE: Synonym „Ehrdelikt“ → 2501 Strafverfolgung von Hass und Bedrohung im Netz
FDP-ST: Stand im PDF Stand: 05.06.2026 (Beschluss 25.04.2026)
AfD-Bund: Synonym „netzdg“ → 2502 Plattformpflichten abschaffen
AfD-Bund: Synonym „majestätsbeleidigung“ → 2501 Strafschutz abschaffen
AfD-MV: Synonym „anschwärzportal“ → 2501 Meldeportale ablehnen
AfD-MV: Synonym „politikerbeleidigung“ → 2501 Strafverfolgung von Beleidigung
AfD-ST: Synonym „Meinungsstraftatbestände“ → 2501 abbauen
AfD-ST: Synonym „algorithmische Meinungskontrolle“ → 2503 Transparenz und Einschränkung
Linke-Bund: Synonym „Hetze“ → 2501 Meldewege und Hilfe für Betroffene ausbauen
Linke-MV: Synonym „Medienbildung“ → 2503 Prävention, Medienkompetenz
Linke-MV: Synonym „Opferschutz“ → 2501 Meldewege und Hilfe für Betroffene
Linke-MV: Stand im PDF Stand: Juni 2026 (Beschluss des Landesparteitags am 30. Mai 2026)
BSW-Bund: neues Bündel 2501 „Strafnorm streichen“ (S. 35)
BSW-Bund: neues Bündel 2501 „Weisungsunabhängigkeit der Staatsanwaltschaft“ (S. 40)
BSW-Bund: Synonym „politikerbeleidigung“ → 2501 Verfolgung abbauen
BSW-BE: neues Bündel 2503 „Fortbildung zu Cybermobbing für Fachkräfte und Polizei“ (S. 40)
BSW-BE: Synonym „Meldeportal“ → 2501 Meldewege und Hilfe für Betroffene ausbauen
BSW-MV: Synonym „Debattenkultur“ → 2503 Prävention, Medienkompetenz und Gesprächskultur
```

</details>

<details><summary>Treffer je Programm und Ursache (Summe aller Begriffe; je Richtung in treffer.txt)</summary>

```
Programm        2501  2502  2503
Union-Bund         4     1     1
Union-BE           7     –     1
Union-MV           9     –     3
Union-ST           1     –     5
SPD-Bund          11     1     2
SPD-BE             9     –     4
SPD-MV             2     –    15
SPD-ST             7     –     2
Grune-Bund         8     0     6
Grune-BE          24     –    11
Grune-MV           6     –     7
Grune-ST           3     –     4
FDP-Bund           3     3     1
FDP-BE             8     –     3
FDP-MV            11     –     2
FDP-ST             1     –     3
AfD-Bund           6     1     0
AfD-BE             8     –     0
AfD-MV             6     –     0
AfD-ST             6     –     1
Linke-Bund         5     2     3
Linke-BE          19     –    10
Linke-MV           7     –     6
Linke-ST          13     –     5
BSW-Bund          10     1     2
BSW-BE             0     –     0
BSW-MV             0     –     5
BSW-ST             2     –     2
```

</details>

**Offene Hinweise von entwurf:treffer** (erledigte haben `nicht_erfasst` mit Seiten): keine

<details><summary>Ursachen ohne Maßnahme mit gelesenen Fundstellen (nicht_erfasst)</summary>

```
Union-Bund 2503 (S. 40, 41, 45): Anonymität und IP-Adressen-Speicherung betreffen Strafverfolgung allgemein, nicht Moderation, Gesprächskultur oder Prävention. Demokratie-leben- und Extremismus-Stellen ohne Bezug zu Anfeindungen im Netz.
Union-MV 2501 (S. 6, 27, 30, 33, 34, 35, 42): Stellen zu Staatsanwaltschaften, Cybercrime, Kinderpornografie und allgemeinem Opferschutz (S. 6, 27, 30, 33, 34, 35) ohne Bezug zu Hass oder Anfeindung (R2). Mandatsträger gegen Anfeindungen (S. 42) betreffen Offline-Ehrenamt. Keine Meldewege und keine Beratung für Betroffene gefunden.
Union-MV 2503 (S. 7, 52, 53, 81): Klarnamenpflicht und Altersgrenze 16 (S. 7) doppelt zu S. 38, dort konkreter. Pflichtbestandteil gegen Hass (S. 52) ist Bekenntnis ohne Handlung im Netz. Mediensensibilisierung (S. 53) und Social-Media-Einschränkung (S. 81) ohne Hass-Bezug.
Union-ST 2501 (S. 35, 58): S. 35 Kinder- und Jugendmedienschutz (Alterskennzeichnung, Meldemöglichkeiten, Schutzmechanismen) betrifft die Mediennutzung von Kindern, nach R2 eigenes Thema. S. 58 Opferschutz und ambulante Beratungsstellen betreffen häusliche und allgemeine Gewalt, nicht Hass im Netz.
SPD-Bund 2503 (S. 40, 49): Bekenntnis gegen Hass und Hetze (S. 40) und Medienkompetenz gegen Desinformation für alle Altersgruppen (S. 49): kein Bezug zu beleidigenden Beiträgen oder Anfeindungen.
SPD-BE 2501 (S. 19, 20, 32): Keine Meldestelle für Hass im Netz. Mietpreis-Check-App und Mietenaufsicht (S. 19–20) betreffen überhöhte Mieten, nicht Hass im Netz. S. 32 Cybergrooming ist sexualisierte Gewalt, kein Hasskommentar.
SPD-BE 2503 (S. 31, 41, 47, 48, 55): Kein Plattform-Bezug. Digitales Community Policing (S. 31) ohne Bezug zu Hass. Empathie-Wahlpflichtfach (S. 41) ohne Online- oder Hassbezug. Großstadtanonymität (S. 47) meint offline. Algorithmen (S. 48) betreffen Verwaltungssysteme ohne Hassbezug. Medienaufsicht und Medienkompetenz der Landesmedienanstalt (S. 55) ohne Hassbezug.
Grune-BE 2501 (S. 160): Opferberatungsstellen gegen rechtsextreme Bedrohungen: gleicher Hebel (Beratung) wie S. 133, dort eine Maßnahme; hier nicht zusätzlich.
Grune-BE 2501 (S. 133): Fortbildungsprogramme für Polizei, Justiz und Schulen zu digitaler Gewalt: Hebel Schulung, keine Beratung oder Meldung.
Grune-BE 2501 (S. 159, 233): Plattformpflichten (Löschen, DSA) gehören nach dem Leitfaden zu 2502, nicht zulässig für dieses Landesprogramm.
Grune-BE 2501 (S. 172): Landesdemokratiefördergesetz: Desinformation und Hass werden nur als Lage genannt, die Maßnahme hat keinen Bezug zu Hass im Netz (R2).
Grune-BE 2503 (S. 103, 115, 190, 197): Medienkompetenz-Angebote, Medienteams und Curricula: gleicher Hebel wie S. 159, dort eine Maßnahme; hier nicht zusätzlich.
Grune-BE 2503 (S. 162, 190): Algorithmen: S. 162 nur Kritik, S. 190 Verständnis als Bildungsziel; kein Instrument für Moderation oder Gestaltung der Plattformen.
Grune-BE 2503 (S. 233): Strategie gegen Desinformation (S. 233): Lagebeschreibung und Ziel ohne konkrete Handlung zu Gesprächs- oder Moderationsdesign.
FDP-Bund 2503 (S. 24, 25, 27): Leitbild demokratische Streitkultur auch im Netz (S. 25) ist ein Ziel ohne konkrete Handlung. Recht auf Verschlüsselung und Quick-Freeze (S. 24) betreffen Datenschutz, nicht Hass.
FDP-MV 2501 (S. 53, 137, 138, 139): Keine Meldestelle, Beratung oder Hilfe für Betroffene von Hass im Netz. S. 53 betrifft häusliche und sexualisierte Gewalt. S. 137–139 nur allgemeine Justiz-Personal- und Digitalisierungszusagen ohne Bezug zu Hass oder Bedrohung im Netz.
FDP-MV 2503 (S. 87, 95, 98, 136): Medienbildung und Medienkompetenz ohne Bezug zu Hass oder Anfeindung (R2); S. 95 Finanzbildung, S. 136 Verschlüsselung. Cybermobbing unter Schülern gehört zu Thema 23.
FDP-ST 2501 (S. 45, 46, 47): Digitalisierung der Justiz und Staatsanwaltschaften (S. 45), Opferschutz und Opferhilfefonds allgemein (S. 46), Polizeistellen und Sicherheitspartnerschaften (S. 47): kein Bezug zu Hass, Bedrohung oder Anfeindung im Netz (R2). Kein Meldeweg, keine Beratung für Betroffene.
AfD-Bund 2501 (S. 118, 133, 139): Meldewege und Hilfe für Betroffene: nichts gefunden. S. 133 nur Bekenntnis (Verfolgung und Löschung von Hate Speech als Verstoß), keine Handlungszusage. S. 118 und 139 Staatsanwaltschaft ohne Bezug zu Hass im Netz.
AfD-Bund 2503 (S. 49, 133): Kapitel Digitalisierung (S. 46–50), Innere Sicherheit (S. 116–125), Meinungsfreiheit (S. 131–139) gelesen. Keine Prävention, Medienkompetenz oder Moderationsdesign gegen Hass. S. 49 Desinformation ohne Bezug.
AfD-BE 2503 (S. 90, 30, 39): S. 90: Blockadeverbot für staatliche Stellen in sozialen Netzwerken, allgemeine Netzpolitik zur Meinungsfreiheit ohne Bezug zu Anfeindung. S. 30: Smartphone-Verbot (Mediennutzung von Kindern, R2). S. 39: digitale Medienbildung ohne Hass-Bezug.
AfD-MV 2503 (S. 43, 44, 46, 47, 53): Kapitel Freiheitsland (S. 44–46) und Fundstellen gelesen; nichts zu Medienkompetenz, Gesprächskultur oder Moderation. Demokratieklausel und Förderstopp (S. 46–47) betreffen Förderpolitik gegen Extremismus, nicht Prävention von Hass im Netz.
Linke-Bund 2503 (S. 40, 43, 48, 51, 57): Politische Bildung, Medienkompetenz, Kritik an Tech-Konzernen (S. 40, 51, 57) ohne Bezug zu Anfeindung. Anonymität im Internet (S. 43) steht im Tierhandel-Zusammenhang. Algorithmen (S. 48) in Sicherheitspolitik. Keine Moderations- oder Gesprächsdesign-Zusage.
Linke-ST 2503 (S. 28, 74, 144): Medienkompetenz, Algorithmenverständnis und Medien-Offensive sind allgemeine Medienbildung ohne Bezug zu Hass oder Anfeindung (R2); KI-Einsatz in der Sozialverwaltung ist keine Plattform-Moderation. Keine Moderations- oder Gesprächsdesign-Zusage gefunden.
BSW-Bund 2502 (S. 24, 39, 40, 43): Kritik am Digital Services Act ohne eigene Handlungszusage; Forderung nach klaren Begriffen betrifft Begriffsdefinition, keine Plattformpflicht; Social-Media-Altersgrenze (S. 24) ist allgemeine Netzpolitik ohne Hass-Bezug (R2); Datenschutzforderung (S. 43) ohne Hass-Bezug.
BSW-Bund 2503 (S. 24, 41): Algorithmen nur als Problem beschrieben; keine Zusage zu Moderation, Anonymität, Klarnamen, Empfehlungssystemen oder Transparenz.
BSW-MV 2501 (S. 12, 47, 48, 61, 72, 74, 91, 92): Gelesen: Medienerziehung und Medienkompetenz (Mediennutzung von Kindern, R2); Schutz vor häuslicher und sexualisierter Gewalt (S. 72); Vorgehen gegen Rassismus ohne Netzbezug (S. 74); KI und Datensammlung (S. 91–92). Kein Meldeweg, keine Beratung oder Hilfe für Betroffene von Hass im Netz, keine Strafverfolgung von Online-Hass.
BSW-ST 2501 (S. 14, 71): Opferberatung nur für gewaltbereiten Extremismus, kein Netzbezug (R2: Extremismus); Staatsanwaltschaft: Weisungsrecht ohne Bezug zu Hass im Netz.
BSW-ST 2503 (S. 12, 13, 45, 67, 70): Dialog und Debattenkultur nur als Ziele ohne Handlung (S. 12, 13); Smartphone-Verbot an Schulen gehört nach R2 zu Mobbing in der Schule (S. 45); Algorithmen in Staatssoftware und KI-Prüfungen ohne Plattformbezug (S. 45, 67); Aufklärung zu Betrugsmaschen gehört nach R2 zu Sicherheit (S. 70).
```

</details>

**Vergleich nach Rückfragen** (`entwurf:zusammenfuehren`): keine Rückfrage, kein früherer Stand

Ohne Bündel an Ursachen mit Bündeln (0, nur zur Information – je Instrument zählt eine Maßnahme): keine

**Blindliste:** 111 Kennungen, Prüfsumme `5b82314bc0cf298bc45ab94606a8a0c2961a2a93564d7408c66239fb23484d22`. Entfallene Kennungen: keine.

**Verdächtige Reste:** keine

**Zuordnung** (`entwurf:bewertung-pruefen`):

```
Zuordnung: Union (Bund): 2 Maßnahmen, 3 Zuordnungen (davon 2 offen); nicht bestätigt 1 (M029 2502); offene bestätigt 1; verworfen 0
Zuordnung: Union (BE): 6 Maßnahmen, 6 Zuordnungen (davon 3 offen); nicht bestätigt 1 (M093 2503); offene bestätigt 2; verworfen 1
Zuordnung: Union (MV): 4 Maßnahmen, 4 Zuordnungen (davon 0 offen); nicht bestätigt 0; offene bestätigt 0; verworfen 0
Zuordnung: Union (ST): 1 Maßnahmen, 1 Zuordnungen (davon 1 offen); nicht bestätigt 0; offene bestätigt 1; verworfen 0
Zuordnung: SPD (Bund): 8 Maßnahmen, 10 Zuordnungen (davon 5 offen); nicht bestätigt 2 (M088 2502, M087 2502); offene bestätigt 3; verworfen 0
Zuordnung: SPD (BE): 4 Maßnahmen, 4 Zuordnungen (davon 0 offen); nicht bestätigt 0; offene bestätigt 0; verworfen 0
Zuordnung: SPD (MV): 2 Maßnahmen, 2 Zuordnungen (davon 0 offen); nicht bestätigt 0; offene bestätigt 0; verworfen 0
Zuordnung: SPD (ST): 3 Maßnahmen, 3 Zuordnungen (davon 0 offen); nicht bestätigt 0; offene bestätigt 0; verworfen 0
Zuordnung: Grüne (Bund): 9 Maßnahmen, 10 Zuordnungen (davon 5 offen); nicht bestätigt 1 (M006 2503); offene bestätigt 4; verworfen 1
Zuordnung: Grüne (BE): 4 Maßnahmen, 4 Zuordnungen (davon 1 offen); nicht bestätigt 0; offene bestätigt 1; verworfen 0
Zuordnung: Grüne (MV): 5 Maßnahmen, 5 Zuordnungen (davon 4 offen); nicht bestätigt 0; offene bestätigt 4; verworfen 0
Zuordnung: Grüne (ST): 5 Maßnahmen, 5 Zuordnungen (davon 3 offen); nicht bestätigt 0; offene bestätigt 3; verworfen 0
Zuordnung: FDP (Bund): 4 Maßnahmen, 4 Zuordnungen (davon 4 offen); nicht bestätigt 1 (M046 2502); offene bestätigt 3; verworfen 1
Zuordnung: FDP (BE): 9 Maßnahmen, 9 Zuordnungen (davon 7 offen); nicht bestätigt 3 (M083 2501, M068 2501, M025 2503); offene bestätigt 4; verworfen 3
Zuordnung: FDP (MV): 1 Maßnahmen, 1 Zuordnungen (davon 1 offen); nicht bestätigt 0; offene bestätigt 1; verworfen 0
Zuordnung: FDP (ST): 1 Maßnahmen, 1 Zuordnungen (davon 1 offen); nicht bestätigt 0; offene bestätigt 1; verworfen 0
Zuordnung: AfD (Bund): 3 Maßnahmen, 3 Zuordnungen (davon 0 offen); nicht bestätigt 0; offene bestätigt 0; verworfen 0
Zuordnung: AfD (BE): 1 Maßnahmen, 1 Zuordnungen (davon 0 offen); nicht bestätigt 0; offene bestätigt 0; verworfen 0
Zuordnung: AfD (MV): 2 Maßnahmen, 2 Zuordnungen (davon 2 offen); nicht bestätigt 1 (M059 2501); offene bestätigt 1; verworfen 1
Zuordnung: AfD (ST): 3 Maßnahmen, 3 Zuordnungen (davon 3 offen); nicht bestätigt 2 (M069 2503, M100 2503); offene bestätigt 1; verworfen 2
Zuordnung: Linke (Bund): 6 Maßnahmen, 6 Zuordnungen (davon 4 offen); nicht bestätigt 1 (M103 2501); offene bestätigt 3; verworfen 1
Zuordnung: Linke (BE): 12 Maßnahmen, 12 Zuordnungen (davon 9 offen); nicht bestätigt 1 (M056 2503); offene bestätigt 8; verworfen 1
Zuordnung: Linke (MV): 6 Maßnahmen, 6 Zuordnungen (davon 4 offen); nicht bestätigt 0; offene bestätigt 4; verworfen 0
Zuordnung: Linke (ST): 2 Maßnahmen, 2 Zuordnungen (davon 0 offen); nicht bestätigt 0; offene bestätigt 0; verworfen 0
Zuordnung: BSW (Bund): 4 Maßnahmen, 4 Zuordnungen (davon 1 offen); nicht bestätigt 1 (M095 2501); offene bestätigt 0; verworfen 1
Zuordnung: BSW (BE): 2 Maßnahmen, 3 Zuordnungen (davon 2 offen); nicht bestätigt 2 (M110 2501, M110 2503); offene bestätigt 0; verworfen 1
Zuordnung: BSW (MV): 1 Maßnahmen, 1 Zuordnungen (davon 1 offen); nicht bestätigt 0; offene bestätigt 1; verworfen 0
Zuordnung: BSW (ST): 1 Maßnahmen, 1 Zuordnungen (davon 1 offen); nicht bestätigt 1 (M053 2501); offene bestätigt 0; verworfen 1
```

**Hinweise zur Bewertung:** 

```
29 von 36 Bewertungen mit evidenz „offen“ – Forschungsstand recherchieren lassen
7 Bewertungen mit evidenz „belegt“ oder „gemischt“ ohne beleg_studie_url
M090: Bewertung sieht zusätzlich Ursache 2502 – zählt nicht (nur vorgeschlagene Ursachen); gleiche Stelle in anderen Programmen prüfen
Instrument I7: Maßnahmen mit unterschiedlichen Ursachen (M035 2501+2502, M045 2501) – gleicher Lösungsweg, gleiche Zuordnung?
```

**Punkte** (`npm run punkte`):

```
Hass und Anfeindungen im Internet – Punkte je Ursache und für alle zusammen („–“ = noch nicht erfasst)

Bund     2501 2502 2503   alle
Union       2    4    0      6
SPD         9    4    1     14
Grüne     6.8    5  3.5   15.3
FDP         2    0    1      3
AfD         6    0    0      6
Linke       3  4.5    0    7.5
BSW         0    0    0      0

BE       2501 2502 2503   alle
Union       9    4    2     15
SPD         6    4    4     14
Grüne       9    5    3     17
FDP         8    0    3     11
AfD         0    0    0      0
Linke       9  4.5    4   17.5
BSW         0    0    0      0

MV       2501 2502 2503   alle
Union     2.5    4  1.5      8
SPD         2    4    3      9
Grüne       9    5    4     18
FDP         0    0    0      0
AfD         0    0    0      0
Linke       9  4.5  4.3   17.8
BSW         0    0    3      3

ST       2501 2502 2503   alle
Union       0    4    2      6
SPD       7.5    4    3   14.5
Grüne       9    5    4     18
FDP         0    0    2      2
AfD         0    0    0      0
Linke       6  4.5    0   10.5
BSW         0    0    0      0
```

<details><summary>Schwierige Einstufungen (Text der Bewertung unter dem JSON, wörtlich)</summary>

```
Hinweise zur Bewertung:

- Recherche und Selbstprüfung: In dieser Sitzung standen mir nur Lese- und Schreibwerkzeuge zur Verfügung, keine Websuche und kein Bash. Ich konnte keine Quellen öffnen und die Selbstprüfung (entwurf:antwort-pruefen) nicht ausführen. Alle Evidenzangaben beruhen auf meinem Hintergrundwissen, nicht auf geöffneten Quellen. Deshalb gibt es keine beleg_studie_url und keine Wirksamkeit 3. Bitte Evidenz und Prüfsumme/Struktur nachträglich prüfen lassen.
- Nicht bestätigte vorgeschlagene Ursachen: keine; alle Vorschläge der Erfassung (ursachen_ids) wurden übernommen, nur M110 (Cybermobbing unter Jugendlichen, Thema Mobbing in der Schule) ohne Ursache.
- Offene Ursachen: Bei fast allen Maßnahmen zu Beratung, Anlaufstellen, Meldestellen, Verfolgung, Schulung, Statistik und Strafrecht 2501 gesetzt; bei Prävention, Kampagnen, Bildung und Förderung 2503; bei Plattformpflichten 2502. M035: 2502 und 2501; M090: 2502 und 2503; M088 nur 2501 (2502 nicht, da Zitat die Strafverfolgung nennt).
- Ohne Ursache (kein Bezug zu Hass im Netz oder nur Haltung ohne Maßnahme): M006 (Bibliotheken ohne Bezug zu Hass), M025 und M100 (Antisemitismus/Rassismus-Bildung in Schulen ohne Netzbezug), M046, M053, M059 (reine Ablehnung ohne Maßnahme), M056 (extremistische Inhalte, Thema Radikalisierung), M068 (Ausstattung Ansprechpartner ohne Hass-Bezug), M069 (Kampagne gegen Löschregeln, setzt nicht an Hass an), M083 (transnationale Repression), M093 (Zivilcourage im öffentlichen Raum), M095 (allgemeine Justizreform), M103 (unbestimmte Zusage), M110 (Cybermobbing unter Jugendlichen).
- Schwierig: Maßnahmen, die Meldestellen, Verfolgung oder Plattformpflichten abbauen (I12, I14–I17, M043, M060, M079, M081) bekamen Wirksamkeit 0, obwohl sie an einer Ursache ansetzen, weil sie in die entgegengesetzte Richtung wirken. Bitte prüfen, ob die Prüfenden sie lieber ohne Ursache führen wollen. Ebenso schwer: Erfassungs-/Statistikmaßnahmen (I5, I22), die nicht netzspezifisch sind, und die Umsetzbarkeit von Landesmaßnahmen, die Bundesrecht voraussetzen (jeweils 1).
```

</details>

<details><summary>Rückfragen und Korrekturen (protokoll/rueckfragen.md, wörtlich)</summary>

```
# Rückfragen

Modell der Erfassung: Claude Haiku 5.5 (Alias „haiku“ in der Agentendatei war in dieser Umgebung nicht verfügbar; ausdrücklich `claude-haiku-5.5`). Die Agenten hatten keine Shell, die Selbstprüfung (`entwurf:programm-pruefen`) führte die Koordination aus und gab die Meldungen weiter.
Modell der Bewertung: Claude Sonnet 5.5 (Agent `blind-bewertung`; „opus“ war in dieser Umgebung nicht verfügbar; der Agent hatte weder Websuche noch Shell, daher ohne Quellenbelege, Forschungsstand aus Hintergrundwissen; `entwurf:antwort-pruefen` führte die Koordination aus)

| Programm bzw. Kennung | Anlass (Regel) | Ergebnis |
| --- | --- | --- |
| AfD ST | `ursachen_ids` fehlen; Zitat über Seitenwechsel 222/223 | Feld ergänzt, Zitat gekürzt |
| AfD MV | `ursachen_ids` fehlen (leer nur mit `ursachen_offen`) | Feld ergänzt |
| FDP MV | `hebel_nicht_gefunden` ohne Hebel-Checkliste im Auftrag | Feld entfernt |
| alle 28 Programme | Feld `buendel` gesetzt, obwohl die Leitfäden 23 und 25 keine Bündel haben | Feld `buendel` in allen Maßnahmen entfernt, Prüfung erneut bestanden |
```

</details>

Kosten je Agent (protokoll/kosten.md): keine

