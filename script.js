```js
// Le design est fait pour 1920x1080 ; on calcule le facteur d'échelle
// pour que ça tienne dans n'importe quelle fenêtre (plein écran ou non),
// sans jamais déformer les proportions ni faire chevaucher le contenu.
function applyScale(){

    const screen = document.getElementById("screen");

    if(!screen) return;

    const scale = Math.min(
        window.innerWidth / 1920,
        window.innerHeight / 1080
    );

    screen.style.transform = `scale(${scale})`;

}

window.addEventListener("resize", applyScale);
applyScale();


const DATA_URL = "events.json";
const OVERRIDES_URL = "status-overrides.json";

// Réinterroge events.json + status-overrides.json à cet intervalle.
// events.json n'est régénéré côté serveur que toutes les 30 min, mais
// status-overrides.json (modifié depuis la page admin) doit remonter
// vite ; comme les deux fichiers sont petits, on vérifie souvent.
const REFRESH_DATA_MS = 60 * 1000;

// Recalcule le compte à rebours à cet intervalle, sans refaire d'appel réseau.
const REFRESH_COUNTDOWN_MS = 30 * 1000;

let currentEvent = null;


// ============================================================
// FORMATAGE
// ============================================================

function formatHour(date){

    const h = date.getHours();
    const m = date.getMinutes();

    return m === 0
        ? `${h}h`
        : `${h}h${String(m).padStart(2,"0")}`;

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

    return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
    );

}


// ============================================================
// COMPTE À REBOURS
// ============================================================

function computeCountdown(event){

    const now = new Date();
    const start = new Date(event.start);
    const end = new Date(event.end);

    if(now >= start && now <= end){

        return "En cours";

    }

    const diffMs = start - now;

    if(diffMs <= 0){

        return null;

    }

    // Différence en jours calendaires (et non en durée brute /24h),
    // pour que "demain soir" reste "demain" même si on est encore
    // aujourd'hui à moins de 24h de l'événement.
    const dayDiff = Math.round(
        (dateOnly(start) - dateOnly(now)) / 86400000
    );

    if(dayDiff > 1){

        const days =
            Math.floor(diffMs / 86400000);

        const hours =
            Math.floor(
                (diffMs % 86400000) / 3600000
            );

        return `Dans ${days} jours et ${hours} heures`;

    }

    if(dayDiff === 1){

        return `Demain ${momentOfDay(start.getHours())}`;

    }

    // dayDiff === 0 : plus tard aujourd'hui
    const hoursLeft =
        Math.max(
            1,
            Math.round(diffMs / 3600000)
        );

    return `Dans ${hoursLeft} heure${hoursLeft > 1 ? "s" : ""}`;

}


// ============================================================
// GESTION DU LIEU
// ============================================================

// Supprime le dernier segment d'une adresse si c'est un nom de pays
// (typiquement ", France" ajouté automatiquement par Google Calendar).
// Heuristique : on retire la dernière partie après la dernière virgule
// si elle ne contient pas de chiffre (donc pas un code postal ni un n°).
function stripCountry(location){

    if(!location) return "";

    const parts =
        location
            .split(",")
            .map(s => s.trim());

    if(parts.length > 1){

        const last =
            parts[parts.length - 1];

        // Un code postal ou un numéro de rue contient des chiffres → on garde.
        if(!/\d/.test(last)){

            parts.pop();

        }

    }

    return parts.join(", ");

}


// Résout le texte à afficher pour le lieu selon le mode :
// 0 → rien
// 1 → lieu de l'événement Google Calendar (sans pays)
// 2 → lieu du JSON campaign
// 3 → lieu événement, puis JSON si l'événement est vide
// 4 → lieu JSON, puis événement si le JSON est vide
function resolveLocation(
    eventLocation,
    campaignLieu,
    mode
){

    const ev =
        stripCountry(
            eventLocation || ""
        );

    const js =
        (campaignLieu || "").trim();

    const modeNum =
        parseInt(mode, 10);

    switch(modeNum){

        case 0:
            return "";

        case 1:
            return ev;

        case 2:
            return js;

        case 3:
            return ev || js;

        case 4:
            return js || ev;

        default:
            return ev || js;

    }

}


// ============================================================
// STATUTS
// ============================================================

const STATUS_COLORS = {

    "annulé": "#c0392b",
    "annule": "#c0392b",
    "complet": "#e08e0b",
    "reporté": "#6c5ce7",
    "reporte": "#6c5ce7"

};


// ============================================================
// QR CODE / INSCRIPTION
// ============================================================

function renderRegistrationQr(campaign){

    const registrationBox =
        document.getElementById(
            "registrationBox"
        );

    const registrationQr =
        document.getElementById(
            "registrationQr"
        );

    const registrationLink =
        document.getElementById(
            "registrationLink"
        );

    const registrationQrText =
        document.getElementById(
            "registrationQrText"
        );


    // Si les éléments QR ne sont pas présents dans evenement.html,
    // on ne fait rien.
    if(
        !registrationBox ||
        !registrationQr
    ){

        return;

    }


    // Nettoyage du QR précédent
    registrationQr.innerHTML = "";


    const url =
        campaign &&
        campaign.lien_inscription
            ? String(
                campaign.lien_inscription
            ).trim()
            : "";


    // ========================================================
    // AUCUN LIEN
    // ========================================================

    if(!url){

        registrationBox.classList.add(
            "hidden"
        );

        if(registrationLink){

            registrationLink.removeAttribute(
                "href"
            );

        }

        return;

    }


    // ========================================================
    // LIEN CLIQUABLE
    // ========================================================

    if(registrationLink){

        registrationLink.href = url;

        registrationLink.target = "_blank";

        registrationLink.rel =
            "noopener noreferrer";

    }


    // ========================================================
    // VÉRIFICATION DE LA BIBLIOTHÈQUE
    // ========================================================

    if(
        typeof QRCode === "undefined"
    ){

        console.error(
            "QRCode n'est pas chargé. Vérifie que qrcode.min.js est chargé avant script.js."
        );

        registrationBox.classList.add(
            "hidden"
        );

        return;

    }


    // ========================================================
    // GÉNÉRATION DU QR CODE
    // ========================================================

    try{

        new QRCode(
            registrationQr,
            {
                text: url,

                width: 220,

                height: 220,

                colorDark: "#000000",

                colorLight: "#ffffff",

                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );


        if(registrationQrText){

            registrationQrText.textContent =
                "Scannez pour vous inscrire";

        }


        registrationBox.classList.remove(
            "hidden"
        );


    } catch(error){

        console.error(
            "Erreur lors de la génération du QR code :",
            error
        );

        registrationBox.classList.add(
            "hidden"
        );

    }

}


// ============================================================
// AFFICHAGE D'UN ÉVÉNEMENT
// ============================================================

function renderEvent(event){

    currentEvent = event;

    document.body.classList.remove("empty");

    const start =
        new Date(event.start);

    const end =
        new Date(event.end);

    const campaign =
        event.campaign || {};


    // ========================================================
    // TITRE DE LA CAMPAGNE
    // ========================================================

    document.getElementById(
        "campaignTitle"
    ).textContent =
        campaign.titre ||
        event.title;


    // ========================================================
    // DATE
    // ========================================================

    document.getElementById(
        "campaignDate"
    ).textContent =
        `${formatDate(start)} – ${formatHour(start)}`;


    // ========================================================
    // TITRE DE L'ÉVÉNEMENT
    // ========================================================

    document.getElementById(
        "eventTitle"
    ).textContent =
        event.title;


    // ========================================================
    // HORAIRES
    // ========================================================

    document.getElementById(
        "eventHours"
    ).textContent =
        `${formatHour(start)} – ${formatHour(end)}`;


    // ========================================================
    // LIEU
    // ========================================================

    const locationEl =
        document.getElementById(
            "eventLocation"
        );

    const locationText =
        resolveLocation(
            event.location,
            campaign.lieu,
            campaign.affichage_lieu !== undefined
                ? campaign.affichage_lieu
                : 3
        );


    if(locationText){

        locationEl.textContent =
            locationText;

        locationEl
            .closest(".infoLine")
            .classList.remove("hidden");

    } else {

        locationEl
            .closest(".infoLine")
            .classList.add("hidden");

    }


    // ========================================================
    // IMAGE
    // ========================================================

    const photoBox =
        document.getElementById(
            "photoBox"
        );

    const campaignImage =
        document.getElementById(
            "campaignImage"
        );


    if(campaign.image){

        campaignImage.src =
            campaign.image;

        photoBox.classList.remove(
            "hidden"
        );

    } else {

        photoBox.classList.add(
            "hidden"
        );

    }


    // ========================================================
    // LOGO
    // ========================================================

    const campaignLogoBox =
        document.getElementById(
            "campaignLogoBox"
        );

    const campaignLogo =
        document.getElementById(
            "campaignLogo"
        );


    if(campaign.logo){

        campaignLogo.src =
            campaign.logo;

        campaignLogoBox.classList.remove(
            "hidden"
        );

        // Couleur de fond du logo :
        // celle fournie, sinon transparent.
        campaignLogoBox.style.background =
            campaign.logo_fond ||
            "transparent";

    } else {

        campaignLogoBox.classList.add(
            "hidden"
        );

    }


    // ========================================================
    // FOND
    // ========================================================

    const screen =
        document.getElementById(
            "screen"
        );

    const bgOverlay =
        document.getElementById(
            "bgOverlay"
        );


    // Photo de fond de l'écran : si fournie,
    // on l'applique avec un voile sombre pour garder
    // le texte lisible ; sinon on garde le fond uni.

    if(campaign.fond){

        screen.style.backgroundImage =
            `url("${campaign.fond}")`;

        bgOverlay.style.display =
            "block";

    } else {

        screen.style.backgroundImage =
            "";

        bgOverlay.style.display =
            "none";

    }


    // ========================================================
    // TARIF
    // ========================================================

    const tarifEl =
        document.getElementById(
            "eventTarif"
        );


    if(campaign.tarif){

        tarifEl.textContent =
            campaign.tarif;

        tarifEl
            .closest(".infoLine")
            .classList.remove("hidden");

    } else {

        tarifEl
            .closest(".infoLine")
            .classList.add("hidden");

    }


    // ========================================================
    // INSCRIPTION — TEXTE LIBRE
    // ========================================================

    const inscriptionEl =
        document.getElementById(
            "eventInscription"
        );


    if(campaign.inscription){

        inscriptionEl.textContent =
            campaign.inscription;

        inscriptionEl
            .closest(".infoLine")
            .classList.remove("hidden");

    } else {

        inscriptionEl
            .closest(".infoLine")
            .classList.add("hidden");

    }


    // ========================================================
    // QR CODE + LIEN CLIQUABLE
    // ========================================================

    renderRegistrationQr(
        campaign
    );


    // ========================================================
    // STATUT
    // ========================================================

    const statusRibbon =
        document.getElementById(
            "statusRibbon"
        );

    const statusText =
        document.getElementById(
            "statusText"
        );


    if(campaign.statut){

        const key =
            campaign.statut
                .trim()
                .toLowerCase();

        statusText.textContent =
            campaign.statut;

        statusRibbon.style.background =
            STATUS_COLORS[key] ||
            "#c0392b";

        statusRibbon.style.display =
            "block";

    } else {

        statusRibbon.style.display =
            "none";

    }


    // ========================================================
    // AJUSTEMENT AUTOMATIQUE
    // ========================================================

    // Après avoir tout rempli (donc une fois la vraie hauteur
    // du texte connue, y compris le bandeau de statut qui vient
    // d'apparaître ou non), on vérifie que ça tient dans l'espace
    // disponible.

    requestAnimationFrame(
        fitContent
    );

}


// ============================================================
// REDIMENSIONNEMENT DU CONTENU
// ============================================================

// Réduit #content dans son ensemble (titre, compte à rebours,
// photo, infos...) si son contenu naturel dépasse l'espace
// disponible au-dessus du bandeau de statut, pour qu'aucun
// texte ne soit jamais coupé/masqué, quelle que soit la longueur
// du titre ou des autres champs.

function fitContent(){

    const content =
        document.getElementById(
            "content"
        );

    const screen =
        document.getElementById(
            "screen"
        );

    const bottomZone =
        document.getElementById(
            "bottomZone"
        );


    if(!content || !screen) return;


    // On repart d'une échelle neutre avant de mesurer,
    // sinon une réduction précédente fausserait la mesure
    // du contenu naturel.

    content.style.transform =
        "scale(1)";


    const bottomZoneHeight =
        bottomZone
            ? bottomZone.offsetHeight
            : 0;


    const available =
        (screen.clientHeight -
            bottomZoneHeight) *
        0.97;


    const natural =
        content.scrollHeight;


    if(
        natural > available &&
        natural > 0
    ){

        const scale =
            Math.max(
                0.5,
                available / natural
            );

        content.style.transform =
            `scale(${scale})`;

    }

}


// ============================================================
// ÉCRAN VIDE
// ============================================================

function renderEmpty(){

    currentEvent = null;

    document.body.classList.add(
        "empty"
    );

}


// ============================================================
// COMPTE À REBOURS
// ============================================================

function updateCountdown(){

    if(!currentEvent){

        return;

    }


    const text =
        computeCountdown(
            currentEvent
        );


    if(text === null){

        // L'événement affiché est maintenant terminé :
        // on recharge les données pour passer au suivant.

        loadEvents();

        return;

    }


    document.getElementById(
        "countdownText"
    ).textContent =
        text;

}


// ============================================================
// CHARGEMENT DES ÉVÉNEMENTS
// ============================================================

async function loadEvents(){

    try{

        const response =
            await fetch(
                DATA_URL +
                "?t=" +
                Date.now()
            );


        const json =
            await response.json();


        let overrides = {};


        try{

            const overridesRes =
                await fetch(
                    OVERRIDES_URL +
                    "?t=" +
                    Date.now()
                );

            overrides =
                await overridesRes.json();

        } catch(err){

            // Pas grave si absent :
            // on reste sur le statut de events.json.

        }


        if(
            json.events &&
            json.events.length
        ){

            const event =
                json.events[0];


            const override =
                overrides[event.uid];


            if(
                override &&
                override.statut !== undefined
            ){

                event.campaign =
                    event.campaign || {};

                event.campaign.statut =
                    override.statut;

            }


            renderEvent(
                event
            );

        } else {

            renderEmpty();

        }


    } catch(err){

        console.error(
            "Erreur de chargement de events.json :",
            err
        );

    }

}


// ============================================================
// LANCEMENT
// ============================================================

loadEvents();

setInterval(
    loadEvents,
    REFRESH_DATA_MS
);

setInterval(
    updateCountdown,
    REFRESH_COUNTDOWN_MS
);
```
