/* ---------- Quỹ cọc & thưởng phạt ----------
   Nguồn: tab "Luật thưởng phạt", "Mã định danh & Quỹ cọc", "Đối soát cọc" trong file Tool.
   Mỗi ô tick là 1 lần: có tick → cộng thưởng, thiếu tick → trừ phạt (tối đa = mức × số ô). */
{
  const M = window.MT;
  const bd = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const khoa = (s) => bd(s).replace(/[^a-z0-9]/gi, '').toLowerCase();
  const soTien = (x) => { const s = String(x ?? '').replace(/[^\d-]/g, ''); return s ? +s : 0; };
  const iso = (s) => { const t = String(s ?? '').trim(); const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0]; const k = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return k ? k[3] + '-' + k[2].padStart(2, '0') + '-' + k[1].padStart(2, '0') : null; };
  const chuongTrinh = (s) => /mt\s*30/i.test(s) ? 'mt30' : 'clb';

  dash.loader('quy_luat', {
    description: 'Luật thưởng phạt',
    fn: ({answer}) => {
      const v = ((answer && answer.values) || []).slice(1);
      const luat = {}; let bat_dau = '2026-11-23';
      for (const r of v) {
        const ma = String(r[0] ?? '').trim(); if (!ma) continue;
        if (ma === 'bat_dau') { bat_dau = iso(r[3]) || iso(r[2]) || bat_dau; continue; }
        luat[ma] = { ma, ap_dung: String(r[1] ?? ''), ten: String(r[2] ?? ''), thuong: soTien(r[3]), phat: soTien(r[4]), tru_vao: String(r[6] ?? ''), so_lan: soTien(r[8]) || null };
      }
      return [{ luat, bat_dau }];
    }
  });

  dash.loader('quy_md', {
    description: 'Mã định danh & Quỹ cọc',
    fn: ({answer}) => ((answer && answer.values) || []).slice(1).filter((r) => String(r[0] ?? '').trim()).map((r) => ({
      ma: String(r[0]).trim(), ct: chuongTrinh(r[1]), ten_ct: String(r[1] ?? '').trim(), gd: String(r[2] ?? '').trim(), du_an: String(r[3] ?? '').trim(),
      coc: soTien(r[4]), zalo: String(r[6] ?? '').trim()
    }))
  });

  dash.loader('quy_coc', {
    description: 'Đối soát cọc',
    fn: ({answer}) => ((answer && answer.values) || []).slice(1).filter((r) => String(r[3] ?? '').trim() && soTien(r[5])).map((r) => ({
      ngay: iso(r[0]), ma: String(r[3]).trim(), ct: chuongTrinh(r[4]), tien: soTien(r[5]), xac_nhan: String(r[10] ?? '').trim()
    })).filter((r) => !/^(sai|khong|không|huy|huỷ|hủy)/i.test(r.xac_nhan))
  });

  /* Tính thưởng/phạt từng dòng (dự án × tuần) */
  const bao = (r, ks) => M.dem(r, ks);
  const coChu = (x) => !!x && !/^(không|khong|k|0|-|chưa|chua)$/i.test(String(x).trim());
  const cacNgay = (s) => { const out = []; const re = /(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{4}))?/g; let m; while ((m = re.exec(String(s ?? ''))) !== null) out.push(m); return out; };

  function tinhDong(r, prog, L) {
    const ds = [];
    const them = (ma, dat, can, gd) => {
      const l = L[ma]; if (!l || !can) return;
      dat = Math.min(dat, can);
      ds.push({ ma, ten: l.ten, dat, can, thuong: dat * l.thuong, phat: (can - dat) * l.phat, luong_gd: /lương|luong/i.test(l.tru_vao), gd });
    };
    const ktick = prog === 'clb' ? ['khoe1', 'khoe2'] : ['khoe1', 'khoe2', 'khoe3'];
    them('khoe', bao(r, ktick), ktick.length);
    them('bld', bao(r, ['bld1', 'bld2', 'bld3']), 3);
    const canTc = (L.tttc && L.tttc.so_lan) || 1;
    them('tttc', bao(r, ['tc1', 'tc2', 'tc3', 'tc4']), Math.min(4, canTc));
    them('mtkd', r.mtkd_tuan === 'Có' ? 1 : 0, 1);
    if (prog === 'clb') {
      them('ptsp', r.ptsp ? 1 : 0, 1);
      them('coaching', r.coaching && r.thu_ky ? 1 : 0, 1, r.gd);
      const ngay = M.ngayIso(r.ngay_cd, r.key);
      if (ngay) { const con = M.soNgay(r.key, ngay); if (con >= 0 && con <= 15) them('mtkd_cd15', r.mtkd24 === 'Có' ? 1 : 0, 1); }
    } else {
      them('ptsp', coChu(r.ptsp) ? 1 : 0, 1);
      them('coaching', coChu(r.livestream) && coChu(r.thu_ky) ? 1 : 0, 1, r.gd);
    }
    return ds;
  }

  /* Giai đoạn riêng MT30: hạn tính từ ngày bắt đầu dự án (ngày đầu tiên trong cột Bắt đầu – nghiệm thu) */
  function tinhGiaiDoan(rowsDuAn, L) {
    const out = [];
    const dau = rowsDuAn.find((r) => cacNgay(r.thoi_gian).length);
    if (!dau) return out;
    const m = cacNgay(dau.thoi_gian)[0];
    const start = M.ngayIso(m[0], dau.key); if (!start) return out;
    const moc = [['mt30_t1', 'chien_luoc', 7], ['mt30_t2', 'mtkd_chot', 14], ['mt30_t34', 'nghiem_thu', 28]];
    for (const [ma, truong, ngay] of moc) {
      const l = L[ma]; if (!l) continue;
      const han = M.iso(new Date(M.ngayTu(start).getTime() + ngay * 864e5));
      const tuanHan = rowsDuAn.find((r) => r.key <= han && han < M.iso(new Date(M.ngayTu(r.key).getTime() + 7 * 864e5)));
      if (!tuanHan) continue;
      const xong = rowsDuAn.some((r) => r.key <= tuanHan.key && r[truong]);
      out.push({ key: tuanHan.key, tp: tuanHan.tp, du_an: tuanHan.du_an, gd: tuanHan.gd, ma, ten: l.ten, dat: xong ? 1 : 0, can: 1, thuong: xong ? l.thuong : 0, phat: xong ? 0 : l.phat, luong_gd: false, han });
    }
    return out;
  }

  dash.calc('quy_chi_tiet', {
    inputs: ['clb_bang_all', 'mt30_bang_all', 'quy_luat', 'quy_md'],
    fn: (clb, mt30, luat, md) => {
      const { luat: L, bat_dau } = luat[0] || { luat: {}, bat_dau: '2026-11-23' };
      const maCua = new Map(md.map((d) => [d.ct + '|' + khoa(d.ma), d.ma]));
      const tim = (prog, tp) => maCua.get(prog + '|' + khoa(tp)) || null;
      const out = [];
      for (const [prog, bang] of [['clb', clb], ['mt30', mt30]]) {
        for (const r of bang) {
          if (r.key < bat_dau) continue;
          for (const x of tinhDong(r, prog, L)) out.push({ ...x, prog, key: r.key, tp: r.tp, du_an: r.du_an, gd: x.gd || r.gd, ma_dd: tim(prog, r.tp) });
        }
      }
      for (const [, rs] of d3.group(mt30, (r) => khoa(r.du_an))) {
        for (const x of tinhGiaiDoan(rs.slice().sort((a, b) => (a.key < b.key ? -1 : 1)), L)) if (x.key >= bat_dau) out.push({ ...x, prog: 'mt30', ma_dd: tim('mt30', x.tp) });
      }
      return out;
    }
  });

  dash.calc('quy_tuan_ds', {
    inputs: ['quy_chi_tiet', 'quy_luat'],
    fn: (ct, luat) => {
      const ks = Array.from(new Set(ct.map((x) => x.key))).sort();
      const bd0 = (luat[0] || {}).bat_dau;
      if (!ks.length && bd0) ks.push(bd0);
      return ks.map((key) => ({ key, ten: M.tenTuan(key) }));
    }
  });

  const tuanChon = (ds) => { const p = dash.params().quy_tuan; return ds.some((d) => d.key === p) ? p : (ds.length ? ds[ds.length - 1].key : null); };

  dash.calc('quy_so_du', {
    inputs: ['quy_md', 'quy_coc', 'quy_chi_tiet', 'quy_tuan_ds'],
    fn: (md, coc, ct, tuans) => {
      const key = tuanChon(tuans);
      return md.map((d) => {
        const k = khoa(d.ma);
        const nop = coc.filter((c) => c.ct === d.ct && khoa(c.ma) === k).reduce((s, c) => s + c.tien, 0);
        const cua = ct.filter((x) => x.prog === d.ct && x.ma_dd === d.ma && !x.luong_gd);
        const thuong = d3.sum(cua, (x) => x.thuong), phat = d3.sum(cua, (x) => x.phat);
        const tuan = cua.filter((x) => x.key === key);
        const so_du = nop + thuong - phat;
        const trang_thai = !nop ? 'Chưa nộp cọc' : (so_du < d.coc * 0.5 ? 'Cần nộp bù' : (nop < d.coc ? 'Nộp thiếu' : 'Đủ'));
        return { ...d, nop, thuong, phat, so_du, tuan_thuong: d3.sum(tuan, (x) => x.thuong), tuan_phat: d3.sum(tuan, (x) => x.phat), trang_thai, nop_bu: Math.max(0, d.coc - so_du) };
      }).sort((a, b) => (a.ct === b.ct ? a.so_du - b.so_du : (a.ct < b.ct ? -1 : 1)));
    }
  });

  dash.calc('quy_kpi', {
    inputs: ['quy_so_du', 'quy_chi_tiet', 'quy_tuan_ds'],
    fn: (sd, ct, tuans) => {
      const key = tuanChon(tuans);
      const t = ct.filter((x) => x.key === key);
      return [{ nop: d3.sum(sd, (x) => x.nop), so_du: d3.sum(sd, (x) => x.so_du), thuong: d3.sum(t.filter((x) => !x.luong_gd), (x) => x.thuong), phat: d3.sum(t.filter((x) => !x.luong_gd), (x) => x.phat),
        luong_gd: d3.sum(t.filter((x) => x.luong_gd), (x) => x.phat), can_bu: sd.filter((x) => x.trang_thai !== 'Đủ').length, tong: sd.length, chua_khop: Array.from(new Set(t.filter((x) => !x.ma_dd).map((x) => x.tp))) }];
    }
  });

  /* ---------- Vẽ ---------- */
  const tien = (v) => (v < 0 ? '−' : '') + d3.format(',')(Math.abs(Math.round(v))).replace(/,/g, '.') + 'đ';
  const tienK = (v) => v ? (v > 0 ? '+' : '−') + d3.format(',')(Math.abs(v) / 1000).replace(/,/g, '.') + 'k' : '0';
  const oTrong = (tb, n, g, loi) => { const td = tb.insertRow().insertCell(); td.colSpan = n; td.textContent = g.status === 'error' ? loi + (g.message ? ' (' + g.message + ')' : '') : (g.status === 'loading' ? 'Đang tải…' : 'Chưa có dữ liệu'); };
  const one = (id) => { const g = dash.data(id); return g.status === 'ok' && g.data && g.data[0] ? g.data[0] : null; };

  dash.draw('quy-tuan-chon', (el) => {
    const g = dash.data('quy_tuan_ds'); const ds = g.data || [];
    const cur = tuanChon(ds);
    el.innerHTML = '';
    for (const d of ds.slice().reverse()) { const o = document.createElement('option'); o.value = d.key; o.textContent = d.ten; o.selected = d.key === cur; el.appendChild(o); }
    el.onchange = () => dash.setParams({ quy_tuan: el.value });
  });

  const kpi = (name, f, lv) => dash.draw(name, (el) => {
    const r = one('quy_kpi'); el.textContent = r ? f(r) : '—';
    const card = el.closest('.mt-card'); if (card && lv) { card.classList.remove('cd-ok', 'cd-warn', 'cd-bad'); if (r) card.classList.add('cd-' + lv(r)); }
  });
  kpi('quy-k-nop', (r) => tien(r.nop));
  kpi('quy-k-sodu', (r) => tien(r.so_du));
  kpi('quy-k-thuong', (r) => '+' + tien(r.thuong), () => 'ok');
  kpi('quy-k-phat', (r) => '−' + tien(r.phat), (r) => (r.phat ? 'bad' : 'ok'));
  kpi('quy-k-luong', (r) => r.luong_gd ? '−' + tien(r.luong_gd) : '0đ', (r) => (r.luong_gd ? 'bad' : 'ok'));
  kpi('quy-k-bu', (r) => r.can_bu + '/' + r.tong, (r) => (r.can_bu ? 'warn' : 'ok'));
  dash.draw('quy-chua-khop', (el) => {
    const r = one('quy_kpi');
    el.hidden = !(r && r.chua_khop.length);
    el.textContent = r && r.chua_khop.length ? 'TP chưa có mã định danh (không tính vào quỹ, thêm vào tab "Mã định danh & Quỹ cọc"): ' + r.chua_khop.join(', ') : '';
  });

  dash.draw('quy-sodu-rows', (el) => {
    const g = dash.data('quy_so_du'); el.innerHTML = '';
    if (g.status !== 'ok' || !g.data.length) return oTrong(el, 10, g, 'Không đọc được tab Mã định danh');
    for (const r of g.data) {
      const tr = el.insertRow();
      const c = (v, cls) => { const td = tr.insertCell(); td.textContent = v; if (cls) td.className = cls; return td; };
      c(r.ma); c(r.ct === 'mt30' ? 'MT30' : 'CLB 100 tỷ'); c(r.gd); c(tien(r.coc), 'n');
      c(r.nop ? tien(r.nop) : '—', 'n ' + (r.nop >= r.coc ? 'cl-ok' : (r.nop ? 'cl-warn' : 'cl-bad')));
      c(r.thuong ? '+' + tien(r.thuong) : '0đ', 'n'); c(r.phat ? '−' + tien(r.phat) : '0đ', 'n');
      c(tien(r.so_du), 'n ' + (r.so_du >= r.coc ? 'cl-ok' : (r.so_du >= r.coc * 0.5 ? 'cl-warn' : 'cl-bad')));
      c(tienK(r.tuan_thuong - r.tuan_phat), 'n ' + (r.tuan_thuong - r.tuan_phat >= 0 ? 'cl-ok' : 'cl-bad'));
      c(r.trang_thai + (r.trang_thai !== 'Đủ' && r.nop_bu ? ' · nộp ' + tien(r.nop_bu) : ''), r.trang_thai === 'Đủ' ? 'cl-ok' : (r.trang_thai === 'Chưa nộp cọc' ? 'cl-bad' : 'cl-warn'));
    }
  });

  const COT = ['khoe', 'bld', 'tttc', 'mtkd', 'ptsp', 'mtkd_cd15', 'mt30_t1', 'mt30_t2', 'mt30_t34'];
  const TEN_COT = { khoe: 'Khoe', bld: 'BC BLĐ', tttc: 'TTTC', mtkd: 'MTKD tuần', ptsp: 'PTSP', mtkd_cd15: 'MTKD trước 15 ngày', mt30_t1: 'MT30 T1', mt30_t2: 'MT30 T2', mt30_t34: 'Nghiệm thu' };
  dash.draw('quy-ct-head', (el) => {
    el.innerHTML = '';
    for (const t of ['TP / mã', 'CT', 'Dự án'].concat(COT.map((k) => TEN_COT[k]), ['Cộng tuần', 'Coaching (lương GĐ)'])) { const th = document.createElement('th'); th.textContent = t; el.appendChild(th); }
  });
  dash.draw('quy-ct-rows', (el) => {
    const g = dash.data('quy_chi_tiet'), gt = dash.data('quy_tuan_ds'); el.innerHTML = '';
    if (g.status !== 'ok') return oTrong(el, COT.length + 5, g, 'Chưa tính được');
    const key = tuanChon(gt.data || []);
    const t = g.data.filter((x) => x.key === key);
    if (!t.length) return oTrong(el, COT.length + 5, { status: 'ok' }, '');
    for (const [, rs] of d3.group(t, (x) => x.prog + '|' + x.du_an + '|' + x.tp)) {
      const f = rs[0], tr = el.insertRow();
      const c = (v, cls, title) => { const td = tr.insertCell(); td.textContent = v; if (cls) td.className = cls; if (title) td.title = title; return td; };
      c(f.ma_dd || f.tp + ' (chưa có mã)', f.ma_dd ? '' : 'cl-warn'); c(f.prog === 'mt30' ? 'MT30' : 'CLB'); c(f.du_an);
      for (const k of COT) {
        const x = rs.find((y) => y.ma === k);
        if (!x) { c('', 'cl-off'); continue; }
        const net = x.thuong - x.phat;
        c(tienK(net), 'n ' + (x.dat >= x.can ? 'cl-ok' : (x.dat ? 'cl-warn' : 'cl-bad')), x.ten + ': ' + x.dat + '/' + x.can + ' lần · +' + tien(x.thuong) + ' / −' + tien(x.phat) + (x.han ? ' · hạn ' + x.han.split('-').reverse().join('/') : ''));
      }
      const cong = rs.filter((x) => !x.luong_gd);
      const net = d3.sum(cong, (x) => x.thuong - x.phat);
      c(tienK(net), 'n ' + (net >= 0 ? 'cl-ok' : 'cl-bad'));
      const co = rs.find((x) => x.luong_gd);
      c(co ? (co.phat ? '−' + tien(co.phat) + ' · ' + (co.gd || '') : 'Đạt') : '', co ? (co.phat ? 'cl-bad' : 'cl-ok') : 'cl-off');
    }
  });

  dash.draw('quy-luat-rows', (el) => {
    const r = one('quy_luat'); el.innerHTML = '';
    if (!r) return oTrong(el, 5, dash.data('quy_luat'), 'Không đọc được tab Luật thưởng phạt');
    for (const l of Object.values(r.luat)) {
      const tr = el.insertRow();
      for (const v of [l.ap_dung, l.ten, l.thuong ? '+' + tien(l.thuong) : '—', '−' + tien(l.phat), l.tru_vao + (l.so_lan ? ' · ' + l.so_lan + ' lần/tuần' : '')]) tr.insertCell().textContent = v;
    }
  });
  dash.draw('quy-bat-dau', (el) => { const r = one('quy_luat'); el.textContent = r ? M.tenTuan(r.bat_dau) : '—'; });
}
