// Sammelbefehl für /thema-erfassen und /forderung-erfassen: ein Schritt für alle Themen eines Laufs
// (Plan und Reihenfolge: lauf-plan.ts). Bricht beim ersten Fehler ab und nennt den Befehl.
// Aufruf: npm run -s entwurf:lauf -- <schritt> <erfassung.json> … [--bund | --land XX … | --partei SPD …] [--lokal <ordner>] [--bewertung-fertig] [--sammel]
//   vorab      ursachen:freigegeben --gegen HEAD (nicht bei Nachträgen), entwurf:treffer --vorab
//   auftraege  entwurf:auftrag je Thema; mit --sammel bei mehreren Themen zusätzlich entwurf:sammelauftrag (nicht Standard)
//   erfasst    entwurf:zusammenfuehren, entwurf:treffer
//   blind      entwurf:blind, entwurf:bewertung-auftrag
//   bewertet   entwurf:json, entwurf:bewertung-pruefen (alle Themen), dann entwurf:eintragen, daten:pruefen,
//              zitate:pruefen --thema, seed, entwurf:bericht, entwurf:archivieren, npm test --reporter=dot
// (Unter PowerShell 7 „--“ in Anführungszeichen: npm run -s entwurf:lauf '--' vorab …)
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { leseArgumente, plane, type Thema } from './lauf-plan.ts'

const a = leseArgumente(process.argv.slice(2))
if ('fehler' in a) {
  console.error(`Fehler:  ${a.fehler}`)
  console.error('Aufruf: npm run -s entwurf:lauf -- vorab|auftraege|erfasst|blind|bewertet <erfassung.json> … [--bund | --land XX … | --partei …] [--lokal <ordner>] [--bewertung-fertig] [--sammel]')
  process.exit(1)
}
const themen: Thema[] = a.pfade.map((pfad) => {
  const e = JSON.parse(readFileSync(pfad, 'utf8')) as { thema_id: number; nachtrag?: { forderung: string } }
  return { pfad, thema_id: e.thema_id, nachtrag: e.nachtrag?.forderung }
})
for (const b of plane(a.schritt, themen, a.optionen)) {
  const args = ['run', '-s', b.skript, ...(b.args.length ? ['--', ...b.args] : [])]
  console.log(`\n▶ npm ${args.slice(2).join(' ')}`)
  const r = spawnSync('npm', args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0) {
    console.error(`\nAbgebrochen bei: npm run ${b.skript}${b.args.length ? ` -- ${b.args.join(' ')}` : ''} (Ausgabe oben). Nach dem Beheben den Schritt erneut starten.`)
    process.exit(r.status ?? 1)
  }
}
console.log(`\nSchritt ${a.schritt} für ${themen.length} ${themen.length === 1 ? 'Thema' : 'Themen'} erledigt.`)
