// Wo treffen die Suchbegriffe in einem Programm? Reine Funktionen für das Dossier (entwurf:dossier),
// die Treffermatrix (entwurf:treffer) und die Hinweise zu Ursachen ohne Maßnahme. Dieselbe Rechnung
// für jedes Programm: Das Dossier ordnet nur, wo gelesen wird – es wählt keine Maßnahmen aus.
import type { Suchbegriffe } from '../entwurf.ts'
import { begriffQuelle, fliesstext } from './suche.ts'

/** Ein Begriff, der auf so vielen Seiten steht, sagt nichts über das Thema („kommunen“) und zählt nicht für die Rangliste. */
export const UNSPEZIFISCH_ANTEIL = 0.2
/** Erst ab so vielen Seiten wird ein Begriff als unspezifisch eingestuft (kurze Programme verzerren den Anteil). */
export const UNSPEZIFISCH_AB_SEITEN = 20
/** So viele verschiedene Begriffe einer Ursache auf derselben Seite gelten als Fundstelle, die nachgelesen wird. */
export const MINDEST_BEGRIFFE_JE_SEITE = 3

export interface Eintrag {
  ursache: string
  richtung: string
  begriff: string
}

/** Alle Begriffe als flache Liste, optional nur für bestimmte Ursachen. */
export const eintraege = (s: Suchbegriffe, ursachen?: ReadonlySet<string>): Eintrag[] =>
  Object.entries(s)
    .filter(([u]) => !ursachen || ursachen.has(u))
    .flatMap(([ursache, r]) => Object.entries(r).flatMap(([richtung, b]) => b.map((begriff) => ({ ursache, richtung, begriff }))))

export interface Seitenanalyse {
  anzahlSeiten: number
  eintraege: Eintrag[]
  /** Treffer je Eintrag, parallel zu `eintraege`. */
  treffer: number[]
  /** Je Seite (Index 0 = Seite 1): Eintragsindex → Treffer. */
  proSeite: Map<number, number>[]
  /** Begriffe, die auf zu vielen Seiten stehen. */
  unspezifisch: Set<string>
  /** Fließtext je Seite. */
  texte: string[]
  /** Auf wie vielen Seiten jeder Begriff mindestens einmal trifft. */
  seitenJeBegriff: Map<string, number>
}

export function analysiere(seiten: string[], liste: Eintrag[]): Seitenanalyse {
  const texte = seiten.map(fliesstext)
  const jeBegriff = new Map<string, number[]>()
  for (const e of liste) {
    if (jeBegriff.has(e.begriff)) continue
    const muster = new RegExp(begriffQuelle(e.begriff), 'giu')
    jeBegriff.set(e.begriff, texte.map((t) => [...t.matchAll(muster)].length))
  }
  const treffer = liste.map((e) => jeBegriff.get(e.begriff)!.reduce((a, c) => a + c, 0))
  const proSeite = texte.map(() => new Map<number, number>())
  liste.forEach((e, j) =>
    jeBegriff.get(e.begriff)!.forEach((n, i) => {
      if (n) proSeite[i].set(j, n)
    }),
  )
  const seitenJeBegriff = new Map([...jeBegriff].map(([b, z]) => [b, z.filter(Boolean).length] as const))
  const unspezifisch = new Set<string>()
  if (texte.length >= UNSPEZIFISCH_AB_SEITEN)
    for (const [b, n] of seitenJeBegriff) if (n / texte.length >= UNSPEZIFISCH_ANTEIL) unspezifisch.add(b)
  return { anzahlSeiten: texte.length, eintraege: liste, treffer, proSeite, unspezifisch, texte, seitenJeBegriff }
}

export interface Fundseite {
  seite: number
  /** Treffer der spezifischen Begriffe, jeder Begriff einmal gezählt. */
  anzahl: number
  /** „Ursache|Richtung“ → Begriffe mit Treffern auf dieser Seite. */
  richtungen: Map<string, Map<string, number>>
  /** Ursache → verschiedene Begriffe auf dieser Seite. */
  jeUrsache: Map<string, Set<string>>
  /** Verschiedene spezifische Begriffe auf dieser Seite. */
  begriffe: Set<string>
}

/** Seiten mit Treffern, die meisten gleichzeitigen Richtungen zuerst; unspezifische Begriffe zählen nicht. */
export function fundseiten(a: Seitenanalyse): Fundseite[] {
  const liste: Fundseite[] = []
  a.proSeite.forEach((treffer, i) => {
    const f: Fundseite = { seite: i + 1, anzahl: 0, richtungen: new Map(), jeUrsache: new Map(), begriffe: new Set() }
    for (const [j, n] of treffer) {
      const e = a.eintraege[j]
      if (a.unspezifisch.has(e.begriff)) continue
      if (!f.begriffe.has(e.begriff)) {
        f.begriffe.add(e.begriff)
        f.anzahl += n
      }
      const schluessel = `${e.ursache}|${e.richtung}`
      if (!f.richtungen.has(schluessel)) f.richtungen.set(schluessel, new Map())
      f.richtungen.get(schluessel)!.set(e.begriff, n)
      if (!f.jeUrsache.has(e.ursache)) f.jeUrsache.set(e.ursache, new Set())
      f.jeUrsache.get(e.ursache)!.add(e.begriff)
    }
    if (f.begriffe.size) liste.push(f)
  })
  return liste.sort((x, y) => y.richtungen.size - x.richtungen.size || y.begriffe.size - x.begriffe.size || y.anzahl - x.anzahl || x.seite - y.seite)
}

/** Ursache → Seiten, auf denen mindestens `mindestens` verschiedene Begriffe dieser Ursache zugleich treffen. */
export function seitenJeUrsache(a: Seitenanalyse, mindestens = MINDEST_BEGRIFFE_JE_SEITE): Record<string, number[]> {
  const r: Record<string, number[]> = {}
  for (const f of fundseiten(a))
    for (const [u, b] of f.jeUrsache) if (b.size >= mindestens) (r[u] ??= []).push(f.seite)
  for (const s of Object.values(r)) s.sort((x, y) => x - y)
  return r
}

/** Seitenzahlen zu zusammenhängenden Bereichen; eine Lücke von `luecke` Seiten verbindet noch. */
export function bereiche(seiten: number[], luecke = 1): [number, number][] {
  const r: [number, number][] = []
  for (const n of [...new Set(seiten)].sort((x, y) => x - y)) {
    const letzter = r[r.length - 1]
    if (letzter && n - letzter[1] <= luecke + 1) letzter[1] = n
    else r.push([n, n])
  }
  return r
}

export const bereichText = (r: [number, number][]) => r.map(([von, bis]) => (von === bis ? String(von) : `${von}–${bis}`)).join(', ')

/** Kurzer Ausschnitt um den ersten Treffer eines der Begriffe. */
export function auszug(text: string, begriffe: string[], vor = 120, nach = 200): string {
  const m = new RegExp(begriffe.map(begriffQuelle).join('|'), 'iu').exec(text)
  if (!m) return text.slice(0, vor + nach)
  const von = Math.max(0, m.index - vor)
  const bis = Math.min(text.length, m.index + m[0].length + nach)
  return `${von > 0 ? '…' : ''}${text.slice(von, m.index)}«${m[0]}»${text.slice(m.index + m[0].length, bis)}${bis < text.length ? '…' : ''}`
}

export interface DossierEingabe {
  titel: string
  thema: string
  ursachen: { id: number; beschreibung: string }[]
  /** Nur die Ursachen, die für dieses Programm zählen. */
  suchbegriffe: Suchbegriffe
  seiten: string[]
  ohneText: number[]
  /** Wie viele Seiten mit Details gezeigt werden (Rest nur als Seitenzahl). */
  max?: number
}

/** Der Leseplan nennt Seiten, auf denen so viele Richtungen zugleich treffen; gibt es keine, die besten Seiten. */
export const LESEPLAN_RICHTUNGEN = 2
export const LESEPLAN_MINDESTENS = 5

export const DOSSIER_SEITEN = 30

export function dossierMarkdown(e: DossierEingabe): string {
  const a = analysiere(e.seiten, eintraege(e.suchbegriffe))
  const rang = fundseiten(a)
  const max = e.max ?? DOSSIER_SEITEN
  const gezeigt = rang.slice(0, max)
  const z: string[] = []
  z.push(`# Dossier ${e.titel} – Thema ${e.thema}`, '')
  z.push(
    `${e.seiten.length} Seiten${e.ohneText.length ? `, fast ohne Text (Bild oder Scan?): ${bereichText(bereiche(e.ohneText, 0))}` : ''}. ` +
      'Dieselbe Zählung und Rangliste für jedes Programm. Begriffe sind Wortteile (`^` nur am Wortanfang, `=` nur als ganzes Wort).',
    '',
    'Das Dossier zeigt, wo die Begriffe treffen, und ersetzt die Zähltabelle im Protokoll. Es ersetzt nicht das Lesen: ' +
      'Eine Maßnahme steht im Zusammenhang, und „keine Maßnahme“ gibt es erst, wenn das passende Kapitel gelesen ist.',
    '',
  )
  z.push('## Leseplan', '')
  const plan = rang.filter((f) => f.richtungen.size >= LESEPLAN_RICHTUNGEN).slice(0, max)
  const planSeiten = plan.length ? plan : gezeigt.slice(0, LESEPLAN_MINDESTENS)
  z.push(
    planSeiten.length
      ? `${plan.length ? `Seiten, auf denen mindestens ${LESEPLAN_RICHTUNGEN} Richtungen zugleich treffen` : 'Seiten mit den meisten Treffern'}; Nachbarseiten mitlesen: ${bereichText(bereiche(planSeiten.map((f) => f.seite)))}`
      : 'Keine Seite mit Treffern. Inhaltsverzeichnis lesen und die Kapitel zum Thema wählen; Null Treffer allein genügt nicht für „keine Maßnahme“.',
    '',
  )
  if (gezeigt.length) {
    z.push('## Seiten nach Treffern', '')
    for (const f of gezeigt) {
      z.push(`### S. ${f.seite} · ${f.richtungen.size} Richtungen · ${f.begriffe.size} Begriffe · ${f.anzahl} Treffer`, '')
      for (const [schluessel, b] of f.richtungen) {
        const [ursache, richtung] = schluessel.split('|')
        z.push(`- ${ursache} ${richtung}: ${[...b].map(([begriff, n]) => `${begriff} ${n}`).join('; ')}`)
      }
      // Ausschnitt um den Begriff, der im ganzen Programm am seltensten trifft: am ehesten das Thema.
      const seltenster = [...f.begriffe].sort((x, y) => (a.seitenJeBegriff.get(x) ?? 0) - (a.seitenJeBegriff.get(y) ?? 0))[0]
      z.push('', `> ${auszug(a.texte[f.seite - 1], [seltenster])}`, '')
    }
    const rest = rang.slice(max).map((f) => f.seite).sort((x, y) => x - y)
    if (rest.length) z.push(`Weitere Seiten mit Treffern: ${bereichText(bereiche(rest, 0))}`, '')
  }
  z.push('## Treffer je Begriff', '')
  const jeUrsache = new Map<string, Map<string, [string, number][]>>()
  a.eintraege.forEach((eintrag, j) => {
    const r = jeUrsache.get(eintrag.ursache) ?? new Map()
    r.set(eintrag.richtung, [...(r.get(eintrag.richtung) ?? []), [eintrag.begriff, a.treffer[j]]])
    jeUrsache.set(eintrag.ursache, r)
  })
  for (const [ursache, richtungen] of jeUrsache) {
    z.push(`### Ursache ${ursache} – ${e.ursachen.find((u) => String(u.id) === ursache)?.beschreibung ?? ''}`, '')
    for (const [richtung, begriffe] of richtungen) {
      const mit = begriffe.filter(([, n]) => n).map(([b, n]) => `${b} ${n}`)
      const ohne = begriffe.filter(([, n]) => !n).map(([b]) => b)
      z.push(`- ${richtung}: ${mit.length ? mit.join('; ') : 'keine Treffer'}${ohne.length && mit.length ? ` · ohne Treffer: ${ohne.join(', ')}` : ''}`)
    }
    z.push('')
  }
  if (a.unspezifisch.size) {
    z.push(
      '## Unspezifische Begriffe',
      '',
      `Stehen auf mindestens ${Math.round(UNSPEZIFISCH_ANTEIL * 100)} % der Seiten und zählen nicht für Rangliste und Leseplan (die Treffer oben sind trotzdem gezählt): ` +
        [...a.unspezifisch].map((b) => `${b} (${a.seitenJeBegriff.get(b)} Seiten)`).join(', '),
      '',
    )
  }
  return z.join('\n')
}
