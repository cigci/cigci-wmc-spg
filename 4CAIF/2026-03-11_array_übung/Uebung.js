const students = [
  { name: "Anna", age: 17, grade: 2 },
  { name: "Ben", age: 16, grade: 4 },
  { name: "Clara", age: 18, grade: 1 },
  { name: "David", age: 17, grade: 5 },
  { name: "Elena", age: 16, grade: 3 },
  { name: "Felix", age: 19, grade: 2 },
  { name: "Gina", age: 17, grade: 1 },
  { name: "Hugo", age: 18, grade: 4 },
];

// --- Aufgabe 1: filter ---
// Behält nur die Elemente, bei denen die Bedingung (grade <= 4) true ist.
const passed = students.filter(student => student.grade <= 4);
console.log("Aufgabe 1 (passed):", passed);


// --- Aufgabe 2: map ---
// Wandelt jedes Objekt in einen String mit Template Literals um.
const labels = students.map(student => `${student.name} (${student.age})`);
console.log("Aufgabe 2 (labels):", labels);


// --- Aufgabe 3: filter + map ---
// Zuerst filtern (bestanden), dann aus den gefilterten Objekten nur den Namen ziehen.
const passedNames = students
  .filter(student => student.grade <= 4)
  .map(student => student.name);
console.log("Aufgabe 3 (passedNames):", passedNames);


// --- Aufgabe 4: reduce ---
// Summiert alle Noten auf (Startwert ist 0) und teilt sie durch die Anzahl der Schüler.
const averageGrade = students.reduce((sum, student) => sum + student.grade, 0) / students.length;
console.log("Aufgabe 4 (averageGrade):", averageGrade);


// --- Aufgabe 5: Chaining (Bonus) ---
// Filtern (Alter >= 17 UND Note <= 4) -> Mappen (nur Name) -> Verbinden (zu einem String)
const bonusResult = students
  .filter(student => student.age >= 17 && student.grade <= 4)
  .map(student => student.name)
  .join(", ");
console.log("Aufgabe 5 (Bonus):", bonusResult); 
// Ergebnis: "Anna, Clara, Felix, Gina, Hugo"