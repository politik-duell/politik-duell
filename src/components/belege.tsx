import type { Massnahme } from '../data/types'

function seitenText(url: string, land: boolean) {
  const seite = /#page=(\d+)/.exec(url)?.[1]
  const name = land ? 'Landesprogramm' : 'Programm'
  return seite ? `${name}, S. ${seite}` : name
}

export const KI_HINWEIS = 'Vorläufige KI-Bewertung – noch nicht von Menschen geprüft'
/** Bewertung, die eine KI ohne Parteinamen entworfen hat und die noch kein Mensch geprüft hat (nur Testphase). */
export const KI_ENTWURF = 'KI-Entwurf'
/** KI-Entwurf, dessen Werte mit Kenntnis der Partei vergeben oder geändert wurden (oder vor der Blindbewertung entstanden). */
export const NICHT_BLIND = 'KI-Entwurf, nicht blind'
/** Erklärung beider Kennzeichen – überall, wo sie erscheinen, im selben Wortlaut. */
export const KI_ENTWURF_ERKLAERUNG =
  '„KI-Entwurf“ heißt: Eine KI hat die Maßnahme nach der offenen Methode bewertet, ohne die Partei zu kennen; ' +
  'Menschen haben die Werte noch nicht geprüft.'
export const NICHT_BLIND_ERKLAERUNG =
  '„Nicht blind“ heißt: Diese Werte wurden mit Kenntnis der Partei vergeben oder geändert, nicht ohne Parteinamen.'

export function MassnahmeBelege({ massnahme }: { massnahme: Massnahme }) {
  return (
    <span className="belege">
      <a href={massnahme.beleg_programm_url} target="_blank" rel="noopener noreferrer">
        {seitenText(massnahme.beleg_programm_url, !!massnahme.land)}
      </a>
      {massnahme.beleg_studie_url && (
        <>
          {' · '}
          <a href={massnahme.beleg_studie_url} target="_blank" rel="noopener noreferrer">
            Studie
          </a>
        </>
      )}
    </span>
  )
}

/** Link ins Programm mit Seitenangabe („Programm, S. 12“) – etwa für Positionen in der Haltungskarte. */
export function ProgrammLink({ url, land = false }: { url: string; land?: boolean }) {
  return (
    <span className="belege">
      <a href={url} target="_blank" rel="noopener noreferrer">
        {seitenText(url, land)}
      </a>
    </span>
  )
}
