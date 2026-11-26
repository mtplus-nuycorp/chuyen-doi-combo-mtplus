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
  zalo_log: [TOOL_ID, 'Báo cáo Zalo', 'A1:H3000'],
  quy_luat: [TOOL_ID, 'Luật thưởng phạt', 'A1:I40'],
  quy_md: [TOOL_ID, 'Mã định danh & Quỹ cọc', 'A1:H300'],
  quy_coc: [TOOL_ID, 'Đối soát cọc', 'A1:K3000']
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

/** Chạy thử: kiểm tra đọc được các nguồn. */
function kiemTra() {
  const o = JSON.parse(getAll());
  Logger.log('Lỗi: ' + JSON.stringify(o.loi));
  for (const id in o.sheets) Logger.log(id + ': ' + o.sheets[id].length + ' dòng');
}

/* ===================== ZALO BOT =====================
 * Token của bot KHÔNG để trong code: lưu ở Project Settings → Script Properties, tên ZALO_TOKEN.
 * Các nhóm bot nhìn thấy được lưu ở Script Properties ZALO_CHATS (tự ghi khi chạy zaloTimNhom).
 */
const ZALO_API = 'https://bot-api.zaloplatforms.com/bot';

function zalo_(method, payload) {
  const tk = PropertiesService.getScriptProperties().getProperty('ZALO_TOKEN');
  if (!tk) throw new Error('Chưa có ZALO_TOKEN trong Script Properties (Project Settings).');
  const r = UrlFetchApp.fetch(ZALO_API + tk.trim() + '/' + method, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload || {}), muteHttpExceptions: true
  });
  const t = r.getContentText();
  let j;
  try { j = JSON.parse(t); } catch (e) { throw new Error('Zalo trả về (' + r.getResponseCode() + '): ' + t.slice(0, 300)); }
  if (j.ok === false) throw new Error('Zalo báo lỗi: ' + t.slice(0, 300));
  return j;
}

/** Bước 1: kiểm tra token đúng chưa (xem tên bot trong Nhật ký thực thi). */
function zaloKiemTraBot() {
  Logger.log(JSON.stringify(zalo_('getMe')));
}

/** Bước 2: sau khi đã @tên bot trong từng nhóm, chạy hàm này để lấy mã nhóm. */
function zaloTimNhom() {
  const j = zalo_('getUpdates', { timeout: 0 });
  Logger.log('Thô: ' + JSON.stringify(j).slice(0, 1500));
  let ds = j.result;
  if (!Array.isArray(ds)) ds = ds ? [ds] : [];
  const p = PropertiesService.getScriptProperties();
  const chats = JSON.parse(p.getProperty('ZALO_CHATS') || '{}');
  for (const u of ds) {
    const m = u.message || (u.result && u.result.message) || u;
    const c = m && m.chat;
    if (!c || !c.id) continue;
    const f = m.from || {};
    chats[c.id] = {
      loai: c.chat_type || c.type || '',
      ten: c.display_name || c.title || c.name || '',
      nguoi_gui: f.display_name || f.name || '',
      tin: String(m.text || '').slice(0, 80),
      luc: new Date().toISOString()
    };
  }
  p.setProperty('ZALO_CHATS', JSON.stringify(chats));
  Logger.log('Các cuộc chat bot thấy: ' + JSON.stringify(chats, null, 1));
}

function zaloGui_(chatId, text) {
  // Zalo giới hạn khoảng 2.000 ký tự mỗi tin: tự cắt thành nhiều tin theo dòng.
  const phan = [];
  let cur = '';
  for (const dong of String(text).split('\n')) {
    if ((cur + '\n' + dong).length > 1900 && cur) { phan.push(cur); cur = dong; }
    else cur = cur ? cur + '\n' + dong : dong;
  }
  if (cur) phan.push(cur);
  for (const t of phan) { zalo_('sendMessage', { chat_id: String(chatId), text: t }); Utilities.sleep(800); }
  return phan.length;
}
