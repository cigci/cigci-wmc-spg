import { graph, state } from "../graph/state.js";
import { Node } from "../graph/model.js";
import { forceDirectedLayoutAsync } from "../graph/layout.js";
import { showLoading, setLabel, setProgress, hideLoading } from "./loadingBar.js";
import { redraw } from "../render/draw.js";

const MAX_NODES = 10000;

const PRESET_DEFAULT = { nodes: 12,   density: 30, connected: true, max: 50      };
const PRESET_CRAZY   = { nodes: 1000, density: 70, connected: true, max: MAX_NODES };

export function initRandomModal(refresh) {
    const modal      = document.getElementById("random-modal");
    const form       = document.getElementById("random-form");
    const btnOpen    = document.getElementById("btn-random");
    const btnCancel  = document.getElementById("random-cancel");

    const nodesSlider   = document.getElementById("rnd-nodes");
    const nodesNum      = document.getElementById("rnd-nodes-num");
    const densitySlider = document.getElementById("rnd-density");
    const densityVal    = document.getElementById("rnd-density-val");
    const chkConnected  = document.getElementById("rnd-connected");

    const btnDefault = document.getElementById("rnd-preset-default");
    const btnCrazy   = document.getElementById("rnd-preset-crazy");

    applyPreset(PRESET_DEFAULT);

    // Preset-Werte in alle Formularfelder eintragen
    function applyPreset(preset) {
        nodesSlider.max        = preset.max;
        nodesNum.max           = preset.max;
        nodesSlider.value      = preset.nodes;
        nodesNum.value         = preset.nodes;
        densitySlider.value    = preset.density;
        densityVal.textContent = preset.density + "%";
        chkConnected.checked   = preset.connected;
    }

    // Aktiven Preset-Button hervorheben
    function setActivePreset(active) {
        btnDefault.classList.toggle("active", active === "default");
        btnCrazy.classList.toggle("active",   active === "crazy");
    }

    btnDefault.addEventListener("click", () => {
        applyPreset(PRESET_DEFAULT);
        setActivePreset("default");
    });

    btnCrazy.addEventListener("click", () => {
        applyPreset(PRESET_CRAZY);
        setActivePreset("crazy");
    });

    // Slider und Zahlenfeld synchron halten
    nodesSlider.addEventListener("input", () => {
        nodesNum.value = nodesSlider.value;
        setActivePreset(null);
    });

    nodesNum.addEventListener("input", () => {
        nodesSlider.value = nodesNum.value;
        setActivePreset(null);
    });

    densitySlider.addEventListener("input", () => {
        densityVal.textContent = densitySlider.value + "%";
        setActivePreset(null);
    });

    btnOpen.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });

    btnCancel.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    // Klick auf den Hintergrund (außerhalb des Modals) schließt es
    modal.addEventListener("click", e => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });

    form.addEventListener("submit", e => {
        e.preventDefault();

        const parsedNodes   = parseInt(nodesNum.value) || parseInt(nodesSlider.value);
        const n             = Math.max(2, Math.min(MAX_NODES, parsedNodes));
        const density       = parseFloat(densitySlider.value) / 100; // 0–100% → 0.0–1.0
        const connected     = chkConnected.checked;

        modal.classList.add("hidden");
        generateGraph(n, density, connected, refresh);
    });
}

/*
 * Graph-Generierung läuft in 3 Phasen (alle async, damit der Browser nicht einfriert):
 *
 *   Phase 1 (0%–30%):  Knoten erstellen
 *   Phase 2 (30%–60%): Kanten verbinden
 *   Phase 3 (60%–100%): Force-Directed Layout berechnen
 */
function generateGraph(n, density, connected, onDone) {
    resetGraph(n);
    showLoading(`0 / ${n} Knoten`);

    createNodesAsync(n, () => {
        setLabel("0 Kanten");
        setProgress(0.3);

        addEdgesAsync(n, density, connected,
            (edgeCount, pairProgress) => {
                setLabel(`${edgeCount.toLocaleString()} Kanten`);
                setProgress(0.3 + pairProgress * 0.3);
            },
            () => {
                redraw();
                setLabel("Layout wird berechnet…");
                setProgress(0.6);

                forceDirectedLayoutAsync(graph, 1280, 720,
                    (p) => {
                        setProgress(0.6 + p * 0.4);
                        redraw();
                    },
                    () => {
                        hideLoading();
                        if (onDone) {
                            onDone();
                        }
                    }
                );
            }
        );
    });
}

// Knoten in Batches erstellen und dabei den Fortschrittsbalken aktualisieren
function createNodesAsync(n, onDone) {
    const positions = precomputeGridPositions(n, 1280, 720);
    const batchSize = Math.max(1, Math.ceil(n / 50)); // ~50 Frames bis fertig
    let i = 0;

    function batch() {
        const end = Math.min(i + batchSize, n);
        for (; i < end; i++) {
            graph.addNode(new Node(i + 1, positions[i].x, positions[i].y, `N${i + 1}`));
        }
        setLabel(`${i} / ${n} Knoten`);
        setProgress(i / n * 0.3);
        redraw();

        if (i < n) {
            requestAnimationFrame(batch);
        } else {
            onDone();
        }
    }

    requestAnimationFrame(batch);
}

// Gitter-Positionen vorberechnen (mit leichter Zufallsverschiebung)
function precomputeGridPositions(n, width, height) {
    const padding = 60;
    const cols    = Math.ceil(Math.sqrt(n * (width / height)));
    const rows    = Math.ceil(n / cols);
    const cellW   = (width  - padding * 2) / cols;
    const cellH   = (height - padding * 2) / rows;

    return Array.from({ length: n }, (_, i) => ({
        x: Math.round(padding + cellW * (i % cols              + 0.5) + (Math.random() - 0.5) * cellW * 0.3),
        y: Math.round(padding + cellH * (Math.floor(i / cols)  + 0.5) + (Math.random() - 0.5) * cellH * 0.3),
    }));
}

/*
 * Kanten zufällig hinzufügen.
 *
 * Für jedes mögliche Knotenpaar (i,j) mit i < j:
 *   → Zufallszahl < density  → Kante hinzufügen
 *
 * Wenn "connected" aktiv: zuerst einen Spannbaum einfügen (garantiert Zusammenhang),
 * dann erst die Zufallskanten.
 *
 * Set<pairKey> für O(1)-Duplikat-Check:
 *   Ohne Set müssten wir jedes Mal alle Kanten durchsuchen → sehr langsam bei großen Graphen.
 */
function addEdgesAsync(n, density, connected, onProgress, onDone) {
    let edgeId = Date.now();

    if (connected) {
        edgeId = addSpanningTree(edgeId); // Zusammenhang sicherstellen
    }

    // Bereits vorhandene Kanten in einem Set speichern für schnellen Duplikat-Check
    const paired = new Set(graph.edges.map(e => pairKey(e.node0.id, e.node1.id)));

    const totalPairs = n * (n - 1) / 2; // Anzahl möglicher Kanten bei n Knoten
    if (totalPairs === 0) {
        if (onDone) {
            onDone();
        }
        return;
    }

    const batchSize = Math.max(10000, Math.ceil(totalPairs / 20));
    let row = 0, col = 1, processed = 0;

    function batch() {
        const end = Math.min(processed + batchSize, totalPairs);

        while (processed < end) {
            if (Math.random() < density) {
                const key = pairKey(graph.nodes[row].id, graph.nodes[col].id);
                if (!paired.has(key)) {
                    paired.add(key);
                    graph.addEdge(edgeId++, graph.nodes[row], graph.nodes[col]);
                }
            }
            processed++;
            col++;
            if (col >= n) {
                row++;
                col = row + 1; // nächste Zeile der Dreiecksmatrix
            }
        }

        if (onProgress) {
            onProgress(graph.edges.length, processed / totalPairs);
        }

        if (processed < totalPairs) {
            requestAnimationFrame(batch);
        } else {
            if (onDone) {
                onDone();
            }
        }
    }

    requestAnimationFrame(batch);
}

// Einzigartiger Schlüssel für ein Knotenpaar (Reihenfolge egal: A-B = B-A)
function pairKey(a, b) {
    if (a < b) {
        return `${a},${b}`;
    }
    return `${b},${a}`;
}

/*
 * Zufälliger Spannbaum (garantiert Zusammenhang des Graphen).
 *
 * Idee: Knoten nacheinander in den Baum aufnehmen.
 *   Knoten 0: allein im Baum
 *   Knoten 1: mit einem zufälligen bereits im Baum verbinden
 *   Knoten 2: mit einem zufälligen bereits im Baum verbinden
 *   ...
 *
 * Ergebnis: alle Knoten sind verbunden, n-1 Kanten, kein Kreis → Spannbaum.
 */
function addSpanningTree(edgeId) {
    const shuffled = [...graph.nodes].sort(() => Math.random() - 0.5); // zufällige Reihenfolge
    for (let i = 1; i < shuffled.length; i++) {
        const j = Math.floor(Math.random() * i); // zufälliger bereits hinzugefügter Knoten
        graph.addEdge(edgeId++, shuffled[i], shuffled[j]);
    }
    return edgeId;
}

// Graph-Objekt zurücksetzen vor neuer Generierung
function resetGraph(n) {
    graph.nodes       = [];
    graph.edges       = [];
    state.nodeCounter = n;
    state.selected    = null;
    state.edgePending = null;
    state.hoveredNode = null;
    state.hoveredEdge = null;
    state.dragging    = null;
}
