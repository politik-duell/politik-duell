import { kartenHaltungen, type Daten } from '../data/quelle'
import { instrumenteZurAuswahl } from '../../supabase/functions/_shared/ki.ts'
import { fuerBeideErfasst } from './stand'

// Zufallsbeispiel für die Eingabe (Aufbau- und Testphase): ein Problem, eine Forderung oder eine Haltung, die
// die Datenbank schon beantworten kann – damit man nicht ins Leere fragt. Der Text kommt nur aus der Datenbank
// und geht wie eine getippte Eingabe an die KI; gewertet wird wie sonst auch.

export type BeispielArt = 'problem' | 'forderung' | 'wert'

export interface Beispiel {
  art: BeispielArt
  text: string
}

export interface BeispielOptionen {
  parteiIds: [number, number]
  land: string | null
  /** Haltungen nur, solange in dieser Runde noch keine Haltungskarte kam (höchstens eine je Runde). */
  mitHaltung: boolean
}

/** Alle Kandidaten je Art – leer, wenn die Datenbank für diese Art noch nichts Passendes hat. */
export function beispielKandidaten(daten: Daten, o: BeispielOptionen): Record<BeispielArt, string[]> {
  const erfasst = daten.themen.filter((t) => fuerBeideErfasst(daten, t.id, o.parteiIds))
  const erfassteIds = new Set(erfasst.map((t) => t.id))

  // Problem: Ursache eines Themas, das für beide Parteien ausgewertet ist, in der Sprache der Betroffenen.
  // Ohne Alltagsfassung (ältere Daten) die Beschreibung. Ursachen in Länderzuständigkeit nur mit gewähltem Land.
  const probleme = daten.ursachen
    .filter((u) => erfassteIds.has(u.thema_id) && ((u.ebene ?? 'bund') === 'bund' || o.land !== null))
    .map((u) => u.alltag || u.beschreibung)

  // Forderung: Lösungsweg, zu dem es eine Forderungskarte gibt (gleiche Auswahl wie bei der KI).
  const forderungen = erfasst
    .flatMap((t) => instrumenteZurAuswahl(t.id, daten.instrumente, daten.massnahmen, o.land))
    .map((i) => `Meine Forderung: ${i.name.replace(/\s*\((Bund|Land)\)$/, '')}.`)

  // Haltung: nur Wertfragen mit vollständiger Karte; Ja oder Nein per Zufall, damit keine Seite vorgegeben ist.
  const haltungen = o.mitHaltung
    ? kartenHaltungen(daten).flatMap((h) => [`${h.frage} Ich finde: ja.`, `${h.frage} Ich finde: nein.`])
    : []

  return { problem: probleme, forderung: forderungen, wert: haltungen }
}

/**
 * Zieht ein Beispiel: erst eine Art (gleich wahrscheinlich unter denen mit Kandidaten), dann einen Text.
 * `vorher` wird nach Möglichkeit nicht wiederholt. null, wenn die Datenbank noch nichts Passendes hat.
 */
export function zufallsBeispiel(
  daten: Daten,
  o: BeispielOptionen,
  vorher: string | null = null,
  zufall: () => number = Math.random,
): Beispiel | null {
  const kandidaten = beispielKandidaten(daten, o)
  const arten = (Object.keys(kandidaten) as BeispielArt[]).filter((a) =>
    kandidaten[a].some((t) => t !== vorher),
  )
  if (!arten.length) return null
  const art = arten[Math.floor(zufall() * arten.length)]
  const texte = kandidaten[art].filter((t) => t !== vorher)
  return { art, text: texte[Math.floor(zufall() * texte.length)] }
}
