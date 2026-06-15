/*
 * Radius, Durchmesser und Zentrum — alle basieren auf den Exzentrizitäten.
 *
 * Beispiel:  A — B — C — D
 *
 *   Exzentrizitäten:  A=3,  B=2,  C=2,  D=3
 *
 *   RADIUS = kleinste Exzentrizität = 2
 *     → Der Knoten der am wenigsten "weit weg" von allen anderen ist.
 *
 *   DURCHMESSER = größte Exzentrizität = 3
 *     → Der längste kürzeste Weg im ganzen Graphen (von A nach D).
 *
 *   ZENTRUM = alle Knoten mit ecc == Radius → [B, C]
 *     → Das sind die "zentralsten" Knoten im Graphen.
 *     → Stell dir vor: Du willst ein Lager bauen, von dem aus
 *       alle Orte möglichst schnell erreichbar sind.
 *       Das Lager baust du ins Zentrum.
 *
 *   Visuell:
 *     A — B — C — D
 *         ↑   ↑
 *      Zentrum (ecc=2, nicht zu weit von niemandem)
 *
 * Knoten mit ecc=null werden ignoriert (nicht zusammenhängender Graph).
 */

// A.I
// Radius = der Knoten der am "zentralsten" liegt (kleinste max-Distanz)
export function getRadius(eccs) {
    const finite = eccs.filter(e => e.ecc !== null); // nur erreichbare Knoten
    if (finite.length === 0) {
        return null;
    }
    return Math.min(...finite.map(e => e.ecc));
}

// A.I
// Durchmesser = der längste kürzeste Weg im ganzen Graphen
export function getDiameter(eccs) {
    const finite = eccs.filter(e => e.ecc !== null); // nur erreichbare Knoten
    if (finite.length === 0) {
        return null;
    }
    return Math.max(...finite.map(e => e.ecc));
}

// A.I
// Zentrum = alle Knoten deren Exzentrizität gleich dem Radius ist
export function getCenterNodes(eccs) {
    const r = getRadius(eccs);
    if (r === null) {
        return [];
    }
    const centerNodes = eccs.filter(e => e.ecc === r);
    return centerNodes.map(e => ({ id: e.id, label: e.label }));
}
