// Erzeugt beim Bauen von scripts/vite-pruef-index.ts.
declare module 'virtual:pruef-index' {
  export const PRUEF_INDEX: {
    id: number
    name: string
    einheiten: number[]
    kennzahlen: import('./admin/katalogAnsicht.ts').KatalogKennzahlen
  }[]
}
