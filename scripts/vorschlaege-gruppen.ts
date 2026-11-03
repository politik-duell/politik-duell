// Fasst gleichlautende Themenvorschläge zusammen (npm run vorschlaege). Reine Funktion, getestet in
// vorschlaege-gruppen.test.ts.

export interface Vorschlag {
  id: number
  created_at: string
  text: string
  erledigt?: boolean
}

export interface VorschlagGruppe {
  /** Wortlaut des jüngsten Vorschlags der Gruppe */
  text: string
  anzahl: number
  ids: number[]
  zuletzt: string
}

/** Vergleichsschlüssel: Groß- und Kleinschreibung, Satzzeichen und Leerzeichen spielen keine Rolle. */
export const vorschlagSchluessel = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/** Gruppen nach Häufigkeit, bei Gleichstand der jüngste zuerst. */
export function gruppiereVorschlaege(vorschlaege: Vorschlag[]): VorschlagGruppe[] {
  const gruppen = new Map<string, VorschlagGruppe>()
  for (const v of [...vorschlaege].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const k = vorschlagSchluessel(v.text)
    const g = gruppen.get(k)
    if (g) {
      g.anzahl++
      g.ids.push(v.id)
    } else gruppen.set(k, { text: v.text, anzahl: 1, ids: [v.id], zuletzt: v.created_at })
  }
  return [...gruppen.values()].sort((a, b) => b.anzahl - a.anzahl || b.zuletzt.localeCompare(a.zuletzt))
}
