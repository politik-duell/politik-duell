import { type FormEvent, useId, useState } from 'react'
import { pruefeText } from '../../supabase/functions/_shared/moderation'
import { ABLEHNUNG, VORSCHLAG_MAX, VORSCHLAG_MIN } from '../../supabase/functions/_shared/vorschlag'
import { schlageThemaVor, VorschlagFehler, vorschlagMoeglich } from '../data/quelle'

// „Thema vorschlagen“: Wer ein Problem oder Thema im Spiel vermisst, schlägt es ausdrücklich vor. Ohne KI – der Text
// geht unverändert über die Edge Function `vorschlag` in die Datenbank, ohne Bezug zum Spiel. Die Eingaben im
// Spiel selbst werden nicht gespeichert und auch nicht vorausgefüllt: Vorgeschlagen wird nur, was die Person hier
// selbst schreibt und abschickt.

/** Was mit dem Vorschlag passiert – steht direkt am Formular (Datenschutz, Transparenz). */
export const VORSCHLAG_HINWEIS =
  'Ohne KI: Nur dein Text wird gespeichert – ohne Bezug zu deinem Spiel, deinen Eingaben oder Parteien – und ' +
  'nur für uns sichtbar, höchstens 180 Tage. Bitte keine Namen, Kontaktdaten oder ' +
  'Angaben über dich. Mit „Vorschlag senden“ willigst du ausdrücklich ein, dass wir den Text so speichern und ' +
  'auswerten (Datenschutzerklärung, Abschnitt 4a).'

export function VorschlagFormular({ anlass, offen: anfangsOffen = false }: { anlass?: string; offen?: boolean }) {
  const id = useId()
  const [offen, setOffen] = useState(anfangsOffen)
  const [text, setText] = useState('')
  const [sendet, setSendet] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [fertig, setFertig] = useState(false)

  if (!vorschlagMoeglich()) return null

  if (fertig)
    return (
      <p className="vorschlag-danke" role="status">
        Danke für deinen Vorschlag! Wir sehen ihn uns an.{' '}
        <button
          type="button"
          className="knopf-link"
          onClick={() => {
            setFertig(false)
            setText('')
          }}
        >
          Noch einen vorschlagen
        </button>
      </p>
    )

  if (!offen)
    return (
      <p className="vorschlag-zu">
        {anlass && <>{anlass} </>}
        <button type="button" className="knopf-link" onClick={() => setOffen(true)}>
          Thema vorschlagen
        </button>
      </p>
    )

  const bereinigt = text.trim()
  async function senden(e: FormEvent) {
    e.preventDefault()
    if (sendet || bereinigt.length < VORSCHLAG_MIN) return
    // Derselbe Wortfilter wie in der Edge Function – so verlassen Kontaktdaten oder Namen den Browser gar nicht erst.
    const grund = pruefeText(bereinigt)
    if (grund) {
      setFehler(ABLEHNUNG[grund])
      return
    }
    setSendet(true)
    setFehler(null)
    try {
      await schlageThemaVor(bereinigt)
      setFertig(true)
    } catch (err) {
      setFehler(err instanceof VorschlagFehler ? err.message : 'Das hat gerade nicht geklappt.')
    } finally {
      setSendet(false)
    }
  }

  return (
    <form className="vorschlag" onSubmit={senden}>
      <label htmlFor={id} className="vorschlag-titel">
        Welches Problem oder Thema fehlt dir im Spiel?
      </label>
      <textarea
        id={id}
        rows={3}
        maxLength={VORSCHLAG_MAX}
        placeholder="z. B. „Pflegeplätze für Angehörige“ oder „Fluglärm in der Nacht“"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={sendet}
        aria-describedby={`${id}-hinweis`}
      />
      <p id={`${id}-hinweis`} className="meta">
        {VORSCHLAG_HINWEIS}
      </p>
      {fehler && (
        <p className="vorschlag-fehler" role="alert">
          {fehler}
        </p>
      )}
      <div className="vorschlag-knoepfe">
        {!anfangsOffen && (
          <button type="button" className="knopf-link" onClick={() => setOffen(false)} disabled={sendet}>
            Abbrechen
          </button>
        )}
        <button className="knopf" type="submit" disabled={sendet || bereinigt.length < VORSCHLAG_MIN}>
          {sendet ? 'Sende …' : 'Vorschlag senden'}
        </button>
      </div>
    </form>
  )
}

/** Eigene Seite (#/vorschlag), verlinkt in der Fußzeile. */
export function VorschlagSeite() {
  return (
    <article>
      <h1>Thema vorschlagen</h1>
      <p>
        Das Spiel wertet bisher nur Themen, zu denen wir die Wahlprogramme aller Parteien mit Quellen ausgewertet
        haben. Fehlt dir ein Alltagsproblem? Schlag es vor – wir sammeln die Vorschläge und nehmen die häufigsten
        zuerst auf.
      </p>
      {vorschlagMoeglich() ? (
        <VorschlagFormular offen />
      ) : (
        <p className="meta">Vorschläge gehen nur in der Online-Version des Spiels.</p>
      )}
    </article>
  )
}
