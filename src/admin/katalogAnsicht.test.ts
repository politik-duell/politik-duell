import { describe, expect, it } from 'vitest'
import { alsDateien, ladeKatalog, pruefEinheiten, type Katalog } from '../data/katalog'
import { THEMEN } from '../pruefung/katalog'
import { hatLuecken, kennzahlen, programmstand, ursachenBaum } from './katalogAnsicht'

const [parteienDatei] = alsDateien(import.meta.glob('../../daten/parteien.json', { eager: true, import: 'default' }))
const gesamt = ladeKatalog(parteienDatei, alsDateien(import.meta.glob('../../daten/themen/*.json', { eager: true, import: 'default' })))

// Ein Thema mit Bundesprogramm-Eintrag, an dem sich die Fälle durchspielen lassen.
const a = gesamt.abdeckung.find((x) => !x.land && x.aktuell && gesamt.ursachen.filter((u) => u.thema_id === x.thema_id).length > 1)!
const ursachen = gesamt.ursachen.filter((u) => u.thema_id === a.thema_id)
const mit = (aenderung: Partial<Katalog>): Katalog => ({ ...gesamt, ...aenderung })

describe('Admin → Katalog', () => {
  it('der Index trägt für jedes Thema dieselben Kennzahlen wie der Gesamtkatalog', () => {
    for (const t of THEMEN) expect(t.kennzahlen).toEqual(kennzahlen(gesamt, t.id))
  })

  it('zählt Maßnahmen und Lösungswege wie die Prüfeinheiten', () => {
    for (const t of gesamt.themen) {
      const e = pruefEinheiten(gesamt, t.id)
      const z = kennzahlen(gesamt, t.id)
      expect(z.loesungswege).toBe(e.length)
      expect(z.massnahmen).toBe(e.flatMap((x) => x.massnahmen).length)
      expect(z.bundGeprueft).toBeLessThanOrEqual(z.bundErfasst)
    }
  })

  it('ein Programm ohne Eintrag fehlt, ein nicht ganz durchsuchtes gilt als teilweise', () => {
    expect(programmstand(gesamt, a.thema_id, a.partei_id, null).erfassung).toBe(a.art)
    const ohne = mit({ abdeckung: gesamt.abdeckung.filter((x) => x !== a) })
    expect(programmstand(ohne, a.thema_id, a.partei_id, null)).toEqual({ erfassung: 'fehlt', geprueft: false, ki_entwurf: false })
    const teils = mit({ abdeckung: gesamt.abdeckung.map((x) => (x === a ? { ...a, durchsucht_fuer: [ursachen[0].id] } : x)) })
    expect(programmstand(teils, a.thema_id, a.partei_id, null).erfassung).toBe('teilweise')
    expect(hatLuecken(kennzahlen(teils, a.thema_id), gesamt.parteien.length)).toBe(true)
  })

  it('im Land zählen nur Ursachen in Länderzuständigkeit', () => {
    const land = { ...a, land: 'ST', durchsucht_fuer: [ursachen[0].id] }
    const nurBund = ursachen.map((u, i) => ({ ...u, ebene: i === 0 ? ('land' as const) : ('bund' as const) }))
    const k = mit({
      abdeckung: [...gesamt.abdeckung, land],
      ursachen: [...gesamt.ursachen.filter((u) => u.thema_id !== a.thema_id), ...nurBund],
    })
    expect(programmstand(k, a.thema_id, a.partei_id, 'ST').erfassung).toBe(a.art)
  })

  it('Lösungswege je Ursache: nur passende Maßnahmen, absteigend nach Punkten; ohne Maßnahme leer', () => {
    for (const t of gesamt.themen)
      for (const { ursache, wege } of ursachenBaum(gesamt, t.id)) {
        for (const w of wege) expect(w.massnahmen.every((m) => m.ursachen_ids.includes(ursache.id))).toBe(true)
        expect(wege.map((w) => w.punkte)).toEqual(wege.map((w) => w.punkte).sort((x, y) => y - x))
      }
    const neu = { ...ursachen[0], id: 9999, beschreibung: 'Neue Ursache' }
    const k = mit({ ursachen: [...gesamt.ursachen, neu] })
    expect(ursachenBaum(k, a.thema_id).find((u) => u.ursache.id === 9999)?.wege).toEqual([])
    expect(kennzahlen(k, a.thema_id).ursachenOhneLoesungsweg).toBe(kennzahlen(gesamt, a.thema_id).ursachenOhneLoesungsweg + 1)
  })
})
