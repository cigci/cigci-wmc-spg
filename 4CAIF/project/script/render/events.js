import { graph, state } from "../graph/state.js";
import { Node } from "../graph/model.js";
import { redraw } from "./draw.js";

let _canvas;
let _refresh;

export function initEvents(canvas, refresh) {
    _canvas = canvas;
    _refresh = refresh;

    // Maus-Events für Desktop
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", onMouseClick);

    // Touch-Events für Mobilgeräte (passive: false → wir rufen e.preventDefault() auf)
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    initMobileResize();
}

/*
 * Das Canvas hat eine interne Auflösung (1280×720), wird aber im Browser
 * kleiner oder größer angezeigt. Deshalb müssen Mauskoordinaten umgerechnet werden.
 *
 * Beispiel: Canvas intern 1280px, im Browser 640px dargestellt.
 *   Klick bei Pixel 320 im Browser → entspricht Pixel 640 intern.
 *   Faktor: 1280 / 640 = 2
 */
function getCanvasCoords(clientX, clientY) {
    const rect = _canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) * (_canvas.width / rect.width),
        y: (clientY - rect.top) * (_canvas.height / rect.height),
    };
}

// A.I
// Werkzeug "Knoten": neuen Knoten an Klickposition erstellen
function tapNode(x, y) {
    state.nodeCounter++;
    graph.addNode(new Node(Date.now(), x, y, `N${state.nodeCounter}`));
    _refresh();
}

// A.I
// Werkzeug "Auswählen": Knoten an Klickposition auswählen (oder Auswahl aufheben)
function tapSelect(x, y) {
    const foundNode = graph.findNodeAt(x, y);
    if (foundNode) {
        state.selected = foundNode.id;
    } else {
        state.selected = null;
    }
    _refresh();
}

// A.I
// Werkzeug "Kante": erster Klick → Startknoten merken, zweiter Klick → Kante zeichnen
function tapEdge(x, y) {
    const hit = graph.findNodeAt(x, y);
    if (!hit) {
        return;
    }

    if (!state.edgePending) {
        state.edgePending = hit; // erster Knoten gewählt → warten auf zweiten
    } else if (state.edgePending.id !== hit.id) {
        graph.addEdge(Date.now(), state.edgePending, hit); // Kante zwischen den zwei Knoten
        state.edgePending = null;
    }

    _refresh();
}

// A.I
// Werkzeug "Löschen": Knoten oder Kante an Klickposition löschen
function tapDelete(x, y) {
    const hitNode = graph.findNodeAt(x, y);
    if (hitNode) {
        if (state.selected === hitNode.id) {
            state.selected = null;
        }
        graph.removeNode(hitNode);
        state.hoveredNode = null;
        _refresh();
        return;
    }

    const hitEdge = graph.findEdgeAt(x, y);
    if (hitEdge) {
        graph.removeEdge(hitEdge);
        state.hoveredEdge = null;
        _refresh();
    }
}

// Leitet Klick ans richtige Werkzeug weiter
function handleTap(x, y) {
    if (state.tool === "node") {
        return tapNode(x, y);
    }
    if (state.tool === "select") {
        return tapSelect(x, y);
    }
    if (state.tool === "edge") {
        return tapEdge(x, y);
    }
    if (state.tool === "delete") {
        return tapDelete(x, y);
    }
}

// A.I
// "Verschieben"-Werkzeug: Knoten anfassen
function onMouseDown(e) {
    if (state.tool !== "move") {
        return;
    }
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hit = graph.findNodeAt(x, y);
    if (hit) {
        state.dragging = hit;
        _canvas.style.cursor = "grabbing";
    }
}

// Knoten loslassen
function onMouseUp() {
    if (state.dragging) {
        state.dragging = null;
        _canvas.style.cursor = "";
    }
}

// A.I
function onMouseMove(e) {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // Knoten ziehen
    if (state.tool === "move" && state.dragging) {
        state.dragging.posX = x;
        state.dragging.posY = y;
        _refresh();
        return;
    }

    // Cursor-Form: Greif-Hand wenn Knoten unter der Maus
    if (state.tool === "move" && graph.findNodeAt(x, y)) {
        _canvas.style.cursor = "grab";
    } else {
        _canvas.style.cursor = "";
    }

    // Hover-Erkennung: Knoten hat Vorrang vor Kante
    const node = graph.findNodeAt(x, y);
    let edge = null;
    if (!node) {
        edge = graph.findEdgeAt(x, y);
    }

    const prevNode = state.hoveredNode;
    const prevEdge = state.hoveredEdge;

    if (node) {
        state.hoveredNode = node.id;
    } else {
        state.hoveredNode = null;
    }

    if (edge) {
        state.hoveredEdge = edge.id;
    } else {
        state.hoveredEdge = null;
    }

    // Nur neu zeichnen wenn sich etwas geändert hat (Performance)
    if (state.hoveredNode !== prevNode || state.hoveredEdge !== prevEdge) {
        redraw();
    }
}

// Maus hat Canvas verlassen → alles zurücksetzen
function onMouseLeave() {
    state.dragging = null;
    state.hoveredNode = null;
    state.hoveredEdge = null;
    _canvas.style.cursor = "";
    redraw();
}

function onMouseClick(e) {
    if (state.tool === "move") {
        return; // "Verschieben" hat kein Klick-Verhalten
    }
    // A.I
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    handleTap(x, y);
}

// Touch-Logik: Startposition merken
let touchStart = null;

// A.I
function onTouchStart(e) {
    e.preventDefault(); // verhindert Scrollen der Seite beim Zeichnen
    const t = e.touches[0];
    touchStart = getCanvasCoords(t.clientX, t.clientY);

    if (state.tool === "move") {
        const hit = graph.findNodeAt(touchStart.x, touchStart.y);
        if (hit) {
            state.dragging = hit;
        }
    }
}

// A.I
// Touch bewegt sich → Knoten mitziehen
function onTouchMove(e) {
    e.preventDefault();
    if (!state.dragging) {
        return;
    }
    const t = e.touches[0];
    const { x, y } = getCanvasCoords(t.clientX, t.clientY);
    state.dragging.posX = x;
    state.dragging.posY = y;
    _refresh();
}

// A.I
// Touch beendet → war es ein Tippen oder ein Ziehen?
function onTouchEnd(e) {
    e.preventDefault();
    const wasDragging = !!state.dragging;
    state.dragging = null;

    if (!wasDragging && touchStart) {
        handleTap(touchStart.x, touchStart.y); // kein Ziehen → normaler Tap
    }
    touchStart = null;
}

// Auf kleinen Bildschirmen: Canvas-Größe an Wrapper anpassen
function initMobileResize() {
    const mq = window.matchMedia("(max-width: 640px)");
    if (!mq.matches) {
        return;
    }

    resizeMobileCanvas();
    window.addEventListener("resize", resizeMobileCanvas);
}

function resizeMobileCanvas() {
    const wrapper = _canvas.parentElement;
    _canvas.width = Math.round(wrapper.clientWidth);
    _canvas.height = Math.round(wrapper.clientHeight);
    _refresh();
}
