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
      Beta: Ein großer Teil der Bewertungen sind vorläufige KI-Entwürfe, noch nicht von Menschen geprüft – am Ergebnis
      jeweils gekennzeichnet. Fehler gern melden: <a href="#/methode">So bewerten wir</a>.
    </div>
  )
}
