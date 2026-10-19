import { type ReactNode, useEffect, useState } from 'react'
import type { Daten } from '../data/quelle'
import {
  fortschritt,
  haltungStand,
  instrumentStand,
  statistik,
  themenStand,
  type Erfassung,
  type Fortschritt,
  type HaltungStand,
  type Statistik,
  type ThemaInstrumente,
  type ThemaStand,
} from '../logic/stand'
import { BETREIBER } from '../rechtliches/betreiber'
import { EVIDENZ_TEXT } from '../logic/forderung'
import { Logo } from './Logo'
import { Zusammenhaenge } from './Zusammenhaenge'

// Übersicht unter #/themen: welche Themen das Spiel kennt, wie weit die Programme
// ausgewertet sind und ein paar Zahlen zum Datenbestand. Neutralität: Parteien
// stehen in fester Reihenfolge (wie in der Datenbank), je Partei gibt es nur den
// Erfassungsstand – keine Maßnahmenzahlen, keine Summen, keine Sortierung nach Parteien.
// Bei Lösungswegen steht nur, in wie vielen Programmen sie vorkommen (ohne Namen), bei
// Haltungen nur, wie viele Positionen erfasst sind – nicht, wie die Parteien zur Frage stehen.

const ERFASSUNG: Record<Erfassung, { label: string; kurz: string }> = {
  massnahmen: { label: 'ausgewertet, mit Maßnahmen', kurz: 'mit Maßnahmen' },
  keine: { label: 'ausgewertet, nichts zum Thema im Programm', kurz: 'nichts zum Thema' },
  offen: { label: 'noch nicht erfasst', kurz: 'noch offen' },
}
const REIHENFOLGE: Erfassung[] = ['massnahmen', 'keine', 'offen']

const zahl = (n: number) => n.toLocaleString('de-DE')
const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

function Kachel({ label, wert, zusatz }: { label: string; wert: string; zusatz?: string }) {
  return (
    <div className="kachel">
      <span className="kachel-label">{label}</span>
      <span className="kachel-wert">{wert}</span>
      {zusatz && <span className="kachel-zusatz">{zusatz}</span>}
    </div>
  )
}

function Legende({ eintraege }: { eintraege: { klasse: string; label: string }[] }) {
  return (
    <ul className="diagramm-legende">
      {eintraege.map((e) => (
        <li key={e.klasse}>
          <span className={`legende-feld ${e.klasse}`} aria-hidden="true" />
          {e.label}
        </li>
      ))}
    </ul>
  )
}

interface Zeile {
  id: number
  name: string
  wert: string
  /** Leer: Zeile ohne Balken, nur Name und Wert (z. B. Stand je Partei). */
  segmente: { klasse: string; anteil: number }[]
  detail: string
  /** Aufklappbare Unterzeilen (z. B. Ursachen eines Themas). */
  kinder?: Zeile[]
}

function Balken({ segmente }: { segmente: Zeile['segmente'] }) {
  return (
    <span className="balken-spur" aria-hidden="true">
      {segmente
        .filter((s) => s.anteil > 0)
        .map((s, i) => (
          <span key={i} className={`balken-teil ${s.klasse}`} style={{ flexBasis: `${s.anteil * 100}%` }} />
        ))}
    </span>
  )
}

/** Lange Listen zeigen zuerst so viele Zeilen; der Rest kommt mit „Alle … zeigen“. */
const ANFANGS = 8

/**
 * Balkendiagramm aus Zeilen: Hover, Fokus oder Tippen zeigt die Details unter dem Diagramm.
 * Zeilen mit `kinder` klappen beim Tippen ihre Unterzeilen auf. Lange Listen sind gekürzt.
 */
function Balkendiagramm({
  titel,
  unterzeile,
  steuerung,
  legende,
  zeilen,
  leer,
  klasse,
  einheit,
}: {
  /** Zusätzliche CSS-Klasse der Abbildung, z. B. `diagramm-prozent` für eine breitere Wertspalte. */
  klasse?: string
  titel: string
  unterzeile: string
  /** Steht unter dem Titel, z. B. ein Umschalter der Ansicht. */
  steuerung?: ReactNode
  legende?: { klasse: string; label: string }[]
  zeilen: Zeile[]
  leer: string
  /** Mehrzahl für den Knopf „Alle … zeigen“, z. B. „Themen“. */
  einheit?: string
}) {
  const [aktiv, setAktiv] = useState<string | null>(null)
  const [offen, setOffen] = useState<ReadonlySet<number>>(new Set())
  const [alle, setAlle] = useState(false)
  const klappbar = zeilen.some((z) => z.kinder?.length)
  // Erst ab ein paar Zeilen mehr kürzen, sonst spart der Knopf nichts.
  const kuerzbar = zeilen.length > ANFANGS + 2
  const sichtbar = kuerzbar && !alle ? zeilen.slice(0, ANFANGS) : zeilen
  const schluessel = (z: Zeile, eltern?: number) => (eltern === undefined ? `${z.id}` : `${eltern}/${z.id}`)
  const detail = [
    ...zeilen.map((z) => [schluessel(z), z.detail]),
    ...zeilen.flatMap((z) => (z.kinder ?? []).map((k) => [schluessel(k, z.id), k.detail])),
  ].find(([s]) => s === aktiv)?.[1]
  const umschalten = (id: number) =>
    setOffen((o) => {
      const n = new Set(o)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const knopf = (z: Zeile, eltern?: number) => {
    const s = schluessel(z, eltern)
    const kinder = eltern === undefined && z.kinder?.length ? z.kinder : null
    return (
      <button
        type="button"
        className={`balken-zeile${aktiv === s ? ' aktiv' : ''}${eltern !== undefined ? ' balken-kind' : ''}${z.segmente.length ? '' : ' ohne-balken'}`}
        aria-label={z.detail}
        aria-expanded={kinder ? offen.has(z.id) : undefined}
        onMouseEnter={() => setAktiv(s)}
        onFocus={() => setAktiv(s)}
        onBlur={() => setAktiv(null)}
        onClick={() => {
          setAktiv(s)
          if (kinder) umschalten(z.id)
        }}
      >
        <span className="balken-name">
          {kinder && (
            <span className={`balken-pfeil${offen.has(z.id) ? ' offen' : ''}`} aria-hidden="true">
              ▸
            </span>
          )}
          {z.name}
        </span>
        {z.segmente.length > 0 && <Balken segmente={z.segmente} />}
        <span className="balken-wert" aria-hidden="true">
          {z.wert}
        </span>
      </button>
    )
  }

  return (
    <figure className={klasse ? `diagramm ${klasse}` : 'diagramm'}>
      <figcaption>
        <strong>{titel}</strong>
        <span>{unterzeile}</span>
      </figcaption>
      {steuerung}
      {legende && <Legende eintraege={legende} />}
      {klappbar && (
        <p className="diagramm-steuerung">
          <button type="button" className="knopf-link" onClick={() => setOffen(new Set(zeilen.map((z) => z.id)))}>
            Alle aufklappen
          </button>
          <button type="button" className="knopf-link" onClick={() => setOffen(new Set())}>
            Alle zuklappen
          </button>
        </p>
      )}
      <ul className="balken" onMouseLeave={() => setAktiv(null)}>
        {sichtbar.map((z) => (
          <li key={z.id}>
            {knopf(z)}
            {z.kinder && offen.has(z.id) && (
              <ul className="balken balken-unter">
                {z.kinder.map((k) => (
                  <li key={k.id}>{knopf(k, z.id)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {kuerzbar && (
        <p className="diagramm-mehr">
          <button type="button" className="knopf-link" aria-expanded={alle} onClick={() => setAlle((a) => !a)}>
            {alle ? 'Weniger zeigen' : `Alle ${zahl(zeilen.length)} ${einheit ?? 'Einträge'} zeigen`}
          </button>
        </p>
      )}
      <p className="diagramm-detail" aria-hidden="true">
        {detail ?? leer}
      </p>
    </figure>
  )
}

function Fortschrittsdiagramm({ daten, s }: { daten: Daten; s: Statistik }) {
  const f = fortschritt(daten)
  const arten: { id: number; name: string; f: Fortschritt; vollstaendig: string; zusatz?: string }[] = [
    {
      id: 1,
      name: 'Themen',
      f: f.themen,
      vollstaendig: 'alle Bundesprogramme ausgewertet',
      zusatz: ` Insgesamt ${zahl(s.erfasst)} von ${zahl(s.paare)} Kombinationen aus Thema und Partei ausgewertet.`,
    },
    { id: 2, name: 'Forderungen', f: f.forderungen, vollstaendig: 'alle Programme ausgewertet' },
    { id: 3, name: 'Haltungen', f: f.haltungen, vollstaendig: 'Positionen aller Parteien erfasst' },
  ]
  const prozent = (n: number, ganz: number) => (ganz ? Math.round((n / ganz) * 100) : 0)
  return (
    <>
      <Balkendiagramm
        klasse="diagramm-prozent"
        titel="Fortschritt der Erfassung"
        unterzeile="Anteil der angelegten Themen, Forderungen (Lösungswege) und Haltungen, die für alle Parteien vollständig erfasst sind"
        legende={[
          { klasse: 'st-massnahmen', label: 'vollständig erfasst' },
          { klasse: 'st-keine', label: 'teilweise erfasst' },
          { klasse: 'st-offen', label: 'noch nicht begonnen' },
        ]}
        leer="Tippe auf eine Zeile für Details."
        zeilen={arten.map(({ id, name, f, vollstaendig, zusatz }) => {
          const offen = f.gesamt - f.vollstaendig - f.begonnen
          const anteil = (n: number) => (f.gesamt ? n / f.gesamt : 0)
          return {
            id,
            name,
            wert: `${prozent(f.vollstaendig, f.gesamt)}\u00a0%`,
            segmente: [
              { klasse: 'st-massnahmen', anteil: anteil(f.vollstaendig) },
              { klasse: 'st-keine', anteil: anteil(f.begonnen) },
              { klasse: 'st-offen', anteil: anteil(offen) },
            ],
            detail: f.gesamt
              ? `${name}: ${zahl(f.vollstaendig)} von ${zahl(f.gesamt)} vollständig (${vollstaendig}), ` +
                `${zahl(f.begonnen)} teilweise, ${zahl(offen)} noch nicht begonnen.${zusatz ?? ''}`
              : `${name}: noch keine angelegt.`,
          }
        })}
      />
      <p className="meta">
        Grundlage: {zahl(s.parteien)} Bundesprogramme
        {s.landesprogramme > 0 && (
          <>
            {' '}
            und {zahl(s.landesprogramme)} Landesprogramme in {zahl(s.laender)} {s.laender === 1 ? 'Land' : 'Ländern'}
          </>
        )}
        {s.stand && <> · Stand {datum(s.stand)}</>}
      </p>
    </>
  )
}

const kurz = (text: string, max = 60) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)

/** Was das Themendiagramm je Thema zeigt. */
type Ansicht = 'auswertung' | 'ursachen' | 'wege'
const ANSICHTEN: { id: Ansicht; label: string }[] = [
  { id: 'auswertung', label: 'Auswertung' },
  { id: 'ursachen', label: 'Ursachen' },
  { id: 'wege', label: 'Lösungswege' },
]

/** Inhalt des Themendiagramms in einer Ansicht. */
interface Sicht {
  unterzeile: string
  legende: { klasse: string; label: string }[]
  leer: string
  zeilen: Zeile[]
}

/** Wie weit die Programme zu jedem Thema ausgewertet sind; aufklappen zeigt den Stand je Partei. */
function auswertungSicht(daten: Daten, themen: ThemaStand[]): Sicht {
  const parteien = daten.parteien.length
  const name = new Map(daten.parteien.map((p) => [p.id, p.kurzname]))
  return {
    unterzeile: `Wie viele der ${parteien} Bundesprogramme zu jedem Thema schon ausgewertet sind; aufklappen zeigt den Stand je Partei (in fester Reihenfolge)`,
    legende: REIHENFOLGE.map((e) => ({ klasse: `st-${e}`, label: ERFASSUNG[e].label })),
    leer: 'Tippe auf ein Thema, um den Stand je Partei aufzuklappen.',
    zeilen: themen.map((t) => {
      const erfasst = t.zaehlung.massnahmen + t.zaehlung.keine
      return {
        id: t.id,
        name: t.name,
        wert: `${erfasst}/${parteien}`,
        segmente: REIHENFOLGE.map((e) => ({ klasse: `st-${e}`, anteil: parteien ? t.zaehlung[e] / parteien : 0 })),
        detail:
          `${t.name}: ${erfasst} von ${parteien} Programmen ausgewertet` +
          (t.zaehlung.keine ? `, davon ${t.zaehlung.keine} ohne Aussage zum Thema` : '') +
          (t.zaehlung.offen ? `; ${t.zaehlung.offen} noch nicht erfasst.` : '.'),
        kinder: t.parteien.map((p) => ({
          id: p.partei_id,
          name: name.get(p.partei_id) ?? '',
          wert: `${ERFASSUNG[p.stand].kurz}${p.ki_entwurf ? ' · KI\u2011Entwurf' : ''}`,
          segmente: [],
          detail: `${name.get(p.partei_id)}: ${ERFASSUNG[p.stand].label}${p.ki_entwurf ? ' (KI-Entwurf)' : ''}.`,
        })),
      }
    }),
  }
}

/** Belegte Ursachen je Thema; aufklappen zeigt die Maßnahmen je Ursache (alle Parteien zusammen). */
function ursachenSicht(themen: ThemaStand[], testphase: boolean): Sicht {
  const maxUrsachen = Math.max(1, ...themen.map((t) => t.ursachen))
  const maxMassnahmen = Math.max(1, ...themen.flatMap((t) => t.ursachenStand.map((u) => u.massnahmen + u.massnahmenEntwurf)))
  const mitEntwurf = testphase && themen.some((t) => t.massnahmenEntwurf > 0)
  return {
    unterzeile:
      'Belegte Ursachen und ob schon Maßnahmen an ihnen ansetzen; aufklappen zeigt die Maßnahmen je Ursache (alle Parteien zusammen)',
    legende: [
      { klasse: 'ur-mit', label: 'Ursache mit Maßnahmen' },
      { klasse: 'ur-ohne', label: 'noch ohne Maßnahme' },
      ...(mitEntwurf ? [{ klasse: 'mn-entwurf', label: 'Maßnahmen als KI-Entwurf' }] : []),
    ],
    leer: 'Tippe auf ein Thema, um seine Ursachen aufzuklappen.',
    zeilen: themen.map((t) => {
      const mit = t.ursachen - t.ursachenOhneMassnahme
      const massnahmen = t.massnahmen + t.massnahmenEntwurf
      return {
        id: t.id,
        name: t.name,
        wert: zahl(t.ursachen),
        segmente: [
          { klasse: 'ur-mit', anteil: mit / maxUrsachen },
          { klasse: 'ur-ohne', anteil: t.ursachenOhneMassnahme / maxUrsachen },
        ],
        detail:
          `${t.name}: ${zahl(t.ursachen)} ${t.ursachen === 1 ? 'Ursache' : 'Ursachen'}` +
          (t.ursachenOhneMassnahme ? `, davon ${zahl(t.ursachenOhneMassnahme)} noch ohne Maßnahme` : ', an allen setzen Maßnahmen an') +
          `; ${zahl(massnahmen)} ${massnahmen === 1 ? 'Maßnahme' : 'Maßnahmen'}` +
          (t.massnahmenEntwurf ? ` (davon ${zahl(t.massnahmenEntwurf)} KI-Entwurf).` : '.'),
        kinder: t.ursachenStand.map((u) => {
          const summe = u.massnahmen + u.massnahmenEntwurf
          return {
            id: u.id,
            name: kurz(u.beschreibung),
            wert: zahl(summe),
            segmente: [
              { klasse: 'mn-geprueft', anteil: u.massnahmen / maxMassnahmen },
              { klasse: 'mn-entwurf', anteil: u.massnahmenEntwurf / maxMassnahmen },
            ],
            detail:
              `${u.beschreibung} (${u.ebene === 'land' ? 'Länderzuständigkeit' : 'Bund'}): ` +
              (summe
                ? `${zahl(summe)} ${summe === 1 ? 'Maßnahme setzt' : 'Maßnahmen setzen'} hier an` +
                  (u.massnahmenEntwurf ? ` (davon ${zahl(u.massnahmenEntwurf)} KI-Entwurf).` : '.')
                : 'noch keine Maßnahme erfasst.'),
          }
        }),
      }
    }),
  }
}

/** Lösungswege je Thema (Grundlage der Forderungskarte); aufklappen zeigt, in wie vielen Programmen jeder steht. */
function wegeSicht(themen: ThemaInstrumente[], parteien: number): Sicht {
  const max = Math.max(1, ...themen.map((t) => t.instrumente.length))
  return {
    unterzeile: 'Grundlage der Forderungskarte; aufklappen zeigt je Lösungsweg, in den Programmen wie vieler Parteien er steht',
    legende: [
      { klasse: 'fd-mehrere', label: 'in Programmen mehrerer Parteien' },
      { klasse: 'fd-eine', label: 'im Programm einer Partei' },
    ],
    leer: 'Tippe auf ein Thema, um seine Lösungswege aufzuklappen.',
    zeilen: themen.map((t) => {
      const n = t.instrumente.length
      return {
        id: t.id,
        name: t.name,
        wert: zahl(n),
        segmente: [
          { klasse: 'fd-mehrere', anteil: t.mehrere / max },
          { klasse: 'fd-eine', anteil: (n - t.mehrere) / max },
        ],
        detail: n
          ? `${t.name}: ${zahl(n)} ${n === 1 ? 'Lösungsweg' : 'Lösungswege'}, davon ${zahl(t.mehrere)} in Programmen mehrerer Parteien.`
          : `${t.name}: noch keine Lösungswege erfasst.`,
        kinder: t.instrumente.map((i) => ({
          id: i.id,
          name: kurz(i.name),
          wert: `${i.parteien}/${parteien}`,
          segmente: [{ klasse: i.parteien > 1 ? 'fd-mehrere' : 'fd-eine', anteil: parteien ? i.parteien / parteien : 0 }],
          detail:
            `${i.name} (${i.ebene === 'land' ? 'Landesprogramme' : 'Bundesprogramme'}${i.ki_entwurf ? ', KI-Entwurf' : ''}): ` +
            (i.massnahmen
              ? `${zahl(i.massnahmen)} ${i.massnahmen === 1 ? 'Maßnahme' : 'Maßnahmen'} aus den Programmen von ${zahl(i.parteien)} ${i.parteien === 1 ? 'Partei' : 'Parteien'}`
              : 'noch keine Maßnahme zugeordnet') +
            (i.evidenz ? `. ${EVIDENZ_TEXT[i.evidenz]}.` : '.'),
        })),
      }
    }),
  }
}

/**
 * Ein Diagramm für alle Zahlen je Thema: Der Umschalter wählt Auswertung, Ursachen oder
 * Lösungswege; aufgeklappte Themen und die Länge der Liste bleiben beim Umschalten erhalten.
 */
function Themendiagramm({ daten, themen, testphase }: { daten: Daten; themen: ThemaStand[]; testphase: boolean }) {
  const [ansicht, setAnsicht] = useState<Ansicht>('auswertung')
  const sicht =
    ansicht === 'auswertung'
      ? auswertungSicht(daten, themen)
      : ansicht === 'ursachen'
        ? ursachenSicht(themen, testphase)
        : wegeSicht(instrumentStand(daten), daten.parteien.length)
  return (
    <Balkendiagramm
      titel="Zahlen je Thema"
      einheit="Themen"
      steuerung={
        <div className="strang-wahl" role="radiogroup" aria-label="Was das Diagramm je Thema zeigt">
          {ANSICHTEN.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={ansicht === a.id}
              className={ansicht === a.id ? 'aktiv' : undefined}
              onClick={() => setAnsicht(a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>
      }
      {...sicht}
    />
  )
}

function Haltungsdiagramm({ haltungen }: { haltungen: HaltungStand[] }) {
  const mitEntwurf = haltungen.some((h) => h.positionenEntwurf > 0)
  return (
    <Balkendiagramm
      titel="Positionen je Haltung"
      einheit="Haltungen"
      unterzeile="Eine Haltungskarte gibt es erst, wenn die Positionen aller Parteien erfasst sind („Alle oder keine“); ✓ = im Spiel"
      legende={[
        { klasse: 'st-massnahmen', label: 'Position erfasst' },
        ...(mitEntwurf ? [{ klasse: 'mn-entwurf', label: 'als KI-Entwurf erfasst' }] : []),
        { klasse: 'st-offen', label: 'noch nicht erfasst' },
      ]}
      leer="Tippe auf eine Haltung für Details."
      zeilen={haltungen.map((h) => {
        const erfasst = h.positionen + h.positionenEntwurf
        const anteil = (n: number) => (h.parteien ? n / h.parteien : 0)
        return {
          id: h.id,
          name: `${h.vollstaendig ? '✓ ' : ''}${kurz(h.frage)}`,
          wert: `${erfasst}/${h.parteien}`,
          segmente: [
            { klasse: 'st-massnahmen', anteil: anteil(h.positionen) },
            { klasse: 'mn-entwurf', anteil: anteil(h.positionenEntwurf) },
            { klasse: 'st-offen', anteil: anteil(h.parteien - erfasst) },
          ],
          detail:
            `${h.frage} – ${erfasst} von ${h.parteien} Positionen erfasst` +
            (h.positionenEntwurf ? ` (davon ${h.positionenEntwurf} KI-Entwurf)` : '') +
            `; ${h.vollstaendig ? 'im Spiel' : 'noch nicht im Spiel'}. ` +
            `Zielkonflikte: ${h.zielkonflikte.ja} auf der Ja-, ${h.zielkonflikte.nein} auf der Nein-Seite; ` +
            `${h.verwandteThemen} verwandte ${h.verwandteThemen === 1 ? 'Thema' : 'Themen'}.`,
        }
      })}
    />
  )
}

/** Ein Strang der Datengrundlage als Kette von Kacheln, die im Spiel zu einem Ergebnis führt. */
function Strang({
  name,
  ergebnis,
  glieder,
  hinweis,
}: {
  name: string
  ergebnis: string
  glieder: { label: string; wert: string; zusatz?: string }[]
  hinweis: string
}) {
  return (
    <section className="strang" aria-label={`${name}: ${glieder.map((g) => `${g.wert} ${g.label}`).join(', ')}`}>
      <header className="strang-kopf">
        <strong>{name}</strong>
        <span>{hinweis}</span>
      </header>
      <ol className="strang-kette">
        {glieder.map((g) => (
          <li key={g.label}>
            <Kachel {...g} />
          </li>
        ))}
        <li className="strang-ergebnis">
          <span>{ergebnis}</span>
        </li>
      </ol>
    </section>
  )
}

function Aufbau({ s, testphase }: { s: Statistik; testphase: boolean }) {
  const entwurf = (n: number) => (testphase && n ? `, davon ${zahl(n)} KI\u2011Entwurf` : '')
  const massnahmen = s.massnahmen + s.massnahmenEntwurf
  const mitWeg = s.massnahmenMitInstrument + s.massnahmenMitInstrumentEntwurf
  const positionen = s.positionen + s.positionenEntwurf
  return (
    <div className="aufbau">
      <Strang
        name="Probleme"
        hinweis="Ein Alltagsproblem wird Thema und Ursachen zugeordnet; die Maßnahmen an diesen Ursachen bringen Punkte."
        ergebnis="Wertung mit Punkten"
        glieder={[
          { label: 'Themen', wert: zahl(s.themen) },
          { label: 'Ursachen', wert: zahl(s.ursachen), zusatz: 'mit Quelle belegt' },
          { label: 'Maßnahmen', wert: zahl(massnahmen), zusatz: `aus den Programmen${entwurf(s.massnahmenEntwurf)}` },
        ]}
      />
      <Strang
        name="Forderungen"
        hinweis="Eine Forderung wird einem Lösungsweg zugeordnet; die Karte zeigt, in welchen Programmen er steht."
        ergebnis="Forderungskarte, ohne Punkte"
        glieder={[
          { label: 'Themen', wert: zahl(s.themen), zusatz: 'dieselben wie oben' },
          {
            label: 'Lösungswege',
            wert: zahl(s.instrumente + s.instrumenteEntwurf),
            zusatz: `gleiche Wege in mehreren Programmen${entwurf(s.instrumenteEntwurf)}`,
          },
          {
            label: 'Maßnahmen mit Lösungsweg',
            wert: zahl(mitWeg),
            zusatz: `von ${zahl(massnahmen)} Maßnahmen${entwurf(s.massnahmenMitInstrumentEntwurf)}`,
          },
        ]}
      />
      <Strang
        name="Haltungen"
        hinweis="Eine Wertfrage, über die man verschieden denken kann – mit der Position jeder Partei und den Zielkonflikten."
        ergebnis="Haltungskarte, ohne Punkte"
        glieder={[
          {
            label: 'Haltungen',
            wert: zahl(s.haltungen),
            zusatz: `davon ${zahl(s.haltungenVollstaendig)} vollständig und im Spiel`,
          },
          {
            label: 'Positionen',
            wert: zahl(positionen),
            zusatz: `von ${zahl(s.positionenMoeglich)} (Haltungen × Parteien)${entwurf(s.positionenEntwurf)}`,
          },
          { label: 'Zielkonflikte', wert: zahl(s.zielkonflikte), zusatz: 'je Seite der Frage, mit Quelle' },
        ]}
      />
    </div>
  )
}

export function Themenstand({
  daten,
  ladeFehler,
  onZurueck,
}: {
  daten: Daten | null
  ladeFehler: string | null
  onZurueck: () => void
}) {
  useEffect(() => {
    scrollTo(0, 0)
  }, [])

  return (
    <main className="seite recht themenstand">
      <header className="recht-kopf">
        <button className="knopf knopf-leise" onClick={onZurueck}>
          ← Zurück
        </button>
        <a href="#/" className="recht-marke" aria-label="Politik-Duell – Startseite">
          <Logo groesse={32} />
        </a>
      </header>
      <h1>Was das Spiel schon kennt</h1>
      <p>
        Wir werten die Wahlprogramme Thema für Thema aus. Hier siehst du, zu welchen Alltagsproblemen das Spiel
        schon etwas sagen kann. Gewertet wird eine Runde nur, wenn das Thema für beide gewählten Parteien ausgewertet
        ist – fehlende Daten kosten keine Partei einen Punkt.
      </p>
      <p className="meta">
        Die Übersicht zeigt nur, <strong>wie weit die Auswertung ist</strong> – nicht, welche Partei die besseren
        Lösungen hat. Parteien stehen in fester Reihenfolge.
      </p>
      {ladeFehler ? (
        <p className="recht-warnung" role="alert">
          Die Spieldaten konnten nicht geladen werden ({ladeFehler}).
        </p>
      ) : !daten ? (
        <p className="meta">Lade Spieldaten …</p>
      ) : (
        <Inhalt daten={daten} />
      )}
    </main>
  )
}

/** Der Graph ist groß und rechenintensiv: Er entsteht erst beim Aufklappen. */
function ZusammenhaengeAufklappbar({ daten }: { daten: Daten }) {
  const [offen, setOffen] = useState(false)
  return (
    <details className="stand-aufklapper" onToggle={(e) => setOffen(e.currentTarget.open)}>
      <summary>Netz aus Themen, Ursachen, Lösungswegen und Haltungen anzeigen</summary>
      {offen && <Zusammenhaenge daten={daten} />}
    </details>
  )
}

function Inhalt({ daten }: { daten: Daten }) {
  const s = statistik(daten)
  const themen = themenStand(daten)
  const haltungen = haltungStand(daten)
  const testphase = !!daten.testphase
  return (
    <>
      {testphase && (
        <p className="recht-warnung">
          Geschlossene Testphase: Die Zahlen enthalten vorläufige KI-Entwürfe, die noch nicht von Menschen geprüft
          sind. In der öffentlichen App zählen nur geprüfte Einträge.
        </p>
      )}
      <h2>So ist die Datengrundlage aufgebaut</h2>
      <p>
        Das Spiel unterscheidet, was jemand nennt: ein <strong>Problem</strong> aus dem Alltag, eine{' '}
        <strong>Forderung</strong> nach einer bestimmten Lösung oder eine <strong>Haltung</strong>. Für jedes gibt es
        einen eigenen Teil der Daten. Nur Probleme werden mit Punkten gewertet.
      </p>
      <Aufbau s={s} testphase={testphase} />
      <h2>Stand der Erfassung</h2>
      <Fortschrittsdiagramm daten={daten} s={s} />

      <h2>Themen</h2>
      {themen.length ? <Themendiagramm daten={daten} themen={themen} testphase={testphase} /> : <p>Noch keine Themen erfasst.</p>}
      <h2>Haltungen</h2>
      {haltungen.length ? <Haltungsdiagramm haltungen={haltungen} /> : <p>Noch keine Haltungen erfasst.</p>}
      {themen.length > 0 && (
        <>
          <h2>Zusammenhänge</h2>
          <ZusammenhaengeAufklappbar daten={daten} />
        </>
      )}

      <h2>Dein Thema fehlt?</h2>
      <p>
        Du kannst es trotzdem nennen: Das Spiel gibt dann eine vorläufige Einschätzung ohne Wertung, und wir merken
        uns das Thema für die Auswertung. Wie wir bewerten, steht unter <a href="#/methode">So bewerten wir</a>; alle
        Daten mit Belegen liegen im <a href={BETREIBER.quellcode}>öffentlichen Quellcode</a>.
      </p>
    </>
  )
}
