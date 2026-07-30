const DATA_URL = "events.json";

// Réinterroge events.json à cet intervalle (le fichier lui-même n'est
// régénéré côté serveur que toutes les 30 min, mais on vérifie plus
// souvent pour ne rien rater si l'écran reste allumé en continu).
const REFRESH_DATA_MS = 5 * 60 * 1000;

// Recalcule le compte à rebours à cet intervalle, sans refaire d'appel réseau.
const REFRESH_COUNTDOWN_MS = 30 * 1000;

let currentEvent = null;


function formatHour(date){

    const h = date.getHours();
    const m = date.getMinutes();

    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2,"0")}`;

}

function formatDate(date){

    return date.toLocaleDateString("fr-FR", {
        day:"2-digit",
        month:"2-digit",
        year:"numeric",
        timeZone:"Europe/Paris"
    });

}

function momentOfDay(hour){

    if(hour < 12) return "matin";
    if(hour < 18) return "après-midi";
    return "soir";

}

function dateOnly(d){

    return new Date(d.getFullYear(), d.getMonth(), d.getDate());

}

function computeCountdown(event){

    const now = new Date();
    const start = new Date(event.start);
    const end = new Date(event.end);

    if(now >= start && now <= end){
        return "En cours";
    }

    const diffMs = start - now;

    if(diffMs <= 0){
        return null; // événement terminé, ne devrait plus être affiché
    }

    // Différence en jours calendaires (et non en durée brute /24h),
    // pour que "demain soir" reste "demain" même si on est encore
    // aujourd'hui à moins de 24h de l'événement.
    const dayDiff = Math.round(
        (dateOnly(start) - dateOnly(now)) / 86400000
    );

    if(dayDiff > 1){

        const days = Math.floor(diffMs / 86400000);

        const hours = Math.floor((diffMs % 86400000) / 3600000);

        return `Dans ${days} jours et ${hours} heures`;

    }

    if(dayDiff === 1){

        return `Demain ${momentOfDay(start.getHours())}`;

    }

    // dayDiff === 0 : plus tard aujourd'hui
    const hoursLeft = Math.max(1, Math.round(diffMs / 3600000));

    return `Dans ${hoursLeft} heure${hoursLeft > 1 ? "s" : ""}`;

}

const STATUS_COLORS = {
    "annulé": "#c0392b",
    "annule": "#c0392b",
    "complet": "#e08e0b",
    "reporté": "#6c5ce7",
    "reporte": "#6c5ce7"
};

function renderEvent(event){

    currentEvent = event;

    document.body.classList.remove("empty");

    const start = new Date(event.start);
    const end = new Date(event.end);

    const campaign = event.campaign || {};

    document.getElementById("campaignTitle").textContent =
        campaign.titre || event.title;

    document.getElementById("campaignDate").textContent =
        `${formatDate(start)} – ${formatHour(start)}`;

    document.getElementById("eventTitle").textContent =
        event.title;

    document.getElementById("eventHours").textContent =
        `${formatHour(start)} – ${formatHour(end)}`;

    const locationEl = document.getElementById("eventLocation");
    if(event.location){
        locationEl.textContent = event.location;
        locationEl.closest(".infoLine").classList.remove("hidden");
    } else {
        locationEl.closest(".infoLine").classList.add("hidden");
    }

    const photoBox = document.getElementById("photoBox");
    const campaignImage = document.getElementById("campaignImage");
    if(campaign.image){
        campaignImage.src = campaign.image;
        photoBox.classList.remove("hidden");
    } else {
        photoBox.classList.add("hidden");
    }

    const campaignLogoBox = document.getElementById("campaignLogoBox");
    const campaignLogo = document.getElementById("campaignLogo");
    if(campaign.logo){
        campaignLogo.src = campaign.logo;
        campaignLogoBox.classList.remove("hidden");
        // Couleur de fond du logo : celle fournie, sinon transparent.
        campaignLogoBox.style.background = campaign.logo_fond || "transparent";
    } else {
        campaignLogoBox.classList.add("hidden");
    }

    // Photo de fond de l'écran : si fournie, on l'applique avec un voile
    // sombre pour garder le texte lisible ; sinon on garde le fond uni.
    const screen = document.getElementById("screen");
    const bgOverlay = document.getElementById("bgOverlay");
    if(campaign.fond){
        screen.style.backgroundImage = `url("${campaign.fond}")`;
        bgOverlay.style.display = "block";
    } else {
        screen.style.backgroundImage = "";
        bgOverlay.style.display = "none";
    }

    const tarifEl = document.getElementById("eventTarif");
    if(campaign.tarif){
        tarifEl.textContent = campaign.tarif;
        tarifEl.closest(".infoLine").classList.remove("hidden");
    } else {
        tarifEl.closest(".infoLine").classList.add("hidden");
    }

    const inscriptionEl = document.getElementById("eventInscription");
    if(campaign.inscription){
        inscriptionEl.textContent = campaign.inscription;
        inscriptionEl.closest(".infoLine").classList.remove("hidden");
    } else {
        inscriptionEl.closest(".infoLine").classList.add("hidden");
    }

    const statusRibbon = document.getElementById("statusRibbon");
    const statusText = document.getElementById("statusText");
    if(campaign.statut){
        const key = campaign.statut.trim().toLowerCase();
        statusText.textContent = campaign.statut;
        statusRibbon.style.background = STATUS_COLORS[key] || "#c0392b";
        statusRibbon.style.display = "block";
    } else {
        statusRibbon.style.display = "none";
    }

    updateCountdown();

}

function renderEmpty(){

    currentEvent = null;

    document.body.classList.add("empty");

}

function updateCountdown(){

    if(!currentEvent){
        return;
    }

    const text = computeCountdown(currentEvent);

    if(text === null){
        // L'événement affiché est maintenant terminé : on recharge
        // les données pour passer au suivant.
        loadEvents();
        return;
    }

    document.getElementById("countdownText").textContent = text;

}

async function loadEvents(){

    try{

        const response = await fetch(DATA_URL + "?t=" + Date.now());
        const json = await response.json();

        if(json.events && json.events.length){
            renderEvent(json.events[0]);
        } else {
            renderEmpty();
        }

    } catch(err){

        console.error("Erreur de chargement de events.json :", err);

    }

}

loadEvents();

setInterval(loadEvents, REFRESH_DATA_MS);
setInterval(updateCountdown, REFRESH_COUNTDOWN_MS);