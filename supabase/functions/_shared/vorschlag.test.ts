import { describe, expect, it } from 'vitest'
import { bearbeiteVorschlag, VORSCHLAG_GLOBAL, VORSCHLAG_MAX, vorschlagSchluessel, type VorschlagSpeicher } from './vorschlag.ts'

const SITZUNG = '3f2b8c1e-4a5d-4e6f-9a7b-1c2d3e4f5a6b'

function speicher(limit = Infinity) {
  const gespeichert: string[] = []
  const zaehler = new Map<string, number>()
  const s: VorschlagSpeicher = {
    async imLimit(schluessel, max) {
      const n = (zaehler.get(schluessel) ?? 0) + 1
      zaehler.set(schluessel, n)
      return n <= Math.min(max, limit)
    },
    async speichern(text) {
      gespeichert.push(text)
    },
  }
  return { s, gespeichert, zaehler }
}

describe('Themenvorschläge', () => {
  it('speichert nur den bereinigten Text', async () => {
    const { s, gespeichert } = speicher()
    const r = await bearbeiteVorschlag({ sitzung: SITZUNG, text: '  Zu wenige\n Kinderärzte   auf dem Land ' }, s)
    expect(r).toEqual({ status: 200, body: { ok: true } })
    expect(gespeichert).toEqual(['Zu wenige Kinderärzte auf dem Land'])
  })

  it('lehnt ungültige Anfragen ab, ohne zu speichern', async () => {
    const { s, gespeichert } = speicher()
    for (const roh of [
      null,
      { text: 'Pflege' },
      { sitzung: 'abc', text: 'Pflege' },
      { sitzung: SITZUNG, text: 'ab' },
      { sitzung: SITZUNG, text: 'a'.repeat(VORSCHLAG_MAX + 1) },
      { sitzung: SITZUNG, text: 42 },
    ])
      expect((await bearbeiteVorschlag(roh, s)).status).toBe(400)
    expect(gespeichert).toEqual([])
  })

  it('nimmt Kontaktdaten, Namen und Beleidigungen nicht an', async () => {
    const { s, gespeichert } = speicher()
    for (const text of ['Schreibt mir: max@example.org', 'Herr Müller von nebenan', 'Diese Idioten im Amt'])
      expect(await bearbeiteVorschlag({ sitzung: SITZUNG, text }, s)).toMatchObject({ status: 400 })
    expect(gespeichert).toEqual([])
  })

  it('begrenzt je Sitzung mit eigenem Zähler und für alle zusammen', async () => {
    const { s, gespeichert, zaehler } = speicher(1)
    expect((await bearbeiteVorschlag({ sitzung: SITZUNG, text: 'Pflege' }, s)).status).toBe(200)
    expect((await bearbeiteVorschlag({ sitzung: SITZUNG, text: 'Pflege' }, s)).status).toBe(429)
    expect(gespeichert).toHaveLength(1)
    const schluessel = await vorschlagSchluessel(SITZUNG)
    expect(schluessel).not.toBe(SITZUNG)
    expect(schluessel).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect([...zaehler.keys()]).toEqual([schluessel, VORSCHLAG_GLOBAL])
    const andere = '3f2b8c1e-4a5d-4e6f-9a7b-1c2d3e4f5a6c'
    expect((await bearbeiteVorschlag({ sitzung: andere, text: 'Pflege' }, s)).status).toBe(503)
  })
})
