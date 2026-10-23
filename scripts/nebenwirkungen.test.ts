import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NEBENWIRKUNG_BEREICHE } from '../src/data/types'
import { pruefeDatenordner } from './katalog-laden'
import {
  bilanz,
  nebenBlind,
  quellenDerAntworten,
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
  quellen: [],
})
const hinweis = (ueber: Partial<NebenHinweis> = {}): NebenHinweis => ({
  richtung: 'nachteil', text: 'Kostet den Haushalt rund 5 Mrd. Euro im Jahr.', quelle_url: 'https://www.destatis.de/a', belegstufe: 'A',
  beleg: 'Die Mindereinnahmen betragen rund fünf Milliarden Euro.', ...ueber,
})
const einheit = (id: number, hinweise: Partial<Record<string, NebenHinweis>> = {}) => ({
  id,
  bereiche: NEBENWIRKUNG_BEREICHE.map((bereich) => ({ bereich, gesucht: [`Weg ${id} ${bereich} Vorteil Nachteil`], hinweis: hinweise[bereich] ?? null })),
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
    // Schon verwendete Quellen des Themas gehen mit, je Adresse einmal, und ändern die Prüfsumme nicht.
    const quellen = listen[0].quellen.map((q) => q.quelle_url)
    expect(quellen.length).toBeGreaterThan(0)
    expect(new Set(quellen).size).toBe(quellen.length)
    expect(text).not.toMatch(/"beleg"/)
  })

  it('übernimmt Quellen beurteilter Antworten je Adresse einmal', () => {
    const a = antwort([einheit(1, { haushalt: hinweis() }), einheit(2, { haushalt: hinweis(), umwelt: hinweis({ quelle_url: 'https://www.uba.de/b' }) })])
    expect(quellenDerAntworten([a]).map((q) => `${q.bereich} ${q.quelle_url}`)).toEqual(['haushalt https://www.destatis.de/a', 'umwelt https://www.uba.de/b'])
  })

  it('nimmt eine vollständige Antwort an und zieht Bilanz', () => {
    expect(fehler(antwort())).toBe('')
    expect(bilanz(antwort())).toEqual(['1: haushalt −', '2: keine wesentlichen Folgen belegt'])
  })

  it('verlangt je Bereich eigene Suchanfragen', () => {
    const e = einheit(2)
    e.bereiche[0].gesucht = []
    expect(fehler(antwort([einheit(1), e]))).toMatch(/„gesucht“/)
    e.bereiche[0].gesucht = [...einheit(1).bereiche[0].gesucht]
    expect(fehler(antwort([einheit(1), e]))).toMatch(/haushalt: „gesucht“ gleich wie bei Lösungsweg 1/)
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

  it('lehnt ab, was die Koordination in den ersten Läufen verwerfen musste', () => {
    const in_ = (bereich: string, h: NebenHinweis) => fehler(antwort([einheit(1, { [bereich]: h }), einheit(2)]))
    expect(in_('umwelt', hinweis({ quelle_url: 'https://www.pharmazeutische-zeitung.de/a' }))).toMatch(/Presse oder Sekundärquelle/)
    expect(in_('umwelt', hinweis({ zweite_quelle_url: 'https://www.faz.net/b', belegstufe: 'C' }))).toMatch(/faz\.net ist Presse/)
    expect(in_('umwelt', hinweis({ quelle_url: 'https://dserver.bundestag.de/btd/21/1/1.pdf' }))).toMatch(/PDF mit Seite/)
    expect(in_('umwelt', hinweis({ quelle_url: 'https://dserver.bundestag.de/btd/21/1/1.pdf', beleg: 'Die Mindereinnahmen betragen rund fünf Mrd. Euro (S. 4).' }))).toBe('')
    expect(in_('haushalt', hinweis({ text: 'Kostet den Bund rund 300 Mio. Euro im Jahr.' }))).toMatch(/Milliardenbeträgen/)
    expect(in_('aufwand', hinweis({ text: 'Mehr Nachweispflichten für Betriebe.' }))).toMatch(/Größenordnung/)
    expect(in_('aufwand', hinweis({ text: 'Erfüllungsaufwand der Wirtschaft rund 40 Mio. Euro im Jahr.' }))).toBe('')
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
      nebenwirkungen: { geprueft: '2026-10-22', hinweise: [{ bereich: 'haushalt', richtung: 'nachteil', text: 'Kostet den Haushalt rund 5 Mrd. Euro im Jahr.', quelle_url: 'https://www.destatis.de/a', belegstufe: 'A' }], ki_entwurf: true },
    })
    expect(thema.instrumente[1].nebenwirkungen).toEqual({ geprueft: '2026-01-01', hinweise: [] })
    expect((thema.abdeckung[0].massnahmen[0] as Record<string, unknown>).nebenwirkungen).toMatchObject({ hinweise: [], ki_entwurf: true })
  })
})
