"use strict";

const machineDefaults = [
  { id: 1, capacity: 72000, price: 35000, maintenance: 1800, depreciation: 4375 },
  { id: 2, capacity: 120000, price: 95000, maintenance: 2900, depreciation: 11875 },
  { id: 3, capacity: 68000, price: 38000, maintenance: 2100, depreciation: 4750 },
  { id: 4, capacity: 95000, price: 70000, maintenance: 2900, depreciation: 8750 },
  { id: 5, capacity: 45000, price: 28000, maintenance: 1300, depreciation: 3500 },
  { id: 6, capacity: 110000, price: 90000, maintenance: 2900, depreciation: 11250 },
];

const premiseDefaults = [
  { id: "A", slots: 1, transport: 0.3, rent: 12000 },
  { id: "B", slots: 1, transport: 0.4, rent: 10000 },
  { id: "C", slots: 1, transport: 0.3, rent: 12000 },
  { id: "D", slots: 1, transport: 0.1, rent: 17000 },
  { id: "E", slots: 2, transport: 0.2, rent: 15000 },
  { id: "F", slots: 3, transport: 0.2, rent: 16000 },
];

const initialState = {
  global: {
    openingCash: 0,
    year1Profit: 0,
    openingTaxLoss: 0,
    salePrice: 2,
    milkPrice: 20000,
    milkYield: 20000,
    salary: 10000,
    bonusRate: 5,
    taxRate: 10,
    minimumMilk: 1,
    minimumMarket: 1000,
  },
  machines: machineDefaults.map(m => ({ ...m, owned: m.id === 2 ? 3 : 0, life: m.id === 2 ? 4 : 0 })),
  premises: premiseDefaults.map(p => ({ ...p })),
  loans: [
    { balance: 266000, principalDue: 66500, rate: 10 },
    { balance: 0, principalDue: 0, rate: 10 },
    { balance: 0, principalDue: 0, rate: 10 },
  ],
  scenarios: {
    a: {
      name: "Cash-protected plan", milkTons: 18, plannedProduction: 360000, salesRequest: 360000,
      marketInvestment: 7000, actualSales: 330000, newLoan: 0, loanTerm: 4,
      premises: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 360000 },
      machineUse: { 1: 0, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0 },
      machineBuy: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    },
    b: {
      name: "Maximum-sales push", milkTons: 21, plannedProduction: 410000, salesRequest: 410000,
      marketInvestment: 10000, actualSales: 360000, newLoan: 150000, loanTerm: 8,
      premises: { A: 0, B: 0, C: 0, D: 50000, E: 0, F: 360000 },
      machineUse: { 1: 1, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0 },
      machineBuy: { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    },
  },
};

let state = loadState();

function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
function num(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function round(value) { return Math.round(num(value)); }
function fmt(value) { return `Sh ${round(value).toLocaleString("en-US")}`; }
function units(value) { return `${round(value).toLocaleString("en-US")}`; }
function signed(value) { const n = round(value); return `${n >= 0 ? "+" : "−"} ${fmt(Math.abs(n))}`; }

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("team3-y2-tool"));
    if (!saved) return deepClone(initialState);
    return mergeDeep(deepClone(initialState), saved);
  } catch { return deepClone(initialState); }
}

function mergeDeep(target, source) {
  if (!source || typeof source !== "object") return target;
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) && target[key]) {
      target[key] = mergeDeep(target[key], source[key]);
    } else { target[key] = source[key]; }
  });
  return target;
}

function saveState() { localStorage.setItem("team3-y2-tool", JSON.stringify(state)); }

function input(value, attrs = "") { return `<input type="number" value="${value}" ${attrs}>`; }

function renderBaseTables() {
  document.querySelector("#ownedMachinesTable tbody").innerHTML = state.machines.map((m, i) => `
    <tr><td>Machine ${m.id}</td>
      <td>${input(m.owned, `min="0" step="1" data-path="machines.${i}.owned"`)}</td>
      <td>${input(m.life, `min="0" max="8" step="1" data-path="machines.${i}.life"`)}</td>
      <td>${fmt(m.depreciation)} × copies with life</td></tr>`).join("");

  document.querySelector("#loansTable tbody").innerHTML = state.loans.map((loan, i) => `
    <tr><td>Loan ${i + 1}</td>
      <td>${input(loan.balance, `min="0" step="1" data-path="loans.${i}.balance"`)}</td>
      <td>${input(loan.principalDue, `min="0" step="1" data-path="loans.${i}.principalDue"`)}</td>
      <td>${input(loan.rate, `min="0" step="0.1" data-path="loans.${i}.rate"`)}</td></tr>`).join("");

  document.querySelector("#premiseRulesTable tbody").innerHTML = state.premises.map((p, i) => `
    <tr><td>${p.id}</td>
      <td>${input(p.slots, `min="0" step="1" data-path="premises.${i}.slots"`)}</td>
      <td>${input(p.transport, `min="0" step="0.01" data-path="premises.${i}.transport"`)}</td>
      <td>${input(p.rent, `min="0" step="1" data-path="premises.${i}.rent"`)}</td></tr>`).join("");

  document.querySelector("#machineRulesTable tbody").innerHTML = state.machines.map((m, i) => `
    <tr><td>${m.id}</td>
      <td>${input(m.capacity, `min="0" step="1" data-path="machines.${i}.capacity"`)}</td>
      <td>${input(m.price, `min="0" step="1" data-path="machines.${i}.price"`)}</td>
      <td>${input(m.maintenance, `min="0" step="1" data-path="machines.${i}.maintenance"`)}</td>
      <td>${input(m.depreciation, `min="0" step="1" data-path="machines.${i}.depreciation"`)}</td></tr>`).join("");
}

function renderScenarioInputs(key) {
  const s = state.scenarios[key];
  const root = document.querySelector(`[data-scenario="${key}"] .scenario-inputs`);
  root.innerHTML = `
    <div class="subsection">
      <h3>Decision and possible allocation</h3>
      <div class="mini-grid">
        ${scenarioField(key, "milkTons", "Milk purchase", "tons", 0.1)}
        ${scenarioField(key, "plannedProduction", "Planned production", "units")}
        ${scenarioField(key, "salesRequest", "Sales request", "10k blocks", 10000)}
        ${scenarioField(key, "marketInvestment", "Market investment", "Sh")}
        ${scenarioField(key, "actualSales", "Possible actual sales", "units", 10000)}
        ${scenarioField(key, "newLoan", "New borrowing", "Sh")}
        ${scenarioField(key, "loanTerm", "New loan term", "seasons", 1, 1, 8)}
      </div>
    </div>
    <div class="subsection">
      <h3>Premises and production split</h3>
      <div class="premise-picker">
        ${state.premises.map(p => {
          const used = num(s.premises[p.id]);
          return `<label class="premise-row">
            <input type="checkbox" data-premise-check="${key}.${p.id}" ${used > 0 ? "checked" : ""}>
            <strong>Premise ${p.id} · ${p.slots} slot${p.slots === 1 ? "" : "s"} · ${fmt(p.rent)}</strong>
            <input aria-label="Production at premise ${p.id}" type="number" min="0" step="10000" value="${used}" data-path="scenarios.${key}.premises.${p.id}">
          </label>`;
        }).join("")}
      </div>
    </div>
    <div class="subsection">
      <h3>Machine use and purchases</h3>
      <div class="machine-use machine-use--head"><span>Type</span><span>Owned</span><span>Use</span><span>Buy</span></div>
      ${state.machines.map(m => `<div class="machine-use">
        <strong>M${m.id}</strong><span>${m.owned}</span>
        <input aria-label="Machine ${m.id} used" type="number" min="0" step="1" value="${s.machineUse[m.id]}" data-path="scenarios.${key}.machineUse.${m.id}">
        <input aria-label="Machine ${m.id} bought" type="number" min="0" step="1" value="${s.machineBuy[m.id]}" data-path="scenarios.${key}.machineBuy.${m.id}">
      </div>`).join("")}
    </div>`;
}

function scenarioField(key, prop, label, suffix, step = 1, min = 0, max = "") {
  return `<label class="field"><span>${label} <em>${suffix}</em></span>
    <input type="number" value="${state.scenarios[key][prop]}" min="${min}" ${max !== "" ? `max="${max}"` : ""} step="${step}" data-path="scenarios.${key}.${prop}">
  </label>`;
}

function bindTopInputs() {
  Object.keys(state.global).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = state.global[id];
  });
  ["a", "b"].forEach(key => document.getElementById(`${key}_name`).value = state.scenarios[key].name);
}

function setPath(path, value) {
  const parts = path.split(".");
  let cursor = state;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) cursor[part] = value;
    else cursor = cursor[part];
  });
}

function calculate(key) {
  const s = state.scenarios[key];
  const g = state.global;
  const selectedPremises = state.premises.filter(p => num(s.premises[p.id]) > 0);
  const premiseProduction = round(selectedPremises.reduce((sum, p) => sum + num(s.premises[p.id]), 0));
  const slots = selectedPremises.reduce((sum, p) => sum + num(p.slots), 0);
  const rent = round(selectedPremises.reduce((sum, p) => sum + num(p.rent), 0));
  const machinesUsed = state.machines.reduce((sum, m) => sum + num(s.machineUse[m.id]), 0);
  const activeCapacity = round(state.machines.reduce((sum, m) => sum + num(s.machineUse[m.id]) * num(m.capacity), 0));
  const purchaseCost = round(state.machines.reduce((sum, m) => sum + num(s.machineBuy[m.id]) * num(m.price), 0));
  const totalOwnedMaintenance = round(state.machines.reduce((sum, m) => sum + (num(m.owned) + num(s.machineBuy[m.id])) * num(m.maintenance), 0));
  const depreciation = round(state.machines.reduce((sum, m) => {
    const oldDep = num(m.life) > 0 ? num(m.owned) * num(m.depreciation) : 0;
    return sum + oldDep + num(s.machineBuy[m.id]) * num(m.depreciation);
  }, 0));

  const milkCost = round(num(s.milkTons) * num(g.milkPrice));
  const milkCapacity = round(num(s.milkTons) * num(g.milkYield));
  const production = round(s.plannedProduction);
  const sold = round(s.actualSales);
  const revenue = round(sold * num(g.salePrice));

  let remainingSales = sold;
  let allocated = 0;
  let transport = 0;
  selectedPremises.forEach((p, index) => {
    let premiseSales;
    if (index === selectedPremises.length - 1) premiseSales = remainingSales;
    else premiseSales = round(sold * num(s.premises[p.id]) / Math.max(1, premiseProduction));
    premiseSales = Math.max(0, premiseSales);
    remainingSales -= premiseSales;
    allocated += premiseSales;
    transport += round(premiseSales * num(p.transport));
  });
  transport = round(transport);

  const grossProfit = round(revenue - milkCost - totalOwnedMaintenance - depreciation);
  const bonus = round(Math.max(0, grossProfit) * num(g.bonusRate) / 100);
  const existingInterest = round(state.loans.reduce((sum, l) => sum + num(l.balance) * num(l.rate) / 100, 0));
  const existingPrincipal = round(state.loans.reduce((sum, l) => sum + Math.min(num(l.balance), num(l.principalDue)), 0));
  const newInterest = round(num(s.newLoan) * 0.10);
  const newPrincipal = round(num(s.newLoan) / Math.max(1, num(s.loanTerm)));
  const interest = existingInterest + newInterest;
  const principal = existingPrincipal + newPrincipal;
  const pbt = round(grossProfit - transport - num(s.marketInvestment) - bonus - num(g.salary) - rent - interest);
  const openingLoss = num(g.openingTaxLoss);
  const usedLoss = pbt > 0 ? Math.min(openingLoss, pbt) : 0;
  const taxableProfit = Math.max(0, pbt - usedLoss);
  const tax = round(taxableProfit * num(g.taxRate) / 100);
  const netProfit = round(pbt - tax);
  const closingLoss = pbt < 0 ? round(openingLoss + Math.abs(pbt)) : round(openingLoss - usedLoss);

  const advanceCash = round(num(g.openingCash) + num(s.newLoan) - purchaseCost - milkCost - num(s.marketInvestment));
  const closingCash = round(advanceCash + revenue - rent - totalOwnedMaintenance - transport - num(g.salary) - bonus - principal - interest - tax);
  const unsold = Math.max(0, production - sold);
  const unusedMilkCapacity = Math.max(0, milkCapacity - production);

  const warnings = [];
  if (advanceCash < 0) warnings.push(`Cash before advance payment is negative by ${fmt(Math.abs(advanceCash))}.`);
  if (closingCash < 0) warnings.push(`Season-end cash is negative by ${fmt(Math.abs(closingCash))}.`);
  if (num(s.milkTons) < num(g.minimumMilk)) warnings.push(`Milk is below the estimated minimum of ${g.minimumMilk} ton.`);
  if (num(s.marketInvestment) < num(g.minimumMarket)) warnings.push(`Market spend is below the estimated minimum of ${fmt(g.minimumMarket)}.`);
  if (num(s.salesRequest) % 10000 !== 0) warnings.push("Sales request must be in whole 10,000-unit blocks.");
  if (production > milkCapacity) warnings.push(`Production exceeds milk capacity by ${units(production - milkCapacity)} units.`);
  if (production > activeCapacity) warnings.push(`Production exceeds active machine capacity by ${units(production - activeCapacity)} units.`);
  if (production !== premiseProduction) warnings.push(`Premise production totals ${units(premiseProduction)}, not the planned ${units(production)}.`);
  if (sold > production) warnings.push("Possible sales exceed production.");
  if (sold > num(s.salesRequest)) warnings.push("Possible sales exceed the sales request.");
  if (machinesUsed > slots) warnings.push(`${machinesUsed} machines are assigned to only ${slots} premise slots.`);
  state.machines.forEach(m => {
    if (num(s.machineUse[m.id]) > num(m.owned) + num(s.machineBuy[m.id])) warnings.push(`Machine ${m.id} use exceeds available copies.`);
  });

  return { premiseProduction, slots, rent, machinesUsed, activeCapacity, purchaseCost, maintenance: totalOwnedMaintenance,
    depreciation, milkCost, milkCapacity, production, sold, revenue, transport, grossProfit, bonus, interest,
    principal, pbt, usedLoss, taxableProfit, tax, netProfit, closingLoss, advanceCash, closingCash, unsold,
    unusedMilkCapacity, warnings };
}

function renderScenarioResults(key, r) {
  const root = document.querySelector(`[data-scenario="${key}"] .scenario-results`);
  const safe = r.warnings.length === 0;
  root.innerHTML = `
    <div class="metric-hero"><span>Projected net profit</span><strong>${fmt(r.netProfit)}</strong><small>Closing cash ${fmt(r.closingCash)}</small></div>
    <p class="result-heading">Profit and loss</p>
    ${metric("Revenue", r.revenue)}${metric("Milk", -r.milkCost)}${metric("Maintenance", -r.maintenance)}${metric("Depreciation", -r.depreciation)}
    ${metric("Gross profit", r.grossProfit, true)}${metric("Transport", -r.transport)}${metric("Market investment", -state.scenarios[key].marketInvestment)}
    ${metric("Bonus", -r.bonus)}${metric("Fixed salaries", -state.global.salary)}${metric("Rent", -r.rent)}${metric("Loan interest", -r.interest)}
    ${metric("Profit before tax", r.pbt, true)}${metric("Tax loss used", r.usedLoss)}${metric("Game tax", -r.tax)}${metric("Net profit", r.netProfit, true)}
    <p class="result-heading">Cash flow and operations</p>
    ${metric("Cash before advances", r.advanceCash, true)}${metric("Machine purchases", -r.purchaseCost)}${metric("Loan principal paid", -r.principal)}
    ${metric("Closing cash", r.closingCash, true)}${metric("Closing tax-loss pool", r.closingLoss)}${metric("Unsold ice cream", r.unsold, false, " units")}
    <div class="warning-list">${safe ? `<div class="warning warning--okay">No rule or cash warnings in this scenario.</div>` : r.warnings.map(w => `<div class="warning">${w}</div>`).join("")}</div>`;
}

function metric(label, value, strong = false, suffix = "") {
  const negative = num(value) < 0 ? "negative" : "";
  const displayed = suffix ? `${units(value)}${suffix}` : fmt(value);
  return `<div class="metric-row"><span>${label}</span><strong class="${negative}">${displayed}</strong></div>`;
}

function renderComparison(a, b) {
  const nameA = state.scenarios.a.name || "Option A";
  const nameB = state.scenarios.b.name || "Option B";
  document.getElementById("compareNameA").textContent = nameA;
  document.getElementById("compareNameB").textContent = nameB;
  const rows = [
    ["Possible sales", a.sold, b.sold, true], ["Revenue", a.revenue, b.revenue], ["Net profit", a.netProfit, b.netProfit],
    ["Cash before advances", a.advanceCash, b.advanceCash], ["Closing cash", a.closingCash, b.closingCash],
    ["Spoiled finished units", a.unsold, b.unsold, true], ["Interest", a.interest, b.interest],
  ];
  document.getElementById("comparisonBody").innerHTML = rows.map(([label, av, bv, isUnits]) => `
    <tr><td>${label}</td><td>${isUnits ? units(av) : fmt(av)}</td><td>${isUnits ? units(bv) : fmt(bv)}</td><td>${isUnits ? units(av - bv) : signed(av - bv)}</td></tr>`).join("");

  const preferred = a.netProfit >= b.netProfit ? { key: "a", r: a, name: nameA } : { key: "b", r: b, name: nameB };
  const other = preferred.key === "a" ? b : a;
  const badge = document.getElementById("preferredOption");
  badge.textContent = `${preferred.name} leads`;
  badge.className = `status ${preferred.r.closingCash >= 0 && preferred.r.advanceCash >= 0 ? "status--good" : "status--bad"}`;
  document.getElementById("comparisonText").textContent = `${nameA} produces ${fmt(a.netProfit)} net profit and ${fmt(a.closingCash)} closing cash. ${nameB} produces ${fmt(b.netProfit)} net profit and ${fmt(b.closingCash)} closing cash.`;
  document.getElementById("recommendationText").textContent = `Choose ${preferred.name} under the current estimates: it leads the other option by ${fmt(preferred.r.netProfit - other.netProfit)} in projected net profit.`;
  document.getElementById("assumptionText").textContent = `the trainer allocates about ${units(preferred.r.sold)} units, while the Year 2 winter forecast remains only a market forecast.`;
  const downsideSales = Math.max(0, preferred.r.sold - 50000);
  const originalSales = state.scenarios[preferred.key].actualSales;
  state.scenarios[preferred.key].actualSales = downsideSales;
  const downsideProfit = calculate(preferred.key).netProfit;
  state.scenarios[preferred.key].actualSales = originalSales;
  document.getElementById("downsideText").textContent = `if sales are 50,000 units lower (${units(downsideSales)}), projected net profit becomes ${fmt(downsideProfit)}, while milk already purchased and most fixed costs remain.`;
}

function updateAll() {
  const a = calculate("a");
  const b = calculate("b");
  renderScenarioResults("a", a);
  renderScenarioResults("b", b);
  renderComparison(a, b);
  saveState();
}

function renderAll() {
  bindTopInputs();
  renderBaseTables();
  renderScenarioInputs("a");
  renderScenarioInputs("b");
  updateAll();
}

document.addEventListener("input", event => {
  const el = event.target;
  if (el.id === "a_name" || el.id === "b_name") {
    const key = el.id[0]; state.scenarios[key].name = el.value; updateAll(); return;
  }
  if (Object.prototype.hasOwnProperty.call(state.global, el.id)) {
    state.global[el.id] = num(el.value); updateAll(); return;
  }
  if (el.dataset.path) {
    setPath(el.dataset.path, num(el.value));
    if (el.dataset.path.includes("machines.") && (el.dataset.path.endsWith(".owned") || el.dataset.path.endsWith(".life"))) {
      renderScenarioInputs("a"); renderScenarioInputs("b");
    }
    updateAll();
  }
});

document.addEventListener("change", event => {
  const el = event.target;
  if (el.dataset.premiseCheck) {
    const [key, premise] = el.dataset.premiseCheck.split(".");
    if (!el.checked) state.scenarios[key].premises[premise] = 0;
    else if (!state.scenarios[key].premises[premise]) state.scenarios[key].premises[premise] = 10000;
    renderScenarioInputs(key); updateAll();
  }
});

document.getElementById("resetButton").addEventListener("click", () => {
  if (!confirm("Reset all entered values to the original estimates?")) return;
  state = deepClone(initialState); renderAll();
});
document.getElementById("printButton").addEventListener("click", () => window.print());

renderAll();
