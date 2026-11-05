// Edge Function `analyse`: ordnet eine Äußerung per KI (Mistral) ein. Die KI
// vergibt keine Punkte und nennt keine Links – Punkte kommen deterministisch aus
// der Datenbank (gerechnet in der App). Gespeichert wird nichts von der Eingabe:
// weder Wortlaut noch Kurzfassung, Thema oder Ergebnis (Migration 20261103000000).
// Themen vorschlagen geht ausdrücklich über die Edge Function `vorschlag`.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   MISTRAL_API_KEY            – Pflicht
//   MISTRAL_MODEL              – optional, Standard: mistral-medium-latest
//   ERLAUBTE_URSPRUENGE        – optional, z. B. „https://politik-duell.de, https://politik-duell-*.vercel.app“;
//                                leer: Aufrufe von überall erlaubt
//   RATE_LIMIT_GLOBAL          – optional, Anfragen pro Stunde über alle Sitzungen (Standard: 600)
// Automatisch vorhanden: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  antwortAusAuswahl,
  bereinigeInstrument,
  EingabeFehler,
  type HaltungKurz,
  instrumentNachrichten,
  instrumentPrompt,
  instrumenteZurAuswahl,
  mitInstrument,
  ordneEin,
  pruefeAnfrage,
} from '../_shared/ki.ts'
import { tokenHash } from '../_shared/pruefung.ts'
import type {
  AnalyseAntwort,
  InstrumentEintrag,
  Massnahme,
  Nachricht,
  Partei,
  Thema,
  Ursache,
} from '../_shared/typen.ts'
import {
  corsKoepfe,
  erlaubteUrspruenge,
  GLOBALE_SITZUNG,
  globalesLimit,
  RATE_LIMIT_GLOBAL,
  RATE_LIMIT_SITZUNG,
  ursprungErlaubt,
} from '../_shared/zugriff.ts'
import { type ChatNachricht, frageMistral as frageMistralMit } from '../_shared/mistral.ts'

const MAX_ANFRAGE_BYTES = 8_000

const ERLAUBT = erlaubteUrspruenge(Deno.env.get('ERLAUBTE_URSPRUENGE'))
const GLOBAL_MAX = globalesLimit(Deno.env.get('RATE_LIMIT_GLOBAL'))

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

/** Fragt Mistral mit den Einstellungen aus `_shared/mistral.ts` (dieselben wie im Testset). */
async function frageMistral(system: string, nachrichten: ChatNachricht[]): Promise<unknown> {
  const key = Deno.env.get('MISTRAL_API_KEY')
  if (!key) throw new Error('MISTRAL_API_KEY fehlt')
  return frageMistralMit(system, nachrichten, { key, modell: Deno.env.get('MISTRAL_MODEL') })
}

async function lesJson(req: Request): Promise<unknown> {
  const text = await req.text()
  if (new TextEncoder().encode(text).length > MAX_ANFRAGE_BYTES) throw new EingabeFehler('Anfrage zu groß.')
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** Zählt eine Anfrage; false, wenn das Limit im Zeitfenster überschritten ist. */
async function imLimit(sitzung: string, max: number, fenster: string): Promise<boolean> {
  const { data, error } = await db.rpc('rate_limit_pruefen', { p_sitzung: sitzung, p_max: max, p_fenster: fenster })
  if (error) throw error
  return data === true
}

Deno.serve(async (req) => {
  const ursprung = req.headers.get('origin')
  const cors = corsKoepfe(ursprung, ERLAUBT)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (!ursprungErlaubt(ursprung, ERLAUBT)) return json({ fehler: 'Aufruf von dieser Seite nicht erlaubt.' }, 403)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ fehler: 'Nur POST erlaubt.' }, 405)

  try {
    const anfrage = pruefeAnfrage(await lesJson(req))

    // Erst pro Sitzung, dann für alle zusammen (Kostendeckel für die KI – angetippte Ursachen fragen keine KI).
    if (!(await imLimit(anfrage.sitzung, RATE_LIMIT_SITZUNG.max, RATE_LIMIT_SITZUNG.fenster)))
      return json({ fehler: 'Zu viele Anfragen. Bitte warte ein paar Minuten.' }, 429)
    if (!anfrage.auswahl && !(await imLimit(GLOBALE_SITZUNG, GLOBAL_MAX, RATE_LIMIT_GLOBAL.fenster)))
      return json({ fehler: 'Gerade spielen sehr viele Leute. Bitte versuch es etwas später noch einmal.' }, 503)

    const [themenRes, ursachenRes, parteienRes] = await Promise.all([
      db.from('themen').select('id, name, beschreibung, symptome'),
      db.from('ursachen').select('*'),
      db.from('parteien').select('*'),
    ])
    if (themenRes.error) throw themenRes.error
    if (ursachenRes.error) throw ursachenRes.error
    if (parteienRes.error) throw parteienRes.error
    const ursachen = ursachenRes.data as Ursache[]
    const parteien = parteienRes.data as Partei[]

    // KI-Entwürfe (Maßnahmen, Instrumente, Symptomgruppen) zählen mit Zugang zur Testphase – oder für alle,
    // solange der Schalter `einstellungen.ki_entwuerfe_oeffentlich` an ist (Alpha/Beta, CLAUDE.md Grundprinzip 2).
    const testphase = anfrage.zugang ? await zugangGueltig(anfrage.zugang) : false
    const entwuerfe = testphase || (await entwuerfeOeffentlich())
    const themen = mitSymptomen(themenRes.data as Thema[], entwuerfe)

    // Angetippte Ursachen: ohne KI werten. Sonst ordnet die KI die Schilderung ein – bei einer Haltung
    // auch einer der vollständig erfassten Wertfragen (Haltungskarte). Bei einem Problem in zwei Schritten
    // (erst Thema, dann dessen Ursachen); der zweite zählt nicht extra für das Rate-Limit.
    let antwort: AnalyseAntwort
    if (anfrage.auswahl) {
      antwort = antwortAusAuswahl(anfrage.auswahl, themen, ursachen)
    } else {
      const haltungen = await vollstaendigeHaltungen(entwuerfe)
      antwort = (await ordneEin(frageMistral, anfrage.verlauf, { themen, ursachen, parteien, haltungen })).antwort
    }

    // Forderung mit erkanntem Thema: ein zweiter, kurzer Aufruf nur mit den Instrumenten dieses Themas.
    // Er zählt nicht extra für das Rate-Limit; scheitert er, bleibt es bei der Forderung ohne Karte.
    if (antwort.typ === 'forderung' && !antwort.pauschal && antwort.thema_id !== null) {
      const thema = themen.find((t) => t.id === antwort.thema_id)
      if (thema) antwort = mitInstrument(antwort, await erkenneInstrument(thema, anfrage.verlauf, anfrage.seiten.map((s) => s.land), entwuerfe))
    }

    return json(antwort)
  } catch (e) {
    if (e instanceof EingabeFehler) return json({ fehler: e.message }, 400)
    console.error('analyse:', e instanceof Error ? e.message : e)
    return json({ fehler: 'Die Einordnung hat gerade nicht geklappt. Bitte versuch es noch einmal.' }, 502)
  }
})

/**
 * Zweiter Aufruf bei einer Forderung: Entspricht sie eindeutig einem Instrument des Themas? Der Service-Key
 * umgeht Row Level Security: Entwürfe deshalb ausdrücklich nur, wenn sie zählen.
 */
async function erkenneInstrument(
  thema: Thema,
  verlauf: Nachricht[],
  laender: (string | null)[],
  entwuerfe: boolean,
): Promise<number | null> {
  try {
    let iAbfrage = db.from('instrumente').select('id, thema_id, name, ebene').eq('thema_id', thema.id)
    let mAbfrage = db.from('massnahmen').select('instrument_id, land').eq('thema_id', thema.id).not('instrument_id', 'is', null)
    if (!entwuerfe) {
      iAbfrage = iAbfrage.eq('ki_entwurf', false)
      mAbfrage = mAbfrage.eq('ki_entwurf', false)
    }
    const [iRes, mRes] = await Promise.all([iAbfrage, mAbfrage])
    if (iRes.error) throw iRes.error
    if (mRes.error) throw mRes.error
    const kandidaten = instrumenteZurAuswahl(
      thema.id,
      iRes.data as Pick<InstrumentEintrag, 'id' | 'thema_id' | 'name' | 'ebene'>[],
      mRes.data as Pick<Massnahme, 'instrument_id' | 'land'>[],
      laender,
    )
    if (!kandidaten.length) return null
    const roh = await frageMistral(instrumentPrompt(thema, kandidaten), instrumentNachrichten(verlauf))
    return bereinigeInstrument(roh, kandidaten)
  } catch (e) {
    console.error('erkenneInstrument:', e instanceof Error ? e.message : e)
    return null
  }
}

/**
 * Haltungen mit vollständiger Karte (alle Parteien, View `haltungen_vollstaendig`) – nur sie kommen in den
 * Prompt. Der Service-Key sieht auch Entwürfe; zählen deshalb nur geprüfte Karten, solange Entwürfe nicht zählen.
 * Fehlen die Tabellen (Migration noch nicht ausgeführt) oder klappt die Abfrage nicht: keine Haltungen.
 */
async function vollstaendigeHaltungen(entwuerfe: boolean): Promise<HaltungKurz[]> {
  try {
    let vAbfrage = db.from('haltungen_vollstaendig').select('haltung_id')
    if (!entwuerfe) vAbfrage = vAbfrage.eq('geprueft', true)
    const [vRes, hRes] = await Promise.all([vAbfrage, db.from('haltungen').select('id, frage').order('id')])
    if (vRes.error) throw vRes.error
    if (hRes.error) throw hRes.error
    const ids = new Set((vRes.data as { haltung_id: number }[]).map((v) => v.haltung_id))
    return (hRes.data as HaltungKurz[]).filter((h) => ids.has(h.id))
  } catch (e) {
    console.error('vollstaendigeHaltungen:', e instanceof Error ? e.message : e)
    return []
  }
}

/** Symptomgruppen, die zählen: ohne Entwürfe nur die von Menschen geprüften (docs/plan-symptome.md). */
function mitSymptomen(themen: Thema[], entwuerfe: boolean): Thema[] {
  return themen.map((t) => ({ ...t, symptome: (t.symptome ?? []).filter((s) => entwuerfe || !s.ki_entwurf) }))
}

/** Zählen KI-Entwürfe für alle (Schalter aus Migration 20261025000000)? Ohne die Tabelle: nein. */
async function entwuerfeOeffentlich(): Promise<boolean> {
  const { data, error } = await db.from('einstellungen').select('ki_entwuerfe_oeffentlich').maybeSingle()
  if (error) return false
  return data?.ki_entwuerfe_oeffentlich === true
}

/** Gültiger, nicht gesperrter Zugang zur Testphase? Dann zählen auch KI-Entwürfe. */
async function zugangGueltig(token: string): Promise<boolean> {
  const { data, error } = await db
    .from('testphase_zugaenge')
    .select('id')
    .eq('token_hash', await tokenHash(token))
    .eq('gesperrt', false)
    .maybeSingle()
  if (error) throw error
  return data !== null
}
