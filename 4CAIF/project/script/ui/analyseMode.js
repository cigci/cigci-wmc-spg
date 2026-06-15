import { state } from "../graph/state.js";

const KEY_TOGGLE = "spg-graph-analyse";

// Schaltet den Analyse-Modus ein oder aus.
// onToggle wird aufgerufen damit das Canvas neu gezeichnet wird.
export function initAnalyseMode(onToggle) {
    const toggle = document.getElementById("toggle-analyse");
    const legend = document.getElementById("analyse-legend");

    // Gespeicherten Zustand aus localStorage laden
    state.analyseMode = localStorage.getItem(KEY_TOGGLE) === "true";
    toggle.checked = state.analyseMode;
    legend.classList.toggle("hidden", !state.analyseMode);

    toggle.addEventListener("change", () => {
        state.analyseMode = toggle.checked;
        localStorage.setItem(KEY_TOGGLE, toggle.checked);
        legend.classList.toggle("hidden", !toggle.checked);
        onToggle();
    });
}
