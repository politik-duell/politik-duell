---
name: liste-einordnen
description: Ordnet eine Liste von Äußerungen, Haltungen oder Forderungen (etwa aus Umfragen, Interviews, Kommentaren) für das Politik-Duell ein – je Zeile Haltung, Forderung zu einem Thema, neues Thema, Grenze, Pauschalurteil, Tatsachenbehauptung, Aussage über Parteien oder doppelt –, schlägt neutrale Fragen bzw. Forderungen vor und schreibt eine Tabelle zum Bestätigen. Abgearbeitet werden die bestätigten Zeilen danach mit /liste-ausfuehren. Aufruf z. B. /liste-einordnen liste.txt oder /liste-einordnen liste.txt --direkt.
argument-hint: <Datei oder eingefügte Liste> [--direkt]
disable-model-invocation: true
---

# Liste einordnen

Aufruf: **$ARGUMENTS**

Listen aus Umfragen oder Gesprächen mischen Wertfragen, Forderungen, Alltagsprobleme, Behauptungen und Abwertungen. Nur ein Teil davon gehört in den Katalog. Dieser Skill sortiert, **bevor** etwas angelegt wird; `/liste-ausfuehren` verteilt danach an die anderen Skills. Mit `--ausfuehren` aufgerufen (alte Form): nur melden „Abarbeiten jetzt mit `/liste-ausfuehren <datei>`“ und stoppen. Maßstab: `CLAUDE.md` → „Spielablauf“ (Typen `problem`, `forderung`, `wert`, `grenze`), `docs/methode.md` → „Grenze“, `docs/plan-haltungen.md` → B1 (Aufnahmekriterien).

## Einordnen

1. `npm run phase-a -- start "Liste"` – die Einordnung prägt Fragen und Forderungen, deshalb ohne Blick in Programme.
2. Kontext holen: `npm run -s themen:ueberblick -- --kurz` (eine Zeile je Thema) und `npm run -s themen:ueberblick -- --haltungen` (ID und Frage). Ursachen eines Themas nur bei Bedarf (`-- --nur <IDs>`); Haltungsdateien nicht lesen.
3. **Jede Zeile einordnen** (eine Art je Zeile; im Zweifel die vorsichtigere):

   | Art | Wann | Vorschlag | Ziel |
   | --- | --- | --- | --- |
   | `haltung` | Wertfrage, über die man verschieden urteilen kann, mit Bezug zu Programmen (Energie, Verteidigung, Steuern, EU …) | neutrale Ja/Nein-Frage mit „?“, ohne Partei und ohne wertende Wörter | `neu`, oder `H<ID>`, wenn eine vorhandene Haltung sie schon abdeckt |
   | `forderung` | konkreter Lösungsweg für ein vorhandenes Thema („Polizei stärken“, „Steuern senken“) | die Forderung neutral in wenigen Wörtern | `T<ID>` |
   | `thema` | Alltagsproblem („Infrastruktur auf dem Land fehlt“) | Name des Themas | `neu`, oder `T<ID>`, wenn es schon abgedeckt ist |
   | `grenze` | spricht einer Gruppe Würde oder gleiche Rechte ab, ruft zu Gewalt auf, beleidigt, relativiert NS-Verbrechen, antisemitische Behauptungen | kurzer Grund | `–` |
   | `pauschal` | Pauschalurteil über eine Gruppe („Ausländer wollen nicht arbeiten“) | kurzer Grund | `–` |
   | `tatsache` | Tatsachenbehauptung („Klimawandel ist nicht menschengemacht“, „Wahlen wurden manipuliert“) | kurzer Grund | `–` |
   | `meta` | Aussage über Parteien, Wählerinnen, Medien oder die eigene Stimmung, ohne Sachfrage | kurzer Grund | `–` |
   | `doppelt` | gleiche Sache wie eine frühere Zeile | – | `#<Nr>` |

   Regeln:
   - Eine Zeile mit Sachkern **und** Abwertung („Ausländer raus“) ist `grenze` – keine Umdeutung in eine zulässige Frage. Steckt in einer anderen Zeile eine zulässige Sachfrage (Asylrecht verschärfen), wird sie dort aufgenommen.
   - Eine Frage, die über gleiche Rechte einer Gruppe abstimmen ließe (Ausbürgerung wegen Herkunft, Vorrang nach Staatsangehörigkeit im Gesundheitswesen), ist `grenze`. Eine Frage über Regeln, die für alle gleich gelten (Geburtsortsprinzip, Doppelpass, Wartezeit für Sozialleistungen), kann `haltung` sein.
   - `haltung` nur, wenn absehbar mehrere Programme dazu Stellung nehmen – sicher prüft das erst `/haltung-erfassen` (mindestens drei).
   - Gleiche Sache in mehreren Zeilen: erste Zeile mit Vorschlag, die übrigen `doppelt`. Ähnliche Haltungen zu einer Frage zusammenlegen.
   - Vorschläge nennen keine Partei und übernehmen keine wertenden Wörter aus der Zeile.
4. **Tabelle schreiben** (mit Write): `.cache/listen/<Datum>-<kurzname>.md` – **nicht ins Repository**, denn die Liste enthält Äußerungen im Wortlaut, auch abwertende. Ein Satz zur Herkunft der Liste, darunter `| Nr | Eintrag | Art | Vorschlag | Ziel | OK |` – Eintrag wörtlich (ein „|“ im Text als „/“), OK überall `[ ]`. Mit `--direkt` setzt du OK bei allen Zeilen auf `[x]`.
5. `npm run phase-a -- ende` (erst danach ist `.cache/` wieder lesbar), dann `npm run -s liste:auswahl -- <datei>` – muss ohne Fehler durchlaufen.
6. **Stoppen.** Mit `--direkt` (alle Zeilen bestätigt) nur melden: Pfad, Zählung und „Weiter mit `/liste-ausfuehren <datei>`“ – das Abarbeiten läuft als eigener Skill mit einem günstigeren Modell. Sonst im Chat nur: Pfad der Tabelle, die Zählung je Art aus `liste:auswahl` und die Zeilen, bei denen du zwischen zwei Arten geschwankt hast (Nr, beide Arten, ein Satz – Grenze, Pauschal, Tatsache, Meta nie im Wortlaut). Alle übrigen Zeilen stehen in der Tabelle; sie nicht im Chat wiederholen. Die Betreiberin antwortet mit den Nummern, die angelegt werden sollen („alle“, „alle außer 12, 40“), oder mit Änderungen; du setzt die Kästchen und Änderungen in der Tabelle, prüfst erneut mit `liste:auswahl` und meldest „Weiter mit `/liste-ausfuehren <datei>`“. Die Tabelle liegt nur im Container – geht er verloren, beginnt es von vorn.
