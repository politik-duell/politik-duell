import { useEffect, useState } from 'react'
import type { Katalog as Datenkatalog, KatalogMassnahme } from '../data/katalog'
import { BASIS, ladeThema, THEMEN } from '../pruefung/katalog'
import {
  aktuelleLandesprogramme,
  type Erfassung,
  hatEntwuerfe,
  hatLuecken,
  programmstand,
  type Programmstand,
  ursachenBaum,
} from './katalogAnsicht'

// Admin → Katalog: der Datenkatalog aus `daten/` zum Durchklicken – Thema → Ursache → Lösungsweg → Partei
// und Beleg. Mit ungeprüften Entwürfen, nur Programme der laufenden Wahlperiode. Nur lesen: Geändert wird
// weiter in `daten/` über einen Pull Request.

type Filter = 'alle' | 'luecken' | 'entwuerfe'

const FILTER: { id: Filter; name: string }[] = [
  { id: 'alle', name: 'Alle Themen' },
  { id: 'luecken', name: 'Mit Lücken' },
  { id: 'entwuerfe', name: 'Mit ungeprüften Einträgen' },
]

const ERFASSUNG: Record<Erfassung, string> = {
  massnahmen: 'Maßnahmen',
  keine: 'nichts dazu',
  teilweise: 'teilweise',
  fehlt: 'fehlt',
}

const FREIGABE = { geprueft: 'geprüft', ki: 'nur KI (Testphase)', offen: 'kein Eintrag' } as const

const PARTEIEN = BASIS.parteien
const partei = (id: number) => PARTEIEN.find((p) => p.id === id)?.kurzname ?? `Partei ${id}`
const landName = (id: string) => BASIS.laender.find((l) => l.id === id)?.name ?? id

function stand(s: Programmstand) {
  if (s.erfassung === 'fehlt') return '–'
  const pruefung = s.geprueft ? '' : s.ki_entwurf ? ' (Entwurf)' : ' (ungeprüft)'
  return ERFASSUNG[s.erfassung] + pruefung
}

export function Katalog() {
  const [filter, setFilter] = useState<Filter>('alle')
  const [suche, setSuche] = useState('')
  const [themaId, setThemaId] = useState<number | null>(null)

  if (themaId !== null) return <ThemaAnsicht themaId={themaId} zurueck={() => setThemaId(null)} />

  const n = PARTEIEN.length
  const begriff = suche.trim().toLowerCase()
  const themen = THEMEN.filter(
    (t) =>
      (filter === 'alle' || (filter === 'luecken' ? hatLuecken(t.kennzahlen, n) : hatEntwuerfe(t.kennzahlen))) &&
      (!begriff || t.name.toLowerCase().includes(begriff) || String(t.id) === begriff),
  )

  return (
    <>
      <p className="admin-hinweis">
        Der Datenkatalog aus <code>daten/</code> mit allen Entwürfen, Stand dieser Version der App. Nur zum Ansehen –
        geändert wird in <code>daten/</code> über einen Pull Request. Gezählt werden nur Programme der laufenden
        Wahlperiode.
      </p>
      <div className="admin-aktionen">
        <label className="admin-stichwort">
          Anzeigen
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            {FILTER.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-stichwort">
          Suche
          <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Name oder ID" />
        </label>
      </div>
      <p className="admin-klein">
        {themen.length} von {THEMEN.length} Themen. Ohne Lösungsweg: Ursachen, zu denen kein Programm etwas vorschlägt.
        Bund: Bundesprogramme, die zum Thema ganz durchsucht sind (davon geprüft). Land offen: Landesprogramme, die für
        Ursachen in Länderzuständigkeit noch fehlen.
      </p>
      {themen.length === 0 ? (
        <p className="admin-leer">Keine.</p>
      ) : (
        <div className="pruef-tabelle-rahmen">
          <table className="pruef-tabelle">
            <thead>
              <tr>
                <th scope="col">Thema</th>
                <th scope="col">Ursachen</th>
                <th scope="col">ohne Lösungsweg</th>
                <th scope="col">Lösungswege</th>
                <th scope="col">Maßnahmen</th>
                <th scope="col">ungeprüft</th>
                <th scope="col">Bund</th>
                <th scope="col">Land offen</th>
                <th scope="col">Freigabe</th>
              </tr>
            </thead>
            <tbody>
              {themen.map(({ id, name, kennzahlen: z }) => (
                <tr key={id}>
                  <th scope="row">
                    <button className="katalog-link" onClick={() => setThemaId(id)}>
                      {name}
                    </button>{' '}
                    <span className="admin-klein">({id})</span>
                  </th>
                  <td>{z.ursachen}</td>
                  <td className={z.ursachenOhneLoesungsweg ? 'pruef-klaeren' : undefined}>{z.ursachenOhneLoesungsweg}</td>
                  <td>{z.loesungswege}</td>
                  <td>{z.massnahmen}</td>
                  <td>{z.ungeprueft}</td>
                  <td className={z.bundErfasst < n ? 'pruef-klaeren' : undefined}>
                    {z.bundErfasst}/{n} ({z.bundGeprueft})
                  </td>
                  <td className={z.landOffen ? 'pruef-klaeren' : undefined}>{z.landOffen}</td>
                  <td>{FREIGABE[z.freigabe]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function ThemaAnsicht({ themaId, zurueck }: { themaId: number; zurueck: () => void }) {
  // Die Themendatei wird erst bei Bedarf geladen (src/pruefung/katalog.ts).
  const [geladen, setGeladen] = useState<{ id: number; katalog: Datenkatalog } | { id: number; fehler: string } | null>(null)
  useEffect(() => {
    let aktiv = true
    ladeThema(themaId).then(
      (katalog) => aktiv && setGeladen({ id: themaId, katalog }),
      (e: unknown) => aktiv && setGeladen({ id: themaId, fehler: e instanceof Error ? e.message : 'Laden fehlgeschlagen.' }),
    )
    return () => {
      aktiv = false
    }
  }, [themaId])

  const kopf = (
    <div className="admin-aktionen">
      <button className="knopf knopf-leise knopf-klein" onClick={zurueck}>
        ← Alle Themen
      </button>
    </div>
  )
  if (geladen?.id !== themaId) return <>{kopf}<p className="admin-klein">Wird geladen …</p></>
  if ('fehler' in geladen) return <>{kopf}<p className="admin-fehler" role="alert">{geladen.fehler}</p></>

  const k = geladen.katalog
  const thema = k.themen.find((t) => t.id === themaId)!
  const baum = ursachenBaum(k, themaId)
  const mitLand = baum.some((u) => u.ursache.ebene === 'land')
  const laender = mitLand ? [...new Set(aktuelleLandesprogramme(k).map((p) => p.land))] : []
  const hatProgramm = (parteiId: number, land: string) => aktuelleLandesprogramme(k).some((p) => p.partei_id === parteiId && p.land === land)

  return (
    <>
      {kopf}
      <section className="pruef-auswertung" aria-labelledby="h-thema">
        <h2 id="h-thema">
          {thema.name} <span className="admin-klein">({thema.id})</span>
        </h2>
        <p>{thema.beschreibung}</p>
        {thema.ziel && <p className="admin-klein">Ziel: {thema.ziel}</p>}
        <p className="admin-klein">
          Freigabe der Ursachen:{' '}
          {thema.freigabe
            ? `${thema.freigabe.datum}${thema.freigabe.art === 'ki' ? ' (nur KI, Testphase)' : ''}`
            : 'kein Eintrag (Themen von vor dem 2. 10. 2026 haben das Feld nicht)'}
        </p>
      </section>

      <section className="pruef-auswertung" aria-labelledby="h-programme">
        <h2 id="h-programme">Erfassung je Programm</h2>
        <p className="admin-klein">
          Maßnahmen: zum Thema durchsucht, Maßnahmen gefunden. Nichts dazu: durchsucht, das Programm enthält nichts.
          Teilweise: nach einer später ergänzten Ursache noch nicht durchsucht. – : noch nicht erfasst, die Runde wird
          nicht gewertet.
          {mitLand && ' Landesprogramme zählen nur für Ursachen in Länderzuständigkeit.'}
        </p>
        <div className="pruef-tabelle-rahmen">
          <table className="pruef-tabelle">
            <thead>
              <tr>
                <th scope="col">Partei</th>
                <th scope="col">Bund</th>
                {laender.map((l) => (
                  <th key={l} scope="col">
                    {landName(l)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PARTEIEN.map((p) => (
                <tr key={p.id}>
                  <th scope="row">{p.kurzname}</th>
                  <ProgrammZelle s={programmstand(k, themaId, p.id, null)} />
                  {laender.map((l) =>
                    hatProgramm(p.id, l) ? (
                      <ProgrammZelle key={l} s={programmstand(k, themaId, p.id, l)} />
                    ) : (
                      <td key={l} className="admin-klein">
                        kein Programm
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pruef-auswertung" aria-labelledby="h-ursachen">
        <h2 id="h-ursachen">
          Ursachen und Lösungswege <span className="admin-zahl">{baum.length}</span>
        </h2>
        <p className="admin-klein">
          Je Ursache die Lösungswege, nach Punkten (Wirksamkeit × Umsetzbarkeit, ohne Rolle). Werte „Entwurf“: noch
          von niemandem geprüft. Die Kürzel verlinken die Programmstelle; * = Maßnahme noch nicht geprüft.
        </p>
        <ol className="admin-liste">
          {baum.map(({ ursache: u, wege }) => (
            <li key={u.id} className="admin-eintrag">
              <p>
                <strong>{u.beschreibung}</strong> <span className="admin-klein">({u.id})</span>
              </p>
              {u.alltag && <p className="admin-klein">Im Spiel: „{u.alltag}“</p>}
              <p className="admin-klein">
                {u.ebene === 'land' ? 'Länderzuständigkeit' : 'Bund'}
                {u.gilt_fuer && ` · gilt für: ${u.gilt_fuer}`}
                {u.nachtraeglich && ' · nachträglich ergänzt'} ·{' '}
                <a href={u.quelle_url} target="_blank" rel="noreferrer">
                  Quelle
                </a>
              </p>
              {wege.length === 0 ? (
                <p className="admin-warnung">Kein Lösungsweg erfasst.</p>
              ) : (
                <ul className="katalog-wege">
                  {wege.map(({ einheit: e, massnahmen, punkte, bewertungen }) => (
                    <li key={e.id}>
                      <span className="admin-zahl">{punkte}</span> {e.beschreibung}{' '}
                      <span className="admin-klein">
                        ({e.wirksamkeit} × {e.umsetzbarkeit}
                        {e.evidenz && `, Forschung ${e.evidenz}`}, {bewertungen ? `${bewertungen} Bewertungen` : 'Entwurf'}
                        {e.beleg_studie_url && (
                          <>
                            ,{' '}
                            <a href={e.beleg_studie_url} target="_blank" rel="noreferrer">
                              Studie
                            </a>
                          </>
                        )}
                        )
                      </span>
                      <div className="katalog-parteien">
                        {massnahmen.map((m) => (
                          <Beleg key={m.id} m={m} />
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      {thema.symptome && thema.symptome.length > 0 && (
        <section className="pruef-auswertung" aria-labelledby="h-symptome">
          <h2 id="h-symptome">Symptomgruppen</h2>
          <ul>
            {thema.symptome.map((s) => (
              <li key={s.nr}>
                „{s.alltag}“{' '}
                <span className="admin-klein">
                  (Ursachen {s.ursachen_ids.join(', ')}
                  {s.ki_entwurf && ', Entwurf'})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function ProgrammZelle({ s }: { s: Programmstand }) {
  return <td className={s.erfassung === 'fehlt' || s.erfassung === 'teilweise' ? 'pruef-klaeren' : undefined}>{stand(s)}</td>
}

function Beleg({ m }: { m: KatalogMassnahme }) {
  const name = partei(m.partei_id) + (m.land ? ` · ${m.land}` : '') + (m.geprueft ? '' : '*')
  return (
    <a className="katalog-partei" href={m.beleg_programm_url} target="_blank" rel="noreferrer" title={m.beschreibung}>
      {name}
    </a>
  )
}
