// ============ Интерактивное обучение: общий «движок» уроков для всех игр ============
// Урок — список шагов. Шаг: { text, target() → прямоугольник {x,y,w,h} на экране или null, done() → true, когда игрок сделал нужное,
// demo(hand) — «Покажи»: анимированная рука делает действие за игрока; button — подпись кнопки, если шаг завершается нажатием «Дальше» }.
(function () {
  if (window.PGTutor) return;
  const KEY = 'pgTutorDone';
  const doneMap = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const css = `
#pgt { position:fixed; inset:0; z-index:380; pointer-events:none; font-family:'Noto Sans',system-ui,sans-serif; }
#pgt .pgt-shade { position:fixed; border-radius:6px; box-shadow:0 0 0 9999px rgba(20,24,18,.5); outline:3px solid #F2C14E; outline-offset:2px; transition:all .25s ease; pointer-events:none; }
#pgt .pgt-shade.none { left:50%; top:50%; width:0; height:0; outline:none; }
#pgt .pgt-b { position:fixed; max-width:min(380px, calc(100vw - 24px)); background:var(--k-panel); color:var(--k-tx); border:1px solid var(--k-line); box-shadow:0 18px 50px rgba(0,0,0,.3); padding:14px 16px 12px; pointer-events:auto; transition:top .25s ease, left .25s ease; }
#pgt .pgt-b .pgt-st { font-size:11.5px; color:var(--k-mu); letter-spacing:.5px; text-transform:uppercase; margin-bottom:4px; display:flex; justify-content:space-between; gap:10px; }
#pgt .pgt-b .pgt-x { background:none; border:none; color:var(--k-mu); font-size:12px; cursor:pointer; padding:0; text-transform:none; letter-spacing:0; text-decoration:underline; }
#pgt .pgt-b .pgt-t { font-size:15px; line-height:1.5; } #pgt .pgt-b .pgt-t b { color:var(--k-gt); }
#pgt .pgt-b .pgt-ok { color:var(--k-gt); font-weight:700; margin-top:6px; min-height:1.2em; font-size:14px; }
#pgt .pgt-b .pgt-btns { display:flex; gap:8px; justify-content:flex-end; margin-top:8px; flex-wrap:wrap; }
#pgt .pgt-b button.pgt-go { background:var(--k-acc); color:#fff; border:none; padding:8px 14px; font-weight:700; font-size:13.5px; cursor:pointer; }
#pgt .pgt-b button.pgt-show { background:var(--k-surf); color:var(--k-tx); border:1px solid var(--k-line); padding:8px 12px; font-size:13px; cursor:pointer; }
#pgt .pgt-dots { display:flex; gap:4px; margin-top:8px; } #pgt .pgt-dots i { width:7px; height:7px; border-radius:50%; background:var(--k-line); } #pgt .pgt-dots i.on { background:var(--k-acc); }
#pgt .pgt-hand { position:fixed; font-size:34px; line-height:1; pointer-events:none; transition:left .6s ease, top .6s ease, opacity .3s; opacity:0; filter:drop-shadow(0 2px 4px rgba(0,0,0,.4)); transform:translate(-30%, -10%); }
@media (prefers-reduced-motion:reduce) { #pgt .pgt-shade, #pgt .pgt-b, #pgt .pgt-hand { transition:none; } }
`;
  let cur = null;
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  // Рука для «Покажи»: двигается по точкам; в каждой точке может выполнить действие
  const hand = {
    async path(points, onPoint) { const h = cur && cur.hand; if (!h) return; h.style.opacity = '1'; for (let i = 0; i < points.length; i++) { const p = points[i]; h.style.left = p.x + 'px'; h.style.top = p.y + 'px'; await wait(i === 0 ? 350 : 260); if (onPoint) onPoint(i, p); } await wait(500); h.style.opacity = '0'; },
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const inter = (a, b) => { if (!a || !b) return 0; const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 ? w * h : 0; };
  function place() {
    if (!cur) return; const st = cur.lesson.steps[cur.i], r = st.target ? st.target() : null, sh = cur.shade, b = cur.bubble, av = st.avoid ? st.avoid() : r;
    const clear = (st.clear ? [].concat(st.clear()) : []).filter(Boolean);                    // то, что игрок должен нажимать: закрывать нельзя
    if (r) { sh.classList.remove('none'); Object.assign(sh.style, { left: (r.x - 4) + 'px', top: (r.y - 4) + 'px', width: (r.w + 8) + 'px', height: (r.h + 8) + 'px' }); } else { sh.classList.add('none'); sh.removeAttribute('style'); }
    const vw = innerWidth, vh = innerHeight; b.style.width = ''; let bw = b.offsetWidth, bh = b.offsetHeight, x, y;
    const badness = (px, py, w, h) => { const box = { x: px, y: py, w, h }; return inter(box, r) * 20 + clear.reduce((s2, c) => s2 + inter(box, c) * 20, 0) + inter(box, av) + ((px < 0 || py < 0 || px + w > vw || py + h > vh) ? 1e9 : 0); };
    if (!av) { x = (vw - bw) / 2; y = Math.max(12, vh * 0.18); }
    else {
      const right = vw - (av.x + av.w) - 28, left = av.x - 28, below = vh - (av.y + av.h) - 22, above = av.y - 22, tc = r || av, opts = [];
      if (right >= 250) { const w = Math.min(380, right); opts.push([av.x + av.w + 18, Math.min(vh - bh - 8, Math.max(8, tc.y + tc.h / 2 - bh / 2)), w]); }
      if (left >= 250) { const w = Math.min(380, left); opts.push([av.x - w - 18, Math.min(vh - bh - 8, Math.max(8, tc.y + tc.h / 2 - bh / 2)), w]); }
      if (below >= bh) opts.push([Math.min(vw - bw - 12, Math.max(12, av.x + av.w / 2 - bw / 2)), av.y + av.h + 14, 0]);
      if (above >= bh) opts.push([Math.min(vw - bw - 12, Math.max(12, av.x + av.w / 2 - bw / 2)), av.y - bh - 14, 0]);
      const bl = tc.y + tc.h + 14, ab = tc.y - bh - 14, cx = Math.min(vw - bw - 12, Math.max(12, tc.x + tc.w / 2 - bw / 2));
      opts.push([cx, bl, 0], [cx, ab, 0], [8, 8, 0], [vw - bw - 8, 8, 0], [8, vh - bh - 8, 0], [vw - bw - 8, vh - bh - 8, 0], [(vw - bw) / 2, 8, 0], [(vw - bw) / 2, vh - bh - 8, 0]);
      let best = null;
      for (const [px, py, w] of opts) { const ww = w || bw, hh = w ? (b.style.width = w + 'px', b.offsetHeight) : (b.style.width = '', bh); const sc = badness(px, py, ww, hh); if (!best || sc < best.sc - 0.5) best = { sc, px, py, w }; if (sc === 0) break; }
      b.style.width = best.w ? best.w + 'px' : ''; x = best.px; y = best.py;
    }
    b.style.left = x + 'px'; b.style.top = y + 'px';
  }
  function show() {
    const L = cur.lesson, st = L.steps[cur.i], b = cur.bubble; cur.shownAt = Date.now(); cur.okShown = false;
    b.innerHTML = `<div class="pgt-st"><span>${L.title} · шаг ${cur.i + 1} из ${L.steps.length}</span><button class="pgt-x" type="button">Выйти из обучения</button></div><div class="pgt-t">${st.text}</div><div class="pgt-ok"></div>
      <div class="pgt-btns">${st.demo ? '<button class="pgt-show" type="button">👆 Покажи</button>' : ''}${st.button ? `<button class="pgt-go" type="button">${st.button}</button>` : ''}</div><div class="pgt-dots">${L.steps.map((_, k) => `<i class="${k <= cur.i ? 'on' : ''}"></i>`).join('')}</div>`;
    b.querySelector('.pgt-x').onclick = () => stop(false);
    const sb = b.querySelector('.pgt-show'); if (sb) sb.onclick = async () => { sb.disabled = true; try { await st.demo(hand); } catch (e) {} sb.disabled = false; };
    const gb = b.querySelector('.pgt-go'); if (gb) gb.onclick = () => next();
    if (st.enter) try { st.enter(); } catch (e) {}
    place();
  }
  function next() { if (!cur) return; const L = cur.lesson; if (cur.i + 1 >= L.steps.length) { finish(); return; } cur.i++; show(); }
  function tick() {
    if (!cur) return; place(); const st = cur.lesson.steps[cur.i];
    if (st.done && !cur.okShown) { let ok = false; try { ok = st.done(); } catch (e) {} if (ok) { cur.okShown = true; const o = cur.bubble.querySelector('.pgt-ok'); if (o) o.textContent = st.praise || ['Отлично!', 'Верно!', 'Так держать!', 'Здорово!'][cur.i % 4]; setTimeout(next, 900); } }
  }
  function finish() { const L = cur.lesson; const m = doneMap(); m[L.id] = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} if (window.PGA) try { PGA.event('tutor', { id: L.id }); } catch (e) {} stop(true); }
  function stop(completed) { if (!cur) return; const L = cur.lesson; clearInterval(cur.timer); removeEventListener('resize', place); removeEventListener('keydown', cur.onKey); cur.root.remove(); cur = null; if (completed && L.onFinish) L.onFinish(); if (!completed && L.onExit) L.onExit(); }
  function run(lesson) {
    if (cur) stop(false); if (!document.getElementById('pgt-css')) { const s = el('style'); s.id = 'pgt-css'; s.textContent = css; document.head.appendChild(s); }
    const root = el('div'); root.id = 'pgt'; const shade = el('div', 'pgt-shade none'), bubble = el('div', 'pgt-b'), h = el('div', 'pgt-hand', '👆'); root.append(shade, bubble, h); document.body.appendChild(root);
    cur = { lesson, i: 0, root, shade, bubble, hand: h, timer: setInterval(tick, 150), onKey: (e) => { if (e.key === 'Escape') stop(false); } };
    addEventListener('resize', place); addEventListener('keydown', cur.onKey); show();
  }
  // короткая реплика в подсказке (например, «Не тот ход»), не меняя шаг
  function say(msg) { if (!cur) return; const o = cur.bubble.querySelector('.pgt-ok'); if (o) { o.textContent = msg; o.style.color = '#A23B33'; setTimeout(() => { if (o.textContent === msg) { o.textContent = ''; o.style.color = ''; } }, 2200); } }
  window.PGTutor = { run, say, stop: () => stop(false), next, active: () => (cur ? { id: cur.lesson.id, step: cur.i } : null), isDone: (id) => !!doneMap()[id], hand };
})();
