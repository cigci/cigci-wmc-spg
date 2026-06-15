/*
 * Komponenten = zusammenhängende Teile des Graphen.
 *
 * Beispiel:  A — B — C     D — E
 *
 *   Komponente 1: [A, B, C]
 *   Komponente 2: [D, E]
 *
 * Idee: BFS von jedem noch nicht besuchten Knoten starten.
 * Alles was man von dort aus erreicht = eine Komponente.
 * Dann weiter zum nächsten unbesuchten Knoten → neue Komponente.
 */

// A.I
export function components(graph) {
    const visited = new Set(); // welche Knoten wurden schon einer Komponente zugeordnet?
    const result = [];

    for (const node of graph.nodes) {
        if (visited.has(node.id)) {
            continue; // bereits zugeordnet → überspringen
        }

        // neuen BFS-Durchlauf starten → findet eine komplette Komponente
        const component = [];
        const queue = [node];
        visited.add(node.id);

        while (queue.length > 0) {
            const current = queue.shift();
            component.push(current);

            for (const neighbor of current.adjacents) {
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    queue.push(neighbor); // Nachbar gehört zur selben Komponente
                }
            }
        }

        result.push(component); // fertige Komponente speichern
    }

    return result; // Array von Arrays: [[A,B,C], [D,E], ...]
}

/*
 * ARTIKULATIONEN UND BRÜCKEN — Tarjan-Algorithmus
 * ================================================
 *
 * GRUNDIDEE:
 * Wir gehen den Graphen einmal durch (DFS = Tiefensuche).
 * Dabei merken wir uns für jeden Knoten zwei Zahlen:
 *
 *   disc[knoten]  = "Besuchsnummer"
 *                   In welcher Reihenfolge haben wir diesen Knoten besucht?
 *                   Erster Knoten → 0, zweiter → 1, dritter → 2, usw.
 *
 *   low[knoten]   = "Rückreichweite"
 *                   Wie weit zurück kann man von diesem Knoten aus kommen,
 *                   wenn man AUCH Rückwärtskanten (Abkürzungen) benutzt?
 *                   low ist immer ≤ disc des eigenen Knotens.
 *
 * BEISPIEL mit 4 Knoten: A → B → C → D, und C hat eine Rückwärtskante zu A
 *
 *   disc: A=0, B=1, C=2, D=3
 *   low:  A=0, B=0, C=0, D=3
 *                              ↑
 *                   D kann nur sich selbst erreichen (kein Weg zurück)
 *                   Also: low[D] = disc[D] = 3
 *
 * BRÜCKE erkennen:
 *   Kante (U → V) ist eine Brücke, wenn:  low[V] > disc[U]
 *   Das bedeutet: V und seine Nachfolger können U NICHT umgehen.
 *   Wenn wir die Kante entfernen, ist V abgeschnitten.
 *
 *   Im Beispiel: low[D]=3 > disc[C]=2  →  Kante C–D ist eine Brücke ✓
 *
 * ARTIKULATION erkennen:
 *   Fall 1 — Wurzel (kein Elternknoten):
 *     Ist eine Artikulation, wenn sie mehr als 1 Kind hat.
 *     (Weil das Entfernen der Wurzel alle Kinder voneinander trennt.)
 *
 *   Fall 2 — Normaler Knoten U mit Kind V:
 *     Ist eine Artikulation, wenn:  low[V] >= disc[U]
 *     Das bedeutet: V kann U NICHT umgehen.
 *     Wenn wir U entfernen, ist V abgeschnitten.
 *
 *     Unterschied zur Brücke: >= statt > (weil der Knoten selbst auch abschneidet)
 *
 * WARUM nicht einfacher?
 *   Die einfache Alternative wäre: jede Kante entfernen und prüfen ob der Graph
 *   noch zusammenhängt. Das funktioniert, ist aber sehr langsam (O(E² + E·V)).
 *   Tarjan löst es in einem einzigen Durchgang: O(V + E).
 */

// A.I
export function articulationsAndBridges(graph) {
    const disc = new Map();         // Besuchsnummer: wann wurde dieser Knoten zuerst besucht?
    const low = new Map();          // Rückreichweite: wie weit zurück kommt man von hier aus?
    const parent = new Map();       // welcher Knoten hat diesen Knoten besucht? (DFS-Elternknoten)
    const articulationSet = new Set();
    const bridges = [];
    let timer = 0;                  // zählt hoch bei jedem neuen Besuch

    function dfs(node) {
        disc.set(node.id, timer);   // Besuchsnummer vergeben
        low.set(node.id, timer);    // Rückreichweite startet gleich wie disc
        timer++;
        let childCount = 0;         // wie viele Kinder hat dieser Knoten im DFS-Baum?

        for (const neighbor of node.adjacents) {
            if (!disc.has(neighbor.id)) {
                // Nachbar noch nicht besucht → normale DFS-Kante (Baumkante)
                childCount++;
                parent.set(neighbor.id, node.id); // node ist Elternknoten von neighbor
                dfs(neighbor);

                // nach dem Besuch: low des Kindes nach oben weitergeben
                low.set(node.id, Math.min(low.get(node.id), low.get(neighbor.id)));

                // Artikulation prüfen (Wurzel-Fall: kein Elternknoten, mehr als 1 Kind)
                if (!parent.has(node.id) && childCount > 1) {
                    articulationSet.add(node.id);
                }

                // Artikulation prüfen (normaler Fall: Kind kann nicht über node hinaus)
                if (parent.has(node.id) && low.get(neighbor.id) >= disc.get(node.id)) {
                    articulationSet.add(node.id);
                }

                // Brücke prüfen: Kind kann node selbst nicht umgehen
                if (low.get(neighbor.id) > disc.get(node.id)) {
                    bridges.push([node, neighbor]);
                }
            } else if (neighbor.id !== parent.get(node.id)) {
                // Nachbar bereits besucht und nicht der Elternknoten → Rückwärtskante (Abkürzung)
                // low aktualisieren: wir können bis zu disc[neighbor] zurückreichen
                low.set(node.id, Math.min(low.get(node.id), disc.get(neighbor.id)));
            }
        }
    }

    for (const node of graph.nodes) {
        if (!disc.has(node.id)) {
            dfs(node); // für jeden unbesuchten Knoten neuen DFS starten
        }
    }

    return {
        articulations: graph.nodes.filter(n => articulationSet.has(n.id)),
        bridges,
    };
}
