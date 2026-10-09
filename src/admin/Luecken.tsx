import { useCallback, useEffect, useState } from 'react'
import { adminDb } from './client'
import { type Auswahl, gesamt, type KennzahlWoche, type Luecke, type LueckenArt, sortiereLuecken, wochen } from './kennzahlen'

// Admin → Lücken: Wo das Spiel keine Wertung liefern konnte (je Thema bzw. Stichwort gezählt) und wie oft es
// gewertet hat (je Woche). Nur Zahlen aus `runden`, kein Wortlaut; die Zahlen bleiben auch nach 30 Tagen.

const ARTEN: { art: LueckenArt; titel: string; was: string; schritt: string }[] = [
  {
    art: 'unvollstaendig',
    titel: 'Thema erkannt, Partei noch nicht erfasst',
    was: 'Runden ohne Wertung, weil für eine der beiden Parteien das Programm zum Thema noch nicht erfasst ist.',
    schritt: '/thema-erfassen <ID>',
  },
  {
    art: 'kein_thema',
    titel: 'Kein passendes Thema',
    was: 'Probleme, zu denen kein Thema angelegt ist (gezählt nach Stichwort der KI).',
    schritt: '/thema-anlegen',
  },
  {
    art: 'forderung_ohne_loesungsweg',
    titel: 'Forderung ohne erfassten Lösungsweg',
    was: 'Forderungen zu einem bekannten Thema, für die keine Forderungskarte gezeigt werden konnte.',
    schritt: '/forderung-erfassen',
  },
  {
    art: 'forderung_ohne_thema',
    titel: 'Forderung ohne Thema',
    was: 'Forderungen, die keinem Thema zugeordnet werden konnten (nach Stichwort).',
    schritt: '/thema-anlegen',
  },
  {
    art: 'haltung_ohne_karte',
    titel: 'Haltung ohne Haltungskarte',
    was: 'Persönliche Haltungen, zu denen keine vollständig erfasste Wertfrage passt (nach Stichwort).',
    schritt: '/haltung-anlegen',
  },
]

const AUSWAHL: { id: Auswahl; name: string }[] = [
  { id: 'alle', name: 'Alle Runden' },
  { id: 'oeffentlich', name: 'Ohne Testphase' },
  { id: 'testphase', name: 'Nur Testphase' },
]

const quote = (x: number | null) => (x === null ? '–' : `${x.toLocaleString('de-DE')} %`)
const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })

export function Luecken({ themaName }: { themaName: (id: number | null) => string | null }) {
  const db = adminDb!
  const [kennzahlen, setKennzahlen] = useState<KennzahlWoche[]>([])
  const [luecken, setLuecken] = useState<Luecke[]>([])
  const [auswahl, setAuswahl] = useState<Auswahl>('alle')
  const [fehler, setFehler] = useState<string | null>(null)

  const laden = useCallback(async () => {
    const [k, l] = await Promise.all([db.from('kennzahlen_woche').select('*'), db.from('luecken').select('*')])
    const f = k.error ?? l.error
    // Fehlt die Sicht, ist die Migration noch nicht eingespielt.
    setFehler(f ? `${f.message} – ist die Migration 20261013000000_luecken_kennzahlen.sql ausgeführt?` : null)
    if (k.data) setKennzahlen(k.data as KennzahlWoche[])
    if (l.data) setLuecken(l.data as Luecke[])
  }, [db])

  useEffect(() => {
    let aktiv = true
    void Promise.resolve().then(() => {
      if (aktiv) void laden()
    })
    return () => {
      aktiv = false
    }
  }, [laden])

  const liste = wochen(kennzahlen, auswahl)
  const summe = gesamt(liste)

  return (
    <>
      <p className="admin-hinweis">
        Nur Zahlen aus den gespielten Runden, ohne Wortlaut. Daraus ergibt sich, was als Nächstes erfasst wird: oben
        steht, was in den letzten 30 Tagen am häufigsten ohne Wertung blieb. Die Häufigkeit bestimmt nur die
        Reihenfolge, nie eine Bewertung.
      </p>
      {fehler && (
        <p className="admin-fehler" role="alert">
          {fehler}
        </p>
      )}

      <section className="pruef-auswertung" aria-labelledby="h-kennzahlen">
        <h2 id="h-kennzahlen">Kennzahlen je Woche</h2>
        <div className="admin-aktionen">
          <label className="admin-stichwort">
            Runden
            <select value={auswahl} onChange={(e) => setAuswahl(e.target.value as Auswahl)}>
              {AUSWAHL.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {summe === null ? (
          <p className="admin-leer">Noch keine Runden.</p>
        ) : (
          <>
            <p className="admin-klein">
              Erkannt: Anteil der Alltagsprobleme mit erkanntem Thema. Gewertet: Anteil der Alltagsprobleme mit Punkten.
              Karte: Anteil der Forderungen und Haltungen, zu denen eine Forderungs- oder Haltungskarte kam. Grenzfälle
              zählen nur in „Runden“.
            </p>
            <div className="pruef-tabelle-rahmen">
              <table className="pruef-tabelle">
                <thead>
                  <tr>
                    <th scope="col">Woche ab</th>
                    <th scope="col">Runden</th>
                    <th scope="col">Probleme</th>
                    <th scope="col">Erkannt</th>
                    <th scope="col">Gewertet</th>
                    <th scope="col">Forderungen</th>
                    <th scope="col">Haltungen</th>
                    <th scope="col">Karte</th>
                    <th scope="col">Grenze</th>
                  </tr>
                </thead>
                <tbody>
                  {[summe, ...liste].map((w) => (
                    <tr key={w.woche}>
                      <th scope="row">{w.woche === 'gesamt' ? 'Gesamt' : datum(w.woche)}</th>
                      <td>{w.runden}</td>
                      <td>{w.probleme}</td>
                      <td>{quote(w.erkannt)}</td>
                      <td>{quote(w.gewertet_anteil)}</td>
                      <td>{w.forderung}</td>
                      <td>{w.wert}</td>
                      <td>{quote(w.karte_anteil)}</td>
                      <td>{w.grenze}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {ARTEN.map(({ art, titel, was, schritt }) => {
        const zeilen = sortiereLuecken(luecken, art)
        return (
          <section key={art} className="pruef-auswertung" aria-labelledby={`h-${art}`}>
            <h2 id={`h-${art}`}>
              {titel} <span className="admin-zahl">{zeilen.length}</span>
            </h2>
            <p className="admin-klein">
              {was} Nächster Schritt: <code>{schritt}</code>
            </p>
            {zeilen.length === 0 ? (
              <p className="admin-leer">Keine.</p>
            ) : (
              <div className="pruef-tabelle-rahmen">
                <table className="pruef-tabelle">
                  <thead>
                    <tr>
                      <th scope="col">{art === 'unvollstaendig' || art === 'forderung_ohne_loesungsweg' ? 'Thema' : 'Stichwort'}</th>
                      <th scope="col">30 Tage</th>
                      <th scope="col">Insgesamt</th>
                      <th scope="col">davon Testphase</th>
                      <th scope="col">Zuletzt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zeilen.map((l) => (
                      <tr key={`${l.thema_id}-${l.stichwort}`}>
                        <th scope="row">
                          {l.thema_id !== null ? `${themaName(l.thema_id)} (${l.thema_id})` : (l.stichwort ?? 'ohne Stichwort')}
                        </th>
                        <td>{l.anzahl_30_tage}</td>
                        <td>{l.anzahl}</td>
                        <td>{l.anzahl_testphase}</td>
                        <td>{datum(l.zuletzt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
