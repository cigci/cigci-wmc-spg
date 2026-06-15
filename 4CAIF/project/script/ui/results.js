/*
 * Ergebnis-Panel: zeigt die berechneten Graph-Eigenschaften im DOM an.
 * Wir bauen alle Elemente mit document.createElement() auf
 * und hängen sie mit appendChild() in den richtigen Container.
 */

// Analyseergebnisse vom Worker im Panel anzeigen
export function renderResults(data) {
    const section = document.getElementById("results-section");
    if (!section) return;
    section.textContent = "";
    section.appendChild(buildResultsDOM(data));
}

// Leerer Zustand anzeigen (wenn kein Graph gezeichnet ist)
export function renderEmpty() {
    const section = document.getElementById("results-section");
    if (!section) return;
    section.textContent = "";

    const container = el("div", "flex flex-col items-center gap-4 py-16 px-6 text-center text-txt-muted text-sm");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width",        "48");
    svg.setAttribute("height",       "48");
    svg.setAttribute("viewBox",      "0 0 16 16");
    svg.setAttribute("fill",         "none");
    svg.setAttribute("stroke",       "currentColor");
    svg.setAttribute("stroke-width", "1");
    svg.setAttribute("opacity",      "0.3");
    for (const [tag, attrs] of [
        ["circle", { cx: "4",  cy: "12", r: "2.5" }],
        ["circle", { cx: "12", cy: "4",  r: "2.5" }],
        ["circle", { cx: "8",  cy: "8",  r: "2.5" }],
        ["line",   { x1: "4",  y1: "12", x2: "8",  y2: "8" }],
        ["line",   { x1: "8",  y1: "8",  x2: "12", y2: "4" }],
    ]) {
        const shape = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [k, v] of Object.entries(attrs)) shape.setAttribute(k, v);
        svg.appendChild(shape);
    }

    const p = el("p");
    p.textContent = "Zeichne einen Graphen — die Analyse erscheint hier";

    container.appendChild(svg);
    container.appendChild(p);
    section.appendChild(container);
}

// Haupt-DOM des Ergebnis-Panels aufbauen
function buildResultsDOM(data) {
    const { nodeCount, edgeCount, eccs, r, d, centerNodes, comps, articulations, bridges } = data;

    const inner = el("div", "max-w-[960px] mx-auto py-10 px-6 flex flex-col gap-6");

    // --- Überschrift ---
    const header = el("header", "flex items-center gap-4");
    const title  = el("h2",     "text-[11px] font-bold tracking-[2px] uppercase text-txt-muted whitespace-nowrap");
    title.textContent = "Graphanalyse";
    const rule = el("div", "flex-1 h-px bg-border");
    header.appendChild(title);
    header.appendChild(rule);
    inner.appendChild(header);

    // --- Stat-Boxen ---
    const statsRow = el("div", "flex gap-[10px]");
    statsRow.appendChild(createStatBox(nodeCount,          "Knoten",        ""));
    statsRow.appendChild(createStatBox(edgeCount,          "Kanten",        ""));
    statsRow.appendChild(createStatBox(comps.length,       "Komponenten",   ""));
    statsRow.appendChild(createStatBox(articulations.length, "Artikulationen", articulations.length > 0 ? "danger" : ""));
    statsRow.appendChild(createStatBox(bridges.length,     "Brücken",       bridges.length > 0 ? "danger" : ""));
    inner.appendChild(statsRow);

    // --- Metriken ---
    const metricsRow = el("div", "grid grid-cols-[1fr_1fr_2fr] gap-[10px]");
    metricsRow.appendChild(createMetricCard("Radius",      fmt(r), "var(--color-secondary)"));
    metricsRow.appendChild(createMetricCard("Durchmesser", fmt(d), "var(--color-primary)"));
    metricsRow.appendChild(createCenterCard(centerNodes));
    inner.appendChild(metricsRow);

    // --- Detail-Karten ---
    const detailsRow = el("div", "grid grid-cols-3 gap-[10px]");
    detailsRow.appendChild(createBadgeCard("Artikulationen", articulations, "danger", "Keine"));
    detailsRow.appendChild(createBridgeCard(bridges));
    detailsRow.appendChild(createComponentCard(comps));
    inner.appendChild(detailsRow);

    // --- Exzentrizitäts-Tabelle ---
    const tableCard  = el("div", "bg-bg-card border border-border rounded-[10px] p-[18px] flex flex-col gap-[14px]");
    const tableTitle = el("div", "text-[11px] font-bold tracking-[0.8px] uppercase text-txt-muted");
    tableTitle.textContent = "Exzentrizitäten";
    const tableWrap = el("div", "overflow-x-auto rounded");
    const table     = el("table", "w-full border-collapse text-[13px]");

    const thead     = document.createElement("thead");
    const headerRow = el("tr", "border-b border-border");
    for (const col of ["Knoten", "Exzentrizität", "Erreichbar", "Typ"]) {
        const th = el("th", "text-left py-2 px-3 text-[10px] font-bold tracking-[0.8px] uppercase text-txt-muted");
        th.textContent = col;
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const e of eccs) tbody.appendChild(createEccRow(e, r, d, nodeCount));
    table.appendChild(tbody);

    tableWrap.appendChild(table);
    tableCard.appendChild(tableTitle);
    tableCard.appendChild(tableWrap);
    inner.appendChild(tableCard);

    return inner;
}

// Eine Stat-Box: große Zahl + Beschriftung darunter
function createStatBox(value, labelText, mod) {
    const box = el("div", "flex-1 bg-bg-card border border-border rounded-[10px] py-[14px] px-[10px] flex flex-col items-center gap-1");
    const num = el("span", "text-[28px] font-bold leading-none text-txt" + (mod === "danger" ? " text-primary" : ""));
    num.textContent = value;
    const lbl = el("span", "text-[10px] text-txt-muted text-center tracking-[0.3px]");
    lbl.textContent = labelText;
    box.appendChild(num);
    box.appendChild(lbl);
    return box;
}

// Eine Metrik-Karte: Label + Wert (für Radius / Durchmesser)
function createMetricCard(labelText, valueText, color) {
    const card  = el("div",  "bg-bg-card border border-border rounded-[10px] p-5 flex flex-col gap-2");
    const label = el("span", "text-[10px] font-semibold tracking-[1px] uppercase text-txt-muted");
    label.textContent = labelText;
    const value = el("span", "text-[48px] font-extrabold leading-none");
    value.style.color = color;
    value.textContent = valueText;
    card.appendChild(label);
    card.appendChild(value);
    return card;
}

// Zentrum-Karte mit Knoten-Badges
function createCenterCard(centerNodes) {
    const card  = el("div",  "bg-bg-card border border-border rounded-[10px] p-5 flex flex-col gap-2");
    const label = el("span", "text-[10px] font-semibold tracking-[1px] uppercase text-txt-muted");
    label.textContent = "Zentrum";
    const badgeGroup = el("div", "flex flex-wrap gap-[6px] items-center");
    if (centerNodes.length > 0) {
        for (const n of centerNodes) badgeGroup.appendChild(createBadge(n.label, "center"));
    } else {
        const noData = el("span", "text-[13px] text-txt-muted");
        noData.textContent = "—";
        badgeGroup.appendChild(noData);
    }
    card.appendChild(label);
    card.appendChild(badgeGroup);
    return card;
}

// Detail-Karte mit Badges (für Artikulationen)
function createBadgeCard(titleText, nodes, mod, emptyText) {
    const card  = el("div",  "bg-bg-card border border-border rounded-[10px] p-[18px] flex flex-col gap-3");
    const title = el("div",  "text-[11px] font-bold tracking-[0.8px] uppercase text-txt-muted");
    title.textContent = titleText;
    const badgeGroup = el("div", "flex flex-wrap gap-[6px] items-center");
    if (nodes.length > 0) {
        for (const n of nodes) badgeGroup.appendChild(createBadge(n.label, mod));
    } else {
        const noData = el("span", "text-[13px] text-txt-muted");
        noData.textContent = emptyText;
        badgeGroup.appendChild(noData);
    }
    card.appendChild(title);
    card.appendChild(badgeGroup);
    return card;
}

// Detail-Karte für Brücken
function createBridgeCard(bridges) {
    const card  = el("div", "bg-bg-card border border-border rounded-[10px] p-[18px] flex flex-col gap-3");
    const title = el("div", "text-[11px] font-bold tracking-[0.8px] uppercase text-txt-muted");
    title.textContent = "Brücken";
    const badgeGroup = el("div", "flex flex-wrap gap-[6px] items-center");
    if (bridges.length > 0) {
        for (const [a, b] of bridges) {
            const pair = el("span", "inline-flex items-center gap-1");
            const dash = el("span", "text-sm text-txt-muted");
            dash.textContent = "–";
            pair.appendChild(createBadge(a.label, "danger"));
            pair.appendChild(dash);
            pair.appendChild(createBadge(b.label, "danger"));
            badgeGroup.appendChild(pair);
        }
    } else {
        const noData = el("span", "text-[13px] text-txt-muted");
        noData.textContent = "Keine";
        badgeGroup.appendChild(noData);
    }
    card.appendChild(title);
    card.appendChild(badgeGroup);
    return card;
}

// Detail-Karte für Komponenten
function createComponentCard(comps) {
    const card  = el("div", "bg-bg-card border border-border rounded-[10px] p-[18px] flex flex-col gap-3");
    const title = el("div", "text-[11px] font-bold tracking-[0.8px] uppercase text-txt-muted");
    title.textContent = "Komponenten";
    const list = el("div", "flex flex-col gap-[6px]");
    for (let i = 0; i < comps.length; i++) {
        const line  = el("div",  "flex items-center gap-[6px] flex-wrap");
        const idx   = el("span", "text-[10px] font-bold text-txt-muted tracking-[0.5px] min-w-[24px]");
        idx.textContent = "K" + (i + 1);
        const group = el("span", "flex flex-wrap gap-[6px] items-center");
        for (const n of comps[i]) group.appendChild(createBadge(n.label, ""));
        line.appendChild(idx);
        line.appendChild(group);
        list.appendChild(line);
    }
    card.appendChild(title);
    card.appendChild(list);
    return card;
}

// Eine Tabellenzeile für die Exzentrizitäts-Tabelle
function createEccRow({ label, ecc, reachable }, r, d, total) {
    const isCenter    = ecc !== null && ecc === r;
    const isPeriphery = ecc !== null && d !== null && ecc === d && !isCenter;

    const rowBg = isCenter
        ? "bg-[color-mix(in_hsl,var(--color-secondary),transparent_88%)]"
        : isPeriphery
            ? "bg-[color-mix(in_hsl,var(--color-primary),transparent_90%)]"
            : "";

    const tdBase = "py-[10px] px-3 border-b border-[color-mix(in_hsl,var(--color-border),transparent_50%)] text-txt " + rowBg;

    const tr = document.createElement("tr");

    const tdLabel = el("td", tdBase);
    tdLabel.appendChild(createBadge(label, ""));

    const tdEcc = el("td", tdBase + " text-[16px] font-bold");
    tdEcc.textContent = fmt(ecc);

    const tdReach = el("td", tdBase + " font-semibold");
    tdReach.textContent = reachable;
    const reachTotal = el("span", "text-[11px] text-txt-muted");
    reachTotal.textContent = " / " + total;
    tdReach.appendChild(reachTotal);

    const tdType = el("td", tdBase);
    if (isCenter || isPeriphery) {
        const badgeCls = isCenter
            ? "bg-[color-mix(in_hsl,var(--color-secondary),transparent_70%)] text-[color-mix(in_hsl,var(--color-secondary),white_40%)]"
            : "bg-[color-mix(in_hsl,var(--color-primary),transparent_75%)] text-[color-mix(in_hsl,var(--color-primary),white_30%)]";
        const typeBadge = el("span", "inline-block py-[2px] px-2 rounded-[20px] text-[10px] font-bold tracking-[0.5px] " + badgeCls);
        typeBadge.textContent = isCenter ? "Zentrum" : "Peripherie";
        tdType.appendChild(typeBadge);
    }

    tr.appendChild(tdLabel);
    tr.appendChild(tdEcc);
    tr.appendChild(tdReach);
    tr.appendChild(tdType);
    return tr;
}

// Ein Knoten-Badge (farbiges Label-Pill)
function createBadge(labelText, mod) {
    const modCls = mod === "danger"
        ? " bg-[color-mix(in_hsl,var(--color-primary),transparent_75%)] border-[color-mix(in_hsl,var(--color-primary),transparent_50%)] text-[color-mix(in_hsl,var(--color-primary),white_30%)]"
        : mod === "center"
            ? " bg-[color-mix(in_hsl,var(--color-secondary),transparent_70%)] border-[color-mix(in_hsl,var(--color-secondary),transparent_40%)] text-[color-mix(in_hsl,var(--color-secondary),white_40%)]"
            : " bg-bg-card2 border-border text-txt";
    const span = el("span", "inline-flex items-center py-[3px] px-[9px] rounded-[20px] text-xs font-semibold border" + modCls);
    span.textContent = labelText;
    return span;
}

// null → "∞" (unendlich), sonst die Zahl selbst
function fmt(v) { return v === null ? "∞" : v; }

// Kurzform: Element erstellen + Klassen setzen
function el(tag, classes = "") {
    const node = document.createElement(tag);
    if (classes) node.className = classes;
    return node;
}
