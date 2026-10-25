// Auswertung vor der Regel „gleichauf“ (docs/plan-duell-regeln.md): Wie oft würde aus einem Sieg ein
// Gleichstand, wenn eine Bewertungsstufe den Abstand schließt – und trifft das alle Parteien ähnlich?
// Gerechnet über alle Themen, je Einzelursache und je Symptomgruppe, für alle Parteipaare, ohne Rolle,
// im Bund und in den Ländern mit Landesprogrammen (dort nur Ursachensätze mit einer Landesursache).
// Mit KI-Entwürfen (Stand der Testphase), weil noch nichts geprüft ist.
// Eine Stufe gilt je Bewertungsteil: Instrument (gilt für alle Parteien, die es haben) oder Maßnahme ohne Instrument.
// Variante A: eine Stufe höher bei einem Teil der unterlegenen Partei.
// Variante B: wie A, oder eine Stufe niedriger bei einem Teil der führenden Partei.
// Aufruf: node --experimental-strip-types scripts/gleichauf-auswertung.ts
import { spielbareAbdeckung, spielbareLandesprogramme, spielbareMassnahmen } from '../src/data/katalog.ts'
import { bewertePartei, type Ebenen } from '../supabase/functions/_shared/bewertung.ts'
import type { Massnahme, Partei } from '../supabase/functions/_shared/typen.ts'
import { pruefeDatenordner } from './katalog-laden.ts'

const { katalog: k } = pruefeDatenordner()
const abdeckung = spielbareAbdeckung(k, true)
const alleMassnahmen = spielbareMassnahmen(k, true)
const landesprogramme = spielbareLandesprogramme(k)
const parteien: Partei[] = k.parteien
const laender = [...new Set(landesprogramme.map((p) => p.land))].sort()

const teil = (m: Massnahme) => (m.instrument_id != null ? `i${m.instrument_id}` : `m${m.id}`)
const stufe = (w: number, d: number) => Math.min(3, Math.max(0, w + d)) as Massnahme['wirksamkeit']

/** Alle Fassungen der Maßnahmen, in denen ein Teil der Partei eine Stufe anders bewertet ist. */
function varianten(massnahmen: Massnahme[], relevant: Massnahme[], richtung: 1 | -1): Massnahme[][] {
  const out: Massnahme[][] = []
  for (const t of new Set(relevant.map(teil)))
    for (const feld of ['wirksamkeit', 'umsetzbarkeit'] as const) {
      const neu = massnahmen.map((m) => (teil(m) === t ? { ...m, [feld]: stufe(m[feld], richtung) } : m))
      if (neu.some((m, i) => m[feld] !== massnahmen[i][feld])) out.push(neu)
    }
  return out
}

interface Zaehler { siege: number; A: number; B: number }
const jePartei = new Map(parteien.map((p) => [p.kurzname, { siege: 0, sA: 0, sB: 0, niederlagen: 0, nA: 0, nB: 0 }]))
const jeThema = new Map<string, Zaehler>()
const schwellen = { 'Abstand ≤ 1': (f: number, u: number) => f - u <= 1, 'Abstand ≤ 2': (f: number, u: number) => f - u <= 2, 'Abstand ≤ 10 %': (f: number, u: number) => f - u <= 0.1 * f, 'Abstand ≤ 20 %': (f: number, u: number) => f - u <= 0.2 * f }
const jeSchwelle = new Map(Object.keys(schwellen).map((n) => [n, 0]))
const gesamt: Zaehler & { gleich: number; sätze: number; besteVorher: number; besteA: number; besteB: number; besteRunden: number } =
  { siege: 0, A: 0, B: 0, gleich: 0, sätze: 0, besteVorher: 0, besteA: 0, besteB: 0, besteRunden: 0 }

for (const thema of k.themen) {
  const massnahmen = alleMassnahmen.filter((m) => m.thema_id === thema.id)
  const ursachen = k.ursachen.filter((u) => u.thema_id === thema.id)
  const saetze = [...ursachen.map((u) => [u.id]), ...(thema.symptome ?? []).map((s) => s.ursachen_ids)]
  for (const land of [null, ...laender]) {
    for (const ids of saetze) {
      if (land && !ids.some((id) => ursachen.find((u) => u.id === id)?.ebene === 'land')) continue
      const ebenen: Ebenen = { land, ursachen: k.ursachen, landesprogramme }
      const werte = (p: Partei, ms: Massnahme[]) => bewertePartei(p, thema.id, ids, null, ms, abdeckung, ebenen)
      const basis = parteien.map((p) => werte(p, massnahmen)).filter((e) => e.abdeckung)
      if (basis.length < 2) continue
      gesamt.sätze++
      // Relevante Maßnahmen einer Partei: die, die an einer der Ursachen ansetzen (aus dem passenden Programm).
      const relevant = (p: Partei) => massnahmen.filter((m) => m.partei_id === p.id && m.ursachen_ids.some((id) => ids.includes(id)))
      const punkte = (p: Partei, ms: Massnahme[]) => werte(p, ms).punkte

      // „Beste Lösung insgesamt“: Wie viele Parteien liegen gleichauf mit der besten?
      const max = Math.max(...basis.map((e) => e.punkte))
      if (max > 0) {
        gesamt.besteRunden++
        const beste = basis.filter((e) => e.punkte === max)
        gesamt.besteVorher += beste.length
        let a = beste.length, b = beste.length
        for (const e of basis.filter((x) => x.punkte < max)) {
          const hoch = varianten(massnahmen, relevant(e.partei), 1).some((ms) => punkte(e.partei, ms) >= Math.max(...basis.map((x) => punkte(x.partei, ms))))
          const runter = hoch || beste.some((f) => varianten(massnahmen, relevant(f.partei), -1)
            .some((ms) => punkte(e.partei, ms) >= Math.max(...basis.map((x) => punkte(x.partei, ms)))))
          if (hoch) a++
          if (runter) b++
        }
        gesamt.besteA += a
        gesamt.besteB += b
      }

      for (let i = 0; i < basis.length; i++)
        for (let j = i + 1; j < basis.length; j++) {
          const [x, y] = [basis[i], basis[j]]
          if (x.punkte === y.punkte) { if (x.punkte > 0) gesamt.gleich++; continue }
          const [f, u] = x.punkte > y.punkte ? [x, y] : [y, x]
          const schliesst = (ms: Massnahme[]) => punkte(u.partei, ms) >= punkte(f.partei, ms)
          const a = varianten(massnahmen, relevant(u.partei), 1).some(schliesst)
          const b = a || varianten(massnahmen, relevant(f.partei), -1).some(schliesst)
          gesamt.siege++
          for (const [n, pruef] of Object.entries(schwellen)) if (pruef(f.punkte, u.punkte)) jeSchwelle.set(n, jeSchwelle.get(n)! + 1)
          if (a) gesamt.A++
          if (b) gesamt.B++
          const z = jeThema.get(thema.name) ?? { siege: 0, A: 0, B: 0 }
          z.siege++; if (a) z.A++; if (b) z.B++
          jeThema.set(thema.name, z)
          const pf = jePartei.get(f.partei.kurzname)!, pu = jePartei.get(u.partei.kurzname)!
          pf.siege++; pu.niederlagen++
          if (a) { pf.sA++; pu.nA++ }
          if (b) { pf.sB++; pu.nB++ }
        }
    }
  }
}

const pz = (n: number, von: number) => (von ? `${Math.round((100 * n) / von)} %` : '–')
console.log(`Ursachensätze mit mind. zwei erfassten Parteien: ${gesamt.sätze} (Bund und ${laender.join(', ')})`)
console.log(`Paarvergleiche mit Sieger: ${gesamt.siege} · schon heute gleich (über 0): ${gesamt.gleich}`)
console.log(`→ gleichauf mit Variante A: ${gesamt.A} (${pz(gesamt.A, gesamt.siege)}) · Variante B: ${gesamt.B} (${pz(gesamt.B, gesamt.siege)})`)
console.log(`Zum Vergleich, feste Schwellen: ${[...jeSchwelle].map(([n, z]) => `${n}: ${z} (${pz(z, gesamt.siege)})`).join(' · ')}`)
console.log(`„Beste Lösung insgesamt“, Parteien je Runde im Schnitt: heute ${(gesamt.besteVorher / gesamt.besteRunden).toFixed(2)} · A ${(gesamt.besteA / gesamt.besteRunden).toFixed(2)} · B ${(gesamt.besteB / gesamt.besteRunden).toFixed(2)}`)
console.log('\nJe Partei: Siege → davon gleichauf A / B · Niederlagen → davon gleichauf A / B')
for (const [name, z] of jePartei)
  console.log(`${name.padEnd(8)} Siege ${String(z.siege).padStart(4)} → A ${pz(z.sA, z.siege).padStart(5)} / B ${pz(z.sB, z.siege).padStart(5)} · Niederlagen ${String(z.niederlagen).padStart(4)} → A ${pz(z.nA, z.niederlagen).padStart(5)} / B ${pz(z.nB, z.niederlagen).padStart(5)}`)
if (process.argv.includes('--themen')) {
  console.log('\nJe Thema: Siege → gleichauf A / B')
  for (const [name, z] of [...jeThema].sort((a, b) => b[1].A / b[1].siege - a[1].A / a[1].siege))
    console.log(`${name.slice(0, 45).padEnd(46)} ${String(z.siege).padStart(4)} → ${pz(z.A, z.siege).padStart(5)} / ${pz(z.B, z.siege).padStart(5)}`)
}
