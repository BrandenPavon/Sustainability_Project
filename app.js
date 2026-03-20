/* SusCalc — app.js */

const form = document.getElementById("susCalcForm");
const statusDiv = document.getElementById("status");
const resultsDiv = document.getElementById("results");

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  statusDiv.textContent = "⏳ Calculating your carbon footprint...";
  resultsDiv.style.display = "none";

  const payload = {
    showerMinutesPerDay:  parseFloat(document.getElementById("showerMinutes").value),
    redMeatMealsPerWeek:  parseInt(document.getElementById("redMeat").value, 10),
    carMilesPerWeek:      parseFloat(document.getElementById("carMiles").value),
    flightsPerYear:       parseInt(document.getElementById("flights").value, 10),
    fashionItemsPerMonth: parseInt(document.getElementById("fashion").value, 10)
  };

  try {
    const response = await fetch("/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      statusDiv.textContent = data.error || "Something went wrong.";
      return;
    }

    document.getElementById("showerCO2").textContent      = data.showerCO2.toFixed(2);
    document.getElementById("meatCO2").textContent        = data.meatCO2.toFixed(2);
    document.getElementById("carCO2").textContent         = data.carCO2.toFixed(2);
    document.getElementById("flightCO2").textContent      = data.flightCO2.toFixed(2);
    document.getElementById("fashionCO2").textContent     = data.fashionCO2.toFixed(2);
    document.getElementById("totalCO2").textContent       = data.totalCO2.toFixed(2);
    document.getElementById("totalTons").textContent      = (data.totalCO2 / 1000.0).toFixed(2);
    document.getElementById("biggestCategory").textContent = data.biggestCategory;
    document.getElementById("recommendation").textContent  = data.recommendation;

    statusDiv.textContent = "✅ Calculation complete.";
    resultsDiv.style.display = "block";

  } catch (error) {
    statusDiv.textContent =
      "❌ Could not connect to the Java backend.";
  }
});
