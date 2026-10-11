import { THEMEN } from '../pruefung/katalog'

// Kleine Helfer für den Admin-Bereich „Prüfung“ (echter Datenkatalog aus daten/).

export { themaName } from '../pruefung/katalog'

/** IDs dessen, was Prüfende je Thema bewerten: Instrumente und Maßnahmen ohne Instrument. */
export const massnahmenIds = (themaId: number) => THEMEN.find((t) => t.id === themaId)?.einheiten ?? []
