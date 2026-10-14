import { useState } from 'react'
import { MAX_AUSWAHL, type Thema, type Ursache } from '../data/types'

/** So viele Ursachen sind sofort sichtbar, der Rest hinter „weitere zeigen“. */
export const SICHTBAR = 8

/**
 * Bestätigung vor jeder Wertung (docs/plan-zuordnung.md): die Ursachen eines Themas zum Antippen. Gewertet wird nur,
 * was die Person hier bestätigt – höchstens MAX_AUSWAHL, sonst gewänne, wer zum Thema die meisten Maßnahmen hat.
 *
 * - Mit `vorauswahl` (die KI war sicher): „So habe ich dich verstanden“, die vorgeschlagenen Ursachen sind angetippt.
 * - Ohne (die KI war unsicher, eine Nachfrage, eine Forderung oder eine Haltungskarte): „Was davon trifft bei dir zu?“.
 * - Immer: „anderes Thema“ (zuerst die Themen, die die KI ebenfalls nannte) und „Nichts davon passt“.
 */
export function UrsachenAuswahl({
  thema,
  themen,
  ursachen,
  vorauswahl = [],
  kandidaten = [],
  gesperrt,
  onWaehlen,
  onThema,
  onPasstNicht,
}: {
  thema: Thema
  themen: Thema[]
  ursachen: Ursache[]
  vorauswahl?: number[]
  /** Weitere Themen, die die KI in Frage kommend fand – stehen bei „anderes Thema“ oben. */
  kandidaten?: number[]
  gesperrt: boolean
  onWaehlen: (ids: number[]) => void
  onThema: (id: number) => void
  onPasstNicht: () => void
}) {
  const liste = ursachen.filter((u) => u.thema_id === thema.id).sort((a, b) => a.id - b.id)
  const vorgeschlagen = vorauswahl.filter((id) => liste.some((u) => u.id === id)).slice(0, MAX_AUSWAHL)
  const [gewaehlt, setGewaehlt] = useState<number[]>(vorgeschlagen)
  // Vorgeschlagene Ursachen stehen immer sichtbar, auch wenn sie hinter „weitere zeigen“ lägen.
  const [alle, setAlle] = useState(vorgeschlagen.some((id) => liste.findIndex((u) => u.id === id) >= SICHTBAR))
  const [themaWahl, setThemaWahl] = useState(false)
  if (!liste.length) return null
  const sichtbar = alle ? liste : liste.slice(0, SICHTBAR)
  const voll = gewaehlt.length >= MAX_AUSWAHL
  const verstanden = vorgeschlagen.length > 0
  const unveraendert = verstanden && gewaehlt.length === vorgeschlagen.length && gewaehlt.every((id) => vorgeschlagen.includes(id))

  const umschalten = (id: number) =>
    setGewaehlt((g) => (g.includes(id) ? g.filter((x) => x !== id) : g.length < MAX_AUSWAHL ? [...g, id] : g))

  const andere = themen.filter((t) => t.id !== thema.id)
  const vorne = kandidaten.map((id) => andere.find((t) => t.id === id)).filter((t): t is Thema => !!t)
  const rest = andere.filter((t) => !vorne.includes(t)).sort((a, b) => a.name.localeCompare(b.name, 'de'))

  return (
    <fieldset className="ursachen-auswahl">
      <legend>{verstanden ? 'So habe ich dich verstanden:' : 'Was davon trifft bei dir zu?'}</legend>
      <p className="ursachen-thema">
        Thema: <strong>{thema.name}</strong>
        {andere.length > 0 && (
          <>
            {' · '}
            <button type="button" className="knopf-link" aria-expanded={themaWahl} disabled={gesperrt} onClick={() => setThemaWahl((x) => !x)}>
              anderes Thema
            </button>
          </>
        )}
      </p>
      {themaWahl && (
        <label className="ursachen-themawahl">
          <span className="sr-only">Anderes Thema wählen</span>
          <select defaultValue="" disabled={gesperrt} onChange={(e) => e.target.value && onThema(Number(e.target.value))}>
            <option value="" disabled>
              Thema wählen …
            </option>
            {vorne.length > 0 && (
              <optgroup label="Passt vielleicht">
                {vorne.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label={vorne.length ? 'Alle anderen Themen' : 'Alle Themen'}>
              {rest.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      )}
      <p className="meta">
        {verstanden ? 'Stimmt das so? Du kannst die Auswahl ändern. ' : ''}Höchstens {MAX_AUSWAHL}. Gewertet wird dann, wer dafür die beste
        Lösung hat.
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
                disabled={gesperrt || (voll && !an)}
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
