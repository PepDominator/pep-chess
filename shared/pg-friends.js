// ============ Друзья и вызовы на партию (общее меню, шахматы, шашки) ============
// Друзья хранятся в friends/{uid}/list/{friendUid}; приглашения и вызовы приходят в inbox/{uid}/items/{id}.
// Как и в синхронизации, у модуля есть подменяемый «бэкенд» (window.__pgfBackend) — для тестов без сети.
(function () {
  if (window.PGF) return;
  const SDK = 'https://www.gstatic.com/firebasejs/10.13.0/';
  const CFG = { apiKey: 'AIzaSyDpce_OyUUijQajza3tIKQjcTBzAtGbQrY', authDomain: 'pep-chess-2026.firebaseapp.com', projectId: 'pep-chess-2026', storageBucket: 'pep-chess-2026.firebasestorage.app', messagingSenderId: '170856560854', appId: '1:170856560854:web:d9b6b766cbd56780ecf177' };
  const STALE = 30 * 60 * 1000, GAME_NAME = { chess: 'шахматы', draughts: 'шашки' }, GAME_ICON = { chess: '♞', draughts: '⛀' };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let backend = null, user = null, friends = [], inbox = [], unsub = null, h2h = null, pendingChallenge = null;
  const emit = () => window.dispatchEvent(new Event('pgf-change'));
  // корень сайта: адрес без последнего «сегмента-игры»; учитывает вложенные адреса вроде /pep-chess/ (имя репозитория на GitHub Pages)
  const root = () => { let p = location.pathname.replace(/index\.html$/, '').replace(/\/(chess|draughts|sudoku|crossword|nonogram|sto|words|code)\/$/, '/'); if (!p.endsWith('/')) p += '/'; return location.origin + p; };

  // ---------- настоящий бэкенд на Firestore ----------
  async function firebaseBackend() {
    const [A, Au, F] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
    let app = null; for (let i = 0; i < 60 && !app; i++) { const apps = A.getApps(); if (apps.length) app = apps[0]; else await sleep(50); }
    if (!app) app = A.initializeApp(CFG);
    if (window.pgInitAppCheck) await window.pgInitAppCheck(app);      // защита от чужих скриптов (включается ключом reCAPTCHA)
    const auth = Au.getAuth(app), db = F.getFirestore(app), ms = (v) => (v && v.toMillis ? v.toMillis() : 0);
    return {
      onUser(cb) { Au.onAuthStateChanged(auth, (u) => cb(u && !u.isAnonymous ? { uid: u.uid, name: u.displayName || u.email || 'Игрок', photo: u.photoURL || null } : null)); },
      async profile(uid) { const s = await F.getDoc(F.doc(db, 'profiles', uid)); return s.exists() ? { uid, displayName: s.data().displayName || 'Игрок', photoURL: s.data().photoURL || null } : null; },
      async friends(uid) { const s = await F.getDocs(F.collection(db, 'friends', uid, 'list')); return s.docs.map((d) => ({ uid: d.id, name: d.data().name, photo: d.data().photo || null, at: ms(d.data().at) })); },
      async addFriend(uid, fid, data) { await F.setDoc(F.doc(db, 'friends', uid, 'list', fid), { name: String(data.name || 'Игрок').slice(0, 40), photo: data.photo || null, at: F.serverTimestamp() }); },
      async removeFriend(uid, fid) { await F.deleteDoc(F.doc(db, 'friends', uid, 'list', fid)); },
      inboxListen(uid, cb) { return F.onSnapshot(F.query(F.collection(db, 'inbox', uid, 'items'), F.orderBy('at', 'desc'), F.limit(10)), (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data(), at: ms(d.data().at) || Date.now() }))), () => cb([])); },
      async inboxSend(toUid, id, data) { await F.setDoc(F.doc(db, 'inbox', toUid, 'items', id), { ...data, at: F.serverTimestamp() }); },
      async inboxDelete(uid, id) { await F.deleteDoc(F.doc(db, 'inbox', uid, 'items', id)); },
      async myGames(uid, game) { const col = game === 'chess' ? 'playerGames' : 'playerDraughts'; const s = await F.getDocs(F.query(F.collection(db, col, uid, 'games'), F.orderBy('finishedAt', 'desc'), F.limit(300))); return s.docs.map((d) => d.data()); }
    };
  }
  const getBackend = async () => backend || (backend = window.__pgfBackend || await firebaseBackend());

  // ---------- стили ----------
  const css = `
.pgf-btn { background:none; border:none; font:inherit; font-size:20px; line-height:1; color:var(--k-mu2); cursor:pointer; padding:4px 8px; font-size:14px; font-weight:600; } .pgf-btn:hover { color:var(--k-tx); background:var(--k-hover); }
.pgf-ov { position:fixed; inset:0; z-index:420; background:rgba(42,46,36,.4); display:flex; align-items:center; justify-content:center; padding:14px; font-family:'Noto Sans',system-ui,sans-serif; }
.pgf-panel { position:relative; background:var(--k-panel); border:1px solid var(--k-line); width:100%; max-width:480px; max-height:calc(100dvh - 28px); overflow-y:auto; box-shadow:0 30px 80px rgba(42,46,36,.3); color:var(--k-tx); padding:22px 22px 20px; }
.pgf-panel h3 { margin:0 0 4px; font:italic 400 26px Georgia,'Times New Roman',serif; } .pgf-panel .pgf-sub { font-size:13px; color:var(--k-mu); margin:0 0 14px; line-height:1.45; }
.pgf-x { position:absolute; top:10px; right:12px; background:none; border:none; font-size:18px; color:var(--k-mu2); cursor:pointer; }
.pgf-box { background:var(--k-surf); border:1px solid var(--k-line); padding:12px; margin:0 0 14px; } .pgf-box b { display:block; font-size:13px; margin-bottom:6px; }
.pgf-link { display:flex; gap:6px; } .pgf-link input { flex:1; min-width:0; background:var(--k-panel); border:1px solid var(--k-line); padding:8px 9px; font:12px 'Roboto Mono',monospace; color:var(--k-tx); }
.pgf-b { background:var(--k-acc); color:#fff; border:none; padding:8px 12px; font:700 13px inherit; cursor:pointer; white-space:nowrap; } .pgf-b.alt { background:var(--k-surf); color:var(--k-tx); border:1px solid var(--k-line); } .pgf-b.sm { padding:6px 10px; font-size:12px; }
.pgf-h { font-size:13px; font-weight:700; margin:16px 0 8px; display:flex; justify-content:space-between; align-items:center; }
.pgf-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--k-line); } .pgf-row:last-child { border-bottom:none; }
.pgf-av { width:34px; height:34px; border-radius:50%; background:var(--k-line2); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; overflow:hidden; flex-shrink:0; } .pgf-av img { width:100%; height:100%; object-fit:cover; }
.pgf-who { flex:1; min-width:0; } .pgf-who b { display:block; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .pgf-who span { display:block; font-size:12px; color:var(--k-mu); margin-top:1px; }
.pgf-acts { display:flex; gap:6px; flex-shrink:0; }
@media (max-width:520px) { .pgf-row { flex-wrap:wrap; } .pgf-who { flex:1 1 calc(100% - 50px); } .pgf-acts { width:100%; padding-left:44px; } .pgf-panel { padding:20px 16px 16px; } } .pgf-empty { font-size:13px; color:var(--k-mu); padding:6px 0 2px; line-height:1.5; }
#pgf-toasts { position:fixed; right:12px; bottom:12px; z-index:430; display:flex; flex-direction:column; gap:8px; max-width:calc(100vw - 24px); width:340px; font-family:'Noto Sans',system-ui,sans-serif; }
.pgf-toast { background:#2F3A56; color:#fff; padding:12px 14px; box-shadow:0 12px 34px rgba(0,0,0,.35); font-size:13.5px; line-height:1.4; } .pgf-toast b { font-weight:700; } .pgf-toast .pgf-acts { margin-top:9px; } .pgf-toast .pgf-b { background:var(--k-acc); } .pgf-toast .pgf-b.alt { background:transparent; color:#fff; border:1px solid rgba(255,255,255,.4); }
#pgf-challenge { position:fixed; left:50%; top:10px; transform:translateX(-50%); z-index:430; background:#C49A36; color:var(--k-tx); padding:9px 12px; font:600 13px 'Noto Sans',system-ui,sans-serif; box-shadow:0 8px 24px rgba(0,0,0,.3); max-width:calc(100vw - 20px); display:flex; gap:10px; align-items:center; } #pgf-challenge button { background:rgba(0,0,0,.15); border:none; padding:4px 9px; font:700 12px inherit; cursor:pointer; color:inherit; }`;
  const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  // ---------- состояние ----------
  async function loadFriends() { try { friends = (await backend.friends(user.uid)).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru')); } catch (e) { friends = []; } emit(); }
  function onInbox(items) { inbox = (items || []).filter((x) => x && x.from && x.from !== (user && user.uid)); renderToasts(); }
  async function start() {
    try { const b = await getBackend(); b.onUser(async (u) => { user = u; h2h = null; if (unsub) { try { unsub(); } catch (e) {} unsub = null; } if (!u) { friends = []; inbox = []; renderToasts(); emit(); return; } await loadFriends(); unsub = b.inboxListen(u.uid, onInbox); window.dispatchEvent(new Event('pgf-user')); }); } catch (e) { console.warn('Друзья недоступны:', e); }
  }

  // ---------- уведомления о вызовах ----------
  function toastBox() { let b = document.getElementById('pgf-toasts'); if (!b) { b = document.createElement('div'); b.id = 'pgf-toasts'; document.body.appendChild(b); } return b; }
  function dropItem(it) { if (user) backend.inboxDelete(user.uid, it.id).catch(() => {}); }
  function renderToasts() {
    if (!document.body) return; const box = toastBox(); box.innerHTML = '';
    inbox.forEach((it) => {
      const old = it.type === 'challenge' && Date.now() - (it.at || 0) > STALE; if (old) { dropItem(it); return; }
      const t = document.createElement('div'); t.className = 'pgf-toast'; t.dataset.id = it.id; const who = '<b>' + esc(it.name || 'Игрок') + '</b>';
      if (it.type === 'challenge') {
        t.innerHTML = `${who} вызывает вас на партию в ${GAME_NAME[it.game] || 'игру'} ${GAME_ICON[it.game] || ''}<div class="pgf-acts"><button class="pgf-b sm" data-a="ok">Принять</button><button class="pgf-b sm alt" data-a="no">Не сейчас</button></div>`;
        t.querySelector('[data-a=ok]').onclick = () => { dropItem(it); location.href = root() + (it.game === 'draughts' ? 'draughts/' : 'chess/') + '?game=' + encodeURIComponent(it.gameId); };
      } else {
        const already = friends.some((f) => f.uid === it.from);
        t.innerHTML = `${who} добавил(а) вас в друзья${already ? '' : '<div class="pgf-acts"><button class="pgf-b sm" data-a="ok">Добавить в ответ</button><button class="pgf-b sm alt" data-a="no">Скрыть</button></div>'}`;
        if (already) { dropItem(it); return; }
        t.querySelector('[data-a=ok]').onclick = async () => { await addFriend(it.from, { name: it.name, photo: null }, true); dropItem(it); };
      }
      t.querySelector('[data-a=no]').onclick = () => { dropItem(it); };
      box.appendChild(t);
    });
  }

  // ---------- действия ----------
  async function addFriend(fid, info, silent) {
    if (!user || fid === user.uid) return false; let prof = null; try { prof = await backend.profile(fid); } catch (e) {}
    const name = (prof && prof.displayName) || info.name || 'Игрок', photo = (prof && prof.photoURL) || info.photo || null;
    await backend.addFriend(user.uid, fid, { name, photo }); await loadFriends(); if (window.PGA) PGA.event('friend');
    if (!silent) { try { await backend.inboxSend(fid, 'f_' + user.uid, { type: 'friend', from: user.uid, name: user.name }); } catch (e) { console.warn('Уведомление другу не доставлено', e); } }
    return true;
  }
  async function removeFriend(fid) { await backend.removeFriend(user.uid, fid); await loadFriends(); }
  async function sendChallenge(toUid, game, gameId) {
    const id = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    await backend.inboxSend(toUid, id, { type: 'challenge', from: user.uid, name: user.name, game, gameId }); if (window.PGA) PGA.event('challenge'); return id;
  }
  const inviteLink = () => user ? root() + '?friend=' + encodeURIComponent(user.uid) + '&n=' + encodeURIComponent(user.name || '') : '';

  // счётчики «я — друг» по записям моих онлайн-партий: у новых записей есть oppUid
  async function loadH2H() {
    if (h2h) return h2h; h2h = {};
    for (const game of ['chess', 'draughts']) {
      let list = []; try { list = await backend.myGames(user.uid, game); } catch (e) {}
      list.forEach((g) => { if (!g.oppUid) return; const r = h2h[g.oppUid] = h2h[g.oppUid] || { chess: { w: 0, d: 0, l: 0 }, draughts: { w: 0, d: 0, l: 0 } }; const s = r[game]; if (g.result === 'win') s.w++; else if (g.result === 'loss') s.l++; else if (g.result === 'draw') s.d++; });
    }
    return h2h;
  }
  function h2hText(r) {
    if (!r) return 'Партий друг с другом пока нет';
    const parts = ['chess', 'draughts'].filter((g) => r[g].w + r[g].d + r[g].l > 0).map((g) => `${GAME_ICON[g]} ${r[g].w}–${r[g].d}–${r[g].l}`);
    return parts.length ? 'Счёт: ' + parts.join(' · ') : 'Партий друг с другом пока нет';
  }

  // ---------- окно «Друзья» ----------
  const avatar = (n, p) => `<span class="pgf-av">${p ? `<img src="${esc(p)}" alt="" referrerpolicy="no-referrer">` : esc((n || '?').trim().charAt(0).toUpperCase() || '?')}</span>`;
  async function openFriends() {
    if (document.getElementById('pgf-ov')) return; const ov = document.createElement('div'); ov.className = 'pgf-ov'; ov.id = 'pgf-ov';
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); window.removeEventListener('pgf-change', paint); }; const onKey = (e) => { if (e.key === 'Escape') close(); };
    function paint() {
      const p = ov.querySelector('.pgf-panel'), top = p ? p.scrollTop : 0;
      if (!user) { ov.innerHTML = '<div class="pgf-panel"><button class="pgf-x" aria-label="Закрыть">✕</button><h3>Друзья</h3><p class="pgf-sub">Войдите через Google, чтобы добавлять друзей по ссылке, вызывать их на партию и видеть общий счёт.</p><button class="pgf-b" id="pgf-signin">Войти через Google</button></div>'; ov.querySelector('#pgf-signin').onclick = () => { const b = document.getElementById('acc-in'); if (b) b.click(); close(); }; }
      else {
        ov.innerHTML = `<div class="pgf-panel"><button class="pgf-x" aria-label="Закрыть">✕</button><h3>Друзья</h3><p class="pgf-sub">Отправьте другу свою ссылку. Когда он её откроет и добавит вас, вы окажетесь в списках друг у друга и сможете вызывать друг друга на партии.</p>
          <div class="pgf-box"><b>Ваша ссылка-приглашение</b><div class="pgf-link"><input id="pgf-link" readonly value="${esc(inviteLink())}"><button class="pgf-b" id="pgf-copy">Копировать</button>${navigator.share ? '<button class="pgf-b alt" id="pgf-share">Отправить</button>' : ''}</div></div>
          <div class="pgf-h"><span>Мои друзья · ${friends.length}</span><span style="font-weight:400;font-size:11.5px;color:var(--k-mu)">счёт: победы–ничьи–поражения</span></div><div id="pgf-list"></div></div>`;
        const list = ov.querySelector('#pgf-list');
        if (!friends.length) list.innerHTML = '<div class="pgf-empty">Пока никого. Скопируйте ссылку выше и отправьте другу, а ещё можно открыть ссылку друга: она сама предложит добавить его.</div>';
        friends.forEach((f) => {
          const row = document.createElement('div'); row.className = 'pgf-row'; row.dataset.uid = f.uid;
          row.innerHTML = `${avatar(f.name, f.photo)}<span class="pgf-who"><b>${esc(f.name)}</b><span class="pgf-h2h">${h2h ? esc(h2hText(h2h[f.uid])) : '…'}</span></span><span class="pgf-acts"><button class="pgf-b sm" data-g="chess" title="Вызвать на партию в шахматы">♞ Вызвать</button><button class="pgf-b sm" data-g="draughts" title="Вызвать на партию в шашки">⛀ Вызвать</button><button class="pgf-b sm alt" data-rm="1" title="Убрать из друзей">✕</button></span>`;
          row.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => { location.href = root() + b.dataset.g + '/?challenge=' + encodeURIComponent(f.uid) + '&cn=' + encodeURIComponent(f.name || ''); }; });
          row.querySelector('[data-rm]').onclick = async () => { if (confirm('Убрать «' + f.name + '» из друзей?')) await removeFriend(f.uid); };
          list.appendChild(row);
        });
        const copy = ov.querySelector('#pgf-copy'); if (copy) copy.onclick = async () => { const inp = ov.querySelector('#pgf-link'); try { await navigator.clipboard.writeText(inp.value); } catch (e) { inp.select(); document.execCommand && document.execCommand('copy'); } copy.textContent = 'Скопировано ✓'; setTimeout(() => { copy.textContent = 'Копировать'; }, 1600); };
        const sh = ov.querySelector('#pgf-share'); if (sh) sh.onclick = () => navigator.share({ title: 'Pep Games', text: 'Добавь меня в друзья в Pep Games', url: inviteLink() }).catch(() => {});
      }
      ov.querySelector('.pgf-x').onclick = close; const np = ov.querySelector('.pgf-panel'); if (np) np.scrollTop = top;
    }
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); }); document.addEventListener('keydown', onKey); window.addEventListener('pgf-change', paint); document.body.appendChild(ov); paint();
    if (user) { try { await loadH2H(); } catch (e) {} paint(); }
  }

  // ---------- ссылка «добавь меня в друзья» (общее меню) ----------
  async function handleFriendLink() {
    const q = new URLSearchParams(location.search), fid = q.get('friend'); if (!fid) return; const nm = q.get('n') || 'Игрок';
    const strip = () => { try { history.replaceState(null, '', location.pathname); } catch (e) {} };
    const ov = document.createElement('div'); ov.className = 'pgf-ov'; ov.id = 'pgf-friend-ov'; document.body.appendChild(ov);
    const close = () => { ov.remove(); strip(); };
    async function paint() {
      if (!user) { ov.innerHTML = `<div class="pgf-panel"><button class="pgf-x">✕</button><h3>Приглашение в друзья</h3><p class="pgf-sub">${esc(nm)} зовёт вас в друзья в Pep Games. Войдите через Google, чтобы принять приглашение.</p><button class="pgf-b" id="pgf-signin2">Войти через Google</button></div>`; ov.querySelector('#pgf-signin2').onclick = () => { const b = document.getElementById('acc-in'); if (b) b.click(); }; ov.querySelector('.pgf-x').onclick = close; return; }
      if (fid === user.uid) { ov.innerHTML = '<div class="pgf-panel"><button class="pgf-x">✕</button><h3>Это ваша ссылка</h3><p class="pgf-sub">Отправьте её другу, а не открывайте самому.</p><button class="pgf-b" id="pgf-ok">Понятно</button></div>'; ov.querySelector('#pgf-ok').onclick = close; ov.querySelector('.pgf-x').onclick = close; return; }
      let prof = null; try { prof = await backend.profile(fid); } catch (e) {} const name = (prof && prof.displayName) || nm, photo = prof && prof.photoURL; const already = friends.some((f) => f.uid === fid);
      ov.innerHTML = `<div class="pgf-panel"><button class="pgf-x">✕</button><h3>${already ? 'Вы уже друзья' : 'Добавить в друзья?'}</h3><div class="pgf-row" style="border:none">${avatar(name, photo)}<span class="pgf-who"><b>${esc(name)}</b><span>${already ? 'Уже в вашем списке' : 'Сможете вызывать друг друга на партии'}</span></span></div>${already ? '' : '<div class="pgf-acts" style="margin-top:12px"><button class="pgf-b" id="pgf-yes">Добавить</button><button class="pgf-b alt" id="pgf-no">Не сейчас</button></div>'}</div>`;
      ov.querySelector('.pgf-x').onclick = close; const no = ov.querySelector('#pgf-no'); if (no) no.onclick = close;
      const yes = ov.querySelector('#pgf-yes'); if (yes) yes.onclick = async () => { yes.disabled = true; try { await addFriend(fid, { name, photo }, false); strip(); ov.innerHTML = `<div class="pgf-panel"><button class="pgf-x">✕</button><h3>Готово</h3><p class="pgf-sub">${esc(name)} теперь в ваших друзьях. Ему отправлено уведомление, он сможет добавить вас в ответ.</p><button class="pgf-b" id="pgf-done">Хорошо</button></div>`; ov.querySelector('#pgf-done').onclick = close; ov.querySelector('.pgf-x').onclick = close; } catch (e) { yes.disabled = false; alert('Не удалось добавить друга. Проверьте интернет и попробуйте ещё раз.'); } };
    }
    window.addEventListener('pgf-user', () => { if (document.body.contains(ov)) paint(); }); paint();
  }

  // ---------- вызов друга из игры: страница игры открыта по ссылке ?challenge=<uid> ----------
  function challengeInit(game) {
    const q = new URLSearchParams(location.search), to = q.get('challenge'); if (!to) return; const nm = q.get('cn') || 'другу';
    pendingChallenge = { to, name: nm, game };
    const bar = document.createElement('div'); bar.id = 'pgf-challenge'; bar.innerHTML = `<span>Вызов для «${esc(nm)}»: выберите «Играть по сети», задайте время и создайте игру — приглашение придёт автоматически.</span><button type="button">Отмена</button>`; document.body.appendChild(bar);
    const cancel = () => { pendingChallenge = null; bar.remove(); try { history.replaceState(null, '', location.pathname); } catch (e) {} }; bar.querySelector('button').onclick = cancel;
    const objName = game === 'chess' ? 'OnlineChess' : 'OnlineDraughts';
    (async function hook() {
      for (let i = 0; i < 200; i++) { const o = window[objName]; if (o && typeof o.createGame === 'function') {
        const orig = o.createGame.bind(o);
        o.createGame = async function () {
          const id = await orig.apply(null, arguments);
          if (pendingChallenge && id) { const pc = pendingChallenge; pendingChallenge = null; bar.remove(); try { await getBackend(); await sendChallenge(pc.to, pc.game, id); window.dispatchEvent(new CustomEvent('pgf-challenge-sent', { detail: { to: pc.to, gameId: id } })); toast('Вызов отправлен: «' + pc.name + '» увидит приглашение на любой странице Pep Games.'); } catch (e) { console.warn('Вызов не доставлен', e); toast('Друг пока не добавил вас в свой список, приглашение не доставлено. Отправьте ему ссылку на партию вручную.'); } }
          return id;
        }; return; } await sleep(100); }
    })();
  }
  function toast(text) { const b = toastBox(), t = document.createElement('div'); t.className = 'pgf-toast'; t.textContent = text; b.appendChild(t); setTimeout(() => t.remove(), 7000); }

  window.PGF = { start, open: openFriends, handleFriendLink, challengeInit, sendChallenge, addFriend, removeFriend, inviteLink, h2hText, get user() { return user; }, get friends() { return friends; }, get inbox() { return inbox; }, _toast: toast };
  const boot = () => { start(); const btn = document.getElementById('pgf-btn'); if (btn) btn.onclick = openFriends; if (document.getElementById('acc-in')) handleFriendLink(); const g = /\/(chess|draughts)\//.test(location.pathname) ? RegExp.$1 : null; if (g) challengeInit(g); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
