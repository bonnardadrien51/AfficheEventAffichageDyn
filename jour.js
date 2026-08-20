const DATA_URL = "events.json";
const OVERRIDES_URL = "status-overrides.json";

// Recharge les données toutes les 60 secondes
const REFRESH_MS = 60 * 1000;

// Vérifie les événements terminés toutes les 10 secondes
const CHECK_EVENTS_MS = 10 * 1000;


const STATUS_COLORS = {
    "annulé": "#c0392b",
    "annule": "#c0392b",
    "complet": "#e08e0b",
    "reporté": "#6c5ce7",
    "reporte": "#6c5ce7"
};


const shortWeekdays = [
    "DIM",
    "LUN",
    "MAR",
    "MER",
    "JEU",
    "VEN",
    "SAM"
];


/*
============================================================
DONNÉES EN MÉMOIRE
============================================================
*/

let allEvents = [];
let overrides = {};


/*
============================================================
OUTILS DE DATE
============================================================
*/

function dateOnly(date) {

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


function isToday(date) {

    const today = dateOnly(new Date());

    return (
        dateOnly(date).getTime()
        ===
        today.getTime()
    );

}


/*
============================================================
VÉRIFIER SI UN ÉVÉNEMENT EST TERMINÉ
============================================================

Un événement est considéré comme terminé lorsque
son heure de FIN est dépassée.
============================================================
*/

function isFinished(event) {

    if (!event.end) {
        return false;
    }

    const end =
        new Date(event.end);

    return end.getTime() <= Date.now();
}


/*
============================================================
FORMATER L'HEURE
============================================================
*/

function formatHour(date) {

    const h =
        date.getHours();

    const m =
        date.getMinutes();

    return m === 0
        ? `${h}h`
        : `${h}h${String(m).padStart(2, "0")}`;
}


/*
============================================================
CRÉATION D'UNE CARTE
============================================================
*/

function renderCard(event) {

    const start =
        new Date(event.start);

    const end =
        new Date(event.end);


    const statut =
        (
            overrides[event.uid] &&
            overrides[event.uid].statut
        )
        ||
        (
            event.campaign &&
            event.campaign.statut
        )
        ||
        "";


    const card =
        document.createElement("div");

    card.className =
        "eventCard";


    /*
    ------------------------------------------------------------
    BADGE DE STATUT
    ------------------------------------------------------------
    */

    const badgeHtml =
        statut
        ?
        `
            <div
                class="statusBadge"
                style="
                    background:
                    ${
                        STATUS_COLORS[
                            statut
                                .trim()
                                .toLowerCase()
                        ]
                        ||
                        "#c0392b"
                    }
                "
            >
                ${statut}
            </div>
        `
        :
        "";


    /*
    ------------------------------------------------------------
    IMAGE
    ------------------------------------------------------------
    */

    const thumbHtml =
        (
            event.campaign &&
            event.campaign.image
        )
        ?
        `
            <div class="thumb">

                <img
                    src="${event.campaign.image}"
                    alt=""
                >

            </div>
        `
        :
        "";


    /*
    ------------------------------------------------------------
    CONTENU DE LA CARTE
    ------------------------------------------------------------
    */

    card.innerHTML = `

        <div class="date">

            <div class="weekday">
                ${shortWeekdays[start.getDay()]}
            </div>

            <div class="day">
                ${start.getDate()}
            </div>

        </div>


        ${thumbHtml}


        <div class="infoBlock">

            <div class="textCol">

                <div class="title">
                    ${event.title}
                </div>


                <div class="meta">

                    <svg
                        viewBox="0 0 24 24"
                        class="icon"
                    >

                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                            fill="none"
                            stroke="#3a4160"
                            stroke-width="2"
                        />

                        <path
                            d="M12 7v5l3.5 2"
                            fill="none"
                            stroke="#3a4160"
                            stroke-width="2"
                            stroke-linecap="round"
                        />

                    </svg>


                    <span>
                        ${formatHour(start)}
                        –
                        ${formatHour(end)}
                    </span>


                    ${
                        event.location
                        ?
                        `

                            <svg
                                viewBox="0 0 24 24"
                                class="icon"
                            >

                                <path
                                    d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z"
                                    fill="#e6392b"
                                />

                                <circle
                                    cx="12"
                                    cy="10"
                                    r="3"
                                    fill="white"
                                />

                            </svg>

                            <span>
                                ${event.location}
                            </span>

                        `
                        :
                        ""
                    }

                </div>

            </div>


            ${badgeHtml}

        </div>

    `;


    return card;
}


/*
============================================================
RÉCUPÉRER LES ÉVÉNEMENTS À AFFICHER
============================================================

1. Aujourd'hui
2. Non terminés
3. Triés par heure de début
============================================================
*/

function getTodayEvents() {

    return allEvents

        .filter(
            event =>
                event.start &&
                isToday(
                    new Date(event.start)
                )
        )

        .filter(
            event =>
                !isFinished(event)
        )

        .sort(
            (a, b) =>
                new Date(a.start) -
                new Date(b.start)
        );
}


/*
============================================================
AFFICHER LES ÉVÉNEMENTS
============================================================
*/

function renderEvents() {

    const grid =
        document.getElementById(
            "eventGrid"
        );


    const todayEvents =
        getTodayEvents();


    /*
    ------------------------------------------------------------
    DATE
    ------------------------------------------------------------
    */

    document.getElementById(
        "pageDate"
    ).textContent =
        new Date().toLocaleDateString(
            "fr-FR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );


    /*
    ------------------------------------------------------------
    AUCUN ÉVÉNEMENT
    ------------------------------------------------------------
    */

    if (!todayEvents.length) {

        grid.innerHTML = "";

        document.body.classList.add(
            "empty"
        );

        return;
    }


    document.body.classList.remove(
        "empty"
    );


    /*
    ------------------------------------------------------------
    AFFICHER TOUS LES ÉVÉNEMENTS
    ------------------------------------------------------------
    
    IMPORTANT :
    Il n'y a volontairement PAS de .slice(0, 6).

    pagination.js s'occupe de limiter l'affichage
    à 6 événements par page.
    ------------------------------------------------------------
    */

    grid.innerHTML = "";


    todayEvents.forEach(
        event => {

            grid.appendChild(
                renderCard(event)
            );

        }
    );
}


/*
============================================================
CHARGER EVENTS.JSON
============================================================
*/

async function loadEvents() {

    try {

        const res =
            await fetch(
                DATA_URL +
                "?t=" +
                Date.now()
            );


        if (!res.ok) {

            throw new Error(
                "Impossible de charger events.json"
            );
        }


        const json =
            await res.json();


        allEvents =
            json.events || [];


        /*
        --------------------------------------------------------
        CHARGER LES OVERRIDES
        --------------------------------------------------------
        */

        try {

            const overrideRes =
                await fetch(
                    OVERRIDES_URL +
                    "?t=" +
                    Date.now()
                );


            if (overrideRes.ok) {

                overrides =
                    await overrideRes.json();

            }
            else {

                overrides = {};

            }

        }
        catch (error) {

            overrides = {};

        }


        /*
        --------------------------------------------------------
        AFFICHAGE
        --------------------------------------------------------
        */

        renderEvents();

    }
    catch (error) {

        console.error(
            "Erreur de chargement :",
            error
        );

    }
}


/*
============================================================
VÉRIFICATION DES ÉVÉNEMENTS TERMINÉS
============================================================

Cette fonction ne recharge PAS events.json.

Elle vérifie simplement si un événement vient
de se terminer.

Cela permet de le retirer rapidement.
============================================================
*/

function checkFinishedEvents() {

    const grid =
        document.getElementById(
            "eventGrid"
        );


    if (!grid) {
        return;
    }


    const visibleEvents =
        getTodayEvents();


    /*
    ------------------------------------------------------------
    Si le nombre d'événements actuellement affichés
    est différent du nombre d'événements calculé,
    on reconstruit la grille.
    ------------------------------------------------------------
    */

    const currentCards =
        grid.querySelectorAll(
            ".eventCard"
        ).length;


    if (
        currentCards !==
        visibleEvents.length
    ) {

        renderEvents();

    }
}


/*
============================================================
CHARGEMENT INITIAL
============================================================
*/

loadEvents();


/*
============================================================
RECHARGEMENT DES DONNÉES
============================================================
*/

setInterval(
    loadEvents,
    REFRESH_MS
);


/*
============================================================
VÉRIFICATION DES ÉVÉNEMENTS TERMINÉS
============================================================
*/

setInterval(
    checkFinishedEvents,
    CHECK_EVENTS_MS
);
