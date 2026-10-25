import { useState, useSyncExternalStore } from 'react'
import { useDaten } from '../data/kontext'
import { waehlbareLaender } from '../data/quelle'
import { ROLLEN } from '../data/rollen'
import type { Partei, Rolle } from '../data/types'
import { Kreuzfeld } from './Kreuz'
import { parteiStil } from './stil'
import type { Spieler } from '../spiel'

interface Auswahl {
  partei: Partei | null
  rolle: Rolle | null
}

/** Schmale Ansicht: beide Seiten kreuzen in einer gemeinsamen Tabelle an. */
const SCHMAL = '(max-width: 639px)'
const schmalAbo = (melden: () => void) => {
  const mq = matchMedia(SCHMAL)
  mq.addEventListener('change', melden)
  return () => mq.removeEventListener('change', melden)
}
const istSchmal = () => matchMedia(SCHMAL).matches

/** Rolle einer Seite (optional). */
function Angaben({ titel, auswahl, onChange }: { titel: string; auswahl: Auswahl; onChange: (a: Auswahl) => void }) {
  return (
    <>
      <label className="rolle-wahl-label" htmlFor={`${titel}-rolle`}>
        Deine Rolle im Alltag (optional)
      </label>
      <select
        id={`${titel}-rolle`}
        value={auswahl.rolle ?? ''}
        onChange={(e) => onChange({ ...auswahl, rolle: (e.target.value || null) as Rolle | null })}
      >
        <option value="">Keine Angabe</option>
        {ROLLEN.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
    </>
  )
}

/**
 * Bundesland der Partie (optional): eines für beide Seiten, damit beide Parteien an den Programmen
 * desselben Landes gemessen werden (docs/plan-duell-regeln.md).
 */
function LandWahl({ land, onChange }: { land: string | null; onChange: (l: string | null) => void }) {
  const laender = waehlbareLaender(useDaten())
  if (!laender.length) return null
  return (
    <fieldset className="spieler-wahl stimmzettel partie-land">
      <legend>Wo spielt ihr?</legend>
      <label className="rolle-wahl-label" htmlFor="partie-land">
        Bundesland (optional)
      </label>
      <select id="partie-land" value={land ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Nur Bundesprogramme</option>
        {laender.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </fieldset>
  )
}

function SpielerWahl({
  titel,
  auswahl,
  gesperrt,
  onChange,
}: {
  titel: string
  auswahl: Auswahl
  gesperrt: Partei | null
  onChange: (a: Auswahl) => void
}) {
  const { parteien } = useDaten()
  return (
    <fieldset className="spieler-wahl stimmzettel">
      <legend>{titel}</legend>
      <p className="stimmzettel-anleitung">Ein Kreuz für eine Partei</p>
      <div className="partei-liste">
        {parteien.map((p) => {
          const belegt = gesperrt?.id === p.id
          const gewaehlt = auswahl.partei?.id === p.id
          return (
            <button
              key={p.id}
              type="button"
              className={`partei-zeile${gewaehlt ? ' gewaehlt' : ''}`}
              style={parteiStil(p.farbe)}
              disabled={belegt}
              aria-pressed={gewaehlt}
              onClick={() => onChange({ ...auswahl, partei: p })}
            >
              <span className="partei-zeile-name">
                {p.name}
                {belegt && <small> vergeben</small>}
              </span>
              <Kreuzfeld />
            </button>
          )
        })}
      </div>
      <Angaben titel={titel} auswahl={auswahl} onChange={onChange} />
    </fieldset>
  )
}

/** Gemeinsamer Stimmzettel: links kreuzt A, rechts B, die Partei steht in der Mitte. */
function ParteiTabelle({
  a,
  b,
  onA,
  onB,
}: {
  a: Auswahl
  b: Auswahl
  onA: (a: Auswahl) => void
  onB: (b: Auswahl) => void
}) {
  const { parteien } = useDaten()
  const feld = (seite: string, p: Partei, eigen: Auswahl, fremd: Auswahl, onChange: (a: Auswahl) => void) => {
    const gewaehlt = eigen.partei?.id === p.id
    return (
      <button
        type="button"
        className={`tabelle-kreuz${gewaehlt ? ' gewaehlt' : ''}`}
        disabled={fremd.partei?.id === p.id}
        aria-pressed={gewaehlt}
        aria-label={`${seite}: ${p.name}`}
        onClick={() => onChange({ ...eigen, partei: p })}
      >
        <Kreuzfeld />
      </button>
    )
  }
  return (
    <fieldset className="partei-tabelle stimmzettel">
      <legend className="sr-only">Parteiwahl</legend>
      <div className="partei-tabelle-kopf" aria-hidden="true">
        <span>A</span>
        <span>Ein Kreuz je Seite</span>
        <span>B</span>
      </div>
      {parteien.map((p) => (
        <div key={p.id} className="partei-tabelle-zeile" style={parteiStil(p.farbe)}>
          {feld('Spieler:in A', p, a, b, onA)}
          <span className="partei-tabelle-name">{p.name}</span>
          {feld('Spieler:in B', p, b, a, onB)}
        </div>
      ))}
    </fieldset>
  )
}

export function Setup({ onFertig }: { onFertig: (s: [Spieler, Spieler]) => void }) {
  const [a, setA] = useState<Auswahl>({ partei: null, rolle: null })
  const [b, setB] = useState<Auswahl>({ partei: null, rolle: null })
  const [land, setLand] = useState<string | null>(null)
  const mitLaendern = waehlbareLaender(useDaten()).length > 0
  const schmal = useSyncExternalStore(schmalAbo, istSchmal)
  const bereit = a.partei && b.partei && a.partei.id !== b.partei.id

  return (
    <main className="seite">
      <h2>Wer tritt an?</h2>
      <p className="hinweis">
        Jede Seite wählt eine andere Partei. Die Rolle beeinflusst manche Bewertungen.
        {mitLaendern && ' Mit Bundesland zählt bei Landesthemen wie Schule für beide das Landeswahlprogramm. Gespeichert wird es nicht.'}
      </p>
      {schmal ? (
        <>
          <ParteiTabelle a={a} b={b} onA={setA} onB={setB} />
          <div className="angaben-paar">
            {(
              [
                ['Spieler:in A', a, setA],
                ['Spieler:in B', b, setB],
              ] as const
            ).map(([titel, auswahl, onChange]) => (
              <fieldset key={titel} className="spieler-wahl stimmzettel">
                <legend>{titel}</legend>
                <Angaben titel={titel} auswahl={auswahl} onChange={onChange} />
              </fieldset>
            ))}
          </div>
        </>
      ) : (
        <div className="stimmzettel-paar">
          <SpielerWahl titel="Spieler:in A" auswahl={a} gesperrt={b.partei} onChange={setA} />
          <SpielerWahl titel="Spieler:in B" auswahl={b} gesperrt={a.partei} onChange={setB} />
        </div>
      )}
      <LandWahl land={land} onChange={setLand} />
      <button
        className="knopf knopf-gross"
        disabled={!bereit}
        onClick={() =>
          onFertig([
            { name: 'Spieler:in A', partei: a.partei!, rolle: a.rolle, land },
            { name: 'Spieler:in B', partei: b.partei!, rolle: b.rolle, land },
          ])
        }
      >
        Los geht’s
      </button>
    </main>
  )
}
