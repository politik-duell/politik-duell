// Vergleichslauf Programmkatalog: Findet der Katalog die schon erfassten Maßnahmen (Themen) und Positionen (Haltungen) wieder?
// Aufruf: npm run -s katalog:vergleich -- <Name> <Partei-ID> <Themen-ID> [<Themen-ID> …]
// Gleich heißt: Aussage auf derselben PDF-Seite ±1, die mindestens 60 % der Wörter des Zitats enthält
// (mehrere benachbarte Aussagen zusammen zählen, falls das Zitat über sie geht).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [name, parteiArg, ...themen] = process.argv.slice(2)
const partei = Number(parteiArg)
const ordner = join('.cache/katalog', name)
const { absaetze } = JSON.parse(readFileSync(join(ordner, 'absaetze.json'), 'utf8')) as
  { absaetze: { id: string; seite: number; saetze: { id: string; text: string }[] }[] }
const { aussagen, url } = JSON.parse(readFileSync(join(ordner, 'katalog.json'), 'utf8')) as
  { url: string; aussagen: { id: string; saetze: string[]; art: string; kurz: string; seite: number }[] }
const satzText = new Map(absaetze.flatMap((a) => a.saetze.map((s) => [s.id, s.text] as const)))
const satzSeite = new Map(absaetze.flatMap((a) => a.saetze.map((s) => [s.id, a.seite] as const)))
const norm = (t: string) => (t.replace(/\[…\]/g, ' ').toLowerCase().match(/[a-zäöüß0-9]+/g) ?? []).filter((w) => w.length > 2)

type Ref = { art: 'thema' | 'haltung'; quelle: string; zitat: string; seite: number; beschreibung: string }
const refs: Ref[] = []
const seiteAus = (u: string) => Number(u.match(/#page=(\d+)/)?.[1])
for (const t of themen) {
  const datei = readdirSync('daten/themen').find((f) => f.startsWith(t.padStart(2, '0') + '-'))!
  const thema = JSON.parse(readFileSync(join('daten/themen', datei), 'utf8'))
  for (const a of thema.abdeckung.filter((a: any) => a.partei_id === partei))
    for (const m of a.massnahmen ?? [])
      if (m.beleg_programm_url?.split('#')[0] === url)
        refs.push({ art: 'thema', quelle: `T${t}/M${m.id}`, zitat: m.zitat, seite: seiteAus(m.beleg_programm_url), beschreibung: m.beschreibung })
}
for (const f of readdirSync('daten/haltungen')) {
  const h = JSON.parse(readFileSync(join('daten/haltungen', f), 'utf8'))
  for (const p of h.positionen ?? [])
    if (p.partei_id === partei && p.zitat && p.beleg_programm_url?.split('#')[0] === url)
      refs.push({ art: 'haltung', quelle: `H${h.id}`, zitat: p.zitat, seite: seiteAus(p.beleg_programm_url), beschreibung: p.kurzfassung })
}

const zeilen: string[] = []
const zaehler = { thema: [0, 0, 0], haltung: [0, 0, 0] } // gefunden, davon Art passend, gesamt
const passend = { thema: ['zusage', 'ablehnung', 'bedingung'], haltung: ['zusage', 'ablehnung', 'bedingung', 'ziel', 'pruefauftrag', 'lage'] }
for (const r of refs) {
  const z = norm(r.zitat)
  const nahe = aussagen.filter((a) => a.saetze.some((s) => Math.abs((satzSeite.get(s) ?? 0) - r.seite) <= 1))
  // beste einzelne Aussage, sonst Vereinigung der Aussagen, die zusammen das Zitat abdecken
  const anteil = (ws: Set<string>) => z.filter((w) => ws.has(w)).length / Math.max(1, z.length)
  const bewertet = nahe.map((a) => ({ a, wert: anteil(new Set(norm(a.saetze.map((s) => satzText.get(s)).join(' ')))) }))
    .sort((x, y) => y.wert - x.wert)
  const treffer = bewertet.filter((b) => b.wert >= 0.25)
  const vereint = anteil(new Set(norm(treffer.flatMap((b) => b.a.saetze.map((s) => satzText.get(s))).join(' '))))
  const gefunden = (bewertet[0]?.wert ?? 0) >= 0.6 || vereint >= 0.6
  const arten = [...new Set(treffer.map((b) => b.a.art))]
  const artOk = arten.some((a) => passend[r.art].includes(a))
  const c = zaehler[r.art]; c[2]++; if (gefunden) { c[0]++; if (artOk) c[1]++ }
  zeilen.push(`| ${r.quelle} | S. ${r.seite} | ${gefunden ? 'ja' : '**nein**'} | ${Math.round(Math.max(bewertet[0]?.wert ?? 0, vereint) * 100)} % | ${arten.join(', ') || '–'} | ${treffer[0]?.a.kurz ?? '–'} |`)
}
const bericht = `## ${name} (Partei ${partei}), Themen ${themen.join(', ')}

Katalog: ${aussagen.length} Aussagen (${Object.entries(aussagen.reduce((m, a) => ({ ...m, [a.art]: (m[a.art] ?? 0) + 1 }), {} as Record<string, number>)).map(([a, n]) => `${a} ${n}`).join(', ')})

- Themen-Maßnahmen wiedergefunden: ${zaehler.thema[0]} von ${zaehler.thema[2]}, davon als Zusage/Ablehnung/Bedingung: ${zaehler.thema[1]}
- Haltungs-Positionen wiedergefunden: ${zaehler.haltung[0]} von ${zaehler.haltung[2]}

| Quelle | Seite | gefunden | Wortanteil | Art im Katalog | Kurzbeschreibung im Katalog |
|---|---|---|---|---|---|
${zeilen.join('\n')}
`
writeFileSync(join(ordner, 'vergleich.md'), bericht)
console.log(bericht.split('\n').slice(0, 6).join('\n') + `\n→ ${ordner}/vergleich.md`)
