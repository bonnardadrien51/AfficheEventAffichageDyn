const fields = [
    "titre", "image", "logo", "logo_fond",
    "fond", "tarif", "inscription", "statut",
    "lieu", "affichage_lieu"
];

function generate(){

    const data = {};

    fields.forEach(name => {
        data[name] = document.getElementById("f_" + name).value.trim();
    });

    document.getElementById("output").textContent =
        JSON.stringify(data, null, 2);

}

// Synchronise le sélecteur de couleur et le champ texte pour logo_fond
document.getElementById("f_logo_fond_picker").addEventListener("input", (e) => {
    document.getElementById("f_logo_fond").value = e.target.value;
    generate();
});

document.getElementById("f_logo_fond").addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if(/^#[0-9a-fA-F]{6}$/.test(val)){
        document.getElementById("f_logo_fond_picker").value = val;
    }
    generate();
});

fields
    .filter(name => name !== "logo_fond" && name !== "statut" && name !== "affichage_lieu")
    .forEach(name => {
        document.getElementById("f_" + name).addEventListener("input", generate);
    });

document.getElementById("f_statut").addEventListener("change", generate);
document.getElementById("f_affichage_lieu").addEventListener("change", generate);

document.getElementById("resetBtn").addEventListener("click", () => {
    fields.forEach(name => {
        const el = document.getElementById("f_" + name);
        el.value = el.tagName === "SELECT"
            ? (name === "affichage_lieu" ? "3" : "")
            : "";
    });
    document.getElementById("f_logo_fond_picker").value = "#ffffff";
    generate();
});

document.getElementById("copyBtn").addEventListener("click", async () => {

    const text = document.getElementById("output").textContent;

    try {
        await navigator.clipboard.writeText(text);
    } catch(err){
        // Repli si l'API clipboard est indisponible (ex: contexte non sécurisé)
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    }

    const btn = document.getElementById("copyBtn");
    const original = btn.textContent;
    btn.textContent = "Copié !";
    btn.classList.add("copied");

    setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
    }, 1500);

});

generate();
