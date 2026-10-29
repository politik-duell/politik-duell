import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { beurteileFall, bilanz, type Ereignis, type Fall, gekippt, gleicheStelle, type LaufErgebnis, leseAblauf, pruefeFaelle } from './eval-e2e/auswertung'

const fall = (f: Partial<Fall> = {}): Fall => ({
  id: '30-test',
  skill: 'thema-erfassen',
  thema_id: 30,
  partei_id: 12,
  land: null,
  herkunft: 'Test',
  geprueft: null,
  erwartet: [
    { seite: 28, zitat: 'Wir wollen strengere Regulierungen und Altersgrenzen für Energy-Drinks und Alkohol.', ursachen_ids: [3003], wirksamkeit: 2, umsetzbarkeit: 3 },
    { seite: 46, zitat: 'Bei Cannabis wollen wir eine europarechtskonforme Legalisierung ermöglichen.', ursachen_ids: [3005], wirksamkeit: 2, umsetzbarkeit: 1 },
  ],
  verboten: [{ seite: 30, zitat: 'Zudem wollen wir die Suchtprävention stärken und ausbauen.', grund: 'verworfen' }],
  ...f,
})
const stelle = (seite: number, zitat: string, ursachen_ids: number[], wirksamkeit = 2, umsetzbarkeit = 3) => ({ seite, zitat, ursachen_ids, wirksamkeit, umsetzbarkeit })

describe('End-to-End-Eval (eval:e2e)', () => {
  it('gleiche Stelle: Seite ±1 und 60 % der Wörter des kürzeren Zitats', () => {
    const a = { seite: 28, zitat: 'Wir wollen strengere Regulierungen und Altersgrenzen für Energy-Drinks und Alkohol.' }
    expect(gleicheStelle(a, { seite: 29, zitat: 'strengere Regulierungen und Altersgrenzen für Energy-Drinks' })).toBe(true)
    expect(gleicheStelle(a, { seite: 30, zitat: a.zitat })).toBe(false)
    expect(gleicheStelle(a, { seite: 28, zitat: 'Wir wollen mehr Geld für Suchtberatung in den Kommunen.' })).toBe(false)
  })

  it('bestanden: alle Stellen gefunden, Werte in der Toleranz, Zusätzliches zählt nicht', () => {
    const u = beurteileFall(fall(), {
      erfasst: true,
      stellen: [
        stelle(28, 'strengere Regulierungen und Altersgrenzen für Energy-Drinks und Alkohol', [3003], 3, 2),
        stelle(46, 'Bei Cannabis wollen wir eine europarechtskonforme Legalisierung ermöglichen.', [3005], 1, 1),
        stelle(50, 'Glücksspielwerbung im Sport wird verboten.', [3004]),
      ],
    })
    expect(u.status).toBe('bestanden')
    expect(u.fundquote).toBe(1)
    expect(u.zusaetzlich).toHaveLength(1)
  })

  it('nicht bestanden: fehlende Stelle unter der Mindestquote, falsche Ursache, Werte außerhalb, verbotene Stelle', () => {
    expect(beurteileFall(fall(), { erfasst: true, stellen: [stelle(28, 'strengere Regulierungen und Altersgrenzen für Energy-Drinks', [3003])] }).fehlend).toHaveLength(1)
    const u = beurteileFall(fall(), {
      erfasst: true,
      stellen: [
        stelle(28, 'strengere Regulierungen und Altersgrenzen für Energy-Drinks', [3001]),
        stelle(46, 'europarechtskonforme Legalisierung bei Cannabis ermöglichen', [3005], 0, 3),
        stelle(30, 'Zudem wollen wir die Suchtprävention stärken und ausbauen.', [3001]),
      ],
    })
    expect(u.status).toBe('nicht_bestanden')
    expect(u.falsche_ursache.map((x) => x.seite)).toEqual([28])
    expect(u.bewertung_abweichend).toEqual([{ seite: 46, soll: '2×1', ist: '0×3' }])
    expect(u.verbotene.map((x) => x.seite)).toEqual([30])
  })

  it('Pflichtstelle fehlt → nicht bestanden, auch über der Mindestquote', () => {
    const f = fall()
    f.erwartet = [...f.erwartet, { ...f.erwartet[0], seite: 60, zitat: 'Glücksspielwerbung im Fernsehen und Internet verbieten wir.', pflicht: true }, { ...f.erwartet[0], seite: 70, zitat: 'Spielhallen brauchen größere Abstände zu Schulen und Kitas.' }]
    const u = beurteileFall(f, { erfasst: true, stellen: [stelle(28, f.erwartet[0].zitat, [3003]), stelle(46, f.erwartet[1].zitat, [3005], 2, 1), stelle(70, f.erwartet[3].zitat, [3003])] })
    expect(u.fundquote).toBe(0.75)
    expect(u.status).toBe('nicht_bestanden')
  })

  it('nicht erfasstes Programm zählt nicht als Fehlschlag; keine Maßnahme erwartet, aber erfasst → nicht bestanden', () => {
    expect(beurteileFall(fall(), { erfasst: false }).status).toBe('nicht_erfasst')
    const leer = fall({ erwartet: [], keine_massnahme: true })
    expect(beurteileFall(leer, { erfasst: true, stellen: [] }).status).toBe('bestanden')
    expect(beurteileFall(leer, { erfasst: true, stellen: [stelle(50, 'Glücksspielwerbung im Sport wird verboten.', [3004])] }).status).toBe('nicht_bestanden')
  })

  it('Ablauf aus dem Ereignisprotokoll: Agenten, Kosten, Verstöße der Koordination', () => {
    const werkzeug = (t: number, id: string, name: string, input: object, parent: string | null = null): Ereignis =>
      ({ t, type: 'assistant', parent_tool_use_id: parent, message: { content: [{ type: 'tool_use', id, name, input }] } })
    const a = leseAblauf([
      werkzeug(0, 'w1', 'Bash', { command: 'npm run -s entwurf:lauf -- vorab' }),
      werkzeug(1000, 'a1', 'Agent', { subagent_type: 'programm-erfassung', prompt: '…' }),
      werkzeug(5000, 'w2', 'Read', { file_path: '.cache/texte/abc.json' }, 'a1'),
      werkzeug(61000, 'a2', 'Agent', { subagent_type: 'blind-bewertung', model: 'sonnet' }),
      werkzeug(62000, 'w3', 'Read', { file_path: '/repo/.cache/texte/abc.json' }),
      werkzeug(70000, 'w4', 'Bash', { command: 'git commit -m x && git push -u origin x' }),
      { t: 71000, type: 'result', is_error: false, total_cost_usd: 3.5, num_turns: 40, modelUsage: { 'claude-haiku': { inputTokens: 10, outputTokens: 5, cacheReadInputTokens: 100 } }, permission_denials: [{ tool_name: 'Bash', tool_input: { command: 'rm -rf x' } }] },
    ])
    expect(a.agenten['programm-erfassung']).toEqual({ anzahl: 1, dauer_s: 4 })
    expect(a.agenten['blind-bewertung'].anzahl).toBe(1)
    expect(a.tokens).toEqual({ 'claude-haiku': 115 })
    expect(a.commit).toBe(true)
    expect(a.abgelehnt).toEqual(['Bash rm -rf x'])
    expect(a.fehler).toBe(false)
    // Lesen im Agenten ist erlaubt, in der Koordination nicht.
    expect(a.verstoesse).toHaveLength(3)
    expect(a.verstoesse.join('\n')).toMatch(/model=sonnet[\s\S]*liest Programmtext[\s\S]*git push/)
    expect(leseAblauf([]).abgeschlossen).toBe(false)
  })

  it('gekippte Fälle zwischen zwei Varianten (Mehrheit der Läufe)', () => {
    const lauf = (status: Record<string, 'bestanden' | 'nicht_bestanden' | 'nicht_erfasst'>): LaufErgebnis => ({
      lauf: 'x',
      ablauf: leseAblauf([]),
      faelle: Object.entries(status).map(([id, s]) => ({ ...beurteileFall(fall({ id }), { erfasst: false }), status: s })),
    })
    const a = bilanz([lauf({ f1: 'bestanden', f2: 'nicht_bestanden', f3: 'bestanden' }), lauf({ f1: 'bestanden', f2: 'bestanden', f3: 'nicht_erfasst' })])
    const b = bilanz([lauf({ f1: 'nicht_bestanden', f2: 'bestanden', f3: 'bestanden' }), lauf({ f1: 'bestanden', f2: 'bestanden', f3: 'bestanden' })])
    expect(a.find((x) => x.id === 'f3')).toMatchObject({ bestanden: 1, gewertet: 1, nicht_erfasst: 1 })
    expect(gekippt(a, b)).toEqual({ verloren: ['f1'], gewonnen: ['f2'] })
  })

  it('Goldfälle in evals/ende-zu-ende/faelle/ sind gültig', () => {
    const ordner = 'evals/ende-zu-ende/faelle'
    const faelle: Fall[] = readdirSync(ordner).map((f) => JSON.parse(readFileSync(join(ordner, f), 'utf8')))
    const themen = readdirSync('daten/themen').map((f) => JSON.parse(readFileSync(join('daten/themen', f), 'utf8')))
      .map((t) => ({ id: t.id, ursachen: t.ursachen.map((u: { id: number }) => u.id) }))
    const parteien = JSON.parse(readFileSync('daten/parteien.json', 'utf8')).parteien.map((p: { id: number }) => p.id)
    expect(faelle.length).toBeGreaterThanOrEqual(10)
    expect(pruefeFaelle(faelle, themen, parteien)).toEqual([])
    expect(pruefeFaelle([faelle[0], faelle[0]], themen, parteien)).toContain(`${faelle[0].id}: ID doppelt`)
  })
})
