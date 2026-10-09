import { describe, expect, it } from 'vitest'
import { gesamt, type KennzahlWoche, type Luecke, sortiereLuecken, wochen } from './kennzahlen'

const zeile = (woche: string, testphase: boolean, werte: Partial<KennzahlWoche>): KennzahlWoche => ({
  woche,
  testphase,
  runden: 0,
  gewertet: 0,
  unvollstaendig: 0,
  ungeprueft: 0,
  forderung: 0,
  forderung_mit_karte: 0,
  wert: 0,
  wert_mit_karte: 0,
  grenze: 0,
  ...werte,
})

const ZEILEN = [
  zeile('2026-10-05', false, { runden: 10, gewertet: 6, unvollstaendig: 1, ungeprueft: 1, forderung: 1, wert: 1, wert_mit_karte: 1 }),
  zeile('2026-10-05', true, { runden: 4, gewertet: 3, ungeprueft: 1 }),
  zeile('2026-09-28', false, { runden: 1, grenze: 1 }),
]

describe('Kennzahlen je Woche', () => {
  it('fasst öffentlich und Testphase zusammen und rechnet Quoten über die Alltagsprobleme', () => {
    const [neu, alt] = wochen(ZEILEN, 'alle')
    expect(neu).toMatchObject({ woche: '2026-10-05', runden: 14, probleme: 12, erkannt: 83.3, gewertet_anteil: 75, karte_anteil: 50 })
    expect(alt).toMatchObject({ woche: '2026-09-28', probleme: 0, erkannt: null, gewertet_anteil: null, karte_anteil: null })
  })

  it('trennt Testphase und öffentliche Runden', () => {
    expect(wochen(ZEILEN, 'oeffentlich')[0]).toMatchObject({ runden: 10, gewertet_anteil: 75 })
    expect(wochen(ZEILEN, 'testphase')).toHaveLength(1)
    expect(wochen(ZEILEN, 'testphase')[0]).toMatchObject({ runden: 4, gewertet_anteil: 75 })
  })

  it('summiert alle Wochen', () => {
    expect(gesamt(wochen(ZEILEN, 'alle'))).toMatchObject({ woche: 'gesamt', runden: 15, grenze: 1, probleme: 12 })
    expect(gesamt([])).toBeNull()
  })
})

describe('Lücken', () => {
  const l = (stichwort: string, anzahl_30_tage: number, anzahl: number, zuletzt = '2026-10-01'): Luecke => ({
    art: 'kein_thema',
    thema_id: null,
    stichwort,
    anzahl_30_tage,
    anzahl,
    anzahl_testphase: 0,
    zuletzt,
  })

  it('sortiert nach den letzten 30 Tagen, dann insgesamt, dann nach Datum und filtert die Art', () => {
    const liste = [l('a', 1, 9), l('b', 3, 3), l('c', 1, 9, '2026-10-05'), { ...l('d', 9, 9), art: 'unvollstaendig' as const }]
    expect(sortiereLuecken(liste, 'kein_thema').map((x) => x.stichwort)).toEqual(['b', 'c', 'a'])
  })
})
