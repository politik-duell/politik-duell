import type { Nebenwirkung } from '../data/types'

const BEREICH_TEXT: Record<Nebenwirkung['bereich'], string> = {
  haushalt: 'Staatshaushalt',
  wirtschaft: 'Wirtschaft und Preise',
  aufwand: 'Bürokratie',
  umwelt: 'Umwelt und Klima',
  verteilung: 'Verteilung',
  grundrechte: 'Grundrechte und Gesundheit',
}

const RICHTUNG_TEXT: Record<Nebenwirkung['richtung'], string> = {
  vorteil: 'Vorteil',
  nachteil: 'Nachteil',
  gemischt: 'Vor- und Nachteile',
}

/**
 * Folgen eines Lösungswegs über das Thema hinaus (docs/plan-nebenwirkungen.md): belegt, ohne Punkte.
 * Nichts, solange nicht geprüft; ein leiser Satz, wenn geprüft und nichts Wesentliches belegt ist.
 */
export function Folgen({ hinweise }: { hinweise?: Nebenwirkung[] | null }) {
  if (!hinweise) return null
  if (!hinweise.length) return <p className="folgen folgen-leer">Keine wesentlichen Folgen über das Thema hinaus belegt.</p>
  return (
    <div className="folgen">
      <p className="folgen-titel">
        Folgen über das Thema hinaus <span>· zählen nicht zu den Punkten</span>
      </p>
      <ul>
        {hinweise.map((h) => (
          <li key={h.bereich}>
            <span className="folge-art">
              {RICHTUNG_TEXT[h.richtung]} · {BEREICH_TEXT[h.bereich]}:
            </span>{' '}
            {h.text}{' '}
            <a href={h.quelle_url} target="_blank" rel="noopener noreferrer">
              Quelle
            </a>
            {h.zweite_quelle_url && (
              <>
                {', '}
                <a href={h.zweite_quelle_url} target="_blank" rel="noopener noreferrer">
                  2. Quelle
                </a>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
