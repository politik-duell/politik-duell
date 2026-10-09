// Admin → Lücken: Quoten aus der Sicht `kennzahlen_woche` und Sortierung der Sicht `luecken`
// (Migration 20261013000000_luecken_kennzahlen.sql). Reine Funktionen, getestet in kennzahlen.test.ts.

export interface KennzahlWoche {
  woche: string // Montag, JJJJ-MM-TT
  testphase: boolean
  runden: number
  gewertet: number
  unvollstaendig: number
  ungeprueft: number
  forderung: number
  forderung_mit_karte: number
  wert: number
  wert_mit_karte: number
  grenze: number
}

export type LueckenArt =
  | 'kein_thema'
  | 'unvollstaendig'
  | 'forderung_ohne_loesungsweg'
  | 'forderung_ohne_thema'
  | 'haltung_ohne_karte'

export interface Luecke {
  art: LueckenArt
  thema_id: number | null
  stichwort: string | null
  anzahl_30_tage: number
  anzahl: number
  anzahl_testphase: number
  zuletzt: string
}

export type Auswahl = 'alle' | 'oeffentlich' | 'testphase'

const ZAEHLER = [
  'runden',
  'gewertet',
  'unvollstaendig',
  'ungeprueft',
  'forderung',
  'forderung_mit_karte',
  'wert',
  'wert_mit_karte',
  'grenze',
] as const

export interface Woche extends Omit<KennzahlWoche, 'testphase'> {
  /** Runden mit einem Alltagsproblem: gewertet, unvollständig oder ungeprüft. */
  probleme: number
  /** Anteil der Problemrunden mit erkanntem Thema (gewertet oder unvollständig), in Prozent. */
  erkannt: number | null
  /** Anteil der Problemrunden mit Punkten, in Prozent. */
  gewertet_anteil: number | null
  /** Anteil der Forderungen und Haltungen mit Karte, in Prozent. */
  karte_anteil: number | null
}

type Zaehler = Record<(typeof ZAEHLER)[number], number>

function summe(liste: Zaehler[], woche: string): Omit<KennzahlWoche, 'testphase'> {
  const s = { woche } as Omit<KennzahlWoche, 'testphase'>
  for (const k of ZAEHLER) s[k] = liste.reduce((n, w) => n + w[k], 0)
  return s
}

const prozent =(teil: number, ganz: number) => (ganz === 0 ? null : Math.round((teil / ganz) * 1000) / 10)

/** Fasst die Zeilen je Woche zusammen (öffentlich und Testphase je nach Auswahl), neueste Woche zuerst. */
export function wochen(zeilen: KennzahlWoche[], auswahl: Auswahl): Woche[] {
  const je = new Map<string, Omit<KennzahlWoche, 'testphase'>>()
  for (const z of zeilen) {
    if (auswahl === 'oeffentlich' && z.testphase) continue
    if (auswahl === 'testphase' && !z.testphase) continue
    const w = je.get(z.woche) ?? summe([], z.woche)
    for (const k of ZAEHLER) w[k] += z[k]
    je.set(z.woche, w)
  }
  return [...je.values()]
    .sort((a, b) => b.woche.localeCompare(a.woche))
    .map((w) => {
      const probleme = w.gewertet + w.unvollstaendig + w.ungeprueft
      return {
        ...w,
        probleme,
        erkannt: prozent(w.gewertet + w.unvollstaendig, probleme),
        gewertet_anteil: prozent(w.gewertet, probleme),
        karte_anteil: prozent(w.forderung_mit_karte + w.wert_mit_karte, w.forderung + w.wert),
      }
    })
}

/** Summe über alle Wochen (für die Kopfzeile). */
export function gesamt(liste: Woche[]): Woche | null {
  if (liste.length === 0) return null
  return wochen([{ ...summe(liste, 'gesamt'), testphase: false }], 'alle')[0]
}

/** Lücken einer Art: zuerst die der letzten 30 Tage, dann insgesamt, dann die jüngste. */
export function sortiereLuecken(liste: Luecke[], art: LueckenArt): Luecke[] {
  return liste
    .filter((l) => l.art === art)
    .sort((a, b) => b.anzahl_30_tage - a.anzahl_30_tage || b.anzahl - a.anzahl || b.zuletzt.localeCompare(a.zuletzt))
}
