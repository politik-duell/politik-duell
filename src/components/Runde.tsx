import { useState } from 'react'
import { useDaten } from '../data/kontext'
import { analysiere, AnalyseFehler, ebenenFuer, type Daten } from '../data/quelle'
import type { AnalyseAntwort, Nachricht, Seite } from '../data/types'
import { besteParteien, bewertePartei, werteRunde } from '../logic/bewertung'
import { haltungskarte } from '../logic/haltung'
import { zufallsBeispiel, type BeispielArt } from '../logic/zufall'
import { mitKarte, vergleichsSeite, type Karte, type RundenErgebnis, type Spieler } from '../spiel'
import { ForderungsKarte } from './ForderungsKarte'
import { HALTUNG_EINLEITUNG, HaltungsKarte } from './HaltungsKarte'
import { UrsachenAuswahl } from './UrsachenAuswahl'

/** Fester Satz zu einer Haltung, wenn die KI keine eigene Rückmeldung liefert. */
const WERT_ANTWORT =
  'Das ist eine persönliche Haltung – darüber kann man verschieden denken. ' +
  'Magst du erzählen, wo dir das im Alltag begegnet?'

/**
 * Grenze (Abwertung, Gewalt, Beleidigung): ohne Belehrung, ohne Wiedergabe, ohne Karte – nur die Einladung
 * zu einem Alltagsproblem. Die Runde läuft weiter.
 */
const GRENZE_ANTWORT = 'Darauf geht das Spiel nicht ein. Magst du ein Problem aus deinem Alltag nennen?'

/** Nach einem Pauschalurteil ohne Alltagsproblem: das Urteil nicht als „Forderung“ bestätigen. */
const PAUSCHAL_ANTWORT = 'Gewertet werden hier Lösungen für konkrete Alltagsprobleme. Magst du eins nennen?'

/**
 * Fester Satz zu einer Forderung ohne Alltagsproblem nach zwei Nachfragen (keine Wertung, neues Problem
 * möglich) – wenn die KI keine eigene Rückmeldung liefert.
 */
function forderungAntwort(themaName: string | null): string {
  return (
    'Deine Forderung haben wir verstanden' +
    (themaName ? ` – sie gehört zum Thema „${themaName}“` : '') +
    '. Gewertet werden hier Lösungen für konkrete Alltagsprobleme. Magst du eins nennen?'
  )
}

/** Nach „Nichts davon passt“: sagen, dass dieser Teil des Themas noch fehlt, und zu einem neuen Problem einladen. */
function passtNichtAntwort(themaName: string | null): string {
  return (
    'Danke – das ist ' +
    (themaName ? `beim Thema „${themaName}“ ` : '') +
    'noch nicht erfasst. Wir sehen es uns an und ergänzen fehlende Ursachen. Magst du ein anderes Problem nennen?'
  )
}

/**
 * Schalter „nur Alltagsprobleme“ fürs Zufallsbeispiel: gilt für alle Runden bis zum Neuladen. Bewusst nicht im
 * Browser gespeichert – sonst bräuchte es einen Eintrag in der Datenschutzerklärung (§ 25 TDDDG).
 */
let nurProblemeGewaehlt = false
const liesNurProbleme = () => nurProblemeGewaehlt
const merkeNurProbleme = (an: boolean) => {
  nurProblemeGewaehlt = an
}

/** Was das Zufallsbeispiel in der Eingabe ist – damit klar ist, was die Runde damit macht. */
const BEISPIEL_TEXT: Record<BeispielArt, string> = {
  problem: 'Beispiel-Problem aus der Datenbank (wird gewertet)',
  forderung: 'Beispiel-Forderung aus der Datenbank (Nachfrage und Forderungskarte, ohne Punkte)',
  wert: 'Beispiel-Haltung aus der Datenbank (Haltungskarte, ohne Punkte)',
}

/** Zwei sich kreuzende Pfeile (Zufallswiedergabe) – eigenes Symbol. */
function ShuffleSymbol() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="symbol">
      <path
        d="M3 6h3.5c2 0 3.2 1 4.3 2.7l2.4 3.6c1.1 1.7 2.3 2.7 4.3 2.7H20M3 18h3.5c1.5 0 2.5-.6 3.4-1.6M13.6 7.6c.9-1 1.9-1.6 3.4-1.6H20M17.5 3.5 20 6l-2.5 2.5M17.5 15.5 20 18l-2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const spielerTexte = (v: Nachricht[]) => v.filter((n) => n.von === 'spieler').map((n) => n.text)

/**
 * Jede Partei wird mit dem Bundesland ihrer Seite gewertet – gleich, wer das Problem nennt. Der Vergleich aller
 * Parteien nutzt das Land nur, wenn beide Seiten dasselbe gewählt haben (siehe vergleichsSeite). Ohne Rolle: Rollen
 * sind ausgesetzt (docs/methode.md).
 */
function werteAus(
  analyse: AnalyseAntwort,
  nr: number,
  spieler: [Spieler, Spieler],
  daten: Daten,
  forderung?: RundenErgebnis['forderung'],
  karten: Karte[] = [],
): RundenErgebnis {
  const { themen, parteien, massnahmen, abdeckung } = daten
  const thema = themen.find((t) => t.id === analyse.thema_id) ?? null

  // Ohne Thema in der Datenbank: ungeprüft. Die Review-Warteschlange füllt die Edge Function.
  if (!thema) {
    return {
      nr, thema: null, status: 'ungeprueft', ...(forderung ? { forderung } : {}), ...(karten.length ? { karten } : {}),
      zusammenfassung: analyse.zusammenfassung, einschaetzung: analyse.einschaetzung ?? null,
      ergebnisse: null, punkte: [0, 0], beste: [], nichtErfasst: [],
    }
  }

  const [ea, eb] = spieler.map((s) =>
    bewertePartei(s.partei, thema.id, analyse.ursachen_ids, null, massnahmen, abdeckung, ebenenFuer(daten, s.land)),
  )
  const { status, punkte } = werteRunde(ea, eb)
  const { land } = vergleichsSeite(spieler)
  const ebenen = ebenenFuer(daten, land)
  return {
    nr, thema, status, ...(forderung ? { forderung } : {}), ...(karten.length ? { karten } : {}),
    ursachen_ids: analyse.ursachen_ids,
    ...(analyse.ursachen_belege ? { ursachen_belege: analyse.ursachen_belege } : {}),
    ...(analyse.symptom !== undefined ? { symptom: analyse.symptom } : {}),
    zusammenfassung: analyse.zusammenfassung,
    einschaetzung: null,
    ergebnisse: [ea, eb],
    punkte,
    beste: besteParteien(parteien, thema.id, analyse.ursachen_ids, null, massnahmen, abdeckung, ebenen),
    nichtErfasst: parteien.filter(
      (p) => !bewertePartei(p, thema.id, analyse.ursachen_ids, null, massnahmen, abdeckung, ebenen).abdeckung,
    ),
  }
}

export function Runde({
  nr,
  spieler,
  onErgebnis,
}: {
  nr: number
  spieler: [Spieler, Spieler]
  onErgebnis: (r: RundenErgebnis) => void
}) {
  const [verlauf, setVerlauf] = useState<Nachricht[]>([])
  /**
   * Gespräch des letzten Versuchs, der ohne Wertung endete (Haltung, Forderung, Grenze): bleibt oben stehen,
   * damit man sieht, was man eingegeben hat – bis zur nächsten Eingabe. Geht nicht an die KI.
   */
  const [vorher, setVorher] = useState<Nachricht[]>([])
  const [hinweis, setHinweis] = useState<string | null>(null)
  const [eingabe, setEingabe] = useState('')
  const [denkt, setDenkt] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  /**
   * Bestätigung (docs/plan-zuordnung.md): das Thema, dessen Ursachen gerade zum Antippen stehen – mit den von der KI
   * vorgeschlagenen Ursachen, wenn sie sicher war.
   */
  const [angebot, setAngebot] = useState<{
    thema_id: number
    vorauswahl: number[]
    /** Symptomgruppe, deren Ursachen vorausgewählt sind (docs/plan-symptome.md). */
    symptom?: number
    /** Eine Ursache passt nur teilweise: was abweicht. */
    abweichung?: string
  } | null>(null)
  /**
   * Neutrale Zusammenfassung der KI zu einem geschilderten Problem – für die Anzeige nach einer Auswahl.
   * Bei einer Forderung bleibt sie leer: Dann steht das Thema mit den gewählten Ursachen als Problem da.
   */
  const [zusammenfassung, setZusammenfassung] = useState<string | null>(null)
  /**
   * Lösungsweg, dem die genannte Forderung entspricht (Forderungskarte, ohne Punkte). Bleibt für den Rest der
   * Runde: Wird danach ein Problem gewertet, erscheint die Karte zusätzlich in der Auflösung.
   */
  const [forderung, setForderung] = useState<{ instrument_id: number; thema_id: number } | null>(null)
  const [karteOffen, setKarteOffen] = useState(false)
  /** Haltung, deren Karte gerade unter dem Verlauf steht (bis zur nächsten Eingabe). */
  const [haltung, setHaltung] = useState<number | null>(null)
  /** Höchstens eine Haltungskarte je Runde (B4) – sonst würden fünf Runden zu fünf Haltungsdebatten. */
  const [haltungGezeigt, setHaltungGezeigt] = useState(false)
  /** Karten dieser Runde (ohne Punkte) für den Endbildschirm. */
  const [karten, setKarten] = useState<Karte[]>([])
  /** Art des Zufallsbeispiels, das gerade in der Eingabe steht (bis man es ändert oder absendet). */
  const [beispiel, setBeispiel] = useState<BeispielArt | null>(null)
  const daten = useDaten()

  const seiten = spieler.map(({ land }) => ({ land })) as [Seite, Seite]
  const laender = seiten.map((s) => s.land)
  const parteiIds: [number, number] = [spieler[0].partei.id, spieler[1].partei.id]
  const [nurProbleme, setNurProbleme] = useState(liesNurProbleme)
  const beispielOptionen = { parteiIds, laender, mitHaltung: !haltungGezeigt, nurProbleme }

  function wuerfeln() {
    const b = zufallsBeispiel(daten, beispielOptionen, eingabe.trim() || null)
    if (!b) return
    setEingabe(b.text)
    setBeispiel(b.art)
  }

  async function absenden(e: { preventDefault(): void }) {
    e.preventDefault()
    const text = eingabe.trim()
    if (!text || denkt) return
    const neu: Nachricht[] = [...verlauf, { von: 'spieler', text }]
    const vorherAlt = vorher
    setVerlauf(neu)
    setVorher([])
    setEingabe('')
    setBeispiel(null)
    setHinweis(null)
    setFehler(null)
    setAngebot(null)
    setHaltung(null)
    setDenkt(true)
    let analyse: AnalyseAntwort
    try {
      analyse = await analysiere(daten, {
        verlauf: neu,
        seiten,
        parteien: [spieler[0].partei.id, spieler[1].partei.id],
      })
    } catch (err) {
      // Eingabe zurückgeben, damit sie erneut gesendet werden kann.
      setVerlauf(verlauf)
      setVorher(vorherAlt)
      setEingabe(text)
      setFehler(err instanceof AnalyseFehler ? err.message : 'Die Einordnung hat gerade nicht geklappt.')
      return
    } finally {
      setDenkt(false)
    }

    // Forderungskarte nur, wenn die Forderung eindeutig einem bekannten Lösungsweg entspricht.
    // Eine Haltung („wert“) setzt sie zurück; ein Problem lässt sie unverändert.
    let rundenKarten = karten
    if (analyse.typ === 'forderung') {
      const bekannt = analyse.instrument_id != null && daten.instrumente.some((i) => i.id === analyse.instrument_id)
      setForderung(bekannt && analyse.thema_id !== null ? { instrument_id: analyse.instrument_id!, thema_id: analyse.thema_id } : null)
      // Nach der letzten Nachfrage („Forderung bleibt“) zeigt die Runde die Karte gleich.
      setKarteOffen(bekannt && !analyse.nachfrage)
      if (bekannt && analyse.thema_id !== null)
        rundenKarten = mitKarte(rundenKarten, { art: 'forderung', instrument_id: analyse.instrument_id! })
    } else if (analyse.typ === 'wert' || analyse.typ === 'grenze') {
      setForderung(null)
      setKarteOffen(false)
    }

    if (analyse.typ === 'grenze') {
      // Die Runde beginnt von vorn; die eigene Eingabe bleibt zum Nachlesen stehen (die Antwort gibt sie nicht wieder).
      setVerlauf([])
      setVorher(neu)
      setZusammenfassung(null)
      setHinweis(GRENZE_ANTWORT)
      return
    }

    // Nachfrage bei einer Forderung oder wenn keine Ursache erkennbar ist – mit erkanntem Thema
    // zusätzlich dessen Ursachen zum Antippen (nicht bei Pauschalurteilen über Gruppen).
    if (analyse.nachfrage) {
      setVerlauf([...neu, { von: 'ki', text: analyse.nachfrage }])
      setAngebot(
        analyse.pauschal || analyse.thema_id === null
          ? null
          : {
              thema_id: analyse.thema_id,
              vorauswahl: [],
              ...(analyse.abweichung ? { abweichung: analyse.abweichung } : {}),
            },
      )
      setZusammenfassung(analyse.typ === 'problem' ? analyse.zusammenfassung || null : null)
    } else if (analyse.typ === 'wert' || analyse.typ === 'forderung') {
      // Runde ohne Wertung – ein neues Problem kann genannt werden.
      const thema = daten.themen.find((t) => t.id === analyse.thema_id)?.name ?? null
      setVerlauf([])
      setVorher(neu)
      setZusammenfassung(null)
      // Haltung zu einer vollständig erfassten Wertfrage: die Haltungskarte (einmal je Runde), sonst ein Satz.
      const karte =
        analyse.typ === 'wert' && analyse.haltung_id != null && !haltungGezeigt && haltungskarte(daten, analyse.haltung_id)
          ? analyse.haltung_id
          : null
      if (karte !== null) {
        setHaltung(karte)
        setHaltungGezeigt(true)
        rundenKarten = mitKarte(rundenKarten, { art: 'haltung', haltung_id: karte })
        setHinweis(HALTUNG_EINLEITUNG)
      } else {
        // Die KI greift die Äußerung auf; ohne brauchbare Rückmeldung (oder bei Pauschalurteilen) ein fester Satz.
        setHinweis(
          analyse.rueckmeldung ||
            (analyse.typ === 'wert' ? WERT_ANTWORT : analyse.pauschal ? PAUSCHAL_ANTWORT : forderungAntwort(thema)),
        )
      }
    } else if (analyse.typ === 'problem' && analyse.thema_id !== null && analyse.ursachen_ids.length > 0) {
      // Gewertet wird erst, was die Person bestätigt: die Ursachen der KI vorausgewählt (sie war sicher).
      setAngebot({ thema_id: analyse.thema_id, vorauswahl: analyse.ursachen_ids, symptom: analyse.symptom })
      setZusammenfassung(analyse.zusammenfassung || null)
    } else {
      onErgebnis({ ...werteAus(analyse, nr, spieler, daten, forderung ?? undefined, rundenKarten), eingaben: spielerTexte(neu) })
    }
    setKarten(rundenKarten)
  }

  /**
   * „Nichts davon passt“: Runde ohne Wertung, das Gesagte geht zur Durchsicht (review_eingaben, 30 Tage), damit
   * fehlende Ursachen ergänzt werden können. Danach kann ein neues Problem genannt werden.
   */
  async function passtNicht(themaId: number) {
    if (denkt) return
    const gespraech = verlauf.length ? verlauf : vorher
    setFehler(null)
    setDenkt(true)
    try {
      await analysiere(daten, {
        verlauf: gespraech,
        seiten,
        parteien: [spieler[0].partei.id, spieler[1].partei.id],
        auswahl: { thema_id: themaId, ursachen_ids: [], passt_nicht: true },
      })
    } catch (err) {
      setFehler(err instanceof AnalyseFehler ? err.message : 'Das hat gerade nicht geklappt.')
      return
    } finally {
      setDenkt(false)
    }
    const name = daten.themen.find((t) => t.id === themaId)?.name
    setVerlauf([])
    setVorher(gespraech)
    setAngebot(null)
    setZusammenfassung(null)
    setHinweis(passtNichtAntwort(name ?? null))
  }

  /**
   * Angetippte Ursachen werten: ohne KI, die Edge Function speichert die Runde. `symptom`: die vorgeschlagene
   * Symptomgruppe – ihre Ursachen zählen nicht zur Höchstzahl.
   */
  async function auswaehlen(themaId: number, ursachenIds: number[], symptom?: number) {
    if (denkt) return
    setFehler(null)
    setDenkt(true)
    let analyse: AnalyseAntwort
    try {
      analyse = await analysiere(daten, {
        verlauf: [],
        seiten,
        parteien: [spieler[0].partei.id, spieler[1].partei.id],
        auswahl: { thema_id: themaId, ursachen_ids: ursachenIds, ...(symptom !== undefined ? { symptom } : {}) },
      })
    } catch (err) {
      setFehler(err instanceof AnalyseFehler ? err.message : 'Die Wertung hat gerade nicht geklappt.')
      return
    } finally {
      setDenkt(false)
    }
    // Angetippt nach einer Nachfrage: das bisherige Gespräch; nach einer Haltungskarte: die Haltung davor.
    const eingaben = spielerTexte(verlauf.length ? verlauf : vorher)
    // Die Kurzfassung der KI nur, wenn die Person ihren Vorschlag unverändert bestätigt hat – sonst die bestätigten
    // Sätze, damit Kurzfassung und gewertete Ursachen einander nicht widersprechen (Hautarzt/Hausarzt).
    const vorschlag = angebot?.thema_id === themaId ? angebot.vorauswahl : []
    const unveraendert =
      vorschlag.length > 0 && vorschlag.length === ursachenIds.length && ursachenIds.every((id) => vorschlag.includes(id))
    onErgebnis({
      ...werteAus(
        { ...analyse, zusammenfassung: (unveraendert && zusammenfassung) || analyse.zusammenfassung },
        nr, spieler, daten, forderung ?? undefined, karten,
      ),
      ...(eingaben.length ? { eingaben } : {}),
    })
  }

  const angebotThema = angebot ? (daten.themen.find((t) => t.id === angebot.thema_id) ?? null) : null
  const angebotGruppe = angebot?.symptom !== undefined ? angebotThema?.symptome?.find((g) => g.nr === angebot.symptom) : undefined

  return (
    <main className="seite runde">
      <h2>Welches Alltagsproblem nervt dich?</h2>
      <p className="hinweis">
        Schreib auf, was in deinem Alltag konkret schiefläuft.
      </p>

      <div className="verlauf" aria-live="polite">
        {vorher.map((n, i) => (
          <p key={`v${i}`} className={`blase blase-${n.von}`}>
            {n.text}
          </p>
        ))}
        {hinweis && <p className="blase blase-ki">{hinweis}</p>}
        {verlauf.map((n, i) => (
          <p key={i} className={`blase blase-${n.von}`}>
            {n.text}
          </p>
        ))}
        {denkt && <p className="blase blase-ki denkt">Ich ordne das ein …</p>}
        {fehler && (
          <p className="blase blase-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>

      {haltung !== null && (
        <HaltungsKarte
          haltungId={haltung}
          onThema={(id) => {
            // Ein Tipp füllt das Eingabefeld nicht vor, sondern zeigt die Ursachen des Themas zum Antippen (A2).
            setAngebot({ thema_id: id, vorauswahl: [] })
            setZusammenfassung(null)
          }}
        />
      )}

      {angebot && angebotThema && (
        <UrsachenAuswahl
          key={`${angebotThema.id}-${verlauf.length}-${angebot.vorauswahl.join(',')}`}
          thema={angebotThema}
          ursachen={daten.ursachen}
          vorauswahl={angebot.vorauswahl}
          gruppe={angebotGruppe}
          abweichung={angebot.abweichung}
          gesperrt={denkt}
          onWaehlen={(ids) =>
            auswaehlen(angebotThema.id, ids, angebotGruppe && ids.some((id) => angebotGruppe.ursachen_ids.includes(id)) ? angebotGruppe.nr : undefined)
          }
          onPasstNicht={() => passtNicht(angebotThema.id)}
        />
      )}

      {forderung && (
        <div className="forderung-knopf">
          {!karteOffen && (
            <button type="button" className="knopf knopf-zweit" onClick={() => setKarteOffen(true)}>
              Zeig mir, wer das fordert
            </button>
          )}
          {karteOffen && (
            <>
              <ForderungsKarte instrumentId={forderung.instrument_id} laender={laender} />
              <button type="button" className="knopf-link" onClick={() => setKarteOffen(false)}>
                Karte ausblenden
              </button>
            </>
          )}
        </div>
      )}

      <form className="eingabe" onSubmit={absenden}>
        <label htmlFor="problem" className="sr-only">
          Dein Problem
        </label>
        <textarea
          id="problem"
          rows={3}
          maxLength={500}
          placeholder="z. B. „Ich warte seit drei Monaten auf einen Termin beim Facharzt.“"
          value={eingabe}
          onChange={(e) => {
            setEingabe(e.target.value)
            setBeispiel(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) absenden(e)
          }}
          disabled={denkt}
        />
        {beispiel && (
          <p className="meta" aria-live="polite">
            {BEISPIEL_TEXT[beispiel]} – mit „Senden“ einspielen oder vorher anpassen.
          </p>
        )}
        <div className="eingabe-knoepfe">
          {zufallsBeispiel(daten, beispielOptionen) && (
            <button
              type="button"
              className="knopf knopf-zweit"
              onClick={wuerfeln}
              disabled={denkt}
              title="Zufälliges Problem, Forderung oder Haltung, die das Spiel schon kennt"
            >
              <ShuffleSymbol />
              Zufallsbeispiel
            </button>
          )}
          <label className="meta nur-probleme">
            <input
              type="checkbox"
              checked={nurProbleme}
              onChange={(e) => {
                setNurProbleme(e.target.checked)
                merkeNurProbleme(e.target.checked)
              }}
            />{' '}
            nur Alltagsprobleme
          </label>
          <button className="knopf" type="submit" disabled={denkt || !eingabe.trim()}>
            Senden
          </button>
        </div>
      </form>
    </main>
  )
}
