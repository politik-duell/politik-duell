// @ts-nocheck
// AUTOMATISCH ERZEUGT aus supabase/functions/analyse (npm run dashboard) – nicht von Hand bearbeiten.
// Im Supabase-Dashboard: Edge Functions → Deploy a new function → Via Editor,
// Name „analyse“, diesen Inhalt komplett einfügen → Deploy.
// analyse/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

// _shared/bewertung.ts
var MAX_JE_URSACHE = 9;
var gewichtNachRang = (rang) => 1 / 2 ** rang;
var zehntel = (x) => Math.round(x * 10);
var findeAbdeckung = (abdeckung, parteiId, themaId, land = null) => abdeckung.find((a) => a.partei_id === parteiId && a.thema_id === themaId && (a.land ?? null) === land) ?? null;
function programmFuer(ursacheId, ebenen) {
  if (!ebenen?.land) return null;
  const ebene = ebenen.ursachen.find((u) => u.id === ursacheId)?.ebene ?? "bund";
  return ebene === "land" ? ebenen.land : null;
}
function massnahmenPunkte(m, rolle) {
  const mod = rolle ? m.rollen_modifikator?.[rolle] : void 0;
  const rollenBonus = mod?.wert ?? 0;
  const hoechstens = m.evidenz === "gemischt" || m.evidenz === "offen" ? Math.max(2, m.wirksamkeit) : 3;
  const wirksamkeit = Math.min(hoechstens, Math.max(0, m.wirksamkeit + rollenBonus));
  return {
    punkte: wirksamkeit * m.umsetzbarkeit,
    wirksamkeit,
    rollenBonus,
    rollenBegruendung: mod?.begruendung
  };
}
function bewertePartei(partei, themaId, ursachenIds, rolle, massnahmen, abdeckung, ebenen) {
  const benoetigt = ursachenIds.length ? [
    ...new Set(ursachenIds.map((id) => programmFuer(id, ebenen)))
  ] : [
    null
  ];
  const programme = [];
  const ohneWertung = (fehlt) => ({
    partei,
    punkte: 0,
    treffer: [],
    ursachen: [],
    abdeckung: null,
    fehlt,
    programme: []
  });
  for (const land of benoetigt) {
    let url = partei.programm_url;
    let stand = partei.programm_stand;
    if (land !== null) {
      const lp = ebenen?.landesprogramme.find((p) => p.partei_id === partei.id && p.land === land);
      if (!lp) return ohneWertung({
        grund: "nicht_erfasst",
        land
      });
      if (!lp.url || !lp.stand) return ohneWertung({
        grund: "kein_landesprogramm",
        land,
        begruendung: lp.kein_programm ?? void 0
      });
      url = lp.url;
      stand = lp.stand;
    }
    const a = findeAbdeckung(abdeckung, partei.id, themaId, land);
    if (!a) return ohneWertung({
      grund: "nicht_erfasst",
      land
    });
    if (a.durchsucht_fuer && ursachenIds.some((id) => programmFuer(id, ebenen) === land && !a.durchsucht_fuer.includes(id))) return ohneWertung({
      grund: "nicht_erfasst",
      land
    });
    programme.push({
      land,
      url,
      stand,
      abdeckung: a
    });
  }
  const erfasst = programme.every((p) => p.abdeckung.art === "keine") ? programme[0].abdeckung : programme.find((p) => p.abdeckung.art === "massnahmen").abdeckung;
  const eigene = massnahmen.filter((m) => m.partei_id === partei.id && m.thema_id === themaId);
  const trefferJeMassnahme = /* @__PURE__ */ new Map();
  const ursachen = [];
  let zehntelSumme = 0;
  for (const ursacheId of ursachenIds) {
    const land = programmFuer(ursacheId, ebenen);
    const jeWeg = /* @__PURE__ */ new Map();
    for (const m of eigene) {
      if (!m.ursachen_ids.includes(ursacheId) || (m.land ?? null) !== land) continue;
      const p = massnahmenPunkte(m, rolle);
      const weg = m.instrument_id != null ? `i${m.instrument_id}` : `m${m.id}`;
      const bisher = jeWeg.get(weg);
      if (!bisher || p.punkte > bisher.p.punkte) jeWeg.set(weg, {
        m,
        p
      });
    }
    if (!jeWeg.size) continue;
    const wege = [
      ...jeWeg.values()
    ].sort((x, y) => y.p.punkte - x.p.punkte || x.m.id - y.m.id);
    const gezaehlt = wege.filter((w, i) => i === 0 || w.p.punkte > 0);
    const beitraege = gezaehlt.map((w, rang) => ({
      massnahme_id: w.m.id,
      punkte: w.p.punkte,
      gewicht: gewichtNachRang(rang)
    }));
    const roh = beitraege.reduce((s, b) => s + b.punkte * b.gewicht, 0);
    const punkteUrsache = Math.min(zehntel(MAX_JE_URSACHE), zehntel(roh));
    zehntelSumme += punkteUrsache;
    ursachen.push({
      ursache_id: ursacheId,
      punkte: punkteUrsache / 10,
      beitraege,
      gedeckelt: roh > MAX_JE_URSACHE
    });
    for (const { m, p } of gezaehlt) {
      const vorhanden = trefferJeMassnahme.get(m.id);
      if (vorhanden) {
        vorhanden.ursachen_ids.push(ursacheId);
      } else {
        trefferJeMassnahme.set(m.id, {
          massnahme: m,
          ursachen_ids: [
            ursacheId
          ],
          punkteJeUrsache: p.punkte,
          rollenBonus: p.rollenBonus,
          wirksamkeit: p.wirksamkeit,
          rollenBegruendung: p.rollenBegruendung
        });
      }
    }
  }
  const punkte = zehntelSumme / 10;
  const kiEntwurf = programme.some((p) => p.abdeckung.ki_entwurf);
  const treffer = [
    ...trefferJeMassnahme.values()
  ];
  const nichtBlind = treffer.some((t) => t.massnahme.ki_entwurf && t.massnahme.entwurf_herkunft !== "blind");
  return {
    partei,
    punkte,
    treffer,
    ursachen,
    abdeckung: erfasst,
    programme,
    ...kiEntwurf ? {
      ki_entwurf: true
    } : {},
    ...nichtBlind ? {
      nicht_blind: true
    } : {}
  };
}
function rundenpunkte(a, b) {
  if (a === 0 && b === 0) return [
    0,
    0
  ];
  if (a === b) return [
    1,
    1
  ];
  return a > b ? [
    1,
    0
  ] : [
    0,
    1
  ];
}
function werteRunde(a, b) {
  if (!a.abdeckung || !b.abdeckung) return {
    status: "unvollstaendig",
    punkte: [
      0,
      0
    ]
  };
  return {
    status: "gewertet",
    punkte: rundenpunkte(a.punkte, b.punkte)
  };
}

// _shared/fehler.ts
var EingabeFehler = class extends Error {
};

// _shared/moderation.ts
var BELEIDIGUNGEN = [
  "arschloch",
  "arschgeige",
  "idiot",
  "vollidiot",
  "depp",
  "trottel",
  "vollpfosten",
  "wichser",
  "wixer",
  "fotze",
  "hurensohn",
  "hure",
  "schlampe",
  "spast",
  "spacko",
  "missgeburt",
  "pisser",
  "drecksau",
  "bastard",
  "schwuchtel",
  "ficken",
  "fick dich",
  "verpiss",
  "honk",
  "halt die fresse"
];
var BELEIDIGENDE_WORTTEILE = [
  "drecks",
  "schei\xDF",
  "scheiss",
  "arschloch",
  "hurensohn",
  "wichser",
  "fotze",
  "idiot"
];
var HETZE = [
  "kanake",
  "kanacke",
  "neger",
  "nigger",
  "zigeuner",
  "kameltreiber",
  "untermensch",
  "judenpack",
  "judensau",
  "vergasen",
  "erschie\xDFen",
  "erschiessen",
  "abknallen",
  "totschlagen",
  "abstechen",
  "sieg heil",
  "heil hitler"
];
var PERSON_MUSTER = [
  /(^|[^\p{L}])(Herr|Herrn|Frau|Hr\.|Fr\.|Dr\.|Prof\.)\s+[A-ZÄÖÜ][a-zäöüß]+/u,
  /(^|\s)@[a-z0-9_]{3,}/i
];
var KONTAKT_MUSTER = [
  /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
  /(\+49|\b0049|\b0)[\s/-]?\d{2,5}[\s/-]?\d{4,}/,
  /(https?:\/\/|www\.)\S+/i,
  /\b[a-zäöüß]+(straße|str\.|weg|gasse|allee)\s+\d+[a-z]?\b/i
];
function normalisiere(text) {
  return " " + text.toLowerCase().replace(/[0@4$1!3]/g, (z) => ({
    "0": "o",
    "@": "a",
    "4": "a",
    $: "s",
    "1": "i",
    "!": "i",
    "3": "e"
  })[z] ?? z).replace(/[^a-zäöüß ]+/g, " ").replace(/(.)\1{2,}/g, "$1$1").replace(/\s+/g, " ") + " ";
}
var amWortanfang = (normal, liste) => liste.some((w) => normal.includes(" " + w));
var irgendwo = (normal, liste) => liste.some((w) => normal.includes(w));
function pruefeText(...texte) {
  const roh = texte.filter(Boolean).join(" \n ");
  if (!roh.trim()) return null;
  if (KONTAKT_MUSTER.some((m) => m.test(roh))) return "kontaktdaten";
  const normal = normalisiere(roh);
  if (amWortanfang(normal, HETZE)) return "hetze";
  if (amWortanfang(normal, BELEIDIGUNGEN) || irgendwo(normal, BELEIDIGENDE_WORTTEILE)) return "beleidigung";
  if (PERSON_MUSTER.some((m) => m.test(roh))) return "person";
  return null;
}
function bereinigeStichwort(roh, ersatz) {
  const text = (typeof roh === "string" && roh.trim() ? roh : ersatz).replace(/(https?:\/\/|www\.)\S+/gi, "").replace(/[„“"'»«.!?;:]+/g, "").replace(/\s+/g, " ").trim();
  const woerter = text.split(" ").filter(Boolean).slice(0, 3);
  let s = "";
  for (const w of woerter) {
    const neu = s ? `${s} ${w}` : w;
    if (neu.length > 40) break;
    s = neu;
  }
  return s || text.slice(0, 40) || "Problem";
}

// _shared/typen.ts
var ROLLEN_IDS = [
  "mieter",
  "eigentuemer",
  "angestellt",
  "selbststaendig",
  "rentner",
  "arbeitslos",
  "studierend",
  "vermoegend"
];
var MAX_AUSWAHL = 3;
function auswahlErlaubt(ids, gruppe) {
  return ids.filter((id) => !gruppe?.ursachen_ids.includes(id)).length <= MAX_AUSWAHL;
}

// _shared/ki.ts
var MAX_NACHFRAGEN = 2;
var MAX_NACHRICHTEN = 2 * MAX_NACHFRAGEN + 1;
var MAX_TEXTLAENGE = 500;
var NACHFRAGE_BEISPIEL = "Magst du ein Beispiel nennen, wann dich das zuletzt betroffen hat?";
var NACHFRAGE_FORDERUNG = "Was soll sich dadurch in deinem Alltag \xE4ndern?";
var NACHFRAGE_URSACHE = "Was genau macht dir dabei Sorgen? Beschreib kurz, woran es in deinem Alltag hakt.";
var ROLLEN_TEXT = {
  mieter: "Mieter:in",
  eigentuemer: "Eigent\xFCmer:in",
  angestellt: "Angestellt",
  selbststaendig: "Selbstst\xE4ndig",
  rentner: "Rentner:in",
  arbeitslos: "Arbeitslos",
  studierend: "Studierend",
  vermoegend: "Verm\xF6gend"
};
function themenPrompt(themen, haltungen = []) {
  return baueSystemPrompt(themen, null, haltungen);
}
var haltungKennung = (id) => `H${id}`;
function haltungAusKennung(roh) {
  if (typeof roh === "number" && Number.isInteger(roh)) return roh;
  const treffer = typeof roh === "string" ? /^H(\d+)$/.exec(roh.trim()) : null;
  return treffer ? Number(treffer[1]) : null;
}
function baueSystemPrompt(themen, ursachen, haltungen) {
  const katalog = themen.map((t) => {
    if (!ursachen) return `- Thema ${t.id}: ${t.name} \u2013 ${t.beschreibung}`;
    const u = ursachen.filter((x) => x.thema_id === t.id).map((x) => `    - Ursache ${x.id}: ${x.beschreibung}${x.alltag ? ` \u2013 im Alltag: \u201E${x.alltag}\u201C` : ""}`).join("\n");
    return `- Thema ${t.id}: ${t.name} \u2013 ${t.beschreibung}
${u}`;
  }).join("\n");
  return `Du moderierst das Spiel \u201EPolitik-Duell\u201C. Spieler:innen nennen Alltagsprobleme.
Deine einzige Aufgabe: die \xC4u\xDFerung einordnen und ${ursachen ? "einem Thema und Ursachen" : "einem Thema"} aus dem Katalog zuordnen.

Regeln:
- Neutral, respektvoll, freundlich. Keine Belehrung. Deutsch, kurze S\xE4tze.
- Bewerte NIEMALS Parteien, Politiker:innen oder Ma\xDFnahmen. Nenne keine Parteien.
- Nenne NIEMALS Links, Quellen oder Zahlen aus Studien.
- Vergib keine Punkte.

Einordnung ("typ"):
- "problem": ein konkretes Alltagsproblem (z. B. \u201EIch finde keine bezahlbare Wohnung\u201C). Auch erlebte oder
  beobachtete Benachteiligung, Anfeindung, Gewalt oder Radikalisierung ist ein "problem" (z. B. \u201EIch werde im Bus
  rassistisch beleidigt\u201C, \u201EMein Cousin rutscht in die rechte Szene ab\u201C). Was die Person ausdr\xFCcklich als ihr
  Problem nennt, ist nie "wert".
- "forderung": eine politische Forderung ohne konkretes Alltagsproblem (z. B. \u201EWeniger Steuern!\u201C).
  Dann gib die Forderung in "nachfrage" in einem neutralen Halbsatz wieder und stelle danach immer genau eine
  kurze, freundliche Frage nach dem Alltag dahinter, z. B. \u201EDu m\xF6chtest weniger Steuern zahlen. Was soll sich
  dadurch in deinem Alltag \xE4ndern?\u201C. Die Wiedergabe allein reicht nie \u2013 "nachfrage" endet immer mit der Frage.
  Gib die Forderung nur wieder, wenn das ohne Wertung geht, sonst nur die Frage.
  Setze "thema_id" auf das Thema aus dem Katalog, zu dem die Forderung geh\xF6rt, sonst null; "ursachen_ids": [].
  Das gilt auch f\xFCr fachlich oder allgemein formulierte Forderungen: Nimm das Thema, auf dessen Alltagsprobleme
  der geforderte Weg zielt (z. B. \u201EWettbewerbsrecht st\xE4rken\u201C \u2192 Preise, \u201EKindergeld anheben\u201C \u2192 Armut und Kinderarmut,
  \u201EAussteigerprogramme f\xF6rdern\u201C \u2192 Radikalisierung und Extremismus).
- "wert": eine pers\xF6nliche Haltung oder ein Wert (z. B. \u201EMir ist Gerechtigkeit wichtig\u201C), kein Problem.
  Dann "thema_id": null und "ursachen_ids": [], und in "rueckmeldung" 1\u20132 kurze S\xE4tze: die Haltung in eigenen
  Worten neutral aufgreifen, sagen, dass man dar\xFCber verschieden denken kann, und fragen, wo sie der Person im
  Alltag begegnet \u2013 z. B. \u201EHeimat ist dir wichtig \u2013 dar\xFCber kann man verschieden denken. Wo begegnet dir das im
  Alltag?\u201C. Stimme nicht zu und widersprich nicht. Wertet die Haltung eine Gruppe von Menschen ab, gib sie nicht
  wieder und frag nur nach dem Alltag.${haltungen.length ? `
  Ber\xFChrt die Haltung eindeutig eine der Fragen unter \u201EHaltungen\u201C (gleich, welche Seite die Person vertritt),
  setze "haltung_id" auf deren Kennung (z. B. "H4"), sonst null. Rate nicht: \xC4hnlich oder verwandt gen\xFCgt nicht.
  Die Kennung einer Haltung ist nie eine "thema_id".
  Antwortet die Person ohne Alltagsproblem mit Ja oder Nein auf genau eine dieser Fragen (z. B. \u201EBei der Frage
  \u2026 bin ich daf\xFCr\u201C), ist das "wert" mit dieser "haltung_id" \u2013 auch wenn die Frage nach einer Ma\xDFnahme klingt.
  Dasselbe gilt f\xFCr ein kurzes F\xFCr oder Gegen genau den Gegenstand einer Frage (z. B. \u201EIch bin f\xFCr ein Tempolimit\u201C
  zur Frage nach einem Tempolimit auf Autobahnen): Einschr\xE4nkungen der Frage muss die Person nicht nennen.
  Das hat Vorrang vor "forderung" \u2013 auch wenn der Gegenstand eine Steuer, ein Verbot oder eine Abgabe ist
  (z. B. \u201EIch bin f\xFCr eine Zuckersteuer\u201C zur Frage nach einer Steuer auf gezuckerte Getr\xE4nke).
  Passen zwei Fragen, nimm die, deren Gegenstand die Person nennt (z. B. \u201EVerbot von \u2026\u201C \u2192 die Frage nach dem Verbot).` : ""}
- Ein pauschales Urteil \xFCber eine Gruppe von Menschen (z. B. \u201EDie Ausl\xE4nder sind alle kriminell\u201C, \u201ERentner sind \u2026\u201C)
  ist weder Problem noch Wert: Ordne es als "forderung" mit "pauschal": true und "thema_id": null ein und frage
  nach dem Alltag dahinter, z. B. \u201EWas hast du selbst erlebt, oder wo f\xFChlst du dich unsicher?\u201C.
  Widersprich nicht, belehre nicht, wiederhole das Urteil nicht und \xFCbernimm es nicht in "nachfrage",
  "zusammenfassung" oder "stichwort".
  Sonst ist "pauschal" immer false.
- "grenze": nur wenn die \xC4u\xDFerung selbst einer Gruppe von Menschen (wegen Herkunft, Religion, Geschlecht, Behinderung,
  sexueller Orientierung o. \xC4.) die Menschenw\xFCrde oder gleiche Rechte abspricht, zu Gewalt aufruft oder
  Personen beleidigt (z. B. \u201EDie sind keine Menschen\u201C, \u201EDie geh\xF6ren alle aufgeh\xE4ngt\u201C). Dann "nachfrage": null,
  "rueckmeldung": null, "thema_id": null, "ursachen_ids": [], "zusammenfassung": "" und "stichwort": "".
  Gib die \xC4u\xDFerung nicht wieder und kommentiere sie nicht. Das gilt gleich, aus welcher Richtung sie kommt.
  Ma\xDFgeblich ist, was die \xC4u\xDFerung selbst sagt, nicht ein umstrittenes Wort darin: Wer sich gegen eine Abwertung
  oder f\xFCr die Rechte einer Gruppe ausspricht (z. B. \u201EIch bin gegen Remigration\u201C), \xE4u\xDFert eine Haltung, kein "grenze".
  Wer berichtet, dass er selbst oder andere abgewertet, beleidigt oder angegriffen wurden, nennt ein "problem",
  kein "grenze".
  Ein pauschales Urteil ohne Abwertung oder Gewalt ist KEIN "grenze"-Fall, sondern "forderung" mit
  "pauschal": true (siehe oben). Im Zweifel: "forderung" mit "pauschal": true.
  Eine Frage oder Sorge zu Kriminalit\xE4t und Herkunft ohne Abwertung (z. B. \u201EIch frage mich, warum so viele
  Tatverd\xE4chtige keinen deutschen Pass haben\u201C) ist ein "problem", kein "grenze" und keine "forderung".

Sonst ist "rueckmeldung" null (Ausnahme: abschlie\xDFende Forderung, siehe Hinweis im Gespr\xE4ch).${haltungen.length ? '\n"haltung_id" ist nur bei "wert" gesetzt, sonst immer null.' : ""}

${ursachen ? `Zuordnung ("thema_id" bei "problem" und "forderung", alles Weitere nur bei "problem"):
- "thema_id": die ID aus dem Katalog, die am besten passt, sonst null.
- "ursachen_ids": nur die IDs der Ursachen dieses Themas, die die Schilderung selbst nennt oder erkennbar beschreibt \u2013
  h\xF6chstens ${MAX_AUSWAHL}, die deutlichste zuerst. Nimm keine Ursache dazu, nur weil sie zum Thema geh\xF6rt oder \xE4hnlich
  klingt \u2013 jede zugeordnete Ursache z\xE4hlt in der Wertung.
  Setzt eine Ursache eine bestimmte Lage voraus (z. B. einen laufenden Vertrag, einen Heimplatz, einen bestimmten
  Wohnort), ordne sie nur zu, wenn die Schilderung diese Lage erkennen l\xE4sst.
- "ursachen_belege": zu jeder Ursache in "ursachen_ids" die W\xF6rter aus der Schilderung der Person, die diese
  Ursache nennen \u2013 w\xF6rtlich \xFCbernommen, h\xF6chstens acht W\xF6rter, z. B. {"204": "Miete wird jedes Jahr erh\xF6ht"}.
  Dieselben W\xF6rter st\xFCtzen nie zwei Ursachen. Findest du keine solchen W\xF6rter, ordne die Ursache nicht zu.
- \u201Eim Alltag: \u2026\u201C zeigt, wie Betroffene eine Ursache typischerweise erleben. Vergleiche die Schilderung damit,
  auch wenn sie aus der Sicht anderer Beteiligter kommt (z. B. Anwohner statt Veranstalter, Eltern statt Jugendliche).
  Passt eine Schilderung erkennbar zu einem dieser S\xE4tze, ordne die Ursache zu, statt nachzufragen.
- Unterscheide Erlebnis und Gef\xFChl: Schildert jemand vor allem ein Gef\xFChl oder eine Sorge (z. B. \u201EIch f\xFChle mich
  unsicher, seit \u2026\u201C), passen Ursachen, die beschreiben, wie Wahrnehmung und Wirklichkeit auseinanderfallen oder wo
  sich Unsicherheit ballt. Ursachen zu Taten oder T\xE4tergruppen nur, wenn die Schilderung sie erkennen l\xE4sst.
- L\xE4sst sich keine Ursache erkennen: "thema_id" wie erkannt, "ursachen_ids": [] und in "nachfrage" genau eine
  kurze, freundliche Frage, woran es im Alltag konkret hakt, z. B. \u201EWas genau macht dir dabei Sorgen?\u201C.
  Gib keine Antworten vor.
- Nennt die Person einen klaren Grund f\xFCr ihr Problem, den keine Ursache des Themas beschreibt (z. B. L\xE4rm von
  einer Baustelle nebenan beim Thema Miete), dann passt kein Thema \u2013 nimm nicht ersatzweise die n\xE4chstliegende
  Ursache und frag nicht nach. Nachfragen nur, wenn die Schilderung zu allgemein ist, um einen Grund zu erkennen.
- Passt kein Thema: "thema_id": null, "ursachen_ids": [] und in "einschaetzung" 1\u20132 neutrale S\xE4tze zu m\xF6glichen
  Ursachen des Problems \u2013 ohne Parteien, ohne L\xF6sungsbewertung, ohne Links.` : `Zuordnung ("thema_id" bei "problem" und "forderung", alles Weitere nur bei "problem"):
- "thema_id": die ID aus dem Katalog, deren Gegenstand das Problem ist, sonst null. Ordne nach dem, worum es der
  Person geht, nicht nach einzelnen W\xF6rtern (z. B. \u201EWegen des L\xE4rms nebenan schlafe ich schlecht\u201C ist kein
  Thema zu Hitze, nur weil dort auch schlechter Schlaf vorkommt).
- "thema_sicher": true nur, wenn genau ein Thema eindeutig passt. Passen mehrere Themen oder ber\xFChrt die
  Schilderung das Thema nur am Rand: false.
- "thema_kandidaten": bei "thema_sicher": false oder "mehrere_probleme": true bis zu zwei weitere Themen-IDs,
  die ebenfalls in Frage kommen; sonst [].
- "mehrere_probleme": true, wenn die Person mehrere verschiedene Probleme nennt, die zu verschiedenen Themen
  geh\xF6ren (z. B. \u201EDer Hausarzt ist weit weg, und der Bus f\xE4hrt kaum\u201C). Dann "thema_id" f\xFCr das Problem, das sie
  zuerst oder am deutlichsten nennt, die \xFCbrigen in "thema_kandidaten", und in "nachfrage" genau eine kurze,
  freundliche Frage, welches Problem in dieser Runde z\xE4hlen soll. Eine Folge desselben Problems (z. B. \u201Eohne Auto
  komme ich nicht zum Einkaufen\u201C) ist kein weiteres Problem, ebenso mehrere Gr\xFCnde innerhalb desselben Themas
  (z. B. teure Fahrkarten und unp\xFCnktliche Z\xFCge). Sonst false.
- Die Ursachen des Themas ordnet ein zweiter Schritt zu. Ist die Schilderung so allgemein, dass sich kein Grund
  erkennen l\xE4sst, schreib in "nachfrage" genau eine kurze, freundliche Frage, woran es im Alltag konkret hakt,
  z. B. \u201EWas genau macht dir dabei Sorgen?\u201C. Gib keine Antworten vor. Sonst ist "nachfrage" bei "problem" null.
- Nennt die Person einen klaren Grund f\xFCr ihr Problem, den kein Thema beschreibt (z. B. L\xE4rm von einer Baustelle
  nebenan), dann passt kein Thema \u2013 nimm nicht ersatzweise das n\xE4chstliegende.
- Passt kein Thema: "thema_id": null und in "einschaetzung" 1\u20132 neutrale S\xE4tze zu m\xF6glichen Ursachen des
  Problems \u2013 ohne Parteien, ohne L\xF6sungsbewertung, ohne Links.`}

"zusammenfassung": ein kurzer, neutraler Satz zum Problem, ohne Namen oder pers\xF6nliche Details.
"stichwort": 1\u20133 W\xF6rter, die das Problem neutral benennen (z. B. \u201EFacharzttermin\u201C, \u201ENebenkosten-Nachzahlung\u201C),
  ohne Namen, Orte, Beleidigungen oder Wertungen.

Formulierungen:
- Gib "nachfrage" und "rueckmeldung" jeweils als Liste von drei Fassungen an, die dasselbe sagen, aber mit
  anderen W\xF6rtern und anderem Satzbau \u2013 das Spiel zeigt eine davon zuf\xE4llig, damit es nicht wie ein Textbaustein
  wirkt. Jede Fassung f\xFCr sich erf\xFCllt die Regeln oben. Gibt es keine Nachfrage oder R\xFCckmeldung: null.

Katalog:
${katalog}
${haltungen.length ? `
Haltungen (Wertfragen, nur f\xFCr "wert"):
${haltungen.map((h) => `- Haltung ${haltungKennung(h.id)}: ${h.frage}`).join("\n")}
` : ""}
Antworte ausschlie\xDFlich mit einem JSON-Objekt:
{"typ": "problem" | "forderung" | "wert" | "grenze", "nachfrage": string[] | null, "thema_id": number | null,
${ursachen ? ' "ursachen_ids": number[], "ursachen_belege": {[id: string]: string},' : ' "thema_sicher": boolean, "thema_kandidaten": number[], "mehrere_probleme": boolean,'} "pauschal": boolean, "zusammenfassung": string, "stichwort": string,
 "einschaetzung": string | null, "rueckmeldung": string[] | null${haltungen.length ? ', "haltung_id": string | null' : ""}}`;
}
function instrumenteZurAuswahl(themaId, instrumente, massnahmen, land) {
  return instrumente.filter((i) => i.thema_id === themaId && (i.ebene === "bund" || land !== null && massnahmen.some((m) => m.instrument_id === i.id && m.land === land))).sort((a, b) => a.id - b.id);
}
function instrumentPrompt(thema, instrumente) {
  const liste = instrumente.map((i) => `- Instrument ${i.id}: ${i.name}`).join("\n");
  return `Du hilfst im Spiel \u201EPolitik-Duell\u201C. Eine Person hat eine politische Forderung zum Thema \u201E${thema.name}\u201C genannt.
Deine einzige Aufgabe: Entspricht die Forderung eindeutig einem der folgenden L\xF6sungswege (Instrumente)?

Regeln:
- W\xE4hle ein Instrument nur, wenn die Forderung genau diesem L\xF6sungsweg entspricht. \xC4hnlich oder verwandt gen\xFCgt nicht.
  Rate nicht: Im Zweifel "instrument_id": null.
- Bewerte nichts und nenne keine Parteien, Links oder Zahlen.

Instrumente:
${liste}

Antworte ausschlie\xDFlich mit einem JSON-Objekt: {"instrument_id": number | null}`;
}
function instrumentNachrichten(verlauf) {
  return verlauf.map((n) => ({
    role: n.von === "spieler" ? "user" : "assistant",
    content: n.text
  }));
}
function bereinigeInstrument(roh, erlaubt) {
  const id = roh && typeof roh === "object" ? roh.instrument_id : null;
  return typeof id === "number" && erlaubt.some((i) => i.id === id) ? id : null;
}
function mitInstrument(antwort, instrumentId) {
  if (antwort.typ !== "forderung" || antwort.pauschal || antwort.thema_id === null || instrumentId === null) return antwort;
  return {
    ...antwort,
    instrument_id: instrumentId
  };
}
function ursachenPrompt(thema, ursachen) {
  const liste = ursachen.map((u) => `- Ursache ${u.id}: ${u.beschreibung}${u.gilt_fuer ? ` \u2013 gilt nur f\xFCr: ${u.gilt_fuer}` : ""}${u.alltag ? ` \u2013 im Alltag: \u201E${u.alltag}\u201C` : ""}`).join("\n");
  const symptome = (thema.symptome ?? []).map((s) => `- Folge ${s.nr}: \u201E${s.alltag}\u201C \u2013 Ursachen ${s.ursachen_ids.join(", ")}`).join("\n");
  return `Du hilfst im Spiel \u201EPolitik-Duell\u201C. Eine Person hat ein Alltagsproblem zum Thema \u201E${thema.name}\u201C genannt
(${thema.beschreibung}). Deine einzige Aufgabe: Welche der folgenden Ursachen nennt oder beschreibt sie selbst?

Regeln:
- "ursachen_ids": nur Ursachen, die die Schilderung selbst nennt oder erkennbar beschreibt und die ganz zu ihrer
  Lage passen \u2013 h\xF6chstens ${MAX_AUSWAHL}, die deutlichste zuerst. Nimm keine Ursache dazu, nur weil sie zum Thema
  geh\xF6rt oder ein Wort mit der Schilderung teilt \u2013 jede zugeordnete Ursache z\xE4hlt in der Wertung.
- \u201Egilt nur f\xFCr: \u2026\u201C nennt die Lage, die eine Ursache voraussetzt (z. B. eine bestimmte Art von Praxis, einen
  laufenden Vertrag, einen Heimplatz). Schildert die Person dasselbe Erlebnis erkennbar in einer anderen Lage (z. B.
  bei einer Fach\xE4rztin statt in der Hausarztpraxis), passt die Ursache nur teilweise. Dasselbe gilt, wenn sie nur
  einen Teil des Grundes trifft, den die Person nennt, und wenn eine Ursache ohne \u201Egilt nur f\xFCr\u201C erkennbar eine
  andere Lage voraussetzt. Widerspricht die Schilderung der Lage ausdr\xFCcklich (z. B. \u201Eich wohne seit 20 Jahren in
  derselben Wohnung\u201C bei einer Ursache \xFCber Neuvermietungen), passt sie gar nicht.
- "teilweise": Passt weder eine Ursache ganz noch eine der Folgen unten, die Ursache, die der Schilderung am
  n\xE4chsten kommt \u2013 NICHT in "ursachen_ids", sondern hier mit einem kurzen, neutralen Satz, was abweicht (h\xF6chstens
  20 W\xF6rter), z. B. {"101": "Du sprichst von einer Fach\xE4rztin, erfasst ist hier der Mangel an Hausarztpraxen."}.
  Lieber eine Ursache hier nennen als sie ungenau zuzuordnen. Sonst {}.
- Ein gemeinsames Wort gen\xFCgt nicht: Der Beleg muss denselben Grund nennen wie die Ursache (z. B. \u201Eder Bus kommt
  st\xE4ndig zu sp\xE4t\u201C nennt Unp\xFCnktlichkeit, nicht zu teure Fahrkarten, auch wenn beide vom Bus handeln).
- "ursachen_belege": zu jeder Ursache in "ursachen_ids" die W\xF6rter aus der Schilderung, die genau diesen Grund
  nennen \u2013 w\xF6rtlich \xFCbernommen, h\xF6chstens acht W\xF6rter, z. B. {"204": "Miete wird jedes Jahr erh\xF6ht"}. Dieselben
  W\xF6rter st\xFCtzen nie zwei Ursachen. Findest du keine W\xF6rter, die diesen Grund nennen, ordne die Ursache nicht zu.
- "symptom": Schildert die Person eine der Folgen unten (auch mit anderen Worten), die Nummer dieser Folge \u2013 sonst
  null. Die Ursachen einer Folge z\xE4hlen dann alle.
- \u201Eim Alltag: \u2026\u201C zeigt, wie Betroffene eine Ursache typischerweise erleben. Vergleiche die Schilderung damit,
  auch wenn sie aus der Sicht anderer Beteiligter kommt (z. B. Anwohner statt Veranstalter, Eltern statt Jugendliche).
- Unterscheide Erlebnis und Gef\xFChl: Schildert jemand vor allem ein Gef\xFChl oder eine Sorge (z. B. \u201EIch f\xFChle mich
  unsicher, seit \u2026\u201C), passen Ursachen, die beschreiben, wie Wahrnehmung und Wirklichkeit auseinanderfallen oder wo
  sich Unsicherheit ballt. Ursachen zu Taten oder T\xE4tergruppen nur, wenn die Schilderung sie erkennen l\xE4sst.
- "sicher": true nur, wenn jede Ursache in "ursachen_ids" ganz zur Schilderung passt (bei einer Folge ohne weitere
  Ursache: wenn die Folge passt). Nennt sie einen Grund, den keine Ursache beschreibt, oder ist die Schilderung zu
  allgemein: false.
- Bewerte nichts und nenne keine Parteien, Links oder Zahlen.

Ursachen:
${liste}
${symptome ? `
Folgen, die mehrere Ursachen gemeinsam haben:
${symptome}
` : ""}
Antworte ausschlie\xDFlich mit einem JSON-Objekt:
{"ursachen_ids": number[], "ursachen_belege": {[id: string]: string}, "teilweise": {[id: string]: string},
 "symptom": number | null, "sicher": boolean}`;
}
var FUELLWOERTER = new Set("kaum nicht immer mehr sehr viel viele vielen ganz noch schon auch eben einfach mein meine meinem meinen meiner mich unser unsere unserem unseren keine keinen keinem einen einem einer eine dass weil wenn aber oder doch dann denn jetzt hier dort habe haben hatte wird werden wurde sind bist kann koennen muss muessen soll sollen gibt alle alles jeden jede jeder ihre ihren sein seine sich diese dieser dieses fuer ueber unter nach seit gegen ohne beim wieder total echt leider bald heute gerade schon etwas nichts leute menschen".split(" "));
var grundWoerter = (s) => s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").split(/[^a-z]+/).filter((w) => w.length >= 4 && !FUELLWOERTER.has(w));
function belegPasstZuUrsache(beleg, ursache) {
  const gesucht = grundWoerter(beleg);
  const vorhanden = grundWoerter(`${ursache.beschreibung} ${ursache.alltag ?? ""}`);
  const stamm = (w) => w.slice(0, 5);
  return gesucht.some((w) => vorhanden.some((v) => v.includes(stamm(w)) || w.includes(stamm(v))));
}
var alsObjekt = (roh) => roh && typeof roh === "object" ? roh : {};
function unsicherheit(schritt1, schritt2, ursachen) {
  const r1 = alsObjekt(schritt1);
  const r2 = alsObjekt(schritt2);
  const gruende = [];
  const andere = (Array.isArray(r1.thema_kandidaten) ? r1.thema_kandidaten.map(Number) : []).filter((id) => Number.isInteger(id) && id !== Number(r1.thema_id));
  if (r1.thema_sicher === false) gruende.push("thema_unsicher");
  if (andere.length > 0) gruende.push("thema_kandidaten");
  if (r1.mehrere_probleme === true && andere.length > 0) gruende.push("mehrere_probleme");
  if (r2.sicher !== true) gruende.push("ursachen_unsicher");
  if (teilweisePassend(r2, ursachen).length) gruende.push("teilweise");
  const belege = alsObjekt(r2.ursachen_belege);
  for (const id of Array.isArray(r2.ursachen_ids) ? r2.ursachen_ids.map(Number) : []) {
    const u = ursachen.find((x) => x.id === id);
    if (u && !belegPasstZuUrsache(kurz(belege[String(id)], 120), u)) gruende.push(`beleg_${id}`);
  }
  return gruende;
}
var GRUENDE_THEMA = [
  "thema_unsicher",
  "thema_kandidaten",
  "mehrere_probleme",
  "ursachen_keine_antwort"
];
function teilweisePassend(schritt2, ursachen) {
  return Object.entries(alsObjekt(alsObjekt(schritt2).teilweise)).map(([id, satz]) => ({
    id: Number(id),
    satz: kurz(satz, 200)
  })).filter((t) => ursachen.some((u) => u.id === t.id));
}
function genanntesSymptom(schritt2, thema) {
  const nr = alsObjekt(schritt2).symptom;
  return Number.isInteger(nr) ? thema.symptome?.find((s) => s.nr === nr) : void 0;
}
async function ordneEin(frage, verlauf, rolle, { themen, ursachen, parteien = [], haltungen = [] }, zufall = Math.random) {
  const r1 = alsObjekt(await frage(themenPrompt(themen, haltungen), nutzerNachrichten(verlauf, rolle)));
  let roh = {
    ...r1,
    ursachen_ids: []
  };
  const unsicher = [];
  let gruppe;
  let abweichung;
  if (r1.typ === "forderung" && r1.thema_sicher === false) {
    roh = {
      ...roh,
      thema_id: null
    };
    unsicher.push("thema_unsicher");
  }
  const thema = r1.typ === "problem" ? themen.find((t) => t.id === Number(r1.thema_id)) : void 0;
  if (thema) {
    const kandidaten = ursachen.filter((u) => u.thema_id === thema.id);
    let r2 = {};
    try {
      r2 = await frage(ursachenPrompt(thema, kandidaten), instrumentNachrichten(verlauf));
    } catch {
      unsicher.push("ursachen_keine_antwort");
    }
    unsicher.push(...unsicherheit(r1, r2, kandidaten));
    const { ursachen_ids, ursachen_belege } = alsObjekt(r2);
    const verworfen = new Set(unsicher.filter((g) => g.startsWith("beleg_")).map((g) => Number(g.slice(6))));
    const uebrig = (Array.isArray(ursachen_ids) ? ursachen_ids.map(Number) : []).filter((id) => !verworfen.has(id));
    const themaUnsicher = unsicher.some((g) => GRUENDE_THEMA.includes(g));
    gruppe = themaUnsicher ? void 0 : genanntesSymptom(r2, thema) ?? thema.symptome?.find((s) => s.ursachen_ids.some((id) => uebrig.includes(id)));
    if (gruppe) {
      const weitere2 = alsObjekt(r2).sicher === true ? uebrig.filter((id) => !gruppe.ursachen_ids.includes(id)) : [];
      roh = {
        ...r1,
        ursachen_ids: weitere2,
        ursachen_belege
      };
    } else {
      const blockiert = unsicher.some((g) => !g.startsWith("beleg_"));
      abweichung = teilweisePassend(r2, kandidaten)[0]?.satz;
      roh = {
        ...r1,
        ursachen_ids: blockiert ? [] : uebrig,
        ursachen_belege
      };
    }
  }
  let antwort = bereinigeAntwort(roh, verlauf, themen, ursachen, parteien, zufall, haltungen);
  if (gruppe && antwort.typ === "problem" && antwort.thema_id === thema?.id) {
    const ids = [
      ...antwort.ursachen_ids,
      ...gruppe.ursachen_ids.filter((id) => !antwort.ursachen_ids.includes(id))
    ];
    antwort = {
      ...antwort,
      nachfrage: null,
      ursachen_ids: ids,
      symptom: gruppe.nr
    };
  }
  const satz = abweichung && antwort.nachfrage && antwort.thema_id === thema?.id ? bereinigeAbweichung(abweichung, parteien) : null;
  if (satz) antwort = {
    ...antwort,
    abweichung: satz
  };
  const weitere = (Array.isArray(r1.thema_kandidaten) ? r1.thema_kandidaten.map(Number) : []).filter((id, i, alle) => id !== antwort.thema_id && themen.some((t) => t.id === id) && alle.indexOf(id) === i).slice(0, 2);
  return {
    antwort: antwort.typ === "problem" && antwort.nachfrage && weitere.length ? {
      ...antwort,
      thema_kandidaten: weitere
    } : antwort,
    unsicher
  };
}
function bereinigeAbweichung(satz, parteien) {
  const text = ohneParteinamen(satz.replace(/(https?:\/\/|www\.)\S+/gi, ""), parteien).trim();
  if (text.length < 10 || text.length > 200 || text.includes("[Partei]") || pruefeText(text)) return null;
  return text;
}
function nutzerNachrichten(verlauf, rolle) {
  const nachfragen = verlauf.filter((n) => n.von === "ki").length;
  const hinweis = `Rolle der Person: ${rolle ? ROLLEN_TEXT[rolle] : "keine Angabe"}.` + (nachfragen === 1 ? " Es wurde schon einmal nachgefragt: Falls du noch einmal nachfragst, frag anders als zuvor, z. B. nach einem konkreten Beispiel aus dem Alltag, und gib die Forderung nicht noch einmal wieder." : "") + (nachfragen >= MAX_NACHFRAGEN ? ' Es wurde bereits zweimal nachgefragt: Ordne jetzt abschlie\xDFend ein und stelle keine Nachfrage mehr. Bleibt es bei einer Forderung ohne Alltagsproblem, ordne sie als "forderung" ein und schreib in "rueckmeldung" 1\u20132 kurze S\xE4tze: die Forderung neutral aufgreifen, sagen, dass hier L\xF6sungen f\xFCr konkrete Alltagsprobleme gewertet werden, und zu einem solchen Problem einladen. W\xE4hle nur Ursachen, die sich aus dem Gesagten erkennen lassen.' : "");
  return [
    {
      role: "system",
      content: hinweis
    },
    ...verlauf.map((n) => ({
      role: n.von === "spieler" ? "user" : "assistant",
      content: n.text
    }))
  ];
}
var SITZUNG_MUSTER = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function pruefeAnfrage(roh) {
  const a = roh;
  if (!a || typeof a !== "object") throw new EingabeFehler("Anfrage fehlt.");
  if (typeof a.sitzung !== "string" || !SITZUNG_MUSTER.test(a.sitzung)) throw new EingabeFehler("Ung\xFCltige Sitzung.");
  const auswahl = pruefeAuswahl(a.auswahl);
  if (!Array.isArray(a.verlauf) || a.verlauf.length === 0 && !auswahl || a.verlauf.length > MAX_NACHRICHTEN) throw new EingabeFehler("Ung\xFCltiger Verlauf.");
  for (const n of a.verlauf) {
    if (!n || n.von !== "spieler" && n.von !== "ki" || typeof n.text !== "string") throw new EingabeFehler("Ung\xFCltige Nachricht.");
    if (n.text.trim().length === 0 || n.text.length > MAX_TEXTLAENGE) throw new EingabeFehler("Text zu lang oder leer.");
  }
  if (!auswahl && a.verlauf[a.verlauf.length - 1].von !== "spieler") throw new EingabeFehler("Letzte Nachricht muss vom Spieler sein.");
  if (a.rolle !== null && a.rolle !== void 0 && !ROLLEN_IDS.includes(a.rolle)) throw new EingabeFehler("Ung\xFCltige Rolle.");
  if (!Array.isArray(a.parteien) || a.parteien.length !== 2 || !a.parteien.every((p) => Number.isInteger(p)) || a.parteien[0] === a.parteien[1]) throw new EingabeFehler("Ung\xFCltige Parteien.");
  if (a.land !== null && a.land !== void 0 && (typeof a.land !== "string" || !/^[A-Z]{2}$/.test(a.land))) throw new EingabeFehler("Ung\xFCltiges Bundesland.");
  if (a.zugang !== null && a.zugang !== void 0 && (typeof a.zugang !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(a.zugang))) throw new EingabeFehler("Ung\xFCltiger Zugang zur Testphase.");
  return {
    sitzung: a.sitzung,
    verlauf: a.verlauf,
    rolle: a.rolle ?? null,
    land: a.land ?? null,
    zugang: a.zugang ?? null,
    parteien: a.parteien,
    auswahl
  };
}
function pruefeAuswahl(roh) {
  if (roh === null || roh === void 0) return null;
  const w = roh;
  const ids = w.ursachen_ids;
  if (typeof w === "object" && w.passt_nicht === true) {
    if (!Number.isInteger(w.thema_id) || !Array.isArray(ids) || ids.length !== 0) throw new EingabeFehler("Ung\xFCltige Auswahl (\u201ENichts davon passt\u201C ohne Ursachen).");
    return {
      thema_id: w.thema_id,
      ursachen_ids: [],
      passt_nicht: true
    };
  }
  if (typeof w !== "object" || !Number.isInteger(w.thema_id) || !Array.isArray(ids) || ids.length === 0 || // Mit Symptomgruppe dürfen es mehr sein; wie viele, prüft antwortAusAuswahl am Katalog.
  ids.length > (w.symptom === void 0 ? MAX_AUSWAHL : MAX_MIT_SYMPTOM) || !ids.every((id) => Number.isInteger(id)) || new Set(ids).size !== ids.length || w.symptom !== void 0 && !Number.isInteger(w.symptom)) throw new EingabeFehler(`Ung\xFCltige Auswahl (1 bis ${MAX_AUSWAHL} Ursachen eines Themas).`);
  return {
    thema_id: w.thema_id,
    ursachen_ids: ids,
    ...w.symptom !== void 0 ? {
      symptom: w.symptom
    } : {}
  };
}
var MAX_MIT_SYMPTOM = 20;
function antwortAusAuswahl(auswahl, themen, ursachen) {
  const thema = themen.find((t) => t.id === auswahl.thema_id);
  if (auswahl.passt_nicht) {
    if (!thema) throw new EingabeFehler("Dieses Thema gibt es nicht.");
    return {
      typ: "problem",
      nachfrage: null,
      thema_id: thema.id,
      ursachen_ids: [],
      passt_nicht: true,
      zusammenfassung: kurz(`Keine passende Ursache im Thema \u201E${thema.name}\u201C.`, 200),
      stichwort: bereinigeStichwort(thema.name, thema.name),
      einschaetzung: null
    };
  }
  const passt = auswahl.ursachen_ids.every((id) => ursachen.some((u) => u.id === id && u.thema_id === auswahl.thema_id));
  if (!thema || !passt) throw new EingabeFehler("Diese Ursachen geh\xF6ren nicht zu diesem Thema.");
  const gruppe = auswahl.symptom === void 0 ? void 0 : thema.symptome?.find((s) => s.nr === auswahl.symptom);
  if (auswahl.symptom !== void 0 && !gruppe) throw new EingabeFehler("Diese Symptomgruppe gibt es nicht.");
  if (!auswahlErlaubt(auswahl.ursachen_ids, gruppe)) throw new EingabeFehler(`H\xF6chstens ${MAX_AUSWAHL} Ursachen au\xDFerhalb der Symptomgruppe.`);
  const ausGruppe = auswahl.ursachen_ids.filter((id) => gruppe?.ursachen_ids.includes(id));
  const saetze = [
    ...ausGruppe.length ? [
      gruppe.alltag
    ] : [],
    ...auswahl.ursachen_ids.filter((id) => !ausGruppe.includes(id)).map((id) => {
      const u = ursachen.find((x) => x.id === id);
      return u.alltag || u.beschreibung;
    })
  ].map((t) => t.trim().replace(/[.!…]*$/, ""));
  return {
    typ: "problem",
    nachfrage: null,
    thema_id: thema.id,
    ursachen_ids: [
      ...auswahl.ursachen_ids
    ],
    ...ausGruppe.length ? {
      symptom: gruppe.nr
    } : {},
    zusammenfassung: kurz(`${saetze.join(". ")}.`, 200),
    stichwort: bereinigeStichwort(thema.name, thema.name),
    einschaetzung: null
  };
}
var regexText = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function ohneParteinamen(text, parteien) {
  const namen = /* @__PURE__ */ new Set();
  for (const p of parteien) {
    for (const n of [
      p.name,
      p.kurzname,
      ...p.kurzname.split("/")
    ]) {
      const t = n.trim();
      if (t.length >= 2) namen.add(t).add(t.toUpperCase());
    }
  }
  if (namen.size === 0) return text;
  const alternativen = [
    ...namen
  ].sort((a, b) => b.length - a.length).map(regexText).join("|");
  const muster = new RegExp(`(?:(?<!\\p{L})[Dd](?:ie|er|en|em|es)\\s+)?(?<![\\p{L}\\d])(?:${alternativen})(?:n|en|s)?(?![\\p{L}\\d])`, "gu");
  return text.replace(muster, "[Partei]");
}
var MAX_RUECKMELDUNG = 240;
function bereinigeRueckmeldung(roh, ohneLinks) {
  const text = ohneLinks(kurz(roh, MAX_RUECKMELDUNG + 1));
  if (text.length < 10 || text.length > MAX_RUECKMELDUNG || text.includes("[Partei]") || pruefeText(text)) return null;
  return text;
}
var fassungen = (roh) => Array.isArray(roh) ? roh.slice(0, 5) : [
  roh
];
var zufaellig = (liste, zufall) => liste[Math.min(liste.length - 1, Math.floor(zufall() * liste.length))];
var vergleichbar = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
function ohneWiederholung(nachfrage, verlauf) {
  if (!nachfrage) return nachfrage;
  const frueher = new Set(verlauf.filter((n) => n.von === "ki").map((n) => vergleichbar(n.text)));
  for (const kandidat of [
    nachfrage,
    NACHFRAGE_BEISPIEL,
    NACHFRAGE_URSACHE
  ]) {
    if (!frueher.has(vergleichbar(kandidat))) return kandidat;
  }
  return nachfrage;
}
var inhaltsWoerter = (s) => vergleichbar(s).split(" ").filter((w) => w.length >= 3);
function gestuetzt(beleg, texte) {
  const gesucht = inhaltsWoerter(beleg);
  if (!gesucht.length) return false;
  const vorhanden = texte.flatMap(inhaltsWoerter);
  const stamm = (w) => w.slice(0, Math.max(3, Math.min(w.length, 5)));
  const treffer = gesucht.filter((w) => vorhanden.some((v) => v === w || stamm(v) === stamm(w)));
  return treffer.length * 3 >= gesucht.length * 2;
}
function grenzeAntwort() {
  return {
    typ: "grenze",
    nachfrage: null,
    thema_id: null,
    ursachen_ids: [],
    zusammenfassung: "",
    stichwort: "",
    einschaetzung: null,
    rueckmeldung: null
  };
}
var kurz = (s, max) => typeof s === "string" ? s.trim().replace(/\s+/g, " ").slice(0, max) : "";
function bereinigeAntwort(roh, verlauf, themen, ursachen, parteien = [], zufall = Math.random, haltungen = []) {
  const r = roh && typeof roh === "object" ? roh : {};
  const nachfragen = verlauf.filter((n) => n.von === "ki").length;
  const letzterText = verlauf.filter((n) => n.von === "spieler").at(-1)?.text ?? "";
  const ohneLinks = (s) => ohneParteinamen(s.replace(/(https?:\/\/|www\.)\S+/gi, ""), parteien).trim();
  if (r.typ === "grenze") return grenzeAntwort();
  const typ = r.typ === "forderung" || r.typ === "wert" ? r.typ : "problem";
  const pauschal = typ === "forderung" && r.pauschal === true;
  const frueher = new Set(verlauf.filter((n) => n.von === "ki").map((n) => vergleichbar(n.text)));
  const vorschlaege = fassungen(r.nachfrage).map((x) => ohneLinks(kurz(x, 200))).filter(Boolean);
  const gute = vorschlaege.filter((q) => q.includes("?") && !frueher.has(vergleichbar(q)));
  let nachfrage = zufaellig(gute.length ? gute : vorschlaege, zufall) ?? "";
  if (typ === "forderung") {
    if (nachfragen >= MAX_NACHFRAGEN) nachfrage = "";
    else if (!nachfrage) nachfrage = "Was l\xE4uft in deinem Alltag konkret schief?";
    else if (!nachfrage.includes("?")) nachfrage = `${nachfrage.replace(/[.!…]*$/, "")}. ${NACHFRAGE_FORDERUNG}`;
  }
  nachfrage = ohneWiederholung(nachfrage, verlauf);
  const erkanntesThema = themen.find((t) => t.id === Number(r.thema_id)) ?? null;
  const rueckmeldung = () => zufaellig(fassungen(r.rueckmeldung).map((x) => bereinigeRueckmeldung(x, ohneLinks)).filter((x) => x !== null), zufall) ?? null;
  const zusammenfassung = ohneLinks(kurz(r.zusammenfassung, 200)) || ohneLinks(kurz(letzterText, 120));
  const stichwortRoh = typeof r.stichwort === "string" ? ohneLinks(r.stichwort).replace(/\[Partei\]/g, "").trim() : "";
  const stichwort = bereinigeStichwort(stichwortRoh, zusammenfassung.replace(/\[Partei\]/g, ""));
  if (typ !== "problem") {
    const offen = typ === "forderung" ? nachfrage || null : null;
    const gemeint = haltungAusKennung(r.haltung_id);
    const haltungId = typ === "wert" && gemeint !== null && haltungen.some((h) => h.id === gemeint) ? gemeint : null;
    return {
      typ,
      nachfrage: offen,
      // Bei einer Forderung: erkanntes Thema für die Ursachenauswahl (nicht bei Pauschalurteilen).
      thema_id: typ === "forderung" && !pauschal ? erkanntesThema?.id ?? null : null,
      ursachen_ids: [],
      ...pauschal ? {
        pauschal: true
      } : {},
      zusammenfassung,
      stichwort,
      einschaetzung: null,
      rueckmeldung: offen || pauschal ? null : rueckmeldung(),
      ...haltungId !== null ? {
        haltung_id: haltungId
      } : {}
    };
  }
  const thema = erkanntesThema;
  if (!thema) {
    return {
      typ,
      nachfrage: null,
      thema_id: null,
      ursachen_ids: [],
      zusammenfassung,
      stichwort,
      einschaetzung: ohneLinks(kurz(r.einschaetzung, 400)) || null
    };
  }
  const erlaubt = ursachen.filter((u) => u.thema_id === thema.id).map((u) => u.id);
  const belegRoh = r.ursachen_belege && typeof r.ursachen_belege === "object" ? r.ursachen_belege : {};
  const spielerTexte = verlauf.filter((n) => n.von === "spieler").map((n) => n.text);
  const belege = {};
  const vergeben = /* @__PURE__ */ new Set();
  const genannt = (Array.isArray(r.ursachen_ids) ? r.ursachen_ids.map(Number) : []).filter((id, i, alle) => erlaubt.includes(id) && alle.indexOf(id) === i).filter((id) => {
    const beleg = kurz(belegRoh[String(id)], 120);
    if (!gestuetzt(beleg, spielerTexte) || vergeben.has(vergleichbar(beleg))) return false;
    vergeben.add(vergleichbar(beleg));
    belege[id] = beleg;
    return true;
  }).slice(0, MAX_AUSWAHL);
  if (genannt.length === 0) {
    const fragen = nachfragen < MAX_NACHFRAGEN;
    return {
      typ,
      // Ohne Frage (nur eine Feststellung) die Standardfrage nehmen.
      nachfrage: fragen ? ohneWiederholung(nachfrage.includes("?") ? nachfrage : NACHFRAGE_URSACHE, verlauf) : null,
      thema_id: fragen ? thema.id : null,
      ursachen_ids: [],
      zusammenfassung,
      stichwort,
      einschaetzung: null
    };
  }
  return {
    typ,
    nachfrage: null,
    thema_id: thema.id,
    ursachen_ids: genannt,
    ursachen_belege: Object.fromEntries(genannt.map((id) => [
      id,
      belege[id]
    ])),
    zusammenfassung,
    stichwort,
    einschaetzung: null
  };
}

// _shared/pruefung.ts
async function tokenHash(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [
    ...new Uint8Array(digest)
  ].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// _shared/zugriff.ts
var RATE_LIMIT_SITZUNG = {
  max: 40,
  fenster: "30 minutes"
};
var RATE_LIMIT_GLOBAL = {
  max: 600,
  fenster: "1 hour"
};
var GLOBALE_SITZUNG = "00000000-0000-0000-0000-000000000000";
function globalesLimit(wert) {
  const n = Number(wert);
  return Number.isInteger(n) && n > 0 ? n : RATE_LIMIT_GLOBAL.max;
}
function erlaubteUrspruenge(wert) {
  const eintraege = (wert ?? "").split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
  if (eintraege.length === 0) return null;
  return eintraege.map((e) => new RegExp("^" + e.split("*").map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[a-z0-9-]*") + "$", "i"));
}
function ursprungErlaubt(ursprung, erlaubt) {
  if (!erlaubt) return true;
  return ursprung !== null && erlaubt.some((r) => r.test(ursprung));
}
function corsKoepfe(ursprung, erlaubt) {
  return {
    "Access-Control-Allow-Origin": erlaubt ? ursprungErlaubt(ursprung, erlaubt) ? ursprung : "null" : "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...erlaubt ? {
      Vary: "Origin"
    } : {}
  };
}

// _shared/mistral.ts
var MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
var MISTRAL_STANDARDMODELL = "mistral-medium-latest";
async function frageMistral(system, nachrichten, zugang, maxTokens = 700) {
  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${zugang.key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: zugang.modell || MISTRAL_STANDARDMODELL,
      temperature: 0.1,
      max_tokens: maxTokens,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: system
        },
        ...nachrichten
      ]
    }),
    signal: AbortSignal.timeout(2e4)
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const daten = await res.json();
  return JSON.parse(daten.choices?.[0]?.message?.content ?? "{}");
}

// analyse/index.ts
var MAX_ANFRAGE_BYTES = 8e3;
var ERLAUBT = erlaubteUrspruenge(Deno.env.get("ERLAUBTE_URSPRUENGE"));
var GLOBAL_MAX = globalesLimit(Deno.env.get("RATE_LIMIT_GLOBAL"));
var db = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: {
    persistSession: false
  }
});
async function frageMistral2(system, nachrichten) {
  const key = Deno.env.get("MISTRAL_API_KEY");
  if (!key) throw new Error("MISTRAL_API_KEY fehlt");
  return frageMistral(system, nachrichten, {
    key,
    modell: Deno.env.get("MISTRAL_MODEL")
  });
}
async function lesJson(req) {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_ANFRAGE_BYTES) throw new EingabeFehler("Anfrage zu gro\xDF.");
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
async function imLimit(sitzung, max, fenster) {
  const { data, error } = await db.rpc("rate_limit_pruefen", {
    p_sitzung: sitzung,
    p_max: max,
    p_fenster: fenster
  });
  if (error) throw error;
  return data === true;
}
Deno.serve(async (req) => {
  const ursprung = req.headers.get("origin");
  const cors = corsKoepfe(ursprung, ERLAUBT);
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
  if (!ursprungErlaubt(ursprung, ERLAUBT)) return json({
    fehler: "Aufruf von dieser Seite nicht erlaubt."
  }, 403);
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors
  });
  if (req.method !== "POST") return json({
    fehler: "Nur POST erlaubt."
  }, 405);
  try {
    const anfrage = pruefeAnfrage(await lesJson(req));
    if (!await imLimit(anfrage.sitzung, RATE_LIMIT_SITZUNG.max, RATE_LIMIT_SITZUNG.fenster)) return json({
      fehler: "Zu viele Anfragen. Bitte warte ein paar Minuten."
    }, 429);
    if (!anfrage.auswahl && !await imLimit(GLOBALE_SITZUNG, GLOBAL_MAX, RATE_LIMIT_GLOBAL.fenster)) return json({
      fehler: "Gerade spielen sehr viele Leute. Bitte versuch es etwas sp\xE4ter noch einmal."
    }, 503);
    const [themenRes, ursachenRes, parteienRes] = await Promise.all([
      db.from("themen").select("id, name, beschreibung, symptome"),
      db.from("ursachen").select("*"),
      db.from("parteien").select("*")
    ]);
    if (themenRes.error) throw themenRes.error;
    if (ursachenRes.error) throw ursachenRes.error;
    if (parteienRes.error) throw parteienRes.error;
    const ursachen = ursachenRes.data;
    const parteien = parteienRes.data;
    const testphase = anfrage.zugang ? await zugangGueltig(anfrage.zugang) : false;
    const themen = mitSymptomen(themenRes.data, testphase);
    let antwort;
    if (anfrage.auswahl) {
      antwort = antwortAusAuswahl(anfrage.auswahl, themen, ursachen);
    } else {
      const haltungen = await vollstaendigeHaltungen(testphase);
      antwort = (await ordneEin(frageMistral2, anfrage.verlauf, anfrage.rolle, {
        themen,
        ursachen,
        parteien,
        haltungen
      })).antwort;
    }
    if (antwort.typ === "forderung" && !antwort.pauschal && antwort.thema_id !== null) {
      const thema = themen.find((t) => t.id === antwort.thema_id);
      if (thema) antwort = mitInstrument(antwort, await erkenneInstrument(thema, anfrage.verlauf, anfrage.land, testphase));
    }
    const vorschlag = !anfrage.auswahl && antwort.typ === "problem" && antwort.ursachen_ids.length > 0;
    if (!antwort.nachfrage && !vorschlag) {
      const original = anfrage.verlauf.filter((n) => n.von === "spieler").map((n) => n.text);
      await speichereRunde(antwort, anfrage.parteien, anfrage.rolle, anfrage.land, testphase, original, parteien, ursachen);
    }
    return json(antwort);
  } catch (e) {
    if (e instanceof EingabeFehler) return json({
      fehler: e.message
    }, 400);
    console.error("analyse:", e instanceof Error ? e.message : e);
    return json({
      fehler: "Die Einordnung hat gerade nicht geklappt. Bitte versuch es noch einmal."
    }, 502);
  }
});
async function erkenneInstrument(thema, verlauf, land, testphase) {
  try {
    let iAbfrage = db.from("instrumente").select("id, thema_id, name, ebene").eq("thema_id", thema.id);
    let mAbfrage = db.from("massnahmen").select("instrument_id, land").eq("thema_id", thema.id).not("instrument_id", "is", null);
    if (!testphase) {
      iAbfrage = iAbfrage.eq("ki_entwurf", false);
      mAbfrage = mAbfrage.eq("ki_entwurf", false);
    }
    const [iRes, mRes] = await Promise.all([
      iAbfrage,
      mAbfrage
    ]);
    if (iRes.error) throw iRes.error;
    if (mRes.error) throw mRes.error;
    const kandidaten = instrumenteZurAuswahl(thema.id, iRes.data, mRes.data, land);
    if (!kandidaten.length) return null;
    const roh = await frageMistral2(instrumentPrompt(thema, kandidaten), instrumentNachrichten(verlauf));
    return bereinigeInstrument(roh, kandidaten);
  } catch (e) {
    console.error("erkenneInstrument:", e instanceof Error ? e.message : e);
    return null;
  }
}
async function vollstaendigeHaltungen(testphase) {
  try {
    let vAbfrage = db.from("haltungen_vollstaendig").select("haltung_id");
    if (!testphase) vAbfrage = vAbfrage.eq("geprueft", true);
    const [vRes, hRes] = await Promise.all([
      vAbfrage,
      db.from("haltungen").select("id, frage").order("id")
    ]);
    if (vRes.error) throw vRes.error;
    if (hRes.error) throw hRes.error;
    const ids = new Set(vRes.data.map((v) => v.haltung_id));
    return hRes.data.filter((h) => ids.has(h.id));
  } catch (e) {
    console.error("vollstaendigeHaltungen:", e instanceof Error ? e.message : e);
    return [];
  }
}
function mitSymptomen(themen, testphase) {
  return themen.map((t) => ({
    ...t,
    symptome: (t.symptome ?? []).filter((s) => testphase || !s.ki_entwurf)
  }));
}
async function zugangGueltig(token) {
  const { data, error } = await db.from("testphase_zugaenge").select("id").eq("token_hash", await tokenHash(token)).eq("gesperrt", false).maybeSingle();
  if (error) throw error;
  return data !== null;
}
async function speichereRunde(antwort, [parteiA, parteiB], rolle, land, testphase, original, parteien, ursachen) {
  if (antwort.typ === "grenze") {
    await Promise.all([
      db.from("runden").insert({
        problem_text: "",
        status: "grenze",
        partei_a: parteiA,
        partei_b: parteiB,
        testphase
      }),
      merkeOhneWertung("grenze", original, null, null)
    ]);
    return;
  }
  const stichwort = antwort.stichwort ?? null;
  const basis = {
    problem_text: antwort.zusammenfassung,
    stichwort,
    // Automatischer Filter: Treffer landen in der Admin-Ansicht unter „Vom Filter gestoppt“.
    filter_grund: pruefeText(stichwort, antwort.zusammenfassung, ...original),
    partei_a: parteiA,
    partei_b: parteiB,
    testphase
  };
  if (antwort.typ === "wert") {
    await Promise.all([
      db.from("runden").insert({
        ...basis,
        status: "wert",
        ...antwort.haltung_id ? {
          haltung_id: antwort.haltung_id
        } : {}
      }),
      merkeOhneWertung("wert", original, null, antwort.zusammenfassung)
    ]);
    return;
  }
  if (antwort.typ === "forderung") {
    await Promise.all([
      db.from("runden").insert({
        ...basis,
        status: "forderung",
        thema_id: antwort.thema_id,
        ...antwort.instrument_id ? {
          instrument_id: antwort.instrument_id
        } : {}
      }),
      merkeOhneWertung("forderung", original, antwort.thema_id, antwort.zusammenfassung)
    ]);
    return;
  }
  if (antwort.passt_nicht && antwort.thema_id !== null) {
    await Promise.all([
      db.from("runden").insert({
        ...basis,
        status: "ungeprueft",
        thema_id: antwort.thema_id
      }),
      merkeOhneWertung("ungeprueft", original, antwort.thema_id, antwort.zusammenfassung)
    ]);
    return;
  }
  if (antwort.thema_id === null) {
    await Promise.all([
      db.from("runden").insert({
        ...basis,
        status: "ungeprueft"
      }),
      db.from("review_warteschlange").insert({
        problem_text: antwort.zusammenfassung,
        einschaetzung: antwort.einschaetzung ?? null
      }),
      merkeOhneWertung("ungeprueft", original, null, antwort.zusammenfassung)
    ]);
    return;
  }
  let mAbfrage = db.from("massnahmen").select("*").eq("thema_id", antwort.thema_id).in("partei_id", [
    parteiA,
    parteiB
  ]);
  let aAbfrage = db.from("abdeckung").select("*").eq("thema_id", antwort.thema_id).in("partei_id", [
    parteiA,
    parteiB
  ]);
  if (!testphase) {
    mAbfrage = mAbfrage.eq("ki_entwurf", false);
    aAbfrage = aAbfrage.eq("ki_entwurf", false);
  }
  const [mRes, aRes, lpRes] = await Promise.all([
    mAbfrage,
    aAbfrage,
    land ? db.from("landesprogramme").select("*").eq("land", land).in("partei_id", [
      parteiA,
      parteiB
    ]) : Promise.resolve({
      data: [],
      error: null
    })
  ]);
  const fehler = mRes.error ?? aRes.error ?? lpRes.error;
  if (fehler) {
    console.error("speichereRunde:", fehler.message);
    return;
  }
  const massnahmen = mRes.data;
  const abdeckung = aRes.data;
  const a = parteien.find((p) => p.id === parteiA);
  const b = parteien.find((p) => p.id === parteiB);
  if (!a || !b) return;
  const ebenen = {
    land,
    ursachen,
    landesprogramme: lpRes.data
  };
  const ea = bewertePartei(a, antwort.thema_id, antwort.ursachen_ids, rolle, massnahmen, abdeckung, ebenen);
  const eb = bewertePartei(b, antwort.thema_id, antwort.ursachen_ids, rolle, massnahmen, abdeckung, ebenen);
  const { status } = werteRunde(ea, eb);
  const punkte = status === "gewertet" ? {
    punkte_a: ea.punkte,
    punkte_b: eb.punkte
  } : {};
  await Promise.all([
    db.from("runden").insert({
      ...basis,
      thema_id: antwort.thema_id,
      status,
      ...punkte
    }),
    status === "gewertet" ? null : merkeOhneWertung(status, original, antwort.thema_id, antwort.zusammenfassung)
  ]);
}
async function merkeOhneWertung(grund, original, themaId, zusammenfassung) {
  const eingaben = original.map((t) => t.trim().slice(0, 2e3)).filter(Boolean).slice(-3);
  if (!eingaben.length) return;
  const { error } = await db.from("review_eingaben").insert({
    grund,
    eingaben,
    thema_id: grund === "grenze" ? null : themaId,
    zusammenfassung: grund === "grenze" ? null : zusammenfassung?.slice(0, 200) || null
  });
  if (error) console.error("merkeOhneWertung:", error.message);
}
