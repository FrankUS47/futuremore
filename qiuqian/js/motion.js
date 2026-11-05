/* 手機/平板晃動偵測(devicemotion)。
 *
 * QQ.motion.state:
 *   'unknown'          尚未偵測
 *   'needs-permission' iOS 13+,需要使用者按鈕授權(QQ.motion.request())
 *   'ready'            收到真實的加速度資料,可以用晃動
 *   'none'             沒有感應器、被拒絕,或網頁不是 HTTPS(手機瀏覽器要求安全連線才給感應器)
 *
 * MotionDetector 與 ShakeDetector 介面相同(onStart/onUpdate/onCancel/onEnd),
 * 所以擲筊、抽籤流程完全不用區分裝置。 */
window.QQ = window.QQ || {};

QQ.motion = (function () {
  const m = { state: 'unknown', listeners: [] };
  const needsPerm = typeof window.DeviceMotionEvent !== 'undefined' &&
                    typeof window.DeviceMotionEvent.requestPermission === 'function';

  function set(s) {
    if (m.state === s) return;
    m.state = s;
    m.listeners.forEach(fn => { try { fn(s); } catch (e) { /* ignore */ } });
  }
  m.onChange = (fn) => m.listeners.push(fn);

  function hasData(e) {
    const a = e.accelerationIncludingGravity || e.acceleration;
    return !!a && (a.x != null || a.y != null || a.z != null);
  }

  /* 聽一小段時間,有收到真實資料才算 ready(桌面 Chrome 會送一筆空事件,要排除) */
  function probe(ms) {
    return new Promise(resolve => {
      if (!window.DeviceMotionEvent) { set('none'); return resolve(m.state); }
      let done = false;
      const on = (e) => { if (hasData(e)) finish('ready'); };
      const finish = (s) => {
        if (done) return;
        done = true;
        window.removeEventListener('devicemotion', on);
        clearTimeout(t);
        set(s);
        resolve(m.state);
      };
      window.addEventListener('devicemotion', on);
      const t = setTimeout(() => finish(needsPerm && m.state !== 'ready' ? 'needs-permission' : 'none'), ms);
    });
  }

  m.init = function () {
    if (!QQ.device.isMobile) return Promise.resolve(m.state);
    if (needsPerm) { set('needs-permission'); return Promise.resolve(m.state); }   // iOS:要先授權才有資料
    return probe(QQ.config.motion.probeMs);
  };

  /* 必須在使用者點擊/觸碰事件中呼叫(iOS 規定) */
  m.request = function () {
    if (!QQ.device.isMobile) return Promise.resolve(m.state);
    if (m.state === 'ready') return Promise.resolve('ready');
    if (needsPerm) {
      return DeviceMotionEvent.requestPermission().then(r => {
        if (r !== 'granted') { set('none'); return m.state; }
        return probe(QQ.config.motion.probeMs);
      }).catch(() => { set('none'); return m.state; });
    }
    return probe(QQ.config.motion.probeMs);
  };

  m.needsPerm = needsPerm;
  return m;
})();

QQ.MotionDetector = class MotionDetector extends QQ.ShakeDetector {
  constructor(handlers, options) {
    super(handlers, options);
    this.thr = (options && options.threshold) || QQ.config.motion.threshold;
    this._onMotion = (e) => this._motion(e);
  }

  _reset() {
    super._reset();
    this.dir = { X: 0, Y: 0, Z: 0 };
    this.g = null;                                   // 重力的低通估計值
  }

  start() {
    this.stop();
    this._reset();
    window.addEventListener('devicemotion', this._onMotion);
    this.timer = setInterval(() => this._tick(), 100);
  }

  stop() {
    window.removeEventListener('devicemotion', this._onMotion);
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  _motion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    const v = { X: a.x || 0, Y: a.y || 0, Z: a.z || 0 };
    if (!this.g) { this.g = Object.assign({}, v); return; }
    const t = performance.now();
    let big = 0;
    for (const k of ['X', 'Y', 'Z']) {
      this.g[k] = this.g[k] * 0.9 + v[k] * 0.1;     // 低通 = 重力
      const lin = v[k] - this.g[k];                  // 高通 = 手的晃動
      big = Math.max(big, Math.abs(lin));
      if (Math.abs(lin) < this.thr) continue;
      const s = lin > 0 ? 1 : -1;
      if (this.dir[k] && s !== this.dir[k]) { this.rev.push(t); this.totalRev++; }
      this.dir[k] = s;
    }
    if (big >= this.thr) { this.lastMove = t; this._evaluate(t); }
  }
};
