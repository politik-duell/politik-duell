import { describe, expect, it } from 'vitest'
import { alleZeilen, SEITE } from './quelle'

describe('alleZeilen', () => {
  const tabelle = Array.from({ length: 2 * SEITE + 3 }, (_, i) => i)
  const abfrage = async (von: number, bis: number) => ({ data: tabelle.slice(von, bis + 1), error: null })

  it('holt alle Seiten, nicht nur die ersten 1000 Zeilen', async () => {
    const { data } = await alleZeilen(abfrage)
    expect(data).toEqual(tabelle)
  })

  it('gibt den Fehler einer Seite weiter', async () => {
    const res = await alleZeilen(async (von) =>
      von === 0 ? { data: tabelle.slice(0, SEITE), error: null } : { data: null, error: { message: 'kaputt' } },
    )
    expect(res).toEqual({ data: null, error: { message: 'kaputt' } })
  })
})
