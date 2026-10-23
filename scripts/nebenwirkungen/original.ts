// Originaltext einer Quelle (PDF je Seite, HTML als ein Text), zwischengespeichert unter
// .cache/nebenwirkungen/original/. Grundlage für nebenwirkungen:pdf und für die Selbstprüfung, ob ein Beleg
// wörtlich in der Quelle steht – WebFetch liefert nur eine Zusammenfassung, aus der in Thema 42 Belege stammten.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { seitenTexte } from '../zitate.ts'

const MAX_BYTES = 40 * 1024 * 1024
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const ORDNER = new URL('../../.cache/nebenwirkungen/original/', import.meta.url)

export type Original = { pdf: boolean; seiten: string[]; endAdresse: string }

const datei = (url: string) => new URL(`${createHash('sha256').update(url).digest('hex').slice(0, 16)}.json`, ORDNER)

const ENTITAETEN: Record<string, string> = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', euro: '€', ndash: '–', mdash: '—', bdquo: '„', ldquo: '“', rdquo: '”', sbquo: '‚', lsquo: '‘', rsquo: '’', shy: '­', hellip: '…', sect: '§' }

/** Sichtbarer Text einer HTML-Seite (ohne Skripte, Stile und Tags). */
export const htmlText = (html: string) =>
  html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e: string) =>
      e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITAETEN[e] ?? m),
    )
    .replace(/\s+/g, ' ')
    .trim()

/** Lädt die Quelle (oder nimmt den Zwischenspeicher); bei Fehler eine kurze Begründung. */
export async function ladeOriginal(url: string, { nurPdf = false } = {}): Promise<Original | { fehler: string }> {
  if (existsSync(datei(url))) {
    const o = JSON.parse(readFileSync(datei(url), 'utf8')) as Original
    if (o.pdf || !nurPdf) return o
  }
  let res: Response
  try {
    // Manche Bundesstellen (etwa die Mindestlohnkommission) antworten ohne Browser-Kennung und Sprache mit 403.
    res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': BROWSER, Accept: nurPdf ? 'application/pdf,*/*' : 'text/html,application/pdf,*/*', 'Accept-Language': 'de-DE,de;q=0.9' }, signal: AbortSignal.timeout(60_000) })
  } catch (e) {
    return { fehler: `Nicht abrufbar: ${e instanceof Error ? (e.cause as { code?: string })?.code ?? e.message : e}` }
  }
  const daten = new Uint8Array(await res.arrayBuffer())
  const pdf = String.fromCharCode(...daten.slice(0, 5)) === '%PDF-'
  if (!res.ok || daten.length > MAX_BYTES || (nurPdf && !pdf)) return { fehler: `Kein lesbares ${nurPdf ? 'PDF' : 'Dokument'} (HTTP ${res.status}, ${Math.round(daten.length / 1024)} KB)` }
  const seiten = pdf
    ? (await seitenTexte(daten)).map((t) => t.replace(/[ \t]+/g, ' ').replace(/(\p{Ll})- ?\n(\p{Ll})/gu, '$1$2').replace(/\n{2,}/g, '\n').trim())
    : [htmlText(new TextDecoder().decode(daten))]
  const o: Original = { pdf, seiten, endAdresse: res.url }
  mkdirSync(ORDNER, { recursive: true })
  writeFileSync(datei(url), JSON.stringify(o))
  return o
}
