/* Thư viện dùng chung: tuần, tháng, hạng mục đo lường, lưu dữ liệu */
window.MT = (() => {
  const bd = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim();
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const ngayTu = (key) => { const [y, m, d] = String(key).split('-').map(Number); return new Date(y, m - 1, d); };
  const namCua = (mo) => { const now = new Date(); let y = now.getFullYear(); if (mo > now.getMonth() + 1 + 3) y -= 1; return y; };
  const thuHai = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };
  const thuHaiDau = (y, mo) => { const f = new Date(y, mo - 1, 1); f.setDate(1 + (8 - f.getDay()) % 7); return f; };
  const tuanKey = (label) => {
    const s = String(label ?? '').replace(/\s+/g, ' ');
    let m = s.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
    if (m) { const d = +m[1], mo = +m[2]; if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return iso(thuHai(new Date(namCua(mo), mo - 1, d))); }
    m = bd(s).toLowerCase().match(/tuan\s*(\d)\s*thang\s*(\d{1,2})/);
    if (m) { const mo = +m[2]; const f = thuHaiDau(namCua(mo), mo); f.setDate(f.getDate() + (+m[1] - 1) * 7); return iso(f); }
    return null;
  };
  const tenTuan = (key) => {
    const d = ngayTu(key), e = new Date(d); e.setDate(e.getDate() + 6);
    const f = thuHaiDau(d.getFullYear(), d.getMonth() + 1);
    const n = Math.round((d - f) / 6048e5) + 1;
    return 'Tuần ' + n + '/T' + (d.getMonth() + 1) + ' (' + d.getDate() + '/' + (d.getMonth() + 1) + '–' + e.getDate() + '/' + (e.getMonth() + 1) + ')';
  };
  const tenThang = (t) => t ? 'Tháng ' + (+t.slice(5, 7)) + '/' + t.slice(0, 4) : '—';
  const congTuan = (key, n) => { const d = ngayTu(key); d.setDate(d.getDate() + 7 * n); return iso(d); };
  const bam = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
  const docId = (key, du_an, tp) => key + '~' + bam(bd(du_an).toLowerCase().replace(/\s+/g, ' ') + '|' + bd(tp).toLowerCase().replace(/\s+/g, ' '));
  const ngayIso = (x, key) => {
    const re = /(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{4}))?/g; let m, last = null;
    while ((m = re.exec(String(x ?? ''))) !== null) last = m;
    if (!last) return null;
    const d = +last[1], mo = +last[2]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    let y;
    if (last[3]) y = +last[3];
    else { const ref = key ? ngayTu(key) : new Date(); y = ref.getFullYear(); const diff = mo - (ref.getMonth() + 1); if (diff < -6) y += 1; if (diff > 6) y -= 1; }
    return y + '-' + pad(mo) + '-' + pad(d);
  };
  const soNgay = (a, b) => Math.round((ngayTu(b) - ngayTu(a)) / 864e5);
  const homNay = () => iso(new Date());
  const num = (x) => { if (x === null || x === undefined || x === '') return null; const n = parseFloat(String(x).trim().replace('%', '').replace(',', '.')); return isNaN(n) ? null : n; };

  const CLB_TICK = ['coaching', 'thu_ky', 'marte', 'ptsp', 'gui_dl', 'bld1', 'bld2', 'bld3', 'khoe1', 'khoe2', 'tc1', 'tc2', 'tc3', 'tc4'];
  const MT30_TICK = ['bld1', 'bld2', 'bld3', 'khoe1', 'khoe2', 'khoe3', 'tc1', 'tc2', 'tc3', 'tc4', 'chien_luoc', 'mtkd_chot', 'nghiem_thu'];
  const TRUONG = {
    clb: ['key', 'thu_tu', 'gd', 'du_an', 'tp', 'pf', 'ngay_cd', 'so_thang', 'mtkd24', 'mtkd_tuan', 'diem', 'xoa'].concat(CLB_TICK),
    mt30: ['key', 'thu_tu', 'gd', 'du_an', 'tp', 'livestream', 'thoi_gian', 'thu_ky', 'ptsp', 'gui_bc', 'file_tk', 'mtkd_tuan', 'xoa'].concat(MT30_TICK)
  };
  const dem = (r, ks) => ks.filter((k) => r[k] === true || r[k] === 'Có').length;
  const pctClb = (r) => (dem(r, CLB_TICK) + (r.mtkd_tuan === 'Có' ? 1 : 0)) / (CLB_TICK.length + 1);
  const pctMt30 = (r) => (dem(r, MT30_TICK) + (r.mtkd_tuan === 'Có' ? 1 : 0)) / (MT30_TICK.length + 1);
  const ten = (r) => r.tp + ' (' + r.du_an + ')';

  const tyLe = (ks, can) => (rs) => {
    const n = rs.length; if (!n) return { kq: null, thieu: [] };
    const s = rs.reduce((a, r) => a + dem(r, ks), 0);
    return { kq: s / (n * ks.length), thieu: rs.filter((r) => dem(r, ks) < (can ?? ks.length)).map(ten) };
  };
  const coBao = (k) => (rs) => ({ kq: rs.filter((r) => dem(r, [k])).length, thieu: rs.filter((r) => !dem(r, [k])).map(ten), mac_dinh: rs.length || null });
  const HM = {
    clb: [
      { k: 'doanh_so', ten: 'Doanh số chuyển đổi combo', kieu: 'so' },
      { k: 'so_thang', ten: 'Số tháng CĐ combo', kieu: 'so' },
      { k: 'bld', ten: 'Báo cáo BLĐ', kieu: 'pct', tinh: tyLe(['bld1', 'bld2', 'bld3']) },
      { k: 'khoe', ten: 'Khoe CDN chất lượng', kieu: 'pct', tinh: tyLe(['khoe1', 'khoe2']) },
      { k: 'mtkd', ten: 'MTKD tuần (BTCV ss)', kieu: 'so', tinh: coBao('mtkd_tuan') },
      { k: 'tttc', ten: 'Thu thông tin tài chính', kieu: 'pct', tinh: tyLe(['tc1', 'tc2', 'tc3', 'tc4'], 1) },
      { k: 'thu_ky', ten: 'File thư ký', kieu: 'pct', tinh: tyLe(['thu_ky']) },
      { k: 'coaching', ten: 'Coaching CDN', kieu: 'pct', tinh: tyLe(['coaching']) },
      { k: 'ptsp', ten: 'PTSP chapter', kieu: 'pct', tinh: tyLe(['ptsp']) },
      { k: 'mtkd24', ten: 'MTKD 12/24 (dự án còn ≤ 20 ngày CĐ)', kieu: 'so', tinh: (rs, key) => {
        const ds = rs.filter((r) => { const d = ngayIso(r.ngay_cd, key); if (!d) return false; const c = soNgay(key, d); return c <= 20 && c >= -7; });
        return { kq: ds.filter((r) => r.mtkd24 === 'Có').length, thieu: ds.filter((r) => r.mtkd24 !== 'Có').map(ten), mac_dinh: ds.length || null };
      } },
      { k: 'phoi_hop', ten: 'Tỷ lệ MT phối hợp MKT pro & MT chạy số', kieu: 'pct' }
    ],
    mt30: [
      { k: 'combo', ten: 'Chuyển đổi lên combo', kieu: 'so' },
      { k: 'bld', ten: 'Báo cáo BLĐ', kieu: 'pct', tinh: tyLe(['bld1', 'bld2', 'bld3']) },
      { k: 'khoe', ten: 'Khoe CDN', kieu: 'pct', tinh: tyLe(['khoe1', 'khoe2', 'khoe3']) },
      { k: 'tttc', ten: 'Thu thông tin tài chính', kieu: 'pct', tinh: tyLe(['tc1', 'tc2', 'tc3', 'tc4'], 1) },
      { k: 'mtkd', ten: 'MTKD tuần', kieu: 'so', tinh: coBao('mtkd_tuan') },
      { k: 'livestream', ten: 'Livestream coaching', kieu: 'so', tinh: (rs) => { const co = (r) => !!r.livestream && !/^(không|k|0|-)$/i.test(String(r.livestream).trim()); return { kq: rs.filter(co).length, thieu: rs.filter((r) => !co(r)).map(ten), mac_dinh: rs.length || null }; } },
      { k: 'chien_luoc', ten: 'File chiến lược được duyệt', kieu: 'so', tinh: coBao('chien_luoc') },
      { k: 'mtkd_chot', ten: 'MTKD chốt được duyệt', kieu: 'so', tinh: coBao('mtkd_chot') },
      { k: 'nghiem_thu', ten: 'File nghiệm thu được duyệt', kieu: 'so', tinh: coBao('nghiem_thu') }
    ]
  };

  const docTong = (tong, prog, key) => {
    const id = prog + '~' + key;
    const doc = tong.find((d) => d.id === id) || null;
    const truoc = tong.filter((d) => String(d.id).startsWith(prog + '~') && d.id < id && d.muc_tieu && Object.values(d.muc_tieu).some((v) => v !== '' && v !== null))
      .sort((a, b) => (a.id < b.id ? -1 : 1)).pop() || null;
    return [doc, truoc];
  };
  const tinhTuan = (prog, rs, key, doc, truoc) => HM[prog].map((it) => {
    const c = it.tinh ? it.tinh(rs, key) : { kq: num(doc && doc.ket_qua ? doc.ket_qua[it.k] : null), thieu: [] };
    let kq = c.kq;
    if (!it.tinh && it.kieu === 'pct' && kq !== null && kq > 1) kq = kq / 100;
    const nhap = doc && doc.muc_tieu ? doc.muc_tieu[it.k] : null;
    let mt = num(nhap), nguon = 'tuần này';
    if (mt === null) { mt = num(truoc && truoc.muc_tieu ? truoc.muc_tieu[it.k] : null); nguon = 'tuần trước'; }
    if (mt === null && c.mac_dinh) { mt = c.mac_dinh; nguon = 'số dự án'; }
    if (mt !== null && it.kieu === 'pct' && mt > 1) mt = mt / 100;
    if (mt === null) nguon = '';
    return { k: it.k, hang_muc: it.ten, kieu: it.kieu, tu_dong: !!it.tinh, muc_tieu: mt, nguon_muc_tieu: nguon,
      muc_tieu_nhap: nhap ?? '', ket_qua: kq, ket_qua_nhap: doc && doc.ket_qua ? (doc.ket_qua[it.k] ?? '') : '',
      dat: kq !== null && mt ? kq / mt : null, so_thieu: c.thieu.length, thieu: c.thieu.join(', '),
      ghi_chu: doc && doc.ghi_chu ? (doc.ghi_chu[it.k] || '') : '' };
  });

  const cacTuan = (rows) => Array.from(new Set(rows.map((r) => r.key).filter(Boolean))).sort();
  const chonThang = (prog, rows, p) => {
    const keys = cacTuan(rows); if (!keys.length) return null;
    const t = p[prog + '_thang']; const ms = new Set(keys.map((k) => k.slice(0, 7)));
    return t && ms.has(t) ? t : keys[keys.length - 1].slice(0, 7);
  };
  const chonTuan = (prog, rows, p) => {
    const keys = cacTuan(rows); if (!keys.length) return null;
    const th = chonThang(prog, rows, p);
    const cand = keys.filter((k) => k.slice(0, 7) === th);
    const t = p[prog + '_tuan'];
    return t && cand.includes(t) ? t : (cand[cand.length - 1] || keys[keys.length - 1]);
  };

  /* Lưu */
  const baoLuu = (ok) => { for (const p of document.querySelectorAll('.mt-loi:not(.chi-xem)')) p.hidden = ok; };
  const luu = async (path, data) => {
    let ok = true;
    try { const db = await claude.use('db'); if (!db) throw new Error('Không có db'); await db.doc(path).set(data); }
    catch (e) { ok = false; console.error(e); }
    baoLuu(ok);
    return ok;
  };
  const luuDong = (prog, r, doi) => {
    const data = {};
    for (const f of TRUONG[prog]) if (r[f] !== undefined && r[f] !== null) data[f] = r[f];
    Object.assign(data, doi);
    return luu('data/' + prog + '_web/' + r.id, data);
  };
  const luuTong = (prog, key, nhom, k, giaTri) => {
    const g = dash.data('tong_tuan');
    const cu = (g.status === 'ok' ? g.data : []).find((d) => d.id === prog + '~' + key) || {};
    const data = { prog, key, muc_tieu: Object.assign({}, cu.muc_tieu), ket_qua: Object.assign({}, cu.ket_qua), ghi_chu: Object.assign({}, cu.ghi_chu), nhan_xet: cu.nhan_xet || '' };
    if (nhom === 'nhan_xet') data.nhan_xet = giaTri; else data[nhom][k] = giaTri;
    return luu('data/tong_tuan/' + prog + '~' + key, data);
  };

  return { bd, iso, ngayTu, tuanKey, tenTuan, tenThang, congTuan, docId, ngayIso, soNgay, homNay, num, dem, pctClb, pctMt30,
    CLB_TICK, MT30_TICK, TRUONG, HM, docTong, tinhTuan, cacTuan, chonThang, chonTuan, luu, luuDong, luuTong };
})();
