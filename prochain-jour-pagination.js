(() => {

    /*
    ============================================================
    CONFIGURATION
    ============================================================
    */

    // Nombre maximum d'événements affichés simultanément
    const EVENTS_PER_PAGE = 6;

    // Temps entre deux pages
    // 10 secondes
    const PAGE_DURATION = 10000;

    // Durée de l'animation
    const FADE_DURATION = 500;


    /*
    ============================================================
    VARIABLES
    ============================================================
    */

    let currentPage = 0;

    let totalPages = 1;

    let pageTimer = null;

    let refreshTimer = null;

    let isAnimating = false;


    /*
    ============================================================
    RÉCUPÉRATION DES ÉLÉMENTS
    ============================================================
    */

    const grid = document.getElementById("eventGrid");

    const indicator = document.getElementById("pageIndicator");


    /*
    ============================================================
    VÉRIFICATION
    ============================================================
    */

    if (!grid) {

        console.error(
            "Erreur : #eventGrid est introuvable."
        );

        return;
    }


    /*
    ============================================================
    CALCUL DU NOMBRE DE PAGES
    ============================================================
    */

    function calculatePages() {

        const events = getEvents();

        totalPages = Math.ceil(
            events.length / EVENTS_PER_PAGE
        );

        if (totalPages < 1) {

            totalPages = 1;

        }

        /*
        Si le nombre de pages a diminué,
        on revient automatiquement à la première page.
        */

        if (currentPage >= totalPages) {

            currentPage = 0;

        }

    }


    /*
    ============================================================
    RÉCUPÉRATION DES ÉVÉNEMENTS
    ============================================================
    */

    function getEvents() {

        /*
        On récupère directement les enfants de #eventGrid.

        Cela permet de rester compatible avec ton
        prochain-jour.js actuel, quelle que soit la façon
        dont il crée les événements.
        */

        return Array.from(
            grid.children
        ).filter(element => {

            /*
            On ignore éventuellement les messages vides.
            */

            return !element.classList.contains("empty");

        });

    }


    /*
    ============================================================
    AFFICHAGE D'UNE PAGE
    ============================================================
    */

    function displayPage(pageNumber, animate = true) {

        const events = getEvents();

        calculatePages();


        /*
        Aucun événement
        */

        if (events.length === 0) {

            currentPage = 0;

            updateIndicator();

            return;

        }


        /*
        Sécurité
        */

        if (pageNumber < 0) {

            pageNumber = 0;

        }

        if (pageNumber >= totalPages) {

            pageNumber = 0;

        }


        currentPage = pageNumber;


        /*
        Calcul des événements visibles
        */

        const start =
            currentPage * EVENTS_PER_PAGE;

        const end =
            start + EVENTS_PER_PAGE;


        /*
        On masque tous les événements.
        */

        events.forEach(event => {

            event.style.display = "none";

        });


        /*
        On affiche uniquement les 6 événements
        correspondant à la page.
        */

        const pageEvents =
            events.slice(start, end);


        pageEvents.forEach(event => {

            event.style.display = "";

        });


        /*
        Animation
        */

        if (animate) {

            animateGrid();

        }


        /*
        Mise à jour du compteur
        */

        updateIndicator();

    }


    /*
    ============================================================
    ANIMATION
    ============================================================
    */

    function animateGrid() {

        if (isAnimating) {

            return;

        }


        isAnimating = true;


        grid.classList.remove(
            "pagination-visible"
        );


        grid.classList.add(
            "pagination-hidden"
        );


        setTimeout(() => {

            grid.classList.remove(
                "pagination-hidden"
            );

            grid.classList.add(
                "pagination-visible"
            );

        }, FADE_DURATION);


        setTimeout(() => {

            isAnimating = false;

        }, FADE_DURATION);

    }


    /*
    ============================================================
    INDICATEUR
    ============================================================
    */

    function updateIndicator() {

        if (!indicator) {

            return;

        }


        /*
        Pas d'indicateur lorsqu'il n'y a
        qu'une seule page.
        */

        if (totalPages <= 1) {

            indicator.textContent = "";

            return;

        }


        indicator.textContent =
            `${currentPage + 1} / ${totalPages}`;

    }


    /*
    ============================================================
    PAGE SUIVANTE
    ============================================================
    */

    function nextPage() {

        calculatePages();


        /*
        Pas besoin de changer de page
        s'il n'y en a qu'une.
        */

        if (totalPages <= 1) {

            return;

        }


        const next =
            (currentPage + 1) % totalPages;


        displayPage(
            next,
            true
        );

    }


    /*
    ============================================================
    DÉMARRAGE DU TIMER
    ============================================================
    */

    function startTimer() {

        /*
        On arrête un éventuel ancien timer.
        */

        if (pageTimer) {

            clearInterval(pageTimer);

        }


        /*
        Toutes les 10 secondes.
        */

        pageTimer = setInterval(
            nextPage,
            PAGE_DURATION
        );

    }


    /*
    ============================================================
    OBSERVATION DES CHANGEMENTS
    ============================================================
    */

    const observer =
        new MutationObserver(() => {

            /*
            Le prochain-jour.js peut ajouter,
            supprimer ou modifier des événements.

            On attend un tout petit peu afin de laisser
            le temps au DOM de terminer sa mise à jour.
            */

            clearTimeout(refreshTimer);


            refreshTimer =
                setTimeout(() => {

                    const events =
                        getEvents();


                    /*
                    Recalcul du nombre de pages.
                    */

                    calculatePages();


                    /*
                    S'il n'y a aucun événement,
                    on ne fait rien.
                    */

                    if (events.length === 0) {

                        return;

                    }


                    /*
                    On réaffiche la page actuelle.
                    */

                    displayPage(
                        currentPage,
                        false
                    );


                    /*
                    Redémarrage du compteur.
                    */

                    startTimer();

                }, 100);

        });


    /*
    ============================================================
    ACTIVATION DE L'OBSERVATEUR
    ============================================================
    */

    observer.observe(
        grid,
        {
            childList: true,
            subtree: true
        }
    );


    /*
    ============================================================
    STYLE D'ANIMATION
    ============================================================
    */

    const style =
        document.createElement("style");


    style.textContent = `

        #eventGrid {
            transition:
                opacity ${FADE_DURATION}ms ease;
        }

        #eventGrid.pagination-hidden {
            opacity: 0;
        }

        #eventGrid.pagination-visible {
            opacity: 1;
        }

        #pageIndicator {
            position: fixed;

            right: 20px;
            bottom: 15px;

            font-family:
                'Baloo 2',
                sans-serif;

            font-size: 18px;
            font-weight: 700;

            opacity: 0.6;

            z-index: 1000;

            pointer-events: none;
        }

    `;


    document.head.appendChild(style);


    /*
    ============================================================
    INITIALISATION
    ============================================================
    */

    function init() {

        /*
        Le prochain-jour.js peut charger les événements
        de manière asynchrone.

        On vérifie donc régulièrement au début.
        */

        let attempts = 0;

        const waitForEvents =
            setInterval(() => {

                attempts++;

                const events =
                    getEvents();


                if (events.length > 0) {

                    clearInterval(
                        waitForEvents
                    );


                    calculatePages();

                    displayPage(
                        0,
                        false
                    );

                    startTimer();

                    return;

                }


                /*
                On arrête après environ 10 secondes.
                */

                if (attempts >= 100) {

                    clearInterval(
                        waitForEvents
                    );

                }

            }, 100);

    }


    init();

})();
