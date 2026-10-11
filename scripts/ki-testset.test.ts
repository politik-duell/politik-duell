import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { beurteile, bilanz, type Fall, pruefeFaelle } from './ki-testset/auswertung.ts'
import { pruefeDatenordner } from './katalog-laden.ts'

const antwort = (typ: Fall['typ'], thema_id: number | null, ursachen_ids: number[], nachfrage: string | null = null) => ({
  typ, thema_id, ursachen_ids, nachfrage,
})
const fall: Fall = { id: 'x', text: 'x', typ: 'problem', thema: 2, ursachen: [201], auch: [205] }

describe('KI-Testset', () => {
  it('die Fälle passen zum Datenkatalog', () => {
    const { katalog } = pruefeDatenordner()
    const { faelle } = JSON.parse(readFileSync(new URL('ki-testset/faelle.json', import.meta.url), 'utf8'))
    expect(pruefeFaelle(faelle, katalog.themen, katalog.ursachen)).toEqual([])
  })

  it('meldet Fehler im Testset', () => {
    const themen = [{ id: 2 }]
    const ursachen = [{ id: 201, thema_id: 2 }, { id: 301, thema_id: 3 }]
    expect(pruefeFaelle([fall, { ...fall, ursachen: [301, 999], auch: [], thema: 4 }], themen, ursachen)).toEqual([
      'x: Ursache 205 gibt es nicht',
      'x: ID doppelt',
      'x: Thema 4 gibt es nicht',
      'x: Ursache 301 gehört nicht zu Thema 4',
      'x: Ursache 999 gibt es nicht',
    ])
    expect(pruefeFaelle([{ ...fall, ursachen: [], auch: [] }], themen, ursachen)).toEqual([
      'x: Problem mit Thema braucht Ursachen oder "rueckfrage": true',
    ])
  })

  it('beurteilt die Ursachen', () => {
    expect(beurteile(fall, antwort('problem', 2, [201])).ursachen).toBe('exakt')
    expect(beurteile(fall, antwort('problem', 2, [201, 205])).ok).toBe(true)
    expect(beurteile(fall, antwort('problem', 2, [201, 204])).ursachen).toBe('zu_viel')
    expect(beurteile(fall, antwort('problem', 2, [205])).ursachen).toBe('zu_wenig')
    expect(beurteile(fall, antwort('problem', 2, [204])).ursachen).toBe('falsch')
    expect(beurteile(fall, antwort('problem', 2, [], 'Was genau?')).ursachen).toBe('unnoetige_rueckfrage')
    expect(beurteile({ ...fall, ursachen: [], rueckfrage: true }, antwort('problem', 2, [], 'Was genau?')).ok).toBe(true)
    expect(beurteile({ ...fall, ursachen: [], rueckfrage: true }, antwort('problem', 2, [204])).ursachen).toBe('zu_viel')
  })

  it('beurteilt Typ und Thema und zieht Bilanz', () => {
    const falschesThema = beurteile(fall, antwort('problem', 3, [301]))
    expect(falschesThema).toEqual({ typ: true, thema: false, ursachen: null, ok: false })
    const forderung: Fall = { id: 'f', text: 'f', typ: 'forderung', thema: null, auch_thema: [11] }
    expect(beurteile(forderung, antwort('forderung', 11, [])).ok).toBe(true)
    expect(beurteile(forderung, antwort('problem', null, [])).ok).toBe(false)
    const b = bilanz([beurteile(fall, antwort('problem', 2, [201])), falschesThema])
    expect(b).toMatchObject({ faelle: 2, ok: 1, typ: 2, thema: 1, ursachen: { exakt: 1 } })
  })
})
