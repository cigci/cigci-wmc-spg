/*
 * FORCE-DIRECTED LAYOUT (Fruchterman-Reingold)
 * =============================================
 * Idee: Knoten verhalten sich wie Magnete und Federn gleichzeitig.
 *
 *   ABSTOSUNG  — alle Knoten stoßen sich gegenseitig ab (wie Magnete).
 *                Kraft = k² / Abstand  → je näher, desto stärker.
 *
 *   ANZIEHUNG  — verbundene Knoten ziehen sich an (wie Federn).
 *                Kraft = Abstand² / k  → je weiter, desto stärker.
 *
 *   k = idealer Abstand zwischen zwei Knoten.
 *       k = √(Fläche / Anzahl Knoten)  → mehr Knoten = enger.
 *
 *   TEMPERATUR (temp) — wie weit darf sich ein Knoten pro Iteration bewegen?
 *       Startet hoch → Knoten können sich viel bewegen.
 *       Kühlt jede Runde ab → am Ende nur noch kleine Korrekturen.
 *       Wie ein heißes Metall das langsam erstarrt.
 *
 * ASYNC-VERSION: läuft in kleinen Batches über requestAnimationFrame.
 * So bleibt der Browser reaktionsfähig und zeigt einen Fortschrittsbalken.
 */

// A.I
export function forceDirectedLayoutAsync(graph, width = 1280, height = 720, onProgress, onDone) {
    const n = graph.nodes.length;
    if (n === 0) {
        if (onDone) {
            onDone();
        }
        return;
    }
    if (n === 1) {
        graph.nodes[0].posX = width / 2;
        graph.nodes[0].posY = height / 2;
        if (onDone) {
            onDone();
        }
        return;
    }

    // Startposition: Kreis für kleine Graphen, Gitter für große
    if (n > 100) {
        gridInit(graph.nodes, width, height);
    } else {
        circleInit(graph.nodes, width, height);
    }

    const iterations = calcIterations(n);
    if (iterations === 0) {
        if (onProgress) {
            onProgress(1);
        }
        if (onDone) {
            onDone();
        }
        return;
    }

    const doEdgeRepulsion = n <= 150; // Kanten stoßen Knoten ab — nur für kleine Graphen (teuer)
    const batchSize = Math.max(1, Math.ceil(iterations / 30)); // ~30 Frames bis fertig

    const k = Math.sqrt((width * height) / n); // idealer Knotenabstand
    const padding = 60;                         // Mindestabstand zum Rand
    let temp = width / 8;                       // Starttemperatur
    const cooling = temp / (iterations + 1);    // wie viel kühlt pro Iteration?

    const nodeIndex = new Map(graph.nodes.map((node, i) => [node.id, i])); // ID → Array-Index
    const disp = Array.from({ length: n }, () => ({ x: 0, y: 0 }));       // Verschiebungsvektor pro Knoten
    let iter = 0;

    function runBatch() {
        const end = Math.min(iter + batchSize, iterations);

        for (; iter < end; iter++) {
            // Verschiebungsvektoren zurücksetzen
            for (let i = 0; i < n; i++) {
                disp[i].x = 0;
                disp[i].y = 0;
            }

            // ABSTOSSUNG: jedes Knotenpaar stößt sich ab
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const dx = graph.nodes[i].posX - graph.nodes[j].posX;
                    const dy = graph.nodes[i].posY - graph.nodes[j].posY;
                    const dist = Math.max(Math.hypot(dx, dy), 1);
                    const force = (k * k) / dist;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    disp[i].x += fx;
                    disp[i].y += fy;
                    disp[j].x -= fx;
                    disp[j].y -= fy;
                }
            }

            // ANZIEHUNG: verbundene Knoten ziehen sich an
            for (const edge of graph.edges) {
                const i = nodeIndex.get(edge.node0.id);
                const j = nodeIndex.get(edge.node1.id);
                const dx = graph.nodes[i].posX - graph.nodes[j].posX;
                const dy = graph.nodes[i].posY - graph.nodes[j].posY;
                const dist = Math.max(Math.hypot(dx, dy), 1);
                const force = (dist * dist) / k;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                disp[i].x -= fx;
                disp[i].y -= fy;
                disp[j].x += fx;
                disp[j].y += fy;
            }

            // KANTEN-ABSTOSSUNG: Knoten werden von Kanten weggedrückt (verhindert Überlappungen)
            if (doEdgeRepulsion) {
                for (let i = 0; i < n; i++) {
                    for (const edge of graph.edges) {
                        const u = nodeIndex.get(edge.node0.id);
                        const w = nodeIndex.get(edge.node1.id);
                        if (u === i || w === i) {
                            continue; // eigene Kanten ignorieren
                        }
                        const { x: cx, y: cy } = closestPointOnSegment(
                            graph.nodes[i].posX, graph.nodes[i].posY,
                            graph.nodes[u].posX, graph.nodes[u].posY,
                            graph.nodes[w].posX, graph.nodes[w].posY
                        );
                        const dx = graph.nodes[i].posX - cx;
                        const dy = graph.nodes[i].posY - cy;
                        const dist = Math.max(Math.hypot(dx, dy), 1);
                        if (dist < k) {
                            const force = (k * k) / (dist * dist) * 0.5;
                            disp[i].x += (dx / dist) * force;
                            disp[i].y += (dy / dist) * force;
                        }
                    }
                }
            }

            // POSITIONSUPDATE: Knoten verschieben, aber nicht weiter als temp und nicht aus dem Bild
            for (let i = 0; i < n; i++) {
                const d = Math.max(Math.hypot(disp[i].x, disp[i].y), 1);
                const scale = Math.min(d, temp) / d; // temp begrenzt die maximale Verschiebung
                graph.nodes[i].posX = Math.round(Math.max(padding, Math.min(width - padding, graph.nodes[i].posX + disp[i].x * scale)));
                graph.nodes[i].posY = Math.round(Math.max(padding, Math.min(height - padding, graph.nodes[i].posY + disp[i].y * scale)));
            }

            temp = Math.max(temp - cooling, 0.5); // abkühlen
        }

        if (onProgress) {
            onProgress(iter / iterations);
        }

        if (iter < iterations) {
            requestAnimationFrame(runBatch); // nächsten Frame abwarten → Browser bleibt reaktiv
        } else {
            if (onDone) {
                onDone();
            }
        }
    }

    requestAnimationFrame(runBatch);
}

// A.I
// Synchrone Version — wird für den Worker verwendet (kein Browser-Kontext nötig)
export function forceDirectedLayout(graph, width = 1280, height = 720) {
    const n = graph.nodes.length;
    if (n === 0) {
        return;
    }
    if (n === 1) {
        graph.nodes[0].posX = width / 2;
        graph.nodes[0].posY = height / 2;
        return;
    }

    if (n > 100) {
        gridInit(graph.nodes, width, height);
    } else {
        circleInit(graph.nodes, width, height);
    }

    const iterations = calcIterations(n);
    if (iterations === 0) {
        return;
    }

    const doEdgeRepulsion = n <= 150;

    const k = Math.sqrt((width * height) / n);
    const padding = 60;
    let temp = width / 8;
    const cooling = temp / (iterations + 1);

    const nodeIndex = new Map(graph.nodes.map((node, i) => [node.id, i]));
    const disp = Array.from({ length: n }, () => ({ x: 0, y: 0 }));

    for (let iter = 0; iter < iterations; iter++) {

        for (let i = 0; i < n; i++) {
            disp[i].x = 0;
            disp[i].y = 0;
        }

        // Repulsion
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const dx = graph.nodes[i].posX - graph.nodes[j].posX;
                const dy = graph.nodes[i].posY - graph.nodes[j].posY;
                const dist = Math.max(Math.hypot(dx, dy), 1);
                const force = (k * k) / dist;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                disp[i].x += fx;
                disp[i].y += fy;
                disp[j].x -= fx;
                disp[j].y -= fy;
            }
        }

        // Attraction
        for (const edge of graph.edges) {
            const i = nodeIndex.get(edge.node0.id);
            const j = nodeIndex.get(edge.node1.id);
            const dx = graph.nodes[i].posX - graph.nodes[j].posX;
            const dy = graph.nodes[i].posY - graph.nodes[j].posY;
            const dist = Math.max(Math.hypot(dx, dy), 1);
            const force = (dist * dist) / k;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            disp[i].x -= fx;
            disp[i].y -= fy;
            disp[j].x += fx;
            disp[j].y += fy;
        }

        // Edge-Node Repulsion (nur für kleine Graphen)
        if (doEdgeRepulsion) {
            for (let i = 0; i < n; i++) {
                for (const edge of graph.edges) {
                    const u = nodeIndex.get(edge.node0.id);
                    const w = nodeIndex.get(edge.node1.id);
                    if (u === i || w === i) {
                        continue;
                    }

                    const { x: cx, y: cy } = closestPointOnSegment(
                        graph.nodes[i].posX, graph.nodes[i].posY,
                        graph.nodes[u].posX, graph.nodes[u].posY,
                        graph.nodes[w].posX, graph.nodes[w].posY
                    );

                    const dx = graph.nodes[i].posX - cx;
                    const dy = graph.nodes[i].posY - cy;
                    const dist = Math.max(Math.hypot(dx, dy), 1);

                    if (dist < k) {
                        const force = (k * k) / (dist * dist) * 0.5;
                        disp[i].x += (dx / dist) * force;
                        disp[i].y += (dy / dist) * force;
                    }
                }
            }
        }

        for (let i = 0; i < n; i++) {
            const d = Math.max(Math.hypot(disp[i].x, disp[i].y), 1);
            const scale = Math.min(d, temp) / d;
            graph.nodes[i].posX = Math.round(
                Math.max(padding, Math.min(width - padding, graph.nodes[i].posX + disp[i].x * scale))
            );
            graph.nodes[i].posY = Math.round(
                Math.max(padding, Math.min(height - padding, graph.nodes[i].posY + disp[i].y * scale))
            );
        }

        temp = Math.max(temp - cooling, 0.5);
    }
}

// Iterationszahl je nach Graphgröße: große Graphen brauchen weniger Iterationen (zu langsam sonst)
function calcIterations(n) {
    if (n <= 30) return 600;
    if (n <= 100) return 300;
    if (n <= 300) return 80;
    return 0; // zu groß: nur Gitter, kein Force-Directed
}

// A.I
// Startpositionen auf einem Kreis — gut für kleine Graphen (symmetrisch)
function circleInit(nodes, width, height) {
    const n = nodes.length;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.35;

    nodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2; // gleichmäßig verteilt, oben anfangen
        node.posX = Math.round(cx + r * Math.cos(angle));
        node.posY = Math.round(cy + r * Math.sin(angle));
    });
}

// A.I
// Startpositionen im Gitter — für große Graphen (Kreis wäre zu eng)
function gridInit(nodes, width, height) {
    const n = nodes.length;
    const padding = 60;
    const cols = Math.ceil(Math.sqrt(n * (width / height))); // Spaltenanzahl proportional zum Seitenverhältnis
    const rows = Math.ceil(n / cols);
    const cellW = (width - padding * 2) / cols;
    const cellH = (height - padding * 2) / rows;

    nodes.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        // leichte Zufallsverschiebung damit Force-Directed nicht in Symmetrien stecken bleibt
        node.posX = Math.round(padding + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.4);
        node.posY = Math.round(padding + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.4);
    });
}

// A.I
// Nächster Punkt auf einer Linie (ax,ay)→(bx,by) zum Punkt (px,py)
// Wird für die Kanten-Knoten-Abstoßung gebraucht
function closestPointOnSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) {
        return { x: ax, y: ay }; // Linie hat Länge 0 → Startpunkt zurückgeben
    }
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)); // t ∈ [0,1]
    return { x: ax + t * dx, y: ay + t * dy };
}
