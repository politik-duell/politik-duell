// Auswertung des KI-Testsets (npm run ki:testset): Vergleicht die Einordnung der KI mit den erwarteten
// Werten je Fall. Ohne Netz und ohne KI – testbar.
import type { AnalyseAntwort, Thema, Ursache } from '../../supabase/functions/_shared/typen.ts'

export interface Fall {
  id: string
  text: string
  typ: AnalyseAntwort['typ']
  /** Erwartetes Thema; null = keins (Haltung, Pauschales, unbekanntes Problem). */
  thema: number | null
  /** Ebenfalls richtige Themen (mehrdeutige Fälle). */
  auch_thema?: number[]
  /** Muss die KI alle zuordnen. */
  ursachen?: number[]
  /** Darf die KI zusätzlich zuordnen. */
  auch?: number[]
  /** Eine Nachfrage ist richtig (Schilderung zu vage). */
  rueckfrage?: boolean
}

export type UrsachenUrteil = 'exakt' | 'zu_viel' | 'zu_wenig' | 'falsch' | 'rueckfrage' | 'unnoetige_rueckfrage'

export interface Urteil {
  typ: boolean
  thema: boolean
  /** Nur bei Problemen mit Thema, wenn Typ und Thema stimmen. */
  ursachen: UrsachenUrteil | null
  ok: boolean
}

type Einordnung = Pick<AnalyseAntwort, 'typ' | 'thema_id' | 'ursachen_ids' | 'nachfrage'>

export function beurteile(f: Fall, a: Einordnung): Urteil {
  const typ = a.typ === f.typ
  const thema = a.thema_id === f.thema || (a.thema_id !== null && (f.auch_thema ?? []).includes(a.thema_id))
  if (!typ || !thema || f.typ !== 'problem' || f.thema === null) return { typ, thema, ursachen: null, ok: typ && thema }
  const soll = f.ursachen ?? []
  const erlaubt = new Set([...soll, ...(f.auch ?? [])])
  const ist = a.ursachen_ids
  const zuViel = ist.some((id) => !erlaubt.has(id))
  let ursachen: UrsachenUrteil
  if (!ist.length) ursachen = f.rueckfrage ? 'rueckfrage' : 'unnoetige_rueckfrage'
  else if (f.rueckfrage) ursachen = zuViel ? 'zu_viel' : 'exakt'
  else {
    const fehlt = soll.some((id) => !ist.includes(id))
    ursachen = zuViel && fehlt ? 'falsch' : zuViel ? 'zu_viel' : fehlt ? 'zu_wenig' : 'exakt'
  }
  return { typ, thema, ursachen, ok: ursachen === 'exakt' || ursachen === 'rueckfrage' }
}

/** Fehler im Testset selbst: doppelte IDs, unbekannte Themen, Ursachen eines anderen Themas. */
export function pruefeFaelle(faelle: Fall[], themen: Pick<Thema, 'id'>[], ursachen: Pick<Ursache, 'id' | 'thema_id'>[]): string[] {
  const fehler: string[] = []
  const ids = new Set<string>()
  const themaIds = new Set(themen.map((t) => t.id))
  for (const f of faelle) {
    if (ids.has(f.id)) fehler.push(`${f.id}: ID doppelt`)
    ids.add(f.id)
    for (const t of [f.thema, ...(f.auch_thema ?? [])]) if (t !== null && !themaIds.has(t)) fehler.push(`${f.id}: Thema ${t} gibt es nicht`)
    for (const id of [...(f.ursachen ?? []), ...(f.auch ?? [])]) {
      const u = ursachen.find((x) => x.id === id)
      if (!u) fehler.push(`${f.id}: Ursache ${id} gibt es nicht`)
      else if (u.thema_id !== f.thema) fehler.push(`${f.id}: Ursache ${id} gehört nicht zu Thema ${f.thema}`)
    }
    if (f.typ === 'problem' && f.thema !== null && !f.ursachen?.length && !f.rueckfrage)
      fehler.push(`${f.id}: Problem mit Thema braucht Ursachen oder "rueckfrage": true`)
  }
  return fehler
}

export interface Bilanz {
  faelle: number
  ok: number
  typ: number
  thema: number
  /** Fälle, bei denen Ursachen beurteilt wurden, und wie. */
  ursachen: Record<UrsachenUrteil, number>
}

export function bilanz(urteile: Urteil[]): Bilanz {
  const ursachen: Record<UrsachenUrteil, number> = {
    exakt: 0, rueckfrage: 0, zu_viel: 0, zu_wenig: 0, falsch: 0, unnoetige_rueckfrage: 0,
  }
  for (const u of urteile) if (u.ursachen) ursachen[u.ursachen]++
  return {
    faelle: urteile.length,
    ok: urteile.filter((u) => u.ok).length,
    typ: urteile.filter((u) => u.typ).length,
    thema: urteile.filter((u) => u.typ && u.thema).length,
    ursachen,
  }
}
