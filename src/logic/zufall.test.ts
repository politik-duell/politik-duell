import { describe, expect, it } from 'vitest'
import { MOCK_DATEN } from '../data/quelle'
import { BEISPIEL_GEWICHT, beispielKandidaten, zufallsBeispiel, PROBLEM_VORSPANN, type Beispiel } from './zufall'
import { fuerBeideErfasst } from './stand'

const [p1, p2] = MOCK_DATEN.parteien
const optionen = { parteiIds: [p1.id, p2.id] as [number, number], laender: [null, null], mitHaltung: true }

describe('Zufallsbeispiel für die Eingabe', () => {
  it('nimmt Probleme nur aus Themen, die für beide Parteien ausgewertet sind', () => {
    const { problem } = beispielKandidaten(MOCK_DATEN, optionen)
    expect(problem.length).toBeGreaterThan(0)
    for (const text of problem) {
      const u = MOCK_DATEN.ursachen.find((x) => PROBLEM_VORSPANN + (x.alltag || x.beschreibung) === text)!
      expect(fuerBeideErfasst(MOCK_DATEN, u.thema_id, optionen.parteiIds)).toBe(true)
      expect(u.ebene ?? 'bund').toBe('bund')
    }
  })

  it('lässt Haltungen weg, wenn in der Runde schon eine Haltungskarte kam', () => {
    expect(beispielKandidaten(MOCK_DATEN, { ...optionen, mitHaltung: false }).wert).toEqual([])
  })

  it('zieht jede Art und wiederholt das letzte Beispiel nicht', () => {
    const arten = new Set<string>()
    let vorher: string | null = null
    for (let i = 0; i < 200; i++) {
      const b: Beispiel = zufallsBeispiel(MOCK_DATEN, optionen, vorher)!
      expect(b.text).not.toBe(vorher)
      arten.add(b.art)
      vorher = b.text
    }
    const k = beispielKandidaten(MOCK_DATEN, optionen)
    expect(arten).toEqual(new Set((['problem', 'forderung', 'wert'] as const).filter((a) => k[a].length)))
  })

  it('zieht Alltagsprobleme häufiger als Forderungen und Haltungen', () => {
    const k = beispielKandidaten(MOCK_DATEN, optionen)
    expect(k.forderung.length && k.wert.length).toBeTruthy()
    // Gleichmäßig verteilte Zufallszahlen: Anteil der Probleme = Gewicht / Summe der Gewichte.
    const n = 500
    const probleme = Array.from({ length: n }, (_, i) => zufallsBeispiel(MOCK_DATEN, optionen, null, () => (i + 0.5) / n)!)
      .filter((b) => b.art === 'problem').length
    const summe = BEISPIEL_GEWICHT.problem + BEISPIEL_GEWICHT.forderung + BEISPIEL_GEWICHT.wert
    expect(probleme / n).toBeCloseTo(BEISPIEL_GEWICHT.problem / summe, 1)
    expect(probleme / n).toBeGreaterThan(0.5)
  })

  it('liefert mit „nur Probleme“ ausschließlich Alltagsprobleme', () => {
    for (let i = 0; i < 50; i++) expect(zufallsBeispiel(MOCK_DATEN, { ...optionen, nurProbleme: true })!.art).toBe('problem')
  })

  it('gibt null zurück, wenn die Datenbank nichts Passendes hat', () => {
    expect(zufallsBeispiel({ ...MOCK_DATEN, abdeckung: [], haltungen: [] }, optionen)).toBeNull()
  })
})
