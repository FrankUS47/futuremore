/* 主流程:選籤種 → 稟告 → 擲筊請示 → 抽籤 → 擲筊確認 → 解籤。 */
(function (QQ) {
  const $ = (s, r) => (r || document).querySelector(s);
  const VIEWS = ['mode', 'bei', 'series', 'petition', 'ask', 'draw', 'result'];       // 抽籤與擲筊確認合併在同一頁('draw')
  const STEP_OF = { series: 0, petition: 1, ask: 2, draw: 3, result: 5 };
  const STEP_LABELS = ['選擇籤種', '稟告神明', '擲筊請示', '抽取籤詩', '擲筊確認', '解籤'];

  const state = {
    series: null, petition: null, need: QQ.config.rules.defaultNeed,
    stick: null, poem: null, panel: null, redraws: 0, view: 'mode', mode: 'qiuqian', beiNeed: 1
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
    const plain = view === 'mode' || view === 'bei' || (view === 'series' && state.mode === 'query');              // 這兩頁不是求籤流程,不顯示步驟列和標題列的聖筊次數
    $('#steps').hidden = plain;
    $('.rule').hidden = plain;
    if (!plain) renderSteps(STEP_OF[view]);
    window.scrollTo({ top: 0, behavior: 'auto' });
    const hd = $('#view-' + view + ' h2');
    if (hd) { hd.tabIndex = -1; hd.focus({ preventScroll: true }); }
  }

  /* ── 0. 選使用方式 / 測試擲筊 / 只問事 ─────────────────── */
  function initModes() {
    document.querySelectorAll('.mode-card').forEach(b => b.addEventListener('click', () => chooseMode(b.dataset.mode)));
    const sel = $('#beiNeed');
    for (let n = 1; n <= 9; n++) sel.appendChild(new Option(`${n} 次`, n));
    const saved = Number(store.get('qq.beiNeed'));
    if (saved >= 1 && saved <= 9) state.beiNeed = saved;
    sel.value = state.beiNeed;
    sel.addEventListener('change', () => {
      state.beiNeed = Number(sel.value);
      store.set('qq.beiNeed', state.beiNeed);
      if (state.panel) state.panel.setNeed(state.beiNeed);
    });
    $('#bCat').appendChild(new Option('請選擇問事類別', ''));
    QQ.config.categories.forEach(c => $('#bCat').appendChild(new Option(c, c)));
    $('#beiForm').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const box = $('#bCat').closest('.field');
      box.classList.toggle('invalid', !$('#bCat').value);
      box.querySelector('.err').textContent = $('#bCat').value ? '' : '請選擇問事類別';
      if (!$('#bCat').value) return;
      startBei();
    });
    $('[data-act="series-back"]').addEventListener('click', () => go('mode'));
    $('[data-act="bei-home"]').addEventListener('click', restart);
  }

  function chooseMode(m, keep) {
    if (!keep) state.series = null;
    state.mode = m;
    if (m === 'qiuqian' || (m === 'query' && !state.series)) return go('series');
    go('bei');
    const q = m === 'query';
    $('#beiTitle').textContent = q ? `只問事不抽籤 · ${state.series.temple}` : '測試擲筊';
    $('#beiForm').hidden = !q;
    $('#beiVow').hidden = true;
    $('#bCat').value = ''; $('#bQuestion').value = '';
    $('#beiPanel').innerHTML = '';
    if (!q) startBei();
  }

  function startBei() {
    const q = state.mode === 'query';
    const run = () => {
      if (state.panel) { state.panel.destroy(); state.panel = null; }
      if (q) {
        $('#beiForm').hidden = true;
        const qs = $('#bQuestion').value.trim();
        $('#beiVow').textContent = `向${state.series.patron}(${state.series.temple})請示:${$('#bCat').value}${qs ? `(${qs})` : ''}`;
        $('#beiVow').hidden = false;
      }
      state.panel = new QQ.BeiPanel($('#beiPanel'), {
        need: state.beiNeed,
        successLabel: q ? '神明允准,再問一事' : '再測一次',
        failText: { xiao: '神明笑而不答,請再擲一次。', yin: '神明未允,請再擲一次。' },
        failActions: [{ label: '重新擲筊', retry: true }],
        onSuccess: () => chooseMode(state.mode, true)
      });
    };
    if (QQ.device.isMobile) QQ.motion.request().then(run); else run();
  }

  /* ── 1. 選籤種 ─────────────────────────────────────── */
  function initSeries() {
    const list = $('#seriesList');
    QQ.config.series.forEach(s => {
      const card = h('button', 'series-card' + (s.enabled ? '' : ' off'));
      card.type = 'button';
      card.disabled = !s.enabled;
      card.append(
        h('span', 'series-seal', s.temple),
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
    if (state.mode === 'query') { document.querySelectorAll('.patron').forEach(e => (e.textContent = s.patron)); return chooseMode('query', true); }
    document.querySelectorAll('.patron').forEach(e => (e.textContent = s.patron));
    $('#drawCount').textContent = s.total;
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

  /* ── 4. 抽籤(同一頁:搖籤筒 → 看到是哪一支 → 按鈕擲筊確認) ───────── */
  function goDraw() {
    go('draw');
    $('#drawTitle').textContent = '請誠心選一支籤';
    $('#drawLead').hidden = false;
    $('#redrawNote').textContent = state.redraws ? `已重新取籤 ${state.redraws} 次` : '';
    $('#drawStage').hidden = false;
    $('#confirmBox').hidden = true;
    $('#pickBox').hidden = true;
    const grid = $('#stickGrid');
    grid.classList.remove('picked');
    grid.innerHTML = '';
    grid.hidden = true;
    state.panel = new QQ.Tube($('#tubeBox'), {
      total: state.series.total, unit: state.series.unit, temple: state.series.temple,
      getGanzhi: async (num) => { const r = await QQ.poems.load(state.series, num); return r.ok ? (r.data.ganzhi || '') : ''; },
      onPick: (num) => onPick(num, null),
      onGrid: () => {                              // 改用方格自己選
        state.panel = null;
        grid.hidden = false;
        QQ.grid.render(grid, state.series.total, onPick);
      }
    });
  }

  /* 抽出一支籤:籤筒留在畫面上(那支籤已跳出來),下方顯示籤上刻的字,和「擲筊確認」按鈕(先不出現筊) */
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
    $('#drawLead').hidden = true;
    const box = $('#pickBox');
    box.innerHTML = '';
    const go1 = h('button', 'btn primary', '擲筊確認:是這支籤嗎?');
    go1.type = 'button';
    go1.addEventListener('click', goConfirm);
    if (btn) box.append(stickCard(num, res, true));   // 籤筒抽籤時,籤身已寫明,不再重複
    box.append(go1);
    box.hidden = false;
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* ── 5. 擲筊確認(同一頁:籤筒消失,左邊是剛剛那支籤,右邊擲筊) ──────── */
  function goConfirm() {
    if (state.panel) { state.panel.destroy(); state.panel = null; }
    renderSteps(4);
    $('#drawTitle').textContent = '此籤是您的籤嗎?';
    $('#redrawNote').textContent = '';
    $('#drawStage').hidden = true;
    $('#confirmBox').hidden = false;
    const n = state.stick;
    const box = $('#confirmPreview');
    box.innerHTML = '';
    box.append(stickCard(n, state.poem));
    $('#confirmPanel').innerHTML = '';
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

  /* 確認頁:只顯示「籤上刻的字」(干支與第幾首),不顯示籤詩圖、籤詩與任何解說。
     籤上本來就只刻這些,確定是這支籤(聖筊)之後,才去取籤詩。 */
  function stickCard(n, res, withCaption) {
    const data = res && res.ok ? res.data : null;
    const gz = (data && data.ganzhi) || '';
    const no = `第${QQ.poems.cnNum(n)}${state.series.unit || '籤'}`;
    const card = h('article', 'stick-card');
    const stick = h('div', 'stick-face');
    stick.append(h('span', 'stick-series', state.series.temple));
    if (gz) stick.append(h('span', 'stick-gz', gz));
    stick.append(h('span', 'stick-no', no));
    card.append(stick);
    card.append(h('p', 'stick-cap', `籤上刻著:${gz ? gz + ' ' : ''}${no}`));
    return card;
  }

  /* 確認頁的精簡卡片:圖 + 直書籤詩(目前未使用,保留備用) */
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
    img.title = '點一下放大';
    img.addEventListener('click', () => fig.classList.toggle('zoom'));
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
    const cat = state.petition && state.petition.category;      // 依問事類別,把對應的那句挑出來放最前面
    const hit = cat && (QQ.config.sections.topicFrom || []).map(k => QQ.poems.topic(secs[k], cat)).find(Boolean);
    if (hit) {
      const d = h('details', 'sec sec-focus');
      d.open = true;
      d.append(h('summary', '', `您所問的「${cat}」`), h('div', 'sec-body', hit));
      text.appendChild(d);
    }
    Object.keys(secs).forEach(key => {           // 有什麼欄位就顯示什麼(順序已在 poems.js 整理好)
      const d = h('details', 'sec');
      d.open = text.querySelectorAll('details').length < (QQ.config.sections.openCount || 2) && !QQ.config.sections.collapsed.includes(key);
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
    const line = [`${p.name}(${p.age} 歲)`, p.category, p.question, `${state.series.name} 第${QQ.poems.cnNum(n)}${state.series.unit || '籤'}`]
      .filter(Boolean).join(' · ');
    rec.append(h('strong', '', '求籤紀錄 '), h('span', '', line));
    rec.title = `${p.addr} · ${p.date.toLocaleString('zh-TW', { hour12: false })}`;
    root.appendChild(rec);

    root.appendChild(resultCard(n, res));

    root.appendChild(h('p', 'note', '籤詩僅供參考,心誠則靈;重大決定仍請審慎判斷、多方請益。'));
  }

  function restart() {
    state.stick = null; state.poem = null; state.redraws = 0;
    go('mode');
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
    /* 一開始就先把擲筊用的圖載進快取,進到擲筊畫面時就不用再等 */
    [QQ.config.handsImage].concat(Object.values(QQ.config.beiAnim || {}).map(a => [].concat(a.src)[1] || [].concat(a.src)[0]))
      .forEach(u => { if (u) { const im = new Image(); im.src = u; } });
    initModes();
    initSeries();
    initPetition();
    initBanner();
    QQ.motion.init();
    $('[data-act="print"]').addEventListener('click', () => window.print());
    $('[data-act="again"]').addEventListener('click', again);
    $('[data-act="home"]').addEventListener('click', restart);
    go('mode');
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.QQ);
