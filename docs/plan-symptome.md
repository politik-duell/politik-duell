# Plan: Symptomgruppen und Geltungsbereich – eine Folge, mehrere Ursachen

Stand: 18. 10. 2026 · Umgesetzt: Code, Datenformat, Muster (Arzttermine, Miete, gegengelesen) und Entwurf für alle übrigen Themen (`ki_entwurf`, Gegenlesen offen).

## Anlass

Testpartie in der geschlossenen Testphase (18. 10. 2026; SPD mit Berlin gegen Union ohne Land; fünf alltägliche Probleme, die Vorauswahl jeweils mit „Stimmt so“ bestätigt). Typ und Thema stimmten fünfmal, die Ursachen nur dreimal:

| Eingabe | Vorausgewählt | Was falsch lief |
| --- | --- | --- |
| „Seit vier Monaten kein Termin beim **Hautarzt**, die Praxen nehmen niemanden neu.“ | 101 „keine **Hausarzt**praxis nimmt neue Patienten“ | Das Symptom passt, die Lage nicht. Der Beleg der KI („Praxen … nehmen keine neuen Patienten“) lässt das unterscheidende Wort weg; die Wortprüfung im Code findet nur Gemeinsames. |
| „Miete +15 %, keine größere bezahlbare Wohnung für uns mit zwei Kindern“ | 204 (Bestandsmiete) und 205 (Nachfrage) | Für „keine bezahlbare Wohnung“ kommen 201, 202, 203, 205 und 206 gleichermaßen in Frage. Die KI griff eine heraus – und die Wahl entschied die Runde (205: SPD 2 : Union 6,5). |

Zwei grundlegende Fehler, nicht zwei Einzelfälle:

1. **Symptom statt Lage.** Ursachen bündeln eine Lage (Hausarztpraxis, laufender Vertrag) mit einem Erlebnis (keine Aufnahme, steigende Miete). Die Zuordnung prüfte nur das Erlebnis. Dasselbe Muster steht schon in `docs/plan-zuordnung.md` als ungelöst: Rente trotz 40 Arbeitsjahren → „kleine Rente, weil wenig verdient“; „Bahnhof unsicher“ → zusätzlich „Straftaten bleiben ohne Folgen“.
2. **Eine Folge, viele Gründe.** Menschen schildern Folgen, der Katalog beschreibt Gründe. Wo mehrere Gründe dieselbe Folge haben, musste die KI raten – und weil die Parteien je Ursache sehr verschieden abschneiden, entschied der Zufall. Messung (unten): Die KI unterscheidet „nennt die Folge“ und „nennt einen ihrer Gründe“ nicht verlässlich, auch mit ausdrücklicher Regel.

Dazu: Die Person bestätigte den Alltagssatz (`alltag`), angezeigt und gewertet wurde `beschreibung` – bei 205 mit einer Deutung („getragen vor allem von Zuwanderung“), die sie nie gesehen hatte.

## Entscheidungen

| Frage | Entscheidung |
| --- | --- |
| Was zählt, wenn jemand nur die Folge nennt? | **Alle Ursachen, die zu dieser Folge beitragen.** Die Person kann nicht wissen, welche „ihre“ ist; wirksam hilft, wer bei möglichst vielen gute Lösungen hat. Beide Parteien werden an denselben Ursachen gemessen – höhere Zahlen, kein Vorteil einer Seite. |
| Wer legt fest, welche Ursachen zu einer Folge gehören? | **Der Katalog** (`symptome` je Thema), nicht die KI im Einzelfall. Sonst hinge das Ergebnis wieder von ihrer Tagesform ab. |
| Und wenn jemand einen Grund der Gruppe ausdrücklich nennt? | **Trotzdem die ganze Gruppe.** Die KI trennt das nicht verlässlich (Messung); eine feste Regel ist vorhersehbar. Die Person kann einzelne Ursachen abwählen. |
| Höchstens drei Ursachen? | Gilt weiter für einzelne Ursachen. Die einer Gruppe zählen nicht mit – der Grund der Grenze („wer zum Thema die meisten Maßnahmen hat“) trifft auf kuratierte, belegte Gruppen nicht zu. |
| Gewichte (Hauptursache 1, Nebenursache ½)? | **Vorerst nicht.** Ohne neue Recherche müssten Zahlen erfunden werden. Später je Gruppe nachtragen, wo eine Quelle eine Hauptursache belegt; bis dahin zählen alle gleich. |
| Aufwand für die Daten? | **Ohne Erfassungs-Skill.** Gruppen und Geltungsbereich sind Angaben zu bestehenden, belegten Ursachen – keine neuen Ursachen, Maßnahmen oder Bewertungen. Entwurf mit `ki_entwurf: true` (zählt nur in der Testphase), Gegenlesen im Pull Request. |
| Lage passt nicht (Hautarzt/Hausarzt)? | Ursachen bekommen optional `gilt_fuer`. Schritt 2 meldet je Ursache, ob sie nur **teilweise** passt, mit einem Satz, was abweicht. Dann keine Vorauswahl; der Satz steht über der Auswahl. Mit „Nichts davon passt“ landet der Fall als Lücke `ursache_fehlt` in der Admin-Ansicht – so meldet sich eine fehlende Ursache (Facharztmangel) von selbst. |

## Umsetzung

| Stelle | Änderung |
| --- | --- |
| `daten/themen/*.json` | `symptome` je Thema, `gilt_fuer` je Ursache (Format: `daten/README.md`); Prüfung in `src/data/katalog.ts` |
| Migration `20261018000000_symptome.sql`, `scripts/seed-sql.ts` | `themen.symptome jsonb`, `ursachen.gilt_fuer text` |
| `_shared/ki.ts` → `ursachenPrompt` | Ursachen mit „gilt nur für“, Folgen mit ihren Ursachen; Antwort zusätzlich `teilweise` und `symptom` |
| `_shared/ki.ts` → `ordneEin` | Gruppe, wenn die KI die Folge oder eine ihrer Ursachen nennt (nicht bei unsicherem Thema); dann alle Ursachen der Gruppe, weitere nur bei `sicher`. Ohne Gruppe: teilweise Passendes verhindert die Vorauswahl, `abweichung` geht an die App. |
| `_shared/ki.ts` → `pruefeAnfrage`, `antwortAusAuswahl`; `typen.ts` → `auswahlErlaubt` | Auswahl mit `symptom`: Ursachen der Gruppe zählen nicht zu `MAX_AUSWAHL`; Kurzfassung mit dem Satz der Gruppe |
| `analyse/index.ts` | Gruppen mit `ki_entwurf` nur in der Testphase |
| `UrsachenAuswahl.tsx`, `Runde.tsx` | Gruppe vorausgewählt mit Hinweis „sie zählen alle“; Satz zur Abweichung; Kurzfassung der KI nur bei unverändert bestätigtem Vorschlag |
| `Aufloesung.tsx` | Überschrift je Ursache = bestätigter Alltagssatz, Befund mit Quelle im Detail; „Trägt bei zu: …“ bei Gruppen; Bundesland nur bei Ursachen mit `ebene: land`; Belege je Seite einmal |

## Messung (18. 10. 2026)

`npm run ki:testset`, je ein Lauf, `mistral-medium-latest`. Neu im Testset: `sym-hautarzt-wartezeit`, `sym-zahnarzt-teilweise`, `sym-miete-familie`, `sym-miete-nur-folge`; angepasst an die Gruppenregel: `arzt-facharzt`, `miete-sozialwohnung`, `miete-suche`, `tp-wohnung-warten`.

| | Prompt vorher | Prompt nachher |
| --- | --- | --- |
| alle 72 Fälle | 50/72 | 57/72 |
| die 8 Fälle mit Symptomgruppe oder Teilweise | 0/8 | 8/8 |
| die übrigen 64 Fälle | 49/64 | 49/64 |

- Die übrigen Fälle bleiben gleich (einzelne Wechsel liegen im Rauschen eines Laufs; vor allem die Wortprüfung der Belege, bekannt aus `docs/plan-zuordnung.md`).
- Nach dem Eintrag aller Themen (19 Gruppen in 16 weiteren Themen, drei neue Testfälle): **61/75**. Die drei neuen Fälle mit Folge stimmen; alle 14 Fehler sind bekannte aus `docs/plan-zuordnung.md` (Wortprüfung der Belege, Themenwahl), keiner betrifft Gruppen.
- Erster Versuch mit der Regel „nennt sie einen Grund der Gruppe, nur diesen“: 5/11 in den Fällen zu Arzt und Miete. Die KI setzte bei der Sozialwohnung zusätzlich die Folge, bei der Familie statt der Folge eine einzelne Gruppenursache (205) – genau der Fehler aus der Testpartie. Deshalb gilt jetzt immer die ganze Gruppe (11/11).

## Entwurf für die übrigen Themen

Regel aus dem Entwurf (steht in `daten/README.md`): Weil eine erkannte Ursache die ganze Gruppe auslöst, muss **jede** Ursache die Folge selbst nach sich ziehen. Danach verworfen: Behördengänge („dauert ewig“ – unverständliche Formulare sind keine Wartezeit), Pflege „finde keinen Platz“ (Personalmangel zeigt sich auch als Zeitmangel), Abwanderung (keine Ausbildungsstelle heißt nicht wegziehen), Sexismus (Hausarbeit heißt nicht beruflich festhängen), Sucht (Tabak und Alkohol gemischt), Mediennutzung (Unsicherheit der Eltern ist kein Festhängen am Handy), Innenstadt (ungepflegte Innenstadt heißt nicht Schließungen); bei Kultur ohne Lärm (den erleben Anwohnende). Ohne Gruppe bleiben auch Themen, deren Ursachen verschiedene Erlebnisse beschreiben oder enge Lagen voraussetzen (Schule, Rente, Bus und Bahn, Sicherheit, Hitze, Diskriminierung, Jugend, Armut, Einsamkeit, Studium, Führerschein, Internet).

## Offen

1. **Gegenlesen** der Gruppen in den übrigen Themen; danach `ki_entwurf` entfernen.
2. **Facharztmangel** als eigene Ursache bei Arzttermine (Fachärzte allgemein, nicht nur Kassen/Privat): neue Ursache mit Recherche und Suche in allen Programmen – über `/thema-erfassen` (nachträgliche Ursache), nicht hier.
3. **Blinde Zweitbewertung** der Themen dieser Testpartie (Arzttermine, Miete, Pflege, Schule, Bus und Bahn): fast alle Werte sind „KI-Entwurf, nicht blind“; eigener Lauf über die Erfassungs-Skills.
4. **Gewichte** je Gruppe, wo eine Quelle eine Hauptursache belegt.
5. `ki_entwurf` der Gruppen nach dem Gegenlesen entfernen.
