/**
 * 5S VPI - BẢN V29 (25/11/2026) - các tính năng bổ sung, nạp SAU app.js
 *  1. Danh mục khu vực 5S toàn viện theo Google Sheet "DS các khu vực 5S toàn viện VPI" (18 khoa/phòng, 57 vị trí)
 *     -> Admin bấm "Áp dụng danh mục" một lần để đưa lên máy chủ cho mọi máy
 *  2. Phân quyền khu vực (thêm / bớt khu vực) cho người duyệt 5S, lãnh đạo khoa phòng, ĐD trưởng, người phụ trách
 *  3. Tab THỐNG KÊ:
 *     - Khu vực đã thực hiện / chưa thực hiện 5S (theo ngày hoặc khoảng ngày)
 *     - Biểu đồ thành tích các khoa phòng (căn cứ bình xét thi đua cuối năm)
 *     - Danh sách cá nhân vi phạm, số lần vi phạm
 *  Không chấm điểm số: chỉ tính Đã thực hiện / Chưa thực hiện và Đạt / Không đạt.
 */
(function () {
  'use strict';
  if (typeof App5S === 'undefined') return;
  const P = App5S.prototype;

  const AREA_CATALOG_VERSION = 'sheet-20261125';
  // Màu trạng thái (bảng màu trạng thái cố định: tốt / cảnh báo / nghiêm trọng + xám trung tính)
  const STATUS = {
    approved: { color: '#0ca30c', label: 'Đạt', icon: '✓' },
    rejected: { color: '#d03b3b', label: 'Không đạt', icon: '✕' },
    submitted: { color: '#fab219', label: 'Chờ duyệt', icon: '…' },
    missing: { color: '#a3a3a3', label: 'Chưa thực hiện', icon: '○' }
  };
  const DEFAULT_GRADES = { excellent: [95, 95], good: [85, 85], pass: [70, 70] };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const jsq = (s) => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const weekday = (iso) => new Date(iso + 'T00:00:00Z').getUTCDay();
  const fmtVN = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
  const pct = (a, b) => (b > 0 ? Math.round((a * 1000) / b) / 10 : null);
  const pctTxt = (v) => (v == null ? '—' : `${String(v).replace('.', ',')}%`);
  const normCode = (c) => String(c || '').trim().toUpperCase();

  // =========================================================================
  // 1. DANH MỤC KHU VỰC 5S
  // =========================================================================
  P.getFiveSDepartments = function () {
    const withRooms = new Set((this.data.rooms || []).map(r => String(r.department_id)));
    return this.getSortedDepartments().filter(d => d.in_5s !== false && withRooms.has(String(d.id)));
  };

  P.needsAreaCatalogUpdate = function () {
    return this.isAdmin() && ((this.data.hospital || {}).area_catalog_version !== AREA_CATALOG_VERSION);
  };

  P.applyAreaCatalog = function () {
    if (!this.isAdmin()) { this.showToast('🔒 Chỉ Admin được áp dụng danh mục khu vực.'); return; }
    const seedRooms = (typeof DEFAULT_SEED_DATA !== 'undefined' && DEFAULT_SEED_DATA.rooms) || [];
    const seedDepts = (typeof DEFAULT_SEED_DATA !== 'undefined' && DEFAULT_SEED_DATA.departments) || [];
    if (!seedRooms.length) return;
    const inSheet = seedDepts.filter(d => d.in_5s !== false);
    if (!confirm(`Áp dụng danh mục khu vực 5S toàn viện mới?\n\n• ${inSheet.length} khoa/phòng, ${seedRooms.length} vị trí làm việc 5S (theo Google Sheet ngày 25/11/2026)\n• ${(this.data.rooms || []).length} khu vực cũ được chuyển vào lưu trữ (vẫn xem lại được lịch sử)\n• Khoa/phòng không có trong danh sách vẫn giữ nhân sự, chỉ ẩn khỏi danh mục 5S\n\nThay đổi áp dụng cho mọi máy.`)) return;

    const seedIds = new Set(seedRooms.map(r => String(r.id)));
    const archived = Array.isArray(this.data.archived_rooms) ? this.data.archived_rooms.slice() : [];
    const archivedIds = new Set(archived.map(r => String(r.id)));
    (this.data.rooms || []).forEach(r => {
      if (!seedIds.has(String(r.id)) && !archivedIds.has(String(r.id))) {
        archived.push({ id: r.id, department_id: r.department_id, code: r.code || '', name: r.name, archived_at: this.getTodayDateString() });
      }
    });
    this.data.archived_rooms = archived;
    this.data.rooms = JSON.parse(JSON.stringify(seedRooms));

    const byId = new Map((this.data.departments || []).map(d => [String(d.id), d]));
    const seedIdSet = new Set(seedDepts.map(d => String(d.id)));
    seedDepts.forEach(sd => {
      const cur = byId.get(String(sd.id));
      if (cur) {
        cur.name = sd.name; cur.order = sd.order; cur.category = sd.category; cur.in_5s = sd.in_5s !== false;
        if (!cur.code) cur.code = sd.code;
      } else {
        const nd = JSON.parse(JSON.stringify(sd));
        this.data.departments.push(nd);
        byId.set(String(nd.id), nd);
      }
    });
    (this.data.departments || []).forEach(d => { if (!seedIdSet.has(String(d.id))) d.in_5s = false; });

    if (!this.data.hospital) this.data.hospital = {};
    this.data.hospital.area_catalog_version = AREA_CATALOG_VERSION;
    this.saveData();
    this.render();
    this.showToast(`✅ Đã áp dụng ${seedRooms.length} vị trí 5S của ${inSheet.length} khoa/phòng. Đang gửi lên máy chủ...`);
  };

  P.findRoomAny = function (roomId) {
    return (this.data.rooms || []).find(r => r.id == roomId) || (this.data.archived_rooms || []).find(r => r.id == roomId) || null;
  };

  // =========================================================================
  // 2. PHÂN QUYỀN KHU VỰC (THÊM / BỚT)
  // =========================================================================
  P.describeAreaScope = function (s) {
    const sc = this.getAreaScope(s);
    if (sc.all) return 'Toàn viện';
    if (!sc.rooms.size) return 'Chưa giao khu vực';
    return `${sc.rooms.size} khu vực${sc.custom ? '' : ' (mặc định theo khoa)'}`;
  };

  P.roleLabel5S = function (s) {
    if (!s) return '';
    if (s.role === 'admin' || s.is_admin === true) return 'Admin / Ban chỉ đạo';
    if (s.role === 'supervisor' && s.can_review) return 'Giám sát toàn viện';
    if (s.role === 'manager' || s.role_level === 'manager') return s.can_review ? 'Lãnh đạo khoa (được duyệt)' : 'Lãnh đạo khoa / ĐD trưởng';
    if (s.can_review) return 'Người duyệt 5S';
    return 'Nhân viên phụ trách';
  };

  P.openAreaScopeModal = function (code) {
    if (!this.isAdmin()) { this.showToast('🔒 Chỉ Admin được phân quyền khu vực.'); return; }
    const s = (this.data.staff || []).find(x => normCode(x.code) === normCode(code));
    if (!s) return;
    const sc = this.getAreaScope(s);
    this.areaScopeDraft = { code: s.code, all: sc.all, rooms: new Set(sc.rooms), fromManager: !!this.areaScopeFromManager };
    this.renderAreaScopeModal();
  };

  P.renderAreaScopeModal = function () {
    const dr = this.areaScopeDraft;
    if (!dr) return;
    const s = (this.data.staff || []).find(x => normCode(x.code) === normCode(dr.code));
    if (!s) return;
    const leader = (s.role === 'admin' || s.is_admin === true) || ((s.role === 'supervisor' || s.is_supervisor) && s.can_review);
    const depts = this.getFiveSDepartments();
    const meaning = s.can_review ? 'được DUYỆT ảnh 5S (Đạt / Không đạt) và xem báo cáo của các khu vực này'
      : ((s.role === 'manager' || s.role_level === 'manager') ? 'quản lý, theo dõi báo cáo và phân công nhân sự các khu vực này'
        : 'PHỤ TRÁCH thực hiện 5S các khu vực này (dùng để thống kê vi phạm khi khu vực chưa được phân công theo ca)');
    const html = `
      <div class="p-4 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar text-xs">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white">PHÂN QUYỀN KHU VỰC 5S</h3>
            <p class="text-[11px] text-slate-500">${esc(s.name)} • ${esc(s.code)} • ${esc(this.roleLabel5S(s))}</p>
          </div>
          <button onclick="app5s.closeAreaScopeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        ${leader ? `
          <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-900 dark:text-emerald-200">
            Tài khoản thuộc Admin / Ban chỉ đạo: luôn được toàn quyền <strong>toàn viện</strong>, không cần giao khu vực.
          </div>
        ` : `
          <div class="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
            Khu vực được chọn: tài khoản ${meaning}.
          </div>
          <label class="flex items-center space-x-2 p-2.5 rounded-xl border ${dr.all ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'} cursor-pointer">
            <input type="checkbox" ${dr.all ? 'checked' : ''} onchange="app5s.toggleAreaScopeAll(this.checked)" class="w-4 h-4 rounded text-emerald-600">
            <span class="font-bold">🏥 Toàn viện (tất cả ${(this.data.rooms || []).length} khu vực)</span>
          </label>
          <div class="flex items-center justify-between text-[11px] text-slate-500">
            <span>Đã chọn: <strong class="text-slate-800 dark:text-slate-100">${dr.all ? 'toàn viện' : dr.rooms.size + ' khu vực'}</strong></span>
            <button type="button" onclick="app5s.clearAreaScopeDraft()" class="text-red-600 font-bold hover:underline">Bỏ chọn tất cả</button>
          </div>
          <div class="space-y-2 ${dr.all ? 'opacity-50 pointer-events-none' : ''}">
            ${depts.map(d => {
              const rooms = this.getSortedRooms(d.id);
              const nSel = rooms.filter(r => dr.rooms.has(String(r.id))).length;
              return `
                <div id="scope-dept-${d.id}" class="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <label class="flex items-center justify-between px-2.5 py-2 bg-slate-50 dark:bg-slate-900 cursor-pointer">
                    <span class="flex items-center space-x-2">
                      <input type="checkbox" ${nSel === rooms.length && rooms.length ? 'checked' : ''} onchange="app5s.toggleAreaScopeDept(${d.id}, this.checked)" class="w-4 h-4 rounded text-indigo-600">
                      <span class="font-bold text-slate-800 dark:text-slate-100">${esc(d.name)}</span>
                    </span>
                    <span class="text-[10px] font-mono ${nSel ? 'text-indigo-600 font-bold' : 'text-slate-400'}">${nSel}/${rooms.length}</span>
                  </label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-2 px-2.5 py-1.5">
                    ${rooms.map(r => `
                      <label class="flex items-center space-x-2 py-1 cursor-pointer">
                        <input type="checkbox" ${dr.rooms.has(String(r.id)) ? 'checked' : ''} onchange="app5s.toggleAreaScopeRoom(${r.id}, this.checked)" class="w-4 h-4 rounded text-indigo-600">
                        <span class="${dr.rooms.has(String(r.id)) ? 'font-bold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}">${esc(r.name)}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="grid grid-cols-2 gap-2 pt-1 sticky bottom-0 bg-white dark:bg-slate-800 pb-1">
            <button onclick="app5s.saveAreaScope(true)" class="py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200">Về mặc định</button>
            <button onclick="app5s.saveAreaScope(false)" class="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black">Lưu phân quyền</button>
          </div>
          <p class="text-[10px] text-slate-400">Mặc định: người duyệt = toàn viện; lãnh đạo khoa = các khu vực của khoa mình; nhân viên = chưa giao.</p>
        `}
      </div>
    `;
    this.showModal(html, { wide: true });
  };

  P.toggleAreaScopeAll = function (checked) { if (this.areaScopeDraft) { this.areaScopeDraft.all = !!checked; this.renderAreaScopeModal(); } };
  P.clearAreaScopeDraft = function () { if (this.areaScopeDraft) { this.areaScopeDraft.all = false; this.areaScopeDraft.rooms = new Set(); this.renderAreaScopeModal(); } };
  P.toggleAreaScopeDept = function (deptId, checked) {
    const dr = this.areaScopeDraft; if (!dr) return;
    this.getSortedRooms(deptId).forEach(r => { if (checked) dr.rooms.add(String(r.id)); else dr.rooms.delete(String(r.id)); });
    this.renderAreaScopeModal();
  };
  P.toggleAreaScopeRoom = function (roomId, checked) {
    const dr = this.areaScopeDraft; if (!dr) return;
    if (checked) dr.rooms.add(String(roomId)); else dr.rooms.delete(String(roomId));
    this.renderAreaScopeModal();
  };
  P.closeAreaScopeModal = function () {
    const back = this.areaScopeDraft && this.areaScopeDraft.fromManager;
    this.areaScopeDraft = null;
    if (back) this.openAreaScopeManager(); else this.closeModal();
  };
  P.saveAreaScope = function (resetToDefault) {
    const dr = this.areaScopeDraft; if (!dr || !this.isAdmin()) return;
    const s = (this.data.staff || []).find(x => normCode(x.code) === normCode(dr.code));
    if (!s) return;
    if (resetToDefault) delete s.area_scope;
    else s.area_scope = { all: !!dr.all, rooms: dr.all ? [] : Array.from(dr.rooms).map(x => (isNaN(+x) ? x : +x)) };
    this.saveData();
    this.showToast(`✅ Đã lưu phân quyền khu vực cho ${s.name}: ${this.describeAreaScope(s)}`);
    const back = dr.fromManager;
    this.areaScopeDraft = null;
    if (back) this.openAreaScopeManager(); else { this.closeModal(); this.render(); }
  };

  // Danh sách tài khoản để Admin thêm / bớt khu vực nhanh
  P.openAreaScopeManager = function () {
    if (!this.isAdmin()) { this.showToast('🔒 Chỉ Admin được phân quyền khu vực.'); return; }
    if (!this.areaMgrState) this.areaMgrState = { type: 'reviewers', q: '' };
    const st = this.areaMgrState;
    const q = st.q.trim().toLowerCase();
    const depts = new Map((this.data.departments || []).map(d => [String(d.id), d]));
    let list = (this.data.staff || []).filter(s => {
      const isMgr = s.role === 'manager' || s.role_level === 'manager';
      if (st.type === 'reviewers' && !s.can_review) return false;
      if (st.type === 'managers' && !isMgr) return false;
      if (st.type === 'custom' && !s.area_scope) return false;
      if (q && !(`${s.name} ${s.code} ${(depts.get(String(s.department_id)) || {}).name || ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
    list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi'));
    const total = list.length;
    list = list.slice(0, 80);
    const btn = (id, label) => `<button onclick="app5s.setAreaMgrType('${id}')" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${st.type === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">${label}</button>`;
    const html = `
      <div class="p-4 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar text-xs">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white">PHÂN QUYỀN KHU VỰC THEO TÀI KHOẢN</h3>
            <p class="text-[11px] text-slate-500">Thêm / bớt khu vực cho người duyệt 5S, lãnh đạo khoa phòng, ĐD trưởng, người phụ trách</p>
          </div>
          <button onclick="app5s.areaScopeFromManager=false; app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${btn('reviewers', 'Người duyệt 5S')}${btn('managers', 'Lãnh đạo khoa / ĐD trưởng')}${btn('custom', 'Đã giao riêng')}${btn('all', 'Tất cả')}
        </div>
        <input id="area-mgr-search" type="search" value="${esc(st.q)}" oninput="app5s.setAreaMgrQuery(this.value)" placeholder="Tìm theo tên, mã NV, khoa..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
        <div class="text-[11px] text-slate-500">${total} tài khoản${total > 80 ? ' (hiện 80 đầu tiên, gõ tìm để lọc)' : ''}</div>
        <div class="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl">
          ${list.map(s => `
            <div id="area-mgr-${esc(normCode(s.code))}" class="flex items-center justify-between p-2.5 gap-2">
              <div class="min-w-0">
                <div class="font-bold text-slate-800 dark:text-slate-100 truncate">${esc(s.name)} <span class="font-mono text-[10px] text-slate-400">${esc(s.code)}</span></div>
                <div class="text-[10px] text-slate-500 truncate">${esc((depts.get(String(s.department_id)) || {}).name || '')} • ${esc(this.roleLabel5S(s))}</div>
              </div>
              <button onclick="app5s.areaScopeFromManager=true; app5s.openAreaScopeModal('${jsq(s.code)}')" class="shrink-0 px-2.5 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">📍 ${esc(this.describeAreaScope(s))}</button>
            </div>
          `).join('') || '<div class="p-4 text-center text-slate-400">Không có tài khoản phù hợp</div>'}
        </div>
      </div>
    `;
    this.showModal(html, { wide: true });
  };
  P.setAreaMgrType = function (t) { this.areaMgrState.type = t; this.openAreaScopeManager(); };
  P.setAreaMgrQuery = function (q) {
    this.areaMgrState.q = q;
    clearTimeout(this.areaMgrTimer);
    this.areaMgrTimer = setTimeout(() => this.openAreaScopeManager(), 200);
  };

  // =========================================================================
  // 3. THỐNG KÊ
  // =========================================================================
  P.getStatsState = function () {
    if (!this.statsState) {
      const today = this.getTodayDateString();
      let grades = DEFAULT_GRADES;
      try { const g = JSON.parse(localStorage.getItem('vpi_5s_grade_thresholds') || 'null'); if (g && g.excellent) grades = g; } catch (e) {}
      this.statsState = { view: 'areas', from: today, to: today, dept: 'all', skipSunday: true, onlyMissing: false, grades, personQ: '' };
    }
    return this.statsState;
  };

  P.statsAccess = function () {
    const u = this.getCurrentUser();
    const leader = this.isHospitalLeaderOrSupervisor();
    const reviewer = this.canReview5S();
    const manager = this.isDepartmentManager ? this.isDepartmentManager() : false;
    return { user: u, leader, reviewer, manager, seeViolations: leader || reviewer || manager };
  };

  P.getStatsVisibleRooms = function (ignoreDeptFilter = false) {
    const acc = this.statsAccess();
    const st = this.getStatsState();
    const depts5s = new Map(this.getFiveSDepartments().map(d => [String(d.id), d]));
    const myDept = this.getUserDepartmentId();
    return (this.data.rooms || []).filter(r => {
      if (!depts5s.has(String(r.department_id))) return false;
      if (!ignoreDeptFilter && st.dept !== 'all' && String(r.department_id) !== String(st.dept)) return false;
      if (acc.leader) return true;
      return String(r.department_id) === String(myDept) || this.isRoomInScope(r.id);
    });
  };

  P.setStatsView = function (v) { this.getStatsState().view = v; this.render(); };
  P.setStatsDept = function (v) { this.getStatsState().dept = v; this.render(); };
  P.setStatsRange = function (which, v) {
    const st = this.getStatsState();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return;
    st[which] = v;
    if (st.from > st.to) { if (which === 'from') st.to = st.from; else st.from = st.to; }
    this.render();
  };
  P.setStatsPreset = function (p) {
    const st = this.getStatsState();
    const t = this.getTodayDateString();
    const y = t.slice(0, 4), m = +t.slice(5, 7);
    if (p === 'today') { st.from = t; st.to = t; }
    else if (p === 'yesterday') { st.from = addDays(t, -1); st.to = st.from; }
    else if (p === '7d') { st.from = addDays(t, -6); st.to = t; }
    else if (p === 'month') { st.from = `${y}-${t.slice(5, 7)}-01`; st.to = t; }
    else if (p === 'quarter') { const qm = Math.floor((m - 1) / 3) * 3 + 1; st.from = `${y}-${String(qm).padStart(2, '0')}-01`; st.to = t; }
    else if (p === 'year') { st.from = `${y}-01-01`; st.to = t; }
    this.render();
  };
  P.toggleStatsSunday = function (v) { this.getStatsState().skipSunday = !!v; this.render(); };
  P.toggleStatsOnlyMissing = function (v) { this.getStatsState().onlyMissing = !!v; this.render(); };
  P.setStatsPersonQuery = function (q) { this.getStatsState().personQ = q; clearTimeout(this.statsQTimer); this.statsQTimer = setTimeout(() => this.render(), 200); };
  P.setStatsGrade = function (key, idx, v) {
    const st = this.getStatsState();
    const n = Math.max(0, Math.min(100, parseFloat(v)));
    if (isNaN(n)) return;
    st.grades = JSON.parse(JSON.stringify(st.grades));
    st.grades[key][idx] = n;
    try { localStorage.setItem('vpi_5s_grade_thresholds', JSON.stringify(st.grades)); } catch (e) {}
    this.render();
  };

  // Số liệu: ưu tiên máy chủ (không giới hạn 90 ngày), dự phòng bằng dữ liệu trên máy
  P.localStatsRows = function (from, to) {
    const list = (this.data.schedules && this.data.schedules.rooms_schedule) || [];
    return list.filter(rs => rs && !rs._auto && rs.date >= from && rs.date <= to).map(rs => {
      const p = rs.post_shift_5s || {};
      return {
        r: rs.room_id, d: rs.date, w: rs.is_working !== false, s: p.status || '', u: this.isPhotoUploaded(p.photo),
        b: p.submitted_by || '', bc: p.submitted_by_code || '', t: p.submitted_at || '', sa: p.server_at || '',
        ev: p.evaluated_by || '', is: p.issue || '',
        st: (rs.staff_assigned || []).map(x => ({ code: x.code || '', name: x.name || '', role: x.role || '' }))
      };
    });
  };

  P.getStatsData = function () {
    const st = this.getStatsState();
    const key = `${st.from}|${st.to}`;
    const c = this.statsCache;
    const fresh = c && c.key === key && Date.now() - c.at < 60000;
    if (this.authToken && !fresh && this.statsLoadingKey !== key) {
      this.statsLoadingKey = key;
      this.apiFetch(`report?from=${st.from}&to=${st.to}`).then(res => {
        this.statsCache = { key, at: Date.now(), rows: (res && res.rows) || [], today: (res && res.today) || this.getTodayDateString(), source: 'server' };
      }).catch(err => {
        this.statsCache = { key, at: Date.now(), rows: this.localStatsRows(st.from, st.to), today: this.getTodayDateString(), source: 'local', error: err && err.message };
      }).finally(() => {
        this.statsLoadingKey = null;
        if (this.activeTab === 'stats') this.render();
      });
    }
    if (c && c.key === key) {
      // Gộp thêm thay đổi trên máy chưa có trên máy chủ (vừa duyệt / vừa nộp trên máy này)
      const map = new Map(c.rows.map(r => [`${r.r}|${r.d}`, r]));
      this.localStatsRows(st.from, st.to).forEach(r => {
        const k = `${r.r}|${r.d}`;
        const s = map.get(k);
        if (!s || (r.u && !s.u) || (r.u && s.u && r.s !== s.s && (r.s === 'approved' || r.s === 'rejected'))) map.set(k, Object.assign({}, s || {}, r));
      });
      return { rows: Array.from(map.values()), today: c.today, source: c.source, loading: this.statsLoadingKey === key, error: c.error };
    }
    if (!this.authToken) return { rows: this.localStatsRows(st.from, st.to), today: this.getTodayDateString(), source: 'local' };
    return { rows: null, loading: true };
  };

  P.computeStats5S = function (data) {
    const st = this.getStatsState();
    const today = data.today || this.getTodayDateString();
    const rooms = this.getStatsVisibleRooms();
    const deptMap = new Map((this.data.departments || []).map(d => [String(d.id), d]));
    const staffMap = new Map((this.data.staff || []).map(s => [normCode(s.code), s]));
    const rec = new Map();
    const byRoom = new Map();
    (data.rows || []).forEach(r => {
      rec.set(`${r.r}|${r.d}`, r);
      if (!byRoom.has(String(r.r))) byRoom.set(String(r.r), []);
      byRoom.get(String(r.r)).push(r);
    });
    byRoom.forEach(list => list.sort((a, b) => a.d.localeCompare(b.d)));
    const localBase = new Map();
    ((this.data.schedules && this.data.schedules.rooms_schedule) || []).forEach(rs => {
      if (rs && Array.isArray(rs.staff_assigned) && rs.staff_assigned.length && !localBase.has(String(rs.room_id))) localBase.set(String(rs.room_id), rs.staff_assigned);
    });
    const scopeOwners = new Map();
    (this.data.staff || []).forEach(s => {
      if (s.can_review || s.role === 'admin' || s.role === 'manager' || s.role_level === 'manager') return;
      const sc = s.area_scope;
      if (sc && Array.isArray(sc.rooms)) sc.rooms.forEach(id => {
        const k = String(id); if (!scopeOwners.has(k)) scopeOwners.set(k, []);
        scopeOwners.get(k).push({ code: s.code, name: s.name });
      });
    });
    const responsibleFor = (roomId, date) => {
      const list = byRoom.get(String(roomId)) || [];
      let pick = null;
      for (const r of list) { if (r.d <= date && r.st && r.st.length) pick = r.st; }
      if (!pick) { const first = list.find(r => r.st && r.st.length); if (first) pick = first.st; }
      if (!pick && localBase.has(String(roomId))) pick = localBase.get(String(roomId));
      if (!pick && scopeOwners.has(String(roomId))) pick = scopeOwners.get(String(roomId));
      return (pick || []).filter(x => x && (x.code || x.name));
    };
    const blank = () => ({ required: 0, done: 0, approved: 0, rejected: 0, submitted: 0, missing: 0, todayPending: 0, off: 0, missingDates: [] });
    const deptAgg = new Map();
    const roomAgg = new Map();
    const persons = new Map();
    const unassigned = new Map();
    const cells = [];
    const addPerson = (p, type, info) => {
      const key = normCode(p.code) || ('TEN:' + String(p.name || '').trim().toLowerCase());
      if (!key || key === 'TEN:') return;
      if (!persons.has(key)) {
        const s = staffMap.get(normCode(p.code));
        persons.set(key, { code: s ? s.code : (p.code || ''), name: s ? s.name : (p.name || ''), dept_id: s ? s.department_id : info.dept_id, missing: 0, rejected: 0, late: 0, details: [] });
      }
      const o = persons.get(key);
      o[type]++;
      o.details.push(Object.assign({ type }, info));
    };
    const end = st.to < today ? st.to : today;
    rooms.forEach(room => {
      const ra = blank();
      roomAgg.set(String(room.id), ra);
      const dk = String(room.department_id);
      if (!deptAgg.has(dk)) deptAgg.set(dk, blank());
      const da = deptAgg.get(dk);
      const startDay = room.created_at && room.created_at > st.from ? room.created_at : st.from;
      for (let d = startDay; d <= end; d = addDays(d, 1)) {
        if (st.skipSunday && weekday(d) === 0) continue;
        const r = rec.get(`${room.id}|${d}`);
        let status;
        if (r && r.w === false) status = 'off';
        else if (r && r.u && ['approved', 'rejected', 'submitted'].includes(r.s)) status = r.s;
        else status = d === today ? 'todayPending' : 'missing';
        const cell = { room, date: d, status, rec: r || null };
        cells.push(cell);
        [ra, da].forEach(a => {
          if (status === 'off') { a.off++; return; }
          if (status === 'todayPending') { a.todayPending++; return; }
          a.required++;
          if (status === 'missing') { a.missing++; a.missingDates.push(d); }
          else { a.done++; a[status]++; }
        });
        const info = { date: d, room_id: room.id, room: room.name, dept_id: room.department_id };
        if (status === 'missing') {
          const resp = responsibleFor(room.id, d);
          if (resp.length) resp.forEach(p => addPerson(p, 'missing', info));
          else {
            if (!unassigned.has(String(room.id))) unassigned.set(String(room.id), { room, dates: [] });
            unassigned.get(String(room.id)).dates.push(d);
          }
        } else if (status === 'rejected') {
          const who = r.bc ? [{ code: r.bc, name: r.b }] : responsibleFor(room.id, d);
          who.forEach(p => addPerson(p, 'rejected', Object.assign({ issue: r.is || '' }, info)));
        }
        if (r && r.u && r.sa && r.sa.slice(0, 10) > d && r.bc) addPerson({ code: r.bc, name: r.b }, 'late', info);
      }
    });
    const deptRows = Array.from(deptAgg.entries()).map(([id, a]) => {
      const d = deptMap.get(id) || { id, name: 'Khoa ' + id };
      const completion = pct(a.done, a.required);
      const reviewed = a.approved + a.rejected;
      const pass = pct(a.approved, reviewed);
      return Object.assign({ dept: d, completion, pass, reviewed, rooms: rooms.filter(r => String(r.department_id) === id).length }, a);
    });
    deptRows.sort((x, y) => (y.completion ?? -1) - (x.completion ?? -1) || (y.pass ?? -1) - (x.pass ?? -1) || x.missing - y.missing || String(x.dept.name).localeCompare(String(y.dept.name), 'vi'));
    deptRows.forEach((r, i) => { r.rank = i + 1; r.grade = this.gradeOf(r.completion, r.pass, r.reviewed); });
    const personRows = Array.from(persons.values()).map(p => Object.assign(p, { total: p.missing + p.rejected + p.late }))
      .sort((a, b) => b.total - a.total || b.rejected - a.rejected || String(a.name).localeCompare(String(b.name), 'vi'));
    const total = blank();
    deptRows.forEach(r => { ['required', 'done', 'approved', 'rejected', 'submitted', 'missing', 'todayPending', 'off'].forEach(k => { total[k] += r[k]; }); });
    return { cells, deptRows, roomAgg, personRows, unassigned: Array.from(unassigned.values()), total, rooms, today };
  };

  P.gradeOf = function (completion, pass, reviewed) {
    const g = this.getStatsState().grades;
    if (completion == null) return { label: 'Không có số liệu', tone: 'slate' };
    const passV = reviewed > 0 ? pass : null;
    const meets = (lvl) => completion >= g[lvl][0] && (passV == null || passV >= g[lvl][1]);
    if (meets('excellent')) return { label: 'Xuất sắc', tone: 'emerald' };
    if (meets('good')) return { label: 'Tốt', tone: 'sky' };
    if (meets('pass')) return { label: 'Đạt', tone: 'amber' };
    return { label: 'Chưa đạt', tone: 'red' };
  };

  // ---------------------------- Giao diện tab ------------------------------
  P.renderStatsTab = function () {
    const st = this.getStatsState();
    const acc = this.statsAccess();
    const data = this.getStatsData();
    const isDay = st.from === st.to;
    const visDepts = new Set(this.getStatsVisibleRooms(true).map(r => String(r.department_id)));
    const depts = this.getFiveSDepartments().filter(d => visDepts.has(String(d.id)));
    const tab = (id, label, icon) => `<button onclick="app5s.setStatsView('${id}')" class="flex-1 py-2 px-1 rounded-xl text-[11px] font-black flex items-center justify-center space-x-1 transition ${st.view === id ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}"><i data-lucide="${icon}" class="w-3.5 h-3.5"></i><span>${label}</span></button>`;
    const preset = (id, label) => `<button onclick="app5s.setStatsPreset('${id}')" class="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100">${label}</button>`;

    let body = '';
    if (!data.rows) {
      body = `<div class="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">Đang tải số liệu từ máy chủ...</div>`;
    } else {
      const S = this.computeStats5S(data);
      if (st.view === 'areas') body = this.renderStatsAreas(S, isDay);
      else if (st.view === 'depts') body = this.renderStatsDepts(S);
      else body = this.renderStatsPersons(S, acc);
    }

    return `
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-600">THỐNG KÊ & THI ĐUA 5S</span>
            <h2 class="text-base font-black text-slate-900 dark:text-white">Báo cáo thực hiện 5S</h2>
          </div>
          <div class="flex items-center space-x-1.5">
            ${this.isAdmin() ? `<button onclick="app5s.areaScopeFromManager=false; app5s.openAreaScopeManager()" class="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold flex items-center space-x-1"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i><span>Phân quyền khu vực</span></button>` : ''}
            <button onclick="app5s.exportStatsCsv()" class="px-2.5 py-1.5 rounded-xl bg-slate-800 text-white text-[11px] font-bold flex items-center space-x-1"><i data-lucide="download" class="w-3.5 h-3.5"></i><span>Excel</span></button>
            <button onclick="app5s.printStats()" class="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center space-x-1"><i data-lucide="printer" class="w-3.5 h-3.5"></i><span>In</span></button>
          </div>
        </div>

        ${this.needsAreaCatalogUpdate() ? `
          <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs flex items-center justify-between gap-2">
            <span class="text-amber-900 dark:text-amber-200"><strong>Danh mục khu vực 5S mới</strong> (18 khoa/phòng, 57 vị trí theo Google Sheet) chưa được áp dụng lên máy chủ.</span>
            <button onclick="app5s.applyAreaCatalog()" class="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-black">Áp dụng</button>
          </div>` : ''}

        <div class="flex gap-1.5">
          ${tab('areas', 'Khu vực', 'map-pin')}
          ${tab('depts', 'Thi đua khoa', 'trophy')}
          ${acc.seeViolations ? tab('persons', 'Cá nhân vi phạm', 'user-x') : tab('persons', 'Của tôi', 'user')}
        </div>

        <div class="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <label class="block"><span class="block font-bold text-slate-600 dark:text-slate-300 mb-1">Từ ngày</span>
              <input id="stats-from" type="date" value="${st.from}" max="${this.getTodayDateString()}" onchange="app5s.setStatsRange('from', this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold"></label>
            <label class="block"><span class="block font-bold text-slate-600 dark:text-slate-300 mb-1">Đến ngày</span>
              <input id="stats-to" type="date" value="${st.to}" max="${this.getTodayDateString()}" onchange="app5s.setStatsRange('to', this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold"></label>
            <label class="block col-span-2 sm:col-span-1"><span class="block font-bold text-slate-600 dark:text-slate-300 mb-1">Khoa / Phòng</span>
              <select id="stats-dept" onchange="app5s.setStatsDept(this.value)" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold">
                <option value="all" ${st.dept === 'all' ? 'selected' : ''}>${acc.leader ? `Toàn viện (${depts.length} khoa/phòng)` : 'Tất cả khu vực được xem'}</option>
                ${depts.map(d => `<option value="${d.id}" ${String(st.dept) === String(d.id) ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
              </select></label>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            ${preset('today', 'Hôm nay')}${preset('yesterday', 'Hôm qua')}${preset('7d', '7 ngày')}${preset('month', 'Tháng này')}${preset('quarter', 'Quý này')}${preset('year', 'Năm nay')}
            <label class="ml-auto flex items-center space-x-1 text-[11px] text-slate-600 dark:text-slate-300"><input type="checkbox" ${st.skipSunday ? 'checked' : ''} onchange="app5s.toggleStatsSunday(this.checked)" class="w-3.5 h-3.5 rounded"><span>Không tính Chủ nhật</span></label>
          </div>
          <div class="text-[10px] text-slate-400">
            ${data.loading && data.rows ? 'Đang cập nhật số liệu mới nhất... • ' : ''}${data.source === 'local' ? '⚠️ Đang dùng số liệu lưu trên máy (tối đa 90 ngày gần nhất)' + (data.error ? ' - máy chủ: ' + esc(data.error) : '') : 'Số liệu từ máy chủ'} • Chỉ tính "đã thực hiện" khi ảnh chụp đã lên máy chủ • Ngày hôm nay chưa nộp không tính vi phạm.
          </div>
        </div>

        ${body}
      </div>
    `;
  };

  P.statusBadge5S = function (status) {
    const map = {
      approved: ['bg-emerald-100 text-emerald-800 border-emerald-300', '✓ Đạt'],
      rejected: ['bg-red-100 text-red-800 border-red-300', '✕ Không đạt'],
      submitted: ['bg-amber-100 text-amber-800 border-amber-300', '… Chờ duyệt'],
      missing: ['bg-slate-200 text-slate-700 border-slate-300', '○ Chưa thực hiện'],
      todayPending: ['bg-slate-100 text-slate-600 border-slate-300', '○ Chưa thực hiện (trong ngày)'],
      off: ['bg-white text-slate-400 border-slate-200', '— Không làm việc']
    };
    const m = map[status] || map.missing;
    return `<span class="inline-block px-1.5 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap ${m[0]}">${m[1]}</span>`;
  };

  P.renderStatsSummary = function (t, isDay) {
    const card = (label, val, sub, cls) => `<div class="p-2.5 rounded-2xl border ${cls}"><div class="text-[10px] font-bold opacity-80">${label}</div><div class="text-lg font-black leading-tight">${val}</div><div class="text-[10px] opacity-70">${sub}</div></div>`;
    const notDone = t.missing + t.todayPending;
    const need = t.required + t.todayPending;
    return `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        ${card(isDay ? 'Khu vực phải làm' : 'Lượt phải làm', need, t.off ? `${t.off} lượt không làm việc` : 'không tính lượt nghỉ', 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100')}
        ${card('Đã thực hiện', t.done, `Hoàn thành ${pctTxt(pct(t.done, need))}`, 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200')}
        ${card('Chưa thực hiện', notDone, t.todayPending ? `${t.todayPending} trong ngày hôm nay` : 'đã quá ngày', 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100')}
        ${card('Đạt / Không đạt', `${t.approved} / ${t.rejected}`, `${t.submitted} chờ duyệt • Tỷ lệ đạt ${pctTxt(pct(t.approved, t.approved + t.rejected))}`, 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100')}
      </div>
    `;
  };

  P.renderStatsAreas = function (S, isDay) {
    const st = this.getStatsState();
    const byDept = new Map();
    S.rooms.forEach(r => { const k = String(r.department_id); if (!byDept.has(k)) byDept.set(k, []); byDept.get(k).push(r); });
    const depts = this.getFiveSDepartments().filter(d => byDept.has(String(d.id)));
    const cellMap = new Map(S.cells.map(c => [`${c.room.id}|${c.date}`, c]));
    const blocks = depts.map(d => {
      let rooms = byDept.get(String(d.id)).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
      const rows = rooms.map(r => {
        const a = S.roomAgg.get(String(r.id));
        if (isDay) {
          const c = cellMap.get(`${r.id}|${st.from}`) || { status: (st.skipSunday && weekday(st.from) === 0) ? 'off' : 'missing', rec: null };
          if (st.onlyMissing && !['missing', 'todayPending'].includes(c.status)) return '';
          const rr = c.rec;
          return `<tr class="border-t border-slate-100 dark:border-slate-700">
            <td class="py-1.5 pr-2 font-bold text-slate-800 dark:text-slate-100">${esc(r.name)}</td>
            <td class="py-1.5 pr-2">${this.statusBadge5S(c.status)}</td>
            <td class="py-1.5 pr-2 text-slate-500">${rr && rr.u ? `${esc(rr.b || '')}${rr.t ? ' • ' + esc(rr.t) : ''}` : ''}${rr && rr.is && c.status === 'rejected' ? `<div class="text-red-600">Lỗi: ${esc(rr.is)}</div>` : ''}</td>
          </tr>`;
        }
        if (st.onlyMissing && !a.missing) return '';
        return `<tr class="border-t border-slate-100 dark:border-slate-700">
          <td class="py-1.5 pr-2 font-bold text-slate-800 dark:text-slate-100">${esc(r.name)}</td>
          <td class="py-1.5 pr-2 text-center">${a.required}</td>
          <td class="py-1.5 pr-2 text-center text-emerald-700 font-bold">${a.done}</td>
          <td class="py-1.5 pr-2 text-center ${a.missing ? 'text-slate-900 dark:text-white font-black' : 'text-slate-400'}">${a.missing}</td>
          <td class="py-1.5 pr-2 text-center">${a.approved}</td>
          <td class="py-1.5 pr-2 text-center ${a.rejected ? 'text-red-600 font-bold' : ''}">${a.rejected}</td>
          <td class="py-1.5 pr-2 text-[10px] text-slate-500">${a.missingDates.slice(0, 8).map(fmtVN).map(x => x.slice(0, 5)).join(', ')}${a.missingDates.length > 8 ? ` +${a.missingDates.length - 8}` : ''}</td>
        </tr>`;
      }).join('');
      if (!rows.trim()) return '';
      const da = S.deptRows.find(x => String(x.dept.id) === String(d.id));
      return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-black text-slate-900 dark:text-white">${esc(d.name)}</span>
            <span class="text-[10px] text-slate-500">${da ? `Đã làm ${da.done}/${da.required + da.todayPending} • Chưa ${da.missing + da.todayPending}` : ''}</span>
          </div>
          <div class="overflow-x-auto"><table class="w-full text-[11px]">
            ${isDay
              ? '<thead><tr class="text-left text-[10px] text-slate-400"><th class="py-1 pr-2">Khu vực</th><th class="py-1 pr-2">Trạng thái</th><th class="py-1 pr-2">Người nộp / giờ</th></tr></thead>'
              : '<thead><tr class="text-[10px] text-slate-400"><th class="py-1 pr-2 text-left">Khu vực</th><th class="py-1 pr-2">Phải làm</th><th class="py-1 pr-2">Đã làm</th><th class="py-1 pr-2">Chưa làm</th><th class="py-1 pr-2">Đạt</th><th class="py-1 pr-2">K.đạt</th><th class="py-1 pr-2 text-left">Ngày chưa làm</th></tr></thead>'}
            <tbody>${rows}</tbody>
          </table></div>
        </div>`;
    }).join('');
    return `
      ${this.renderStatsSummary(S.total, isDay)}
      <label class="flex items-center space-x-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" ${st.onlyMissing ? 'checked' : ''} onchange="app5s.toggleStatsOnlyMissing(this.checked)" class="w-3.5 h-3.5 rounded"><span>Chỉ hiện khu vực CHƯA THỰC HIỆN</span></label>
      ${blocks || '<div class="p-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">Không có khu vực nào phù hợp bộ lọc.</div>'}
    `;
  };

  // Biểu đồ thanh ngang xếp chồng 100%: mỗi khoa = 1 thanh, chia theo Đạt / Không đạt / Chờ duyệt / Chưa thực hiện
  P.renderDeptChartSvg = function (rows) {
    const list = rows.filter(r => r.required > 0);
    if (!list.length) return '<div class="p-6 text-center text-xs text-slate-400">Chưa có lượt phải thực hiện trong khoảng ngày đã chọn.</div>';
    const W = 680, labelW = 190, valW = 56, barW = W - labelW - valW - 8, rowH = 24, barH = 14, top = 6;
    const H = top + list.length * rowH + 22;
    const keys = ['approved', 'rejected', 'submitted', 'missing'];
    const bars = list.map((r, i) => {
      const y = top + i * rowH;
      let x = labelW;
      const segs = keys.map(k => {
        const v = r[k];
        if (!v) return '';
        const w = (v / r.required) * barW;
        const seg = `<rect x="${(x + 1).toFixed(1)}" y="${y + (rowH - barH) / 2}" width="${Math.max(0, w - 2).toFixed(1)}" height="${barH}" rx="3" fill="${STATUS[k].color}"><title>${esc(r.dept.name)} - ${STATUS[k].label}: ${v}/${r.required} lượt (${pctTxt(pct(v, r.required))})</title></rect>`;
        x += w;
        return seg;
      }).join('');
      const name = r.dept.name.length > 28 ? r.dept.name.slice(0, 27) + '…' : r.dept.name;
      return `
        <text x="${labelW - 8}" y="${y + rowH / 2 + 4}" text-anchor="end" font-size="11" fill="currentColor" class="text-slate-700 dark:text-slate-200">${r.rank}. ${esc(name)}</text>
        <rect x="${labelW}" y="${y + (rowH - barH) / 2}" width="${barW}" height="${barH}" rx="3" fill="currentColor" class="text-slate-100 dark:text-slate-700"></rect>
        ${segs}
        <text x="${labelW + barW + 6}" y="${y + rowH / 2 + 4}" font-size="11" font-weight="700" fill="currentColor" class="text-slate-800 dark:text-slate-100">${pctTxt(r.completion)}</text>`;
    }).join('');
    const ticks = [0, 50, 100].map(t => {
      const x = labelW + (t / 100) * barW;
      return `<line x1="${x}" x2="${x}" y1="${top}" y2="${H - 18}" stroke="currentColor" class="text-slate-200 dark:text-slate-600" stroke-dasharray="2 3"/><text x="${x}" y="${H - 6}" text-anchor="middle" font-size="10" fill="currentColor" class="text-slate-400">${t}%</text>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" role="img" aria-label="Tỷ lệ thực hiện 5S theo khoa phòng">${ticks}${bars}</svg>`;
  };

  P.renderStatsDepts = function (S) {
    const st = this.getStatsState();
    const g = st.grades;
    const legend = ['approved', 'rejected', 'submitted', 'missing'].map(k => `<span class="inline-flex items-center space-x-1"><span class="inline-block w-3 h-3 rounded-sm" style="background:${STATUS[k].color}"></span><span>${STATUS[k].label}</span></span>`).join('');
    const tone = { emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300', sky: 'bg-sky-100 text-sky-800 border-sky-300', amber: 'bg-amber-100 text-amber-800 border-amber-300', red: 'bg-red-100 text-red-800 border-red-300', slate: 'bg-slate-100 text-slate-600 border-slate-300' };
    const gi = (key, idx) => `<input type="number" min="0" max="100" step="1" value="${g[key][idx]}" onchange="app5s.setStatsGrade('${key}', ${idx}, this.value)" class="w-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-1 py-0.5 text-center font-bold">`;
    return `
      ${this.renderStatsSummary(S.total, false)}
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div class="text-xs font-black text-slate-900 dark:text-white">Thành tích 5S các khoa phòng</div>
            <div class="text-[10px] text-slate-500">${fmtVN(st.from)} – ${fmtVN(st.to)} • xếp theo tỷ lệ hoàn thành, sau đó tỷ lệ đạt</div>
          </div>
          <div class="flex flex-wrap gap-2 text-[10.5px] text-slate-600 dark:text-slate-300">${legend}</div>
        </div>
        <div class="text-slate-700 dark:text-slate-200">${this.renderDeptChartSvg(S.deptRows)}</div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3">
        <div class="text-xs font-black text-slate-900 dark:text-white mb-1.5">Bảng xếp hạng – căn cứ bình xét thi đua</div>
        <div class="overflow-x-auto"><table class="w-full text-[11px]">
          <thead><tr class="text-[10px] text-slate-400 text-center"><th class="py-1 pr-1">Hạng</th><th class="py-1 pr-2 text-left">Khoa / Phòng</th><th class="py-1 pr-1">Khu vực</th><th class="py-1 pr-1">Phải làm</th><th class="py-1 pr-1">Đã làm</th><th class="py-1 pr-1">Chưa làm</th><th class="py-1 pr-1">Đạt</th><th class="py-1 pr-1">K.đạt</th><th class="py-1 pr-1">% Hoàn thành</th><th class="py-1 pr-1">% Đạt</th><th class="py-1">Xếp loại</th></tr></thead>
          <tbody>
            ${S.deptRows.map(r => `<tr class="border-t border-slate-100 dark:border-slate-700 text-center">
              <td class="py-1.5 pr-1 font-black">${r.rank}</td>
              <td class="py-1.5 pr-2 text-left font-bold text-slate-800 dark:text-slate-100">${esc(r.dept.name)}</td>
              <td class="py-1.5 pr-1">${r.rooms}</td><td class="py-1.5 pr-1">${r.required}</td>
              <td class="py-1.5 pr-1 text-emerald-700 font-bold">${r.done}</td><td class="py-1.5 pr-1">${r.missing}</td>
              <td class="py-1.5 pr-1">${r.approved}</td><td class="py-1.5 pr-1 ${r.rejected ? 'text-red-600 font-bold' : ''}">${r.rejected}</td>
              <td class="py-1.5 pr-1 font-black">${pctTxt(r.completion)}</td><td class="py-1.5 pr-1 font-bold">${r.reviewed ? pctTxt(r.pass) : '—'}</td>
              <td class="py-1.5"><span class="inline-block px-1.5 py-0.5 rounded-md border text-[10px] font-black ${tone[r.grade.tone]}">${r.grade.label}</span></td>
            </tr>`).join('') || '<tr><td colspan="11" class="py-4 text-center text-slate-400">Chưa có số liệu</td></tr>'}
          </tbody>
        </table></div>
        <div class="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-[10.5px] text-slate-600 dark:text-slate-300 space-y-1">
          <div class="font-bold">Ngưỡng xếp loại (% hoàn thành / % đạt) – Ban chỉ đạo điều chỉnh theo quy chế thi đua:</div>
          <div class="flex flex-wrap gap-3">
            <span>Xuất sắc ≥ ${gi('excellent', 0)} / ${gi('excellent', 1)}</span>
            <span>Tốt ≥ ${gi('good', 0)} / ${gi('good', 1)}</span>
            <span>Đạt ≥ ${gi('pass', 0)} / ${gi('pass', 1)}</span>
          </div>
          <div class="text-slate-400">% Hoàn thành = lượt đã nộp ảnh / lượt phải làm. % Đạt = lượt duyệt Đạt / lượt đã duyệt. Khoa chưa có lượt nào được duyệt chỉ xét % hoàn thành. Ngưỡng lưu trên máy này.</div>
        </div>
      </div>
    `;
  };

  P.renderStatsPersons = function (S, acc) {
    const st = this.getStatsState();
    const me = normCode((acc.user || {}).code);
    let rows = S.personRows;
    if (!acc.seeViolations) rows = rows.filter(p => normCode(p.code) === me);
    const q = (st.personQ || '').trim().toLowerCase();
    if (q) rows = rows.filter(p => `${p.name} ${p.code}`.toLowerCase().includes(q));
    const deptName = (id) => ((this.data.departments || []).find(d => String(d.id) === String(id)) || {}).name || '';
    this.lastPersonRows = rows;
    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div class="text-xs font-black text-slate-900 dark:text-white">${acc.seeViolations ? 'Danh sách cá nhân vi phạm 5S' : 'Lỗi 5S của tôi'} (${rows.length})</div>
            <div class="text-[10px] text-slate-500">${fmtVN(st.from)} – ${fmtVN(st.to)} • Không thực hiện = khu vực được phân công nhưng không nộp ảnh trong ngày; Không đạt = ảnh nộp bị duyệt Không đạt</div>
          </div>
          ${acc.seeViolations ? `<input id="stats-person-q" type="search" value="${esc(st.personQ || '')}" oninput="app5s.setStatsPersonQuery(this.value)" placeholder="Tìm tên / mã NV" class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs w-44">` : ''}
        </div>
        <div class="overflow-x-auto"><table class="w-full text-[11px]">
          <thead><tr class="text-[10px] text-slate-400 text-center"><th class="py-1 pr-1">STT</th><th class="py-1 pr-2 text-left">Họ tên</th><th class="py-1 pr-2 text-left">Khoa / Phòng</th><th class="py-1 pr-1">Không thực hiện</th><th class="py-1 pr-1">Không đạt</th><th class="py-1 pr-1">Nộp muộn</th><th class="py-1 pr-1">Tổng lần</th><th class="py-1"></th></tr></thead>
          <tbody>
            ${rows.slice(0, 300).map((p, i) => `<tr class="border-t border-slate-100 dark:border-slate-700 text-center">
              <td class="py-1.5 pr-1">${i + 1}</td>
              <td class="py-1.5 pr-2 text-left"><div class="font-bold text-slate-800 dark:text-slate-100">${esc(p.name)}</div><div class="text-[10px] font-mono text-slate-400">${esc(p.code)}</div></td>
              <td class="py-1.5 pr-2 text-left text-slate-500">${esc(deptName(p.dept_id))}</td>
              <td class="py-1.5 pr-1 ${p.missing ? 'font-black text-slate-900 dark:text-white' : 'text-slate-400'}">${p.missing}</td>
              <td class="py-1.5 pr-1 ${p.rejected ? 'font-black text-red-600' : 'text-slate-400'}">${p.rejected}</td>
              <td class="py-1.5 pr-1 ${p.late ? 'font-bold text-amber-700' : 'text-slate-400'}">${p.late}</td>
              <td class="py-1.5 pr-1 font-black">${p.total}</td>
              <td class="py-1.5"><button onclick="app5s.openPersonViolations(${i})" class="text-[10px] font-bold text-indigo-600 hover:underline">Chi tiết</button></td>
            </tr>`).join('') || `<tr><td colspan="8" class="py-5 text-center text-slate-400">${acc.seeViolations ? 'Không có cá nhân vi phạm trong khoảng ngày đã chọn 🎉' : 'Bạn không có lỗi 5S trong khoảng ngày đã chọn 🎉'}</td></tr>`}
          </tbody>
        </table></div>
        ${rows.length > 300 ? `<div class="text-[10px] text-slate-400">Hiện 300 người đầu; xuất Excel để xem đủ ${rows.length} người.</div>` : ''}
      </div>
      ${acc.seeViolations && S.unassigned.length ? `
        <div class="bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-300 dark:border-amber-800 p-3 text-[11px]">
          <div class="font-black text-amber-900 dark:text-amber-200 mb-1">⚠️ ${S.unassigned.length} khu vực chưa thực hiện nhưng CHƯA PHÂN CÔNG người phụ trách (không quy được lỗi cho cá nhân)</div>
          <div class="space-y-0.5 text-amber-900 dark:text-amber-200">
            ${S.unassigned.slice(0, 30).map(u => `<div>• ${esc(deptName(u.room.department_id))} – <strong>${esc(u.room.name)}</strong>: ${u.dates.length} ngày</div>`).join('')}
          </div>
          <div class="mt-1 text-amber-800 dark:text-amber-300">Phân công tại tab Khu vực 5S → "+ Thêm / Bớt người", hoặc Admin giao khu vực phụ trách cho nhân viên.</div>
        </div>` : ''}
    `;
  };

  P.openPersonViolations = function (idx) {
    const p = (this.lastPersonRows || [])[idx];
    if (!p) return;
    const typeTxt = { missing: 'Không thực hiện', rejected: 'Không đạt', late: 'Nộp muộn' };
    const list = p.details.slice().sort((a, b) => b.date.localeCompare(a.date));
    this.showModal(`
      <div class="p-4 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar text-xs">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white">CHI TIẾT VI PHẠM 5S</h3>
            <p class="text-[11px] text-slate-500">${esc(p.name)} • ${esc(p.code)} • ${p.total} lần</p>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <table class="w-full text-[11px]">
          <thead><tr class="text-left text-[10px] text-slate-400"><th class="py-1 pr-2">Ngày</th><th class="py-1 pr-2">Khu vực</th><th class="py-1">Lỗi</th></tr></thead>
          <tbody>${list.map(d => `<tr class="border-t border-slate-100 dark:border-slate-700"><td class="py-1.5 pr-2 font-mono">${fmtVN(d.date)}</td><td class="py-1.5 pr-2">${esc(d.room)}</td><td class="py-1.5"><span class="font-bold ${d.type === 'rejected' ? 'text-red-600' : ''}">${typeTxt[d.type]}</span>${d.issue ? `<div class="text-slate-500">${esc(d.issue)}</div>` : ''}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    `);
  };

  // ---------------------------- Xuất Excel / In ----------------------------
  P.buildStatsTable = function () {
    const st = this.getStatsState();
    const data = this.getStatsData();
    if (!data.rows) return null;
    const S = this.computeStats5S(data);
    const deptName = (id) => ((this.data.departments || []).find(d => String(d.id) === String(id)) || {}).name || '';
    const stTxt = { approved: 'Đạt', rejected: 'Không đạt', submitted: 'Chờ duyệt', missing: 'Chưa thực hiện', todayPending: 'Chưa thực hiện (trong ngày)', off: 'Không làm việc' };
    const range = st.from === st.to ? fmtVN(st.from) : `${fmtVN(st.from)} - ${fmtVN(st.to)}`;
    if (st.view === 'depts') {
      return {
        title: `BẢNG XẾP HẠNG THÀNH TÍCH 5S CÁC KHOA PHÒNG (${range})`, file: `ThiDua5S_${st.from}_${st.to}`,
        head: ['Hạng', 'Khoa/Phòng', 'Số khu vực', 'Lượt phải làm', 'Đã làm', 'Chưa làm', 'Đạt', 'Không đạt', 'Chờ duyệt', '% Hoàn thành', '% Đạt', 'Xếp loại'],
        rows: S.deptRows.map(r => [r.rank, r.dept.name, r.rooms, r.required, r.done, r.missing, r.approved, r.rejected, r.submitted, pctTxt(r.completion), r.reviewed ? pctTxt(r.pass) : '—', r.grade.label])
      };
    }
    if (st.view === 'persons') {
      const acc = this.statsAccess();
      let rows = S.personRows;
      if (!acc.seeViolations) rows = rows.filter(p => normCode(p.code) === normCode((acc.user || {}).code));
      const typeTxt = { missing: 'Không TH', rejected: 'Không đạt', late: 'Muộn' };
      return {
        title: `DANH SÁCH CÁ NHÂN VI PHẠM 5S (${range})`, file: `ViPham5S_${st.from}_${st.to}`,
        head: ['STT', 'Mã NV', 'Họ tên', 'Khoa/Phòng', 'Không thực hiện', 'Không đạt', 'Nộp muộn', 'Tổng lần', 'Chi tiết'],
        rows: rows.map((p, i) => [i + 1, p.code, p.name, deptName(p.dept_id), p.missing, p.rejected, p.late, p.total,
          p.details.slice().sort((a, b) => a.date.localeCompare(b.date)).map(d => `${fmtVN(d.date)} ${d.room} (${typeTxt[d.type]})`).join('; ')])
      };
    }
    const cells = S.cells.slice().sort((a, b) => a.date.localeCompare(b.date) || String(deptName(a.room.department_id)).localeCompare(String(deptName(b.room.department_id)), 'vi') || (a.room.order || 0) - (b.room.order || 0));
    return {
      title: `BÁO CÁO KHU VỰC THỰC HIỆN / CHƯA THỰC HIỆN 5S (${range})`, file: `KhuVuc5S_${st.from}_${st.to}`,
      head: ['STT', 'Ngày', 'Khoa/Phòng', 'Khu vực', 'Trạng thái', 'Người nộp', 'Giờ nộp', 'Người phụ trách', 'Lỗi ghi nhận'],
      rows: cells.filter(c => !st.onlyMissing || ['missing', 'todayPending'].includes(c.status)).map((c, i) => [i + 1, fmtVN(c.date), deptName(c.room.department_id), c.room.name, stTxt[c.status] || c.status,
        c.rec && c.rec.u ? c.rec.b : '', c.rec && c.rec.u ? c.rec.t : '', ((c.rec && c.rec.st) || []).map(x => x.name).join(', '), c.rec && c.status === 'rejected' ? c.rec.is : ''])
    };
  };

  P.exportStatsCsv = function () {
    const t = this.buildStatsTable();
    if (!t) { this.showToast('⏳ Số liệu đang tải, thử lại sau giây lát.'); return; }
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const csv = '﻿' + [[t.title], [], t.head].concat(t.rows).map(r => r.map(q).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${t.file}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    this.showToast('✅ Đã xuất tệp Excel (CSV) - mở bằng Excel để xem.');
  };

  P.printStats = function () {
    const t = this.buildStatsTable();
    if (!t) { this.showToast('⏳ Số liệu đang tải, thử lại sau giây lát.'); return; }
    const st = this.getStatsState();
    const hosp = ((this.data.hospital || {}).name) || 'BỆNH VIỆN VĨNH PHÚC VPI';
    const chart = st.view === 'depts' ? this.renderDeptChartSvg(this.computeStats5S(this.getStatsData()).deptRows).replace(/class="[^"]*"/g, '').replace(/currentColor/g, '#333') : '';
    const now = new Date();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(t.title)}</title>
      <style>body{font-family:'Times New Roman',serif;font-size:12pt;margin:16mm 14mm;color:#000}table{border-collapse:collapse;width:100%;font-size:10.5pt}th,td{border:1px solid #444;padding:3px 5px;vertical-align:top}th{background:#eee}.c{text-align:center}h2{text-align:center;font-size:14pt;margin:8px 0 2px}.s{text-align:center;font-style:italic;margin-bottom:10px}.hd{display:flex;justify-content:space-between;text-align:center;font-weight:bold}.sig{display:flex;justify-content:space-around;margin-top:28px;text-align:center}@page{size:A4 ${st.view === 'areas' ? 'portrait' : 'landscape'};margin:12mm}</style></head><body>
      <div class="hd"><div>${esc(hosp.toUpperCase())}<br>BAN CHỈ ĐẠO 5S</div><div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</div></div>
      <h2>${esc(t.title)}</h2><div class="s">Ngày lập: ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} • Không chấm điểm số: chỉ tính Đã thực hiện / Chưa thực hiện và Đạt / Không đạt</div>
      ${chart ? `<div style="margin-bottom:10px">${chart}</div>` : ''}
      <table><thead><tr>${t.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((v, i) => `<td class="${i === 0 || typeof v === 'number' ? 'c' : ''}">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="sig"><div><strong>NGƯỜI LẬP BIỂU</strong><br><em>(Ký, ghi rõ họ tên)</em></div><div><strong>TRƯỞNG BAN CHỈ ĐẠO 5S</strong><br><em>(Ký, ghi rõ họ tên)</em></div></div>
      </body></html>`;
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => {
      try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) { this.showToast('Không mở được hộp thoại in.'); }
      setTimeout(() => frame.remove(), 60000);
    }, 300);
  };
})();
