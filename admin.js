const GITHUB_OWNER = "bonnardadrien51";
const GITHUB_REPO = "AfficheEventAffichageDyn";
const OVERRIDES_PATH = "status-overrides.json";

function getToken(){
    return localStorage.getItem("gh_token") || "";
}

function setToken(t){
    if(t){
        localStorage.setItem("gh_token", t);
    } else {
        localStorage.removeItem("gh_token");
    }
    refreshTokenBar();
}

function refreshTokenBar(){
    const token = getToken();
    document.getElementById("tokenStatus").textContent =
        token ? "Token enregistré ✓" : "Aucun token enregistré";
    document.getElementById("tokenInput").value = "";
}

document.getElementById("tokenSave").addEventListener("click", () => {
    const val = document.getElementById("tokenInput").value.trim();
    if(val){
        setToken(val);
        loadEvents();
    }
});

document.getElementById("tokenClear").addEventListener("click", () => {
    setToken("");
});

// Encodage/décodage base64 compatibles UTF-8 (accents, etc.)
function utf8ToBase64(str){
    return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str){
    return decodeURIComponent(escape(atob(str)));
}

async function githubGetFile(){

    const headers = { "Accept": "application/vnd.github+json" };
    const token = getToken();
    if(token) headers["Authorization"] = "Bearer " + token;

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${OVERRIDES_PATH}`;
    const res = await fetch(url, { headers });

    if(!res.ok){
        throw new Error("Impossible de lire status-overrides.json (code " + res.status + ")");
    }

    const data = await res.json();
    const content = JSON.parse(base64ToUtf8(data.content));

    return { content, sha: data.sha };

}

async function githubPutFile(newContentObj, sha){

    const token = getToken();
    if(!token){
        throw new Error("Aucun token GitHub enregistré (voir en haut de page).");
    }

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${OVERRIDES_PATH}`;

    const body = {
        message: "🔧 Mise à jour statut événement (admin)",
        content: utf8ToBase64(JSON.stringify(newContentObj, null, 2)),
        sha: sha
    };

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if(!res.ok){
        const errText = await res.text();
        throw new Error("Échec de la sauvegarde (code " + res.status + ") : " + errText);
    }

}

function highlightActive(cardEl, status){
    cardEl.querySelectorAll(".statusButtons button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.status === status);
    });
}

async function setStatus(uid, newStatus, cardEl){

    cardEl.classList.add("saving");

    const existingError = cardEl.querySelector(".errorMsg");
    if(existingError) existingError.remove();

    try {

        const { content, sha } = await githubGetFile();

        if(newStatus){
            content[uid] = { statut: newStatus };
        } else {
            delete content[uid];
        }

        await githubPutFile(content, sha);

        highlightActive(cardEl, newStatus);

    } catch(err){

        console.error(err);

        const msg = document.createElement("div");
        msg.className = "errorMsg";
        msg.textContent = err.message;
        cardEl.appendChild(msg);

    } finally {

        cardEl.classList.remove("saving");

    }

}

async function loadEvents(){

    const listEl = document.getElementById("eventList");

    let events = [];

    try {
        const res = await fetch("events.json?t=" + Date.now());
        const json = await res.json();
        events = json.events || [];
    } catch(err){
        listEl.textContent = "Impossible de charger events.json.";
        return;
    }

    let overridesContent = {};

    try {
        const { content } = await githubGetFile();
        overridesContent = content;
    } catch(err){
        console.warn("Lecture des overrides impossible :", err.message);
    }

    if(!events.length){
        listEl.textContent = "Aucun événement à venir.";
        return;
    }

    listEl.innerHTML = "";

    events.forEach(event => {

        const card = document.createElement("div");
        card.className = "eventCard";

        const currentStatus =
            (overridesContent[event.uid] && overridesContent[event.uid].statut) || "";

        const start = new Date(event.start);

        const dateStr = start.toLocaleDateString("fr-FR", {
            weekday:"long", day:"2-digit", month:"2-digit", year:"numeric",
            timeZone:"Europe/Paris"
        });

        const hourStr = start.toLocaleTimeString("fr-FR", {
            hour:"2-digit", minute:"2-digit", timeZone:"Europe/Paris"
        });

        card.innerHTML = `
            <div class="title">${event.title}</div>
            <div class="meta">${dateStr} – ${hourStr}${event.location ? " · " + event.location : ""}</div>
            <div class="statusButtons">
                <button data-status="">Aucun</button>
                <button data-status="Annulé">Annulé</button>
                <button data-status="Complet">Complet</button>
                <button data-status="Reporté">Reporté</button>
            </div>
        `;

        highlightActive(card, currentStatus);

        card.querySelectorAll(".statusButtons button").forEach(btn => {
            btn.addEventListener("click", () => {
                setStatus(event.uid, btn.dataset.status, card);
            });
        });

        listEl.appendChild(card);

    });

}

refreshTokenBar();
loadEvents();
