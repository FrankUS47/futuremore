/* 晃動偵測:滑鼠(或手指在畫面上滑動)來回晃動 → 停下來 → 觸發 onEnd。
 *
 * 原理:統計「方向換向」次數。在 windowMs 內換向達 minReversals 次 = 正在晃動;
 * 之後超過 stillMs 沒有明顯移動 = 停下來。
 *
 * 手機版預留:輸入來源只有 feed(x, y, t) 一個入口。
 * 日後改用手機搖晃時,監聽 devicemotion,把加速度 (ax, ay) 當作 x、y 呼叫 detector.feed() 即可,
 * 其餘流程(擲筊、抽籤)完全不用改。
 */
window.QQ = window.QQ || {};

QQ.ShakeDetector = class ShakeDetector {
  constructor(handlers, options) {
    this.h = handlers || {};
    this.o = Object.assign({}, QQ.config.shake, options);
    this._onMove = (e) => this.feed(e.clientX, e.clientY, performance.now());
    this._reset();
  }

  _reset() {
    this.lastX = null; this.lastY = null;
    this.dir = { X: 0, Y: 0 };
    this.rev = [];            // 最近的換向時間點
    this.totalRev = 0;
    this.shaking = false;
    this.startedAt = 0;
    this.lastMove = 0;
  }

  start() {
    this.stop();
    this._reset();
    document.addEventListener('pointermove', this._onMove, { passive: true });
    this.timer = setInterval(() => this._tick(), 100);
  }

  stop() {
    document.removeEventListener('pointermove', this._onMove);
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  /* 單一輸入入口:座標 + 時間(毫秒) */
  feed(x, y, t) {
    if (this.lastX === null) { this.lastX = x; this.lastY = y; return; }
    const dx = x - this.lastX, dy = y - this.lastY;
    if (Math.hypot(dx, dy) < this.o.minMove) return;
    this.lastX = x; this.lastY = y;
    this.lastMove = t;
    this._axis('X', dx, t);
    this._axis('Y', dy, t);
    this._evaluate(t);
  }

  _axis(name, d, t) {
    const s = d > 2 ? 1 : d < -2 ? -1 : 0;
    if (!s) return;
    if (this.dir[name] && s !== this.dir[name]) { this.rev.push(t); this.totalRev++; }
    this.dir[name] = s;
  }

  _prune(t) {
    const from = t - this.o.windowMs;
    while (this.rev.length && this.rev[0] < from) this.rev.shift();
  }

  _energy() { return Math.min(1, this.rev.length / (this.o.minReversals * 2)); }

  _evaluate(t) {
    this._prune(t);
    if (!this.shaking && this.rev.length >= this.o.minReversals) {
      this.shaking = true;
      this.startedAt = t;
      this.h.onStart && this.h.onStart();
    }
    if (this.shaking) this.h.onUpdate && this.h.onUpdate(this._energy());
  }

  _tick() {
    if (!this.shaking) return;
    const t = performance.now();
    this._prune(t);
    this.h.onUpdate && this.h.onUpdate(this._energy());
    const forced = this.o.maxShakeMs && t - this.startedAt > this.o.maxShakeMs;   // 一直停不下來:最久 maxShakeMs 後自動擲出
    if (!forced && t - this.lastMove < this.o.stillMs) return;
    const duration = this.lastMove - this.startedAt;
    if (forced || duration >= this.o.minShakeMs) {
      this.stop();
      this.h.onEnd && this.h.onEnd({ duration, reversals: this.totalRev });
    } else {            // 太短,當作不小心掃過,重新等待
      this._reset();
      this.h.onCancel && this.h.onCancel();
    }
  }
};
