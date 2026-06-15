import { graph, state } from "../graph/state.js";
import { Node } from "../graph/model.js";
import { forceDirectedLayoutAsync } from "../graph/layout.js";
import { showLoading, setProgress, hideLoading } from "./loadingBar.js";

// Öffnet einen Datei-Dialog und gibt den Inhalt der gewählten CSV-Datei zurück (als Promise)
export function loadCsvData() {
    return new Promise((resolve, reject) => {
        // Unsichtbares <input type="file"> erstellen und klicken → öffnet Datei-Dialog
        const input  = document.createElement("input");
        input.type   = "file";
        input.accept = ".csv";

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload  = (e) => resolve(e.target.result); // Dateiinhalt als Text zurückgeben
            reader.onerror = reject;
            reader.readAsText(file);
        };

        input.click();
    });
}

/*
 * Adjazenzmatrix aus CSV-Text parsen.
 *
 * Erwartetes Format (Semikolon-getrennt):
 *   0;1;0;1
 *   1;0;1;0
 *   0;1;0;1
 *   1;0;1;0
 *
 * Ergebnis: 2D-Array aus Zahlen → matrix[i][j] = 1 bedeutet Kante zwischen Knoten i und j.
 */
export function parseCsvAdjacencyMatrix(csvText) {
    return csvText
        .trim()
        .split("\n")                                           // Zeilen trennen
        .map(row => row.trim().split(";").map(Number));        // jede Zeile: Spalten trennen, zu Zahlen umwandeln
}

/*
 * Graph aus einer Adjazenzmatrix aufbauen und automatisch layouten.
 *
 * Die Matrix ist symmetrisch (ungerichteter Graph):
 *   matrix[i][j] === matrix[j][i]
 * Deshalb prüfen wir nur j > i — sonst würden Kanten doppelt eingefügt.
 */
export function buildGraphFromMatrix(matrix, canvasWidth = 1280, canvasHeight = 720, onDone) {
    const n = matrix.length;

    // Graph zurücksetzen
    graph.nodes       = [];
    graph.edges       = [];
    state.nodeCounter = n;
    state.selected    = null;
    state.edgePending = null;
    state.hoveredNode = null;
    state.hoveredEdge = null;
    state.dragging    = null;

    // Knoten N1, N2, ... Nn erstellen (Position erstmal 0,0 — wird durch Layout gesetzt)
    for (let i = 0; i < n; i++) {
        graph.addNode(new Node(i + 1, 0, 0, `N${i + 1}`));
    }

    // Kanten aus der oberen Dreiecksmatrix lesen (i < j → keine Duplikate)
    let edgeId = Date.now();
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (matrix[i][j] === 1) {
                graph.addEdge(edgeId++, graph.nodes[i], graph.nodes[j]);
            }
        }
    }

    // Layout berechnen (async, zeigt Fortschrittsbalken)
    showLoading("Graph wird geladen…");
    forceDirectedLayoutAsync(graph, canvasWidth, canvasHeight, setProgress, () => {
        hideLoading();
        if (onDone) {
            onDone();
        }
    });
}

/*
 * Aktuellen Graphen als Adjazenzmatrix in eine CSV-Datei exportieren.
 *
 * Ablauf:
 *   1. Leere n×n Matrix erstellen
 *   2. Für jede Kante: matrix[i][j] = matrix[j][i] = 1
 *   3. Matrix als Semikolon-getrennten Text ausgeben
 *   4. Als Datei herunterladen
 */
export function saveCsvData(graph) {
    const n = graph.nodes.length;
    if (n === 0) {
        return;
    }

    // Map: Knoten-ID → Zeilenindex in der Matrix
    const nodeIndex = new Map(graph.nodes.map((node, i) => [node.id, i]));
    const matrix    = Array.from({ length: n }, () => new Array(n).fill(0));

    for (const edge of graph.edges) {
        const i = nodeIndex.get(edge.node0.id);
        const j = nodeIndex.get(edge.node1.id);
        matrix[i][j] = 1;
        matrix[j][i] = 1; // symmetrisch (ungerichteter Graph)
    }

    const csv = matrix.map(row => row.join(";")).join("\n");
    downloadFile(csv, "graph.csv", "text/csv");
}

// Erstellt einen temporären Download-Link und klickt ihn automatisch an
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob); // temporäre URL für den Blob erstellen
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url); // URL wieder freigeben
}
