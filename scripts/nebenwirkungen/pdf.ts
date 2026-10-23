// PDF als Text für den Agenten nebenwirkungen-recherche: WebFetch scheiterte in den ersten Läufen an vielen
// Drucksachen und Gutachten. Gibt nur Fundstellen mit Seite aus, nicht das ganze Dokument (spart Tokens).
// Aufruf: npm run -s nebenwirkungen:pdf -- <https-Adresse> ['Suchbegriff …'] | --seite <n>
//   ohne Suchbegriff: Seitenzahl und Anfang des Dokuments; mit Suchbegriff: Stellen, an denen alle Wörter
//   auf einer Seite vorkommen; --seite: eine Seite ganz. Parteiserver gesperrt wie im Hook.
import { readFileSync } from 'node:fs'
import { pruefeKatalog } from '../../src/data/katalog.ts'
// @ts-expect-error – Hook in reinem JavaScript (schneller Start), ohne Typdeklaration
import { gesperrteAdresse } from '../../.claude/hooks/sperre.mjs'
import { pruefkontext } from '../nebenwirkungen.ts'
import { seitenTexte } from '../zitate.ts'

const MAX_BYTES = 40 * 1024 * 1024
const UMFELD = 350
const MAX_STELLEN = 10
const MAX_SEITE = 8000

const args = process.argv.slice(2)
const url = args[0]
const seiteArg = args.indexOf('--seite')
const seite = seiteArg > 0 ? Number(args[seiteArg + 1]) : undefined
const begriffe = seiteArg > 0 ? [] : args.slice(1).join(' ').toLowerCase().split(/\s+/).filter((w) => w.length >= 2)
if (!url || !/^https:\/\//.test(url) || (seite !== undefined && !Number.isInteger(seite))) {
  console.error("Aufruf: npm run -s nebenwirkungen:pdf -- <https-Adresse> ['Suchbegriff …'] | --seite <n>")
  process.exit(1)
}
const wurzel = new URL('../../', import.meta.url)
const parteien = { pfad: 'parteien.json', inhalt: JSON.parse(readFileSync(new URL('daten/parteien.json', wurzel), 'utf8')) }
const ctx = pruefkontext(pruefeKatalog(parteien, []).katalog, wurzel)
const grund = gesperrteAdresse(url, ctx.liste, ctx.programmHosts)
if (grund) {
  console.error(`Gesperrt: ${grund}`)
  process.exit(1)
}

let res: Response
try {
  res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(60_000) })
} catch (e) {
  console.error(`Nicht abrufbar: ${e instanceof Error ? (e.cause as { code?: string })?.code ?? e.message : e}`)
  process.exit(1)
}
const endAdresse = gesperrteAdresse(res.url, ctx.liste, ctx.programmHosts)
if (endAdresse) {
  console.error(`Gesperrt nach Weiterleitung: ${endAdresse}`)
  process.exit(1)
}
const daten = new Uint8Array(await res.arrayBuffer())
if (!res.ok || daten.length > MAX_BYTES || String.fromCharCode(...daten.slice(0, 5)) !== '%PDF-') {
  console.error(`Kein lesbares PDF (HTTP ${res.status}, ${Math.round(daten.length / 1024)} KB)`)
  process.exit(1)
}
const seiten = (await seitenTexte(daten)).map((t) => t.replace(/[ \t]+/g, ' ').replace(/(\p{Ll})- ?\n(\p{Ll})/gu, '$1$2').replace(/\n{2,}/g, '\n').trim())
const leer = seiten.every((t) => t.length < 20)
if (leer) {
  console.error(`${seiten.length} Seiten, aber kein Text (eingescannt?) – Quelle nicht verwendbar`)
  process.exit(1)
}

if (seite !== undefined) {
  const t = seiten[seite - 1]
  if (t === undefined) {
    console.error(`Seite ${seite} gibt es nicht (${seiten.length} Seiten)`)
    process.exit(1)
  }
  console.log(`S. ${seite} von ${seiten.length}:\n${t.slice(0, MAX_SEITE)}${t.length > MAX_SEITE ? ' …' : ''}`)
} else if (!begriffe.length) {
  console.log(`${seiten.length} Seiten. Anfang:\n${seiten.join('\n').slice(0, 2500)}`)
} else {
  // Seitenzahl im Beleg: physische Seite des PDFs (S. 1 = erste Seite der Datei).
  const stellen: string[] = []
  for (const [i, t] of seiten.entries()) {
    const klein = t.toLowerCase()
    if (!begriffe.every((w) => klein.includes(w))) continue
    let ab = 0
    while (stellen.length < MAX_STELLEN) {
      const pos = klein.indexOf(begriffe[0], ab)
      if (pos < 0) break
      stellen.push(`S. ${i + 1}: …${t.slice(Math.max(0, pos - UMFELD), pos + UMFELD).replace(/\n/g, ' ')}…`)
      ab = pos + UMFELD
    }
    if (stellen.length >= MAX_STELLEN) break
  }
  console.log(stellen.length ? `${seiten.length} Seiten, Fundstellen:\n${stellen.join('\n\n')}` : `${seiten.length} Seiten, keine Seite enthält alle Wörter „${begriffe.join(' ')}“`)
}
