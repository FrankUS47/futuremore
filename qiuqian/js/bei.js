/* 擲筊:結果判定 + 擲筊面板(晃動 → 停止 → 擲出,支援連續 N 次聖筊)。
 *
 * 筊杯一面平(陽)、一面圓凸(陰),兩個一起擲:
 *   一陽一陰 = 聖筊(神明允准,機率 1/2)
 *   兩個都是陽(平面朝上) = 笑筊(神明一笑,尚未決定,機率 1/4)
 *   兩個都是陰(圓背朝上) = 陰筊(神明不允,機率 1/4)
 */
window.QQ = window.QQ || {};

QQ.bei = (function () {
  const KIND = {
    sheng: { label: '聖筊', desc: '一陽一陰' },
    xiao:  { label: '笑筊', desc: '兩個平面朝上' },
    yin:   { label: '陰筊', desc: '兩個圓背朝上' }
  };

  function toss() {
    const faces = [QQ.random.int(2) ? 'yang' : 'yin', QQ.random.int(2) ? 'yang' : 'yin'];
    const kind = faces[0] !== faces[1] ? 'sheng' : (faces[0] === 'yang' ? 'xiao' : 'yin');
    return { faces, kind };
  }

  return { KIND, toss };
})();

QQ.BeiPanel = class BeiPanel {
  /* opts: need 需連續聖筊數 / mode 'ask'|'confirm' / failText {xiao,yin} / successLabel
           onSuccess() / failActions [{label, handler | retry:true, ghost}] */
  constructor(el, opts) {
    this.el = el;
    this.o = Object.assign({
      need: 1, successLabel: '下一步', failActions: [{ label: '重新擲筊', retry: true }],
      failText: { xiao: '神明笑而不答,請再斟酌後重擲。', yin: '神明未允,請再誠心稟告後重擲。' }
    }, opts);
    this.streak = 0;
    this.state = 'idle';
    this.timers = [];
    this._render();
    this._arm();
  }

  _render() {
    const OUT = 'M84 6 C 22 8 -4 66 2 118 C 8 164 48 190 84 188 C 76 140 76 56 84 6 Z';   // 胖胖的半月形
    const svg = (cls) => `<svg viewBox="0 0 100 194" class="${cls}" aria-hidden="true">
      <g class="face face-yang">
        <path class="body" d="${OUT}"/>
        <g clip-path="url(#clipBei)" class="grain">
          <path d="M6 30 C26 26 52 36 80 28"/><path d="M2 52 C28 46 52 58 80 50"/><path d="M0 76 C26 70 52 82 78 74"/>
          <path d="M0 100 C26 94 50 106 77 98"/><path d="M2 124 C26 118 50 130 77 122"/><path d="M6 148 C28 142 50 154 77 146"/>
          <path d="M14 170 C32 166 52 176 78 168"/>
        </g>
        <path class="rim" d="${OUT}"/>
      </g>
      <g class="face face-yin">
        <path class="body" d="${OUT}"/>
        <path class="inner" d="M84 6 C 76 56 76 140 84 188 C 66 150 66 50 84 6 Z"/>
        <path class="shine" d="M30 28 C 14 50 10 86 14 116"/>
        <path class="shine2" d="M40 150 C 50 160 60 166 68 168"/>
        <path class="rim" d="${OUT}"/>
      </g></svg>`;
    const dev = QQ.device;
    this.useMotion = dev.isMobile && QQ.motion && QQ.motion.state === 'ready';
    this.hintIdle = dev.isMobile
      ? (this.useMotion ? `拿起${dev.label},上下左右搖晃,停下來即擲出筊杯`
                        : '用手指在這個方框內來回滑動,停下來即擲出筊杯')
      : '在畫面上來回晃動滑鼠,停下來即擲出筊杯';
    this.el.innerHTML = `
      <div class="bei-panel">
        <div class="pips" role="img"></div>
        <p class="mode-chip" data-act="mode"></p>
        <div class="bei-pad" tabindex="0">
          <div class="verdict" aria-hidden="true"><span class="v-mark"></span><span class="v-text"></span></div>
          <div class="bei-stage">
          <div class="bei-pair">
            <div class="bei" data-face="yang">${svg('bei-svg')}<span class="bei-tag"></span></div>
            <div class="bei" data-face="yin">${svg('bei-svg')}<span class="bei-tag"></span></div>
          </div>
          <div class="hands" aria-hidden="true"><img class="hands-img" src="${QQ.config.handsImage}" alt=""></div>
          </div>
          <div class="meter"><i></i></div>
          <p class="pad-hint"></p>
        </div>
        <p class="bei-status" role="status" aria-live="polite"></p>
        <div class="bei-actions"></div>
        <button type="button" class="btn ghost" data-act="enable" hidden>啟用手機晃動感應</button>
        <button type="button" class="link-btn" data-act="press">不方便晃動?改用按鈕擲筊</button>
      </div>`;
    this.pad = this.el.querySelector('.bei-pad');
    this.verdict = this.el.querySelector('.verdict');
    this.handsImg = this.el.querySelector('.hands-img');
    this.handsImg.addEventListener('error', () => { if (this.state !== 'landing') this.pad.classList.add('no-photo'); });   // 沒有照片時只顯示筊
    this._preload();
    this.beis = [...this.el.querySelectorAll('.bei')];
    this.meter = this.el.querySelector('.meter i');
    this.hint = this.el.querySelector('.pad-hint');
    this.status = this.el.querySelector('.bei-status');
    this.actions = this.el.querySelector('.bei-actions');
    this.pips = this.el.querySelector('.pips');
    this.pressBtn = this.el.querySelector('[data-act="press"]');
    this.pressBtn.addEventListener('click', () => this._press());
    this.modeChip = this.el.querySelector('.mode-chip');
    this.enableBtn = this.el.querySelector('[data-act="enable"]');
    this.enableBtn.addEventListener('click', () => {
      QQ.motion.request().then(() => { if (!this.destroyed && this.state === 'ready') { this.detector.stop(); this._render(); this._arm(); } });
    });
    this._renderPips();
  }

  _renderPips() {
    this.pips.innerHTML = '';
    for (let i = 0; i < this.o.need; i++) {
      const d = document.createElement('i');
      if (i < this.streak) d.className = 'on';
      this.pips.appendChild(d);
    }
    this.pips.hidden = this.o.need === 1;          // 只需 1 次聖筊時不顯示進度點
    this.pips.setAttribute('aria-label', `聖筊進度 ${this.streak} / ${this.o.need}`);
    this.pips.title = `需連續 ${this.o.need} 個聖筊(目前 ${this.streak})`;
  }

  _later(fn, ms) { const t = setTimeout(fn, ms); this.timers.push(t); }

  _setFaces(faces) {
    this.beis.forEach((b, i) => {
      b.dataset.face = faces[i];
      b.querySelector('.bei-tag').textContent = faces[i] === 'yang' ? '陽 · 平面' : '陰 · 圓背';
    });
  }

  /* 預先載入三種結果動畫;載入失敗的結果,改用內建的筊落下畫面 */
  _preload() {
    this.animOk = this.animOk || {};              // 結果 → 實際找到的檔名(找不到為 false)
    const A = QQ.config.beiAnim || {};
    Object.keys(A).forEach(k => {
      if (this.animOk[k] !== undefined) return;
      this.animOk[k] = null;
      const list = [].concat(A[k].src);
      const next = (i) => {
        if (i >= list.length) { this.animOk[k] = false; return; }
        const im = new Image();
        im.onload = () => { this.animOk[k] = list[i]; };
        im.onerror = () => next(i + 1);
        im.src = list[i];
      };
      next(0);
    });
  }

  _arm() {
    this.state = 'ready';
    this.pad.classList.remove('is-shaking', 'landed', 'tossed');
    this.verdict.className = 'verdict';
    this.pad.classList.remove('animating', 'fallback', 'tossed');
    if (this.handsImg && !this.pad.classList.contains('no-photo')) this.handsImg.src = QQ.config.handsImage;
    this.beis.forEach(b => b.classList.remove('tossing', 'drop'));
    this.beis.forEach(b => (b.querySelector('.bei-tag').textContent = ''));
    this.meter.style.width = '0%';
    this.hint.textContent = this.hintIdle;
    this.pressBtn.hidden = false;
    this.actions.innerHTML = '';
    this.status.textContent = this.streak
      ? `聖筊 ${this.streak} / ${this.o.need},請繼續擲筊。`
      : (this.o.need > 1 ? `需連續 ${this.o.need} 個聖筊,神明才算允准。` : '請向神明擲筊請示。');
    this._chip();
    this.detector = QQ.device.createDetector({
      onStart: () => this._shakeStart(),
      onUpdate: (e) => { this.meter.style.width = Math.round(e * 100) + '%'; this.pad.style.setProperty('--energy', e); },
      onCancel: () => this._shakeCancel(),
      onEnd: () => this._land()
    });
    this.detector.start();
  }

  _chip() {
    const dev = QQ.device;
    const how = !dev.isMobile ? '晃動滑鼠' : (this.useMotion ? '晃動裝置' : '手指滑動');
    this.modeChip.textContent = `偵測到:${dev.label} · ${how}擲筊`;
    this.enableBtn.hidden = !(dev.isMobile && QQ.motion && QQ.motion.state === 'needs-permission');
    this.pad.classList.toggle('motion-mode', this.useMotion);
  }

  _shakeStart() {
    this.state = 'shaking';
    this.pad.classList.add('is-shaking');
    this._follow(true);
    this.beis.forEach(b => { b.classList.remove('drop'); b.classList.add('tossing'); });
    this.hint.textContent = '擲筊中……持續晃動,停下來即擲出';
    this.pressBtn.hidden = true;
    /* 擲筊途中筊杯翻動的畫面只是視覺效果,用一般亂數;真正的結果由 _land() 用密碼學亂數決定 */
    this.flicker = setInterval(() => { this._setFaces([Math.random() < .5 ? 'yang' : 'yin', Math.random() < .5 ? 'yang' : 'yin']); this._clearTags(); }, 160);
  }

  _clearTags() { this.beis.forEach(b => (b.querySelector('.bei-tag').textContent = '')); }

  /* 滑鼠模式:捧筊圖跟著滑鼠左右移動(手機模式用 CSS 動畫) */
  _follow(on) {
    const h = this.el.querySelector('.hands');
    if (!h) return;
    window.removeEventListener('pointermove', this._mv);
    h.classList.remove('follow');
    h.style.transform = '';
    if (!on || QQ.device.isMobile && this.useMotion) return;
    this._mv = (e) => {
      const r = this.pad.getBoundingClientRect();
      const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      h.style.transform = `translateX(${(dx * 60).toFixed(1)}px) rotate(${(dx * 8).toFixed(1)}deg)`;
    };
    h.classList.add('follow');
    window.addEventListener('pointermove', this._mv);
  }

  _shakeCancel() {
    this._follow(false);
    clearInterval(this.flicker);
    this._clearTags();
    this.state = 'ready';
    this.pad.classList.remove('is-shaking');
    this.beis.forEach(b => b.classList.remove('tossing'));
    this.hint.textContent = '晃動時間太短,擲筊尚未成立。請再多晃動一會,再停下來。';
    this.pressBtn.hidden = false;
    this.meter.style.width = '0%';
  }

  _press() {                      // 按鈕擲筊:模擬一次短暫晃動
    if (this.state !== 'ready') return;
    this.detector.stop();
    this._shakeStart();
    this._later(() => this._land(), 900);
  }

  _land() {
    clearInterval(this.flicker);
    this._follow(false);
    this.state = 'landing';
    const r = QQ.bei.toss();                      // 結果由密碼學亂數決定
    this._setFaces(r.faces);
    this.pad.classList.remove('is-shaking');
    this.meter.style.width = '0%';
    this.hint.textContent = '';
    const A = (QQ.config.beiAnim || {})[r.kind];
    if (A && this.animOk && typeof this.animOk[r.kind] === 'string' && !this.pad.classList.contains('no-photo')) {
      /* 雙手把筊丟出去:播放該結果的動畫(換網址參數讓動畫每次都從頭播),播完才揭曉 */
      this.pad.classList.add('animating');
      /* 先在背景載入並解碼完,再換上去播,動畫就不會因為載入慢而被吃掉開頭 */
      const url = this.animOk[r.kind] + '?t=' + Date.now();
      const pre = new Image();
      let started = false;
      const play = () => {
        if (started || this.destroyed) return;
        started = true;
        this.handsImg.src = url;
        this._later(() => this._result(r), A.ms + 300);
      };
      pre.src = url;
      (pre.decode ? pre.decode() : Promise.reject()).then(play, play);
      return;
    }
    this.pad.classList.add('landed', 'tossed', 'fallback');
    this.beis.forEach(b => {
      b.classList.remove('tossing');
      b.style.setProperty('--rest', (QQ.random.int(41) - 20) + 'deg');
      void b.offsetWidth;
      b.classList.add('drop');
    });
    if (navigator.vibrate) { try { navigator.vibrate([40, 40, 60]); } catch (e) { /* ignore */ } }
    this._later(() => this._result(r), 750);
  }

  _result(r) {
    const k = QQ.bei.KIND[r.kind];
    this.verdict.className = 'verdict show ' + r.kind;
    this.verdict.querySelector('.v-mark').textContent = r.kind === 'sheng' ? '◯' : '✕';
    this.verdict.querySelector('.v-text').textContent = k.label;
    this.el.dispatchEvent(new CustomEvent('bei:toss', { detail: r, bubbles: true }));
    if (r.kind === 'sheng') {
      this.streak++;
      this._renderPips();
      if (this.streak >= this.o.need) {
        this.state = 'done';
        this.status.innerHTML = '';
        this.status.append(this._strong(k.label), this.o.need > 1
          ? ` ——連續 ${this.o.need} 個聖筊,神明允准。` : ' ——神明允准。');
        this.status.classList.remove('bad'); this.status.classList.add('good');
        this._buttons([{ label: this.o.successLabel, primary: true, handler: () => this.o.onSuccess && this.o.onSuccess() }]);
        this.pressBtn.hidden = true;
        return;
      }
      this.state = 'between';
      this.status.classList.remove('bad'); this.status.classList.add('good');
      this.status.innerHTML = '';
      this.status.append(this._strong(k.label), ` ——${this.streak} / ${this.o.need},請繼續擲筊。`);
      this.pressBtn.hidden = true;
      this._buttons([{ label: '繼續擲筊', primary: true, handler: () => { this.status.classList.remove('good'); this._arm(); } }]);
      return;
    }
    this.streak = 0;
    this._renderPips();
    this.state = 'failed';
    this.status.classList.remove('good'); this.status.classList.add('bad');
    this.status.innerHTML = '';
    this.status.append(this._strong(k.label), ` ——${k.desc}。${this.o.failText[r.kind]}`);
    this.pressBtn.hidden = true;
    this._buttons(this.o.failActions.map(a => a.retry
      ? Object.assign({}, a, { primary: true, handler: () => this.retry() }) : a));
  }

  _strong(t) { const s = document.createElement('strong'); s.textContent = t; return s; }

  _buttons(list) {
    this.actions.innerHTML = '';
    list.forEach(a => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ' + (a.primary ? 'primary' : 'ghost');
      b.textContent = a.label;
      b.addEventListener('click', a.handler);
      this.actions.appendChild(b);
    });
    /* 按鈕可能在畫面下方:自動捲到看得見的位置 */
    setTimeout(() => { if (!this.destroyed) this.actions.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
  }

  retry() { this.status.classList.remove('good', 'bad'); this.streak = 0; this._renderPips(); this._arm(); }

  setNeed(n) {
    this.o.need = n;
    if (this.state === 'done') return;
    this.streak = 0;
    this._renderPips();
    if (this.state === 'ready') this._arm();
  }

  destroy() {
    this.destroyed = true;
    this._follow(false);
    this.timers.forEach(clearTimeout);
    clearInterval(this.flicker);
    this.detector && this.detector.stop();
    this.el.innerHTML = '';
  }
};
