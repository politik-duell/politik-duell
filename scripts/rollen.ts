// Rollen-Modifikatoren belegt nachtragen (Skill /rollen-erfassen, docs/plan-duell-regeln.md Abschnitt 4).
// Ablauf wie bei den Nebenwirkungen: Blindliste je Thema in Teilen (Lösungswege ohne Partei) → je Teil ein Agent
// rollen-recherche → Antwort prüfen → eintragen als KI-Entwurf. Anders als Nebenwirkungen verändern Modifikatoren
// Punkte (für Spielende mit dieser Rolle): Darum gilt „nachweislich“ streng – jeder Modifikator mit Quelle und
// wörtlichem Beleg, sonst keiner. Zuerst zählen Quellen, die der Katalog schon hat (Studie, Verteilungsfolgen).
import { createHash } from 'node:crypto'
import type { Katalog } from '../src/data/katalog.ts'
import { ROLLEN_IDS, type Rolle, type RollenModifikator } from '../src/data/types.ts'
import { ohneParteinamen } from '../supabase/functions/_shared/ki.ts'
// @ts-expect-error – Hook in reinem JavaScript (schneller Start), ohne Typdeklaration
import { gesperrteAdresse } from '../.claude/hooks/sperre.mjs'
import { verdaechtigeReste } from './entwurf.ts'
import { AUSLASSUNG, sekundaerquelle, teileNachUrsache, zahlenOhneBeleg, type Pruefkontext, type Werkzeuge } from './nebenwirkungen.ts'

export const ROLLEN_ORDNER = (themaId: number) => `.cache/rollen/${themaId}`
export const ROLLEN_PROTOKOLL = (themaId: number) => `daten/protokolle/rollen-${themaId}`

/** Was eine Rolle im Alltag ausmacht – damit der Agent gezielt sucht, wen ein Weg trifft. */
export const ROLLEN_HILFE: Record<Rolle, string> = {
  mieter: 'Mieter:innen – zahlen Miete, Nebenkosten und Umlagen, entscheiden nicht über Sanierung und Heizung',
  eigentuemer: 'Eigentümer:innen von Wohnraum (selbst genutzt oder vermietet) – tragen Investitionen, erhalten Mieten',
  angestellt: 'Beschäftigte – Lohn, Sozialbeiträge, Lohnsteuer, Arbeitsbedingungen',
  selbststaendig: 'Selbstständige und kleine Unternehmen – eigene Vorsorge, Gewinnsteuer, Bürokratie, Kosten des Betriebs',
  rentner: 'Rentner:innen – Rente, Pflege, Gesundheit, feste Einkommen',
  arbeitslos: 'Arbeitslose und Grundsicherung – Regelsatz, Vermittlung, Zuverdienst, Wohnkosten',
  studierend: 'Studierende und Auszubildende – BAföG, Wohnen, geringe Einkommen',
  vermoegend: 'Menschen mit hohem Vermögen oder Einkommen – Vermögens-, Erbschafts- und Spitzensteuern, Kapitalerträge',
}

/** Ein Lösungsweg ohne Partei, mit dem, was der Katalog schon belegt. */
export interface RollenEinheit {
  id: number
  name: string
  ebene: 'bund' | 'land'
  begruendung: string
  /** Grundwert der Wirksamkeit – ein Modifikator verschiebt ihn (0–3, auf 3 nur bei belegter Wirkung). */
  wirksamkeit: number
  evidenz?: string | null
  /** Ursache, nach der der Weg eingeteilt ist (1 = erste in `ursachen`): Wege zur selben Ursache – gleiche Maßstäbe. */
  ursache: number
  /** Quellen, die der Katalog schon hat: Studie zur Wirkung, belegte Folgen für die Verteilung. Zuerst prüfen. */
  vorhanden: { art: 'studie' | 'verteilung'; quelle_url: string; text?: string }[]
}

export interface RollenBlindliste {
  pruefsumme: string
  thema_id: number
  thema: string
  ziel: string
  ursachen: string[]
  teil: number
  teile: number
  rollen: Record<Rolle, string>
  einheiten: RollenEinheit[]
}

export interface RollenVorschlag {
  rolle: Rolle
  wert: number
  begruendung: string
  quelle_url: string
  belegstufe: 'A' | 'B' | 'C'
  zweite_quelle_url?: string
  /** Wörtlich aus der Quelle (bei PDFs mit Seite) – bleibt im Protokoll, nicht im Katalog. */
  beleg: string
}

export interface RollenAntwort {
  pruefsumme: string
  einheiten: {
    id: number
    /** Tatsächlich ausgeführte Suchen (leer nur, wenn alles aus `vorhanden` belegt ist). */
    gesucht: string[]
    modifikatoren: RollenVorschlag[]
  }[]
}

type KatalogEinheit = RollenEinheit & { ursachen: number[]; rollen_modifikator?: Partial<Record<Rolle, RollenModifikator>> }

/**
 * Lösungswege eines Themas, deren Bewertung noch ein Entwurf ist (geprüfte Werte ändert der Skill nie).
 * Standard: nur Wege, die noch kein Lauf bearbeitet hat (`erledigt`) und die keinen Modifikator haben;
 * `alle`: auch KI-Entwürfe und Modifikatoren ohne Quelle neu.
 */
export function rollenEinheiten(k: Katalog, themaId: number, { alle = false, erledigt = new Set<number>() } = {}): KatalogEinheit[] {
  const massnahmen = k.massnahmen.filter((m) => m.thema_id === themaId)
  const ursachenVon = (ms: typeof massnahmen) => [...new Set(ms.flatMap((m) => m.ursachen_ids))].sort((a, b) => a - b)
  const vorhanden = (studie: string | undefined, folgen: { bereich: string; text: string; quelle_url: string }[] | undefined) => [
    ...(studie ? [{ art: 'studie' as const, quelle_url: studie }] : []),
    ...(folgen ?? []).filter((h) => h.bereich === 'verteilung').map((h) => ({ art: 'verteilung' as const, quelle_url: h.quelle_url, text: h.text })),
  ]
  const instrumente = k.instrumente
    .filter((i) => i.thema_id === themaId && i.bewertungen === 0 && massnahmen.some((m) => m.instrument_id === i.id))
    .map((i) => {
      const ms = massnahmen.filter((m) => m.instrument_id === i.id)
      return {
        id: i.id, name: i.name, ebene: (ms[0]?.land ? 'land' : 'bund') as RollenEinheit['ebene'], begruendung: i.begruendung,
        wirksamkeit: i.wirksamkeit, evidenz: i.evidenz, ursache: ursachenVon(ms)[0], ursachen: ursachenVon(ms),
        vorhanden: vorhanden(i.beleg_studie_url, i.nebenwirkungen?.hinweise), rollen_modifikator: i.rollen_modifikator,
      }
    })
  const einzeln = massnahmen
    .filter((m) => m.instrument_id === undefined && (m.bewertungen ?? 0) === 0)
    .map((m) => ({
      id: m.id, name: m.beschreibung, ebene: (m.land ? 'land' : 'bund') as RollenEinheit['ebene'], begruendung: m.begruendung,
      wirksamkeit: m.wirksamkeit, evidenz: m.evidenz, ursache: ursachenVon([m])[0], ursachen: ursachenVon([m]),
      vorhanden: vorhanden(m.beleg_studie_url, m.nebenwirkungen?.hinweise), rollen_modifikator: m.rollen_modifikator,
    }))
  const offen = (e: KatalogEinheit) => {
    const mods = Object.values(e.rollen_modifikator ?? {})
    if (alle) return mods.every((m) => m?.ki_entwurf || !m?.quelle_url)
    return !mods.length && !erledigt.has(e.id)
  }
  return [...instrumente, ...einzeln].filter(offen).sort((a, b) => a.id - b.id)
}

const sha = (t: string) => createHash('sha256').update(t).digest('hex').slice(0, 16)

/** Blindlisten in Teilen (Wege zur selben Ursache zusammen) – ohne Parteien, Länder oder Zitate. */
export function rollenBlind(k: Katalog, themaId: number, optionen: { alle?: boolean; erledigt?: Set<number> } = {}): { listen: RollenBlindliste[]; reste: string[] } {
  const thema = k.themen.find((t) => t.id === themaId)
  if (!thema) throw new Error(`Thema ${themaId} gibt es nicht`)
  const ursachenIds = k.ursachen.filter((u) => u.thema_id === themaId).map((u) => u.id)
  const gruppiert = teileNachUrsache(rollenEinheiten(k, themaId, optionen)).map((t) =>
    t.map(({ id, name, ebene, begruendung, wirksamkeit, evidenz, ursache, vorhanden }) => ({
      id, name, ebene, begruendung, wirksamkeit, ...(evidenz ? { evidenz } : {}), ursache: ursachenIds.indexOf(ursache) + 1, vorhanden,
    })),
  )
  const parteinamen = k.parteien.map(({ name, kurzname }) => ({ name, kurzname }))
  const reste = gruppiert.flat().flatMap((e) =>
    [e.name, e.begruendung].flatMap((t) => [...verdaechtigeReste(t), ...(ohneParteinamen(t, parteinamen) !== t ? ['Parteiname'] : [])].map((r) => `${e.id}: ${r}`)),
  )
  const listen = gruppiert.map((einheiten, i) => {
    const inhalt = {
      thema_id: themaId,
      thema: thema.name,
      ziel: thema.ziel ?? '',
      ursachen: k.ursachen.filter((u) => u.thema_id === themaId).map((u) => u.beschreibung),
      teil: i + 1,
      teile: gruppiert.length,
      rollen: ROLLEN_HILFE,
      einheiten,
    }
    return { pruefsumme: sha(JSON.stringify(inhalt)), ...inhalt }
  })
  return { listen, reste }
}

const anfrage = (s: string) => s.toLowerCase().replace(/["„“”']/g, '').replace(/\s+/g, ' ').trim()
const adresse = (u: string) => u.trim().replace(/#.*$/, '').replace(/\/+$/, '')
const PDF = /\.pdf($|[?#])/i

/**
 * Prüft eine Antwort gegen ihre Blindliste. Fehler verhindern das Eintragen; Warnungen gehen an die Koordination.
 * `werkzeuge` (aus dem Transkript): Jede Suche in „gesucht“ muss gelaufen, jede neue Quelle selbst geöffnet sein.
 * Ob der Beleg wörtlich in der Quelle steht, prüft scripts/rollen/antwort-pruefen.ts gegen das Original.
 */
export function pruefeRollenAntwort(liste: RollenBlindliste, antwort: RollenAntwort, ctx: Pruefkontext, werkzeuge?: Werkzeuge): { fehler: string[]; warnungen: string[] } {
  const fehler: string[] = []
  const warnungen: string[] = []
  if (antwort?.pruefsumme !== liste.pruefsumme) fehler.push('„pruefsumme“ passt nicht zur Blindliste (falscher Teil oder veraltete Liste)')
  const einheiten = Array.isArray(antwort?.einheiten) ? antwort.einheiten : []
  const nachId = new Map(liste.einheiten.map((e) => [e.id, e]))
  const gesehen = new Set<number>()
  const suchen = werkzeuge && new Set(werkzeuge.suchen.map(anfrage))
  const geoeffnet = werkzeuge && new Set(werkzeuge.adressen.map(adresse))
  for (const e of einheiten) {
    const ort = `Lösungsweg ${e?.id}`
    const einheit = nachId.get(e?.id)
    if (!einheit) {
      fehler.push(`${ort}: steht nicht in der Blindliste`)
      continue
    }
    if (gesehen.has(e.id)) fehler.push(`${ort}: doppelt`)
    gesehen.add(e.id)
    const gesucht = Array.isArray(e.gesucht) ? e.gesucht : null
    if (!gesucht || !gesucht.every((s) => typeof s === 'string' && s.trim().length >= 3)) fehler.push(`${ort}: „gesucht“ – Liste der tatsächlich ausgeführten Suchen (leer, wenn nichts gesucht)`)
    else if (suchen) {
      const nie = gesucht.filter((s) => !suchen.has(anfrage(s)))
      if (nie.length) fehler.push(`${ort}: „gesucht“ enthält nicht ausgeführte Suchen (${nie.map((s) => `„${s}“`).join(', ')}) – nur wörtlich eintragen, was gelaufen ist`)
    }
    const mods = Array.isArray(e.modifikatoren) ? e.modifikatoren : null
    if (!mods) {
      fehler.push(`${ort}: „modifikatoren“ fehlt (leere Liste, wenn keine Rolle nachweislich anders betroffen ist)`)
      continue
    }
    if (!mods.length && !gesucht?.length && !einheit.vorhanden.length) fehler.push(`${ort}: weder gesucht noch vorhandene Quellen – mindestens eine Suche, bevor „keine Abweichung“ gilt`)
    const rollen = new Set<string>()
    const vorhanden = new Set(einheit.vorhanden.map((v) => adresse(v.quelle_url)))
    for (const m of mods) {
      const mOrt = `${ort} › ${m?.rolle}`
      if (!(ROLLEN_IDS as readonly unknown[]).includes(m?.rolle)) {
        fehler.push(`${mOrt}: unbekannte Rolle (erlaubt: ${ROLLEN_IDS.join(', ')})`)
        continue
      }
      if (rollen.has(m.rolle)) fehler.push(`${mOrt}: Rolle doppelt`)
      rollen.add(m.rolle)
      if (!Number.isInteger(m.wert) || m.wert < -2 || m.wert > 2 || m.wert === 0) fehler.push(`${mOrt}: „wert“ ganzzahlig −2 bis 2, nicht 0`)
      else if (Math.abs(m.wert) === 2 && m.belegstufe === 'C') fehler.push(`${mOrt}: ±2 nur mit Belegstufe A oder B`)
      else if (m.wert > 0 && einheit.wirksamkeit === 3) warnungen.push(`${mOrt}: Wirksamkeit ist schon 3 – ein Plus wirkt nicht`)
      else if (m.wert < 0 && einheit.wirksamkeit === 0) warnungen.push(`${mOrt}: Wirksamkeit ist schon 0 – ein Minus wirkt nicht`)
      if (typeof m.begruendung !== 'string' || !m.begruendung.trim()) fehler.push(`${mOrt}: „begruendung“ fehlt`)
      else {
        if (m.begruendung.length > 200) fehler.push(`${mOrt}: „begruendung“ länger als 200 Zeichen`)
        if (ohneParteinamen(m.begruendung, ctx.parteinamen) !== m.begruendung) fehler.push(`${mOrt}: „begruendung“ nennt eine Partei`)
      }
      if (m.belegstufe !== 'A' && m.belegstufe !== 'B' && m.belegstufe !== 'C') fehler.push(`${mOrt}: „belegstufe“ muss A, B oder C sein`)
      if (m.belegstufe === 'C' && !m.zweite_quelle_url) fehler.push(`${mOrt}: Belegstufe C nur mit „zweite_quelle_url“ (A oder B)`)
      for (const feld of ['quelle_url', 'zweite_quelle_url'] as const) {
        const u = m[feld]
        if (u === undefined && feld === 'zweite_quelle_url') continue
        if (typeof u !== 'string' || !/^https:\/\/[^\s]+$/.test(u)) {
          fehler.push(`${mOrt}: „${feld}“ muss eine https-Adresse sein`)
          continue
        }
        const grund = gesperrteAdresse(u, ctx.liste, ctx.programmHosts)
        if (grund) fehler.push(`${mOrt}: Parteiquelle oder gesperrte Adresse – ${grund}`)
        const presse = sekundaerquelle(u)
        if (presse) fehler.push(`${mOrt}: „${feld}“ – ${presse} ist Presse oder Sekundärquelle; die Studie oder Behörde selbst oder kein Modifikator`)
        if (geoeffnet && !geoeffnet.has(adresse(u)) && !vorhanden.has(adresse(u)))
          fehler.push(`${mOrt}: ${u} nicht selbst geöffnet – mit WebFetch bzw. npm run -s nebenwirkungen:pdf öffnen`)
      }
      if (typeof m.beleg !== 'string' || m.beleg.trim().length < 20) fehler.push(`${mOrt}: „beleg“ – die Stelle wörtlich aus der Quelle (mindestens 20 Zeichen)`)
      else if (AUSLASSUNG.test(m.beleg)) fehler.push(`${mOrt}: „beleg“ zusammengesetzt („…“ oder „[ ]“) – ein zusammenhängender Abschnitt wörtlich aus der Quelle`)
      else if (typeof m.quelle_url === 'string' && PDF.test(m.quelle_url) && !/\bS\.\s*\d/.test(m.beleg))
        fehler.push(`${mOrt}: „beleg“ aus einem PDF mit Seite („S. 12“) – gelesen mit npm run -s nebenwirkungen:pdf`)
      if (typeof m.begruendung === 'string' && typeof m.beleg === 'string') {
        const z = zahlenOhneBeleg(m.begruendung, m.beleg)
        if (z.zahlen.length) fehler.push(`${mOrt}: Zahl ${z.zahlen.join(', ')} steht in der Begründung, aber nicht im Beleg`)
      }
    }
  }
  for (const e of liste.einheiten) if (!gesehen.has(e.id)) fehler.push(`Lösungsweg ${e.id}: fehlt in der Antwort`)
  // Gleiche Maßstäbe: Wege zur selben Ursache mit Modifikator für eine Rolle, andere ohne – kein Fehler (kann stimmen),
  // aber die Koordination soll nachfragen.
  const nachUrsache = new Map<number, typeof einheiten>()
  for (const e of einheiten.filter((x) => nachId.has(x?.id))) {
    const u = nachId.get(e.id)!.ursache
    nachUrsache.set(u, [...(nachUrsache.get(u) ?? []), e])
  }
  for (const gruppe of nachUrsache.values()) {
    if (gruppe.length < 2) continue
    for (const rolle of new Set(gruppe.flatMap((e) => (Array.isArray(e.modifikatoren) ? e.modifikatoren.map((m) => m.rolle) : [])))) {
      const ohne = gruppe.filter((e) => !(Array.isArray(e.modifikatoren) ? e.modifikatoren : []).some((m) => m.rolle === rolle))
      if (ohne.length) warnungen.push(`Rolle ${rolle}: Modifikator nur bei einem Teil der Wege zur selben Ursache (ohne: ${ohne.map((e) => e.id).join(', ')}) – gleiche Maßstäbe?`)
    }
  }
  return { fehler, warnungen }
}

/** Kurze Übersicht je Lösungsweg für die Koordination. */
export function rollenBilanz(antwort: RollenAntwort): string[] {
  return antwort.einheiten.map((e) => {
    const m = (e.modifikatoren ?? []).map((x) => `${x.rolle} ${x.wert > 0 ? '+' : ''}${x.wert} (${x.belegstufe})`)
    return `${e.id}: ${m.length ? m.join(', ') : 'keine Rolle nachweislich anders betroffen'}`
  })
}

/** Modifikatoren für den Katalog: ohne Beleg und Belegstufe, als KI-Entwurf. */
export function modifikatorenFuerKatalog(e: RollenAntwort['einheiten'][number]): Partial<Record<Rolle, RollenModifikator>> {
  return Object.fromEntries(
    [...e.modifikatoren]
      .sort((a, b) => ROLLEN_IDS.indexOf(a.rolle) - ROLLEN_IDS.indexOf(b.rolle))
      .map((m) => [m.rolle, { wert: m.wert, begruendung: m.begruendung, quelle_url: m.quelle_url, ki_entwurf: true }]),
  )
}

/**
 * Trägt die Modifikatoren in eine Themendatei (Rohdaten) ein – an Instrumenten und Maßnahmen ohne Instrument.
 * Ersetzt nur KI-Entwürfe und Modifikatoren ohne Quelle; ohne belegten Modifikator wird ein solcher entfernt.
 */
export function rollenEintragen(thema: Record<string, unknown>, antworten: RollenAntwort[]): { eingetragen: number; entfernt: number; fehlend: number[] } {
  const ziele = new Map<number, Record<string, unknown>>()
  for (const i of (thema.instrumente as Record<string, unknown>[] | undefined) ?? []) ziele.set(i.id as number, i)
  for (const a of (thema.abdeckung as { massnahmen?: Record<string, unknown>[] }[] | undefined) ?? [])
    for (const m of a.massnahmen ?? []) if (m.instrument === undefined) ziele.set(m.id as number, m)
  let eingetragen = 0
  let entfernt = 0
  const fehlend: number[] = []
  for (const e of antworten.flatMap((a) => a.einheiten)) {
    const ziel = ziele.get(e.id)
    if (!ziel) {
      fehlend.push(e.id)
      continue
    }
    const alt = Object.values((ziel.rollen_modifikator as Record<string, RollenModifikator> | undefined) ?? {})
    if (alt.some((m) => !m.ki_entwurf && m.quelle_url)) continue
    if (e.modifikatoren.length) {
      ziel.rollen_modifikator = modifikatorenFuerKatalog(e)
      eingetragen++
    } else if (alt.length) {
      delete ziel.rollen_modifikator
      entfernt++
    }
  }
  return { eingetragen, entfernt, fehlend }
}
