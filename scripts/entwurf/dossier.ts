// Dossier je Programm: wo treffen die Suchbegriffe? Leseplan, Seiten nach Treffern mit Ausschnitt und
// Treffer je Begriff – für alle Programme dieselbe Rechnung. Ersetzt Hunderte einzelner Suchläufe.
// Aufruf: npm run entwurf:dossier -- <erfassung.json> [--bund | --land BE …] [--partei SPD …] [--max 30] [--lokal <ordner>]
// Die Erfassung (mit `suchbegriffe`) liegt unter .cache/; die Dossiers daneben in dossier/.
// Normalerweise reicht entwurf:auftrag, das die Dossiers miterzeugt.
import { readFileSync } from 'node:fs'
import { pruefeSuchbegriffe, suchbegriffeHinweise, type Erfassung } from '../entwurf.ts'
import { pruefeDatenordner } from '../katalog-laden.ts'
import { lokalePdfs } from '../programme.ts'
import { bereiteVor, zielProgramme } from './auftrag-lib.ts'

const args = process.argv.slice(2)
const liste = (name: string) => {
  const werte: string[] = []
  for (let i = args.indexOf(name); i >= 0; i = args.indexOf(name)) werte.push(...args.splice(i, 2).slice(1))
  return werte
}
const bundPos = args.indexOf('--bund')
const nurBund = bundPos >= 0
if (nurBund) args.splice(bundPos, 1)
const laender = liste('--land')
const parteien = liste('--partei')
const max = liste('--max')[0]
const lokalOrdner = liste('--lokal')[0]
const [pfad, ...rest] = args
if (!pfad || rest.length || (max !== undefined && !/^\d+$/.test(max))) {
  console.error('Aufruf: npm run entwurf:dossier -- <erfassung.json> [--bund | --land BE …] [--partei SPD …] [--max 30] [--lokal <ordner>]')
  process.exit(1)
}
if (!/(^|[\\/])\.cache([\\/]|$)/.test(pfad)) {
  console.error('Die Erfassung muss unter .cache/ liegen (Dossiers enthalten Programmtext, der nie ins Repository kommt).')
  process.exit(1)
}
const { katalog, fehler } = pruefeDatenordner()
if (fehler.length) {
  console.error('Datenkatalog fehlerhaft – erst `npm run daten:pruefen` beheben.')
  process.exit(1)
}
const erfassung = JSON.parse(readFileSync(pfad, 'utf8')) as Erfassung
const { ziele, uebersprungen } = zielProgramme(katalog, erfassung.thema_id, { bund: nurBund, laender, parteien })
for (const u of uebersprungen) console.error(`Übersprungen: ${u}`)
if (!ziele.length) {
  console.error('Keine Programme ausgewählt.')
  process.exit(1)
}
const format = pruefeSuchbegriffe(katalog, {
  ...erfassung,
  treffer: undefined,
  programme: ziele.map((z) => ({ partei_id: z.parteiId, land: z.land, massnahmen: [] })),
}).filter((f) => !f.startsWith('treffer'))
for (const f of format) console.error(`Fehler:  ${f}`)
if (format.length) process.exit(1)
for (const h of suchbegriffeHinweise(erfassung)) console.error(`Hinweis: ${h}`)

const { meldungen, fehler: nichtGeladen } = await bereiteVor(katalog, erfassung, pfad, ziele, {
  dossier: true,
  auftrag: false,
  max: max ? Number(max) : undefined,
  lokal: lokalOrdner ? lokalePdfs(lokalOrdner) : undefined,
})
for (const m of meldungen) console.log(m)
if (nichtGeladen) {
  console.error(`${nichtGeladen} Programme nicht geladen – bleiben „noch nicht erfasst“ oder mit --lokal laden.`)
  process.exit(1)
}
