#!/usr/bin/env node
// PreToolUse-Hook (.claude/settings.json): technische Sperren für die Neutralität, auch für Agenten.
//
// 1. WebFetch auf Partei-, Fraktions- und Stiftungsserver, die Server aller Programme aus
//    daten/parteien.json und das Repository auf GitHub ist immer gesperrt (Liste: daten/gesperrte-adressen.json).
// 2. Phase A (Ursachen festlegen, /thema-anlegen): Solange .cache/phase-a besteht, sind Lesezugriffe auf
//    .cache/ (Programmtexte, Erfassungen), daten/protokolle/ (Programmstellen früherer Erfassungen) und die
//    Programm-Werkzeuge gesperrt. Start und Ende:
//    npm run phase-a -- start "<Thema>" bzw. npm run phase-a -- ende
// 3. Agent blind-bewertung (erkannt an agent_type in der Hook-Eingabe, die Claude Code bei jedem
//    Werkzeugaufruf eines Subagenten mitschickt): Read nur genau .cache/entwurf/<ID>/blind.json und die
//    eigene Antwort, Write nur genau .cache/entwurf/<ID>/protokoll/bewertung-antwort.txt, Bash nur genau
//    die Selbstprüfung `npm run -s entwurf:antwort-pruefen -- <ID>`, WebFetch wie unter 1; alles andere gesperrt.
// 4. Agent haltung-einordnung (Haltungen ohne Parteinamen einordnen): Read nur .cache/haltung/<ID>/blind.json und
//    die eigene Antwort, Write nur .cache/haltung/<ID>/protokoll/einordnung-antwort.txt, Bash nur
//    `npm run -s haltung:antwort-pruefen -- <ID>`; keine Websuche (das Zitat genügt), alles andere gesperrt.
// 4b. Agent nebenwirkungen-recherche (Folgen über das Thema hinaus, docs/plan-nebenwirkungen.md): Read nur
//    .cache/nebenwirkungen/<ID>/teil-<n>.json und die eigene Antwort, Write nur protokoll/antwort-<n>.txt, Bash nur
//    `npm run -s nebenwirkungen:antwort-pruefen -- <ID> <n>` und `npm run -s nebenwirkungen:pdf -- <URL> …`, WebSearch und WebFetch wie unter 1 – keine Themendateien,
//    also keine Parteien zu den Lösungswegen.
// 5. GitHub Copilot in VS Code (.github/hooks/sperre.json, Umgebungsvariable SPERRE_UMGEBUNG=copilot):
//    Werkzeugnamen und Eingaben weichen ab, und PreToolUse kennt kein agent_type. Darum prüft pruefeCopilot
//    alle Texte der Eingabe unabhängig vom Werkzeugnamen, und SubagentStart/-Stop legen für die Dauer eines
//    Agenten blind-bewertung bzw. haltung-einordnung eine Markierung in .cache/sperre-agenten/ an – solange
//    eine besteht, gelten dessen Regeln für alle Werkzeugaufrufe (die Sitzung wartet ohnehin auf den Agenten).
//
// Eingabe: JSON auf stdin ({ tool_name, tool_input, cwd, agent_type? }). Ausgabe bei Sperre: Entscheidung
// „deny“ mit Grund. Ohne Abhängigkeiten, damit der Hook schnell startet.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const wurzel = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const MARKER = join(wurzel, '.cache', 'phase-a')

/** Name des Bewertungs-Agenten (.claude/agents/blind-bewertung.md); bei Plugins mit Präfix „plugin:“. */
export const BLIND_AGENT = /(^|:)blind-bewertung$/

/**
 * Darf der Bewertungs-Agent diesen Pfad mit diesem Werkzeug benutzen? Genau zwei Dateien je Thema:
 * die Blindliste lesen, die Antwort schreiben. Relative Pfade gelten ab `cwd` (sonst Projektordner), `..` wird aufgelöst.
 */
export function blindPfadErlaubt(werkzeug, pfad, wurzel, cwd = wurzel) {
  if (typeof pfad !== 'string' || !pfad.trim()) return false
  const norm = (p) => {
    const r = resolve(wurzel, p).replace(/\\/g, '/')
    return process.platform === 'win32' ? r.toLowerCase() : r
  }
  const datei = norm(isAbsolute(pfad) ? pfad : join(cwd, pfad))
  const basis = norm(wurzel).replace(/\/$/, '')
  const rest = datei.startsWith(`${basis}/`) ? datei.slice(basis.length + 1) : null
  if (rest === null) return false
  if (werkzeug === 'Read') return /^\.cache\/entwurf\/\d+\/(blind\.json|protokoll\/bewertung-antwort\.txt)$/.test(rest)
  if (werkzeug === 'Write') return /^\.cache\/entwurf\/\d+\/protokoll\/bewertung-antwort\.txt$/.test(rest)
  return false
}

/** Name des Agenten, der Haltungen ohne Parteinamen einordnet (.claude/agents/haltung-einordnung.md). */
export const HALTUNG_AGENT = /(^|:)haltung-einordnung$/
export const HALTUNG_PRUEFBEFEHL = /^npm run (-s |--silent )?haltung:antwort-pruefen '?--'? \d+$/

/** Darf der Einordnungs-Agent diesen Pfad benutzen? Genau die Blindliste und die eigene Antwort. */
export function haltungPfadErlaubt(werkzeug, pfad, wurzel, cwd = wurzel) {
  if (typeof pfad !== 'string' || !pfad.trim()) return false
  const norm = (p) => {
    const r = resolve(wurzel, p).replace(/\\/g, '/')
    return process.platform === 'win32' ? r.toLowerCase() : r
  }
  const datei = norm(isAbsolute(pfad) ? pfad : join(cwd, pfad))
  const basis = norm(wurzel).replace(/\/$/, '')
  const rest = datei.startsWith(`${basis}/`) ? datei.slice(basis.length + 1) : null
  if (rest === null) return false
  if (werkzeug === 'Read') return /^\.cache\/haltung\/\d+\/(blind\.json|protokoll\/einordnung-antwort\.txt)$/.test(rest)
  if (werkzeug === 'Write') return /^\.cache\/haltung\/\d+\/protokoll\/einordnung-antwort\.txt$/.test(rest)
  return false
}

/** Name des Agenten, der Nebenwirkungen ohne Parteinamen recherchiert (.claude/agents/nebenwirkungen-recherche.md). */
export const NEBEN_AGENT = /(^|:)nebenwirkungen-recherche$/
export const NEBEN_PRUEFBEFEHL = /^npm run (-s |--silent )?nebenwirkungen:antwort-pruefen '?--'? \d+ \d+$/
/**
 * PDF als Text (scripts/nebenwirkungen/pdf.ts): Adresse ohne Shell-Sonderzeichen (kein ; & | $ ` Klammern oder
 * Anführungszeichen), danach höchstens ein Suchbegriff in einfachen Anführungszeichen oder --seite <n>.
 */
export const NEBEN_PDFBEFEHL = /^npm run (-s |--silent )?nebenwirkungen:pdf '?--'? (https:\/\/[A-Za-z0-9._~:/?=%+,-]+)( '[\p{L}\p{N} .,§%-]+'| --seite \d+)?$/u

/** Darf der Recherche-Agent diesen Pfad benutzen? Genau die Teil-Liste und die eigene Antwort. */
export function nebenPfadErlaubt(werkzeug, pfad, wurzel, cwd = wurzel) {
  if (typeof pfad !== 'string' || !pfad.trim()) return false
  const norm = (p) => {
    const r = resolve(wurzel, p).replace(/\\/g, '/')
    return process.platform === 'win32' ? r.toLowerCase() : r
  }
  const datei = norm(isAbsolute(pfad) ? pfad : join(cwd, pfad))
  const basis = norm(wurzel).replace(/\/$/, '')
  const rest = datei.startsWith(`${basis}/`) ? datei.slice(basis.length + 1) : null
  if (rest === null) return false
  if (werkzeug === 'Read') return /^\.cache\/nebenwirkungen\/\d+\/(teil-\d+\.json|protokoll\/antwort-\d+\.txt)$/.test(rest)
  if (werkzeug === 'Write') return /^\.cache\/nebenwirkungen\/\d+\/protokoll\/antwort-\d+\.txt$/.test(rest)
  return false
}

/**
 * Die Selbstprüfung des Bewertungs-Agenten – genau dieser Befehl, ohne weitere Zeichen: keine
 * Verkettung, Umleitung oder Ersetzung. Das Skript liest nur blind.json und die Antwort.
 */
export const BLIND_PRUEFBEFEHL = /^npm run (-s |--silent )?entwurf:antwort-pruefen '?--'? \d+$/

/** Gründe für eine Sperre; null = erlaubt. Reine Funktion für Tests (scripts/sperre.test.ts). */
export function pruefe(eingabe, { liste, programmHosts, phaseA, wurzel: basis = wurzel }) {
  const { tool_name: werkzeug, tool_input: e = {} } = eingabe
  if (werkzeug === 'WebFetch' && typeof e.url === 'string') {
    const grund = gesperrteAdresse(e.url, liste, programmHosts)
    if (grund) return grund
  }
  if (typeof eingabe.agent_type === 'string' && BLIND_AGENT.test(eingabe.agent_type)) {
    if (werkzeug === 'WebFetch' || werkzeug === 'WebSearch') return null
    if ((werkzeug === 'Read' || werkzeug === 'Write') && blindPfadErlaubt(werkzeug, e.file_path, basis, eingabe.cwd || basis)) return null
    if (werkzeug === 'Bash' && typeof e.command === 'string' && BLIND_PRUEFBEFEHL.test(e.command.trim()) && !e.run_in_background) return null
    return (
      `Bewertung ohne Parteinamen: ${werkzeug} ${e.file_path ?? e.path ?? e.command ?? ''} ist gesperrt. ` +
      'Erlaubt sind nur Read auf .cache/entwurf/<ID>/blind.json und protokoll/bewertung-antwort.txt, Write auf .cache/entwurf/<ID>/protokoll/bewertung-antwort.txt, ' +
      'Bash nur „npm run -s entwurf:antwort-pruefen -- <ID>“, WebSearch und WebFetch.'
    )
  }
  if (typeof eingabe.agent_type === 'string' && HALTUNG_AGENT.test(eingabe.agent_type)) {
    if ((werkzeug === 'Read' || werkzeug === 'Write') && haltungPfadErlaubt(werkzeug, e.file_path, basis, eingabe.cwd || basis)) return null
    if (werkzeug === 'Bash' && typeof e.command === 'string' && HALTUNG_PRUEFBEFEHL.test(e.command.trim()) && !e.run_in_background) return null
    return (
      `Einordnung ohne Parteinamen: ${werkzeug} ${e.file_path ?? e.path ?? e.command ?? e.url ?? ''} ist gesperrt. ` +
      'Erlaubt sind nur Read auf .cache/haltung/<ID>/blind.json und protokoll/einordnung-antwort.txt, Write auf protokoll/einordnung-antwort.txt ' +
      'und Bash „npm run -s haltung:antwort-pruefen -- <ID>“.'
    )
  }
  if (typeof eingabe.agent_type === 'string' && NEBEN_AGENT.test(eingabe.agent_type)) {
    if (werkzeug === 'WebFetch' || werkzeug === 'WebSearch') return null
    if ((werkzeug === 'Read' || werkzeug === 'Write') && nebenPfadErlaubt(werkzeug, e.file_path, basis, eingabe.cwd || basis)) return null
    if (werkzeug === 'Bash' && typeof e.command === 'string' && NEBEN_PRUEFBEFEHL.test(e.command.trim()) && !e.run_in_background) return null
    const pdf = werkzeug === 'Bash' && typeof e.command === 'string' && !e.run_in_background ? NEBEN_PDFBEFEHL.exec(e.command.trim()) : null
    if (pdf) return gesperrteAdresse(pdf[2], liste, programmHosts)
    return (
      `Recherche ohne Parteinamen: ${werkzeug} ${e.file_path ?? e.path ?? e.command ?? ''} ist gesperrt. ` +
      'Erlaubt sind nur Read auf .cache/nebenwirkungen/<ID>/teil-<n>.json und protokoll/antwort-<n>.txt, Write auf protokoll/antwort-<n>.txt, ' +
      "Bash nur „npm run -s nebenwirkungen:antwort-pruefen -- <ID> <n>“ und „npm run -s nebenwirkungen:pdf -- <https-Adresse> ['Suchbegriff'] | --seite <n>“, WebSearch und WebFetch."
    )
  }
  if (werkzeug === 'WebFetch') return null
  if (!phaseA) return null
  const cache = /(^|[\s/\\'"=])\.cache([\s/\\'"]|$)/
  const texte = [e.file_path, e.path, e.pattern, e.glob].filter((x) => typeof x === 'string')
  if (['Read', 'Grep', 'Glob', 'NotebookRead'].includes(werkzeug) && texte.some((t) => cache.test(t) || t.includes('/.cache/') || t.startsWith('.cache')))
    return 'Phase A (Ursachen festlegen): kein Zugriff auf .cache/ – dort liegen Programmtexte und Erfassungen.'
  const protokolle = /(^|[\s/\\'"=])daten[/\\]protokolle([\s/\\'"]|$)/
  if (['Read', 'Grep', 'Glob', 'NotebookRead'].includes(werkzeug) && texte.some((t) => protokolle.test(t) || t.startsWith('daten/protokolle')))
    return 'Phase A (Ursachen festlegen): kein Zugriff auf daten/protokolle/ – dort stehen Programmstellen früherer Erfassungen.'
  if ((werkzeug === 'Bash' || werkzeug === 'PowerShell') && typeof e.command === 'string') {
    const c = e.command
    if (/\bnpm run phase-a\b/.test(c) && !/[;&|]/.test(c.replace(/\b2>&1\b/g, ''))) return null
    if (cache.test(c) || /\.cache\//.test(c)) return 'Phase A (Ursachen festlegen): kein Zugriff auf .cache/ – dort liegen Programmtexte und Erfassungen.'
    if (/daten[/\\]protokolle/.test(c)) return 'Phase A (Ursachen festlegen): kein Zugriff auf daten/protokolle/ – dort stehen Programmstellen früherer Erfassungen.'
    if (/\b(programme:(laden|suche|texte)|programm:(text|sichern)|zitate:pruefen|entwurf:|punkte\b|pruefliste|blind:reste|instrumente\b|haltung:(auftrag|programm-pruefen|blind|eintragen))/.test(c))
      return 'Phase A (Ursachen festlegen): Werkzeuge, die Wahlprogramme lesen, sind gesperrt. Erlaubt: npm run quelle:text, npm run themen:ueberblick.'
    if (/(^|[\s/])scripts\/(entwurf\/(programm|programme|treffer|reste)|pruefe-zitate|erzeuge-pruefliste)/.test(c))
      return 'Phase A (Ursachen festlegen): Werkzeuge, die Wahlprogramme lesen, sind gesperrt.'
  }
  return null
}

export function gesperrteAdresse(url, liste, programmHosts) {
  let adresse = url.toLowerCase()
  try {
    adresse = decodeURIComponent(adresse)
  } catch {
    // ungültige Prozentkodierung: so prüfen, wie sie ist
  }
  // Auch Kopien im Internet Archive oder hinter Weiterleitungsdiensten: jede Adresse in der URL zählt.
  const hosts = [...adresse.matchAll(/(?:https?:\/\/|^|\/)([a-z0-9.-]+\.[a-z]{2,})(?=[/:?#]|$)/g)].map((m) => m[1].replace(/^www\./, ''))
  const pfade = [...adresse.matchAll(/(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,}\/[^\s?#]*)/g)].map((m) => m[1])
  for (const h of hosts) {
    const exakt = [...liste.hosts, ...programmHosts].find((g) => h === g || h.endsWith(`.${g}`))
    if (exakt) return `${url}: ${exakt} ist gesperrt (Partei, Fraktion, Stiftung, Programmserver oder Politik-Duell selbst – daten/gesperrte-adressen.json)`
    if (liste.muster.some((m) => new RegExp(m).test(h))) return `${url}: ${h} sieht nach einem Parteiserver aus und ist gesperrt (daten/gesperrte-adressen.json)`
  }
  for (const p of pfade) {
    const treffer = liste.pfade.find((g) => p === g || p.startsWith(`${g}/`))
    if (treffer) return `${url}: ${treffer} ist gesperrt (Repository mit Maßnahmen und Bewertungen)`
  }
  return null
}

function ladeListe() {
  const liste = JSON.parse(readFileSync(join(wurzel, 'daten', 'gesperrte-adressen.json'), 'utf8'))
  const parteien = JSON.parse(readFileSync(join(wurzel, 'daten', 'parteien.json'), 'utf8'))
  const programmHosts = new Set()
  for (const p of parteien.parteien ?? [])
    for (const u of [p.programm_url, ...(p.landesprogramme ?? []).map((l) => l.url)])
      if (u)
        try {
          programmHosts.add(new URL(u).hostname.toLowerCase().replace(/^www\./, ''))
        } catch {
          // ungültige Adresse meldet daten:pruefen
        }
  return { liste, programmHosts: [...programmHosts] }
}

/** Alle Texte einer Werkzeugeingabe mit ihrem Schlüssel, auch verschachtelt (Copilot: urls als Liste u. Ä.). */
export function texteDerEingabe(wert, schluessel = '') {
  if (typeof wert === 'string') return [[schluessel, wert]]
  if (Array.isArray(wert)) return wert.flatMap((w) => texteDerEingabe(w, schluessel))
  if (wert && typeof wert === 'object') return Object.entries(wert).flatMap(([k, w]) => texteDerEingabe(w, k))
  return []
}

const PHASE_A_BEFEHLE =
  /\b(programme:(laden|suche|texte)|programm:(text|sichern)|zitate:pruefen|entwurf:|punkte\b|pruefliste|blind:reste|instrumente\b|haltung:(auftrag|programm-pruefen|blind|eintragen))|(^|[\s/\\])scripts[/\\](entwurf[/\\](programm|programme|treffer|reste)|pruefe-zitate|erzeuge-pruefliste)/

/**
 * Prüfung für GitHub Copilot: unabhängig vom Werkzeugnamen. `agenten` = Typen der laufenden Agenten
 * blind-bewertung/haltung-einordnung (Markierungen aus SubagentStart). Reine Funktion für Tests.
 */
export function pruefeCopilot(eingabe, { liste, programmHosts, phaseA, agenten = [], wurzel: basis = wurzel }) {
  const werkzeug = String(eingabe.tool_name ?? '')
  const texte = texteDerEingabe(eingabe.tool_input ?? {})
  const adressen = texte.map(([, t]) => t.trim()).filter((t) => /^https?:\/\//i.test(t))
  const befehle = texte.filter(([k]) => /command|cmd/i.test(k)).map(([, t]) => t.trim())
  const pfade = texte.filter(([k]) => /path|file|dir/i.test(k)).map(([, t]) => t)
  const istWeb = adressen.length > 0 || /fetch|web/i.test(werkzeug)

  for (const url of adressen) {
    const grund = gesperrteAdresse(url, liste, programmHosts)
    if (grund) return grund
  }

  const blind = agenten.some((a) => BLIND_AGENT.test(a))
  const haltung = agenten.some((a) => HALTUNG_AGENT.test(a))
  const neben = agenten.some((a) => NEBEN_AGENT.test(a))
  if (blind || haltung || neben) {
    const name = blind ? 'Bewertung ohne Parteinamen' : haltung ? 'Einordnung ohne Parteinamen' : 'Recherche ohne Parteinamen'
    const pfadOk = blind ? blindPfadErlaubt : haltung ? haltungPfadErlaubt : nebenPfadErlaubt
    const pruefbefehl = blind ? BLIND_PRUEFBEFEHL : haltung ? HALTUNG_PRUEFBEFEHL : NEBEN_PRUEFBEFEHL
    const web = blind || neben
    const cwd = eingabe.cwd || basis
    const gesperrt = `${name} (Agent läuft, .cache/sperre-agenten/): ${werkzeug} ist gesperrt. Erlaubt sind nur die Blindliste lesen, die eigene Antwort schreiben und die Selbstprüfung${web ? ' sowie Websuche' : ''}.`
    if (befehle.length) {
      const pdfOk = (b) => {
        const m = neben ? NEBEN_PDFBEFEHL.exec(b) : null
        return m && !gesperrteAdresse(m[2], liste, programmHosts)
      }
      return befehle.every((b) => pruefbefehl.test(b) || pdfOk(b)) && !pfade.length ? null : gesperrt
    }
    if (pfade.length) {
      const art = /read|view|open|get_?file/i.test(werkzeug) ? 'Read' : 'Write'
      return pfade.every((p) => pfadOk(art, p, basis, cwd)) ? null : gesperrt
    }
    if (web && istWeb) return null
    return gesperrt
  }

  if (!phaseA || istWeb) return null
  if (befehle.some((b) => /^npm run phase-a\b/.test(b) && !/[;&|]/.test(b.replace(/\b2>&1\b/g, '')))) return null
  const alle = texte.map(([, t]) => t)
  if (alle.some((t) => /(^|[\s/\\'"=])\.cache([\s/\\'"]|$)/.test(t)))
    return 'Phase A (Ursachen festlegen): kein Zugriff auf .cache/ – dort liegen Programmtexte und Erfassungen.'
  if (alle.some((t) => /(^|[\s/\\'"=])daten[/\\]protokolle([\s/\\'"]|$)/.test(t)))
    return 'Phase A (Ursachen festlegen): kein Zugriff auf daten/protokolle/ – dort stehen Programmstellen früherer Erfassungen.'
  if (befehle.some((b) => PHASE_A_BEFEHLE.test(b)))
    return 'Phase A (Ursachen festlegen): Werkzeuge, die Wahlprogramme lesen, sind gesperrt. Erlaubt: npm run quelle:text, npm run themen:ueberblick.'
  return null
}

const AGENTEN_ORDNER = join(wurzel, '.cache', 'sperre-agenten')
/** Eine Markierung gilt höchstens so lange; danach (Agent abgebrochen, kein SubagentStop) verfällt sie. */
const AGENTEN_HOECHSTDAUER_MS = 2 * 60 * 60 * 1000

function laufendeAgenten() {
  if (!existsSync(AGENTEN_ORDNER)) return []
  const typen = []
  for (const datei of readdirSync(AGENTEN_ORDNER)) {
    const pfad = join(AGENTEN_ORDNER, datei)
    try {
      if (Date.now() - statSync(pfad).mtimeMs > AGENTEN_HOECHSTDAUER_MS) rmSync(pfad, { force: true })
      else typen.push(JSON.parse(readFileSync(pfad, 'utf8')).agent_type)
    } catch {
      // halb geschriebene oder gerade entfernte Markierung
    }
  }
  return typen.filter((t) => typeof t === 'string')
}

/**
 * Als Hook: Eingabe von stdin lesen, bei Sperre „deny“ ausgeben. Claude Code ruft das über `node -e` mit
 * process.env.CLAUDE_PROJECT_DIR (sonst Arbeitsordner) auf – so hängt der Pfad nicht von der Shell ab:
 * cmd und PowerShell setzen `$CLAUDE_PROJECT_DIR` nicht ein. Copilot: .github/hooks/sperre.json mit
 * `modus` subagent-start bzw. subagent-stop für die Markierungen.
 */
export async function hauptprogramm(modus) {
  let roh = ''
  for await (const teil of process.stdin) roh += teil
  let eingabe
  try {
    eingabe = JSON.parse(roh)
  } catch {
    return
  }
  const copilot = process.env.SPERRE_UMGEBUNG === 'copilot'
  if (modus === 'subagent-start' || modus === 'subagent-stop') {
    const typ = String(eingabe.agent_type ?? '')
    if (!BLIND_AGENT.test(typ) && !HALTUNG_AGENT.test(typ) && !NEBEN_AGENT.test(typ)) return
    const pfad = join(AGENTEN_ORDNER, `${String(eingabe.agent_id ?? typ).replace(/[^\w.-]/g, '_')}.json`)
    if (modus === 'subagent-stop') rmSync(pfad, { force: true })
    else {
      mkdirSync(AGENTEN_ORDNER, { recursive: true })
      writeFileSync(pfad, JSON.stringify({ agent_type: typ, start: new Date().toISOString() }))
    }
    return
  }
  const phaseA = existsSync(MARKER)
  const texte = texteDerEingabe(eingabe.tool_input ?? {})
  const braucheListe = eingabe.tool_name === 'WebFetch' || (copilot && texte.some(([, t]) => /^\s*https?:\/\//i.test(t)))
  const { liste, programmHosts } = braucheListe ? ladeListe() : { liste: null, programmHosts: [] }
  const grund = copilot
    ? pruefeCopilot(eingabe, { liste, programmHosts, phaseA, agenten: laufendeAgenten(), wurzel })
    : pruefe(eingabe, { liste, programmHosts, phaseA, wurzel })
  if (grund)
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: grund } }))
}

// Direkt aufgerufen (node .claude/hooks/sperre.mjs [modus]), nicht beim Import in Tests. pathToFileURL, weil
// process.argv[1] unter Windows „C:\…“ ist, import.meta.url aber „file:///C:/…“.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await hauptprogramm(process.argv[2])
