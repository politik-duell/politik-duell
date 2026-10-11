// Vite-Plugin: kleiner Index der Prüfeinheiten je Thema (`virtual:pruef-index`).
// Die Admin-Listen brauchen nur Namen und IDs; die vollständigen Themendateien
// lädt die App je Thema nach (src/pruefung/katalog.ts). So bleibt jeder Abruf
// klein, auch wenn `daten/` sehr groß wird.
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { pruefEinheiten } from '../src/data/katalog.ts'
import { pruefeDatenordner } from './katalog-laden.ts'

const MODUL = 'virtual:pruef-index'
const AUFGELOEST = `\0${MODUL}`

export interface PruefIndexThema {
  id: number
  name: string
  /** IDs der Prüfeinheiten (Instrumente und Maßnahmen ohne Instrument), aufsteigend. */
  einheiten: number[]
}

export function pruefIndex(): Plugin {
  return {
    name: 'pruef-index',
    resolveId: (id) => (id === MODUL ? AUFGELOEST : undefined),
    load(id) {
      if (id !== AUFGELOEST) return
      const ordner = new URL('../daten/themen/', import.meta.url)
      for (const f of readdirSync(ordner)) this.addWatchFile(fileURLToPath(new URL(f, ordner)))
      const { katalog, fehler } = pruefeDatenordner()
      if (fehler.length) throw new Error(`Datenkatalog fehlerhaft (npm run daten:pruefen):\n${fehler.join('\n')}`)
      const index: PruefIndexThema[] = katalog.themen.map((t) => ({
        id: t.id,
        name: t.name,
        einheiten: pruefEinheiten(katalog, t.id).map((e) => e.id),
      }))
      return `export const PRUEF_INDEX = ${JSON.stringify(index)}`
    },
  }
}
