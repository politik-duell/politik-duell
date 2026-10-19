import { kartenHaltungen, type Daten } from '../data/quelle'
import { instrumenteZurAuswahl } from '../../supabase/functions/_shared/ki.ts'
import { fuerBeideErfasst } from './stand'

// Zufallsbeispiel für die Eingabe (immer sichtbar): ein Problem, eine Forderung oder eine Haltung, die die
// Datenbank schon beantworten kann – zum Durchspielen ohne eigene Idee und damit niemand ins Leere fragt. Der Text kommt nur aus der Datenbank
// und geht wie eine getippte Eingabe an die KI; gewertet wird wie sonst auch.

export const PROBLEM_VORSPANN = 'Mein Problem im Alltag: '

export type BeispielArt = 'problem' | 'forderung' | 'wert'

export interface Beispiel {
  art: BeispielArt
  text: string
}

export interface BeispielOptionen {
  parteiIds: [number, number]
  /** Bundesländer der beiden Seiten (je eins oder keins). */
  laender: (string | null)[]
  /** Haltungen nur, solange in dieser Runde noch keine Haltungskarte kam (höchstens eine je Runde). */
  mitHaltung: boolean
  /** Nur Alltagsprobleme (Schalter „nur Probleme“) – etwa zum Testen der Wertung. */
  nurProbleme?: boolean
}

/**
 * Gewicht je Art beim Ziehen: Alltagsprobleme sind der Kern des Spiels und kommen dreimal so oft wie
 * Forderungen oder Haltungen (die keine Punkte bringen bzw. erst nachfragen).
 */
export const BEISPIEL_GEWICHT: Record<BeispielArt, number> = { problem: 3, forderung: 1, wert: 1 }

/** Alle Kandidaten je Art – leer, wenn die Datenbank für diese Art noch nichts Passendes hat. */
export function beispielKandidaten(daten: Daten, o: BeispielOptionen): Record<BeispielArt, string[]> {
  const erfasst = daten.themen.filter((t) => fuerBeideErfasst(daten, t.id, o.parteiIds))
  const erfassteIds = new Set(erfasst.map((t) => t.id))

  // Problem: Ursache eines Themas, das für beide Parteien ausgewertet ist, in der Sprache der Betroffenen.
  // Ohne Alltagsfassung (ältere Daten) die Beschreibung. Ursachen in Länderzuständigkeit nur mit gewähltem Land.
  // Ausdrücklich als Problem – sonst liest die KI manche Fassung („… bleiben trotzdem hier“) als Forderung.
  const probleme = daten.ursachen
    .filter((u) => erfassteIds.has(u.thema_id) && ((u.ebene ?? 'bund') === 'bund' || o.laender.some((l) => l !== null)))
    .map((u) => `${PROBLEM_VORSPANN}${u.alltag || u.beschreibung}`)

  // Forderung: Lösungsweg, zu dem es eine Forderungskarte gibt (gleiche Auswahl wie bei der KI).
  const forderungen = erfasst
    .flatMap((t) => instrumenteZurAuswahl(t.id, daten.instrumente, daten.massnahmen, o.laender))
    .map((i) => `Meine Forderung: ${i.name.replace(/\s*\((Bund|Land)\)$/, '')}.`)

  // Haltung: nur Wertfragen mit vollständiger Karte; Ja oder Nein per Zufall, damit keine Seite vorgegeben ist.
  // Mit der Frage im Wortlaut, damit die KI die Haltung erkennt – sonst liest sie „für die Steuer“ als Forderung.
  // So, wie man es sagen würde; den Satz „darüber kann man verschieden denken“ sagt das Spiel selbst.
  const haltung = (frage: string, seite: string) => `Bei der Frage „${frage}“ bin ich klar ${seite}.`
  const haltungen = o.mitHaltung
    ? kartenHaltungen(daten).flatMap((h) => [haltung(h.frage, 'dafür'), haltung(h.frage, 'dagegen')])
    : []

  if (o.nurProbleme) return { problem: probleme, forderung: [], wert: [] }
  return { problem: probleme, forderung: forderungen, wert: haltungen }
}

/**
 * Zieht ein Beispiel: erst eine Art (nach BEISPIEL_GEWICHT unter denen mit Kandidaten), dann einen Text.
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
  const summe = arten.reduce((s, a) => s + BEISPIEL_GEWICHT[a], 0)
  let rest = zufall() * summe
  const art = arten.find((a) => (rest -= BEISPIEL_GEWICHT[a]) < 0) ?? arten[arten.length - 1]
  const texte = kandidaten[art].filter((t) => t !== vorher)
  return { art, text: texte[Math.floor(zufall() * texte.length)] }
}
