// Blindlisten für die Recherche der Nebenwirkungen: Lösungswege eines Themas ohne Partei, in Teilen.
// Schreibt .cache/nebenwirkungen/<Thema-ID>/teil-<n>.json. Standard: nur Lösungswege ohne Hinweise;
// --alle: auch schon erfasste KI-Entwürfe neu (menschlich geprüfte Hinweise nie).
// Aufruf: npm run nebenwirkungen:blind -- <Thema-ID> [--alle]
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pruefeDatenordner } from '../katalog-laden.ts'
import { NEBEN_ORDNER, nebenBlind } from '../nebenwirkungen.ts'

const args = process.argv.slice(2)
const themaId = Number(args.find((a) => /^\d+$/.test(a)))
if (!Number.isInteger(themaId)) {
  console.error('Aufruf: npm run nebenwirkungen:blind -- <Thema-ID> [--alle]')
  process.exit(1)
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
const ordner = fileURLToPath(new URL(`../../${NEBEN_ORDNER(themaId)}/`, import.meta.url))
mkdirSync(join(ordner, 'protokoll'), { recursive: true })
for (const d of readdirSync(ordner)) if (/^teil-\d+\.json$/.test(d)) rmSync(join(ordner, d))
for (const l of listen) writeFileSync(join(ordner, `teil-${l.teil}.json`), JSON.stringify(l, null, 2) + '\n', 'utf8')
console.log(`Thema ${themaId}: ${listen.reduce((n, l) => n + l.einheiten.length, 0)} Lösungswege in ${listen.length} Teilen.`)
for (const l of listen)
  console.log(
    `Auftrag an einen Agenten nebenwirkungen-recherche: „Recherchiere ${NEBEN_ORDNER(themaId)}/teil-${l.teil}.json. ` +
      `Antwort in ${NEBEN_ORDNER(themaId)}/protokoll/antwort-${l.teil}.txt, Prüfung mit npm run -s nebenwirkungen:antwort-pruefen -- ${themaId} ${l.teil}.“`,
  )
