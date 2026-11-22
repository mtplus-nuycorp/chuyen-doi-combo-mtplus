/* ---------- Vẽ và tương tác ---------- */
{
  const M = window.MT;
  const pct = d3.format('.0%'), so = d3.format(',.4~f'), mot = d3.format('.1f');
  const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return d + '/' + m + '/' + y; };
  const one = (id) => { const g = dash.data(id); return g.status === 'ok' && g.data && g.data[0] ? g.data[0] : null; };
  const muc = (v) => v >= 0.8 ? 'ok' : (v >= 0.5 ? 'warn' : 'bad');
  const mucDat = (v) => v >= 1 ? 'ok' : (v >= 0.8 ? 'warn' : 'bad');
  const fmtKq = (kieu, v) => v === null || v === undefined ? '' : (kieu === 'pct' ? pct(v) : so(v));
  const setNum = (name, id, field, f, level) => dash.draw(name, (el) => {
    const r = one(id);
    if (level) { const card = el.closest('.mt-card'); if (card) { card.classList.remove('cd-ok', 'cd-warn', 'cd-bad'); const lv = r && r[field] !== null && r[field] !== undefined ? level(r[field]) : null; if (lv) card.classList.add('cd-' + lv); } }
    el.classList.toggle('dash-skeleton', dash.data(id).status === 'loading');
    el.textContent = r && r[field] !== null && r[field] !== undefined && r[field] !== '' ? (f ? f(r[field]) : String(r[field])) : '—';
  });
  const setText = (name, id, fn) => dash.draw(name, (el) => { const r = one(id); el.textContent = r ? fn(r) : '—'; });
  const oTrong = (tb, n, g, loi) => { const td = tb.insertRow().insertCell(); td.colSpan = n; td.textContent = g.status === 'error' ? loi + (g.message ? ' (' + g.message + ')' : '') : '—'; if (g.status === 'loading') td.className = 'dash-skeleton'; };

  /* Tabs */
  const show = (tab) => {
    for (const b of document.querySelectorAll('.mt-tab')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    for (const s of document.querySelectorAll('.mt-sec')) s.hidden = s.id !== tab;
    dash.setLink(tab);
  };
  for (const b of document.querySelectorAll('.mt-tab')) b.addEventListener('click', () => show(b.dataset.tab));

  /* Copy tin nhắn */
  for (const b of document.querySelectorAll('[data-copy]')) {
    b.addEventListener('click', async () => {
      const name = b.dataset.copy;
      const el = document.querySelector('[data-draw="' + name + '"]');
      try { await navigator.clipboard.writeText(el ? el.textContent : ''); window['_copied_' + name] = 'Đã copy, dán vào nhóm Zalo.'; }
      catch (e) {
        try { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); window['_copied_' + name] = 'Đã copy, dán vào nhóm Zalo.'; }
        catch (e2) { window['_copied_' + name] = 'Không copy được, hãy bôi đen và copy tay.'; }
      }
      dash.draw(name.replace('-msg', '-copied'));
    });
  }
  dash.draw('mt30-copied', (el) => { el.textContent = window['_copied_mt30-msg'] || ''; });
  dash.draw('clb-copied', (el) => { el.textContent = window['_copied_clb-msg'] || ''; });

  /* Bảng, thanh dùng chung */
  const pill = (m) => m === 'Đạt' ? 'ok' : (m === 'Cần nhắc' ? 'warn' : 'bad');
  const drawRows = (name, id, cols) => dash.draw(name, (tb) => {
    const g = dash.data(id);
    tb.replaceChildren();
    if (g.status !== 'ok') { oTrong(tb, cols.length, g, 'Không đọc được dữ liệu.'); return; }
    for (const r of g.data) {
      const tr = tb.insertRow();
      if (r.muc === 'Báo động') tr.className = 'alarm';
      for (const c of cols) {
        const td = tr.insertCell();
        if (c.n) td.className = 'n';
        const v = r[c.f];
        if ((c.f === 'pct' || c.f === 'ty_le_tb') && typeof v === 'number') td.classList.add('cl-' + muc(v));
        if (c.f === 'con_ngay' && typeof v === 'number') td.classList.add(v < 0 ? 'cl-bad' : (v <= 14 ? 'cl-warn' : 'cl-ok'));
        if ((c.f === 'bao_dong' || c.f === 'den_han') && typeof v === 'number' && v > 0) td.classList.add(c.f === 'den_han' ? 'cl-warn' : 'cl-bad');
        if (c.pill) { if (v) { const s = document.createElement('span'); s.className = 'mt-pill ' + (v === 'Đến hạn' ? 'warn' : (v === 'Cần cập nhật ngày' ? 'bad' : pill(v))); s.textContent = v; td.append(s); } }
        else td.textContent = v === null || v === undefined ? '' : (c.fmt ? c.fmt(v) : String(v));
      }
    }
  });
  const drawBars = (name, id) => dash.draw(name, (el) => {
    const g = dash.data(id);
    el.replaceChildren();
    if (g.status === 'error') { el.textContent = 'Không đọc được dữ liệu.'; return; }
    if (g.status !== 'ok') { el.className = 'mt-bars dash-skeleton'; return; }
    el.className = 'mt-bars';
    for (const r of g.data) {
      const row = document.createElement('div'); row.className = 'mt-bar';
      const k = document.createElement('span'); k.textContent = r.hang_muc;
      const tr = document.createElement('div'); tr.className = 'mt-track';
      const f = document.createElement('div'); f.className = 'mt-fill';
      f.style.width = (r.tong ? 100 * r.so_du_an / r.tong : 0) + '%'; f.style.background = 'var(--color-bad)';
      tr.append(f);
      const v = document.createElement('span'); v.style.textAlign = 'right'; v.style.fontVariantNumeric = 'tabular-nums';
      v.textContent = r.so_du_an + '/' + r.tong;
      row.append(k, tr, v); el.append(row);
    }
  });

  /* Tin nhắn */
  const today = () => { const t = new Date(); return String(t.getDate()).padStart(2, '0') + '/' + String(t.getMonth() + 1).padStart(2, '0') + '/' + t.getFullYear(); };
  const msg = (ten, kpi, rows, extra) => {
    const den = rows.filter((r) => r.bao_dong === 'Đến hạn').sort((a, b) => a.con_ngay - b.con_ngay);
    const thieu = rows.filter((r) => r.thieu);
    const cn = rows.filter((r) => r.bao_dong === 'Cần cập nhật ngày');
    return ['BÁO CÁO ' + ten + ' NGÀY ' + today(), kpi.tuan, '', ...(extra ? [extra, ''] : []),
      'Tổng quan: ' + kpi.so_du_an + ' dự án, kỷ luật trung bình ' + pct(kpi.ty_le_tb) + '. Đạt ' + kpi.dat + ', cần nhắc ' + kpi.can_nhac + ', báo động ' + kpi.bao_dong + '.', '',
      'ĐẾN HẠN CHUYỂN ĐỔI TRONG 14 NGÀY:', ...(den.length ? den.map((r) => '- ' + r.du_an + ' (' + r.tp + ', GĐ ' + r.gd + '): còn ' + r.con_ngay + ' ngày, kỷ luật ' + pct(r.pct)) : ['- Không có']), '',
      'CẦN BỔ SUNG TUẦN NÀY:', ...(thieu.length ? thieu.map((r) => '- ' + r.tp + ' (' + r.du_an + '): ' + r.thieu) : ['- Đủ hết']), '',
      'CẦN CẬP NHẬT NGÀY CHUYỂN ĐỔI: ' + (cn.length ? cn.map((r) => r.tp + ' (' + r.du_an + ')').join(', ') : 'không có')].join('\n');
  };

  /* ===== Phần chung cho MT30 và CLB ===== */
  for (const P of ['mt30', 'clb']) {
    dash.draw(P + '-thang', (s) => {
      const g = dash.data(P + '_bang_tong'), k = one(P + '_thang_kpi');
      const ms = g.status === 'ok' ? Array.from(new Set(g.data.map((w) => w.thang))).sort().reverse() : [];
      s.replaceChildren(...ms.map((m) => new Option(M.tenThang(m), m)));
      s.value = k ? k.thang : (ms[0] || '');
      s.onchange = () => dash.setParams({ [P + '_thang']: s.value, [P + '_tuan']: null });
    });
    dash.draw(P + '-tuan-chon', (s) => {
      const g = dash.data(P + '_bang_tong'), k = one(P + '_thang_kpi'), inf = one(P + '_tuan_info');
      const ws = g.status === 'ok' && k ? g.data.filter((w) => w.thang === k.thang).slice().reverse() : [];
      s.replaceChildren(...ws.map((w) => new Option(w.tuan, w.key)));
      s.value = inf ? inf.key : (ws[0] ? ws[0].key : '');
      s.onchange = () => dash.setParams({ [P + '_tuan']: s.value });
    });
    setText(P + '-thang-ten', P + '_thang_kpi', (r) => r.ten);
    setText(P + '-tuan-ten', P + '_tuan_info', (r) => r.tuan);
    setNum(P + '-th-sotuan', P + '_thang_kpi', 'so_tuan');
    setNum(P + '-th-duan', P + '_thang_kpi', 'du_an_tb', d3.format('.0f'));
    setNum(P + '-th-kl', P + '_thang_kpi', 'ky_luat_tb', pct, muc);
    setNum(P + '-th-bd', P + '_thang_kpi', 'bao_dong', null, (v) => v > 0 ? 'bad' : 'ok');
    setText(P + '-th-tot', P + '_thang_kpi', (r) => r.tuan_tot || '—');
    setText(P + '-th-kem', P + '_thang_kpi', (r) => r.tuan_kem || '—');

    /* Bảng tổng tháng */
    const cacKey = (data) => Array.from(new Set(data.map((o) => o.key)));
    dash.draw(P + '-thang-head', (tr) => {
      const g = dash.data(P + '_tong_thang');
      tr.replaceChildren();
      const th = (t, cls) => { const e = document.createElement('th'); e.textContent = t; if (cls) e.className = cls; tr.append(e); return e; };
      th('Hạng mục');
      if (g.status !== 'ok') return;
      for (const key of cacKey(g.data)) {
        if (key === 'ca_thang') { th('Cả tháng', 'n mt-ca'); continue; }
        const e = th(M.tenTuan(key).replace(/\/T\d+ /, ' '), 'n mt-click');
        e.tabIndex = 0; e.title = 'Bấm để xem chi tiết tuần này';
        const di = () => { dash.setParams({ [P + '_tuan']: key }); const t = document.getElementById(P + '-tong-tuan'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
        e.onclick = di; e.onkeydown = (ev) => { if (ev.key === 'Enter') di(); };
      }
    });
    dash.draw(P + '-thang-rows', (tb) => {
      const g = dash.data(P + '_tong_thang');
      tb.replaceChildren();
      if (g.status !== 'ok') { oTrong(tb, 2, g, 'Không tính được bảng tháng.'); return; }
      if (!g.data.length) { oTrong(tb, 2, { status: 'ok' }, ''); return; }
      const keys = cacKey(g.data), byK = d3.group(g.data, (o) => o.k);
      for (const [k, os] of byK) {
        const tr = tb.insertRow();
        const c0 = tr.insertCell(); c0.textContent = os[0].hang_muc; c0.className = 'mt-da';
        for (const key of keys) {
          const o = os.find((x) => x.key === key) || {};
          const td = tr.insertCell(); td.className = 'n' + (key === 'ca_thang' ? ' mt-ca' : '');
          td.textContent = fmtKq(o.kieu, o.ket_qua);
          if (o.dat !== null && o.dat !== undefined) { td.classList.add('cl-' + mucDat(o.dat)); td.title = 'Mục tiêu ' + fmtKq(o.kieu, o.muc_tieu) + ' · đạt ' + pct(o.dat); }
          else if (o.kieu === 'pct' && typeof o.ket_qua === 'number') td.classList.add('cl-' + muc(o.ket_qua));
        }
      }
    });

    /* Bảng tổng tuần */
    const oNhap = (r, nhom, giaTri, goiY, rong) => {
      const i = document.createElement(rong ? 'textarea' : 'input');
      if (!rong) i.type = 'text';
      i.className = 'mt-in' + (rong ? ' mt-in-rong' : '');
      i.value = giaTri ?? '';
      if (goiY) i.placeholder = goiY;
      i.setAttribute('aria-label', r.hang_muc + ': ' + (nhom === 'muc_tieu' ? 'mục tiêu' : nhom === 'ket_qua' ? 'kết quả' : 'ghi chú'));
      i.onchange = () => { M.luuTong(P, r.key, nhom, r.k, i.value.trim()); };
      return i;
    };
    dash.draw(P + '-tong-rows', (tb) => {
      const g = dash.data(P + '_tong_tuan');
      if (tb.contains(document.activeElement) && document.activeElement.matches('.mt-in')) return;
      tb.replaceChildren();
      if (g.status !== 'ok') { oTrong(tb, 6, g, 'Không tính được bảng tổng tuần.'); return; }
      for (const r of g.data) {
        const tr = tb.insertRow();
        const c0 = tr.insertCell(); c0.className = 'mt-da'; c0.textContent = r.hang_muc;
        const c1 = tr.insertCell(); c1.className = 'n';
        c1.append(oNhap(r, 'muc_tieu', r.muc_tieu_nhap, r.muc_tieu !== null ? fmtKq(r.kieu, r.muc_tieu) : (r.kieu === 'pct' ? 'vd 90%' : 'nhập số')));
        if (r.nguon_muc_tieu && r.nguon_muc_tieu !== 'tuần này') { const s = document.createElement('div'); s.className = 'mt-sub'; s.textContent = 'theo ' + r.nguon_muc_tieu; c1.append(s); }
        const c2 = tr.insertCell(); c2.className = 'n';
        if (r.tu_dong) c2.textContent = fmtKq(r.kieu, r.ket_qua);
        else c2.append(oNhap(r, 'ket_qua', r.ket_qua_nhap, 'nhập tay'));
        const c3 = tr.insertCell(); c3.className = 'n mt-big';
        c3.textContent = r.dat === null ? '' : pct(r.dat);
        if (r.dat !== null) c3.classList.add('cl-' + mucDat(r.dat));
        const c4 = tr.insertCell(); c4.className = 'mt-wrap';
        c4.textContent = r.tu_dong ? (r.so_thieu ? r.so_thieu + ' thiếu: ' + r.thieu : 'Đủ') : '';
        if (r.tu_dong) c4.classList.add(r.so_thieu ? 'cl-off' : 'cl-ok');
        const c5 = tr.insertCell(); c5.append(oNhap(r, 'ghi_chu', r.ghi_chu, 'ghi chú chất lượng', true));
      }
    });
    setText(P + '-duoi50', P + '_tuan_info', (r) => r.so_duoi_50 ? r.so_duoi_50 + ' TP: ' + r.tp_duoi_50 : 'Không có TP nào dưới 50%.');
    dash.draw(P + '-nhanxet', (el) => {
      const r = one(P + '_tuan_info');
      if (document.activeElement !== el) el.value = r ? r.nhan_xet : '';
      el.disabled = !r;
      el.onchange = () => { const x = one(P + '_tuan_info'); if (x) M.luuTong(P, x.key, 'nhan_xet', null, el.value.trim()); };
    });

    /* Bảng tick chi tiết */
    const tick = (on) => { const s = document.createElement('span'); s.className = on ? 'mt-ck on' : 'mt-ck'; s.textContent = on ? '✓' : ''; return s; };
    const laCo = (r, k) => r[k] === true || r[k] === 'Có';
    const oTick = (tr, r, k) => {
      const td = tr.insertCell(); const on = laCo(r, k);
      td.className = 'c mt-edit ' + (on ? 'cl-ok' : 'cl-off');
      td.tabIndex = 0; td.setAttribute('role', 'checkbox'); td.setAttribute('aria-checked', String(on));
      td.append(tick(on));
      const doi = () => {
        const moi = (k === 'mtkd_tuan' || k === 'mtkd24') ? (on ? '' : 'Có') : !on;
        const bat = laCo({ x: moi }, 'x');
        td.firstChild.className = bat ? 'mt-ck on' : 'mt-ck'; td.firstChild.textContent = bat ? '✓' : '';
        M.luuDong(P, r, { [k]: moi });
      };
      td.onclick = doi; td.onkeydown = (ev) => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); doi(); } };
      return td;
    };
    const oXoa = (tr, r) => {
      const td = tr.insertCell(); const b = document.createElement('button'); b.type = 'button'; b.className = 'mt-xoa'; b.textContent = '✕'; b.title = 'Xoá dự án khỏi tuần này';
      b.onclick = () => { if (b.dataset.ok) M.luuDong(P, r, { xoa: true }); else { b.dataset.ok = '1'; b.textContent = 'Xoá?'; } };
      td.append(b);
    };
    const add = (tr, val, cls) => { const td = tr.insertCell(); if (cls) td.className = cls; td.textContent = val === null || val === undefined ? '' : String(val); return td; };
    /* Ô chữ/số sửa được: bấm vào để sửa, Enter hoặc bấm ra ngoài để lưu, Esc để huỷ */
    const sua = (tr, r, f, cls, hien) => {
      const goc = r[f] === null || r[f] === undefined ? '' : String(r[f]);
      const td = add(tr, hien !== undefined ? hien : goc, (cls ? cls + ' ' : '') + 'mt-sua');
      td.tabIndex = 0; td.title = 'Bấm để sửa';
      const mo = () => {
        if (td.querySelector('input')) return;
        const i = document.createElement('input'); i.className = 'mt-o-sua'; i.value = goc;
        i.style.width = Math.max(80, td.offsetWidth - 8) + 'px';
        td.replaceChildren(i); i.focus(); i.select();
        let xong = false;
        const ket = (luu) => {
          if (xong) return; xong = true;
          const v = i.value.trim();
          td.textContent = luu ? v : (hien !== undefined ? hien : goc);
          if (luu && v !== goc) {
            const so = f === 'so_thang' || f === 'diem';
            M.luuDong(P, r, { [f]: so ? (v === '' ? null : (isNaN(parseFloat(v.replace(',', '.'))) ? v : parseFloat(v.replace(',', '.')))) : v });
          }
        };
        i.onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); ket(true); } else if (ev.key === 'Escape') ket(false); };
        i.onblur = () => ket(true);
      };
      td.onclick = mo; td.onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); mo(); } };
      return td;
    };

    dash.draw(P + '-bang-rows', (tb) => {
      const g = dash.data(P + '_bang_all'), inf = one(P + '_tuan_info');
      if (tb.querySelector('input.mt-o-sua')) return;
      tb.replaceChildren();
      const n = P === 'clb' ? 26 : 28;
      if (g.status !== 'ok' || !inf) { oTrong(tb, n, g, 'Không đọc được bảng tick.'); return; }
      let lastGd = null; const hn = M.homNay();
      for (const r of g.data.filter((x) => x.key === inf.key)) {
        const tr = tb.insertRow();
        sua(tr, r, 'gd', 'mt-gd', r.gd !== lastGd ? r.gd : ''); lastGd = r.gd;
        sua(tr, r, 'du_an', 'mt-da'); sua(tr, r, 'tp');
        if (P === 'clb') {
          sua(tr, r, 'pf'); sua(tr, r, 'ngay_cd', 'n');
          const d = M.ngayIso(r.ngay_cd, r.key), con = d ? M.soNgay(hn, d) : null;
          const cn = add(tr, con, 'n'); if (con !== null) cn.classList.add(con < 0 ? 'cl-bad' : (con <= 14 ? 'cl-warn' : 'cl-ok'));
          sua(tr, r, 'so_thang', 'n');
          oTick(tr, r, 'mtkd24'); oTick(tr, r, 'mtkd_tuan');
          for (const k of M.CLB_TICK) oTick(tr, r, k);
          const cp = add(tr, r.pct === null || r.pct === undefined ? '' : pct(r.pct), 'n mt-big'); if (typeof r.pct === 'number') cp.classList.add('cl-' + muc(r.pct));
          sua(tr, r, 'diem', 'n');
        } else {
          const cp = add(tr, r.pct === null || r.pct === undefined ? '' : pct(r.pct), 'n mt-big'); if (typeof r.pct === 'number') cp.classList.add('cl-' + muc(r.pct));
          sua(tr, r, 'livestream'); sua(tr, r, 'thoi_gian'); sua(tr, r, 'thu_ky', null, r.thu_ky ? 'Có' : ''); sua(tr, r, 'ptsp'); sua(tr, r, 'gui_bc'); sua(tr, r, 'file_tk');
          add(tr, M.dem(r, ['bld1', 'bld2', 'bld3']), 'n'); for (const k of ['bld1', 'bld2', 'bld3']) oTick(tr, r, k);
          add(tr, M.dem(r, ['khoe1', 'khoe2', 'khoe3']), 'n'); for (const k of ['khoe1', 'khoe2', 'khoe3']) oTick(tr, r, k);
          add(tr, M.dem(r, ['tc1', 'tc2', 'tc3', 'tc4']), 'n'); for (const k of ['tc1', 'tc2', 'tc3', 'tc4']) oTick(tr, r, k);
          for (const k of ['mtkd_tuan', 'chien_luoc', 'mtkd_chot', 'nghiem_thu']) oTick(tr, r, k);
        }
        oXoa(tr, r);
      }
    });
    dash.draw(P + '-bang-tong', (tr) => {
      const g = dash.data(P + '_bang_tong'), inf = one(P + '_tuan_info');
      tr.replaceChildren();
      const d = g.status === 'ok' && inf ? g.data.find((x) => x.key === inf.key) : null;
      const cell = (val, span, cls) => { const td = document.createElement('td'); if (span) td.colSpan = span; td.className = 'n' + (cls ? ' ' + cls : ''); td.textContent = val; tr.append(td); };
      const p = (x) => (x === null || x === undefined ? '' : pct(x));
      const lv = (x) => (typeof x === 'number' ? 'cl-' + muc(x) : '');
      if (!d) { cell('—', P === 'clb' ? 26 : 28); return; }
      const l = document.createElement('td'); l.className = 'mt-tong'; l.textContent = 'TỔNG HOÀN THÀNH (' + d.so_du_an + ' dự án)'; tr.append(l);
      if (P === 'clb') {
        l.colSpan = 7;
        cell(d.mtkd24 + '/' + d.so_du_an, 1); cell(d.mtkd + '/' + d.so_du_an, 1);
        cell(p(d.coaching), 1, lv(d.coaching)); cell(p(d.thu_ky), 2, lv(d.thu_ky)); cell(p(d.ptsp), 2, lv(d.ptsp)); cell(p(d.bld), 3, lv(d.bld)); cell(p(d.khoe), 2, lv(d.khoe)); cell(p(d.tttc), 4, lv(d.tttc));
        cell(p(d.pct), 1, lv(d.pct)); cell(d.diem === null || d.diem === undefined ? '' : mot(d.diem), 1); cell('', 1);
      } else {
        l.colSpan = 3;
        cell(p(d.pct), 1, lv(d.pct)); cell('', 6); cell(p(d.bld), 4, lv(d.bld)); cell(p(d.khoe), 4, lv(d.khoe)); cell(p(d.tttc), 5, lv(d.tttc));
        cell(p(d.mtkd_tuan), 1, lv(d.mtkd_tuan)); cell(p(d.chien_luoc), 1, lv(d.chien_luoc)); cell(p(d.mtkd_chot), 1, lv(d.mtkd_chot)); cell(p(d.nghiem_thu), 1, lv(d.nghiem_thu)); cell('', 1);
      }
    });
  }

  /* Tạo tuần mới, thêm dự án */
  const dangLam = new Set();
  for (const b of document.querySelectorAll('[data-tao-tuan]')) {
    b.addEventListener('click', async () => {
      const P = b.dataset.taoTuan; if (dangLam.has(P)) return;
      const g = dash.data(P + '_bang_all'); if (g.status !== 'ok' || !g.data.length) return;
      const keys = M.cacTuan(g.data), cuoi = keys[keys.length - 1], moi = M.congTuan(cuoi, 1);
      dangLam.add(P); b.disabled = true;
      const giu = P === 'clb' ? ['gd', 'du_an', 'tp', 'pf', 'ngay_cd', 'so_thang', 'mtkd24', 'thu_tu'] : ['gd', 'du_an', 'tp', 'livestream', 'thoi_gian', 'thu_ky', 'ptsp', 'gui_bc', 'file_tk', 'thu_tu'];
      for (const r of g.data.filter((x) => x.key === cuoi)) {
        const data = { key: moi };
        for (const f of giu) if (r[f] !== undefined && r[f] !== null) data[f] = r[f];
        for (const k of (P === 'clb' ? M.CLB_TICK : M.MT30_TICK)) data[k] = false;
        data.mtkd_tuan = '';
        const ok = await M.luu('data/' + P + '_web/' + M.docId(moi, r.du_an, r.tp), data);
        if (!ok) break;
      }
      dangLam.delete(P); b.disabled = false;
      dash.setParams({ [P + '_thang']: moi.slice(0, 7), [P + '_tuan']: moi });
    });
  }
  for (const b of document.querySelectorAll('[data-them]')) {
    b.addEventListener('click', async () => {
      const P = b.dataset.them, form = b.closest('.mt-form'); if (!form) return;
      const v = {}; for (const i of form.querySelectorAll('[data-truong]')) v[i.dataset.truong] = i.value.trim();
      if (!v.du_an || !v.tp) { for (const i of form.querySelectorAll('[data-truong="du_an"], [data-truong="tp"]')) if (!i.value.trim()) i.setAttribute('aria-invalid', 'true'); return; }
      const inf = one(P + '_tuan_info'), g = dash.data(P + '_bang_all'); if (!inf || g.status !== 'ok') return;
      const cung = g.data.filter((x) => x.key === inf.key);
      const data = Object.assign({ key: inf.key, thu_tu: (d3.max(cung, (x) => x.thu_tu) ?? 0) + 1, mtkd_tuan: '' }, v);
      for (const k of (P === 'clb' ? M.CLB_TICK : M.MT30_TICK)) data[k] = false;
      if (await M.luu('data/' + P + '_web/' + M.docId(inf.key, v.du_an, v.tp), data)) for (const i of form.querySelectorAll('[data-truong]')) { i.value = ''; i.removeAttribute('aria-invalid'); }
    });
  }

  /* ===== MT30 tuần đang chọn ===== */
  setNum('mt30-so', 'mt30_kpi', 'so_du_an');
  setNum('mt30-tb', 'mt30_kpi', 'ty_le_tb', pct, muc);
  setNum('mt30-bd', 'mt30_kpi', 'bao_dong', null, (v) => v > 0 ? 'bad' : 'ok');
  setNum('mt30-dh', 'mt30_kpi', 'den_han', null, (v) => v > 0 ? 'warn' : 'ok');
  setNum('mt30-combo', 'mt30_kpi', 'ty_le_combo', pct);
  setNum('mt30-combo-so', 'mt30_kpi', 'combo');
  setNum('mt30-ky', 'mt30_kpi', 'ky');
  dash.draw('mt30-lede', (el) => {
    const k = one('mt30_kpi');
    el.textContent = k ? (k.tuan + ': ' + k.so_du_an + ' dự án MT30, kỷ luật trung bình ' + pct(k.ty_le_tb) + ', ' + k.bao_dong + ' dự án báo động, ' + k.den_han + ' dự án đến hạn chuyển đổi trong 14 ngày tới.') : '—';
  });
  drawRows('mt30-gd', 'mt30_gd', [{ f: 'gd' }, { f: 'so_du_an', n: 1 }, { f: 'ty_le_tb', n: 1, fmt: pct }, { f: 'bao_dong', n: 1 }, { f: 'den_han', n: 1 }]);
  drawBars('mt30-thieu', 'mt30_thieu');
  drawRows('mt30-rows', 'mt30_rows', [{ f: 'du_an' }, { f: 'gd' }, { f: 'tp' }, { f: 'vai_tro' }, { f: 'pct', n: 1, fmt: pct }, { f: 'ngay_moc', n: 1, fmt: fmtDate }, { f: 'con_ngay', n: 1 }, { f: 'bao_dong', pill: 1 }, { f: 'thieu' }]);
  dash.draw('mt30-msg', (el) => {
    const k = one('mt30_kpi'), g = dash.data('mt30_rows');
    if (!k || g.status !== 'ok') { el.textContent = '—'; return; }
    el.textContent = msg('MT30', k, g.data, 'Chuyển đổi năm 2026: ' + k.combo + '/' + k.ky + ' dự án lên combo (' + pct(k.ty_le_combo) + ').');
  });

  /* ===== CLB tuần đang chọn ===== */
  setNum('clb-kq', 'clb_kpi', 'ket_qua_thang');
  setNum('clb-mt', 'clb_kpi', 'muc_tieu_thang');
  setNum('clb-pct', 'clb_kpi', 'ty_le_thang', pct);
  setNum('clb-thieu', 'clb_kpi', 'con_thieu');
  setNum('clb-so', 'clb_kpi', 'so_du_an');
  setNum('clb-tb', 'clb_kpi', 'ty_le_tb', pct, muc);
  setNum('clb-bd', 'clb_kpi', 'bao_dong', null, (v) => v > 0 ? 'bad' : 'ok');
  setNum('clb-dh', 'clb_kpi', 'den_han', null, (v) => v > 0 ? 'warn' : 'ok');
  setNum('clb-cn', 'clb_kpi', 'can_cap_nhat');
  dash.draw('clb-lede', (el) => {
    const k = one('clb_kpi');
    if (!k) { el.textContent = '—'; return; }
    const mt = k.muc_tieu_thang ? ('Số tháng chuyển đổi combo tháng này đạt ' + (k.ket_qua_thang || 0) + '/' + k.muc_tieu_thang + ' (' + pct(k.ty_le_thang) + '), cần thêm ' + k.con_thieu + ' trong ' + k.con_ngay_thang + ' ngày còn lại. ') : '';
    el.textContent = mt + k.tuan + ': kỷ luật trung bình ' + pct(k.ty_le_tb) + ', ' + k.bao_dong + '/' + k.so_du_an + ' dự án báo động.';
  });
  drawRows('clb-gd', 'clb_gd', [{ f: 'gd' }, { f: 'so_du_an', n: 1 }, { f: 'ty_le_tb', n: 1, fmt: pct }, { f: 'diem_tb', n: 1, fmt: mot }, { f: 'bao_dong', n: 1 }]);
  drawBars('clb-thieu-bars', 'clb_thieu');
  drawRows('clb-rows', 'clb_rows', [{ f: 'du_an' }, { f: 'gd' }, { f: 'tp' }, { f: 'vai_tro' }, { f: 'pct', n: 1, fmt: pct }, { f: 'diem', n: 1 }, { f: 'ngay_cd', n: 1, fmt: fmtDate }, { f: 'con_ngay', n: 1 }, { f: 'bao_dong', pill: 1 }, { f: 'thieu' }]);
  dash.draw('clb-msg', (el) => {
    const k = one('clb_kpi'), g = dash.data('clb_rows');
    if (!k || g.status !== 'ok') { el.textContent = '—'; return; }
    const extra = k.muc_tieu_thang ? ('Mục tiêu tháng: số tháng chuyển đổi combo ' + (k.ket_qua_thang || 0) + '/' + k.muc_tieu_thang + ' (' + pct(k.ty_le_thang) + '), cần thêm ' + k.con_thieu + ' trong ' + k.con_ngay_thang + ' ngày còn lại.') : 'Mục tiêu tháng: chưa có.';
    el.textContent = msg('CLB 100 TỶ', k, g.data, extra);
  });

  /* ===== Xu hướng các tuần ===== */
  const sel = { mt30: null, clb: null };
  const nhan = (t) => { const m = String(t).match(/(\d{1,2})\s*\/\s*(\d{1,2})/); return m ? (+m[1]) + '/' + (+m[2]) : String(t).slice(0, 10); };
  const trend = (key, id) => dash.draw(key + '-trend', (el) => {
    const g = dash.data(id);
    el.replaceChildren();
    el.classList.toggle('dash-skeleton', g.status === 'loading');
    if (g.status === 'error') { const p = document.createElement('p'); p.className = 'mt-note'; p.textContent = 'Không đọc được bảng lịch sử trong file Tool.'; el.append(p); return; }
    if (g.status !== 'ok') return;
    const data = g.data.filter((d) => d.ty_le_tb !== null).slice(-26);
    if (!data.length) return;
    const W = el.clientWidth || 600, H = 260, m = { l: 44, r: 14, t: 16, b: 34 };
    const x = d3.scalePoint().domain(data.map((d) => d.stt)).range([m.l, W - m.r]).padding(0.3);
    const y = d3.scaleLinear().domain([0, Math.max(1, d3.max(data, (d) => d.ty_le_tb))]).nice().range([H - m.b, m.t]);
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', 'Kỷ luật trung bình theo tuần');
    const ticks = y.ticks(4);
    svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y).style('stroke', 'var(--cds-chart-grid)');
    svg.append('g').selectAll('text').data(ticks).join('text').attr('x', m.l - 6).attr('y', (d) => y(d) + 4).attr('text-anchor', 'end').text(pct).style('fill', 'var(--cds-text-secondary)').style('font-size', 'var(--cds-font-size-caption)');
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0.8)).attr('y2', y(0.8)).style('stroke', 'var(--cds-chart-reference)').style('stroke-dasharray', '4 4');
    svg.append('text').attr('x', W - m.r).attr('y', y(0.8) - 5).attr('text-anchor', 'end').text('Mức đạt 80%').style('fill', 'var(--cds-text-secondary)').style('font-size', 'var(--cds-font-size-caption)');
    const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor((W - m.l - m.r) / 56))));
    svg.append('g').selectAll('text').data(data.filter((d, i) => i % every === 0 || i === data.length - 1)).join('text').attr('x', (d) => x(d.stt)).attr('y', H - 10).attr('text-anchor', 'middle').text((d) => nhan(d.tuan)).style('fill', 'var(--cds-text-secondary)').style('font-size', 'var(--cds-font-size-caption)');
    svg.append('path').datum(data).attr('fill', 'none').style('stroke', dash.colors[0]).style('stroke-width', 2).attr('d', d3.line().x((d) => x(d.stt)).y((d) => y(d.ty_le_tb)));
    const tip = document.createElement('div'); tip.className = 'mt-tip'; tip.hidden = true; el.append(tip);
    svg.append('g').selectAll('circle').data(data).join('circle').attr('cx', (d) => x(d.stt)).attr('cy', (d) => y(d.ty_le_tb)).attr('r', 4).style('fill', (d) => d.ty_le_tb < 0.5 ? 'var(--cds-chart-status-critical)' : dash.colors[0]).style('cursor', 'pointer')
      .on('mouseenter', (ev, d) => { tip.textContent = d.tuan + ': ' + pct(d.ty_le_tb) + ', ' + d.so_du_an + ' dự án, ' + d.bao_dong + ' báo động'; tip.hidden = false; tip.style.left = Math.min(W - 220, Math.max(0, x(d.stt) - 100)) + 'px'; tip.style.top = Math.max(0, y(d.ty_le_tb) - 52) + 'px'; })
      .on('mouseleave', () => { tip.hidden = true; })
      .on('click', (ev, d) => { sel[key] = d.tuan; dash.draw(key + '-week'); dash.draw(key + '-week-rows'); dash.draw(key + '-week-sum'); });
  });
  const weekSelect = (key, id) => dash.draw(key + '-week', (s) => {
    const g = dash.data(id);
    const ws = g.status === 'ok' ? g.data.slice().reverse() : [];
    s.replaceChildren(...ws.map((d) => new Option(d.tuan, d.tuan)));
    if (!sel[key] && ws.length) sel[key] = ws[0].tuan;
    s.value = sel[key] || '';
    s.onchange = () => { sel[key] = s.value; dash.draw(key + '-week-rows'); dash.draw(key + '-week-sum'); };
  });
  const weekSum = (key, id) => dash.draw(key + '-week-sum', (el) => {
    const g = dash.data(id);
    const d = g.status === 'ok' ? g.data.find((r) => r.tuan === sel[key]) : null;
    el.textContent = d ? ('Tuần ' + d.tuan.replace(/^Tuần\s*/i, '') + ': ' + d.so_du_an + ' dự án, kỷ luật trung bình ' + (d.ty_le_tb === null ? 'chưa có' : pct(d.ty_le_tb)) + ', ' + d.bao_dong + ' dự án báo động' + (d.diem_tb !== undefined && d.diem_tb !== null ? ', điểm thăng tiến trung bình ' + mot(d.diem_tb) : '') + '.') : '—';
  });
  const weekRows = (key, id, cols) => dash.draw(key + '-week-rows', (tb) => {
    const g = dash.data(id);
    tb.replaceChildren();
    if (g.status !== 'ok') { oTrong(tb, cols.length, g, 'Không đọc được bảng lịch sử trong file Tool.'); return; }
    for (const r of g.data.filter((x) => x.tuan === sel[key]).sort((a, b) => (a.pct ?? -1) - (b.pct ?? -1))) {
      const tr = tb.insertRow();
      for (const c of cols) { const td = tr.insertCell(); if (c.n) td.className = 'n'; const v = r[c.f]; if (c.f === 'pct' && typeof v === 'number') td.classList.add('cl-' + muc(v)); td.textContent = v === null || v === undefined ? '' : (c.fmt ? c.fmt(v) : String(v)); }
    }
  });
  trend('mt30', 'mt30_tuan'); weekSelect('mt30', 'mt30_tuan'); weekSum('mt30', 'mt30_tuan');
  weekRows('mt30', 'mt30_lichsu', [{ f: 'du_an' }, { f: 'gd' }, { f: 'tp' }, { f: 'pct', n: 1, fmt: pct }, { f: 'bc_bld', n: 1 }, { f: 'khoe', n: 1 }, { f: 'tttc', n: 1 }]);
  trend('clb', 'clb_tuan'); weekSelect('clb', 'clb_tuan'); weekSum('clb', 'clb_tuan');
  weekRows('clb', 'clb_lichsu', [{ f: 'du_an' }, { f: 'gd' }, { f: 'tp' }, { f: 'pct', n: 1, fmt: pct }, { f: 'diem', n: 1 }]);

  /* ===== Báo cáo Zalo ===== */
  const fmtLan = (t) => { const m = String(t).match(/^(\d{4})-(\d{2})-(\d{2})\s*(.*)$/); return m ? m[3] + '/' + m[2] + ' ' + m[4] : t; };
  const zaloSum = (name, id, ai, rong) => dash.draw(name, (el) => {
    const g = dash.data(id);
    if (g.status !== 'ok') { el.textContent = '—'; return; }
    const d = g.data;
    if (!d.length) { el.textContent = rong; return; }
    const [y, mo, dd] = d[0].tuan.split('-');
    el.textContent = 'Tuần bắt đầu ' + dd + '/' + mo + '/' + y + ': ' + d.length + ' ' + ai + ' đã gửi báo cáo, tổng ' + d3.sum(d, (r) => r.tong) + ' tin.';
  });
  const zaloRows = (name, id, cols) => dash.draw(name, (tb) => {
    const g = dash.data(id);
    tb.replaceChildren();
    if (g.status !== 'ok') { oTrong(tb, cols.length, g, 'Không đọc được tab Báo cáo Zalo.'); return; }
    for (const r of g.data) {
      const tr = tb.insertRow();
      for (const f of cols) { const td = tr.insertCell(); if (f !== 'tp' && f !== 'lan_cuoi') { td.className = 'n'; if (f !== 'tong' && f !== 'khac') td.classList.add(r[f] > 0 ? 'cl-ok' : 'cl-off'); } td.textContent = f === 'lan_cuoi' ? fmtLan(r[f]) : String(r[f]); }
    }
  });
  zaloSum('zalo-sum', 'zalo_tuan', 'TP', 'Chưa có tin báo cáo nào được ghi nhận.');
  zaloRows('zalo-rows', 'zalo_tuan', ['tp', 'khoe', 'bld', 'tttc', 'mtkd', 'coaching', 'khac', 'tong', 'lan_cuoi']);
  zaloSum('mt30-zalo-sum', 'zalo_tuan_mt30', 'TP/TN', 'Chưa có tin báo cáo nào được ghi nhận từ nhóm MT30.');
  zaloRows('mt30-zalo-rows', 'zalo_tuan_mt30', ['tp', 'khoe', 'bld', 'tttc', 'mtkd', 'livestream', 'ptsp', 'coaching', 'khac', 'tong', 'lan_cuoi']);
}
