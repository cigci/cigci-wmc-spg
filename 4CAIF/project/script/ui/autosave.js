/*
 * AUTOSAVE — speichert den Graphen im Browser-Speicher (localStorage).
 *
 * localStorage ist wie ein kleines Notizbuch das der Browser für diese Seite führt.
 * Die Daten bleiben auch nach dem Schließen des Tabs erhalten.
 *
 * Wir speichern den Graphen als JSON-Text:
 *   JSON.stringify({ nodes: [...], edges: [...] })  →  String (Text)
 *   JSON.parse(text)                                →  Objekt zurück
 */

import { graph, state } from "../graph/state.js";
import { Node } from "../graph/model.js";

const KEY        = "spg-graph";         // Schlüssel unter dem der Graph gespeichert wird
const KEY_TOGGLE = "spg-graph-autosave"; // Schlüssel für den Ein/Aus-Zustand des Toggles

let enabled = false;

export function initAutosave() {
    const toggle = document.getElementById("toggle-autosave");

    // Gespeicherten Toggle-Zustand laden ("false" als String, weil localStorage nur Strings kennt)
    enabled = localStorage.getItem(KEY_TOGGLE) !== "false";
    toggle.checked = enabled;

    toggle.addEventListener("change", onToggleChange);

    if (enabled) {
        restoreGraph(); // beim Start: gespeicherten Graphen wiederherstellen
    }
}

// Aktuellen Graphen als JSON in localStorage speichern
export function autosave() {
    if (!enabled) {
        return;
    }

    const data = {
        nodes:       graph.nodes.map(n => ({ id: n.id, posX: n.posX, posY: n.posY, label: n.label })),
        edges:       graph.edges.map(e => ({ id: e.id, n0: e.node0.id, n1: e.node1.id })),
        nodeCounter: state.nodeCounter,
    };

    localStorage.setItem(KEY, JSON.stringify(data));
}

// Gespeicherten Graphen löschen (z.B. nach "Leeren")
export function clearAutosave() {
    localStorage.removeItem(KEY);
}

function onToggleChange(e) {
    enabled = e.target.checked;
    localStorage.setItem(KEY_TOGGLE, enabled); // Zustand merken
}

// Gespeicherten Graphen aus localStorage laden und wiederherstellen
function restoreGraph() {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
        return; // nichts gespeichert → nichts tun
    }

    try {
        const data = JSON.parse(raw);

        graph.nodes = [];
        graph.edges = [];

        // Zuerst alle Knoten erstellen
        for (const n of data.nodes) {
            graph.addNode(new Node(n.id, n.posX, n.posY, n.label));
        }

        // Map für schnellen Zugriff: ID → Knoten-Objekt
        const nodeById = new Map(graph.nodes.map(n => [n.id, n]));

        // Dann Kanten wiederherstellen (Knoten müssen vorher existieren)
        for (const e of data.edges) {
            const n0 = nodeById.get(e.n0);
            const n1 = nodeById.get(e.n1);
            if (n0 && n1) {
                graph.addEdge(e.id, n0, n1);
            }
        }

        if (data.nodeCounter !== undefined) {
            state.nodeCounter = data.nodeCounter;
        } else {
            state.nodeCounter = graph.nodes.length;
        }
    } catch {
        // Gespeicherte Daten sind kaputt → löschen und neu anfangen
        localStorage.removeItem(KEY);
    }
}
