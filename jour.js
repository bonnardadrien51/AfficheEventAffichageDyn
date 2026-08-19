const DATA_URL = "events.json";
const OVERRIDES_URL = "status-overrides.json";

const REFRESH_MS = 60 * 1000;


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


function dateOnly(date) {

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

}


function isToday(date) {

    const today =
        dateOnly(new Date());

    return (
        dateOnly(date).getTime()
        ===
        today.getTime()
    );

}


function formatHour(date) {

    const h =
        date.getHours();

    const m =
        date.getMinutes();

    return m === 0
        ? `${h}h`
        : `${h}h${String(m).padStart(2, "0")}`;

}


function renderCard(event, overrides) {

    const start =
        new Date(event.start);

    const end =
        new Date(event.end);


    const statut =
        (
            overrides[event.uid]
            &&
            overrides[event.uid].statut
        )
        ||
        (
            event.campaign
            &&
            event.campaign.statut
        )
        ||
        "";


    const card =
        document.createElement("div");

    card.className =
        "eventCard";


    const badgeHtml =
        statut
        ? `
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
        : "";


    const thumbHtml =
        (
            event.campaign
            &&
            event.campaign.image
        )
        ? `
            <div class="thumb">

                <img
                    src="${event.campaign.image}"
                    alt=""
                >

            </div>
        `
        : "";


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


async function loadEvents() {

    const grid =
        document.getElementById(
            "eventGrid"
        );

    let events = [];

    let overrides = {};


    /*
    ============================================================
    CHARGEMENT DES ÉVÉNEMENTS
    ============================================================
    */

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


        events =
            json.events || [];


    }
    catch (error) {

        console.error(
            "Erreur events.json :",
            error
        );

        return;

    }


    /*
    ============================================================
    CHARGEMENT DES STATUTS
    ============================================================
    */

    try {

        const res =
            await fetch(
                OVERRIDES_URL +
                "?t=" +
                Date.now()
            );


        if (res.ok) {

            overrides =
                await res.json();

        }

    }
    catch (error) {

        /*
        Le fichier peut être absent.
        Ce n'est pas bloquant.
        */

        overrides = {};

    }


    /*
    ============================================================
    ÉVÉNEMENTS D'AUJOURD'HUI
    ============================================================
    */

    const todayEvents =
        events.filter(
            event =>
                isToday(
                    new Date(event.start)
                )
        );


    /*
    ============================================================
    DATE
    ============================================================
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
                year: "numeric",
                timeZone: "Europe/Paris"
            }
        );


    /*
    ============================================================
    AUCUN ÉVÉNEMENT
    ============================================================
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
    ============================================================
    AFFICHAGE DE TOUS LES ÉVÉNEMENTS
    ============================================================
    */

    grid.innerHTML = "";


    todayEvents.forEach(
        event => {

            grid.appendChild(
                renderCard(
                    event,
                    overrides
                )
            );

        }
    );

}


loadEvents();


setInterval(
    loadEvents,
    REFRESH_MS
);
