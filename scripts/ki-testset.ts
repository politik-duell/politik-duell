// KI-Testset: schickt feste Eingaben (scripts/ki-testset/faelle.json) mit demselben Prompt wie die Edge
// Function `analyse` an Mistral und misst, wie oft Typ, Thema und Ursachen stimmen. Prompt und Katalog
// kommen aus dem Arbeitsverzeichnis (daten/, supabase/functions/_shared/ki.ts) – so lässt sich eine
// Änderung messen, bevor sie live geht. Schreibt nichts in die Datenbank.
//
//   MISTRAL_API_KEY=… npm run ki:testset [-- --runden 3] [--nur id,id] [--json ergebnis.json]
//   MISTRAL_API_KEY=… npm run ki:testset -- --alltag [--themen 11,42]   – statt der festen Fälle die Alltagssätze aller
//                                                    Ursachen und Symptomgruppen: findet Themen, die dieselbe Lage beschreiben
//
// MISTRAL_MODEL wie in der Edge Function (Standard: mistral-medium-latest). Kostet echte KI-Aufrufe
// (je Fall und Runde einer, bei einem Problem mit Thema zwei) – nicht Teil der CI.
import { readFileSync, writeFileSync } from 'node:fs'
import { spielbareHaltungen } from '../src/data/katalog.ts'
import { vollstaendigeHaltungen } from '../supabase/functions/_shared/haltung.ts'
import { ordneEin, themenPrompt } from '../supabase/functions/_shared/ki.ts'
import { frageMistral, MISTRAL_STANDARDMODELL } from '../supabase/functions/_shared/mistral.ts'
import type { AnalyseAntwort } from '../supabase/functions/_shared/typen.ts'
import { alltagsFaelle, beurteile, bilanz, type Fall, pruefeFaelle, type Urteil } from './ki-testset/auswertung.ts'
import { pruefeDatenordner } from './katalog-laden.ts'

const GLEICHZEITIG = 4

function option(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

const key = process.env.MISTRAL_API_KEY
if (!key) {
  console.error('MISTRAL_API_KEY fehlt (derselbe Schlüssel wie in der Edge Function).')
  process.exit(1)
}
const modell = process.env.MISTRAL_MODEL || MISTRAL_STANDARDMODELL
const runden = Math.max(1, Number(option('runden') ?? 1))
const nur = option('nur')?.split(',')

const { katalog, fehler } = pruefeDatenordner()
if (fehler.length) {
  console.error(`Datenkatalog fehlerhaft (npm run daten:pruefen):\n${fehler.join('\n')}`)
  process.exit(1)
}
const nurThemen = option('themen')?.split(',').map(Number)
const alle = process.argv.includes('--alltag')
  ? alltagsFaelle(katalog.themen.filter((t) => !nurThemen || nurThemen.includes(t.id)), katalog.ursachen)
  : (JSON.parse(readFileSync(new URL('ki-testset/faelle.json', import.meta.url), 'utf8')) as { faelle: Fall[] }).faelle
const fallFehler = pruefeFaelle(alle, katalog.themen, katalog.ursachen)
if (fallFehler.length) {
  console.error(`Testset fehlerhaft:\n${fallFehler.join('\n')}`)
  process.exit(1)
}
const faelle = nur ? alle.filter((f) => nur.includes(f.id)) : alle

// Wie die Edge Function mit Zugang zur Testphase: Haltungen, für die alle Parteien eine Position haben.
const spielbar = spielbareHaltungen(katalog, true)
const haltungen = vollstaendigeHaltungen(spielbar.haltungen, spielbar.positionen, katalog.parteien).map(({ id, frage }) => ({ id, frage }))
// Nur für die Angabe der Promptlänge; den Ablauf (Schritt 1 und 2) macht ordneEin wie in der Edge Function.
const system = themenPrompt(katalog.themen, haltungen)

interface Lauf {
  fall: Fall
  runde: number
  antwort?: AnalyseAntwort
  /** Gründe, aus denen keine Ursache übernommen wurde (leer: sicher). */
  unsicher?: string[]
  fehler?: string
  urteil?: Urteil
}

/** Bei Rate-Limit (429) bis zu viermal mit wachsender Pause neu fragen – sonst fehlen ganze Runden in der Bilanz. */
async function mitWiederholung<T>(f: () => Promise<T>): Promise<T> {
  for (let versuch = 0; ; versuch++) {
    try {
      return await f()
    } catch (e) {
      if (versuch >= 4 || !(e instanceof Error) || !e.message.startsWith('Mistral 429')) throw e
      await new Promise((r) => setTimeout(r, 2000 * 2 ** versuch))
    }
  }
}

async function frage(fall: Fall, runde: number): Promise<Lauf> {
  const verlauf = [{ von: 'spieler' as const, text: fall.text }]
  try {
    const fragen = (s: string, n: Parameters<typeof frageMistral>[1]) => mitWiederholung(() => frageMistral(s, n, { key: key!, modell }))
    const { antwort, unsicher } = await ordneEin(fragen, verlauf, { ...katalog, haltungen }, () => 0)
    return { fall, runde, antwort, unsicher, urteil: beurteile(fall, antwort) }
  } catch (e) {
    return { fall, runde, fehler: e instanceof Error ? e.message : String(e) }
  }
}

const auftraege = Array.from({ length: runden }, (_, r) => faelle.map((f) => () => frage(f, r + 1))).flat()
const laeufe: Lauf[] = []
let naechster = 0
await Promise.all(
  Array.from({ length: GLEICHZEITIG }, async () => {
    while (naechster < auftraege.length) laeufe.push(await auftraege[naechster++]())
  }),
)
laeufe.sort((a, b) => a.runde - b.runde || alle.indexOf(a.fall) - alle.indexOf(b.fall))

const kurz = (a: AnalyseAntwort) =>
  `${a.typ} · Thema ${a.thema_id ?? '–'} · Ursachen [${a.ursachen_ids.join(', ')}]${a.nachfrage ? ' · Nachfrage' : ''}`
const soll = (f: Fall) =>
  `${f.typ} · Thema ${f.thema ?? '–'}${f.auch_thema ? `/${f.auch_thema.join('/')}` : ''} · Ursachen [${(f.ursachen ?? []).join(', ')}]` +
  `${f.auch?.length ? ` (+ erlaubt ${f.auch.join(', ')})` : ''}${f.rueckfrage ? ' · Nachfrage ok' : ''}`

console.log(`KI-Testset: ${faelle.length} Fälle × ${runden} Runde(n), Modell ${modell}, Prompt ${system.length} Zeichen\n`)
for (const l of laeufe.filter((x) => !x.urteil?.ok)) {
  console.log(`✗ ${l.fall.id}${runden > 1 ? ` (Runde ${l.runde})` : ''}: ${l.fehler ? 'keine Antwort' : (l.urteil?.ursachen ?? 'Typ/Thema')}`)
  console.log(`    soll: ${soll(l.fall)}`)
  console.log(`    ist:  ${l.antwort ? kurz(l.antwort) : `Fehler – ${l.fehler}`}${l.unsicher?.length ? ` · unsicher: ${l.unsicher.join(', ')}` : ''}`)
}
const urteile = laeufe.flatMap((l) => (l.urteil ? [l.urteil] : []))
const b = bilanz(urteile)
const fehlgeschlagen = laeufe.length - urteile.length
const p = (n: number, von: number) => `${n}/${von}`
console.log(`
Ergebnis (${laeufe.length} Anfragen${fehlgeschlagen ? `, ${fehlgeschlagen} ohne Antwort` : ''}):
  alles richtig        ${p(b.ok, b.faelle)}
  Typ richtig          ${p(b.typ, b.faelle)}
  Thema richtig        ${p(b.thema, b.faelle)}
  Ursachen exakt       ${p(b.ursachen.exakt + b.ursachen.rueckfrage, Object.values(b.ursachen).reduce((s, n) => s + n, 0))}
    zu viele           ${b.ursachen.zu_viel}
    zu wenige          ${b.ursachen.zu_wenig}
    falsche            ${b.ursachen.falsch}
    unnötig nachgefragt ${b.ursachen.unnoetige_rueckfrage}`)

const datei = option('json')
if (datei) {
  writeFileSync(datei, JSON.stringify({ modell, runden, bilanz: b, laeufe: laeufe.map(({ fall, ...l }) => ({ id: fall.id, ...l })) }, null, 1))
  console.log(`\nEinzelergebnisse: ${datei}`)
}
