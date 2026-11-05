# Plan: Themenbeschreibungen prüfen (November 2026)

Stand 23. 10. 2026, Branch `fix/themen-zuordnung`. Die Beschreibungen von 14 Themen (1, 5, 10, 12, 14, 16, 21, 23, 24, 25, 27, 28, 29, 35) sind geschärft, damit Schritt 1 der Einordnung (`themenPrompt`) Alltagssätze dem richtigen Thema zuordnet. Geprüft ist das noch nicht: Das Mistral-Kontingent des Monats war durch Testläufe aufgebraucht. Stand 5. 11. 2026: Es gibt keinen Testschlüssel, siehe Regeln.

## Regeln für KI-Aufrufe

Einen eigenen Testschlüssel gibt es nicht. Die Tests laufen über denselben Mistral-Schlüssel und dasselbe Kontingent wie das Spiel. Deshalb gilt:

- **Jeder Lauf nur nach ausdrücklicher Zustimmung der Betreiberin**, mit vorher genannter Zahl der Aufrufe.
- **Höchstens 100 Aufrufe je Lauf** (`scripts/ki-testset/grenze.ts`), nie `--max-anfragen` darüber. Keine Volläufe (`--alltag` ohne `--nur`, mehrere Runden über alle Fälle).
- Zwischen zwei Läufen das Ergebnis auswerten. Nachprüfen nur gezielt einzelne Sätze, nicht den ganzen Satz neu.

## Ausgangslage

Lauf vom 22. 10. 2026 mit `npm run ki:testset -- --alltag --runden 3`, `mistral-medium-latest`, Beschreibungen von `main`: 211 Alltagssätze, je 3 Runden. Typ und Thema stimmten in 529 von 633 Antworten.

- **33 Sätze 3 von 3 falsch** (Typ oder Thema), aufgeteilt in drei Gruppen:
  - **A – Überschneidung zweier Themen:** Die neuen Beschreibungen sollen diese Gruppe beheben. 102 → 14, 505 → 14, 909 → 19, 1204 → 9, 1603 → 3, 2002 → 21, 2103 → 14, 2303 → 25, 2403 → 5, 2902 → 21, 3502 → 31, 4303 → 9.
  - **B – „Wer besitzt das Thema“:** Hier braucht es eine Entscheidung, die Beschreibungen allein helfen nur zum Teil.
    - Löhne (Thema 5 oder 11): 503 → 11, 507 → 11, 1105 → 21, 506 → 21.
    - Pflegepersonal (Thema 10 oder 27): 1001 → 27.
    - Arbeitsbelastung (Thema 27 oder 40): 2702, 2705, symptom-27-1 → 40.
    - Vereinbarkeit (Thema 28 oder 40): 2802, 2803 → 40.
  - **C – als Forderung oder Haltung erkannt:** Das liegt am Wortlaut des `alltag`-Satzes, nicht an der Beschreibung. Den Satz zu ändern braucht eine Freigabe. Betroffen: 504, 604, 605, symptom-6-1, symptom-22-2, 2904, 3802, 4202, 4203, 4503, 4504.
- **4 Sätze schwankend** (1 oder 2 von 3 falsch): 404, 2202, 3604, 4403.
- **46 übrige Sätze der 14 geänderten Themen** waren 3 von 3 richtig. Sie dienen als Kontrolle: Die neuen Beschreibungen dürfen sie nicht verschlechtern.

## Testlauf (83 Aufrufe)

Ein Lauf, eine Runde, nur Schritt 1 (`--nur-thema`), mit small wie im Live-Spiel. Die Ausgangslage stammt von medium: Was hier falsch ist, kann an der Beschreibung oder am Modell liegen. Kippt ein Kontrollsatz, ihn einzeln mit medium nachprüfen (1 Aufruf je Satz).

```sh
MISTRAL_MODEL=mistral-small-latest npm run ki:testset -- --alltag --nur-thema --runden 1 --json ergebnis.json --nur \
alltag-102,alltag-503,alltag-504,alltag-505,alltag-506,alltag-507,alltag-604,alltag-605,symptom-6-1,alltag-909,alltag-1001,alltag-1105,alltag-1204,alltag-1603,alltag-2002,alltag-2103,symptom-22-2,alltag-2303,alltag-2403,alltag-2702,alltag-2705,symptom-27-1,alltag-2802,alltag-2803,alltag-2902,alltag-2904,alltag-3502,alltag-3802,alltag-4202,alltag-4203,alltag-4303,alltag-4503,alltag-4504,\
alltag-404,alltag-2202,alltag-3604,alltag-4403,\
alltag-101,alltag-103,symptom-1-1,alltag-501,alltag-502,symptom-5-1,alltag-1002,alltag-1003,alltag-1004,alltag-1005,symptom-10-1,alltag-1201,alltag-1202,alltag-1203,symptom-12-1,alltag-1401,alltag-1402,alltag-1403,alltag-1404,alltag-1601,alltag-1602,alltag-1604,symptom-16-1,alltag-2101,alltag-2102,alltag-2301,alltag-2302,alltag-2304,symptom-23-1,alltag-2401,alltag-2402,alltag-2404,alltag-2501,alltag-2502,alltag-2503,symptom-25-1,alltag-2701,alltag-2703,alltag-2704,alltag-2706,alltag-2801,alltag-2804,alltag-2901,alltag-2903,alltag-2905,alltag-3501
```

Gruppe C wird mitgetestet, aber dort ist keine Änderung zu erwarten.

## Bewertung

- **Übernehmen**, wenn alle drei Punkte erfüllt sind:
  - Gruppe A ist überwiegend richtig, mindestens 8 von 12.
  - Keiner der 46 Kontrollsätze ist falsch.
  - Die Schwankenden sind nicht schlechter geworden.
- **Mit Vorsicht deuten**: Bei einer Runde kann ein einzelner Fehler Zufall sein. Einen Kontrollsatz, der kippt, mit `--nur <id> --runden 3` gezielt nachprüfen. Das kostet 3 Aufrufe je Satz.
- Ist eine Beschreibung schuld an einem neuen Fehler, die Beschreibung dieses einen Themas zurücknehmen statt den ganzen Branch.

## Vergleich: genügt `mistral-small-latest`?

`mistral-medium-latest` ist seit dem 11. 10. 2026 Standard. Damals gab es nur einen Schritt und einen langen Prompt, und small war deutlich schlechter: 73 % ganz richtig gegen 91 % (46 Fälle × 3). Seitdem hat sich die Einordnung geändert:
- zwei Schritte mit kürzeren Prompts,
- Vorauswahl nur, wenn die KI sicher ist,
- Bestätigung durch die Person.

Mit dieser Fassung ist small nie gemessen worden. Vom 23. 10. bis 5. 11. 2026 lief das Live-Spiel mit small (Secret `MISTRAL_MODEL` in Supabase); nach dem Vergleich ist das Secret gelöscht, es gilt wieder medium. Ausgewählt wird das Modell mit `MISTRAL_MODEL=mistral-small-latest` vor dem Befehl, so wie in der Edge Function.

1. **Thema:** steckt im Testlauf oben (small, 83 Aufrufe).
   - Ordnet small mehr als 5 der 46 Kontrollsätze falsch zu, die medium am 22. 10. richtig hatte, ist small für Schritt 1 fraglich. Nachprüfen nur diese Sätze mit medium.
2. **Ganzer Ablauf:** die 77 festen Fälle mit beiden Schritten, small, eine Runde, in **zwei Läufen** zu je höchstens 100 Aufrufen (`--nur` mit den ersten bzw. letzten Fall-IDs aus `scripts/ki-testset/faelle.json`), jeder mit eigener Zustimmung.
   - Vergleichswert ist medium vom 18. 10. 2026 mit 61 von 75 richtig (`docs/plan-symptome.md`). Der Prompt hat sich seitdem geändert (Rollen ausgesetzt, Gespräch), der Vergleich ist also nur grob.
   - **Wichtigste Kennzahl:** falsch vorausgewählte Ursachen (`zu_viel`, `falsch`). Small darf hier nicht schlechter sein als medium.

**Entscheidung:**
- **small für beide Schritte**, wenn small in beiden Läufen höchstens knapp unter medium liegt und keine zusätzlichen falschen Ursachen vorauswählt. Das Secret `MISTRAL_MODEL` bleibt dann wie es ist.
- **small nur für Schritt 2**, wenn Schritt 1 schlechter ist, die Ursachen aber stimmen. Das braucht eine kleine Codeänderung: ein eigenes Modell für Schritt 2.
- **sonst medium:** das Secret `MISTRAL_MODEL` in Supabase löschen (Edge Functions → Secrets).

Zusammen rund 240 Aufrufe in drei Läufen, verteilt über den Monat, plus wenige Einzelprüfungen mit medium.

## Ergebnis 5. 11. 2026 (small, 3 Läufe wie freigegeben)

| | small (Branch) | medium (Vergleich) |
| --- | --- | --- |
| Testlauf Thema: Kontrollsätze | 39/46 | 46/46 (22. 10., 3 Runden, `main`) |
| Testlauf Thema: Gruppe A | 7/12 | 0/12 |
| Testlauf Thema: Gruppe B / C / schwankend | 4/10 · 0/11 · 3/4 | 0/10 · 0/11 · – |
| Ganzer Ablauf, feste Fälle | 53/77 (69 %) | 61/75 (81 %, 18. 10.) |
| davon Thema falsch | 11 | – |
| zu viele / zu wenige / falsche Ursachen | 7 / 2 / 0 | – |

- Kontrollsätze, die small falsch hat: 1604, 2404, 2704, 2801, 2901, 2903, 2905. Ob das am Modell oder an den neuen Beschreibungen liegt, trennt dieser Lauf nicht; Einzelprüfungen mit medium waren nicht freigegeben.
- Nachprüfung mit medium (7 Aufrufe, freigegeben): 2404, 2801, 2901, 2903 richtig – das lag an small. Falsch auch mit medium: 1604 → 3, 2704 → 5, 2905 → 1. Ursache sind die neuen Beschreibungen (Thema 1 „Wege durchs Gesundheitssystem“ zieht den Therapieplatz an, Thema 27 ohne „Bezahlung“, Thema 16 ohne Mieter). Nachgebessert und mit medium erneut geprüft (3 Aufrufe, freigegeben): 3/3 richtig.
- Nach der Durchsicht (Thema 21 mit „geringem Lohn“): Alltagssätze der Themen 11 und 21 mit medium (8 Aufrufe, freigegeben) 7/8; 1105 („verdiene so wenig …“) landet weiter in 21, wie schon am 22. 10. – offene Frage aus Gruppe B.
- small liegt im ganzen Ablauf deutlich unter medium, vor allem bei der Themenwahl. Falsche Ursachen wählt es nicht.
- Rohdaten nicht im Repository (Antworten der KI); Zählung aus `ki:testset --json`.

## Danach, je nach Entscheidung

- Gruppe B: Für jedes Paar festlegen, welches Thema die Ursache führt. Dann Ursache oder Beschreibung anpassen und nur diese Sätze erneut testen.
- Gruppe C: Neue Fassungen der `alltag`-Sätze freigeben und nur diese Sätze erneut testen.
- Ziel von Thema 42 (spricht noch vom Bruttolohn): eigene Freigabe, eigener PR.
- `scripts/ki-testset/varianten.json` (567 KI-Fassungen in eigenen Worten): erst durchsehen, dann höchstens themenweise testen (`--themen`), nie alle auf einmal.
