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

  // V29e: 'b' = xóa hẳn 8 khoa/phòng cũ không có trong Google Sheet + thêm phòng Hội đồng quản trị, Ban giám đốc
  const AREA_CATALOG_VERSION = 'sheet-20261125b';
  const BOARD_DEPTS = [
    { id: 27, code: 'HDQT', name: 'Hội đồng quản trị', head_nurse: '', doctor_in_charge: '', phone: '', color: '#b45309', icon: 'fa-landmark', description: 'Hội đồng quản trị bệnh viện (không có khu vực 5S)', order: 19, category: 'board', in_5s: false },
    { id: 28, code: 'BGD', name: 'Ban giám đốc', head_nurse: '', doctor_in_charge: '', phone: '', color: '#4f46e5', icon: 'fa-user-tie', description: 'Ban giám đốc bệnh viện (không có khu vực 5S)', order: 20, category: 'board', in_5s: false }
  ];
  const BOARD_DEPT_GROUP = { 27: 'hdqt', 28: 'bgd' };
  const BOARD_GROUP_DEPT = { hdqt: 27, bgd: 28 };
  // Khoa/phòng cũ không có trong Google Sheet => xóa; nhân sự được chuyển sang khoa/phòng gần nhất (Admin chọn lại được)
  const OLD_DEPT_SUGGEST = { 11: 1, 12: 4, 6: 2, 13: 2, 14: 26, 10: 16, 17: 24, 18: 16 };
  if (typeof DEFAULT_SEED_DATA !== 'undefined' && Array.isArray(DEFAULT_SEED_DATA.departments)) {
    DEFAULT_SEED_DATA.departments = DEFAULT_SEED_DATA.departments.filter(d => !(Number(d.id) in OLD_DEPT_SUGGEST));
    BOARD_DEPTS.forEach(b => {
      if (!DEFAULT_SEED_DATA.departments.some(d => String(d.id) === String(b.id))) DEFAULT_SEED_DATA.departments.push(JSON.parse(JSON.stringify(b)));
    });
  }
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

  // Nhắc Admin áp dụng danh sách mới (hiện ở tab Khoa Phòng, Nhân sự, Thống kê)
  P.catalogBannerHtml = function () {
    if (!this.isRootAdmin() || !this.needsAreaCatalogUpdate()) return '';
    const old = this.getOldDepartments();
    const nStaff = old.reduce((n, o) => n + o.staff.length, 0);
    return `
      <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs flex items-center justify-between gap-2">
        <span class="text-amber-900 dark:text-amber-200"><strong>Danh sách khoa/phòng & khu vực 5S mới chưa áp dụng</strong> (18 khoa/phòng, 57 vị trí theo Google Sheet; thêm phòng Hội đồng quản trị, Ban giám đốc).${old.length ? ` Còn ${old.length} khoa/phòng cũ${nStaff ? ` với ${nStaff} nhân sự cần chuyển` : ''}.` : ''}</span>
        <button onclick="app5s.applyAreaCatalog()" class="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-black">Áp dụng</button>
      </div>`;
  };
  const withBanner = (name) => {
    const orig = P[name];
    if (typeof orig !== 'function') return;
    P[name] = function () {
      const html = orig.apply(this, arguments);
      const b = this.catalogBannerHtml();
      return b ? String(html).replace('<div class="p-4 space-y-4">', `<div class="p-4 space-y-4">${b}`) : html;
    };
  };
  withBanner('renderStaffTab');
  withBanner('renderDepartmentsTab');

  P.boardGroupOfDept = function (deptId) { return BOARD_DEPT_GROUP[Number(deptId)] || ''; };

  // Khoa/phòng cũ (không có trong Google Sheet, không phải HĐQT / Ban giám đốc) và số nhân sự đang thuộc các khoa đó
  P.getOldDepartments = function () {
    const seedDepts = (typeof DEFAULT_SEED_DATA !== 'undefined' && DEFAULT_SEED_DATA.departments) || [];
    const keep = new Set(seedDepts.map(d => String(d.id)));
    return (this.data.departments || []).filter(d => !keep.has(String(d.id))).map(d => ({
      dept: d, staff: (this.data.staff || []).filter(s => String(s.department_id) === String(d.id))
    }));
  };

  // Bước chọn khoa/phòng mới cho nhân sự đang thuộc khoa/phòng cũ (trước khi xóa khoa cũ)
  P.openDeptMigrationModal = function () {
    if (!this.isAdmin()) return;
    const old = this.getOldDepartments();
    const targets = ((typeof DEFAULT_SEED_DATA !== 'undefined' && DEFAULT_SEED_DATA.departments) || []).slice().sort((a, b) => (a.order || 99) - (b.order || 99));
    const opt = (sel) => targets.map(t => `<option value="${t.id}" ${String(t.id) === String(sel) ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
    this.showModal(`
      <div class="p-4 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar text-xs">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white">CẬP NHẬT DANH SÁCH KHOA / PHÒNG THEO GOOGLE SHEET</h3>
            <p class="text-[11px] text-slate-500">Xóa ${old.length} khoa/phòng cũ • thêm phòng Hội đồng quản trị, Ban giám đốc</p>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
          Nhân sự đang thuộc khoa/phòng cũ sẽ được <strong>chuyển sang khoa/phòng chọn dưới đây</strong> (không mất tài khoản). Sau này vẫn sửa từng người được ở tab Nhân sự.
        </div>
        <div class="space-y-1.5">
          ${old.map(o => `
            <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1">
              <div class="flex items-center justify-between gap-2"><strong class="text-slate-900 dark:text-white line-through decoration-red-500">${esc(o.dept.name)}</strong><span class="shrink-0 text-[10px] text-slate-500">${o.staff.length} nhân sự</span></div>
              ${o.staff.length ? `<label class="flex items-center gap-2"><span class="shrink-0 text-slate-500">Chuyển sang:</span>
                <select data-old-dept="${o.dept.id}" class="dept-migrate-sel flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 font-bold">${opt(OLD_DEPT_SUGGEST[Number(o.dept.id)] || 19)}</select></label>` : '<div class="text-[10px] text-slate-400">Không có nhân sự – xóa luôn</div>'}
            </div>`).join('')}
        </div>
        <button onclick="app5s.confirmDeptMigration()" class="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black">ÁP DỤNG DANH SÁCH MỚI</button>
      </div>`);
  };

  P.confirmDeptMigration = function () {
    const mapping = {};
    document.querySelectorAll('.dept-migrate-sel').forEach(el => { mapping[el.getAttribute('data-old-dept')] = Number(el.value); });
    this.closeModal();
    this.applyAreaCatalog(true, mapping);
    this.showToast('✅ Đã cập nhật danh sách khoa/phòng theo Google Sheet và chuyển nhân sự. Đang gửi lên máy chủ...');
  };

  // silent = true: gọi từ quy trình "Xóa dữ liệu & triển khai mới" hoặc sau bước chọn chuyển nhân sự
  P.applyAreaCatalog = function (silent = false, deptMapping = null) {
    if (!this.isAdmin()) { this.showToast('🔒 Chỉ Admin được áp dụng danh mục khu vực.'); return false; }
    const seedRooms = (typeof DEFAULT_SEED_DATA !== 'undefined' && DEFAULT_SEED_DATA.rooms) || [];
    const seedDepts = (typeof DEFAULT_SEED_DATA !== 'undefined' && DEFAULT_SEED_DATA.departments) || [];
    if (!seedRooms.length) return false;
    const inSheet = seedDepts.filter(d => d.in_5s !== false);
    const seedIds = new Set(seedRooms.map(r => String(r.id)));
    const oldRooms = (this.data.rooms || []).filter(r => !seedIds.has(String(r.id)));
    const oldDepts = this.getOldDepartments();
    if (!silent && oldDepts.some(o => o.staff.length)) { this.openDeptMigrationModal(); return false; }
    if (!silent && !confirm(`Áp dụng danh sách khu vực 5S toàn viện mới?\n\n• ${inSheet.length} khoa/phòng, ${seedRooms.length} vị trí làm việc 5S (theo Google Sheet)\n• Thêm phòng Hội đồng quản trị và Ban giám đốc\n• XÓA HẲN ${oldDepts.length} khoa/phòng cũ và ${oldRooms.length} vị trí làm việc cũ\n\nThay đổi áp dụng cho mọi máy.`)) return false;
    // Chuyển nhân sự khỏi khoa/phòng cũ
    oldDepts.forEach(o => {
      const to = (deptMapping && deptMapping[String(o.dept.id)]) || OLD_DEPT_SUGGEST[Number(o.dept.id)] || 19;
      o.staff.forEach(s => { s.prev_department = o.dept.name; s.department_id = to; });
    });

    // V29: xóa hẳn vị trí cũ (không lưu trữ)
    this.data.archived_rooms = [];
    this.data.rooms = JSON.parse(JSON.stringify(seedRooms));
    // Bỏ các vị trí cũ khỏi phân quyền khu vực / danh sách phụ trách của nhân sự
    const oldNames = new Set(oldRooms.map(r => String(r.name || '').trim()));
    (this.data.staff || []).forEach(s => {
      if (s.area_scope && Array.isArray(s.area_scope.rooms)) {
        const kept = s.area_scope.rooms.filter(id => seedIds.has(String(id)));
        if (kept.length !== s.area_scope.rooms.length) s.area_scope = Object.assign({}, s.area_scope, { rooms: kept });
      }
      if (Array.isArray(s.assigned_rooms) && s.assigned_rooms.some(n => oldNames.has(String(n).trim()))) {
        s.assigned_rooms = s.assigned_rooms.filter(n => !oldNames.has(String(n).trim()));
        s.assigned_room = s.assigned_rooms.join(', ');
      }
    });

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
    // V29e: xóa hẳn khoa/phòng cũ khỏi danh sách (tab Khoa phòng, Nhân sự, ô chọn khoa/phòng làm việc)
    this.data.departments = (this.data.departments || []).filter(d => seedIdSet.has(String(d.id)));
    this.data.departments.sort((a, b) => (a.order || 99) - (b.order || 99));
    if (this.filterStaffDept && this.filterStaffDept !== 'all' && !seedIdSet.has(String(this.filterStaffDept))) this.filterStaffDept = 'all';

    if (!this.data.hospital) this.data.hospital = {};
    this.data.hospital.area_catalog_version = AREA_CATALOG_VERSION;
    this.saveData();
    this.render();
    if (!silent) this.showToast(`✅ Đã áp dụng ${seedRooms.length} vị trí 5S của ${inSheet.length} khoa/phòng, xóa ${oldDepts.length} khoa/phòng cũ, ${oldRooms.length} vị trí cũ. Đang gửi lên máy chủ...`);
    return true;
  };

  // =========================================================================
  // 1b. XÓA TOÀN BỘ DỮ LIỆU 5S ĐỂ TRIỂN KHAI MỚI (Admin)
  // =========================================================================
  const RESET_SEEN_KEY = 'vpi_5s_reset_seen_v29';
  const RESET_COLLS = ['audits', 'rooms_schedule', 'department_evaluations'];

  P.clearLocal5SData = function () {
    this.data.audits = [];
    if (!this.data.schedules) this.data.schedules = {};
    this.data.schedules.rooms_schedule = [];
    this.data.department_evaluations = [];
    this.outbox = (this.outbox || []).filter(op => !RESET_COLLS.includes(op.c));
    this.persistOutbox();
    this.statsCache = null;
    this.currentShiftPhoto = null;
    this.currentShiftPhotoRoomId = null;
  };

  // Máy khác: nhận mốc xóa mới từ máy chủ => bỏ dữ liệu 5S cũ đang chờ gửi, tải lại toàn bộ từ máy chủ
  // (không xóa thẳng dữ liệu trên máy: lần tải đầy đủ đã là dữ liệu sau khi xóa, có thể có ảnh mới nộp)
  P.handleDataResetMarker = function (isFullPull) {
    const at = this.data.data_reset && this.data.data_reset.at;
    if (!at) return;
    let seen = null;
    try { seen = localStorage.getItem(RESET_SEEN_KEY); } catch (e) {}
    if (seen === at) return;
    this.outbox = (this.outbox || []).filter(op => !RESET_COLLS.includes(op.c));
    this.persistOutbox();
    this.statsCache = null;
    this.currentShiftPhoto = null;
    this.currentShiftPhotoRoomId = null;
    try { localStorage.setItem(RESET_SEEN_KEY, at); } catch (e) {}
    if (!isFullPull) setTimeout(() => this.pullStateFromServer(true), 0);
    if (seen) this.showToast('ℹ️ Dữ liệu 5S đã được Admin xóa để triển khai mới. Ứng dụng đã làm mới dữ liệu trên máy này.');
  };

  P.openReset5SModal = function () {
    if (!this.isRootAdmin()) { this.showToast('🔒 Chỉ tài khoản Admin được xóa dữ liệu 5S.'); return; }
    const nAud = (this.data.audits || []).length;
    const nRs = ((this.data.schedules && this.data.schedules.rooms_schedule) || []).filter(r => !r._auto).length;
    const seedRooms = (typeof DEFAULT_SEED_DATA !== 'undefined' && DEFAULT_SEED_DATA.rooms) || [];
    const seedIds = new Set(seedRooms.map(r => String(r.id)));
    const nOld = (this.data.rooms || []).filter(r => !seedIds.has(String(r.id))).length;
    this.showModal(`
      <div class="p-5 space-y-3 text-xs">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <h3 class="text-sm font-black text-red-700 dark:text-red-400">XÓA TOÀN BỘ DỮ LIỆU 5S – TRIỂN KHAI MỚI</h3>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <div class="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 space-y-1">
          <div class="font-black">Sẽ XÓA VĨNH VIỄN trên máy chủ và mọi điện thoại (không khôi phục được):</div>
          <div>• Toàn bộ ảnh 5S đã nộp và ảnh trong kho ảnh</div>
          <div>• Toàn bộ phiếu 5S, kết quả duyệt Đạt / Không đạt, đánh giá khoa (máy này đang có ${nAud} phiếu, ${nRs} lượt khu vực)</div>
          <div>• Phân công nhân sự theo ca tại các khu vực, lịch sử vi phạm, số liệu thống kê</div>
          <div>• ${nOld} vị trí làm việc cũ (thay bằng ${seedRooms.length} vị trí theo danh sách toàn viện)</div>
        </div>
        <div class="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
          <strong>Giữ nguyên:</strong> tài khoản, mật khẩu, nhân sự, quyền duyệt, phân quyền khu vực, khoa phòng, cấu hình ca, hộp thư.
        </div>
        <label class="block">
          <span class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gõ chính xác <span class="font-mono text-red-600">XOA DU LIEU 5S</span> để xác nhận:</span>
          <input id="reset-5s-confirm" type="text" autocomplete="off" class="w-full bg-slate-50 dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl p-2.5 font-mono font-bold">
        </label>
        <button id="reset-5s-btn" onclick="app5s.runReset5S()" class="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black">XÓA DỮ LIỆU & TRIỂN KHAI MỚI</button>
        <p class="text-[10px] text-slate-400">Cần có mạng. Nên thực hiện ngoài giờ làm việc và báo trước cho các khoa.</p>
      </div>
    `);
  };

  P.runReset5S = async function () {
    if (!this.isRootAdmin()) return;
    const input = document.getElementById('reset-5s-confirm');
    const confirmText = input ? input.value.trim() : '';
    if (confirmText !== 'XOA DU LIEU 5S') { this.showToast('⚠️ Gõ đúng "XOA DU LIEU 5S" để xác nhận.'); if (input) input.focus(); return; }
    if (!this.authToken) { this.showToast('⚠️ Cần đăng nhập và có mạng để xóa dữ liệu trên máy chủ.'); return; }
    const btn = document.getElementById('reset-5s-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang xóa dữ liệu trên máy chủ...'; }
    try {
      // Gửi hết thay đổi khác (nhân sự, cấu hình...) trước, bỏ dữ liệu 5S đang chờ gửi
      this.outbox = (this.outbox || []).filter(op => !RESET_COLLS.includes(op.c));
      this.persistOutbox();
      await this.flushOutbox();
      const res = await this.apiFetch('reset', { method: 'POST', body: JSON.stringify({ confirm: 'XOA DU LIEU 5S' }) });
      this.data.data_reset = { at: res.at, by: res.by, counts: res.counts, photos_deleted: res.photos_deleted, photos_partial: res.photos_partial };
      try { localStorage.setItem(RESET_SEEN_KEY, res.at); } catch (e) {}
      this.clearLocal5SData();
      this.syncSnapshot = this.buildSyncSnapshot(this.data); // dữ liệu đã xóa trên máy chủ => không gửi lệnh xóa từng bản ghi
      this.applyAreaCatalog(true);                            // xóa vị trí cũ, áp dụng danh mục mới
      await this.flushOutbox();
      await this.pullStateFromServer(true);
      this.closeModal();
      this.render();
      const c = res.counts || {};
      this.showToast(`✅ Đã xóa ${c.audits || 0} phiếu, ${c.rooms_schedule || 0} lượt khu vực, ${c.department_evaluations || 0} đánh giá khoa, ${res.photos_deleted || 0} ảnh. Sẵn sàng triển khai mới.`);
      if (res.photos_partial) {
        setTimeout(() => alert('Kho ảnh còn ảnh chưa xóa hết do giới hạn thời gian máy chủ. Mở lại chức năng này và bấm xóa thêm lần nữa để xóa nốt ảnh.'), 500);
      }
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = 'XÓA DỮ LIỆU & TRIỂN KHAI MỚI'; }
      alert('Chưa xóa được dữ liệu: ' + ((err && err.message) || 'lỗi không xác định') + '\nKiểm tra mạng / quyền Admin rồi thử lại.');
    }
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
      // V29c: 5S thực hiện tất cả các ngày trong tuần (kể cả Chủ nhật) => không còn tùy chọn bỏ Chủ nhật
      this.statsState = { view: 'areas', from: today, to: today, dept: 'all', doneFilter: 'all', grades, personQ: '' };
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
  // V29c: lọc khu vực Tất cả / Đã thực hiện / Chưa thực hiện
  P.setStatsDoneFilter = function (v) { this.getStatsState().doneFilter = ['done', 'missing'].includes(v) ? v : 'all'; this.render(); };
  const NOT_DONE = ['missing', 'todayPending'];
  const DONE = ['approved', 'rejected', 'submitted'];
  // Ngày: theo trạng thái ô. Nhiều ngày: "Đã thực hiện" = làm đủ mọi ngày phải làm; "Chưa thực hiện" = còn ít nhất 1 ngày chưa làm.
  P.statsRoomGroup = function (a, cellStatus) {
    if (cellStatus !== undefined) return DONE.includes(cellStatus) ? 'done' : NOT_DONE.includes(cellStatus) ? 'missing' : 'off';
    if (!a || a.required + a.todayPending === 0) return 'off';
    return a.missing + a.todayPending > 0 ? 'missing' : 'done';
  };
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

        ${this.catalogBannerHtml()}
        ${this.isRootAdmin() ? `
          <div class="flex items-center justify-between gap-2 p-2.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-800 text-[11px]">
            <span class="text-slate-500">${this.data.data_reset && this.data.data_reset.at ? `Lần xóa dữ liệu gần nhất: <strong class="text-slate-700 dark:text-slate-200">${esc(this.data.data_reset.at)}</strong>` : 'Admin: xóa toàn bộ dữ liệu 5S cũ để triển khai mới'}</span>
            <button onclick="app5s.openReset5SModal()" class="shrink-0 px-2.5 py-1.5 rounded-xl border border-red-300 text-red-700 dark:text-red-300 font-bold flex items-center space-x-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i><span>Xóa dữ liệu & triển khai mới</span></button>
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
    const flt = st.doneFilter || 'all';
    const cellOf = (r) => cellMap.get(`${r.id}|${st.from}`) || { status: 'missing', rec: null };
    const groupOf = (r) => isDay ? this.statsRoomGroup(null, cellOf(r).status) : this.statsRoomGroup(S.roomAgg.get(String(r.id)));
    const counts = { all: S.rooms.length, done: 0, missing: 0 };
    S.rooms.forEach(r => { const g = groupOf(r); if (counts[g] !== undefined) counts[g]++; });
    const blocks = depts.map(d => {
      let rooms = byDept.get(String(d.id)).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
      const rows = rooms.map(r => {
        const a = S.roomAgg.get(String(r.id));
        if (flt !== 'all' && groupOf(r) !== flt) return '';
        if (isDay) {
          const c = cellOf(r);
          const rr = c.rec;
          return `<tr class="border-t border-slate-100 dark:border-slate-700">
            <td class="py-1.5 pr-2 font-bold text-slate-800 dark:text-slate-100">${esc(r.name)}</td>
            <td class="py-1.5 pr-2">${this.statusBadge5S(c.status)}</td>
            <td class="py-1.5 pr-2 text-slate-500">${rr && rr.u ? `${esc(rr.b || '')}${rr.t ? ' • ' + esc(rr.t) : ''}` : ''}${rr && rr.is && c.status === 'rejected' ? `<div class="text-red-600">Lỗi: ${esc(rr.is)}</div>` : ''}</td>
          </tr>`;
        }
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
      <div class="space-y-1">
        <div class="grid grid-cols-3 gap-1.5" role="group" aria-label="Lọc khu vực theo trạng thái thực hiện">
          ${[['all', 'Tất cả khu vực', 'bg-slate-800 text-white', 'border-slate-300 text-slate-700 dark:text-slate-200'],
             ['done', 'Đã thực hiện', 'bg-emerald-600 text-white', 'border-emerald-300 text-emerald-700 dark:text-emerald-300'],
             ['missing', 'Chưa thực hiện', 'bg-red-600 text-white', 'border-red-300 text-red-700 dark:text-red-300']].map(([id, label, on, off]) =>
            `<button onclick="app5s.setStatsDoneFilter('${id}')" aria-pressed="${flt === id}" class="py-2 px-1 rounded-xl text-[11px] font-black border transition ${flt === id ? on + ' border-transparent shadow-xs' : 'bg-white dark:bg-slate-800 ' + off}">${label} <span class="opacity-80">(${counts[id]})</span></button>`).join('')}
        </div>
        ${!isDay && flt !== 'all' ? `<div class="text-[10px] text-slate-400">${flt === 'done' ? 'Khu vực đã thực hiện đủ tất cả các ngày trong khoảng đã chọn.' : 'Khu vực còn ít nhất 1 ngày chưa thực hiện trong khoảng đã chọn.'}</div>` : ''}
      </div>
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
      rows: cells.filter(c => !st.doneFilter || st.doneFilter === 'all' || this.statsRoomGroup(null, c.status) === st.doneFilter).map((c, i) => [i + 1, fmtVN(c.date), deptName(c.room.department_id), c.room.name, stTxt[c.status] || c.status,
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

  // =========================================================================
  // 5. V29c: CẤP LẠI MẬT KHẨU CHO NHÂN VIÊN BỊ QUÊN / MẤT MẬT KHẨU
  //    Vào: Nhân sự → nút "Cấp lại mật khẩu" (hoặc biểu tượng chìa khóa ở từng người),
  //         Hộp thư Admin → yêu cầu "Cấp lại mật khẩu" → nút "Cấp lại mật khẩu ngay".
  //    Máy chủ sinh mật khẩu tạm, bắt buộc đổi ở lần đăng nhập kế tiếp, đăng xuất các phiên cũ.
  // =========================================================================
  P.canResetPasswordFor = function (s) {
    const me = this.getCurrentUser();
    if (!me || !s) return false;
    if (normCode(s.code) === normCode(me.code)) return false;
    if (this.isAdmin()) return true;
    const isReviewer = s.can_review || s.role === 'admin' || s.is_admin;
    return !isReviewer && this.isDepartmentManager() && String(s.department_id) === String(this.getUserDepartmentId());
  };

  P.canResetPasswords = function () {
    return this.isAdmin() || this.isDepartmentManager();
  };

  P.openPasswordResetModal = function (code, msgId) {
    if (!this.canResetPasswords()) { this.showToast('🔒 Chỉ Admin hoặc lãnh đạo khoa được cấp lại mật khẩu.'); return; }
    this.pwResetState = { q: '', code: code ? normCode(code) : '', msgId: msgId || null, result: null, busy: false, error: '' };
    this.renderPwResetModal();
  };

  P.setPwResetQuery = function (q) {
    this.pwResetState.q = q;
    clearTimeout(this.pwResetTimer);
    this.pwResetTimer = setTimeout(() => this.renderPwResetModal(), 200);
  };

  P.pickPwResetStaff = function (code) {
    Object.assign(this.pwResetState, { code: normCode(code), error: '' });
    this.renderPwResetModal();
  };

  P.renderPwResetModal = function () {
    const st = this.pwResetState;
    if (!st) return;
    const depts = new Map((this.data.departments || []).map(d => [String(d.id), d]));
    const deptName = (id) => (depts.get(String(id)) || {}).name || '';
    const s = st.code ? (this.data.staff || []).find(x => normCode(x.code) === st.code) : null;
    let body = '';
    if (st.result) {
      const r = st.result;
      body = `
        <div class="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
          <div class="font-black">✅ Đã cấp lại mật khẩu cho ${esc(r.name)} (${esc(r.code)})</div>
          <div class="text-[11px]">Mật khẩu tạm:</div>
          <div class="flex items-center gap-2">
            <code id="pw-reset-temp" class="flex-1 text-center text-xl font-black tracking-widest bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl py-2 select-all">${esc(r.temp_password)}</code>
            <button onclick="app5s.copyTempPassword()" class="px-3 py-2.5 rounded-xl bg-emerald-600 text-white font-bold">Sao chép</button>
          </div>
        </div>
        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
          <div>1. Báo mật khẩu tạm cho nhân viên <strong>trực tiếp hoặc qua điện thoại</strong> (không gửi vào nhóm chung).</div>
          <div>2. Nhân viên đăng nhập bằng <strong>Mã NV / tên đăng nhập</strong> và mật khẩu tạm.</div>
          <div>3. App bắt buộc nhân viên <strong>đặt mật khẩu mới</strong> ngay khi đăng nhập.</div>
          <div>Các máy đang đăng nhập tài khoản này đã bị đăng xuất. Mật khẩu tạm chỉ hiện một lần tại đây.</div>
        </div>
        <button onclick="app5s.closeModal(); app5s.pwResetState = null;" class="w-full py-2.5 rounded-2xl bg-slate-800 text-white font-black">Xong</button>`;
    } else if (s) {
      const can = this.canResetPasswordFor(s);
      body = `
        <div class="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-0.5">
          <div class="text-sm font-black text-slate-900 dark:text-white">${esc(s.name)}</div>
          <div class="text-[11px] text-slate-500">Mã NV: <strong class="font-mono">${esc(s.code)}</strong>${s.username ? ` • Tên đăng nhập: <strong class="font-mono">${esc(s.username)}</strong>` : ''}</div>
          <div class="text-[11px] text-slate-500">${esc(deptName(s.department_id))}${s.phone ? ` • SĐT: <a class="font-bold text-indigo-600" href="tel:${esc(s.phone)}">${esc(s.phone)}</a>` : ''}</div>
        </div>
        <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px]">
          ⚠️ Xác minh đúng người trước khi cấp (gọi lại số điện thoại trong hồ sơ hoặc gặp trực tiếp). Mật khẩu cũ sẽ hết hiệu lực ngay.
        </div>
        ${st.error ? `<div class="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-700 dark:text-red-300 font-bold">${esc(st.error)}</div>` : ''}
        ${can ? `<button id="pw-reset-btn" onclick="app5s.doPasswordReset()" ${st.busy ? 'disabled' : ''} class="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black">${st.busy ? 'Đang cấp lại...' : '🔑 CẤP MẬT KHẨU TẠM'}</button>`
          : `<div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">Bạn không có quyền cấp lại mật khẩu cho tài khoản này (chỉ Admin cấp cho người duyệt 5S / lãnh đạo).</div>`}
        <button onclick="app5s.pickPwResetStaff('')" class="w-full py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">‹ Chọn người khác</button>`;
    } else {
      const q = st.q.trim().toLowerCase();
      let list = (this.data.staff || []).filter(x => this.canResetPasswordFor(x));
      if (q) list = list.filter(x => `${x.name} ${x.code} ${x.username || ''} ${deptName(x.department_id)}`.toLowerCase().includes(q));
      list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi'));
      const total = list.length;
      body = `
        <input id="pw-reset-search" type="search" value="${esc(st.q)}" oninput="app5s.setPwResetQuery(this.value)" placeholder="Tìm theo họ tên, mã NV, tên đăng nhập, khoa..." class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
        <div class="text-[10px] text-slate-400">${total} tài khoản bạn được cấp lại mật khẩu${total > 40 ? ' • hiện 40 người đầu, gõ tên để tìm' : ''}</div>
        <div class="space-y-1">
          ${list.slice(0, 40).map(x => `
            <button onclick="app5s.pickPwResetStaff('${jsq(x.code)}')" class="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 flex items-center justify-between gap-2">
              <span><strong class="text-slate-900 dark:text-white">${esc(x.name)}</strong> <span class="font-mono text-[10px] text-slate-500">${esc(x.code)}</span><br><span class="text-[10px] text-slate-500">${esc(deptName(x.department_id))}</span></span>
              <span class="text-indigo-600 font-bold shrink-0">Chọn ›</span>
            </button>`).join('') || '<div class="p-4 text-center text-slate-400">Không tìm thấy tài khoản phù hợp.</div>'}
        </div>`;
    }
    this.showModal(`
      <div class="p-4 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar text-xs">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <div>
            <h3 class="text-sm font-black text-slate-900 dark:text-white">CẤP LẠI MẬT KHẨU NHÂN VIÊN</h3>
            <p class="text-[11px] text-slate-500">Dành cho nhân viên quên / mất mật khẩu đăng nhập</p>
          </div>
          <button onclick="app5s.closeModal(); app5s.pwResetState = null;" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        ${body}
      </div>`);
  };

  P.doPasswordReset = async function () {
    const st = this.pwResetState;
    if (!st || !st.code || st.busy) return;
    if (!this.authToken) { st.error = 'Cần đăng nhập và có mạng để cấp lại mật khẩu.'; this.renderPwResetModal(); return; }
    st.busy = true; st.error = '';
    this.renderPwResetModal();
    try {
      const res = await this.apiFetch('password', { method: 'POST', body: JSON.stringify({ reset_for: st.code, msg_id: st.msgId }) });
      if (!res || !res.temp_password) throw new Error('Máy chủ không trả về mật khẩu tạm');
      st.result = res;
      // Cập nhật ngay hộp thư trên máy này (máy chủ đã đánh dấu yêu cầu là đã xử lý)
      (this.data.admin_messages || []).forEach(m => {
        if (m && (String(m.id) === 'FP-' + st.code || (st.msgId && String(m.id) === String(st.msgId))) && !m.reply) {
          m.status = 'replied'; m.admin_read = true; m.reply = 'Đã cấp lại mật khẩu tạm.';
        }
      });
      this.showToast(`✅ Đã cấp lại mật khẩu cho ${res.name || res.code}`);
      setTimeout(() => this.pullStateFromServer(), 1500);
    } catch (e) {
      st.error = '❌ ' + ((e && e.message) || 'Không cấp lại được mật khẩu') + (navigator.onLine === false ? ' (mất mạng)' : '');
    } finally {
      st.busy = false;
      this.renderPwResetModal();
      this.updateInboxIndicators();
    }
  };

  P.copyTempPassword = function () {
    const v = this.pwResetState && this.pwResetState.result && this.pwResetState.result.temp_password;
    if (!v) return;
    const done = () => this.showToast('📋 Đã sao chép mật khẩu tạm');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(v).then(done, () => this.showToast('Hãy chọn và chép mật khẩu thủ công')); return; }
    } catch (e) {}
    this.showToast('Hãy chọn và chép mật khẩu thủ công');
  };

  // =========================================================================
  // 6. V29c: HÒM THƯ CÓ THÔNG BÁO CHO ADMIN KHI CÓ TIN NHẮN / YÊU CẦU MỚI
  //    - Số tin chưa đọc trên quả chuông + dải nhắc "Hòm thư có N tin mới" ở đầu màn hình
  //    - Chuông + thông báo nổi khi tin mới về (kể cả khi app chạy nền, nếu cho phép thông báo)
  //    - Mở hòm thư => các tin được đánh dấu đã đọc trên mọi máy của Admin
  // =========================================================================
  const NOTIFIED_KEY = 'vpi_5s_inbox_notified_v1';
  const PW_TOPIC = 'Cấp lại mật khẩu';

  P.isInboxOwner = function () { return this.isAdmin(); };

  P.getUnreadInbox = function () {
    if (!this.isInboxOwner()) return [];
    const me = normCode((this.getCurrentUser() || {}).code);
    return (this.data.admin_messages || []).filter(m => m && !m.admin_read && !m.reply && m.status !== 'replied' && normCode(m.sender_code) !== me);
  };

  P.updateInboxIndicators = function () {
    const unread = this.getUnreadInbox();
    const n = unread.length;
    let pill = document.getElementById('vpi-inbox-alert');
    const loggedIn = !!this.getCurrentUser();
    const inboxOpen = !!document.querySelector('#modal-container h3') && /HỘP THƯ TIN NHẮN/.test(document.querySelector('#modal-container h3').textContent);
    if (n > 0 && loggedIn && !inboxOpen) {
      if (!pill) {
        pill = document.createElement('button');
        pill.id = 'vpi-inbox-alert';
        pill.type = 'button';
        pill.setAttribute('aria-live', 'polite');
        pill.onclick = () => this.openAdminInboxModal();
        pill.className = 'fixed left-1/2 -translate-x-1/2 z-40 px-3.5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg flex items-center gap-1.5';
        pill.style.top = 'calc(env(safe-area-inset-top, 0px) + 58px)';
        document.body.appendChild(pill);
      }
      const urgent = unread.filter(m => m.priority === 'urgent' || m.topic === PW_TOPIC).length;
      pill.textContent = `📬 Hòm thư có ${n} tin mới${urgent ? ` (${urgent} khẩn)` : ''} – Mở xem`;
    } else if (pill) {
      pill.remove();
    }
    // Số trên quả chuông: Admin = phiếu chờ duyệt + tin nhắn chưa đọc
    const notifEl = document.getElementById('notif-count');
    if (notifEl && this.isInboxOwner()) {
      const pending = this.canReview5S() ? (this.data.audits || []).filter(a => a && (a.status === 'pending' || !a.status)).length : 0;
      const total = pending + n;
      notifEl.textContent = total > 99 ? '99+' : String(total);
      notifEl.classList.toggle('hidden', total === 0);
    }
    try {
      if (this.isInboxOwner() && navigator.setAppBadge) { n ? navigator.setAppBadge(n) : navigator.clearAppBadge(); }
    } catch (e) {}
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = n ? `(${n}) ${base}` : base;
  };

  P.checkInboxNotifications = function () {
    if (!this.isInboxOwner()) { this.updateInboxIndicators(); return; }
    const unread = this.getUnreadInbox();
    let notified;
    try { notified = new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')); } catch (e) { notified = new Set(); }
    const fresh = unread.filter(m => !notified.has(String(m.id)));
    if (fresh.length) {
      fresh.forEach(m => notified.add(String(m.id)));
      try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(notified).slice(-400))); } catch (e) {}
      const first = fresh[0];
      const title = fresh.length === 1
        ? `📬 ${first.topic === PW_TOPIC ? 'Yêu cầu cấp lại mật khẩu' : 'Tin nhắn mới'} từ ${first.sender_name || first.sender_code || 'nhân viên'}`
        : `📬 Hòm thư Admin có ${fresh.length} tin nhắn mới`;
      const body = fresh.length === 1 ? String(first.title || first.content || '').slice(0, 140) : fresh.slice(0, 3).map(m => `• ${m.sender_name || ''}: ${m.title || m.topic || ''}`).join('\n');
      this.showToast(title);
      try { this.playNotificationChime(); } catch (e) {}
      try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
      this.showSystemNotification(title, body);
    }
    this.updateInboxIndicators();
  };

  P.showSystemNotification = function (title, body) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      if (document.visibilityState === 'visible' && document.hasFocus && document.hasFocus()) return; // đang mở app: đã có chuông + dải nhắc
      const opts = { body, tag: 'vpi-inbox', renotify: true, icon: '/icon-192.png', badge: '/favicon.png', data: { url: '/?inbox=1' } };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => reg.showNotification(title, opts)).catch(() => { try { new Notification(title, opts); } catch (e) {} });
      } else {
        new Notification(title, opts);
      }
    } catch (e) {}
  };

  P.enableInboxNotifications = function () {
    if (!('Notification' in window)) { this.showToast('Trình duyệt này không hỗ trợ thông báo. Trên iPhone: thêm app vào Màn hình chính rồi mở từ biểu tượng.'); return; }
    Notification.requestPermission().then(p => {
      this.showToast(p === 'granted' ? '🔔 Đã bật thông báo hòm thư trên máy này' : '🔕 Chưa được phép hiện thông báo (bật lại trong cài đặt trình duyệt)');
      if (p === 'granted') this.showSystemNotification('🔔 Thông báo hòm thư 5S VPI đã bật', 'Bạn sẽ nhận thông báo khi có tin nhắn / yêu cầu mới.');
      this.openAdminInboxModal();
    });
  };

  // Hòm thư (thay bản cũ): đánh dấu tin MỚI, nút cấp lại mật khẩu, bật thông báo, sửa lỗi nút trả lời với mã tin dạng chữ
  P.openAdminInboxModal = function () {
    const owner = this.isInboxOwner();
    const messages = this.data.admin_messages || [];
    const unread = this.getUnreadInbox();
    if (!this.inboxNewIds || !this.inboxModalOpen) this.inboxNewIds = new Set(unread.map(m => String(m.id)));
    else unread.forEach(m => this.inboxNewIds.add(String(m.id)));
    this.inboxModalOpen = true;
    if (!this.inboxFilter) this.inboxFilter = 'all';
    const flt = this.inboxFilter;
    const list = messages.filter(m => m && (flt === 'all' || (flt === 'open' && !m.reply) || (flt === 'pw' && m.topic === PW_TOPIC)));
    const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    const staffBy = new Map((this.data.staff || []).map(s => [normCode(s.code), s]));
    const fbtn = (id, label, n) => `<button onclick="app5s.inboxFilter='${id}'; app5s.openAdminInboxModal()" class="px-2.5 py-1.5 rounded-xl font-bold text-[11px] ${flt === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">${label} (${n})</button>`;
    const html = `
      <div class="p-5 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold"><i data-lucide="inbox" class="w-5 h-5"></i></div>
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white">HỘP THƯ TIN NHẮN & GÓP Ý ADMIN</h3>
              <p class="text-[10px] text-indigo-600 font-bold">${this.inboxNewIds.size ? `${this.inboxNewIds.size} tin mới` : 'Không có tin mới'}</p>
            </div>
          </div>
          <button onclick="app5s.closeModal()" class="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        ${owner ? `
          <div class="flex items-center justify-between gap-2 p-2.5 rounded-2xl text-[11px] ${perm === 'granted' ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'}">
            <span>${perm === 'granted' ? '🔔 Đã bật thông báo tin nhắn mới trên máy này.' : perm === 'denied' ? '🔕 Trình duyệt đang chặn thông báo. Bật lại trong cài đặt trang để nhận báo tin mới.' : perm === 'unsupported' ? 'Máy này không hỗ trợ thông báo nổi; tin mới vẫn báo bằng chuông và dải đỏ khi mở app.' : 'Bật thông báo để biết ngay khi có tin nhắn / yêu cầu cấp lại mật khẩu.'}</span>
            ${perm === 'default' ? `<button onclick="app5s.enableInboxNotifications()" class="shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-600 text-white font-black">Bật thông báo</button>` : ''}
          </div>` : ''}
        <div class="flex flex-wrap gap-1.5">
          ${fbtn('all', 'Tất cả', messages.length)}${fbtn('open', 'Chưa trả lời', messages.filter(m => m && !m.reply).length)}${fbtn('pw', 'Cấp lại mật khẩu', messages.filter(m => m && m.topic === PW_TOPIC).length)}
        </div>
        <div class="space-y-3">
          ${list.length === 0 ? `<div class="text-center py-8 text-slate-400 text-xs"><i data-lucide="message-square-off" class="w-8 h-8 mx-auto mb-2 opacity-50"></i><p>Không có tin nhắn nào.</p></div>` : list.map(m => {
            const isNew = this.inboxNewIds.has(String(m.id));
            const isPw = m.topic === PW_TOPIC;
            const target = staffBy.get(normCode(m.sender_code));
            const canPw = isPw && !m.reply && target && this.canResetPasswordFor(target);
            return `
            <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border ${isNew ? 'border-red-400 ring-1 ring-red-300 dark:ring-red-800' : 'border-slate-200 dark:border-slate-700'} shadow-2xs space-y-2">
              <div class="flex items-center justify-between text-xs gap-2">
                <div class="flex items-center flex-wrap gap-1.5">
                  ${isNew ? '<span class="px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black">MỚI</span>' : ''}
                  <strong class="text-slate-900 dark:text-white">${esc(m.sender_name)}</strong>
                  <span class="text-[10px] text-slate-400">[${esc(m.dept_name)}]</span>
                </div>
                <span class="shrink-0 text-[10px] ${m.priority === 'urgent' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-600'} px-2 py-0.5 rounded-full font-bold">${esc(m.topic)}</span>
              </div>
              <div class="text-xs font-bold text-slate-800 dark:text-slate-100">${esc(m.title)}</div>
              <div class="text-[11.5px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl leading-relaxed">${esc(m.content)}</div>
              ${canPw ? `<button onclick="app5s.openPasswordResetModal('${jsq(target.code)}', '${jsq(m.id)}')" class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black">🔑 Cấp lại mật khẩu cho ${esc(target.name)} (${esc(target.code)})</button>` : ''}
              ${isPw && !m.reply && !target ? `<div class="text-[10.5px] text-amber-700 dark:text-amber-300">Không tìm thấy mã NV ${esc(m.sender_code)} trong danh sách nhân sự.</div>` : ''}
              ${m.reply ? `
                <div class="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800"><strong>Phản hồi:</strong> ${esc(m.reply)}</div>` : `
                <div class="flex items-center justify-between pt-1">
                  <span class="text-[10px] text-slate-400">🕒 ${esc(m.date)}</span>
                  ${owner || this.isHospitalLeaderOrSupervisor() ? `<button onclick="app5s.quickReplyMessage('${jsq(m.id)}')" class="text-[10px] font-bold text-indigo-600 hover:underline">✍️ Trả lời tin nhắn</button>` : ''}
                </div>`}
            </div>`;
          }).join('')}
        </div>
        <div class="pt-2">
          <button onclick="app5s.openFeedbackModal()" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition"><i data-lucide="plus" class="w-4 h-4"></i><span>Soạn Tin Nhắn / Góp Ý Mới</span></button>
        </div>
      </div>`;
    this.showModal(html);
    // Đánh dấu đã đọc (đồng bộ lên máy chủ => máy khác của Admin cũng hết báo)
    if (owner && unread.length) {
      const at = new Date().toLocaleString('vi-VN');
      unread.forEach(m => { m.admin_read = true; m.admin_read_at = at; });
      this.saveData();
    }
    this.updateInboxIndicators();
  };

  // Đóng hộp thư => bỏ nhãn MỚI cho lần mở sau
  const origCloseModal = P.closeModal;
  P.closeModal = function () {
    this.inboxModalOpen = false;
    this.inboxNewIds = null;
    const r = origCloseModal.apply(this, arguments);
    try { this.updateInboxIndicators(); } catch (e) {}
    return r;
  };

  // Trung tâm thông báo (quả chuông): Admin thấy ngay mục hòm thư
  const origNotifCenter = P.openNotificationsCenterModal;
  P.openNotificationsCenterModal = function () {
    const r = origNotifCenter.apply(this, arguments);
    if (this.isInboxOwner()) {
      const n = this.getUnreadInbox().length;
      const box = document.querySelector('#modal-container .space-y-4');
      if (box && box.children.length > 1 && !box.querySelector('#vpi-notif-inbox')) {
        const el = document.createElement('button');
        el.id = 'vpi-notif-inbox';
        el.type = 'button';
        el.onclick = () => this.openAdminInboxModal();
        el.className = `w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center justify-between ${n ? 'bg-red-600 text-white' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'}`;
        el.innerHTML = `<span>📬 Hòm thư Admin: ${n ? `<strong>${n} tin nhắn mới</strong>` : 'không có tin mới'}</span><span>Mở ›</span>`;
        box.insertBefore(el, box.children[1]);
      }
    }
    return r;
  };

  // Giữ số trên chuông đúng sau mỗi lần vẽ lại giao diện
  const origUpdateUI = P.updateUserInterface;
  P.updateUserInterface = function () {
    const r = origUpdateUI.apply(this, arguments);
    try { this.updateInboxIndicators(); } catch (e) {}
    return r;
  };

  // Sau mỗi lần tải dữ liệu từ máy chủ: kiểm tra tin mới
  const origPull = P.pullStateFromServer;
  P.pullStateFromServer = function () {
    const p = origPull.apply(this, arguments);
    Promise.resolve(p).then(() => { try { this.checkInboxNotifications(); } catch (e) {} });
    return p;
  };

  // Admin: khi app chạy nền vẫn kiểm tra hòm thư mỗi 60 giây để báo tin mới
  P.initInboxWatcher = function () {
    if (this.inboxWatcherReady) return;
    this.inboxWatcherReady = true;
    const tick = () => {
      if (document.visibilityState === 'hidden' && this.authToken && this.isInboxOwner()) this.pullStateFromServer();
    };
    document.addEventListener('visibilitychange', () => {
      clearInterval(this.inboxBgTimer);
      if (document.visibilityState === 'hidden' && this.isInboxOwner()) this.inboxBgTimer = setInterval(tick, 60000);
    });
    try {
      if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', ev => {
        if (ev.data && ev.data.type === 'open-inbox' && this.getCurrentUser()) this.openAdminInboxModal();
      });
    } catch (e) {}
    // Mở từ thông báo (/?inbox=1)
    if (/[?&]inbox=1/.test(location.search)) {
      setTimeout(() => { if (this.getCurrentUser()) this.openAdminInboxModal(); }, 1500);
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
    }
    setTimeout(() => this.checkInboxNotifications(), 2500);
  };

  // =========================================================================
  // 7. V29d: CHỨC DANH, HỘI ĐỒNG QUẢN TRỊ / BAN GIÁM ĐỐC, PHÓ KHOA / PHÓ PHÒNG, QUYỀN BÁO CÁO
  // =========================================================================
  // Giá trị option: "vai_trò|chức_danh|nhóm_lãnh_đạo". Vai trò quyết định quyền:
  //  admin = toàn quyền; supervisor = lãnh đạo viện (bật "Được duyệt" để xem/duyệt toàn viện);
  //  manager = lãnh đạo khoa/phòng (phân công, báo cáo khoa mình); staff = chỉ gửi ảnh 5S.
  const ROLE_CATALOG = [
    { label: '🏛️ Hội đồng quản trị', group: 'hdqt', items: [
      ['supervisor', 'Chủ tịch Hội đồng quản trị'], ['supervisor', 'Phó Chủ tịch Hội đồng quản trị'],
      ['supervisor', 'Thành viên Hội đồng quản trị'], ['supervisor', 'Thư ký Hội đồng quản trị']] },
    { label: '👔 Ban giám đốc', group: 'bgd', items: [
      ['supervisor', 'Giám đốc'], ['supervisor', 'Phó Giám đốc'], ['supervisor', 'Phó Giám đốc chuyên môn'],
      ['supervisor', 'Phó Giám đốc hành chính'], ['supervisor', 'Trợ lý Giám đốc']] },
    { label: '🌟 Ban Chỉ Đạo 5S (toàn quyền Admin)', items: [
      ['admin', 'Trưởng Ban Chỉ Đạo 5S / Ban Giám Đốc', '👑 Trưởng Ban Chỉ Đạo 5S'], ['admin', 'Cán bộ Giám sát 5S Toàn Viện', '🔍 Cán bộ Giám sát 5S Toàn Viện & QLCL']] },
    { label: '🩺 Lãnh đạo Khoa chuyên môn', items: [
      ['manager', 'Trưởng Khoa'], ['manager', 'Phó Trưởng Khoa'], ['manager', 'BSCKII - Trưởng Khoa'], ['manager', 'BSCKI - Trưởng Khoa'],
      ['manager', 'ThS. Bác sĩ - Trưởng Khoa'], ['manager', 'BSCKII - Phó Trưởng Khoa'], ['manager', 'BSCKI - Phó Trưởng Khoa'],
      ['manager', 'Điều dưỡng Trưởng Khoa'], ['manager', 'Kỹ thuật viên Trưởng'], ['manager', 'Hộ sinh Trưởng Khoa']] },
    { label: '🏢 Lãnh đạo Phòng chức năng', items: [
      ['manager', 'Trưởng Phòng'], ['manager', 'Phó Trưởng Phòng'], ['manager', 'Kế toán trưởng'],
      ['manager', 'Phó Kế toán trưởng'], ['manager', 'Phó Phòng phụ trách'], ['manager', 'Tổ trưởng / Trưởng bộ phận'],
      ['manager', 'Trưởng Phòng Chức Năng']] },
    { label: '📑 Nhân viên Phòng chức năng', items: [
      ['staff', 'Chuyên viên'], ['staff', 'Kế toán viên'], ['staff', 'Thủ quỹ'], ['staff', 'Thủ kho'],
      ['staff', 'Nhân viên Hành chính / Kế toán'], ['staff', 'Nhân viên Kế hoạch tổng hợp'], ['staff', 'Nhân viên Tổ chức - Nhân sự'],
      ['staff', 'Nhân viên Vật tư - Thiết bị y tế'], ['staff', 'Nhân viên Chăm sóc khách hàng'], ['staff', 'Kỹ sư / Nhân viên CNTT - Kỹ thuật'],
      ['staff', 'Lái xe'], ['staff', 'Bảo vệ']] },
    { label: '🏥 Cán bộ chuyên môn & Nhân viên 5S', items: [
      ['staff', 'Bác sĩ Điều trị'], ['staff', 'Điều dưỡng viên'], ['staff', 'Kỹ thuật viên CĐHA'], ['staff', 'Kỹ thuật viên Xét nghiệm'],
      ['staff', 'Dược sĩ / Quản lý kho dược'], ['staff', 'Hộ sinh viên'], ['staff', 'Hộ lý / Nhân viên vệ sinh', '🧹 Hộ lý / Nhân viên vệ sinh khử khuẩn'],
      ['staff', 'Cán bộ / Nhân viên 5S']] }
  ];
  const LEADER_GROUPS = { hdqt: 'Hội đồng quản trị', bgd: 'Ban giám đốc' };

  P.roleOptionsHtml = function (s) {
    const isNew = !s;
    return ROLE_CATALOG.map(g => `<optgroup label="${esc(g.label)}">${g.items.map(([role, title, label]) => {
      const sel = isNew ? (title === 'Điều dưỡng viên') : (s.role === role && (s.role_title || s.title) === title);
      return `<option value="${esc(role + '|' + title + '|' + (g.group || '-'))}" ${sel ? 'selected' : ''}>${esc(label || title)}</option>`;
    }).join('')}</optgroup>`).join('');
  };

  P.leaderGroupSelectHtml = function (prefix, current) {
    return `
      <label class="block p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 space-y-1">
        <span class="block text-[11px] font-bold text-amber-900 dark:text-amber-200">🏛️ Thuộc danh sách lãnh đạo (hiện riêng ở tab Nhân sự):</span>
        <select id="${prefix}-group" class="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white">
          <option value="" ${!current ? 'selected' : ''}>Không (nhân sự khoa / phòng)</option>
          <option value="hdqt" ${current === 'hdqt' ? 'selected' : ''}>Hội đồng quản trị</option>
          <option value="bgd" ${current === 'bgd' ? 'selected' : ''}>Ban giám đốc</option>
        </select>
      </label>`;
  };

  // Chọn chức danh trong danh mục => tự điền chức danh và nhóm lãnh đạo
  P.onRoleSelectChange = function (val, prefix) {
    if (!val) return;
    const parts = val.split('|');
    const titleInput = document.getElementById(prefix + '-title');
    if (titleInput) titleInput.value = parts[1] || 'Cán bộ 5S';
    const customTitle = document.getElementById(prefix + '-custom-role-title');
    if (customTitle && parts.length >= 3) customTitle.value = parts[1] || '';
    // Chức danh HĐQT / Ban giám đốc => tự chọn phòng "Hội đồng quản trị" / "Ban giám đốc" ở ô Khoa/phòng làm việc
    const deptSel = document.getElementById(prefix + '-dept');
    if (deptSel && parts.length >= 3 && BOARD_GROUP_DEPT[parts[2]]) deptSel.value = String(BOARD_GROUP_DEPT[parts[2]]);
  };

  // Thành viên HĐQT / Ban giám đốc: thuộc phòng HĐQT / BGĐ (hoặc được đánh dấu nhóm lãnh đạo từ bản trước)
  P.leaderGroupOf = function (s) {
    if (!s) return '';
    return BOARD_DEPT_GROUP[Number(s.department_id)] || (s.leader_group === 'hdqt' || s.leader_group === 'bgd' ? s.leader_group : '');
  };
  P.isBoardMember = function (u) {
    return !!this.leaderGroupOf(u || this.getCurrentUser());
  };

  // Phó khoa / phó phòng: nhập ở hồ sơ khoa (không giới hạn) + nhân sự có chức danh "Phó ..." của khoa
  P.getDeptDeputies = function (d) {
    if (!d) return [];
    const out = [];
    const add = (n) => { const v = String(n || '').trim(); if (v && !out.some(x => x.toLowerCase() === v.toLowerCase())) out.push(v); };
    (Array.isArray(d.deputies) ? d.deputies : []).forEach(add);
    (this.data.staff || []).forEach(s => {
      if (!s || String(s.department_id) !== String(d.id) || this.isBoardMember(s)) return;
      const t = String(s.role_title || s.title || '');
      if (/(^|\s|-)Phó (Trưởng )?(Khoa|Phòng)\b|Phó Kế toán trưởng|Phó Phòng/i.test(t)) add(s.name);
    });
    return out;
  };

  P.renderLeadershipGroupsHtml = function () {
    const q = String(this.staffSearchQuery || '').trim().toLowerCase();
    const admin = this.isAdmin();
    const order = (t) => {
      const ranks = ['Chủ tịch', 'Phó Chủ tịch', 'Thành viên', 'Thư ký', 'Giám đốc', 'Phó Giám đốc', 'Trợ lý'];
      const i = ranks.findIndex(r => String(t || '').startsWith(r));
      return i < 0 ? 99 : i;
    };
    const blocks = Object.entries(LEADER_GROUPS).map(([key, label]) => {
      let list = (this.data.staff || []).filter(s => s && this.leaderGroupOf(s) === key);
      const total = list.length;
      if (q) list = list.filter(s => `${s.name} ${s.code} ${s.role_title || ''} ${s.title || ''}`.toLowerCase().includes(q));
      if (q && !list.length) return '';
      list.sort((a, b) => order(a.role_title || a.title) - order(b.role_title || b.title) || String(a.name).localeCompare(String(b.name), 'vi'));
      return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border ${key === 'hdqt' ? 'border-amber-300 dark:border-amber-800' : 'border-indigo-300 dark:border-indigo-800'} p-3 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black ${key === 'hdqt' ? 'text-amber-800 dark:text-amber-300' : 'text-indigo-800 dark:text-indigo-300'}">${key === 'hdqt' ? '🏛️' : '👔'} ${label.toUpperCase()} (${total})</span>
            ${admin ? `<span class="text-[10px] text-slate-400">Thêm: tạo / sửa tài khoản → Khoa/phòng làm việc: ${label}</span>` : ''}
          </div>
          ${list.length ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">${list.map(s => `
            <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
              <div class="min-w-0">
                <div class="text-xs font-bold text-slate-900 dark:text-white truncate">${esc(s.name)}</div>
                <div class="text-[10px] text-slate-500 truncate">${esc(s.role_title || s.title || '')} • <span class="font-mono">${esc(s.code)}</span></div>
              </div>
              ${admin ? `<button onclick="app5s.openEditStaffModal('${jsq(s.code)}')" title="Sửa" class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>` : ''}
            </div>`).join('')}</div>` : `<div class="text-[11px] text-slate-400">Chưa có thành viên.${admin ? ' Vào sửa tài khoản, chọn Khoa/phòng làm việc là "' + label + '".' : ''}</div>`}
        </div>`;
    }).join('');
    return blocks ? `<div class="space-y-2">${blocks}</div>` : '';
  };

  // Admin chính (tài khoản quản trị gốc) - dùng cho thao tác không hoàn tác như xóa toàn bộ dữ liệu 5S
  P.isRootAdmin = function () {
    const u = this.getCurrentUser();
    const codes = (typeof REVIEW_POLICY !== 'undefined' && REVIEW_POLICY.ADMIN_CODES) || ['BV-345'];
    return !!(u && codes.includes(normCode(u.code)));
  };

  // Báo cáo / Excel / In / Thống kê: lãnh đạo khoa phòng, người duyệt 5S, HĐQT / Ban giám đốc, Admin
  const origCanUseReports = P.canUseReports;
  P.canUseReports = function () {
    return !!(origCanUseReports && origCanUseReports.call(this)) || this.isBoardMember();
  };
  const origStatsAccess = P.statsAccess;
  P.statsAccess = function () {
    const a = origStatsAccess.call(this);
    if (this.isBoardMember()) { a.leader = true; a.seeViolations = true; }
    return a;
  };
  const guardReport = (name, label) => {
    const orig = P[name];
    if (typeof orig !== 'function') return;
    P[name] = function () {
      if (!this.canUseReports()) { this.showToast(`🔒 ${label} chỉ dành cho lãnh đạo khoa phòng và tài khoản duyệt 5S.`); return; }
      return orig.apply(this, arguments);
    };
  };
  [['openDailySummaryModal', 'Báo cáo 5S'], ['openGoogleSheetSyncModal', 'Xuất Excel'], ['exportScheduleToExcel', 'Xuất Excel'],
   ['saveGoogleSheetUrl', 'Xuất Excel'], ['printDailyEvaluationReport', 'In báo cáo'], ['openCustomPrintModal', 'In báo cáo'],
   ['executeCustomPrint', 'In báo cáo'], ['exportStatsCsv', 'Xuất Excel'], ['printStats', 'In báo cáo']
  ].forEach(([n, l]) => guardReport(n, l));
  const origRenderStats = P.renderStatsTab;
  P.renderStatsTab = function () {
    if (!this.canUseReports()) return '<div class="p-6 text-center text-xs text-slate-400">🔒 Báo cáo 5S chỉ dành cho lãnh đạo khoa phòng và tài khoản duyệt 5S.</div>';
    return origRenderStats.apply(this, arguments);
  };

  const origUpdateUI2 = P.updateUserInterface;
  P.updateUserInterface = function () {
    const r = origUpdateUI2.apply(this, arguments);
    const btn = document.getElementById('header-print-btn');
    if (btn) btn.style.display = this.canUseReports() ? '' : 'none';
    return r;
  };

  const startWatcher = () => { if (window.app5s && window.app5s.initInboxWatcher) window.app5s.initInboxWatcher(); else setTimeout(startWatcher, 500); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startWatcher); else startWatcher();
})();
