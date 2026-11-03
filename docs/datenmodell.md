# Datenmodell

Stand: Migrationen bis `20261103000000_keine_eingaben_speichern.sql` (`supabase/migrations/`).
Die kuratierten Daten liegen als JSON in `daten/`; `npm run seed` erzeugt daraus die `seed.sql`.

## ER-Diagramm

```mermaid
erDiagram
    parteien ||--o{ massnahmen : "hat"
    instrumente |o--o{ massnahmen : "instrument_id"
    themen ||--o{ instrumente : "gehört zu"
    instrumente |o--o| instrumente : "entspricht (Bund ↔ Land)"
    haltungen ||--o{ haltung_positionen : "hat"
    parteien ||--o{ haltung_positionen : "vertritt"
    haltungen ||--o{ haltung_zielkonflikte : "hat"
    themen ||--o{ massnahmen : "gehört zu"
    themen ||--o{ ursachen : "hat"
    themen ||--o{ abdeckung : "ist erfasst für"
    parteien ||--o{ abdeckung : "ist erfasst für"
    parteien ||--o{ landesprogramme : "hat"
    laender ||--o{ landesprogramme : "gilt in"
    laender |o--o{ massnahmen : "land (null = Bund)"
    laender |o--o{ abdeckung : "land (null = Bund)"
    themen ||--o{ pruef_einheiten : "gehört zu"
    pruef_einladungen ||--o{ pruef_bewertungen : "gibt ab"

    parteien {
        smallint id PK
        text name
        text kurzname
        text farbe
        text programm_url
        date programm_stand
    }
    themen {
        smallint id PK
        text name
        text beschreibung
        jsonb symptome "Symptomgruppen: nr, alltag, ursachen_ids, ki_entwurf"
    }
    ursachen {
        smallint id PK
        smallint thema_id FK
        text beschreibung
        text quelle_url
        text ebene "bund | land"
        text alltag "Satz zum Antippen"
        text gilt_fuer "vorausgesetzte Lage, sonst null"
    }
    massnahmen {
        serial id PK
        smallint thema_id FK
        smallint partei_id FK
        text land FK "null = Bundesprogramm"
        text beschreibung
        smallint_arr ursachen_ids "Verweis auf ursachen.id"
        integer instrument_id FK "gleicher Lösungsweg wie in anderen Programmen"
        smallint wirksamkeit "0-3"
        smallint umsetzbarkeit "0-3"
        jsonb rollen_modifikator
        text begruendung
        text beleg_programm_url
        text beleg_studie_url
        text evidenz "belegt | gemischt | offen"
        date stand
        boolean geprueft
        boolean ki_entwurf
        jsonb nebenwirkungen "Folgen über das Thema hinaus, ohne Punkte; null = ungeprüft"
    }
    instrumente {
        integer id PK "Nummernkreis wie Maßnahmen"
        smallint thema_id FK
        text name
        text begruendung
        text evidenz "belegt | gemischt | offen"
        text beleg_studie_url
        text ebene "bund | land"
        integer entspricht FK "gleicher Lösungsweg auf der anderen Ebene"
        boolean ki_entwurf
        text entwurf_herkunft "blind | nicht_blind"
        jsonb nebenwirkungen "wie bei massnahmen"
    }
    abdeckung {
        smallint thema_id FK
        smallint partei_id FK
        text land FK "null = Bund"
        text art "massnahmen | keine"
        text begruendung
        date stand
        boolean ki_entwurf
        integer_array durchsucht_fuer "null = alle Ursachen"
    }
    laender {
        text id PK "z. B. ST"
        text name
        date letzte_wahl
    }
    landesprogramme {
        smallint partei_id PK
        text land PK
        text url
        date stand
        text kein_programm
    }
    haltungen {
        smallint id PK "eigener Nummernkreis"
        text frage "neutrale Ja/Nein-Frage"
        text beschreibung
        smallint_arr verwandte_themen "Verweis auf themen.id"
    }
    haltung_positionen {
        smallint haltung_id FK
        smallint partei_id FK
        text land FK "null = Bund (zunächst nur Bund)"
        text position "ja | nein | teils | keine_aussage"
        text kurzfassung
        text zitat "wörtlich, bei Haltungen der Beleg"
        text beleg_programm_url
        text begruendung "nur bei keine_aussage"
        date stand
        boolean ki_entwurf
    }
    haltung_zielkonflikte {
        int id PK
        smallint haltung_id FK
        text seite "ja | nein"
        text text
        text quelle_url
    }
    themen_vorschlaege {
        bigint id PK
        timestamptz created_at
        text text "Wortlaut des Vorschlags, nur Admins, max. 180 Tage"
        boolean erledigt
    }
    rate_limit {
        uuid sitzung PK
        timestamptz fenster_start
        int anzahl
    }
    pruef_einladungen {
        uuid id PK
        text token_hash
        text name
        smallint_arr themen
        boolean gesperrt
        timestamptz einwilligung_am
    }
    pruef_bewertungen {
        uuid einladung_id PK
        int massnahme_id PK
        smallint thema_id
        smallint wirksamkeit
        smallint umsetzbarkeit
        boolean abgesendet
    }
    pruef_einheiten {
        int id PK
        smallint thema_id FK
    }
    testphase_zugaenge {
        uuid id PK
        text token_hash
        text name
        boolean gesperrt
    }
    admins {
        uuid user_id PK
    }
```

`massnahmen.ursachen_ids` ist ein Array und daher keine echte Fremdschlüsselbeziehung.
`instrumente` enthält bewusst keine Wirksamkeit und Umsetzbarkeit: Die Forderungskarte zeigt Forschungsstand und Begründung, aber keine Punkte; gewertet wird weiter über die Maßnahmen. Ein Instrument gilt für eine Ebene; `entspricht` verbindet das Bundes- mit dem Landes-Instrument desselben Lösungswegs.
`pruef_bewertungen.massnahme_id` verweist auf IDs aus `daten/`, nicht zwingend auf `massnahmen`.
`haltungen.verwandte_themen` ist ein Array und daher keine echte Fremdschlüsselbeziehung. Haltungen haben keine Punkte; anders als bei Maßnahmen steht das Zitat in der Datenbank, weil bei Haltungen der Wortlaut der eigentliche Beleg ist. Die View `haltungen_vollstaendig (haltung_id, geprueft)` nennt die Haltungen, zu denen jede Partei eine Position im Bundesprogramm hat („Alle sieben oder keine“); sie läuft mit den Rechten der Abfragenden, öffentlich zählen also nur geprüfte Positionen. Die Edge Function sieht mit der Service-Rolle auch Entwürfe und nimmt nur Zeilen mit `geprueft`, solange Entwürfe nicht zählen (ohne Zugang zur Testphase und ohne `einstellungen.ki_entwuerfe_oeffentlich`). Die App nutzt dieselbe Regel (`supabase/functions/_shared/haltung.ts`).
Eingaben aus dem Spiel werden nicht gespeichert (Migration `20261103000000_keine_eingaben_speichern.sql`): Die früheren Tabellen `runden`, `review_warteschlange`, `review_eingaben` und die Views `luecken`, `kennzahlen_woche` sind samt Inhalt entfernt. Gespeichert wird nur, was jemand ausdrücklich über „Thema vorschlagen“ abschickt: `themen_vorschlaege` – nur der Text und der Zeitpunkt, ohne Sitzung, Parteien oder Verbindung zu einem Spiel; geschrieben ohne KI von der Edge Function `vorschlag` (Wortfilter: Kontaktdaten, Namen, Beleidigungen und Hetze werden abgelehnt), gelesen nur von Admins (Reiter „Vorschläge“, `npm run vorschlaege`), Admins ändern nur `erledigt`; gelöscht nach 180 Tagen (Trigger bei jedem neuen Vorschlag, mit pg_cron zusätzlich täglich).

## Gruppen

| Gruppe | Tabellen | Zugriff |
|---|---|---|
| Stammdaten | `parteien`, `themen`, `laender`, `landesprogramme` | lesbar |
| Kern | `ursachen`, `massnahmen`, `abdeckung`, `instrumente`, `haltungen`, `haltung_positionen`, `haltung_zielkonflikte` | lesbar; KI-Entwürfe nur, wenn `ki_entwuerfe_oeffentlich()` an ist, sonst über `testphase_daten` mit Zugang |
| Spieldaten | `rate_limit` | nur Edge Functions |
| Vorschläge | `themen_vorschlaege` | schreiben nur Edge Function `vorschlag`; lesen, abhaken, löschen nur Admins |
| Betrieb | `admins`, `pruef_*`, `testphase_zugaenge` | anon gesperrt; Admins und Edge Functions |
| Einstellungen | `einstellungen` (eine Zeile: `ki_entwuerfe_oeffentlich`, Alpha/Beta) | lesbar; ändern nur Admins |

## Bund oder Land?

- `massnahmen.land IS NULL` → Bundesprogramm; sonst Landtagswahlprogramm dieses Landes.
- `abdeckung.land` gilt genauso.
- `ursachen.ebene` sagt, wer für die Ursache zuständig ist. Das ist etwas anderes als die Herkunft der Maßnahme.

```sql
select id, partei_id,
       case when land is null then 'Bund' else 'Land: ' || land end as ebene,
       beschreibung
from massnahmen
order by land nulls first, partei_id;
```

## Ablauf einer Wertung

1. Die KI ordnet das Problem Thema und Ursachen zu.
2. `abdeckung` prüfen. Fehlt ein Eintrag für eine der Parteien, ist der Status `unvollstaendig` und es gibt keine Punkte.
3. Je Ursache zählen die verschiedenen Lösungswege (je `instrument_id` die beste Maßnahme, ohne Instrument jede Maßnahme für sich; Punkte `wirksamkeit × umsetzbarkeit`; `rollen_modifikator` zählt vorerst nicht), absteigend gewichtet mit 1, ½, ¼ …, höchstens 9, auf eine Nachkommastelle. Bei gewähltem Land zählen die Landesprogramme, sonst der Bund.
4. Die Summe über die Ursachen ergibt die Rundenpunkte. Wer mehr hat, bekommt 1 Punkt, bei Gleichstand beide 1 Punkt. Das Ergebnis wird nicht gespeichert.
