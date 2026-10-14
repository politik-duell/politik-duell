import { describe, expect, it } from 'vitest'
import { PARTEIEN, THEMEN, URSACHEN } from '../../../src/data/mock'
import {
  antwortAusAuswahl,
  belegPasstZuUrsache,
  gestuetzt,
  bereinigeAntwort,
  bereinigeInstrument,
  EingabeFehler,
  grenzeAntwort,
  instrumentNachrichten,
  instrumentPrompt,
  instrumenteZurAuswahl,
  mitInstrument,
  NACHFRAGE_BEISPIEL,
  NACHFRAGE_FORDERUNG,
  NACHFRAGE_URSACHE,
  nutzerNachrichten,
  ohneParteinamen,
  ordneEin,
  pruefeAnfrage,
  systemPrompt,
  themenPrompt,
  unsicherheit,
  ursachenPrompt,
} from './ki.ts'
import type { AnalyseAntwort, Nachricht, Thema, Ursache } from './typen.ts'

const spieler = (text: string): Nachricht => ({ von: 'spieler', text })
const ki = (text: string): Nachricht => ({ von: 'ki', text })
const bereinige = (roh: unknown, verlauf: Nachricht[] = [spieler('Test')]) =>
  bereinigeAntwort(roh, verlauf, THEMEN, URSACHEN)

describe('systemPrompt', () => {
  it('enthält den Katalog mit IDs, aber keine Links', () => {
    const p = systemPrompt(THEMEN, URSACHEN)
    expect(p).toContain('Thema 2: Miete')
    expect(p).toContain('Ursache 202')
    expect(p).not.toMatch(/https?:\/\//)
  })

  it('nennt zu jeder Ursache den Alltagssatz, wenn es ihn gibt', () => {
    const [u, v] = URSACHEN
    const p = systemPrompt(THEMEN, [
      { ...u, alltag: 'Ich finde keinen Termin' },
      { ...v, alltag: null },
    ])
    expect(p).toContain(`Ursache ${u.id}: ${u.beschreibung} – im Alltag: „Ich finde keinen Termin“`)
    expect(p).toContain(`Ursache ${v.id}: ${v.beschreibung}\n`)
    expect(p).toContain('auch wenn sie aus der Sicht anderer Beteiligter kommt')
  })

  it('behandelt Pauschalurteile über Gruppen wie Forderungen und trennt Gefühl von Erlebnis', () => {
    const p = systemPrompt(THEMEN, URSACHEN)
    expect(p).toContain('pauschales Urteil über eine Gruppe')
    expect(p).toContain('Widersprich nicht, belehre nicht')
    expect(p).toContain('Unterscheide Erlebnis und Gefühl')
    expect(p).toContain('"pauschal": true')
  })

  it('lässt Forderungen spiegeln und dem Thema zuordnen', () => {
    const p = systemPrompt(THEMEN, URSACHEN)
    expect(p).toContain('neutralen Halbsatz wieder')
    expect(p).toContain('Thema aus dem Katalog, zu dem die Forderung gehört')
  })

  it('verlangt bei Haltungen eine aufgreifende Rückmeldung ohne Zustimmung oder Widerspruch', () => {
    const p = systemPrompt(THEMEN, URSACHEN)
    expect(p).toContain('"rueckmeldung": string[] | null')
    expect(p).toContain('Stimme nicht zu und widersprich nicht')
    expect(p).toContain('Liste von drei Fassungen')
  })

  it('kennt die Grenze und grenzt sie vom Pauschalurteil ab', () => {
    const p = systemPrompt(THEMEN, URSACHEN)
    expect(p).toContain('"typ": "problem" | "forderung" | "wert" | "grenze"')
    expect(p).toContain('Menschenwürde oder gleiche Rechte abspricht, zu Gewalt aufruft')
    expect(p).toContain('gleich, aus welcher Richtung')
    expect(p).toContain('Im Zweifel: "forderung" mit "pauschal": true')
  })
})

describe('nutzerNachrichten', () => {
  it('verlangt nach zwei Nachfragen eine abschließende Einordnung', () => {
    const n = nutzerNachrichten([spieler('a'), ki('b'), spieler('c'), ki('d'), spieler('e')], 'mieter')
    expect(n[0].content).toContain('Mieter:in')
    expect(n[0].content).toContain('bereits zweimal')
    // Eine Forderung bleibt eine Forderung, sie wird nicht zum Problem umgedeutet.
    expect(n[0].content).toContain('als "forderung" ein')
    expect(n[0].content).toContain('"rueckmeldung"')
    expect(nutzerNachrichten([spieler('a'), ki('b'), spieler('c')], null)[0].content).toContain('frag anders als zuvor')
    expect(nutzerNachrichten([spieler('a')], null)[0].content).not.toContain('frag anders')
    expect(n.slice(1).map((x) => x.role)).toEqual(['user', 'assistant', 'user', 'assistant', 'user'])
  })
})

describe('bereinigeAntwort', () => {
  it('liefert ein kurzes Stichwort für die Wortwolke', () => {
    const a = bereinige({ typ: 'problem', thema_id: 2, ursachen_ids: [202], stichwort: '„Mieterhöhung“', zusammenfassung: 'Miete steigt.' })
    expect(a.stichwort).toBe('Mieterhöhung')
    const b = bereinige({ typ: 'problem', thema_id: 2, ursachen_ids: [202], zusammenfassung: 'Die Miete steigt stark an.' })
    expect(b.stichwort).toBe('Die Miete steigt')
  })

  const miete = [spieler('Meine Miete wird jedes Jahr erhöht, und eine neue Wohnung finde ich nicht.')]

  it('übernimmt eine gültige Zuordnung mit den Wörtern, die sie stützen', () => {
    const a = bereinige(
      { typ: 'problem', thema_id: 2, ursachen_ids: [202], ursachen_belege: { 202: 'Miete wird jedes Jahr erhöht' }, zusammenfassung: 'Miete steigt stark.' },
      miete,
    )
    expect(a).toMatchObject({ typ: 'problem', thema_id: 2, ursachen_ids: [202], ursachen_belege: { 202: 'Miete wird jedes Jahr erhöht' } })
  })

  it('verwirft Ursachen, die nicht zum Thema gehören', () => {
    const a = bereinige(
      { typ: 'problem', thema_id: 2, ursachen_ids: [202, 101, 999], ursachen_belege: { 202: 'Miete erhöht', 101: 'Miete', 999: 'Wohnung' }, zusammenfassung: 'x' },
      miete,
    )
    expect(a.ursachen_ids).toEqual([202])
  })

  it('verwirft Ursachen ohne Anhalt in der Schilderung (kein Beleg oder Wörter, die nicht gesagt wurden)', () => {
    const a = bereinige(
      { typ: 'problem', thema_id: 2, ursachen_ids: [201, 202, 203], ursachen_belege: { 202: 'Miete erhöht', 203: 'Baukosten steigen stark' }, zusammenfassung: 'x' },
      miete,
    )
    expect(a.ursachen_ids).toEqual([202])
    // Ohne gestützte Ursache: Nachfrage mit Ursachen zum Antippen statt vorsorglicher Zuordnung.
    const b = bereinige({ typ: 'problem', thema_id: 2, ursachen_ids: [201, 202], zusammenfassung: 'x' }, miete)
    expect(b).toMatchObject({ ursachen_ids: [], thema_id: 2, nachfrage: NACHFRAGE_URSACHE })
  })

  it('lässt dieselben Wörter nur eine Ursache stützen', () => {
    const a = bereinige(
      { typ: 'problem', thema_id: 2, ursachen_ids: [201, 202], ursachen_belege: { 201: 'neue Wohnung finde ich nicht', 202: 'Neue Wohnung finde ich nicht!' }, zusammenfassung: 'x' },
      miete,
    )
    expect(a.ursachen_ids).toEqual([201])
  })

  it('ordnet höchstens drei Ursachen zu, in der Reihenfolge der KI', () => {
    const text = 'Seit mein Vater im Heim ist, fehlt Personal, der Eigenanteil steigt, ich pflege die Mutter zu Hause und es werden immer mehr Pflegebedürftige.'
    const a = bereinige(
      {
        typ: 'problem', thema_id: 10, ursachen_ids: [1004, 1001, 1002, 1003],
        ursachen_belege: { 1001: 'fehlt Personal', 1002: 'Eigenanteil steigt', 1003: 'immer mehr Pflegebedürftige', 1004: 'pflege die Mutter zu Hause' },
        zusammenfassung: 'x',
      },
      [spieler(text)],
    )
    expect(a.ursachen_ids).toEqual([1004, 1001, 1002])
    expect(Object.keys(a.ursachen_belege!)).toHaveLength(3)
  })

  it('fragt nach, statt ohne erkennbare Ursache alle Ursachen zu werten', () => {
    const a = bereinige({ typ: 'problem', thema_id: 2, ursachen_ids: [101], nachfrage: 'Was genau?', zusammenfassung: 'x' })
    // Das Thema bleibt erhalten, damit die App dessen Ursachen zum Antippen anbieten kann.
    expect(a).toMatchObject({ typ: 'problem', nachfrage: 'Was genau?', thema_id: 2, ursachen_ids: [] })
    const b = bereinige({ typ: 'problem', thema_id: 2, zusammenfassung: 'x' })
    expect(b.nachfrage).toBe(NACHFRAGE_URSACHE)
  })

  it('wertet nach zwei Nachfragen ohne erkennbare Ursache nicht', () => {
    const verlauf = [spieler('a'), ki('?'), spieler('b'), ki('?'), spieler('c')]
    const a = bereinige({ typ: 'problem', thema_id: 2, nachfrage: 'Noch was?', zusammenfassung: 'x' }, verlauf)
    expect(a).toMatchObject({ typ: 'problem', nachfrage: null, thema_id: null, ursachen_ids: [] })
  })

  it('setzt unbekannte Themen auf ungeprüft', () => {
    const a = bereinige({ typ: 'problem', thema_id: 77, ursachen_ids: [1], zusammenfassung: 'Bus', einschaetzung: 'Takt' })
    expect(a).toMatchObject({ thema_id: null, ursachen_ids: [], einschaetzung: 'Takt' })
  })

  it('entfernt Links aus allen Texten', () => {
    const a = bereinige({ typ: 'problem', thema_id: null, zusammenfassung: 'Siehe https://x.de hier', einschaetzung: 'www.y.de' })
    expect(a.zusammenfassung).not.toContain('x.de')
    expect(a.einschaetzung).toBeNull()
  })

  it('erzwingt nach zwei Nachfragen keine dritte und deutet die Forderung nicht um', () => {
    const verlauf = [spieler('Weniger X'), ki('?'), spieler('Mehr Y'), ki('?'), spieler('Weniger Z')]
    const a = bereinige({ typ: 'forderung', nachfrage: 'Noch eine Frage?', thema_id: 2, zusammenfassung: 'z', einschaetzung: 'e' }, verlauf)
    expect(a).toMatchObject({ typ: 'forderung', nachfrage: null, thema_id: 2, ursachen_ids: [], einschaetzung: null })
  })

  it('behält bei einer Forderung das erkannte Thema, aber keine Ursachen', () => {
    const a = bereinige({ typ: 'forderung', nachfrage: 'Du willst X. Was soll sich ändern?', thema_id: 2, ursachen_ids: [202], zusammenfassung: 'x' })
    expect(a).toMatchObject({ typ: 'forderung', thema_id: 2, ursachen_ids: [] })
    expect(bereinige({ typ: 'forderung', thema_id: 77, zusammenfassung: 'x' }).thema_id).toBeNull()
  })

  it('bietet bei Pauschalurteilen kein Thema an', () => {
    const a = bereinige({ typ: 'forderung', pauschal: true, thema_id: 6, nachfrage: 'Was hast du erlebt?', zusammenfassung: 'x' })
    expect(a).toMatchObject({ typ: 'forderung', pauschal: true, thema_id: null })
    // „pauschal“ zählt nur bei Forderungen.
    expect(bereinige({ typ: 'wert', pauschal: true, zusammenfassung: 'x' }).pauschal).toBeUndefined()
  })

  it('übernimmt bei einer Grenze nichts aus der Antwort', () => {
    const leer = { typ: 'grenze', nachfrage: null, thema_id: null, ursachen_ids: [], zusammenfassung: '', stichwort: '', einschaetzung: null, rueckmeldung: null }
    const a = bereinige({
      typ: 'grenze',
      nachfrage: ['Was meinst du damit?'],
      rueckmeldung: ['Das sehen viele so.'],
      thema_id: 9,
      ursachen_ids: [901],
      instrument_id: 90,
      pauschal: true,
      zusammenfassung: 'Abwertende Aussage über eine Gruppe',
      stichwort: 'Gruppe',
      einschaetzung: 'e',
    })
    expect(a).toEqual(leer)
    // Auch nach zwei Nachfragen und ohne weitere Felder.
    const verlauf = [spieler('a'), ki('?'), spieler('b'), ki('?'), spieler('c')]
    expect(bereinige({ typ: 'grenze' }, verlauf)).toEqual(leer)
    // Ein Instrument hängt nie an einer Grenze.
    expect(mitInstrument(a, 90)).not.toHaveProperty('instrument_id')
  })

  it('macht aus unbekannten Typen keine Grenze', () => {
    expect(bereinige({ typ: 'GRENZE', thema_id: 2, ursachen_ids: [202], zusammenfassung: 'x' }).typ).toBe('problem')
  })

  it('übernimmt eine Rückmeldung zu Haltungen und abschließenden Forderungen', () => {
    const r = 'Heimat ist dir wichtig – darüber kann man verschieden denken. Wo begegnet dir das im Alltag?'
    expect(bereinige({ typ: 'wert', rueckmeldung: r, zusammenfassung: 'x' }).rueckmeldung).toBe(r)
    const verlauf = [spieler('Weniger X'), ki('?'), spieler('Mehr Y'), ki('?'), spieler('Weniger Z')]
    const f = bereinige({ typ: 'forderung', rueckmeldung: 'Du willst weniger X. Magst du ein Alltagsproblem nennen?', zusammenfassung: 'z' }, verlauf)
    expect(f.rueckmeldung).toBe('Du willst weniger X. Magst du ein Alltagsproblem nennen?')
  })

  it('verwirft die Rückmeldung, wo sie nicht passt oder unsicher ist', () => {
    const r = 'Das ist eine Haltung. Wo begegnet dir das?'
    // Bei offener Nachfrage, bei Problemen und bei Pauschalurteilen gibt es keine Rückmeldung.
    expect(bereinige({ typ: 'forderung', nachfrage: 'Was genau?', rueckmeldung: r, zusammenfassung: 'x' }).rueckmeldung).toBeNull()
    expect(bereinige({ typ: 'problem', thema_id: 2, ursachen_ids: [202], rueckmeldung: r, zusammenfassung: 'x' }).rueckmeldung).toBeUndefined()
    const verlauf = [spieler('a'), ki('?'), spieler('b'), ki('?'), spieler('c')]
    expect(bereinige({ typ: 'forderung', pauschal: true, rueckmeldung: r, zusammenfassung: 'x' }, verlauf).rueckmeldung).toBeNull()
    // Zu kurz, zu lang, mit Link-Rest oder Parteiname: fester Satz in der App.
    expect(bereinige({ typ: 'wert', rueckmeldung: 'Ok.', zusammenfassung: 'x' }).rueckmeldung).toBeNull()
    expect(bereinige({ typ: 'wert', rueckmeldung: 'a'.repeat(241), zusammenfassung: 'x' }).rueckmeldung).toBeNull()
    expect(bereinige({ typ: 'wert', zusammenfassung: 'x' }).rueckmeldung).toBeNull()
    const mitPartei = bereinigeAntwort({ typ: 'wert', rueckmeldung: 'Das sagt auch die Partei Alpha. Wo begegnet dir das?', zusammenfassung: 'x' }, [spieler('t')], THEMEN, URSACHEN, PARTEIEN)
    expect(mitPartei.rueckmeldung).toBeNull()
    const link = bereinige({ typ: 'wert', rueckmeldung: 'Mehr dazu auf https://example.org – wo begegnet dir das im Alltag?', zusammenfassung: 'x' })
    expect(link.rueckmeldung).not.toContain('example.org')
  })

  it('gibt bei Haltungen kein Thema weiter', () => {
    const a = bereinige({ typ: 'wert', thema_id: 2, ursachen_ids: [202], zusammenfassung: 'x' })
    expect(a).toMatchObject({ typ: 'wert', nachfrage: null, thema_id: null, ursachen_ids: [] })
  })

  it('ergänzt die Frage, wenn die KI eine Forderung nur wiedergibt', () => {
    const a = bereinige({ typ: 'forderung', nachfrage: 'Du möchtest, dass die Mieten sinken.', thema_id: 2, zusammenfassung: 'x' })
    expect(a.nachfrage).toBe(`Du möchtest, dass die Mieten sinken. ${NACHFRAGE_FORDERUNG}`)
    const b = bereinige({ typ: 'forderung', nachfrage: 'Du willst weniger Steuern. Was soll sich ändern?', zusammenfassung: 'x' })
    expect(b.nachfrage).toBe('Du willst weniger Steuern. Was soll sich ändern?')
  })

  it('wählt zufällig eine von mehreren Fassungen', () => {
    const fassungen = ['Was ändert sich für dich?', 'Wo merkst du das im Alltag?', 'Woran hakt es bei dir?']
    const roh = { typ: 'forderung', nachfrage: fassungen, thema_id: 2, zusammenfassung: 'x' }
    const mit = (z: number) => bereinigeAntwort(roh, [spieler('Test')], THEMEN, URSACHEN, [], () => z).nachfrage
    expect([mit(0), mit(0.5), mit(0.99)]).toEqual(fassungen)
    const r = ['Heimat ist dir wichtig. Wo begegnet dir das?', 'Dir liegt Heimat am Herzen. Woran merkst du das?']
    const w = (z: number) => bereinigeAntwort({ typ: 'wert', rueckmeldung: r, zusammenfassung: 'x' }, [spieler('t')], THEMEN, URSACHEN, [], () => z)
    expect([w(0).rueckmeldung, w(0.9).rueckmeldung]).toEqual(r)
  })

  it('nimmt unter den Fassungen nur brauchbare', () => {
    const verlauf = [spieler('a'), ki('Wo merkst du das im Alltag?'), spieler('b')]
    // Ohne Frage oder schon gestellt: nicht gewählt, solange es eine bessere Fassung gibt.
    const roh = { typ: 'forderung', nachfrage: ['Du willst X.', 'Wo merkst du das im Alltag?', 'Was soll sich ändern?'], zusammenfassung: 'x' }
    for (const z of [0, 0.5, 0.99]) {
      expect(bereinigeAntwort(roh, verlauf, THEMEN, URSACHEN, [], () => z).nachfrage).toBe('Was soll sich ändern?')
    }
    // Unbrauchbare Rückmeldungen fallen heraus; bleibt keine, gibt es den festen Satz (null).
    const r = { typ: 'wert', rueckmeldung: ['Ok.', 'Das sagt auch die Partei Alpha. Wo begegnet dir das?', 'Gerechtigkeit ist dir wichtig. Wo merkst du das?'], zusammenfassung: 'x' }
    expect(bereinigeAntwort(r, [spieler('t')], THEMEN, URSACHEN, PARTEIEN, () => 0).rueckmeldung).toBe('Gerechtigkeit ist dir wichtig. Wo merkst du das?')
    expect(bereinige({ typ: 'wert', rueckmeldung: ['Ok.', 'Na.'], zusammenfassung: 'x' }).rueckmeldung).toBeNull()
  })

  it('wiederholt eine Nachfrage nicht wörtlich', () => {
    const erste = `Du möchtest, dass die Mieten sinken. ${NACHFRAGE_FORDERUNG}`
    const verlauf = [spieler('Die Miete muss runter'), ki(erste), spieler('Die Miete muss runter')]
    const a = bereinige({ typ: 'forderung', nachfrage: erste, thema_id: 2, zusammenfassung: 'x' }, verlauf)
    expect(a.nachfrage).toBe(NACHFRAGE_BEISPIEL)
    // Auch eine ergänzte Frage zählt als Wiederholung, und bei Problemen gilt dasselbe.
    const b = bereinige({ typ: 'forderung', nachfrage: 'Du möchtest, dass die Mieten sinken.', zusammenfassung: 'x' }, verlauf)
    expect(b.nachfrage).toBe(NACHFRAGE_BEISPIEL)
    const c = bereinige({ typ: 'problem', thema_id: 2, nachfrage: NACHFRAGE_URSACHE, zusammenfassung: 'x' }, [spieler('a'), ki(NACHFRAGE_URSACHE), spieler('b')])
    expect(c.nachfrage).toBe(NACHFRAGE_BEISPIEL)
  })

  it('nimmt die Standardfrage, wenn eine Nachfrage zur Ursache keine Frage ist', () => {
    const a = bereinige({ typ: 'problem', thema_id: 2, nachfrage: 'Die Miete ist zu hoch.', zusammenfassung: 'x' })
    expect(a.nachfrage).toBe(NACHFRAGE_URSACHE)
  })

  it('ergänzt eine fehlende Nachfrage', () => {
    const a = bereinige({ typ: 'forderung', zusammenfassung: 'x' })
    expect(a.nachfrage).toBe('Was läuft in deinem Alltag konkret schief?')
  })

  it('kommt mit Müll zurecht', () => {
    const a = bereinige('kein json', [spieler('Mein Problem')])
    expect(a).toMatchObject({ typ: 'problem', thema_id: null, zusammenfassung: 'Mein Problem' })
  })
})

describe('pruefeAnfrage', () => {
  const gueltig = {
    sitzung: '0b5c1f3e-8d2a-4e7b-9c1d-2a3b4c5d6e7f',
    verlauf: [spieler('Mein Arzt hat keine Termine')],
    rolle: 'mieter',
    parteien: [1, 2],
  }

  it('akzeptiert eine gültige Anfrage', () => {
    expect(pruefeAnfrage(gueltig).rolle).toBe('mieter')
    expect(pruefeAnfrage(gueltig).land).toBeNull()
    expect(pruefeAnfrage({ ...gueltig, land: 'ST' }).land).toBe('ST')
    expect(pruefeAnfrage(gueltig).zugang).toBeNull()
    const zugang = 'a'.repeat(43)
    expect(pruefeAnfrage({ ...gueltig, zugang }).zugang).toBe(zugang)
  })

  it.each([
    ['ohne Sitzung', { ...gueltig, sitzung: 'x' }],
    ['feste Sitzung des globalen Limits', { ...gueltig, sitzung: '00000000-0000-0000-0000-000000000000' }],
    ['mit zu langem Text', { ...gueltig, verlauf: [spieler('a'.repeat(501))] }],
    ['mit KI als letzter Nachricht', { ...gueltig, verlauf: [spieler('a'), ki('b')] }],
    ['mit unbekannter Rolle', { ...gueltig, rolle: 'koenig' }],
    ['mit gleicher Partei', { ...gueltig, parteien: [1, 1] }],
    ['mit ungültigem Bundesland', { ...gueltig, land: 'Sachsen-Anhalt' }],
    ['mit ungültigem Zugang zur Testphase', { ...gueltig, zugang: 'geheim' }],
    ['mit zu langem Verlauf', { ...gueltig, verlauf: Array(7).fill(spieler('a')) }],
    ['ohne Verlauf und ohne Auswahl', { ...gueltig, verlauf: [] }],
    ['mit leerer Auswahl', { ...gueltig, auswahl: { thema_id: 2, ursachen_ids: [] } }],
    ['mit mehr als drei Ursachen', { ...gueltig, auswahl: { thema_id: 2, ursachen_ids: [201, 202, 203, 204] } }],
    ['mit doppelter Ursache', { ...gueltig, auswahl: { thema_id: 2, ursachen_ids: [202, 202] } }],
    ['mit Auswahl ohne Thema', { ...gueltig, auswahl: { ursachen_ids: [202] } }],
    ['mit Auswahl als Text', { ...gueltig, auswahl: { thema_id: 2, ursachen_ids: ['202'] } }],
    ['„Nichts davon passt“ mit Ursachen', { ...gueltig, auswahl: { thema_id: 2, ursachen_ids: [202], passt_nicht: true } }],
    ['„Nichts davon passt“ ohne Thema', { ...gueltig, auswahl: { ursachen_ids: [], passt_nicht: true } }],
  ])('lehnt Anfrage %s ab', (_, anfrage) => {
    expect(() => pruefeAnfrage(anfrage)).toThrow(EingabeFehler)
  })

  it('akzeptiert angetippte Ursachen ohne Verlauf', () => {
    const a = pruefeAnfrage({ ...gueltig, verlauf: [], auswahl: { thema_id: 2, ursachen_ids: [201, 202] } })
    expect(a.auswahl).toEqual({ thema_id: 2, ursachen_ids: [201, 202] })
    // Auch mit der Nachfrage der KI als letzter Nachricht.
    expect(pruefeAnfrage({ ...gueltig, verlauf: [spieler('a'), ki('b')], auswahl: { thema_id: 2, ursachen_ids: [202] } }).auswahl).toBeTruthy()
    expect(pruefeAnfrage(gueltig).auswahl).toBeNull()
  })

  it('akzeptiert „Nichts davon passt“ mit dem Gespräch (für die Durchsicht ohne Wertung)', () => {
    const a = pruefeAnfrage({ ...gueltig, verlauf: [spieler('a'), ki('b'), spieler('c')], auswahl: { thema_id: 2, ursachen_ids: [], passt_nicht: true } })
    expect(a.auswahl).toEqual({ thema_id: 2, ursachen_ids: [], passt_nicht: true })
    expect(a.verlauf).toHaveLength(3)
  })
})

describe('gestuetzt', () => {
  it('erkennt Wörter aus der Schilderung, auch gebeugt', () => {
    expect(gestuetzt('Miete wird jedes Jahr erhöht', ['Meine Miete erhöhen sie jedes Jahr.'])).toBe(true)
    expect(gestuetzt('Mieten steigen', ['Die Miete steigt.'])).toBe(true)
  })
  it('lehnt leere oder fremde Wörter ab', () => {
    expect(gestuetzt('', ['Miete'])).toBe(false)
    expect(gestuetzt('laufender Mietvertrag wird teurer', ['Ich suche eine Wohnung, alles ist zu teuer.'])).toBe(false)
  })
})

describe('antwortAusAuswahl', () => {
  it('beendet „Nichts davon passt“ ohne Wertung, mit Thema und ohne Text der Person', () => {
    const a = antwortAusAuswahl({ thema_id: 2, ursachen_ids: [], passt_nicht: true }, THEMEN, URSACHEN)
    expect(a).toMatchObject({ typ: 'problem', nachfrage: null, thema_id: 2, ursachen_ids: [], passt_nicht: true, stichwort: 'Miete' })
    expect(a.zusammenfassung).toBe('Keine passende Ursache im Thema „Miete“.')
    expect(() => antwortAusAuswahl({ thema_id: 99999, ursachen_ids: [], passt_nicht: true }, THEMEN, URSACHEN)).toThrow(EingabeFehler)
  })

  it('wertet die angetippten Ursachen wie eine Zuordnung der KI', () => {
    const a = antwortAusAuswahl({ thema_id: 2, ursachen_ids: [202, 201] }, THEMEN, URSACHEN)
    expect(a).toMatchObject({ typ: 'problem', nachfrage: null, thema_id: 2, ursachen_ids: [202, 201], einschaetzung: null })
  })

  it('zeigt den angetippten Satz aus dem Katalog, keinen Text der Person', () => {
    const satz = (id: number) => {
      const u = URSACHEN.find((x) => x.id === id)!
      return (u.alltag || u.beschreibung).replace(/[.!…]*$/, '')
    }
    const a = antwortAusAuswahl({ thema_id: 2, ursachen_ids: [202] }, THEMEN, URSACHEN)
    expect(a.zusammenfassung).toBe(`${satz(202)}.`)
    expect(a.stichwort).toBe('Miete')
    expect(antwortAusAuswahl({ thema_id: 2, ursachen_ids: [201, 202] }, THEMEN, URSACHEN).zusammenfassung).toBe(
      `${satz(201)}. ${satz(202)}.`.slice(0, 200),
    )
  })

  it('lehnt Ursachen eines anderen Themas und unbekannte Themen ab', () => {
    expect(() => antwortAusAuswahl({ thema_id: 2, ursachen_ids: [101] }, THEMEN, URSACHEN)).toThrow(EingabeFehler)
    expect(() => antwortAusAuswahl({ thema_id: 77, ursachen_ids: [202] }, THEMEN, URSACHEN)).toThrow(EingabeFehler)
  })
})

describe('ohneParteinamen', () => {
  const echt = [
    { name: 'BÜNDNIS 90/DIE GRÜNEN', kurzname: 'Grüne' },
    { name: 'Die Linke', kurzname: 'Linke' },
    { name: 'Christlich Demokratische Union', kurzname: 'CDU/CSU' },
  ]

  it.each([
    ['Die Grünen wollen mehr Radwege', '[Partei] wollen mehr Radwege'],
    ['Die CDU tut nichts gegen Mieten', '[Partei] tut nichts gegen Mieten'],
    ['Die Linke fordert einen Mietendeckel', '[Partei] fordert einen Mietendeckel'],
    ['Wie bei der CSU und der spd', 'Wie bei [Partei] und der spd'],
    ['Ich schreibe mit der linken Hand', 'Ich schreibe mit der linken Hand'],
    ['Die Wiese ist grün', 'Die Wiese ist grün'],
    ['Die CDUler im Süden', 'Die CDUler im Süden'],
  ])('%s → %s', (ein, aus) => {
    expect(ohneParteinamen(ein, echt)).toBe(aus)
  })

  it('erkennt vollen Namen vor Kurznamen', () => {
    expect(ohneParteinamen('Partei Alpha verspricht viel', PARTEIEN)).toBe('[Partei] verspricht viel')
  })
})

describe('bereinigeAntwort ohne Parteinamen', () => {
  it('entfernt Parteinamen aus Zusammenfassung, Einschätzung und Stichwort', () => {
    const a = bereinigeAntwort(
      {
        typ: 'problem',
        thema_id: null,
        zusammenfassung: 'Partei Beta kümmert sich nicht um Busse auf dem Land.',
        einschaetzung: 'Alpha und Gamma haben dazu Ideen.',
        stichwort: 'Beta Busverkehr',
      },
      [spieler('Bus fährt selten')],
      THEMEN,
      URSACHEN,
      PARTEIEN,
    )
    expect(a.zusammenfassung).toBe('[Partei] kümmert sich nicht um Busse auf dem Land.')
    expect(a.einschaetzung).toBe('[Partei] und [Partei] haben dazu Ideen.')
    expect(a.stichwort).toBe('Busverkehr')
  })

  it('nimmt die Zusammenfassung, wenn das Stichwort nur ein Parteiname ist', () => {
    const a = bereinigeAntwort(
      { typ: 'wert', zusammenfassung: 'Gerechtigkeit ist wichtig', stichwort: 'Epsilon' },
      [spieler('x')],
      THEMEN,
      URSACHEN,
      PARTEIEN,
    )
    expect(a.stichwort).toBe('Gerechtigkeit ist wichtig')
  })
})

describe('Forderung → Instrument (zweiter Aufruf)', () => {
  const instrumente = [
    { id: 90, thema_id: 2, name: 'Mietpreisbremse verlängern', ebene: 'bund' as const },
    { id: 91, thema_id: 2, name: 'Mietpreisbremse im Land verlängern', ebene: 'land' as const },
    { id: 92, thema_id: 2, name: 'Wohngeld erhöhen', ebene: 'bund' as const },
    { id: 120, thema_id: 3, name: 'Strompreis senken', ebene: 'bund' as const },
  ]
  const massnahmen = [
    { instrument_id: 90, land: null },
    { instrument_id: 91, land: 'ST' },
  ]

  it('bietet nur Instrumente des Themas an: Bund immer, Land nur im gewählten Bundesland', () => {
    const ids = (land: string | null) => instrumenteZurAuswahl(2, instrumente, massnahmen, land).map((i) => i.id)
    expect(ids(null)).toEqual([90, 92])
    expect(ids('ST')).toEqual([90, 91, 92])
    expect(ids('BE')).toEqual([90, 92])
    expect(instrumenteZurAuswahl(3, instrumente, massnahmen, 'ST').map((i) => i.id)).toEqual([120])
  })

  it('baut einen kurzen Prompt nur mit den Instrumenten des Themas, ohne Links und ohne Parteien', () => {
    const kandidaten = instrumenteZurAuswahl(2, instrumente, massnahmen, null)
    const p = instrumentPrompt({ id: 2, name: 'Miete' }, kandidaten)
    expect(p).toContain('Instrument 90: Mietpreisbremse verlängern')
    expect(p).toContain('Instrument 92: Wohngeld erhöhen')
    expect(p).not.toContain('Strompreis')
    expect(p).not.toContain('Instrument 91')
    expect(p).toContain('"instrument_id": null')
    expect(p).not.toMatch(/https?:\/\//)
    expect(p.length).toBeLessThan(systemPrompt(THEMEN, URSACHEN).length)
  })

  it('gibt dem zweiten Aufruf nur das Gespräch', () => {
    expect(instrumentNachrichten([spieler('Mietpreisbremse!'), ki('Was soll sich ändern?')])).toEqual([
      { role: 'user', content: 'Mietpreisbremse!' },
      { role: 'assistant', content: 'Was soll sich ändern?' },
    ])
  })

  it('übernimmt nur eine ID aus der Liste dieses Aufrufs', () => {
    const erlaubt = [{ id: 90 }, { id: 92 }]
    expect(bereinigeInstrument({ instrument_id: 90 }, erlaubt)).toBe(90)
    // Fremde (auch echte, aber nicht angebotene) und erfundene IDs, falsche Typen, Müll.
    expect(bereinigeInstrument({ instrument_id: 91 }, erlaubt)).toBeNull()
    expect(bereinigeInstrument({ instrument_id: 120 }, erlaubt)).toBeNull()
    expect(bereinigeInstrument({ instrument_id: 99999 }, erlaubt)).toBeNull()
    expect(bereinigeInstrument({ instrument_id: '90' }, erlaubt)).toBeNull()
    expect(bereinigeInstrument({ instrument_id: null }, erlaubt)).toBeNull()
    expect(bereinigeInstrument({}, erlaubt)).toBeNull()
    expect(bereinigeInstrument('90', erlaubt)).toBeNull()
    expect(bereinigeInstrument(null, erlaubt)).toBeNull()
  })

  it('hängt das Instrument nur an eine Forderung mit Thema, nie an Pauschalurteile, Probleme oder Haltungen', () => {
    const forderung: AnalyseAntwort = { typ: 'forderung', nachfrage: 'Was soll sich ändern?', thema_id: 2, ursachen_ids: [], zusammenfassung: 'x' }
    expect(mitInstrument(forderung, 90)).toMatchObject({ instrument_id: 90 })
    expect(mitInstrument(forderung, null)).toBe(forderung)
    expect(mitInstrument({ ...forderung, pauschal: true }, 90)).not.toHaveProperty('instrument_id')
    expect(mitInstrument({ ...forderung, thema_id: null }, 90)).not.toHaveProperty('instrument_id')
    expect(mitInstrument({ ...forderung, typ: 'problem' }, 90)).not.toHaveProperty('instrument_id')
    expect(mitInstrument({ ...forderung, typ: 'wert' }, 90)).not.toHaveProperty('instrument_id')
  })

  it('der erste Aufruf liefert noch kein Instrument – auch nicht, wenn die KI eins nennt', () => {
    const a = bereinige({ typ: 'forderung', nachfrage: 'Was soll sich ändern?', thema_id: 2, instrument_id: 90, ursachen_ids: [] })
    expect(a).toMatchObject({ typ: 'forderung', thema_id: 2 })
    expect(a).not.toHaveProperty('instrument_id')
  })
})

describe('Haltung → Wertfrage (Haltungskarte)', () => {
  const haltungen = [
    { id: 1, frage: 'Soll es ein generelles Tempolimit auf Autobahnen geben?' },
    { id: 2, frage: 'Soll Zuwanderung stärker begrenzt werden?' },
  ]
  const mitHaltungen = (roh: unknown, verlauf: Nachricht[] = [spieler('Test')]) =>
    bereinigeAntwort(roh, verlauf, THEMEN, URSACHEN, PARTEIEN, () => 0, haltungen)

  it('nennt die vollständigen Haltungen im Prompt – nur Nummer und Frage, ohne Parteien und Links', () => {
    const p = systemPrompt(THEMEN, URSACHEN, haltungen)
    expect(p).toContain('Haltung H1: Soll es ein generelles Tempolimit auf Autobahnen geben?')
    expect(p).toContain('Haltung H2: Soll Zuwanderung stärker begrenzt werden?')
    expect(p).toContain('"haltung_id": string | null')
    expect(p).toMatch(/Rate nicht/)
    // Ja/Nein auf eine erfasste Wertfrage ist eine Haltung, auch wenn die Frage nach einer Maßnahme klingt.
    expect(p).toContain('auch wenn die Frage nach einer Maßnahme klingt')
    // Ein kurzes „Ich bin für …“ zum Gegenstand der Frage genügt, ohne deren Einschränkungen.
    expect(p).toContain('Einschränkungen der Frage muss die Person nicht nennen')
    // Ein Reizwort allein ist keine Grenze – „gegen …“ ist eine Haltung.
    expect(p).toContain('nicht ein umstrittenes Wort darin')
    // Für oder Gegen den Gegenstand einer Wertfrage geht vor Forderung, auch bei Steuern.
    expect(p).toContain('Das hat Vorrang vor "forderung"')
    // Bei zwei passenden Fragen zählt der genannte Gegenstand.
    expect(p).toContain('Passen zwei Fragen, nimm die, deren Gegenstand die Person nennt')
    // Sorge zu Kriminalität und Herkunft ohne Abwertung ist ein Problem.
    expect(p).toContain('Kriminalität und Herkunft ohne Abwertung')
    expect(p).toContain('Wer berichtet, dass er selbst oder andere abgewertet, beleidigt oder angegriffen wurden')
    expect(p).toContain('Problem nennt, ist nie "wert"')
    expect(p).toContain('„Aussteigerprogramme fördern“ → Radikalisierung und Extremismus')
    // Auch fachlich formulierte Forderungen bekommen ein Thema.
    expect(p).toContain('Das gilt auch für fachlich oder allgemein formulierte Forderungen')
    expect(p).toContain('"thema_id" bei "problem" und "forderung"')
    expect(p).not.toMatch(/https?:\/\//)
    for (const partei of PARTEIEN) expect(p).not.toContain(partei.name)
  })

  it('lässt den Prompt ohne Haltungen unverändert', () => {
    expect(systemPrompt(THEMEN, URSACHEN, [])).toBe(systemPrompt(THEMEN, URSACHEN))
    expect(systemPrompt(THEMEN, URSACHEN)).not.toContain('haltung_id')
  })

  it('übernimmt eine Haltung nur bei „wert“ und nur aus der angebotenen Liste', () => {
    expect(mitHaltungen({ typ: 'wert', haltung_id: 1, zusammenfassung: 'Tempolimit' })).toMatchObject({ typ: 'wert', haltung_id: 1 })
    // Kennung wie im Prompt („H1“), damit die KI Haltungs- und Themennummern nicht verwechselt.
    expect(mitHaltungen({ typ: 'wert', haltung_id: 'H1', zusammenfassung: 'Tempolimit' })).toMatchObject({ typ: 'wert', haltung_id: 1 })
    for (const id of ['H3', 'H', 'h1', 'H1a']) expect(mitHaltungen({ typ: 'wert', haltung_id: id })).not.toHaveProperty('haltung_id')
    // Erfunden, nicht angeboten (etwa unvollständig), falscher Typ.
    for (const id of [3, 99999, '1', null]) expect(mitHaltungen({ typ: 'wert', haltung_id: id })).not.toHaveProperty('haltung_id')
    // Ohne Liste (Datenbank ohne Haltungen): nie.
    expect(bereinige({ typ: 'wert', haltung_id: 1 })).not.toHaveProperty('haltung_id')
  })

  it('hängt keine Haltung an Probleme, Forderungen, Pauschalurteile oder Grenzfälle', () => {
    const problem = mitHaltungen({ typ: 'problem', thema_id: 2, ursachen_ids: [201], haltung_id: 1, zusammenfassung: 'x' })
    expect(problem).not.toHaveProperty('haltung_id')
    const forderung = mitHaltungen({ typ: 'forderung', nachfrage: 'Was soll sich ändern?', thema_id: null, haltung_id: 1 })
    expect(forderung).not.toHaveProperty('haltung_id')
    const pauschal = mitHaltungen({ typ: 'forderung', pauschal: true, nachfrage: 'Was hast du erlebt?', haltung_id: 2 })
    expect(pauschal).not.toHaveProperty('haltung_id')
    expect(mitHaltungen({ typ: 'grenze', haltung_id: 2 })).toEqual(grenzeAntwort())
  })
})

// Zuordnung in zwei Schritten (docs/plan-zuordnung.md). Eigene Daten nach dem echten Katalog, damit die Fälle
// aus den Testpartien (Oktober 2026) nachvollziehbar bleiben.
const Z_THEMEN: Thema[] = [
  { id: 1, name: 'Arzttermine', beschreibung: 'Lange Wartezeiten und weite Wege zur ärztlichen Versorgung.' },
  { id: 8, name: 'Bus und Bahn', beschreibung: 'Schlechtes Angebot im öffentlichen Nahverkehr.' },
  { id: 14, name: 'Behördengänge', beschreibung: 'Lange Wartezeiten und komplizierte Verfahren bei Ämtern.' },
]
const Z_URSACHEN: Ursache[] = [
  { id: 101, thema_id: 1, beschreibung: 'Zu wenige Hausarztpraxen, besonders auf dem Land', quelle_url: 'https://example.org/1', alltag: 'Ich finde keine Hausarztpraxis in meiner Nähe, die noch neue Patienten nimmt' },
  { id: 102, thema_id: 1, beschreibung: 'Termine und Wege durch das Gesundheitssystem werden kaum gesteuert', quelle_url: 'https://example.org/2', alltag: 'Ich weiß nicht, wohin ich mich wenden soll, und lande bei Terminen und Wegen im Kreis' },
  { id: 801, thema_id: 8, beschreibung: 'Rund 21 Millionen Menschen fehlt ein gutes Grundangebot an Bus und Bahn', quelle_url: 'https://example.org/3', alltag: 'Bei mir fährt kaum ein Bus oder eine Bahn, ohne Auto komme ich nirgends hin' },
  { id: 1403, thema_id: 14, beschreibung: 'Behörden tauschen Daten kaum aus: Register sind nicht vernetzt', quelle_url: 'https://example.org/4', alltag: 'Ich muss dieselben Angaben und Nachweise bei jeder Behörde neu einreichen' },
  { id: 1404, thema_id: 14, beschreibung: 'Viele Vorschriften machen Verfahren kompliziert und langsam', quelle_url: 'https://example.org/5', alltag: 'Beim Amt gibt es so viele Vorschriften und Formulare, dass alles kompliziert und langsam ist' },
]
const ursache = (id: number) => Z_URSACHEN.find((u) => u.id === id)!

describe('themenPrompt (Schritt 1)', () => {
  it('nennt nur Themen, keine Ursachen, und fragt nach Sicherheit und mehreren Problemen', () => {
    const p = themenPrompt(Z_THEMEN)
    expect(p).toContain('Thema 14: Behördengänge')
    expect(p).not.toMatch(/Ursache \d/)
    expect(p).not.toContain('Register sind nicht vernetzt')
    for (const feld of ['"thema_sicher"', '"thema_kandidaten"', '"mehrere_probleme"']) expect(p).toContain(feld)
    expect(p).not.toContain('"ursachen_belege"')
  })

  it('ist viel kürzer als der bisherige Prompt mit allen Ursachen', () => {
    expect(themenPrompt(Z_THEMEN).length).toBeLessThan(systemPrompt(Z_THEMEN, Z_URSACHEN).length)
  })
})

describe('ursachenPrompt (Schritt 2)', () => {
  it('nennt nur die übergebenen Ursachen mit Alltagsfassung und fragt nach Sicherheit', () => {
    const p = ursachenPrompt(Z_THEMEN[2], Z_URSACHEN.filter((u) => u.thema_id === 14))
    expect(p).toContain('„Behördengänge“')
    expect(p).toContain('Ursache 1404: Viele Vorschriften')
    expect(p).toContain('im Alltag: „Beim Amt gibt es so viele Vorschriften und Formulare')
    expect(p).not.toContain('Ursache 101')
    expect(p).toContain('"sicher": boolean')
  })
})

describe('belegPasstZuUrsache', () => {
  it('erkennt Belege, die kein Wort mit der Ursache teilen (Fälle aus den Testpartien)', () => {
    expect(belegPasstZuUrsache('Bus fährt kaum', ursache(102))).toBe(false)
    expect(belegPasstZuUrsache('Formulare verstehe ich nicht', ursache(1403))).toBe(false)
  })

  it('lässt passende Belege durch, auch gebeugt und in Zusammensetzungen', () => {
    expect(belegPasstZuUrsache('Formulare verstehe ich nicht', ursache(1404))).toBe(true)
    expect(belegPasstZuUrsache('der nächste Hausarzt ist 15 Kilometer weg', ursache(101))).toBe(true)
    expect(belegPasstZuUrsache('Der Bus kommt nur zweimal', ursache(801))).toBe(false) // „Bus“ hat nur drei Buchstaben
    expect(belegPasstZuUrsache('ohne Auto komme ich nicht weg', ursache(801))).toBe(true)
    expect(belegPasstZuUrsache('am Hauptbahnhof', { beschreibung: 'Unsicher an Bahnhöfen', alltag: null })).toBe(true)
  })

  it('zählt Füllwörter nicht: „kaum“ allein trägt keine Ursache', () => {
    expect(belegPasstZuUrsache('kaum', ursache(102))).toBe(false)
    expect(belegPasstZuUrsache('', ursache(102))).toBe(false)
  })
})

describe('unsicherheit', () => {
  const sicher2 = { ursachen_ids: [1404], ursachen_belege: { 1404: 'so viele Formulare' }, sicher: true }
  const kandidaten = Z_URSACHEN.filter((u) => u.thema_id === 14)

  it('ist leer, wenn beide Schritte sicher sind und die Belege passen', () => {
    expect(unsicherheit({ thema_sicher: true, thema_kandidaten: [], mehrere_probleme: false }, sicher2, kandidaten)).toEqual([])
  })

  it('nennt jeden Grund einzeln', () => {
    expect(unsicherheit({ thema_sicher: false }, sicher2, kandidaten)).toEqual(['thema_unsicher'])
    expect(unsicherheit({ thema_kandidaten: [8] }, sicher2, kandidaten)).toEqual(['thema_kandidaten'])
    expect(unsicherheit({ thema_id: 14, mehrere_probleme: true, thema_kandidaten: [8] }, sicher2, kandidaten))
      .toEqual(['thema_kandidaten', 'mehrere_probleme'])
    expect(unsicherheit({}, { ...sicher2, sicher: false }, kandidaten)).toEqual(['ursachen_unsicher'])
    expect(unsicherheit({}, { ursachen_ids: [1403], ursachen_belege: { 1403: 'Formulare verstehe ich nicht' }, sicher: true }, kandidaten))
      .toEqual(['beleg_1403'])
  })

  it('zählt „mehrere Probleme“ und weitere Themen nur mit einem anderen Thema', () => {
    // Wartezeit und Formulare beim Amt sind ein Problem in einem Thema, auch wenn die KI „mehrere“ meldet.
    expect(unsicherheit({ thema_id: 14, mehrere_probleme: true, thema_kandidaten: [] }, sicher2, kandidaten)).toEqual([])
    expect(unsicherheit({ thema_id: 14, mehrere_probleme: true, thema_kandidaten: [14] }, sicher2, kandidaten)).toEqual([])
  })

  it('gilt als unsicher, wenn Schritt 2 nichts oder Unsinn liefert', () => {
    expect(unsicherheit({}, null, kandidaten)).toEqual(['ursachen_unsicher'])
    expect(unsicherheit({}, 'kein Objekt', kandidaten)).toEqual(['ursachen_unsicher'])
  })
})

describe('ordneEin', () => {
  type Aufruf = { system: string; nachrichten: { role: string; content: string }[] }
  /** Antwortet nacheinander mit den übergebenen rohen Antworten und merkt sich die Aufrufe. */
  const kiMit = (...antworten: unknown[]) => {
    const aufrufe: Aufruf[] = []
    const frage = async (system: string, nachrichten: Aufruf['nachrichten']) => {
      aufrufe.push({ system, nachrichten })
      const a = antworten[aufrufe.length - 1]
      if (a instanceof Error) throw a
      return a
    }
    return { frage, aufrufe }
  }
  const katalog = { themen: Z_THEMEN, ursachen: Z_URSACHEN }
  const amt = [spieler('Die Formulare beim Amt verstehe ich nicht, so viele Formulare.')]
  const schritt1 = { typ: 'problem', thema_id: 14, thema_sicher: true, thema_kandidaten: [], mehrere_probleme: false, nachfrage: null, zusammenfassung: 'Formulare beim Amt sind unverständlich.', stichwort: 'Formulare' }

  it('übernimmt sichere Ursachen aus Schritt 2 – Schritt 2 sieht nur die Ursachen des Themas', async () => {
    const { frage, aufrufe } = kiMit(schritt1, { ursachen_ids: [1404], ursachen_belege: { 1404: 'so viele Formulare' }, sicher: true })
    const { antwort, unsicher } = await ordneEin(frage, amt, null, katalog, () => 0)
    expect(unsicher).toEqual([])
    expect(antwort).toMatchObject({ typ: 'problem', thema_id: 14, ursachen_ids: [1404], nachfrage: null })
    expect(aufrufe).toHaveLength(2)
    expect(aufrufe[0].system).not.toMatch(/Ursache \d/)
    expect(aufrufe[1].system).toContain('Ursache 1404')
    expect(aufrufe[1].system).not.toContain('Ursache 101')
    expect(aufrufe[1].nachrichten).toEqual([{ role: 'user', content: amt[0].text }])
  })

  it('macht bei unpassendem Beleg eine Nachfrage mit Thema statt einer Wertung', async () => {
    const { frage } = kiMit(schritt1, { ursachen_ids: [1403], ursachen_belege: { 1403: 'Formulare beim Amt verstehe ich nicht' }, sicher: true })
    const { antwort, unsicher } = await ordneEin(frage, amt, null, katalog, () => 0)
    expect(unsicher).toEqual(['beleg_1403'])
    expect(antwort).toMatchObject({ typ: 'problem', thema_id: 14, ursachen_ids: [] })
    expect(antwort.nachfrage).toBeTruthy()
  })

  it('verwirft nur die Ursache mit unpassendem Beleg, wenn eine passende bleibt', async () => {
    const { frage } = kiMit(schritt1, {
      ursachen_ids: [1404, 1403],
      ursachen_belege: { 1404: 'so viele Formulare', 1403: 'Formulare beim Amt verstehe ich nicht' },
      sicher: true,
    })
    const { antwort, unsicher } = await ordneEin(frage, amt, null, katalog, () => 0)
    expect(unsicher).toEqual(['beleg_1403'])
    expect(antwort).toMatchObject({ thema_id: 14, ursachen_ids: [1404], nachfrage: null })
  })

  it('fragt bei mehreren Problemen nach und reicht die weiteren Themen weiter', async () => {
    const verlauf = [spieler('Der Hausarzt ist 15 Kilometer weg, und der Bus fährt kaum.')]
    const { frage } = kiMit(
      { ...schritt1, thema_id: 1, mehrere_probleme: true, thema_kandidaten: [8, 99], nachfrage: ['Welches Problem soll in dieser Runde zählen?'] },
      { ursachen_ids: [101], ursachen_belege: { 101: 'Hausarzt ist 15 Kilometer weg' }, sicher: true },
    )
    const { antwort, unsicher } = await ordneEin(frage, verlauf, null, katalog, () => 0)
    expect(unsicher).toEqual(['thema_kandidaten', 'mehrere_probleme'])
    expect(antwort).toMatchObject({ thema_id: 1, ursachen_ids: [], nachfrage: 'Welches Problem soll in dieser Runde zählen?', thema_kandidaten: [8] })
  })

  it('bleibt bei einem Fehler in Schritt 2 bei der Nachfrage, statt die Runde scheitern zu lassen', async () => {
    const { frage } = kiMit(schritt1, new Error('Mistral 503'))
    const { antwort, unsicher } = await ordneEin(frage, amt, null, katalog, () => 0)
    expect(unsicher).toContain('ursachen_keine_antwort')
    expect(antwort).toMatchObject({ thema_id: 14, ursachen_ids: [] })
  })

  it('braucht für Forderung, Haltung und Problem ohne Thema nur einen Aufruf', async () => {
    for (const r1 of [
      { typ: 'forderung', thema_id: 14, nachfrage: ['Du möchtest weniger Formulare. Was soll sich ändern?'], zusammenfassung: 'x' },
      { typ: 'wert', thema_id: null, zusammenfassung: 'x' },
      { typ: 'problem', thema_id: null, einschaetzung: 'Möglicher Grund …', zusammenfassung: 'x' },
    ]) {
      const { frage, aufrufe } = kiMit(r1)
      const { antwort, unsicher } = await ordneEin(frage, amt, null, katalog, () => 0)
      expect(aufrufe).toHaveLength(1)
      expect(unsicher).toEqual([])
      expect(antwort.ursachen_ids).toEqual([])
      expect(antwort.thema_kandidaten).toBeUndefined()
    }
  })

  it('übernimmt bei einer Forderung kein Thema, bei dem die KI selbst unsicher ist', async () => {
    const r1 = { typ: 'forderung', thema_id: 14, thema_sicher: false, nachfrage: ['Was soll sich dadurch ändern?'], zusammenfassung: 'x' }
    const { frage, aufrufe } = kiMit(r1)
    const { antwort, unsicher } = await ordneEin(frage, amt, null, katalog, () => 0)
    expect(aufrufe).toHaveLength(1)
    expect(unsicher).toEqual(['thema_unsicher'])
    expect(antwort).toMatchObject({ typ: 'forderung', thema_id: null })
    const sicher = await ordneEin(kiMit({ ...r1, thema_sicher: true }).frage, amt, null, katalog, () => 0)
    expect(sicher.antwort.thema_id).toBe(14)
  })

  it('übernimmt keine Ursachen, die Schritt 1 trotz Anweisung liefert', async () => {
    const { frage } = kiMit({ ...schritt1, ursachen_ids: [1404], ursachen_belege: { 1404: 'so viele Formulare' } }, { ursachen_ids: [], sicher: false })
    const { antwort } = await ordneEin(frage, amt, null, katalog, () => 0)
    expect(antwort.ursachen_ids).toEqual([])
  })
})
