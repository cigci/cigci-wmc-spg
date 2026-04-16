/*
console.log(1);
const p = new Promise((resolve, reject) => {
    console.log(2);
    setTimeout(() => {
        console.log(3);
        return resolve("Promise resolved!");
    }, 2000);
});
console.log(4);
p.then((result) => { console.log(`5: ${result}`); });
console.log(6);
console.log(p);
console.log(7);
*/

/*
#   Stufe 1: Einfaches Promise

Erstelle eine Funktion holeBrief(inhalt), die ein Promise zurückgibt. 
Nach einer Verzögerung (nutze setTimeout) von 1 Sekunde soll das Promise
den Inhalt des Briefes erfolgreich auflösen (resolve).
*/

function holeBrief(inhalt) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(inhalt);
    }, 1000);
  });
}

holeBrief("Hallo Welt")
  .then((brief) => console.log(brief));
// Nach 1s: "Hallo Welt"

/* 
#   Stufe 2: Promise Chaining

Erweitere den Prozess. Wir brauchen zwei weitere Schritte, die nacheinander ausgeführt werden müssen:

1. stempelBrief(brief): Nimmt den Brief, hängt " [Gestempelt]" an und gibt ein neues Promise zurück.

2. versendeBrief(brief): Nimmt den gestempelten Brief, hängt " -> Versendet!" an und gibt ein neues Promise zurück.

Kette diese Funktionen nun mit .then() hintereinander.
*/
function stempelBrief(brief) {
  return new Promise((resolve) => {
    resolve(brief + " [Gestempelt]");
  });
}

function versendeBrief(brief) {
  return new Promise((resolve) => {
    resolve(brief + " -> Versendet!");
  });
}

holeBrief("Hallo Welt")
  .then((brief) => stempelBrief(brief))
  .then((brief) => versendeBrief(brief))
  .then((ergebnis) => console.log(ergebnis));
// Nach 1s: "Hallo Welt [Gestempelt] -> Versendet!"

/*
#   Extra, mit catch!
*/
function holeBrief(inhalt) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!inhalt) {
        reject("❌ Kein Inhalt angegeben!");
      } else {
        resolve(inhalt);
      }
    }, 1000);
  });
}

function stempelBrief(brief) {
  return new Promise((resolve, reject) => {
    if (brief.includes("SPAM")) {
      reject("🚫 Brief abgelehnt: SPAM erkannt!");
    } else {
      resolve(brief + " [Gestempelt]");
    }
  });
}

function versendeBrief(brief) {
  return new Promise((resolve) => {
    resolve(brief + " -> Versendet!");
  });
}

// ✅ Funktioniert
holeBrief("Hallo Welt")
  .then(stempelBrief)
  .then(versendeBrief)
  .then((ergebnis) => console.log("✅", ergebnis))
  .catch((fehler) => console.log("💥 Fehler:", fehler));

// ❌ Leerer Inhalt
holeBrief("")
  .then(stempelBrief)
  .then(versendeBrief)
  .then((ergebnis) => console.log("✅", ergebnis))
  .catch((fehler) => console.log("💥 Fehler:", fehler));

// ❌ SPAM
holeBrief("SPAM kaufe jetzt!")
  .then(stempelBrief)
  .then(versendeBrief)
  .then((ergebnis) => console.log("✅", ergebnis))
  .catch((fehler) => console.log("💥 Fehler:", fehler));


// Code mit: bun script.js
// Laufen lassen ^^