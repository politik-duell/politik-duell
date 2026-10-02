// Das erste vollständige JSON-Objekt aus dem Text einer Agentenantwort (vor und nach dem JSON darf Text stehen).
export function extrahiereJson(text: string): { objekt: unknown; rest: string } | { fehler: string } {
  const start = text.indexOf('{')
  if (start < 0) return { fehler: 'Kein JSON-Objekt gefunden.' }
  let tiefe = 0
  let inText = false
  let maskiert = false
  let ende = -1
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inText) {
      if (maskiert) maskiert = false
      else if (c === '\\') maskiert = true
      else if (c === '"') inText = false
      continue
    }
    if (c === '"') inText = true
    else if (c === '{') tiefe++
    else if (c === '}' && --tiefe === 0) {
      ende = i
      break
    }
  }
  if (ende < 0) return { fehler: 'JSON-Objekt nicht abgeschlossen (Antwort abgeschnitten?).' }
  try {
    return { objekt: JSON.parse(text.slice(start, ende + 1)), rest: text.slice(ende + 1).trim() }
  } catch (e) {
    return { fehler: `Kein gültiges JSON: ${e instanceof Error ? e.message : e}` }
  }
}
