# Tokenverbrauch der Erfassung (`/thema-erfassen`)

Beobachtet beim Durchgang für die Themen 27, 29, 30 und 33 (6. 10. 2026, Pull Request #76). Je Thema laufen 28 Erfassungs-Agenten (7 Parteien × Bund, BE, MV, ST) und ein Blind-Agent; zusammen rund 110 Agenten.

## Hebel, nach Wirkung geordnet

1. **Programme ohne Treffer überspringen.** Viele Programme haben in den Suchbegriffen null Treffer, vor allem Landesprogramme von AfD, FDP und Union. Ihre Agenten liefern fast immer „keine Maßnahme“. `entwurf:auftrag` könnte für solche Programme keinen Auftrag erzeugen und `keine_massnahme` mit „keine Treffer in den Suchbegriffen“ setzen. Das spart gut ein Viertel der Agenten. Risiko: Eine Maßnahme, die ohne die Suchbegriffe formuliert ist, würde übersehen. **Offen:** Reicht „keine Treffer“ als Beleg für „keine Maßnahme“? Das ist eine Methodenentscheidung (`docs/methode.md`). Der Vergleichstest vom 9. 10. 2026 (`.claude/skills/thema-erfassen/evals/README.md` → „vorsortierter Auszug“) spricht dagegen: Drei Zusagen der Grünen zu Thema 33 standen auf einer Seite ohne Treffer und wurden nur über das Inhaltsverzeichnis gefunden.
2. **Kleineres Modell bei wenigen Treffern.** Alle Agenten laufen bisher auf derselben Stufe. Für Programme mit wenigen Treffern genügt vermutlich eine kleinere Stufe; bei vielen Treffern zählt die Zitattreue, dort bleibt die Stufe.
3. **Mehrere Themen in einem Auftrag je Programm.** Bei mehreren Themen liest derselbe Agent dasselbe Programm mehrfach. Ein Auftrag je Programm mit allen Themen bündelt das Lesen; dafür müssen Skript und Agent angepasst werden. Umgesetzt als `entwurf:lauf auftraege --sammel`, Standard bei mehreren Themen: Mit den Themen 30 und 33 kostete es 24 % weniger bei gleicher Fundquote (`.claude/skills/thema-erfassen/evals/README.md` → „Sammelaufträge mit verwandten Themen“). Ein früherer Lauf mit Thema 18 (+39 %) gilt als nicht repräsentativ.
4. **Wiederholungen vermeiden.** Im Durchgang kosteten drei Fehlerbilder zusätzliche Agentenläufe:
   - Der Leitfaden hat keinen `buendel`-Schlüssel, die Agenten setzen trotzdem `buendel` (Richtungsnamen). `programm-pruefen` meldet das nur als Hinweis, `zusammenfuehren` lehnt es als Fehler ab (Thema 29).
   - `keine_massnahme` länger als 400 Zeichen. `eintragen` lehnt ab, `programm-pruefen` nicht (Thema 30, drei Programme).
   - Ein Zitat auf der angegebenen Seite nicht gefunden (Thema 29, Grüne BE).

   Umgesetzt (Oktober 2026): `programm-pruefen` meldet alle drei als Fehler, bevor der Agent abgibt – Bündel außerhalb des Leitfadens, Zitat nicht auf der Seite und `keine_massnahme` über 400 Zeichen; die Grenze steht auch in `.claude/agents/programm-erfassung.md`.
5. **Kurze Ausgaben im Koordinationskontext.** Skriptausgaben mit `Select-Object -Last` und `Select-String` filtern. Die Kurzberichte der Agenten lassen sich nicht weiter kürzen, ohne die Prüfbarkeit zu verlieren.

## Reihenfolge

Größter Gewinn: Punkt 1 zusammen mit Punkt 4. Punkt 1 braucht vorher die Methodenentscheidung.

## Messung 10. 10. 2026: Themen 21 und 31, Haltungen 36 und 37

Nur Bundesprogramme (beide Themen ohne Landesursachen), Themen als Sammelauftrag je Programm. Gezählt sind die Tokens der Agenten laut Abschlussmeldung (`subagent_tokens`), ohne die Koordination.

| Schritt | Agenten | Tokens |
| --- | --- | ---: |
| Themen: Erfassung (Sammelauftrag 21 + 31, je Programm) | 7 | 1 050 422 |
| Themen: Rückfrage „Suchbegriffgruppe als Bündel“ (Union, SPD, FDP, BSW) | 4 | 18 878 |
| Themen: Bewertung ohne Parteinamen (21: 83 Maßnahmen, 31: 39) | 2 | 165 095 |
| **Themen zusammen** | | **1 234 395** |
| Haltungen: Recherche Phase A (36, 37 mit einer Rückfrage) | 2 | 91 913 |
| Haltungen: Fundstellen (alle sieben Programme, beide Haltungen) | 7 | 136 534 |
| Haltungen: Einordnung ohne Parteinamen | 1 | 17 527 |
| **Haltungen zusammen** | | **245 974** |
| **Gesamt** | | **1 480 369** |

- Erfassung je Sammelauftrag 121 000 (Grüne) bis 210 000 Tokens (SPD, 37 Werkzeugaufrufe); im Mittel 150 000 für zwei Themen, also rund 75 000 je Programm und Thema.
- Ein Bundesthema kostete damit rund 617 000 Tokens, eine Haltung rund 123 000 (eine davon zurückgestellt).
- Die Rückfrage kostete nur 1,5 % der Erfassung. Ursache ist das bekannte Fehlerbild aus Punkt 4 (Namen von Suchbegriffgruppen als `buendel`): `programm-pruefen` ließ es im Sammelauftrag durch, erst `zusammenfuehren` lehnte ab.
