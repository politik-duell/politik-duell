// Vergleichslauf Programmkatalog (docs/plan-programmkatalog.md): Programmtext in Absätze und Sätze mit fester ID zerlegen
// und in Blöcke für den Agenten programm-katalog schreiben. Kein Modell, rein mechanisch.
// Aufruf: npm run -s katalog:absaetze -- <Name> <Programm-URL> [Zeichen je Block, Standard 30000]
// Ausgabe: .cache/katalog/<Name>/absaetze.json und bloecke/NN.md
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type Satz = { id: string; text: string }
export type Absatz = { id: string; seite: number; saetze: Satz[] }

const [name, url, groesse = '30000'] = process.argv.slice(2)
if (!name || !url) {
  console.error('Aufruf: npm run -s katalog:absaetze -- <Name> <Programm-URL> [Zeichen je Block]')
  process.exit(1)
}

const texte = '.cache/texte'
const datei = readdirSync(texte).find((f) => JSON.parse(readFileSync(join(texte, f), 'utf8')).url === url)
if (!datei) {
  console.error(`NICHT GELADEN: ${url} (npm run programme:texte)`)
  process.exit(1)
}
const seiten: string[] = JSON.parse(readFileSync(join(texte, datei), 'utf8')).seiten

const absaetze: Absatz[] = []
let nr = 0
seiten.forEach((roh, i) => {
  const zeilen = roh.split('\n').map((z) => z.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const laengste = Math.max(1, ...zeilen.map((z) => z.length))
  // Absatzgrenze: Zeile endet mit Satzende und ist deutlich kürzer als die längste Zeile der Seite.
  const gruppen: string[][] = [[]]
  for (const z of zeilen) {
    gruppen[gruppen.length - 1].push(z)
    if (/[.!?:]$/.test(z) && z.length < laengste * 0.75) gruppen.push([])
  }
  for (const g of gruppen.filter((g) => g.length)) {
    // Silbentrennung zusammenziehen: „Rahmen-“ + „bedingungen“, auch „signifi -“ + „kant“.
    let text = ''
    for (const z of g) {
      if (/\s?-$/.test(text) && /^[a-zäöüß]/.test(z)) text = text.replace(/\s?-$/, '') + z
      else text += (text ? ' ' : '') + z
    }
    const teile = text.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„"(•–-])/).map((s) => s.trim()).filter(Boolean)
    nr++
    const id = 'A' + String(nr).padStart(4, '0')
    absaetze.push({ id, seite: i + 1, saetze: teile.map((t, k) => ({ id: `${id}.${k + 1}`, text: t })) })
  }
})

const ordner = join('.cache/katalog', name)
mkdirSync(join(ordner, 'bloecke'), { recursive: true })
mkdirSync(join(ordner, 'antworten'), { recursive: true })
writeFileSync(join(ordner, 'absaetze.json'), JSON.stringify({ name, url, datei, absaetze }, null, 1))

// Blöcke: ganze Seiten, bis die Zeichengrenze erreicht ist.
const bloecke: string[] = []
let block = ''
let seite = 0
for (const a of absaetze) {
  if (a.seite !== seite) {
    if (block.length > Number(groesse)) { bloecke.push(block); block = '' }
    seite = a.seite
    block += `\n## Seite ${seite}\n`
  }
  block += `[${a.id}] ` + a.saetze.map((s, k) => `(${k + 1}) ${s.text}`).join(' ') + '\n'
}
if (block) bloecke.push(block)
bloecke.forEach((b, i) => {
  const ids = [...b.matchAll(/\[(A\d{4})\]/g)].map((m) => m[1])
  writeFileSync(join(ordner, 'bloecke', `${String(i + 1).padStart(2, '0')}.md`),
    `# ${name} – Block ${i + 1} von ${bloecke.length} (Absätze ${ids[0]}–${ids[ids.length - 1]})\n${b}`)
})
console.log(`${name}: ${seiten.length} Seiten, ${absaetze.length} Absätze, ${absaetze.reduce((s, a) => s + a.saetze.length, 0)} Sätze, ${bloecke.length} Blöcke → ${ordner}/bloecke/`)
