/* ─── Citizen portal logic ─── */
let currentStep = 0;
let pickedLat = 12.9716;
let pickedLng = 77.5946;
let locationMap = null;
let locationMarker = null;
let selectedCategory = "";

const TOTAL_STEPS = 4;

function renderStepBar() {
  const labels = ["Category", "Details", "Location", "Confirm"];
  const bar = document.getElementById("steps-bar");
  let html = "";
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const dotClass = i < currentStep ? "done" : i === currentStep ? "active" : "";
    const labelClass = i === currentStep ? "active" : "";
    const lineClass = i < currentStep ? "done" : "";
    html += `<div class="step-item">
      <div class="step-row">
        <div class="step-dot ${dotClass}">${i < currentStep ? "✓" : i + 1}</div>
        ${i < TOTAL_STEPS - 1 ? `<div class="step-line ${lineClass}"></div>` : ""}
      </div>
      <div class="step-label ${labelClass}">${labels[i]}</div>
    </div>`;
  }
  bar.innerHTML = html;
}

function showStep(n) {
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const el = document.getElementById("step-" + i);
    if (el) el.classList.toggle("hidden", i !== n);
  }
  document.getElementById("btn-back").style.visibility = n === 0 ? "hidden" : "visible";
  document.getElementById("btn-next").classList.toggle("hidden", n === TOTAL_STEPS - 1);
  document.getElementById("btn-submit").classList.toggle("hidden", n !== TOTAL_STEPS - 1);

  if (n === 2) initLocationMap();
  if (n === 3) renderSummary();
}

function canProceed() {
  if (currentStep === 0) return !!selectedCategory;
  if (currentStep === 1) return !!document.getElementById("f-desc").value.trim();
  if (currentStep === 2) return !!document.getElementById("f-address").value.trim();
  return true;
}

function nextStep() {
  if (!canProceed()) {
    if (currentStep === 0) alert("Please select a category.");
    if (currentStep === 1) alert("Please describe the situation.");
    if (currentStep === 2) alert("Please enter an address.");
    return;
  }
  currentStep = Math.min(currentStep + 1, TOTAL_STEPS - 1);
  renderStepBar();
  showStep(currentStep);
}

function prevStep() {
  currentStep = Math.max(currentStep - 1, 0);
  renderStepBar();
  showStep(currentStep);
}

function renderCategories() {
  const list = document.getElementById("category-list");
  list.innerHTML = HB.CATEGORIES.map(cat => `
    <button class="category-option ${selectedCategory === cat.value ? "selected" : ""}"
      onclick="selectCategory('${cat.value}', this)">
      ${cat.label}
    </button>
  `).join("");
}

function selectCategory(value, btn) {
  selectedCategory = value;
  document.querySelectorAll(".category-option").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
}

function initLocationMap() {
  if (locationMap) return;
  locationMap = L.map("location-map").setView([pickedLat, pickedLng], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(locationMap);
  locationMarker = L.marker([pickedLat, pickedLng]).addTo(locationMap);
  locationMap.on("click", function (e) {
    pickedLat = e.latlng.lat;
    pickedLng = e.latlng.lng;
    locationMarker.setLatLng([pickedLat, pickedLng]);
    document.getElementById("coords-display").textContent =
      "Pinned at " + pickedLat.toFixed(5) + ", " + pickedLng.toFixed(5);
    const addr = document.getElementById("f-address");
    if (!addr.value) addr.value = pickedLat.toFixed(5) + ", " + pickedLng.toFixed(5);
  });
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = "📍 Getting location...";
  btn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    function (position) {
      pickedLat = position.coords.latitude;
      pickedLng = position.coords.longitude;
      if (locationMarker) {
        locationMarker.setLatLng([pickedLat, pickedLng]);
      }
      if (locationMap) {
        locationMap.setView([pickedLat, pickedLng], 15);
      }
      document.getElementById("coords-display").textContent =
        "Pinned at " + pickedLat.toFixed(5) + ", " + pickedLng.toFixed(5);
      const addr = document.getElementById("f-address");
      addr.value = pickedLat.toFixed(5) + ", " + pickedLng.toFixed(5);
      btn.textContent = originalText;
      btn.disabled = false;
    },
    function (error) {
      alert("Could not get location: " + error.message);
      btn.textContent = originalText;
      btn.disabled = false;
    }
  );
}

function renderSummary() {
  const rows = [
    ["Category", HB.getCategoryLabel(selectedCategory)],
    ["Title", document.getElementById("f-title").value || "(none)"],
    ["Description", document.getElementById("f-desc").value],
    ["Location", document.getElementById("f-address").value],
    ["Reporter", document.getElementById("f-name").value || "Anonymous"],
    ["Contact", document.getElementById("f-contact").value || "(none)"],
  ];
  document.getElementById("summary").innerHTML = rows.map(([k, v]) => `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;font-size:.875rem">
      <span style="color:var(--text-muted);font-weight:500;flex-shrink:0">${k}</span>
      <span style="font-weight:500;text-align:right;max-width:65%;overflow-wrap:break-word">${v}</span>
    </div>
  `).join('<div style="height:1px;background:var(--border)"></div>');
}

function submitForm() {
  const btn = document.getElementById("btn-submit");
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;
  setTimeout(() => {
    const citizenInfo = HB.getCitizenInfo();
    const name = document.getElementById("f-name").value || citizenInfo.name;
    const contact = document.getElementById("f-contact").value || citizenInfo.contact;
    
    const report = HB.addReport({
      category:        selectedCategory,
      title:           document.getElementById("f-title").value,
      description:     document.getElementById("f-desc").value,
      locationAddress: document.getElementById("f-address").value,
      latitude:        pickedLat,
      longitude:       pickedLng,
      reporterName:    name,
      reporterContact: contact,
    });
    
    if (HB.isCitizen()) {
      HB.createSMSCheck(report.id);
    }
    
    document.getElementById("confirm-id").textContent = HB.idPad(report.id);
    document.getElementById("form-wrapper").classList.add("hidden");
    document.getElementById("success-screen").classList.remove("hidden");
  }, 700);
}

function resetForm() {
  selectedCategory = "";
  currentStep = 0;
  pickedLat = 12.9716;
  pickedLng = 77.5946;
  locationMap = null;
  locationMarker = null;
  document.getElementById("f-title").value = "";
  document.getElementById("f-desc").value = "";
  document.getElementById("f-name").value = "";
  document.getElementById("f-contact").value = "";
  document.getElementById("f-address").value = "";
  document.getElementById("success-screen").classList.add("hidden");
  document.getElementById("form-wrapper").classList.remove("hidden");
  renderCategories();
  renderStepBar();
  showStep(0);
  prefillCitizenInfo();
}

function prefillCitizenInfo() {
  if (HB.isCitizen()) {
    const info = HB.getCitizenInfo();
    document.getElementById("f-name").value = info.name;
    document.getElementById("f-contact").value = info.contact;
  }
}

// Init
renderCategories();
renderStepBar();
showStep(0);
prefillCitizenInfo();
