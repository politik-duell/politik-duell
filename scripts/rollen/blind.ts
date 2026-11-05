// Blindlisten für /rollen-erfassen: Lösungswege eines Themas ohne Partei, in Teilen.
// Schreibt .cache/rollen/<Thema-ID>/teil-<n>.json. Standard: nur Wege ohne Modifikator, die noch kein Lauf
// bearbeitet hat (Protokolle unter daten/protokolle/rollen-<ID>/); --alle: auch KI-Entwürfe und Modifikatoren ohne Quelle.
// Aufruf: npm run rollen:blind -- <Thema-ID> [--alle]
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { erstesJsonObjekt } from '../entwurf/json-text.ts'
import { pruefeDatenordner } from '../katalog-laden.ts'
import { ROLLEN_ORDNER, ROLLEN_PROTOKOLL, rollenBlind, type RollenAntwort } from '../rollen.ts'

const args = process.argv.slice(2)
const themaId = Number(args.find((a) => /^\d+$/.test(a)))
if (!Number.isInteger(themaId)) {
  console.error('Aufruf: npm run rollen:blind -- <Thema-ID> [--alle]')
  process.exit(1)
}
const wurzel = new URL('../../', import.meta.url)
const ordner = fileURLToPath(new URL(`${ROLLEN_ORDNER(themaId)}/`, wurzel))
const archiv = fileURLToPath(new URL(`${ROLLEN_PROTOKOLL(themaId)}/`, wurzel))
// Schon bearbeitet: alle Wege in archivierten Antworten – auch die, für die keine Rolle belegt war.
const erledigt = new Set<number>()
if (existsSync(archiv))
  for (const datum of readdirSync(archiv))
    for (const d of readdirSync(join(archiv, datum)).filter((d) => /^antwort-\d+\.txt$/.test(d))) {
      try {
        for (const e of (erstesJsonObjekt(readFileSync(join(archiv, datum, d), 'utf8')).objekt as RollenAntwort).einheiten) erledigt.add(e.id)
      } catch {
        // Unlesbares Protokoll: Wege gelten als offen.
      }
    }
const { katalog, fehler } = pruefeDatenordner()
if (fehler.length) {
  console.error('Datenkatalog fehlerhaft – erst `npm run daten:pruefen` beheben.')
  process.exit(1)
}
const { listen, reste } = rollenBlind(katalog, themaId, { alle: args.includes('--alle'), erledigt })
if (reste.length) {
  console.error(`Parteibezug in Namen oder Begründungen – erst beheben:\n  ${reste.join('\n  ')}`)
  process.exit(1)
}
if (!listen.length) {
  console.log(`Thema ${themaId}: kein offener Lösungsweg (alle bearbeitet oder geprüft; KI-Entwürfe neu mit --alle).`)
  process.exit(0)
}
mkdirSync(join(ordner, 'protokoll'), { recursive: true })
for (const d of readdirSync(ordner)) if (/^teil-\d+\.json$/.test(d)) rmSync(join(ordner, d))
for (const l of listen) writeFileSync(join(ordner, `teil-${l.teil}.json`), JSON.stringify(l, null, 2) + '\n', 'utf8')
console.log(`Thema ${themaId}: ${listen.reduce((n, l) => n + l.einheiten.length, 0)} Lösungswege in ${listen.length} Teilen.`)
for (const l of listen)
  console.log(
    `Auftrag an einen Agenten rollen-recherche: „Prüfe ${ROLLEN_ORDNER(themaId)}/teil-${l.teil}.json. ` +
      `Antwort in ${ROLLEN_ORDNER(themaId)}/protokoll/antwort-${l.teil}.txt, Prüfung mit npm run -s rollen:antwort-pruefen -- ${themaId} ${l.teil}.“`,
  )
