// Vergleichslauf Programmkatalog: prüft die Antwort des Agenten programm-katalog für einen Block.
// Aufruf: npm run -s katalog:pruefen -- <Name> <Block, z. B. 03>
// Ohne Block: alle Antworten zusammenführen nach .cache/katalog/<Name>/katalog.json (nur wenn alle in Ordnung sind).
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const ARTEN = ['zusage', 'ablehnung', 'bedingung', 'pruefauftrag', 'ziel', 'lage', 'rueckblick']
export const FELDER = ['arbeit', 'wirtschaft', 'finanzen-steuern', 'soziales', 'rente', 'gesundheit', 'pflege', 'familie',
  'bildung', 'wissenschaft', 'wohnen-bau', 'verkehr', 'energie', 'klima-umwelt', 'landwirtschaft', 'digitales',
  'innere-sicherheit', 'justiz', 'migration-integration', 'aussen-europa', 'verteidigung', 'demokratie-staat',
  'kultur-medien-sport', 'gleichstellung-vielfalt', 'verbraucher', 'kommunen-regionen']
const OHNE = ['kopfzeile', 'inhaltsverzeichnis', 'ueberschrift', 'lage', 'rueckblick', 'einleitung', 'bild', 'sonstiges']
const PARTEIEN = /\b(CDU|CSU|Union|SPD|Sozialdemokrat|Grüne|Bündnis 90|FDP|Freie Demokraten|AfD|Alternative für Deutschland|Linke|BSW|Wagenknecht)\b/i

type Aussage = { saetze: string[]; art: string; kurz: string; felder: string[]; stichwoerter: string[] }
type Antwort = { aussagen: Aussage[]; ohne: { von: string; bis?: string; grund: string }[] }

const [name, blockArg] = process.argv.slice(2)
const ordner = join('.cache/katalog', name ?? '')
if (!name || !existsSync(join(ordner, 'absaetze.json'))) {
  console.error('Aufruf: npm run -s katalog:pruefen -- <Name> [Block]')
  process.exit(1)
}
const { absaetze, url } = JSON.parse(readFileSync(join(ordner, 'absaetze.json'), 'utf8')) as
  { absaetze: { id: string; seite: number; saetze: { id: string; text: string }[] }[]; url: string }
const satzText = new Map(absaetze.flatMap((a) => a.saetze.map((s) => [s.id, s.text] as const)))
const seiteVon = new Map(absaetze.map((a) => [a.id, a.seite]))
const woerter = (t: string) => t.toLowerCase().match(/[a-zäöüß0-9]+/g) ?? []

function pruefe(block: string): { fehler: string[]; antwort?: Antwort } {
  const blockDatei = readFileSync(join(ordner, 'bloecke', `${block}.md`), 'utf8')
  const ids = [...blockDatei.matchAll(/^\[(A\d{4})\]/gm)].map((m) => m[1])
  const datei = join(ordner, 'antworten', `${block}.json`)
  if (!existsSync(datei)) return { fehler: [`Antwort fehlt: ${datei}`] }
  let antwort: Antwort
  try { antwort = JSON.parse(readFileSync(datei, 'utf8')) } catch (e) { return { fehler: [`kein gültiges JSON: ${(e as Error).message}`] } }
  const fehler: string[] = []
  const erfasst = new Set<string>()
  antwort.aussagen?.forEach((a, i) => {
    const wo = `Aussage ${i + 1}`
    if (!a.saetze?.length) fehler.push(`${wo}: saetze leer`)
    for (const s of a.saetze ?? []) {
      if (!satzText.has(s)) fehler.push(`${wo}: Satz ${s} gibt es nicht`)
      else if (!ids.includes(s.split('.')[0])) fehler.push(`${wo}: Satz ${s} liegt nicht in diesem Block`)
      else erfasst.add(s.split('.')[0])
    }
    if (!ARTEN.includes(a.art)) fehler.push(`${wo}: art "${a.art}" (erlaubt: ${ARTEN.join(', ')})`)
    if (!a.kurz || a.kurz.length > 200) fehler.push(`${wo}: kurz fehlt oder länger als 200 Zeichen`)
    if (PARTEIEN.test(a.kurz ?? '')) fehler.push(`${wo}: Parteiname in kurz`)
    for (const f of a.felder ?? []) if (!FELDER.includes(f)) fehler.push(`${wo}: Feld "${f}" (erlaubt: ${FELDER.join(', ')})`)
    if (!a.felder?.length) fehler.push(`${wo}: felder leer`)
    // Eigene Worte: keine Folge von 9 Wörtern aus dem Programm.
    const quelle = ' ' + woerter((a.saetze ?? []).map((s) => satzText.get(s) ?? '').join(' ')).join(' ') + ' '
    const k = woerter(a.kurz ?? '')
    for (let j = 0; j + 9 <= k.length; j++) {
      if (quelle.includes(' ' + k.slice(j, j + 9).join(' ') + ' ')) { fehler.push(`${wo}: kurz übernimmt Wortlaut aus dem Programm – eigene Worte`); break }
    }
  })
  for (const o of antwort.ohne ?? []) {
    const von = ids.indexOf(o.von), bis = ids.indexOf(o.bis ?? o.von)
    if (von < 0 || bis < von) { fehler.push(`ohne: Bereich ${o.von}–${o.bis ?? o.von} ungültig`); continue }
    if (!OHNE.includes(o.grund)) fehler.push(`ohne ${o.von}: grund "${o.grund}" (erlaubt: ${OHNE.join(', ')})`)
    ids.slice(von, bis + 1).forEach((id) => erfasst.add(id))
  }
  const fehlend = ids.filter((id) => !erfasst.has(id))
  if (fehlend.length) fehler.push(`Absätze weder in einer Aussage noch unter ohne: ${fehlend.join(', ')}`)
  return { fehler, antwort }
}

if (blockArg) {
  const { fehler, antwort } = pruefe(blockArg.padStart(2, '0'))
  if (fehler.length) { console.log('Fehler:\n- ' + fehler.join('\n- ')); process.exit(1) }
  const arten = Object.entries((antwort!.aussagen).reduce((m, a) => ({ ...m, [a.art]: (m[a.art] ?? 0) + 1 }), {} as Record<string, number>))
  console.log(`In Ordnung: ${antwort!.aussagen.length} Aussagen (${arten.map(([a, n]) => `${a} ${n}`).join(', ')})`)
} else {
  const bloecke = readdirSync(join(ordner, 'bloecke')).map((f) => f.replace('.md', '')).sort()
  const katalog = []
  let n = 0
  for (const b of bloecke) {
    const { fehler, antwort } = pruefe(b)
    if (fehler.length) { console.log(`Block ${b}: ${fehler.length} Fehler`); process.exitCode = 1; continue }
    for (const a of antwort!.aussagen) {
      n++
      katalog.push({ id: `K-${name}-${String(n).padStart(4, '0')}`, ...a, seite: seiteVon.get(a.saetze[0].split('.')[0]) })
    }
  }
  if (!process.exitCode) {
    writeFileSync(join(ordner, 'katalog.json'), JSON.stringify({ name, url, aussagen: katalog }, null, 1))
    console.log(`${name}: ${katalog.length} Aussagen → ${ordner}/katalog.json`)
  }
}
