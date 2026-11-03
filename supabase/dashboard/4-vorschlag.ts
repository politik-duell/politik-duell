// @ts-nocheck
// AUTOMATISCH ERZEUGT aus supabase/functions/vorschlag (npm run dashboard) – nicht von Hand bearbeiten.
// Im Supabase-Dashboard: Edge Functions → Deploy a new function → Via Editor,
// Name „vorschlag“, diesen Inhalt komplett einfügen → Deploy.
// vorschlag/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

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

// _shared/vorschlag.ts
var VORSCHLAG_MIN = 3;
var VORSCHLAG_MAX = 500;
var RATE_LIMIT_VORSCHLAG = {
  max: 5,
  fenster: "1 hour"
};
var RATE_LIMIT_VORSCHLAG_GLOBAL = {
  max: 300,
  fenster: "1 hour"
};
var VORSCHLAG_GLOBAL = "00000000-0000-0000-0000-000000000002";
var SITZUNG_MUSTER = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var ABLEHNUNG = {
  kontaktdaten: "Bitte ohne Kontaktdaten, Adressen oder Links \u2013 beschreib nur das Thema.",
  person: "Bitte ohne Namen von Personen \u2013 beschreib nur das Thema.",
  beleidigung: "Bitte ohne Beleidigungen \u2013 beschreib nur das Thema.",
  hetze: "Diesen Vorschlag nehmen wir nicht an."
};
function bereinigeVorschlag(text) {
  return text.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
}
function pruefeVorschlag(roh) {
  if (!roh || typeof roh !== "object") throw new EingabeFehler("Ung\xFCltige Anfrage.");
  const a = roh;
  if (typeof a.sitzung !== "string" || !SITZUNG_MUSTER.test(a.sitzung)) throw new EingabeFehler("Ung\xFCltige Sitzung.");
  if (typeof a.text !== "string") throw new EingabeFehler("Bitte beschreib das Thema.");
  const text = bereinigeVorschlag(a.text);
  if (text.length < VORSCHLAG_MIN) throw new EingabeFehler("Bitte beschreib das Thema in ein paar Worten.");
  if (text.length > VORSCHLAG_MAX) throw new EingabeFehler(`Bitte h\xF6chstens ${VORSCHLAG_MAX} Zeichen.`);
  const grund = pruefeText(text);
  if (grund) throw new EingabeFehler(ABLEHNUNG[grund]);
  return {
    text,
    sitzung: a.sitzung
  };
}
async function vorschlagSchluessel(sitzung) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`vorschlag:${sitzung}`)));
  const h = [
    ...d.slice(0, 16)
  ].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}
async function bearbeiteVorschlag(roh, speicher) {
  let anfrage;
  try {
    anfrage = pruefeVorschlag(roh);
  } catch (e) {
    if (e instanceof EingabeFehler) return {
      status: 400,
      body: {
        fehler: e.message
      }
    };
    throw e;
  }
  const s = RATE_LIMIT_VORSCHLAG;
  if (!await speicher.imLimit(await vorschlagSchluessel(anfrage.sitzung), s.max, s.fenster)) return {
    status: 429,
    body: {
      fehler: "Danke f\xFCr deine Vorschl\xE4ge! F\xFCr den Moment sind es genug \u2013 sp\xE4ter gern mehr."
    }
  };
  const g = RATE_LIMIT_VORSCHLAG_GLOBAL;
  if (!await speicher.imLimit(VORSCHLAG_GLOBAL, g.max, g.fenster)) return {
    status: 503,
    body: {
      fehler: "Gerade kommen sehr viele Vorschl\xE4ge an. Bitte versuch es sp\xE4ter noch einmal."
    }
  };
  await speicher.speichern(anfrage.text);
  return {
    status: 200,
    body: {
      ok: true
    }
  };
}

// _shared/zugriff.ts
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

// vorschlag/index.ts
var MAX_ANFRAGE_BYTES = 4e3;
var ERLAUBT = erlaubteUrspruenge(Deno.env.get("ERLAUBTE_URSPRUENGE"));
var db = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: {
    persistSession: false
  }
});
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
    const text = await req.text();
    if (new TextEncoder().encode(text).length > MAX_ANFRAGE_BYTES) return json({
      fehler: "Anfrage zu gro\xDF."
    }, 400);
    let roh = null;
    try {
      roh = JSON.parse(text);
    } catch {
    }
    const { status, body } = await bearbeiteVorschlag(roh, {
      async imLimit(schluessel, max, fenster) {
        const { data, error } = await db.rpc("rate_limit_pruefen", {
          p_sitzung: schluessel,
          p_max: max,
          p_fenster: fenster
        });
        if (error) throw error;
        return data === true;
      },
      async speichern(vorschlag) {
        const { error } = await db.from("themen_vorschlaege").insert({
          text: vorschlag
        });
        if (error) throw error;
      }
    });
    return json(body, status);
  } catch (e) {
    console.error("vorschlag:", e instanceof Error ? e.message : e);
    return json({
      fehler: "Das hat gerade nicht geklappt. Bitte versuch es noch einmal."
    }, 502);
  }
});
