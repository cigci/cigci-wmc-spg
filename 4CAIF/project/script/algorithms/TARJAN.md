# Tarjan-Algorithmus – Artikulationen & Brücken

## Was suchen wir?

**Brücke** = Eine Kante, die wenn man sie entfernt, den Graphen in zwei Teile teilt.  
**Artikulation** = Ein Knoten, der wenn man ihn entfernt, den Graphen in zwei Teile teilt.

---

## Unser Beispiel-Graph

```
  1 ----- 2
   \     /
    \   /
     \ /
      3 ----- 4 ----- 5
```

Kanten: `1–2`, `2–3`, `1–3`, `3–4`, `4–5`

- `1–2–3` bilden ein **Dreieck** (alle drei hängen zusammen, keine Brücke)
- `3–4` ist eine **Brücke** (entfernen → 4 und 5 sind abgeschnitten)
- `4–5` ist eine **Brücke** (entfernen → 5 ist abgeschnitten)

---

## Schritt 1 – DFS starten, `disc` vergeben

Wir gehen den Graphen mit Tiefensuche (DFS) durch und nummerieren jeden Knoten in der Reihenfolge, in der wir ihn **zuerst besuchen**.

```
Start bei Knoten 1
 → gehe zu 2
   → gehe zu 3
     → gehe zu 4
       → gehe zu 5
```

| Knoten | disc (Besuchsnummer) |
|--------|---------------------|
| 1      | 0                   |
| 2      | 1                   |
| 3      | 2                   |
| 4      | 3                   |
| 5      | 4                   |

---

## Schritt 2 – `low` berechnen

`low[X]` = **die kleinste `disc`-Nummer, die man von X aus erreichen kann**  
(auch über Rückwärtskanten / Abkürzungen)

Stell dir vor: jeder Knoten fragt sich:  
> *"Wie weit zurück in der Zeit kann ich schauen?"*

```
  1 ----- 2
   \     /
    \   /
     \ /
      3 ----- 4 ----- 5
```

- Knoten **5**: Keine Abkürzung. Sieht nur 4 (seinen Elternknoten). → `low[5] = disc[5] = 4`
- Knoten **4**: Sieht nur 5 und 3 (Eltern). `low[4] = min(disc[4], low[5]) = min(3, 4) = 3`
- Knoten **3**: Sieht 4, 2, und 1 (Abkürzung!). `low[3] = min(disc[3], low[4], disc[1]) = min(2, 3, 0) = 0`
- Knoten **2**: Sieht 3 (dessen low=0) und 1 (Abkürzung). `low[2] = min(disc[2], low[3], disc[1]) = min(1, 0, 0) = 0`
- Knoten **1**: Wurzel. `low[1] = 0`

| Knoten | disc | low | Bedeutung                          |
|--------|------|-----|------------------------------------|
| 1      | 0    | 0   | Kann bis disc=0 zurück (sich selbst) |
| 2      | 1    | 0   | Kann bis disc=0 zurück (Knoten 1)  |
| 3      | 2    | 0   | Kann bis disc=0 zurück (Knoten 1)  |
| 4      | 3    | 3   | Kann nur bis disc=3 (sich selbst)  |
| 5      | 4    | 4   | Kann nur bis disc=4 (sich selbst)  |

---

## Schritt 3 – Brücken erkennen

**Regel:** Kante `U → V` ist eine Brücke wenn: `low[V] > disc[U]`

Das bedeutet: **V kann U nicht umgehen.** Es gibt keine Abkürzung zurück.

```
Kante 2–3:  low[3]=0  >  disc[2]=1  ?  Nein  → keine Brücke
Kante 3–4:  low[4]=3  >  disc[3]=2  ?  JA    → BRÜCKE ✓
Kante 4–5:  low[5]=4  >  disc[4]=3  ?  JA    → BRÜCKE ✓
```

**Visuell:** Kann 4 den Knoten 3 ohne die Kante 3→4 erreichen?

```
  1 ----- 2
   \     /
    \   /
     \ /
      3 ══════ 4 ----- 5
         ↑
     Diese Kante ist die EINZIGE Verbindung von 4 zur linken Seite.
     low[4] = 3 (kann nur bis zu sich selbst zurück)
     → Brücke!
```

---

## Schritt 4 – Artikulationen erkennen

Es gibt **zwei Fälle**:

### Fall A – Wurzel (kein Elternknoten)
> Ist eine Artikulation, wenn sie **mehr als 1 Kind** im DFS-Baum hat.

In unserem Beispiel: Knoten 1 hat nur 1 Kind (Knoten 2) → **keine Artikulation**.

### Fall B – Normaler Knoten U mit Kind V
**Regel:** U ist eine Artikulation wenn: `low[V] >= disc[U]`

Das bedeutet: **V kann nicht über U hinaus zurück.**  
Wenn U entfernt wird, ist V abgeschnitten.

```
U=3, V=4:  low[4]=3  >=  disc[3]=2  ?  JA  → Knoten 3 ist ARTIKULATION ✓
U=4, V=5:  low[5]=4  >=  disc[4]=3  ?  JA  → Knoten 4 ist ARTIKULATION ✓
U=2, V=3:  low[3]=0  >=  disc[2]=1  ?  Nein → Knoten 2 ist keine Artikulation
```

---

## Zusammenfassung der Regeln

| Was? | Regel | Bedeutung |
|------|-------|-----------|
| **Brücke** (Kante U→V) | `low[V] > disc[U]` | V kann U nicht umgehen |
| **Artikulation** (Wurzel) | mehr als 1 Kind | Entfernen trennt Kinder |
| **Artikulation** (normal U, Kind V) | `low[V] >= disc[U]` | V kann nicht über U hinaus |

> **Merkhilfe:** Bei Brücken `>` (strikt), bei Artikulationen `>=` (gleich reicht schon,  
> weil der Knoten selbst auch wegfällt).

---

## Warum nicht einfacher?

Die naive Methode wäre: jede Kante entfernen → prüfen ob Graph zusammenhängt → Kante wieder einfügen.

| Methode | Geschwindigkeit | Problem |
|---------|----------------|---------|
| Naive (alle entfernen & prüfen) | O(E² + E·V) | Sehr langsam bei großen Graphen |
| Tarjan | O(V + E) | Ein einziger Durchgang, fertig |

Bei 1000 Knoten und 2000 Kanten: Tarjan macht ~3000 Schritte, die naive Methode ~6.000.000.
