// Folgen über das Thema hinaus erfassen (docs/plan-nebenwirkungen.md, Skill /nebenwirkungen-erfassen).
// Ablauf: Blindliste je Thema in Teilen (Lösungswege ohne Partei) → je Teil ein Agent nebenwirkungen-recherche →
// Antwort prüfen → eintragen als KI-Entwurf. Die Regeln aus dem Pilot (Energiepreise, 21. 10. 2026) sind hier
// fest eingebaut: jeder Bereich in beide Richtungen gesucht, Beleg wörtlich aus der Quelle, Bilanz der Richtungen.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Katalog, Nebenwirkungen } from '../src/data/katalog.ts'
import { NEBENWIRKUNG_BEREICHE, NEBENWIRKUNG_RICHTUNGEN, type Nebenwirkung } from '../src/data/types.ts'
import { ohneParteinamen } from '../supabase/functions/_shared/ki.ts'
// @ts-expect-error – Hook in reinem JavaScript (schneller Start), ohne Typdeklaration
import { gesperrteAdresse } from '../.claude/hooks/sperre.mjs'
import { verdaechtigeReste } from './entwurf.ts'

export const NEBEN_ORDNER = (themaId: number) => `.cache/nebenwirkungen/${themaId}`
/** Lösungswege je Agent: sechs Bereiche × zwei Richtungen je Weg – mehr wird für einen Agenten zu lang. */
export const TEIL_GROESSE = 6
export const MAX_HINWEISE = 3

type Bereich = (typeof NEBENWIRKUNG_BEREICHE)[number]
type Richtung = (typeof NEBENWIRKUNG_RICHTUNGEN)[number]

/**
 * Startbegriffe je Bereich und Richtung. Der Pilot fand zuerst fast nur Nachteile bei fossilen und Vorteile bei
 * erneuerbaren Wegen – die Gegenrichtung kam erst mit gezielter Suche. Darum nennt die Liste beide Richtungen,
 * und die Antwort muss für jede die eigenen Suchanfragen angeben.
 */
export const SUCHHILFE: Record<Bereich, { frage: string; vorteil: string[]; nachteil: string[] }> = {
  haushalt: {
    frage: 'Was kostet der Weg Bund, Ländern, Kommunen oder Sozialkassen – oder was bringt er ein?',
    vorteil: ['Mehreinnahmen', 'Einsparung öffentlicher Haushalt', 'Entlastung Sozialversicherung'],
    nachteil: ['Mindereinnahmen', 'Kosten Bundeshaushalt', 'Haushaltsausgaben Gesetzentwurf'],
  },
  wirtschaft: {
    frage: 'Welche Kosten oder Entlastungen entstehen für Unternehmen (besonders kleine und mittlere), wie wirkt er auf Preise und Verbraucher?',
    vorteil: ['Entlastung Unternehmen', 'sinkende Preise', 'Investitionen'],
    nachteil: ['Kosten für Unternehmen', 'Preisanstieg', 'Wettbewerbsfähigkeit'],
  },
  aufwand: {
    frage: 'Welcher Aufwand für Anträge, Nachweise und Kontrollen entsteht oder entfällt – für Bürger, Wirtschaft, Verwaltung?',
    vorteil: ['Bürokratieabbau', 'Erfüllungsaufwand sinkt'],
    nachteil: ['Erfüllungsaufwand', 'Nachweispflichten', 'Normenkontrollrat Stellungnahme'],
  },
  umwelt: {
    frage: 'Wie wirkt er auf Emissionen, Natur und Ressourcen, und welche Lasten oder Vorteile hat er für spätere Jahre?',
    vorteil: ['Emissionsminderung', 'Umweltentlastung'],
    nachteil: ['Mehremissionen', 'Umweltrisiken', 'Flächenverbrauch'],
  },
  verteilung: {
    frage: 'Wer gewinnt, wer trägt die Last – nach Einkommen, Alter, Familienform, Stadt und Land?',
    vorteil: ['Entlastung geringe Einkommen', 'Verteilungswirkung progressiv'],
    nachteil: ['regressiv', 'Mitnahmeeffekte', 'profitieren höhere Einkommen'],
  },
  grundrechte: {
    frage: 'Schränkt er Freiheiten ein oder stärkt er sie, behandelt er Gruppen ungleich, wie wirkt er auf Gesundheit und Sicherheit?',
    vorteil: ['Gesundheit verbessert', 'Schutz', 'Gleichstellung'],
    nachteil: ['Datenschutz', 'Grundrechtseingriff', 'Benachteiligung', 'Gesundheitsrisiko'],
  },
}

/** Ein Lösungsweg ohne Partei: Instrument oder Maßnahme ohne Instrument. */
export interface Einheit {
  id: number
  name: string
  ebene: 'bund' | 'land'
  /** Begründung der Bewertung – zeigt, was schon zur Wirkung auf das Thema gehört (und darum nicht hierher). */
  begruendung: string
}

export interface NebenBlindliste {
  pruefsumme: string
  thema_id: number
  thema: string
  ziel: string
  ursachen: string[]
  teil: number
  teile: number
  einheiten: Einheit[]
  suchhilfe: typeof SUCHHILFE
}

export interface NebenHinweis extends Omit<Nebenwirkung, 'bereich'> {
  /** Wörtlich aus der Quelle (mit Seite, wo es eine gibt) – bleibt im Protokoll, nicht im Katalog. */
  beleg: string
}

export interface NebenAntwort {
  pruefsumme: string
  einheiten: {
    id: number
    bereiche: { bereich: Bereich; gesucht_vorteil: string[]; gesucht_nachteil: string[]; hinweis: NebenHinweis | null }[]
  }[]
}

/** Lösungswege eines Themas: genutzte Instrumente und Maßnahmen ohne Instrument. `alle`: auch schon erfasste KI-Entwürfe. */
export function einheitenDesThemas(k: Katalog, themaId: number, alle = false): (Einheit & { nebenwirkungen?: Nebenwirkungen })[] {
  const massnahmen = k.massnahmen.filter((m) => m.thema_id === themaId)
  const instrumente = k.instrumente
    .filter((i) => i.thema_id === themaId && massnahmen.some((m) => m.instrument_id === i.id))
    .map((i) => ({
      id: i.id,
      name: i.name,
      ebene: (massnahmen.find((m) => m.instrument_id === i.id)?.land ? 'land' : 'bund') as Einheit['ebene'],
      begruendung: i.begruendung,
      nebenwirkungen: i.nebenwirkungen,
    }))
  const einzeln = massnahmen
    .filter((m) => m.instrument_id === undefined)
    .map((m) => ({ id: m.id, name: m.beschreibung, ebene: (m.land ? 'land' : 'bund') as Einheit['ebene'], begruendung: m.begruendung, nebenwirkungen: m.nebenwirkungen }))
  // Menschlich geprüfte Hinweise werden nie ersetzt; KI-Entwürfe nur mit `alle`.
  return [...instrumente, ...einzeln]
    .filter((e) => !e.nebenwirkungen || (alle && e.nebenwirkungen.ki_entwurf))
    .sort((a, b) => a.id - b.id)
}

const sha = (t: string) => createHash('sha256').update(t).digest('hex').slice(0, 16)

/** Blindlisten in Teilen zu höchstens TEIL_GROESSE Lösungswegen – ohne Parteien, Länder oder Zitate. */
export function nebenBlind(k: Katalog, themaId: number, alle = false): { listen: NebenBlindliste[]; reste: string[] } {
  const thema = k.themen.find((t) => t.id === themaId)
  if (!thema) throw new Error(`Thema ${themaId} gibt es nicht`)
  const einheiten = einheitenDesThemas(k, themaId, alle).map(({ id, name, ebene, begruendung }) => ({ id, name, ebene, begruendung }))
  const parteinamen = k.parteien.map(({ name, kurzname }) => ({ name, kurzname }))
  const reste = einheiten.flatMap((e) =>
    [e.name, e.begruendung].flatMap((t) => [...verdaechtigeReste(t), ...(ohneParteinamen(t, parteinamen) !== t ? ['Parteiname'] : [])].map((r) => `${e.id}: ${r}`)),
  )
  const teile = Math.ceil(einheiten.length / TEIL_GROESSE)
  const listen = Array.from({ length: teile }, (_, i) => {
    const inhalt = {
      thema_id: themaId,
      thema: thema.name,
      ziel: thema.ziel ?? '',
      ursachen: k.ursachen.filter((u) => u.thema_id === themaId).map((u) => u.beschreibung),
      teil: i + 1,
      teile,
      einheiten: einheiten.slice(i * TEIL_GROESSE, (i + 1) * TEIL_GROESSE),
      suchhilfe: SUCHHILFE,
    }
    return { pruefsumme: sha(JSON.stringify(inhalt)), ...inhalt }
  })
  return { listen, reste }
}

export interface Pruefkontext {
  parteinamen: { name: string; kurzname: string }[]
  liste: { hosts: string[]; muster: string[]; pfade: string[] }
  programmHosts: string[]
}

/** Gesperrte Adressen und Programmserver wie im Hook (.claude/hooks/sperre.mjs). */
export function pruefkontext(k: Katalog, wurzel: URL): Pruefkontext {
  const liste = JSON.parse(readFileSync(new URL('daten/gesperrte-adressen.json', wurzel), 'utf8'))
  const programmHosts = [...k.parteien.map((p) => p.programm_url), ...k.landesprogramme.flatMap((l) => (l.url ? [l.url] : []))].flatMap((u) => {
    try {
      return [new URL(u).hostname.toLowerCase().replace(/^www\./, '')]
    } catch {
      return []
    }
  })
  return { parteinamen: k.parteien.map(({ name, kurzname }) => ({ name, kurzname })), liste, programmHosts }
}

const suchanfragen = (v: unknown) => Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === 'string' && s.trim().length >= 3)

/** Prüft eine Antwort gegen ihre Blindliste. Fehler verhindern das Eintragen; Warnungen gehen an die Koordination. */
export function pruefeNebenAntwort(liste: NebenBlindliste, antwort: NebenAntwort, ctx: Pruefkontext): { fehler: string[]; warnungen: string[] } {
  const fehler: string[] = []
  const warnungen: string[] = []
  if (antwort?.pruefsumme !== liste.pruefsumme) fehler.push('„pruefsumme“ passt nicht zur Blindliste (falscher Teil oder veraltete Liste)')
  const einheiten = Array.isArray(antwort?.einheiten) ? antwort.einheiten : []
  const ids = new Set(liste.einheiten.map((e) => e.id))
  const gesehen = new Set<number>()
  const zaehler: Record<Richtung, number> = { vorteil: 0, nachteil: 0, gemischt: 0 }
  for (const e of einheiten) {
    const ort = `Lösungsweg ${e?.id}`
    if (!ids.has(e?.id)) {
      fehler.push(`${ort}: steht nicht in der Blindliste`)
      continue
    }
    if (gesehen.has(e.id)) fehler.push(`${ort}: doppelt`)
    gesehen.add(e.id)
    const bereiche = Array.isArray(e.bereiche) ? e.bereiche : []
    for (const b of NEBENWIRKUNG_BEREICHE) {
      const n = bereiche.filter((x) => x?.bereich === b).length
      if (n !== 1) fehler.push(`${ort}: Bereich „${b}“ ${n ? 'mehrfach' : 'fehlt'} – jeder der sechs Bereiche genau einmal`)
    }
    let hinweise = 0
    for (const x of bereiche) {
      const bOrt = `${ort} › ${x?.bereich}`
      if (!(NEBENWIRKUNG_BEREICHE as readonly unknown[]).includes(x?.bereich)) {
        fehler.push(`${bOrt}: unbekannter Bereich`)
        continue
      }
      if (!suchanfragen(x.gesucht_vorteil)) fehler.push(`${bOrt}: „gesucht_vorteil“ – die Suchanfragen nach Vorteilen angeben (mindestens eine)`)
      if (!suchanfragen(x.gesucht_nachteil)) fehler.push(`${bOrt}: „gesucht_nachteil“ – die Suchanfragen nach Nachteilen angeben (mindestens eine)`)
      const h = x.hinweis
      if (h === null || h === undefined) continue
      hinweise++
      if (!(NEBENWIRKUNG_RICHTUNGEN as readonly unknown[]).includes(h.richtung)) fehler.push(`${bOrt}: „richtung“ muss vorteil, nachteil oder gemischt sein`)
      else zaehler[h.richtung]++
      if (typeof h.text !== 'string' || !h.text.trim()) fehler.push(`${bOrt}: „text“ fehlt`)
      else {
        if (h.text.length > 200) fehler.push(`${bOrt}: „text“ länger als 200 Zeichen`)
        if (ohneParteinamen(h.text, ctx.parteinamen) !== h.text) fehler.push(`${bOrt}: „text“ nennt eine Partei`)
      }
      if (h.belegstufe !== 'A' && h.belegstufe !== 'B' && h.belegstufe !== 'C') fehler.push(`${bOrt}: „belegstufe“ muss A, B oder C sein`)
      if (h.belegstufe === 'C' && !h.zweite_quelle_url) fehler.push(`${bOrt}: Belegstufe C nur mit „zweite_quelle_url“ (A oder B)`)
      for (const feld of ['quelle_url', 'zweite_quelle_url'] as const) {
        const u = h[feld]
        if (u === undefined && feld === 'zweite_quelle_url') continue
        if (typeof u !== 'string' || !/^https:\/\/[^\s]+$/.test(u)) {
          fehler.push(`${bOrt}: „${feld}“ muss eine https-Adresse sein`)
          continue
        }
        const grund = gesperrteAdresse(u, ctx.liste, ctx.programmHosts)
        if (grund) fehler.push(`${bOrt}: Parteiquelle oder gesperrte Adresse – ${grund}`)
      }
      if (typeof h.beleg !== 'string' || h.beleg.trim().length < 20) fehler.push(`${bOrt}: „beleg“ – die Stelle wörtlich aus der Quelle (mindestens 20 Zeichen)`)
    }
    if (hinweise > MAX_HINWEISE) fehler.push(`${ort}: ${hinweise} Hinweise – höchstens ${MAX_HINWEISE}, nur die wesentlichen`)
  }
  for (const e of liste.einheiten) if (!gesehen.has(e.id)) fehler.push(`Lösungsweg ${e.id}: fehlt in der Antwort`)
  // Bilanz: Einseitigkeit ist kein Fehler (sie kann stimmen), aber die Koordination soll nachfragen.
  const summe = zaehler.vorteil + zaehler.nachteil + zaehler.gemischt
  if (summe >= 3 && (zaehler.vorteil === 0 || zaehler.nachteil === 0))
    warnungen.push(`Bilanz einseitig: ${zaehler.vorteil} Vorteile, ${zaehler.nachteil} Nachteile, ${zaehler.gemischt} gemischt – Gegenrichtung gezielt nachsuchen`)
  return { fehler, warnungen }
}

/** Kurze Übersicht je Lösungsweg für die Koordination: Bereich und Richtung der Hinweise. */
export function bilanz(antwort: NebenAntwort): string[] {
  const zeichen: Record<Richtung, string> = { vorteil: '+', nachteil: '−', gemischt: '±' }
  return antwort.einheiten.map((e) => {
    const h = e.bereiche.filter((b) => b.hinweis).map((b) => `${b.bereich} ${zeichen[b.hinweis!.richtung] ?? '?'}`)
    return `${e.id}: ${h.length ? h.join(', ') : 'keine wesentlichen Folgen belegt'}`
  })
}

/** Hinweise einer Antwort für den Katalog: ohne Beleg-Zitat, in der Reihenfolge der Bereiche. */
export function hinweiseFuerKatalog(e: NebenAntwort['einheiten'][number]): Nebenwirkung[] {
  return NEBENWIRKUNG_BEREICHE.flatMap((b) => {
    const h = e.bereiche.find((x) => x.bereich === b)?.hinweis
    if (!h) return []
    const { beleg: _beleg, ...rest } = h
    return [{ bereich: b, richtung: rest.richtung, text: rest.text, quelle_url: rest.quelle_url, belegstufe: rest.belegstufe, ...(rest.zweite_quelle_url ? { zweite_quelle_url: rest.zweite_quelle_url } : {}) }]
  })
}

/** Trägt die Hinweise in eine Themendatei (Rohdaten) ein – an Instrumenten und Maßnahmen ohne Instrument. */
export function nebenwirkungenEintragen(thema: Record<string, unknown>, antworten: NebenAntwort[], datum: string): { eingetragen: number; fehlend: number[] } {
  const ziele = new Map<number, Record<string, unknown>>()
  for (const i of (thema.instrumente as Record<string, unknown>[] | undefined) ?? []) ziele.set(i.id as number, i)
  for (const a of (thema.abdeckung as { massnahmen?: Record<string, unknown>[] }[] | undefined) ?? [])
    for (const m of a.massnahmen ?? []) if (m.instrument === undefined) ziele.set(m.id as number, m)
  let eingetragen = 0
  const fehlend: number[] = []
  for (const e of antworten.flatMap((a) => a.einheiten)) {
    const ziel = ziele.get(e.id)
    if (!ziel) {
      fehlend.push(e.id)
      continue
    }
    const alt = ziel.nebenwirkungen as Nebenwirkungen | undefined
    if (alt && !alt.ki_entwurf) continue
    ziel.nebenwirkungen = { geprueft: datum, hinweise: hinweiseFuerKatalog(e), ki_entwurf: true }
    eingetragen++
  }
  return { eingetragen, fehlend }
}
