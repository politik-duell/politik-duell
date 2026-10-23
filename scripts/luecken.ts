// Hinweise auf fehlende Maßnahmen, ohne neu zu recherchieren: Nennen mindestens zwei Parteien mit derselben
// Programmstelle in Thema A den Lösungsweg X und in Thema B den Lösungsweg Y, sind X und Y in der Sache
// verwandt. Hat eine dritte Partei X in Thema A, aber in Thema B (das für ihr Programm durchsucht wurde)
// weder Y noch dieselbe Stelle, ist das ein Kandidat für eine übersehene oder falsch gebündelte Stelle.
// Kandidaten, keine Befunde: Ob die Stelle in Thema B passt, entscheidet erst der Blick ins Programm.
import type { AbdeckungEintrag, InstrumentEintrag, Massnahme } from '../supabase/functions/_shared/typen.ts'

export interface Luecke {
  thema_id: number
  partei_id: number
  land: string | null
  /** Lösungsweg in Thema B, der der Partei fehlt. */
  instrument_id: number
  /** Maßnahme derselben Partei in Thema A, die auf die Lücke hinweist. */
  hinweis: Pick<Massnahme, 'id' | 'thema_id' | 'beschreibung' | 'beleg_programm_url'>
  /** Parteien, deren gleiche Stelle beide Lösungswege verbindet. */
  stuetze: number[]
}

type M = Pick<Massnahme, 'id' | 'thema_id' | 'partei_id' | 'land' | 'instrument_id' | 'zitat' | 'beschreibung' | 'beleg_programm_url'>

const programm = (m: { partei_id: number; land?: string | null }) => `${m.partei_id}/${m.land ?? ''}`
const stelle = (m: M) => `${programm(m)}|${(m.zitat ?? m.beschreibung).toLowerCase().replace(/[^a-zäöüß0-9]+/g, ' ').trim().slice(0, 200)}`
const weg = (thema: number, instrument: number) => `${thema}:${instrument}`

export function findeLuecken(massnahmen: M[], abdeckung: Pick<AbdeckungEintrag, 'thema_id' | 'partei_id' | 'land'>[], mindestStuetze = 2): Luecke[] {
  // Verbindungen zwischen Lösungswegen verschiedener Themen, je mit den Parteien, die sie stützen.
  const jeStelle = new Map<string, M[]>()
  for (const m of massnahmen) jeStelle.set(stelle(m), [...(jeStelle.get(stelle(m)) ?? []), m])
  const verbunden = new Map<string, Map<string, Set<number>>>()
  for (const gleiche of jeStelle.values())
    for (const a of gleiche)
      for (const b of gleiche) {
        if (a.thema_id === b.thema_id || a.instrument_id == null || b.instrument_id == null) continue
        const von = weg(a.thema_id, a.instrument_id)
        const nach = weg(b.thema_id, b.instrument_id)
        if (!verbunden.has(von)) verbunden.set(von, new Map())
        const ziele = verbunden.get(von)!
        ziele.set(nach, (ziele.get(nach) ?? new Set()).add(a.partei_id))
      }

  const wege = new Set(massnahmen.flatMap((m) => (m.instrument_id == null ? [] : [`${programm(m)}|${weg(m.thema_id, m.instrument_id)}`])))
  const stellen = new Set(massnahmen.map((m) => `${m.thema_id}|${stelle(m)}`))
  const durchsucht = new Set(abdeckung.map((a) => `${a.thema_id}|${programm(a)}`))
  const gefunden = new Map<string, Luecke>()
  for (const m of massnahmen) {
    if (m.instrument_id == null) continue
    for (const [nach, parteien] of verbunden.get(weg(m.thema_id, m.instrument_id)) ?? []) {
      if (parteien.size < mindestStuetze) continue
      const [thema, instrument] = nach.split(':').map(Number)
      if (!durchsucht.has(`${thema}|${programm(m)}`) || wege.has(`${programm(m)}|${nach}`) || stellen.has(`${thema}|${stelle(m)}`)) continue
      const schluessel = `${programm(m)}|${nach}`
      if (gefunden.has(schluessel)) continue
      gefunden.set(schluessel, {
        thema_id: thema, partei_id: m.partei_id, land: m.land ?? null, instrument_id: instrument,
        hinweis: { id: m.id, thema_id: m.thema_id, beschreibung: m.beschreibung, beleg_programm_url: m.beleg_programm_url },
        stuetze: [...parteien].sort((a, b) => a - b),
      })
    }
  }
  return [...gefunden.values()].sort((a, b) => a.thema_id - b.thema_id || a.partei_id - b.partei_id || (a.land ?? '').localeCompare(b.land ?? ''))
}

export function instrumentName(instrumente: Pick<InstrumentEintrag, 'id' | 'name'>[], id: number): string {
  return instrumente.find((i) => i.id === id)?.name ?? `Instrument ${id}`
}
