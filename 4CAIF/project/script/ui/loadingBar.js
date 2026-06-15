// Hilfsfunktionen für den Ladebalken (Loading Overlay).
// "indeterminate" = unbestimmter Fortschritt (animierter Balken ohne %-Zahl, z.B. beim Worker)

function getOverlay() { return document.getElementById("loading-overlay"); }
function getFill()    { return document.getElementById("loading-fill"); }
function getPct()     { return document.getElementById("loading-pct"); }
function getLabel()   { return document.getElementById("loading-label"); }

export function setLabel(text) {
    getLabel().textContent = text;
}

// Ladebalken anzeigen. indeterminate=true → animierter Balken ohne %-Zahl
export function showLoading(msg = "Layout wird berechnet…", indeterminate = false) {
    getLabel().textContent = msg;
    if (indeterminate) {
        getPct().textContent = "";
        getFill().classList.add("loading-fill--indeterminate");
    } else {
        setProgress(0);
        getFill().classList.remove("loading-fill--indeterminate");
    }
    getOverlay().classList.remove("hidden");
}

// Fortschritt setzen: ratio = 0.0 bis 1.0 → wird als 0%–100% angezeigt
export function setProgress(ratio) {
    const p = Math.round(ratio * 100);
    getFill().style.width = p + "%";
    getPct().textContent  = p + "%";
}

export function hideLoading() {
    getFill().classList.remove("loading-fill--indeterminate");
    getOverlay().classList.add("hidden");
}
