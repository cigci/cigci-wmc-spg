/*
 * BFS (Breitensuche) — Distanzen von einem Startknoten aus
 *
 * Idee: Wir breiten uns wie eine Welle aus.
 * Zuerst alle Nachbarn (Distanz 1), dann deren Nachbarn (Distanz 2), usw.
 *
 * Beispiel-Graph:  A — B — C
 *                      |
 *                      D
 *
 * Start bei A:
 *   Runde 1 → besuche B         (Distanz 1)
 *   Runde 2 → besuche C, D      (Distanz 2)
 *
 * Ergebnis: dist = { A:0, B:1, C:2, D:2 }
 */

// A.I
export function bfsDistances(graph, startNode) {
    const dist = new Map();  // speichert: Knoten-ID → Distanz vom Start
    const queue = [startNode]; // Warteschlange: wer kommt als nächstes dran?
    dist.set(startNode.id, 0); // Startknoten hat Distanz 0

    while (queue.length > 0) {
        const current = queue.shift(); // nächsten Knoten aus der Warteschlange holen

        for (const neighbor of current.adjacents) {
            if (!dist.has(neighbor.id)) {               // noch nicht besucht?
                dist.set(neighbor.id, dist.get(current.id) + 1); // Distanz = Eltern + 1
                queue.push(neighbor);                   // in Warteschlange für nächste Runde
            }
        }
    }

    // Wenn dist.size < Anzahl Knoten → Graph nicht zusammenhängend (manche Knoten unerreichbar)
    return dist;
}
