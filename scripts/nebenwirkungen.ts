// Folgen über das Thema hinaus erfassen (docs/plan-nebenwirkungen.md, Skill /nebenwirkungen-erfassen).
// Ablauf: Blindliste je Thema in Teilen (Lösungswege ohne Partei) → je Teil ein Agent nebenwirkungen-recherche →
// Antwort prüfen → eintragen als KI-Entwurf. Die Regeln aus dem Pilot (Energiepreise, 21. 10. 2026) sind hier
// fest eingebaut: jeder Bereich in beide Richtungen gesucht, Beleg wörtlich aus der Quelle, Bilanz der Richtungen.
// Aus den Urteilen der ersten Läufe (22./23. 10. 2026) kommen die Prüfungen auf Sekundärquellen, PDF-Seiten,
// Größenordnungen und gleiche Suchanfragen; sie ersparen Rückfragen der Koordination (Verbrauch: plan-nebenwirkungen.md).
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Katalog, Nebenwirkungen } from '../src/data/katalog.ts'
import { NEBENWIRKUNG_BEREICHE, NEBENWIRKUNG_RICHTUNGEN, type Nebenwirkung } from '../src/data/types.ts'
import { ohneParteinamen } from '../supabase/functions/_shared/ki.ts'
// @ts-expect-error – Hook in reinem JavaScript (schneller Start), ohne Typdeklaration
import { gesperrteAdresse } from '../.claude/hooks/sperre.mjs'
import { verdaechtigeReste } from './entwurf.ts'
import { fehlendeZahlen } from './zitate.ts'

export const NEBEN_ORDNER = (themaId: number) => `.cache/nebenwirkungen/${themaId}`
/** Lösungswege je Agent: sechs Bereiche × zwei Richtungen je Weg – mehr wird für einen Agenten zu lang. */
export const TEIL_GROESSE = 6
export const MAX_HINWEISE = 3

type Bereich = (typeof NEBENWIRKUNG_BEREICHE)[number]
type Richtung = (typeof NEBENWIRKUNG_RICHTUNGEN)[number]

/**
 * Startbegriffe je Bereich und Richtung. Der Pilot fand zuerst fast nur Nachteile bei fossilen und Vorteile bei
 * erneuerbaren Wegen – die Gegenrichtung kam erst mit gezielter Suche. Darum nennt die Liste beide Richtungen;
 * eine Suchanfrage je Bereich verbindet Begriffe aus beiden (zwei getrennte verdoppelten die Suchen ohne mehr Treffer).
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
  /** Ursache, nach der der Weg eingeteilt ist (1 = erste in `ursachen`): Wege zur selben Ursache brauchen gleiche Maßstäbe. */
  ursache?: number
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
  /**
   * Schon verwendete Quellen des Themas (Katalog und beurteilte Antworten anderer Teile): ähnliche Wege sollen
   * dieselbe Quelle nutzen. Nicht in der Prüfsumme – `nebenwirkungen:blind -- <ID> --quellen` ergänzt offene Teile.
   */
  quellen: Quelle[]
  /**
   * Hinweise beurteilter Wege zu denselben Ursachen aus anderen Teilen (gleiche Maßstäbe über Teile hinweg; in Thema 10
   * kosteten zwei Rückfragen nur dafür ein Viertel der Nacharbeit). Nicht in der Prüfsumme – ergänzt von `--quellen`.
   */
  vergleich?: Vergleich[]
}

export interface Vergleich extends Quelle {
  id: number
  ursache: number
}

export interface Quelle {
  bereich: Bereich
  text: string
  quelle_url: string
}

export interface NebenHinweis extends Omit<Nebenwirkung, 'bereich'> {
  /** Wörtlich aus der Quelle (mit Seite, wo es eine gibt) – bleibt im Protokoll, nicht im Katalog. */
  beleg: string
}

export interface NebenAntwort {
  pruefsumme: string
  einheiten: {
    id: number
    /** `ohne`: warum hier kein Hinweis steht, obwohl ein Weg zur selben Ursache im selben Bereich einen hat. */
    bereiche: { bereich: Bereich; gesucht: string[]; hinweis: NebenHinweis | null; ohne?: string }[]
  }[]
}

/** Lösungswege eines Themas: genutzte Instrumente und Maßnahmen ohne Instrument. `alle`: auch schon erfasste KI-Entwürfe. */
export function einheitenDesThemas(k: Katalog, themaId: number, alle = false): (Einheit & { nebenwirkungen?: Nebenwirkungen; ursache: number; ursachen: number[] })[] {
  const massnahmen = k.massnahmen.filter((m) => m.thema_id === themaId)
  const ursachenVon = (ms: typeof massnahmen) => [...new Set(ms.flatMap((m) => m.ursachen_ids))].sort((a, b) => a - b)
  const instrumente = k.instrumente
    .filter((i) => i.thema_id === themaId && massnahmen.some((m) => m.instrument_id === i.id))
    .map((i) => ({
      id: i.id,
      name: i.name,
      ebene: (massnahmen.find((m) => m.instrument_id === i.id)?.land ? 'land' : 'bund') as Einheit['ebene'],
      begruendung: i.begruendung,
      nebenwirkungen: i.nebenwirkungen,
      ursache: ursachenVon(massnahmen.filter((m) => m.instrument_id === i.id))[0],
      ursachen: ursachenVon(massnahmen.filter((m) => m.instrument_id === i.id)),
    }))
  const einzeln = massnahmen
    .filter((m) => m.instrument_id === undefined)
    .map((m) => ({ id: m.id, name: m.beschreibung, ebene: (m.land ? 'land' : 'bund') as Einheit['ebene'], begruendung: m.begruendung, nebenwirkungen: m.nebenwirkungen, ursache: ursachenVon([m])[0], ursachen: ursachenVon([m]) }))
  // Menschlich geprüfte Hinweise werden nie ersetzt; KI-Entwürfe nur mit `alle`.
  return [...instrumente, ...einzeln]
    .filter((e) => !e.nebenwirkungen || (alle && e.nebenwirkungen.ki_entwurf))
    .sort((a, b) => a.id - b.id)
}

const sha = (t: string) => createHash('sha256').update(t).digest('hex').slice(0, 16)

/** Quellen schon erfasster Hinweise, je Adresse einmal (Hinweise sind parteifrei). */
export function quellenAus(hinweise: Quelle[]): Quelle[] {
  const gesehen = new Set<string>()
  return hinweise.filter((h) => !gesehen.has(h.quelle_url) && gesehen.add(h.quelle_url)).map(({ bereich, text, quelle_url }) => ({ bereich, text, quelle_url }))
}

/** Hinweise beurteilter Teile als Vergleich für offene Teile – nur zu Ursachen, die der offene Teil auch hat. */
export function vergleichFuer(offen: NebenBlindliste, fertig: { liste: NebenBlindliste; antwort: NebenAntwort }[]): Vergleich[] {
  const ursachen = new Set(offen.einheiten.map((e) => e.ursache))
  return fertig.flatMap(({ liste, antwort }) =>
    antwort.einheiten.flatMap((e) => {
      const ursache = liste.einheiten.find((x) => x.id === e.id)?.ursache
      if (ursache === undefined || !ursachen.has(ursache)) return []
      return e.bereiche.flatMap((b) => (b.hinweis ? [{ id: e.id, ursache, bereich: b.bereich, text: b.hinweis.text, quelle_url: b.hinweis.quelle_url }] : []))
    }),
  )
}

/** Quellen aus Antworten: alle Hinweise, die nach dem Urteil der Koordination stehen geblieben sind. */
export const quellenDerAntworten = (antworten: NebenAntwort[]): Quelle[] =>
  quellenAus(antworten.flatMap((a) => a.einheiten.flatMap((e) => e.bereiche.flatMap((b) => (b.hinweis ? [{ bereich: b.bereich, text: b.hinweis.text, quelle_url: b.hinweis.quelle_url }] : [])))))

/**
 * Teilt Lösungswege so auf, dass Wege zur selben Ursache möglichst im selben Teil liegen: Ähnliche Wege bekommen
 * so von einem Agenten dieselben Maßstäbe (im ersten Lauf nach den Optimierungen lagen zwei Einkommensteuer-Wege
 * in verschiedenen Teilen, und nur einer bekam einen Verteilungshinweis). Gruppen über TEIL_GROESSE werden geteilt;
 * dicht gepackt entstehen kaum mehr Teile als bei fester Reihenfolge (alle Themen: 263 statt 257).
 *
 * Ein Weg zu mehreren Ursachen geht in die Gruppe, in der er noch Platz hat (erste Ursache zuerst): In Thema 10 lag
 * ein Weg zu den Investitionskosten der Heime sonst bei den Eigenanteilen, und die übergroße Gruppe schob einen
 * Vollversicherungsweg in einen fremden Teil. Teile mit dem Rest einer geteilten Gruppe kommen ans Ende, damit sie
 * in eine spätere Welle fallen und über `vergleich` die Hinweise der ersten Stücke sehen.
 */
export function teileNachUrsache<T extends { id: number; ursache: number; ursachen?: number[] }>(einheiten: T[]): T[][] {
  const groesse = new Map<number, number>()
  for (const e of einheiten) if ((e.ursachen?.length ?? 1) <= 1) groesse.set(e.ursache, (groesse.get(e.ursache) ?? 0) + 1)
  const zugeteilt = [...einheiten]
    .sort((a, b) => a.id - b.id)
    .map((e) => {
      if ((e.ursachen?.length ?? 1) <= 1) return e
      const ursache = e.ursachen!.find((u) => (groesse.get(u) ?? 0) < TEIL_GROESSE) ?? e.ursache
      groesse.set(ursache, (groesse.get(ursache) ?? 0) + 1)
      return { ...e, ursache }
    })
  const gruppen = new Map<number, T[]>()
  for (const e of zugeteilt.sort((a, b) => a.ursache - b.ursache || a.id - b.id)) gruppen.set(e.ursache, [...(gruppen.get(e.ursache) ?? []), e])
  // Große Gruppen in volle Teile; die Reste der Größe nach in den ersten Teil, in den sie passen.
  const stuecke = [...gruppen.values()].flatMap((g) =>
    Array.from({ length: Math.ceil(g.length / TEIL_GROESSE) }, (_, i) => Object.assign(g.slice(i * TEIL_GROESSE, (i + 1) * TEIL_GROESSE), { rest: i > 0 })),
  )
  const teile: (T[] & { rest?: boolean })[] = []
  for (const stueck of stuecke.sort((a, b) => b.length - a.length || a[0].ursache - b[0].ursache)) {
    const platz = teile.find((t) => t.length + stueck.length <= TEIL_GROESSE)
    if (platz) {
      platz.push(...stueck)
      platz.rest ||= stueck.rest
    } else teile.push(Object.assign([...stueck], { rest: stueck.rest }))
  }
  return [...teile.filter((t) => !t.rest), ...teile.filter((t) => t.rest)].map((t) => [...t])
}

/**
 * Lage statt Folge: In Thema 10 standen dreimal eine Statistik zu den Betroffenen und „der Weg setzt an dieser
 * Verteilung an“ – eine eigene Folgerung, die keine Folge belegt; alle drei wurden verworfen.
 */
const ANKNUEPFUNG = /\b(setz|knüpf)(t|en) (genau )?an dies\w* [^.;]*\ban\b/i

/** Auslassung mitten im Beleg oder Einschub in eckigen Klammern; „…“ am Anfang oder Ende und vor der Seitenangabe bleibt erlaubt. */
const AUSLASSUNG = /\[|\]|[\p{L}\p{N},;:.]\s*(…|\.\.\.)\s*(?!S\.\s*\d)[\p{L}\p{N}]/u

/** Blindlisten in Teilen zu höchstens TEIL_GROESSE Lösungswegen – ohne Parteien, Länder oder Zitate. */
export function nebenBlind(k: Katalog, themaId: number, alle = false): { listen: NebenBlindliste[]; reste: string[] } {
  const thema = k.themen.find((t) => t.id === themaId)
  if (!thema) throw new Error(`Thema ${themaId} gibt es nicht`)
  const ursachenIds = k.ursachen.filter((u) => u.thema_id === themaId).map((u) => u.id)
  const gruppiert = teileNachUrsache(einheitenDesThemas(k, themaId, alle)).map((t) =>
    t.map(({ id, name, ebene, begruendung, ursache }) => ({ id, name, ebene, begruendung, ursache: ursachenIds.indexOf(ursache) + 1 })),
  )
  const einheiten = gruppiert.flat()
  const parteinamen = k.parteien.map(({ name, kurzname }) => ({ name, kurzname }))
  const reste = einheiten.flatMap((e) =>
    [e.name, e.begruendung].flatMap((t) => [...verdaechtigeReste(t), ...(ohneParteinamen(t, parteinamen) !== t ? ['Parteiname'] : [])].map((r) => `${e.id}: ${r}`)),
  )
  const massnahmen = k.massnahmen.filter((m) => m.thema_id === themaId)
  const vorhanden = [...k.instrumente.filter((i) => i.thema_id === themaId), ...massnahmen].flatMap((x) => x.nebenwirkungen?.hinweise ?? [])
  const quellen = quellenAus(vorhanden)
  const teile = gruppiert.length
  const listen = gruppiert.map((teil, i) => {
    const inhalt = {
      thema_id: themaId,
      thema: thema.name,
      ziel: thema.ziel ?? '',
      ursachen: k.ursachen.filter((u) => u.thema_id === themaId).map((u) => u.beschreibung),
      teil: i + 1,
      teile,
      einheiten: teil,
      suchhilfe: SUCHHILFE,
    }
    return { pruefsumme: sha(JSON.stringify(inhalt)), ...inhalt, quellen }
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

/**
 * Fach- und Tagespresse, Verlags- und Ratgeberseiten: kein Beleg, auch wenn sie eine Behörde zitieren – dann die
 * Behörde selbst. Gesammelt aus den Urteilen der ersten Läufe; erweitern, wenn die Koordination weitere verwirft.
 */
export const SEKUNDAERQUELLEN = [
  'spiegel.de', 'zeit.de', 'faz.net', 'sueddeutsche.de', 'welt.de', 'handelsblatt.com', 'tagesspiegel.de', 'focus.de', 'stern.de',
  'n-tv.de', 't-online.de', 'rnd.de', 'tagesschau.de', 'zdf.de', 'br.de', 'ndr.de', 'wdr.de', 'mdr.de', 'swr.de', 'deutschlandfunk.de',
  'wiwo.de', 'capital.de', 'manager-magazin.de', 'merkur.de', 'fr.de', 'taz.de', 'nzz.ch', 'bild.de',
  'pharmazeutische-zeitung.de', 'aerzteblatt.de', 'aerztezeitung.de', 'apotheke-adhoc.de', 'deutsche-apotheker-zeitung.de',
  'haufe.de', 'nwb.de', 'baulinks.de', 'immobilienzeitung.de', 'energate-messenger.de', 'tagesspiegel-background.de', 'correctiv.org',
  'finanztip.de', 'test.de', 'wikipedia.org',
]
const host = (u: string) => {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}
export const sekundaerquelle = (u: string) => {
  const h = host(u)
  return SEKUNDAERQUELLEN.find((s) => h === s || h.endsWith(`.${s}`))
}
const PDF = /\.pdf($|[?#])/i
/** Beträge ab einer Milliarde – kleinere Haushaltsfolgen sind nicht wesentlich. */
const MILLIARDEN = /\bMrd\.|Milliarde/i

/**
 * Prüft eine Antwort gegen ihre Blindliste. Fehler verhindern das Eintragen; Warnungen gehen an die Koordination.
 * `werkzeuge` (aus dem Transkript): gleicht „gesucht“ und die Quellen mit dem ab, was wirklich lief.
 */
export function pruefeNebenAntwort(liste: NebenBlindliste, antwort: NebenAntwort, ctx: Pruefkontext, werkzeuge?: Werkzeuge): { fehler: string[]; warnungen: string[] } {
  const fehler: string[] = []
  const warnungen: string[] = []
  if (antwort?.pruefsumme !== liste.pruefsumme) fehler.push('„pruefsumme“ passt nicht zur Blindliste (falscher Teil oder veraltete Liste)')
  const einheiten = Array.isArray(antwort?.einheiten) ? antwort.einheiten : []
  const ids = new Set(liste.einheiten.map((e) => e.id))
  const gesehen = new Set<number>()
  const zaehler: Record<Richtung, number> = { vorteil: 0, nachteil: 0, gemischt: 0 }
  const anfragen = new Map<string, number>()
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
      if (!suchanfragen(x.gesucht)) fehler.push(`${bOrt}: „gesucht“ – die tatsächlich benutzten Suchanfragen angeben (mindestens eine)`)
      // Ohne Transkript: gleiche Listen bei zwei Wegen deuten auf Abschreiben. Mit Transkript zählt nur, was lief –
      // eine Suche darf dann für mehrere Wege stehen (die Pflicht zu eigenen Listen ließ in Thema 42 Anfragen erfinden).
      else if (!werkzeuge) {
        const schluessel = `${x.bereich}|${x.gesucht.map((s) => s.trim().toLowerCase()).sort().join('|')}`
        const anderer = anfragen.get(schluessel)
        if (anderer !== undefined && anderer !== e.id) fehler.push(`${bOrt}: „gesucht“ gleich wie bei Lösungsweg ${anderer} – je Lösungsweg eigene, tatsächlich benutzte Anfragen`)
        else anfragen.set(schluessel, e.id)
      }
      const h = x.hinweis
      if (h === null || h === undefined) continue
      hinweise++
      if (!(NEBENWIRKUNG_RICHTUNGEN as readonly unknown[]).includes(h.richtung)) fehler.push(`${bOrt}: „richtung“ muss vorteil, nachteil oder gemischt sein`)
      else zaehler[h.richtung]++
      if (typeof h.text !== 'string' || !h.text.trim()) fehler.push(`${bOrt}: „text“ fehlt`)
      else {
        if (h.text.length > 200) fehler.push(`${bOrt}: „text“ länger als 200 Zeichen`)
        if (ohneParteinamen(h.text, ctx.parteinamen) !== h.text) fehler.push(`${bOrt}: „text“ nennt eine Partei`)
        if (ANKNUEPFUNG.test(h.text))
          fehler.push(`${bOrt}: „text“ beschreibt die heutige Lage und knüpft den Weg nur daran an – ein Hinweis nennt, was der Weg verändert, sonst null`)
        if (x.bereich === 'haushalt' && !MILLIARDEN.test(h.text)) fehler.push(`${bOrt}: Haushalt nur ab Milliardenbeträgen („… Mrd. Euro“), sonst hinweis: null`)
        if (x.bereich === 'aufwand' && !/\d/.test(h.text)) fehler.push(`${bOrt}: Aufwand nur mit Größenordnung (Betrag, Stunden, Fälle), sonst hinweis: null`)
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
        const presse = sekundaerquelle(u)
        if (presse) fehler.push(`${bOrt}: „${feld}“ – ${presse} ist Presse oder Sekundärquelle; die zitierte Stelle selbst (Behörde, Drucksache, Studie) oder hinweis: null`)
      }
      if (typeof h.beleg !== 'string' || h.beleg.trim().length < 20) fehler.push(`${bOrt}: „beleg“ – die Stelle wörtlich aus der Quelle (mindestens 20 Zeichen)`)
      else if (AUSLASSUNG.test(h.beleg))
        fehler.push(`${bOrt}: „beleg“ zusammengesetzt (Auslassung „…“ oder Einschub „[ ]“) – ein zusammenhängender Abschnitt wörtlich aus der Quelle`)
      else if (typeof h.quelle_url === 'string' && PDF.test(h.quelle_url) && !/\bS\.\s*\d/.test(h.beleg))
        fehler.push(`${bOrt}: „beleg“ aus einem PDF mit Seite („S. 12“) – gelesen mit npm run -s nebenwirkungen:pdf`)
      if (typeof h.text === 'string' && typeof h.beleg === 'string') {
        const z = zahlenOhneBeleg(h.text, h.beleg)
        if (z.zahlen.length) fehler.push(`${bOrt}: Zahl ${z.zahlen.join(', ')} steht im Text, aber nicht im Beleg – weglassen oder einen längeren Abschnitt als Beleg`)
        if (z.jahre.length) warnungen.push(`${bOrt}: Jahr ${z.jahre.join(', ')} steht im Text, aber nicht im Beleg – stimmt es?`)
      }
    }
    if (hinweise > MAX_HINWEISE) fehler.push(`${ort}: ${hinweise} Hinweise – höchstens ${MAX_HINWEISE}, nur die wesentlichen`)
  }
  for (const e of liste.einheiten) if (!gesehen.has(e.id)) fehler.push(`Lösungsweg ${e.id}: fehlt in der Antwort`)
  if (werkzeuge) fehler.push(...pruefeWerkzeuge(antwort, werkzeuge))
  // Gleiche Maßstäbe (in Thema 42 der häufigste Rückfragegrund): Hat ein Weg zur selben Ursache im Bereich einen
  // Hinweis, braucht ein anderer ohne Hinweis dort einen kurzen Grund in „ohne“.
  const ursacheVon = new Map(liste.einheiten.map((e) => [e.id, e.ursache ?? 0]))
  for (const e of einheiten.filter((x) => ids.has(x?.id))) {
    for (const x of Array.isArray(e.bereiche) ? e.bereiche : []) {
      if (x?.hinweis || (typeof x?.ohne === 'string' && x.ohne.trim().length >= 15)) continue
      const mit = einheiten.find(
        (a) => a !== e && ursacheVon.get(a?.id) === ursacheVon.get(e.id) && (Array.isArray(a?.bereiche) ? a.bereiche : []).some((y) => y?.bereich === x?.bereich && y.hinweis),
      )
      const anderswo = (liste.vergleich ?? []).find((v) => v.ursache === ursacheVon.get(e.id) && v.bereich === x?.bereich)
      if (mit)
        fehler.push(
          `Lösungsweg ${e.id} › ${x.bereich}: Lösungsweg ${mit.id} (gleiche Ursache) hat hier einen Hinweis – Gegenstück suchen (z. B. Kosten ↔ Einsparung) oder in „ohne“ kurz begründen, warum er hier nicht passt`,
        )
      else if (anderswo)
        fehler.push(
          `Lösungsweg ${e.id} › ${x.bereich}: Lösungsweg ${anderswo.id} (gleiche Ursache, anderer Teil, siehe „vergleich“) hat hier einen Hinweis – dieselbe Quelle prüfen oder in „ohne“ kurz begründen, warum er hier nicht passt`,
        )
    }
  }
  // Bilanz: Einseitigkeit ist kein Fehler (sie kann stimmen), aber die Koordination soll nachfragen.
  const summe = zaehler.vorteil + zaehler.nachteil + zaehler.gemischt
  if (summe >= 3 && (zaehler.vorteil === 0 || zaehler.nachteil === 0))
    warnungen.push(`Bilanz einseitig: ${zaehler.vorteil} Vorteile, ${zaehler.nachteil} Nachteile, ${zaehler.gemischt} gemischt – Gegenrichtung gezielt nachsuchen`)
  return { fehler, warnungen }
}

/**
 * Zahlen im Text, die im Beleg fehlen (in Thema 45 der häufigste Rückfragegrund): Jahre getrennt, weil sie oft
 * Kontext sind („Bundesverkehrswegeplan 2030“); Ziffern an Buchstaben (CO2, WD 4) zählen nicht.
 */
export function zahlenOhneBeleg(text: string, beleg: string): { zahlen: string[]; jahre: string[] } {
  const fehlend = fehlendeZahlen(text.replace(/(\p{L})\d+/gu, '$1'), beleg)
  const jahr = (z: string) => /^(19|20)\d\d$/.test(z)
  return { zahlen: fehlend.filter((z) => !jahr(z)), jahre: fehlend.filter(jahr) }
}

/** Mindestens so viele verschiedene Suchen je Lösungsweg (Thema 45: anfangs fünf Suchen für sechs Wege). */
export const MIN_SUCHEN_JE_WEG = 2

/** Was der Agent laut Transkript wirklich getan hat: Suchanfragen und geöffnete Adressen (WebFetch, nebenwirkungen:pdf). */
export interface Werkzeuge {
  suchen: string[]
  adressen: string[]
}

const anfrage = (s: string) => s.toLowerCase().replace(/["„“”']/g, '').replace(/\s+/g, ' ').trim()
const adresse = (u: string) => u.trim().replace(/#.*$/, '').replace(/\/+$/, '')

/**
 * Abgleich mit dem Transkript: In Thema 42 standen in „gesucht“ Anfragen, die nie liefen, und ein Beleg kam aus
 * der Kopie eines Verbands, während `quelle_url` auf das Ministerium zeigte. Jede Anfrage in „gesucht“ muss gelaufen
 * (WebSearch oder Suchwörter von nebenwirkungen:pdf), jede Quelle geöffnet sein, und je Weg müssen genug Suchen gelaufen sein.
 */
export function pruefeWerkzeuge(antwort: NebenAntwort, w: Werkzeuge): string[] {
  const fehler: string[] = []
  const suchen = new Set(w.suchen.map(anfrage))
  const adressen = new Set(w.adressen.map(adresse))
  const wege = Array.isArray(antwort?.einheiten) ? antwort.einheiten.length : 0
  if (suchen.size < MIN_SUCHEN_JE_WEG * wege)
    fehler.push(`Nur ${suchen.size} verschiedene Suchen für ${wege} Lösungswege – mindestens ${MIN_SUCHEN_JE_WEG} je Weg, gezielt auf den Weg selbst (Kosten, Entlastung, Betroffene)`)
  for (const e of Array.isArray(antwort?.einheiten) ? antwort.einheiten : []) {
    for (const x of Array.isArray(e?.bereiche) ? e.bereiche : []) {
      const ort = `Lösungsweg ${e.id} › ${x?.bereich}`
      const nie = (Array.isArray(x?.gesucht) ? x.gesucht : []).filter((s) => typeof s === 'string' && !suchen.has(anfrage(s)))
      if (nie.length) fehler.push(`${ort}: „gesucht“ enthält nicht ausgeführte Suchen (${nie.map((s) => `„${s}“`).join(', ')}) – suchen oder nur wörtlich eintragen, was gelaufen ist`)
      for (const u of [x?.hinweis?.quelle_url, x?.hinweis?.zweite_quelle_url])
        if (typeof u === 'string' && !adressen.has(adresse(u)))
          fehler.push(`${ort}: ${u} nicht selbst geöffnet – mit WebFetch bzw. npm run -s nebenwirkungen:pdf öffnen; Kopien bei Dritten sind keine Quelle`)
    }
  }
  return fehler
}

/** Für den Vergleich mit dem Original: Anführungszeichen, Striche, Trennungen und Leerraum vereinheitlicht. */
export const normiereBeleg = (t: string) =>
  t
    .normalize('NFKC')
    .replace(/­/g, '')
    .replace(/[„“”«»"]/g, '"')
    .replace(/[‚‘’']/g, "'")
    .replace(/[‐‑–—]/g, '-')
    .replace(/(\p{L})\s*-\s+(\p{Ll})/gu, '$1$2')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()

/**
 * Steht der Beleg wörtlich im Original? `seiten`: Seitentexte eines PDFs bzw. ein Eintrag für eine HTML-Seite.
 * Ergebnis: Seite (1-basiert), auf der er steht, oder 0. Seitenangabe und „…“ am Rand zählen nicht mit.
 */
export function belegSeite(beleg: string, seiten: string[]): number {
  const kern = normiereBeleg(beleg.replace(/\(?\s*S\.\s*\d[\d\s,f.–-]*\)?\s*$/u, '').replace(/^\s*(…|\.\.\.)\s*|\s*(…|\.\.\.)\s*$/gu, ''))
  if (!kern) return 0
  const i = seiten.findIndex((t) => normiereBeleg(t).includes(kern))
  return i + 1
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
