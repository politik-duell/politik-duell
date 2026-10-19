import { useState } from 'react'
import { auswahlErlaubt, MAX_AUSWAHL, type Symptomgruppe, type Thema, type Ursache } from '../data/types'

/** So viele Ursachen sind sofort sichtbar, der Rest hinter „weitere zeigen“. */
export const SICHTBAR = 8

/**
 * Bestätigung vor jeder Wertung (docs/plan-zuordnung.md): die Ursachen eines Themas zum Antippen. Gewertet wird nur,
 * was die Person hier bestätigt – höchstens MAX_AUSWAHL, sonst gewänne, wer zum Thema die meisten Maßnahmen hat.
 *
 * - Mit `vorauswahl` (die KI war sicher): „So habe ich dich verstanden“, die vorgeschlagenen Ursachen sind angetippt.
 * - Ohne (die KI war unsicher, eine Nachfrage, eine Forderung oder eine Haltungskarte): „Was davon trifft bei dir zu?“.
 * - Mit `gruppe` (die Person nannte nur eine Folge mehrerer Ursachen): alle Ursachen der Gruppe angetippt; sie zählen
 *   nicht zu MAX_AUSWAHL (docs/plan-symptome.md).
 * - Mit `abweichung` (eine Ursache passt nur teilweise): der Satz der KI dazu, ohne Vorauswahl.
 * - Immer: „Nichts davon passt“. Kein Wechsel zu einem anderen Thema – sonst ließe sich zu einem Thema springen, das
 *   gar nicht zur Schilderung passt.
 */
export function UrsachenAuswahl({
  thema,
  ursachen,
  vorauswahl = [],
  gruppe,
  abweichung,
  gesperrt,
  onWaehlen,
  onPasstNicht,
}: {
  thema: Thema
  ursachen: Ursache[]
  vorauswahl?: number[]
  /** Symptomgruppe, deren Ursachen die KI vorschlägt. */
  gruppe?: Symptomgruppe
  /** Was an der nächstliegenden Ursache abweicht (Satz der KI). */
  abweichung?: string
  gesperrt: boolean
  onWaehlen: (ids: number[]) => void
  onPasstNicht: () => void
}) {
  const liste = ursachen.filter((u) => u.thema_id === thema.id).sort((a, b) => a.id - b.id)
  const vorgeschlagen = vorauswahl
    .filter((id) => liste.some((u) => u.id === id))
    .reduce<number[]>((g, id) => (auswahlErlaubt([...g, id], gruppe) ? [...g, id] : g), [])
  const [gewaehlt, setGewaehlt] = useState<number[]>(vorgeschlagen)
  // Vorgeschlagene Ursachen stehen immer sichtbar, auch wenn sie hinter „weitere zeigen“ lägen.
  const [alle, setAlle] = useState(vorgeschlagen.some((id) => liste.findIndex((u) => u.id === id) >= SICHTBAR))
  if (!liste.length) return null
  const sichtbar = alle ? liste : liste.slice(0, SICHTBAR)
  const verstanden = vorgeschlagen.length > 0
  const unveraendert = verstanden && gewaehlt.length === vorgeschlagen.length && gewaehlt.every((id) => vorgeschlagen.includes(id))

  const moeglich = (g: number[], id: number) => auswahlErlaubt([...g, id], gruppe)
  const umschalten = (id: number) =>
    setGewaehlt((g) => (g.includes(id) ? g.filter((x) => x !== id) : moeglich(g, id) ? [...g, id] : g))

  return (
    <fieldset className="ursachen-auswahl">
      <legend>{verstanden ? 'So habe ich dich verstanden:' : 'Was davon trifft bei dir zu?'}</legend>
      <p className="ursachen-thema">
        Thema: <strong>{thema.name}</strong>
      </p>
      {abweichung && (
        <p className="ursachen-abweichung">
          {abweichung} Trifft trotzdem etwas davon zu, tippe es an – sonst „Nichts davon passt“.
        </p>
      )}
      <p className="meta">
        {verstanden ? 'Stimmt das so? Du kannst die Auswahl ändern. ' : ''}
        {gruppe
          ? `Zu „${gruppe.alltag}“ tragen mehrere Ursachen bei – sie zählen alle. Dazu höchstens ${MAX_AUSWAHL} weitere. `
          : `Höchstens ${MAX_AUSWAHL}. `}
        Gewertet wird dann, wer dafür die beste Lösung hat.
      </p>
      <ul>
        {sichtbar.map((u) => {
          const an = gewaehlt.includes(u.id)
          return (
            <li key={u.id}>
              <button
                type="button"
                className={`ursache-chip${an ? ' gewaehlt' : ''}`}
                aria-pressed={an}
                disabled={gesperrt || (!an && !moeglich(gewaehlt, u.id))}
                onClick={() => umschalten(u.id)}
              >
                {u.alltag ?? u.beschreibung}
              </button>
            </li>
          )
        })}
      </ul>
      {liste.length > sichtbar.length && (
        <button type="button" className="knopf-link" onClick={() => setAlle(true)}>
          {liste.length - sichtbar.length} weitere zeigen
        </button>
      )}
      <div className="ursachen-knoepfe">
        <button
          type="button"
          className={verstanden ? 'knopf' : 'knopf knopf-zweit'}
          disabled={gesperrt || gewaehlt.length === 0}
          onClick={() => onWaehlen(gewaehlt)}
        >
          {unveraendert ? 'Stimmt so' : gewaehlt.length ? `Damit werten (${gewaehlt.length})` : 'Damit werten'}
        </button>
        <button type="button" className="knopf-link" disabled={gesperrt} onClick={onPasstNicht}>
          Nichts davon passt
        </button>
      </div>
    </fieldset>
  )
}
