// Holt das erste vollständige JSON-Objekt aus einer Textdatei (etwa der gespeicherten Antwort eines
// Agenten, die vor oder nach dem JSON Text enthält) und schreibt es als UTF-8-Datei.
// Aufruf: npm run entwurf:json -- <antwort.txt> <ziel.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { extrahiereJson } from './antwort.ts'

const [quelle, ziel, ...rest] = process.argv.slice(2)
if (!quelle || !ziel || rest.length) {
  console.error('Aufruf: npm run entwurf:json -- <antwort.txt> <ziel.json>')
  process.exit(1)
}
const r = extrahiereJson(readFileSync(quelle, 'utf8'))
if ('fehler' in r) {
  console.error(r.fehler)
  process.exit(1)
}
writeFileSync(ziel, JSON.stringify(r.objekt, null, 2) + '\n', 'utf8')
console.log(`${ziel} geschrieben.${r.rest ? ` Text nach dem JSON (${r.rest.length} Zeichen) wurde nicht übernommen – für das Protokoll selbst lesen.` : ''}`)
