// Remove these global variables as data will come from Firestore
// let people = [];
// let trips = {};
// let currentTrip = ""; // Will mostly use SHARED_TRIP_ID

// Remove save() and load() as Firestore handles persistence
// function save() { ... }
// function load() { ... }

// Initial load is now handled by Firestore listener.
// load(); // Remove this

/* ---------------- PEOPLE ---------------- */
function addPerson() {
  let name = document.getElementById("personInput").value;
  if (!name || window.currentFirestoreData.people.includes(name)) return; // Use synced data
  
  window.addPersonToFirestore(name); // Use the Firestore update function
  document.getElementById("personInput").value = "";
  // render() is called automatically by Firestore listener
}

/* ---------------- TRIPS ---------------- */
// For a single shared trip, createTrip and switchTrip are simplified or removed.
// If you want multiple trips, you'd need to modify the data structure in Firestore
// and how SHARED_TRIP_ID is handled. For now, assume one fixed trip.
function createTrip() {
  // If you only have one shared trip, this function might just become a visual placeholder
  // or a way to ensure the initial Firestore document exists (handled by the index.html script).
  alert("This app currently supports a single shared trip via a fixed ID. To support multiple trips, the data model and logic would need to be expanded.");
}

function switchTrip() {
  // Similar to createTrip, this is simplified for a single shared trip.
  // document.getElementById("tripSelect").value = window.SHARED_TRIP_ID; // Set to the shared ID
  document.getElementById("app").style.display = "block";
  // render() is called automatically by Firestore listener
}

/* ---------------- ADD EXPENSE ---------------- */
function addExpense() {
  let desc = document.getElementById("desc").value;
  let amount = parseFloat(document.getElementById("amount").value);
  let payer = document.getElementById("payer").value;

  let participants = Array.from(
    document.querySelectorAll("#participants input:checked")
  ).map(x => x.value);

  if (!desc || isNaN(amount) || !payer || participants.length === 0) { // Added NaN check and participant check
    alert("Please fill all expense details and select at least one participant.");
    return;
  }

  const newExpense = {
    desc,
    amount,
    payer,
    participants,
    timestamp: new Date().toISOString() // Good practice to add a timestamp
  };

  window.addExpenseToFirestore(newExpense); // Use the Firestore update function

  // Clear form
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
  // render() is called automatically by Firestore listener
}

/* ---------------- RENDER PEOPLE ---------------- */
function renderPeople() {
  document.getElementById("peopleList").innerText = window.currentFirestoreData.people.join(", ");
}

/* ---------------- LOAD TRIPS ---------------- */
function loadTrips() {
  // For a single shared trip, this will be simplified.
  // You might just show the SHARED_TRIP_ID in the select.
  let html = `<option value="${window.SHARED_TRIP_ID}">Shared Trip (ID: ${window.SHARED_TRIP_ID})</option>`;
  document.getElementById("tripSelect").innerHTML = html;
  document.getElementById("tripSelect").value = window.SHARED_TRIP_ID; // Select it
  document.getElementById("app").style.display = "block"; // Show the app div
}

/* ---------------- RENDER APP ---------------- */
function render() {
  renderPeople();

  // Ensure people data is available before rendering participants/payers
  const peopleData = window.currentFirestoreData.people || [];
  document.getElementById("participants").innerHTML =
    peopleData.map(p =>
      `<label><input type="checkbox" value="${p}" checked> ${p}</label>`
    ).join("");

  document.getElementById("payer").innerHTML =
    peopleData.map(p => `<option>${p}</option>`).join("");

  const expenses = window.currentFirestoreData.expenses || []; // Use synced data

  document.getElementById("expenseList").innerHTML =
    expenses.map(e =>
      `<li>${e.desc} - ₹${e.amount} (${e.payer})</li>`
    ).join("");

  let balances = {};
  peopleData.forEach(p => balances[p] = 0);

  expenses.forEach(e => {
    let share = e.amount / e.participants.length;

    balances[e.payer] += e.amount;

    e.participants.forEach(p => {
      balances[p] -= share;
    });
  });

  document.getElementById("balanceList").innerHTML =
    Object.entries(balances)
      .map(([p,b]) => `<li>${p}: ${b.toFixed(2)}</li>`)
      .join("");

  let creditors = [], debtors = [];

  for (let p in balances) {
    if (balances[p] > 0) creditors.push({ name: p, amt: balances[p] });
    if (balances[p] < 0) debtors.push({ name: p, amt: -balances[p] });
  }

  let result = [];

  while (creditors.length && debtors.length) {
    let c = creditors[0];
    let d = debtors[0];

    let pay = Math.min(c.amt, d.amt);

    result.push(`${d.name} pays ${c.name} ₹${pay.toFixed(2)}`);

    c.amt -= pay;
    d.amt -= pay;

    if (c.amt === 0) creditors.shift();
    if (d.amt === 0) debtors.shift();
  }

  document.getElementById("settlementList").innerHTML =
    result.map(r => `<li>${r}</li>`).join("");
}

/* INIT */
// Call loadTrips once on startup to set up the trip selector and show the app.
// The render() function will then be called by the Firestore listener when data arrives.
loadTrips();
