// Transkripte der Agenten nebenwirkungen-recherche (Claude Code legt sie je Sitzung unter subagents/ ab): für den
// Verbrauch (verbrauch.ts) und für die Selbstprüfung, welche Suchen liefen und welche Quellen geöffnet wurden.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
// @ts-expect-error – Hook in reinem JavaScript (schneller Start), ohne Typdeklaration
import { NEBEN_PDFBEFEHL } from '../../.claude/hooks/sperre.mjs'
import type { Werkzeuge } from '../nebenwirkungen.ts'

export type Zeile = {
  type?: string
  timestamp?: string
  isMeta?: boolean
  origin?: { kind?: string }
  message?: { id?: string; model?: string; content?: unknown; usage?: Record<string, number> }
}

export const AUFTRAG = /Recherchiere \.cache\/nebenwirkungen\/(\d+)\/teil-(\d+)\.json/
const wurzel = fileURLToPath(new URL('../../', import.meta.url))
export const TRANSKRIPTE = join(homedir(), '.claude', 'projects', wurzel.replace(/\/$/, '').replace(/[/.]/g, '-'))

export const lies = (datei: string): Zeile[] =>
  readFileSync(datei, 'utf8')
    .split('\n')
    .flatMap((s) => {
      try {
        return s ? [JSON.parse(s) as Zeile] : []
      } catch {
        return []
      }
    })

/** Alle Transkripte eines Agenten (Standard: nebenwirkungen-recherche, auch rollen-recherche): Sitzung, Datei, Zeilen. */
export function agentenTranskripte(ordner = TRANSKRIPTE, agent = 'nebenwirkungen-recherche'): { sitzung: string; zeilen: Zeile[] }[] {
  if (!existsSync(ordner)) return []
  return readdirSync(ordner, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(ordner, d.name, 'subagents')))
    .flatMap((d) => {
      const sub = join(ordner, d.name, 'subagents')
      return readdirSync(sub)
        .filter((f) => f.endsWith('.meta.json'))
        .filter((f) => JSON.parse(readFileSync(join(sub, f), 'utf8')).agentType === agent)
        .map((f) => join(sub, f.replace('.meta.json', '.jsonl')))
        .filter(existsSync)
        .map((datei) => ({ sitzung: d.name, zeilen: lies(datei) }))
    })
}

/** Auftrag (Thema, Teil) aus der ersten Nachricht eines Transkripts. */
export function auftragDes(zeilen: Zeile[], auftrag = AUFTRAG): { thema: number; teil: number } | undefined {
  const erste = zeilen.find((z) => z.type === 'user' && typeof z.message?.content === 'string')
  const t = (erste?.message?.content as string | undefined)?.match(auftrag)
  return t ? { thema: Number(t[1]), teil: Number(t[2]) } : undefined
}

export const werkzeugAufrufe = (zeilen: Zeile[]) =>
  zeilen.flatMap((z) =>
    z.type === 'assistant' && Array.isArray(z.message?.content)
      ? (z.message.content as { type: string; name?: string; input?: Record<string, unknown> }[]).filter((b) => b.type === 'tool_use')
      : [],
  )

/** Suchanfragen und geöffnete Adressen eines Transkripts. */
export function werkzeugeAus(zeilen: Zeile[]): Werkzeuge {
  const w: Werkzeuge = { suchen: [], adressen: [] }
  for (const a of werkzeugAufrufe(zeilen)) {
    const e = a.input ?? {}
    if (a.name === 'WebSearch' && typeof e.query === 'string') w.suchen.push(e.query)
    if (a.name === 'WebFetch' && typeof e.url === 'string') w.adressen.push(e.url)
    const pdf = a.name === 'Bash' && typeof e.command === 'string' ? NEBEN_PDFBEFEHL.exec(e.command.trim()) : null
    if (pdf) {
      w.adressen.push(pdf[2])
      const woerter = pdf[3]?.match(/^ '(.*)'$/)?.[1]
      if (woerter) w.suchen.push(woerter)
    }
  }
  return w
}

/** Werkzeuge des jüngsten Agenten für Thema und Teil, oder undefined ohne Transkript (andere Umgebung). */
export function werkzeugeDesTeils(
  thema: number,
  teil: number,
  ordner = TRANSKRIPTE,
  { agent, auftrag }: { agent?: string; auftrag?: RegExp } = {},
): Werkzeuge | undefined {
  const passend = agentenTranskripte(ordner, agent)
    .filter((t) => {
      const a = auftragDes(t.zeilen, auftrag)
      return a?.thema === thema && a.teil === teil
    })
    .sort((a, b) => (a.zeilen[0]?.timestamp ?? '').localeCompare(b.zeilen[0]?.timestamp ?? ''))
  const juengster = passend.at(-1)
  return juengster && werkzeugeAus(juengster.zeilen)
}
