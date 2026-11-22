/* Chuyển đổi combo MTplus — bộ chạy trang (thay cho nền tảng dashboard của Claude)
   Cung cấp window.dash (loader, calc, draw, data, params) và window.claude.use('db'),
   lấy dữ liệu qua google.script.run.getAll() và ghi qua google.script.run.setDoc(). */
(() => {
  const BAN = '2026-11-22c';
  const STORE = { clb_web: 'data/clb_web', mt30_web: 'data/mt30_web', tong_tuan: 'data/tong_tuan' };
  const loaders = {}, calcs = {}, draws = new Map();
  let raw = null, loi = {}, trangThai = 'loading', params = {}, cache = {}, hen = null;

  const tron = (x) => Array.isArray(x) ? x : (x && Array.isArray(x.rows) ? x.rows : (x && Array.isArray(x.data) ? x.data : []));

  function nguon(id) {
    if (cache[id]) return cache[id];
    let kq;
    if (calcs[id]) {
      const c = calcs[id];
      const ins = c.inputs.map(nguon);
      const xau = ins.find((g) => g.status !== 'ok');
      if (xau) kq = { status: xau.status, data: null, message: xau.message };
      else {
        try { kq = { status: 'ok', data: c.fn(...ins.map((g) => g.data)) }; }
        catch (e) { console.error('calc ' + id, e); kq = { status: 'error', data: null, message: String(e) }; }
      }
    } else if (STORE[id]) {
      kq = raw ? { status: 'ok', data: raw.store[id] || [] } : { status: trangThai, data: [] };
    } else if (!raw) {
      kq = { status: trangThai, data: [] };
    } else if (loi[id] || !raw.sheets[id]) {
      kq = { status: 'error', data: [], message: loi[id] || 'Không đọc được nguồn ' + id };
    } else {
      try {
        const v = raw.sheets[id];
        kq = { status: 'ok', data: loaders[id] ? tron(loaders[id].fn({ answer: { values: v } })) : v };
      } catch (e) { console.error('loader ' + id, e); kq = { status: 'error', data: [], message: String(e) }; }
    }
    cache[id] = kq;
    return kq;
  }

  function veMot(name, fn) {
    for (const el of document.querySelectorAll('[data-draw="' + name + '"]')) {
      try { fn(el); } catch (e) { console.error('draw ' + name, e); }
    }
  }
  function veTat() {
    hen = null; cache = {};
    // giữ nguyên vị trí cuộn khi vẽ lại (bảng thay nội dung không được làm trang nhảy)
    const se = document.scrollingElement || document.documentElement;
    const y = se.scrollTop, ngang = [...document.querySelectorAll('.mt-scroll')].map((e) => e.scrollLeft);
    const cao = document.getElementById('dash-root');
    if (cao) cao.style.minHeight = cao.offsetHeight + 'px';
    for (const [name, fn] of draws) veMot(name, fn);
    document.querySelectorAll('.mt-scroll').forEach((e, i) => { if (ngang[i] !== undefined) e.scrollLeft = ngang[i]; });
    se.scrollTop = y;
    if (cao) requestAnimationFrame(() => { cao.style.minHeight = ''; });
  }
  function lenLich() { if (!hen) hen = requestAnimationFrame(veTat); }

  window.dash = {
    loader: (id, o) => { loaders[id] = o; },
    calc: (id, o) => { calcs[id] = o; },
    draw: (name, fn) => {
      if (typeof fn === 'function') { draws.set(name, fn); lenLich(); }
      else { const f = draws.get(name); if (f) veMot(name, f); }
    },
    data: (id) => nguon(id),
    params: () => Object.assign({}, params),
    setParams: (o) => {
      for (const k of Object.keys(o)) { const v = o[k]; if (v === null || v === undefined || v === '') delete params[k]; else params[k] = v; }
      cache = {}; lenLich();
    },
    resetParams: () => { params = {}; cache = {}; lenLich(); },
    setLink: () => {},
    onData: () => {},
    refresh: () => taiDuLieu(),
    colors: ['#2a78d6', '#1b9aaa', '#d97757', '#7a4fb8', '#788c5d', '#c9952b', '#8b5d7d', '#5f6b73']
  };

  /* Ghi dữ liệu */
  function capNhatKho(path, data) {
    const k = path.lastIndexOf('/');
    const col = path.slice(0, k), id = path.slice(k + 1);
    const ten = Object.keys(STORE).find((x) => STORE[x] === col);
    if (!ten || !raw) return;
    raw.store[ten] = (raw.store[ten] || []).filter((d) => d.id !== id);
    raw.store[ten].push(Object.assign({ id }, data));
    cache = {}; lenLich();
  }
  const db = {
    doc: (path) => ({
      set: (data) => new Promise((ok, hong) => {
        google.script.run
          .withSuccessHandler(() => { capNhatKho(path, data); ok(); })
          .withFailureHandler((e) => hong(e))
          .setDoc(path, data);
      })
    })
  };
  window.claude = { use: async (name) => (name === 'db' ? db : null) };

  /* Tải dữ liệu */
  function trangThaiTai(chu, xau) {
    const el = document.getElementById('trang-thai-tai');
    if (el) { el.textContent = chu; el.classList.toggle('xau', !!xau); }
  }
  function taiDuLieu() {
    trangThaiTai('Đang tải dữ liệu…');
    google.script.run
      .withSuccessHandler((s) => {
        raw = JSON.parse(s); loi = raw.loi || {}; trangThai = 'ok';
        const ds = Object.keys(loi);
        const gio = new Date(raw.luc).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        trangThaiTai(ds.length ? 'Cập nhật ' + gio + ' · Không đọc được: ' + ds.map((d) => d + ' (' + loi[d] + ')').join('; ') : 'Cập nhật lúc ' + gio, ds.length);
        for (const el of document.querySelectorAll('.chi-xem')) el.hidden = raw.co_quyen_sua;
        cache = {}; lenLich();
      })
      .withFailureHandler((e) => { trangThai = 'error'; trangThaiTai('Không tải được dữ liệu: ' + (e && e.message || e), true); cache = {}; lenLich(); })
      .getAll();
  }

  function napScript(src) {
    return new Promise((ok, hong) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => hong(new Error('Không tải được ' + src)); document.body.appendChild(s); });
  }

  async function chay() {
    const goc = window.ASSET || './';
    try {
      const html = await (await fetch(goc + 'body.html?v=' + BAN)).text();
      document.getElementById('dash-root').innerHTML = html;
      for (const f of ['lib.js', 'calcs.js', 'draw.js']) await napScript(goc + f + '?v=' + BAN);
    } catch (e) {
      document.getElementById('dash-root').textContent = 'Không tải được giao diện: ' + e.message;
      return;
    }
    for (const b of document.querySelectorAll('[data-tai-lai]')) b.addEventListener('click', taiDuLieu);
    window.addEventListener('resize', lenLich);
    taiDuLieu();
    setInterval(taiDuLieu, 5 * 60 * 1000);
  }
  chay();
})();
