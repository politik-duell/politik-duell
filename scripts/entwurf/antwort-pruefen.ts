// Prüft die Antwort eines Erfassungs-Agenten, sobald sie gespeichert ist – ohne Modell: gültiges JSON,
// richtiges Programm, Längen, Ebenen der Ursachen und ob jedes Zitat wirklich auf der genannten Seite steht.
// So fallen leere, abgeschnittene oder falsch zitierte Antworten auf, bevor sie in die Erfassung kommen
// und eine Rückfrage kosten.
// Aufruf: npm run entwurf:antwort-pruefen -- <protokoll/erfassung-NAME.txt> [--erfassung <erfassung.json>] [--lokal <ordner>]
// NAME ist der Dateiname des Programms (z. B. SPD-ST, Gruene-Bund); auch „…-rueckfrage-N.txt“ wird erkannt.
// Ohne --erfassung gilt die erfassung.json eine Ebene über dem Protokollordner.
// Beendet mit 1 bei Fehlern und mit 2, wenn der Agent das Programm nicht durchsuchen konnte.
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { programmName, pruefeProgramm, type Erfassung, type ErfasstesProgramm } from '../entwurf.ts'
import { pruefeDatenordner } from '../katalog-laden.ts'
import { erfassungsSeiten, lokalePdfs, programme } from '../programme.ts'
import { findeZitat } from '../zitate.ts'
import { extrahiereJson } from './antwort.ts'

const args = process.argv.slice(2)
const wert = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args.splice(i, 2)[1] : undefined
}
const erfassungArg = wert('--erfassung')
const lokalOrdner = wert('--lokal')
const [datei, ...rest] = args
if (!datei || rest.length) {
  console.error('Aufruf: npm run entwurf:antwort-pruefen -- <protokoll/erfassung-NAME.txt> [--erfassung <erfassung.json>] [--lokal <ordner>]')
  process.exit(1)
}
const name = basename(datei).match(/^erfassung-(.+?)(?:-rueckfrage-\d+)?\.txt$/)?.[1]
if (!name) {
  console.error('Dateiname erwartet: erfassung-<Partei>-<Bund|XX>[-rueckfrage-N].txt')
  process.exit(1)
}
const erfassungPfad = erfassungArg ?? join(dirname(dirname(datei)), 'erfassung.json')
if (!existsSync(erfassungPfad)) {
  console.error(`${erfassungPfad} fehlt – mit --erfassung angeben.`)
  process.exit(1)
}
const { katalog, fehler: katalogFehler } = pruefeDatenordner()
if (katalogFehler.length) {
  console.error('Datenkatalog fehlerhaft – erst `npm run daten:pruefen` beheben.')
  process.exit(1)
}
const { thema_id: themaId } = JSON.parse(readFileSync(erfassungPfad, 'utf8')) as Erfassung
const ziel = programme(katalog)
  .filter((p) => p.aktuell)
  .map((p) => ({ p, partei: katalog.parteien.find((x) => x.kurzname === p.partei) }))
  .find((x) => x.partei && programmName(x.partei.kurzname, x.p.land) === name)
if (!ziel?.partei) {
  console.error(`Kein aktuelles Programm „${name}“ im Katalog.`)
  process.exit(1)
}
const bezeichnung = `${ziel.partei.kurzname} (${ziel.p.land ?? 'Bund'})`

const fehler: string[] = []
const hinweise: string[] = []
const antwort = extrahiereJson(readFileSync(datei, 'utf8'))
if ('fehler' in antwort) {
  console.error(`${bezeichnung}: ${antwort.fehler}`)
  process.exit(1)
}
const roh = antwort.objekt as Record<string, unknown>
if (typeof roh.nicht_durchsucht === 'string' && roh.nicht_durchsucht.trim()) {
  console.error(`${bezeichnung}: NICHT DURCHSUCHT – ${roh.nicht_durchsucht} (Programm bleibt „noch nicht erfasst“, nie in keine_massnahme umwandeln)`)
  process.exit(2)
}
if (roh.partei_id !== ziel.partei.id) fehler.push(`partei_id ist ${String(roh.partei_id)}, erwartet ${ziel.partei.id}`)
if ((roh.land ?? null) !== ziel.p.land) fehler.push(`land ist ${JSON.stringify(roh.land ?? null)}, erwartet ${JSON.stringify(ziel.p.land)}`)
if (!Array.isArray(roh.massnahmen) || roh.massnahmen.some((m) => !m || typeof m !== 'object')) fehler.push('massnahmen muss eine Liste von Objekten sein')
if (roh.keine_massnahme !== undefined && typeof roh.keine_massnahme !== 'string') fehler.push('keine_massnahme muss ein Text sein')

const programm: ErfasstesProgramm = {
  partei_id: ziel.partei.id,
  land: ziel.p.land,
  massnahmen: Array.isArray(roh.massnahmen) ? (roh.massnahmen as ErfasstesProgramm['massnahmen']) : [],
  ...(typeof roh.keine_massnahme === 'string' ? { keine_massnahme: roh.keine_massnahme } : {}),
}
fehler.push(...pruefeProgramm(katalog, themaId, programm))

if (!fehler.length && programm.massnahmen.length) {
  try {
    const { seiten } = await erfassungsSeiten(ziel.p.url, ziel.p.sha256, lokalOrdner ? lokalePdfs(lokalOrdner) : undefined)
    const gesehen = new Set<string>()
    for (const [i, m] of programm.massnahmen.entries()) {
      const was = `Maßnahme ${i + 1}`
      const befund = findeZitat(m.zitat, seiten, m.seite)
      if (befund.status === 'andere_seite') fehler.push(`${was}: Zitat steht nicht auf S. ${m.seite}, sondern auf S. ${befund.seiten.join(', ')}`)
      else if (befund.status === 'nicht_gefunden') fehler.push(`${was}: Zitat auf S. ${m.seite} nicht gefunden (wörtlich? Silbentrennung zusammenziehen, Auslassungen mit […])`)
      if (m.zitat.trim().length < 50) hinweise.push(`${was}: Zitat hat nur ${m.zitat.trim().length} Zeichen – Fragment oder Stichwort? Zusage mit Einleitungssatz zitieren`)
      const schluessel = `${m.seite}|${m.zitat.trim()}`
      if (gesehen.has(schluessel)) hinweise.push(`${was}: dasselbe Zitat auf derselben Seite wie eine frühere Maßnahme – zusammenfassen oder begründen`)
      gesehen.add(schluessel)
    }
  } catch (e) {
    fehler.push(`Zitate nicht prüfbar: ${e instanceof Error ? e.message : e}`)
  }
}

for (const h of hinweise) console.error(`Hinweis: ${bezeichnung}: ${h}`)
for (const f of fehler) console.error(`Fehler:  ${bezeichnung}: ${f}`)
console.log(`${bezeichnung}: ${programm.massnahmen.length ? `${programm.massnahmen.length} Maßnahmen` : programm.keine_massnahme ? 'keine_massnahme' : 'leer'}, ${fehler.length} Fehler, ${hinweise.length} Hinweise`)
if (fehler.length) process.exit(1)
