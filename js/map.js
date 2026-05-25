/* ─── Map view logic ─── */
if (!HB.requireAdmin()) { /* redirected */ }

const reports = HB.getReports();

document.getElementById("map-count").textContent =
  reports.length + " report" + (reports.length !== 1 ? "s" : "") + " on map";

// Center map on first report, fallback to Bengaluru, Karnataka
const center = reports.length > 0
  ? [reports[0].latitude, reports[0].longitude]
  : [12.9716, 77.5946];

const map = L.map("map").setView(center, 11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

function makeIcon(color) {
  return L.divIcon({
    html: `<div style="
      width:18px;height:18px;
      background:${color};
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.35)
    "></div>`,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -14],
  });
}

const openIcon     = makeIcon("#F59E0B");
const resolvedIcon = makeIcon("#10B981");

reports.forEach(r => {
  const icon = r.status === "resolved" ? resolvedIcon : openIcon;
  const marker = L.marker([r.latitude, r.longitude], { icon }).addTo(map);

  const resolveBtn = r.status !== "resolved"
    ? `<button onclick="resolveMarker(${r.id}, this)"
         style="width:100%;padding:.5rem;margin-top:.5rem;
                background:#ecfdf5;color:#065f46;border:none;
                border-radius:.5rem;font-size:.78rem;font-weight:600;
                cursor:pointer;font-family:inherit">
         ✅ Mark Resolved
       </button>`
    : "";

  marker.bindPopup(`
    <div class="popup-inner">
      <div class="popup-head">
        ${HB.badgeHtml(r.status)}
        <span style="font-size:.7rem;color:var(--text-muted)">${HB.idPad(r.id)}</span>
      </div>
      <div class="popup-title">${r.title || HB.getCategoryLabel(r.category)}</div>
      <div class="popup-cat">${HB.getCategoryLabel(r.category)}</div>
      <div class="popup-desc">${r.description}</div>
      <div class="popup-meta">${r.locationAddress} · ${HB.formatDate(r.createdAt)}</div>
      ${resolveBtn}
    </div>
  `);

  // Store marker ref for resolve
  marker._reportId = r.id;
  marker._isOpen = r.status !== "resolved";
});

function resolveMarker(id, btn) {
  HB.resolveReport(id);
  btn.disabled = true;
  btn.textContent = "✓ Resolved";
  btn.style.background = "#d1fae5";
  // Update count display
  const resolved = HB.getReports().filter(r => r.status === "resolved").length;
  const total = HB.getReports().length;
  document.getElementById("map-count").textContent = total + " report" + (total !== 1 ? "s" : "") + " on map";
}
