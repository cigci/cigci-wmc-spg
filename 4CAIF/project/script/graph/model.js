// Ein Knoten ist ein Punkt im Graphen. Er hat eine Position (x, y) und ein Label (Name).
export class Node {
    constructor(id, posX, posY, label) {
        this.id = id;
        this.posX = posX;
        this.posY = posY;
        this.label = label;
        this.adjacents = []; // Liste von Knoten, die direkt verbunden sind
    }

    // Fügt einen Nachbar-Knoten zur Liste hinzu
    addAdjacent(node) {
        this.adjacents.push(node);
    }

    // Entfernt einen Nachbar-Knoten aus der Liste
    removeAdjacent(node) {
        this.adjacents = this.adjacents.filter(n => n.id !== node.id);
    }
}

// Eine Kante ist eine Linie zwischen zwei Knoten (node0 und node1)
export class Edge {
    constructor(id, node0, node1) {
        this.id = id;
        this.node0 = node0;
        this.node1 = node1;
    }
}

// Der Graph speichert alle Knoten und Kanten
export class Graph {
    constructor(id) {
        this.id = id;
        this.nodes = []; // alle Knoten
        this.edges = []; // alle Kanten
    }

    // Fügt einen neuen Knoten zum Graphen hinzu
    addNode(node) {
        this.nodes.push(node);
    }

    // A.I
    // Löscht einen Knoten und alle seine Verbindungen
    removeNode(node) {
        this.edges = this.edges.filter(e => e.node0.id !== node.id && e.node1.id !== node.id);
        this.nodes.forEach(n => n.removeAdjacent(node));
        this.nodes = this.nodes.filter(n => n.id !== node.id);
    }

    // Erstellt eine neue Kante zwischen zwei Knoten und verbindet sie
    addEdge(id, node0, node1) {
        const edge = new Edge(id, node0, node1);
        this.edges.push(edge);
        node0.addAdjacent(node1);
        node1.addAdjacent(node0);
        return edge;
    }

    // A.I
    // Löscht eine Kante und trennt die zwei Knoten voneinander
    removeEdge(edge) {
        edge.node0.removeAdjacent(edge.node1);
        edge.node1.removeAdjacent(edge.node0);
        this.edges = this.edges.filter(e => e.id !== edge.id);
    }

    // A.I
    // Prüft: Hat der Nutzer auf einen Knoten geklickt?
    // Knoten sind Kreise. Wir messen den Abstand vom Klickpunkt zum Mittelpunkt des Kreises.
    // Math.hypot(a, b) berechnet den Abstand — wie Pythagoras: √(a² + b²)
    // .reverse() → der zuletzt gezeichnete Knoten wird zuerst geprüft (liegt "oben" auf dem Canvas)
    findNodeAt(x, y, radius = 22) {
        const reversedNodes = [...this.nodes].reverse();
        const found = reversedNodes.find(n => Math.hypot(n.posX - x, n.posY - y) <= radius);
        if (found) {
            return found;
        }
        return null;
    }

    // A.I
    // Prüft: Hat der Nutzer auf eine Kante (Linie) geklickt?
    // Eine Linie hat keine Fläche — wir prüfen den Abstand vom Klickpunkt zur Linie.
    findEdgeAt(x, y, threshold = 8) {
        const reversedEdges = [...this.edges].reverse();
        const found = reversedEdges.find(e => {
            // Wie weit geht die Linie in x- und y-Richtung?
            const dx = e.node1.posX - e.node0.posX;
            const dy = e.node1.posY - e.node0.posY;

            // Quadratische Länge der Linie (wir brauchen die echte Länge hier noch nicht)
            const len2 = dx * dx + dy * dy;

            // Sonderfall: beide Knoten sind am gleichen Punkt → Abstand direkt messen
            if (len2 === 0) {
                return Math.hypot(x - e.node0.posX, y - e.node0.posY) <= threshold;
            }

            // t = wo auf der Linie liegt der nächste Punkt zum Klick?
            // t = 0 → ganz bei node0, t = 1 → ganz bei node1, t = 0.5 → Mitte der Linie
            // Math.max/min hält t zwischen 0 und 1 → wir bleiben auf der Linie, nicht daneben
            const t = Math.max(0, Math.min(1, ((x - e.node0.posX) * dx + (y - e.node0.posY) * dy) / len2));

            // Den nächsten Punkt auf der Linie berechnen und Abstand zum Klick messen
            return Math.hypot(x - (e.node0.posX + t * dx), y - (e.node0.posY + t * dy)) <= threshold;
        });

        if (found) {
            return found;
        }
        return null;
    }
}
