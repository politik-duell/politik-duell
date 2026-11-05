import { describe, expect, it } from 'vitest'
import { gruppiereVorschlaege } from './vorschlaege-gruppen'

describe('gruppiereVorschlaege', () => {
  it('fasst gleiche Texte zusammen und sortiert nach Häufigkeit', () => {
    const g = gruppiereVorschlaege([
      { id: 1, created_at: '2026-11-01T10:00:00Z', text: 'Pflegeplätze' },
      { id: 2, created_at: '2026-11-02T10:00:00Z', text: 'Fluglärm' },
      { id: 3, created_at: '2026-11-03T10:00:00Z', text: '  pflegeplätze! ' },
    ])
    expect(g).toEqual([
      { text: '  pflegeplätze! ', anzahl: 2, ids: [3, 1], zuletzt: '2026-11-03T10:00:00Z' },
      { text: 'Fluglärm', anzahl: 1, ids: [2], zuletzt: '2026-11-02T10:00:00Z' },
    ])
  })
})
