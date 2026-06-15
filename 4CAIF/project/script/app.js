// ============================================================
// POS – Graph-Tool Checkliste
// ============================================================
//
// [x] CSV einlesen → Adjazenzmatrix parsen
//
// Minimalanforderungen (ohne Bibliotheken):
// [x] Distanzen aller Knoten       (BFS/Dijkstra)
// [x] Exzentrizitäten aller Knoten (max. Distanz je Knoten)
// [x] Radius                       (min. Exzentrizität)
// [x] Durchmesser                  (max. Exzentrizität)
// [x] Zentrum                      (Knoten mit Exzentrizität = Radius)
// [x] Komponenten                  (BFS/DFS)
// [x] Artikulationen               (Knoten deren Entfernung Komponenten trennt)
// [x] Brücken                      (Kanten deren Entfernung Komponenten trennt)
//
// Sehr Gut – mind. 1 Erweiterung:
// [x] GUI                          (bereits vorhanden ✓)
// [ ] Eulersche Linien
// [ ] Spannbäume
// [ ] Starke Zusammenhangskomponente (SCC)
// [ ] Blöcke
// [ ] Isomorphie
//
// ⚠ Abgabe: bis 1. Juni + Bildschirmvideo + Abgabegespräch
// ============================================================

// ============================================================
// WMC Pflichtanforderungen – Checkliste
// ============================================================
//
// [x] HTML: Semantisches HTML (aside, nav, main, section, form, label, ...)
// [x] CSS:  Styling mit CSS (style.css + output.css)
// [x] JS:   Mindestens 3 Interaktionen:
//             [x] mind. 1 Ereignisbehandlung (addEventListener → events.js, toolbar.js, ...)
//             [x] mind. 1 DOM-Modifikation   (createElement, classList, textContent → results.js, loadingBar.js, ...)
//             [x] mind. 1 weitere Interaktion (localStorage, Web Worker, Canvas API)
// [ ] JS:   Strukturierung gemäß Vorlage mit 8 Punkten
// [x] JS:   State-Objekt verwenden (state.js)
// [x] JS:   State in Local Storage speichern (autosave.js, analyseMode.js)
//
// ⚠ Pflichtanforderungen OHNE KI implementieren!
// ============================================================

/*
 * WARUM EIN WEB WORKER?
 * Die Berechnungen (BFS, Tarjan, ...) können bei großen Graphen lange dauern.
 * Würden wir sie direkt hier ausführen, würde der Browser "einfrieren" — kein
 * Klick, keine Animation möglich. Ein Web Worker läuft in einem eigenen Thread
 * parallel zum Browser. So bleibt die Seite immer reaktionsfähig.
 *
 * Kommunikation:
 *   app.js  →  worker.postMessage(graph-Daten)   →  worker.js rechnet
 *   worker.js  →  self.postMessage(Ergebnisse)   →  app.js zeigt an
 */

import { initToolbar } from "./ui/toolbar.js";
import { loadCsvData, saveCsvData, parseCsvAdjacencyMatrix, buildGraphFromMatrix } from "./ui/fileManager.js";
import { initDraw, redraw } from "./render/draw.js";
import { initEvents } from "./render/events.js";
import { renderResults, renderEmpty } from "./ui/results.js";
import { initAutosave, autosave, clearAutosave } from "./ui/autosave.js";
import { initRandomModal } from "./ui/randomModal.js";
import { initAnalyseMode } from "./ui/analyseMode.js";
import { forceDirectedLayoutAsync } from "./graph/layout.js";
import { showLoading, setProgress, hideLoading } from "./ui/loadingBar.js";
import { graph, state } from "./graph/state.js";

const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
let _computeTimer = null;

// A.I
worker.onmessage = function (e) {
    clearTimeout(_computeTimer);
    hideLoading();

    if (e.data.isEmpty) {
        renderEmpty();
        state.analyseData = null;
    } else {
        const d = e.data.data;
        renderResults(d);

        // Artikulations-IDs als Set speichern für schnelle Suche beim Zeichnen
        const articulationIds = new Set();
        for (const n of d.articulations) {
            articulationIds.add(n.id);
        }

        // Zentrum-IDs als Set speichern
        const centerIds = new Set();
        for (const n of d.centerNodes) {
            centerIds.add(n.id);
        }

        // Brücken als Set aus "kleinereId-größereId" speichern (Reihenfolge egal)
        const bridgeKeys = new Set();
        for (const [a, b] of d.bridges) {
            const key = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`;
            bridgeKeys.add(key);
        }

        state.analyseData = {
            articulationIds,
            centerIds,
            bridgeKeys,
        };
    }

    if (state.analyseMode) {
        redraw();
    }
};

/*
 * Debounce-Trick: Wir warten 200ms bevor wir den Ladebalken anzeigen.
 * Wenn der Worker schneller fertig ist (kleine Graphen), sieht man keinen Blitz.
 * clearTimeout löscht den Timer falls refresh() nochmal aufgerufen wird.
 */
// A.I
function requestCompute() {
    clearTimeout(_computeTimer);
    _computeTimer = setTimeout(() => showLoading("Wird ausgewertet…", true), 200);
    worker.postMessage({
        type: "compute",
        graph: {
            nodes: graph.nodes.map(n => ({ id: n.id, label: n.label })),
            edges: graph.edges.map(e => ({ id: e.id, n0: e.node0.id, n1: e.node1.id })),
        },
    });
}

function refresh() {
    redraw();
    autosave();
    requestCompute();
}

function initFileButtons() {
    document.getElementById("btn-layout").addEventListener("click", onLayoutClick);
    document.getElementById("btn-clear").addEventListener("click", onClearClick);
    document.getElementById("btn-load").addEventListener("click", onLoadClick);
    document.getElementById("btn-save").addEventListener("click", onSaveClick);
}

function onLayoutClick() {
    const canvas = document.querySelector("canvas");
    showLoading("Layout wird berechnet…");
    forceDirectedLayoutAsync(graph, canvas.width, canvas.height, setProgress, () => {
        hideLoading();
        refresh();
    });
}

function onClearClick() {
    graph.nodes = [];
    graph.edges = [];
    state.nodeCounter = 0;
    state.selected = null;
    state.edgePending = null;
    state.hoveredNode = null;
    state.hoveredEdge = null;
    state.dragging = null;
    clearAutosave();
    refresh();
}

function onLoadClick() {
    loadCsvData().then(csv => {
        const matrix = parseCsvAdjacencyMatrix(csv);
        const canvas = document.querySelector("canvas");
        buildGraphFromMatrix(matrix, canvas.width, canvas.height, refresh);
    });
}

function onSaveClick() {
    saveCsvData(graph);
}

function main() {
    const canvas = document.querySelector("canvas");

    initDraw(canvas);
    initEvents(canvas, refresh);
    initToolbar();
    initFileButtons();
    initAutosave();
    initRandomModal(refresh);
    initAnalyseMode(redraw);

    refresh();
}

document.addEventListener("DOMContentLoaded", main);
