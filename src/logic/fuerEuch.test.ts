import { describe, expect, it } from 'vitest'
import type { Massnahme, Partei } from '../data/types'
import type { ParteiErgebnis } from './bewertung'
import { fuerEuch } from './fuerEuch'

const partei = (id: number): Partei => ({ id, name: `P${id}`, kurzname: `P${id}`, farbe: '#000', programm_url: '', programm_stand: '2025-01-01' })
const massnahme = (id: number, extra: Partial<Massnahme> = {}): Massnahme =>
  ({ id, thema_id: 1, partei_id: 1, beschreibung: `M${id}`, ursachen_ids: [1], wirksamkeit: 2, umsetzbarkeit: 2, begruendung: '', ...extra }) as Massnahme
const ergebnis = (p: Partei, ms: Massnahme[]) =>
  ({ partei: p, treffer: ms.map((m) => ({ massnahme: m, ursachen_ids: [1], punkteJeUrsache: 4, rollenBonus: 0, wirksamkeit: 2 })) }) as unknown as ParteiErgebnis

describe('fuerEuch', () => {
  const miete = massnahme(1, {
    nebenwirkungen: [
      { bereich: 'verteilung', richtung: 'vorteil', text: 'Entlastet Haushalte mit wenig Einkommen.', quelle_url: 'https://q', belegstufe: 'A' },
      { bereich: 'haushalt', richtung: 'nachteil', text: 'Kostet Geld.', quelle_url: 'https://q', belegstufe: 'A' },
    ],
  })
  const ohne = massnahme(2)

  it('zeigt nur Folgen für die Verteilung, je Partei einmal – ohne Rollen', () => {
    const f = fuerEuch([ergebnis(partei(1), [miete, { ...miete, id: 3 }]), ergebnis(partei(2), [ohne])])
    expect(f).toEqual({ verteilung: [expect.objectContaining({ partei: expect.objectContaining({ id: 1 }) })] })
    expect(f.verteilung.map((v) => v.hinweis.text)).toEqual(['Entlastet Haushalte mit wenig Einkommen.'])
  })

  it('ist leer ohne Verteilungsfolgen', () => {
    expect(fuerEuch([ergebnis(partei(1), [ohne])])).toEqual({ verteilung: [] })
  })
})
