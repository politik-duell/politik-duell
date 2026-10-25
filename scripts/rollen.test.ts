import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { pruefeDatenordner } from './katalog-laden'
import { TEIL_GROESSE } from './nebenwirkungen'
import {
  modifikatorenFuerKatalog,
  pruefeRollenAntwort,
  rollenBilanz,
  rollenBlind,
  rollenEintragen,
  ROLLEN_HILFE,
  type RollenAntwort,
  type RollenBlindliste,
  type RollenVorschlag,
} from './rollen'

const liste = (ids: number[] = [1, 2], ursache = (id: number) => id): RollenBlindliste => ({
  pruefsumme: 'abc', thema_id: 9, thema: 'Test', ziel: 'Ziel', ursachen: ['U'], teil: 1, teile: 1, rollen: ROLLEN_HILFE,
  einheiten: ids.map((id) => ({ id, name: `Weg ${id}`, ebene: 'bund', begruendung: 'Begründung', wirksamkeit: 2, ursache: ursache(id), vorhanden: [] })),
})
const vorschlag = (ueber: Partial<RollenVorschlag> = {}): RollenVorschlag => ({
  rolle: 'rentner', wert: 1, begruendung: 'Erhöht das Einkommen im Ruhestand direkt.', quelle_url: 'https://www.destatis.de/a', belegstufe: 'A',
  beleg: 'Die Anhebung kommt vor allem Rentnerinnen und Rentnern zugute.', ...ueber,
})
const antwort = (einheiten: RollenAntwort['einheiten'] = [
  { id: 1, gesucht: ['Weg 1 Rentner Verteilung'], modifikatoren: [vorschlag()] },
  { id: 2, gesucht: ['Weg 2 Rentner Wirkung'], modifikatoren: [] },
]): RollenAntwort => ({ pruefsumme: 'abc', einheiten })
const ctx = {
  parteinamen: [{ name: 'Partei Eins', kurzname: 'Eins' }],
  liste: JSON.parse(readFileSync(new URL('../daten/gesperrte-adressen.json', import.meta.url), 'utf8')),
  programmHosts: ['eins.de'],
}
const fehler = (a: RollenAntwort, l = liste()) => pruefeRollenAntwort(l, a, ctx).fehler.join('\n')

describe('Rollen-Modifikatoren: Recherche ohne Parteinamen', () => {
  it('teilt die offenen Lösungswege eines Themas ohne Parteibezug auf', () => {
    const { katalog } = pruefeDatenordner()
    const { listen, reste } = rollenBlind(katalog, 1)
    expect(reste).toEqual([])
    expect(listen.length).toBeGreaterThan(0)
    expect(listen.every((l) => l.einheiten.length <= TEIL_GROESSE)).toBe(true)
    const text = JSON.stringify(listen)
    for (const p of katalog.parteien) expect(text).not.toContain(p.programm_url)
    expect(text).not.toMatch(/partei_id|zitat|beleg_programm_url/)
    // Bearbeitete Wege fallen ohne --alle heraus.
    const erster = listen[0].einheiten[0].id
    expect(rollenBlind(katalog, 1, { erledigt: new Set([erster]) }).listen.flatMap((l) => l.einheiten.map((e) => e.id))).not.toContain(erster)
  })

  it('nimmt Wege mit Modifikator ohne Quelle nur mit --alle', () => {
    const { katalog } = pruefeDatenordner()
    const miete = katalog.themen.find((t) => t.name === 'Miete')!.id
    const mitMod = katalog.instrumente.filter((i) => i.thema_id === miete && i.rollen_modifikator && i.bewertungen === 0).map((i) => i.id)
    const ids = (alle: boolean) => rollenBlind(katalog, miete, { alle }).listen.flatMap((l) => l.einheiten.map((e) => e.id))
    if (mitMod.length) {
      expect(ids(false)).not.toContain(mitMod[0])
      expect(ids(true)).toContain(mitMod[0])
    }
  })

  it('nimmt eine belegte Antwort an', () => {
    expect(fehler(antwort())).toBe('')
    expect(rollenBilanz(antwort())).toEqual(['1: rentner +1 (A)', '2: keine Rolle nachweislich anders betroffen'])
  })

  it('verlangt Quelle, Beleg und gültige Werte', () => {
    const f = (m: Partial<RollenVorschlag>) => fehler(antwort([{ id: 1, gesucht: ['x y z'], modifikatoren: [vorschlag(m)] }, { id: 2, gesucht: ['a b c'], modifikatoren: [] }]))
    expect(f({ quelle_url: '' })).toMatch(/https-Adresse/)
    expect(f({ quelle_url: 'https://www.spiegel.de/a' })).toMatch(/Presse oder Sekundärquelle/)
    expect(f({ quelle_url: 'https://eins.de/programm' })).toMatch(/Parteiquelle/)
    expect(f({ wert: 0 })).toMatch(/nicht 0/)
    expect(f({ wert: 3 })).toMatch(/−2 bis 2/)
    expect(f({ wert: 2, belegstufe: 'C', zweite_quelle_url: 'https://www.destatis.de/b' })).toMatch(/±2 nur mit Belegstufe A oder B/)
    expect(f({ belegstufe: 'C' })).toMatch(/zweite_quelle_url/)
    expect(f({ rolle: 'pendler' as RollenVorschlag['rolle'] })).toMatch(/unbekannte Rolle/)
    expect(f({ beleg: 'kurz' })).toMatch(/wörtlich/)
    expect(f({ beleg: 'Die Anhebung kommt … vor allem Rentnern zugute.' })).toMatch(/zusammengesetzt/)
    expect(f({ quelle_url: 'https://www.destatis.de/a.pdf' })).toMatch(/mit Seite/)
    expect(f({ begruendung: 'Partei Eins will es so.' })).toMatch(/nennt eine Partei/)
    expect(f({ begruendung: 'Entlastet um 300 Euro im Jahr.' })).toMatch(/Zahl 300/)
  })

  it('verlangt jeden Weg genau einmal und eine Suche, wenn nichts vorhanden ist', () => {
    expect(fehler(antwort([{ id: 1, gesucht: ['x y z'], modifikatoren: [] }]))).toMatch(/Lösungsweg 2: fehlt/)
    expect(fehler(antwort([{ id: 1, gesucht: [], modifikatoren: [] }, { id: 2, gesucht: ['a b c'], modifikatoren: [] }]))).toMatch(/weder gesucht/)
    expect(fehler(antwort([{ id: 1, gesucht: ['x y z'], modifikatoren: [vorschlag(), vorschlag()] }, { id: 2, gesucht: ['a b c'], modifikatoren: [] }]))).toMatch(/doppelt/)
  })

  it('gleicht Suchen und geöffnete Quellen mit dem Transkript ab – vorhandene Quellen zählen ohne Öffnen', () => {
    const l = liste()
    l.einheiten[0].vorhanden = [{ art: 'studie', quelle_url: 'https://www.destatis.de/a' }]
    const w = { suchen: ['Weg 1 Rentner Verteilung'], adressen: [] }
    const f = pruefeRollenAntwort(l, antwort(), ctx, w).fehler.join('\n')
    expect(f).toMatch(/„Weg 2 Rentner Wirkung“/)
    expect(f).not.toMatch(/nicht selbst geöffnet/)
    const neu = antwort([{ id: 1, gesucht: [], modifikatoren: [vorschlag({ quelle_url: 'https://www.diw.de/x' })] }, { id: 2, gesucht: [], modifikatoren: [] }])
    expect(pruefeRollenAntwort(l, neu, ctx, { suchen: [], adressen: [] }).fehler.join('\n')).toMatch(/diw.de\/x nicht selbst geöffnet/)
  })

  it('warnt bei ungleichen Maßstäben für Wege zur selben Ursache', () => {
    const { warnungen } = pruefeRollenAntwort(liste([1, 2], () => 1), antwort(), ctx)
    expect(warnungen.join('\n')).toMatch(/Rolle rentner: .*ohne: 2/)
  })

  it('trägt als KI-Entwurf ohne Beleg ein und lässt geprüfte Modifikatoren stehen', () => {
    expect(modifikatorenFuerKatalog({ id: 1, gesucht: [], modifikatoren: [vorschlag({ rolle: 'rentner' }), vorschlag({ rolle: 'mieter', wert: -1 })] })).toEqual({
      mieter: { wert: -1, begruendung: vorschlag().begruendung, quelle_url: 'https://www.destatis.de/a', ki_entwurf: true },
      rentner: { wert: 1, begruendung: vorschlag().begruendung, quelle_url: 'https://www.destatis.de/a', ki_entwurf: true },
    })
    const thema = {
      instrumente: [
        { id: 1 },
        { id: 2, rollen_modifikator: { mieter: { wert: 1, begruendung: 'alt' } } },
        { id: 3, rollen_modifikator: { mieter: { wert: 1, begruendung: 'geprüft', quelle_url: 'https://www.destatis.de/c' } } },
      ],
      abdeckung: [{ massnahmen: [{ id: 4, instrument: 1 }] }],
    }
    const r = rollenEintragen(thema, [
      antwort([
        { id: 1, gesucht: [], modifikatoren: [vorschlag()] },
        { id: 2, gesucht: [], modifikatoren: [] },
        { id: 3, gesucht: [], modifikatoren: [] },
        { id: 4, gesucht: [], modifikatoren: [] },
      ]),
    ])
    expect(r).toEqual({ eingetragen: 1, entfernt: 1, fehlend: [4] })
    expect(thema.instrumente[0]).toMatchObject({ rollen_modifikator: { rentner: { ki_entwurf: true } } })
    expect(thema.instrumente[1]).not.toHaveProperty('rollen_modifikator')
    expect(thema.instrumente[2].rollen_modifikator!.mieter.begruendung).toBe('geprüft')
  })
})
