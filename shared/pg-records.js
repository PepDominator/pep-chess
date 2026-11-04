// ============ Рекорды: таблицы лучших времён (судоку дня, кроссворд дня, суперкроссворд недели) ============
// Таблица — leaderboards/{доска}/entries/{uid}; в таблицу попадает первое решение задания (повторы и перерешивание не считаются).
(function () {
  if (window.PGRec) return;
  const SDK = 'https://www.gstatic.com/firebasejs/10.13.0/';
  const CFG = { apiKey: 'AIzaSyDpce_OyUUijQajza3tIKQjcTBzAtGbQrY', authDomain: 'pep-chess-2026.firebaseapp.com', projectId: 'pep-chess-2026', storageBucket: 'pep-chess-2026.firebasestorage.app', messagingSenderId: '170856560854', appId: '1:170856560854:web:d9b6b766cbd56780ecf177' };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (ms) => { const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), p = (n) => (n < 10 ? '0' : '') + n; return (h ? h + ':' + p(m) : m) + ':' + p(s % 60); };
  let backend = null, user = null, cfg = { boards: () => [], local: () => null }, cache = {};
  async function firebaseBackend() {
    const [A, Au, F] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
    let app = null; for (let i = 0; i < 60 && !app; i++) { const apps = A.getApps(); if (apps.length) app = apps[0]; else await sleep(50); }
    if (!app) app = A.initializeApp(CFG); const auth = Au.getAuth(app), db = F.getFirestore(app);
    return {
      onUser(cb) { Au.onAuthStateChanged(auth, (u) => cb(u && !u.isAnonymous ? { uid: u.uid, name: u.displayName || u.email || 'Игрок', photo: u.photoURL || null } : null)); },
      async get(board, uid) { const s = await F.getDoc(F.doc(db, 'leaderboards', board, 'entries', uid)); return s.exists() ? s.data() : null; },
      async put(board, uid, d) { await F.setDoc(F.doc(db, 'leaderboards', board, 'entries', uid), { name: String(d.name || 'Игрок').slice(0, 40), photo: d.photo || null, time: Math.round(d.time), hints: d.hints | 0, at: F.serverTimestamp() }); },
      async top(board, n) { const s = await F.getDocs(F.query(F.collection(db, 'leaderboards', board, 'entries'), F.orderBy('time', 'asc'), F.limit(n))); return s.docs.map((d) => ({ uid: d.id, ...d.data() })); }
    };
  }
  const getBackend = async () => backend || (backend = window.__pgrBackend || await firebaseBackend());
  async function start() { try { const b = await getBackend(); b.onUser((u) => { user = u; cache = {}; window.dispatchEvent(new Event('pgr-user')); setTimeout(syncPending, 800); }); } catch (e) { console.warn('Рекорды недоступны:', e); } }

  const css = `
.pgr-ov { position:fixed; inset:0; z-index:420; background:rgba(42,46,36,.4); display:flex; align-items:center; justify-content:center; padding:14px; font-family:'Noto Sans',system-ui,sans-serif; }
.pgr-panel { position:relative; background:var(--k-panel); border:1px solid var(--k-line); width:100%; max-width:480px; max-height:calc(100dvh - 28px); overflow-y:auto; box-shadow:0 30px 80px rgba(42,46,36,.3); color:var(--k-tx); padding:22px 20px 18px; }
.pgr-panel h3 { margin:0 0 12px; font:italic 400 26px Georgia,'Times New Roman',serif; } .pgr-x { position:absolute; top:10px; right:12px; background:none; border:none; font-size:18px; color:var(--k-mu2); cursor:pointer; }
.pgr-tabs { display:flex; border:1px solid var(--k-line); margin-bottom:10px; } .pgr-tabs button { flex:1; background:var(--k-surf); border:none; border-right:1px solid var(--k-line); padding:8px 4px; font:600 12.5px 'Noto Sans',sans-serif; color:var(--k-mu); cursor:pointer; } .pgr-tabs button:last-child { border-right:none; } .pgr-tabs button.on { background:var(--k-acc); color:#fff; }
.pgr-opt { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--k-mu); margin:0 0 8px; } .pgr-opt label { display:flex; gap:6px; align-items:center; cursor:pointer; }
.pgr-row { display:flex; align-items:center; gap:10px; padding:8px 4px; border-bottom:1px solid var(--k-line); } .pgr-row.me { background:var(--k-hover); font-weight:700; }
.pgr-pos { width:26px; text-align:right; font:600 13px 'Roboto Mono',monospace; color:var(--k-mu); } .pgr-av { width:28px; height:28px; border-radius:50%; background:var(--k-line2); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; overflow:hidden; flex-shrink:0; } .pgr-av img { width:100%; height:100%; object-fit:cover; }
.pgr-name { flex:1; min-width:0; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .pgr-t { font:700 14px 'Roboto Mono',monospace; } .pgr-h { font-size:11.5px; color:var(--k-mu); min-width:30px; text-align:right; }
.pgr-empty { font-size:13px; color:var(--k-mu); padding:14px 0; line-height:1.5; } .pgr-note { font-size:11.5px; color:var(--k-mu2); margin-top:12px; line-height:1.4; }
.pgr-b { background:var(--k-acc); color:#fff; border:none; padding:8px 12px; font:700 13px inherit; cursor:pointer; margin-top:8px; }
.pgr-line { margin-top:10px; font-size:13px; } .pgr-line button { background:none; border:none; color:var(--k-gt); text-decoration:underline; cursor:pointer; font:inherit; padding:0; }`;
  const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  const ordinal = (n) => n + '-е место';
  // Результаты, решённые без сети или без входа, уходят в таблицу сами: когда вошли в аккаунт, вернулась сеть или страницу снова открыли
  const SENT = 'pgrSent'; let syncing = false;
  const sentSet = () => { try { return JSON.parse(localStorage.getItem(SENT) || '{}'); } catch (e) { return {}; } };
  async function syncPending() {
    if (!user || syncing || !cfg.pending) return; syncing = true; const sent = sentSet();
    try { for (const it of cfg.pending()) { if (sent[it.id + ':' + user.uid]) continue; const r = await submit(it.id, it); if (r.status === 'new' || r.status === 'kept') { sent[it.id + ':' + user.uid] = 1; try { localStorage.setItem(SENT, JSON.stringify(sent)); } catch (e) {} if (r.status === 'new' && r.rank && window.PGA) PGA.event('rank', { pos: r.rank.pos }); } else if (r.status === 'error') break; } } catch (e) {} finally { syncing = false; }
  }
  async function top(board, n) { const k = board + ':' + n; if (cache[k]) return cache[k]; const b = await getBackend(); return (cache[k] = await b.top(board, n)); }
  async function submit(board, d) {
    if (!user) return { status: 'guest' }; const b = await getBackend();
    let mine = null; try { mine = await b.get(board, user.uid); } catch (e) {}
    if (mine) return { status: 'kept', time: mine.time, rank: await rankOf(board) };
    try { await b.put(board, user.uid, { name: user.name, photo: user.photo, time: d.time, hints: d.hints }); } catch (e) { console.warn('Результат не записан', e); return { status: 'error' }; }
    cache = {}; return { status: 'new', rank: await rankOf(board) };
  }
  async function rankOf(board) { try { const list = await top(board, 100), i = list.findIndex((x) => x.uid === user.uid); return i < 0 ? null : { pos: i + 1, of: list.length }; } catch (e) { return null; } }
  // Строка в окне победы: отправляет результат и показывает место в таблице
  async function winLine(host, board, d) {
    if (!host) return; host.innerHTML = '';
    const signIn = () => { if (window.PGSync && PGSync.signIn) PGSync.signIn().catch(() => {}); };
    if (!user) { host.innerHTML = 'Хотите попасть в таблицу рекордов? <button type="button">Войдите через Google</button>'; host.querySelector('button').onclick = signIn; const once = async () => { window.removeEventListener('pgr-user', once); if (user) winLine(host, board, d); }; window.addEventListener('pgr-user', once); return; }
    host.textContent = 'Записываем результат…'; const r = await submit(board, d);
    if (r.status === 'error') host.textContent = 'Не удалось записать результат в таблицу (нет интернета?). Он сохранён у вас и отправится сам, когда связь появится.';
    else if (r.rank && window.PGA) PGA.event('rank', { pos: r.rank.pos });
    if (r.status !== 'error') host.innerHTML = (r.status === 'kept' ? 'В таблице уже есть ваш результат: ' + fmt(r.time) : 'Результат записан в таблицу') + (r.rank ? ` · <b>${ordinal(r.rank.pos)}</b> из ${r.rank.of}` : '');
  }

  const avatar = (n, p) => `<span class="pgr-av">${p ? `<img src="${esc(p)}" alt="" referrerpolicy="no-referrer">` : esc((n || '?').trim().charAt(0).toUpperCase() || '?')}</span>`;
  async function open() {
    if (document.getElementById('pgr-ov')) return; const ov = document.createElement('div'); ov.className = 'pgr-ov'; ov.id = 'pgr-ov';
    const boards = cfg.boards(); let cur = 0, clean = false; const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); window.removeEventListener('pgr-user', refresh); }; const onKey = (e) => { if (e.key === 'Escape') close(); };
    async function draw() {
      const tabs = boards.map((b, i) => `<button type="button" data-i="${i}" class="${i === cur ? 'on' : ''}">${esc(b.title)}</button>`).join('');
      ov.innerHTML = `<div class="pgr-panel" role="dialog"><button class="pgr-x" aria-label="Закрыть">✕</button><h3>Рекорды</h3><div class="pgr-tabs">${tabs}</div><div class="pgr-opt"><span>${esc(boards[cur].sub || '')}</span><label><input type="checkbox" id="pgr-clean" ${clean ? 'checked' : ''}>Без подсказок</label></div><div id="pgr-list"><div class="pgr-empty">Загрузка…</div></div><div class="pgr-note">В таблицу попадает первое решение задания. Результаты отправляют сами игроки, поэтому таблица на доверии.</div></div>`;
      ov.querySelector('.pgr-x').onclick = close; ov.querySelectorAll('.pgr-tabs button').forEach((b) => { b.onclick = () => { cur = +b.dataset.i; draw(); }; }); ov.querySelector('#pgr-clean').onchange = (e) => { clean = e.target.checked; paintList(); };
      await paintList();
    }
    async function paintList() {
      const host = ov.querySelector('#pgr-list'); if (!host) return; const bd = boards[cur]; let list;
      if (user) { const loc = cfg.local(bd.id); if (loc) { try { await submit(bd.id, loc); } catch (e) {} } }
      try { list = await top(bd.id, 50); } catch (e) { host.innerHTML = '<div class="pgr-empty">Не удалось загрузить таблицу. Проверьте интернет.</div>'; return; }
      if (clean) list = list.filter((x) => !x.hints);
      if (!list.length) { host.innerHTML = `<div class="pgr-empty">${clean ? 'Нет результатов без подсказок.' : 'Пока никто не решил это задание. Станьте первым!'}${user ? '' : '<br><button class="pgr-b" id="pgr-in" type="button">Войти через Google</button>'}</div>`; const bi = host.querySelector('#pgr-in'); if (bi) bi.onclick = () => { if (window.PGSync && PGSync.signIn) PGSync.signIn().catch(() => {}); }; return; }
      host.innerHTML = list.map((x, i) => `<div class="pgr-row${user && x.uid === user.uid ? ' me' : ''}" data-uid="${esc(x.uid)}"><span class="pgr-pos">${i + 1}</span>${avatar(x.name, x.photo)}<span class="pgr-name">${esc(x.name)}</span><span class="pgr-t">${fmt(x.time)}</span><span class="pgr-h">${x.hints ? '💡' + x.hints : ''}</span></div>`).join('') + (user ? '' : '<div class="pgr-empty"><button class="pgr-b" id="pgr-in" type="button">Войти через Google, чтобы попасть в таблицу</button></div>');
      const bi = host.querySelector('#pgr-in'); if (bi) bi.onclick = () => { if (window.PGSync && PGSync.signIn) PGSync.signIn().catch(() => {}); };
    }
    const refresh = () => { if (document.body.contains(ov)) draw(); };
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); }); document.addEventListener('keydown', onKey); window.addEventListener('pgr-user', refresh); document.body.appendChild(ov); draw();
  }
  window.addEventListener('online', () => setTimeout(syncPending, 500)); document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(syncPending, 500); });
  window.PGRec = { config(c) { cfg = Object.assign(cfg, c); }, syncPending, start, submit, top, open, winLine, fmt, get user() { return user; } };
  const boot = () => { start(); const b = document.getElementById('pgr-btn'); if (b) b.onclick = open; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
