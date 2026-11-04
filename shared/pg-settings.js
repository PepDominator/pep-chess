// ============ Общие настройки Pep Games (одни и те же во всех трёх страницах: общее меню, шахматы, шашки) ============
(function () {
  if (window.PGS) return;
  const KEY = 'pgSettings';
  const THEMES = {
    classic: { n: 'Классика', l: '#F6F4EB', d: '#C7CAB4' },
    green: { n: 'Зелёная', l: '#EEEED2', d: '#769656' },
    blue: { n: 'Голубая', l: '#DEE3E6', d: '#8CA2AD' },
    wood: { n: 'Дерево', l: '#F0D9B5', d: '#B58863' },
    marble: { n: 'Мрамор', l: '#EEEDE8', d: '#A9A79F' },
    coral: { n: 'Коралл', l: '#F4E1D2', d: '#C97C63' },
    night: { n: 'Синяя ночь', l: '#C9D3E6', d: '#51628A' }
  };
  const DEFAULTS = { sound: true, music: false, musicVol: 0.5, confirm: false, board: 'classic', nums: true, chat: true, showGames: true, theme: 'auto', palLight: 'paper', palDark: 'night', vibro: true, seasonal: true };
  function get() { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULTS); } }
  // Тема оформления: светлая, тёмная или как в системе
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const isDark = (th) => th === 'dark' || ((th || 'auto') === 'auto' && !!(mq && mq.matches));
  // палитры оформления: у светлой и у тёмной темы — свои
  const PAL_LIGHT = [['paper', 'Бумага', '#EEF0E7', '#3B5D4A'], ['sepia', 'Сепия', '#EFE6D4', '#8A5A2B'], ['sea', 'Море', '#E4EDF0', '#1D6A7A'], ['pine', 'Хвоя', '#D6E3D2', '#24543A'], ['contrast', 'Контрастная', '#FFFFFF', '#000000']];
  const PAL_DARK = [['night', 'Ночь', '#131815', '#8CC3A0'], ['studio', 'Ночная студия', '#111A2E', '#E9C46A']];
  const PAL_BG = {}; PAL_LIGHT.concat(PAL_DARK).forEach(([k, , bg]) => { PAL_BG[k] = bg; });
  function applyTheme() {
    const s = get(), dark = isDark(s.theme), r = document.documentElement; r.dataset.theme = dark ? 'dark' : 'light'; r.dataset.pal = dark ? (s.palDark || 'night') : (s.palLight || 'paper');
    let m = document.querySelector('meta[name="theme-color"]'); if (!m && document.head) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); } if (m) m.content = PAL_BG[r.dataset.pal] || (dark ? '#131815' : '#EEF0E7');
  }
  if (mq) { const h = () => applyTheme(); if (mq.addEventListener) mq.addEventListener('change', h); else if (mq.addListener) mq.addListener(h); }
  function apply() {
    const s = get(), t = THEMES[s.board] || THEMES.classic, r = document.documentElement;
    r.style.setProperty('--sq-light', t.l); r.style.setProperty('--sq-dark', t.d); r.classList.toggle('no-nums', !s.nums); applyTheme();
  }
  function set(patch) { const v = Object.assign(get(), patch); try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} apply(); window.dispatchEvent(new Event('pgs-change')); return v; }
  // ---------- Установка как приложение («Добавить на главный экран») ----------
  const INST = 'pgInstall', UA = navigator.userAgent || '';
  const iSt = () => { try { return JSON.parse(localStorage.getItem(INST) || '{}') || {}; } catch (e) { return {}; } }, iSave = (o) => { try { localStorage.setItem(INST, JSON.stringify(o)); } catch (e) {} };
  const isStandalone = () => { try { return (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) || window.navigator.standalone === true; } catch (e) { return false; } };
  const isIOS = () => /iphone|ipad|ipod/i.test(UA) || (/Macintosh/i.test(UA) && navigator.maxTouchPoints > 1);
  const isAndroid = () => /android/i.test(UA), isFirefox = () => /firefox|fxios/i.test(UA) && !isIOS();
  let deferredPrompt = null; const instEmit = () => window.dispatchEvent(new Event('pg-install-ready'));
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; instEmit(); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; const o = iSt(); o.installed = true; iSave(o); const b = document.getElementById('pgi-banner'); if (b) b.remove(); instEmit(); });
  (function countVisit() { const o = iSt(), today = new Date().toISOString().slice(0, 10); if (o.lastDay !== today) { o.lastDay = today; o.visits = (o.visits || 0) + 1; iSave(o); } })();
  const installed = () => isStandalone() || !!iSt().installed;
  async function doInstall() { if (!deferredPrompt) return 'none'; const e = deferredPrompt; deferredPrompt = null; try { e.prompt(); const r = await e.userChoice; if (r && r.outcome === 'accepted') { const o = iSt(); o.installed = true; iSave(o); } instEmit(); return (r && r.outcome) || 'dismissed'; } catch (err) { return 'error'; } }
  function showInstallHelp() {
    if (document.getElementById('pgi-ov')) return; const ov = document.createElement('div'); ov.className = 'pgi-ov'; ov.id = 'pgi-ov'; let steps, note = 'Приложение запускается с главного экрана на весь экран и открывается без интернета.';
    if (isIOS()) { steps = ['Откройте сайт в <b>Safari</b> (в других браузерах на iPhone значок может выглядеть иначе).', 'Нажмите <b>«Поделиться»</b> — квадрат со стрелкой вверх внизу экрана.', 'Прокрутите список и выберите <b>«На экран “Домой”»</b>.', 'Нажмите <b>«Добавить»</b>: значок Pep Games появится на главном экране.']; }
    else if (isAndroid()) { steps = ['Нажмите <b>⋮</b> (меню браузера) в правом верхнем углу.', 'Выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b>.', 'Подтвердите — значок появится среди ваших приложений.']; }
    else if (isFirefox()) { steps = ['Firefox на компьютере не умеет ставить сайты как приложения.', 'Откройте Pep Games в <b>Chrome</b> или <b>Edge</b> и установите оттуда.']; note = 'А в Firefox на Android есть пункт «Установить» в меню ⋮.'; }
    else { steps = ['Найдите значок установки <b>⊕</b> справа в адресной строке браузера.', 'Или откройте меню <b>⋮</b> → <b>«Установить Pep Games…»</b> (в Edge: «Приложения» → «Установить этот сайт как приложение»).', 'Подтвердите — приложение появится в меню «Пуск» или на рабочем столе.']; }
    ov.innerHTML = `<div class="pgi-panel" role="dialog"><button class="pgi-x" aria-label="Закрыть">✕</button><h3>Установить как приложение</h3><ol class="pgi-steps">${steps.map((x) => `<li><span>${x}</span></li>`).join('')}</ol><div class="pgi-note">${note}</div></div>`;
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); }; const onKey = (e) => { if (e.key === 'Escape') close(); };
    ov.querySelector('.pgi-x').onclick = close; ov.addEventListener('click', (e) => { if (e.target === ov) close(); }); document.addEventListener('keydown', onKey); document.body.appendChild(ov);
  }
  function mountInstallRow(host) {
    if (!host) return; const draw = () => {
      if (installed()) { host.innerHTML = ''; return; }
      host.innerHTML = '<div class="pg-row" style="flex-wrap:wrap"><div><b>Установить как приложение</b><span class="d">Запуск с главного экрана, без адресной строки, работает без интернета</span></div><button type="button" class="pgi-btn" id="pgi-go">' + (deferredPrompt ? 'Установить' : 'Как установить') + '</button></div>';
      host.querySelector('#pgi-go').onclick = async () => { if (deferredPrompt) await doInstall(); else showInstallHelp(); };
    }; draw(); const h = () => { if (document.body.contains(host)) draw(); else window.removeEventListener('pg-install-ready', h); }; window.addEventListener('pg-install-ready', h);
  }
  // Ненавязчивое напоминание на главной: со второго дня визитов, повтор не чаще раза в 2 недели
  function maybeShowInstallBanner() {
    const o = iSt(); if (installed() || o.never || (o.snooze && Date.now() < o.snooze) || (o.visits || 0) < 2 || document.getElementById('pgi-banner')) return;
    if (!deferredPrompt && !isIOS()) return; const b = document.createElement('div'); b.id = 'pgi-banner';
    b.innerHTML = `<img src="icon-192.png?v=4" alt=""><div class="t"><b>Pep Games как приложение</b>Запуск с главного экрана, работает без интернета.</div><div class="a"><button type="button" class="pgi-btn" id="pgi-yes">${deferredPrompt ? 'Установить' : 'Как это сделать'}</button><button type="button" class="x" id="pgi-later">Не сейчас</button></div>`;
    document.body.appendChild(b);
    b.querySelector('#pgi-yes').onclick = async () => { if (deferredPrompt) { b.remove(); await doInstall(); } else { showInstallHelp(); } };
    b.querySelector('#pgi-later').onclick = () => { const s = iSt(); s.snooze = Date.now() + 14 * 86400000; s.dismissed = (s.dismissed || 0) + 1; if (s.dismissed >= 3) s.never = true; iSave(s); b.remove(); };
  }
  window.PGS = { get, set, apply, THEMES, isDark, install: { standalone: isStandalone, installed, canPrompt: () => !!deferredPrompt, prompt: doInstall, help: showInstallHelp, banner: maybeShowInstallBanner, mountRow: mountInstallRow } };
  const THEME_OPTS = [['light', 'Светлая'], ['dark', 'Тёмная'], ['auto', 'Как в системе']];
  // Строка выбора темы оформления; используется и в панели настроек, и в судоку с кроссвордами
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('pga-btn')) setTimeout(() => window.PGS.install.banner(), 2500); }); else if (document.getElementById('pga-btn')) setTimeout(() => window.PGS.install.banner(), 2500);
  window.PGS.mountThemeRow = function (host) {
    if (!host) return; const st = get(), cur = st.theme || 'auto';
    const sw = (list, key, val) => '<div class="pg-pals" role="group">' + list.map(([k, n, bg, ac]) => '<button type="button" data-' + key + '="' + k + '" class="' + (val === k ? 'on' : '') + '" title="' + n + '"><i style="background:' + bg + ';border-color:' + ac + '"><i style="background:' + ac + '"></i></i>' + n + '</button>').join('') + '</div>';
    host.innerHTML = '<div class="pg-row" style="flex-wrap:wrap"><div><b>Тема оформления</b><span class="d">Светлая, тёмная или как настроено в телефоне и компьютере</span></div><div class="pg-seg" role="group" aria-label="Тема оформления">' + THEME_OPTS.map(([k, n]) => '<button type="button" data-th="' + k + '" class="' + (cur === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div></div>'
      + '<div class="pg-row pg-palrow"><div><b>Светлое оформление</b>' + sw(PAL_LIGHT, 'pl', st.palLight || 'paper') + '</div></div>'
      + '<div class="pg-row pg-palrow"><div><b>Тёмное оформление</b>' + sw(PAL_DARK, 'pd', st.palDark || 'night') + '</div></div>';
    host.querySelectorAll('.pg-seg button').forEach((b) => { b.onclick = () => { set({ theme: b.dataset.th }); window.PGS.mountThemeRow(host); }; });
    host.querySelectorAll('[data-pl]').forEach((b) => { b.onclick = () => { const sysDark = isDark('auto'); set({ palLight: b.dataset.pl, theme: st.theme === 'auto' && !sysDark ? 'auto' : 'light' }); window.PGS.mountThemeRow(host); }; });
    host.querySelectorAll('[data-pd]').forEach((b) => { b.onclick = () => { const sysDark = isDark('auto'); set({ palDark: b.dataset.pd, theme: st.theme === 'auto' && sysDark ? 'auto' : 'dark' }); window.PGS.mountThemeRow(host); }; });
  };
  // Звук: одно место, через которое проходят все звуки приложения.
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { if (!get().sound) return Promise.resolve(); return origPlay.apply(this, arguments); };
  apply(); window.addEventListener('storage', (e) => { if (e.key === KEY) apply(); });
  window.addEventListener('pgsync-applied', (e) => { if (e.detail && e.detail.key === KEY) { apply(); window.dispatchEvent(new Event('pgs-change')); } });

  const css = `
.pg-gear { position:absolute; top:12px; right:14px; background:none; border:none; font-size:20px; line-height:1; color:var(--k-mu2); cursor:pointer; padding:4px 8px; z-index:3; font-family:inherit; }
.pg-gear:hover { color:var(--k-tx); background:var(--k-hover); } .pg-gear.static { position:static; }
.pg-ov { position:fixed; inset:0; z-index:400; background:rgba(42,46,36,.38); display:flex; align-items:center; justify-content:center; padding:16px; font-family:'Noto Sans',system-ui,sans-serif; }
.pg-panel { background:var(--k-panel); border:1px solid var(--k-line); width:100%; max-width:420px; max-height:calc(100dvh - 32px); overflow-y:auto; box-shadow:0 30px 80px rgba(42,46,36,.3); color:var(--k-tx); }
.pg-panel h3 { margin:0; padding:22px 24px 6px; font:italic 400 24px Georgia,'Times New Roman',serif; }
.pg-row { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:14px 24px; border-bottom:1px solid var(--k-line); }
.pg-row b { display:block; font-size:14px; font-weight:600; } .pg-row span.d { display:block; font-size:12px; color:var(--k-mu); margin-top:2px; line-height:1.4; }
.pg-sw { position:relative; width:44px; height:24px; flex-shrink:0; background:var(--k-line2); border:none; cursor:pointer; transition:background .15s; padding:0; }
.pg-sw::after { content:''; position:absolute; top:3px; left:3px; width:18px; height:18px; background:var(--k-panel); transition:transform .15s; }
.pg-sw.on { background:var(--k-acc); } .pg-sw.on::after { transform:translateX(20px); }
.pg-themes { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:6px 24px 16px; }
.pg-th { border:2px solid transparent; background:none; padding:4px; cursor:pointer; font:inherit; font-size:11.5px; color:var(--k-mu); text-align:center; }
.pg-th.on { border-color:var(--k-acc); color:var(--k-tx); font-weight:700; }
.pg-th i { display:block; aspect-ratio:1/1; margin-bottom:4px; box-shadow:0 0 0 1px rgba(42,46,36,.15); }
.pg-title2 { padding:14px 24px 0; font-size:14px; font-weight:600; }
.pgi-ov { position:fixed; inset:0; z-index:450; background:rgba(42,46,36,.45); display:flex; align-items:center; justify-content:center; padding:14px; font-family:'Noto Sans',system-ui,sans-serif; }
.pgi-panel { position:relative; background:var(--k-panel); border:1px solid var(--k-line); width:100%; max-width:440px; max-height:calc(100dvh - 28px); overflow-y:auto; color:var(--k-tx); padding:22px 20px 18px; box-shadow:0 30px 80px rgba(42,46,36,.3); }
.pgi-panel h3 { margin:0 0 10px; font:italic 400 24px Georgia,'Times New Roman',serif; } .pgi-x { position:absolute; top:10px; right:12px; background:none; border:none; font-size:18px; color:var(--k-mu2); cursor:pointer; }
.pgi-steps { margin:0; padding:0; list-style:none; counter-reset:s; } .pgi-steps li { counter-increment:s; display:flex; gap:11px; padding:9px 0; border-bottom:1px solid var(--k-line); font-size:14px; line-height:1.45; } .pgi-steps li:last-child { border-bottom:none; } .pgi-steps li::before { content:counter(s); flex-shrink:0; width:24px; height:24px; border-radius:50%; background:var(--k-acc); color:#fff; font:700 13px 'Noto Sans',sans-serif; display:flex; align-items:center; justify-content:center; }
.pgi-note { margin-top:10px; font-size:12px; color:var(--k-mu); line-height:1.45; } .pgi-btn { background:var(--k-acc); color:#fff; border:none; padding:9px 14px; font:700 13px 'Noto Sans',sans-serif; cursor:pointer; } .pgi-btn.alt { background:var(--k-surf); color:var(--k-tx); border:1px solid var(--k-line); }
#pgi-banner { position:fixed; left:50%; transform:translateX(-50%); bottom:14px; z-index:410; width:min(460px, calc(100vw - 24px)); background:var(--k-panel); border:1px solid var(--k-line); box-shadow:0 16px 44px rgba(42,46,36,.28); padding:12px 14px; display:flex; gap:12px; align-items:center; font-family:'Noto Sans',system-ui,sans-serif; color:var(--k-tx); animation:pgiIn .4s ease; } #pgi-banner img { width:46px; height:46px; border-radius:11px; flex-shrink:0; } #pgi-banner .t { flex:1; min-width:0; font-size:13px; line-height:1.4; color:var(--k-mu); } #pgi-banner .t b { display:block; font-size:14px; color:var(--k-tx); } #pgi-banner .a { display:flex; flex-direction:column; gap:5px; } #pgi-banner .x { background:none; border:none; font-size:12px; color:var(--k-mu2); cursor:pointer; padding:2px; }
@keyframes pgiIn { from { transform:translate(-50%,20px); opacity:0; } to { transform:translate(-50%,0); opacity:1; } }
.pg-palrow { padding-top:4px; } .pg-palrow > div { width:100%; } .pg-pals { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; } .pg-pals button { display:flex; align-items:center; gap:6px; border:1px solid var(--k-line); background:var(--k-surf); padding:6px 9px; font:600 12.5px 'Noto Sans',system-ui,sans-serif; color:var(--k-tx); cursor:pointer; } .pg-pals button.on { border-color:var(--k-acc); box-shadow:inset 0 0 0 1px var(--k-acc); background:var(--k-panel); } .pg-pals button > i { width:18px; height:18px; border:2px solid; display:inline-flex; align-items:center; justify-content:center; } .pg-pals button > i > i { width:8px; height:8px; display:block; }
.pg-seg { display:flex; width:100%; border:1px solid var(--k-line); } .pg-seg button { flex:1; background:var(--k-surf); border:none; border-right:1px solid var(--k-line); padding:8px 6px; font:600 12.5px 'Noto Sans',sans-serif; color:var(--k-mu); cursor:pointer; } .pg-seg button:last-child { border-right:none; } .pg-seg button.on { background:var(--k-acc); color:#fff; }
.pg-small { background:var(--k-surf); border:1px solid var(--k-line); padding:7px 12px; font:700 12.5px 'Noto Sans',sans-serif; color:var(--k-tx); cursor:pointer; flex-shrink:0; } .pg-small:hover { background:var(--k-hover); }
.pg-close { display:block; width:calc(100% - 48px); margin:18px 24px 22px; padding:12px; background:var(--k-acc); color:#fff; border:none; font:700 14px inherit; cursor:pointer; }
#pg-confirm { position:fixed; left:50%; bottom:18px; transform:translateX(-50%); z-index:350; display:none; align-items:center; gap:10px; background:#2F3A56; color:#fff; padding:10px 12px 10px 16px; box-shadow:0 10px 30px rgba(0,0,0,.35); font:600 14px 'Noto Sans',system-ui,sans-serif; max-width:calc(100vw - 20px); }
#pg-confirm button { border:none; padding:9px 14px; font:700 13px inherit; cursor:pointer; }
#pg-confirm .ok { background:var(--k-acc); color:#fff; } #pg-confirm .no { background:var(--k-hover); color:var(--k-tx); }
.snd-btn { background:none; border:none; font-size:15px; line-height:1; color:var(--k-mu); cursor:pointer; width:28px; height:28px; padding:0; border-radius:2px; } .snd-btn:hover { background:var(--k-hover); color:var(--k-tx); }
.pg-pending { box-shadow:inset 0 0 0 1000px rgba(47,58,86,.38) !important; }
.no-nums .sq .num { display:none !important; }`;
  const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  // ---- кнопка звука внутри партии: любая кнопка с классом snd-btn включает и выключает звук ----
  function paintSnd() { const on = get().sound; document.querySelectorAll('.snd-btn').forEach((b) => { b.textContent = on ? '🔊' : '🔇'; b.title = on ? 'Звук включён. Нажмите, чтобы выключить' : 'Звук выключен. Нажмите, чтобы включить'; b.setAttribute('aria-pressed', String(on)); }); }
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.snd-btn'); if (b) set({ sound: !get().sound }); });
  window.addEventListener('pgs-change', paintSnd); window.addEventListener('storage', (e) => { if (e.key === KEY) paintSnd(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintSnd); else paintSnd();

  // ---- панель «Настройки» ----
  window.openPgSettings = function () {
    if (document.getElementById('pg-ov')) return;
    const ov = document.createElement('div'); ov.className = 'pg-ov'; ov.id = 'pg-ov';
    const isDr = !!window.PG_DRAUGHTS;
    function paint() {
      const s = get();
      const sw = (k) => `<button class="pg-sw ${s[k] ? 'on' : ''}" data-k="${k}" role="switch" aria-checked="${s[k]}"></button>`;
      ov.innerHTML = `<div class="pg-panel" role="dialog" aria-modal="true"><h3>Настройки</h3>
        <div id="pg-theme-row"></div>
        <div id="pg-install-row"></div>
        <div class="pg-row"><div><b>Звук</b><span class="d">Звуки ходов, взятий и окончания партии</span></div>${sw('sound')}</div>
        <div class="pg-row"><div><b>Вибрация</b><span class="d">Лёгкий отклик телефона на верный ответ, промах и победу</span></div>${sw('vibro')}</div>
        <div class="pg-row"><div><b>Сезонное оформление</b><span class="d">Снежинки зимой, листья осенью, лепестки весной на главной</span></div>${sw('seasonal')}</div>
        <div class="pg-row"><div><b>Фоновая музыка</b><span class="d">Спокойная мелодия, которая сочиняется прямо в браузере; в каждой игре — своё настроение</span></div>${sw('music')}</div>
        <div class="pg-row"><div><b>Подтверждать ход</b><span class="d">После хода появляется кнопка «Подтвердить» — удобно на телефоне, чтобы не ходить случайно</span></div>${sw('confirm')}</div>
        <div class="pg-row"><div><b>Чат в партии</b><span class="d">Кнопка чата и сообщения соперника в онлайн-партиях. Выключите, если не хотите видеть сообщения</span></div>${sw('chat')}</div>
        <div id="pg-sync-row"></div>
        <div class="pg-row"><div><b>Показывать мои партии другим</b><span class="d">Ваши онлайн-партии (когда оба игрока вошли через Google и согласны) видны в профиле и в списке «Идущие партии». Действует на новые партии</span></div>${sw('showGames')}</div>
                ${isDr ? `<div class="pg-row"><div><b>Номера клеток</b><span class="d">Стандартная нумерация 1–50 на тёмных клетках</span></div>${sw('nums')}</div>` : ''}
        <div class="pg-row" id="pg-hide-row" style="display:none"><div><b>Скрыть прошлые партии</b><span class="d">Удалить публичные копии ваших прошлых партий (в профиле и по ссылкам)</span></div><button class="pg-small" id="pg-hide-btn">Скрыть</button></div>
        <div class="pg-title2">Оформление доски</div>
        <div class="pg-themes">${Object.entries(THEMES).map(([k, t]) => `<button class="pg-th ${s.board === k ? 'on' : ''}" data-b="${k}"><i style="background:linear-gradient(135deg,${t.l} 50%,${t.d} 50%)"></i>${t.n}</button>`).join('')}</div>
        <button class="pg-close">Готово</button></div>`;
      window.PGS.mountThemeRow(ov.querySelector('#pg-theme-row')); window.PGS.install.mountRow(ov.querySelector('#pg-install-row'));
      if (window.PGSync) window.PGSync.mountRow(ov.querySelector('#pg-sync-row'));
      ov.querySelectorAll('.pg-sw').forEach((b) => { b.onclick = () => { const k = b.dataset.k; set({ [k]: !get()[k] }); paint(); }; });
      ov.querySelectorAll('.pg-th').forEach((b) => { b.onclick = () => { set({ board: b.dataset.b }); paint(); }; });
      const hideRow = ov.querySelector('#pg-hide-row'); if (hideRow && typeof window.pgHideMine === 'function') { hideRow.style.display = 'flex'; ov.querySelector('#pg-hide-btn').onclick = async (e) => { const b = e.target; b.disabled = true; b.textContent = '…'; try { const n = await window.pgHideMine(); b.textContent = n ? 'Скрыто: ' + n : 'Нечего скрывать'; } catch (err) { console.error(err); b.textContent = 'Не удалось'; } }; }
      ov.querySelector('.pg-close').onclick = close;
    }
    function close() { ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); }); document.addEventListener('keydown', onKey);
    paint(); document.body.appendChild(ov);
  };

  // ---- плашка «Подтвердить ход» ----
  let bar = null;
  window.pgConfirm = {
    show(text, ok, cancel) {
      if (!bar) { bar = document.createElement('div'); bar.id = 'pg-confirm'; document.body.appendChild(bar); }
      bar.innerHTML = '<span></span><button class="ok">✓ Подтвердить</button><button class="no">✕</button>';
      bar.firstChild.textContent = text; bar.style.display = 'flex';
      bar.querySelector('.ok').onclick = () => { ok(); }; bar.querySelector('.no').onclick = () => { cancel(); };
    },
    hide() { if (bar) bar.style.display = 'none'; },
    get visible() { return !!bar && bar.style.display !== 'none'; }
  };
})();
// ============ Фоновая музыка Pep Games: сочиняется прямо в браузере (Web Audio), без файлов ============
(function () {
  if (window.PGMusic || !window.PGS) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { window.PGMusic = { supported: false }; return; }
  // настроение по странице: головоломки — спокойно, игры за доской — задумчиво, «Сто к одному» — задорно
  const page = (location.pathname.match(/\/(chess|draughts|sudoku|crossword|nonogram|sto|words|code)\//) || [, 'hub'])[1];
  const STYLES = {
    calm: { bpm: 64, prog: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 60], [55, 59, 62, 67]], scale: [69, 72, 74, 76, 79, 81, 84], notes: 0.45, wave: 'triangle', bell: 0.5 },
    think: { bpm: 56, prog: [[50, 57, 62, 65], [46, 53, 58, 62], [43, 50, 55, 58], [45, 52, 57, 61]], scale: [62, 65, 67, 69, 72, 74, 77], notes: 0.35, wave: 'sine', bell: 0.6 },
    show: { bpm: 104, prog: [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]], scale: [72, 74, 76, 79, 81, 84, 86], notes: 0.7, wave: 'triangle', bell: 0.35, bass: true }
  };
  const style = STYLES[{ chess: 'think', draughts: 'think', sto: 'show' }[page] || 'calm'];
  let ctx = null, master = null, echo = null, timer = null, beat = 0, nextT = 0, playing = false;
  const f = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function setup() {
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(master); master.lp = lp;
    echo = ctx.createDelay(1); echo.delayTime.value = 60 / style.bpm * 0.75; const fb = ctx.createGain(); fb.gain.value = 0.32; const wet = ctx.createGain(); wet.gain.value = 0.28;
    echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(lp);
  }
  function voice(freq, t, dur, vol, type, toEcho) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.6, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(master.lp); if (toEcho) g.connect(echo); o.start(t); o.stop(t + dur + 0.05);
  }
  function pluck(freq, t, vol) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 1.4 * style.bell + 0.3); o.connect(g); g.connect(master.lp); g.connect(echo); o.start(t); o.stop(t + 2); }
  let lastNote = 3;
  function schedule() {
    const spb = 60 / style.bpm;
    while (nextT < ctx.currentTime + 0.4) {
      const bar = Math.floor(beat / 4) % style.prog.length, inBar = beat % 4, chord = style.prog[bar];
      if (inBar === 0) chord.forEach((m, k) => { voice(f(m), nextT, spb * 4.2, k ? 0.035 : 0.05, style.wave, false); voice(f(m) * 1.003, nextT, spb * 4.2, 0.02, 'sine', false); });
      if (style.bass && (inBar === 0 || inBar === 2)) voice(f(chord[0] - 12), nextT, spb * 0.9, 0.09, 'triangle', false);
      if (style.bass && inBar % 2 === 1) pluck(f(chord[2] + 12), nextT, 0.035);
      for (const half of [0, 0.5]) if (Math.random() < style.notes * (half ? 0.5 : 1)) {        // мелодия: шаг на соседнюю ноту лада, изредка — скачок
        lastNote = Math.max(0, Math.min(style.scale.length - 1, lastNote + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
        pluck(f(style.scale[lastNote]), nextT + half * spb, 0.05 + Math.random() * 0.03);
      }
      beat++; nextT += spb;
    }
  }
  const vol = () => 0.55 * (window.PGS.get().musicVol || 0.5);
  function start() {
    if (playing) return; if (!ctx) setup(); if (ctx.state === 'suspended') ctx.resume();
    playing = true; nextT = ctx.currentTime + 0.1; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(vol(), ctx.currentTime, 1.2);
    schedule(); timer = setInterval(schedule, 120);
  }
  function stop() { if (!playing) return; playing = false; clearInterval(timer); timer = null; if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => { if (!playing && ctx) ctx.suspend(); }, 1600); } }
  const want = () => !!window.PGS.get().music && !document.hidden;
  function sync() { if (want()) { if (armed) start(); } else stop(); paint(); }
  // браузеры разрешают звук только после действия пользователя — ждём первого касания или клавиши
  let armed = false; const arm = () => { armed = true; if (want()) start(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, arm, { once: false, passive: true }));
  document.addEventListener('visibilitychange', sync); window.addEventListener('pgs-change', sync); window.addEventListener('storage', (e) => { if (e.key === 'pgSettings') sync(); });
  function toggle() { const on = !window.PGS.get().music; window.PGS.set({ music: on }); armed = true; sync(); }
  // строка «Фоновая музыка» в меню игры (вставляется над строкой синхронизации) и кнопка в общих настройках
  function rowHtml() { const on = !!window.PGS.get().music; return `<div class="pgm-row"><div><b>🎵 Фоновая музыка</b><span>${on ? 'Играет спокойная мелодия' : 'Выключена'}</span></div><button type="button" class="pgm-btn${on ? ' on' : ''}" aria-pressed="${on}">${on ? 'Выключить' : 'Включить'}</button></div>`; }
  function paint() { document.querySelectorAll('.pgm-host').forEach((h) => { h.innerHTML = rowHtml(); h.querySelector('.pgm-btn').onclick = toggle; }); }
  function mount(host) { if (!host) return; host.classList.add('pgm-host'); paint(); }
  const css = '.pgm-row { display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--k-line); background:var(--k-surf); padding:10px 12px; margin:12px 0 0; font-size:13.5px; } .pgm-row b { display:block; } .pgm-row span { color:var(--k-mu); font-size:12.5px; } .pgm-btn { border:1px solid var(--k-line); background:var(--k-panel); padding:7px 12px; font:700 13px inherit; font-family:inherit; cursor:pointer; color:var(--k-tx); white-space:nowrap; } .pgm-btn.on { background:var(--k-acc); color:#fff; border-color:var(--k-acc); }';
  const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  const auto = () => { const s = document.getElementById('sync-row'); if (s && !document.getElementById('pgm-auto')) { const h = document.createElement('div'); h.id = 'pgm-auto'; s.parentNode.insertBefore(h, s); mount(h); } document.querySelectorAll('[data-pgm]').forEach(mount); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  window.PGMusic = { supported: true, start, stop, toggle, mount, get playing() { return playing; }, style: page };
})();
// ============ Звуки Pep Games для словесных игр: короткие сигналы прямо в браузере, слушаются переключателя «Звук» ============
(function () {
  if (window.PGSfx || !window.PGS) return;
  const AC = window.AudioContext || window.webkitAudioContext; let ctx = null;
  const f = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function tone(m, t, dur, vol, type, slide) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f(m), t); if (slide) o.frequency.exponentialRampToValueAtTime(f(m + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const SOUNDS = {
    ok: (t) => { tone(76, t, 0.16, 0.16, 'triangle'); tone(83, t + 0.09, 0.26, 0.14, 'triangle'); },             // верно: два восходящих звоночка
    bad: (t) => { tone(45, t, 0.32, 0.12, 'sawtooth', -2); tone(44, t, 0.32, 0.08, 'square', -2); },              // промах: низкое «бзз»
    tap: (t) => { tone(88, t, 0.05, 0.05, 'sine'); },                                                           // касание: тихий щелчок
    flip: (t) => { tone(67, t, 0.12, 0.09, 'triangle', 7); },                                                   // открылась строка
    win: (t) => { [72, 76, 79, 84].forEach((m, k) => tone(m, t + k * 0.11, 0.42, 0.13, 'triangle')); }          // победа: арпеджио
  };
  function play(name) {
    if (!AC || !window.PGS.get().sound || !SOUNDS[name]) return;
    try { if (!ctx) ctx = new AC(); if (ctx.state === 'suspended') ctx.resume(); SOUNDS[name](ctx.currentTime + 0.01); } catch (e) {}
  }
  window.PGSfx = { play };
})();
// ============ Pep Games: вибрация, «Поделиться результатом», сезонное оформление ============
(function () {
  if (window.PGShare || !window.PGS) return;
  // ---- вибрация: короткие отклики на телефоне (в iPhone браузеры её не поддерживают — там просто тишина) ----
  const VIB = { ok: 18, bad: [30, 40, 30], win: [20, 60, 20, 60, 40], tap: 8, flip: 12 };
  if (window.PGSfx && !window.PGSfx.__vib) { const orig = window.PGSfx.play; window.PGSfx.play = (n) => { orig(n); try { if (window.PGS.get().vibro !== false && navigator.vibrate && VIB[n]) navigator.vibrate(VIB[n]); } catch (e) {} }; window.PGSfx.__vib = true; }
  // ---- «Поделиться результатом»: карточка-текст, как у Wordle ----
  const SITE = 'https://pepdominator.github.io/pep-chess/';
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const fmt = (ms) => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function text(d) {
    const dt = d.date ? new Date(d.date + 'T12:00:00') : new Date(), day = dt.getDate() + ' ' + months[dt.getMonth()];
    const lines = [`${d.icon || '🧩'} ${d.title} · ${day}`, `⏱ ${fmt(d.time)}${d.hints ? ` · подсказок: ${d.hints}` : ' · без подсказок'}${d.extra ? ' · ' + d.extra : ''}`];
    if (d.streak > 1) lines.push(`🔥 серия ${d.streak} ${d.streak % 10 === 1 && d.streak % 100 !== 11 ? 'день' : d.streak % 10 >= 2 && d.streak % 10 <= 4 && (d.streak % 100 < 10 || d.streak % 100 >= 20) ? 'дня' : 'дней'} подряд`);
    lines.push(SITE + (d.path || ''));
    return lines.join('\n');
  }
  async function share(d, btn) {
    const t = text(d);
    try { if (navigator.share && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) { await navigator.share({ text: t }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(t); } catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) {} ta.remove(); }
    if (btn) { const o = btn.textContent; btn.textContent = '✓ Скопировано — вставьте в чат'; setTimeout(() => { btn.textContent = o; }, 2200); }
  }
  // кнопка под строкой рекордов в окне победы
  function attach(host, d) {
    if (!host) return; let b = host.parentNode.querySelector('.pgs-share'); if (b) b.remove();
    b = document.createElement('button'); b.type = 'button'; b.className = 'pgs-share'; b.textContent = '📤 Поделиться результатом'; b.onclick = () => share(d, b);
    host.parentNode.insertBefore(b, host.nextSibling);
  }
  // ---- сезонное оформление на главной: зимой снежинки, весной лепестки, осенью листья ----
  function season() {
    if (window.PGS.get().seasonal === false || !document.getElementById('pga-btn')) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const m = new Date().getMonth() + 1, d = new Date().getDate(), md = m * 100 + d;
    const kind = md >= 1215 || md <= 115 ? 'snow' : md >= 920 && md <= 1130 ? 'leaf' : md >= 320 && md <= 515 ? 'petal' : null; if (!kind) return;
    const sym = { snow: ['❄', '❅', '❆'], leaf: ['🍂', '🍁', '🍂'], petal: ['🌸', '🌼', '🌸'] }[kind];
    const box = document.createElement('div'); box.className = 'pgs-season'; box.setAttribute('aria-hidden', 'true');
    for (let k = 0; k < 9; k++) { const i = document.createElement('i'); i.textContent = sym[k % sym.length]; i.style.cssText = `left:${(k * 7.3 + Math.random() * 5) % 100}%;animation-duration:${11 + Math.random() * 9}s;animation-delay:${-Math.random() * 18}s;font-size:${12 + Math.random() * 12}px;opacity:${kind === 'snow' ? 0.45 : 0.5}`; box.appendChild(i); }
    document.body.appendChild(box);
  }
  const css = '.pgs-share { display:block; margin:10px auto 0; border:1px solid var(--k-line,var(--k-line)); background:var(--k-panel,var(--k-panel)); color:var(--k-tx,var(--k-tx)); padding:10px 16px; font:700 14px "Noto Sans",system-ui,sans-serif; cursor:pointer; } .pgs-share:hover { background:var(--k-hover,var(--k-hover)); }'
    + ' .pgs-season { position:fixed; inset:0; pointer-events:none; z-index:1; overflow:hidden; } .pgs-season i { position:absolute; top:-40px; font-style:normal; animation:pgsFall linear infinite; } @keyframes pgsFall { 0% { transform:translate(0,-40px) rotate(0deg); } 50% { transform:translate(30px,50vh) rotate(160deg); } 100% { transform:translate(-10px,105vh) rotate(320deg); } }';
  const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', season); else season();
  window.PGShare = { text, share, attach };
})();
