const fields = [
    "titre",
    "image",
    "logo",
    "logo_fond",
    "fond",
    "tarif",
    "inscription",
    "lien_inscription",
    "statut",
    "lieu",
    "affichage_lieu"
];


/*
============================================================
GÉNÉRATION JSON
============================================================
*/

function generate() {

    const data = {};


    fields.forEach(
        name => {

            data[name] =
                document
                    .getElementById(
                        "f_" + name
                    )
                    .value
                    .trim();

        }
    );


    document.getElementById(
        "output"
    ).textContent =
        JSON.stringify(
            data,
            null,
            2
        );
}


/*
============================================================
COULEUR DU LOGO
============================================================
*/

document
    .getElementById(
        "f_logo_fond_picker"
    )
    .addEventListener(
        "input",
        event => {

            document.getElementById(
                "f_logo_fond"
            ).value =
                event.target.value;


            generate();

        }
    );


document
    .getElementById(
        "f_logo_fond"
    )
    .addEventListener(
        "input",
        event => {

            const value =
                event.target.value.trim();


            if (
                /^#[0-9a-fA-F]{6}$/
                    .test(value)
            ) {

                document.getElementById(
                    "f_logo_fond_picker"
                ).value =
                    value;

            }


            generate();

        }
    );


/*
============================================================
ÉCOUTE DES CHAMPS
============================================================
*/

fields

    .filter(
        name =>
            name !== "logo_fond" &&
            name !== "statut" &&
            name !== "affichage_lieu"
    )

    .forEach(
        name => {

            document
                .getElementById(
                    "f_" + name
                )
                .addEventListener(
                    "input",
                    generate
                );

        }
    );


document
    .getElementById(
        "f_statut"
    )
    .addEventListener(
        "change",
        generate
    );


document
    .getElementById(
        "f_affichage_lieu"
    )
    .addEventListener(
        "change",
        generate
    );


/*
============================================================
SÉLECTION D'UNE IMAGE
============================================================
*/

document
    .getElementById(
        "chooseImageBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (
                !window.ImageLibrary
            ) {

                alert(
                    "La bibliothèque d'images n'est pas disponible."
                );

                return;
            }


            window.ImageLibrary.openPicker({

                title:
                    "Choisir une image d'événement",

                subtitle:
                    "Toutes les images disponibles",

                excludeLogos:
                    true,

                onSelect:
                    image => {

                        document.getElementById(
                            "f_image"
                        ).value =
                            image.url;


                        generate();

                    }

            });

        }
    );


/*
============================================================
SÉLECTION D'UN LOGO
============================================================
*/

document
    .getElementById(
        "chooseLogoBtn"
    )
    .addEventListener(
        "click",
        () => {

            if (
                !window.ImageLibrary
            ) {

                alert(
                    "La bibliothèque d'images n'est pas disponible."
                );

                return;
            }


            window.ImageLibrary.openPicker({

                title:
                    "Choisir un logo",

                folder:
                    "img/BVL/Logo",

                excludeLogos:
                    false,

                onSelect:
                    image => {

                        document.getElementById(
                            "f_logo"
                        ).value =
                            image.url;


                        generate();

                    }

            });

        }
    );


/*
============================================================
RÉINITIALISER
============================================================
*/

document
    .getElementById(
        "resetBtn"
    )
    .addEventListener(
        "click",
        () => {

            fields.forEach(
                name => {

                    const el =
                        document.getElementById(
                            "f_" + name
                        );


                    el.value =
                        el.tagName === "SELECT"

                            ? (
                                name ===
                                "affichage_lieu"
                                    ? "3"
                                    : ""
                            )

                            : "";

                }
            );


            document.getElementById(
                "f_logo_fond_picker"
            ).value =
                "#ffffff";


            generate();

        }
    );


/*
============================================================
COPIER LE JSON
============================================================
*/

document
    .getElementById(
        "copyBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const text =
                document
                    .getElementById(
                        "output"
                    )
                    .textContent;


            try {

                await navigator
                    .clipboard
                    .writeText(
                        text
                    );

            }
            catch (error) {

                const textarea =
                    document.createElement(
                        "textarea"
                    );


                textarea.value =
                    text;


                document.body.appendChild(
                    textarea
                );


                textarea.select();


                document.execCommand(
                    "copy"
                );


                document.body.removeChild(
                    textarea
                );

            }


            const button =
                document.getElementById(
                    "copyBtn"
                );


            const original =
                button.textContent;


            button.textContent =
                "Copié !";


            button.classList.add(
                "copied"
            );


            setTimeout(
                () => {

                    button.textContent =
                        original;


                    button.classList.remove(
                        "copied"
                    );

                },
                1500
            );

        }
    );


/*
============================================================
GÉNÉRATION INITIALE
============================================================
*/

generate();


/**************************************************
    TOKEN GITHUB
**************************************************/

const GITHUB_OWNER =
    "bonnardadrien51";


const GITHUB_REPO =
    "AfficheEventAffichageDyn";


const TEMPLATES_DIR =
    "templates/evenements";


function getToken() {

    return (
        localStorage.getItem(
            "gen_gh_token"
        )
        ||
        ""
    );

}


function setToken(token) {

    if (token) {

        localStorage.setItem(
            "gen_gh_token",
            token
        );

    }
    else {

        localStorage.removeItem(
            "gen_gh_token"
        );

    }


    refreshTokenBar();

}


function refreshTokenBar() {

    const token =
        getToken();


    document.getElementById(
        "tokenStatus"
    ).textContent =

        token
            ? "Token enregistré ✓"
            : "Aucun token enregistré";


    document.getElementById(
        "tokenInput"
    ).value =
        "";


    if (token) {

        loadTemplates();

    }
    else {

        showTemplateHint(
            "Entrez votre token GitHub pour accéder aux templates."
        );

    }

}


document
    .getElementById(
        "tokenSave"
    )
    .addEventListener(
        "click",
        () => {

            const value =
                document
                    .getElementById(
                        "tokenInput"
                    )
                    .value
                    .trim();


            if (value) {

                setToken(
                    value
                );

            }

        }
    );


document
    .getElementById(
        "tokenClear"
    )
    .addEventListener(
        "click",
        () =>
            setToken("")
    );


/**************************************************
    HELPERS GITHUB API
**************************************************/

function utf8ToBase64(str) {

    return btoa(
        unescape(
            encodeURIComponent(
                str
            )
        )
    );

}


function base64ToUtf8(str) {

    return decodeURIComponent(
        escape(
            atob(
                str.replace(
                    /\n/g,
                    ""
                )
            )
        )
    );

}


function ghHeaders() {

    return {

        "Accept":
            "application/vnd.github+json",

        "Authorization":
            "Bearer " +
            getToken(),

        "User-Agent":
            "generateur-json"

    };

}


/**************************************************
    TEMPLATES
**************************************************/

function showTemplateHint(
    msg,
    type
) {

    const list =
        document.getElementById(
            "templateList"
        );


    const cls =
        type === "ok"

            ? "templateMsg ok"

            : type === "err"

                ? "templateMsg err"

                : "templateHint";


    list.innerHTML =
        `<span class="${cls}">${msg}</span>`;

}


async function loadTemplates() {

    const token =
        getToken();


    if (!token) {

        return;

    }


    showTemplateHint(
        "Chargement…"
    );


    try {

        const url =
            `https://api.github.com/repos/` +
            `${GITHUB_OWNER}/` +
            `${GITHUB_REPO}/` +
            `contents/${TEMPLATES_DIR}`;


        const res =
            await fetch(
                url,
                {
                    headers:
                        ghHeaders()
                }
            );


        if (
            res.status ===
            404
        ) {

            showTemplateHint(
                "Aucun template enregistré pour l'instant."
            );

            return;

        }


        if (!res.ok) {

            showTemplateHint(
                "Erreur de chargement (" +
                res.status +
                ")",
                "err"
            );

            return;

        }


        const files =
            await res.json();


        const jsonFiles =
            files.filter(
                file =>
                    file.name
                        .endsWith(
                            ".json"
                        )
            );


        if (!jsonFiles.length) {

            showTemplateHint(
                "Aucun template enregistré pour l'instant."
            );

            return;

        }


        const list =
            document.getElementById(
                "templateList"
            );


        list.innerHTML =
            "";


        jsonFiles.forEach(
            file => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "templateItem";


                const name =
                    file.name.replace(
                        /\.json$/,
                        ""
                    );


                item.innerHTML = `

                    <span
                        class="templateItemName"
                    >
                        ${name}
                    </span>


                    <button
                        class="templateLoadBtn"
                        data-path="${file.path}"
                        data-sha="${file.sha}"
                    >
                        Charger
                    </button>


                    <button
                        class="templateDeleteBtn"
                        data-path="${file.path}"
                        data-sha="${file.sha}"
                        data-name="${name}"
                    >
                        Supprimer
                    </button>

                `;


                item
                    .querySelector(
                        ".templateLoadBtn"
                    )
                    .addEventListener(
                        "click",
                        event => {

                            loadTemplate(
                                event
                                    .currentTarget
                                    .dataset
                                    .path
                            );

                        }
                    );


                item
                    .querySelector(
                        ".templateDeleteBtn"
                    )
                    .addEventListener(
                        "click",
                        event => {

                            const button =
                                event.currentTarget;


                            deleteTemplate(

                                button
                                    .dataset
                                    .path,

                                button
                                    .dataset
                                    .sha,

                                button
                                    .dataset
                                    .name

                            );

                        }
                    );


                list.appendChild(
                    item
                );

            }
        );

    }
    catch (error) {

        showTemplateHint(
            "Erreur réseau : " +
            error.message,
            "err"
        );

    }

}


async function loadTemplate(path) {

    try {

        const url =
            `https://api.github.com/repos/` +
            `${GITHUB_OWNER}/` +
            `${GITHUB_REPO}/` +
            `contents/${path}`;


        const res =
            await fetch(
                url,
                {
                    headers:
                        ghHeaders()
                }
            );


        const file =
            await res.json();


        const data =
            JSON.parse(
                base64ToUtf8(
                    file.content
                )
            );


        /*
        --------------------------------------------------------
        Remplir le formulaire
        --------------------------------------------------------
        */

        fields.forEach(
            name => {

                const el =
                    document.getElementById(
                        "f_" + name
                    );


                if (
                    el &&
                    data[name] !== undefined
                ) {

                    el.value =
                        data[name];

                }

            }
        );


        /*
        --------------------------------------------------------
        Synchroniser la couleur
        --------------------------------------------------------
        */

        if (
            data.logo_fond &&
            /^#[0-9a-fA-F]{6}$/
                .test(
                    data.logo_fond
                )
        ) {

            document.getElementById(
                "f_logo_fond_picker"
            ).value =
                data.logo_fond;

        }


        generate();

    }
    catch (error) {

        showTemplateHint(
            "Impossible de charger ce template : " +
            error.message,
            "err"
        );

    }

}


async function deleteTemplate(
    path,
    sha,
    name
) {

    if (
        !confirm(
            `Supprimer le template "${name}" ?`
        )
    ) {

        return;

    }


    try {

        const url =
            `https://api.github.com/repos/` +
            `${GITHUB_OWNER}/` +
            `${GITHUB_REPO}/` +
            `contents/${path}`;


        const res =
            await fetch(
                url,
                {

                    method:
                        "DELETE",

                    headers:
                        {
                            ...ghHeaders(),

                            "Content-Type":
                                "application/json"
                        },

                    body:
                        JSON.stringify(
                            {

                                message:
                                    `Suppression template ${name}`,

                                sha:
                                    sha

                            }
                        )

                }
            );


        if (!res.ok) {

            const error =
                await res.json();


            showTemplateHint(
                "Suppression échouée : " +
                (
                    error.message ||
                    res.status
                ),
                "err"
            );


            return;

        }


        await loadTemplates();

    }
    catch (error) {

        showTemplateHint(
            "Erreur : " +
            error.message,
            "err"
        );

    }

}


/**************************************************
    SAUVEGARDE TEMPLATE
**************************************************/

document
    .getElementById(
        "templateSaveBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const token =
                getToken();


            if (!token) {

                showTemplateHint(
                    "Entrez d'abord votre token GitHub.",
                    "err"
                );

                return;

            }


            const rawName =
                document
                    .getElementById(
                        "templateName"
                    )
                    .value
                    .trim();


            if (!rawName) {

                showTemplateHint(
                    "Donnez un nom au template avant de sauvegarder.",
                    "err"
                );

                return;

            }


            /*
            ----------------------------------------------------
            Nettoyage du nom
            ----------------------------------------------------
            */

            const safeName =
                rawName.replace(
                    /[^a-zA-Z0-9\-_]/g,
                    "-"
                );


            const filePath =
                `${TEMPLATES_DIR}/${safeName}.json`;


            const content =
                document.getElementById(
                    "output"
                ).textContent;


            const url =
                `https://api.github.com/repos/` +
                `${GITHUB_OWNER}/` +
                `${GITHUB_REPO}/` +
                `contents/${filePath}`;


            /*
            ----------------------------------------------------
            Vérifier si le fichier existe
            ----------------------------------------------------
            */

            let existingSha =
                null;


            try {

                const check =
                    await fetch(
                        url,
                        {
                            headers:
                                ghHeaders()
                        }
                    );


                if (check.ok) {

                    const existing =
                        await check.json();


                    existingSha =
                        existing.sha;

                }

            }
            catch (error) {

                /*
                Nouveau fichier.
                */

            }


            const body = {

                message:
                    existingSha

                        ? `Mise à jour template ${safeName}`

                        : `Nouveau template ${safeName}`,

                content:
                    utf8ToBase64(
                        content
                    )

            };


            if (existingSha) {

                body.sha =
                    existingSha;

            }


            try {

                const res =
                    await fetch(
                        url,
                        {

                            method:
                                "PUT",

                            headers:
                                {
                                    ...ghHeaders(),

                                    "Content-Type":
                                        "application/json"
                                },

                            body:
                                JSON.stringify(
                                    body
                                )

                        }
                    );


                if (!res.ok) {

                    const error =
                        await res.json();


                    showTemplateHint(
                        "Erreur de sauvegarde : " +
                        (
                            error.message ||
                            res.status
                        ),
                        "err"
                    );


                    return;

                }


                document.getElementById(
                    "templateName"
                ).value =
                    "";


                showTemplateHint(
                    `Template "${rawName}" sauvegardé ✓`,
                    "ok"
                );


                setTimeout(
                    () =>
                        loadTemplates(),
                    800
                );

            }
            catch (error) {

                showTemplateHint(
                    "Erreur réseau : " +
                    error.message,
                    "err"
                );

            }

        }
    );


/*
============================================================
RAFRAÎCHIR LES TEMPLATES
============================================================
*/

document
    .getElementById(
        "templateRefreshBtn"
    )
    .addEventListener(
        "click",
        loadTemplates
    );


/*
============================================================
INITIALISATION DU TOKEN
============================================================
*/

refreshTokenBar();
