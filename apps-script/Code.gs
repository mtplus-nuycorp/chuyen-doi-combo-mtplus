/**
 * Chuyển đổi combo MTplus — máy chủ dữ liệu (Google Apps Script)
 * Đọc các file Google Sheet nguồn, lưu tick / mục tiêu / ghi chú vào file Tool.
 * Triển khai: Web app, Execute as: Me, Who has access: Only myself.
 */

// Địa chỉ GitHub Pages chứa giao diện (sửa nếu đổi tên tài khoản / repo)
const ASSET = 'https://mtplus-nuycorp.github.io/chuyen-doi-combo-mtplus/';

const NGUOI_DUOC_SUA = ['mtplus.nuycorp@gmail.com'];

const TOOL_ID = '1NaLo0m8VBgVOGQq6afJqdVX7inPZOczsshHnbedQMg4';
const CLB_ID = '1KZAYBYzIb0_wWkw-WmXirOijdb_KTbxzybVpoId8qpg';
const MT30_ID = '1q3eLzMIArXaCgRip5-eTSRAi9RjScm1EDAXMXFxdQQw';

// id nguồn: [file, tab, vùng]
const NGUON = {
  clb_bang: [CLB_ID, 'BÁO CÁO KỶ LUẬT THÁNG 11', 'A1:AK600'],
  clb_bang_t9: [CLB_ID, 'BÁO CÁO KỶ LUẬT T9 (Từ 21.9)', 'A1:AK600'],
  clb_muctieu: [CLB_ID, 'BÁO CÁO KỶ LUẬT THÁNG 11', 'AO1:AU80'],
  mt30_bang: [MT30_ID, 'THỐNG KÊ 3.0 T10-11', 'A1:AK600'],
  mt30_tong: [MT30_ID, 'QUẢN LÝ MT30 ', 'S3:V3'],
  danhba: [TOOL_ID, 'Danh bạ TP/TN', 'A1:C60'],
  mt30_lichsu: [TOOL_ID, 'Lịch sử MT30', 'A1:I1500'],
  clb_lichsu: [TOOL_ID, 'Lịch sử CLB 100 tỷ', 'A1:G2000'],
  zalo_log: [TOOL_ID, 'Báo cáo Zalo', 'A1:H3000']
};

// Dữ liệu nhập trên web: đường dẫn -> tab trong file Tool
const KHO = {
  'data/clb_web': 'Web - Tick CLB',
  'data/mt30_web': 'Web - Tick MT30',
  'data/tong_tuan': 'Web - Tổng tuần'
};
const KHO_ID = { clb_web: 'data/clb_web', mt30_web: 'data/mt30_web', tong_tuan: 'data/tong_tuan' };

function doGet() {
  const t = HtmlService.createTemplateFromFile('Index');
  t.asset = ASSET;
  return t.evaluate()
    .setTitle('Chuyển đổi combo MTplus')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function cotSo_(chu) {
  let n = 0;
  for (const c of chu) n = n * 26 + (c.charCodeAt(0) - 64);
  return n;
}

function docVung_(fileId, tab, a1) {
  const sh = SpreadsheetApp.openById(fileId).getSheetByName(tab);
  if (!sh) throw new Error('Không thấy tab "' + tab + '"');
  const m = a1.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  const c1 = cotSo_(m[1]), r1 = +m[2];
  const c2 = Math.min(cotSo_(m[3]), sh.getMaxColumns()), r2 = Math.min(+m[4], sh.getMaxRows());
  if (r2 < r1 || c2 < c1) return [];
  const v = sh.getRange(r1, c1, r2 - r1 + 1, c2 - c1 + 1).getDisplayValues();
  // bỏ ô trống ở cuối mỗi dòng và các dòng trống ở cuối cho nhẹ
  const ra = v.map((r) => { let k = r.length; while (k > 0 && r[k - 1] === '') k--; return r.slice(0, k); });
  while (ra.length && !ra[ra.length - 1].length) ra.pop();
  return ra;
}

function tabKho_(ten) {
  const ss = SpreadsheetApp.openById(TOOL_ID);
  let sh = ss.getSheetByName(ten);
  if (!sh) {
    sh = ss.insertSheet(ten);
    sh.getRange(1, 1, 1, 3).setValues([['id', 'du_lieu', 'cap_nhat']]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function docKho_(ten) {
  const sh = tabKho_(ten);
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, 2).getValues()
    .filter((r) => r[0])
    .map((r) => { try { return Object.assign({ id: String(r[0]) }, JSON.parse(r[1])); } catch (e) { return null; } })
    .filter(Boolean);
}

/** Toàn bộ dữ liệu cho trang, trả về chuỗi JSON. */
function getAll() {
  const out = { sheets: {}, store: {}, loi: {}, luc: new Date().toISOString(), co_quyen_sua: coQuyenSua_() };
  for (const id in NGUON) {
    const [f, tab, a1] = NGUON[id];
    try { out.sheets[id] = docVung_(f, tab, a1); }
    catch (e) { out.loi[id] = String(e && e.message || e); }
  }
  for (const id in KHO_ID) {
    try { out.store[id] = docKho_(KHO[KHO_ID[id]]); }
    catch (e) { out.loi[id] = String(e && e.message || e); out.store[id] = []; }
  }
  return JSON.stringify(out);
}

function coQuyenSua_() {
  const email = (Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || '').toLowerCase();
  return NGUOI_DUOC_SUA.indexOf(email) >= 0;
}

/** Ghi một bản ghi: path = 'data/clb_web/<id>' ... */
function setDoc(path, data) {
  if (!coQuyenSua_()) throw new Error('Tài khoản này không có quyền sửa.');
  const k = path.lastIndexOf('/');
  const col = path.slice(0, k), id = path.slice(k + 1);
  const ten = KHO[col];
  if (!ten || !id) throw new Error('Đường dẫn không hợp lệ: ' + path);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = tabKho_(ten);
    const n = sh.getLastRow();
    const ids = n >= 2 ? sh.getRange(2, 1, n - 1, 1).getValues().map((r) => String(r[0])) : [];
    const i = ids.indexOf(id);
    const dong = [[id, JSON.stringify(data), new Date()]];
    if (i >= 0) sh.getRange(i + 2, 1, 1, 3).setValues(dong);
    else sh.getRange(n + 1, 1, 1, 3).setValues(dong);
  } finally {
    lock.releaseLock();
  }
  return true;
}
