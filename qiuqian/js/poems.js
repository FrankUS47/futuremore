/* 讀取籤詩資料(poems/)與圖檔(images/)。
 *
 * 檔名依籤號:poems/001.json … poems/100.json(也可放在 poems/fs100/ 之下)。
 * 雙擊 index.html 時瀏覽器不讓網頁讀 .json,所以資料合併成 poems/poems.js 以 <script> 載入(由 轉檔.html 產生);
 * 若放在網頁伺服器上,也可直接讀 NNN.json。
 * 爬蟲舊版(image 是物件、sections 含雜項)與新版(image 是字串)的 JSON 都能讀,
 * 讀進來後一律整理成同一種格式(normalize)。 */
window.QQ = window.QQ || {};
QQ.poemStore = QQ.poemStore || {};

QQ.poems = (function () {
  const cache = new Map();
  const pad = (n) => String(n).padStart(3, '0');
  const storeKey = (series, n) => `${series.id}:${n}`;

  /* ── 整理資料 ────────────────────────────────────── */

  /* 去掉「* 解說由 / 東照山關帝廟 / 特別授權提供」這類來源標註 */
  function cleanText(t) {
    if (t == null) return '';
    const rows = String(t).replace(/\r/g, '').split('\n');
    for (let i = rows.length - 1; i >= 0; i--) {
      if (!/特別授權提供/.test(rows[i])) continue;
      let s = i > 0 && rows[i - 1].trim().length <= 14 ? i - 1 : i;
      for (let k = i - 1; k >= Math.max(0, i - 3); k--) {
        if (/^\s*\*/.test(rows[k]) || /由\s*$/.test(rows[k])) { s = k; break; }
      }
      rows.splice(s, i - s + 1);
      i = s;
    }
    return rows.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function baseName(v) {
    if (!v) return null;
    if (typeof v === 'object') v = v.file || v.source_url || v.name;
    if (!v || typeof v !== 'string') return null;
    return v.split(/[\\/]/).pop().split('?')[0] || null;
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const C = QQ.config.sections;
    const src = raw.sections || {};
    const keys = Object.keys(src).filter(k => !C.hide.includes(k));
    keys.sort((a, b) => {                       // 設定檔指定的欄位在前,其餘維持檔案內順序
      const ia = C.order.indexOf(a), ib = C.order.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    const sections = {};
    const seen = new Set();
    keys.forEach(k => {
      const v = cleanText(typeof src[k] === 'string' ? src[k] : JSON.stringify(src[k]));
      if (!v || /付費服務|原檔案未包含/.test(v)) return;   // 空白、網頁廣告雜訊、占位文字
      const norm = v.replace(/\s+/g, '');
      if (seen.has(norm)) return;                // 內容完全相同的欄位(如 典故 / 故事)只留第一個
      seen.add(norm);
      sections[k] = k === '解析' ? v.replace(/[ \s]*(?=這首籤詩)/g, '\n').replace(/^\n+/, '') : v;   // 「這首籤詩…」各自成段
    });
    return {
      number: raw.number, id: raw.id,
      number_text: raw.number_text, title: raw.title, ganzhi: raw.ganzhi, fortune: raw.fortune,
      poem_lines: raw.poem_lines, poem: raw.poem,
      image: baseName(raw.image),
      sections
    };
  }

  /* ── 載入 ────────────────────────────────────────── */

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = () => { s.remove(); resolve(); };
      s.onerror = () => { s.remove(); reject(new Error('載入失敗 ' + url)); };
      document.head.appendChild(s);
    });
  }

  async function fromJs(series, n) {
    const key = storeKey(series, n);
    if (QQ.poemStore[key]) return QQ.poemStore[key];
    for (const dir of series.poemDirs) {
      try { await loadScript(`${dir}/${pad(n)}.js`); } catch (e) { continue; }
      if (QQ.poemStore[key]) return QQ.poemStore[key];
    }
    return null;
  }

  /* 伺服器模式讀 NNN.json */
  function getJson(url) {
    return new Promise(resolve => {
      const x = new XMLHttpRequest();
      x.open('GET', url);
      x.onload = () => {
        if (x.status && x.status !== 200) return resolve(null);
        try { resolve(JSON.parse(x.responseText.replace(/^\uFEFF/, ''))); } catch (e) { resolve(null); }
      };
      x.onerror = () => resolve(null);
      x.send();
    });
  }

  async function fromJson(series, n) {
    for (const dir of series.poemDirs) {
      const d = await getJson(`${dir}/${pad(n)}.json`);
      if (d) return d;
    }
    return null;
  }

  async function load(series, n) {
    const key = storeKey(series, n);
    if (cache.has(key)) return cache.get(key);
    const sources = [fromJs, fromJson];
    for (const fn of sources) {
      const raw = await fn(series, n);
      const data = normalize(raw);
      if (data) {
        const out = { ok: true, data };
        cache.set(key, out);
        return out;
      }
    }
    return { ok: false };
  }

  /* 目前讀不讀得到資料?(只試第 1 籤) */
  async function available(series) {
    return (await load(series, 1)).ok;
  }

  function imageUrl(series, n, data) {
    const name = (data && data.image) || (pad(n) + series.imageExt);
    return `${series.imageDir}/${name}`;
  }

  /* 籤詩分行:優先用 poem_lines,沒有就用 poem 依標點切;統一格式「,,,。」 */
  function lines(data) {
    let arr = [];
    if (data && Array.isArray(data.poem_lines) && data.poem_lines.length) arr = data.poem_lines;
    else if (data && data.poem) arr = String(data.poem).split(/[,，、。;；\n]/);
    arr = arr.map(s => String(s).replace(/[\s,，、。;；.]+$/g, '').trim()).filter(Boolean);
    return arr.map((s, i) => s + (i === arr.length - 1 ? '。' : '，'));
  }

  /* 依問事類別,從解析文字挑出「問功名,…。」這樣的分項句子(找不到就回傳空字串) */
  function topic(text, category) {
    const keys = (QQ.config.topics || {})[category] || [];
    if (!text || !keys.length) return '';
    const out = [];
    (String(text).match(/問[^。]*。?/g) || []).forEach(c => {
      const head = c.slice(1).split(/[,，]/)[0];
      if (head.length <= 24 && keys.some(k => head.includes(k))) out.push(c.trim());
    });
    return out.join('\n');
  }

  /* 阿拉伯數字 → 國字(1–199):41 → 四十一、100 → 一百 */
  function cnNum(n) {
    const d = '零一二三四五六七八九';
    n = Number(n);
    if (n < 10) return d[n];
    if (n < 20) return '十' + (n % 10 ? d[n % 10] : '');
    if (n < 100) return d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : '');
    return '一百' + (n % 100 ? (n % 100 < 10 ? '零' : '') + cnNum(n % 100) : '');
  }

  return { cnNum, topic, load, imageUrl, lines, pad, normalize, cleanText, available };
})();
