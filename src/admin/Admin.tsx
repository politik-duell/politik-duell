import type { Session } from '@supabase/supabase-js'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Logo } from '../components/Logo'
import { adminDb, type ThemenVorschlag } from './client'
import { Katalog } from './Katalog'
import { Pruefung } from './Pruefung'
import { Testphase } from './Testphase'

// Einfache Admin-Ansicht (#/admin): Themenvorschläge der Spielenden sichten, den Datenkatalog durchsehen,
// Prüfende einladen und ihre Bewertungen auswerten, Zugänge zur Testphase verwalten. Eingaben aus dem Spiel werden
// nicht gespeichert (Migration 20261103000000) – hier gibt es deshalb keine Runden.
// Zugriff regelt die Datenbank: Nur Konten in der Tabelle `admins` sehen etwas.

type Reiter = 'vorschlaege' | 'katalog' | 'pruefung' | 'testphase'

const REITER: { id: Reiter; name: string }[] = [
  { id: 'vorschlaege', name: 'Vorschläge' },
  { id: 'katalog', name: 'Katalog' },
  { id: 'pruefung', name: 'Prüfung' },
  { id: 'testphase', name: 'Testphase' },
]

const zeit = (iso: string) =>
  new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

export function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  // Ergebnis der Admin-Prüfung je Konto; solange es fehlt: „laedt“.
  const [adminFuer, setAdminFuer] = useState<{ id: string; admin: boolean } | null>(null)

  useEffect(() => {
    if (!adminDb) return
    adminDb.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = adminDb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!adminDb || !session) return
    const id = session.user.id
    adminDb.rpc('ist_admin').then(({ data, error }) => setAdminFuer({ id, admin: !error && data === true }))
  }, [session])

  const pruefung =
    !session || adminFuer?.id !== session.user.id ? 'laedt' : adminFuer.admin ? 'admin' : 'kein-admin'

  return (
    <div className="app admin">
      <header className="admin-kopf">
        <a href="#/" className="admin-marke">
          <Logo groesse={36} />
          <span>Politik-Duell · Moderation</span>
        </a>
        {session && (
          <button className="knopf knopf-leise" onClick={() => adminDb?.auth.signOut()}>
            Abmelden
          </button>
        )}
      </header>
      {!adminDb ? (
        <p className="admin-hinweis">Keine Supabase-Verbindung konfiguriert (VITE_SUPABASE_URL fehlt).</p>
      ) : !session ? (
        <Anmeldung />
      ) : pruefung === 'laedt' ? (
        <p className="admin-hinweis">Prüfe Berechtigung …</p>
      ) : pruefung === 'kein-admin' ? (
        <p className="admin-hinweis" role="alert">
          Angemeldet als {session.user.email}, aber ohne Admin-Rechte. Ein Admin muss dieses Konto in der Tabelle{' '}
          <code>admins</code> eintragen (siehe EINRICHTEN.md).
        </p>
      ) : (
        <Moderation />
      )}
    </div>
  )
}

function Anmeldung() {
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [fehler, setFehler] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)

  async function anmelden(e: FormEvent) {
    e.preventDefault()
    setLaeuft(true)
    setFehler(null)
    const { error } = await adminDb!.auth.signInWithPassword({ email, password: passwort })
    setLaeuft(false)
    if (error) setFehler('Anmeldung fehlgeschlagen. E-Mail und Passwort prüfen.')
  }

  return (
    <form className="admin-anmeldung" onSubmit={anmelden}>
      <h1>Anmelden</h1>
      <label>
        E-Mail
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Passwort
        <input
          type="password"
          autoComplete="current-password"
          required
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
        />
      </label>
      {fehler && (
        <p className="admin-fehler" role="alert">
          {fehler}
        </p>
      )}
      <button className="knopf" disabled={laeuft}>
        {laeuft ? 'Melde an …' : 'Anmelden'}
      </button>
    </form>
  )
}

function Moderation() {
  const [reiter, setReiter] = useState<Reiter>('vorschlaege')

  return (
    <main>
      <nav className="admin-reiter" aria-label="Bereiche">
        {REITER.map((r) => (
          <button
            key={r.id}
            className={r.id === reiter ? 'aktiv' : ''}
            aria-current={r.id === reiter ? 'page' : undefined}
            onClick={() => setReiter(r.id)}
          >
            {r.name}
          </button>
        ))}
      </nav>
      {reiter === 'pruefung' ? (
        <Pruefung />
      ) : reiter === 'testphase' ? (
        <Testphase />
      ) : reiter === 'katalog' ? (
        <Katalog />
      ) : (
        <Vorschlaege />
      )}
    </main>
  )
}

/** Themenvorschläge (Tabelle themen_vorschlaege): offene zuerst; „Erledigt“ hakt ab, „Löschen“ entfernt sofort. */
function Vorschlaege() {
  const db = adminDb!
  const [liste, setListe] = useState<ThemenVorschlag[]>([])
  const [erledigte, setErledigte] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  const laden = useCallback(async () => {
    const { data, error } = await db
      .from('themen_vorschlaege')
      .select('id, created_at, text, erledigt')
      .order('created_at', { ascending: false })
      .limit(500)
    setFehler(error ? `${error.message} – ist die Migration 20261103000000_keine_eingaben_speichern.sql ausgeführt?` : null)
    if (data) setListe(data as ThemenVorschlag[])
  }, [db])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const baldLaden = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void laden(), 500)
    }
    const kanal = db
      .channel('vorschlaege')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'themen_vorschlaege' }, baldLaden)
      // Erst laden, wenn der Kanal steht – so geht keine Änderung dazwischen verloren.
      // Klappt Realtime nicht, trotzdem einmal laden.
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') void laden()
      })
    return () => {
      clearTimeout(timer)
      void db.removeChannel(kanal)
    }
  }, [db, laden])

  async function erledigen(id: number, erledigt: boolean) {
    const { error } = await db.from('themen_vorschlaege').update({ erledigt }).eq('id', id)
    if (error) setFehler(error.message)
    await laden()
  }

  async function loeschen(id: number) {
    if (!confirm('Vorschlag endgültig löschen?')) return
    const { error } = await db.from('themen_vorschlaege').delete().eq('id', id)
    if (error) setFehler(error.message)
    await laden()
  }

  const offen = liste.filter((v) => !v.erledigt)
  const sichtbar = erledigte ? liste.filter((v) => v.erledigt) : offen

  return (
    <>
      <p className="admin-hinweis">
        Themen, die Spielende über „Thema vorschlagen“ ausdrücklich eingereicht haben – ohne KI, ohne Bezug zu einer
        Runde. Nie öffentlich; spätestens nach 180 Tagen automatisch gelöscht. Auswerten lässt sich die Liste auch mit{' '}
        <code>npm run vorschlaege</code>.
      </p>
      {fehler && (
        <p className="admin-fehler" role="alert">
          {fehler}
        </p>
      )}
      <p className="admin-aktionen">
        <button className="knopf knopf-klein knopf-leise" onClick={() => setErledigte((e) => !e)}>
          {erledigte ? `Offene zeigen (${offen.length})` : `Erledigte zeigen (${liste.length - offen.length})`}
        </button>
      </p>
      {sichtbar.length === 0 && <p className="admin-leer">{erledigte ? 'Keine erledigten Vorschläge.' : 'Nichts offen.'}</p>}
      <ul className="admin-liste">
        {sichtbar.map((v) => (
          <li key={v.id} className="admin-eintrag">
            <p className="admin-text">{v.text}</p>
            <div className="admin-aktionen">
              <span className="admin-klein">{zeit(v.created_at)}</span>
              <button className="knopf knopf-klein" onClick={() => erledigen(v.id, !v.erledigt)}>
                {v.erledigt ? 'Wieder öffnen' : 'Erledigt'}
              </button>
              <button className="knopf knopf-klein knopf-gefahr" onClick={() => loeschen(v.id)}>
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
