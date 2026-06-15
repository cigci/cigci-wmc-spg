# POS Theorie – Semester 2 (Zusammenfassung)

**Kurs:** Programmieren und Software-Engineering – Theorie  
**Themen:** Algorithmen · Formale Sprachen · Homomorphismen

---

## Organisatorisches

### Beurteilung

| Komponente | Gewichtung |
|---|---|
| SLÜs (Theorie) | 65 % |
| Programmieraufgabe | 35 % |

Beide Teile müssen **positiv** sein. SLÜs müssen gemeinsam positiv sein, nicht jede einzeln.

### Notenschlüssel

| Prozent | Note |
|---|---|
| [0, 50] | Nicht Genügend |
| (50, 62.5] | Genügend |
| (62.5, 75] | Befriedigend |
| (75, 87.5] | Gut |
| (87.5, 100] | Sehr Gut |

### Programmieraufgabe

- Sprache: Java, C#, Python, JavaScript (andere nach Rücksprache)
- Einlesen einer **Adjazenzmatrix** aus CSV
- **Minimalanforderungen** (ohne Bibliotheken):
  - Distanzen und Exzentrizitäten aller Knoten
  - Radius, Durchmesser, Zentrum
  - Komponenten, Artikulationen, Brücken
- Für **Sehr Gut** eine der Erweiterungen: GUI, Eulersche Linien, Spannbäume, Starke Zusammenhangskomponente, Blöcke, Isomorphie
- **Abgabe:** bis 1. Juni (inkl. Bildschirmvideo + Abgabegespräch)

---

## BFS & DFS (Traversierung)

### Begriffe

- **Entdeckt (τd):** Knoten wird zum ersten Mal besucht
- **Abgeschlossen (τf):** Knoten wird zum letzten Mal verlassen

### Breitensuche (BFS)

- Datenstruktur: **Queue** (FIFO)
- Algorithmus:
  1. Startknoten in Queue → als entdeckt markieren
  2. Solange Queue nicht leer: Knoten entnehmen → Nachbarn entdecken & einreihen → Knoten abschließen
- Anwendungen: Kürzester Pfad, 2-Färbbarkeit, Kürzeste-Kreise-Problem

### Tiefensuche (DFS)

- Datenstruktur: **Stack** (LIFO) oder Rekursion
- Vollständigen Pfad durchlaufen bevor Abzweigungen betrachtet werden
- Anwendungen: Kreisfreiheit, Topologische Sortierung, Starke Zusammenhangskomponente

---

## Minimale Spannbäume (MST)

### Algorithmus von Kruskal

1. Kanten aufsteigend nach Gewicht sortieren
2. Kante hinzufügen, wenn sie keinen Kreis bildet (Test per DFS)
3. Stoppen nach `n-1` Kanten
- **Effizient bei:** dünn besetzten Graphen (|E| ∈ O(|V|))

### Algorithmus von Prim

1. Beliebigen Startknoten wählen
2. Immer die günstigste Kante zu einem noch nicht enthaltenen Knoten hinzufügen
- **Effizient bei:** dicht besetzten Graphen (|E| ∈ O(|V|²))

> Beide sind **Greedy-Algorithmen** und finden das **globale Optimum**.

---

## Algorithmus von Dijkstra

- Berechnet **kürzeste Wege** von einem Startknoten zu allen anderen (Gewichte ≥ 0)
- Ähnlich wie BFS, aber mit Prioritätswarteschlange (δ-Werte)
- **Ablauf:**
  1. Alle δv = ∞, δs = 0
  2. Knoten mit kleinstem δ entnehmen → fertigstellen → Nachbarn aktualisieren: `δv = min(δv, δu + wuv)`

| Queue-Implementierung | Laufzeit |
|---|---|
| Liste | O(n²) |
| Heap | O((n+m) log n) |
| Fibonacci Heap | O(n log n + m) |

---

## O-Notation

### Definition (Bachmann-Landau)

```
O(g(n)) = { f(n) | ∃c, n₀ > 0, ∀n ≥ n₀ : 0 ≤ f(n) ≤ c·g(n) }
```

### Rechenregeln

- Addition: `O(f(n)) + O(g(n)) = O(max{f(n), g(n)})`
- Multiplikation: `O(f(n)) · O(g(n)) = O(f(n)·g(n))`

### Wachstumsordnung (langsam → schnell)

```
O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(n³) < O(eⁿ)
```

### Best / Average / Worst Case

| Fall | Lineare Suche |
|---|---|
| Best | O(1) |
| Average | O(n) |
| Worst | O(n) |

---

## Rekursion

- Methode, die sich selbst aufruft
- Immer eine **Abbruchbedingung** notwendig
- Beispiel: Fakultät `n! = n · (n-1)!`, Basisfall `0! = 1`
- **Negativbeispiel:** Fibonacci rekursiv → exponentiell viele redundante Berechnungen → iterativ vorzuziehen

### Binäre Suche

- Sortiertes Array → O(log n) statt O(n)
- Analog zur Telefonbuchsuche

---

## Sortierverfahren

| Algorithmus | Vergleiche | Swaps | Gesamt |
|---|---|---|---|
| Bubblesort | O(n²) | O(n²) | O(n²) |
| Insertionsort | O(n²) | O(n²) | O(n²) |
| Selectionsort | O(n²) | O(n) | O(n²) |
| **Mergesort** | O(n log n) | — | O(n log n) |
| **Heapsort** | O(n log n) | — | O(n log n) |
| **Quicksort** | O(n²) WC | — | O(n log n) avg |

### Mergesort

- **Divide & Conquer**: Array rekursiv halbieren → zusammenfügen (sortiert)
- Stabil, O(n log n) garantiert

### Quicksort

- Pivot-Element → Partition → rekursiv sortieren
- In der Praxis schneller als Mergesort (Worst-Case selten)

### Heapsort

- Max-Heap aufbauen (O(n)) → Maximum entnehmen & Heap wiederherstellen
- O(n log n) Worst- und Average-Case

---

## Datenstrukturen

### Lineare Strukturen

| Struktur | Zugriff | Einfügen | Löschen |
|---|---|---|---|
| Array | O(1) | O(n) | O(n) |
| Verkettete Liste | O(n) | O(1) bei Iterator | O(1) bei Iterator |
| Stack | O(1) Top | O(1) push | O(1) pop |
| Queue | O(1) Front | O(1) enqueue | O(1) dequeue |

- **Stack:** LIFO – push/pop/peek
- **Queue:** FIFO – enqueue/dequeue/front

### Hashtabellen (Dictionary/Map)

- **Hashfunktion:** `h(k) = h'(k) mod m`
- **Kollisionsbehandlung:**
  - **Chaining:** Liste pro Bucket
  - **Offene Adressierung:** Lineares / Quadratisches Sondieren, Double Hashing
- **Laufzeit:** amortisiert O(1) für Suchen, Einfügen, Löschen
- Java: `HashMap` (Chaining), `LinkedHashMap`, `TreeMap`

### Sets (Mengen)

- Kein Duplikat, kein Indexzugriff
- `HashSet`: O(1) Zugriff, keine Reihenfolge
- `TreeSet`: O(log n), Elemente sortiert

### Laufzeitvergleich

| Operation | ArrayList | LinkedList | HashSet | TreeSet |
|---|---|---|---|---|
| add (Ende) | O(1) amort. | O(1) | O(1) | O(log n) |
| remove | O(n) | O(1) Iterator | O(1) | O(log n) |
| get (Index) | O(1) | O(n) | — | — |
| find | O(n) | O(n) | O(1) | O(log n) |

---

## Homomorphismen

### Abbildungstypen

- **Injektiv:** verschiedene Argumente → verschiedene Werte (linkseindeutig)
- **Surjektiv:** jeder Wert hat mindestens ein Urbild (rechtsvollständig)
- **Bijektiv:** injektiv + surjektiv → umkehrbar

### Algebraische Strukturen

| Struktur | Eigenschaften |
|---|---|
| Gruppoid | G1: Abgeschlossenheit |
| Halbgruppe | G1 + G2: Assoziativität |
| Monoid | G1-G3: + Einheitselement |
| Gruppe | G1-G4: + Inverses Element |
| Abelsche Gruppe | G1-G5: + Kommutativität |

### Homomorphismus

Seien ⟨A, ∗⟩ und ⟨B, ∘⟩ Gruppoide. Φ: A → B ist **Homomorphismus**, wenn:

```
Φ(a ∗ b) = Φ(a) ∘ Φ(b)   für alle a, b ∈ A
```

- **Monomorphismus:** injektiv
- **Epimorphismus:** surjektiv
- **Isomorphismus:** bijektiv

### Isomorphe Graphen

Zwei Graphen sind **isomorph**, wenn eine bijektive Abbildung der Knoten existiert, die die Kantenstruktur erhält.  
→ Knoten mit Grad n müssen auf Knoten mit Grad n abgebildet werden.

---

## Formale Sprachen

### Grundbegriffe

- **Alphabet T:** endliche Menge von Symbolen
- **Grammatik:** G = (N, T, P, S)
  - N: Nichtterminalsymbole
  - T: Terminalsymbole
  - P: Produktionsregeln
  - S: Startvariable
- **Syntax:** Alphabet + Grammatik
- **Semantik:** Bedeutung der Worte
- **Pragmatik:** subjektiver Einsatzbereich

### Chomsky-Hierarchie

| Typ | Name | Automat |
|---|---|---|
| Typ-3 | Regulär | Endlicher Automat |
| Typ-2 | Kontextfrei | Kellerautomat |
| Typ-1 | Kontextsensitiv | Turing-Maschine (linear beschränkt) |
| Typ-0 | Allgemein | Turing-Maschine |

> Programmiersprachen sind im Allgemeinen **kontextfreie Sprachen** (Typ-2).

### Backus-Naur-Form (BNF / EBNF)

| Symbol | Bedeutung |
|---|---|
| `::=` | Definition / Ersetzung |
| `\|` | Entweder-Oder |
| `< >` | Nichtterminalsymbol |
| `{ }` | Beliebige Wiederholung (EBNF) |
| `[ ]` | Optionale Wiederholung (ABNF) |

### Reguläre Ausdrücke (Wichtigste Operatoren)

| Operator | Bedeutung |
|---|---|
| `.` | Beliebiges Zeichen |
| `*` | 0 oder mehr |
| `+` | 1 oder mehr |
| `?` | 0 oder 1 |
| `[abc]` | Zeichenklasse |
| `^` | Zeilenbeginn |
| `$` | Zeilenende |
| `{n,m}` | n bis m Wiederholungen |

---

## Automaten

### Endlicher Automat (DEA)

- Zustände (Knoten) + Zustandsübergänge (Kanten)
- Ein Startzustand, ein/mehrere Endzustände
- Wort **akzeptiert**, wenn Endzustand nach letztem Zeichen erreicht

### Kellerautomat

- Endlicher Automat + **Stack-Speicher**
- Erkennt **kontextfreie Sprachen**
- Zustandsübergang abhängig von: gelesenem Zeichen + oberstem Stack-Element

### Turing-Maschine

- Universelles Berechnungsmodell (Schreib-/Lesekopf + unendliches Band)
- Erkennt **alle berechenbaren Sprachen** (Typ-0)

---

## Komplexitätstheorie

| Klasse | Definition |
|---|---|
| **P** | Probleme lösbar in polynomieller Zeit (deterministisch) |
| **NP** | Probleme lösbar in polynomieller Zeit (nicht-deterministisch) |
| **NP-vollständig** | Schwierigste Probleme in NP; alle NP-Probleme darauf reduzierbar |

- `P ⊆ NP` – ob `P = NP` gilt, ist **ungeklärt** (Millennium-Problem)
- NP-vollständige Probleme: Hamilton-Kreis, 3-SAT, Subset-Sum, Knapsack, Bin-Packing
