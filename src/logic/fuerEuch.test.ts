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
    rollen_modifikator: { mieter: { wert: 1, begruendung: 'senkt die Miete' }, eigentuemer: { wert: -1, begruendung: 'weniger Einnahmen' } },
    nebenwirkungen: [
      { bereich: 'verteilung', richtung: 'vorteil', text: 'Entlastet Haushalte mit wenig Einkommen.', quelle_url: 'https://q', belegstufe: 'A' },
      { bereich: 'haushalt', richtung: 'nachteil', text: 'Kostet Geld.', quelle_url: 'https://q', belegstufe: 'A' },
    ],
  })
  const ohne = massnahme(2)

  it('wendet jede Rolle auf die Maßnahmen beider Parteien an', () => {
    const f = fuerEuch([ergebnis(partei(1), [ohne]), ergebnis(partei(2), [miete])], ['mieter', 'eigentuemer'])
    expect(f.rollen).toHaveLength(2)
    expect(f.rollen[0]).toMatchObject({ seite: 0, rolle: 'mieter', folgen: [{ staerker: true, begruendung: 'senkt die Miete' }] })
    expect(f.rollen[0].folgen[0].partei.id).toBe(2)
    expect(f.rollen[1]).toMatchObject({ seite: 1, rolle: 'eigentuemer', folgen: [{ staerker: false }] })
  })

  it('zeigt Seiten ohne Rolle nicht und nur Folgen für die Verteilung, je Partei einmal', () => {
    const f = fuerEuch([ergebnis(partei(1), [miete, { ...miete, id: 3 }]), ergebnis(partei(2), [ohne])], [null, 'rentner'])
    expect(f.rollen).toEqual([{ seite: 1, rolle: 'rentner', folgen: [] }])
    expect(f.verteilung.map((v) => [v.partei.id, v.hinweis.text])).toEqual([[1, 'Entlastet Haushalte mit wenig Einkommen.']])
  })

  it('ist leer ohne Rollen und ohne Verteilungsfolgen', () => {
    expect(fuerEuch([ergebnis(partei(1), [ohne])], [null, null])).toEqual({ rollen: [], verteilung: [] })
  })
})
