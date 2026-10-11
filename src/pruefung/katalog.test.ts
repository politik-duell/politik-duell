import { describe, expect, it } from 'vitest'
import { alsDateien, ladeKatalog, pruefEinheiten } from '../data/katalog'
import { ladeThema, THEMEN } from './katalog'

// Prüfseite und Admin laden jedes Thema einzeln; das Ergebnis muss dem Gesamtkatalog entsprechen.
const [parteienDatei] = alsDateien(import.meta.glob('../../daten/parteien.json', { eager: true, import: 'default' }))
const gesamt = ladeKatalog(parteienDatei, alsDateien(import.meta.glob('../../daten/themen/*.json', { eager: true, import: 'default' })))

describe('Datenkatalog je Thema', () => {
  it('der Index nennt jedes Thema mit den IDs seiner Prüfeinheiten', () => {
    expect(THEMEN.map((t) => t.id)).toEqual(gesamt.themen.map((t) => t.id))
    for (const t of THEMEN) expect(t.einheiten).toEqual(pruefEinheiten(gesamt, t.id).map((e) => e.id))
  })

  it('ein einzeln geladenes Thema ergibt dieselben Prüfeinheiten wie der Gesamtkatalog', async () => {
    for (const t of THEMEN) {
      const katalog = await ladeThema(t.id)
      expect(pruefEinheiten(katalog, t.id)).toEqual(pruefEinheiten(gesamt, t.id))
      expect(katalog.ursachen).toEqual(gesamt.ursachen.filter((u) => u.thema_id === t.id))
    }
  })

  it('ein unbekanntes Thema wird abgelehnt', async () => {
    await expect(ladeThema(999)).rejects.toThrow('Thema 999')
  })
})
