/*
============================================================
BIBLIOTHÈQUE D'IMAGES
============================================================

Ce fichier peut être utilisé :

1. seul dans images.html
2. depuis generateur.html pour sélectionner une image

Il parcourt automatiquement :

img/

et tous ses sous-dossiers.
============================================================
*/


const IMAGE_LIBRARY_CONFIG = {

    owner: "bonnardadrien51",

    repo: "AfficheEventAffichageDyn",

    branch: "main",

    root: "img"

};


/*
============================================================
EXTENSIONS ACCEPTÉES
============================================================
*/

const IMAGE_EXTENSIONS = [

    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".svg",
    ".avif"

];


/*
============================================================
URL GITHUB PAGES
============================================================
*/

function imageGitHubPagesUrl(path) {

    const encodedPath =
        path
            .split("/")
            .map(
                part =>
                    encodeURIComponent(part)
            )
            .join("/");


    return (
        "https://" +
        IMAGE_LIBRARY_CONFIG.owner +
        ".github.io/" +
        IMAGE_LIBRARY_CONFIG.repo +
        "/" +
        encodedPath
    );
}


/*
============================================================
VÉRIFIER EXTENSION
============================================================
*/

function isImageFile(path) {

    const lower =
        path.toLowerCase();

    return IMAGE_EXTENSIONS.some(
        ext =>
            lower.endsWith(ext)
    );
}


/*
============================================================
RÉCUPÉRER TOUTE L'ARBORESCENCE IMG
============================================================
*/

async function fetchImageFiles() {

    const url =
        `https://api.github.com/repos/` +
        `${IMAGE_LIBRARY_CONFIG.owner}/` +
        `${IMAGE_LIBRARY_CONFIG.repo}/` +
        `git/trees/` +
        `${IMAGE_LIBRARY_CONFIG.branch}?recursive=1`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            `GitHub API : ${response.status}`
        );

    }


    const data =
        await response.json();


    if (data.truncated) {

        console.warn(
            "L'arborescence GitHub est tronquée."
        );

    }


    return (
        data.tree || []
    )

        .filter(
            item =>
                item.type === "blob"
        )

        .filter(
            item =>
                item.path
                    .toLowerCase()
                    .startsWith(
                        IMAGE_LIBRARY_CONFIG.root.toLowerCase()
                        + "/"
                    )
        )

        .filter(
            item =>
                isImageFile(item.path)
        )

        .map(
            item => ({

                path: item.path,

                name:
                    item.path
                        .split("/")
                        .pop(),

                url:
                    imageGitHubPagesUrl(
                        item.path
                    )

            })
        )

        .sort(
            (a, b) =>
                a.path.localeCompare(
                    b.path,
                    "fr",
                    {
                        sensitivity: "base"
                    }
                )
        );
}


/*
============================================================
CONSTRUIRE LES DOSSIERS
============================================================
*/

function groupImagesByFolder(images) {

    const groups = new Map();


    images.forEach(image => {

        const parts =
            image.path.split("/");


        /*
        Retire "img"
        */

        const folderParts =
            parts.slice(1, -1);


        const folder =
            folderParts.length
                ? folderParts.join(" / ")
                : "Racine";


        if (!groups.has(folder)) {

            groups.set(
                folder,
                []
            );

        }


        groups
            .get(folder)
            .push(image);

    });


    return groups;
}


/*
============================================================
ÉCHAPPER HTML
============================================================
*/

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/*
============================================================
CRÉER UNE CARTE
============================================================
*/

function createImageCard(image, onClick) {

    const card =
        document.createElement("div");


    card.className =
        "imageCard";


    card.innerHTML = `

        <div class="imagePreview">

            <img
                src="${image.url}"
                alt="${escapeHtml(image.name)}"
                loading="lazy"
            >

        </div>


        <div class="imageCardInfo">

            <div class="imageName">
                ${escapeHtml(image.name)}
            </div>

            <div class="imagePath">
                ${escapeHtml(image.path)}
            </div>

        </div>

    `;


    card.addEventListener(
        "click",
        () => onClick(image)
    );


    return card;
}


/*
============================================================
OUVRIR LA MODALE
============================================================
*/

function openImageModal(image) {

    const modal =
        document.getElementById(
            "imageModal"
        );


    if (!modal) {
        return;
    }


    document.getElementById(
        "modalImage"
    ).src = image.url;


    document.getElementById(
        "modalImage"
    ).alt = image.name;


    document.getElementById(
        "modalFileName"
    ).textContent =
        image.name;


    document.getElementById(
        "modalPath"
    ).textContent =
        image.path;


    const openLink =
        document.getElementById(
            "openImageLink"
        );


    openLink.href =
        image.url;


    const copyMessage =
        document.getElementById(
            "copyMessage"
        );


    copyMessage.textContent =
        "";


    const copyButton =
        document.getElementById(
            "copyImageLink"
        );


    copyButton.onclick =
        async () => {

            try {

                await copyText(
                    image.url
                );


                copyMessage.textContent =
                    "Lien copié !";


            }
            catch (error) {

                copyMessage.textContent =
                    "Impossible de copier le lien.";

            }

        };


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/*
============================================================
FERMER MODALE
============================================================
*/

function closeImageModal() {

    const modal =
        document.getElementById(
            "imageModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/*
============================================================
COPIER TEXTE
============================================================
*/

async function copyText(text) {

    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        await navigator.clipboard.writeText(
            text
        );

        return;
    }


    const textarea =
        document.createElement(
            "textarea"
        );


    textarea.value =
        text;


    textarea.style.position =
        "fixed";

    textarea.style.opacity =
        "0";


    document.body.appendChild(
        textarea
    );


    textarea.focus();

    textarea.select();


    const success =
        document.execCommand(
            "copy"
        );


    document.body.removeChild(
        textarea
    );


    if (!success) {

        throw new Error(
            "Copie impossible"
        );

    }
}


/*
============================================================
INITIALISATION DE LA MODALE
============================================================
*/

function initImageModal() {

    const modal =
        document.getElementById(
            "imageModal"
        );


    if (!modal) {
        return;
    }


    document
        .getElementById(
            "modalClose"
        )
        .addEventListener(
            "click",
            closeImageModal
        );


    const overlay =
        modal.querySelector(
            ".modalOverlay"
        );


    overlay.addEventListener(
        "click",
        closeImageModal
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeImageModal();

            }

        }
    );

}


/*
============================================================
FILTRE LOGO
============================================================
*/

function isLogoImage(image) {

    return image.path
        .toLowerCase()
        .includes(
            "/logo/"
        );
}


/*
============================================================
RÉCUPÉRER LE CHEMIN D'UN DOSSIER
============================================================
*/

function folderMatches(
    image,
    folder
) {

    if (!folder) {
        return true;
    }


    return image.path
        .toLowerCase()
        .startsWith(
            folder
                .toLowerCase()
                .replace(
                    /\/$/,
                    ""
                )
                + "/"
        );
}


/*
============================================================
CRÉER LE SÉLECTEUR
============================================================
*/

function createPickerModal() {

    let modal =
        document.getElementById(
            "mediaPickerModal"
        );


    if (modal) {
        return modal;
    }


    modal =
        document.createElement(
            "div"
        );


    modal.id =
        "mediaPickerModal";


    modal.className =
        "mediaPickerModal";


    modal.innerHTML = `

        <div
            class="mediaPickerOverlay"
        ></div>


        <div
            class="mediaPickerContent"
            role="dialog"
            aria-modal="true"
        >

            <div
                class="mediaPickerHeader"
            >

                <div>

                    <h2 id="mediaPickerTitle">
                        Choisir une image
                    </h2>

                    <p id="mediaPickerSubtitle">
                        Bibliothèque d'images
                    </p>

                </div>


                <button
                    id="mediaPickerClose"
                    type="button"
                    class="mediaPickerClose"
                >
                    ×
                </button>

            </div>


            <div
                class="mediaPickerToolbar"
            >

                <input
                    id="mediaPickerSearch"
                    type="search"
                    placeholder="Rechercher une image..."
                >

                <span
                    id="mediaPickerCount"
                ></span>

            </div>


            <div
                id="mediaPickerGrid"
                class="mediaPickerGrid"
            >

                <div class="pickerLoading">
                    Chargement…
                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelector(
            ".mediaPickerOverlay"
        )
        .addEventListener(
            "click",
            closeMediaPicker
        );


    modal
        .querySelector(
            "#mediaPickerClose"
        )
        .addEventListener(
            "click",
            closeMediaPicker
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape" &&
                modal.classList.contains(
                    "open"
                )
            ) {

                closeMediaPicker();

            }

        }
    );


    return modal;
}


/*
============================================================
OUVRIR LE SÉLECTEUR
============================================================
*/

async function openMediaPicker(options = {}) {

    const modal =
        createPickerModal();


    const title =
        options.title ||
        "Choisir une image";


    const folder =
        options.folder ||
        null;


    const excludeLogos =
        options.excludeLogos === true;


    const onSelect =
        typeof options.onSelect === "function"
            ? options.onSelect
            : null;


    modal.dataset.folder =
        folder || "";


    modal.dataset.excludeLogos =
        excludeLogos
            ? "true"
            : "false";


    modal._onSelect =
        onSelect;


    modal
        .querySelector(
            "#mediaPickerTitle"
        )
        .textContent =
            title;


    modal
        .querySelector(
            "#mediaPickerSubtitle"
        )
        .textContent =
            folder
                ? `Dossier : ${folder}`
                : "Toutes les images";


    modal
        .querySelector(
            "#mediaPickerSearch"
        )
        .value =
            "";


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    const grid =
        modal.querySelector(
            "#mediaPickerGrid"
        );


    grid.innerHTML = `
        <div class="pickerLoading">
            Chargement des images…
        </div>
    `;


    try {

        const images =
            await fetchImageFiles();


        modal._images =
            images;


        renderPickerImages(
            modal
        );


    }
    catch (error) {

        console.error(
            error
        );


        grid.innerHTML = `

            <div class="pickerError">

                Impossible de charger
                les images.

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

    }


    const searchInput =
        modal.querySelector(
            "#mediaPickerSearch"
        );


    searchInput.oninput =
        () => {

            renderPickerImages(
                modal
            );

        };


    setTimeout(
        () => searchInput.focus(),
        50
    );

}


/*
============================================================
AFFICHER LES IMAGES DU SÉLECTEUR
============================================================
*/

function renderPickerImages(modal) {

    const allImages =
        modal._images || [];


    const search =
        modal
            .querySelector(
                "#mediaPickerSearch"
            )
            .value
            .trim()
            .toLowerCase();


    const folder =
        modal.dataset.folder ||
        "";


    const excludeLogos =
        modal.dataset.excludeLogos ===
        "true";


    let images =
        allImages.filter(
            image =>
                folderMatches(
                    image,
                    folder
                )
        );


    if (excludeLogos) {

        images =
            images.filter(
                image =>
                    !isLogoImage(image)
            );

    }


    if (search) {

        images =
            images.filter(
                image =>
                    image.name
                        .toLowerCase()
                        .includes(search)
                    ||
                    image.path
                        .toLowerCase()
                        .includes(search)
            );

    }


    const count =
        modal.querySelector(
            "#mediaPickerCount"
        );


    count.textContent =
        `${images.length} image${images.length > 1 ? "s" : ""}`;


    const grid =
        modal.querySelector(
            "#mediaPickerGrid"
        );


    grid.innerHTML =
        "";


    if (!images.length) {

        grid.innerHTML = `

            <div class="pickerEmpty">
                Aucune image trouvée.
            </div>

        `;

        return;
    }


    images.forEach(
        image => {

            const card =
                document.createElement(
                    "button"
                );


            card.type =
                "button";


            card.className =
                "pickerImageCard";


            card.innerHTML = `

                <div
                    class="pickerImagePreview"
                >

                    <img
                        src="${image.url}"
                        alt="${escapeHtml(image.name)}"
                        loading="lazy"
                    >

                </div>


                <div
                    class="pickerImageName"
                >
                    ${escapeHtml(image.name)}
                </div>

                <div
                    class="pickerImagePath"
                >
                    ${escapeHtml(image.path)}
                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    const callback =
                        modal._onSelect;


                    if (callback) {

                        callback(image);

                    }


                    closeMediaPicker();

                }
            );


            grid.appendChild(
                card
            );

        }
    );
}


/*
============================================================
FERMER LE SÉLECTEUR
============================================================
*/

function closeMediaPicker() {

    const modal =
        document.getElementById(
            "mediaPickerModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/*
============================================================
AFFICHAGE DE LA PAGE IMAGES.HTML
============================================================
*/

async function initImageLibraryPage() {

    const library =
        document.getElementById(
            "imageLibrary"
        );


    if (!library) {
        return;
    }


    try {

        const images =
            await fetchImageFiles();


        renderImageLibrary(
            images
        );

    }
    catch (error) {

        console.error(
            error
        );


        library.innerHTML = `

            <div class="libraryError">

                Impossible de charger
                la bibliothèque d'images.

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

    }

}


/*
============================================================
RENDRE LA BIBLIOTHÈQUE
============================================================
*/

function renderImageLibrary(
    images
) {

    const library =
        document.getElementById(
            "imageLibrary"
        );


    if (!images.length) {

        library.innerHTML = `

            <div class="libraryEmpty">

                Aucune image trouvée
                dans le dossier img/.

            </div>

        `;

        return;
    }


    library.innerHTML = `

        <div
            class="libraryToolbar"
        >

            <input
                id="librarySearch"
                class="librarySearch"
                type="search"
                placeholder="Rechercher une image ou un dossier..."
            >

            <span
                id="libraryCount"
                class="libraryCount"
            ></span>

        </div>


        <div
            id="libraryFolders"
        ></div>

    `;


    const search =
        document.getElementById(
            "librarySearch"
        );


    search.addEventListener(
        "input",
        () => {

            renderLibraryFolders(
                images,
                search.value
            );

        }
    );


    renderLibraryFolders(
        images,
        ""
    );

}


/*
============================================================
RENDRE LES DOSSIERS
============================================================
*/

function renderLibraryFolders(
    images,
    searchText
) {

    const container =
        document.getElementById(
            "libraryFolders"
        );


    const count =
        document.getElementById(
            "libraryCount"
        );


    const search =
        searchText
            .trim()
            .toLowerCase();


    let filtered =
        images;


    if (search) {

        filtered =
            images.filter(
                image =>
                    image.name
                        .toLowerCase()
                        .includes(search)
                    ||
                    image.path
                        .toLowerCase()
                        .includes(search)
            );

    }


    count.textContent =
        `${filtered.length} image${filtered.length > 1 ? "s" : ""}`;


    container.innerHTML =
        "";


    if (!filtered.length) {

        container.innerHTML = `

            <div class="libraryEmpty">

                Aucune image ne correspond
                à votre recherche.

            </div>

        `;

        return;
    }


    const groups =
        groupImagesByFolder(
            filtered
        );


    groups.forEach(
        (folderImages, folder) => {

            const section =
                document.createElement(
                    "section"
                );


            section.className =
                "imageFolder";


            section.innerHTML = `

                <div
                    class="folderTitle"
                >

                    <h2>
                        ${escapeHtml(folder)}
                    </h2>

                    <span>
                        ${folderImages.length}
                        image${folderImages.length > 1 ? "s" : ""}
                    </span>

                </div>


                <div
                    class="imageGrid"
                ></div>

            `;


            const grid =
                section.querySelector(
                    ".imageGrid"
                );


            folderImages.forEach(
                image => {

                    grid.appendChild(

                        createImageCard(
                            image,
                            openImageModal
                        )

                    );

                }
            );


            container.appendChild(
                section
            );

        }
    );
}


/*
============================================================
INITIALISATION
============================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initImageModal();

        initImageLibraryPage();

    }
);


/*
============================================================
API PUBLIQUE
============================================================

Permet à generateur.js d'utiliser
le sélecteur d'images.
============================================================
*/

window.ImageLibrary = {

    openPicker:
        openMediaPicker,

    closePicker:
        closeMediaPicker,

    fetchImages:
        fetchImageFiles

};
