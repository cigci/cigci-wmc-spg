import { Graph } from "./model.js";

// Das zentrale State-Objekt — eine einzige Stelle für alle Zustände der App.
// Alle Module lesen und schreiben hier. So weiß jeder immer was gerade passiert.
export const graph = new Graph(1);

export const state = {
    tool:         "select",  // welches Werkzeug ist gerade aktiv? (select/node/edge/delete/move)
    selected:     null,      // ID des aktuell ausgewählten Knotens
    edgePending:  null,      // erster Knoten beim Kanten-Zeichnen (wartet auf zweiten Klick)
    hoveredNode:  null,      // ID des Knotens unter der Maus (für Hover-Effekt)
    hoveredEdge:  null,      // ID der Kante unter der Maus
    dragging:     null,      // Knoten-Objekt das gerade gezogen wird
    nodeCounter:  0,         // zählt hoch → jeder neue Knoten bekommt Name "N1", "N2", ...
    analyseMode:  false,     // wenn true: Brücken/Artikulationen/Zentrum farbig hervorheben
    analyseData:  null,      // { articulationIds: Set, centerIds: Set, bridgeKeys: Set }
};
