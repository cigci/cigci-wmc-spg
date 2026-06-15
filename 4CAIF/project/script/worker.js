/*
 * WEB WORKER — läuft in einem eigenen Thread, getrennt vom Browser.
 *
 * Der Worker empfängt rohe Graph-Daten (nur IDs und Positionen),
 * baut daraus ein echtes Graph-Objekt, rechnet alles durch,
 * und schickt die Ergebnisse zurück an app.js.
 *
 * Warum rohe Daten und nicht direkt das graph-Objekt?
 * Worker und Hauptthread können keine Objekte teilen — alles wird als
 * JSON-Kopie übertragen (strukturierter Klon). Deshalb wird der Graph
 * hier in rebuildGraph() neu zusammengebaut.
 */

import { components, articulationsAndBridges } from "./algorithms/components.js";
import { computeEccs } from "./algorithms/eccentricities.js";
import { getRadius, getDiameter, getCenterNodes } from "./algorithms/metrics.js";

/*
 * Aus den übertragenen Rohdaten ein vollständiges Graph-Objekt bauen.
 * Besonders wichtig: adjacents-Listen aufbauen, die die Algorithmen brauchen.
 *
 * Rohdaten aus app.js:
 *   nodes: [{ id, label }, ...]
 *   edges: [{ id, n0: KnotenId, n1: KnotenId }, ...]
 */

// A.I
function rebuildGraph(data) {
    const nodeMap = new Map(); // ID → Knoten-Objekt (für schnellen Zugriff beim Kanten-Aufbau)

    const nodes = data.nodes.map(n => {
        const node = { id: n.id, label: n.label, adjacents: [] };
        nodeMap.set(n.id, node);
        return node;
    });

    const edges = data.edges.map(e => {
        const n0 = nodeMap.get(e.n0);
        const n1 = nodeMap.get(e.n1);
        n0.adjacents.push(n1); // Nachbarlisten füllen (ungerichteter Graph → beide Seiten)
        n1.adjacents.push(n0);
        return { id: e.id, node0: n0, node1: n1 };
    });

    return { nodes, edges };
}

// A.I
// Nachricht von app.js empfangen → rechnen → Ergebnis zurückschicken
self.onmessage = function (e) {
    if (e.data.type !== "compute") {
        return;
    }

    const graph = rebuildGraph(e.data.graph);
    const n = graph.nodes.length;

    if (n === 0) {
        self.postMessage({ type: "results", isEmpty: true });
        return;
    }

    const eccs = computeEccs(graph);      // Exzentrizität jedes Knotens
    const r = getRadius(eccs);          // kleinste Exzentrizität
    const d = getDiameter(eccs);        // größte Exzentrizität
    const centerNodes = getCenterNodes(eccs);     // Knoten mit ecc == Radius

    const comps = components(graph);              // zusammenhängende Teile
    const { articulations, bridges } = articulationsAndBridges(graph); // Tarjan

    // Komponenten: nur ID und Label zurückschicken
    const compsSimple = comps.map(comp => {
        return comp.map(node => ({ id: node.id, label: node.label }));
    });

    // Artikulationen: nur ID und Label zurückschicken
    const articulationsSimple = articulations.map(n => ({ id: n.id, label: n.label }));

    // Brücken: nur ID und Label zurückschicken
    const bridgesSimple = bridges.map(([a, b]) => {
        return [{ id: a.id, label: a.label }, { id: b.id, label: b.label }];
    });

    self.postMessage({
        type: "results",
        isEmpty: false,
        data: {
            nodeCount: n,
            edgeCount: graph.edges.length,
            eccs,
            r,
            d,
            centerNodes,
            comps: compsSimple,
            articulations: articulationsSimple,
            bridges: bridgesSimple,
        },
    });
};
