/* 籤筒:晃動(電腦晃動滑鼠;手機/平板晃動裝置),停下來後,從籤筒跳出一支籤。
 * 與擲筊共用同一套晃動偵測(QQ.device.createDetector)。
 * 籤號用密碼學亂數決定,和晃動的軌跡、力道無關。 */
window.QQ = window.QQ || {};

QQ.Tube = class Tube {
  /* opts: total 籤數 / onPick(num) 抽出一支後呼叫 / onGrid() 改用方格選籤 */
  constructor(el, opts) {
    this.el = el;
    this.o = opts;
    this.state = 'ready';
    this.timers = [];
    this._render();
    this._arm();
  }

  _render() {
    const dev = QQ.device;
    const chars = '誠心求籤靈驗吉祥如意平安福壽恩主慈悲保佑';
    const cells = Array.from({ length: 18 }, (_, i) => `<i>${chars[i % chars.length]}</i>`).join('');
    /* 籤:30 支,在筒口左右散開、接近直立(只微微向外傾),高低錯落 */
    const N = 30;
    const sticks = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1) * 2 - 1;                                   // -1 ~ 1
      const x = 14 + (i / (N - 1)) * 112;                              // 筒口寬度內
      const a = t * 9 + (((i * 37) % 7) - 3) * 0.9;                    // 角度:外側最多約 10 度
      const h = 150 + ((i * 53) % 9) * 7 + (1 - Math.abs(t)) * 14;     // 高度錯落,中間略高
      return `<b style="--x:${x.toFixed(1)}px;--a:${a.toFixed(1)}deg;--h:${h.toFixed(0)}px;--d:${((i % 5) * -.05).toFixed(2)}s;z-index:${i % 2}"></b>`;
    }).join('');
    this.el.innerHTML = `
      <div class="tube-panel">
        <p class="mode-chip"></p>
        <div class="tube-pad" tabindex="0">
          <div class="tube-stage">
            <div class="tube-out" aria-live="polite"><span class="tube-stick"></span><span class="tube-no"></span></div>
            <div class="tube-shake">
              <div class="tube-sticks">${sticks}</div>
              <div class="tube-body"><div class="tube-cells">${cells}</div></div>
            </div>
          </div>
          <div class="meter"><i></i></div>
          <p class="pad-hint"></p>
        </div>
        <div class="tube-links">
          <button type="button" class="link-btn" data-act="press">不方便晃動?改用按鈕搖籤筒</button>
          <button type="button" class="link-btn" data-act="grid">改用方格自己選籤</button>
        </div>
      </div>`;
    const $ = (s) => this.el.querySelector(s);
    this.pad = $('.tube-pad'); this.meter = $('.meter i'); this.hint = $('.pad-hint');
    this.out = $('.tube-out'); this.no = $('.tube-no');
    this.useMotion = dev.isMobile && QQ.motion && QQ.motion.state === 'ready';
    const how = !dev.isMobile ? '晃動滑鼠' : (this.useMotion ? '晃動裝置' : '手指滑動');
    $('.mode-chip').textContent = `偵測到:${dev.label} · ${how}搖籤筒`;
    this.hintIdle = !dev.isMobile ? '在畫面上來回晃動滑鼠,停下來,籤筒就會跳出一支籤'
      : (this.useMotion ? `拿起${dev.label}搖晃,停下來,籤筒就會跳出一支籤` : '用手指在方框內來回滑動,停下來,籤筒就會跳出一支籤');
    $('[data-act="press"]').addEventListener('click', () => this._press());
    $('[data-act="grid"]').addEventListener('click', () => { this.destroy(); this.o.onGrid && this.o.onGrid(); });
    this.pressBtn = $('[data-act="press"]');
  }

  _arm() {
    this.state = 'ready';
    this.hint.textContent = this.hintIdle;
    this.detector = QQ.device.createDetector({
      onStart: () => this._start(),
      onUpdate: (e) => { this.meter.style.width = Math.round(e * 100) + '%'; this.pad.style.setProperty('--energy', e); },
      onCancel: () => this._cancel(),
      onEnd: () => this._draw()
    });
    this.detector.start();
  }

  _start() {
    this.state = 'shaking';
    this.pad.classList.add('rattling');
    this.hint.textContent = '搖籤筒中……持續晃動,停下來即抽出一支籤';
    this.pressBtn.hidden = true;
  }

  _cancel() {
    this.state = 'ready';
    this.pad.classList.remove('rattling');
    this.meter.style.width = '0%';
    this.hint.textContent = '晃動時間太短,請再多晃動一會,再停下來。';
    this.pressBtn.hidden = false;
  }

  _press() {
    if (this.state !== 'ready') return;
    this.detector.stop();
    this._start();
    this.timers.push(setTimeout(() => this._draw(), 1300));
  }

  _draw() {
    if (this.state === 'done') return;
    this.state = 'done';
    this.detector && this.detector.stop();
    this.pad.classList.remove('rattling');
    this.meter.style.width = '0%';
    const num = QQ.random.int(this.o.total) + 1;
    this.no.textContent = `第 ${num} 籤`;
    this.out.classList.add('show');
    this.hint.textContent = '一支籤跳出來了……';
    if (navigator.vibrate) { try { navigator.vibrate([40, 40, 60]); } catch (e) { /* ignore */ } }
    this.timers.push(setTimeout(() => this.o.onPick(num), 1500));
  }

  setNeed() { /* 籤筒不受聖筊次數影響 */ }

  destroy() {
    this.timers.forEach(clearTimeout);
    this.detector && this.detector.stop();
    this.el.innerHTML = '';
  }
};
