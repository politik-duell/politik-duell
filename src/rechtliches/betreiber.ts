// Angaben für Impressum und Datenschutzerklärung. VOR DEM ÖFFENTLICHEN START
// alle Felder mit „[…]“ durch echte Angaben ersetzen – solange welche fehlen,
// zeigen beide Seiten einen deutlichen Hinweis.

export const BETREIBER = {
  /** Vor- und Nachname (bei Vereinen/Firmen: Name und Rechtsform) */
  name: 'Arne Baron',
  strasse: 'Hauptstr. 14',
  ort: '13158 Berlin',
  email: 'politik-duell@posteo.de',
  /** Optional, leer lassen wenn nicht gewünscht */
  telefon: '',
  /** Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV (meist dieselbe Person) */
  inhaltlichVerantwortlich: 'Arne Baron, Anschrift wie oben',
  /** Datenschutz-Aufsichtsbehörde des eigenen Bundeslands */
  aufsichtsbehoerde: {
    name: 'Berliner Beauftragte für Datenschutz und Informationsfreiheit',
    url: 'https://www.datenschutz-berlin.de',
  },
  /** Öffentlicher Quellcode (für Transparenz der Bewertungen) */
  quellcode: 'https://github.com/politik-duell/politik-duell',
}

/** Stand der Datenschutzerklärung – bei inhaltlichen Änderungen anpassen. */
export const DATENSCHUTZ_STAND = '3. November 2026'

export const betreiberVollstaendig = () =>
  !JSON.stringify(BETREIBER).includes('[')
