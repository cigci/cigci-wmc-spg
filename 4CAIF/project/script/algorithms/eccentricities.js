import { bfsDistances } from "./distances.js";

/*
 * Exzentrizität eines Knotens = die größte Distanz zu irgendeinem anderen Knoten.
 *
 * Beispiel-Graph:  A — B — C — D
 *
 *   Exzentrizität von A: dist zu B=1, C=2, D=3  → max = 3
 *   Exzentrizität von B: dist zu A=1, C=1, D=2  → max = 2
 *   Exzentrizität von C: dist zu A=2, B=1, D=1  → max = 2
 *   Exzentrizität von D: dist zu A=3, B=2, C=1  → max = 3
 *
 *   eccs = [ {A, ecc:3}, {B, ecc:2}, {C, ecc:2}, {D, ecc:3} ]
 *
 * Sonderfall: Wenn der Graph nicht zusammenhängend ist (z.B. A—B  C—D),
 * kann A den Knoten C/D nie erreichen → ecc = null (unendlich).
 */

// A.I
export function computeEccs(graph) {
    return graph.nodes.map(node => {
        const dist = bfsDistances(graph, node); // alle Distanzen von diesem Knoten aus

        let ecc;
        if (dist.size < graph.nodes.length) {
            ecc = null; // nicht alle Knoten erreichbar → kein gültiger Wert
        } else {
            ecc = Math.max(...dist.values()); // größte Distanz = Exzentrizität
        }

        return { id: node.id, label: node.label, ecc, reachable: dist.size };
    });
}
