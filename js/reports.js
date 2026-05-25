/* ─── Reports table logic ─── */
if (!HB.requireAdmin()) { /* redirected */ }

let selectedId = null;

// Populate category filter
const catFilter = document.getElementById("filter-cat");
HB.CATEGORIES.forEach(c => {
  const opt = document.createElement("option");
  opt.value = c.value;
  opt.textContent = c.label;
  catFilter.appendChild(opt);
});

function getFiltered() {
  const q      = document.getElementById("search-input").value.toLowerCase();
  const status = document.getElementById("filter-status").value;
  const cat    = document.getElementById("filter-cat").value;
  return HB.getReports().filter(r => {
    if (status && r.status !== status) return false;
    if (cat    && r.category !== cat)  return false;
    if (q) {
      const haystack = [r.title, r.description, r.locationAddress, r.reporterName, r.category]
        .join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function renderTable() {
  const rows = getFiltered();
  document.getElementById("report-count").textContent =
    rows.length + " report" + (rows.length !== 1 ? "s" : "") + " found";

  const tbody = document.getElementById("reports-body");
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><div class="icon">🔍</div>No reports found</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr class="${selectedId === r.id ? "active" : ""}" onclick="selectReport(${r.id})">
      <td>
        <span class="row-title">${r.title || r.description.slice(0, 48) + "…"}</span>
        <span class="row-sub">${r.locationAddress}</span>
      </td>
      <td style="white-space:nowrap;color:var(--text-muted);font-size:.8rem">${HB.getCategoryLabel(r.category)}</td>
      <td>${HB.badgeHtml(r.status)}</td>
      <td style="white-space:nowrap;font-size:.8rem;color:var(--text-muted)">${HB.formatDate(r.createdAt)}</td>
    </tr>
  `).join("");
}

function selectReport(id) {
  selectedId = id === selectedId ? null : id;
  renderTable();
  renderPanel();
}

function closePanel() {
  selectedId = null;
  renderTable();
  renderPanel();
}

function renderPanel() {
  const panel = document.getElementById("detail-panel");
  if (!selectedId) { panel.classList.add("hidden"); return; }
  panel.classList.remove("hidden");

  const r = HB.getReports().find(x => x.id === selectedId);
  if (!r) { panel.classList.add("hidden"); return; }

  const fields = [
    ["Status",    HB.badgeHtml(r.status)],
    ["Category",  HB.getCategoryLabel(r.category)],
    r.title        ? ["Title",    r.title]             : null,
    ["Description", r.description],
    ["Location",    r.locationAddress],
    r.reporterName ? ["Reporter", r.reporterName + (r.reporterContact ? " · " + r.reporterContact : "")] : null,
    r.adminNotes   ? ["Admin Notes", r.adminNotes]     : null,
    ["Submitted",   HB.formatDate(r.createdAt)],
    r.resolvedAt   ? ["Resolved", HB.formatDate(r.resolvedAt)] : null,
  ].filter(Boolean);

  document.getElementById("detail-body").innerHTML = fields.map(([k, v]) => `
    <div class="detail-field">
      <div class="field-label">${k}</div>
      <div class="field-value">${v}</div>
    </div>
  `).join("");

  const actions = [];
  if (r.status === "reported") {
    actions.push(`<button class="btn btn-blue btn-sm" onclick="setStatus(${r.id},'in_progress')">⏳ Mark In Progress</button>`);
  }
  if (r.status !== "resolved") {
    actions.push(`<button class="btn btn-green btn-sm" onclick="resolveReport(${r.id})">✅ Mark Resolved</button>`);
  }
  actions.push(`<button class="btn btn-red btn-sm" onclick="deleteReport(${r.id})">🗑 Delete Report</button>`);

  document.getElementById("detail-actions").innerHTML = actions.join("");
}

function setStatus(id, status) {
  HB.updateReport(id, { status });
  renderTable();
  renderPanel();
}

function resolveReport(id) {
  HB.resolveReport(id);
  renderTable();
  renderPanel();
}

function deleteReport(id) {
  if (!confirm("Delete this report? This cannot be undone.")) return;
  HB.deleteReport(id);
  selectedId = null;
  renderTable();
  renderPanel();
}

renderTable();
