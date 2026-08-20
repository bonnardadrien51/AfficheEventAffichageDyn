(() => {

    /*
    ============================================================
    CONFIGURATION
    ============================================================
    */

    // Nombre maximum d'événements visibles
    const EVENTS_PER_PAGE = 6;

    // Changement de page toutes les 10 secondes
    const PAGE_DURATION = 10000;

    // Durée du fondu
    const FADE_DURATION = 500;


    /*
    ============================================================
    VARIABLES
    ============================================================
    */

    let currentPage = 0;

    let totalPages = 1;

    let pageTimer = null;

    let mutationTimer = null;


    /*
    ============================================================
    ÉLÉMENTS
    ============================================================
    */

    const grid =
        document.getElementById(
            "eventGrid"
        );

    const indicator =
        document.getElementById(
            "pageIndicator"
        );


    if (!grid) {

        console.error(
            "pagination.js : #eventGrid introuvable."
        );

        return;

    }


    /*
    ============================================================
    RÉCUPÉRATION DES ÉVÉNEMENTS
    ============================================================
    */

    function getEvents() {

        return Array.from(
            grid.querySelectorAll(
                ".eventCard"
            )
        );

    }


    /*
    ============================================================
    CALCUL DES PAGES
    ============================================================
    */

    function calculatePages() {

        const events =
            getEvents();

        totalPages =
            Math.max(
                1,
                Math.ceil(
                    events.length /
                    EVENTS_PER_PAGE
                )
            );


        /*
        Si le nombre d'événements diminue,
        on revient sur une page existante.
        */

        if (
            currentPage >= totalPages
        ) {

            currentPage = 0;

        }

    }


    /*
    ============================================================
    INDICATEUR DE PAGE
    ============================================================
    */

    function updateIndicator() {

        if (!indicator) {

            return;

        }


        /*
        Pas d'indicateur s'il n'y a
        qu'une seule page.
        */

        if (totalPages <= 1) {

            indicator.innerHTML = "";

            return;

        }


        /*
        Affichage :

        ‹ 1 / 2 ›

        */

        indicator.innerHTML = `

            <button
                id="previousPageButton"
                class="pageArrow"
                aria-label="Page précédente"
                type="button"
            >‹</button>

            <span class="pageNumber">
                ${currentPage + 1} / ${totalPages}
            </span>

            <button
                id="nextPageButton"
                class="pageArrow"
                aria-label="Page suivante"
                type="button"
            >›</button>

        `;


        /*
        Bouton page précédente
        */

        const previousButton =
            document.getElementById(
                "previousPageButton"
            );


        /*
        Bouton page suivante
        */

        const nextButton =
            document.getElementById(
                "nextPageButton"
            );


        if (previousButton) {

            previousButton.addEventListener(
                "click",
                previousPage
            );

        }


        if (nextButton) {

            nextButton.addEventListener(
                "click",
                nextPage
            );

        }

    }


    /*
    ============================================================
    AFFICHER UNE PAGE
    ============================================================
    */

    function showPage(
        page,
        animate = false
    ) {

        const events =
            getEvents();


        calculatePages();


        /*
        Aucun événement.
        */

        if (!events.length) {

            if (indicator) {

                indicator.innerHTML = "";

            }

            return;

        }


        /*
        Sécurité.
        */

        if (
            page < 0 ||
            page >= totalPages
        ) {

            page = 0;

        }


        currentPage =
            page;


        /*
        Tous les événements sont cachés.
        */

        events.forEach(
            event => {

                event.style.display =
                    "none";

            }
        );


        /*
        Événements à afficher.
        */

        const start =
            currentPage *
            EVENTS_PER_PAGE;


        const end =
            start +
            EVENTS_PER_PAGE;


        const visibleEvents =
            events.slice(
                start,
                end
            );


        visibleEvents.forEach(
            event => {

                event.style.display =
                    "";

            }
        );


        /*
        Mise à jour de l'indicateur.
        */

        updateIndicator();


        /*
        Animation.
        */

        if (animate) {

            grid.classList.remove(
                "pagination-visible"
            );

            grid.classList.add(
                "pagination-hidden"
            );


            setTimeout(
                () => {

                    grid.classList.remove(
                        "pagination-hidden"
                    );

                    grid.classList.add(
                        "pagination-visible"
                    );

                },
                FADE_DURATION
            );

        }

    }


    /*
    ============================================================
    PAGE PRÉCÉDENTE
    ============================================================
    */

    function previousPage() {

        calculatePages();


        /*
        Une seule page :
        aucun changement.
        */

        if (
            totalPages <= 1
        ) {

            return;

        }


        const previous =
            (
                currentPage - 1 +
                totalPages
            )
            %
            totalPages;


        showPage(
            previous,
            true
        );


        /*
        Le clic manuel remet le
        compteur de 10 secondes à zéro.
        */

        restartTimer();

    }


    /*
    ============================================================
    PAGE SUIVANTE
    ============================================================
    */

    function nextPage() {

        calculatePages();


        /*
        Une seule page :
        aucun changement.
        */

        if (
            totalPages <= 1
        ) {

            return;

        }


        const next =
            (
                currentPage + 1
            )
            %
            totalPages;


        showPage(
            next,
            true
        );


        /*
        Le clic manuel remet le
        compteur de 10 secondes à zéro.

        Cela est également appelé par
        le changement automatique.
        */

        restartTimer();

    }


    /*
    ============================================================
    TIMER
    ============================================================
    */

    function restartTimer() {

        if (pageTimer) {

            clearInterval(
                pageTimer
            );

        }


        pageTimer =
            setInterval(
                nextPage,
                PAGE_DURATION
            );

    }


    /*
    ============================================================
    OBSERVATION DU DOM
    ============================================================

    jour.js et prochain-jour.js
    reconstruisent #eventGrid toutes
    les 60 secondes.

    On détecte cette modification.
    ============================================================
    */

    const observer =
        new MutationObserver(
            () => {

                clearTimeout(
                    mutationTimer
                );


                mutationTimer =
                    setTimeout(
                        () => {

                            /*
                            Les données viennent d'être
                            rechargées.

                            On repart de la première page.
                            */

                            currentPage = 0;


                            calculatePages();


                            showPage(
                                0,
                                false
                            );


                            restartTimer();

                        },
                        50
                    );

            }
        );


    observer.observe(
        grid,
        {
            childList: true
        }
    );


    /*
    ============================================================
    STYLE D'ANIMATION + NAVIGATION
    ============================================================
    */

    const style =
        document.createElement(
            "style"
        );


    style.textContent = `

        /*
        --------------------------------------------------------
        ANIMATION DU GRILLE
        --------------------------------------------------------
        */

        #eventGrid {

            transition:
                opacity
                ${FADE_DURATION}ms
                ease;

        }


        #eventGrid.pagination-hidden {

            opacity: 0;

        }


        #eventGrid.pagination-visible {

            opacity: 1;

        }


        /*
        --------------------------------------------------------
        INDICATEUR DE PAGE
        --------------------------------------------------------
        */

        #pageIndicator {

            position: fixed;

            right: 2vw;
            bottom: 1.5vh;

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 0.4vw;

            font-family:
                "Baloo 2",
                "Segoe UI",
                Arial,
                sans-serif;

            font-size: 1.2vw;

            font-weight: 700;

            color: white;

            opacity: 0.75;

            z-index: 1000;

        }


        /*
        --------------------------------------------------------
        NUMÉRO DE PAGE
        --------------------------------------------------------
        */

        #pageIndicator .pageNumber {

            min-width: 3vw;

            text-align: center;

            white-space: nowrap;

        }


        /*
        --------------------------------------------------------
        FLÈCHES
        --------------------------------------------------------
        */

        #pageIndicator .pageArrow {

            border: none;

            background: transparent;

            color: white;

            font-family:
                "Baloo 2",
                "Segoe UI",
                Arial,
                sans-serif;

            font-size: 1.8vw;

            font-weight: 700;

            line-height: 1;

            padding: 0.1vw 0.3vw;

            margin: 0;

            cursor: pointer;

            opacity: 0.7;

            transition:
                transform 0.15s ease,
                opacity 0.15s ease;

        }


        /*
        --------------------------------------------------------
        SURVOL
        --------------------------------------------------------
        */

        #pageIndicator .pageArrow:hover {

            opacity: 1;

            transform:
                scale(1.2);

        }


        /*
        --------------------------------------------------------
        CLIC
        --------------------------------------------------------
        */

        #pageIndicator .pageArrow:active {

            transform:
                scale(0.9);

        }


        /*
        --------------------------------------------------------
        FOCUS
        --------------------------------------------------------
        */

        #pageIndicator .pageArrow:focus {

            outline: none;

        }

    `;


    document.head.appendChild(
        style
    );


    /*
    ============================================================
    INITIALISATION
    ============================================================
    */

    function init() {

        calculatePages();


        showPage(
            0,
            false
        );


        restartTimer();

    }


    init();

})();
