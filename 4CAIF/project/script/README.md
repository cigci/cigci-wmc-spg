# SPG GraphTool – Wie funktioniert alles?

Dieses Dokument erklärt Schritt für Schritt wie das Projekt aufgebaut ist und was jede Datei macht.

---

## Verzeichnisstruktur

```
script/
├── app.js                    ← Startpunkt der App
├── worker.js                 ← Algorithmen laufen hier (im Hintergrund)
│
├── graph/
│   ├── model.js              ← Was ist ein Knoten? Was ist eine Kante?
│   ├── state.js              ← Aktueller Zustand der App (was ist ausgewählt?)
│   └── layout.js             ← Knoten automatisch anordnen
│
├── render/
│   ├── draw.js               ← Zeichnet alles auf den Canvas
│   └── events.js             ← Reagiert auf Maus und Touch
│
├── algorithms/
│   ├── distances.js          ← BFS: Abstände zwischen Knoten berechnen
│   ├── eccentricities.js     ← Exzentrizität jedes Knotens berechnen
│   ├── metrics.js            ← Radius, Durchmesser und Zentrum
│   ├── components.js         ← Komponenten, Artikulationen, Brücken (Tarjan)
│   └── TARJAN.md             ← Erklärung des Tarjan-Algorithmus
│
└── ui/
    ├── toolbar.js            ← Tool-Buttons in der Sidebar
    ├── autosave.js           ← Automatisch speichern (localStorage)
    ├── analyseMode.js        ← Analyse-Toggle (Farben im Canvas)
    ├── randomModal.js        ← Zufälligen Graphen erstellen
    ├── results.js            ← Ergebnisse als HTML anzeigen
    ├── loadingBar.js         ← Ladebalken
    └── fileManager.js        ← CSV laden und speichern
```

---

## Schritt 1 – Die App startet (`app.js`)

`app.js` ist der Startpunkt. Wenn die Seite geladen wird, ruft der Browser `main()` auf.

```
DOMContentLoaded
      ↓
   main()
      ↓
  initDraw()         → Canvas vorbereiten
  initEvents()       → Maus/Touch aktivieren
  initToolbar()      → Tool-Buttons aktivieren
  initFileButtons()  → Layout/Clear/Load/Save-Buttons aktivieren
  initAutosave()     → Gespeicherten Graphen laden
  initAnalyseMode()  → Analyse-Toggle wiederherstellen
  initRandomModal()  → Zufalls-Modal vorbereiten
  refresh()          → Einmal zeichnen + Algorithmen starten
```

`refresh()` wird **bei jeder Änderung** aufgerufen (Knoten hinzufügen, löschen, verschieben). Es macht drei Dinge:
1. `redraw()` → Canvas neu zeichnen
2. `autosave()` → Graphen im Browser speichern
3. `requestCompute()` → Algorithmen neu berechnen (im Hintergrund)

---

## Schritt 2 – Das Datenmodell (`graph/model.js`)

Hier sind die drei wichtigsten Klassen der App.

### `Node` – Ein Knoten

```js
new Node(id, posX, posY, label)
```

Ein Knoten ist ein Punkt im Graphen. Er speichert:
- `posX`, `posY` → Position auf dem Canvas
- `label` → Name (z.B. "N1")
- `adjacents[]` → Liste aller Knoten die direkt verbunden sind (Nachbarn)

### `Edge` – Eine Kante

```js
new Edge(id, node0, node1)
```

Eine Kante ist eine Linie zwischen zwei Knoten. Sie speichert nur die zwei Knoten die sie verbindet.

### `Graph` – Der ganze Graph

Der Graph hält alle Knoten (`nodes[]`) und alle Kanten (`edges[]`) zusammen.

Wichtige Methoden:

| Methode | Was sie macht |
|---|---|
| `addNode(node)` | Knoten hinzufügen |
| `removeNode(node)` | Knoten + alle seine Kanten löschen |
| `addEdge(id, n0, n1)` | Kante erstellen und Nachbarn verbinden |
| `removeEdge(edge)` | Kante löschen und Nachbarn trennen |
| `findNodeAt(x, y)` | Welcher Knoten liegt unter dem Klickpunkt? |
| `findEdgeAt(x, y)` | Welche Kante liegt unter dem Klickpunkt? |

**Wie `findNodeAt` funktioniert:** Knoten sind Kreise. Der Abstand vom Klickpunkt zum Mittelpunkt wird mit Pythagoras gemessen: `√(dx² + dy²)`. Wenn der Abstand ≤ 22px ist → Treffer.

**Wie `findEdgeAt` funktioniert:** Kanten sind Linien. Der kürzeste Abstand vom Klickpunkt zur Linie wird berechnet (Lotfußpunkt). Wenn der Abstand ≤ 8px ist → Treffer.

---

## Schritt 3 – Der Zustand der App (`graph/state.js`)

`state` ist ein Objekt das den aktuellen Zustand der App speichert.

```js
state = {
    tool: "select",      // Welches Tool ist aktiv? (select, node, edge, move, delete)
    selected: null,      // ID des ausgewählten Knotens
    edgePending: null,   // Erster Knoten beim Kanten-Zeichnen
    hoveredNode: null,   // Knoten unter der Maus
    hoveredEdge: null,   // Kante unter der Maus
    dragging: null,      // Knoten der gerade gezogen wird
    nodeCounter: 0,      // Zähler für Labels (N1, N2, N3...)
    analyseMode: false,  // Ist der Analyse-Toggle an?
    analyseData: null,   // Artikulationen, Brücken, Zentrum (für Farben)
}
```

`state` und `graph` sind in vielen Dateien importiert. Sie sind die "gemeinsame Mitte" der App.

---

## Schritt 4 – Zeichnen (`render/draw.js`)

`draw.js` zeichnet den Graphen auf den HTML-Canvas.

Die Hauptfunktion `redraw()` macht zwei Dinge in Reihenfolge:
1. **Kanten zeichnen** (zuerst, damit sie hinter den Knoten liegen)
2. **Knoten zeichnen** (danach, damit sie vor den Kanten liegen)

### Knotenfarben

| Zustand | Farbe |
|---|---|
| Normal | Rot `#f63b45` |
| Hover (Maus drüber) | Rosa `#ff6b72` |
| Ausgewählt | Blau `#449aa9` |
| Kante verbinden (pending) | Orange `#f5a623` |
| **Analyse: Artikulation** | **Gelb `#f59e0b`** |
| **Analyse: Zentrum** | **Grün `#22c55e`** |

### Kantenfarben

| Zustand | Farbe |
|---|---|
| Normal | Grau (halbtransparent) |
| Hover | Hellgrau |
| **Analyse: Brücke** | **Rot `#ef4444`** |

Die Knotengröße hängt von der Graphgröße ab:
- ≤ 30 Knoten → Radius 22px
- ≤ 100 Knoten → Radius 16px
- ≤ 250 Knoten → Radius 11px
- usw.

---

## Schritt 5 – Maus und Touch (`render/events.js`)

`events.js` reagiert auf alle Benutzereingaben.

### Wie ein Klick verarbeitet wird

```
Klick auf Canvas
      ↓
getCanvasCoords()   → Klickposition in Canvas-Koordinaten umrechnen
                      (wichtig: Canvas kann skaliert sein!)
      ↓
handleTap(x, y)
      ↓
  tool === "node"   → neuen Knoten erstellen
  tool === "select" → Knoten auswählen
  tool === "edge"   → Kante zwischen zwei Knoten zeichnen
  tool === "delete" → Knoten oder Kante löschen
```

### Kante zeichnen (zwei Klicks)

```
1. Klick auf Knoten A  → state.edgePending = A  (Knoten wird orange)
2. Klick auf Knoten B  → Kante A-B wird erstellt, edgePending = null
```

### Hover-Erkennung

Bei jeder Mausbewegung wird geprüft ob die Maus über einem Knoten oder einer Kante ist. Nur wenn sich der Hover-Zustand ändert, wird neu gezeichnet (spart Leistung).

---

## Schritt 6 – Algorithmen im Hintergrund (`worker.js`)

Die Algorithmen laufen in einem **Web Worker**. Das bedeutet: sie laufen in einem separaten Thread und blockieren nicht die Benutzeroberfläche.

### Ablauf

```
Nutzer macht Änderung
      ↓
refresh() → requestCompute()
      ↓
worker.postMessage({ graph: ... })   → Graphdaten schicken
      ↓
[Worker rechnet im Hintergrund]
      ↓
worker.onmessage({ data: ... })      → Ergebnisse empfangen
      ↓
renderResults(data)   → HTML anzeigen
state.analyseData = …  → Farben für Canvas aktualisieren
```

### Was der Worker berechnet

1. **BFS-Distanzen** für jeden Knoten (wie weit ist jeder Knoten von jedem anderen?)
2. **Exzentrizität** = maximale Distanz eines Knotens zu allen anderen
3. **Radius** = kleinste Exzentrizität im Graphen
4. **Durchmesser** = größte Exzentrizität im Graphen
5. **Zentrum** = alle Knoten mit Exzentrizität = Radius
6. **Komponenten** = getrennte Teile des Graphen
7. **Artikulationen** = Knoten die den Graphen trennen wenn man sie löscht
8. **Brücken** = Kanten die den Graphen trennen wenn man sie löscht

---

## Schritt 7 – Die Algorithmen im Detail

### BFS – Breitensuche (`algorithms/distances.js`)

BFS steht für "Breadth First Search". Stell dir vor du stehst in einem Labyrinth und gehst Schritt für Schritt in alle Richtungen gleichzeitig. So findet BFS den kürzesten Weg.

```
Startknoten → alle Nachbarn (Abstand 1)
           → alle Nachbarn der Nachbarn (Abstand 2)
           → ...
```

Ergebnis: eine Map mit `{ knotenId → Abstand }`.

### Exzentrizität (`algorithms/eccentricities.js`)

Die Exzentrizität eines Knotens ist sein **maximaler Abstand** zu allen anderen Knoten.
- Kleiner Wert → Knoten ist nah an allen → wahrscheinlich Zentrum
- Großer Wert → Knoten ist weit von vielen → Peripherie
- `null` wenn der Graph nicht zusammenhängend ist (Knoten nicht erreichbar)

`computeEccs()` ruft für jeden Knoten `bfsDistances()` auf und gibt eine Liste zurück: `[{ id, label, ecc, reachable }, ...]`.

### Radius, Durchmesser, Zentrum (`algorithms/metrics.js`)

Alle drei Werte basieren auf den Exzentrizitäten aus `eccentricities.js`:

| Funktion | Was sie berechnet |
|---|---|
| `getRadius(eccs)` | Kleinste Exzentrizität → "zentralster" Knoten |
| `getDiameter(eccs)` | Größte Exzentrizität → längster kürzester Weg |
| `getCenterNodes(eccs)` | Alle Knoten mit `ecc == Radius` |

### Artikulationen und Brücken (`algorithms/components.js`)

Benutzt DFS (Tiefensuche) mit dem Tarjan-Algorithmus: jeder Knoten bekommt eine Entdeckungszeit (`disc`) und einen "Low-Value" (`low`). Der Low-Value zeigt wie weit man ohne den Eltern-Knoten noch zurückkommt. Wenn man nicht weit genug zurückkommt → Artikulation oder Brücke.

Mehr Details zum Algorithmus: `algorithms/TARJAN.md`.

---

## Schritt 8 – Analyse-Modus (`ui/analyseMode.js`)

Der Analyse-Toggle ändert wie der Canvas gezeichnet wird.

```
Toggle an
    ↓
state.analyseMode = true
    ↓
redraw() schaut in state.analyseData
    ↓
Artikulationen → gelb
Zentrum        → grün
Brücken        → rot und dicker
```

Der Zustand des Toggles wird in `localStorage` gespeichert (Key: `spg-graph-analyse`), damit er nach dem Neu-Laden noch da ist.

---

## Schritt 9 – Lokales Speichern (`ui/autosave.js`)

Der "Local"-Toggle speichert den Graphen automatisch im Browser.

- Gespeichert wird in `localStorage` unter dem Key `spg-graph`
- Gespeichert wird: alle Knoten (Position, Label) und alle Kanten
- Beim Laden wird der Graph automatisch wiederhergestellt

`localStorage` ist ein Speicher im Browser. Er bleibt auch wenn man den Tab schließt. Er ist aber nur auf diesem Gerät und in diesem Browser.

---

## Schritt 10 – Layout (`graph/layout.js`)

Der "Layout"-Button ordnet die Knoten automatisch an. Es wird ein **Force-Directed Layout** benutzt.

Stell dir vor, jeder Knoten ist ein Magnet:
- **Knoten stoßen sich ab** (wie gleiche Pole) → sie verteilen sich
- **Kanten ziehen sich an** → verbundene Knoten kommen näher zusammen
- Nach vielen Schritten → gutes Layout

Das läuft in kleinen Schritten (Frames) damit die Seite nicht einfriert.

---

## Datenspeicherung – Übersicht

| Was | Wo | Key |
|---|---|---|
| Graph (Knoten + Kanten) | localStorage | `spg-graph` |
| Local-Toggle Zustand | localStorage | `spg-graph-autosave` |
| Analyse-Toggle Zustand | localStorage | `spg-graph-analyse` |
| CSV-Export | Download-Datei | — |
