// Selbstprüfung des Agenten nebenwirkungen-recherche: liest nur teil-<n>.json und die eigene Antwort.
// Aufruf: npm run nebenwirkungen:antwort-pruefen -- <Thema-ID> <Teil>
import { existsSync, readFileSync } from 'node:fs'
import { erstesJsonObjekt } from '../entwurf/json-text.ts'
import { pruefeKatalog } from '../../src/data/katalog.ts'
import { bilanz, NEBEN_ORDNER, pruefeNebenAntwort, pruefkontext, type NebenAntwort, type NebenBlindliste } from '../nebenwirkungen.ts'

const [id, teil] = process.argv.slice(2).map(Number)
const ordner = new URL(`../../${NEBEN_ORDNER(id)}/`, import.meta.url)
const antwortPfad = new URL(`protokoll/antwort-${teil}.txt`, ordner)
if (!Number.isInteger(id) || !Number.isInteger(teil) || !existsSync(antwortPfad)) {
  console.error(`Aufruf: npm run -s nebenwirkungen:antwort-pruefen -- <Thema-ID> <Teil> (erwartet ${NEBEN_ORDNER(id)}/protokoll/antwort-${teil}.txt)`)
  process.exit(1)
}
const liste = JSON.parse(readFileSync(new URL(`teil-${teil}.json`, ordner), 'utf8')) as NebenBlindliste
let antwort: NebenAntwort
try {
  antwort = erstesJsonObjekt(readFileSync(antwortPfad, 'utf8')).objekt as NebenAntwort
} catch (e) {
  console.error(`Kein gültiges JSON: ${e instanceof Error ? e.message : e}`)
  process.exit(1)
}
// Nur Parteien und Programmserver – keine Themendateien (der Agent soll keine Maßnahmen sehen, auch nicht indirekt).
const wurzel = new URL('../../', import.meta.url)
const parteien = { pfad: 'parteien.json', inhalt: JSON.parse(readFileSync(new URL('daten/parteien.json', wurzel), 'utf8')) }
const { katalog } = pruefeKatalog(parteien, [])
const { fehler, warnungen } = pruefeNebenAntwort(liste, antwort, pruefkontext(katalog, wurzel))
for (const f of fehler) console.error(`Fehler:  ${f}`)
for (const w of warnungen) console.error(`Hinweis: ${w}`)
if (fehler.length) process.exit(1)
console.log(`In Ordnung: ${antwort.einheiten.length} Lösungswege.\n${bilanz(antwort).join('\n')}`)
