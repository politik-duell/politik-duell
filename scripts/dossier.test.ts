import { describe, expect, it } from 'vitest'
import { auftragMarkdown, type Ziel } from './entwurf/auftrag-lib'
import { extrahiereJson } from './entwurf/antwort'
import { analysiere, auszug, bereiche, bereichText, dossierMarkdown, eintraege, fundseiten, seitenJeUrsache } from './entwurf/dossier-lib'
import { begriffKern, begriffMarker, begriffQuelle, zaehle } from './entwurf/suche'

const SEITEN = [
  'Inhaltsverzeichnis',
  'Wir bauen Wohnungen. Die Auenlandschaft bleibt. Kommunen sollen helfen.',
  'Der Hitzeschutz in der Stadt wird gestärkt: mehr Stadtgrün, Entsiegelung und Schatten. Kommunen erhalten Geld.',
  'Kommunen planen. Der Hitzeschutz bleibt wichtig.',
  'Nur Kommunen.',
]

const BEGRIFFE = {
  '1803': { 'Stadtgrün und Entsiegelung': ['stadtgrün', 'entsiegel', 'schatten'], Hitzeschutz: ['hitzeschutz', 'kommunen'] },
  '1805': { Hochwasserschutz: ['=auen', 'deich'] },
}

describe('Begriffe mit Markierung', () => {
  it('trifft ohne Markierung auch mitten im Wort, mit ^ nur am Wortanfang, mit = nur als ganzes Wort', () => {
    const s = ['Wir bauen. Auen und Auenland. Eine Frau auenherum.']
    expect(zaehle(s, 'auen')).toBe(4)
    expect(zaehle(s, '^auen')).toBe(3)
    expect(zaehle(s, '=auen')).toBe(1)
    expect(begriffMarker('^auen')).toBe('^')
    expect(begriffMarker(' =auen')).toBe('=')
    expect(begriffKern('=auen')).toBe('auen')
    expect(begriffKern('auen')).toBe('auen')
  })

  it('findet zerlegte Wörter weiterhin und kombiniert Markierungen mit „oder“', () => {
    expect(zaehle(['Das ist unab - dingbar.'], 'unabdingbar')).toBe(1)
    expect(new RegExp([begriffQuelle('=auen'), begriffQuelle('deich')].join('|'), 'giu').test('Der Deich')).toBe(true)
  })
})

describe('Dossier', () => {
  const analyse = analysiere(SEITEN, eintraege(BEGRIFFE))

  it('zählt jeden Begriff in jedem Programm gleich und ordnet Seiten nach gleichzeitigen Richtungen', () => {
    const zaehler = Object.fromEntries(analyse.eintraege.map((e, j) => [e.begriff, analyse.treffer[j]]))
    expect(zaehler).toMatchObject({ stadtgrün: 1, entsiegel: 1, schatten: 1, hitzeschutz: 2, kommunen: 4, '=auen': 0, deich: 0 })
    const rang = fundseiten(analyse)
    expect(rang[0].seite).toBe(3)
    expect(rang[0].richtungen.size).toBe(2)
  })

  it('nimmt unspezifische Begriffe aus Rangliste und Fundstellen, zählt sie aber weiter', () => {
    const lang = Array.from({ length: 24 }, (_, i) => (i === 10 ? 'Stadtgrün, Entsiegelung und Schatten gegen Hitzeschutzprobleme.' : 'Kommunen sind zuständig.'))
    const a = analysiere(lang, eintraege(BEGRIFFE))
    expect(a.unspezifisch.has('kommunen')).toBe(true)
    expect(a.unspezifisch.has('schatten')).toBe(false)
    expect(a.treffer[a.eintraege.findIndex((e) => e.begriff === 'kommunen')]).toBe(23)
    // Seite 11: drei verschiedene Begriffe der Ursache 1803 (Kommunen zählt nicht mit).
    expect(seitenJeUrsache(a)).toEqual({ '1803': [11] })
    expect(fundseiten(a).map((f) => f.seite)).toEqual([11])
  })

  it('verlangt drei verschiedene Begriffe einer Ursache auf einer Seite für eine Fundstelle', () => {
    expect(seitenJeUrsache(analyse)).toEqual({ '1803': [3] })
    expect(seitenJeUrsache(analyse, 2)).toEqual({ '1803': [3, 4] })
    expect(seitenJeUrsache(analyse, 1)['1803']).toEqual([2, 3, 4, 5])
  })

  it('fasst Seiten zu Bereichen zusammen', () => {
    expect(bereichText(bereiche([24, 22, 23, 43, 45]))).toBe('22–24, 43–45')
    expect(bereichText(bereiche([24, 22, 23, 43, 45], 0))).toBe('22–24, 43, 45')
    expect(bereiche([])).toEqual([])
  })

  it('schneidet einen Ausschnitt um den Treffer', () => {
    const a = auszug('x'.repeat(300) + ' Hitzeschutz ' + 'y'.repeat(300), ['hitzeschutz'])
    expect(a.startsWith('…')).toBe(true)
    expect(a).toContain('«Hitzeschutz»')
    expect(a.endsWith('…')).toBe(true)
  })

  it('schreibt Leseplan, Seiten und Zähltabelle', () => {
    const md = dossierMarkdown({
      titel: 'Eins (Bund)',
      thema: '18 Hitze',
      ursachen: [
        { id: 1803, beschreibung: 'Städte heizen sich auf' },
        { id: 1805, beschreibung: 'Weiterbauen im Überschwemmungsgebiet' },
      ],
      suchbegriffe: BEGRIFFE,
      seiten: SEITEN,
      ohneText: [1],
    })
    expect(md).toMatch(/fast ohne Text[^\n]*: 1\./)
    expect(md).toMatch(/## Leseplan[^]*mindestens 2 Richtungen zugleich treffen; Nachbarseiten mitlesen: 3\n/)
    expect(md).toMatch(/### S\. 3 · 2 Richtungen/)
    expect(md).toMatch(/- Stadtgrün und Entsiegelung: stadtgrün 1; entsiegel 1; schatten 1/)
    expect(md).toMatch(/### Ursache 1803 – Städte heizen sich auf/)
    expect(md).toMatch(/- Hochwasserschutz: keine Treffer/)
  })

  it('nimmt ohne Seite mit zwei Richtungen die besten Seiten und sagt bei null Treffern, was zu tun ist', () => {
    const eine = { '1803': { Hitze: ['hitzeschutz'] } }
    const md = dossierMarkdown({ titel: 'Eins', thema: '18', ursachen: [], suchbegriffe: eine, seiten: ['Hitzeschutz hier.', 'Nichts.', 'Hitzeschutz dort.'], ohneText: [] })
    expect(md).toMatch(/Seiten mit den meisten Treffern; Nachbarseiten mitlesen: 1–3/)
    const leer = dossierMarkdown({ titel: 'Eins', thema: '18', ursachen: [], suchbegriffe: eine, seiten: ['Nichts.'], ohneText: [] })
    expect(leer).toMatch(/Keine Seite mit Treffern\. Inhaltsverzeichnis lesen/)
    expect(leer).not.toMatch(/## Seiten nach Treffern/)
  })

  it('zeigt höchstens die angegebene Zahl an Seiten und nennt den Rest', () => {
    const md = dossierMarkdown({ titel: 'Eins', thema: '18', ursachen: [], suchbegriffe: BEGRIFFE, seiten: SEITEN, ohneText: [], max: 1 })
    expect(md).toMatch(/Weitere Seiten mit Treffern: 2, 4–5|Weitere Seiten mit Treffern: 2, 4, 5/)
  })
})

describe('Antwort eines Agenten', () => {
  it('holt das erste vollständige JSON-Objekt und lässt Text davor und danach', () => {
    const r = extrahiereJson('Hier die Antwort:\n```json\n{"a": {"b": "}"}, "c": [1]}\n```\n**Protokoll** { nicht Teil }')
    expect(r).toMatchObject({ objekt: { a: { b: '}' }, c: [1] } })
    expect('rest' in r && r.rest).toMatch(/Protokoll/)
    expect(extrahiereJson('kein json')).toEqual({ fehler: 'Kein JSON-Objekt gefunden.' })
    expect(extrahiereJson('{"a": 1')).toMatchObject({ fehler: expect.stringMatching(/nicht abgeschlossen/) })
    expect(extrahiereJson('{a: 1}')).toMatchObject({ fehler: expect.stringMatching(/Kein gültiges JSON/) })
  })
})

describe('Auftragsdatei', () => {
  const ziel: Ziel = {
    url: 'https://eins.de/p.pdf',
    stand: '2026-03-01',
    parteiId: 1,
    partei: 'Eins',
    land: 'ST',
    name: 'Eins-ST',
    ursachen: [
      { id: 1803, thema_id: 18, beschreibung: 'Städte heizen sich auf', quelle_url: 'https://uba.de/a', ebene: 'land', abgrenzung: { zaehlt: ['Stadtgrün'], zaehlt_nicht: ['Allgemeiner Klimaschutz'] } },
    ],
  }
  const pfade = { basis: '.cache/entwurf/18', text: '.cache/entwurf/18/texte/Eins-ST.txt', dossier: '.cache/entwurf/18/dossier/Eins-ST.md', auftrag: '.cache/entwurf/18/auftraege/Eins-ST.md', protokoll: '.cache/entwurf/18/protokoll/erfassung-Eins-ST.txt' }

  it('enthält Ursachen der Ebene mit Abgrenzung, Regeln, Dossier und Zielpfad – aber keine Ergebnisse anderer Programme', () => {
    const md = auftragMarkdown({ thema: { id: 18, name: 'Hitze', ziel: 'Gesund bleiben.' }, ziel, pfade, regeln: ['Emissionsminderung zählt nur für 1801.'] })
    expect(md).toMatch(/# Auftrag: Eins \(ST\) – Thema 18 Hitze/)
    expect(md).toMatch(/Landesprogramm ST \(nur Ursachen mit Ebene „land“\)/)
    expect(md).toMatch(/\*\*1803\*\* \(land\): Städte heizen sich auf\n {2}- zählt: Stadtgrün\n {2}- zählt nicht: Allgemeiner Klimaschutz/)
    expect(md).toMatch(/Regeln dieser Erfassung[^]*Emissionsminderung zählt nur für 1801\./)
    expect(md).toContain('`.cache/entwurf/18/dossier/Eins-ST.md`')
    expect(md).toContain('`.cache/entwurf/18/protokoll/erfassung-Eins-ST.txt`')
    expect(md).toMatch(/Lies dazu keine weitere Datei: nicht `erfassung.json`/)
  })

  it('beschreibt eine Rückfrage mit Anlass, Seiten und neuem Zielpfad', () => {
    const md = auftragMarkdown({
      thema: { id: 18, name: 'Hitze' },
      ziel,
      pfade,
      regeln: [],
      rueckfrage: { nummer: 2, vorherige: '.cache/entwurf/18/protokoll/erfassung-Eins-ST-rueckfrage-1.txt', anlass: 'Zitat auf S. 5 ohne Einleitung', ursachen: [1803], seiten: '22–24' },
    })
    expect(md).toMatch(/# Rückfrage 2: Eins \(ST\)/)
    expect(md).toMatch(/Anlass: Zitat auf S\. 5 ohne Einleitung/)
    expect(md).toMatch(/Nur diese Ursachen nachlesen: 1803\./)
    expect(md).toMatch(/Seiten, die zu lesen sind: 22–24/)
    expect(md).toContain('erfassung-Eins-ST-rueckfrage-2.txt')
    expect(md).not.toMatch(/## Vorgehen/)
  })
})
