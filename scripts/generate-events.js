const axios = require("axios");
const ical = require("node-ical");
const fs = require("fs");

// ============================================================
// CONFIGURATION
// ============================================================

const CALENDAR_URL =
  "https://calendar.google.com/calendar/ical/cb4a8bd6e4b215de55e3e17b61675676754397faeb48a066ba961be93aaeec4b%40group.calendar.google.com/public/basic.ics";

// Nombre maximum d'événements conservés
const MAX_EVENTS = 50;

// Fichiers de sortie
const OUTPUT_FILE = "events.json";
const OVERRIDES_FILE = "status-overrides.json";


// ============================================================
// OUTILS
// ============================================================

/**
 * Nettoie une valeur texte.
 */
function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}


/**
 * Nettoie une URL.
 *
 * Accepte :
 *
 * https://exemple.com/image.jpg
 *
 * mais aussi :
 *
 * [https://exemple.com/image.jpg](https://exemple.com/image.jpg)
 *
 * et :
 *
 * [Image](https://exemple.com/image.jpg)
 */
function cleanUrl(value) {

  if (!value) {
    return "";
  }

  const str = String(value).trim();

  if (!str) {
    return "";
  }

  // Format Markdown :
  // [texte](https://...)
  const markdownMatch = str.match(
    /^\[.*?\]\((https?:\/\/[^)\s]+)\)$/
  );

  if (markdownMatch) {
    return markdownMatch[1];
  }

  // Si une URL est présente dans une chaîne plus complexe,
  // on essaie de la récupérer.
  const urlMatch = str.match(
    /(https?:\/\/[^\s)\]]+)/
  );

  if (urlMatch) {
    return urlMatch[1];
  }

  return str;
}


/**
 * Nettoie la description provenant de Google Calendar.
 *
 * Google peut envoyer :
 * - des <br>
 * - du HTML
 * - des retours à la ligne
 * - des espaces insécables
 */
function cleanDescription(rawDescription) {

  if (!rawDescription) {
    return "";
  }

  let cleaned = String(rawDescription);

  // Convertit les <br> en retours à la ligne
  cleaned = cleaned.replace(
    /<br\s*\/?>/gi,
    "\n"
  );

  // Supprime les autres balises HTML
  cleaned = cleaned.replace(
    /<[^>]+>/g,
    ""
  );

  // Remplace les espaces insécables
  cleaned = cleaned.replace(
    /\u00A0/g,
    " "
  );

  // Supprime les caractères invisibles éventuels
  cleaned = cleaned.replace(
    /[\u200B-\u200D\uFEFF]/g,
    ""
  );

  return cleaned.trim();
}


/**
 * Parse le JSON contenu dans la description.
 */
function parseCampaign(rawDescription) {

  const cleaned = cleanDescription(rawDescription);

  if (!cleaned) {
    return null;
  }

  try {

    const data = JSON.parse(cleaned);

    return {

      // Informations principales
      titre: cleanText(data.titre),

      // Images / logos
      image: cleanUrl(data.image),
      logo: cleanUrl(data.logo),

      // Apparence
      logo_fond: cleanText(data.logo_fond),
      fond: cleanUrl(data.fond),

      // Informations commerciales
      tarif: cleanText(data.tarif),
      inscription: cleanText(data.inscription),

      // Statut
      statut: cleanText(data.statut),

      // Lieu
      lieu: cleanText(data.lieu),

      // Affichage du lieu
      //
      // 0 = aucun affichage
      // 1 = ...
      // 2 = ...
      // 3 = ...
      // 4 = ...
      //
      // On conserve la valeur sous forme de chaîne
      // pour rester compatible avec le JSON.
      affichage_lieu:
        data.affichage_lieu !== undefined &&
        data.affichage_lieu !== null
          ? String(data.affichage_lieu)
          : "3"

    };

  } catch (error) {

    console.warn(
      "\n⚠️ Description JSON invalide."
    );

    console.warn(
      "Début de la description :"
    );

    console.warn(
      cleaned.slice(0, 300)
    );

    console.warn(
      "Erreur :",
      error.message
    );

    return null;
  }
}


/**
 * Crée une campagne vide.
 *
 * Utilisé lorsqu'un événement n'a pas de description
 * ou lorsqu'on doit appliquer un override de statut.
 */
function emptyCampaign() {

  return {

    titre: "",
    image: "",
    logo: "",

    logo_fond: "",
    fond: "",

    tarif: "",
    inscription: "",

    statut: "",

    lieu: "",
    affichage_lieu: "3"

  };
}


// ============================================================
// LECTURE DES OVERRIDES
// ============================================================

function loadStatusOverrides() {

  try {

    if (!fs.existsSync(OVERRIDES_FILE)) {

      console.log(
        "ℹ️ Aucun status-overrides.json trouvé."
      );

      return {};
    }

    const content = fs.readFileSync(
      OVERRIDES_FILE,
      "utf8"
    );

    if (!content.trim()) {

      console.log(
        "ℹ️ status-overrides.json est vide."
      );

      return {};
    }

    const overrides = JSON.parse(content);

    console.log(
      "✓ status-overrides.json chargé."
    );

    return overrides;

  } catch (error) {

    console.warn(
      "⚠️ Impossible de lire status-overrides.json :",
      error.message
    );

    return {};
  }
}


// ============================================================
// RÉCUPÉRATION DU CALENDRIER
// ============================================================

async function fetchCalendar() {

  console.log(
    "📅 Lecture du calendrier :"
  );

  console.log(
    CALENDAR_URL
  );

  const response = await axios.get(
    CALENDAR_URL,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AfficheEventAffichageDyn/1.0)"
      },

      timeout: 30000
    }
  );

  return response.data;
}


// ============================================================
// EXTRACTION DES ÉVÉNEMENTS
// ============================================================

function extractEvents(calendarData) {

  const parsed = ical.sync.parseICS(
    calendarData
  );

  const now = new Date();

  const events = [];

  for (const key in parsed) {

    const e = parsed[key];

    // On ne garde que les événements
    if (e.type !== "VEVENT") {
      continue;
    }

    // Pas de date de début = événement inutilisable
    if (!e.start) {
      continue;
    }

    const end =
      e.end ||
      e.start;

    // Événement terminé
    if (end < now) {
      continue;
    }

    const campaign =
      parseCampaign(e.description);

    const event = {

      uid: cleanText(e.uid),

      title: cleanText(e.summary),

      location: cleanText(e.location),

      start: e.start,

      end: end,

      campaign: campaign

    };

    events.push(event);
  }

  // Tri chronologique
  events.sort(
    (a, b) =>
      new Date(a.start) -
      new Date(b.start)
  );

  return events;
}


// ============================================================
// APPLICATION DES OVERRIDES
// ============================================================

function applyStatusOverrides(
  events,
  overrides
) {

  for (const event of events) {

    if (!event.uid) {
      continue;
    }

    const override =
      overrides[event.uid];

    if (
      override &&
      override.statut !== undefined
    ) {

      // Si aucune campagne n'existe,
      // on en crée une vide.
      if (!event.campaign) {
        event.campaign =
          emptyCampaign();
      }

      event.campaign.statut =
        cleanText(
          override.statut
        );

      console.log(
        `✓ Statut forcé pour : ${event.title} → ${event.campaign.statut}`
      );
    }
  }
}


// ============================================================
// GÉNÉRATION DU JSON
// ============================================================

function generateOutput(events) {

  return {

    updated:
      new Date().toLocaleString(
        "fr-FR",
        {
          timeZone:
            "Europe/Paris"
        }
      ),

    events:
      events.slice(
        0,
        MAX_EVENTS
      )

  };
}


// ============================================================
// ÉCRITURE DU FICHIER
// ============================================================

function writeOutput(json) {

  fs.writeFileSync(

    OUTPUT_FILE,

    JSON.stringify(
      json,
      null,
      2
    ),

    "utf8"
  );

  console.log(
    `\n✓ ${json.events.length} événement(s) enregistré(s) dans ${OUTPUT_FILE}.`
  );
}


// ============================================================
// PROGRAMME PRINCIPAL
// ============================================================

async function main() {

  try {

    console.log(
      "\n========================================"
    );

    console.log(
      "   GÉNÉRATION DES ÉVÉNEMENTS"
    );

    console.log(
      "========================================\n"
    );


    // 1. Récupération du calendrier
    const calendarData =
      await fetchCalendar();


    // 2. Extraction
    const events =
      extractEvents(
        calendarData
      );

    console.log(
      `✓ ${events.length} événement(s) trouvé(s).`
    );


    // 3. Overrides
    const overrides =
      loadStatusOverrides();

    applyStatusOverrides(
      events,
      overrides
    );


    // 4. Génération du JSON
    const json =
      generateOutput(
        events
      );


    // 5. Écriture
    writeOutput(
      json
    );


    // Petit résumé utile dans les logs
    console.log(
      "\nÉvénements conservés :"
    );

    json.events.forEach(
      (event, index) => {

        console.log(
          `${index + 1}. ${event.title} — ${new Date(event.start).toLocaleString("fr-FR")}`
        );

        if (event.campaign) {

          console.log(
            `   Campagne : ${event.campaign.titre || "(sans titre)"}`
          );

          console.log(
            `   Lieu : ${event.campaign.lieu || "(aucun)"}`
          );

          console.log(
            `   Affichage lieu : ${event.campaign.affichage_lieu}`
          );
        }

      }
    );


    console.log(
      "\n✓ Terminé."
    );

  } catch (error) {

    console.error(
      "\n❌ ERREUR lors de la génération :"
    );

    console.error(
      error.message
    );

    if (
      error.response
    ) {

      console.error(
        "HTTP :",
        error.response.status
      );

    }

    process.exitCode = 1;
  }
}


// ============================================================
// LANCEMENT
// ============================================================

main();
