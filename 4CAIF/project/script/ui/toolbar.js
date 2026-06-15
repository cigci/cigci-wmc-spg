import { state } from "../graph/state.js";

export function initToolbar() {
    initToolButtons();
    initFullscreen();
}

// Werkzeug-Buttons: Klick setzt state.tool und markiert den aktiven Button
function initToolButtons() {
    document.querySelectorAll(".tool-btn[data-tool]").forEach(btn => {
        btn.addEventListener("click", () => onToolClick(btn));
    });
}

function onToolClick(btn) {
    state.tool        = btn.dataset.tool; // z.B. "node", "edge", "delete", "move", "select"
    state.edgePending = null;             // halbfertige Kante abbrechen beim Werkzeugwechsel

    // Aktiven Button hervorheben (CSS-Klasse "active")
    document.querySelectorAll(".tool-btn[data-tool]").forEach(b => {
        b.classList.remove("active");
    });
    btn.classList.add("active");
}

// Vollbild-Button: wechselt zwischen Vollbild und normalem Modus
function initFullscreen() {
    document.getElementById("btn-fullscreen").addEventListener("click", onFullscreenClick);
}

function onFullscreenClick() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {}); // Fehler ignorieren (z.B. nicht erlaubt)
    } else {
        document.exitFullscreen();
    }
}
