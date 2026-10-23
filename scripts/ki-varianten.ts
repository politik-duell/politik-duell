// Entwirft je Ursache drei Eingaben, wie Spielende das Problem selbst eintippen würden (kurz, mit Detail,
// umgangssprachlich), als Testfälle für `npm run ki:testset -- --alltag`. Die Alltagssätze im Katalog sind
// sorgfältig formuliert; echte Eingaben sind kürzer und vager (Anlass: „Von meinem Lohn bleibt nicht viel
// übrig“ landete im falschen Thema, der Alltagssatz der Ursache nicht). Ergänzt nur fehlende Ursachen, damit
// durchgesehene und von Hand korrigierte Fassungen erhalten bleiben. KI-Entwurf: vor dem Einchecken lesen.
//
//   MISTRAL_API_KEY=… npm run ki:varianten [-- --themen 11,42] [--max-anfragen <n>]   (je Ursache ein Aufruf, ohne Angabe höchstens 100)
import { readFileSync, writeFileSync } from 'node:fs'
import { frageMistral } from '../supabase/functions/_shared/mistral.ts'
import { pruefeDatenordner } from './katalog-laden.ts'
import type { Variante } from './ki-testset/auswertung.ts'
import { anfragenGrenze } from './ki-testset/grenze.ts'

const DATEI = new URL('ki-testset/varianten.json', import.meta.url)
const GLEICHZEITIG = 4

const key = process.env.MISTRAL_API_KEY
if (!key) {
  console.error('MISTRAL_API_KEY fehlt.')
  process.exit(1)
}
const i = process.argv.indexOf('--themen')
const nurThemen = i >= 0 ? process.argv[i + 1].split(',').map(Number) : null
const { katalog } = pruefeDatenordner()

const HINWEIS =
  'KI-Entwürfe (npm run ki:varianten): je Ursache drei Eingaben in eigenen Worten von Spielenden. Testfälle, keine Daten – ' +
  'durchsehen und falsche oder mehrdeutige Sätze korrigieren oder löschen; gelöschte Ursachen erzeugt der nächste Lauf neu.'
const SYSTEM = `Du schreibst Testeingaben für ein Spiel, in dem Menschen ein Problem aus ihrem Alltag eintippen.
Gegeben sind ein Thema und eine Ursache. Schreibe genau drei Sätze, wie drei verschiedene Menschen genau dieses Problem selbst eintippen würden:
1. kurz und umgangssprachlich, höchstens zwölf Wörter
2. mit einem konkreten Detail aus dem eigenen Leben
3. so, wie man es einer Freundin erzählt, ein bis zwei Sätze
Regeln: Ich- oder Wir-Form. Ein erlebtes Problem, keine Forderung („man müsste …“, „weg mit …“), keine Partei, kein Urteil über Gruppen.
Den Namen des Themas und die Fachbegriffe der Beschreibung nicht wörtlich übernehmen. Jeder Satz muss eindeutig zu dieser Ursache passen.
Antworte als JSON: {"saetze": ["…", "…", "…"]}`

let bestand: Variante[] = []
try {
  bestand = (JSON.parse(readFileSync(DATEI, 'utf8')) as { varianten: Variante[] }).varianten
} catch {
  // Erster Lauf: Datei fehlt noch.
}
const vorhanden = new Set(bestand.map((v) => v.ursache))
const offen = katalog.ursachen.filter((u) => !vorhanden.has(u.id) && (!nurThemen || nurThemen.includes(u.thema_id)))
const zaehle = anfragenGrenze(offen.length)

const neu: Variante[] = []
let naechste = 0
await Promise.all(
  Array.from({ length: GLEICHZEITIG }, async () => {
    while (naechste < offen.length) {
      const u = offen[naechste++]
      const thema = katalog.themen.find((t) => t.id === u.thema_id)!
      const frage = `Thema: ${thema.name}\nUrsache: ${u.beschreibung}${u.alltag ? `\nIm Alltag: „${u.alltag}“` : ''}${u.gilt_fuer ? `\nGilt nur für: ${u.gilt_fuer}` : ''}`
      try {
        zaehle()
        const antwort = (await frageMistral(SYSTEM, [{ role: 'user', content: frage }], { key: key! }, 400)) as { saetze?: unknown }
        const saetze = Array.isArray(antwort.saetze) ? antwort.saetze.filter((s): s is string => typeof s === 'string' && s.trim() !== '') : []
        saetze.slice(0, 3).forEach((text, n) => neu.push({ id: `var-${u.id}-${n + 1}`, ursache: u.id, text: text.trim() }))
      } catch (e) {
        console.error(`Ursache ${u.id}: ${e instanceof Error ? e.message : e}`)
      }
    }
  }),
)
const varianten = [...bestand, ...neu].sort((a, b) => a.ursache - b.ursache || a.id.localeCompare(b.id))
writeFileSync(DATEI, `${JSON.stringify({ hinweis: HINWEIS, varianten }, null, 1)}\n`)
console.log(`${neu.length} neue Fassungen für ${offen.length} Ursachen, zusammen ${varianten.length}.`)
