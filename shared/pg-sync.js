// ============ Синхронизация данных между устройствами (вход через Google, хранилище — Firestore) ============
// Принципы: данные по-прежнему лежат в браузере (всё работает офлайн), а облако — копия.
// Настройки и незавершённые партии: побеждает более поздняя правка. Статистика и история партий сливаются без потерь.
(function () {
  if (window.PGSync) return;
  const SDK = 'https://www.gstatic.com/firebasejs/10.13.0/';
  const CFG = { apiKey: 'AIzaSyDpce_OyUUijQajza3tIKQjcTBzAtGbQrY', authDomain: 'pep-chess-2026.firebaseapp.com', projectId: 'pep-chess-2026', storageBucket: 'pep-chess-2026.firebasestorage.app', messagingSenderId: '170856560854', appId: '1:170856560854:web:d9b6b766cbd56780ecf177' };
  // Что синхронизируем: m — способ слияния, slow — не чаще раза в 15 секунд (часто перезаписываемые сохранения)
  const REG = {
    pgSettings: { m: 'lww' }, draughtsSettings: { m: 'lww' }, draughtsNickname: { m: 'lww' }, chessNickname: { m: 'lww' },
    sudokuPrefs: { m: 'lww' }, sudokuLevel: { m: 'lww' }, crosswordPrefs: { m: 'lww' },
    sudokuSave: { m: 'lww', slow: true }, crosswordSave: { m: 'lww', slow: true }, crosswordWeekSave: { m: 'lww', slow: true },
    sudokuStats: { m: 'stats' }, crosswordStats: { m: 'stats' },
    nonogramPrefs: { m: 'lww' }, nonogramSave: { m: 'lww', slow: true }, nonogramStats: { m: 'stats' },
    stoStats: { m: 'lww' },
    codeStats: { m: 'lww' }, codePrefs: { m: 'lww' }, codeSave: { m: 'lww', slow: true },
    fiveStats: { m: 'lww' }, fiveSave: { m: 'lww', slow: true },      // «Пять букв»: статистика и начатая игра
    wordsStats: { m: 'lww' }, wordsPrefs: { m: 'lww' }, wordsSave: { m: 'lww', slow: true },
    chessGameHistory: { m: 'history', limit: 100 }, draughtsHistory: { m: 'history', limit: 100 },
    pgAch: { m: 'ach' },                                                                      // достижения: объединяются, счётчики — максимум
    chessCurrent: { m: 'lww', delay: 2500 }, draughtsCurrent: { m: 'lww', delay: 2500 }       // идущая партия с компьютером: продолжить можно на другом устройстве
  };
  const META = 'pgSyncMeta', UIDK = 'pgSyncUid', DEVK = 'pgDevId';
  const ls = window.localStorage, rawSet = Storage.prototype.setItem, rawRem = Storage.prototype.removeItem;
  const getL = (k) => { try { return ls.getItem(k); } catch (e) { return null; } };
  const st = { status: 'off', user: null, last: 0, error: '' };
  let backend = null, uid = null, unsub = null, applying = false, timers = {}, started = false, firstDone = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms || 9000))]);
  const emit = () => window.dispatchEvent(new CustomEvent('pgsync-state', { detail: Object.assign({}, st) }));
  const setSt = (patch) => { Object.assign(st, patch); emit(); };
  const devId = () => { let d = getL(DEVK); if (!d) { d = Math.random().toString(36).slice(2, 10); try { rawSet.call(ls, DEVK, d); } catch (e) {} } return d; };
  const getMeta = () => { try { return JSON.parse(getL(META) || '{}'); } catch (e) { return {}; } };
  const putMeta = (m) => { try { rawSet.call(ls, META, JSON.stringify(m)); } catch (e) {} };
  const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };

  // ---------- слияние ----------
  const pad2 = (n) => String(n).padStart(2, '0'), keyOf = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const dayBefore = (key) => { const [y, m, d] = key.split('-').map(Number); return keyOf(new Date(y, m - 1, d - 1)); };
  function mergeHistory(a, b, limit) {
    const map = new Map(); [].concat(parse(b) || [], parse(a) || []).forEach((r) => { if (r && r.date && !map.has(r.date)) map.set(r.date, r); });
    return JSON.stringify(Array.from(map.values()).sort((x, y) => (y.date > x.date ? 1 : y.date < x.date ? -1 : 0)).slice(0, limit || 100));
  }
  function mergeStats(a, b) {
    const A = parse(a) || {}, B = parse(b) || {}, out = JSON.parse(JSON.stringify(A));
    out.solved = {}; for (const k of new Set(Object.keys(A.solved || {}).concat(Object.keys(B.solved || {})))) out.solved[k] = Math.max((A.solved || {})[k] || 0, (B.solved || {})[k] || 0);
    out.best = {}; for (const k of new Set(Object.keys(A.best || {}).concat(Object.keys(B.best || {})))) { const x = (A.best || {})[k], y = (B.best || {})[k]; out.best[k] = x == null ? y : y == null ? x : Math.min(x, y); }
    const ra = (A.daily && A.daily.results) || {}, rb = (B.daily && B.daily.results) || {}, res = {};
    for (const k of new Set(Object.keys(ra).concat(Object.keys(rb)))) res[k] = ra[k] == null ? rb[k] : rb[k] == null ? ra[k] : Math.min(ra[k], rb[k]);
    const last = Object.keys(res).sort().pop() || null; let streak = 0;
    if (last) { let d = last; while (res[d] != null) { streak++; d = dayBefore(d); } }
    const ha = (A.daily && A.daily.hints) || {}, hb = (B.daily && B.daily.hints) || {}; out.daily = { last, streak, results: res, hints: Object.assign({}, ha, hb) };
    const wa = (A.weekly && A.weekly.results) || {}, wb = (B.weekly && B.weekly.results) || {}, wr = {};            // суперкроссворд недели: результаты объединяются
    for (const k of new Set(Object.keys(wa).concat(Object.keys(wb)))) wr[k] = wa[k] == null ? wb[k] : wb[k] == null ? wa[k] : Math.min(wa[k], wb[k]);
    if (Object.keys(wr).length) out.weekly = { results: wr, hints: Object.assign({}, (A.weekly && A.weekly.hints) || {}, (B.weekly && B.weekly.hints) || {}) };
    return JSON.stringify(out);
  }
  function mergeAch(a, b) {
    const A = parse(a) || {}, B = parse(b) || {}, u = {}, c = {};
    for (const k of new Set(Object.keys(A.u || {}).concat(Object.keys(B.u || {})))) { const x = (A.u || {})[k], y = (B.u || {})[k]; u[k] = !x ? y : !y ? x : Math.min(x, y); }
    for (const k of new Set(Object.keys(A.c || {}).concat(Object.keys(B.c || {})))) c[k] = Math.max((A.c || {})[k] || 0, (B.c || {})[k] || 0);
    // дни активности: игры, время суток, задания и победы объединяются, число завершённых игр — большее из двух; хранятся последние 420 дней
    const d = {}; for (const k of new Set(Object.keys(A.d || {}).concat(Object.keys(B.d || {})))) { const x = (A.d || {})[k] || {}, y = (B.d || {})[k] || {}; d[k] = { g: (x.g | 0) | (y.g | 0), t: (x.t | 0) | (y.t | 0), q: (x.q | 0) | (y.q | 0), w: (x.w | 0) | (y.w | 0), n: Math.max(x.n | 0, y.n | 0) }; }
    const dk = Object.keys(d).sort(); if (dk.length > 420) dk.slice(0, dk.length - 420).forEach((k) => delete d[k]);
    // коллекция картинок: объединение без повторов
    const p = []; for (const e of (A.p || []).concat(B.p || [])) if (p.indexOf(e) < 0) p.push(e);
    return JSON.stringify({ u, c, d, p: p.slice(-700) });
  }
  // Решает, что делать с ключом при сравнении локальных данных с облачными
  function reconcile(k, cloud) {
    const spec = REG[k], local = getL(k), m = getMeta()[k] || {}, lt = m.t || (local != null ? 1 : 0);
    if (!cloud) return local != null ? { push: true, val: local } : {};
    const cv = cloud.del ? null : cloud.v, ct = cloud.t || 0;
    if (spec.m === 'lww') {
      if (cv === local) return { t: Math.max(ct, lt) };
      if (ct > lt) return { apply: true, val: cv, t: ct };
      return { push: true, val: local };
    }
    const merged = spec.m === 'history' ? mergeHistory(local, cv, spec.limit) : spec.m === 'ach' ? mergeAch(local, cv) : mergeStats(local, cv);
    return { apply: merged !== local, val: merged, push: merged !== cv, t: Math.max(ct, lt) };
  }
  function applyLocal(k, val, t) {
    applying = true; try { if (val == null) rawRem.call(ls, k); else rawSet.call(ls, k, val); } catch (e) {} applying = false;
    const m = getMeta(); m[k] = { t: t || Date.now() }; putMeta(m);
    window.dispatchEvent(new CustomEvent('pgsync-applied', { detail: { key: k } }));
  }

  // ---------- облако ----------
  async function pushKey(k, forced) {
    if (!backend || !uid) return; const spec = REG[k]; let val = getL(k), t = (getMeta()[k] || {}).t || Date.now();
    try {
      if (spec.m !== 'lww') {                                            // слияние: сначала смотрим, что в облаке
        const cloud = await withTimeout(backend.get(uid, k)); const r = reconcile(k, cloud); if (r.apply) applyLocal(k, r.val, r.t); val = r.val != null ? r.val : val; if (cloud && !r.push) { setSt({ status: 'ok', last: Date.now() }); return; }
      }
      await withTimeout(backend.set(uid, k, { k, v: val == null ? '' : val, del: val == null, t, dev: devId() }));
      const m = getMeta(); m[k] = { t }; putMeta(m); setSt({ status: 'ok', last: Date.now(), error: '' });
    } catch (e) { setSt({ status: 'error', error: String(e && e.message || e) }); }
  }
  function schedule(k) {
    if (!uid || !backend) return; clearTimeout(timers[k]); const slow = REG[k].slow && getL(k) != null;      // удаление (партию закончили) отправляем сразу
    timers[k] = setTimeout(() => { setSt({ status: 'syncing' }); pushKey(k); }, slow ? (window.__pgSyncSlowMs || 15000) : (REG[k].delay ? (window.__pgSyncGameMs || REG[k].delay) : 1200));
  }
  function flush() { Object.keys(timers).forEach((k) => { clearTimeout(timers[k]); delete timers[k]; if (uid && backend) pushKey(k); }); }
  function onLocalChange(k) { const m = getMeta(); m[k] = { t: Date.now() }; putMeta(m); schedule(k); }

  // Любая запись в наши ключи localStorage в этой вкладке отправляется в облако
  Storage.prototype.setItem = function (k, v) { const prev = this === ls && REG[k] ? getL(k) : undefined; rawSet.apply(this, arguments); if (this === ls && REG[k] && !applying && prev !== String(v)) onLocalChange(k); };
  Storage.prototype.removeItem = function (k) { const had = this === ls && REG[k] ? getL(k) !== null : false; rawRem.apply(this, arguments); if (this === ls && REG[k] && !applying && had) onLocalChange(k); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); }); window.addEventListener('pagehide', flush);
  window.addEventListener('online', () => { if (uid) syncNow(); });

  async function handleChanges(changes, isFirst) {
    const seen = new Set();
    for (const ch of changes) {
      const k = ch.key; if (!REG[k]) continue; seen.add(k); const r = reconcile(k, ch.data);
      if (r.apply) applyLocal(k, r.val, r.t); else if (r.t) { const m = getMeta(); m[k] = { t: r.t }; putMeta(m); }
      if (r.push) pushKey(k, true);
    }
    if (isFirst) { for (const k of Object.keys(REG)) if (!seen.has(k) && getL(k) != null) pushKey(k, true); firstDone = true; }
    setSt({ status: 'ok', last: Date.now(), error: '' });
  }
  async function connect(user) {
    if (unsub) { try { unsub(); } catch (e) {} unsub = null; }
    uid = user ? user.uid : null; setSt({ user: user ? { uid: user.uid, name: user.name } : null, status: user ? 'syncing' : 'off', error: '' });
    if (!user) return;
    const prev = getL(UIDK);
    if (prev && prev !== user.uid) {                                   // на этом устройстве вошёл другой человек: чужие данные не смешиваем
      applying = true; Object.keys(REG).forEach((k) => { try { rawRem.call(ls, k); } catch (e) {} }); applying = false; putMeta({});
      Object.keys(REG).forEach((k) => window.dispatchEvent(new CustomEvent('pgsync-applied', { detail: { key: k } })));
    }
    try { rawSet.call(ls, UIDK, user.uid); } catch (e) {}
    try { unsub = backend.listen(user.uid, (changes, isFirst) => handleChanges(changes, isFirst)); } catch (e) { setSt({ status: 'error', error: String(e) }); }
  }
  async function syncNow() {
    if (!uid || !backend) return; setSt({ status: 'syncing' });
    try { for (const k of Object.keys(REG)) { const cloud = await withTimeout(backend.get(uid, k)); const r = reconcile(k, cloud); if (r.apply) applyLocal(k, r.val, r.t); if (r.push) await pushKey(k, true); } setSt({ status: 'ok', last: Date.now(), error: '' }); }
    catch (e) { setSt({ status: 'error', error: String(e && e.message || e) }); }
  }

  // ---------- подключение к Firebase ----------
  async function firebaseBackend() {
    const [A, Au, F] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
    let app = null; for (let i = 0; i < 60 && !app; i++) { const apps = A.getApps(); if (apps.length) app = apps[0]; else await sleep(50); }
    if (!app) app = A.initializeApp(CFG);
    if (window.pgInitAppCheck) await window.pgInitAppCheck(app);      // защита от чужих скриптов (включается ключом reCAPTCHA)
    const auth = Au.getAuth(app), db = F.getFirestore(app), col = (u) => F.collection(db, 'userData', u, 'docs');
    return {
      onUser(cb) { Au.onAuthStateChanged(auth, (u) => cb(u && !u.isAnonymous ? { uid: u.uid, name: u.displayName || u.email || 'Игрок' } : null)); },
      async get(u, key) { const s = await F.getDoc(F.doc(db, 'userData', u, 'docs', key)); return s.exists() ? s.data() : null; },
      async set(u, key, data) { await F.setDoc(F.doc(db, 'userData', u, 'docs', key), Object.assign({}, data, { at: F.serverTimestamp() })); },
      listen(u, cb) { let first = true; return F.onSnapshot(col(u), (snap) => { const ch = snap.docChanges().filter((c) => c.type !== 'removed' && !c.doc.metadata.hasPendingWrites).map((c) => ({ key: c.doc.id, data: c.doc.data() })); const f = first; first = false; cb(ch, f); }, (e) => setSt({ status: 'error', error: String(e && e.code || e) })); },
      async signIn() { await Au.signInWithPopup(auth, new Au.GoogleAuthProvider()); },
      async signOut() { await Au.signOut(auth); }
    };
  }
  async function start() {
    if (started) return; started = true;
    try { backend = window.__pgBackend || await firebaseBackend(); backend.onUser((u) => connect(u)); }
    catch (e) { backend = null; setSt({ status: 'off', error: 'Нет связи с облаком' }); }
  }
  async function signIn() { if (!backend) await start(); if (!backend) throw new Error('Нет связи с облаком'); return backend.signIn(); }
  async function signOutNow() { if (backend) await backend.signOut(); }

  // ---------- строка «Синхронизация» для панелей настроек ----------
  function mountRow(host, compact) {
    if (!host) return; const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:14px;padding:' + (compact ? '12px 14px;border:1px solid var(--k-line);background:var(--k-surf);' : '13px 24px;border-bottom:1px solid var(--k-line);') + 'font-family:\'Noto Sans\',system-ui,sans-serif;color:var(--k-tx)';
    host.innerHTML = ''; host.appendChild(wrap);
    const btnCss = 'background:var(--k-surf);border:1px solid var(--k-line);padding:7px 12px;font:700 12.5px \'Noto Sans\',sans-serif;color:var(--k-tx);cursor:pointer;flex-shrink:0;';
    function paint() {
      const s = st, t = s.last ? new Date(s.last).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
      if (!s.user) wrap.innerHTML = '<div><b style="font-size:14px;font-weight:600;display:block">Синхронизация между устройствами</b><span style="font-size:12px;color:var(--k-mu);display:block;margin-top:2px;line-height:1.4">Войдите через Google — настройки, незавершённые партии, судоку, кроссворды и статистика будут на всех ваших устройствах.' + (s.error ? ' <span style="color:var(--k-rt)">' + s.error + '</span>' : '') + '</span></div><button data-a="in" style="' + btnCss + '">Войти</button>';
      else wrap.innerHTML = '<div><b style="font-size:14px;font-weight:600;display:block">☁ ' + (s.status === 'syncing' ? 'Синхронизация…' : s.status === 'error' ? 'Нет связи с облаком' : 'Синхронизировано' + (t ? ' в ' + t : '')) + '</b><span style="font-size:12px;color:var(--k-mu);display:block;margin-top:2px;line-height:1.4">Аккаунт: ' + String(s.user.name).replace(/[<>&]/g, '') + (s.status === 'error' ? '. Данные сохранены на этом устройстве и отправятся позже.' : '') + '</span></div><div style="display:flex;gap:6px;flex-shrink:0"><button data-a="now" style="' + btnCss + '">Сейчас</button><button data-a="out" style="' + btnCss + '">Выйти</button></div>';
      wrap.querySelectorAll('button').forEach((b) => { b.onclick = async () => { const a = b.dataset.a; b.disabled = true; try { if (a === 'in') await signIn(); else if (a === 'now') await syncNow(); else await signOutNow(); } catch (e) { setSt({ error: 'Не удалось: ' + (e && e.code || e.message || e) }); } b.disabled = false; }; });
    }
    const h = () => { if (!wrap.isConnected) { window.removeEventListener('pgsync-state', h); return; } paint(); }; window.addEventListener('pgsync-state', h); paint();
  }

  window.PGSync = { get state() { return Object.assign({}, st); }, signIn, signOut: signOutNow, syncNow, mountRow, start, REG, _merge: { history: mergeHistory, stats: mergeStats, ach: mergeAch }, _reconcile: reconcile };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 0)); else setTimeout(start, 0);
})();
