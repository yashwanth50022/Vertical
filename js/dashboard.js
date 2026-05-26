/* ─── Dashboard logic ─── */
if (!HB.requireAdmin()) { /* redirected */ }

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
}

render();
