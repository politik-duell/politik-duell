import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NEBENWIRKUNG_BEREICHE } from '../src/data/types'
import { pruefeDatenordner } from './katalog-laden'
import {
  belegSeite,
  bilanz,
  nebenBlind,
  quellenDerAntworten,
  nebenwirkungenEintragen,
  pruefeNebenAntwort,
  pruefeWerkzeuge,
  zahlenOhneBeleg,
  TEIL_GROESSE,
  teileNachUrsache,
  type NebenAntwort,
  type NebenBlindliste,
  type NebenHinweis,
} from './nebenwirkungen'
import { htmlText } from './nebenwirkungen/original'
import { werkzeugeAus, type Zeile } from './nebenwirkungen/transkript'

const liste = (ids: number[] = [1, 2], ursache = (id: number) => id): NebenBlindliste => ({
  pruefsumme: 'abc', thema_id: 9, thema: 'Test', ziel: 'Ziel', ursachen: ['U'], teil: 1, teile: 1,
  einheiten: ids.map((id) => ({ id, name: `Weg ${id}`, ebene: 'bund', begruendung: 'Begründung', ursache: ursache(id) })),
  suchhilfe: {} as NebenBlindliste['suchhilfe'],
  quellen: [],
})
const hinweis = (ueber: Partial<NebenHinweis> = {}): NebenHinweis => ({
  richtung: 'nachteil', text: 'Kostet den Haushalt rund 5 Mrd. Euro im Jahr.', quelle_url: 'https://www.destatis.de/a', belegstufe: 'A',
  beleg: 'Die Mindereinnahmen betragen rund 5 Milliarden Euro.', ...ueber,
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
    // Ursache als Nummer in `ursachen` (für gleiche Maßstäbe), ohne Kennung aus dem Katalog.
    expect(listen.flatMap((l) => l.einheiten).every((e) => e.ursache! >= 1 && e.ursache! <= listen[0].ursachen.length)).toBe(true)
  })

  it('legt Wege zur selben Ursache in denselben Teil', () => {
    const wege = (ursache: number, ...ids: number[]) => ids.map((id) => ({ id, ursache }))
    const teile = teileNachUrsache([...wege(1, 1, 2), ...wege(2, 3, 4, 5), ...wege(3, 6, 7, 8, 9, 10, 11), ...wege(4, 12), ...wege(5, ...Array.from({ length: 8 }, (_, i) => 20 + i))])
    expect(teile.map((t) => t.map((e) => e.id))).toEqual([[6, 7, 8, 9, 10, 11], [20, 21, 22, 23, 24, 25], [3, 4, 5, 1, 2, 12], [26, 27]])
    const { katalog } = pruefeDatenordner()
    const ids = nebenBlind(katalog, 11, true).listen.map((l) => l.einheiten.map((e) => e.id))
    // Die Steuer- und Abgabenwege (Ursache 1104) lagen im ersten Lauf auf zwei Teile verteilt.
    expect(ids.find((t) => t.includes(6884))).toEqual(expect.arrayContaining([6885, 6886, 6887, 6888, 6920]))
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
    expect(in_('umwelt', hinweis({ quelle_url: 'https://dserver.bundestag.de/btd/21/1/1.pdf', beleg: 'Die Mindereinnahmen betragen rund 5 Mrd. Euro (S. 4).' }))).toBe('')
    expect(in_('umwelt', hinweis({ beleg: 'einkommensschwache Haushalte [geben] mehr für Lebensmittel aus' }))).toMatch(/zusammengesetzt/)
    expect(in_('umwelt', hinweis({ beleg: 'Wirtschaft rund 432 000 Euro … Verwaltung Bund rund 1,3 Mio. Euro' }))).toMatch(/zusammengesetzt/)
    expect(in_('umwelt', hinweis({ beleg: '„… die Mindereinnahmen betragen rund 5 Milliarden Euro …“' }))).toBe('')
    expect(in_('umwelt', hinweis({ quelle_url: 'https://dserver.bundestag.de/btd/21/1/1.pdf', beleg: 'Die Mindereinnahmen betragen rund 5 Mrd. Euro … S. 4' }))).toBe('')
    expect(in_('haushalt', hinweis({ text: 'Kostet den Bund rund 300 Mio. Euro im Jahr.' }))).toMatch(/Milliardenbeträgen/)
    expect(in_('aufwand', hinweis({ text: 'Mehr Nachweispflichten für Betriebe.' }))).toMatch(/Größenordnung/)
    expect(in_('aufwand', hinweis({ text: 'Erfüllungsaufwand der Wirtschaft rund 40 Mio. Euro im Jahr.', beleg: 'Der Erfüllungsaufwand der Wirtschaft beträgt rund 40 Mio. Euro jährlich.' }))).toBe('')
  })

  it('verlangt bei Wegen zur selben Ursache ein Gegenstück oder einen Grund', () => {
    const gleich = liste([1, 2], () => 1)
    expect(fehler(antwort(), gleich)).toMatch(/Lösungsweg 2 › haushalt: Lösungsweg 1 \(gleiche Ursache\)/)
    const zwei = einheit(2)
    Object.assign(zwei.bereiche[0], { ohne: 'Aufkommen dieses Wegs nicht beziffert' })
    expect(fehler(antwort([einheit(1, { haushalt: hinweis() }), zwei]), gleich)).toBe('')
    expect(fehler(antwort([einheit(1, { haushalt: hinweis() }), einheit(2, { haushalt: hinweis({ richtung: 'vorteil' }) })]), gleich)).toBe('')
  })

  it('verlangt, dass Zahlen im Text im Beleg stehen', () => {
    expect(fehler(antwort([einheit(1, { haushalt: hinweis({ text: 'Kostet rund 5 Mrd. Euro, davon 3 Mrd. Euro beim Bund.' }) }), einheit(2)]))).toMatch(/Zahl 3 steht im Text, aber nicht im Beleg/)
    expect(zahlenOhneBeleg('Der CO2-Preis brachte 2025 rund 16 Mrd. Euro (Bundesverkehrswegeplan 2030).', 'Im Jahr 2025 lagen die Einnahmen bei rund 16 Milliarden Euro.')).toEqual({ zahlen: [], jahre: ['2030'] })
    expect(zahlenOhneBeleg('Rund 1.500 km und 25,6 %', 'über 1500 km, 25,6 Prozent')).toEqual({ zahlen: [], jahre: [] })
  })

  it('gleicht Suchen und Quellen mit dem Transkript ab', () => {
    const a = antwort()
    const gelaufen = { suchen: a.einheiten.flatMap((e) => e.bereiche.flatMap((b) => b.gesucht)), adressen: ['https://www.destatis.de/a/'] }
    expect(pruefeWerkzeuge(a, gelaufen)).toEqual([])
    expect(pruefeWerkzeuge(a, { ...gelaufen, suchen: gelaufen.suchen.slice(1) }).join()).toMatch(/1 › haushalt: „gesucht“ enthält nicht ausgeführte Suchen \(„Weg 1 haushalt/)
    expect(pruefeWerkzeuge(a, { ...gelaufen, adressen: ['https://www.bvai.de/a'] }).join()).toMatch(/destatis\.de\/a nicht selbst geöffnet/)
    expect(pruefeWerkzeuge(a, { ...gelaufen, suchen: gelaufen.suchen.slice(0, 3) }).join()).toMatch(/Nur 3 verschiedene Suchen für 2 Lösungswege – mindestens 2 je Weg/)
    // Mit Transkript darf dieselbe Suche für mehrere Wege stehen.
    const e = einheit(2)
    e.bereiche[0].gesucht = [...einheit(1).bereiche[0].gesucht]
    expect(pruefeNebenAntwort(liste(), antwort([einheit(1), e]), ctx, gelaufen).fehler).toEqual([])
    const zeilen: Zeile[] = [
      { type: 'assistant', message: { content: [
        { type: 'tool_use', name: 'WebSearch', input: { query: 'Grundsteuer Aufkommen' } },
        { type: 'tool_use', name: 'WebFetch', input: { url: 'https://www.destatis.de/a', prompt: 'x' } },
        { type: 'tool_use', name: 'Bash', input: { command: "npm run -s nebenwirkungen:pdf -- https://dserver.bundestag.de/btd/21/1/1.pdf 'Aufkommen Mrd'" } },
        { type: 'tool_use', name: 'Bash', input: { command: 'npm run -s nebenwirkungen:pdf -- https://www.bmf.de/b.pdf --seite 3' } },
      ] } },
    ]
    expect(werkzeugeAus(zeilen)).toEqual({
      suchen: ['Grundsteuer Aufkommen', 'Aufkommen Mrd'],
      adressen: ['https://www.destatis.de/a', 'https://dserver.bundestag.de/btd/21/1/1.pdf', 'https://www.bmf.de/b.pdf'],
    })
  })

  it('findet den Beleg im Originaltext', () => {
    const seiten = ['Vorwort', 'Die Ausweichreaktionen der Handelsteil- \nnehmer sind erheblich.  Das Aufkommen betrug 2024 „12,7 Milliarden“ Euro.']
    expect(belegSeite('Die Ausweichreaktionen der Handelsteil - nehmer sind erheblich. (S. 2)', seiten)).toBe(2)
    expect(belegSeite('… betrug 2024 "12,7 Milliarden" Euro.', seiten)).toBe(2)
    expect(belegSeite('Das Aufkommen betrug 2024 „12,7 Milliarden“ Euro. … S. 2', seiten)).toBe(2)
    expect(belegSeite('Das Aufkommen betrug 2024 rund 13 Milliarden Euro.', seiten)).toBe(0)
    expect(htmlText('<p>Grundsteuer&nbsp;B: 15,6&#160;Mrd.&nbsp;&euro;</p><script>x()</script>')).toBe('Grundsteuer B: 15,6 Mrd. €')
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
