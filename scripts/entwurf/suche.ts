// Gemeinsame Suchlogik für programme:suche und entwurf:treffer: Wortteile ohne Groß-/Kleinschreibung,
// Silbentrennung am Zeilenende und zerlegte Wörter im Textauszug stören nicht.

/** Fließtext einer Seite: Silbentrennung am Zeilenende zusammengezogen, Leerraum vereinheitlicht. */
export const fliesstext = (seite: string) =>
  seite
    .normalize('NFKC')
    .replace(/­/g, '')
    .replace(/(\p{Ll})[-‐]\s*\n\s*(\p{Ll})/gu, '$1$2')
    .replace(/\s+/g, ' ')

// Manche PDFs zerlegen Wörter im Textauszug („unab - dingbar“, „erh ö hen“): Zwischen
// zwei Zeichen eines Begriffs darf deshalb ein Leerzeichen oder eine Trennung stehen.
const zwischen = '(?:\\s*[-‐]\\s+|\\s)?'

const WORTZEICHEN = '[\\p{L}\\p{N}]'

/**
 * Ein Begriff ist ein Wortteil. Ein Zeichen vorn schränkt das ein, damit kurze Begriffe nicht in
 * fremden Wörtern treffen („auen“ in „bauen“): `^auen` gilt nur am Wortanfang, `=auen` nur als ganzes Wort.
 */
export const begriffMarker = (b: string): '' | '^' | '=' => {
  const z = b.trim()[0]
  return z === '^' || z === '=' ? z : ''
}

/** Der Begriff ohne Markierung. */
export const begriffKern = (b: string) => (begriffMarker(b) ? b.trim().slice(1) : b.trim())

/** Regulärer Ausdruck (ohne Flags, mit Unicode-Flag zu benutzen) für einen Begriff. */
export const begriffQuelle = (b: string) => {
  const marker = begriffMarker(b)
  const kern = [...begriffKern(b).replace(/\s+/g, '')].map((z) => z.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(zwischen)
  if (marker === '=') return `(?<!${WORTZEICHEN})${kern}(?!${WORTZEICHEN})`
  if (marker === '^') return `(?<!${WORTZEICHEN})${kern}`
  return kern
}

/** Treffer eines Begriffs in allen Seiten. */
export function zaehle(seiten: string[], begriff: string): number {
  const m = new RegExp(begriffQuelle(begriff), 'giu')
  return seiten.reduce((s, roh) => s + [...fliesstext(roh).matchAll(m)].length, 0)
}
