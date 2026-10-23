// Selbstprüfung des Agenten nebenwirkungen-recherche: liest nur teil-<n>.json und die eigene Antwort.
// Aufruf: npm run nebenwirkungen:antwort-pruefen -- <Thema-ID> <Teil>
import { existsSync, readFileSync } from 'node:fs'
import { erstesJsonObjekt } from '../entwurf/json-text.ts'
import { pruefeKatalog } from '../../src/data/katalog.ts'
import { belegSeite, bilanz, NEBEN_ORDNER, pruefeNebenAntwort, pruefkontext, type NebenAntwort, type NebenBlindliste } from '../nebenwirkungen.ts'
// @ts-expect-error – Hook in reinem JavaScript (schneller Start), ohne Typdeklaration
import { gesperrteAdresse } from '../../.claude/hooks/sperre.mjs'
import { ladeOriginal } from './original.ts'
import { werkzeugeDesTeils } from './transkript.ts'

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
const ctx = pruefkontext(katalog, wurzel)
// Gegen das Transkript: Liefen die Suchen in „gesucht“, wurden die Quellen selbst geöffnet?
const werkzeuge = werkzeugeDesTeils(id, teil)
const { fehler, warnungen } = pruefeNebenAntwort(liste, antwort, ctx, werkzeuge)
if (!werkzeuge) warnungen.push('Kein Transkript des Agenten gefunden – Suchen und geöffnete Quellen nicht abgeglichen')
// Gegen das Original: Steht der Beleg wörtlich in der Quelle (bei PDFs auf der angegebenen Seite)?
const hinweise = (Array.isArray(antwort?.einheiten) ? antwort.einheiten : []).flatMap((e) =>
  (Array.isArray(e?.bereiche) ? e.bereiche : []).flatMap((b) =>
    b?.hinweis && typeof b.hinweis.beleg === 'string' && /^https:\/\//.test(String(b.hinweis.quelle_url)) && !gesperrteAdresse(b.hinweis.quelle_url, ctx.liste, ctx.programmHosts) ? [{ ort: `Lösungsweg ${e.id} › ${b.bereich}`, h: b.hinweis }] : [],
  ),
)
for (const { ort, h, o } of await Promise.all(hinweise.map(async (x) => ({ ...x, o: await ladeOriginal(x.h.quelle_url) })))) {
  if ('fehler' in o) {
    warnungen.push(`${ort}: Beleg nicht im Original prüfbar (${o.fehler})`)
    continue
  }
  const seite = belegSeite(h.beleg, o.seiten)
  const angegeben = Number(h.beleg.match(/\bS\.\s*(\d+)[\d\s,f.–-]*\)?\s*$/)?.[1])
  // Seiten, die erst ein Skript füllt, haben kaum Text – dort kein Fehler, nur ein Hinweis.
  if (!seite && !o.pdf && o.seiten[0].length < 1500) warnungen.push(`${ort}: Beleg nicht im Original gefunden (Seite fast ohne Text)`)
  else if (!seite)
    fehler.push(`${ort}: „beleg“ steht nicht wörtlich unter ${h.quelle_url} – aus dem Originaltext übernehmen (nebenwirkungen:pdf bzw. Seite selbst), nicht aus einer Zusammenfassung`)
  else if (o.pdf && angegeben && angegeben !== seite) fehler.push(`${ort}: „beleg“ steht auf S. ${seite}, nicht S. ${angegeben}`)
}
for (const f of fehler) console.error(`Fehler:  ${f}`)
for (const w of warnungen) console.error(`Hinweis: ${w}`)
if (fehler.length) process.exit(1)
console.log(`In Ordnung: ${antwort.einheiten.length} Lösungswege.\n${bilanz(antwort).join('\n')}`)
