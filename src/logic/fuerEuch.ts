import type { Nebenwirkung, Partei } from '../data/types'
import type { ParteiErgebnis } from './bewertung'

/** Was die Lösungswege beider Parteien für die Spielenden selbst heißen – für alle Parteien gleich, ohne Punkte. */
export interface FuerEuch {
  /** Belegte Folgen für die Verteilung (wer gewinnt, wer verliert) aus `nebenwirkungen`. */
  verteilung: { partei: Partei; hinweis: Nebenwirkung }[]
}

/**
 * „Was heißt das für euch?“ (docs/plan-duell-regeln.md, Abschnitt 4): belegte Verteilungsfolgen der gezählten
 * Maßnahmen beider Parteien, je Partei ohne Doppelungen. Ändert keine Punkte. Rollen sind vorerst ausgesetzt
 * (docs/methode.md).
 */
export function fuerEuch(ergebnisse: ParteiErgebnis[]): FuerEuch {
  const gesehen = new Set<string>()
  const verteilung = ergebnisse.flatMap((e) =>
    e.treffer.flatMap((t) =>
      (t.massnahme.nebenwirkungen ?? []).flatMap((hinweis) => {
        const schluessel = `${e.partei.id}|${hinweis.text}`
        if (hinweis.bereich !== 'verteilung' || gesehen.has(schluessel)) return []
        gesehen.add(schluessel)
        return [{ partei: e.partei, hinweis }]
      }),
    ),
  )
  return { verteilung }
}
