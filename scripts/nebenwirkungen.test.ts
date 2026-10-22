import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NEBENWIRKUNG_BEREICHE } from '../src/data/types'
import { pruefeDatenordner } from './katalog-laden'
import {
  bilanz,
  nebenBlind,
  nebenwirkungenEintragen,
  pruefeNebenAntwort,
  TEIL_GROESSE,
  type NebenAntwort,
  type NebenBlindliste,
  type NebenHinweis,
} from './nebenwirkungen'

const liste = (ids: number[] = [1, 2]): NebenBlindliste => ({
  pruefsumme: 'abc', thema_id: 9, thema: 'Test', ziel: 'Ziel', ursachen: ['U'], teil: 1, teile: 1,
  einheiten: ids.map((id) => ({ id, name: `Weg ${id}`, ebene: 'bund', begruendung: 'Begründung' })),
  suchhilfe: {} as NebenBlindliste['suchhilfe'],
})
const hinweis = (ueber: Partial<NebenHinweis> = {}): NebenHinweis => ({
  richtung: 'nachteil', text: 'Kostet den Haushalt Geld.', quelle_url: 'https://www.destatis.de/a', belegstufe: 'A',
  beleg: 'Die Mindereinnahmen betragen rund fünf Milliarden Euro.', ...ueber,
})
const einheit = (id: number, hinweise: Partial<Record<string, NebenHinweis>> = {}) => ({
  id,
  bereiche: NEBENWIRKUNG_BEREICHE.map((bereich) => ({ bereich, gesucht_vorteil: [`${bereich} Vorteil`], gesucht_nachteil: [`${bereich} Nachteil`], hinweis: hinweise[bereich] ?? null })),
})
const antwort = (einheiten = [einheit(1, { haushalt: hinweis() }), einheit(2)]): NebenAntwort => ({ pruefsumme: 'abc', einheiten })
const ctx = {
  parteinamen: [{ name: 'Partei Eins', kurzname: 'Eins' }],
  liste: JSON.parse(readFileSync(new URL('../daten/gesperrte-adressen.json', import.meta.url), 'utf8')),
  programmHosts: ['eins.de'],
}
const fehler = (a: NebenAntwort, l = liste()) => pruefeNebenAntwort(l, a, ctx).fehler.join('\n')

describe('Nebenwirkungen: Recherche ohne Parteinamen', () => {
  it('teilt die offenen Lösungswege eines Themas ohne Parteibezug auf', () => {
    const { katalog } = pruefeDatenordner()
    const { listen, reste } = nebenBlind(katalog, 3, true)
    expect(reste).toEqual([])
    expect(listen.every((l) => l.einheiten.length <= TEIL_GROESSE)).toBe(true)
    const text = JSON.stringify(listen)
    for (const p of katalog.parteien) expect(text).not.toContain(p.programm_url)
    expect(text).not.toMatch(/partei_id|zitat|beleg_programm_url/)
    // Ohne --alle nur Wege ohne Hinweise: die aus dem Pilot fehlen.
    expect(nebenBlind(katalog, 3).listen.flatMap((l) => l.einheiten.map((e) => e.id))).not.toContain(6706)
  })

  it('nimmt eine vollständige Antwort an und zieht Bilanz', () => {
    expect(fehler(antwort())).toBe('')
    expect(bilanz(antwort())).toEqual(['1: haushalt −', '2: keine wesentlichen Folgen belegt'])
  })

  it('verlangt jeden Bereich in beide Richtungen gesucht', () => {
    const e = einheit(2)
    e.bereiche[0].gesucht_vorteil = []
    expect(fehler(antwort([einheit(1), e]))).toMatch(/„gesucht_vorteil“/)
    e.bereiche.pop()
    expect(fehler(antwort([einheit(1), e]))).toMatch(/Bereich „grundrechte“ fehlt/)
    expect(fehler(antwort([einheit(1)]))).toMatch(/Lösungsweg 2: fehlt/)
  })

  it('prüft Hinweise: Beleg, Belegstufe, Parteiquellen und -namen, Anzahl', () => {
    const mit = (h: NebenHinweis) => fehler(antwort([einheit(1, { umwelt: h }), einheit(2)]))
    expect(mit(hinweis({ beleg: 'kurz' }))).toMatch(/„beleg“/)
    expect(mit(hinweis({ belegstufe: 'C' }))).toMatch(/zweite_quelle_url/)
    expect(mit(hinweis({ quelle_url: 'https://www.spd.de/x' }))).toMatch(/Parteiquelle/)
    expect(mit(hinweis({ quelle_url: 'https://eins.de/programm.pdf' }))).toMatch(/Parteiquelle/)
    expect(mit(hinweis({ text: 'Partei Eins rechnet anders.' }))).toMatch(/nennt eine Partei/)
    const vier = einheit(1, { haushalt: hinweis(), wirtschaft: hinweis(), aufwand: hinweis(), umwelt: hinweis() })
    expect(fehler(antwort([vier, einheit(2)]))).toMatch(/höchstens 3/)
    expect(fehler({ ...antwort(), pruefsumme: 'alt' })).toMatch(/pruefsumme/)
  })

  it('warnt bei einseitiger Bilanz', () => {
    const nurNachteile = antwort([einheit(1, { haushalt: hinweis(), umwelt: hinweis() }), einheit(2, { haushalt: hinweis() })])
    expect(pruefeNebenAntwort(liste(), nurNachteile, ctx).warnungen.join()).toMatch(/einseitig/)
  })

  it('trägt ohne Beleg-Zitat ein und lässt geprüfte Hinweise stehen', () => {
    const thema = {
      instrumente: [{ id: 1 }, { id: 5, nebenwirkungen: { geprueft: '2026-01-01', hinweise: [] } }],
      abdeckung: [{ massnahmen: [{ id: 2 }, { id: 3, instrument: 1 }] }],
    }
    const { eingetragen, fehlend } = nebenwirkungenEintragen(thema, [{ pruefsumme: 'abc', einheiten: [einheit(1, { haushalt: hinweis() }), einheit(2), einheit(5), einheit(7)] }], '2026-10-22')
    expect([eingetragen, fehlend]).toEqual([2, [7]])
    expect(thema.instrumente[0]).toEqual({
      id: 1,
      nebenwirkungen: { geprueft: '2026-10-22', hinweise: [{ bereich: 'haushalt', richtung: 'nachteil', text: 'Kostet den Haushalt Geld.', quelle_url: 'https://www.destatis.de/a', belegstufe: 'A' }], ki_entwurf: true },
    })
    expect(thema.instrumente[1].nebenwirkungen).toEqual({ geprueft: '2026-01-01', hinweise: [] })
    expect((thema.abdeckung[0].massnahmen[0] as Record<string, unknown>).nebenwirkungen).toMatchObject({ hinweise: [], ki_entwurf: true })
  })
})
