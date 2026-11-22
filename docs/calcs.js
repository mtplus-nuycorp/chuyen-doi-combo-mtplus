/* ---------- Loaders: đọc Google Sheets thành dòng ---------- */
const docBangClb = ({answer}) => {
  const a = (answer && answer.values) ? answer : ((answer && answer.content) || answer || {});
  const v = a.values || [];
  const bd = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim();
  const num = (x) => { const s = String(x ?? '').trim(); if (!s) return null; const n = parseFloat(s.replace('%', '').replace(',', '.')); return isNaN(n) ? null : (s.includes('%') ? n / 100 : n); };
  const yes = (x) => String(x ?? '').trim().toUpperCase() === 'TRUE';
  const txt = (x) => String(x ?? '').replace(/\s+/g, ' ').trim();
  const rows = []; let tuan = null, gd = '';
  for (const r0 of v) {
    const r = r0.concat(Array(40).fill(''));
    const A = txt(r[0]), C = txt(r[2]), D = txt(r[3]);
    if (A && bd(A).toUpperCase().startsWith('TONG')) { tuan = null; continue; }
    const isRow = C && D && bd(C).toLowerCase() !== 'du an';
    if (A && isRow) { tuan = A.replace(/^Tuần\s*/i, 'Tuần '); gd = ''; }
    if (!tuan || !isRow) continue;
    if (txt(r[1])) gd = txt(r[1]);
    rows.push({ tuan, thu_tu: rows.length, gd, du_an: C, tp: D, pf: txt(r[4]), ngay_cd: txt(r[6]), con_ngay: num(r[7]), so_thang: num(r[8]),
      mtkd24: txt(r[9]) ? 'Có' : '', mtkd_tuan: txt(r[10]) ? 'Có' : '',
      coaching: yes(r[12]), thu_ky: yes(r[15]), marte: yes(r[16]), ptsp: yes(r[18]), gui_dl: yes(r[19]),
      bld1: yes(r[21]), bld2: yes(r[22]), bld3: yes(r[23]), khoe1: yes(r[27]), khoe2: yes(r[28]),
      tc1: yes(r[31]), tc2: yes(r[32]), tc3: yes(r[33]), tc4: yes(r[34]), pct: num(r[35]), diem: num(r[36]) });
  }
  return { rows };
};
dash.loader('clb_bang', { description: 'Tab BÁO CÁO KỶ LUẬT THÁNG 11', fn: docBangClb });
dash.loader('clb_bang_t9', { description: 'Tab BÁO CÁO KỶ LUẬT T9 (Từ 21.9)', fn: docBangClb });

dash.loader('mt30_bang', {
  description: 'Tab THỐNG KÊ 3.0',
  fn: ({answer}) => {
    const v = (answer && answer.values) || [];
    const bd = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim();
    const num = (x) => { const s = String(x ?? '').trim(); if (!s) return null; const n = parseFloat(s.replace('%', '').replace(',', '.')); return isNaN(n) ? null : (s.includes('%') ? n / 100 : n); };
    const yes = (x) => String(x ?? '').trim().toUpperCase() === 'TRUE';
    const txt = (x) => String(x ?? '').replace(/\s+/g, ' ').trim();
    const rows = []; let tuan = null, gd = '';
    for (const r0 of v) {
      const r = r0.concat(Array(40).fill(''));
      const A = txt(r[0]), C = txt(r[2]), D = txt(r[3]);
      if (A && bd(A).toUpperCase().startsWith('TONG')) { tuan = null; continue; }
      const isRow = C && D && bd(C).toLowerCase() !== 'du an';
      if (A && isRow) { tuan = A; gd = ''; }
      if (!tuan || !isRow) continue;
      if (txt(r[1])) gd = txt(r[1]);
      rows.push({ tuan, thu_tu: rows.length, gd, du_an: C, tp: D, pct: num(r[4]), livestream: txt(r[5]), thoi_gian: txt(r[8]), thu_ky: txt(r[9]),
        ptsp: txt(r[10]), gui_bc: txt(r[11]), file_tk: txt(r[12]),
        bld1: yes(r[16]), bld2: yes(r[17]), bld3: yes(r[18]),
        khoe1: yes(r[21]), khoe2: yes(r[22]), khoe3: yes(r[23]),
        tc1: yes(r[26]), tc2: yes(r[27]), tc3: yes(r[28]), tc4: yes(r[29]),
        mtkd_tuan: txt(r[30]) ? 'Có' : '', chien_luoc: yes(r[32]), mtkd_chot: yes(r[34]), nghiem_thu: yes(r[36]) });
    }
    return { rows };
  }
});

dash.loader('mt30_tong', {
  description: 'Dòng tổng chuyển đổi năm 2026 trong tab QUẢN LÝ MT30',
  fn: ({answer}) => {
    const r = ((answer && answer.values) || [])[0] || [];
    const n = (x) => { const k = parseFloat(String(x ?? '').replace(',', '.')); return isNaN(k) ? 0 : k; };
    return [{ ky: n(r[0]), dt30_lan2: n(r[1]), dt30_lan3: n(r[2]), combo: n(r[3]) }];
  }
});

dash.loader('clb_muctieu', {
  description: 'Khối MỤC TIÊU THÁNG',
  fn: ({answer}) => {
    const v = (answer && answer.values) || [];
    const bd = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').trim().toLowerCase();
    const n = (x) => { const s = String(x ?? '').trim(); if (!s) return null; const k = parseFloat(s.replace(/\./g, '').replace(',', '.')); return isNaN(k) ? null : k; };
    const out = { so_thang: null, doanh_so: null };
    for (const r of v) for (let j = 0; j < r.length; j++) {
      const t = bd(r[j]);
      if (t === 'so thang cd combo' && !out.so_thang) out.so_thang = { hang_muc: 'Số tháng chuyển đổi combo', muc_tieu: n(r[j + 1]), ket_qua: n(r[j + 2]) };
      if (t === 'doanh so chuyen doi combo' && !out.doanh_so) out.doanh_so = { hang_muc: 'Doanh số chuyển đổi combo', muc_tieu: n(r[j + 1]), ket_qua: n(r[j + 2]) };
    }
    return [out.so_thang || { hang_muc: 'Số tháng chuyển đổi combo', muc_tieu: null, ket_qua: null }, out.doanh_so || { hang_muc: 'Doanh số chuyển đổi combo', muc_tieu: null, ket_qua: null }];
  }
});

dash.loader('danhba', {
  description: 'Danh bạ TP/TN',
  fn: ({answer}) => ((answer && answer.values) || []).slice(1).filter((r) => String(r[0] ?? '').trim()).map((r) => ({ ten: String(r[0]).trim(), vai_tro: String(r[1] ?? '').trim(), gd: String(r[2] ?? '').trim() }))
});

dash.loader('mt30_lichsu', {
  description: 'Lịch sử MT30',
  fn: ({answer}) => {
    const p = (x) => { const s = String(x ?? '').trim(); if (!s) return null; const n = parseFloat(s.replace('%', '').replace(',', '.')); return isNaN(n) ? null : (s.includes('%') ? n / 100 : n); };
    return ((answer && answer.values) || []).slice(1).filter((r) => String(r[3] ?? '').trim()).map((r) => ({ nguon: String(r[0] ?? '').trim(), tuan: String(r[1] ?? '').replace(/\s+/g, ' ').trim(), gd: String(r[2] ?? '').trim(), du_an: String(r[3]).trim(), tp: String(r[4] ?? '').trim(), pct: p(r[5]), bc_bld: p(r[6]), khoe: p(r[7]), tttc: p(r[8]) }));
  }
});

dash.loader('clb_lichsu', {
  description: 'Lịch sử CLB 100 tỷ',
  fn: ({answer}) => {
    const p = (x) => { const s = String(x ?? '').trim(); if (!s) return null; const n = parseFloat(s.replace('%', '').replace(',', '.')); return isNaN(n) ? null : (s.includes('%') ? n / 100 : n); };
    return ((answer && answer.values) || []).slice(1).filter((r) => String(r[3] ?? '').trim()).map((r) => ({ nguon: String(r[0] ?? '').trim(), tuan: String(r[1] ?? '').replace(/\s+/g, ' ').trim(), gd: String(r[2] ?? '').trim(), du_an: String(r[3]).trim(), tp: String(r[4] ?? '').trim(), pct: p(r[5]), diem: p(r[6]) }));
  }
});

dash.loader('zalo_log', {
  description: 'Báo cáo Zalo',
  fn: ({answer}) => {
    const iso = (s) => { const m = String(s ?? '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); const k = String(s ?? '').match(/^\d{4}-\d{2}-\d{2}/); return k ? k[0] : null; };
    return ((answer && answer.values) || []).slice(1).filter((r) => String(r[4] ?? '').trim()).map((r) => ({ ngay: iso(r[0]), gio: String(r[1] ?? '').trim(), tuan_bd: iso(r[2]), nhom: String(r[3] ?? '').trim(), tp: String(r[4]).trim(), hang_muc: String(r[5] ?? '').trim(), noi_dung: String(r[6] ?? '').trim() }));
  }
});

/* ---------- Gộp Sheet + web ---------- */
dash.calc('clb_bang_all', {
  inputs: ['clb_bang_t9', 'clb_bang', 'clb_web'],
  fn: (t9, t11, web) => {
    const M = window.MT, m = new Map();
    for (const r of t9.concat(t11.map((x) => ({ ...x, thu_tu: 1000 + x.thu_tu })))) {
      const key = M.tuanKey(r.tuan); if (!key) continue;
      const id = M.docId(key, r.du_an, r.tp);
      m.set(id, { ...r, id, key, thang: key.slice(0, 7), tuan: M.tenTuan(key), nguon: 'Sheet' });
    }
    for (const w of web) {
      if (!w.key) continue;
      if (w.xoa) { m.delete(w.id); continue; }
      m.set(w.id, { ...w, thang: w.key.slice(0, 7), tuan: M.tenTuan(w.key), pct: M.pctClb(w), nguon: 'Web' });
    }
    return Array.from(m.values()).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : (a.thu_tu ?? 0) - (b.thu_tu ?? 0)));
  }
});

dash.calc('mt30_bang_all', {
  inputs: ['mt30_bang', 'mt30_web'],
  fn: (bang, web) => {
    const M = window.MT, m = new Map();
    for (const r of bang) {
      const key = M.tuanKey(r.tuan); if (!key) continue;
      const id = M.docId(key, r.du_an, r.tp);
      m.set(id, { ...r, id, key, thang: key.slice(0, 7), tuan: M.tenTuan(key), nguon: 'Sheet' });
    }
    for (const w of web) {
      if (!w.key) continue;
      if (w.xoa) { m.delete(w.id); continue; }
      m.set(w.id, { ...w, thang: w.key.slice(0, 7), tuan: M.tenTuan(w.key), pct: M.pctMt30(w), nguon: 'Web' });
    }
    return Array.from(m.values()).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : (a.thu_tu ?? 0) - (b.thu_tu ?? 0)));
  }
});

dash.calc('clb_bang_tong', {
  inputs: ['clb_bang_all'],
  fn: (bang) => {
    const M = window.MT, g = d3.group(bang, (r) => r.key);
    const ty = (rs, ks) => rs.length ? rs.reduce((s, r) => s + M.dem(r, ks), 0) / (rs.length * ks.length) : null;
    const tb = (rs, k) => { const xs = rs.map((r) => r[k]).filter((x) => x !== null && x !== undefined); return xs.length ? d3.mean(xs) : null; };
    return Array.from(g, ([key, rs]) => ({ key, thang: key.slice(0, 7), tuan: M.tenTuan(key), so_du_an: rs.length, mtkd: rs.filter((r) => r.mtkd_tuan === 'Có').length, mtkd24: rs.filter((r) => r.mtkd24 === 'Có').length,
      coaching: ty(rs, ['coaching']), thu_ky: ty(rs, ['thu_ky', 'marte']), ptsp: ty(rs, ['ptsp', 'gui_dl']), bld: ty(rs, ['bld1', 'bld2', 'bld3']), khoe: ty(rs, ['khoe1', 'khoe2']), tttc: ty(rs, ['tc1', 'tc2', 'tc3', 'tc4']),
      pct: tb(rs, 'pct'), diem: tb(rs, 'diem'), bao_dong: rs.filter((r) => (r.pct ?? 0) < 0.5).length })).sort((a, b) => (a.key < b.key ? -1 : 1));
  }
});

dash.calc('mt30_bang_tong', {
  inputs: ['mt30_bang_all'],
  fn: (bang) => {
    const M = window.MT, g = d3.group(bang, (r) => r.key);
    const ty = (rs, ks) => rs.length ? rs.reduce((s, r) => s + M.dem(r, ks), 0) / (rs.length * ks.length) : null;
    return Array.from(g, ([key, rs]) => ({ key, thang: key.slice(0, 7), tuan: M.tenTuan(key), so_du_an: rs.length, pct: d3.mean(rs, (r) => r.pct ?? 0),
      bld: ty(rs, ['bld1', 'bld2', 'bld3']), khoe: ty(rs, ['khoe1', 'khoe2', 'khoe3']), tttc: ty(rs, ['tc1', 'tc2', 'tc3', 'tc4']), mtkd_tuan: ty(rs, ['mtkd_tuan']),
      chien_luoc: ty(rs, ['chien_luoc']), mtkd_chot: ty(rs, ['mtkd_chot']), nghiem_thu: ty(rs, ['nghiem_thu']), bao_dong: rs.filter((r) => (r.pct ?? 0) < 0.5).length })).sort((a, b) => (a.key < b.key ? -1 : 1));
  }
});

/* ---------- Tuần đang chọn: phân tích từng dự án ---------- */
dash.calc('mt30_rows', {
  inputs: ['mt30_bang_all', 'danhba'],
  fn: (bang, danhba) => {
    const M = window.MT, p = dash.params(), key = M.chonTuan('mt30', bang, p);
    const db = new Map(danhba.map((d) => [d.ten, d])), today = M.homNay();
    return bang.filter((r) => r.key === key).map((r) => {
      const d = db.get(r.tp) || {}, ngay = M.ngayIso(r.thoi_gian, key), con = ngay ? M.soNgay(today, ngay) : null;
      const bld = M.dem(r, ['bld1', 'bld2', 'bld3']), khoe = M.dem(r, ['khoe1', 'khoe2', 'khoe3']), tttc = M.dem(r, ['tc1', 'tc2', 'tc3', 'tc4']), pct = r.pct ?? 0;
      const thieu = [];
      if (!r.livestream || /không|k coaching/i.test(r.livestream)) thieu.push('coaching');
      if (bld < 3) thieu.push('BC BLĐ ' + bld + '/3');
      if (khoe < 3) thieu.push('khoe ' + khoe + '/3');
      if (tttc < 2) thieu.push('TTTC ' + tttc + '/4');
      if (r.mtkd_tuan !== 'Có') thieu.push('MTKD tuần');
      return { du_an: r.du_an, gd: d.gd || r.gd, tp: r.tp, vai_tro: d.vai_tro || 'TP', pct, ngay_moc: ngay, con_ngay: con,
        bao_dong: con === null || con < 0 ? 'Cần cập nhật ngày' : (con <= 14 ? 'Đến hạn' : ''),
        muc: pct >= 0.8 ? 'Đạt' : (pct >= 0.5 ? 'Cần nhắc' : 'Báo động'), thieu: thieu.join(', '), tuan: r.tuan };
    }).sort((a, b) => a.pct - b.pct);
  }
});

dash.calc('mt30_kpi', {
  inputs: ['mt30_rows', 'mt30_tong'],
  fn: (rows, tong) => {
    const n = rows.length, tg = tong[0] || {};
    return [{ so_du_an: n, ty_le_tb: n ? rows.reduce((s, r) => s + r.pct, 0) / n : 0,
      dat: rows.filter((r) => r.muc === 'Đạt').length, can_nhac: rows.filter((r) => r.muc === 'Cần nhắc').length, bao_dong: rows.filter((r) => r.muc === 'Báo động').length,
      den_han: rows.filter((r) => r.bao_dong === 'Đến hạn').length, can_cap_nhat: rows.filter((r) => r.bao_dong === 'Cần cập nhật ngày').length,
      ky: tg.ky || 0, combo: tg.combo || 0, ty_le_combo: tg.ky ? tg.combo / tg.ky : 0, tuan: n ? rows[0].tuan : '' }];
  }
});

dash.calc('mt30_gd', {
  inputs: ['mt30_rows'],
  fn: (rows) => Array.from(d3.group(rows, (r) => r.gd), ([gd, rs]) => ({ gd, so_du_an: rs.length, ty_le_tb: d3.mean(rs, (r) => r.pct), bao_dong: rs.filter((r) => r.muc === 'Báo động').length, den_han: rs.filter((r) => r.bao_dong === 'Đến hạn').length })).sort((a, b) => a.ty_le_tb - b.ty_le_tb)
});

dash.calc('mt30_thieu', {
  inputs: ['mt30_rows'],
  fn: (rows) => [['Coaching CDN', 'coaching'], ['Báo cáo BLĐ', 'BC BLĐ'], ['Khoe CDN', 'khoe'], ['Thu thông tin tài chính', 'TTTC'], ['MTKD tuần', 'MTKD tuần']].map(([hang_muc, key]) => ({ hang_muc, so_du_an: rows.filter((r) => r.thieu.includes(key)).length, tong: rows.length }))
});

dash.calc('clb_rows', {
  inputs: ['clb_bang_all', 'danhba'],
  fn: (bang, danhba) => {
    const M = window.MT, p = dash.params(), key = M.chonTuan('clb', bang, p);
    const db = new Map(danhba.map((d) => [d.ten, d])), today = M.homNay();
    return bang.filter((r) => r.key === key).map((r) => {
      const d = db.get(r.tp) || {}, ngay = M.ngayIso(r.ngay_cd, key), con = ngay ? M.soNgay(today, ngay) : null;
      const bld = M.dem(r, ['bld1', 'bld2', 'bld3']), khoe = M.dem(r, ['khoe1', 'khoe2']), tttc = M.dem(r, ['tc1', 'tc2', 'tc3', 'tc4']), pct = r.pct ?? 0;
      const thieu = [];
      if (!r.coaching) thieu.push('coaching');
      if (!r.thu_ky) thieu.push('file thư ký');
      if (!r.ptsp) thieu.push('PTSP');
      if (bld < 3) thieu.push('BC BLĐ ' + bld + '/3');
      if (khoe < 2) thieu.push('khoe ' + khoe + '/2');
      if (tttc < 2) thieu.push('TTTC ' + tttc + '/4');
      if (r.mtkd_tuan !== 'Có') thieu.push('MTKD tuần');
      return { du_an: r.du_an, gd: d.gd || r.gd, tp: r.tp, vai_tro: d.vai_tro || 'TP', pct, diem: r.diem, ngay_cd: ngay, con_ngay: con,
        bao_dong: con === null || con < 0 ? 'Cần cập nhật ngày' : (con <= 14 ? 'Đến hạn' : ''),
        muc: pct >= 0.8 ? 'Đạt' : (pct >= 0.5 ? 'Cần nhắc' : 'Báo động'), thieu: thieu.join(', '), tuan: r.tuan };
    }).sort((a, b) => a.pct - b.pct);
  }
});

dash.calc('clb_kpi', {
  inputs: ['clb_rows', 'clb_muctieu'],
  fn: (rows, muctieu) => {
    const n = rows.length, st = muctieu[0] || {};
    const t = new Date(); const conNgayThang = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate() - t.getDate();
    const thieu = st.muc_tieu ? Math.max(0, st.muc_tieu - (st.ket_qua || 0)) : null;
    return [{ so_du_an: n, ty_le_tb: n ? rows.reduce((s, r) => s + r.pct, 0) / n : 0,
      dat: rows.filter((r) => r.muc === 'Đạt').length, can_nhac: rows.filter((r) => r.muc === 'Cần nhắc').length, bao_dong: rows.filter((r) => r.muc === 'Báo động').length,
      den_han: rows.filter((r) => r.bao_dong === 'Đến hạn').length, can_cap_nhat: rows.filter((r) => r.bao_dong === 'Cần cập nhật ngày').length,
      muc_tieu_thang: st.muc_tieu, ket_qua_thang: st.ket_qua, ty_le_thang: st.muc_tieu ? (st.ket_qua || 0) / st.muc_tieu : null,
      con_thieu: thieu, con_ngay_thang: conNgayThang, tuan: n ? rows[0].tuan : '' }];
  }
});

dash.calc('clb_gd', {
  inputs: ['clb_rows'],
  fn: (rows) => Array.from(d3.group(rows, (r) => r.gd), ([gd, rs]) => ({ gd, so_du_an: rs.length, ty_le_tb: d3.mean(rs, (r) => r.pct), diem_tb: d3.mean(rs, (r) => r.diem), bao_dong: rs.filter((r) => r.muc === 'Báo động').length })).sort((a, b) => a.ty_le_tb - b.ty_le_tb)
});

dash.calc('clb_thieu', {
  inputs: ['clb_rows'],
  fn: (rows) => [['Coaching CDN', 'coaching'], ['File thư ký', 'file thư ký'], ['Phát triển sản phẩm', 'PTSP'], ['Báo cáo BLĐ', 'BC BLĐ'], ['Khoe CDN', 'khoe'], ['Thu thông tin tài chính', 'TTTC'], ['MTKD tuần', 'MTKD tuần']].map(([hang_muc, key]) => ({ hang_muc, so_du_an: rows.filter((r) => r.thieu.includes(key)).length, tong: rows.length }))
});

/* ---------- Bảng đo lường tổng: tuần và tháng ---------- */
for (const prog of ['mt30', 'clb']) {
  dash.calc(prog + '_tong_tuan', {
    inputs: [prog + '_bang_all', 'tong_tuan'],
    fn: (bang, tong) => {
      const M = window.MT, p = dash.params(), key = M.chonTuan(prog, bang, p);
      if (!key) return [];
      const [doc, truoc] = M.docTong(tong, prog, key);
      return M.tinhTuan(prog, bang.filter((r) => r.key === key), key, doc, truoc).map((x) => ({ ...x, key, tuan: M.tenTuan(key) }));
    }
  });
  dash.calc(prog + '_tuan_info', {
    inputs: [prog + '_bang_all', 'tong_tuan'],
    fn: (bang, tong) => {
      const M = window.MT, p = dash.params(), key = M.chonTuan(prog, bang, p);
      if (!key) return [];
      const rs = bang.filter((r) => r.key === key);
      const duoi = rs.filter((r) => (r.pct ?? 0) < 0.5).sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));
      const [doc] = M.docTong(tong, prog, key);
      return [{ key, tuan: M.tenTuan(key), thang: key.slice(0, 7), so_du_an: rs.length, so_duoi_50: duoi.length,
        tp_duoi_50: duoi.map((r) => r.tp + ' ' + Math.round((r.pct ?? 0) * 100) + '%').join(', '), nhan_xet: doc && doc.nhan_xet ? doc.nhan_xet : '',
        la_tuan_moi_nhat: key === M.cacTuan(bang).pop() }];
    }
  });
  dash.calc(prog + '_tong_thang', {
    inputs: [prog + '_bang_all', 'tong_tuan'],
    fn: (bang, tong) => {
      const M = window.MT, p = dash.params(), th = M.chonThang(prog, bang, p);
      if (!th) return [];
      const keys = M.cacTuan(bang).filter((k) => k.slice(0, 7) === th);
      const out = [];
      for (const key of keys) {
        const [doc, truoc] = M.docTong(tong, prog, key);
        for (const x of M.tinhTuan(prog, bang.filter((r) => r.key === key), key, doc, truoc)) out.push({ thang: th, key, tuan: M.tenTuan(key), k: x.k, hang_muc: x.hang_muc, kieu: x.kieu, ket_qua: x.ket_qua, muc_tieu: x.muc_tieu, dat: x.dat });
      }
      for (const it of M.HM[prog]) {
        const xs = out.filter((o) => o.k === it.k);
        const gop = (a) => (!a.length ? null : (it.kieu === 'pct' ? d3.mean(a) : d3.sum(a)));
        const kq = gop(xs.map((o) => o.ket_qua).filter((v) => v !== null)), mt = gop(xs.map((o) => o.muc_tieu).filter((v) => v !== null));
        out.push({ thang: th, key: 'ca_thang', tuan: 'Cả tháng', k: it.k, hang_muc: it.ten, kieu: it.kieu, ket_qua: kq, muc_tieu: mt, dat: kq !== null && mt ? kq / mt : null });
      }
      return out;
    }
  });
  dash.calc(prog + '_thang_kpi', {
    inputs: [prog + '_bang_tong'],
    fn: (tuan) => {
      const M = window.MT, p = dash.params(), th = M.chonThang(prog, tuan, p);
      if (!th) return [];
      const ws = tuan.filter((w) => w.thang === th);
      const tot = ws.slice().sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
      return [{ thang: th, ten: M.tenThang(th), so_tuan: ws.length, du_an_tb: d3.mean(ws, (w) => w.so_du_an) ?? 0, ky_luat_tb: d3.mean(ws, (w) => w.pct) ?? null,
        bao_dong: d3.sum(ws, (w) => w.bao_dong), tuan_tot: tot.length ? tot[0].tuan : '', tuan_kem: tot.length ? tot[tot.length - 1].tuan : '' }];
    }
  });
}

/* ---------- Lịch sử, Zalo ---------- */
dash.calc('mt30_tuan', {
  inputs: ['mt30_lichsu'],
  fn: (lichsu) => {
    const order = [], m = new Map();
    for (const r of lichsu) { if (!m.has(r.tuan)) { m.set(r.tuan, []); order.push(r.tuan); } m.get(r.tuan).push(r); }
    return order.map((tuan, i) => { const rs = m.get(tuan), ps = rs.map((r) => r.pct).filter((x) => x !== null); return { stt: i + 1, tuan, so_du_an: rs.length, ty_le_tb: ps.length ? ps.reduce((s, x) => s + x, 0) / ps.length : null, bao_dong: ps.filter((x) => x < 0.5).length }; });
  }
});

dash.calc('clb_tuan', {
  inputs: ['clb_lichsu'],
  fn: (lichsu) => {
    const order = [], m = new Map();
    for (const r of lichsu) { if (!m.has(r.tuan)) { m.set(r.tuan, []); order.push(r.tuan); } m.get(r.tuan).push(r); }
    return order.map((tuan, i) => { const rs = m.get(tuan), ps = rs.map((r) => r.pct).filter((x) => x !== null), ds = rs.map((r) => r.diem).filter((x) => x !== null); return { stt: i + 1, tuan, so_du_an: rs.length, ty_le_tb: ps.length ? ps.reduce((s, x) => s + x, 0) / ps.length : null, diem_tb: ds.length ? ds.reduce((s, x) => s + x, 0) / ds.length : null, bao_dong: ps.filter((x) => x < 0.5).length }; });
  }
});

const demZalo = (ds, them) => {
  const tuan = ds.map((r) => r.tuan_bd).filter(Boolean).sort().pop();
  const m = new Map();
  for (const r of ds.filter((x) => x.tuan_bd === tuan)) {
    const o = m.get(r.tp) || Object.assign({ tp: r.tp, khoe: 0, bld: 0, tttc: 0, mtkd: 0, coaching: 0, khac: 0, tong: 0, lan_cuoi: '', tuan }, them ? { livestream: 0, ptsp: 0 } : {});
    const h = r.hang_muc.toUpperCase();
    if (h.includes('KHOE')) o.khoe++; else if (h.includes('BLĐ') || h.includes('BLD')) o.bld++; else if (h.includes('TTTC') || h.includes('TTTT')) o.tttc++; else if (h.includes('MTKD')) o.mtkd++;
    else if (them && h.includes('LIVE')) o.livestream++; else if (them && h.includes('PTSP')) o.ptsp++; else if (h.includes('COACH')) o.coaching++; else o.khac++;
    o.tong++;
    const t = (r.ngay || '') + ' ' + r.gio; if (t > o.lan_cuoi) o.lan_cuoi = t;
    m.set(r.tp, o);
  }
  return Array.from(m.values()).sort((a, b) => b.tong - a.tong);
};
dash.calc('zalo_tuan', { inputs: ['zalo_log'], fn: (log) => demZalo(log.filter((r) => !/MT30/i.test(r.nhom)), false) });
dash.calc('zalo_tuan_mt30', { inputs: ['zalo_log'], fn: (log) => demZalo(log.filter((r) => /MT30/i.test(r.nhom)), true) });
