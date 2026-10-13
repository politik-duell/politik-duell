# Plan: Verlässliche Zuordnung – die Person bestätigt jede Wertung

Stand: 13. 10. 2026 · Konzept, noch nicht umgesetzt. Grundsatzentscheidungen getroffen (siehe „Entscheidungen“).

## Ziel

Wer ein persönliches Problem nennt, sieht weiterhin, welche Partei genau dafür am besten abschneidet. Neu ist zweierlei:

1. **Die KI ordnet in zwei engen Schritten zu** – erst das Thema, dann nur unter dessen Ursachen. Das verhindert Sprünge in fremde Themen.
2. **Vor jeder Wertung bestätigt die Person.** Ist die KI sicher, sind ihre Ursachen vorausgewählt und die Person bestätigt oder ändert sie. Ist sie unsicher, wählt die Person selbst aus den Alltagssätzen des Themas, ohne Vorauswahl, 

In beiden Fällen kann sie auch „Nichts davon passt“ sagen.

Grundsatz: **Die KI ist Übersetzerin, die Person hat das letzte Wort.** Gewertet wird nur, was die Person bestätigt hat; wo die KI raten müsste, schlägt sie nichts vor.

## Anlass

Zwei Testpartien in der geschlossenen Testphase (Persona: älterer AfD-Wähler, Rentner; AfD gegen Union mit Sachsen-Anhalt, AfD gegen SPD ohne Land; 12 Eingaben, 10 gewertete Runden). Die Punkte aus der Datenbank waren meist nachvollziehbar, die Fehler lagen fast alle in der Zuordnung:

| Falltyp | Beispiel aus den Partien | Folge |
| --- | --- | --- |
| Beleg passt nicht zur Ursache | „Bus fährt kaum“ als Beleg für „Termine im Gesundheitssystem werden kaum gesteuert“; „Polizei sieht man kaum“ für „Straftaten bleiben unaufgeklärt“; „Formulare verstehe ich nicht“ für „Register nicht vernetzt“ | Punkte für eine Ursache, die die Person nicht genannt hat |
| Falsches Thema | „Schluss mit den Windrädern“ → Auswahl aus *Schule*; die konkrete Antwort („schlafe schlecht“, Strompreis) → Auswahl aus *Hitze und Unwetter*; erst die dritte Eingabe → *Energiepreise* | Die KI ordnet nach Ähnlichkeit mit Ursachentexten, nicht nach dem Thema |
| Keine passende Ursache im Katalog | „Fremd im eigenen Ort, kaum Deutsch auf der Straße“ → nur Ursachen zu Asylverfahren und Arbeitsmarkt; die nächstliegende angetippt, gewertet | Ein anderes Problem wird gewertet als genannt |

Der Prompt regelt diese Fälle schon (`ki.ts` → `systemPrompt`: „Nimm keine Ursache dazu, nur weil sie … ähnlich klingt“), und `bereinigeAntwort` prüft, dass der Beleg wörtlich in der Schilderung steht. **Ob der Beleg die Ursache trägt, lässt sich im Code aber nicht prüfen** – und weitere Regeln im Prompt beheben einzelne Fälle, nicht das Raten selbst. Menschen schildern Symptome („Strom ist teuer“); die Ursachen im Katalog sind Befunde („Börsenpreis richtet sich nach dem teuersten Kraftwerk“). Diese Lücke kann die KI nur schließen, indem sie rät.

## Ist-Zustand

| Stelle | Verhalten heute |
| --- | --- |
| `supabase/functions/_shared/ki.ts` → `systemPrompt` | Ein Aufruf ordnet Typ, Thema, Ursachen und Belege zu. Der Prompt enthält den ganzen Katalog: 37 Themen, 161 Ursachen mit `beschreibung` und `alltag` (rund 42.000 Zeichen) – bei jedem Aufruf. |
| `ki.ts` → `bereinigeAntwort` | Übernimmt nur Ursachen mit wörtlichem, nicht doppelt verwendetem Beleg, höchstens `MAX_AUSWAHL`. Ohne Ursache: Nachfrage mit Thema (die App zeigt dann die Auswahl), nach `MAX_NACHFRAGEN = 2` ohne Wertung. |
| `src/components/Runde.tsx` → `absenden` | Liefert die KI Ursachen, geht es **ohne Bestätigung** direkt zur Auflösung (`onErgebnis`). |
| `Runde.tsx` → `auswaehlen`, `UrsachenAuswahl.tsx` | Antippen gibt es nur nach einer Nachfrage. Die Anfrage geht mit `auswahl` und leerem `verlauf` an `analyse`; die Funktion wertet ohne KI (`antwortAusAuswahl`). |
| `Ursache.alltag` (`typen.ts`) | Jede Ursache hat schon eine Fassung in der Sprache der Betroffenen; nur sie steht in der Auswahl. |
| `supabase/functions/analyse/index.ts` → `speichereRunde` | Runden ohne Wertung landen im Wortlaut in `review_eingaben` (nur Admins, 30 Tage). |
| `docs/methode.md` → „Punkte in der Runde“, „Rolle der KI“ | Beschreiben die Zuordnung durch die KI mit Belegwörtern; angetippte Ursachen „gelten als Schilderung der Person“. |


## Entscheidungen

| Frage | Entscheidung |
| --- | --- |
| Bestätigung immer oder nur bei Unsicherheit? | **Immer.** Keine Runde wird gewertet, ohne dass die Person die Ursachen bestätigt hat (Grundprinzip 2 ohne Ausnahme). |
| Vorauswahl durch die KI? | **Nur wenn sie sicher ist.** Bei Unsicherheit ist nichts vorausgewählt – ein unsicherer Vorschlag würde sonst ungelesen bestätigt. |
| „Nichts davon passt“ anbieten? | **Immer**, in jeder Bestätigung. |
| Texte | Sicher: „So habe ich dich verstanden“, Knöpfe „Stimmt so“ und „Nichts davon passt“. Unsicher: „Was davon trifft bei dir zu?“, Knöpfe „Damit werten“ (wie heute) und „Nichts davon passt“. In beiden darüber „Thema: *Name* · anderes Thema“. |

**Folge der Entscheidungen:** Ob die KI sicher ist, entscheidet jetzt nur noch, ob etwas vorausgewählt ist. Das Risiko verschiebt sich: Eine falsche Vorauswahl kann ungelesen bestätigt werden. Die Fehler aus den Testpartien („Bus fährt kaum“ → Gesundheitssystem) hatte die KI als sicher behandelt. Deshalb verlässt sich der Plan nicht allein auf die Selbsteinschätzung der KI, sondern ergänzt feste Auslöser im Code (siehe „Wann gilt eine Zuordnung als unsicher?“).

## Neuer Ablauf

```mermaid
flowchart TD
    E[Eingabe] --> K1[KI, Schritt 1:<br/>Typ und Thema]
    K1 -->|forderung / wert / grenze| W[wie bisher]
    K1 -->|kein Thema| U[ungeprüft, ohne Wertung]
    K1 -->|problem + Thema| K2[KI, Schritt 2:<br/>Ursachen nur dieses Themas]
    K2 --> P{sicher?<br/>KI und Prüfung im Code}
    P -->|ja| S["mit Vorauswahl:<br/>„So habe ich dich verstanden“"]
    P -->|nein| B["ohne Vorauswahl:<br/>„Was davon trifft bei dir zu?“"]
    S -->|Stimmt so / geändert| A[Auflösung mit Punkten]
    S -->|anderes Thema| B
    S -->|Nichts davon passt| R
    B -->|Damit werten| A
    B -->|anderes Thema| B
    B -->|Nichts davon passt| R[ohne Wertung → review_eingaben]
```

### 1. Schritt 1: Typ und Thema

- Ein Aufruf mit dem Katalog **ohne Ursachen**: Themen mit Name und Beschreibung, dazu die Haltungen wie bisher. Rückgabe: `typ`, `thema_id`, `zusammenfassung`, `stichwort`, Nachfrage und Rückmeldung wie heute.
- Neu: `thema_sicher` (ja/nein) und, falls nicht sicher, bis zu zwei weitere Themen (`thema_kandidaten`); ebenso `mehrere_probleme`, wenn die Eingabe erkennbar mehrere Probleme aus verschiedenen Themen nennt (Arzt und Bus).
- Die Regeln für `forderung`, `wert`, `grenze` und Pauschalurteile bleiben unverändert (Grundprinzip 4, `docs/plan-haltungen.md`).

### 2. Schritt 2: Ursachen des Themas

- Ein kurzer zweiter Aufruf nur mit den Ursachen des erkannten Themas (meist 4–6, je mit `beschreibung` und `alltag`). Rückgabe wie heute: `ursachen_ids` und `ursachen_belege` (wörtliche Belegwörter), dazu `sicher` (ja/nein).
- Weil nur die Ursachen eines Themas im Blick sind, kann ein Satz wie „schlafe schlecht“ keine Ursache eines fremden Themas mehr anziehen.
- Die Belegwörter bleiben, werden aber nicht mehr angezeigt: Sie dienen nur der Prüfung im Code (Auslöser unten).
- Vorbild ist der zweite Aufruf für Instrumente bei Forderungen (`instrumenteZurAuswahl`, `mitInstrument`).

### 3. Wann gilt eine Zuordnung als unsicher?

Unsicher ist sie, wenn **einer** dieser Auslöser greift; dann gibt es keine Vorauswahl. Ein falscher Alarm kostet nur ein paar Tipps, eine übersehene Unsicherheit dagegen eine Vorauswahl, die womöglich ungelesen bestätigt wird – die Auslöser sind deshalb bewusst großzügig.

| Auslöser | Woher | Fängt (Testpartie) |
| --- | --- | --- |
| KI meldet `thema_sicher: false` oder nennt `thema_kandidaten` | Schritt 1 | Windräder → Schule |
| KI meldet `mehrere_probleme` | Schritt 1 | Arzt und Bus in einer Eingabe |
| KI meldet in Schritt 2 `sicher: false` oder keine Ursache | Schritt 2 | wie heute die Nachfrage |
| Kein Belegwort findet sich (Wortstamm) in `beschreibung` oder `alltag` der Ursache | Code, `bereinigeAntwort` | „Bus fährt kaum“ → „Termine … gesteuert“, „Formulare verstehe ich nicht“ → „Register nicht vernetzt“ |

Die Wortstamm-Prüfung ist als Filter zu grob (deshalb wurde sie als Ablehnungsregel verworfen), als **Auslöser gegen die Vorauswahl** taugt sie: Sie muss nur verdächtige Fälle finden, nicht beweisen. Füllwörter („kaum“, „nicht“, „immer“) zählen nicht. Wie oft sie anschlägt, zeigt der Testsatz; schlägt sie zu oft an, wird die Liste der Füllwörter angepasst, nicht der Grundsatz.

### 4. Bestätigung in der App

Nach jeder Eingabe mit Thema erscheint vor der Auflösung eine von zwei Ansichten.

**KI sicher – mit Vorauswahl:**

> Thema: *Arzttermine* · [anderes Thema]
> **So habe ich dich verstanden:**
> ☑ Ich warte monatelang auf einen Facharzttermin
> ☑ Der nächste Hausarzt ist weit weg
> ☐ …
> [Stimmt so] · [Nichts davon passt]

**KI unsicher – ohne Vorauswahl:**

> Thema: *Arzttermine* · [anderes Thema]
> **Was davon trifft bei dir zu?**
> ☐ Ich warte monatelang auf einen Facharzttermin
> ☐ Der nächste Hausarzt ist weit weg
> ☐ …
> [Damit werten] · [Nichts davon passt]

- Angezeigt werden in beiden Fällen alle Ursachen des Themas in der `alltag`-Fassung. Höchstens `MAX_AUSWAHL` lassen sich wählen; die Vorauswahl lässt sich ändern.
- „anderes Thema“ zeigt die `thema_kandidaten` aus Schritt 1 und darunter die übrigen Themen; danach folgt die Ansicht ohne Vorauswahl, weil für das neue Thema kein Vorschlag der KI vorliegt.
- „Stimmt so“ und „Damit werten“ schicken die Auswahl wie heute über `auswahl` an `analyse` – gewertet wird ohne weiteren KI-Aufruf. In der Auflösung steht „Von dir bestätigt“ statt „Deine Worte: …“.
- Die bestehende Auswahl nach einer Nachfrage (`UrsachenAuswahl`) geht in der Ansicht ohne Vorauswahl auf; die Nachfrage selbst entfällt im Fall „problem mit Thema“, weil diese Ansicht ihre Aufgabe übernimmt.

### 5. „Nichts davon passt“

- In jeder Bestätigung, mit und ohne Vorauswahl. Die Runde endet ohne Wertung, wie heute nach zwei Nachfragen. Die Eingabe geht in die Review-Warteschlange `review_eingaben` (Grundprinzip 5: Wortlaut, ohne Parteien, ohne Verbindung zur Runde, 30 Tage) mit dem Vermerk, welches Thema angeboten war.
- Dafür muss die App bei dieser Anfrage den `verlauf` mitschicken (heute bei `auswahl` leer).
- **So lernt der Katalog:** Aus diesen Eingaben entstehen neue `alltag`-Sätze oder neue Ursachen (Skill `/thema-erfassen`, Recherche wie bei `/thema-anlegen`). Beispiel aus der Testpartie: eine Ursache zu Alltagskontakt und gemeinsamer Sprache vor Ort beim Thema Zuwanderung und Integration.

## Was sich nicht ändert

- Punkte kommen deterministisch aus der Datenbank (`bewertung.ts`), Belege nur aus der Datenbank.
- Höchstens drei Ursachen je Runde, Gewichtung der Lösungswege, `abdeckung`, Bund und Länder.
- Forderungs- und Haltungskarte, Grenze, Pauschalurteile.
- Keine Speicherung des Wortlauts bei gewerteten Runden.

## Kosten

- Heute geht bei **jedem** Aufruf der ganze Katalog mit (rund 42.000 Zeichen, grob 11.000–13.000 Token).
- Neu: Schritt 1 mit Themen ohne Ursachen (grob ein Fünftel davon), Schritt 2 mit den Ursachen eines Themas (wenige Hundert Token). Zwei Aufrufe sind damit nach dieser Schätzung **deutlich günstiger** als einer heute. Die Bestätigung kostet keinen KI-Aufruf; Nachfragen fallen bei „problem mit Thema“ weg.
- Vor der Umsetzung den Prompt messen (Token-Angabe in der Antwort von Mistral bei einem einzelnen Aufruf), statt der Schätzung zu vertrauen.

## Prüfung

- **Unit-Tests** (`ki.test.ts`, `logik.test.ts`): Schritt 1 und 2 bereinigen; jeder Auslöser aus „Wann gilt eine Zuordnung als unsicher?“ mit Beispielen aus mehreren Themen; Wortstamm-Prüfung mit Füllwörtern; „Nichts davon passt“ landet in `review_eingaben`; Auswahl über `auswahl` wie bisher.
- **Mock** (`src/logic/analyse.ts`): Schritt 1 und 2 über Schlagwörter nachbilden, damit `VITE_DATENQUELLE=mock` den neuen Ablauf zeigt.
- **Kleiner Testsatz für die echte KI**: die 12 Eingaben der Testpartien plus je drei Formulierungen für „falsches Thema“ und „Beleg passt nicht“, zusammen rund 20. Erwartetes Ergebnis je Eingabe vorher festlegen (Vorauswahl mit welchen Ursachen, oder keine Vorauswahl) und gegenlesen lassen; ein Lauf je Eingabe, wiederholt nur bei überraschendem Ergebnis. Läuft nur nach Änderungen am Prompt, lokal gegen Mistral mit `bereinigeAntwort`, **nicht** über die öffentliche Funktion (sonst füllt er `review_eingaben` und `runden`). Antworten aufzeichnen, damit Änderungen an Bereinigung und Auslösern ohne neuen Aufruf geprüft werden können. Format wie `docs/prompt-evaluation.md`.
- **Wichtigste Kennzahl:** Wie viele falsche Ursachen sind vorausgewählt? Ziel ist null im Testsatz. Zweitrangig: wie oft die Vorauswahl unnötig fehlt.

## Risiken

| Risiko | Einschätzung und Gegenmittel |
| --- | --- |
| Eine falsche Vorauswahl wird ungelesen bestätigt | Hauptrisiko. Gegenmittel: feste Auslöser im Code statt nur Selbsteinschätzung; Kennzahl im Testsatz; Meldungen über „Fehler melden“ auswerten. Im schlechtesten Fall gilt der heutige Stand. |
| Ein Klick mehr pro Runde, weniger „magisch“ | Bei richtiger Vorauswahl genügt „Stimmt so“. Die Bestätigung zeigt zugleich, dass das Spiel zugehört hat. |
| Auslöser schlagen zu oft an, die Vorauswahl fehlt oft | Kostet je ein paar Tipps. Füllwörter anpassen, Anteil im Testsatz und in der Admin-Ansicht beobachten. |
| Taktische Auswahl: Ursachen antippen, bei denen die eigene Partei gut abschneidet | Schon heute über die Wortwahl möglich. Die Ansicht zeigt keine Parteien und keine Punkte. Gering, nicht null. |
| Mehr Runden ohne Wertung durch „Nichts davon passt“ | Erwünscht: Sie zeigen die Lücken im Katalog statt sie mit falschen Punkten zu überdecken. |

## Änderungen an Dokumenten

- `docs/methode.md` → „Punkte in der Runde“, Punkt 2: Zuordnung in zwei Schritten; gewertet wird nur, was die Person bestätigt hat; Vorauswahl nur bei sicherer Zuordnung; „Nichts davon passt“ ergänzen; Nachfrage bei „problem mit Thema“ entfällt.
- `docs/methode.md` → „Rolle der KI“: Tabelle anpassen, Auslöser für Unsicherheit kurz nennen.
- `docs/konzept.md` (Spielablauf, KI-Schnittstelle) und `docs/datenmodell.md` (Vermerk des angebotenen Themas in `review_eingaben`, falls neue Spalte).
- `CLAUDE.md` → „Kurzfassung, Runde“ und Grundprinzip 2: Bestätigung vor jeder Wertung erwähnen.

## Reihenfolge

1. Prompt messen (Kosten); Testsatz mit erwarteten Ergebnissen anlegen und gegenlesen lassen; einmal mit dem heutigen Stand laufen lassen.
2. Schritt 1 und 2 in `ki.ts` und `analyse/index.ts`, mit den Auslösern, Unit-Tests und Mock. Antwortformat abwärtskompatibel halten, bis die App umgestellt ist.
3. Bestätigung in der App (`Runde.tsx`, `UrsachenAuswahl.tsx`, `Aufloesung.tsx`), „Nichts davon passt“ mit Speicherung.
4. Testsatz erneut laufen lassen; Füllwörter und Auslöser nachjustieren.
5. `docs/methode.md` und die übrigen Dokumente anpassen.
6. Katalog aus „Nichts davon passt“ ergänzen – laufend, über die bestehenden Skills.
