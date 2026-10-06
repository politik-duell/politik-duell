# Tokenverbrauch der Erfassung (`/thema-erfassen`)

Beobachtet beim Durchgang für die Themen 27, 29, 30 und 33 (6. 10. 2026, Pull Request #76). Je Thema laufen 28 Erfassungs-Agenten (7 Parteien × Bund, BE, MV, ST) und ein Blind-Agent; zusammen rund 110 Agenten.

## Hebel, nach Wirkung geordnet

1. ~~**Programme ohne Treffer überspringen.**~~ **Verworfen.** Die Idee war, für Programme ohne Treffer keinen Auftrag zu erzeugen und `keine_massnahme` mit „keine Treffer in den Suchbegriffen“ zu setzen. Die Archive widerlegen das: In den Themen 27, 29, 30 und 33 hatten 11 Programme keinen Treffer, 6 davon lieferten trotzdem echte Maßnahmen (7, alle nach der Bewertung ohne Parteinamen eingetragen): 27 Union-ST, FDP-MV; 30 SPD-MV (2), SPD-ST, AfD-MV; 33 AfD-ST (`daten/protokolle/<ID>/2026-10-06-bund-land-BE-MV-ST/`, `treffer.txt` und `erfassung.json`). Null Treffer sind kein Beleg für „keine Maßnahme“; übersprungene Programme würden Parteien Punkte kosten.
2. **Kleineres Modell bei wenigen Treffern.** Alle Agenten laufen bisher auf derselben Stufe. Für Programme mit wenigen Treffern genügt vermutlich eine kleinere Stufe; bei vielen Treffern zählt die Zitattreue, dort bleibt die Stufe.
3. **Mehrere Themen in einem Auftrag je Programm.** Bei mehreren Themen liest derselbe Agent dasselbe Programm mehrfach. Ein Auftrag je Programm mit allen Themen bündelt das Lesen; dafür müssen Skript und Agent angepasst werden.
4. **Wiederholungen vermeiden.** Im Durchgang kosteten drei Fehlerbilder zusätzliche Agentenläufe:
   - Der Leitfaden hat keinen `buendel`-Schlüssel, die Agenten setzen trotzdem `buendel` (Richtungsnamen). `programm-pruefen` meldet das nur als Hinweis, `zusammenfuehren` lehnt es als Fehler ab (Thema 29).
   - `keine_massnahme` länger als 400 Zeichen. `eintragen` lehnt ab, `programm-pruefen` nicht (Thema 30, drei Programme).
   - Ein Zitat auf der angegebenen Seite nicht gefunden (Thema 29, Grüne BE).

   Abhilfe: Beide Regeln in `.claude/agents/programm-erfassung.md` aufnehmen und in `programm-pruefen` als Fehler melden. Bei Thema 33 genügte ein Zusatz im Prompt, und es gab keine Wiederholung.
5. **Kurze Ausgaben im Koordinationskontext.** Skriptausgaben mit `Select-Object -Last` und `Select-String` filtern. Die Kurzberichte der Agenten lassen sich nicht weiter kürzen, ohne die Prüfbarkeit zu verlieren.

## Reihenfolge

Punkt 1 entfällt (siehe oben). Größter Gewinn: Punkt 3 zusammen mit Punkt 4.
