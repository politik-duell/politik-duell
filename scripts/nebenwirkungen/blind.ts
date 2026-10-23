// Blindlisten für die Recherche der Nebenwirkungen: Lösungswege eines Themas ohne Partei, in Teilen.
// Schreibt .cache/nebenwirkungen/<Thema-ID>/teil-<n>.json. Standard: nur Lösungswege ohne Hinweise;
// --alle: auch schon erfasste KI-Entwürfe neu (menschlich geprüfte Hinweise nie).
// --quellen: nach einer Welle die Quellen der beurteilten Antworten in die noch offenen Teile übernehmen
// (ohne neue Prüfsumme), damit ähnliche Wege dieselbe Quelle nutzen.
// Aufruf: npm run nebenwirkungen:blind -- <Thema-ID> [--alle | --quellen]
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { erstesJsonObjekt } from '../entwurf/json-text.ts'
import { pruefeDatenordner } from '../katalog-laden.ts'
import { NEBEN_ORDNER, nebenBlind, quellenAus, quellenDerAntworten, type NebenAntwort, type NebenBlindliste } from '../nebenwirkungen.ts'

const args = process.argv.slice(2)
const themaId = Number(args.find((a) => /^\d+$/.test(a)))
if (!Number.isInteger(themaId)) {
  console.error('Aufruf: npm run nebenwirkungen:blind -- <Thema-ID> [--alle | --quellen]')
  process.exit(1)
}
const ordner = fileURLToPath(new URL(`../../${NEBEN_ORDNER(themaId)}/`, import.meta.url))
const auftrag = (teil: number) =>
  `Auftrag an einen Agenten nebenwirkungen-recherche: „Recherchiere ${NEBEN_ORDNER(themaId)}/teil-${teil}.json. ` +
  `Antwort in ${NEBEN_ORDNER(themaId)}/protokoll/antwort-${teil}.txt, Prüfung mit npm run -s nebenwirkungen:antwort-pruefen -- ${themaId} ${teil}.“`

if (args.includes('--quellen')) {
  const teile = existsSync(ordner) ? readdirSync(ordner).filter((d) => /^teil-\d+\.json$/.test(d)) : []
  const liste = (teil: string) => JSON.parse(readFileSync(join(ordner, teil), 'utf8')) as NebenBlindliste
  // Beantwortet ist ein Teil nur mit einer Antwort zur aktuellen Liste (alte Läufe liegen noch im Ordner).
  const antwort = (teil: string): NebenAntwort | undefined => {
    const pfad = join(ordner, 'protokoll', teil.replace('teil-', 'antwort-').replace('.json', '.txt'))
    if (!existsSync(pfad)) return undefined
    try {
      const a = erstesJsonObjekt(readFileSync(pfad, 'utf8')).objekt as NebenAntwort
      return a?.pruefsumme === liste(teil).pruefsumme ? a : undefined
    } catch {
      return undefined
    }
  }
  const fertig = teile.filter((t) => antwort(t))
  const neu = quellenDerAntworten(fertig.map((t) => antwort(t)!))
  const offen = teile.filter((t) => !fertig.includes(t))
  for (const t of offen) {
    const l = liste(t)
    l.quellen = quellenAus([...(l.quellen ?? []), ...neu])
    writeFileSync(join(ordner, t), JSON.stringify(l, null, 2) + '\n', 'utf8')
  }
  console.log(`Thema ${themaId}: ${neu.length} Quellen aus ${fertig.length} Antworten in ${offen.length} offene Teile übernommen.`)
  for (const t of offen.sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)))) console.log(auftrag(parseInt(t.slice(5))))
  process.exit(0)
}
const { katalog, fehler } = pruefeDatenordner()
if (fehler.length) {
  console.error('Datenkatalog fehlerhaft – erst `npm run daten:pruefen` beheben.')
  process.exit(1)
}
const { listen, reste } = nebenBlind(katalog, themaId, args.includes('--alle'))
if (reste.length) {
  console.error(`Parteibezug in Namen oder Begründungen – erst beheben:\n  ${reste.join('\n  ')}`)
  process.exit(1)
}
if (!listen.length) {
  console.log(`Thema ${themaId}: kein offener Lösungsweg (alle haben Hinweise; neu mit --alle).`)
  process.exit(0)
}
mkdirSync(join(ordner, 'protokoll'), { recursive: true })
for (const d of readdirSync(ordner)) if (/^teil-\d+\.json$/.test(d)) rmSync(join(ordner, d))
for (const l of listen) writeFileSync(join(ordner, `teil-${l.teil}.json`), JSON.stringify(l, null, 2) + '\n', 'utf8')
console.log(`Thema ${themaId}: ${listen.reduce((n, l) => n + l.einheiten.length, 0)} Lösungswege in ${listen.length} Teilen.`)
for (const l of listen) console.log(auftrag(l.teil))
