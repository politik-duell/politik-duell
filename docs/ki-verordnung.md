# EU-KI-Verordnung (AI Act) – Einordnung des Politik-Duells

Stand 3. November 2026, Verordnung (EU) 2024/1689 in der Fassung des Digital Omnibus on AI
(Verordnung (EU) 2026/1744). Dokumentation nach Art. 6 Abs. 4 KI-VO: Begründung, warum das System kein
Hochrisiko-KI-System nach Anhang III ist. Datenschutz: `docs/datenschutz-folgenabschaetzung.md`.

> Kein Rechtsrat. Vom Verantwortlichen (Trägerverein) zu beschließen, vor dem öffentlichen Start und bei
> jeder Änderung an der Rolle der KI zu überprüfen.

## 1. Das KI-System und die Rollen

- **KI-System:** die Edge Function `analyse` (`supabase/functions/analyse/`, Prompts in
  `supabase/functions/_shared/ki.ts`). Sie ordnet eine Äußerung als `problem` | `forderung` | `wert` |
  `grenze` ein, schlägt Thema, Ursachen, Lösungsweg oder Haltung aus einem festen Katalog vor, stellt
  Rückfragen und formuliert eine neutrale Kurzfassung. Modell: Mistral (`mistral-medium-latest`) über die
  API, Temperatur 0,1, striktes JSON.
- **Anbieter (Art. 3 Nr. 3):** der Betreiber bzw. Trägerverein – er entwickelt das System unter eigenem
  Namen und stellt es bereit; dass es kostenlos ist, ändert daran nichts.
- **Betreiber (Art. 3 Nr. 4):** ebenfalls der Trägerverein.
- **Anbieter des KI-Modells mit allgemeinem Verwendungszweck:** Mistral AI SAS. Dessen Pflichten
  (Art. 53 ff.) treffen Mistral, nicht uns.
- **KI-Entwürfe im Datenkatalog** (Maßnahmen, Bewertungen, `docs/methode.md` → „KI-Entwürfe“) entstehen
  mit KI-Werkzeugen außerhalb des laufenden Spiels und werden als Daten veröffentlicht – relevant für
  Art. 50 Abs. 4 (Abschnitt 4).

## 2. Verbotene Praktiken (Art. 5)

Keine. Insbesondere keine unterschwellige oder manipulative Beeinflussung (Art. 5 Abs. 1 lit. a/b): Die
Methode ist offen, alle Parteien werden nach denselben Kriterien bewertet, und die KI vergibt keine Punkte.

## 3. Hochrisiko? Anhang III Nr. 8 lit. b

Anhang III Nr. 8 lit. b erfasst KI-Systeme, die *bestimmungsgemäß verwendet werden sollen, um das Ergebnis
einer Wahl oder das Wahlverhalten natürlicher Personen zu beeinflussen*. Das Spiel vergleicht
Lösungsvorschläge von Parteien und zeigt einen Gesamtsieger; die Frage muss daher geprüft werden.

**Einschätzung: kein Hochrisiko-KI-System.**

1. **Zweckbestimmung des KI-Systems:** Die KI ordnet Text einer Kategorie und einem Katalogeintrag zu und
   führt das Gespräch. Sie ist nicht dazu bestimmt, Wahlverhalten zu beeinflussen. Zweck des Spiels ist
   politische Bildung nach einer neutralen, offenen Methode (Grundprinzip 1, `CLAUDE.md`).
2. **Ausnahme nach Art. 6 Abs. 3** – selbst wenn man das Gesamtangebot Nr. 8 lit. b zuordnete:
   - **lit. a – eng gefasste Verfahrensaufgabe:** Die KI klassifiziert Eingaben in feste Kategorien und
     wählt aus einem festen Katalog; sie erzeugt keine eigenen Bewertungen von Parteien.
   - **lit. d – vorbereitende Aufgabe:** Das Ergebnis der KI ist nur ein Vorschlag. Gewertet wird erst,
     was die Person bestätigt (Vorauswahl nur bei Sicherheit, immer „Nichts davon passt“,
     `docs/plan-zuordnung.md`). Die Punkte berechnet deterministischer Code aus der kuratierten Datenbank
     (`src/logic/bewertung.ts`) – ohne KI.
   - Kein Profiling natürlicher Personen (Art. 6 Abs. 3 Unterabs. 3): keine Konten, keine Kennungen, keine
     Speicherung von Runden oder Eingaben; die Einordnung betrifft eine Äußerung, nicht die Person.
     Themenvorschläge laufen ganz ohne KI.
3. **Kein erhebliches Risiko** für Grundrechte oder Wahlen: Gleiche Kriterien für alle Parteien, Belege
   aus der Datenbank (die KI erfindet keine Quellen), offene Methode und Daten (CC BY 4.0), Punkte
   nachvollziehbar.

**Bedingungen, unter denen die Einschätzung neu zu prüfen ist:**

- Die KI vergibt oder verändert Punkte, wählt Belege oder bewertet Parteien direkt.
- Bestätigung durch die Person entfällt.
- Ergebnisse werden personalisiert (Profil, Empfehlung „wähle X“) oder gezielt vor Wahlen an bestimmte
  Gruppen ausgespielt.
- KI-Entwürfe im Datenkatalog zählen dauerhaft ohne menschliche Prüfung (siehe `docs/methode.md`).

**Fristen und Registrierung:** Die Pflichten für Hochrisiko-Systeme nach Anhang III gelten seit dem
Digital Omnibus ab 2. Dezember 2027. Die Registrierung in der EU-Datenbank für Systeme, die nach Art. 6 Abs. 3 nicht als Hochrisiko gelten
(Art. 49 Abs. 2), bleibt nach dem Omnibus bestehen; gestrichen wurden nur zwei Angaben im Formular
(Anhang VIII Abschnitt B Nr. 7 und 9). Sie gehört zu den Pflichten für Anhang-III-Systeme und ist damit
spätestens bis 2. Dezember 2027 zu erledigen (Wortlaut im Amtsblatt gegenprüfen). Diese Dokumentation ist auf Verlangen der
Marktüberwachungsbehörde vorzulegen (Art. 6 Abs. 4).

## 4. Transparenzpflichten (Art. 50) – gelten seit 2. August 2026

| Pflicht | Umsetzung |
|---|---|
| **Abs. 1** – Hinweis, dass man mit einem KI-System interagiert | Startseite und Einwilligung („eine KI ordnet ein“); jede Sprechblase der KI trägt die Marke „KI“ (`src/components/KiText.tsx`, für Screenreader „KI:“) |
| **Abs. 2** – maschinenlesbare Kennzeichnung KI-erzeugter Texte (für bereits vor dem 2. August 2026 bereitgestellte Systeme ab 2. Dezember 2026) | Elemente mit KI-Text tragen `data-ki-erzeugt="true"`: Rückfragen und Rückmeldungen der KI im Gespräch, Kurzfassung in Auflösung und Endstand. Feste Sätze des Spiels tragen die sichtbare Marke, aber nicht das Attribut. Vorläufige Lösung: An den Verhaltenskodex der Kommission zur Kennzeichnung KI-erzeugter Inhalte anpassen, sobald er ein Format für Text festlegt |
| **Abs. 4** – Texte zu Angelegenheiten von öffentlichem Interesse, die mit KI erzeugt und veröffentlicht werden | KI-Entwürfe im Datenkatalog sind gekennzeichnet („KI-Entwurf“, Hinweis am Ergebnis und im Teilen-Text, `src/components/Ende.tsx`); nach menschlicher Prüfung mit redaktioneller Verantwortung entfällt die Pflicht |

Der **Teilen-Text** (`teilenText` in `src/spiel.ts`) enthält keinen KI-Text – nur Themennamen aus dem
Katalog und feste Sätze; KI-Entwürfe erwähnt er bereits.

## 5. Sonstiges

- **KI-Kompetenz (Art. 4):** Wer im Projekt Prompts, Katalog und KI-Entwürfe pflegt, kennt Grenzen und
  Fehlerquellen der Einordnung (`docs/prompt-evaluation.md`, `npm run ki:testset`). Kurze schriftliche
  Einweisung für neue Mitwirkende empfohlen.
- **Qualität der Einordnung:** Änderungen an Prompts oder Katalog vor dem Deploy mit dem Testset messen
  (`docs/konzept.md` → „Zuordnung messen“).

| | |
|---|---|
| Beschlossen durch | offen (Vorstand des Trägervereins) |
| Nächste Überprüfung | bei Änderung der Rolle der KI, spätestens nach einem Jahr |
