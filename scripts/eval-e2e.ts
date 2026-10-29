// End-to-End-Eval der Skills: lässt /thema-erfassen headless (`claude -p`) in einer Arbeitskopie laufen, in der die
// Bundes-Erfassung der Themen fehlt, und vergleicht das Ergebnis mit den Goldfällen in evals/ende-zu-ende/faelle/.
// Ereignisse mit Zeitstempel landen in .cache/eval-e2e/<variante>/<lauf>/ereignisse.jsonl (Ablauf, Agenten, Kosten).
//
//   npm run -s eval:e2e -- pruefen                                   – Goldfälle gegen den Katalog prüfen (auch in der CI)
//   npm run -s eval:e2e -- gold <Themen-ID> … [--ueberschreiben]     – Goldfälle aus Themendatei und Archiv erzeugen
//   npm run -s eval:e2e -- lauf --variante <Name> [--wiederholungen N] [--ref <Commit>] [--themen 30,33] [--behalten] [--trocken]
//                              [--rechte <Modus>] [--claude <weitere Argumente für claude>]
//                                                                   – echte Läufe (kostet Tokens, nicht in der CI)
//   npm run -s eval:e2e -- auswerten <Variante>                       – Bericht über alle Läufe einer Variante
//   npm run -s eval:e2e -- vergleichen <Variante A> <Variante B>       – gekippte Fälle, Fundquote, Kosten
import { spawn, execFileSync } from 'node:child_process'
import { createWriteStream, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { formatiere } from './pruefung-export.ts'
import {
  type Ereignis, type Fall, type GoldStelle, type LaufErgebnis, type LaufProgramm, type LaufStelle,
  beurteileFall, bericht, bilanz, gekippt, gleicheStelle, leseAblauf, pruefeFaelle,
} from './eval-e2e/auswertung.ts'

const FAELLE = 'evals/ende-zu-ende/faelle'
const CACHE = '.cache/eval-e2e'

type Json = Record<string, any>

function option(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

const themaDatei = (wurzel: string, id: number) => {
  const datei = readdirSync(join(wurzel, 'daten/themen')).find((f) => f.startsWith(String(id).padStart(2, '0') + '-'))
  if (!datei) throw new Error(`Thema ${id} nicht in ${wurzel}/daten/themen`)
  return join(wurzel, 'daten/themen', datei)
}
const leseJson = (pfad: string) => JSON.parse(readFileSync(pfad, 'utf8'))
const seiteAus = (url: string) => Number(url.match(/#page=(\d+)/)?.[1])
const parteien = (): Json[] => leseJson('daten/parteien.json').parteien

function leseFaelle(): Fall[] {
  if (!existsSync(FAELLE)) return []
  return readdirSync(FAELLE).filter((f) => f.endsWith('.json')).sort().map((f) => leseJson(join(FAELLE, f)))
}

/** Maßnahmen eines Bundesprogramms in einer Themendatei, mit den Werten ihres Instruments. */
function laufProgramm(thema: Json, partei: number): LaufProgramm {
  const eintrag = (thema.abdeckung as Json[]).find((a) => a.partei_id === partei && !a.land)
  if (!eintrag) return { erfasst: false }
  const instrumente = new Map((thema.instrumente as Json[]).map((i) => [i.id, i]))
  const stellen: LaufStelle[] = (eintrag.massnahmen ?? []).map((m: Json) => ({
    seite: seiteAus(m.beleg_programm_url),
    zitat: m.zitat,
    ursachen_ids: m.ursachen_ids,
    wirksamkeit: instrumente.get(m.instrument)?.wirksamkeit,
    umsetzbarkeit: instrumente.get(m.instrument)?.umsetzbarkeit,
  }))
  return { erfasst: true, stellen }
}

// ---------- pruefen ----------

function pruefen(): number {
  const faelle = leseFaelle()
  const themen = readdirSync('daten/themen').map((f) => leseJson(join('daten/themen', f)))
    .map((t) => ({ id: t.id as number, ursachen: (t.ursachen as Json[]).map((u) => u.id as number) }))
  const fehler = pruefeFaelle(faelle, themen, parteien().map((p) => p.id))
  for (const f of fehler) console.error(`Fehler:  ${f}`)
  const ungeprueft = faelle.filter((f) => !f.geprueft).length
  console.log(`${faelle.length} Goldfälle, ${fehler.length} Fehler${ungeprueft ? `, ${ungeprueft} noch ohne menschliche Durchsicht` : ''}`)
  return fehler.length ? 1 : 0
}

// ---------- gold ----------

/** Verworfene Bundes-Stellen aus dem jüngsten Archiv eines Themas: erfasst, aber laut Bewertung ohne Parteinamen ohne Ursache. */
function verworfeneStellen(themaId: number): { archiv: string; stellen: (LaufStelle & { partei_id: number })[] } | null {
  const ordner = join('daten/protokolle', String(themaId))
  if (!existsSync(ordner)) return null
  const archiv = readdirSync(ordner).filter((d) => d.includes('bund') && existsSync(join(ordner, d, 'bewertung.json'))).sort().at(-1)
  if (!archiv) return null
  const e = leseJson(join(ordner, archiv, 'erfassung.json'))
  const k = leseJson(join(ordner, archiv, 'kennungen.json'))
  const b = leseJson(join(ordner, archiv, 'bewertung.json'))
  const stellen = []
  for (const z of b.zuordnung as Json[]) {
    if (z.ursachen?.length) continue
    const kennung = (k.kennungen as Json[]).find((x) => x.kennung === z.kennung)
    if (!kennung) continue
    const p = e.programme[kennung.programm]
    const m = p?.massnahmen[kennung.massnahme]
    if (!m || p.land) continue
    stellen.push({ partei_id: p.partei_id, seite: m.seite, zitat: m.zitat, ursachen_ids: m.ursachen_ids })
  }
  return { archiv, stellen }
}

const kurz = (s: string) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function gold(themen: number[], ueberschreiben: boolean) {
  mkdirSync(FAELLE, { recursive: true })
  for (const id of themen) {
    const datei = themaDatei('.', id)
    const thema = leseJson(datei)
    const instrumente = new Map((thema.instrumente as Json[]).map((i) => [i.id, i]))
    const verworfen = verworfeneStellen(id)
    for (const a of (thema.abdeckung as Json[]).filter((x) => !x.land)) {
      const partei = parteien().find((p) => p.id === a.partei_id)!
      const fallId = `${id}-${kurz(partei.kurzname)}`
      const pfad = join(FAELLE, `${fallId}.json`)
      if (existsSync(pfad) && !ueberschreiben) {
        console.log(`${pfad}: vorhanden, bleibt (--ueberschreiben ersetzt auch geprüfte Fälle)`)
        continue
      }
      const erwartet: GoldStelle[] = (a.massnahmen ?? []).map((m: Json) => ({
        seite: seiteAus(m.beleg_programm_url),
        zitat: m.zitat,
        ursachen_ids: m.ursachen_ids,
        wirksamkeit: instrumente.get(m.instrument)?.wirksamkeit,
        umsetzbarkeit: instrumente.get(m.instrument)?.umsetzbarkeit,
      }))
      const verboten = (verworfen?.stellen ?? [])
        .filter((s) => s.partei_id === a.partei_id && !erwartet.some((g) => gleicheStelle(g, s)))
        .map((s) => ({ seite: s.seite, zitat: s.zitat, grund: `Bewertung ohne Parteinamen (${verworfen!.archiv}): setzt an keiner Ursache an` }))
      const fall: Fall = {
        id: fallId,
        skill: 'thema-erfassen',
        thema_id: id,
        partei_id: a.partei_id,
        land: null,
        herkunft: `${datei} (Stand ${a.massnahmen?.[0]?.stand ?? a.keine_massnahme?.stand ?? '?'}, KI-Entwurf)` +
          (verworfen ? `; verboten: verworfene Stellen aus daten/protokolle/${id}/${verworfen.archiv}` : ''),
        geprueft: null,
        erwartet,
        verboten,
        ...(a.keine_massnahme ? { keine_massnahme: true } : {}),
      }
      writeFileSync(pfad, formatiere(fall) + '\n')
      console.log(`${pfad}: ${erwartet.length} erwartet, ${verboten.length} verboten${a.keine_massnahme ? ', keine Maßnahme' : ''}`)
    }
  }
}

// ---------- lauf ----------

const EVAL_HINWEIS = `Dies ist ein Eval-Lauf in einer Arbeitskopie (npm run eval:e2e). Niemand antwortet auf Rückfragen: \
Entscheide wie im Skill beschrieben ohne die Betreiberin; nicht erreichbare Programme bleiben „noch nicht erfasst“. \
Am Ende nur committen – kein Push, kein Pull Request.`

/** Arbeitskopie ohne die Bundes-Erfassung der Themen: Bundes-Einträge und Instrumente ohne verbleibende Maßnahme entfernt. */
function vorbereiten(repo: string, ref: string, themen: number[]) {
  execFileSync('git', ['worktree', 'add', '--detach', repo, ref], { stdio: 'ignore' })
  for (const id of themen) {
    const datei = themaDatei(repo, id)
    const thema = leseJson(datei)
    thema.abdeckung = (thema.abdeckung as Json[]).filter((a) => a.land)
    const genutzt = new Set(thema.abdeckung.flatMap((a: Json) => (a.massnahmen ?? []).map((m: Json) => m.instrument)))
    thema.instrumente = (thema.instrumente as Json[]).filter((i) => genutzt.has(i.id))
    writeFileSync(datei, formatiere(thema) + '\n')
  }
  // Abhängigkeiten und geladene Programme teilen statt neu laden.
  symlinkSync(resolve('node_modules'), join(repo, 'node_modules'))
  mkdirSync(join(repo, '.cache'), { recursive: true })
  for (const d of ['programme', 'texte']) if (existsSync(join('.cache', d))) symlinkSync(resolve('.cache', d), join(repo, '.cache', d))
  const git = (...a: string[]) => execFileSync('git', ['-C', repo, ...a], { stdio: 'ignore' })
  git('add', 'daten/themen')
  git('-c', 'user.name=eval', '-c', 'user.email=eval@localhost', 'commit', '-m', `Eval: Bundes-Erfassung der Themen ${themen.join(', ')} entfernt`)
}

function starteClaude(repo: string, themen: number[], protokoll: string, zusatz: string[]): Promise<number> {
  const args = [
    '-p', `/thema-erfassen ${themen.join(' ')} --bund`,
    '--output-format', 'stream-json', '--verbose',
    '--permission-mode', option('rechte') ?? 'bypassPermissions',
    '--append-system-prompt', EVAL_HINWEIS,
    '--disallowedTools', 'Bash(git push:*)', 'mcp__github__create_pull_request',
    ...zusatz,
  ]
  const start = Date.now()
  const aus = createWriteStream(protokoll)
  const kind = spawn('claude', args, { cwd: repo, stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, IS_SANDBOX: process.env.IS_SANDBOX ?? '1' } })
  let rest = ''
  kind.stdout.on('data', (d: Buffer) => {
    const zeilen = (rest + d.toString()).split('\n')
    rest = zeilen.pop()!
    for (const z of zeilen) {
      if (!z.trim()) continue
      try {
        const e = JSON.parse(z)
        aus.write(JSON.stringify({ t: Date.now() - start, ...e }) + '\n')
        if (e.type === 'assistant' && !e.parent_tool_use_id)
          for (const c of e.message?.content ?? []) if (c.type === 'tool_use') process.stdout.write(`  ${Math.round((Date.now() - start) / 1000)} s  ${c.name} ${String(c.input?.command ?? c.input?.subagent_type ?? '').slice(0, 70)}\n`)
      } catch {
        aus.write(JSON.stringify({ t: Date.now() - start, type: 'roh', text: z }) + '\n')
      }
    }
  })
  return new Promise((ok) => kind.on('close', (code) => aus.end(() => ok(code ?? 1))))
}

function auswertenLauf(ordner: string, repo: string, faelle: Fall[]): LaufErgebnis {
  const themen = [...new Set(faelle.map((f) => f.thema_id))]
  const dateien = new Map(themen.map((id) => [id, leseJson(themaDatei(repo, id))]))
  for (const [id, t] of dateien) writeFileSync(join(ordner, `thema-${id}.json`), formatiere(t) + '\n')
  for (const id of themen) {
    const e = join(repo, '.cache/entwurf', String(id))
    if (existsSync(e)) cpSync(e, join(ordner, 'entwurf', String(id)), { recursive: true, dereference: false })
  }
  return auswertenOrdner(ordner, faelle)
}

function auswertenOrdner(ordner: string, faelle: Fall[]): LaufErgebnis {
  const ereignisse: Ereignis[] = readFileSync(join(ordner, 'ereignisse.jsonl'), 'utf8').split('\n').filter(Boolean).map((z) => JSON.parse(z))
  const urteile = faelle.map((f) => {
    const pfad = join(ordner, `thema-${f.thema_id}.json`)
    return beurteileFall(f, existsSync(pfad) ? laufProgramm(leseJson(pfad), f.partei_id) : { erfasst: false })
  })
  const ergebnis: LaufErgebnis = { lauf: ordner.split('/').slice(-2).join('/'), faelle: urteile, ablauf: leseAblauf(ereignisse) }
  writeFileSync(join(ordner, 'ergebnis.json'), JSON.stringify(ergebnis, null, 2) + '\n')
  return ergebnis
}

async function lauf() {
  const variante = option('variante')
  if (!variante || !/^[a-z0-9-]+$/.test(variante)) throw new Error('--variante <name> fehlt (Kleinbuchstaben, Ziffern, Bindestrich)')
  const ref = option('ref') ?? 'HEAD'
  const wiederholungen = Number(option('wiederholungen') ?? 1)
  const nur = option('themen')?.split(',').map(Number)
  const faelle = leseFaelle().filter((f) => !nur || nur.includes(f.thema_id))
  if (!faelle.length) throw new Error('Keine Goldfälle – erst `eval:e2e -- gold <Themen-ID>`')
  const themen = [...new Set(faelle.map((f) => f.thema_id))].sort((a, b) => a - b)
  const i = process.argv.indexOf('--claude')
  const zusatz = i >= 0 ? process.argv.slice(i + 1) : []
  const basis = join(CACHE, variante)
  mkdirSync(basis, { recursive: true })
  for (let n = 0; n < wiederholungen; n++) {
    const nr = String(readdirSync(basis).filter((d) => /^\d+$/.test(d)).length + 1).padStart(2, '0')
    const ordner = join(basis, nr)
    const repo = resolve(ordner, 'repo')
    mkdirSync(ordner)
    writeFileSync(join(ordner, 'lauf.json'), JSON.stringify({ variante, ref: execFileSync('git', ['rev-parse', ref]).toString().trim(), themen, start: new Date().toISOString(), claude: zusatz }, null, 2) + '\n')
    console.log(`Lauf ${variante}/${nr}: Themen ${themen.join(', ')} (Bund), Arbeitskopie ${repo}`)
    vorbereiten(repo, ref, themen)
    if (process.argv.includes('--trocken')) {
      // Nur die Arbeitskopie prüfen: gültiger Katalog, Ursachen weiter freigegeben – ohne `claude`.
      const pruefe = (...a: string[]) => execFileSync('npm', ['run', '-s', ...a], { cwd: repo, stdio: 'inherit' })
      try {
        pruefe('daten:pruefen')
        for (const id of themen) pruefe('ursachen:freigegeben', '--', String(id), '--gegen', 'HEAD')
        console.log('  Arbeitskopie in Ordnung')
      } finally {
        execFileSync('git', ['worktree', 'remove', '--force', repo], { stdio: 'ignore' })
        rmSync(ordner, { recursive: true })
      }
      return
    }
    const code = await starteClaude(repo, themen, join(ordner, 'ereignisse.jsonl'), zusatz)
    const e = auswertenLauf(ordner, repo, faelle)
    console.log(`  beendet (Code ${code}): ${e.faelle.filter((f) => f.status === 'bestanden').length} von ${e.faelle.length} Fällen bestanden, ` +
      `${e.ablauf.kosten_usd?.toFixed(2) ?? '?'} USD, ${Math.round(e.ablauf.dauer_s / 60)} min`)
    if (!process.argv.includes('--behalten')) execFileSync('git', ['worktree', 'remove', '--force', repo], { stdio: 'ignore' })
  }
  console.log(`→ npm run -s eval:e2e -- auswerten ${variante}`)
}

// ---------- auswerten, vergleichen ----------

function laeufeDerVariante(variante: string): LaufErgebnis[] {
  const basis = join(CACHE, variante)
  if (!existsSync(basis)) throw new Error(`Keine Läufe unter ${basis}`)
  const faelle = leseFaelle()
  // Neu auswerten, damit geänderte Goldfälle auch für alte Läufe gelten.
  return readdirSync(basis).filter((d) => /^\d+$/.test(d) && existsSync(join(basis, d, 'ereignisse.jsonl'))).sort()
    .map((d) => {
      const ordner = join(basis, d)
      const themen: number[] = leseJson(join(ordner, 'lauf.json')).themen
      return auswertenOrdner(ordner, faelle.filter((f) => themen.includes(f.thema_id)))
    })
}

function auswerten(variante: string) {
  const text = bericht(variante, laeufeDerVariante(variante))
  writeFileSync(join(CACHE, variante, 'bericht.md'), text)
  console.log(text.split('\n').slice(0, 8).join('\n') + `\n→ ${CACHE}/${variante}/bericht.md`)
}

function vergleichen(a: string, b: string) {
  const la = laeufeDerVariante(a)
  const lb = laeufeDerVariante(b)
  const ba = bilanz(la)
  const bb = bilanz(lb)
  const { verloren, gewonnen } = gekippt(ba, bb)
  const mittel = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)
  const kosten = (l: LaufErgebnis[]) => mittel(l.map((x) => x.ablauf.kosten_usd ?? 0)).toFixed(2)
  const dauer = (l: LaufErgebnis[]) => Math.round(mittel(l.map((x) => x.ablauf.dauer_s)) / 60)
  const fund = (x: typeof ba) => Math.round(mittel(x.filter((y) => y.gewertet).map((y) => y.fundquote)) * 100)
  const text = `## ${a} gegen ${b}

| | ${a} | ${b} |
|---|---|---|
| Läufe | ${la.length} | ${lb.length} |
| Fundquote | ${fund(ba)} % | ${fund(bb)} % |
| Kosten je Lauf | ${kosten(la)} USD | ${kosten(lb)} USD |
| Dauer je Lauf | ${dauer(la)} min | ${dauer(lb)} min |

- **Verloren** (in ${a} mehrheitlich bestanden, in ${b} nicht): ${verloren.join(', ') || 'keine'}
- **Gewonnen**: ${gewonnen.join(', ') || 'keine'}

| Fall | ${a} | ${b} |
|---|---|---|
${ba.map((x) => { const y = bb.find((z) => z.id === x.id); return `| ${x.id} | ${x.bestanden}/${x.gewertet} | ${y ? `${y.bestanden}/${y.gewertet}` : '–'} |` }).join('\n')}
`
  const pfad = join(CACHE, `vergleich-${a}-${b}.md`)
  writeFileSync(pfad, text)
  console.log(text.split('\n').slice(0, 11).join('\n') + `\n→ ${pfad}`)
}

const [befehl, ...rest] = process.argv.slice(2)
try {
  if (befehl === 'pruefen') process.exit(pruefen())
  else if (befehl === 'gold') gold(rest.filter((x) => /^\d+$/.test(x)).map(Number), rest.includes('--ueberschreiben'))
  else if (befehl === 'lauf') await lauf()
  else if (befehl === 'auswerten' && rest[0]) auswerten(rest[0])
  else if (befehl === 'vergleichen' && rest[1]) vergleichen(rest[0], rest[1])
  else {
    console.error('Aufruf: npm run -s eval:e2e -- pruefen | gold <ID> … | lauf --variante <Name> … | auswerten <Variante> | vergleichen <A> <B>')
    process.exit(1)
  }
} catch (e) {
  console.error(`Fehler:  ${(e as Error).message}`)
  process.exit(1)
}
