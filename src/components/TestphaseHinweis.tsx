import { speichereZugang } from '../data/quelle'

/** Band oben in der geschlossenen Testphase: Hier zählen auch KI-Entwürfe. */
export function TestphaseHinweis() {
  return (
    <div className="mock-hinweis testphase-hinweis" role="note">
      Geschlossene Testphase: Ein Teil der Bewertungen sind vorläufige KI-Entwürfe, noch nicht von Menschen geprüft.
      Bitte nicht weiterverbreiten.{' '}
      <button
        type="button"
        className="link-knopf"
        onClick={() => {
          speichereZugang(null)
          location.reload()
        }}
      >
        Testphase verlassen
      </button>
    </div>
  )
}

/** Band oben in der Beta: KI-Entwürfe zählen für alle (CLAUDE.md Grundprinzip 2). */
export function BetaHinweis() {
  return (
    <div className="mock-hinweis testphase-hinweis" role="note">
      Beta: Viele Bewertungen sind noch KI-Entwürfe, nicht von Menschen geprüft.{' '}
      <a href="#/methode">Mehr und Fehler melden</a>
    </div>
  )
}
