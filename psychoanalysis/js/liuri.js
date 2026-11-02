/* liuri.js — 流月／流日／流時查詢：輸入任一時刻，列出該時刻四柱與本命的沖合關係（八字）及落入本命紫微宮位 */
(function (g) {
  const PA = g.PA = g.PA || {};
  const { Data: D, Bazi } = PA, esc = PA.H.esc;
  const KEYS = ['year', 'month', 'day', 'hour'], CN = { year: '年', month: '月', day: '日', hour: '時' };
  const LB = { year: '流年', month: '流月', day: '流日', hour: '流時' };
  const STEM_CLASH = { 0: 6, 1: 7, 2: 8, 3: 9, 6: 0, 7: 1, 8: 2, 9: 3 };
  const YANGREN = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 }; // 甲→卯 丙→午 戊→午 庚→酉 壬→子
  const pad = n => String(n).padStart(2, '0');

  function compute(d) {
    const q = d.query, fp = d.fp, an = d.an, zw = d.zw;
    const ev = Bazi.compute({ y: q.y, m: q.m, d: q.d, H: q.H, M: q.M, lon: d.lon, tz: d.tz, useTST: false, zishi: d.zishi, gender: d.gender });
    const rows = KEYS.map(k => {
      const e = ev[k], rel = [];
      KEYS.forEach(n => {
        const b = fp[n];
        if (D.isClash(e.branchIdx, b.branchIdx)) rel.push(`${e.branch}沖本命${CN[n]}支${b.branch}`);
        else if (e.branchIdx === b.branchIdx) rel.push(`與本命${CN[n]}支${b.branch}同（伏吟）`);
        else { const he = D.branchHe(e.branch, b.branch); if (he) rel.push(`${e.branch}合本命${CN[n]}支${b.branch}`); }
        if (STEM_CLASH[e.stemIdx] === b.stemIdx) rel.push(`${e.stem}沖本命${CN[n]}干${b.stem}`);
        else { const he = D.stemHe(e.stem, b.stem); if (he) rel.push(`${e.stem}合本命${CN[n]}干${b.stem}`); }
      });
      const yr = YANGREN[fp.day.stemIdx];
      if (yr !== undefined && D.isClash(e.branchIdx, yr)) rel.push(`沖日主羊刃（${D.BRANCHES[yr]}）`);
      if (yr !== undefined && e.branchIdx === yr) rel.push(`逢日主羊刃（${D.BRANCHES[yr]}）`);
      const gr = an.grade(e.stemIdx, e.branchIdx), cell = zw.cells[e.branchIdx];
      return { k, e, rel, god: D.tenGod(fp.day.stemIdx, e.stemIdx), gr, cell };
    });
    return { ev, rows };
  }

  function render(d) {
    if (!d.query) return '';
    const { ev, rows } = compute(d), q = d.query;
    const body = rows.map(r => `<tr><td>${LB[r.k]}</td><td class="gz">${esc(r.e.gz)}</td><td>${r.god}</td><td><span class="badge b-${r.gr.cls}">${r.gr.label}</span></td>
      <td>${PA.TL.pn(r.cell.name)}<br><small>${r.cell.main.length ? PA.H.starList(r.cell.main) : '無主星'}</small></td><td class="left">${r.rel.length ? esc(r.rel.join('；')) : '—'}</td></tr>`).join('');
    const hits = rows.filter(r => r.rel.some(t => /沖/.test(t))).map(r => LB[r.k]);
    const sumTxt = hits.length ? `${hits.join('、')}與本命有沖，該時段環境與行動上較容易出現變動、碰撞或趕、急的狀況；沖到哪一柱，就偏向那一柱代表的面向（日支＝自身與配偶宮、時支＝子女與晚輩、月支＝事業與長輩、年支＝外在與根基）。` : '此時刻四柱與本命沒有直接相沖，相對平穩。';
    return `<div class="report-section"><h3>🕒 流月、流日、流時對照（${q.y}/${q.m}/${q.d} ${pad(q.H)}:${pad(q.M)}）</h3>
      <p class="note">事發時刻四柱：${KEYS.map(k => ev[k].gz).join(' ')}　本命：${KEYS.map(k => d.fp[k].gz).join(' ')}　（${ev.prevTerm.name}後）</p>
      <table class="tbl small"><thead><tr><th>層級</th><th>干支</th><th>十神</th><th>喜忌</th><th>落本命宮位（紫微）</th><th>與本命的沖合</th></tr></thead><tbody>${body}</tbody></table>
      <p>${sumTxt}</p>
      <p class="note">提醒：地支相沖每十二天、每個時辰都會出現，單次吻合不能證明準確；本表只列沖合關係供自行對照，並非事件預測。</p></div>`;
  }
  PA.Liuri = { compute, render };
})(typeof window !== 'undefined' ? window : globalThis);
