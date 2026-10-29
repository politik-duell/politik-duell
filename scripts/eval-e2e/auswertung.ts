// Auswertung des End-to-End-Evals (npm run eval:e2e): Vergleicht das Ergebnis eines ganzen Skill-Laufs
// (/thema-erfassen) mit den Goldfällen in evals/ende-zu-ende/faelle/ und liest den Ablauf aus dem
// Ereignisprotokoll von `claude -p --output-format stream-json`. Reine Funktionen – ohne Netz und ohne KI testbar.

export interface GoldStelle {
  seite: number
  zitat: string
  ursachen_ids: number[]
  /** Blind vergebene Werte des Instruments; der Lauf darf je um höchstens TOLERANZ abweichen. */
  wirksamkeit?: number
  umsetzbarkeit?: number
  /** Muss jeder Lauf finden (sonst Fall nicht bestanden); sonst zählt die Stelle nur zur Fundquote. */
  pflicht?: boolean
}

export interface Fall {
  id: string
  skill: 'thema-erfassen'
  thema_id: number
  partei_id: number
  land: string | null
  herkunft: string
  /** Menschliche Durchsicht des Goldstandards; null = aus einem KI-Entwurf erzeugt, noch ungeprüft. */
  geprueft: { von: string; am: string } | null
  erwartet: GoldStelle[]
  /** Stellen, die nicht als Maßnahme zählen dürfen (z. B. von der Bewertung ohne Parteinamen verworfen). */
  verboten: { seite: number; zitat: string; grund: string }[]
  /** Programm enthält nach dem Goldstandard nichts zum Thema – jede Maßnahme ist zusätzlich. */
  keine_massnahme?: boolean
}

/** Maßnahme im Ergebnis eines Laufs, mit den Werten ihres Instruments. */
export interface LaufStelle {
  seite: number
  zitat: string
  ursachen_ids: number[]
  wirksamkeit?: number
  umsetzbarkeit?: number
}

/** Ergebnis eines Programms im Lauf: erfasst (auch „keine Maßnahme“) oder nicht erfasst. */
export type LaufProgramm = { erfasst: false } | { erfasst: true; stellen: LaufStelle[] }

export const MINDEST_FUNDQUOTE = 0.75
export const TOLERANZ = 1

const woerter = (t: string) => (t.replace(/\[…\]/g, ' ').toLowerCase().match(/[a-zäöüß0-9]+/g) ?? []).filter((w) => w.length > 2)

/**
 * Gleiche Stelle wie in den Vergleichstests (`thema-erfassen/evals/README.md`): Seite ±1 und mindestens 60 %
 * gemeinsame Wörter, bezogen auf das kürzere Zitat – zwei Zitate derselben Zusage mit verschiedenem Ausschnitt zählen.
 */
export function gleicheStelle(a: { seite: number; zitat: string }, b: { seite: number; zitat: string }): boolean {
  if (Math.abs(a.seite - b.seite) > 1) return false
  const wa = new Set(woerter(a.zitat))
  const wb = new Set(woerter(b.zitat))
  const [kurz, lang] = wa.size <= wb.size ? [wa, wb] : [wb, wa]
  if (!kurz.size) return false
  return [...kurz].filter((w) => lang.has(w)).length / kurz.size >= 0.6
}

export interface FallUrteil {
  id: string
  status: 'bestanden' | 'nicht_bestanden' | 'nicht_erfasst'
  gefunden: number
  erwartet: number
  fundquote: number
  fehlend: { seite: number; zitat: string; pflicht: boolean }[]
  /** Gefunden, aber keine gemeinsame Ursache mit dem Goldstandard. */
  falsche_ursache: { seite: number; soll: number[]; ist: number[] }[]
  /** Gefunden, aber Wirksamkeit oder Umsetzbarkeit weicht um mehr als TOLERANZ ab. */
  bewertung_abweichend: { seite: number; soll: string; ist: string }[]
  verbotene: { seite: number; zitat: string; grund: string }[]
  /** Weder erwartet noch verboten – zum Nachsehen, zählt nicht gegen den Fall. */
  zusaetzlich: { seite: number; zitat: string }[]
}

const kurzZitat = (z: string) => (z.length > 90 ? z.slice(0, 87) + '…' : z)

export function beurteileFall(f: Fall, p: LaufProgramm): FallUrteil {
  const leer = { gefunden: 0, erwartet: f.erwartet.length, fundquote: 0, fehlend: [], falsche_ursache: [], bewertung_abweichend: [], verbotene: [], zusaetzlich: [] }
  if (!p.erfasst) return { id: f.id, status: 'nicht_erfasst', ...leer }
  const u: FallUrteil = { id: f.id, status: 'bestanden', ...leer }
  const zugeordnet = new Set<number>()
  for (const g of f.erwartet) {
    const treffer = p.stellen.map((s, i) => [s, i] as const).filter(([s]) => gleicheStelle(g, s))
    if (!treffer.length) {
      u.fehlend.push({ seite: g.seite, zitat: kurzZitat(g.zitat), pflicht: !!g.pflicht })
      continue
    }
    u.gefunden++
    for (const [, i] of treffer) zugeordnet.add(i)
    // Eine der passenden Maßnahmen muss eine gemeinsame Ursache haben; die Werte zählen von dieser.
    const passend = treffer.find(([s]) => s.ursachen_ids.some((id) => g.ursachen_ids.includes(id)))?.[0]
    if (!passend) {
      u.falsche_ursache.push({ seite: g.seite, soll: g.ursachen_ids, ist: [...new Set(treffer.flatMap(([s]) => s.ursachen_ids))] })
      continue
    }
    const ab = (soll?: number, ist?: number) => soll !== undefined && ist !== undefined && Math.abs(soll - ist) > TOLERANZ
    if (ab(g.wirksamkeit, passend.wirksamkeit) || ab(g.umsetzbarkeit, passend.umsetzbarkeit))
      u.bewertung_abweichend.push({ seite: g.seite, soll: `${g.wirksamkeit}×${g.umsetzbarkeit}`, ist: `${passend.wirksamkeit}×${passend.umsetzbarkeit}` })
  }
  for (const [i, s] of p.stellen.entries()) {
    if (zugeordnet.has(i)) continue
    const v = f.verboten.find((x) => gleicheStelle(x, s))
    if (v) u.verbotene.push({ seite: s.seite, zitat: kurzZitat(s.zitat), grund: v.grund })
    else u.zusaetzlich.push({ seite: s.seite, zitat: kurzZitat(s.zitat) })
  }
  u.fundquote = f.erwartet.length ? u.gefunden / f.erwartet.length : 1
  const ok =
    u.fundquote >= MINDEST_FUNDQUOTE &&
    !u.fehlend.some((x) => x.pflicht) &&
    !u.falsche_ursache.length &&
    !u.bewertung_abweichend.length &&
    !u.verbotene.length &&
    !(f.keine_massnahme && p.stellen.length)
  u.status = ok ? 'bestanden' : 'nicht_bestanden'
  return u
}

/** Fehler in den Goldfällen selbst: doppelte IDs, unbekannte Themen oder Ursachen, Werte außerhalb 0–3. */
export function pruefeFaelle(faelle: Fall[], themen: { id: number; ursachen: number[] }[], parteien: number[]): string[] {
  const fehler: string[] = []
  const ids = new Set<string>()
  for (const f of faelle) {
    if (ids.has(f.id)) fehler.push(`${f.id}: ID doppelt`)
    ids.add(f.id)
    if (f.skill !== 'thema-erfassen') fehler.push(`${f.id}: skill „${f.skill}“ wird nicht ausgewertet`)
    const t = themen.find((x) => x.id === f.thema_id)
    if (!t) fehler.push(`${f.id}: Thema ${f.thema_id} unbekannt`)
    if (!parteien.includes(f.partei_id)) fehler.push(`${f.id}: Partei ${f.partei_id} unbekannt`)
    if (f.keine_massnahme && f.erwartet.length) fehler.push(`${f.id}: keine_massnahme, aber ${f.erwartet.length} erwartete Stellen`)
    if (f.geprueft && (!f.geprueft.von || !/^\d{4}-\d{2}-\d{2}$/.test(f.geprueft.am))) fehler.push(`${f.id}: geprueft braucht von und am (JJJJ-MM-TT)`)
    for (const s of [...f.erwartet, ...f.verboten]) {
      if (!Number.isInteger(s.seite) || s.seite < 1) fehler.push(`${f.id}: Seite ${s.seite} ungültig`)
      if (woerter(s.zitat).length < 3) fehler.push(`${f.id}, S. ${s.seite}: Zitat zu kurz für den Abgleich`)
    }
    for (const g of f.erwartet) {
      if (!g.ursachen_ids.length) fehler.push(`${f.id}, S. ${g.seite}: keine Ursache`)
      for (const id of g.ursachen_ids) if (t && !t.ursachen.includes(id)) fehler.push(`${f.id}, S. ${g.seite}: Ursache ${id} gehört nicht zu Thema ${f.thema_id}`)
      for (const w of [g.wirksamkeit, g.umsetzbarkeit]) if (w !== undefined && ![0, 1, 2, 3].includes(w)) fehler.push(`${f.id}, S. ${g.seite}: Wert ${w} nicht 0–3`)
    }
    for (const v of f.verboten) if (f.erwartet.some((g) => gleicheStelle(g, v))) fehler.push(`${f.id}, S. ${v.seite}: Stelle ist zugleich erwartet und verboten`)
  }
  return fehler
}

// ---------- Ablauf aus dem Ereignisprotokoll ----------

/** Eine Zeile von `ereignisse.jsonl`: Ereignis aus stream-json, ergänzt um `t` (ms seit Start des Laufs). */
export type Ereignis = { t: number; type: string; parent_tool_use_id?: string | null; [k: string]: unknown }

interface Werkzeug { id: string; name: string; input: Record<string, unknown>; parent: string | null; t: number }

export interface Ablauf {
  abgeschlossen: boolean
  fehler: boolean
  dauer_s: number
  kosten_usd: number | null
  zuege: number | null
  /** Tokens je Modell laut Abschluss (Ein- und Ausgabe, Cache mitgezählt). */
  tokens: Record<string, number>
  agenten: Record<string, { anzahl: number; dauer_s: number }>
  /** Regeln des Skills, die der Lauf verletzt hat. */
  verstoesse: string[]
  commit: boolean
}

function werkzeuge(ereignisse: Ereignis[]): Werkzeug[] {
  const w: Werkzeug[] = []
  for (const e of ereignisse) {
    if (e.type !== 'assistant') continue
    const inhalt = (e.message as { content?: unknown[] } | undefined)?.content ?? []
    for (const c of inhalt as { type: string; id: string; name: string; input: Record<string, unknown> }[])
      if (c.type === 'tool_use') w.push({ id: c.id, name: c.name, input: c.input ?? {}, parent: e.parent_tool_use_id ?? null, t: e.t })
  }
  return w
}

const PROGRAMMTEXT = /\.cache\/(texte|programme)\//

export function leseAblauf(ereignisse: Ereignis[]): Ablauf {
  const w = werkzeuge(ereignisse)
  const ergebnis = ereignisse.findLast((e) => e.type === 'result') as
    | (Ereignis & { is_error?: boolean; total_cost_usd?: number; num_turns?: number; modelUsage?: Record<string, Record<string, number>> })
    | undefined
  const tokens: Record<string, number> = {}
  for (const [modell, n] of Object.entries(ergebnis?.modelUsage ?? {}))
    tokens[modell] = (n.inputTokens ?? 0) + (n.outputTokens ?? 0) + (n.cacheReadInputTokens ?? 0) + (n.cacheCreationInputTokens ?? 0)

  const agenten: Ablauf['agenten'] = {}
  const verstoesse: string[] = []
  const haupt = w.filter((x) => x.parent === null)
  for (const a of haupt.filter((x) => x.name === 'Agent' || x.name === 'Task')) {
    const typ = String(a.input.subagent_type ?? 'general-purpose')
    const eigene = ereignisse.filter((e) => e.parent_tool_use_id === a.id)
    const ende = Math.max(a.t, ...eigene.map((e) => e.t))
    const z = (agenten[typ] ??= { anzahl: 0, dauer_s: 0 })
    z.anzahl++
    z.dauer_s += Math.round((ende - a.t) / 1000)
    if (a.input.model) verstoesse.push(`Agent ${typ} mit Parameter model=${a.input.model} (Skill: Modell aus der Agentenbeschreibung)`)
  }
  for (const x of haupt) {
    const ziel = JSON.stringify(x.input)
    if (['Read', 'Grep', 'Glob'].includes(x.name) && PROGRAMMTEXT.test(ziel)) verstoesse.push(`Koordination liest Programmtext (${x.name} ${ziel.slice(0, 80)})`)
  }
  for (const x of w) {
    const befehl = String(x.input.command ?? '')
    if (x.name === 'Bash' && /\bgit\s+push\b/.test(befehl)) verstoesse.push('git push im Eval-Lauf')
    if (/create_pull_request/.test(x.name)) verstoesse.push('Pull Request im Eval-Lauf')
  }
  return {
    abgeschlossen: !!ergebnis,
    fehler: !ergebnis || !!ergebnis.is_error,
    dauer_s: Math.round((ereignisse.at(-1)?.t ?? 0) / 1000),
    kosten_usd: ergebnis?.total_cost_usd ?? null,
    zuege: ergebnis?.num_turns ?? null,
    tokens,
    agenten,
    verstoesse,
    commit: w.some((x) => x.name === 'Bash' && /\bgit\s+commit\b/.test(String(x.input.command ?? ''))),
  }
}

// ---------- Zusammenfassen und vergleichen ----------

export interface LaufErgebnis {
  lauf: string
  faelle: FallUrteil[]
  ablauf: Ablauf
}

export interface FallBilanz {
  id: string
  bestanden: number
  gewertet: number
  nicht_erfasst: number
  fundquote: number
}

/** Je Fall über alle Läufe einer Variante: wie oft bestanden, mittlere Fundquote (nur erfasste Läufe). */
export function bilanz(laeufe: LaufErgebnis[]): FallBilanz[] {
  const ids = [...new Set(laeufe.flatMap((l) => l.faelle.map((f) => f.id)))].sort()
  return ids.map((id) => {
    const urteile = laeufe.flatMap((l) => l.faelle.filter((f) => f.id === id))
    const gewertet = urteile.filter((u) => u.status !== 'nicht_erfasst')
    return {
      id,
      bestanden: gewertet.filter((u) => u.status === 'bestanden').length,
      gewertet: gewertet.length,
      nicht_erfasst: urteile.length - gewertet.length,
      fundquote: gewertet.length ? gewertet.reduce((s, u) => s + u.fundquote, 0) / gewertet.length : 0,
    }
  })
}

/** Ein Fall gilt in einer Variante als bestanden, wenn er in mehr als der Hälfte der gewerteten Läufe bestand. */
const mehrheit = (b: FallBilanz) => b.gewertet > 0 && b.bestanden * 2 > b.gewertet

/**
 * Gekippte Fälle zwischen zwei Varianten: in A mehrheitlich bestanden, in B nicht (verloren) oder umgekehrt
 * (gewonnen). Der Artikel zum Einfalten von Subagenten: nicht nur den Gesamtwert vergleichen.
 */
export function gekippt(a: FallBilanz[], b: FallBilanz[]): { verloren: string[]; gewonnen: string[] } {
  const verloren: string[] = []
  const gewonnen: string[] = []
  for (const x of a) {
    const y = b.find((z) => z.id === x.id)
    if (!y || !x.gewertet || !y.gewertet) continue
    if (mehrheit(x) && !mehrheit(y)) verloren.push(x.id)
    if (!mehrheit(x) && mehrheit(y)) gewonnen.push(x.id)
  }
  return { verloren, gewonnen }
}

const mittel = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)
const prozent = (x: number) => `${Math.round(x * 100)} %`

export function bericht(variante: string, laeufe: LaufErgebnis[]): string {
  const b = bilanz(laeufe)
  const kosten = laeufe.map((l) => l.ablauf.kosten_usd).filter((k): k is number => k !== null)
  const tokens = laeufe.map((l) => Object.values(l.ablauf.tokens).reduce((s, n) => s + n, 0))
  const zeilen = b.map((x) => `| ${x.id} | ${x.bestanden}/${x.gewertet}${x.nicht_erfasst ? ` (${x.nicht_erfasst}× nicht erfasst)` : ''} | ${prozent(x.fundquote)} |`)
  const einzeln = laeufe.flatMap((l) =>
    l.faelle
      .filter((f) => f.status === 'nicht_bestanden')
      .map((f) => {
        const teile = [
          f.fehlend.length && `fehlt ${f.fehlend.map((x) => `S. ${x.seite}${x.pflicht ? ' (Pflicht)' : ''}`).join(', ')}`,
          f.falsche_ursache.length && `Ursache falsch ${f.falsche_ursache.map((x) => `S. ${x.seite}`).join(', ')}`,
          f.bewertung_abweichend.length && `Werte ${f.bewertung_abweichend.map((x) => `S. ${x.seite} ${x.soll}→${x.ist}`).join(', ')}`,
          f.verbotene.length && `verboten ${f.verbotene.map((x) => `S. ${x.seite}`).join(', ')}`,
        ].filter(Boolean)
        return `- ${l.lauf} · ${f.id}: ${teile.join('; ') || 'keine Maßnahme erwartet, aber erfasst'}`
      }),
  )
  const verstoesse = laeufe.flatMap((l) => l.ablauf.verstoesse.map((v) => `- ${l.lauf}: ${v}`))
  const agenten = [...new Set(laeufe.flatMap((l) => Object.keys(l.ablauf.agenten)))].sort()
    .map((typ) => `${typ} ${mittel(laeufe.map((l) => l.ablauf.agenten[typ]?.anzahl ?? 0)).toFixed(1)}`)
  return `## Variante ${variante} (${laeufe.length} ${laeufe.length === 1 ? 'Lauf' : 'Läufe'})

- Fälle mehrheitlich bestanden: ${b.filter(mehrheit).length} von ${b.filter((x) => x.gewertet).length}
- Fundquote im Mittel: ${prozent(mittel(b.filter((x) => x.gewertet).map((x) => x.fundquote)))}
- Läufe abgeschlossen: ${laeufe.filter((l) => !l.ablauf.fehler).length} von ${laeufe.length}, mit Commit: ${laeufe.filter((l) => l.ablauf.commit).length}
- Kosten je Lauf: ${kosten.length ? `${mittel(kosten).toFixed(2)} USD` : '–'} · Tokens je Lauf: ${Math.round(mittel(tokens)).toLocaleString('de-DE')} · Dauer je Lauf: ${Math.round(mittel(laeufe.map((l) => l.ablauf.dauer_s)) / 60)} min
- Agenten je Lauf: ${agenten.join(', ') || '–'}

| Fall | bestanden | Fundquote |
|---|---|---|
${zeilen.join('\n')}

### Nicht bestanden

${einzeln.join('\n') || 'keine'}

### Regelverstöße im Ablauf

${verstoesse.join('\n') || 'keine'}
`
}
