import { useEffect, useState, type ReactNode } from 'react'
import { useDaten, useLandName } from '../data/kontext'
import { ROLLEN } from '../data/rollen'
import { MAX_JE_URSACHE, punkteText, type ParteiErgebnis, type Treffer } from '../logic/bewertung'
import { EVIDENZ_TEXT } from '../logic/forderung'
import { fuerEuch } from '../logic/fuerEuch'
import { BETREIBER } from '../rechtliches/betreiber'
import type { Massnahme } from '../data/types'
import { Folgen } from './Folgen'
import { ohneTreffer } from '../logic/ohneTreffer'
import type { RundenErgebnis, Spieler } from '../spiel'
import { KI_ENTWURF, KI_ENTWURF_ERKLAERUNG, KI_HINWEIS, MassnahmeBelege, NICHT_BLIND, NICHT_BLIND_ERKLAERUNG } from './belege'
import { ForderungsKarte } from './ForderungsKarte'
import { Kreuzfeld } from './Kreuz'
import { parteiStil } from './stil'

// Gemeinsame Bausteine liegen in belege.tsx (auch die Forderungskarte nutzt sie); hier weiter exportiert.
export { KI_ENTWURF, KI_HINWEIS, MassnahmeBelege, NICHT_BLIND }

export function Belege({ ergebnis }: { ergebnis: ParteiErgebnis }) {
  // Mehrere Maßnahmen von derselben Programmseite: ein Link genügt.
  const einmal = ergebnis.treffer.filter(
    (t, i, alle) =>
      alle.findIndex(
        (x) =>
          x.massnahme.beleg_programm_url === t.massnahme.beleg_programm_url &&
          (x.massnahme.beleg_studie_url ?? null) === (t.massnahme.beleg_studie_url ?? null),
      ) === i,
  )
  return (
    <ul className="belege-liste">
      {einmal.map((t) => (
        <li key={t.massnahme.id}>
          <MassnahmeBelege massnahme={t.massnahme} />
        </li>
      ))}
    </ul>
  )
}

/** Links zu den Programmen der Partei (Bund, ggf. Länder) – zum schnellen Selbstprüfen, wo nichts gefunden wurde. */
function ProgrammLinks({ ergebnis }: { ergebnis: ParteiErgebnis }) {
  const landName = useLandName()
  return (
    <span className="belege">
      {(ergebnis.programme.length ? ergebnis.programme : [{ land: null, url: ergebnis.partei.programm_url }]).map((p, i) => (
        <span key={p.land ?? 'bund'}>
          {i > 0 && ' · '}
          <a href={p.url} target="_blank" rel="noopener noreferrer">
            {p.land ? `Landeswahlprogramm ${landName(p.land)}` : 'Wahlprogramm'}
          </a>
        </span>
      ))}
    </span>
  )
}

/** E-Mail mit Maßnahme im Betreff – „Fehler melden“ direkt an der Wertung, ohne Angaben zur Person. */
const fehlerLink = (m: Massnahme) =>
  `mailto:${BETREIBER.email}?subject=${encodeURIComponent(`Politik-Duell – Fehler bei Maßnahme ${m.id}`)}&body=${encodeURIComponent(
    `Maßnahme ${m.id}: ${m.beschreibung}\n\nWas stimmt nicht? (Bitte mit Link auf die Stelle im Programm oder die Quelle.)\n`,
  )}`

const wertungFuer = (e: ParteiErgebnis, ursacheId: number) => e.ursachen.find((u) => u.ursache_id === ursacheId)

/** Gewicht eines Lösungswegs in Worten: voll, zur Hälfte, zu einem Viertel … */
const BRUCH: Record<number, string> = { 2: '½', 4: '¼', 8: '⅛' }
const gewichtText = (g: number) => {
  const n = Math.round(1 / g)
  return n === 1 ? 'zählt voll' : n === 2 ? 'zählt zur Hälfte' : n === 4 ? 'zählt zu einem Viertel' : `zählt zu 1/${n}`
}
const gewichtFaktor = (g: number) => BRUCH[Math.round(1 / g)] ?? `1/${Math.round(1 / g)}`

/** Kopf des Duells: beide Parteien mit Gesamtpunkten, Kreuz bei der Rundensiegerin. */
function DuellKopf({
  ergebnis,
  spielerName,
  gewinnt,
  seite,
}: {
  ergebnis: ParteiErgebnis
  spielerName: string
  gewinnt: boolean
  seite: 'a' | 'b'
}) {
  const landName = useLandName()
  const leer = ohneTreffer(ergebnis, landName)
  return (
    <div
      className={`duell-partei duell-${seite}${gewinnt ? ' gewinnt' : ''}`}
      style={{
        ...parteiStil(ergebnis.partei.farbe),
        // Das Kreuz wird gezogen, nachdem die Balken stehen.
        ['--kreuz-verzoegerung' as string]: '1.1s',
      }}
    >
      <span className="duell-spieler">{spielerName}</span>
      <h3 title={ergebnis.partei.name}>{ergebnis.partei.kurzname}</h3>
      <span className="duell-summe">
        {ergebnis.abdeckung ? (
          <>
            {punkteText(ergebnis.punkte)}
            <span className="sr-only"> Punkte</span>
          </>
        ) : (
          <span aria-label="keine Wertung">–</span>
        )}
      </span>
      <Kreuzfeld />
      {(leer?.badge || ergebnis.ki_entwurf) && (
        <span className="duell-marke">
          {leer?.badge && <span className="badge-ungeprueft">{leer.badge}</span>}
          {ergebnis.ki_entwurf && <span className="badge-ungeprueft">{ergebnis.nicht_blind ? NICHT_BLIND : KI_ENTWURF}</span>}
        </span>
      )}
    </div>
  )
}

/** Eine Hälfte des Balkens: wächst von der Mittellinie nach außen. */
function Halbbalken({ ergebnis, punkte, vorne }: { ergebnis: ParteiErgebnis; punkte: number | null; vorne: boolean }) {
  return (
    <span className={`duell-halb${vorne ? ' vorne' : ''}${punkte === null ? ' offen' : ''}`} style={parteiStil(ergebnis.partei.farbe)}>
      <span className="duell-fuellung" style={{ ['--anteil' as string]: (punkte ?? 0) / MAX_JE_URSACHE }} />
      <span className="duell-wert">{punkte === null ? '–' : punkteText(punkte)}</span>
    </span>
  )
}

/**
 * Hinweis, wenn eine Maßnahme an mehreren Ursachen der Runde ansetzt: Sie zählt dann bei jeder davon
 * (docs/methode.md → „Wer über die Zuordnung entscheidet“) – für alle Parteien gleich.
 */
const mehrfachText = (n: number) =>
  `Wirkt auf ${n} der genannten Ursachen und zählt deshalb bei jeder davon.`

/**
 * Ergebnis mit kleinem ⓘ daneben; die Rechnung dahinter erscheint erst auf Tippen,
 * damit die Auflösung nicht mit Formeln überfrachtet wirkt.
 */
function MitRechnung({ ergebnis, rechnung }: { ergebnis: ReactNode; rechnung: ReactNode }) {
  const [offen, setOffen] = useState(false)
  return (
    <>
      <p className="duell-ergebnis">
        {ergebnis}
        <button
          type="button"
          className="info-knopf"
          aria-expanded={offen}
          aria-label={offen ? 'Rechnung ausblenden' : 'Rechnung zeigen'}
          title="So wird gerechnet"
          onClick={() => setOffen((o) => !o)}
        >
          i
        </button>
      </p>
      {offen && <p className="duell-rechnung">{rechnung}</p>}
    </>
  )
}

/** Eine gezählte Maßnahme mit Punkten, Belegen und aufklappbarer Einordnung (Begründung, Rolle, Forschungsstand). */
function MassnahmeInhalt({ t, gewicht, mehrere }: { t: Treffer; gewicht: number; mehrere: boolean }) {
  const landName = useLandName()
  return (
    <div className={mehrere ? 'duell-weg' : undefined}>
      <p className="massnahme-titel">{t.massnahme.beschreibung}</p>
      <MitRechnung
        ergebnis={
          <>
            <strong>{punkteText(t.punkteJeUrsache)}</strong> {t.punkteJeUrsache === 1 ? 'Punkt' : 'Punkte'}
            {mehrere && ` · ${gewichtText(gewicht)}`}
          </>
        }
        rechnung={
          <>
            wirkt {t.wirksamkeit}/3 × umsetzbar {t.massnahme.umsetzbarkeit}/3 = <strong>{t.punkteJeUrsache}</strong>
          </>
        }
      />
      {t.massnahme.land && <p className="massnahme-rolle">Aus dem Landeswahlprogramm {landName(t.massnahme.land)}</p>}
      <MassnahmeBelege massnahme={t.massnahme} />{' '}
      <a className="fehler-link" href={fehlerLink(t.massnahme)}>
        Fehler melden
      </a>
      <details className="massnahme-einordnung">
        <summary>Einordnung</summary>
        <p className="massnahme-begruendung">{t.massnahme.begruendung}</p>
        {t.rollenBegruendung && (
          <p className="massnahme-rolle">
            Für deine Rolle {t.rollenBonus > 0 ? 'wirksamer' : 'weniger wirksam'} (Grundwert {t.massnahme.wirksamkeit}/3):{' '}
            {t.rollenBegruendung}
          </p>
        )}
        {t.ursachen_ids.length > 1 && (
          <p className="massnahme-rolle duell-mehrfach">{mehrfachText(t.ursachen_ids.length)}</p>
        )}
        {(t.massnahme.evidenz === 'gemischt' || t.massnahme.evidenz === 'offen') && <p className="massnahme-rolle">{EVIDENZ_TEXT[t.massnahme.evidenz]}</p>}
        <Folgen hinweise={t.massnahme.nebenwirkungen} />
      </details>
    </div>
  )
}

/**
 * Maßnahmen einer Partei zu einer Ursache, aufgeklappt. Bei mehreren Lösungswegen zuerst
 * die Rechnung (bester voll, weitere mit abnehmendem Gewicht, gedeckelt), dann jeder Weg.
 */
function MassnahmeDetail({ ergebnis, ursacheId }: { ergebnis: ParteiErgebnis; ursacheId: number }) {
  const landName = useLandName()
  const w = wertungFuer(ergebnis, ursacheId)
  const leer = ohneTreffer(ergebnis, landName)
  const wege = (w?.beitraege ?? [])
    .map((b) => ({ b, t: ergebnis.treffer.find((t) => t.massnahme.id === b.massnahme_id) }))
    .filter((x): x is { b: (typeof x)['b']; t: Treffer } => !!x.t)
  const mehrere = wege.length > 1
  return (
    <div className="duell-massnahme" style={parteiStil(ergebnis.partei.farbe)}>
      <span className="duell-massnahme-partei">{ergebnis.partei.kurzname}</span>
      {!w || !wege.length ? (
        <>
          <p className="duell-keine">
            {!ergebnis.abdeckung ? leer?.kurz : leer ? `${leer.kurz}.` : 'Keine Maßnahme zu dieser Ursache.'}
          </p>
          <ProgrammLinks ergebnis={ergebnis} />
        </>
      ) : (
        <>
          {mehrere && (
            <MitRechnung
              ergebnis={
                <>
                  <strong>{punkteText(w.punkte)}</strong> Punkte aus {wege.length} Lösungswegen
                </>
              }
              rechnung={
                <>
                  Bester Weg voll, jeder weitere halb so stark:{' '}
                  {wege.map(({ b }, i) => (i === 0 ? `${b.punkte}` : ` + ${b.punkte} × ${gewichtFaktor(b.gewicht)}`)).join('')} ={' '}
                  <strong>{punkteText(w.punkte)}</strong>
                  {w.gedeckelt && ` (gedeckelt bei ${MAX_JE_URSACHE})`}
                </>
              }
            />
          )}
          {wege.map(({ b, t }) => (
            <MassnahmeInhalt key={b.massnahme_id} t={t} gewicht={b.gewicht} mehrere={mehrere} />
          ))}
        </>
      )}
    </div>
  )
}

/**
 * Gegenüberstellung je Ursache: Balken von der Mitte nach links (A) und rechts (B),
 * Länge = Punkte zu dieser Ursache (bester Lösungsweg voll, weitere abnehmend, höchstens 9). Tippen klappt die Maßnahmen auf.
 */
function Duell({ runde, spieler }: { runde: RundenErgebnis; spieler: [Spieler, Spieler] }) {
  const { ursachen } = useDaten()
  const gruppe = runde.symptom !== undefined ? runde.thema?.symptome?.find((g) => g.nr === runde.symptom) : undefined
  const landName = useLandName()
  const [a, b] = runde.ergebnisse!
  // Ältere Runden ohne gespeicherte Ursachen: aus den Treffern ableiten.
  const ursachenIds =
    runde.ursachen_ids ?? [...new Set([...a.treffer, ...b.treffer].flatMap((t) => t.ursachen_ids))]
  const ursache = (id: number) => ursachen.find((u) => u.id === id)
  const punkteVon = (e: ParteiErgebnis, id: number) => (e.abdeckung ? (wertungFuer(e, id)?.punkte ?? 0) : null)
  const leere = runde.ergebnisse!.map((e) => ({ e, leer: ohneTreffer(e, landName) })).filter((x) => x.leer)
  // Jede Seite mit ihrer Rolle; das Bundesland nur, wenn es zählt: bei Ursachen in Länderzuständigkeit (docs/methode.md).
  const landZaehlt = ursachenIds.some((id) => ursache(id)?.ebene === 'land')
  const seitenText = (s: Spieler) =>
    [s.name, ROLLEN.find((r) => r.id === s.rolle)?.label, landZaehlt && s.land ? landName(s.land) : null].filter(Boolean).join(' · ')

  return (
    <section className="duell enthuellen" aria-label="Gegenüberstellung je Ursache">
      <div className="duell-kopf">
        {runde.ergebnisse!.map((e, i) => (
          <DuellKopf
            key={e.partei.id}
            ergebnis={e}
            spielerName={seitenText(spieler[i])}
            gewinnt={runde.punkte[i] === 1}
            seite={i === 0 ? 'a' : 'b'}
          />
        ))}
      </div>
      {ursachenIds.length > 0 && (
        <ul className="duell-zeilen">
          {ursachenIds.map((id, i) => {
            const pa = punkteVon(a, id)
            const pb = punkteVon(b, id)
            return (
              <li key={id} style={{ ['--zeile' as string]: i }}>
                <details className="duell-zeile">
                  <summary>
                    <span className="duell-ursache">
                      <span>
                        {/* Überschrift ist, was die Person bestätigt hat (Alltagssatz); der Befund mit Quelle steht im
                            Detail. Ältere Runden: woran die KI die Ursache erkannte. */}
                        {ursache(id)?.alltag ?? ursache(id)?.beschreibung ?? 'Ursache'}
                        {runde.ursachen_belege?.[id] ? (
                          <small className="duell-beleg">Deine Worte: „{runde.ursachen_belege[id]}“</small>
                        ) : gruppe?.ursachen_ids.includes(id) ? (
                          <small className="duell-beleg">Trägt bei zu: „{gruppe.alltag}“</small>
                        ) : (
                          ursache(id)?.alltag && <small className="duell-beleg">Von dir bestätigt</small>
                        )}
                      </span>
                    </span>
                    <span className="duell-balken" aria-hidden="true">
                      <Halbbalken ergebnis={a} punkte={pa} vorne={(pa ?? 0) > 0 && (pa ?? 0) >= (pb ?? 0)} />
                      <Halbbalken ergebnis={b} punkte={pb} vorne={(pb ?? 0) > 0 && (pb ?? 0) >= (pa ?? 0)} />
                    </span>
                    <span className="sr-only">
                      {a.partei.kurzname}: {pa === null ? 'keine Wertung' : punkteText(pa)}, {b.partei.kurzname}:{' '}
                      {pb === null ? 'keine Wertung' : punkteText(pb)} von{' '}
                      {MAX_JE_URSACHE} Punkten
                    </span>
                  </summary>
                  <div className="duell-details">
                    {ursache(id)?.alltag && (
                      <p className="duell-befund">
                        {ursache(id)!.beschreibung}{' '}
                        <a href={ursache(id)!.quelle_url} target="_blank" rel="noopener noreferrer">
                          Quelle
                        </a>
                      </p>
                    )}
                    <MassnahmeDetail ergebnis={a} ursacheId={id} />
                    <MassnahmeDetail ergebnis={b} ursacheId={id} />
                  </div>
                </details>
              </li>
            )
          })}
        </ul>
      )}
      <p className="duell-legende">
        Balken: Punkte je Ursache – bester Lösungsweg voll, jeder weitere halb so stark, höchstens {MAX_JE_URSACHE}. Die
        Rundenpunkte sind die Summe über alle Ursachen; eine Maßnahme, die auf mehrere davon wirkt, zählt bei jeder. Tippen
        zeigt Maßnahmen und Belege.
      </p>
      {/* Warum eine Partei hier nichts hat – sichtbar, nicht aufklappbar: 0 Punkte ohne Grund wirken wie Schiebung. */}
      {leere.map(({ e, leer }) => (
        <div key={e.partei.id} className="duell-fehlt" style={parteiStil(e.partei.farbe)}>
          <p className="duell-fehlt-kopf">
            {e.partei.kurzname}: {leer!.kurz}
          </p>
          <p>{leer!.lang}</p>
          {e.abdeckung?.begruendung && <p className="keine-begruendung">Durchsucht: {e.abdeckung.begruendung}</p>}
          <ProgrammLinks ergebnis={e} />
        </div>
      ))}
    </section>
  )
}

/**
 * „Was heißt das für euch?“: wie die Lösungswege beider Parteien für die Rollen beider Seiten wirken und wen sie
 * belegt be- oder entlasten. Für alle Parteien gleich, ohne Punkte (docs/plan-duell-regeln.md, Abschnitt 4).
 */
function FuerEuch({ ergebnisse, spieler }: { ergebnisse: ParteiErgebnis[]; spieler: [Spieler, Spieler] }) {
  const f = fuerEuch(ergebnisse, spieler.map((s) => s.rolle))
  if (!f.rollen.length && !f.verteilung.length) return null
  const rollenName = (id: string) => ROLLEN.find((r) => r.id === id)?.label ?? id
  return (
    <section className="fuer-euch enthuellen" style={{ animationDelay: '1450ms' }}>
      <h3>Was heißt das für euch?</h3>
      {f.rollen.map(({ seite, rolle, folgen }) => (
        <div key={seite} className="fuer-euch-seite">
          <p className="fuer-euch-wer">
            {spieler[seite].name} · {rollenName(rolle)}
          </p>
          {folgen.length ? (
            <ul>
              {folgen.map((x) => (
                <li key={`${x.partei.id}-${x.massnahme.id}`} style={parteiStil(x.partei.farbe)}>
                  <strong>{x.partei.kurzname}</strong>: {x.massnahme.beschreibung} –{' '}
                  {x.staerker ? 'wirkt für deine Rolle stärker' : 'wirkt für deine Rolle schwächer'}: {x.begruendung}
                </li>
              ))}
            </ul>
          ) : (
            <p className="fuer-euch-leer">Für deine Rolle ist bei diesen Lösungswegen keine Abweichung erfasst.</p>
          )}
        </div>
      ))}
      {f.verteilung.length > 0 && (
        <div className="fuer-euch-seite">
          <p className="fuer-euch-wer">Wen es trifft</p>
          <ul>
            {f.verteilung.map(({ partei, hinweis }) => (
              <li key={`${partei.id}-${hinweis.text}`} style={parteiStil(partei.farbe)}>
                <strong>{partei.kurzname}</strong>: {hinweis.text}{' '}
                <a href={hinweis.quelle_url} target="_blank" rel="noopener noreferrer">
                  Quelle
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="fuer-euch-leer">Gilt für beide Parteien gleich und zählt nicht zu den Punkten.</p>
    </section>
  )
}

export function Aufloesung({
  runde,
  spieler,
  letzte,
  onWeiter,
}: {
  runde: RundenErgebnis
  spieler: [Spieler, Spieler]
  letzte: boolean
  onWeiter: () => void
}) {
  const [enthuellt, setEnthuellt] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setEnthuellt(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const landName = useLandName()
  // Der Vergleich aller Parteien nutzt nur, was beide Seiten gleich gewählt haben (vergleichsSeite).
  const abweichend = [
    ...(spieler[0].rolle !== spieler[1].rolle ? [['Rollen', 'ohne Rolle']] : []),
    ...(spieler[0].land !== spieler[1].land ? [['Bundesländer', 'nur mit den Bundeswahlprogrammen']] : []),
  ]
  const ohneWertung = runde.ergebnisse?.filter((e) => !e.abdeckung) ?? []
  const keinLandesprogramm = ohneWertung.filter((e) => e.fehlt?.grund === 'kein_landesprogramm')

  return (
    <main className="seite aufloesung">
      <h2 className="sr-only">Das Problem</h2>
      {/* Die eigene Eingabe im Wortlaut über der Kurzfassung – nicht, wenn beide gleich lauten. */}
      {runde.eingaben?.length && !(runde.eingaben.length === 1 && runde.eingaben[0].trim() === runde.zusammenfassung.trim()) ? (
        <div className="deine-eingabe">
          <span className="deine-eingabe-label">{runde.eingaben.length > 1 ? 'Deine Eingaben' : 'Deine Eingabe'}</span>
          {runde.eingaben.map((t, i) => (
            <p key={i} className="blase blase-spieler">
              {t}
            </p>
          ))}
        </div>
      ) : null}
            <blockquote className="problem-zitat">{runde.zusammenfassung}</blockquote>
      <p className="meta">
        {runde.thema ? `Thema: ${runde.thema.name}` : 'Thema nicht in der Datenbank'}
      </p>

      {!enthuellt ? (
        <div className="trommelwirbel" aria-live="polite">
          <span>Wird ausgezählt …</span>
        </div>
      ) : runde.status === 'ungeprueft' || !runde.ergebnisse ? (
        <section className="ungeprueft enthuellen">
          <span className="badge-ungeprueft">ungeprüft – keine Wertung</span>
          <p>
            Zu diesem Problem liegen noch keine geprüften Daten vor. Deshalb gibt es keine Punkte und keine Links. Das
            Problem wurde zur Prüfung vorgemerkt.
          </p>
          {runde.einschaetzung && (
            <p className="einschaetzung">
              <strong>Vorläufige Einschätzung (ungeprüft):</strong> {runde.einschaetzung}
            </p>
          )}
        </section>
      ) : (
        <>
          <Duell runde={runde} spieler={spieler} />
          <p className="rundensieger enthuellen" style={{ animationDelay: '1300ms' }}>
            {runde.status === 'unvollstaendig'
              ? keinLandesprogramm.length
                ? `Keine Wertung: kein aktuelles Landeswahlprogramm von ${keinLandesprogramm
                    .map((e) => `${e.partei.kurzname} in ${landName(e.fehlt?.land ?? '')}`)
                    .join(' und ')}.`
                : `Keine Wertung: Für ${ohneWertung.map((e) => e.partei.kurzname).join(' und ')} noch nicht erfasst.`
              : runde.punkte[0] === 1 && runde.punkte[1] === 1
                ? runde.ergebnisse[0].punkte === runde.ergebnisse[1].punkte
                  ? 'Gleichstand – beide bekommen einen Punkt.'
                  : 'Gleichauf – höchstens 10 % Abstand, beide bekommen einen Punkt.'
                : runde.punkte[0] === 1
                  ? `Punkt für ${spieler[0].name} (${spieler[0].partei.kurzname})!`
                  : runde.punkte[1] === 1
                    ? `Punkt für ${spieler[1].name} (${spieler[1].partei.kurzname})!`
                    : 'Keine der beiden Parteien hat dazu eine Maßnahme im Programm – kein Punkt.'}
            {runde.status === 'unvollstaendig' && (
              <span className="rundensieger-zusatz">Fehlende Daten kosten keine Partei einen Punkt.</span>
            )}
          </p>
          {runde.ergebnisse.some((e) => e.ki_entwurf) && (
            <details className="ki-hinweis enthuellen" style={{ animationDelay: '1400ms' }} role="note">
              <summary>
                <strong>{KI_HINWEIS}</strong>
              </summary>
              Maßnahmen und Punkte sind in der Testphase ein Entwurf, den eine KI nach der offenen Methode erstellt hat.
              Zitat und Seite im Programm lassen sich über die Links prüfen. {KI_ENTWURF_ERKLAERUNG}
              {runde.ergebnisse.some((e) => e.nicht_blind) && ` ${NICHT_BLIND_ERKLAERUNG}`}
            </details>
          )}
          <FuerEuch ergebnisse={runde.ergebnisse} spieler={spieler} />
          <details className="beste enthuellen" style={{ animationDelay: '1500ms' }}>
            <summary>
              <span className="beste-titel">Beste Lösung aller Parteien</span>
              <span className="beste-kurz">
                {runde.beste.length === 0
                  ? 'keine'
                  : `${runde.beste.map((b) => b.partei.kurzname).join(', ')} · ${punkteText(runde.beste[0].punkte)} Punkte`}
              </span>
            </summary>
            {runde.beste.length === 0 ? (
              <p>
                {runde.nichtErfasst.length === 0
                  ? 'Keine Partei hat dazu eine Maßnahme im Programm.'
                  : 'Unter den bisher erfassten Parteien hat keine eine Maßnahme dazu.'}
              </p>
            ) : (
              runde.beste.map((b) => (
                <div key={b.partei.id} className="beste-zeile" style={parteiStil(b.partei.farbe)}>
                  <strong>{b.partei.name}</strong> mit {punkteText(b.punkte)} Punkten
                  {b.ki_entwurf && ` (${b.nicht_blind ? NICHT_BLIND : KI_ENTWURF})`}
                  {b.treffer.map((t) => (
                    <p key={t.massnahme.id} className="beste-massnahme">
                      {t.massnahme.beschreibung} <MassnahmeBelege massnahme={t.massnahme} />
                    </p>
                  ))}
                </div>
              ))
            )}
            {runde.nichtErfasst.length > 0 && (
              <p className="beste-hinweis">
                Ohne Wertung und daher nicht verglichen (noch nicht erfasst
                {spieler.some((s) => s.land) ? ' oder ohne aktuelles Landeswahlprogramm' : ''}):{' '}
                {runde.nichtErfasst.map((p) => p.kurzname).join(', ')}.
              </p>
            )}
            {abweichend.length > 0 && (
              <p className="beste-hinweis">
                Ihr habt verschiedene {abweichend.map((x) => x[0]).join(' und ')} gewählt. Damit keine Seite den
                Vergleich bestimmt, ist er {abweichend.map((x) => x[1]).join(' und ')} gerechnet.
              </p>
            )}
          </details>
        </>
      )}

      {enthuellt && runde.forderung && (
        <ForderungsKarte instrumentId={runde.forderung.instrument_id} laender={spieler.map((s) => s.land)} titel="Deine Forderung" />
      )}

      {enthuellt && runde.ergebnisse && (
        <p className="hinweis methode-link">
          Punkte sind eine Einschätzung nach offener Methode, kein Urteil über Parteien.{' '}
          <a href="#/methode">So bewerten wir · Fehler melden</a>
        </p>
      )}
      {enthuellt && (
        <button className="knopf knopf-gross" onClick={onWeiter}>
          {letzte ? 'Zum Endergebnis' : 'Nächste Runde'}
        </button>
      )}
    </main>
  )
}
