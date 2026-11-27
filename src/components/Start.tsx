import { useId } from 'react'
import { Kreuzfeld } from './Kreuz'
import { Logo } from './Logo'

/** Kleine Bilder für die drei Schritte, in Stimmblau wie das Logo. */
function SchrittBild({ art }: { art: 'partei' | 'problem' | 'beleg' }) {
  return (
    <svg className="schritt-bild" viewBox="0 0 40 40" aria-hidden="true">
      {art === 'partei' && (
        <>
          <circle cx="20" cy="20" r="14" />
          <path d="M12 12l16 16M28 12L12 28" />
        </>
      )}
      {art === 'problem' && <path d="M8 10h24a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H18l-7 6v-6H8a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z" />}
      {art === 'beleg' && (
        <>
          <rect x="4" y="15" width="32" height="10" rx="2" />
          <rect x="7" y="17" width="13" height="6" rx="1" className="voll" />
          <rect x="20" y="17" width="7" height="6" rx="1" className="leicht" />
          <path d="M20 10v20" />
        </>
      )}
    </svg>
  )
}

export function Start({
  bereit,
  einverstanden,
  onEinverstanden,
  ladeFehler,
  onBeispieldaten,
  onStart,
}: {
  bereit: boolean
  einverstanden: boolean
  onEinverstanden: (ja: boolean) => void
  ladeFehler: string | null
  onBeispieldaten: () => void
  onStart: () => void
}) {
  const id = useId()
  return (
    <main className="start">
      <div className="start-inhalt stimmzettel">
        <div className="start-kopf">
          <div>
            <h1 className="titel">Politik-Duell</h1>
            <p className="slogan">Versprechen kann jeder.</p>
          </div>
          <Logo groesse={72} />
        </div>
        {/* So geht's in drei Bildern – für alle gleich, ohne „schon gesehen“ im Browser zu speichern (§ 25 TDDDG). */}
        <ol className="schritte" aria-label="So geht’s">
          <li>
            <SchrittBild art="partei" />
            <span>
              <strong>Partei wählen</strong>
              <small>jede Seite eine</small>
            </span>
          </li>
          <li>
            <SchrittBild art="problem" />
            <span>
              <strong>Problem nennen</strong>
              <small>aus deinem Alltag</small>
            </span>
          </li>
          <li>
            <SchrittBild art="beleg" />
            <span>
              <strong>Lösung vergleichen</strong>
              <small>mit Beleg</small>
            </span>
          </li>
        </ol>
        <p className="erklaerung">Zu zweit, fünf Runden. Gewinnt, wessen Partei die besseren Lösungen hat.</p>
        <p className="start-themen">
          <a href="#/themen">Welche Themen das Spiel schon kennt</a>
        </p>
        {ladeFehler ? (
          <div className="ladefehler" role="alert">
            <p>Die Spieldaten konnten nicht geladen werden ({ladeFehler}).</p>
            <button className="knopf knopf-gross" onClick={onBeispieldaten}>
              Mit Beispieldaten spielen
            </button>
          </div>
        ) : (
          <>
            {/* Ausdrückliche Einwilligung (Art. 9 DSGVO): Eingaben können politische Meinungen erkennen lassen. */}
            <label className="einwilligung" htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                checked={einverstanden}
                onChange={(e) => onEinverstanden(e.target.checked)}
              />
              <span className="einwilligung-text">
                Ich bin einverstanden, dass eine KI meine Eingaben wie in der{' '}
                <a href="#/datenschutz">Datenschutzerklärung</a> beschrieben einordnet. Mir ist klar, dass sie
                politische Meinungen erkennen lassen können. Ich bin mindestens 16 Jahre alt.
              </span>
              <Kreuzfeld />
            </label>
            <button className="knopf knopf-gross" onClick={onStart} disabled={!bereit || !einverstanden}>
              {bereit ? 'Spiel starten' : 'Lade Spieldaten …'}
            </button>
          </>
        )}
        <details className="datenschutz">
          <summary>
            <strong>Datenschutz:</strong> keine Konten, keine Cookies, deine Eingaben werden nicht gespeichert.
          </summary>
          Keine IP-Adressen, kein Audio. Deine Eingaben ordnet eine KI (Mistral, EU) ein; wir speichern sie nicht – weder
          im Wortlaut noch als Kurzfassung oder Ergebnis. Gespeichert wird nur, was du ausdrücklich als Thema vorschlägst.
          Die Wortwolke im Hintergrund zeigt die Themen, die das Spiel schon werten kann – keine Eingaben.{' '}
          <a href="#/datenschutz">Datenschutzerklärung</a>
        </details>
      </div>
    </main>
  )
}
