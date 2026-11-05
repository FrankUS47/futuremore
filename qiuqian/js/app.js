/* 主流程:選籤種 → 稟告 → 擲筊請示 → 抽籤 → 擲筊確認 → 解籤。 */
(function (QQ) {
  const $ = (s, r) => (r || document).querySelector(s);
  const VIEWS = ['series', 'petition', 'ask', 'draw', 'confirm', 'result'];
  const STEP_LABELS = ['選擇籤種', '稟告神明', '擲筊請示', '抽取籤詩', '擲筊確認', '解籤'];

  const state = {
    series: null, petition: null, need: QQ.config.rules.defaultNeed,
    stick: null, poem: null, panel: null, redraws: 0, view: 'series'
  };

  /* 小工具:建立元素(一律用 textContent,不會把使用者輸入當成 HTML) */
  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 無痕模式等情況:忽略 */ } }
  };

  /* ── 畫面切換 ─────────────────────────────────────── */
  function renderSteps(idx) {
    const ol = $('#steps');
    ol.innerHTML = '';
    STEP_LABELS.forEach((label, i) => {
      const li = h('li', i < idx ? 'done' : i === idx ? 'current' : '');
      if (i === idx) li.setAttribute('aria-current', 'step');
      li.append(h('b', '', i < idx ? '✓' : String(i + 1)), h('span', '', label));
      ol.appendChild(li);
    });
  }

  function go(view) {
    if (state.panel) { state.panel.destroy(); state.panel = null; }
    state.view = view;
    VIEWS.forEach(v => { $('#view-' + v).hidden = v !== view; });
    renderSteps(VIEWS.indexOf(view));
    window.scrollTo({ top: 0, behavior: 'auto' });
    const hd = $('#view-' + view + ' h2');
    if (hd) { hd.tabIndex = -1; hd.focus({ preventScroll: true }); }
  }

  /* ── 1. 選籤種 ─────────────────────────────────────── */
  function initSeries() {
    const list = $('#seriesList');
    QQ.config.series.forEach(s => {
      const card = h('button', 'series-card' + (s.enabled ? '' : ' off'));
      card.type = 'button';
      card.disabled = !s.enabled;
      card.append(
        h('span', 'series-seal', s.temple.slice(-2)),
        h('span', 'series-name', s.name),
        h('span', 'series-official', `${s.official} · 共 ${s.total} 首`),
        h('span', 'series-blurb', s.blurb),
        h('span', 'badge' + (s.enabled ? '' : ' muted'), s.enabled ? '開始求籤' : '即將開放')
      );
      if (s.enabled) card.addEventListener('click', () => chooseSeries(s));
      list.appendChild(card);
    });
  }

  function chooseSeries(s) {
    state.series = s;
    document.querySelectorAll('.patron').forEach(e => (e.textContent = s.patron));
    $('#petitionSeries').textContent = `${s.name}(${s.official})`;
    updateVow();
    go('petition');
  }

  /* ── 2. 稟告神明 ───────────────────────────────────── */
  const f = {};
  function initPetition() {
    ['pName', 'pAge', 'pAddr', 'pCat', 'pQuestion', 'pVow'].forEach(id => (f[id] = $('#' + id)));
    const A = QQ.config.age;
    const dl = $('#ageList');
    for (let i = A.min; i <= A.max; i++) dl.appendChild(new Option(i + '歲'));
    f.pAge.placeholder = `${A.min}–${A.max} 歲`;
    f.pAge.addEventListener('input', () => { f.pAge.value = f.pAge.value.replace(/[^\d歲]/g, ''); });
    f.pAge.addEventListener('change', () => { const n = parseInt(f.pAge.value, 10); f.pAge.value = n ? n + '歲' : ''; updateVow(); });
    f.pCat.appendChild(new Option('請選擇問事類別', ''));
    QQ.config.categories.forEach(c => f.pCat.appendChild(new Option(c, c)));
    ['pName', 'pAge', 'pAddr', 'pQuestion'].forEach(id => f[id].addEventListener('input', updateVow));
    f.pCat.addEventListener('change', updateVow);
    f.pQuestion.addEventListener('input', () => ($('#qCount').textContent = `${f.pQuestion.value.length} / 100`));
    $('#petitionForm').addEventListener('submit', onPetition);
    $('[data-act="to-series"]').addEventListener('click', () => go('series'));
  }

  function vowText(p, patron) {
    const what = (p.category || '○○') + (p.question ? `(${p.question})` : '');
    return `${patron}在上,弟子 ${p.name || '○○○'},現年 ${p.age || '○○'} 歲,住 ${p.addr || '○○○○○○'},` +
           `今為「${what}」一事,誠心前來求籤,懇請${patron}慈悲指點迷津。`;
  }
  function updateVow() {
    const p = { name: f.pName.value.trim(), age: parseInt(f.pAge.value, 10) || '', addr: f.pAddr.value.trim(), category: f.pCat.value, question: f.pQuestion.value.trim() };
    $('#vowPreview').textContent = vowText(p, state.series ? state.series.patron : '恩主公');
  }

  function setErr(input, msg) {
    const box = input.closest('.field, .check');
    box.classList.toggle('invalid', !!msg);
    const e = box.querySelector('.err');
    if (e) e.textContent = msg || '';
  }

  function onPetition(ev) {
    ev.preventDefault();
    const name = f.pName.value.trim(), addr = f.pAddr.value.trim(), q = f.pQuestion.value.trim();
    const age = parseInt(f.pAge.value, 10);
    let bad = null;
    const check = (input, cond, msg) => { setErr(input, cond ? '' : msg); if (!cond && !bad) bad = input; };
    check(f.pName, name.length > 0, '請填寫姓名');
    check(f.pAge, Number.isInteger(age) && age >= QQ.config.age.min && age <= QQ.config.age.max,
          `請選擇或輸入年齡(${QQ.config.age.min}–${QQ.config.age.max} 歲)`);
    check(f.pAddr, addr.length > 0, '請填寫住址');
    check(f.pCat, !!f.pCat.value, '請選擇問事類別');
    check(f.pVow, f.pVow.checked, '請勾選,表示已虔誠稟告');
    if (bad) { bad.focus(); return; }
    state.redraws = 0;
    state.petition = { name, age, addr, category: f.pCat.value, question: q, date: new Date() };
    if (QQ.device.isMobile) QQ.motion.request().then(goAsk); else goAsk();
  }

  /* ── 3. 擲筊請示 ───────────────────────────────────── */
  function goAsk() {
    go('ask');
    $('#askVow').textContent = vowText(state.petition, state.series.patron);
    state.panel = new QQ.BeiPanel($('#askPanel'), {
      need: state.need, successLabel: '前往抽籤',
      failText: {
        xiao: '神明笑而不答,請再斟酌所問之事後重擲。',
        yin: '神明未允,請再誠心稟告後重擲。'
      },
      failActions: [{ label: '重新擲筊', retry: true },
                    { label: '返回修改稟告', handler: () => go('petition') }],
      onSuccess: goDraw
    });
  }

  /* ── 4. 抽籤 ───────────────────────────────────────── */
  function goDraw() {
    go('draw');
    $('#redrawNote').textContent = state.redraws ? `已重新取籤 ${state.redraws} 次` : '';
    const grid = $('#stickGrid');
    grid.classList.remove('picked');
    grid.innerHTML = '';
    grid.hidden = true;
    state.panel = new QQ.Tube($('#tubeBox'), {
      total: state.series.total,
      onPick: (num) => onPick(num, null),
      onGrid: () => {                              // 改用 100 支方格自己選
        state.panel = null;
        grid.hidden = false;
        QQ.grid.render(grid, state.series.total, onPick);
      }
    });
  }

  async function onPick(num, btn) {
    state.stick = num;
    state.poem = null;
    const loading = QQ.poems.load(state.series, num);
    if (btn) {
      btn.querySelector('.mark').textContent = QQ.poems.pad(num);
      btn.classList.add('flip');
    }
    const [res] = await Promise.all([loading, new Promise(r => setTimeout(r, btn ? 900 : 0))]);
    state.poem = res;
    goConfirm();
  }

  /* ── 5. 擲筊確認 ───────────────────────────────────── */
  function goConfirm() {
    go('confirm');
    const n = state.stick;
    const box = $('#confirmPreview');
    box.innerHTML = '';
    box.append(poemCard(n, state.poem));
    state.panel = new QQ.BeiPanel($('#confirmPanel'), {
      need: state.need, successLabel: '恭請解籤',
      failText: {
        xiao: '神明笑而不答,此籤是否為您所求,尚未確定。',
        yin: '神明未允,此籤並非您所求的籤。'
      },
      failActions: [
        { label: '重新取籤', primary: true, handler: () => { state.redraws++; goDraw(); } },
        { label: '結束求籤', handler: restart }
      ],
      onSuccess: goResult
    });
  }

  /* 卡片標題列:籤種、第幾籤、典故、干支與吉凶 */
  function poemHead(n, data) {
    const head = h('header', 'poem-head');
    head.append(h('span', 'poem-series', state.series.official),
                h('strong', 'poem-no', (data && data.number_text) || `第 ${n} 籤`));
    if (data && data.title) head.append(h('span', 'poem-title', data.title));
    const tags = [data && data.ganzhi, data && data.fortune].filter(Boolean);
    if (tags.length) head.append(h('span', 'poem-tags', tags.join(' · ')));
    return head;
  }

  function poemImg(n, data) {
    const img = h('img', 'poem-img');
    img.alt = `${state.series.name} 第 ${n} 籤`;
    img.src = QQ.poems.imageUrl(state.series, n, data);
    return img;
  }

  /* 確認頁的精簡卡片:圖 + 直書籤詩 */
  function poemCard(n, res) {
    const data = res && res.ok ? res.data : null;
    const card = h('article', 'poem-card');
    card.appendChild(poemHead(n, data));
    const body = h('div', 'poem-body');
    const img = poemImg(n, data);
    img.addEventListener('error', () => img.remove());
    body.appendChild(img);
    const ls = data ? QQ.poems.lines(data) : [];
    if (ls.length) {
      const v = h('div', 'poem-v');
      ls.forEach(t => v.appendChild(h('p', '', t)));
      body.appendChild(v);
    }
    card.appendChild(body);
    return card;
  }

  /* 結果頁卡片:左邊籤詩圖,右邊籤詩與全部解說 */
  function resultCard(n, res) {
    const data = res && res.ok ? res.data : null;
    const card = h('article', 'poem-card result-card');
    card.appendChild(poemHead(n, data));
    const body = h('div', 'result-body');

    const fig = h('figure', 'result-img');
    const img = poemImg(n, data);
    img.addEventListener('error', () => { fig.remove(); body.classList.add('no-img'); });
    fig.appendChild(img);
    body.appendChild(fig);

    const text = h('div', 'result-text');
    const ls = data ? QQ.poems.lines(data) : [];
    if (ls.length) {
      const poem = h('div', 'poem-h');
      ls.forEach(t => poem.appendChild(h('p', '', t)));
      text.appendChild(poem);
    }
    const secs = (data && data.sections) || {};
    Object.keys(secs).forEach(key => {           // 有什麼欄位就顯示什麼(順序已在 poems.js 整理好)
      const d = h('details', 'sec');
      d.open = !QQ.config.sections.collapsed.includes(key);
      d.append(h('summary', '', key), h('div', 'sec-body', secs[key]));
      text.appendChild(d);
    });
    if (!text.children.length) body.classList.add('solo');   // 沒有文字資料:只置中顯示圖,不顯示任何提示
    else body.appendChild(text);
    card.appendChild(body);
    return card;
  }

  /* ── 6. 解籤 ───────────────────────────────────────── */
  function goResult() {
    go('result');
    const n = state.stick, p = state.petition, res = state.poem;
    const root = $('#resultBody');
    root.innerHTML = '';

    const rec = h('section', 'record');
    rec.append(h('h3', '', '求籤紀錄'));
    const dl = h('dl');
    [['求籤人', `${p.name}(${p.age} 歲)`], ['住址', p.addr], ['問事類別', p.category], ['事由說明', p.question],
     ['求得', `${state.series.name} 第 ${n} 籤`],
     ['時間', p.date.toLocaleString('zh-TW', { hour12: false })]]
      .filter(([, v]) => v)
      .forEach(([k, v]) => dl.append(h('dt', '', k), h('dd', '', v)));
    rec.appendChild(dl);
    root.appendChild(rec);

    root.appendChild(resultCard(n, res));

    root.appendChild(h('p', 'note', '籤詩僅供參考,心誠則靈;重大決定仍請審慎判斷、多方請益。'));
  }

  function restart() {
    state.stick = null; state.poem = null; state.redraws = 0;
    go('series');
  }

  function again() {
    f.pCat.value = '';
    f.pQuestion.value = '';
    $('#qCount').textContent = '0 / 100';
    f.pVow.checked = false;
    updateVow();
    go('petition');
  }

  /* 讀不到 poems 資料時,在選籤種頁提示用 start.bat 開啟 */
  async function initBanner() {
    const s = QQ.config.series.find(x => x.enabled);
    $('#dataBanner').hidden = await QQ.poems.available(s);
  }

  /* ── 啟動 ──────────────────────────────────────────── */
  function init() {
    const sel = $('#needSelect');
    QQ.config.rules.options.forEach(n => sel.appendChild(new Option(n === 1 ? '1 次聖筊' : `連續 ${n} 次聖筊`, n)));
    const saved = Number(store.get('qq.need'));
    if (QQ.config.rules.options.includes(saved)) state.need = saved;
    sel.value = state.need;
    sel.addEventListener('change', () => {
      state.need = Number(sel.value);
      store.set('qq.need', state.need);
      if (state.panel) state.panel.setNeed(state.need);
    });
    initSeries();
    initPetition();
    initBanner();
    QQ.motion.init();
    $('[data-act="print"]').addEventListener('click', () => window.print());
    $('[data-act="again"]').addEventListener('click', again);
    $('[data-act="home"]').addEventListener('click', restart);
    go('series');
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.QQ);
