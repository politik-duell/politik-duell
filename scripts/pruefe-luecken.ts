// Kandidaten für fehlende Maßnahmen aus dem vorhandenen Katalog (Verfahren: scripts/luecken.ts) – ohne Netz
// und ohne KI. Je Kandidat: Thema und Programm mit Lücke, der fehlende Lösungsweg und die Stelle derselben
// Partei aus einem anderen Thema, die darauf hinweist. Prüfen: Stelle im Programm lesen; passt sie, über
// /forderung-erfassen nachtragen bzw. bei falscher Bündelung als eigene Maßnahme erfassen.
// Aufruf: npm run daten:luecken [-- --bund] [--thema 11,42] [--stuetze 3] [--json]
import { findeLuecken, instrumentName } from './luecken.ts'
import { pruefeDatenordner } from './katalog-laden.ts'

function option(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

const { katalog, fehler } = pruefeDatenordner()
if (fehler.length) {
  console.error('Datenkatalog fehlerhaft – erst `npm run daten:pruefen` beheben.')
  process.exit(1)
}
const themen = option('thema')?.split(',').map(Number)
const luecken = findeLuecken(katalog.massnahmen, katalog.abdeckung, Number(option('stuetze') ?? 2)).filter(
  (l) => (!themen || themen.includes(l.thema_id)) && (!process.argv.includes('--bund') || !l.land),
)
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(luecken, null, 1))
  process.exit(0)
}
const partei = (id: number) => katalog.parteien.find((p) => p.id === id)?.name ?? `Partei ${id}`
const thema = (id: number) => katalog.themen.find((t) => t.id === id)?.name ?? `Thema ${id}`
let zuletzt = 0
for (const l of luecken) {
  if (l.thema_id !== zuletzt) console.log(`\n## ${l.thema_id} ${thema(l.thema_id)}`)
  zuletzt = l.thema_id
  const seite = l.hinweis.beleg_programm_url.match(/#page=(\d+)/)?.[1]
  console.log(`- ${partei(l.partei_id)}${l.land ? ` (${l.land})` : ''}: fehlt „${instrumentName(katalog.instrumente, l.instrument_id)}“ (${l.instrument_id})`)
  console.log(`    Hinweis: Thema ${l.hinweis.thema_id}, Maßnahme ${l.hinweis.id}${seite ? `, S. ${seite}` : ''} – ${l.hinweis.beschreibung}`)
  console.log(`    verbunden über: ${l.stuetze.map(partei).join(', ')}`)
}
console.log(`\n${luecken.length} Kandidaten. Kandidaten, keine Befunde – erst die Stelle im Programm lesen.`)
