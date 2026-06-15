/*
 * DRAW — zeichnet den Graphen auf ein HTML-Canvas.
 *
 * Das Canvas ist wie ein Zeichenblock: wir löschen ihn komplett (clearRect)
 * und zeichnen alles neu. Das passiert bei jeder Änderung (redraw()).
 *
 * Reihenfolge ist wichtig:
 *   1. Kanten zeichnen (sollen "hinter" den Knoten liegen)
 *   2. Knoten zeichnen (sollen "vor" den Kanten liegen)
 */

import { graph, state } from "../graph/state.js";

let _canvas;
let _ctx; // 2D-Kontext: enthält alle Zeichen-Funktionen (arc, lineTo, fillText, ...)

export function initDraw(canvas) {
    _canvas = canvas;
    _ctx = canvas.getContext("2d");
    _canvas.width = 1280;
    _canvas.height = 720;
}

// Kompletten Canvas löschen und neu zeichnen
export function redraw() {
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    _ctx.fillStyle = "#ffffff";
    _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
    const r = nodeRadius(graph.nodes.length); // Knotengröße je nach Graphgröße
    drawEdges(r);
    drawNodes(r);
}

// A.I
function drawEdges(r) {
    let lw;
    if (r < 10) {
        lw = 1; // dünne Linien bei vielen Knoten
    } else {
        lw = 2;
    }

    for (const edge of graph.edges) {
        const isHovered = edge.id === state.hoveredEdge;

        // Im Analyse-Modus: Brücken rot hervorheben.
        // bridgeKey = "kleinereId-größereId" → Reihenfolge der Knoten ist egal
        let isBridge = false;
        if (state.analyseMode && state.analyseData) {
            const key = `${Math.min(edge.node0.id, edge.node1.id)}-${Math.max(edge.node0.id, edge.node1.id)}`;
            isBridge = state.analyseData.bridgeKeys.has(key);
        }

        // Linie von Knoten0 zu Knoten1 zeichnen
        _ctx.beginPath();
        _ctx.moveTo(edge.node0.posX, edge.node0.posY);
        _ctx.lineTo(edge.node1.posX, edge.node1.posY);

        if (isBridge) {
            _ctx.strokeStyle = "#ef4444";              // rot
            _ctx.lineWidth = lw + 2;                 // dicker als normal
        } else if (isHovered) {
            _ctx.strokeStyle = "rgba(200,200,200,0.95)";
            _ctx.lineWidth = lw + 1.5;
        } else {
            _ctx.strokeStyle = "rgba(100,100,100,0.5)";
            _ctx.lineWidth = lw;
        }

        _ctx.stroke();
    }
}

function drawNodes(r) {
    const showLabel = r >= 10; // bei sehr kleinen Knoten kein Label (zu eng)

    for (const node of graph.nodes) {
        const isSelected = node.id === state.selected;
        const isHovered = node.id === state.hoveredNode;

        // erster Knoten beim Kanten-Zeichnen
        let isPending = false;
        if (state.edgePending) {
            isPending = node.id === state.edgePending.id;
        }

        // Im Analyse-Modus: Artikulationen und Zentrum farbig markieren
        let isArticulation = false;
        let isCenter = false;
        if (state.analyseMode && state.analyseData) {
            isArticulation = state.analyseData.articulationIds.has(node.id);
            isCenter = state.analyseData.centerIds.has(node.id);
        }

        // Kreis zeichnen (arc = Bogen von 0 bis 2π = voller Kreis)
        _ctx.beginPath();
        _ctx.arc(node.posX, node.posY, r, 0, Math.PI * 2);

        // Farb-Priorität: pending > selected > Artikulation > Zentrum > hover > normal
        if (isPending) {
            _ctx.fillStyle = "#f5a623";  // orange  = wartet auf zweiten Klick
        } else if (isSelected) {
            _ctx.fillStyle = "#449aa9";  // blau    = ausgewählt
        } else if (isArticulation) {
            _ctx.fillStyle = "#f59e0b";  // gelb    = Artikulation
        } else if (isCenter) {
            _ctx.fillStyle = "#22c55e";  // grün    = Zentrum
        } else if (isHovered) {
            _ctx.fillStyle = "#ff6b72";  // hellrot = hover
        } else {
            _ctx.fillStyle = "#f63b45";  // rot     = normal
        }

        _ctx.fill();

        // Rand des Knotens (heller bei ausgewählt/pending)
        if (isSelected || isPending) {
            _ctx.strokeStyle = "#f3ebe7";
            _ctx.lineWidth = 2;
        } else {
            _ctx.strokeStyle = "rgba(255,255,255,0.25)";
            _ctx.lineWidth = 1;
        }
        _ctx.stroke();

        // Label in der Mitte des Knotens zeichnen
        if (showLabel) {
            const fontSize = Math.max(8, Math.round(r * 0.55)); // A.I
            _ctx.fillStyle = "#f3ebe7";
            _ctx.textAlign = "center";
            _ctx.textBaseline = "middle";
            _ctx.font = `bold ${fontSize}px sans-serif`;
            _ctx.fillText(node.label, node.posX, node.posY);
        }
    }
}

// Knotenradius je nach Graphgröße — bei vielen Knoten kleiner damit alles passt
function nodeRadius(n) {
    if (n <= 30) return 22;
    if (n <= 100) return 16;
    if (n <= 250) return 11;
    if (n <= 500) return 7;
    return 4;
}
