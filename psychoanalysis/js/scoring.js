/* scoring.js — 紫微宮位評分、流年四化落宮（指數以 50 為中性，越高越吉；啟發式評分） */
(function (g) {
  const PA = g.PA = g.PA || {};
  const { Data, Ziwei } = PA;

  const SIHUA = {
    甲: ['廉貞', '破軍', '武曲', '太陽'], 乙: ['天機', '天梁', '紫微', '太陰'], 丙: ['天同', '天機', '文昌', '廉貞'],
    丁: ['太陰', '天同', '天機', '巨門'], 戊: ['貪狼', '太陰', '右弼', '天機'], 己: ['武曲', '貪狼', '天梁', '文曲'],
    庚: ['太陽', '武曲', '太陰', '天同'], 辛: ['巨門', '太陽', '文曲', '文昌'], 壬: ['天梁', '紫微', '左輔', '武曲'],
    癸: ['破軍', '巨門', '太陰', '貪狼']
  };
  const HUA_NAME = ['祿', '權', '科', '忌'];
  const BR = { 廟: 2, 旺: 2, 得: 1, 利: 1, 平: 0, 不: -1, 陷: -2 };
  const HUA = { 祿: 2, 權: 1.5, 科: 1, 忌: -2 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // 某宮「三方四正」評分（本宮權重 1.5）
  function palaceScore(zw, branchIdx) {
    const cells = Ziwei.sanfang(zw, branchIdx);
    let raw = 0;
    cells.forEach((c, i) => {
      const w = i === 0 ? 1.5 : 1;
      c.main.forEach(s => { raw += w * ((BR[s.br] || 0) + (HUA[s.hua] || 0)); });
      c.minor.forEach(s => {
        if (s.kind === 'good') raw += w * (1 + (HUA[s.hua] || 0));
        else if (s.kind === 'bad') raw -= w * 1.5;
      });
    });
    return clamp(Math.round(50 + raw * 3.5), 5, 95);
  }

  // 某年天干的四化：palace＝落在本命盤哪一宮；rel＝以「流年命宮（該年地支所在宮位）」重新起宮後的流年宮名（紫微流年盤的標準看法）
  function flowHua(zw, Y) {
    const stem = Data.STEMS[((Y - 4) % 10 + 10) % 10], yb = ((Y - 4) % 12 + 12) % 12, bL = zw.life;
    return SIHUA[stem].map((st, i) => {
      const c = zw.cells.find(x => x.main.concat(x.minor).some(s => s.n === st));
      const rel = c ? zw.cells[(bL + ((c.branchIdx - yb + 12) % 12)) % 12].name : null;
      return { type: HUA_NAME[i], star: st, palace: c ? c.name : null, rel };
    });
  }

  Object.assign(PA, { SIHUA, HUA_NAME, palaceScore, flowHua });
})(typeof window !== 'undefined' ? window : globalThis);
