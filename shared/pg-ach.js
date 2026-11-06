// ============ Достижения и серии (общие для шахмат, шашек, судоку и кроссвордов) ============
// Данные в localStorage['pgAch'] = { u: { id: время получения }, c: { счётчик: число } } — синхронизируются между устройствами.
(function () {
  if (window.PGA) return;
  const KEY = 'pgAch';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // u — полученные достижения; c — счётчики; d — «дни активности»: { 'ГГГГ-ММ-ДД': { g: игры (битовая маска), t: время суток, n: сколько завершено, q: задания дня, w: победы } }; p — коллекция увиденных картинок и их категорий
  const read = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); return o && typeof o === 'object' ? { u: o.u || {}, c: o.c || {}, d: o.d || {}, p: Array.isArray(o.p) ? o.p : [] } : { u: {}, c: {}, d: {}, p: [] }; } catch (e) { return { u: {}, c: {}, d: {}, p: [] }; } };
  const write = (s) => { try { const keys = Object.keys(s.d || {}).sort(); if (keys.length > 420) keys.slice(0, keys.length - 420).forEach((k) => delete s.d[k]); if ((s.p || []).length > 700) s.p = s.p.slice(-700); localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} try { window.dispatchEvent(new Event('pga-changed')); } catch (e) {} };
  const C = (c, k) => c[k] || 0;
  const keyOf = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const dnum = (k) => { const a = k.split('-').map(Number); return Math.round(Date.UTC(a[0], a[1] - 1, a[2]) / 86400000); };
  const pop = (x) => { let n = 0; x = x | 0; while (x) { n += x & 1; x >>= 1; } return n; };
  // Что можно вывести из дней активности: серии, число дней, игры и время суток за день, выполненные задания дня и т. п.
  function stats(s) {
    const keys = Object.keys(s.d || {}).sort(), nums = keys.map(dnum), today = dnum(keyOf(new Date())), X = { days: keys.length, best: 0, cur: 0, bestQ: 0, qTotal: 0, bestM: 0, maxG: 0, maxN: 0, mde: 0, nights: 0, dw: false, weekdays: 0, monthMax: 0, weekend: false, pics: 0, cats: 0 };
    let run = 0, runQ = 0, runM = 0; const wd = new Set(), mon = {};
    keys.forEach((k, i) => {
      const d = s.d[k], consec = i > 0 && nums[i] === nums[i - 1] + 1, prev = consec ? s.d[keys[i - 1]] : null;
      run = consec ? run + 1 : 1; X.best = Math.max(X.best, run);
      const mk = maskFor(k), full = ((d.q | 0) & mk) === mk; runQ = full ? (prev && ((prev.q | 0) & maskFor(keys[i - 1])) === maskFor(keys[i - 1]) ? runQ + 1 : 1) : 0; X.bestQ = Math.max(X.bestQ, runQ); if (full) X.qTotal++;
      const mor = !!((d.t | 0) & 1); runM = mor ? (prev && ((prev.t | 0) & 1) ? runM + 1 : 1) : 0; X.bestM = Math.max(X.bestM, runM);
      X.maxG = Math.max(X.maxG, pop(d.g)); X.maxN = Math.max(X.maxN, d.n | 0); X.mde = Math.max(X.mde, pop((d.t | 0) & 7)); if ((d.t | 0) & 8) X.nights++; if (((d.w | 0) & 3) === 3) X.dw = true;
      const a = k.split('-').map(Number), wday = new Date(a[0], a[1] - 1, a[2]).getDay(); wd.add(wday); mon[k.slice(0, 7)] = (mon[k.slice(0, 7)] || 0) + 1; if (wday === 6 && i + 1 < keys.length && nums[i + 1] === nums[i] + 1) X.weekend = true;
    });
    if (nums.length && nums[nums.length - 1] >= today - 1) X.cur = run; X.weekdays = wd.size; X.monthMax = Math.max(0, ...Object.values(mon));
    (s.p || []).forEach((e) => { if (String(e).indexOf('cat:') === 0) X.cats++; else X.pics++; });
    return X;
  }
  // id, игра, значок, название, описание, цель, прогресс по счётчикам
  const DEFS = [
    ['first', 'Общие', '🌱', 'Первые шаги', 'Завершите любую партию или головоломку', 1, (c) => Math.min(1, C(c, 'done'))],
    ['allfour', 'Общие', '🎲', 'Четыре в одном', 'Завершите хотя бы одну партию в шахматах и шашках и решите судоку и кроссворд', 4, (c) => (C(c, 'chP') > 0) + (C(c, 'drP') > 0) + (C(c, 'sd') > 0) + (C(c, 'cw') > 0)],
    ['friend', 'Общие', '🤝', 'Свои люди', 'Добавьте друга', 1, (c) => Math.min(1, C(c, 'friend'))],
    ['streak7', 'Общие', '🔥', 'Неделя подряд', 'Решайте судоку или кроссворд дня 7 дней подряд', 7, (c) => C(c, 'streak')],
    ['streak30', 'Общие', '🌋', 'Месяц подряд', 'Решайте задание дня 30 дней подряд', 30, (c) => C(c, 'streak')],
    ['inboard', 'Общие', '🏆', 'В таблице', 'Попадите в таблицу рекордов', 1, (c) => Math.min(1, C(c, 'inboard'))],
    ['podium', 'Общие', '🥇', 'На пьедестале', 'Войдите в тройку таблицы рекордов', 1, (c) => Math.min(1, C(c, 'podium'))],
    ['night', 'Общие', '🌙', 'Ночная смена', 'Завершите партию или головоломку между полуночью и пятью утра', 1, (c) => Math.min(1, C(c, 'night'))],
    ['early', 'Общие', '🌅', 'Ранняя пташка', 'Завершите партию или головоломку между пятью и восемью утра', 1, (c) => Math.min(1, C(c, 'early'))],
    ['streak3', 'Общие', '✨', 'Три дня подряд', 'Решайте задание дня 3 дня подряд', 3, (c) => C(c, 'streak')],
    ['streak14', 'Общие', '⚡', 'Две недели подряд', 'Решайте задание дня 14 дней подряд', 14, (c) => C(c, 'streak')],
    ['dailyset', 'Общие', '📆', 'Ежедневный набор', 'Решите три ежедневные головоломки в один и тот же день', 1, (c) => Math.min(1, C(c, 'dailyset'))],
    ['allfive', 'Общие', '🎰', 'Пять в одном', 'Завершите партию в шахматах и шашках и решите судоку, кроссворд и японский кроссворд', 5, (c) => (C(c, 'chP') > 0) + (C(c, 'drP') > 0) + (C(c, 'sd') > 0) + (C(c, 'cw') > 0) + (C(c, 'jp') > 0)],
    ['friend3', 'Общие', '👯', 'Компания', 'Добавьте трёх друзей', 3, (c) => C(c, 'friend')],
    ['challenge', 'Общие', '⚔️', 'Вызов брошен', 'Вызовите друга на партию', 1, (c) => Math.min(1, C(c, 'chal'))],
    ['top10', 'Общие', '🔟', 'В десятке', 'Войдите в десятку таблицы рекордов', 1, (c) => Math.min(1, C(c, 'top10'))],
    ['champion', 'Общие', '👑', 'Чемпион дня', 'Займите первое место в таблице рекордов', 1, (c) => Math.min(1, C(c, 'first1'))],
    ['dark', 'Общие', '🕶️', 'Тёмная сторона', 'Включите тёмную тему', 1, (c) => Math.min(1, C(c, 'dark'))],
    ['install', 'Общие', '📲', 'Как приложение', 'Установите Pep Games на устройство', 1, (c) => Math.min(1, C(c, 'install'))],
    ['offline', 'Общие', '✈️', 'Без связи', 'Завершите игру, когда нет интернета', 1, (c) => Math.min(1, C(c, 'offline'))],
    ['coll10', 'Общие', '🏅', 'Коллекционер', 'Получите 10 достижений', 10, (c, u) => Object.keys(u).filter((k) => k !== 'coll10' && k !== 'coll25').length],
    ['coll25', 'Общие', '🎖️', 'Большая коллекция', 'Получите 25 достижений', 25, (c, u) => Object.keys(u).filter((k) => k !== 'coll10' && k !== 'coll25').length],
    ['ch1', 'Шахматы', '♞', 'Первая победа', 'Выиграйте партию в шахматы', 1, (c) => Math.min(1, C(c, 'chW'))],
    ['ch5', 'Шахматы', '♝', 'Сильный соперник', 'Победите компьютер уровня 5 или выше', 5, (c) => C(c, 'chBot')],
    ['ch8', 'Шахматы', '♛', 'Покоритель Stockfish', 'Победите компьютер самого сильного уровня (8)', 8, (c) => C(c, 'chBot')],
    ['ch10', 'Шахматы', '♜', 'Десять побед', 'Выиграйте 10 шахматных партий', 10, (c) => C(c, 'chW')],
    ['chon', 'Шахматы', '🌐', 'Живой соперник', 'Выиграйте шахматную партию у человека по сети', 1, (c) => Math.min(1, C(c, 'chOn'))],
    ['chdraw', 'Шахматы', '🤝', 'Мирный исход', 'Сыграйте вничью в шахматы', 1, (c) => Math.min(1, C(c, 'chD'))],
    ['chblack', 'Шахматы', '⚫', 'Чёрными тоже', 'Выиграйте в шахматы, играя чёрными', 1, (c) => Math.min(1, C(c, 'chBlk'))],
    ['chmini', 'Шахматы', '⚡', 'Миниатюра', 'Выиграйте у компьютера уровня 3+ меньше чем за 15 ходов', 1, (c) => Math.min(1, C(c, 'chMini'))],
    ['chlong', 'Шахматы', '🏔️', 'Затяжная партия', 'Доиграйте шахматную партию до 60-го хода', 1, (c) => Math.min(1, C(c, 'chLong'))],
    ['ch50', 'Шахматы', '🎲', 'Полсотни партий', 'Сыграйте 50 партий в шахматы', 50, (c) => C(c, 'chP')],
    ['dr1', 'Шашки', '⛀', 'Первая победа', 'Выиграйте партию в шашки', 1, (c) => Math.min(1, C(c, 'drW'))],
    ['dr5', 'Шашки', '⛁', 'Сильный соперник', 'Победите компьютер уровня 5 или выше', 5, (c) => C(c, 'drBot')],
    ['dr8', 'Шашки', '👑', 'Покоритель Scan', 'Победите компьютер самого сильного уровня (8)', 8, (c) => C(c, 'drBot')],
    ['dr10', 'Шашки', '🎯', 'Десять побед', 'Выиграйте 10 партий в шашки', 10, (c) => C(c, 'drW')],
    ['dron', 'Шашки', '🌐', 'Живой соперник', 'Выиграйте партию в шашки у человека по сети', 1, (c) => Math.min(1, C(c, 'drOn'))],
    ['drdraw', 'Шашки', '🤝', 'Мирный исход', 'Сыграйте вничью в шашки', 1, (c) => Math.min(1, C(c, 'drD'))],
    ['drblack', 'Шашки', '⚫', 'Чёрными тоже', 'Выиграйте в шашки, играя чёрными', 1, (c) => Math.min(1, C(c, 'drBlk'))],
    ['drmini', 'Шашки', '⚡', 'Быстрый разгром', 'Выиграйте у компьютера уровня 3+ меньше чем за 20 ходов', 1, (c) => Math.min(1, C(c, 'drMini'))],
    ['drlong', 'Шашки', '🏔️', 'Долгая борьба', 'Доиграйте партию в шашки до 50-го хода', 1, (c) => Math.min(1, C(c, 'drLong'))],
    ['dr50', 'Шашки', '🎲', 'Полсотни партий', 'Сыграйте 50 партий в шашки', 50, (c) => C(c, 'drP')],
    ['sd1', 'Судоку', '🔢', 'Первая головоломка', 'Решите судоку', 1, (c) => Math.min(1, C(c, 'sd'))],
    ['sd10', 'Судоку', '🧩', 'Десять головоломок', 'Решите 10 судоку', 10, (c) => C(c, 'sd')],
    ['sd100', 'Судоку', '💯', 'Сотня', 'Решите 100 судоку', 100, (c) => C(c, 'sd')],
    ['sdx', 'Судоку', '🧠', 'Эксперт', 'Решите судоку на уровне «Эксперт»', 1, (c) => Math.min(1, C(c, 'sdx'))],
    ['sdclean', 'Судоку', '✨', 'Чистая работа', 'Решите «Сложно» или «Эксперт» без подсказок и ошибок', 1, (c) => Math.min(1, C(c, 'sdclean'))],
    ['sdfast', 'Судоку', '⚡', 'Молния', 'Решите «Легко» быстрее чем за 3 минуты', 1, (c) => Math.min(1, C(c, 'sdfast'))],
    ['sd50', 'Судоку', '🧮', 'Полсотни', 'Решите 50 судоку', 50, (c) => C(c, 'sd')],
    ['sdfx', 'Судоку', '⏱️', 'Скоростной эксперт', 'Решите «Эксперт» быстрее чем за 15 минут', 1, (c) => Math.min(1, C(c, 'sdfx'))],
    ['sdnm', 'Судоку', '✔️', 'Без единой ошибки', 'Решите судоку уровня «Средне» и выше без ошибок', 1, (c) => Math.min(1, C(c, 'sdnm'))],
    ['cw1', 'Кроссворды', '🔤', 'Первый кроссворд', 'Разгадайте кроссворд', 1, (c) => Math.min(1, C(c, 'cw'))],
    ['cw10', 'Кроссворды', '📰', 'Десять кроссвордов', 'Разгадайте 10 кроссвордов', 10, (c) => C(c, 'cw')],
    ['cwbig', 'Кроссворды', '🗺️', 'Крупная форма', 'Разгадайте кроссворд из 49 слов и больше', 1, (c) => Math.min(1, C(c, 'cwbig'))],
    ['cwweek', 'Кроссворды', '📅', 'Суперкроссворд недели', 'Разгадайте суперкроссворд недели', 1, (c) => Math.min(1, C(c, 'cwweek'))],
    ['cwexp', 'Кроссворды', '🎓', 'Эрудит', 'Разгадайте кроссворд на уровне «Эксперт»', 1, (c) => Math.min(1, C(c, 'cwexp'))],
    ['cwclean', 'Кроссворды', '🪶', 'Без подсказок', 'Разгадайте кроссворд из 22 слов и больше без подсказок', 1, (c) => Math.min(1, C(c, 'cwclean'))],
    ['cw50', 'Кроссворды', '📚', 'Полсотни кроссвордов', 'Разгадайте 50 кроссвордов', 50, (c) => C(c, 'cw')],
    ['cwquick', 'Кроссворды', '⏱️', 'Быстрая разгадка', 'Разгадайте кроссворд от 15 слов быстрее чем за 4 минуты', 1, (c) => Math.min(1, C(c, 'cwquick'))],
    ['cwmega', 'Кроссворды', '🌐', 'Суперкроссворд', 'Разгадайте кроссворд из 100 слов и больше', 1, (c) => Math.min(1, C(c, 'cwmega'))],
    ['jp1', 'Японские кроссворды', '🧩', 'Первая картинка', 'Решите японский кроссворд', 1, (c) => Math.min(1, C(c, 'jp'))],
    ['jp10', 'Японские кроссворды', '🖼️', 'Галерея', 'Решите 10 японских кроссвордов', 10, (c) => C(c, 'jp')],
    ['jpbig', 'Японские кроссворды', '🗺️', 'Большое полотно', 'Решите японский кроссворд от 50 × 50', 1, (c) => Math.min(1, C(c, 'jpbig'))],
    ['jphuge', 'Японские кроссворды', '🏔️', 'Марафонец', 'Решите японский кроссворд 100 × 100', 1, (c) => Math.min(1, C(c, 'jphuge'))],
    ['jp50', 'Японские кроссворды', '🎨', 'Мастерская', 'Решите 50 японских кроссвордов', 50, (c) => C(c, 'jp')],
    ['jpfast', 'Японские кроссворды', '⚡', 'Быстрая картинка', 'Решите японский кроссворд до 10 × 10 быстрее чем за полторы минуты', 1, (c) => Math.min(1, C(c, 'jpfast'))],
    ['jpmid', 'Японские кроссворды', '🖌️', 'Крупный план', 'Решите японский кроссворд от 30 × 30', 1, (c) => Math.min(1, C(c, 'jpmid'))],
    ['jprect', 'Японские кроссворды', '▭', 'Не квадрат', 'Решите прямоугольный японский кроссворд', 1, (c) => Math.min(1, C(c, 'jprect'))],
    ['jpexp', 'Японские кроссворды', '🧠', 'Эксперт нонограмм', 'Решите японский кроссворд уровня «Эксперт» от 15 × 15', 1, (c) => Math.min(1, C(c, 'jpx'))],
    ['jpall', 'Японские кроссворды', '🪜', 'Все ступени', 'Решите по японскому кроссворду на каждом из пяти уровней сложности', 5, (c) => (C(c, 'jpl1') > 0) + (C(c, 'jpl2') > 0) + (C(c, 'jpl3') > 0) + (C(c, 'jpl4') > 0) + (C(c, 'jpl5') > 0)],
    ['jpclean', 'Японские кроссворды', '🪄', 'Чистое решение', 'Решите японский кроссворд от 20 × 20 без подсказок', 1, (c) => Math.min(1, C(c, 'jpclean'))],
    ['sto1', 'Сто к одному', '🎤', 'Первый эфир', 'Сыграйте полную игру «Сто к одному»', 1, (c) => Math.min(1, C(c, 'sto'))],
    ['sto10', 'Сто к одному', '📺', 'Завсегдатай студии', 'Сыграйте 10 полных игр «Сто к одному»', 10, (c) => Math.min(10, C(c, 'sto'))],
    ['stofull', 'Сто к одному', '🧾', 'Всё табло', 'Откройте все шесть ответов табло в одном раунде', 1, (c) => Math.min(1, C(c, 'stofull'))],
    ['stobig', 'Сто к одному', '🏆', 'Большая игра', 'Наберите 200 очков в большой игре', 1, (c) => Math.min(1, C(c, 'stobig'))],
    ['ws1', 'Филворд', '🔍', 'Зоркий глаз', 'Решите первый филворд или «Поиск слов»', 1, (c) => Math.min(1, C(c, 'ws'))],
    ['wsexp', 'Филворд', '🦅', 'Орлиный взгляд', 'Решите филворд или «Поиск слов» уровня «Эксперт»', 1, (c) => Math.min(1, C(c, 'wsexp'))],
    ['wsnolist', 'Филворд', '🙈', 'Вслепую', 'Решите филворд от среднего уровня без списка слов', 1, (c) => Math.min(1, C(c, 'wsnolist'))],
    ['wssecret', 'Филворд', '🔐', 'Тайнопись', 'Разгадайте 10 тайных слов в «Поиске слов»', 10, (c) => Math.min(10, C(c, 'wssecret'))],
    ['wsdaily7', 'Филворд', '🗓', 'Неделя слов', 'Решайте филворд дня 7 дней подряд', 7, (c) => Math.min(7, C(c, 'wsstreak'))],
    ['kw1', 'Ключворд', '🔑', 'Первый ключ', 'Разгадайте первый ключворд', 1, (c) => Math.min(1, C(c, 'kw'))],
    ['kwhard', 'Ключворд', '🗝', 'Взломщик', 'Разгадайте ключворд сложного уровня', 1, (c) => Math.min(1, C(c, 'kwhard'))],
    ['kwclean', 'Ключворд', '🕵', 'Без подсказок', 'Разгадайте ключворд от среднего уровня без подсказок и проверок', 1, (c) => Math.min(1, C(c, 'kwclean'))],
    ['kwdaily7', 'Ключворд', '📅', 'Неделя ключей', 'Решайте ключворд дня 7 дней подряд', 7, (c) => Math.min(7, C(c, 'kwstreak'))],
    ['fv1', 'Пять букв', '🟩', 'Первое слово', 'Угадайте первое слово в «Пяти буквах»', 1, (c) => Math.min(1, C(c, 'fvwin'))],
    ['fv2', 'Пять букв', '🎯', 'Со второй попытки', 'Угадайте слово всего за две попытки', 1, (c) => Math.min(1, C(c, 'fv2'))],
    ['fv25', 'Пять букв', '📚', 'Знаток слов', 'Угадайте 25 слов', 25, (c) => Math.min(25, C(c, 'fvwin'))],
    ['fvdaily7', 'Пять букв', '📅', 'Неделя слов', 'Угадывайте слово дня 7 дней подряд', 7, (c) => Math.min(7, C(c, 'fvstreak'))],
    // ---- каждый день ----
    ['tutor1', 'Общие', '🎓', 'Прилежный ученик', 'Пройдите интерактивное обучение по любой игре', 1, (c) => Math.min(1, C(c, 'tutor'))],
    ['tutorall', 'Общие', '🏫', 'Отличник', 'Пройдите обучение во всех восьми играх', 8, (c) => ['chess', 'draughts', 'sudoku', 'crossword', 'nonogram', 'sto', 'words', 'code'].filter((id) => C(c, 'tut_' + id) > 0).length],
    ['act3', 'Каждый день', '🔥', 'Входит в привычку', 'Завершайте хотя бы одну игру 3 дня подряд', 3, (c, u, X) => X.best],
    ['act7', 'Каждый день', '🗓️', 'Неделя без перерыва', 'Играйте 7 дней подряд', 7, (c, u, X) => X.best],
    ['act14', 'Каждый день', '🏃', 'Две недели в строю', 'Играйте 14 дней подряд', 14, (c, u, X) => X.best],
    ['act30', 'Каждый день', '🌙', 'Месяц в игре', 'Играйте 30 дней подряд', 30, (c, u, X) => X.best],
    ['act100', 'Каждый день', '🏛️', 'Столетний игрок', 'Играйте 100 дней подряд', 100, (c, u, X) => X.best],
    ['days10', 'Каждый день', '🔟', 'Десять игровых дней', 'Проведите в игре 10 разных дней', 10, (c, u, X) => X.days],
    ['days50', 'Каждый день', '🪴', 'Полсотни дней', 'Проведите в игре 50 разных дней', 50, (c, u, X) => X.days],
    ['days100', 'Каждый день', '🌳', 'Сотня игровых дней', 'Проведите в игре 100 разных дней', 100, (c, u, X) => X.days],
    ['days365', 'Каждый день', '🎂', 'Год с нами', 'Проведите в игре 365 разных дней', 365, (c, u, X) => X.days],
    ['quest1', 'Каждый день', '✅', 'Всё на сегодня', 'Выполните все четыре задания дня за один день', 1, (c, u, X) => Math.min(1, X.qTotal)],
    ['quest3', 'Каждый день', '🎯', 'Три полных дня', 'Выполните все задания дня в 3 разных дня', 3, (c, u, X) => X.qTotal],
    ['quest7', 'Каждый день', '🥇', 'Неделя заданий', 'Выполняйте все задания дня 7 дней подряд', 7, (c, u, X) => X.bestQ],
    ['week7', 'Каждый день', '📅', 'Все дни недели', 'Сыграйте в каждый из семи дней недели (понедельник, вторник и так далее)', 7, (c, u, X) => X.weekdays],
    ['weekend', 'Каждый день', '🏖️', 'Выходные в игре', 'Играйте и в субботу, и в воскресенье одних выходных', 1, (c, u, X) => (X.weekend ? 1 : 0)],
    ['morning3', 'Каждый день', '🌅', 'Жаворонок', 'Играйте по утрам (с 5 до 12) 3 дня подряд', 3, (c, u, X) => X.bestM],
    ['owl3', 'Каждый день', '🦉', 'Ночная сова', 'Играйте ночью (с 0 до 5) в 3 разных дня', 3, (c, u, X) => X.nights],
    ['threetimes', 'Каждый день', '🍽️', 'Три приёма', 'Сыграйте утром, днём и вечером одного дня', 3, (c, u, X) => X.mde],
    ['games3day', 'Каждый день', '🎭', 'Три игры за день', 'Сыграйте в три разные игры за один день', 3, (c, u, X) => X.maxG],
    ['games5day', 'Каждый день', '🎪', 'Пять игр за день', 'Сыграйте в пять разных игр за один день', 5, (c, u, X) => X.maxG],
    ['games8day', 'Каждый день', '🎡', 'Все восемь за день', 'Сыграйте во все восемь игр за один день', 8, (c, u, X) => X.maxG],
    ['n5day', 'Каждый день', '🏁', 'Марафон дня', 'Завершите 5 игр за один день', 5, (c, u, X) => X.maxN],
    ['n10day', 'Каждый день', '🚀', 'Десять за день', 'Завершите 10 игр за один день', 10, (c, u, X) => X.maxN],
    ['comeback', 'Каждый день', '👋', 'Я вернулся', 'Вернитесь в игру после перерыва в две недели и больше', 1, (c) => Math.min(1, C(c, 'comeback'))],
    ['month10', 'Каждый день', '📆', 'Десять дней в месяце', 'Играйте 10 разных дней в одном месяце', 10, (c, u, X) => X.monthMax],
    ['month20', 'Каждый день', '🗒️', 'Двадцать дней в месяце', 'Играйте 20 разных дней в одном месяце', 20, (c, u, X) => X.monthMax],
    ['doublewin', 'Каждый день', '⚔️', 'Дубль', 'Выиграйте и в шахматах, и в шашках в один день', 1, (c, u, X) => (X.dw ? 1 : 0)],
    // ---- особые дни и часы ----
    ['fri13', 'Особые дни', '🖤', 'Пятница, 13-е', 'Завершите игру в пятницу, 13-го числа', 1, (c) => Math.min(1, C(c, 'fri13'))],
    ['ny', 'Особые дни', '🎄', 'С Новым годом!', 'Завершите игру 31 декабря или 1 января', 1, (c) => Math.min(1, C(c, 'ny'))],
    ['leap', 'Особые дни', '🐸', 'Високосный день', 'Завершите игру 29 февраля', 1, (c) => Math.min(1, C(c, 'leap'))],
    ['apr1', 'Особые дни', '🤡', 'Первое апреля', 'Завершите игру 1 апреля', 1, (c) => Math.min(1, C(c, 'apr1'))],
    ['round', 'Особые дни', '🔢', 'Круглая дата', 'Завершите игру в день, когда число равно месяцу (например, 9.09 или 11.11)', 1, (c) => Math.min(1, C(c, 'round'))],
    ['mirror', 'Особые дни', '🪞', 'Зеркальное время', 'Завершите игру, когда на часах время читается одинаково в обе стороны (12:21, 20:02)', 1, (c) => Math.min(1, C(c, 'mirror'))],
    ['seq', 'Особые дни', '🔗', 'По порядку', 'Завершите игру ровно в 12:34, 01:23 или 23:45', 1, (c) => Math.min(1, C(c, 'seq'))],
    ['pi', 'Особые дни', '🥧', 'Число Пи', 'Завершите игру в 3:14 (утром или дня)', 1, (c) => Math.min(1, C(c, 'pi'))],
    ['midnight', 'Особые дни', '🕛', 'Ровно в полночь', 'Завершите игру в первые пять минут после полуночи', 1, (c) => Math.min(1, C(c, 'midnight'))],
    // ---- коллекции и мастерство ----
    ['pic10', 'Коллекции', '🖼️', 'Десять сюжетов', 'Решите японские кроссворды с 10 разными картинками', 10, (c, u, X) => X.pics],
    ['pic50', 'Коллекции', '🏛️', 'Пятьдесят сюжетов', 'Решите японские кроссворды с 50 разными картинками', 50, (c, u, X) => X.pics],
    ['pic100', 'Коллекции', '🎨', 'Музей', 'Решите японские кроссворды со 100 разными картинками', 100, (c, u, X) => X.pics],
    ['piccat', 'Коллекции', '🗂️', 'Знаток тем', 'Решите японские кроссворды из 10 разных категорий картинок', 10, (c, u, X) => X.cats],
    ['clean3', 'Мастерство', '🧼', 'Три чистых подряд', 'Решите три головоломки подряд без подсказок и ошибок', 3, (c) => C(c, 'cleanBest')],
    ['clean10', 'Мастерство', '💎', 'Десять чистых подряд', 'Решите десять головоломок подряд без подсказок и ошибок', 10, (c) => C(c, 'cleanBest')],
    // ---- секретные ----
    ['slogo', 'Секретные', '🕵️', 'Любопытный', 'Нажмите на заголовок главной страницы 7 раз подряд', 1, (c) => Math.min(1, C(c, 'slogo')), 1],
    ['stheme', 'Секретные', '🦎', 'Хамелеон', 'Переключите тему оформления 5 раз', 5, (c) => C(c, 'themeSw'), 1],
    ['sresign', 'Секретные', '🏳️', 'Сдаюсь!', 'Проиграйте шахматную партию, не сделав и трёх ходов', 1, (c) => Math.min(1, C(c, 'sresign')), 1],
    ['snightwin', 'Секретные', '🌃', 'Полуночный стратег', 'Выиграйте шахматную партию ночью (с 0 до 5)', 1, (c) => Math.min(1, C(c, 'snightwin')), 1]
  ].map(([id, group, icon, title, desc, goal, prog, secret]) => ({ id, group, icon, title, desc, goal, prog, secret: !!secret }));
  const RANKS = [[0, 'Новичок'], [5, 'Любитель'], [15, 'Игрок'], [30, 'Знаток'], [50, 'Мастер'], [75, 'Эксперт'], [100, 'Гроссмейстер'], [115, 'Легенда']];
  const rankOf = (n) => { let r = RANKS[0], nx = null; for (let i = 0; i < RANKS.length; i++) if (n >= RANKS[i][0]) { r = RANKS[i]; nx = RANKS[i + 1] || null; } return { name: r[1], next: nx ? nx[0] - n : 0, nextName: nx ? nx[1] : '' }; };

  const css = `
.pga-rank { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding:6px 20px 8px; font-size:13px; } .pga-rank .pga-rk b { font-size:15px; color:var(--k-gt); } .pga-rn { color:var(--k-mu); font-size:12px; }
.pga-quests { margin:2px 16px 10px; border:1px solid var(--k-line); background:var(--k-surf); padding:8px 12px 6px; } .pga-qh { display:flex; justify-content:space-between; align-items:baseline; font-size:13px; margin-bottom:4px; } .pga-qh span { color:var(--k-mu); font-size:12px; }
.pga-q { display:flex; align-items:center; gap:10px; padding:5px 0; border-top:1px solid var(--k-line); font-size:13.5px; } .pga-q .pga-qi { width:22px; text-align:center; font-size:15px; } .pga-q .pga-qt { flex:1; } .pga-q a { background:var(--k-acc); color:#fff; padding:4px 10px; font-size:12px; font-weight:700; text-decoration:none; } .pga-q.ok .pga-qt { color:var(--k-mu); text-decoration:line-through; } .pga-q.ok .pga-qi { color:var(--k-gt); font-weight:700; }
.pga-item.sec .pga-t b { color:var(--k-mu); } .pga-item.sec .pga-ic { filter:grayscale(1); opacity:.6; }
.pga-badge { position:absolute; top:-4px; right:-4px; min-width:17px; height:17px; padding:0 4px; border-radius:9px; background:#C0392B; color:#fff; font:700 11px/17px 'Noto Sans',system-ui,sans-serif; text-align:center; font-style:normal; pointer-events:none; } #pga-btn { position:relative; top:auto; right:auto; left:auto; bottom:auto; }
.pga-ov { position:fixed; inset:0; z-index:420; background:rgba(42,46,36,.4); display:flex; align-items:center; justify-content:center; padding:14px; font-family:'Noto Sans',system-ui,sans-serif; }
.pga-panel { position:relative; background:var(--k-panel); border:1px solid var(--k-line); width:100%; max-width:520px; max-height:calc(100dvh - 28px); overflow-y:auto; box-shadow:0 30px 80px rgba(42,46,36,.3); color:var(--k-tx); padding:22px 20px 18px; }
.pga-panel h3 { margin:0 0 4px; font:italic 400 26px Georgia,'Times New Roman',serif; } .pga-sub { font-size:13px; color:var(--k-mu); margin:0 0 12px; } .pga-x { position:absolute; top:10px; right:12px; background:none; border:none; font-size:18px; color:var(--k-mu2); cursor:pointer; }
.pga-streaks { display:flex; gap:8px; margin:0 0 14px; flex-wrap:wrap; } .pga-chip { flex:1; min-width:140px; background:var(--k-surf); border:1px solid var(--k-line); padding:9px 11px; font-size:12.5px; color:var(--k-mu); } .pga-chip b { display:block; font-size:20px; color:var(--k-tx); margin-top:2px; } .pga-chip b i { font-style:normal; font-size:15px; }
.pga-g { font-size:12px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--k-mu); margin:14px 0 6px; }
.pga-item { display:flex; gap:11px; align-items:center; padding:9px 0; border-bottom:1px solid var(--k-line); } .pga-item:last-child { border-bottom:none; }
.pga-ic { width:40px; height:40px; border-radius:50%; background:var(--k-surf); border:1px solid var(--k-line); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; filter:grayscale(1); opacity:.55; } .pga-item.on .pga-ic { background:var(--k-warm); border-color:#C49A36; filter:none; opacity:1; }
.pga-t { flex:1; min-width:0; } .pga-t b { display:block; font-size:14px; } .pga-t span { display:block; font-size:12px; color:var(--k-mu); margin-top:1px; line-height:1.35; } .pga-item:not(.on) .pga-t b { color:var(--k-mu); }
.pga-bar { height:5px; background:var(--k-line); margin-top:6px; overflow:hidden; } .pga-bar i { display:block; height:100%; background:var(--k-acc); } .pga-item.on .pga-bar i { background:#C49A36; }
.pga-d { font-size:11.5px; color:var(--k-mu2); flex-shrink:0; text-align:right; }
#pga-toasts { position:fixed; left:50%; transform:translateX(-50%); bottom:14px; z-index:440; display:flex; flex-direction:column; gap:8px; width:min(380px, calc(100vw - 24px)); font-family:'Noto Sans',system-ui,sans-serif; pointer-events:none; }
.pga-toast { pointer-events:auto; cursor:pointer; display:flex; gap:11px; align-items:center; background:#2A2E24; color:#fff; border-left:4px solid #C49A36; padding:11px 14px; box-shadow:0 14px 36px rgba(0,0,0,.4); animation:pgaIn .35s ease; } .pga-toast .i { font-size:26px; } .pga-toast small { display:block; font-size:11px; opacity:.7; letter-spacing:.06em; text-transform:uppercase; } .pga-toast b { font-size:14px; display:block; margin-top:1px; } .pga-toast span { font-size:12px; opacity:.8; display:block; margin-top:1px; }
@keyframes pgaIn { from { transform:translateY(20px); opacity:0; } to { transform:none; opacity:1; } }`;
  const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  const rootUrl = () => { let p = location.pathname.replace(/index\.html$/, '').replace(/\/(chess|draughts|sudoku|crossword|nonogram|sto|words|code)\/$/, '/'); if (!p.endsWith('/')) p += '/'; return location.origin + p; };
  function toasts(list) {
    if (!document.body) return; let box = document.getElementById('pga-toasts'); if (!box) { box = document.createElement('div'); box.id = 'pga-toasts'; document.body.appendChild(box); }
    if (list.length > 3) { const rest = list.length - 2; list = list.slice(0, 2).concat([{ id: 'more', icon: '🏅', title: 'Ещё достижений: ' + rest, desc: 'Нажмите, чтобы посмотреть все' }]); }          // не заваливаем экран, если достижений сразу много
    list.forEach((d, i) => setTimeout(() => {
      const t = document.createElement('div'); t.className = 'pga-toast'; t.dataset.id = d.id; t.innerHTML = `<span class="i">${d.icon}</span><div><small>Достижение получено</small><b>${esc(d.title)}</b><span>${esc(d.desc)}</span></div>`;
      t.onclick = () => { t.remove(); if (document.getElementById('pga-btn')) open(); else location.href = rootUrl() + '?achievements=1'; }; box.appendChild(t); setTimeout(() => t.remove(), 7000);
    }, i * 600));
  }
  function check() {
    const s = read(), fresh = [];
    for (let pass = 0; pass < 4; pass++) {                   // повторяем: одно достижение может открыть другое («Коллекционер»)
      let any = false;
      const X = stats(s); DEFS.forEach((d) => { if (!s.u[d.id] && d.prog(s.c, s.u, X) >= d.goal) { s.u[d.id] = Date.now(); fresh.push(d); any = true; } });
      if (!any) break;
    }
    if (fresh.length) { write(s); toasts(fresh); window.dispatchEvent(new CustomEvent('pga-unlocked', { detail: { ids: fresh.map((x) => x.id) } })); }
    return fresh.map((x) => x.id);
  }
  // Добавляет к счётчикам то, что игрок уже сделал раньше (по локальной статистике)
  function seed() {
    const s = read(), c = s.c; const max = (k, v) => { if (v > (c[k] || 0)) c[k] = v; };
    const J = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
    const sd = J('sudokuStats'), cw = J('crosswordStats'), ch = J('chessGameHistory'), dr = J('draughtsHistory'), jp = J('nonogramStats');
    if (jp && jp.solved) { max('jp', Object.values(jp.solved).reduce((a, b) => a + (b || 0), 0)); if (jp.daily) max('streak', jp.daily.streak || 0); }
    if (sd && sd.solved) { max('sd', Object.values(sd.solved).reduce((a, b) => a + (b || 0), 0)); max('sdx', sd.solved.expert || 0); if (sd.daily) max('streak', sd.daily.streak || 0); }
    if (cw && cw.solved) { max('cw', Object.values(cw.solved).reduce((a, b) => a + (b || 0), 0)); max('cwbig', (cw.solved.super || 0) + (cw.solved.mega || 0)); if (cw.weekly && cw.weekly.results) max('cwweek', Object.keys(cw.weekly.results).length); if (cw.daily) max('streak', cw.daily.streak || 0); }
    [['ch', ch], ['dr', dr]].forEach(([p, list]) => { if (!Array.isArray(list)) return; max(p + 'P', list.length); list.forEach((r) => { if (r.result === 'win') { max(p + 'W', list.filter((x) => x.result === 'win').length); if (r.opponent) max(p + 'On', list.filter((x) => x.result === 'win' && x.opponent).length); else if (r.level) max(p + 'Bot', r.level); } }); });
    [['ch', ch], ['dr', dr]].forEach(([p, list]) => { if (Array.isArray(list)) max(p + 'D', list.filter((r) => r.result === 'draw').length); });
    try { if (window.PGS && PGS.get().theme === 'dark') max('dark', 1); } catch (e) {} try { if (window.PGS && PGS.install && PGS.install.installed()) max('install', 1); } catch (e) {}
    max('done', (c.sd || 0) + (c.cw || 0) + (c.chP || 0) + (c.drP || 0) + (c.jp || 0) ? 1 : 0);
    // прошлые решённые задания дня уже были днями в игре: серия «дней подряд» не начинается с нуля
    [[sd, 4, 1], [cw, 8, 2], [jp, 16, 4]].forEach(([st, gbit, qbit]) => { const res = st && st.daily && st.daily.results; if (res) Object.keys(res).forEach((k) => { if (/^\d{4}-\d{2}-\d{2}$/.test(k)) { const day = s.d[k] = s.d[k] || { g: 0, t: 0, n: 0, q: 0, w: 0 }; day.g |= gbit; day.q |= qbit | 8; day.n = Math.max(day.n | 0, 1); } }); });
    write(s); return check();
  }
  const dayNum = () => { const t = new Date(); return t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate(); };
  function dailySet(c) {          // судоку, кроссворд и картинка дня решены в один день
    const J = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, d = new Date(), tk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const has = (k) => { const o = J(k); return !!(o && o.daily && o.daily.results && o.daily.results[tk] != null); };
    if (['sudokuStats', 'crosswordStats', 'nonogramStats', 'wordsStats', 'codeStats'].filter(has).length >= 3 && dayNum() > (c.dailysetLast || 0)) { c.dailyset = (c.dailyset || 0) + 1; c.dailysetLast = dayNum(); }
  }
  // Записывает завершённую игру в «день активности»: какая игра, в какое время суток, выполнены ли задания дня
  function touchDay(s, game, d) {
    const gbit = { chess: 1, draughts: 2, sudoku: 4, crossword: 8, nonogram: 16, sto: 32, words: 64, code: 128, five: 256 }[game]; if (!gbit) return;
    const now = new Date(), k = keyOf(now), h = now.getHours(), tb = h < 5 ? 8 : h < 12 ? 1 : h < 18 ? 2 : 4;
    if (!s.d[k]) { const prev = Object.keys(s.d).sort().pop(); if (prev && dnum(k) - dnum(prev) >= 14) s.c.comeback = (s.c.comeback || 0) + 1; s.d[k] = { g: 0, t: 0, n: 0, q: 0, w: 0 }; }
    const day = s.d[k]; day.g |= gbit; day.t |= tb; day.n = (day.n | 0) + 1; day.q |= 8; if (d.daily) day.q |= ({ sudoku: 1, crossword: 2, nonogram: 4, words: 16, code: 32 }[game] || 0); if (d.result === 'win') day.w |= gbit;
  }
  function event(game, d) {
    d = d || {}; const s = read(), c = s.c; const inc = (k, n) => { c[k] = (c[k] || 0) + (n || 1); }, max = (k, v) => { c[k] = Math.max(c[k] || 0, v || 0); };
    if (game === 'sudoku') { inc('sd'); inc('done'); if (d.diff === 'expert') inc('sdx'); if (!d.hints && !d.mistakes && (d.diff === 'hard' || d.diff === 'expert')) inc('sdclean'); if (d.diff === 'easy' && d.time < 180000) inc('sdfast'); if (d.diff === 'expert' && d.time < 900000) inc('sdfx'); if (!d.mistakes && d.diff !== 'easy') inc('sdnm'); }
    if (game === 'crossword') { inc('cw'); inc('done'); if (d.words >= 49) inc('cwbig'); if (d.words >= 100) inc('cwmega'); if (d.week) inc('cwweek'); if (d.level >= 5) inc('cwexp'); if (d.words >= 22 && !d.hints) inc('cwclean'); if (d.words >= 15 && d.time < 240000) inc('cwquick'); }
    if (game === 'nonogram') { inc('jp'); inc('done'); if (d.rows >= 50 && d.cols >= 50) inc('jpbig'); if (d.rows >= 100 && d.cols >= 100) inc('jphuge'); if (d.rows >= 20 && d.cols >= 20 && !d.hints) inc('jpclean'); if (d.rows <= 10 && d.cols <= 10 && d.time < 90000) inc('jpfast'); if (d.rows >= 30 && d.cols >= 30) inc('jpmid'); if (d.rows !== d.cols) inc('jprect'); if (d.level >= 1 && d.level <= 5) { inc('jpl' + d.level); if (d.level === 5 && d.rows >= 15 && d.cols >= 15) inc('jpx'); } }
    if ((game === 'sudoku' || game === 'crossword' || game === 'nonogram') && d.daily) { max('streak', d.streak); dailySet(c); }
    if (game === 'chess' || game === 'draughts') {
      const p = game === 'chess' ? 'ch' : 'dr'; inc(p + 'P'); inc('done'); if (d.result === 'draw') inc(p + 'D');
      if (d.result === 'win') { inc(p + 'W'); if (d.online) inc(p + 'On'); else if (d.level) max(p + 'Bot', d.level); if (d.color === 'b') inc(p + 'Blk'); if (!d.online && d.level >= 3 && d.moves && d.moves <= (game === 'chess' ? 30 : 40)) inc(p + 'Mini'); }
      if (d.moves >= (game === 'chess' ? 120 : 100)) inc(p + 'Long');
    }
    if (game === 'sudoku' || game === 'crossword' || game === 'nonogram' || game === 'chess' || game === 'draughts' || game === 'sto' || game === 'words' || game === 'code' || game === 'five') { const h = new Date().getHours(); if (h < 5) inc('night'); else if (h < 8) inc('early'); if (navigator.onLine === false) inc('offline'); }
    const completion = game === 'sudoku' || game === 'crossword' || game === 'nonogram' || game === 'chess' || game === 'draughts' || game === 'sto' || game === 'words' || game === 'code' || game === 'five';
    if (completion) {
      touchDay(s, game, d); const now = new Date(), H = now.getHours(), M = now.getMinutes(), dd = now.getDate(), mm = now.getMonth() + 1, hhmm = String(H).padStart(2, '0') + String(M).padStart(2, '0');
      if (dd === 13 && now.getDay() === 5) inc('fri13'); if ((mm === 12 && dd === 31) || (mm === 1 && dd === 1)) inc('ny'); if (mm === 2 && dd === 29) inc('leap'); if (mm === 4 && dd === 1) inc('apr1'); if (dd === mm) inc('round');
      if (hhmm === hhmm.split('').reverse().join('')) inc('mirror'); if (hhmm === '1234' || hhmm === '0123' || hhmm === '2345') inc('seq'); if (hhmm === '0314' || hhmm === '1514') inc('pi'); if (H === 0 && M < 5) inc('midnight');
      if (game === 'chess') { if (d.result === 'win' && H < 5) inc('snightwin'); if (d.result && d.result !== 'win' && d.result !== 'draw' && d.moves && d.moves <= 4) inc('sresign'); }
      const clean = game === 'sudoku' ? !d.hints && !d.mistakes : (game === 'crossword' || game === 'nonogram') ? !d.hints : null;
      if (clean !== null) { let run = 0; try { run = +localStorage.getItem('pgCleanRun') || 0; } catch (e) {} run = clean ? run + 1 : 0; try { localStorage.setItem('pgCleanRun', String(run)); } catch (e) {} max('cleanBest', run); }
      if (game === 'nonogram') { const nm = String(d.name || '').split(' · ')[0]; if (nm && nm !== 'Картина' && s.p.indexOf(nm) < 0) s.p.push(nm); if (d.cat && s.p.indexOf('cat:' + d.cat) < 0) s.p.push('cat:' + d.cat); }
    }
    if (game === 'secret' && d.id === 'logo') inc('slogo');
    if (game === 'five') { inc('fv'); inc('done'); if (d.result === 'win') { inc('fvwin'); if (d.tries <= 2) inc('fv2'); if (d.daily) max('fvstreak', d.streak || 1); } }      // «Пять букв»
    if (game === 'code') { inc('kw'); if (d.level >= 3) inc('kwhard'); if (d.level >= 2 && !d.hints && !d.checks) inc('kwclean'); if (d.daily) max('kwstreak', d.streak || 1); }
    if (game === 'words') { inc('ws'); if (d.level >= 4) inc('wsexp'); if (d.secret) inc('wssecret'); if (d.daily) max('wsstreak', d.streak || 1); if (d.mode === 'fil' && d.noList && d.level >= 2 && !d.hints) inc('wsnolist'); }
    if (game === 'sto') { inc('sto'); if (d.full) inc('stofull'); if (d.bigWin) inc('stobig'); }
    if (game === 'tutor') { inc('tutor'); if (d.id) max('tut_' + d.id, 1); }
    if (game === 'friend') inc('friend');
    if (game === 'challenge') inc('chal');
    if (game === 'rank') { inc('inboard'); if (d.pos && d.pos <= 10) inc('top10'); if (d.pos && d.pos <= 3) inc('podium'); if (d.pos === 1) inc('first1'); }
    write(s); return check();
  }
  // ---------- задания на сегодня: каждый день — три ежедневные головоломки из пяти (одни и те же у всех) и «любая игра» ----------
  const DAILIES = [[1, '🔢', 'Судоку дня', 'sudoku/', 'sudokuStats'], [2, '🔤', 'Кроссворд дня', 'crossword/', 'crosswordStats'], [4, '🧩', 'Картинка дня', 'nonogram/', 'nonogramStats'], [16, '🔍', 'Филворд дня', 'words/', 'wordsStats'], [32, '🔑', 'Ключворд дня', 'code/', 'codeStats']];
  const ROTATE_SINCE = '2026-10-30';        // до этого дня заданиями были судоку, кроссворд и картинка
  // все 10 сочетаний «три из пяти» идут по кругу, по одному на день: за любые 10 дней каждая головоломка — ровно 6 раз
  const COMBOS = [[0, 1, 3], [2, 3, 4], [0, 2, 4], [1, 2, 3], [0, 1, 4], [0, 2, 3], [1, 3, 4], [0, 3, 4], [1, 2, 4], [0, 1, 2]];
  function dailiesFor(k) {
    if (k < ROTATE_SINCE) return DAILIES.slice(0, 3);
    const day = Math.round(Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)) / 86400000);
    return COMBOS[((day % 10) + 10) % 10].map((i) => DAILIES[i]);
  }
  const maskFor = (k) => dailiesFor(k).reduce((m, x) => m | x[0], 8);
  const questsFor = (k) => dailiesFor(k).map(([bit, ic, t, href]) => [bit, ic, t, href]).concat([[8, '🎯', 'Завершить любую игру', '']]);
  const QUESTS = questsFor(keyOf(new Date()));
  function questBits() {
    const s = read(), k = keyOf(new Date()), d = s.d[k] || { q: 0, n: 0 }; let q = d.q | 0;
    DAILIES.forEach(([bit, , , , key]) => { try { const o = JSON.parse(localStorage.getItem(key) || 'null'); if (o && o.daily && o.daily.results && o.daily.results[k] != null) q |= bit; } catch (e) {} });
    if ((d.n | 0) > 0 || (q & 55)) q |= 8; return q & maskFor(k);
  }
  const curStreak = (k) => { try { const o = JSON.parse(localStorage.getItem(k) || 'null'), d = o && o.daily; if (!d || !d.last) return 0; const today = keyOf(new Date()), y = keyOf(new Date(Date.now() - 86400000)); return d.last === today || d.last === y ? d.streak || 0 : 0; } catch (e) { return 0; } };
  function list() { const s = read(), X = stats(s); return DEFS.map((d) => ({ id: d.id, group: d.group, icon: d.icon, title: d.title, desc: d.desc, goal: d.goal, secret: d.secret, value: Math.min(d.goal, d.prog(s.c, s.u, X)), got: s.u[d.id] || 0 })); }
  function open() {
    if (document.getElementById('pga-ov')) return; const ov = document.createElement('div'); ov.className = 'pga-ov'; ov.id = 'pga-ov';
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); window.removeEventListener('pgsync-applied', paint); }; const onKey = (e) => { if (e.key === 'Escape') close(); };
    function paint() {
      const items = list(), got = items.filter((x) => x.got).length, groups = [...new Set(items.map((x) => x.group))], ss = curStreak('sudokuStats'), sc = curStreak('crosswordStats'), X = stats(read()), rk = rankOf(got), q = questBits(), done = pop(q), root = rootUrl();
      const row = (x) => { const hid = x.secret && !x.got; return `<div class="pga-item${x.got ? ' on' : ''}${hid ? ' sec' : ''}" data-id="${x.id}"><span class="pga-ic">${hid ? '❓' : x.icon}</span><div class="pga-t"><b>${hid ? 'Секретное достижение' : esc(x.title)}</b><span>${hid ? 'Подсказка: исследуйте игру, и оно найдёт вас' : esc(x.desc)}</span>${!x.got && !hid && x.goal > 1 ? `<div class="pga-bar"><i style="width:${Math.round(100 * x.value / x.goal)}%"></i></div>` : ''}</div><span class="pga-d">${x.got ? new Date(x.got).toLocaleDateString('ru-RU') : (!hid && x.goal > 1 ? x.value + ' / ' + x.goal : '')}</span></div>`; };
      ov.innerHTML = `<div class="pga-panel" role="dialog"><button class="pga-x" aria-label="Закрыть">✕</button><h3>Достижения</h3><p class="pga-sub">Получено ${got} из ${items.length}</p>
        <div class="pga-rank"><span class="pga-rk">Звание: <b>${esc(rk.name)}</b></span>${rk.next ? `<span class="pga-rn">до «${esc(rk.nextName)}»: ещё ${rk.next}</span>` : '<span class="pga-rn">высшее звание!</span>'}</div>
        <div class="pga-quests"><div class="pga-qh"><b>Задания на сегодня</b><span>${done} из ${QUESTS.length}${done === QUESTS.length ? ' — всё выполнено 🎉' : ''}</span></div>${questsFor(keyOf(new Date())).map(([bit, ic, t, href]) => `<div class="pga-q${q & bit ? ' ok' : ''}"><span class="pga-qi">${q & bit ? '✓' : ic}</span><span class="pga-qt">${esc(t)}</span>${q & bit || !href ? '' : `<a href="${root}${href}">Играть</a>`}</div>`).join('')}</div>
        <div class="pga-streaks"><div class="pga-chip">Дней подряд в игре<b>${X.cur} <i>${X.cur ? '🔥' : ''}</i></b></div><div class="pga-chip">Серия судоку дня<b>${ss} <i>${ss ? '🔥' : ''}</i></b></div><div class="pga-chip">Серия кроссворда дня<b>${sc} <i>${sc ? '🔥' : ''}</i></b></div></div>
        ${groups.map((g) => `<div class="pga-g">${esc(g)}</div>` + items.filter((x) => x.group === g).map(row).join('')).join('')}</div>`;
      ov.querySelector('.pga-x').onclick = close;
    }
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); }); document.addEventListener('keydown', onKey); window.addEventListener('pgsync-applied', paint); document.body.appendChild(ov); seed(); paint();
  }
  // значок «сколько заданий на сегодня осталось» на кнопке «Достижения» главной страницы
  function badge() { const b = document.getElementById('pga-btn'); if (!b) return; let i = b.querySelector('.pga-badge'); if (!i) { i = document.createElement('i'); i.className = 'pga-badge'; b.appendChild(i); } const left = questsFor(keyOf(new Date())).length - pop(questBits()); i.textContent = left > 0 ? String(left) : ''; i.style.display = left > 0 ? '' : 'none'; b.title = left > 0 ? 'Заданий на сегодня осталось: ' + left : 'Все задания на сегодня выполнены'; }
  window.PGA = { event, seed, check, list, open, defs: DEFS, curStreak, stats: () => stats(read()), questBits, rankOf, badge };
  let lastTheme = null;
  window.addEventListener('pgs-change', () => { try { if (!window.PGS) return; const th = PGS.get().theme, s = read(); let ch = false; if (lastTheme !== null && th !== lastTheme) { s.c.themeSw = (s.c.themeSw || 0) + 1; ch = true; } lastTheme = th; if (th === 'dark' && !(s.c.dark > 0)) { s.c.dark = 1; ch = true; } if (ch) { write(s); check(); } } catch (e) {} });
  const boot = () => { const b = document.getElementById('pga-btn'); if (b) b.onclick = open; try { if (window.PGS) lastTheme = PGS.get().theme; } catch (e) {} setTimeout(seed, 600);
    if (b) { badge(); window.addEventListener('pga-changed', badge); window.addEventListener('storage', badge); document.addEventListener('visibilitychange', () => { if (!document.hidden) badge(); }); const h1 = document.querySelector('header h1'); if (h1) { let n = 0, t = 0; h1.addEventListener('click', () => { const now = Date.now(); n = now - t < 1500 ? n + 1 : 1; t = now; if (n >= 7) { n = 0; event('secret', { id: 'logo' }); } }); } } if (b && /[?&]achievements=1/.test(location.search)) { try { history.replaceState(null, '', location.pathname); } catch (e) {} open(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
