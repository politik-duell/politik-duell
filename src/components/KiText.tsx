import type { ReactNode } from 'react'
import { KI_ERZEUGT } from './kiKennzeichnung'

// Kennzeichnung von KI-Text (EU AI Act, Art. 50 Abs. 1 und 2; docs/ki-verordnung.md):
// sichtbar mit der Marke „KI“, maschinenlesbar mit dem Attribut `data-ki-erzeugt`.
// Feste Sätze des Spiels (nicht von der KI formuliert) tragen nur die sichtbare Marke,
// weil sie Teil des Gesprächs mit dem KI-System sind, aber nicht das Attribut.

/** Sichtbare Marke „KI“ – für Screenreader als „KI:“ vorgelesen. */
export function KiMarke() {
  return (
    <>
      <span className="ki-marke" aria-hidden="true">
        KI
      </span>
      <span className="sr-only">KI: </span>
    </>
  )
}

/** Sprechblase der KI im Gespräch. `erzeugt`: Text stammt von der KI (sonst fester Satz des Spiels). */
export function KiBlase({ erzeugt, className, children }: { erzeugt: boolean; className?: string; children: ReactNode }) {
  return (
    <p className={`blase blase-ki${className ? ` ${className}` : ''}`} {...(erzeugt ? KI_ERZEUGT : {})}>
      <KiMarke />
      {children}
    </p>
  )
}
