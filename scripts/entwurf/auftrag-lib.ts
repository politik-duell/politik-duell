// Vorbereitung für die Erfassungs-Agenten (.claude/skills/thema-erfassen): Auswahl der Programme zu einem
// Thema, Dossier je Programm (wo treffen die Begriffe?) und Auftragsdatei je Agent. Der Agent bekommt
// nur den Pfad zur Auftragsdatei: Thema, Ziel, die für seine Ebene zulässigen Ursachen samt Abgrenzung,
// Regeln der Erfassung und Dossier stehen darin. Er liest weder erfassung.json noch Ergebnisse anderer Programme.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import type { Katalog, KatalogUrsache } from '../../src/data/katalog.ts'
import { programmName, type Erfassung } from '../entwurf.ts'
import { erfassungsSeiten, programme, seitenOhneText } from '../programme.ts'
import { dossierMarkdown, DOSSIER_SEITEN } from './dossier-lib.ts'

export interface Auswahl {
  bund?: boolean
  laender?: string[]
  parteien?: string[]
}

export interface Ziel {
  url: string
  sha256?: string
  stand: string | null
  parteiId: number
  partei: string
  /** null = Bundesprogramm */
  land: string | null
  /** Dateiname ohne Endung, z. B. „Gruene-Bund“. */
  name: string
  /** Ursachen, die für dieses Programm zählen (Landesprogramme nur Ursachen mit ebene „land“). */
  ursachen: KatalogUrsache[]
}

/** Programme, die zu einem Thema erfasst werden: alle aktuellen Bundesprogramme, Länder nur bei Landesursachen. */
export function zielProgramme(k: Katalog, themaId: number, a: Auswahl): { ziele: Ziel[]; uebersprungen: string[] } {
  const alle = k.ursachen.filter((u) => u.thema_id === themaId)
  const hatLand = alle.some((u) => (u.ebene ?? 'bund') === 'land')
  const laender = (a.laender ?? []).map((l) => l.toUpperCase())
  const parteien = (a.parteien ?? []).map((p) => p.toLowerCase())
  const ziele: Ziel[] = []
  const uebersprungen: string[] = []
  for (const p of programme(k)) {
    if (!p.aktuell) continue
    if (a.bund && p.land !== null) continue
    // Mit --land nur diese Länder, ohne Bund (wie programme:texte).
    if (laender.length && (p.land === null || !laender.includes(p.land))) continue
    if (p.land !== null && !hatLand) continue
    if (parteien.length && !parteien.includes(p.partei.toLowerCase())) continue
    const partei = k.parteien.find((x) => x.kurzname === p.partei)
    if (!partei) continue
    if (k.abdeckung.some((x) => x.thema_id === themaId && x.partei_id === partei.id && (x.land ?? null) === p.land && x.aktuell)) {
      uebersprungen.push(`${p.name}: hat schon einen Eintrag zum Thema`)
      continue
    }
    const stand = p.land === null ? partei.programm_stand ?? null : k.landesprogramme.find((l) => l.partei_id === partei.id && l.land === p.land && l.url === p.url)?.stand ?? null
    ziele.push({
      url: p.url,
      sha256: p.sha256,
      stand,
      parteiId: partei.id,
      partei: partei.kurzname,
      land: p.land,
      name: programmName(partei.kurzname, p.land),
      ursachen: alle.filter((u) => p.land === null || (u.ebene ?? 'bund') === 'land'),
    })
  }
  return { ziele, uebersprungen }
}

export interface Pfade {
  basis: string
  text: string
  dossier: string
  auftrag: string
  protokoll: string
}

const schraeg = (p: string) => relative(process.cwd(), p).replace(/\\/g, '/')

export const pfade = (erfassungPfad: string, name: string): Pfade => {
  const basis = dirname(erfassungPfad)
  return {
    basis,
    text: schraeg(join(basis, 'texte', `${name}.txt`)),
    dossier: schraeg(join(basis, 'dossier', `${name}.md`)),
    auftrag: schraeg(join(basis, 'auftraege', `${name}.md`)),
    protokoll: schraeg(join(basis, 'protokoll', `erfassung-${name}.txt`)),
  }
}

export interface Rueckfrage {
  anlass: string
  /** Nur diese Ursachen nachlesen. */
  ursachen?: number[]
  /** Seiten oder Bereiche, die gelesen werden sollen, z. B. „22–24, 43“. */
  seiten?: string
}

export interface AuftragEingabe {
  thema: { id: number; name: string; ziel?: string }
  ziel: Ziel
  pfade: Pfade
  regeln: string[]
  rueckfrage?: Rueckfrage & { nummer: number; vorherige: string }
}

export function auftragMarkdown(e: AuftragEingabe): string {
  const ebene = e.ziel.land ? `Landesprogramm ${e.ziel.land} (nur Ursachen mit Ebene „land“)` : 'Bundesprogramm (alle Ursachen zulässig)'
  const z: string[] = []
  z.push(`# ${e.rueckfrage ? `Rückfrage ${e.rueckfrage.nummer}` : 'Auftrag'}: ${e.ziel.partei} (${e.ziel.land ?? 'Bund'}) – Thema ${e.thema.id} ${e.thema.name}`, '')
  z.push(
    'Du bist der Agent `programm-erfassung` (Regeln und Antwortformat: `.claude/agents/programm-erfassung.md`). ' +
      'Diese Datei enthält alles zu Thema, Ursachen und Suchbegriffen. Lies dazu keine weitere Datei: ' +
      'nicht `erfassung.json`, nicht die Themendatei und keine Antworten zu anderen Programmen.',
    '',
  )
  z.push('## Programm', '')
  z.push(`- Partei: ${e.ziel.partei} (partei_id ${e.ziel.parteiId})`)
  z.push(`- Ebene: ${ebene}`)
  z.push(`- URL: ${e.ziel.url}${e.ziel.stand ? ` · Stand ${e.ziel.stand}` : ''}`)
  z.push(`- Text: \`${e.pfade.text}\` (Seitenmarken „===== Seite N =====“; die Zahl ist die PDF-Seite)`)
  z.push(`- Dossier: \`${e.pfade.dossier}\``)
  z.push('', '## Thema', '')
  z.push(`Ziel: ${e.thema.ziel ?? '–'}`, '')
  z.push('## Ursachen (nur diese)', '')
  for (const u of e.ziel.ursachen) {
    z.push(`- **${u.id}** (${u.ebene ?? 'bund'}): ${u.beschreibung}`)
    for (const t of u.abgrenzung?.zaehlt ?? []) z.push(`  - zählt: ${t}`)
    for (const t of u.abgrenzung?.zaehlt_nicht ?? []) z.push(`  - zählt nicht: ${t}`)
  }
  z.push('')
  if (e.regeln.length) {
    z.push('## Regeln dieser Erfassung (für alle Programme gleich)', '')
    for (const r of e.regeln) z.push(`- ${r}`)
    z.push('')
  }
  if (e.rueckfrage) {
    z.push('## Rückfrage', '')
    z.push(`Deine bisherige Antwort: \`${e.rueckfrage.vorherige}\` – lies sie zuerst.`, '')
    z.push(`Anlass: ${e.rueckfrage.anlass}`, '')
    if (e.rueckfrage.ursachen?.length) z.push(`Nur diese Ursachen nachlesen: ${e.rueckfrage.ursachen.join(', ')}.`, '')
    if (e.rueckfrage.seiten) z.push(`Seiten, die zu lesen sind: ${e.rueckfrage.seiten} (mit den Nachbarseiten).`, '')
    z.push(
      'Lies nur diese Stellen und die Zitate deiner bisherigen Antwort. Gib die **vollständige** korrigierte Antwort zurück (alle Maßnahmen, nicht nur Änderungen) ' +
        'und nenne im Protokoll, was du geändert hast und warum. Dieselben Maßstäbe wie beim ersten Durchgang.',
      '',
    )
  } else {
    z.push('## Vorgehen', '')
    z.push(
      '1. Lies das Dossier: Leseplan, Seiten nach Treffern und „Treffer je Begriff“ zeigen, wo die Begriffe treffen. Die Zählung ist schon gemacht, du musst sie nicht wiederholen.',
      '2. Lies die Seiten des Leseplans mit den Nachbarseiten im Text (Read oder Grep auf die Textdatei, nie ganze Programme in der Konsole ausgeben).',
      '3. Für jede Ursache ohne Fundstelle: das Inhaltsverzeichnis lesen und das passende Kapitel, bevor du `keine_massnahme` für sie annimmst. Null Treffer allein genügen nicht.',
      '4. Nimm nur konkrete Handlungszusagen auf, die an einer der Ursachen oben ansetzen und nach „zählt“ und „zählt nicht“ gelten.',
      '',
    )
  }
  z.push('## Antwort', '')
  z.push(
    `Das JSON im Format aus der Agentendatei, danach ein kurzes Protokoll: Eigene Synonyme (Begriff, Ursache, Richtung), Richtungen ohne Maßnahme, gelesene Seiten und Kapitel, ` +
      `„Nicht erfasst“ mit Grund, „Stand im PDF“ bei Abweichung. Die Trefferzahlen je Begriff stehen im Dossier und gehören nicht ins Protokoll. ` +
      `Gib die Antwort vollständig zurück; der Koordinator speichert sie unverändert (Zielpfad: \`${e.pfade.protokoll.replace(/\.txt$/, e.rueckfrage ? `-rueckfrage-${e.rueckfrage.nummer}.txt` : '.txt')}\`).`,
    '',
  )
  return z.join('\n')
}

export interface VorbereitenOptionen {
  dossier: boolean
  auftrag: boolean
  max?: number
  lokal?: Map<string, Uint8Array>
  rueckfrage?: Rueckfrage
}

/** Schreibt Dossier und/oder Auftragsdatei für jedes Programm; gibt Meldungen und die Zahl der Fehler zurück. */
export async function bereiteVor(k: Katalog, e: Erfassung, erfassungPfad: string, ziele: Ziel[], o: VorbereitenOptionen): Promise<{ meldungen: string[]; fehler: number }> {
  const thema = k.themen.find((t) => t.id === e.thema_id)
  if (!thema) throw new Error(`Thema ${e.thema_id} nicht im Katalog`)
  const meldungen: string[] = []
  let fehler = 0
  for (const ziel of ziele) {
    const p = pfade(erfassungPfad, ziel.name)
    if (o.auftrag && !existsSync(p.text)) meldungen.push(`Hinweis: ${p.text} fehlt – erst npm run programme:texte`)
    if (o.dossier) {
      try {
        const { seiten } = await erfassungsSeiten(ziel.url, ziel.sha256, o.lokal)
        const ursachen = new Set(ziel.ursachen.map((u) => String(u.id)))
        const suchbegriffe = Object.fromEntries(Object.entries(e.suchbegriffe).filter(([u]) => ursachen.has(u)))
        mkdirSync(dirname(p.dossier), { recursive: true })
        writeFileSync(
          p.dossier,
          dossierMarkdown({
            titel: `${ziel.partei} (${ziel.land ?? 'Bund'})`,
            thema: `${thema.id} ${thema.name}`,
            ursachen: ziel.ursachen,
            suchbegriffe,
            seiten,
            ohneText: seitenOhneText(seiten),
            max: o.max ?? DOSSIER_SEITEN,
          }),
          'utf8',
        )
        meldungen.push(`Dossier  ${p.dossier}`)
      } catch (x) {
        fehler++
        meldungen.push(`NICHT GELADEN: ${ziel.partei} (${ziel.land ?? 'Bund'}): ${x instanceof Error ? x.message : x}`)
        continue
      }
    }
    if (o.auftrag) {
      let rueckfrage: AuftragEingabe['rueckfrage']
      let datei = p.auftrag
      if (o.rueckfrage) {
        const ordner = dirname(p.protokoll)
        const vorhanden = existsSync(ordner) ? readdirSync(ordner).filter((f) => new RegExp(`^erfassung-${ziel.name}-rueckfrage-(\\d+)\\.txt$`).test(f)) : []
        const nummer = Math.max(0, ...vorhanden.map((f) => Number(f.match(/-rueckfrage-(\d+)\.txt$/)![1]))) + 1
        const vorherige = nummer > 1 ? p.protokoll.replace(/\.txt$/, `-rueckfrage-${nummer - 1}.txt`) : p.protokoll
        rueckfrage = { ...o.rueckfrage, nummer, vorherige }
        datei = p.auftrag.replace(/\.md$/, `-rueckfrage-${nummer}.md`)
      }
      mkdirSync(dirname(datei), { recursive: true })
      writeFileSync(datei, auftragMarkdown({ thema: { id: thema.id, name: thema.name, ziel: thema.ziel }, ziel, pfade: p, regeln: e.regeln ?? [], rueckfrage }), 'utf8')
      meldungen.push(`Auftrag  ${datei}`)
    }
  }
  return { meldungen, fehler }
}
