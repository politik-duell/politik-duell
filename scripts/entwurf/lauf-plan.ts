// Sammelbefehle für /thema-erfassen und /forderung-erfassen: Jeder Schritt führt die Einzelbefehle für alle
// Themen eines Laufs aus, statt dass die Koordination sie einzeln startet (bei sechs Themen rund 100 Aufrufe,
// jeder mit ihrem ganzen Kontext). Die Einzelbefehle bleiben unverändert und einzeln aufrufbar.

export const SCHRITTE = ['vorab', 'auftraege', 'erfasst', 'blind', 'bewertet'] as const
export type Schritt = (typeof SCHRITTE)[number]

export interface Thema {
  /** Pfad der Arbeitsdatei, etwa .cache/entwurf/17/erfassung.json */
  pfad: string
  thema_id: number
  /** Forderung eines Nachtrags (/forderung-erfassen), sonst undefined. */
  nachtrag?: string
}

export interface Optionen {
  /** --bund, --land XX …, --partei SPD … (nur vorab und auftraege) */
  auswahl: string[]
  /** --lokal <ordner> (treffer, auftrag, zitate:pruefen) */
  lokal?: string
  /** bewertet: bewertung.json steht schon (Teil-Neubewertung), entwurf:json entfällt */
  bewertungFertig?: boolean
  /**
   * auftraege: zusätzlich Sammelaufträge (ein Agent je Programm für alle Themen). Nicht Standard: Im Vergleichslauf
   * (Themen 18 und 30, sechs Bundesprogramme) brauchten sie 39 % mehr Tokens und fast viermal so lange wie
   * Einzelaufträge – die Agenten lesen gezielt statt ganz, der Kontext des ersten Themas wächst im zweiten mit.
   * Mit den kleineren Themen 30 und 33 waren es 24 % weniger bei gleicher Fundquote (evals/README.md der Skill
   * thema-erfassen).
   */
  sammel?: boolean
}

export interface Befehl {
  skript: string
  args: string[]
}

const ordner = (t: Thema) => t.pfad.replace(/[\\/][^\\/]+$/, '')
const lokal = (o: Optionen) => (o.lokal ? ['--lokal', o.lokal] : [])

/** Kurzname eines Nachtrags für das Archiv, etwa „Mieten deckeln“ → „nachtrag-mieten-deckeln“. */
export const nachtragName = (forderung: string) =>
  'nachtrag-' +
  forderung
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

/**
 * Befehle eines Schritts in Ausführungsreihenfolge. Der Lauf bricht beim ersten Fehler ab. In `bewertet`
 * stehen alle Prüfungen der Bewertungen vor dem ersten Eintragen: `entwurf:eintragen` lässt sich je Programm
 * nur einmal ausführen, ein Fehler in einem späteren Thema darf keine halb eingetragenen Themen hinterlassen.
 */
export function plane(schritt: Schritt, themen: Thema[], o: Optionen): Befehl[] {
  const b: Befehl[] = []
  const je = (f: (t: Thema) => Befehl[]) => themen.forEach((t) => b.push(...f(t)))
  switch (schritt) {
    case 'vorab':
      je((t) => [
        ...(t.nachtrag ? [] : [{ skript: 'ursachen:freigegeben', args: [String(t.thema_id), '--gegen', 'HEAD'] }]),
        { skript: 'entwurf:treffer', args: [t.pfad, '--vorab', ...o.auswahl, ...lokal(o)] },
      ])
      break
    case 'auftraege':
      je((t) => [{ skript: 'entwurf:auftrag', args: [t.pfad, ...o.auswahl, ...lokal(o)] }])
      if (o.sammel && themen.length > 1) b.push({ skript: 'entwurf:sammelauftrag', args: themen.map((t) => t.pfad) })
      break
    case 'erfasst':
      je((t) => [
        { skript: 'entwurf:zusammenfuehren', args: [t.pfad] },
        { skript: 'entwurf:treffer', args: [t.pfad, ...lokal(o)] },
      ])
      break
    case 'blind':
      je((t) => [
        { skript: 'entwurf:blind', args: [t.pfad] },
        { skript: 'entwurf:bewertung-auftrag', args: [t.pfad] },
      ])
      break
    case 'bewertet': {
      const bewertung = (t: Thema) => `${ordner(t)}/bewertung.json`
      je((t) => [
        ...(o.bewertungFertig ? [] : [{ skript: 'entwurf:json', args: [`${ordner(t)}/protokoll/bewertung-antwort.txt`, bewertung(t)] }]),
        { skript: 'entwurf:bewertung-pruefen', args: [t.pfad, bewertung(t)] },
      ])
      je((t) => [{ skript: 'entwurf:eintragen', args: [t.pfad, bewertung(t)] }])
      b.push({ skript: 'daten:pruefen', args: [] })
      je((t) => [{ skript: 'zitate:pruefen', args: ['--thema', String(t.thema_id), ...lokal(o)] }])
      b.push({ skript: 'seed', args: [] })
      je((t) => [
        { skript: 'entwurf:bericht', args: [t.pfad, bewertung(t)] },
        { skript: 'entwurf:archivieren', args: [t.pfad, ...(t.nachtrag ? ['--name', nachtragName(t.nachtrag)] : [])] },
      ])
      b.push({ skript: 'test', args: ['--reporter=dot'] })
      break
    }
  }
  return b
}

/** Liest Schritt, Arbeitsdateien und Optionen aus der Befehlszeile. */
export function leseArgumente(argv: string[]): { schritt: Schritt; pfade: string[]; optionen: Optionen } | { fehler: string } {
  const [schritt, ...rest] = argv
  if (!SCHRITTE.includes(schritt as Schritt)) return { fehler: `Schritt fehlt oder unbekannt: ${schritt ?? '–'} (erwartet: ${SCHRITTE.join(', ')})` }
  const pfade: string[] = []
  const auswahl: string[] = []
  let lokalOrdner: string | undefined
  let bewertungFertig = false
  let sammel = false
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a === '--lokal') lokalOrdner = rest[++i]
    else if (a === '--bewertung-fertig') bewertungFertig = true
    else if (a === '--sammel') sammel = true
    else if (a === '--bund') auswahl.push(a)
    else if (a === '--land' || a === '--partei') {
      auswahl.push(a)
      while (rest[i + 1] && !rest[i + 1].startsWith('--')) auswahl.push(rest[++i])
    } else if (a.startsWith('--')) return { fehler: `Unbekannte Option ${a}` }
    else pfade.push(a)
  }
  if (!pfade.length) return { fehler: 'Keine Arbeitsdatei (.cache/entwurf/<ID>/erfassung.json) angegeben' }
  if (lokalOrdner === undefined && rest.includes('--lokal')) return { fehler: '--lokal ohne Ordner' }
  if (auswahl.length && schritt !== 'vorab' && schritt !== 'auftraege') return { fehler: '--bund, --land und --partei gelten nur für vorab und auftraege' }
  if (sammel && schritt !== 'auftraege') return { fehler: '--sammel gilt nur für auftraege' }
  return { schritt: schritt as Schritt, pfade, optionen: { auswahl, lokal: lokalOrdner, bewertungFertig, sammel } }
}
