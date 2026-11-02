/* app.js — 表單處理、組合 d（排盤資料）並輸出報告 */
(function (g) {
  const PA = g.PA, { Bazi, Ziwei, Analysis, Cal, Data: D, Places, K } = PA;
  const $ = id => document.getElementById(id);
  const SHICHEN = [
    ['子時 (23:00~01:00)', '23:30', '晚子時 (23:00~24:00)'], ['子時 (23:00~01:00)', '00:30', '早子時 (00:00~01:00)'],
    ['丑時 (01:00~03:00)', '02:00'], ['寅時 (03:00~05:00)', '04:00'], ['卯時 (05:00~07:00)', '06:00'], ['辰時 (07:00~09:00)', '08:00'],
    ['巳時 (09:00~11:00)', '10:00'], ['午時 (11:00~13:00)', '12:00'], ['未時 (13:00~15:00)', '14:00'], ['申時 (15:00~17:00)', '16:00'],
    ['酉時 (17:00~19:00)', '18:00'], ['戌時 (19:00~21:00)', '20:00'], ['亥時 (21:00~23:00)', '22:00']
  ];
  const pad = n => String(n).padStart(2, '0');

  const curShichen = h => h === 23 ? 0 : h === 0 ? 1 : 2 + Math.floor((h - 1) / 2);
  function nowTaipei() { const x = new Date(Date.now() + 8 * 3600000); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate(), h: x.getUTCHours(), ms: Date.now() }; }

  function build() {
    const name = $('userName').value.trim() || '命主', gender = $('gender').value, dateStr = $('birthDate').value;
    if (!dateStr) throw new Error('請輸入出生日期');
    const [y, m, dd] = dateStr.split('-').map(Number);
    if (y < 1900 || y > 2100) throw new Error('出生年份需介於 1900 ~ 2100 年');
    const mode = $('timeInputType').value;
    let H, M, timeLabel;
    if (mode === 'exact') { const t = ($('birthTime').value || '00:00').split(':').map(Number); H = t[0]; M = t[1]; timeLabel = `${pad(H)}:${pad(M)}`; }
    else { const s = SHICHEN[+$('shichenSelect').value]; [H, M] = s[1].split(':').map(Number); timeLabel = s[2] || s[0]; }
    const pl = Places.LIST[+$('birthPlace').value];
    const useTST = mode === 'exact' && $('trueSolar').checked;
    const zishi = $('late23').checked ? 'next' : 'same';
    const fp = Bazi.compute({ y, m, d: dd, H, M, lon: pl[1], tz: pl[2], useTST, zishi, gender });
    const now = nowTaipei(), refMs = Date.UTC(now.y, now.m - 1, now.d, 12) - 8 * 3600000;
    const nowInfo = Bazi.nowInfo(fp, refMs);
    const an = Analysis.analyze(fp);
    const zw = Ziwei.compute({ lunar: fp.lunar, hourBranch: fp.time.hourBranch, male: gender === '男', refYear: now.y });
    let query = null; const qv = $('queryDT').value;
    if (qv) { const m2 = qv.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/); if (m2) query = { y: +m2[1], m: +m2[2], d: +m2[3], H: +m2[4], M: +m2[5] }; }
    const birthAge = now.y - y, lun = Cal.lunarOf(now.y, now.m, now.d);
    const hbNow = Cal.hourBranchOf(now.h);
    return {
      name, gender, dateStr, timeLabel, place: pl[0], birthMode: mode, birthYear: y, age: birthAge, xuAge: birthAge + 1, now,
      clockText: `${y}年${m}月${dd}日 ${timeLabel}`, fp, an, zw, nowInfo,
      sunSign: K.sunSignOf(fp.time.instantMs),
      birthLiu: PA.yi.xiaoLiuRen(fp.lunar.month, fp.lunar.day, fp.time.hourBranch),
      todayLiu: PA.yi.xiaoLiuRen(lun.month, lun.day, hbNow),
      lon: pl[1], tz: pl[2], zishi, query
    };
  }

  function init() {
    const nw = nowTaipei();   // 預設為今天（台北時間），不再預設舊日期
    $('birthDate').value = `${nw.y}-${pad(nw.m)}-${pad(nw.d)}`;
    $('birthTime').value = `${pad(nw.h)}:${pad(new Date(Date.now() + 8 * 3600000).getUTCMinutes())}`;
    $('shichenSelect').innerHTML = SHICHEN.map((s, i) => `<option value="${i}"${i === curShichen(nw.h) ? ' selected' : ''}>${s[2] || s[0].replace('~', ' - ')}</option>`).join('');
    Places.fillSelect($('birthPlace'), '臺北市');
    const upd = () => {
      const ex = $('timeInputType').value === 'exact';
      $('exactTimeGroup').style.display = ex ? 'flex' : 'none'; $('shichenGroup').style.display = ex ? 'none' : 'flex'; $('solarGroup').style.display = ex ? 'block' : 'none';
    };
    $('timeInputType').addEventListener('change', upd); upd();
    $('analysisForm').addEventListener('submit', e => {
      e.preventDefault();
      try {
        const d = build(), sel = Array.from(document.querySelectorAll('input[name="dimensions"]:checked')).map(c => c.value);
        $('reportContent').innerHTML = PA.renderReport(d, sel);
        $('reportCard').classList.remove('hidden'); $('reportCard').scrollIntoView({ behavior: 'smooth' });
      } catch (err) { console.error(err); alert('產生報告失敗：' + err.message); }
    });
  }
  PA.build = build;
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
})(window);
