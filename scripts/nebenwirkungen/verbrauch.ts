// Misst den Tokenverbrauch von /nebenwirkungen-erfassen aus den Claude-Code-Transkripten: je Recherche-Agent
// (Teil), je Thema und für die Koordination im selben Zeitraum. Grundlage, um Skill und Agent zu verschlanken.
// Aufruf: npm run nebenwirkungen:verbrauch -- [Thema-ID …] [--transkripte <ordner>] [--speichern]
//   --speichern legt je Thema verbrauch.json im jüngsten Protokollordner daten/protokolle/nebenwirkungen-<ID>/<Datum>/ ab.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AUFTRAG, lies, TRANSKRIPTE, werkzeugAufrufe, type Zeile } from './transkript.ts'

type Tokens = { eingabe: number; cache_schreiben: number; cache_lesen: number; ausgabe: number }
type Agent = {
  thema: number
  teil: number
  runden: number
  anfragen: number
  fortsetzungen: number
  websuchen: number
  abrufe: number
  werkzeuge: number
  limitabbrueche: number
  tokens: Tokens
  nacharbeit: Tokens
  start: string
  ende: string
}

const args = process.argv.slice(2)
const nimm = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args.splice(i, 2)[1] : undefined
}
const speichern = args.includes('--speichern') && args.splice(args.indexOf('--speichern'), 1).length > 0
const wurzel = fileURLToPath(new URL('../../', import.meta.url))
const ordner = nimm('--transkripte') ?? TRANSKRIPTE
const themen = new Set(args.map(Number).filter(Number.isInteger))

const leer = (): Tokens => ({ eingabe: 0, cache_schreiben: 0, cache_lesen: 0, ausgabe: 0 })
const addiere = (z: Tokens, u: Record<string, number>) => {
  z.eingabe += u.input_tokens ?? 0
  z.cache_schreiben += u.cache_creation_input_tokens ?? 0
  z.cache_lesen += u.cache_read_input_tokens ?? 0
  z.ausgabe += u.output_tokens ?? 0
}
const summe = (ts: Tokens[]) => ts.reduce((z, t) => (addiere(z, { input_tokens: t.eingabe, cache_creation_input_tokens: t.cache_schreiben, cache_read_input_tokens: t.cache_lesen, output_tokens: t.ausgabe }), z), leer())
// Gestreamte Antworten stehen in mehreren Zeilen mit derselben Nachrichten-ID; Verbrauch nur einmal zählen.
const verbrauch = (zeilen: Zeile[], von = '', bis = '￿') => {
  const t = leer()
  const gesehen = new Set<string>()
  for (const z of zeilen) {
    const id = z.message?.id
    if (z.type !== 'assistant' || !z.message?.usage || !id || gesehen.has(id)) continue
    if ((z.timestamp ?? '') < von || (z.timestamp ?? '') > bis) continue
    gesehen.add(id)
    addiere(t, z.message.usage)
  }
  return t
}

if (!existsSync(ordner)) {
  console.error(`Keine Transkripte unter ${ordner} (--transkripte <ordner>)`)
  process.exit(1)
}
const agenten: Agent[] = []
const sitzungen: { datei: string; von: string; bis: string }[] = []
for (const sitzung of readdirSync(ordner, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const sub = join(ordner, sitzung.name, 'subagents')
  if (!existsSync(sub)) continue
  let von = '￿'
  let bis = ''
  for (const meta of readdirSync(sub).filter((d) => d.endsWith('.meta.json'))) {
    if (JSON.parse(readFileSync(join(sub, meta), 'utf8')).agentType !== 'nebenwirkungen-recherche') continue
    const zeilen = lies(join(sub, meta.replace('.meta.json', '.jsonl')))
    // Auftrag (erste eigene Nachricht) und spätere Nachrichten der Koordination; Systemhinweise zählen nicht.
    const nachrichten = zeilen.filter(
      (z) => z.type === 'user' && typeof z.message?.content === 'string' && (!z.isMeta || z.origin?.kind === 'coordinator'),
    )
    const texte = nachrichten.map((z) => z.message!.content as string)
    // Fortsetzung nach einem Limit: Die Koordination schickt nur „Limit ist zurückgesetzt …“.
    const fortsetzung = (t: string) => /Limit ist zurückgesetzt/.test(t) && !/Urteil|Rückfrage/.test(t)
    const rueckfrage = nachrichten.slice(1).find((z) => !fortsetzung(z.message!.content as string))
    const treffer = texte[0]?.match(AUFTRAG)
    if (!treffer || (themen.size && !themen.has(Number(treffer[1])))) continue
    const werkzeuge = werkzeugAufrufe(zeilen)
    const zeiten = zeilen.map((z) => z.timestamp ?? '').filter(Boolean).sort()
    agenten.push({
      thema: Number(treffer[1]),
      teil: Number(treffer[2]),
      runden: texte.length,
      anfragen: texte.slice(1).filter((t) => !fortsetzung(t)).length,
      fortsetzungen: texte.slice(1).filter(fortsetzung).length,
      websuchen: werkzeuge.filter((w) => w.name === 'WebSearch').length,
      abrufe: werkzeuge.filter((w) => w.name === 'WebFetch').length,
      werkzeuge: werkzeuge.length,
      limitabbrueche: zeilen.filter((z) => z.type === 'assistant' && z.message?.model === '<synthetic>').length,
      tokens: verbrauch(zeilen),
      // alles ab der ersten Rückfrage der Koordination
      nacharbeit: rueckfrage?.timestamp ? verbrauch(zeilen, rueckfrage.timestamp) : leer(),
      start: zeiten[0],
      ende: zeiten.at(-1)!,
    })
    von = zeiten[0] < von ? zeiten[0] : von
    bis = zeiten.at(-1)! > bis ? zeiten.at(-1)! : bis
  }
  if (bis) sitzungen.push({ datei: join(ordner, `${sitzung.name}.jsonl`), von, bis })
}
if (!agenten.length) {
  console.error('Keine Läufe von nebenwirkungen-recherche gefunden.')
  process.exit(1)
}

const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} Mio.` : `${Math.round(n / 1e3)} T`)
const neu = (t: Tokens) => t.eingabe + t.cache_schreiben
const zeile = (z: (string | number)[]) => `| ${z.join(' | ')} |`
const einheiten = (thema: number, teil: number) => {
  const datei = join(wurzel, '.cache', 'nebenwirkungen', String(thema), `teil-${teil}.json`)
  return existsSync(datei) ? (JSON.parse(readFileSync(datei, 'utf8')).einheiten?.length as number) : NaN
}
// Koordination: Verbrauch der Hauptsitzung im Zeitraum, in dem ihre Recherche-Agenten liefen (Näherung).
const koordination = summe(sitzungen.filter((s) => existsSync(s.datei)).map((s) => verbrauch(lies(s.datei), s.von, s.bis)))

console.log(zeile(['Thema', 'Teile', 'Lösungswege', 'Rückfragen', 'Suchen', 'Abrufe', 'neu gelesen', 'aus Cache', 'Ausgabe', 'neu je Weg', 'Anteil Nacharbeit']))
console.log(zeile(Array(11).fill('---')))
const anteil = (n: Tokens, t: Tokens) => `${Math.round((100 * (neu(n) + n.cache_lesen)) / Math.max(1, neu(t) + t.cache_lesen))} %`
const proThema = [...new Set(agenten.map((a) => a.thema))].sort((a, b) => a - b).map((thema) => {
  const as = agenten.filter((a) => a.thema === thema)
  const wege = [...new Set(as.map((a) => a.teil))].reduce((n, t) => n + einheiten(thema, t), 0)
  const t = summe(as.map((a) => a.tokens))
  const n = summe(as.map((a) => a.nacharbeit))
  const r = {
    thema,
    teile: new Set(as.map((a) => a.teil)).size,
    loesungswege: wege,
    rueckfragen: as.reduce((n, a) => n + a.anfragen, 0),
    fortsetzungen: as.reduce((n, a) => n + a.fortsetzungen, 0),
    websuchen: as.reduce((n, a) => n + a.websuchen, 0),
    abrufe: as.reduce((n, a) => n + a.abrufe, 0),
    limitabbrueche: as.reduce((n, a) => n + a.limitabbrueche, 0),
    tokens: t,
    nacharbeit: n,
    agenten: as.sort((a, b) => a.teil - b.teil),
  }
  console.log(zeile([thema, r.teile, wege || '?', r.rueckfragen, r.websuchen, r.abrufe, k(neu(t)), k(t.cache_lesen), k(t.ausgabe), wege ? k(neu(t) / wege) : '?', anteil(n, t)]))
  return r
})
const gesamt = summe(proThema.map((p) => p.tokens))
const nacharbeit = summe(proThema.map((p) => p.nacharbeit))
const wege = proThema.reduce((n, p) => n + (p.loesungswege || 0), 0)
console.log(zeile(['**alle Agenten**', proThema.reduce((n, p) => n + p.teile, 0), wege, proThema.reduce((n, p) => n + p.rueckfragen, 0), proThema.reduce((n, p) => n + p.websuchen, 0), proThema.reduce((n, p) => n + p.abrufe, 0), k(neu(gesamt)), k(gesamt.cache_lesen), k(gesamt.ausgabe), wege ? k(neu(gesamt) / wege) : '?', anteil(nacharbeit, gesamt)]))
console.log(zeile(['Koordination (Näherung)', '', '', '', '', '', k(neu(koordination)), k(koordination.cache_lesen), k(koordination.ausgabe), wege ? k(neu(koordination) / wege) : '?', '']))
console.log('\n„neu gelesen“ = Eingabe ohne Cache plus Cache-Schreiben; „aus Cache“ wird günstiger abgerechnet. Rückfragen = Nachrichten der Koordination nach dem Auftrag, ohne Fortsetzungen nach einem Limit; Nacharbeit = Verbrauch ab der ersten Rückfrage (Fortsetzungen danach eingeschlossen).')
const abbrueche = proThema.reduce((n, p) => n + p.limitabbrueche, 0)
if (abbrueche) console.log(`Limitabbrüche: ${abbrueche}, Fortsetzungen: ${proThema.reduce((n, p) => n + p.fortsetzungen, 0)}`)

if (speichern) {
  for (const p of proThema) {
    const basis = join(wurzel, 'daten', 'protokolle', `nebenwirkungen-${p.thema}`)
    const stand = existsSync(basis) ? readdirSync(basis).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().at(-1) : undefined
    if (!stand) {
      console.error(`Thema ${p.thema}: kein Protokollordner – erst npm run nebenwirkungen:eintragen`)
      continue
    }
    const { agenten: as, ...rest } = p
    writeFileSync(join(basis, stand, 'verbrauch.json'), JSON.stringify({ ...rest, teile_einzeln: as.map((a) => ({ ...a, thema: undefined })) }, null, 2) + '\n')
    console.log(`Gespeichert: daten/protokolle/nebenwirkungen-${p.thema}/${stand}/verbrauch.json`)
  }
}
