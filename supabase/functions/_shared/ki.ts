import { EingabeFehler } from './fehler.ts'
import { bereinigeStichwort, pruefeText } from './moderation.ts'
import {
  MAX_AUSWAHL,
  ROLLEN_IDS,
  type AnalyseAnfrage,
  type AnalyseAntwort,
  type HaltungEintrag,
  type InstrumentEintrag,
  type Massnahme,
  type Nachricht,
  type Partei,
  type Rolle,
  type Thema,
  type Ursache,
  type UrsachenAuswahl,
} from './typen.ts'

// Prompt-Aufbau und strenge Prüfung der KI-Antwort. Reines TypeScript,
// damit es in der App getestet und in der Edge Function genutzt werden kann.

export const MAX_NACHFRAGEN = 2
export const MAX_NACHRICHTEN = 2 * MAX_NACHFRAGEN + 1
export const MAX_TEXTLAENGE = 500
/** Zweite Nachfrage, wenn die KI die erste wörtlich wiederholt. */
export const NACHFRAGE_BEISPIEL = 'Magst du ein Beispiel nennen, wann dich das zuletzt betroffen hat?'
/** Ergänzte Frage, wenn die KI eine Forderung nur wiedergibt, ohne nachzufragen. */
export const NACHFRAGE_FORDERUNG = 'Was soll sich dadurch in deinem Alltag ändern?'
/** Nachfrage, wenn das Thema klar ist, aber keine Ursache erkennbar. */
export const NACHFRAGE_URSACHE = 'Was genau macht dir dabei Sorgen? Beschreib kurz, woran es in deinem Alltag hakt.'

const ROLLEN_TEXT: Record<Rolle, string> = {
  mieter: 'Mieter:in',
  eigentuemer: 'Eigentümer:in',
  angestellt: 'Angestellt',
  selbststaendig: 'Selbstständig',
  rentner: 'Rentner:in',
  arbeitslos: 'Arbeitslos',
  studierend: 'Studierend',
  vermoegend: 'Vermögend',
}

/** Was die KI von einer Haltung sieht: nur Nummer und Frage (keine Positionen, keine Parteien). */
export type HaltungKurz = Pick<HaltungEintrag, 'id' | 'frage'>

/**
 * `haltungen`: nur vollständig erfasste (alle Parteien, View `haltungen_vollstaendig`). Ohne Haltungen bleibt der
 * Prompt wie bisher – dann gibt es keine Haltungskarte.
 */
export function systemPrompt(themen: Thema[], ursachen: Ursache[], haltungen: HaltungKurz[] = []): string {
  return baueSystemPrompt(themen, ursachen, haltungen)
}

/**
 * Schritt 1 der Zuordnung (docs/plan-zuordnung.md): derselbe Prompt, aber der Katalog nur mit Themen. Die
 * Ursachen ordnet ein zweiter Aufruf nur unter den Ursachen des erkannten Themas zu (`ursachenPrompt`) – so
 * kann ein Satz nicht an einer ähnlich klingenden Ursache eines fremden Themas hängen bleiben.
 */
export function themenPrompt(themen: Thema[], haltungen: HaltungKurz[] = []): string {
  return baueSystemPrompt(themen, null, haltungen)
}

/**
 * Haltungen tragen im Prompt eine eigene Kennung („H4“): Mit bloßen Nummern hat die KI die Nummer einer Haltung
 * als Thema eingetragen („Schluss mit den Windrädern“ → Haltung 4 zur Windkraft → Thema 4, Schule).
 */
const haltungKennung = (id: number) => `H${id}`
/** „H4“ (wie im Prompt) oder 4 (ältere Antworten) → 4; alles andere null. */
function haltungAusKennung(roh: unknown): number | null {
  if (typeof roh === 'number' && Number.isInteger(roh)) return roh
  const treffer = typeof roh === 'string' ? /^H(\d+)$/.exec(roh.trim()) : null
  return treffer ? Number(treffer[1]) : null
}

/** `ursachen` null: Schritt 1 (nur Themen). */
function baueSystemPrompt(themen: Thema[], ursachen: Ursache[] | null, haltungen: HaltungKurz[]): string {
  const katalog = themen
    .map((t) => {
      if (!ursachen) return `- Thema ${t.id}: ${t.name} – ${t.beschreibung}`
      const u = ursachen
        .filter((x) => x.thema_id === t.id)
        .map((x) => `    - Ursache ${x.id}: ${x.beschreibung}${x.alltag ? ` – im Alltag: „${x.alltag}“` : ''}`)
        .join('\n')
      return `- Thema ${t.id}: ${t.name} – ${t.beschreibung}\n${u}`
    })
    .join('\n')

  return `Du moderierst das Spiel „Politik-Duell“. Spieler:innen nennen Alltagsprobleme.
Deine einzige Aufgabe: die Äußerung einordnen und ${ursachen ? 'einem Thema und Ursachen' : 'einem Thema'} aus dem Katalog zuordnen.

Regeln:
- Neutral, respektvoll, freundlich. Keine Belehrung. Deutsch, kurze Sätze.
- Bewerte NIEMALS Parteien, Politiker:innen oder Maßnahmen. Nenne keine Parteien.
- Nenne NIEMALS Links, Quellen oder Zahlen aus Studien.
- Vergib keine Punkte.

Einordnung ("typ"):
- "problem": ein konkretes Alltagsproblem (z. B. „Ich finde keine bezahlbare Wohnung“). Auch erlebte oder
  beobachtete Benachteiligung, Anfeindung, Gewalt oder Radikalisierung ist ein "problem" (z. B. „Ich werde im Bus
  rassistisch beleidigt“, „Mein Cousin rutscht in die rechte Szene ab“). Was die Person ausdrücklich als ihr
  Problem nennt, ist nie "wert".
- "forderung": eine politische Forderung ohne konkretes Alltagsproblem (z. B. „Weniger Steuern!“).
  Dann gib die Forderung in "nachfrage" in einem neutralen Halbsatz wieder und stelle danach immer genau eine
  kurze, freundliche Frage nach dem Alltag dahinter, z. B. „Du möchtest weniger Steuern zahlen. Was soll sich
  dadurch in deinem Alltag ändern?“. Die Wiedergabe allein reicht nie – "nachfrage" endet immer mit der Frage.
  Gib die Forderung nur wieder, wenn das ohne Wertung geht, sonst nur die Frage.
  Setze "thema_id" auf das Thema aus dem Katalog, zu dem die Forderung gehört, sonst null; "ursachen_ids": [].
  Das gilt auch für fachlich oder allgemein formulierte Forderungen: Nimm das Thema, auf dessen Alltagsprobleme
  der geforderte Weg zielt (z. B. „Wettbewerbsrecht stärken“ → Preise, „Kindergeld anheben“ → Armut und Kinderarmut,
  „Aussteigerprogramme fördern“ → Radikalisierung und Extremismus).
- "wert": eine persönliche Haltung oder ein Wert (z. B. „Mir ist Gerechtigkeit wichtig“), kein Problem.
  Dann "thema_id": null und "ursachen_ids": [], und in "rueckmeldung" 1–2 kurze Sätze: die Haltung in eigenen
  Worten neutral aufgreifen, sagen, dass man darüber verschieden denken kann, und fragen, wo sie der Person im
  Alltag begegnet – z. B. „Heimat ist dir wichtig – darüber kann man verschieden denken. Wo begegnet dir das im
  Alltag?“. Stimme nicht zu und widersprich nicht. Wertet die Haltung eine Gruppe von Menschen ab, gib sie nicht
  wieder und frag nur nach dem Alltag.${
    haltungen.length
      ? `
  Berührt die Haltung eindeutig eine der Fragen unter „Haltungen“ (gleich, welche Seite die Person vertritt),
  setze "haltung_id" auf deren Kennung (z. B. "H4"), sonst null. Rate nicht: Ähnlich oder verwandt genügt nicht.
  Die Kennung einer Haltung ist nie eine "thema_id".
  Antwortet die Person ohne Alltagsproblem mit Ja oder Nein auf genau eine dieser Fragen (z. B. „Bei der Frage
  … bin ich dafür“), ist das "wert" mit dieser "haltung_id" – auch wenn die Frage nach einer Maßnahme klingt.
  Dasselbe gilt für ein kurzes Für oder Gegen genau den Gegenstand einer Frage (z. B. „Ich bin für ein Tempolimit“
  zur Frage nach einem Tempolimit auf Autobahnen): Einschränkungen der Frage muss die Person nicht nennen.
  Das hat Vorrang vor "forderung" – auch wenn der Gegenstand eine Steuer, ein Verbot oder eine Abgabe ist
  (z. B. „Ich bin für eine Zuckersteuer“ zur Frage nach einer Steuer auf gezuckerte Getränke).
  Passen zwei Fragen, nimm die, deren Gegenstand die Person nennt (z. B. „Verbot von …“ → die Frage nach dem Verbot).`
      : ''
  }
- Ein pauschales Urteil über eine Gruppe von Menschen (z. B. „Die Ausländer sind alle kriminell“, „Rentner sind …“)
  ist weder Problem noch Wert: Ordne es als "forderung" mit "pauschal": true und "thema_id": null ein und frage
  nach dem Alltag dahinter, z. B. „Was hast du selbst erlebt, oder wo fühlst du dich unsicher?“.
  Widersprich nicht, belehre nicht, wiederhole das Urteil nicht und übernimm es nicht in "nachfrage",
  "zusammenfassung" oder "stichwort".
  Sonst ist "pauschal" immer false.
- "grenze": nur wenn die Äußerung selbst einer Gruppe von Menschen (wegen Herkunft, Religion, Geschlecht, Behinderung,
  sexueller Orientierung o. Ä.) die Menschenwürde oder gleiche Rechte abspricht, zu Gewalt aufruft oder
  Personen beleidigt (z. B. „Die sind keine Menschen“, „Die gehören alle aufgehängt“). Dann "nachfrage": null,
  "rueckmeldung": null, "thema_id": null, "ursachen_ids": [], "zusammenfassung": "" und "stichwort": "".
  Gib die Äußerung nicht wieder und kommentiere sie nicht. Das gilt gleich, aus welcher Richtung sie kommt.
  Maßgeblich ist, was die Äußerung selbst sagt, nicht ein umstrittenes Wort darin: Wer sich gegen eine Abwertung
  oder für die Rechte einer Gruppe ausspricht (z. B. „Ich bin gegen Remigration“), äußert eine Haltung, kein "grenze".
  Wer berichtet, dass er selbst oder andere abgewertet, beleidigt oder angegriffen wurden, nennt ein "problem",
  kein "grenze".
  Ein pauschales Urteil ohne Abwertung oder Gewalt ist KEIN "grenze"-Fall, sondern "forderung" mit
  "pauschal": true (siehe oben). Im Zweifel: "forderung" mit "pauschal": true.
  Eine Frage oder Sorge zu Kriminalität und Herkunft ohne Abwertung (z. B. „Ich frage mich, warum so viele
  Tatverdächtige keinen deutschen Pass haben“) ist ein "problem", kein "grenze" und keine "forderung".

Sonst ist "rueckmeldung" null (Ausnahme: abschließende Forderung, siehe Hinweis im Gespräch).${
    haltungen.length ? '\n"haltung_id" ist nur bei "wert" gesetzt, sonst immer null.' : ''
  }

${
  ursachen
    ? `Zuordnung ("thema_id" bei "problem" und "forderung", alles Weitere nur bei "problem"):
- "thema_id": die ID aus dem Katalog, die am besten passt, sonst null.
- "ursachen_ids": nur die IDs der Ursachen dieses Themas, die die Schilderung selbst nennt oder erkennbar beschreibt –
  höchstens ${MAX_AUSWAHL}, die deutlichste zuerst. Nimm keine Ursache dazu, nur weil sie zum Thema gehört oder ähnlich
  klingt – jede zugeordnete Ursache zählt in der Wertung.
  Setzt eine Ursache eine bestimmte Lage voraus (z. B. einen laufenden Vertrag, einen Heimplatz, einen bestimmten
  Wohnort), ordne sie nur zu, wenn die Schilderung diese Lage erkennen lässt.
- "ursachen_belege": zu jeder Ursache in "ursachen_ids" die Wörter aus der Schilderung der Person, die diese
  Ursache nennen – wörtlich übernommen, höchstens acht Wörter, z. B. {"204": "Miete wird jedes Jahr erhöht"}.
  Dieselben Wörter stützen nie zwei Ursachen. Findest du keine solchen Wörter, ordne die Ursache nicht zu.
- „im Alltag: …“ zeigt, wie Betroffene eine Ursache typischerweise erleben. Vergleiche die Schilderung damit,
  auch wenn sie aus der Sicht anderer Beteiligter kommt (z. B. Anwohner statt Veranstalter, Eltern statt Jugendliche).
  Passt eine Schilderung erkennbar zu einem dieser Sätze, ordne die Ursache zu, statt nachzufragen.
- Unterscheide Erlebnis und Gefühl: Schildert jemand vor allem ein Gefühl oder eine Sorge (z. B. „Ich fühle mich
  unsicher, seit …“), passen Ursachen, die beschreiben, wie Wahrnehmung und Wirklichkeit auseinanderfallen oder wo
  sich Unsicherheit ballt. Ursachen zu Taten oder Tätergruppen nur, wenn die Schilderung sie erkennen lässt.
- Lässt sich keine Ursache erkennen: "thema_id" wie erkannt, "ursachen_ids": [] und in "nachfrage" genau eine
  kurze, freundliche Frage, woran es im Alltag konkret hakt, z. B. „Was genau macht dir dabei Sorgen?“.
  Gib keine Antworten vor.
- Nennt die Person einen klaren Grund für ihr Problem, den keine Ursache des Themas beschreibt (z. B. Lärm von
  einer Baustelle nebenan beim Thema Miete), dann passt kein Thema – nimm nicht ersatzweise die nächstliegende
  Ursache und frag nicht nach. Nachfragen nur, wenn die Schilderung zu allgemein ist, um einen Grund zu erkennen.
- Passt kein Thema: "thema_id": null, "ursachen_ids": [] und in "einschaetzung" 1–2 neutrale Sätze zu möglichen
  Ursachen des Problems – ohne Parteien, ohne Lösungsbewertung, ohne Links.`
    : `Zuordnung ("thema_id" bei "problem" und "forderung", alles Weitere nur bei "problem"):
- "thema_id": die ID aus dem Katalog, deren Gegenstand das Problem ist, sonst null. Ordne nach dem, worum es der
  Person geht, nicht nach einzelnen Wörtern (z. B. „Wegen des Lärms nebenan schlafe ich schlecht“ ist kein
  Thema zu Hitze, nur weil dort auch schlechter Schlaf vorkommt).
- "thema_sicher": true nur, wenn genau ein Thema eindeutig passt. Passen mehrere Themen oder berührt die
  Schilderung das Thema nur am Rand: false.
- "thema_kandidaten": bei "thema_sicher": false oder "mehrere_probleme": true bis zu zwei weitere Themen-IDs,
  die ebenfalls in Frage kommen; sonst [].
- "mehrere_probleme": true, wenn die Person mehrere verschiedene Probleme nennt, die zu verschiedenen Themen
  gehören (z. B. „Der Hausarzt ist weit weg, und der Bus fährt kaum“). Dann "thema_id" für das Problem, das sie
  zuerst oder am deutlichsten nennt, die übrigen in "thema_kandidaten", und in "nachfrage" genau eine kurze,
  freundliche Frage, welches Problem in dieser Runde zählen soll. Eine Folge desselben Problems (z. B. „ohne Auto
  komme ich nicht zum Einkaufen“) ist kein weiteres Problem, ebenso mehrere Gründe innerhalb desselben Themas
  (z. B. teure Fahrkarten und unpünktliche Züge). Sonst false.
- Die Ursachen des Themas ordnet ein zweiter Schritt zu. Ist die Schilderung so allgemein, dass sich kein Grund
  erkennen lässt, schreib in "nachfrage" genau eine kurze, freundliche Frage, woran es im Alltag konkret hakt,
  z. B. „Was genau macht dir dabei Sorgen?“. Gib keine Antworten vor. Sonst ist "nachfrage" bei "problem" null.
- Nennt die Person einen klaren Grund für ihr Problem, den kein Thema beschreibt (z. B. Lärm von einer Baustelle
  nebenan), dann passt kein Thema – nimm nicht ersatzweise das nächstliegende.
- Passt kein Thema: "thema_id": null und in "einschaetzung" 1–2 neutrale Sätze zu möglichen Ursachen des
  Problems – ohne Parteien, ohne Lösungsbewertung, ohne Links.`
}

"zusammenfassung": ein kurzer, neutraler Satz zum Problem, ohne Namen oder persönliche Details.
"stichwort": 1–3 Wörter, die das Problem neutral benennen (z. B. „Facharzttermin“, „Nebenkosten-Nachzahlung“),
  ohne Namen, Orte, Beleidigungen oder Wertungen.

Formulierungen:
- Gib "nachfrage" und "rueckmeldung" jeweils als Liste von drei Fassungen an, die dasselbe sagen, aber mit
  anderen Wörtern und anderem Satzbau – das Spiel zeigt eine davon zufällig, damit es nicht wie ein Textbaustein
  wirkt. Jede Fassung für sich erfüllt die Regeln oben. Gibt es keine Nachfrage oder Rückmeldung: null.

Katalog:
${katalog}
${
  haltungen.length
    ? `
Haltungen (Wertfragen, nur für "wert"):
${haltungen.map((h) => `- Haltung ${haltungKennung(h.id)}: ${h.frage}`).join('\n')}
`
    : ''
}
Antworte ausschließlich mit einem JSON-Objekt:
{"typ": "problem" | "forderung" | "wert" | "grenze", "nachfrage": string[] | null, "thema_id": number | null,
${
   ursachen
     ? ' "ursachen_ids": number[], "ursachen_belege": {[id: string]: string},'
     : ' "thema_sicher": boolean, "thema_kandidaten": number[], "mehrere_probleme": boolean,'
 } "pauschal": boolean, "zusammenfassung": string, "stichwort": string,
 "einschaetzung": string | null, "rueckmeldung": string[] | null${haltungen.length ? ', "haltung_id": string | null' : ''}}`
}

// ---------------------------------------------------------------------------
// Zweiter Aufruf bei einer Forderung (docs/plan-haltungen.md, A3): Erkennt der erste Aufruf eine Forderung
// mit Thema, ordnet ein kurzer zweiter Aufruf sie einem Instrument dieses Themas zu. Alle Instrumente
// zusammen würden den Prompt etwa verdoppeln.
// ---------------------------------------------------------------------------

export type InstrumentKurz = Pick<InstrumentEintrag, 'id' | 'thema_id' | 'name' | 'ebene'>

/**
 * Instrumente, aus denen die KI wählen darf: die Bundes-Instrumente des Themas und – bei gewähltem
 * Bundesland – die Landes-Instrumente, die in einem Programm dieses Landes vorkommen.
 */
export function instrumenteZurAuswahl(
  themaId: number,
  instrumente: InstrumentKurz[],
  massnahmen: Pick<Massnahme, 'instrument_id' | 'land'>[],
  land: string | null,
): InstrumentKurz[] {
  return instrumente
    .filter(
      (i) =>
        i.thema_id === themaId &&
        (i.ebene === 'bund' || (land !== null && massnahmen.some((m) => m.instrument_id === i.id && m.land === land))),
    )
    .sort((a, b) => a.id - b.id)
}

export function instrumentPrompt(thema: Pick<Thema, 'id' | 'name'>, instrumente: InstrumentKurz[]): string {
  const liste = instrumente.map((i) => `- Instrument ${i.id}: ${i.name}`).join('\n')
  return `Du hilfst im Spiel „Politik-Duell“. Eine Person hat eine politische Forderung zum Thema „${thema.name}“ genannt.
Deine einzige Aufgabe: Entspricht die Forderung eindeutig einem der folgenden Lösungswege (Instrumente)?

Regeln:
- Wähle ein Instrument nur, wenn die Forderung genau diesem Lösungsweg entspricht. Ähnlich oder verwandt genügt nicht.
  Rate nicht: Im Zweifel "instrument_id": null.
- Bewerte nichts und nenne keine Parteien, Links oder Zahlen.

Instrumente:
${liste}

Antworte ausschließlich mit einem JSON-Objekt: {"instrument_id": number | null}`
}

/** Gespräch für den zweiten Aufruf: nur das Gesagte, ohne die Hinweise des ersten. */
export function instrumentNachrichten(verlauf: Nachricht[]) {
  return verlauf.map((n) => ({
    role: n.von === 'spieler' ? ('user' as const) : ('assistant' as const),
    content: n.text,
  }))
}

/** Nur eine ID, die in der Liste dieses Aufrufs stand – alles andere (erfundene oder fremde IDs) wird null. */
export function bereinigeInstrument(roh: unknown, erlaubt: Pick<InstrumentKurz, 'id'>[]): number | null {
  const id = roh && typeof roh === 'object' ? (roh as Record<string, unknown>).instrument_id : null
  return typeof id === 'number' && erlaubt.some((i) => i.id === id) ? id : null
}

/**
 * Hängt das erkannte Instrument an die Antwort – nur bei einer Forderung mit erkanntem Thema und nie bei
 * einem Pauschalurteil über eine Gruppe (dort bleibt es bei der Nachfrage). Problem und Haltung bekommen keins.
 */
export function mitInstrument(antwort: AnalyseAntwort, instrumentId: number | null): AnalyseAntwort {
  if (antwort.typ !== 'forderung' || antwort.pauschal || antwort.thema_id === null || instrumentId === null) return antwort
  return { ...antwort, instrument_id: instrumentId }
}

// ---------------------------------------------------------------------------
// Zuordnung in zwei Schritten (docs/plan-zuordnung.md): Schritt 1 erkennt Typ und Thema (`themenPrompt`),
// Schritt 2 wählt nur unter den Ursachen dieses Themas (`ursachenPrompt`). Ist eine der beiden Antworten
// unsicher, zählt keine Ursache: Die Antwort wird eine Nachfrage mit Thema, und die Person tippt selbst an.
// ---------------------------------------------------------------------------

export function ursachenPrompt(thema: Pick<Thema, 'id' | 'name' | 'beschreibung'>, ursachen: Ursache[]): string {
  const liste = ursachen
    .map((u) => `- Ursache ${u.id}: ${u.beschreibung}${u.alltag ? ` – im Alltag: „${u.alltag}“` : ''}`)
    .join('\n')
  return `Du hilfst im Spiel „Politik-Duell“. Eine Person hat ein Alltagsproblem zum Thema „${thema.name}“ genannt
(${thema.beschreibung}). Deine einzige Aufgabe: Welche der folgenden Ursachen nennt oder beschreibt sie selbst?

Regeln:
- "ursachen_ids": nur Ursachen, die die Schilderung selbst nennt oder erkennbar beschreibt – höchstens ${MAX_AUSWAHL},
  die deutlichste zuerst. Nimm keine Ursache dazu, nur weil sie zum Thema gehört oder ein Wort mit der Schilderung
  teilt – jede zugeordnete Ursache zählt in der Wertung.
- Setzt eine Ursache eine bestimmte Lage voraus (z. B. einen laufenden Vertrag, einen Heimplatz, einen bestimmten
  Wohnort), ordne sie nur zu, wenn die Schilderung diese Lage erkennen lässt. Widerspricht die Schilderung dieser
  Lage (z. B. „ich wohne seit 20 Jahren in derselben Wohnung“ bei einer Ursache über Neuvermietungen), passt sie nicht.
- Ein gemeinsames Wort genügt nicht: Der Beleg muss denselben Grund nennen wie die Ursache (z. B. „der Bus kommt
  ständig zu spät“ nennt Unpünktlichkeit, nicht zu teure Fahrkarten, auch wenn beide vom Bus handeln).
- "ursachen_belege": zu jeder Ursache in "ursachen_ids" die Wörter aus der Schilderung, die genau diesen Grund
  nennen – wörtlich übernommen, höchstens acht Wörter, z. B. {"204": "Miete wird jedes Jahr erhöht"}. Dieselben
  Wörter stützen nie zwei Ursachen. Findest du keine Wörter, die diesen Grund nennen, ordne die Ursache nicht zu.
- „im Alltag: …“ zeigt, wie Betroffene eine Ursache typischerweise erleben. Vergleiche die Schilderung damit,
  auch wenn sie aus der Sicht anderer Beteiligter kommt (z. B. Anwohner statt Veranstalter, Eltern statt Jugendliche).
- Unterscheide Erlebnis und Gefühl: Schildert jemand vor allem ein Gefühl oder eine Sorge (z. B. „Ich fühle mich
  unsicher, seit …“), passen Ursachen, die beschreiben, wie Wahrnehmung und Wirklichkeit auseinanderfallen oder wo
  sich Unsicherheit ballt. Ursachen zu Taten oder Tätergruppen nur, wenn die Schilderung sie erkennen lässt.
- "sicher": true nur, wenn jede gewählte Ursache den Grund trifft, den die Person nennt. Nennt sie einen Grund,
  den keine Ursache beschreibt, passt eine Ursache nur ungefähr oder ist die Schilderung zu allgemein: false.
- Bewerte nichts und nenne keine Parteien, Links oder Zahlen.

Ursachen:
${liste}

Antworte ausschließlich mit einem JSON-Objekt:
{"ursachen_ids": number[], "ursachen_belege": {[id: string]: string}, "sicher": boolean}`
}

/** Wörter ohne Aussage über einen Grund – sie zählen beim Abgleich von Beleg und Ursache nicht. */
const FUELLWOERTER = new Set(
  ('kaum nicht immer mehr sehr viel viele vielen ganz noch schon auch eben einfach mein meine meinem meinen meiner ' +
    'mich unser unsere unserem unseren keine keinen keinem einen einem einer eine dass weil wenn aber oder doch dann ' +
    'denn jetzt hier dort habe haben hatte wird werden wurde sind bist kann koennen muss muessen soll sollen ' +
    'gibt alle alles jeden jede jeder ihre ihren sein seine sich diese dieser dieses fuer ueber unter nach seit gegen ' +
    'ohne beim wieder total echt leider bald heute gerade schon etwas nichts leute menschen')
    .split(' '),
)

const grundWoerter = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 4 && !FUELLWOERTER.has(w))

/**
 * Trägt der Beleg die Ursache? Mindestens ein Wort des Belegs muss – als Wortanfang, auch in Zusammensetzungen
 * („Bahnhof“ in „Hauptbahnhof“) – in Beschreibung oder Alltagsfassung der Ursache vorkommen. Bewusst grob: Es soll
 * nur Verdächtiges finden („Bus fährt kaum“ zu „Termine im Gesundheitssystem werden kaum gesteuert“). Schlägt es
 * an, wählt die Person selbst – ein falscher Alarm kostet einen Tipp, eine falsche Zuordnung eine falsche Wertung.
 */
export function belegPasstZuUrsache(beleg: string, ursache: Pick<Ursache, 'beschreibung' | 'alltag'>): boolean {
  const gesucht = grundWoerter(beleg)
  const vorhanden = grundWoerter(`${ursache.beschreibung} ${ursache.alltag ?? ''}`)
  const stamm = (w: string) => w.slice(0, 5)
  return gesucht.some((w) => vorhanden.some((v) => v.includes(stamm(w)) || w.includes(stamm(v))))
}

const alsObjekt = (roh: unknown): Record<string, unknown> => (roh && typeof roh === 'object' ? (roh as Record<string, unknown>) : {})

/**
 * Gründe, die Ursachen nicht zu übernehmen (leer: sicher). `schritt1`/`schritt2`: die rohen Antworten der KI;
 * `ursachen`: die Ursachen des erkannten Themas. `beleg_<id>` betrifft nur diese Ursache (siehe `ordneEin`),
 * alle anderen Gründe die ganze Zuordnung.
 */
export function unsicherheit(schritt1: unknown, schritt2: unknown, ursachen: Ursache[]): string[] {
  const r1 = alsObjekt(schritt1)
  const r2 = alsObjekt(schritt2)
  const gruende: string[] = []
  // Weitere Themen und „mehrere Probleme“ zählen nur mit einem anderen Thema als dem erkannten – sonst meldet die
  // KI auch mehrere Gründe innerhalb eines Themas (Wartezeit und Formulare beim Amt) als mehrere Probleme.
  const andere = (Array.isArray(r1.thema_kandidaten) ? r1.thema_kandidaten.map(Number) : []).filter(
    (id) => Number.isInteger(id) && id !== Number(r1.thema_id),
  )
  if (r1.thema_sicher === false) gruende.push('thema_unsicher')
  if (andere.length > 0) gruende.push('thema_kandidaten')
  if (r1.mehrere_probleme === true && andere.length > 0) gruende.push('mehrere_probleme')
  if (r2.sicher !== true) gruende.push('ursachen_unsicher')
  const belege = alsObjekt(r2.ursachen_belege)
  for (const id of Array.isArray(r2.ursachen_ids) ? r2.ursachen_ids.map(Number) : []) {
    const u = ursachen.find((x) => x.id === id)
    if (u && !belegPasstZuUrsache(kurz(belege[String(id)], 120), u)) gruende.push(`beleg_${id}`)
  }
  return gruende
}

export type KiNachrichten = { role: 'system' | 'user' | 'assistant'; content: string }[]
/** Ein KI-Aufruf: Systemprompt und Gespräch → rohe JSON-Antwort. Edge Function und Testset übergeben Mistral. */
export type FrageKi = (system: string, nachrichten: KiNachrichten) => Promise<unknown>

export interface Einordnungskatalog {
  themen: Thema[]
  ursachen: Ursache[]
  parteien?: Pick<Partei, 'name' | 'kurzname'>[]
  /** Vollständig erfasste Haltungen (nur sie kommen in den Prompt). */
  haltungen?: HaltungKurz[]
}

/**
 * Die ganze Einordnung einer Äußerung: Schritt 1, bei einem Problem mit Thema Schritt 2, dann `bereinigeAntwort`.
 * `unsicher` nennt die Gründe, aus denen keine Ursache übernommen wurde (für Testset und Protokoll).
 */
export async function ordneEin(
  frage: FrageKi,
  verlauf: Nachricht[],
  rolle: Rolle | null,
  { themen, ursachen, parteien = [], haltungen = [] }: Einordnungskatalog,
  zufall: () => number = Math.random,
): Promise<{ antwort: AnalyseAntwort; unsicher: string[] }> {
  const r1 = alsObjekt(await frage(themenPrompt(themen, haltungen), nutzerNachrichten(verlauf, rolle)))
  let roh: Record<string, unknown> = { ...r1, ursachen_ids: [] }
  const unsicher: string[] = []
  // Eine Forderung hat keinen zweiten Schritt, der ein unsicheres Thema auffängt: dann lieber ohne Thema (keine
  // Ursachen eines falschen Themas zum Antippen). Beobachtet: „Schluss mit den Windrädern“ → Thema Schule, unsicher.
  if (r1.typ === 'forderung' && r1.thema_sicher === false) {
    roh = { ...roh, thema_id: null }
    unsicher.push('thema_unsicher')
  }
  const thema = r1.typ === 'problem' ? themen.find((t) => t.id === Number(r1.thema_id)) : undefined
  if (thema) {
    const kandidaten = ursachen.filter((u) => u.thema_id === thema.id)
    let r2: unknown = {}
    try {
      r2 = await frage(ursachenPrompt(thema, kandidaten), instrumentNachrichten(verlauf))
    } catch {
      unsicher.push('ursachen_keine_antwort')
    }
    unsicher.push(...unsicherheit(r1, r2, kandidaten))
    // Ein unpassender Beleg verwirft nur seine Ursache; bleibt keine übrig oder ist sonst etwas unsicher, keine.
    const { ursachen_ids, ursachen_belege } = alsObjekt(r2)
    const verworfen = new Set(unsicher.filter((g) => g.startsWith('beleg_')).map((g) => Number(g.slice(6))))
    const uebrig = (Array.isArray(ursachen_ids) ? ursachen_ids.map(Number) : []).filter((id) => !verworfen.has(id))
    const ganz = unsicher.some((g) => !g.startsWith('beleg_')) || uebrig.length === 0
    roh = { ...r1, ursachen_ids: ganz ? [] : uebrig, ursachen_belege }
  }
  const antwort = bereinigeAntwort(roh, verlauf, themen, ursachen, parteien, zufall, haltungen)
  // Weitere Themen nur, wenn die Person ohnehin gefragt wird – die App kann sie dann zur Wahl stellen.
  const weitere = (Array.isArray(r1.thema_kandidaten) ? r1.thema_kandidaten.map(Number) : [])
    .filter((id, i, alle) => id !== antwort.thema_id && themen.some((t) => t.id === id) && alle.indexOf(id) === i)
    .slice(0, 2)
  return {
    antwort: antwort.typ === 'problem' && antwort.nachfrage && weitere.length ? { ...antwort, thema_kandidaten: weitere } : antwort,
    unsicher,
  }
}

export function nutzerNachrichten(verlauf: Nachricht[], rolle: Rolle | null) {
  const nachfragen = verlauf.filter((n) => n.von === 'ki').length
  const hinweis =
    `Rolle der Person: ${rolle ? ROLLEN_TEXT[rolle] : 'keine Angabe'}.` +
    (nachfragen === 1
      ? ' Es wurde schon einmal nachgefragt: Falls du noch einmal nachfragst, frag anders als zuvor,' +
        ' z. B. nach einem konkreten Beispiel aus dem Alltag, und gib die Forderung nicht noch einmal wieder.'
      : '') +
    (nachfragen >= MAX_NACHFRAGEN
      ? ' Es wurde bereits zweimal nachgefragt: Ordne jetzt abschließend ein und stelle keine Nachfrage mehr.' +
        ' Bleibt es bei einer Forderung ohne Alltagsproblem, ordne sie als "forderung" ein und schreib in' +
        ' "rueckmeldung" 1–2 kurze Sätze: die Forderung neutral aufgreifen, sagen, dass hier Lösungen für' +
        ' konkrete Alltagsprobleme gewertet werden, und zu einem solchen Problem einladen.' +
        ' Wähle nur Ursachen, die sich aus dem Gesagten erkennen lassen.'
      : '')
  return [
    { role: 'system' as const, content: hinweis },
    ...verlauf.map((n) => ({
      role: n.von === 'spieler' ? ('user' as const) : ('assistant' as const),
      content: n.text,
    })),
  ]
}

// Hier weiter exportiert, damit bestehende Importe aus ki.ts gültig bleiben.
export { EingabeFehler }

const SITZUNG_MUSTER = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Prüft die Anfrage der App. Wirft EingabeFehler bei ungültigen Daten. */
export function pruefeAnfrage(roh: unknown): AnalyseAnfrage {
  const a = roh as Partial<AnalyseAnfrage> | null
  if (!a || typeof a !== 'object') throw new EingabeFehler('Anfrage fehlt.')
  // Nur zufällige UUIDs (Version 4, wie crypto.randomUUID). Damit kann die App
  // nicht die feste ID des globalen Rate-Limits (siehe zugriff.ts) verwenden.
  if (typeof a.sitzung !== 'string' || !SITZUNG_MUSTER.test(a.sitzung)) throw new EingabeFehler('Ungültige Sitzung.')
  const auswahl = pruefeAuswahl(a.auswahl)
  // Mit Auswahl fragt die Funktion keine KI; ein Verlauf ist dann nicht nötig.
  if (!Array.isArray(a.verlauf) || (a.verlauf.length === 0 && !auswahl) || a.verlauf.length > MAX_NACHRICHTEN)
    throw new EingabeFehler('Ungültiger Verlauf.')
  for (const n of a.verlauf) {
    if (!n || (n.von !== 'spieler' && n.von !== 'ki') || typeof n.text !== 'string')
      throw new EingabeFehler('Ungültige Nachricht.')
    if (n.text.trim().length === 0 || n.text.length > MAX_TEXTLAENGE) throw new EingabeFehler('Text zu lang oder leer.')
  }
  if (!auswahl && a.verlauf[a.verlauf.length - 1].von !== 'spieler')
    throw new EingabeFehler('Letzte Nachricht muss vom Spieler sein.')
  if (a.rolle !== null && a.rolle !== undefined && !ROLLEN_IDS.includes(a.rolle)) throw new EingabeFehler('Ungültige Rolle.')
  if (
    !Array.isArray(a.parteien) ||
    a.parteien.length !== 2 ||
    !a.parteien.every((p) => Number.isInteger(p)) ||
    a.parteien[0] === a.parteien[1]
  )
    throw new EingabeFehler('Ungültige Parteien.')
  // Bundesland nur als Kürzel; es zählt nur für die Wertung und wird nicht gespeichert.
  if (a.land !== null && a.land !== undefined && (typeof a.land !== 'string' || !/^[A-Z]{2}$/.test(a.land)))
    throw new EingabeFehler('Ungültiges Bundesland.')
  // Zugang zur Testphase: nur das Format prüfen; ob er gültig ist, entscheidet die Datenbank.
  if (a.zugang !== null && a.zugang !== undefined && (typeof a.zugang !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(a.zugang)))
    throw new EingabeFehler('Ungültiger Zugang zur Testphase.')
  return {
    sitzung: a.sitzung, verlauf: a.verlauf, rolle: a.rolle ?? null, land: a.land ?? null, zugang: a.zugang ?? null, parteien: a.parteien,
    auswahl,
  }
}

/** Form der angetippten Ursachen prüfen; ob sie zum Katalog passen, prüft antwortAusAuswahl. */
function pruefeAuswahl(roh: unknown): UrsachenAuswahl | null {
  if (roh === null || roh === undefined) return null
  const w = roh as Partial<UrsachenAuswahl>
  const ids = w.ursachen_ids
  if (
    typeof w !== 'object' ||
    !Number.isInteger(w.thema_id) ||
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAX_AUSWAHL ||
    !ids.every((id) => Number.isInteger(id)) ||
    new Set(ids).size !== ids.length
  )
    throw new EingabeFehler(`Ungültige Auswahl (1 bis ${MAX_AUSWAHL} Ursachen eines Themas).`)
  return { thema_id: w.thema_id as number, ursachen_ids: ids }
}

/**
 * Antwort für angetippte Ursachen – ohne KI. Gewertet wird wie bei einer Zuordnung durch die KI.
 * Die Zusammenfassung ist der angetippte Satz aus dem Katalog („im Alltag“, sonst die Beschreibung),
 * bei mehreren die Sätze nacheinander: Der Text der Person wird nicht gespeichert.
 */
export function antwortAusAuswahl(auswahl: UrsachenAuswahl, themen: Thema[], ursachen: Ursache[]): AnalyseAntwort {
  const thema = themen.find((t) => t.id === auswahl.thema_id)
  const passt = auswahl.ursachen_ids.every((id) => ursachen.some((u) => u.id === id && u.thema_id === auswahl.thema_id))
  if (!thema || !passt) throw new EingabeFehler('Diese Ursachen gehören nicht zu diesem Thema.')
  const saetze = auswahl.ursachen_ids.map((id) => {
    const u = ursachen.find((x) => x.id === id)!
    return (u.alltag || u.beschreibung).trim().replace(/[.!…]*$/, '')
  })
  return {
    typ: 'problem',
    nachfrage: null,
    thema_id: thema.id,
    ursachen_ids: [...auswahl.ursachen_ids],
    zusammenfassung: kurz(`${saetze.join('. ')}.`, 200),
    stichwort: bereinigeStichwort(thema.name, thema.name),
    einschaetzung: null,
  }
}

const regexText = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Ersetzt Parteinamen durch „[Partei]“. Gespeicherte Kurzfassungen, Stichwörter
 * und Einschätzungen sollen keiner Partei etwas zuschreiben – Aussagen über
 * Parteien kommen nur belegt aus der Datenbank.
 * Groß-/Kleinschreibung zählt, damit z. B. „die linke Hand“ unberührt bleibt;
 * erkannt werden auch GROSS geschriebene Namen, Endungen wie „Grünen“ und ein
 * vorangestellter Artikel („die Grünen“ → „[Partei]“).
 */
export function ohneParteinamen(text: string, parteien: Pick<Partei, 'name' | 'kurzname'>[]): string {
  const namen = new Set<string>()
  for (const p of parteien) {
    for (const n of [p.name, p.kurzname, ...p.kurzname.split('/')]) {
      const t = n.trim()
      if (t.length >= 2) namen.add(t).add(t.toUpperCase())
    }
  }
  if (namen.size === 0) return text
  // Längere Namen zuerst, damit „Partei Alpha“ vor „Alpha“ greift.
  const alternativen = [...namen].sort((a, b) => b.length - a.length).map(regexText).join('|')
  const muster = new RegExp(`(?:(?<!\\p{L})[Dd](?:ie|er|en|em|es)\\s+)?(?<![\\p{L}\\d])(?:${alternativen})(?:n|en|s)?(?![\\p{L}\\d])`, 'gu')
  return text.replace(muster, '[Partei]')
}

/**
 * Rückmeldung der KI auf eine Haltung oder abschließende Forderung. Im Zweifel null – dann zeigt die
 * App einen festen Satz: bei einem Parteinamen (die KI soll keine Partei nennen), bei einem Treffer des
 * Moderationsfilters (etwa wenn eine abwertende Äußerung wiedergegeben wird) und wenn der Text zu kurz
 * oder so lang ist, dass er mitten im Satz abgeschnitten würde.
 */
export const MAX_RUECKMELDUNG = 240
function bereinigeRueckmeldung(roh: unknown, ohneLinks: (s: string) => string): string | null {
  const text = ohneLinks(kurz(roh, MAX_RUECKMELDUNG + 1))
  if (text.length < 10 || text.length > MAX_RUECKMELDUNG || text.includes('[Partei]') || pruefeText(text)) return null
  return text
}

/** Die KI liefert mehrere Fassungen (Liste); ältere Antworten und Ausreißer nur einen Text. */
const fassungen = (roh: unknown): unknown[] => (Array.isArray(roh) ? roh.slice(0, 5) : [roh])

/** Zufällige Fassung, damit dieselbe Eingabe nicht immer denselben Satz ergibt. */
const zufaellig = <T>(liste: T[], zufall: () => number): T | undefined =>
  liste[Math.min(liste.length - 1, Math.floor(zufall() * liste.length))]

const vergleichbar = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

/**
 * Wiederholt eine Nachfrage eine frühere wörtlich (die KI antwortet bei gleicher Eingabe gleich),
 * stattdessen nach einem Beispiel fragen – oder, falls auch das schon gefragt wurde, nach der Ursache.
 */
function ohneWiederholung(nachfrage: string, verlauf: Nachricht[]): string {
  if (!nachfrage) return nachfrage
  const frueher = new Set(verlauf.filter((n) => n.von === 'ki').map((n) => vergleichbar(n.text)))
  for (const kandidat of [nachfrage, NACHFRAGE_BEISPIEL, NACHFRAGE_URSACHE]) {
    if (!frueher.has(vergleichbar(kandidat))) return kandidat
  }
  return nachfrage
}

const inhaltsWoerter = (s: string) => vergleichbar(s).split(' ').filter((w) => w.length >= 3)

/**
 * Stützt ein Beleg der KI eine Ursache? Die Wörter müssen aus der Schilderung stammen: mindestens zwei Drittel
 * der Inhaltswörter (ab drei Buchstaben) kommen dort vor, Wortanfänge genügen (Beugung, „erhöht“/„erhöhen“).
 * So kann die KI eine Ursache nicht ohne Anhalt im Gesagten zuordnen; ob sie inhaltlich passt, zeigt die App.
 */
export function gestuetzt(beleg: string, texte: string[]): boolean {
  const gesucht = inhaltsWoerter(beleg)
  if (!gesucht.length) return false
  const vorhanden = texte.flatMap(inhaltsWoerter)
  const stamm = (w: string) => w.slice(0, Math.max(3, Math.min(w.length, 5)))
  const treffer = gesucht.filter((w) => vorhanden.some((v) => v === w || stamm(v) === stamm(w)))
  return treffer.length * 3 >= gesucht.length * 2
}

/** Antwort bei einer Grenzüberschreitung: ohne jeden Inhalt der Äußerung. */
export function grenzeAntwort(): AnalyseAntwort {
  return {
    typ: 'grenze',
    nachfrage: null,
    thema_id: null,
    ursachen_ids: [],
    zusammenfassung: '',
    stichwort: '',
    einschaetzung: null,
    rueckmeldung: null,
  }
}

const kurz = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().replace(/\s+/g, ' ').slice(0, max) : '')

/**
 * Macht aus der (nicht vertrauenswürdigen) KI-Antwort eine gültige AnalyseAntwort:
 * nur IDs aus dem Katalog, höchstens zwei Nachfragen, keine Links, keine Parteinamen.
 * `haltungen`: die im Prompt angebotenen (vollständigen) Haltungen – nur deren IDs werden übernommen.
 */
export function bereinigeAntwort(
  roh: unknown,
  verlauf: Nachricht[],
  themen: Thema[],
  ursachen: Ursache[],
  parteien: Pick<Partei, 'name' | 'kurzname'>[] = [],
  zufall: () => number = Math.random,
  haltungen: Pick<HaltungEintrag, 'id'>[] = [],
): AnalyseAntwort {
  const r = (roh && typeof roh === 'object' ? roh : {}) as Record<string, unknown>
  const nachfragen = verlauf.filter((n) => n.von === 'ki').length
  const letzterText = verlauf.filter((n) => n.von === 'spieler').at(-1)?.text ?? ''
  const ohneLinks = (s: string) => ohneParteinamen(s.replace(/(https?:\/\/|www\.)\S+/gi, ''), parteien).trim()

  // Grenze (Abwertung, Gewalt, Beleidigung): nichts übernehmen – kein Text der KI, keine Zusammenfassung, kein
  // Stichwort, keine IDs. So wird vom Inhalt nichts gespeichert und nichts wiedergegeben.
  if (r.typ === 'grenze') return grenzeAntwort()

  const typ: AnalyseAntwort['typ'] = r.typ === 'forderung' || r.typ === 'wert' ? r.typ : 'problem'
  const pauschal = typ === 'forderung' && r.pauschal === true
  // Von mehreren Fassungen eine zufällige – bevorzugt eine echte Frage, die nicht schon gestellt wurde.
  const frueher = new Set(verlauf.filter((n) => n.von === 'ki').map((n) => vergleichbar(n.text)))
  const vorschlaege = fassungen(r.nachfrage).map((x) => ohneLinks(kurz(x, 200))).filter(Boolean)
  const gute = vorschlaege.filter((q) => q.includes('?') && !frueher.has(vergleichbar(q)))
  let nachfrage = zufaellig(gute.length ? gute : vorschlaege, zufall) ?? ''
  // Nach zwei Nachfragen bleibt eine Forderung eine Forderung (ohne Wertung) – sie wird nicht
  // zum Problem umgedeutet, sonst bekäme sie eine Einschätzung, die für unbekannte Probleme gedacht ist.
  if (typ === 'forderung') {
    if (nachfragen >= MAX_NACHFRAGEN) nachfrage = ''
    else if (!nachfrage) nachfrage = 'Was läuft in deinem Alltag konkret schief?'
    // Gibt die KI die Forderung nur wieder („Du möchtest, dass die Mieten sinken.“), fehlt die Frage – ergänzen.
    else if (!nachfrage.includes('?')) nachfrage = `${nachfrage.replace(/[.!…]*$/, '')}. ${NACHFRAGE_FORDERUNG}`
  }
  nachfrage = ohneWiederholung(nachfrage, verlauf)
  const erkanntesThema = themen.find((t) => t.id === Number(r.thema_id)) ?? null
  const rueckmeldung = () =>
    zufaellig(
      fassungen(r.rueckmeldung)
        .map((x) => bereinigeRueckmeldung(x, ohneLinks))
        .filter((x): x is string => x !== null),
      zufall,
    ) ?? null

  const zusammenfassung = ohneLinks(kurz(r.zusammenfassung, 200)) || ohneLinks(kurz(letzterText, 120))
  // Im Stichwort wird ein Parteiname ganz entfernt; bleibt nichts übrig, greift die Zusammenfassung.
  const stichwortRoh = typeof r.stichwort === 'string' ? ohneLinks(r.stichwort).replace(/\[Partei\]/g, '').trim() : ''
  const stichwort = bereinigeStichwort(stichwortRoh, zusammenfassung.replace(/\[Partei\]/g, ''))

  if (typ !== 'problem') {
    const offen = typ === 'forderung' ? nachfrage || null : null
    // Haltung nur bei „wert“ und nur aus der angebotenen Liste – erfundene oder unvollständige gibt es nicht.
    const gemeint = haltungAusKennung(r.haltung_id)
    const haltungId = typ === 'wert' && gemeint !== null && haltungen.some((h) => h.id === gemeint) ? gemeint : null
    return {
      typ,
      nachfrage: offen,
      // Bei einer Forderung: erkanntes Thema für die Ursachenauswahl (nicht bei Pauschalurteilen).
      thema_id: typ === 'forderung' && !pauschal ? erkanntesThema?.id ?? null : null,
      ursachen_ids: [],
      ...(pauschal ? { pauschal: true } : {}),
      zusammenfassung,
      stichwort,
      einschaetzung: null,
      rueckmeldung: offen || pauschal ? null : rueckmeldung(),
      ...(haltungId !== null ? { haltung_id: haltungId } : {}),
    }
  }

  const thema = erkanntesThema
  if (!thema) {
    return {
      typ,
      nachfrage: null,
      thema_id: null,
      ursachen_ids: [],
      zusammenfassung,
      stichwort,
      einschaetzung: ohneLinks(kurz(r.einschaetzung, 400)) || null,
    }
  }

  const erlaubt = ursachen.filter((u) => u.thema_id === thema.id).map((u) => u.id)
  // Nur Ursachen, die die Schilderung mit eigenen Worten stützt, und höchstens so viele, wie man antippen darf –
  // sonst zählten vorsorglich zugeordnete Ursachen mit (docs/methode.md → „Punkte in der Runde“).
  const belegRoh = r.ursachen_belege && typeof r.ursachen_belege === 'object' ? (r.ursachen_belege as Record<string, unknown>) : {}
  const spielerTexte = verlauf.filter((n) => n.von === 'spieler').map((n) => n.text)
  const belege: Record<number, string> = {}
  const vergeben = new Set<string>()
  const genannt = (Array.isArray(r.ursachen_ids) ? r.ursachen_ids.map(Number) : [])
    .filter((id, i, alle) => erlaubt.includes(id) && alle.indexOf(id) === i)
    .filter((id) => {
      const beleg = kurz(belegRoh[String(id)], 120)
      // Dieselben Wörter stützen nur eine Ursache: Sonst nennt die Schilderung das Problem, nicht seinen Grund.
      if (!gestuetzt(beleg, spielerTexte) || vergeben.has(vergleichbar(beleg))) return false
      vergeben.add(vergleichbar(beleg))
      belege[id] = beleg
      return true
    })
    .slice(0, MAX_AUSWAHL)
  if (genannt.length === 0) {
    // Keine Ursache erkennbar: nicht einfach alle Ursachen werten – sonst gewänne, wer zum
    // Thema die meisten Maßnahmen hat, nicht wer das geschilderte Problem am besten löst.
    // Also nachfragen (mit dem Thema, damit die App dessen Ursachen zum Antippen anbietet);
    // ist das nicht mehr möglich, bleibt die Runde ohne Wertung.
    const fragen = nachfragen < MAX_NACHFRAGEN
    return {
      typ,
      // Ohne Frage (nur eine Feststellung) die Standardfrage nehmen.
      nachfrage: fragen ? ohneWiederholung(nachfrage.includes('?') ? nachfrage : NACHFRAGE_URSACHE, verlauf) : null,
      thema_id: fragen ? thema.id : null,
      ursachen_ids: [],
      zusammenfassung,
      stichwort,
      einschaetzung: null,
    }
  }
  return {
    typ,
    nachfrage: null,
    thema_id: thema.id,
    ursachen_ids: genannt,
    ursachen_belege: Object.fromEntries(genannt.map((id) => [id, belege[id]])),
    zusammenfassung,
    stichwort,
    einschaetzung: null,
  }
}
