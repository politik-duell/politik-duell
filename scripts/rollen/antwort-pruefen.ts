// Selbstprüfung des Agenten rollen-recherche: liest nur teil-<n>.json und die eigene Antwort.
// Aufruf: npm run rollen:antwort-pruefen -- <Thema-ID> <Teil>
import { existsSync, readFileSync } from 'node:fs'
import { erstesJsonObjekt } from '../entwurf/json-text.ts'
import { pruefeKatalog } from '../../src/data/katalog.ts'
import { belegSeite, pruefkontext } from '../nebenwirkungen.ts'
import { ladeOriginal } from '../nebenwirkungen/original.ts'
import { pruefeRollenAntwort, ROLLEN_ORDNER, rollenBilanz, type RollenAntwort, type RollenBlindliste } from '../rollen.ts'
import { ROLLEN_TRANSKRIPT } from './transkript.ts'
import { werkzeugeDesTeils } from '../nebenwirkungen/transkript.ts'
// @ts-expect-error – Hook in reinem JavaScript (schneller Start), ohne Typdeklaration
import { gesperrteAdresse } from '../../.claude/hooks/sperre.mjs'

const [id, teil] = process.argv.slice(2).map(Number)
const ordner = new URL(`../../${ROLLEN_ORDNER(id)}/`, import.meta.url)
const antwortPfad = new URL(`protokoll/antwort-${teil}.txt`, ordner)
if (!Number.isInteger(id) || !Number.isInteger(teil) || !existsSync(antwortPfad)) {
  console.error(`Aufruf: npm run -s rollen:antwort-pruefen -- <Thema-ID> <Teil> (erwartet ${ROLLEN_ORDNER(id)}/protokoll/antwort-${teil}.txt)`)
  process.exit(1)
}
const liste = JSON.parse(readFileSync(new URL(`teil-${teil}.json`, ordner), 'utf8')) as RollenBlindliste
let antwort: RollenAntwort
try {
  antwort = erstesJsonObjekt(readFileSync(antwortPfad, 'utf8')).objekt as RollenAntwort
} catch (e) {
  console.error(`Kein gültiges JSON: ${e instanceof Error ? e.message : e}`)
  process.exit(1)
}
// Nur Parteien und Programmserver – keine Themendateien (der Agent soll keine Maßnahmen sehen, auch nicht indirekt).
const wurzel = new URL('../../', import.meta.url)
const parteien = { pfad: 'parteien.json', inhalt: JSON.parse(readFileSync(new URL('daten/parteien.json', wurzel), 'utf8')) }
const ctx = pruefkontext(pruefeKatalog(parteien, []).katalog, wurzel)
const werkzeuge = werkzeugeDesTeils(id, teil, undefined, ROLLEN_TRANSKRIPT)
const { fehler, warnungen } = pruefeRollenAntwort(liste, antwort, ctx, werkzeuge)
if (!werkzeuge) warnungen.push('Kein Transkript des Agenten gefunden – Suchen und geöffnete Quellen nicht abgeglichen')
// Gegen das Original: Steht der Beleg wörtlich in der Quelle (bei PDFs auf der angegebenen Seite)?
const mods = (Array.isArray(antwort?.einheiten) ? antwort.einheiten : []).flatMap((e) =>
  (Array.isArray(e?.modifikatoren) ? e.modifikatoren : []).flatMap((m) =>
    typeof m?.beleg === 'string' && /^https:\/\//.test(String(m.quelle_url)) && !gesperrteAdresse(m.quelle_url, ctx.liste, ctx.programmHosts)
      ? [{ ort: `Lösungsweg ${e.id} › ${m.rolle}`, m }]
      : [],
  ),
)
for (const { ort, m, o } of await Promise.all(mods.map(async (x) => ({ ...x, o: await ladeOriginal(x.m.quelle_url) })))) {
  if ('fehler' in o) {
    warnungen.push(`${ort}: Beleg nicht im Original prüfbar (${o.fehler})`)
    continue
  }
  const seite = belegSeite(m.beleg, o.seiten)
  const angegeben = Number(m.beleg.match(/\bS\.\s*(\d+)[\d\s,f.–-]*\)?\s*$/)?.[1])
  if (!seite && !o.pdf && o.seiten[0].length < 1500) warnungen.push(`${ort}: Beleg nicht im Original gefunden (Seite fast ohne Text)`)
  else if (!seite) fehler.push(`${ort}: „beleg“ steht nicht wörtlich unter ${m.quelle_url} – aus dem Originaltext übernehmen, nicht aus einer Zusammenfassung`)
  else if (o.pdf && angegeben && angegeben !== seite) fehler.push(`${ort}: „beleg“ steht auf S. ${seite}, nicht S. ${angegeben}`)
}
for (const f of fehler) console.error(`Fehler:  ${f}`)
for (const w of warnungen) console.error(`Hinweis: ${w}`)
if (fehler.length) process.exit(1)
console.log(`In Ordnung: ${antwort.einheiten.length} Lösungswege.\n${rollenBilanz(antwort).join('\n')}`)
