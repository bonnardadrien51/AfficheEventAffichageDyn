const axios = require("axios");
const ical = require("node-ical");
const fs = require("fs");

const CALENDAR_URL =
  "https://calendar.google.com/calendar/ical/cb4a8bd6e4b215de55e3e17b61675676754397faeb48a066ba961be93aaeec4b%40group.calendar.google.com/public/basic.ics";

// Nombre max d'événements conservés dans le fichier, par sécurité
// (le site n'affiche que le premier, mais on garde une petite marge).
const MAX_EVENTS = 50;

// Essaie de lire la description d'un événement comme un bloc JSON
// (titre de campagne / image / logo). Tolère les descriptions vides,
// non-JSON, ou avec du HTML basique collé par Google Calendar.
function parseCampaign(rawDescription) {

  if (!rawDescription) {
    return null;
  }

  const cleaned = rawDescription
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  if (!cleaned) {
    return null;
  }

  try {

    const data = JSON.parse(cleaned);

    return {
      titre: data.titre || "",
      image: data.image || "",
      logo: data.logo || "",
      logo_fond: data.logo_fond || "",
      fond: data.fond || "",
      tarif: data.tarif || "",
      inscription: data.inscription || "",
      statut: data.statut || ""
    };

  } catch (err) {

    console.warn(
      "Description non-JSON ignorée pour un événement :",
      cleaned.slice(0, 80)
    );

    return null;

  }

}

async function main() {

  console.log("Lecture :", CALENDAR_URL);

  const response = await axios.get(CALENDAR_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const parsed = ical.sync.parseICS(response.data);

  const now = new Date();

  const events = [];

  for (const key in parsed) {

    const e = parsed[key];

    if (e.type !== "VEVENT")
      continue;

    if (!e.start)
      continue;

    const end = e.end || e.start;

    // On garde les événements en cours (pas encore terminés) ou à venir.
    if (end < now)
      continue;

    events.push({

      uid: e.uid || "",

      title: e.summary || "",

      location: e.location || "",

      start: e.start,

      end: end,

      campaign: parseCampaign(e.description)

    });

  }

  events.sort((a, b) => a.start - b.start);

  // Fusionne les statuts modifiés depuis la page admin (status-overrides.json),
  // pour qu'ils ne soient jamais écrasés par la régénération automatique.
  let overrides = {};

  try {
    overrides = JSON.parse(
      fs.readFileSync("status-overrides.json", "utf8")
    );
  } catch (err) {
    console.log("Aucun status-overrides.json existant ou illisible : on continue sans.");
  }

  for (const event of events) {

    const override = overrides[event.uid];

    if (override && override.statut !== undefined) {

      event.campaign = event.campaign || {
        titre: "", image: "", logo: "", logo_fond: "",
        fond: "", tarif: "", inscription: "", statut: ""
      };

      event.campaign.statut = override.statut;

    }

  }

  const json = {

    updated: new Date().toLocaleString("fr-FR", {
      timeZone: "Europe/Paris"
    }),

    events: events.slice(0, MAX_EVENTS)

  };

  fs.writeFileSync(
    "events.json",
    JSON.stringify(json, null, 2),
    "utf8"
  );

  console.log(json.events.length + " événement(s) enregistré(s) dans events.json.");

}

main();
