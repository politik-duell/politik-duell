// Trägt die Rollen-Modifikatoren aller Teile eines Themas als KI-Entwurf ein und legt Blindlisten und Antworten
// unter daten/protokolle/rollen-<ID>/<Datum>/ ab (dort erkennt rollen:blind, welche Wege schon bearbeitet sind).
// Aufruf: npm run rollen:eintragen -- <Thema-ID> [--stand JJJJ-MM-TT]
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { erstesJsonObjekt } from '../entwurf/json-text.ts'
import { pruefeDatenordner } from '../katalog-laden.ts'
import { formatiere } from '../pruefung-export.ts'
import { pruefkontext } from '../nebenwirkungen.ts'
import { werkzeugeDesTeils } from '../nebenwirkungen/transkript.ts'
import { pruefeRollenAntwort, ROLLEN_ORDNER, ROLLEN_PROTOKOLL, rollenEintragen, type RollenAntwort, type RollenBlindliste } from '../rollen.ts'
import { ROLLEN_TRANSKRIPT } from './transkript.ts'

const args = process.argv.slice(2)
const s = args.indexOf('--stand')
const heute = s >= 0 ? args.splice(s, 2)[1] : new Date().toISOString().slice(0, 10)
const themaId = Number(args[0])
const wurzel = new URL('../../', import.meta.url)
const abbruch = (t: string): never => {
  console.error(t)
  process.exit(1)
}
if (!Number.isInteger(themaId)) abbruch('Aufruf: npm run rollen:eintragen -- <Thema-ID> [--stand JJJJ-MM-TT]')
const { katalog, fehler: kf } = pruefeDatenordner()
if (kf.length) abbruch('Datenkatalog fehlerhaft – erst `npm run daten:pruefen` beheben.')
const arbeit = fileURLToPath(new URL(`${ROLLEN_ORDNER(themaId)}/`, wurzel))
const teile = readdirSync(arbeit).filter((d) => /^teil-\d+\.json$/.test(d)).sort()
if (!teile.length) abbruch(`Keine Blindlisten in ${ROLLEN_ORDNER(themaId)} – erst npm run rollen:blind -- ${themaId}`)
const ctx = pruefkontext(katalog, wurzel)
const antworten: RollenAntwort[] = []
for (const t of teile) {
  const n = t.match(/\d+/)![0]
  const liste = JSON.parse(readFileSync(join(arbeit, t), 'utf8')) as RollenBlindliste
  let antwort: RollenAntwort
  try {
    antwort = erstesJsonObjekt(readFileSync(join(arbeit, 'protokoll', `antwort-${n}.txt`), 'utf8')).objekt as RollenAntwort
  } catch (e) {
    abbruch(`Teil ${n}: Antwort fehlt oder ist kein JSON (${e instanceof Error ? e.message : e})`)
  }
  const { fehler } = pruefeRollenAntwort(liste, antwort!, ctx, werkzeugeDesTeils(themaId, Number(n), undefined, ROLLEN_TRANSKRIPT))
  if (fehler.length) abbruch(`Teil ${n}: Antwort fehlerhaft:\n  ${fehler.join('\n  ')}`)
  antworten.push(antwort!)
}
const ordner = new URL('daten/themen/', wurzel)
const datei = readdirSync(ordner).find((d) => d.endsWith('.json') && JSON.parse(readFileSync(new URL(d, ordner), 'utf8')).id === themaId)
if (!datei) abbruch(`Themendatei für ${themaId} nicht gefunden`)
const pfad = new URL(datei!, ordner)
const original = readFileSync(pfad, 'utf8')
const thema = JSON.parse(original)
const { eingetragen, entfernt, fehlend } = rollenEintragen(thema, antworten)
if (fehlend.length) abbruch(`Lösungswege nicht in der Themendatei: ${fehlend.join(', ')} – Blindliste veraltet, neu erzeugen.`)
writeFileSync(pfad, formatiere(thema) + '\n')
const nachher = pruefeDatenordner()
if (nachher.fehler.length) {
  writeFileSync(pfad, original)
  abbruch(`Eintragen verworfen, Katalog wäre fehlerhaft:\n  ${nachher.fehler.join('\n  ')}`)
}
const archiv = fileURLToPath(new URL(`${ROLLEN_PROTOKOLL(themaId)}/${heute}/`, wurzel))
mkdirSync(archiv, { recursive: true })
for (const t of teile) {
  const n = t.match(/\d+/)![0]
  copyFileSync(join(arbeit, t), join(archiv, t))
  copyFileSync(join(arbeit, 'protokoll', `antwort-${n}.txt`), join(archiv, `antwort-${n}.txt`))
}
console.log(`Thema ${themaId}: ${eingetragen} Lösungswege mit Modifikatoren (KI-Entwurf), ${entfernt} ohne Beleg entfernt. Protokoll: ${archiv}`)
