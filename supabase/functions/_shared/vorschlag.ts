// Themenvorschläge (Edge Function `vorschlag`, Migration 20261103000000): Wer ein Thema vermisst, schlägt es
// ausdrücklich vor. Ohne KI – nur Prüfung von Format und Wortfilter, dann ein Eintrag in `themen_vorschlaege`.
// Reines TypeScript, damit es in der App getestet und in der Funktion genutzt werden kann.

import { EingabeFehler } from './fehler.ts'
import { type FilterGrund, pruefeText } from './moderation.ts'

export const VORSCHLAG_MIN = 3
export const VORSCHLAG_MAX = 500

/** Pro Browser-Tab: wenige Vorschläge je Stunde. */
export const RATE_LIMIT_VORSCHLAG = { max: 5, fenster: '1 hour' }
/** Für alle zusammen – gegen massenhaftes Einwerfen. */
export const RATE_LIMIT_VORSCHLAG_GLOBAL = { max: 300, fenster: '1 hour' }
/** Feste ID des globalen Zählers (keine gültige Sitzung, nicht Version 4). */
export const VORSCHLAG_GLOBAL = '00000000-0000-0000-0000-000000000002'

const SITZUNG_MUSTER = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface VorschlagAnfrage {
  text: string
  sitzung: string
}

/** Warum ein Text nicht angenommen wird – die Person kann ihn umformulieren. */
export const ABLEHNUNG: Record<FilterGrund, string> = {
  kontaktdaten: 'Bitte ohne Kontaktdaten, Adressen oder Links – beschreib nur das Thema.',
  person: 'Bitte ohne Namen von Personen – beschreib nur das Thema.',
  beleidigung: 'Bitte ohne Beleidigungen – beschreib nur das Thema.',
  hetze: 'Diesen Vorschlag nehmen wir nicht an.',
}

/** Text in eine Zeile mit einfachen Leerzeichen, ohne Steuerzeichen. */
export function bereinigeVorschlag(text: string): string {
  // eslint-disable-next-line no-control-regex -- Steuerzeichen gezielt entfernen
  return text.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function pruefeVorschlag(roh: unknown): VorschlagAnfrage {
  if (!roh || typeof roh !== 'object') throw new EingabeFehler('Ungültige Anfrage.')
  const a = roh as Record<string, unknown>
  if (typeof a.sitzung !== 'string' || !SITZUNG_MUSTER.test(a.sitzung)) throw new EingabeFehler('Ungültige Sitzung.')
  if (typeof a.text !== 'string') throw new EingabeFehler('Bitte beschreib das Thema.')
  const text = bereinigeVorschlag(a.text)
  if (text.length < VORSCHLAG_MIN) throw new EingabeFehler('Bitte beschreib das Thema in ein paar Worten.')
  if (text.length > VORSCHLAG_MAX) throw new EingabeFehler(`Bitte höchstens ${VORSCHLAG_MAX} Zeichen.`)
  const grund = pruefeText(text)
  if (grund) throw new EingabeFehler(ABLEHNUNG[grund])
  return { text, sitzung: a.sitzung }
}

/**
 * Eigener Zähler für Vorschläge, damit sie das Limit der Einordnung nicht mitverbrauchen: eine aus der
 * Sitzungs-ID abgeleitete UUID (SHA-256), ebenfalls ohne Bezug zu einer Person.
 */
export async function vorschlagSchluessel(sitzung: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`vorschlag:${sitzung}`)))
  const h = [...d.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

export interface VorschlagSpeicher {
  imLimit(schluessel: string, max: number, fenster: string): Promise<boolean>
  /** Legt den Vorschlag an – nur der Text, sonst nichts. */
  speichern(text: string): Promise<void>
}

export async function bearbeiteVorschlag(
  roh: unknown,
  speicher: VorschlagSpeicher,
): Promise<{ status: number; body: { ok: true } | { fehler: string } }> {
  let anfrage: VorschlagAnfrage
  try {
    anfrage = pruefeVorschlag(roh)
  } catch (e) {
    if (e instanceof EingabeFehler) return { status: 400, body: { fehler: e.message } }
    throw e
  }
  const s = RATE_LIMIT_VORSCHLAG
  if (!(await speicher.imLimit(await vorschlagSchluessel(anfrage.sitzung), s.max, s.fenster)))
    return { status: 429, body: { fehler: 'Danke für deine Vorschläge! Für den Moment sind es genug – später gern mehr.' } }
  const g = RATE_LIMIT_VORSCHLAG_GLOBAL
  if (!(await speicher.imLimit(VORSCHLAG_GLOBAL, g.max, g.fenster)))
    return { status: 503, body: { fehler: 'Gerade kommen sehr viele Vorschläge an. Bitte versuch es später noch einmal.' } }
  await speicher.speichern(anfrage.text)
  return { status: 200, body: { ok: true } }
}
