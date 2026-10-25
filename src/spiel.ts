import type { Partei, Seite, Thema } from './data/types'
import type { ParteiErgebnis } from './logic/bewertung'

export const RUNDEN_GESAMT = 5

export interface Spieler {
  name: string
  partei: Partei
  /**
   * Bundesland (Kürzel) – bei Ursachen in Länderzuständigkeit zählt dann das Landesprogramm. Wird einmal je Partie
   * gewählt und ist für beide Seiten gleich.
   */
  land: string | null
}

export interface RundenErgebnis {
  nr: number
  zusammenfassung: string
  /** Was die Person in dieser Runde eingegeben hat (Wortlaut, nur zur Anzeige – nicht im Teilen-Text). */
  eingaben?: string[]
  /** Vorläufige Einschätzung bei ungeprüften Themen (ohne Punkte und Links). */
  einschaetzung: string | null
  thema: Thema | null
  /** Zugeordnete Ursachen (Reihenfolge der Analyse); leer bei ungeprüften Themen. */
  ursachen_ids?: number[]
  /** Wörter aus der Schilderung, die eine Ursache stützen (nur bei Zuordnung durch die KI, nur zur Anzeige). */
  ursachen_belege?: Record<number, string>
  /** Bestätigte Symptomgruppe: Ihre Ursachen zählen alle, weil die Person nur die Folge nannte. */
  symptom?: number
  /**
   * gewertet: beide Parteien für das Thema erfasst · unvollstaendig: Thema bekannt, aber für
   * mindestens eine der beiden noch nicht erfasst oder ohne aktuelles Landesprogramm (keine Punkte)
   * · ungeprueft: Thema unbekannt.
   */
  status: 'gewertet' | 'unvollstaendig' | 'ungeprueft'
  /**
   * Die Runde begann mit einer Forderung, die einem Lösungsweg entspricht: Die Auflösung zeigt dazu die
   * Forderungskarte („Deine Forderung: …“) – ohne Punkte, zusätzlich zur Wertung des Problems.
   */
  forderung?: { instrument_id: number; thema_id: number }
  /** Haltungs- und Forderungskarten, die in dieser Runde erschienen sind (Endbildschirm „Worüber ihr gesprochen habt“). */
  karten?: Karte[]
  /** Ergebnisse der beiden gewählten Parteien (bei „gewertet“ und „unvollstaendig“). */
  ergebnisse: [ParteiErgebnis, ParteiErgebnis] | null
  /** Spielpunkte dieser Runde für A und B. */
  punkte: [number, number]
  /** Parteien mit der insgesamt besten Lösung (alle Parteien der DB, für die das Thema erfasst ist). */
  beste: ParteiErgebnis[]
  /** Parteien ohne Wertung (noch nicht erfasst oder kein aktuelles Landesprogramm). */
  nichtErfasst: Partei[]
}

/**
 * Bundesland für den Vergleich aller Parteien („Beste Lösung aller Parteien“): nur, wenn beide Seiten dasselbe
 * gewählt haben – sonst nur mit Bundesprogrammen, damit keine Seite den Vergleich bestimmt.
 */
export function vergleichsSeite([a, b]: [Spieler, Spieler]): Seite {
  return { land: a.land === b.land ? a.land : null }
}

/**
 * Karte ohne Punkte, die in einer Runde erschien: Haltungskarte (Wertfrage) oder Forderungskarte (Lösungsweg; die
 * Landesprogramme kommen aus den Bundesländern beider Seiten).
 */
export type Karte = { art: 'haltung'; haltung_id: number } | { art: 'forderung'; instrument_id: number }

const kartenSchluessel = (k: Karte) => (k.art === 'haltung' ? `h${k.haltung_id}` : `f${k.instrument_id}`)

/** Alle Karten der Partie in der Reihenfolge, in der sie erschienen – jede nur einmal. */
export function gespraechsKarten(runden: RundenErgebnis[]): Karte[] {
  const gesehen = new Map<string, Karte>()
  for (const k of runden.flatMap((r) => r.karten ?? [])) if (!gesehen.has(kartenSchluessel(k))) gesehen.set(kartenSchluessel(k), k)
  return [...gesehen.values()]
}

/** Fügt eine Karte hinzu, wenn sie noch nicht in der Liste steht. */
export const mitKarte = (karten: Karte[], k: Karte): Karte[] =>
  karten.some((x) => kartenSchluessel(x) === kartenSchluessel(k)) ? karten : [...karten, k]

/** Themen der gewerteten Runden, je Thema einmal – für Endbildschirm und Teilen-Text. */
export const gewerteteThemen = (runden: RundenErgebnis[]): string[] => [
  ...new Set(runden.filter((r) => r.status === 'gewertet' && r.thema).map((r) => r.thema!.name)),
]

/**
 * Text zum Teilen: die Themen der gewerteten Runden und eine Einladung – ohne Parteien, Punkte und Eingaben,
 * damit er sich nicht als Parteien-Punktestand verbreiten lässt (docs/plan-duell-regeln.md).
 */
export function teilenText(runden: RundenErgebnis[], kiHinweis: string | null): string {
  const themen = gewerteteThemen(runden)
  const anzahl = runden.length === 1 ? 'ein Alltagsproblem' : `${runden.length} Alltagsprobleme`
  return (
    `Wir haben im Politik-Duell ${anzahl} durchgespielt${themen.length ? `: ${themen.join(', ')}` : ''}. ` +
    'Welche Partei hat dafür die wirksamste Lösung – mit Beleg? Spielt es selbst. ' +
    (kiHinweis ? `(Testphase – ${kiHinweis}.) ` : '') +
    'Versprechen kann jeder.'
  )
}

export function gesamtpunkte(runden: RundenErgebnis[]): [number, number] {
  return runden.reduce<[number, number]>((s, r) => [s[0] + r.punkte[0], s[1] + r.punkte[1]], [0, 0])
}

