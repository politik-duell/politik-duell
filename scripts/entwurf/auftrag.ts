// Auftragsdateien für die Erfassungs-Agenten: je Programm eine Datei mit Thema, Ziel, den Ursachen der
// Ebene (samt Abgrenzung), den Regeln der Erfassung und dem Pfad zum Dossier. Erzeugt vorher das Dossier.
// Der Agent bekommt nur den Pfad; er liest weder erfassung.json noch Antworten zu anderen Programmen.
// Aufruf: npm run entwurf:auftrag -- <erfassung.json> [--bund | --land BE …] [--partei SPD …] [--max 30] [--lokal <ordner>]
//         npm run entwurf:auftrag -- <erfassung.json> --partei SPD --land ST --rueckfrage "Anlass" [--ursache 1803 …] [--seiten "22–24, 43"]
// (Unter PowerShell 7 „--“ in Anführungszeichen: npm run entwurf:auftrag '--' <erfassung.json> '--partei' SPD)
// Die Erfassung liegt unter .cache/ (die Dossiers enthalten Programmtext und kommen nie ins Repository).
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
const schalter = (name: string) => {
  const i = args.indexOf(name)
  if (i >= 0) args.splice(i, 1)
  return i >= 0
}
const nurBund = schalter('--bund')
const laender = liste('--land')
const parteien = liste('--partei')
const max = liste('--max')[0]
const lokalOrdner = liste('--lokal')[0]
const anlass = liste('--rueckfrage')[0]
const ursachenArg = liste('--ursache')
const seiten = liste('--seiten')[0]
const [pfad, ...rest] = args
if (!pfad || rest.length || (max !== undefined && !/^\d+$/.test(max)) || ursachenArg.some((u) => !/^\d+$/.test(u))) {
  console.error('Aufruf: npm run entwurf:auftrag -- <erfassung.json> [--bund | --land BE …] [--partei SPD …] [--max 30] [--lokal <ordner>] [--rueckfrage "Anlass" [--ursache ID …] [--seiten "22–24"]]')
  process.exit(1)
}
if (!/(^|[\\/])\.cache([\\/]|$)/.test(pfad)) {
  console.error('Die Erfassung muss unter .cache/ liegen (Dossiers enthalten Programmtext, der nie ins Repository kommt).')
  process.exit(1)
}
if (anlass !== undefined && (!anlass.trim() || !parteien.length || (!nurBund && laender.length !== 1))) {
  console.error('Eine Rückfrage gilt für genau ein Programm: --partei X und --bund oder --land XX, dazu den Anlass.')
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
// Je Ursache der Auswahl müssen Richtungen mit Begriffen stehen; die Treffer schreibt erst entwurf:treffer.
const format = pruefeSuchbegriffe(katalog, {
  ...erfassung,
  treffer: undefined,
  programme: ziele.map((z) => ({ partei_id: z.parteiId, land: z.land, massnahmen: [] })),
}).filter((f) => !f.startsWith('treffer'))
for (const f of format) console.error(`Fehler:  ${f}`)
if (format.length) process.exit(1)
for (const h of suchbegriffeHinweise(erfassung)) console.error(`Hinweis: ${h}`)

const { meldungen, fehler: nichtGeladen } = await bereiteVor(katalog, erfassung, pfad, ziele, {
  dossier: !anlass,
  auftrag: true,
  max: max ? Number(max) : undefined,
  lokal: lokalOrdner ? lokalePdfs(lokalOrdner) : undefined,
  rueckfrage: anlass ? { anlass, ursachen: ursachenArg.map(Number), seiten } : undefined,
})
for (const m of meldungen) console.log(m)
if (nichtGeladen) {
  console.error(`${nichtGeladen} Programme nicht geladen – bleiben „noch nicht erfasst“ oder mit --lokal laden.`)
  process.exit(1)
}
