# Rückfragen

Modell der Erfassung: Claude Haiku 5.5 (Alias „haiku“ in der Agentendatei war in dieser Umgebung nicht verfügbar; ausdrücklich `claude-haiku-5.5`). Die Agenten hatten keine Shell, die Selbstprüfung (`entwurf:programm-pruefen`) führte die Koordination aus und gab die Meldungen weiter.
Modell der Bewertung: Claude Sonnet 5.5 (Agent `blind-bewertung`; „opus“ war in dieser Umgebung nicht verfügbar; der Agent hatte weder Websuche noch Shell, daher ohne Quellenbelege, Forschungsstand aus Hintergrundwissen; `entwurf:antwort-pruefen` führte die Koordination aus)

| Programm bzw. Kennung | Anlass (Regel) | Ergebnis |
| --- | --- | --- |
| AfD ST | `ursachen_ids` fehlen; Zitat über Seitenwechsel 222/223 | Feld ergänzt, Zitat gekürzt |
| AfD MV | `ursachen_ids` fehlen (leer nur mit `ursachen_offen`) | Feld ergänzt |
| FDP MV | `hebel_nicht_gefunden` ohne Hebel-Checkliste im Auftrag | Feld entfernt |
| alle 28 Programme | Feld `buendel` gesetzt, obwohl die Leitfäden 23 und 25 keine Bündel haben | Feld `buendel` in allen Maßnahmen entfernt, Prüfung erneut bestanden |
