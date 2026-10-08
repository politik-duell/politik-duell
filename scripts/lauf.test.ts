import { describe, expect, it } from 'vitest'
import { leseArgumente, nachtragName, plane, type Thema } from './entwurf/lauf-plan'

const themen: Thema[] = [
  { pfad: '.cache/entwurf/38/erfassung.json', thema_id: 38 },
  { pfad: '.cache/entwurf/2/erfassung.json', thema_id: 2, nachtrag: 'Mieten deckeln' },
]
const zeilen = (s: Parameters<typeof plane>[0], o = { auswahl: [] as string[] }) => plane(s, themen, o).map((b) => `${b.skript} ${b.args.join(' ')}`.trim())

describe('Sammelbefehle (entwurf:lauf)', () => {
  it('prüft die Freigabe nur bei neuen Themen und gibt die Programmauswahl weiter', () => {
    expect(zeilen('vorab', { auswahl: ['--land', 'BE'] })).toEqual([
      'ursachen:freigegeben 38 --gegen HEAD',
      'entwurf:treffer .cache/entwurf/38/erfassung.json --vorab --land BE',
      'entwurf:treffer .cache/entwurf/2/erfassung.json --vorab --land BE',
    ])
  })

  it('legt bei mehreren Themen Sammelaufträge an, bei einem nicht', () => {
    expect(zeilen('auftraege').at(-1)).toBe('entwurf:sammelauftrag .cache/entwurf/38/erfassung.json .cache/entwurf/2/erfassung.json')
    expect(plane('auftraege', themen.slice(0, 1), { auswahl: [] }).map((b) => b.skript)).toEqual(['entwurf:auftrag'])
  })

  it('prüft alle Bewertungen, bevor das erste Thema eingetragen wird, und testet einmal am Ende', () => {
    const z = zeilen('bewertet')
    const ersteEintragung = z.findIndex((x) => x.startsWith('entwurf:eintragen'))
    expect(z.slice(0, ersteEintragung).filter((x) => x.startsWith('entwurf:bewertung-pruefen'))).toHaveLength(2)
    expect(z).toContain('entwurf:json .cache/entwurf/38/protokoll/bewertung-antwort.txt .cache/entwurf/38/bewertung.json')
    expect(z).toContain('entwurf:archivieren .cache/entwurf/2/erfassung.json --name nachtrag-mieten-deckeln')
    expect(z.filter((x) => x.startsWith('test'))).toEqual(['test --reporter=dot'])
    expect(z.at(-1)).toBe('test --reporter=dot')
    expect(plane('bewertet', themen, { auswahl: [], bewertungFertig: true }).some((b) => b.skript === 'entwurf:json')).toBe(false)
  })

  it('liest Schritt, Pfade und Optionen und lehnt Unpassendes ab', () => {
    expect(leseArgumente(['auftraege', 'a.json', 'b.json', '--land', 'BE', 'MV', '--lokal', 'pdf'])).toEqual({
      schritt: 'auftraege',
      pfade: ['a.json', 'b.json'],
      optionen: { auswahl: ['--land', 'BE', 'MV'], lokal: 'pdf', bewertungFertig: false },
    })
    expect(leseArgumente(['los', 'a.json'])).toHaveProperty('fehler')
    expect(leseArgumente(['blind'])).toHaveProperty('fehler')
    expect(leseArgumente(['blind', 'a.json', '--bund'])).toHaveProperty('fehler')
    expect(nachtragName('Wohngeld erhöhen, schnell!')).toBe('nachtrag-wohngeld-erhoehen-schnell')
  })
})
