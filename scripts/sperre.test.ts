import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// @ts-expect-error – Hook in reinem JavaScript (schneller Start), ohne Typdeklaration
import { pruefe, pruefeCopilot } from '../.claude/hooks/sperre.mjs'

const liste = JSON.parse(readFileSync(new URL('../daten/gesperrte-adressen.json', import.meta.url), 'utf8'))
const kontext = (phaseA = false) => ({ liste, programmHosts: ['cms.gruene.de', 'berlin-wird.de'], phaseA, wurzel: '/repo' })
const web = (url: string) => pruefe({ tool_name: 'WebFetch', tool_input: { url } }, kontext())

describe('Programmsperre (PreToolUse-Hook)', () => {
  it('sperrt Partei-, Fraktions-, Stiftungs- und Programmserver und das Repository', () => {
    expect(web('https://www.spd.de/x')).toMatch(/spd\.de ist gesperrt/)
    expect(web('https://spd-mv.de/uploads/a.pdf')).toMatch(/gesperrt/)
    expect(web('https://lichtenberg.afd.berlin/x.pdf')).toMatch(/gesperrt/)
    for (const host of ['cdulsa.de', 'spdsachsenanhalt.de', 'gruene-lsa.de', 'dielinke.berlin', 'die-linke-mv.de', 'st.bsw-vg.de']) expect(web(`https://${host}/p.pdf`)).toMatch(/gesperrt/)
    expect(web('https://berlin-wird.de/image/x.pdf')).toMatch(/berlin-wird\.de ist gesperrt/)
    expect(web('https://web.archive.org/web/2025id_/https%3A%2F%2Fwww.fdp.de%2Fx.pdf')).toMatch(/fdp\.de/)
    expect(web('https://library.fes.de/pdf-files/x.pdf')).toMatch(/fes\.de/)
    expect(web('https://raw.githubusercontent.com/politik-duell/politik-duell/main/daten/themen/02-miete.json')).toMatch(/Repository/)
    expect(web('https://politik-duell.de/#/stand')).toMatch(/gesperrt/)
  })

  it('lässt unabhängige Quellen durch', () => {
    for (const url of ['https://www.destatis.de/a', 'https://www.dji.de/b.pdf', 'https://www.iab.de/c', 'https://github.com/andere/repo', 'https://www.bundestag.de/d', 'https://www.linkedin.com/x', 'https://spdx.org/y', 'https://www.afdb.org/z'])
      expect(web(url)).toBeNull()
  })

  it('sperrt in Phase A Lesezugriffe auf .cache/, daten/protokolle/ und Programm-Werkzeuge', () => {
    const p = (tool_name: string, tool_input: Record<string, string>, phaseA = true) => pruefe({ tool_name, tool_input }, kontext(phaseA))
    expect(p('Read', { file_path: '/repo/.cache/entwurf/17/texte/SPD-Bund.txt' })).toMatch(/Phase A/)
    expect(p('Grep', { pattern: 'Kita', path: '.cache/texte' })).toMatch(/Phase A/)
    expect(p('Bash', { command: 'cat .cache/entwurf/17/erfassung.json' })).toMatch(/Phase A/)
    expect(p('Bash', { command: "npm run -s programme:suche '--' kita" })).toMatch(/Programme lesen|Wahlprogramme/)
    expect(p('Bash', { command: 'node --experimental-strip-types scripts/entwurf/programm-text.ts x' })).toMatch(/Phase A/)
    expect(p('Bash', { command: 'npm run phase-a -- ende' })).toBeNull()
    expect(p('PowerShell', { command: 'Get-Content .cache\\entwurf\\17\\erfassung.json' })).toMatch(/Phase A/)
    expect(p('PowerShell', { command: 'npm run -s programme:suche -- kita' })).toMatch(/Wahlprogramme/)
    expect(p('Bash', { command: 'npm run -s quelle:text -- https://www.dji.de/x.pdf --suche Kita' })).toBeNull()
    expect(p('Read', { file_path: '/repo/daten/README.md' })).toBeNull()
    expect(p('Read', { file_path: '/repo/daten/protokolle/18/2026-10-04-bund/erfassung.json' })).toMatch(/daten\/protokolle/)
    expect(p('Grep', { pattern: 'Tempolimit', path: 'daten/protokolle' })).toMatch(/daten\/protokolle/)
    expect(p('Bash', { command: 'cat daten/protokolle/18/2026-10-04-bund/protokoll/erfassung-SPD-Bund.txt' })).toMatch(/daten\/protokolle/)
    expect(p('Read', { file_path: '/repo/daten/leitfaeden/18.json' })).toBeNull()
    expect(p('Read', { file_path: '/repo/daten/protokolle/18/x.json' }, false)).toBeNull()
    expect(p('Read', { file_path: '/repo/.cache/entwurf/17/texte/SPD-Bund.txt' }, false)).toBeNull()
  })

  describe('Agent haltung-einordnung', () => {
    const agent = (tool_name: string, tool_input: Record<string, string>) =>
      pruefe({ tool_name, tool_input, agent_type: 'haltung-einordnung', agent_id: 'h1', cwd: '/repo' }, kontext())

    it('erlaubt nur Blindliste, eigene Antwort und Selbstprüfung', () => {
      expect(agent('Read', { file_path: '/repo/.cache/haltung/4/blind.json' })).toBeNull()
      expect(agent('Write', { file_path: '.cache/haltung/4/protokoll/einordnung-antwort.txt', content: '{}' })).toBeNull()
      expect(agent('Bash', { command: 'npm run -s haltung:antwort-pruefen -- 4' })).toBeNull()
      for (const datei of ['/repo/.cache/haltung/4/kennungen.json', '/repo/.cache/haltung/4/funde/SPD-Bund.json', '/repo/.cache/haltung/4/../4/kennungen.json', '/repo/daten/haltungen/04.json'])
        expect(agent('Read', { file_path: datei })).toMatch(/Einordnung ohne Parteinamen/)
      expect(agent('Bash', { command: 'npm run -s haltung:antwort-pruefen -- 4 && cat .cache/haltung/4/kennungen.json' })).toMatch(/gesperrt/)
      expect(agent('WebSearch', { query: 'Tempolimit Partei' })).toMatch(/gesperrt/)
      expect(agent('WebFetch', { url: 'https://www.kfn.de/studie.pdf' })).toMatch(/gesperrt/)
    })
  })

  describe('Agent nebenwirkungen-recherche', () => {
    const agent = (tool_name: string, tool_input: Record<string, string>) =>
      pruefe({ tool_name, tool_input, agent_type: 'nebenwirkungen-recherche', agent_id: 'n1', cwd: '/repo' }, kontext())

    it('erlaubt nur Teil-Liste, eigene Antwort, Selbstprüfung und Websuche ohne Parteiserver', () => {
      expect(agent('Read', { file_path: '/repo/.cache/nebenwirkungen/3/teil-2.json' })).toBeNull()
      expect(agent('Write', { file_path: '.cache/nebenwirkungen/3/protokoll/antwort-2.txt', content: '{}' })).toBeNull()
      expect(agent('Bash', { command: 'npm run -s nebenwirkungen:antwort-pruefen -- 3 2' })).toBeNull()
      expect(agent('WebSearch', { query: 'Stromsteuer Mindereinnahmen' })).toBeNull()
      expect(agent('WebFetch', { url: 'https://www.umweltbundesamt.de/x' })).toBeNull()
      expect(agent('WebFetch', { url: 'https://www.spd.de/x' })).toMatch(/gesperrt/)
      for (const datei of ['/repo/daten/themen/03-energiepreise.json', '/repo/.cache/entwurf/3/kennungen.json', '/repo/.cache/nebenwirkungen/3/../3/../../entwurf/3/blind.json'])
        expect(agent('Read', { file_path: datei })).toMatch(/Recherche ohne Parteinamen/)
      expect(agent('Write', { file_path: '/repo/daten/themen/03-energiepreise.json', content: '{}' })).toMatch(/gesperrt/)
      expect(agent('Bash', { command: 'npm run -s nebenwirkungen:antwort-pruefen -- 3 2; cat daten/themen/03-energiepreise.json' })).toMatch(/gesperrt/)
    })

    it('erlaubt PDFs als Text nur ohne Shell-Sonderzeichen und ohne Parteiserver', () => {
      const pdf = (rest: string) => agent('Bash', { command: `npm run -s nebenwirkungen:pdf -- ${rest}` })
      expect(pdf('https://dserver.bundestag.de/btd/21/1/1.pdf')).toBeNull()
      expect(pdf("https://dserver.bundestag.de/btd/21/1/1.pdf 'Erfüllungsaufwand Wirtschaft'")).toBeNull()
      expect(pdf('https://dserver.bundestag.de/btd/21/1/1.pdf --seite 12')).toBeNull()
      expect(pdf('https://www.spd.de/x.pdf')).toMatch(/gesperrt/)
      for (const boese of ['https://a.de/x.pdf; cat daten/themen/03-energiepreise.json', 'https://a.de/$(cat x).pdf', "https://a.de/x.pdf 'a'; ls", 'https://a.de/x.pdf > .cache/x', 'https://a.de/x.pdf `ls`'])
        expect(pdf(boese)).toMatch(/Recherche ohne Parteinamen/)
    })

    it('gilt auch unter GitHub Copilot über die Markierung', () => {
      const c = (tool_name: string, tool_input: Record<string, unknown>) =>
        pruefeCopilot({ tool_name, tool_input, cwd: '/repo' }, { ...kontext(), agenten: ['nebenwirkungen-recherche'] })
      expect(c('read_file', { filePath: '/repo/.cache/nebenwirkungen/3/teil-1.json' })).toBeNull()
      expect(c('read_file', { filePath: '/repo/daten/themen/03-energiepreise.json' })).toMatch(/Recherche ohne Parteinamen/)
      expect(c('fetch_webpage', { urls: ['https://www.destatis.de/a'] })).toBeNull()
      expect(c('run_in_terminal', { command: 'npm run -s nebenwirkungen:pdf -- https://dserver.bundestag.de/btd/21/1/1.pdf' })).toBeNull()
      expect(c('run_in_terminal', { command: 'npm run -s nebenwirkungen:pdf -- https://www.spd.de/x.pdf' })).toMatch(/Recherche ohne Parteinamen/)
    })
  })

  describe('Agent blind-bewertung', () => {
    const blind = (tool_name: string, tool_input: Record<string, string>, extra: Record<string, unknown> = {}) =>
      pruefe({ tool_name, tool_input, agent_type: 'blind-bewertung', agent_id: 'a1', cwd: '/repo', ...extra }, kontext())

    it('erlaubt genau die Blindliste zum Lesen und die Antwortdatei zum Schreiben', () => {
      expect(blind('Read', { file_path: '/repo/.cache/entwurf/9/blind.json' })).toBeNull()
      expect(blind('Read', { file_path: '.cache/entwurf/17/blind.json' })).toBeNull()
      expect(blind('Write', { file_path: '/repo/.cache/entwurf/9/protokoll/bewertung-antwort.txt', content: '{}' })).toBeNull()
      // Die eigene Antwort darf er lesen (Write verlangt das vor dem Überschreiben) und genau die Selbstprüfung ausführen.
      expect(blind('Read', { file_path: '/repo/.cache/entwurf/9/protokoll/bewertung-antwort.txt' })).toBeNull()
      expect(blind('Bash', { command: 'npm run -s entwurf:antwort-pruefen -- 9' })).toBeNull()
      expect(blind('Bash', { command: "npm run -s entwurf:antwort-pruefen '--' 17" })).toBeNull()
      expect(blind('WebSearch', { query: 'Wirkung Videoüberwachung Studie' })).toBeNull()
      expect(blind('WebFetch', { url: 'https://www.kfn.de/studie.pdf' })).toBeNull()
    })

    it('sperrt alles andere – auch Umwege über „..“, andere Arbeitsdateien und Werkzeuge', () => {
      for (const datei of [
        '/repo/.cache/entwurf/9/erfassung.json',
        '/repo/.cache/entwurf/9/kennungen.json',
        '/repo/.cache/entwurf/9/programme/SPD-Bund.json',
        '/repo/.cache/entwurf/9/texte/SPD-Bund.txt',
        '/repo/.cache/entwurf/9/protokoll/bewertung-auftrag.txt',
        '/repo/.cache/entwurf/9/protokoll/blind-0123456789abcdef.json',
        '/repo/.cache/entwurf/9/x/../erfassung.json',
        '/repo/.cache/entwurf/9/x/../../9/blind.json/../kennungen.json',
        '/repo/daten/themen/09-sicherheit.json',
        '/repo/.cache/entwurf/9/blind.json.bak',
        '/anderes/.cache/entwurf/9/blind.json',
        '/etc/passwd',
      ])
        expect(blind('Read', { file_path: datei })).toMatch(/Bewertung ohne Parteinamen/)
      expect(blind('Read', { file_path: '/repo/.cache/entwurf/9/x/../blind.json' })).toBeNull()
      expect(blind('Write', { file_path: '/repo/.cache/entwurf/9/blind.json', content: '' })).toMatch(/gesperrt/)
      expect(blind('Write', { file_path: '/repo/.cache/entwurf/9/bewertung.json', content: '' })).toMatch(/gesperrt/)
      expect(blind('Edit', { file_path: '/repo/.cache/entwurf/9/protokoll/bewertung-antwort.txt' })).toMatch(/gesperrt/)
      expect(blind('Bash', { command: 'cat .cache/entwurf/9/erfassung.json' })).toMatch(/gesperrt/)
      for (const command of [
        'npm run -s entwurf:antwort-pruefen -- 9; cat .cache/entwurf/9/erfassung.json',
        'npm run -s entwurf:antwort-pruefen -- 9 && cat x',
        'npm run -s entwurf:antwort-pruefen -- 9 | tee x',
        'npm run -s entwurf:antwort-pruefen -- $(cat x)',
        'npm run -s entwurf:antwort-pruefen -- 9 > x',
        'npm run -s entwurf:bewertung-pruefen -- .cache/entwurf/9/erfassung.json x',
        'node scripts/entwurf/antwort-pruefen.ts 9',
      ])
        expect(blind('Bash', { command })).toMatch(/gesperrt/)
      expect(blind('Grep', { pattern: 'SPD', path: '.cache' })).toMatch(/gesperrt/)
      expect(blind('Glob', { pattern: '**/*.json' })).toMatch(/gesperrt/)
      expect(blind('Read', {})).toMatch(/gesperrt/)
      // Parteiserver bleiben auch für diesen Agenten gesperrt.
      expect(blind('WebFetch', { url: 'https://www.spd.de/programm.pdf' })).toMatch(/spd\.de ist gesperrt/)
    })

    it('gilt nur für diesen Agenten; die Koordination und andere Agenten sind nicht betroffen', () => {
      expect(pruefe({ tool_name: 'Read', tool_input: { file_path: '/repo/.cache/entwurf/9/erfassung.json' } }, kontext())).toBeNull()
      expect(pruefe({ tool_name: 'Read', tool_input: { file_path: '/repo/.cache/entwurf/9/erfassung.json' }, agent_type: 'programm-erfassung' }, kontext())).toBeNull()
      expect(blind('Read', { file_path: '/repo/.cache/entwurf/9/erfassung.json' }, { agent_type: 'projekt:blind-bewertung' })).toMatch(/gesperrt/)
    })
  })

  describe('GitHub Copilot (andere Werkzeugnamen, kein agent_type)', () => {
    const cp = (tool_name: string, tool_input: Record<string, unknown>, { phaseA = false, agenten = [] as string[] } = {}) =>
      pruefeCopilot({ tool_name, tool_input, cwd: '/repo' }, { ...kontext(phaseA), agenten })

    it('sperrt Parteiserver in jedem Werkzeug, auch in Listen', () => {
      expect(cp('fetch_webpage', { urls: ['https://www.destatis.de/a', 'https://www.spd.de/x'] })).toMatch(/spd\.de ist gesperrt/)
      expect(cp('run_in_terminal', { command: 'curl https://cms.gruene.de/p.pdf' })).toBeNull() // nur ganze Adressen als Wert
      expect(cp('fetch_webpage', { urls: ['https://www.destatis.de/a'] })).toBeNull()
    })

    it('Phase A: sperrt .cache/, daten/protokolle/ und Programm-Werkzeuge unabhängig vom Werkzeugnamen', () => {
      const a = { phaseA: true }
      expect(cp('Read', { path: 'c:\\repo\\.cache\\entwurf\\17\\erfassung.json' }, a)).toMatch(/Phase A/)
      expect(cp('grep_search', { query: 'Kita', includePattern: '.cache/**' }, a)).toMatch(/Phase A/)
      expect(cp('run_in_terminal', { command: 'Get-Content daten/protokolle/18/x.txt' }, a)).toMatch(/daten\/protokolle/)
      expect(cp('run_in_terminal', { command: 'npm run -s programme:suche -- kita' }, a)).toMatch(/Wahlprogramme/)
      expect(cp('run_in_terminal', { command: 'npm run phase-a -- ende' }, a)).toBeNull()
      expect(cp('Read', { path: 'docs/methode.md' }, a)).toBeNull()
      expect(cp('Read', { path: '.cache/entwurf/17/erfassung.json' })).toBeNull()
    })

    it('solange blind-bewertung läuft: nur Blindliste, Antwort, Selbstprüfung und Websuche', () => {
      const b = { agenten: ['blind-bewertung'] }
      expect(cp('Read', { path: '.cache/entwurf/9/blind.json' }, b)).toBeNull()
      expect(cp('read_file', { filePath: '/repo/.cache/entwurf/9/protokoll/bewertung-antwort.txt', startLine: 1 } as never, b)).toBeNull()
      expect(cp('create_file', { filePath: '/repo/.cache/entwurf/9/protokoll/bewertung-antwort.txt', content: 'x' }, b)).toBeNull()
      expect(cp('run_in_terminal', { command: 'npm run -s entwurf:antwort-pruefen -- 9', explanation: 'Prüfung' }, b)).toBeNull()
      expect(cp('fetch_webpage', { urls: ['https://www.dji.de/b.pdf'] }, b)).toBeNull()
      expect(cp('Read', { path: '.cache/entwurf/9/erfassung.json' }, b)).toMatch(/gesperrt/)
      expect(cp('create_file', { filePath: '/repo/.cache/entwurf/9/blind.json', content: 'x' }, b)).toMatch(/gesperrt/)
      expect(cp('run_in_terminal', { command: 'npm run -s entwurf:antwort-pruefen -- 9 && cat .cache/entwurf/9/kennungen.json' }, b)).toMatch(/gesperrt/)
      expect(cp('grep_search', { query: 'SPD' }, b)).toMatch(/gesperrt/)
      expect(cp('fetch_webpage', { urls: ['https://www.afd.de/x'] }, b)).toMatch(/gesperrt/)
    })

    it('solange haltung-einordnung läuft: keine Websuche', () => {
      const h = { agenten: ['haltung-einordnung'] }
      expect(cp('Read', { path: '.cache/haltung/4/blind.json' }, h)).toBeNull()
      expect(cp('run_in_terminal', { command: 'npm run -s haltung:antwort-pruefen -- 4' }, h)).toBeNull()
      expect(cp('fetch_webpage', { urls: ['https://www.dji.de/b.pdf'] }, h)).toMatch(/gesperrt/)
    })
  })
})
