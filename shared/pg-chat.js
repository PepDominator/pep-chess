// ============ чат в онлайн-партии: быстрые реплики и короткие сообщения ============
// Встраивается в боковую панель партии: над списком ходов появляется строка «💬 Чат», а при открытии чат занимает место списка ходов.
(function () {
  if (window.PGChat) return;
  const QUICK = ['Удачи!', 'Хорошая игра', 'Спасибо', 'Ничья?', 'Ой, зевнул', '👍'];
  let cfg = null, unsub = null, msgs = [], open = false, unread = 0, lastSent = 0, first = true, bar = null, panel = null, styled = false;
  const css = `
#pgc-bar { display:flex; justify-content:flex-end; padding:5px 12px; background:var(--k-surf); border-top:1px solid var(--k-line); border-bottom:1px solid var(--k-line); flex-shrink:0; }
#pgc-toggle { position:relative; background:var(--k-panel); border:1px solid var(--k-line); padding:5px 12px; font:600 13px 'Noto Sans',system-ui,sans-serif; color:var(--k-tx); cursor:pointer; } #pgc-toggle:hover { background:var(--k-hover); }
#pgc-toggle.on { background:var(--k-acc); color:#fff; border-color:var(--k-acc); }
#pgc-badge { display:none; margin-left:6px; min-width:18px; padding:0 5px; background:#A23B33; color:#fff; font:700 11px/18px 'Noto Sans',sans-serif; text-align:center; }
#pgc-panel { display:none; flex:1 1 auto; min-height:150px; flex-direction:column; background:var(--k-panel); font-family:'Noto Sans',system-ui,sans-serif; color:var(--k-tx); overflow:hidden; }
#pgc-list { flex:1 1 auto; min-height:60px; padding:10px 12px; overflow-y:auto; display:flex; flex-direction:column; gap:7px; background:var(--k-surf); }
.pgc-empty { margin:auto; color:var(--k-mu2); font-size:12.5px; text-align:center; line-height:1.5; }
.pgc-m { max-width:86%; padding:6px 10px; font-size:14px; line-height:1.4; word-break:break-word; background:var(--k-panel); border:1px solid var(--k-hover); align-self:flex-start; }
.pgc-m.me { align-self:flex-end; background:var(--k-hover); border-color:var(--k-line2); } .pgc-m small { display:block; font-size:11px; color:var(--k-mu2); margin-bottom:1px; }
#pgc-quick { display:flex; flex-wrap:wrap; gap:6px; padding:8px 12px 2px; flex-shrink:0; }
#pgc-quick button { background:var(--k-surf); border:1px solid var(--k-line); padding:5px 9px; font:600 12.5px 'Noto Sans',sans-serif; color:var(--k-tx); cursor:pointer; } #pgc-quick button:hover { background:var(--k-hover); }
#pgc-form { display:flex; gap:6px; padding:8px 12px 10px; flex-shrink:0; } #pgc-in { flex:1; min-width:0; background:var(--k-surf); border:1px solid var(--k-line); padding:8px 10px; font:14px 'Noto Sans',sans-serif; color:var(--k-tx); }
#pgc-in:focus { outline:none; border-color:var(--k-acc); } #pgc-send { background:var(--k-acc); color:#fff; border:none; padding:0 14px; font:700 13px 'Noto Sans',sans-serif; cursor:pointer; }
#pgc-err { padding:0 12px 6px; font-size:12px; color:var(--k-rt); display:none; flex-shrink:0; }`;
  const $id = (id) => document.getElementById(id);
  const enabled = () => !window.PGS || window.PGS.get().chat !== false;
  function build() {
    if (!styled) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); styled = true; }
    const list = cfg.listEl(); if (!list || !list.parentNode) return false;
    bar = document.createElement('div'); bar.id = 'pgc-bar'; bar.innerHTML = '<button id="pgc-toggle" type="button" title="Чат с соперником">💬 Чат<span id="pgc-badge"></span></button>';
    panel = document.createElement('div'); panel.id = 'pgc-panel';
    panel.innerHTML = '<div id="pgc-list"></div><div id="pgc-quick"></div><div id="pgc-err"></div><form id="pgc-form" onsubmit="return false"><input id="pgc-in" maxlength="200" placeholder="Сообщение…" autocomplete="off"><button id="pgc-send" type="button">→</button></form>';
    list.parentNode.insertBefore(bar, list); list.parentNode.insertBefore(panel, list.nextSibling);
    $id('pgc-toggle').onclick = () => toggle(!open); $id('pgc-send').onclick = () => send($id('pgc-in').value);
    $id('pgc-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send($id('pgc-in').value); } });
    QUICK.forEach((q) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = q; b.onclick = () => send(q); $id('pgc-quick').appendChild(b); });
    return true;
  }
  function destroy() { const l = cfg && cfg.listEl && cfg.listEl(); if (l) l.style.display = ''; if (bar) bar.remove(); if (panel) panel.remove(); bar = panel = null; }
  function toggle(v) {
    open = !!v && enabled(); if (!panel) return; const l = cfg.listEl();
    panel.style.display = open ? 'flex' : 'none'; if (l) l.style.display = open ? 'none' : ''; $id('pgc-toggle').classList.toggle('on', open);
    if (open) { unread = 0; render(); $id('pgc-in').focus(); } badge();
  }
  function badge() { const b = $id('pgc-badge'); if (!b) return; b.style.display = unread > 0 ? 'inline-block' : 'none'; b.textContent = unread > 9 ? '9+' : String(unread); }
  function showBar() { if (!bar) return; const on = !!cfg && enabled(); bar.style.display = on ? 'flex' : 'none'; if (!on && open) toggle(false); }
  function render() {
    const list = $id('pgc-list'); if (!list) return; list.innerHTML = '';
    if (!msgs.length) { const e = document.createElement('div'); e.className = 'pgc-empty'; e.textContent = 'Сообщений пока нет. Поздоровайтесь или выберите быструю реплику.'; list.appendChild(e); return; }
    const me = cfg && cfg.myUid();
    msgs.forEach((m) => {
      const d = document.createElement('div'); d.className = 'pgc-m' + (m.uid === me ? ' me' : '');
      if (m.uid !== me) { const s = document.createElement('small'); s.textContent = m.name || 'Соперник'; d.appendChild(s); }
      d.appendChild(document.createTextNode(m.text)); list.appendChild(d);
    });
    list.scrollTop = list.scrollHeight;
  }
  function showErr(t) { const e = $id('pgc-err'); if (!e) return; e.textContent = t || ''; e.style.display = t ? 'block' : 'none'; if (t) setTimeout(() => showErr(''), 3500); }
  async function send(raw) {
    const text = String(raw || '').trim().slice(0, 200); if (!text || !cfg) return;
    const now = Date.now(); if (now - lastSent < 1200) { showErr('Слишком быстро — подождите секунду.'); return; }
    lastSent = now; $id('pgc-in').value = '';
    try { await cfg.api.sendChat(cfg.id, { text, name: cfg.myName() }); } catch (e) { console.error(e); showErr('Не отправлено: ' + (e.code || e.message || 'ошибка')); }
  }
  function onMessages(list) {
    const me = cfg && cfg.myUid(), known = new Set(msgs.map((m) => m.id));
    const fresh = first ? [] : list.filter((m) => !known.has(m.id) && m.uid !== me); first = false; msgs = list;
    if (!enabled()) return;
    if (!open) { unread += fresh.length; badge(); } else render();
  }
  window.PGChat = {
    // cfg: { id, api: {watchChat, sendChat}, myUid(), myName(), listEl() — элемент со списком ходов, рядом с которым встраивается чат }
    attach(c) {
      this.detach(); if (!c.api || !c.api.watchChat || !c.listEl) return; cfg = c; msgs = []; unread = 0; first = true; open = false;
      if (!build()) { cfg = null; return; } render(); badge(); showBar(); unsub = c.api.watchChat(c.id, onMessages);
    },
    detach() { if (unsub) { try { unsub(); } catch (e) {} unsub = null; } destroy(); cfg = null; msgs = []; unread = 0; open = false; },
    get messages() { return msgs; }, get unread() { return unread; }
  };
  window.addEventListener('pgs-change', showBar); window.addEventListener('storage', (e) => { if (e.key === 'pgSettings') showBar(); });
})();
