import type { Massnahme, Nebenwirkung, Partei, Rolle } from '../data/types'
import type { ParteiErgebnis } from './bewertung'

/** Eine gezählte Maßnahme wirkt für eine Rolle anders als im Grundwert (`rollen_modifikator`). */
export interface RollenFolge {
  partei: Partei
  massnahme: Massnahme
  staerker: boolean
  begruendung: string
  quelle_url?: string
}

/** Was die Lösungswege beider Parteien für die Spielenden selbst heißen – für alle Parteien gleich, ohne Punkte. */
export interface FuerEuch {
  /** Je Seite mit Rolle: wie die Maßnahmen beider Parteien für diese Rolle wirken. */
  rollen: { seite: number; rolle: Rolle; folgen: RollenFolge[] }[]
  /** Belegte Folgen für die Verteilung (wer gewinnt, wer verliert) aus `nebenwirkungen`. */
  verteilung: { partei: Partei; hinweis: Nebenwirkung }[]
}

/**
 * „Was heißt das für euch?“ (docs/plan-duell-regeln.md, Abschnitt 4): Die Rolle jeder Seite wird auf die
 * Maßnahmen beider Parteien angewandt – auch auf die der anderen Seite. Gezählt wird weiter nur mit der eigenen
 * Rolle; das hier ändert keine Punkte.
 */
export function fuerEuch(ergebnisse: ParteiErgebnis[], rollen: (Rolle | null)[]): FuerEuch {
  const rollenTeil = rollen.flatMap((rolle, seite) => {
    if (!rolle) return []
    const folgen = ergebnisse.flatMap((e) =>
      e.treffer.flatMap((t) => {
        const mod = t.massnahme.rollen_modifikator?.[rolle]
        return mod && mod.wert !== 0
          ? [{ partei: e.partei, massnahme: t.massnahme, staerker: mod.wert > 0, begruendung: mod.begruendung, ...(mod.quelle_url ? { quelle_url: mod.quelle_url } : {}) }]
          : []
      }),
    )
    return [{ seite, rolle, folgen }]
  })
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
  return { rollen: rollenTeil, verteilung }
}
