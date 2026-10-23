// Trägt die Hinweise aller Teile eines Themas als KI-Entwurf ein und legt Blindlisten und Antworten unter
// daten/protokolle/nebenwirkungen-<ID>/<Datum>/ ab. Menschlich geprüfte Hinweise bleiben unberührt.
// Aufruf: npm run nebenwirkungen:eintragen -- <Thema-ID> [--stand JJJJ-MM-TT]
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { erstesJsonObjekt } from '../entwurf/json-text.ts'
import { pruefeDatenordner } from '../katalog-laden.ts'
import { formatiere } from '../pruefung-export.ts'
import { werkzeugeDesTeils } from './transkript.ts'
import { NEBEN_ORDNER, nebenwirkungenEintragen, pruefeNebenAntwort, pruefkontext, type NebenAntwort, type NebenBlindliste } from '../nebenwirkungen.ts'

const args = process.argv.slice(2)
const s = args.indexOf('--stand')
const heute = s >= 0 ? args.splice(s, 2)[1] : new Date().toISOString().slice(0, 10)
const themaId = Number(args[0])
const wurzel = new URL('../../', import.meta.url)
const abbruch = (t: string): never => {
  console.error(t)
  process.exit(1)
}
if (!Number.isInteger(themaId)) abbruch('Aufruf: npm run nebenwirkungen:eintragen -- <Thema-ID> [--stand JJJJ-MM-TT]')
const { katalog, fehler: kf } = pruefeDatenordner()
if (kf.length) abbruch('Datenkatalog fehlerhaft – erst `npm run daten:pruefen` beheben.')
const arbeit = fileURLToPath(new URL(`${NEBEN_ORDNER(themaId)}/`, wurzel))
const teile = readdirSync(arbeit).filter((d) => /^teil-\d+\.json$/.test(d)).sort()
if (!teile.length) abbruch(`Keine Blindlisten in ${NEBEN_ORDNER(themaId)} – erst npm run nebenwirkungen:blind -- ${themaId}`)
const ctx = pruefkontext(katalog, wurzel)
const antworten: NebenAntwort[] = []
for (const t of teile) {
  const n = t.match(/\d+/)![0]
  const liste = JSON.parse(readFileSync(join(arbeit, t), 'utf8')) as NebenBlindliste
  let antwort: NebenAntwort
  try {
    antwort = erstesJsonObjekt(readFileSync(join(arbeit, 'protokoll', `antwort-${n}.txt`), 'utf8')).objekt as NebenAntwort
  } catch (e) {
    abbruch(`Teil ${n}: Antwort fehlt oder ist kein JSON (${e instanceof Error ? e.message : e})`)
  }
  const { fehler } = pruefeNebenAntwort(liste, antwort!, ctx, werkzeugeDesTeils(themaId, Number(n)))
  if (fehler.length) abbruch(`Teil ${n}: Antwort fehlerhaft:\n  ${fehler.join('\n  ')}`)
  antworten.push(antwort!)
}
const ordner = new URL('daten/themen/', wurzel)
const datei = readdirSync(ordner).find((d) => d.endsWith('.json') && JSON.parse(readFileSync(new URL(d, ordner), 'utf8')).id === themaId)
if (!datei) abbruch(`Themendatei für ${themaId} nicht gefunden`)
const pfad = new URL(datei!, ordner)
const original = readFileSync(pfad, 'utf8')
const thema = JSON.parse(original)
const { eingetragen, fehlend } = nebenwirkungenEintragen(thema, antworten, heute)
if (fehlend.length) abbruch(`Lösungswege nicht in der Themendatei: ${fehlend.join(', ')} – Blindliste veraltet, neu erzeugen.`)
writeFileSync(pfad, formatiere(thema) + '\n')
const nachher = pruefeDatenordner()
if (nachher.fehler.length) {
  writeFileSync(pfad, original)
  abbruch(`Eintragen verworfen, Katalog wäre fehlerhaft:\n  ${nachher.fehler.join('\n  ')}`)
}
const archiv = fileURLToPath(new URL(`daten/protokolle/nebenwirkungen-${themaId}/${heute}/`, wurzel))
mkdirSync(archiv, { recursive: true })
for (const t of teile) {
  const n = t.match(/\d+/)![0]
  copyFileSync(join(arbeit, t), join(archiv, t))
  copyFileSync(join(arbeit, 'protokoll', `antwort-${n}.txt`), join(archiv, `antwort-${n}.txt`))
}
console.log(`Thema ${themaId}: ${eingetragen} Lösungswege mit Hinweisen eingetragen (KI-Entwurf). Protokoll: ${archiv}`)
