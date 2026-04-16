import persons from "./persons.json" with { type: "json" };

// Spalten-Config: th-id → Sortierfunktion
const columns = [
  { id: "col-id",        key: (p) => p.id },
  { id: "col-name",      key: (p) => p.name },
  { id: "col-height",    key: (p) => p.groesse },
  { id: "col-birthdate", key: (p) => p.geburtsdatum },
  { id: "col-origin",    key: (p) => p.herkunft },
  { id: "col-weight",    key: (p) => p.gewicht },
];

// Toggle-State pro Spalte
const sortState = {};

function renderPersons() {
  const tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";
  for (const person of persons) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${person.id}</td>
      <td>${person.name}</td>
      <td>${person.groesse}</td>
      <td>${person.geburtsdatum}</td>
      <td>${person.herkunft}</td>
      <td>${person.gewicht}</td>
    `;
    tbody.appendChild(tr);
  }
}

// Allen <th>s eine id geben + Listener anhängen
const ths = document.querySelectorAll("thead th");
ths.forEach((th, i) => {
  const col = columns[i];
  th.id = col.id;

  th.addEventListener("click", () => {
    // Toggle: false = aufsteigend, true = absteigend
    sortState[col.id] = !sortState[col.id];
    const asc = !sortState[col.id];

    persons.sort((a, b) => {
      const va = col.key(a);
      const vb = col.key(b);

      const result = typeof va === "string"
        ? va.localeCompare(vb)
        : va - vb;

      return asc ? result : -result;
    });

    renderPersons();
  });
});

renderPersons();