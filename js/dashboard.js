/* ─── Dashboard logic ─── */
if (!HB.requireAdmin()) { /* redirected */ }

function checkStaleReports() {
  const staleReports = HB.getStaleReports(24);
  staleReports.forEach(report => {
    const existingCheck = HB.getSMSChecks().find(c => c.reportId === report.id && c.status === "pending");
    if (!existingCheck) {
      HB.createSMSCheck(report.id);
    }
  });
}

function render() {
  const stats = HB.getStats();
  const reports = HB.getReports();

  // Stats
  document.getElementById("stat-total").textContent    = stats.total;
  document.getElementById("stat-reported").textContent = stats.reported;
  document.getElementById("stat-progress").textContent = stats.inProgress;
  document.getElementById("stat-resolved").textContent = stats.resolved;

  // Recent reports (latest 5)
  const recent = [...reports]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const tbody = document.getElementById("recent-body");
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-state"><div class="icon">📋</div>No reports yet</td></tr>`;
  } else {
    tbody.innerHTML = recent.map(r => `
      <tr>
        <td>
          <div class="row-title">${r.title || r.description.slice(0, 50) + "…"}</div>
          <div class="row-meta">${HB.getCategoryLabel(r.category)} · ${HB.formatDate(r.createdAt)}</div>
        </td>
        <td style="text-align:right;white-space:nowrap">${HB.badgeHtml(r.status)}</td>
      </tr>
    `).join("");
  }

  // Category breakdown
  const breakdown = document.getElementById("cat-breakdown");
  breakdown.innerHTML = stats.byCategory.map(({ label, count }) => {
    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
    return `
      <div style="margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.3rem">
          <span style="font-weight:500;color:var(--text)">${label}</span>
          <span style="color:var(--text-muted)">${count}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join("");
  
  // SMS Verification alerts
  const pendingChecks = HB.getPendingSMSChecks();
  const alertContainer = document.getElementById("sms-alerts-container");
  if (alertContainer && pendingChecks.length > 0) {
    alertContainer.innerHTML = `
      <div style="background:var(--amber-bg);border:1px solid var(--amber-border);border-radius:var(--radius);padding:1rem;margin-bottom:1.5rem">
        <div style="font-weight:600;color:#92400e;margin-bottom:0.5rem">📱 ${pendingChecks.length} Verification Check(s) Pending</div>
        <p style="font-size:0.875rem;color:#92400e;margin-bottom:0.75rem">These reports have been in "reported" status for over 24 hours and need verification.</p>
        ${pendingChecks.map(check => {
          const report = HB.getReports().find(r => r.id === check.reportId);
          if (!report) return '';
          return `
            <div style="background:white;border-radius:var(--radius-sm);padding:0.75rem;margin-bottom:0.5rem;font-size:0.85rem">
              <div style="font-weight:500;margin-bottom:0.25rem">${report.title || report.description.slice(0, 40)}</div>
              <div style="color:var(--text-muted);margin-bottom:0.5rem">${report.locationAddress}</div>
              <div style="display:flex;gap:0.5rem">
                <button class="btn btn-sm" style="background:#10B981;color:white;padding:0.35rem 0.75rem;font-size:0.75rem" onclick="confirmPresence(${check.id}, true)">✓ Still Present</button>
                <button class="btn btn-sm" style="background:#EF4444;color:white;padding:0.35rem 0.75rem;font-size:0.75rem" onclick="confirmPresence(${check.id}, false)">✗ Not Present</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

function confirmPresence(checkId, isPresent) {
  const check = HB.updateSMSCheck(checkId, isPresent);
  const report = HB.getReports().find(r => r.id === check.reportId);
  
  if (!isPresent) {
    HB.deleteReport(report.id);
    alert("Report #" + HB.idPad(report.id) + " has been archived (subject not present).");
  } else {
    HB.updateReport(report.id, { status: "in_progress" });
    alert("Report #" + HB.idPad(report.id) + " marked as In Progress.");
  }
  
  render();
}

checkStaleReports();
render();
