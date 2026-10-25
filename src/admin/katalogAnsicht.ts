import { pruefEinheiten, type Katalog, type KatalogMassnahme, type KatalogUrsache, type Pruefeinheit } from '../data/katalog.ts'

// Admin → Katalog: Was im Datenkatalog (`daten/`) steht und wo es fehlt – je Thema die Ursachen mit ihren
// Lösungswegen, die Erfassung je Programm und der Prüfstand. Nur Programme der laufenden Wahlperiode.
// Reine Funktionen: Das Vite-Plugin (scripts/vite-pruef-index.ts) rechnet die Kennzahlen für alle Themen
// beim Bauen, die Seite den Baum eines Themas nach dem Laden.

/** Wie weit ein Programm zu einem Thema durchsucht ist (vgl. supabase/functions/_shared/bewertung.ts). */
export type Erfassung = 'massnahmen' | 'keine' | 'teilweise' | 'fehlt'

export interface Programmstand {
  erfassung: Erfassung
  /** Ganzer Eintrag von Menschen geprüft (zählt öffentlich). */
  geprueft: boolean
  /** Nicht ganz geprüft, aber jeder ungeprüfte Teil als KI-Entwurf gekennzeichnet (zählt in der Testphase). */
  ki_entwurf: boolean
}

export interface KatalogKennzahlen {
  ursachen: number
  /** Ursachen, für die kein Programm einen Lösungsweg hat. */
  ursachenOhneLoesungsweg: number
  /** Instrumente und einzelne Maßnahmen. */
  loesungswege: number
  massnahmen: number
  /** Maßnahmen, die noch nicht von Menschen geprüft sind. */
  ungeprueft: number
  /** Bundesprogramme, die zum Thema ganz durchsucht sind (davon geprüft). */
  bundErfasst: number
  bundGeprueft: number
  /** Landesprogramme mit Ursachen in Länderzuständigkeit, die noch nicht (ganz) durchsucht sind. */
  landOffen: number
  /** Freigabe der Ursachen: geprüft, nur KI-Freigabe (Testphase) oder kein Eintrag (ältere Themen). */
  freigabe: 'geprueft' | 'ki' | 'offen'
}

const gleichesLand = (a?: string | null, b?: string | null) => (a ?? null) === (b ?? null)

/** Ursachen, für die das Programm im Spiel zählt: beim Bund alle, im Land nur die in Länderzuständigkeit. */
const zustaendig = (k: Katalog, themaId: number, land: string | null) =>
  k.ursachen.filter((u) => u.thema_id === themaId && (land === null || u.ebene === 'land'))

export function programmstand(k: Katalog, themaId: number, parteiId: number, land: string | null): Programmstand {
  const a = k.abdeckung.find((x) => x.thema_id === themaId && x.partei_id === parteiId && gleichesLand(x.land, land) && x.aktuell)
  if (!a) return { erfassung: 'fehlt', geprueft: false, ki_entwurf: false }
  const luecke = a.durchsucht_fuer && zustaendig(k, themaId, land).some((u) => !a.durchsucht_fuer!.includes(u.id))
  return { erfassung: luecke ? 'teilweise' : a.art, geprueft: a.geprueft, ki_entwurf: a.ki_entwurf }
}

/** Landesprogramme der laufenden Wahlperiode, die es gibt (ohne „kein Programm“). */
export const aktuelleLandesprogramme = (k: Katalog) => k.landesprogramme.filter((p) => p.aktuell && p.url)

export interface Loesungsweg {
  einheit: Pruefeinheit
  /** Nur die Maßnahmen, die diese Ursache angehen. */
  massnahmen: KatalogMassnahme[]
  punkte: number
  /** Zahl der Bewertungen durch Prüfende (0 = Werte noch Entwurf). */
  bewertungen: number
}

export interface UrsacheImKatalog {
  ursache: KatalogUrsache
  /** Absteigend nach Punkten (Wirksamkeit × Umsetzbarkeit, ohne Rolle). */
  wege: Loesungsweg[]
}

export function ursachenBaum(k: Katalog, themaId: number): UrsacheImKatalog[] {
  const einheiten = pruefEinheiten(k, themaId)
  const bewertungen = (e: Pruefeinheit) =>
    (e.instrument ? k.instrumente.find((i) => i.id === e.id)?.bewertungen : e.massnahmen[0].bewertungen) ?? 0
  return k.ursachen
    .filter((u) => u.thema_id === themaId)
    .map((ursache) => ({
      ursache,
      wege: einheiten
        .map((einheit) => ({
          einheit,
          massnahmen: einheit.massnahmen.filter((m) => m.ursachen_ids.includes(ursache.id)),
          punkte: einheit.wirksamkeit * einheit.umsetzbarkeit,
          bewertungen: bewertungen(einheit),
        }))
        .filter((w) => w.massnahmen.length > 0)
        .sort((a, b) => b.punkte - a.punkte || a.einheit.id - b.einheit.id),
    }))
}

export function kennzahlen(k: Katalog, themaId: number): KatalogKennzahlen {
  const baum = ursachenBaum(k, themaId)
  const einheiten = pruefEinheiten(k, themaId)
  const massnahmen = einheiten.flatMap((e) => e.massnahmen)
  const bund = k.parteien.map((p) => programmstand(k, themaId, p.id, null))
  const ganz = (s: Programmstand) => s.erfassung === 'massnahmen' || s.erfassung === 'keine'
  const mitLand = baum.some((u) => u.ursache.ebene === 'land')
  const freigabe = k.themen.find((t) => t.id === themaId)?.freigabe
  return {
    ursachen: baum.length,
    ursachenOhneLoesungsweg: baum.filter((u) => u.wege.length === 0).length,
    loesungswege: einheiten.length,
    massnahmen: massnahmen.length,
    ungeprueft: massnahmen.filter((m) => !m.geprueft).length,
    bundErfasst: bund.filter(ganz).length,
    bundGeprueft: bund.filter((s) => ganz(s) && s.geprueft).length,
    landOffen: mitLand
      ? aktuelleLandesprogramme(k).filter((p) => !ganz(programmstand(k, themaId, p.partei_id, p.land))).length
      : 0,
    freigabe: !freigabe ? 'offen' : freigabe.art === 'ki' ? 'ki' : 'geprueft',
  }
}

/** Fehlt etwas: Ursache ohne Lösungsweg oder ein Programm, das noch nicht (ganz) durchsucht ist. */
export const hatLuecken = (z: KatalogKennzahlen, parteien: number) =>
  z.ursachenOhneLoesungsweg > 0 || z.bundErfasst < parteien || z.landOffen > 0

/** Noch nicht ganz von Menschen geprüft (ältere Themen ohne Freigabe-Eintrag zählen nicht dazu). */
export const hatEntwuerfe = (z: KatalogKennzahlen) => z.ungeprueft > 0 || z.freigabe === 'ki' || z.bundGeprueft < z.bundErfasst
