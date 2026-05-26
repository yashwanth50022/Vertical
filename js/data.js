/* ─── HopeBridge shared data layer ─── */
const HB = {

  CATEGORIES: [
    { value: "homeless",         label: "Homeless",         icon: "🏠" },
    { value: "unstable_shelter", label: "Unstable Shelter", icon: "⚠️" },
    { value: "child_support",    label: "Child Support",    icon: "👶" },
    { value: "animal_shelter",   label: "Animal Shelter",   icon: "🐾" },
  ],

  STATUS: {
    reported:    { label: "Reported",    cls: "badge-amber" },
    in_progress: { label: "In Progress", cls: "badge-blue"  },
    resolved:    { label: "Resolved",    cls: "badge-green" },
  },

  /* ── Shelter Network ── */
  SHELTERS_DEFAULT: [
    { id: "sh1", name: "Hope Haven",         type: "people",   address: "42 Main St",        phone: "555-0101", email: "hopehaven@hb.org",   capacity: 80,  occupied: 78, accepts: ["homeless","unstable_shelter"] },
    { id: "sh2", name: "Sunrise House",      type: "people",   address: "7 Riverside Dr",    phone: "555-0102", email: "sunrise@hb.org",      capacity: 60,  occupied: 31, accepts: ["homeless","unstable_shelter"] },
    { id: "sh3", name: "Little Wings",       type: "children", address: "15 Oak Ave",        phone: "555-0103", email: "littlewings@hb.org",  capacity: 40,  occupied: 22, accepts: ["child_support"] },
    { id: "sh4", name: "Safe Nest",          type: "children", address: "88 Park Blvd",      phone: "555-0104", email: "safenest@hb.org",     capacity: 35,  occupied: 34, accepts: ["child_support"] },
    { id: "sh5", name: "Paws & Claws",       type: "animals",  address: "200 Industrial Rd", phone: "555-0105", email: "pawsclaws@hb.org",    capacity: 120, occupied: 45, accepts: ["animal_shelter"] },
    { id: "sh6", name: "City Animal Rescue", type: "animals",  address: "310 Harbor Lane",   phone: "555-0106", email: "cityrescue@hb.org",   capacity: 90,  occupied: 88, accepts: ["animal_shelter"] },
    { id: "sh7", name: "New Dawn Centre",    type: "people",   address: "5 Valley Rd",       phone: "555-0107", email: "newdawn@hb.org",      capacity: 50,  occupied: 12, accepts: ["homeless","unstable_shelter","child_support"] },
  ],
  getShelters() {
    try { return JSON.parse(localStorage.getItem("hb_shelters") || "null") || JSON.parse(JSON.stringify(this.SHELTERS_DEFAULT)); }
    catch { return JSON.parse(JSON.stringify(this.SHELTERS_DEFAULT)); }
  },
  saveShelters(shelters) { localStorage.setItem("hb_shelters", JSON.stringify(shelters)); },
  updateShelterOccupancy(id, delta) {
    const shelters = this.getShelters();
    const sh = shelters.find(s => s.id === id);
    if (!sh) return;
    sh.occupied = Math.max(0, Math.min(sh.capacity, sh.occupied + delta));
    this.saveShelters(shelters);
  },

  /* ── Transfer Requests ── */
  getTransfers() {
    try { return JSON.parse(localStorage.getItem("hb_transfers") || "[]"); }
    catch { return []; }
  },
  saveTransfers(t) { localStorage.setItem("hb_transfers", JSON.stringify(t)); },
  addTransfer(data) {
    const transfers = this.getTransfers();
    const t = {
      id:            Date.now(),
      fromShelterId: data.fromShelterId,
      toShelterId:   data.toShelterId,
      category:      data.category,
      count:         data.count,
      notes:         data.notes || "",
      status:        "pending",
      createdAt:     new Date().toISOString(),
    };
    transfers.unshift(t);
    this.saveTransfers(transfers);
    return t;
  },
  updateTransfer(id, updates) {
    const transfers = this.getTransfers();
    const idx = transfers.findIndex(t => t.id === id);
    if (idx === -1) return null;
    transfers[idx] = { ...transfers[idx], ...updates };
    this.saveTransfers(transfers);
    return transfers[idx];
  },

  /* ── Reports ── */
  getReports() {
    try { return JSON.parse(localStorage.getItem("hb_reports") || "[]"); }
    catch { return []; }
  },
  saveReports(reports) { localStorage.setItem("hb_reports", JSON.stringify(reports)); },
  addReport(data) {
    const reports = this.getReports();
    const report = {
      id:              Date.now(),
      category:        data.category,
      title:           data.title || "",
      description:     data.description,
      locationAddress: data.locationAddress,
      latitude:        data.latitude,
      longitude:       data.longitude,
      status:          "reported",
      reporterName:    data.reporterName || "",
      reporterContact: data.reporterContact || "",
      adminNotes:      "",
      createdAt:       new Date().toISOString(),
      resolvedAt:      null,
    };
    reports.unshift(report);
    this.saveReports(reports);
    return report;
  },
  updateReport(id, updates) {
    const reports = this.getReports();
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return null;
    reports[idx] = { ...reports[idx], ...updates };
    this.saveReports(reports);
    return reports[idx];
  },
  resolveReport(id) {
    return this.updateReport(id, { status: "resolved", resolvedAt: new Date().toISOString() });
  },
  deleteReport(id) {
    this.saveReports(this.getReports().filter(r => r.id !== id));
  },
  getStats() {
    const reports = this.getReports();
    const byCategory = this.CATEGORIES.map(c => ({
      category: c.value,
      label:    c.label,
      count:    reports.filter(r => r.category === c.value).length,
    }));
    return {
      total:      reports.length,
      reported:   reports.filter(r => r.status === "reported").length,
      inProgress: reports.filter(r => r.status === "in_progress").length,
      resolved:   reports.filter(r => r.status === "resolved").length,
      byCategory,
    };
  },

  /* ── Auth ── */
  isAdmin()  { return sessionStorage.getItem("hb_admin") === "true"; },
  requireAdmin() {
    if (!this.isAdmin()) { window.location.href = "admin.html"; return false; }
    return true;
  },
  logout() {
    sessionStorage.removeItem("hb_admin");
    window.location.href = "admin.html";
  },

  /* ── Citizen Auth ── */
  isCitizen() { return sessionStorage.getItem("hb_citizen") === "true"; },
  getCitizenInfo() {
    return {
      name: sessionStorage.getItem("hb_citizen_name") || "",
      email: sessionStorage.getItem("hb_citizen_email") || "",
      contact: sessionStorage.getItem("hb_citizen_contact") || "",
    };
  },
  loginCitizen(name, email, contact) {
    sessionStorage.setItem("hb_citizen", "true");
    sessionStorage.setItem("hb_citizen_name", name);
    sessionStorage.setItem("hb_citizen_email", email);
    sessionStorage.setItem("hb_citizen_contact", contact);
  },
  logoutCitizen() {
    sessionStorage.removeItem("hb_citizen");
    sessionStorage.removeItem("hb_citizen_name");
    sessionStorage.removeItem("hb_citizen_email");
    sessionStorage.removeItem("hb_citizen_contact");
    window.location.href = "index.html";
  },

  /* ── SMS Verification ── */
  getSMSChecks() {
    try { return JSON.parse(localStorage.getItem("hb_sms_checks") || "[]"); }
    catch { return []; }
  },
  saveSMSChecks(checks) { localStorage.setItem("hb_sms_checks", JSON.stringify(checks)); },
  createSMSCheck(reportId) {
    const checks = this.getSMSChecks();
    const check = {
      id: Date.now(),
      reportId: reportId,
      createdAt: new Date().toISOString(),
      status: "pending",
      response: null,
    };
    checks.push(check);
    this.saveSMSChecks(checks);
    return check;
  },
  updateSMSCheck(checkId, response) {
    const checks = this.getSMSChecks();
    const check = checks.find(c => c.id === checkId);
    if (check) {
      check.status = "completed";
      check.response = response;
      this.saveSMSChecks(checks);
    }
    return check;
  },
  getStaleReports(hoursThreshold = 24) {
    const reports = this.getReports();
    const now = new Date();
    return reports.filter(r => {
      if (r.status !== "reported") return false;
      const createdTime = new Date(r.createdAt);
      const hoursDiff = (now - createdTime) / (1000 * 60 * 60);
      return hoursDiff >= hoursThreshold;
    });
  },
  getPendingSMSChecks() {
    return this.getSMSChecks().filter(c => c.status === "pending");
  },

  /* ── Utilities ── */
  formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  },
  getCategoryLabel(value) {
    return this.CATEGORIES.find(c => c.value === value)?.label ?? value;
  },
  badgeHtml(status) {
    const s = this.STATUS[status] || this.STATUS.reported;
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  },
  idPad(id) { return "#" + String(id).slice(-5).padStart(5, "0"); },

  /* ── Seed data ── */
  seedIfEmpty() {

    const now = new Date();
    const ago = (days) => new Date(now - days * 86400000).toISOString();
    const seeds = [
      { id: 1000001, category: "child_support",    title: "Unaccompanied minors near shelter", description: "Three children aged 5-12 found near the riverside shelter without guardians. They appear malnourished and need immediate care.", locationAddress: "Cubbon Park Road, Bengaluru", latitude: 12.9763, longitude: 77.5929, status: "reported",    reporterName: "Maria L.",    reporterContact: "maria@email.com", adminNotes: "",                                      createdAt: ago(2),  resolvedAt: null },
      { id: 1000002, category: "unstable_shelter", title: "Elderly man sleeping rough",         description: "An elderly gentleman in his 70s has been sleeping behind the library for a week. He says he lost his apartment last month.",     locationAddress: "Mysuru Road, Bengaluru",       latitude: 12.9550, longitude: 77.5350, status: "in_progress", reporterName: "James T.",    reporterContact: "555-0192",        adminNotes: "Contacted city outreach team.",          createdAt: ago(5),  resolvedAt: null },
      { id: 1000003, category: "animal_shelter",   title: "Injured stray dogs, 4 found",        description: "Four stray dogs found near the industrial area. Two appear injured. They need veterinary attention and shelter.",                locationAddress: "Peenya Industrial Area, Bengaluru", latitude: 13.0281, longitude: 77.5198, status: "resolved",   reporterName: "Alex P.",     reporterContact: "",               adminNotes: "Dogs transported to county shelter.",     createdAt: ago(10), resolvedAt: ago(3) },
      { id: 1000004, category: "homeless",         title: "Family of 5 evicted today",           description: "A family with three young children was evicted this morning. They are currently on the street near Jayanagar.",                locationAddress: "Jayanagar 4th Block, Bengaluru", latitude: 12.9258, longitude: 77.5833, status: "resolved",   reporterName: "Neighbor",    reporterContact: "",               adminNotes: "Family placed in transitional housing.", createdAt: ago(7),  resolvedAt: ago(6) },
      { id: 1000005, category: "unstable_shelter", title: "Young woman with infant, no shelter", description: "A young woman with an infant was found near the bus station. She has been without stable housing for two weeks.",               locationAddress: "Majestic Bus Station, Bengaluru", latitude: 12.9772, longitude: 77.5664, status: "in_progress", reporterName: "Director S.", reporterContact: "shelter@hh.org", adminNotes: "Coordinating with partner shelters.",    createdAt: ago(3),  resolvedAt: null },
      { id: 1000006, category: "child_support",    title: "After-school program needed",         description: "Roughly 30 children in the area have no after-school supervision as the program lost funding last month.",                     locationAddress: "Rajajinagar Community Centre, Bengaluru", latitude: 12.9916, longitude: 77.5530, status: "reported",    reporterName: "Teacher M.", reporterContact: "555-0234",        adminNotes: "",                                      createdAt: ago(0),  resolvedAt: null },
      { id: 1000007, category: "animal_shelter",   title: "Cat colony — TNR support needed",     description: "A colony of approximately 25 cats near the park needs trap-neuter-return support and regular feeding coordination.",            locationAddress: "Lalbagh Botanical Garden, Bengaluru", latitude: 12.9507, longitude: 77.5848, status: "reported",    reporterName: "",            reporterContact: "",               adminNotes: "",                                      createdAt: ago(4),  resolvedAt: null },
      { id: 1000008, category: "homeless",         title: "Veteran sleeping under the bridge",   description: "A veteran in his mid-50s has been living under the bridge for three weeks. He is in poor health and needs shelter.",            locationAddress: "Silk Board Junction, Bengaluru", latitude: 12.9172, longitude: 77.6230, status: "reported",    reporterName: "",            reporterContact: "",               adminNotes: "",                                      createdAt: ago(1),  resolvedAt: null },
    ];
    // Overwrite if empty OR if all reports have old NYC/US coords (negative longitude)
    const existing = this.getReports();
    const hasOldCoords = existing.length > 0 && existing.every(r => r.longitude < 0);
    if (existing.length === 0 || hasOldCoords) {
      this.saveReports(seeds);
    }
  },
};

HB.seedIfEmpty();
