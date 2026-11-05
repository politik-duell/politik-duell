// Edge Function `vorschlag`: Spielende schlagen ein Thema vor, das im Spiel noch fehlt. Ohne KI – Format und
// Wortfilter prüfen, dann nur den Text in `themen_vorschlaege` schreiben (keine Sitzung, keine Parteien, keine IP).
// Lesen und abhaken: Admin-Ansicht (Reiter „Vorschläge“) oder `npm run vorschlaege`.
//
// Secrets: ERLAUBTE_URSPRUENGE wie bei `analyse` (optional).
// Automatisch vorhanden: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'npm:@supabase/supabase-js@2'
import { bearbeiteVorschlag } from '../_shared/vorschlag.ts'
import { corsKoepfe, erlaubteUrspruenge, ursprungErlaubt } from '../_shared/zugriff.ts'

const MAX_ANFRAGE_BYTES = 4_000

const ERLAUBT = erlaubteUrspruenge(Deno.env.get('ERLAUBTE_URSPRUENGE'))

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

Deno.serve(async (req) => {
  const ursprung = req.headers.get('origin')
  const cors = corsKoepfe(ursprung, ERLAUBT)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (!ursprungErlaubt(ursprung, ERLAUBT)) return json({ fehler: 'Aufruf von dieser Seite nicht erlaubt.' }, 403)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ fehler: 'Nur POST erlaubt.' }, 405)

  try {
    const text = await req.text()
    if (new TextEncoder().encode(text).length > MAX_ANFRAGE_BYTES) return json({ fehler: 'Anfrage zu groß.' }, 400)
    let roh: unknown = null
    try {
      roh = JSON.parse(text)
    } catch {
      // bleibt null → „Ungültige Anfrage.“
    }
    const { status, body } = await bearbeiteVorschlag(roh, {
      async imLimit(schluessel, max, fenster) {
        const { data, error } = await db.rpc('rate_limit_pruefen', { p_sitzung: schluessel, p_max: max, p_fenster: fenster })
        if (error) throw error
        return data === true
      },
      async speichern(vorschlag) {
        const { error } = await db.from('themen_vorschlaege').insert({ text: vorschlag })
        if (error) throw error
      },
    })
    return json(body, status)
  } catch (e) {
    console.error('vorschlag:', e instanceof Error ? e.message : e)
    return json({ fehler: 'Das hat gerade nicht geklappt. Bitte versuch es noch einmal.' }, 502)
  }
})
