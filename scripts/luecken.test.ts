import { describe, expect, it } from 'vitest'
import { findeLuecken } from './luecken.ts'

const m = (id: number, thema_id: number, partei_id: number, instrument_id: number | null, zitat: string) => ({
  id, thema_id, partei_id, instrument_id, zitat, beschreibung: zitat, beleg_programm_url: `https://x.de/p.pdf#page=${id}`,
})
// Partei 1 und 2 verbinden mit derselben Stelle Weg 10 (Thema 1) und Weg 20 (Thema 2); Partei 3 hat nur Weg 10.
const massnahmen = [
  m(1, 1, 1, 10, 'Beiträge aus Steuern zahlen'), m(2, 2, 1, 20, 'Beiträge aus Steuern zahlen'),
  m(3, 1, 2, 10, 'Staat zahlt die Beiträge'), m(4, 2, 2, 20, 'Staat zahlt die Beiträge'),
  m(5, 1, 3, 10, 'Versicherungsfremde Leistungen über den Staat'),
]
const abdeckung = [1, 2].flatMap((thema_id) => [1, 2, 3].map((partei_id) => ({ thema_id, partei_id })))

describe('Lücken aus verbundenen Lösungswegen', () => {
  it('meldet den fehlenden Weg mit der Stelle aus dem anderen Thema', () => {
    expect(findeLuecken(massnahmen, abdeckung)).toEqual([
      expect.objectContaining({ thema_id: 2, partei_id: 3, instrument_id: 20, hinweis: expect.objectContaining({ id: 5 }), stuetze: [1, 2] }),
    ])
  })

  it('meldet nichts bei nur einer stützenden Partei, ohne Durchsicht oder wenn die Stelle schon im Thema steht', () => {
    expect(findeLuecken(massnahmen.slice(2), abdeckung)).toEqual([])
    expect(findeLuecken(massnahmen, abdeckung.filter((a) => !(a.thema_id === 2 && a.partei_id === 3)))).toEqual([])
    expect(findeLuecken([...massnahmen, m(6, 2, 3, 21, 'Versicherungsfremde Leistungen über den Staat')], abdeckung)).toEqual([])
  })
})
