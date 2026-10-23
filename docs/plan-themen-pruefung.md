# Plan: Themenbeschreibungen prüfen (November 2026)

Stand 23. 10. 2026, Branch `fix/themen-zuordnung`. Die Beschreibungen von 14 Themen (1, 5, 10, 12, 14, 16, 21, 23, 24, 25, 27, 28, 29, 35) sind geschärft, damit Schritt 1 der Einordnung (`themenPrompt`) Alltagssätze dem richtigen Thema zuordnet. Geprüft ist das noch nicht: Das Mistral-Kontingent des Monats war durch Testläufe aufgebraucht.

## Vorher klären

- **Eigener Testschlüssel** mit eigenem Limit, getrennt vom Konto des Spiels. Ohne ihn läuft der Test nicht.
- Jeder Lauf ist auf 100 KI-Aufrufe begrenzt (`scripts/ki-testset/grenze.ts`). Mehr nur nach Absprache mit `--max-anfragen`.

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

Ein Lauf, eine Runde, nur Schritt 1 (`--nur-thema`):

```sh
MISTRAL_API_KEY=<Testschlüssel> npm run ki:testset -- --alltag --nur-thema --runden 1 --json ergebnis.json --nur \
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

## Danach, je nach Entscheidung

- Gruppe B: Für jedes Paar festlegen, welches Thema die Ursache führt. Dann Ursache oder Beschreibung anpassen und nur diese Sätze erneut testen.
- Gruppe C: Neue Fassungen der `alltag`-Sätze freigeben und nur diese Sätze erneut testen.
- Ziel von Thema 42 (spricht noch vom Bruttolohn): eigene Freigabe, eigener PR.
- `scripts/ki-testset/varianten.json` (567 KI-Fassungen in eigenen Worten): erst durchsehen, dann höchstens themenweise testen (`--themen`), nie alle auf einmal.
