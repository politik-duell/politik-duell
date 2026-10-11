import { PRUEF_INDEX } from 'virtual:pruef-index'
import { alsDateien, ladeKatalog, type Katalog } from '../data/katalog.ts'

// Der echte Datenkatalog aus `daten/` – mit ungeprüften Entwürfen, die nicht in
// der Datenbank stehen. Nur Prüfseite und Admin-Ansicht nutzen ihn. Unbedenklich:
// `daten/` ist ohnehin öffentlich im Repo.
//
// Jede Themendatei ist ein eigener Baustein und wird erst geladen, wenn das Thema
// gebraucht wird – der Gesamtbestand kann beliebig wachsen. Für Listen über alle
// Themen genügt der kleine Index (Namen, IDs der Prüfeinheiten).

const [parteienDatei] = alsDateien(import.meta.glob('../../daten/parteien.json', { eager: true, import: 'default' }))
const themenLader = import.meta.glob<unknown>('../../daten/themen/*.json', { import: 'default' })

/** Parteien, Länder und Landesprogramme – ohne Themen. */
export const BASIS = ladeKatalog(parteienDatei, [])

/** Alle Themen mit den IDs ihrer Prüfeinheiten (beim Bauen berechnet). */
export const THEMEN = PRUEF_INDEX

export const themaName = (id: number) => THEMEN.find((t) => t.id === id)?.name ?? `Thema ${id}`

const pfadVon = new Map(Object.keys(themenLader).map((pfad) => [Number(pfad.split('/').pop()!.slice(0, 2)), pfad]))
const geladen = new Map<number, Promise<Katalog>>()

/** Lädt ein Thema samt Parteien als eigenen (geprüften) Katalog; jedes Thema nur einmal. */
export function ladeThema(id: number): Promise<Katalog> {
  let k = geladen.get(id)
  if (!k) {
    const pfad = pfadVon.get(id)
    if (!pfad) return Promise.reject(new Error(`Thema ${id} gibt es nicht im Datenkatalog.`))
    k = themenLader[pfad]().then((inhalt) => ladeKatalog(parteienDatei, alsDateien({ [pfad]: inhalt })))
    k.catch(() => geladen.delete(id))
    geladen.set(id, k)
  }
  return k
}
