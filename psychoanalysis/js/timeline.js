/* timeline.js — 過去回顧與未來最佳／最差時間段（八字大運流年吉凶 + 紫微流年宮位與四化，規則式相對排序） */
(function (g) {
  const PA = g.PA = g.PA || {};
  const { Data, Bazi } = PA;
  const MEDAL = ['🥇', '🥈', '🥉'];

  const GOD_MEAN = {
    比肩: '同輩競合、自我主張增強', 劫財: '破財風險與人際摩擦', 食神: '才華展現與享受生活', 傷官: '表達、創新與口舌／叛逆',
    正財: '穩定收入與務實積累', 偏財: '偏財與外來機會', 正官: '名位、考試與規範', 偏官: '壓力、挑戰與突發事件',
    正印: '貴人、學習與庇蔭', 偏印: '偏門學習、獨處思考與轉折'
  };
  const GOD_GOOD = {
    比肩: '同儕助力、自我確立', 劫財: '朋友與合作的助力（財務上仍宜守分寸）', 食神: '才華展現與享受生活', 傷官: '表達與創新的舞台',
    正財: '穩定收入與務實積累', 偏財: '外來機會與偏財', 正官: '名位、考試與肯定', 偏官: '突破挑戰、掌握權責的機會',
    正印: '貴人、學習與庇蔭', 偏印: '專業鑽研與靈感的累積'
  };
  const GOD_BAD = {
    比肩: '同輩競爭與固執、花費增加', 劫財: '破財風險與人際摩擦', 食神: '懶散鬆懈與耗洩', 傷官: '口舌是非與衝動，易與規範衝突',
    正財: '財務壓力與責任加重', 偏財: '投機誘惑與財務破耗', 正官: '規範與壓力、考核緊繃', 偏官: '突發壓力、衝擊與意外',
    正印: '依賴與思慮過多', 偏印: '孤僻、多疑與情緒內耗'
  };
  const pn = n => /宮$/.test(n) ? n : n + '宮';
  const PAL_GOOD = {
    命宮: '自我展現、重大決定與轉型', 兄弟: '同儕與手足的助力', 夫妻: '感情與合作關係', 子女: '創作與晚輩緣', 財帛: '財務與資源累積', 疾厄: '健康調養與體質改善',
    遷移: '外出、升學異地與發展', 交友: '人脈與團隊合作', 官祿: '學業、考試與事業開創', 田宅: '居家、置產與根基穩固', 福德: '精神享受與內心安定', 父母: '長輩提攜、文書與證照'
  };
  const PAL_BAD = {
    命宮: '自我調適與重大抉擇', 兄弟: '同儕摩擦與手足事務', 夫妻: '感情與合作的摩擦', 子女: '創作瓶頸與晚輩壓力', 財帛: '財務與破耗', 疾厄: '身心健康與意外',
    遷移: '外出奔波與環境變動', 交友: '人際是非與小人', 官祿: '學業事業壓力與考運', 田宅: '居家變動與根基', 福德: '情緒與睡眠', 父母: '長輩健康與文書合約'
  };
  const minorize = (txt, adult) => adult ? txt : txt.replace('感情與合作的摩擦', '友誼與人際的摩擦').replace('感情與合作關係', '友誼與人際關係');

  function yearInfo(d, Y) {
    const { fp, an, zw } = d, p = Bazi.yearPillar(Y);
    const g = an.grade(p.stemIdx, p.branchIdx);
    const xu = Y - d.birthYear + 1;
    const dy = fp.dayun.list.find(x => xu >= x.ageFrom && xu <= x.ageTo) || null;
    const gD = dy ? an.grade(dy.stemIdx, dy.branchIdx) : null;
    const cell = zw.cells[p.branchIdx];
    const zs = PA.palaceScore(zw, p.branchIdx);
    const huas = PA.flowHua(zw, Y);
    let adj = 0; const hnotes = [];
    huas.forEach(h => {
      if (!h.rel) return;
      const at = `化${h.type}入流年${pn(h.rel)}（${h.star}，本命${pn(h.palace)}位）`;
      if (h.type === '祿' && ['命宮', '官祿', '財帛', '福德'].includes(h.rel)) { adj += 0.7; hnotes.push(at); }
      if ((h.type === '權' || h.type === '科') && ['命宮', '官祿', '財帛'].includes(h.rel)) { adj += 0.4; hnotes.push(at); }
      if (h.type === '忌' && ['命宮', '疾厄', '財帛', '官祿', '夫妻', '福德'].includes(h.rel)) { adj -= 0.9; hnotes.push(at); }
    });
    const clashDay = Data.isClash(p.branchIdx, fp.day.branchIdx), clashMonth = Data.isClash(p.branchIdx, fp.month.branchIdx);
    if (clashDay) adj -= 1; if (clashMonth) adj -= 0.5;
    // 補充：天干相沖（甲庚、乙辛、丙壬、丁癸）、伏吟、沖年／時支（命理通則，原參考程式未計）
    const STEM_CLASH = { 0: 6, 1: 7, 2: 8, 3: 9, 6: 0, 7: 1, 8: 2, 9: 3 };
    const stemClash = ['year', 'month', 'day', 'hour'].filter(k => STEM_CLASH[p.stemIdx] === fp[k].stemIdx);
    const fuyin = ['year', 'month', 'day', 'hour'].filter(k => fp[k].stemIdx === p.stemIdx && fp[k].branchIdx === p.branchIdx);
    const clashOther = ['year', 'hour'].some(k => Data.isClash(p.branchIdx, fp[k].branchIdx));
    const CN = { year: '年', month: '月', day: '日', hour: '時' };
    const bnotes = [];
    if (stemClash.length) { adj -= stemClash.includes('day') || stemClash.includes('month') ? 0.8 : 0.4; bnotes.push(`${Data.STEMS[p.stemIdx]}沖${stemClash.map(k => CN[k] + '干' + fp[k].stem).join('、')}`); }
    if (fuyin.length) { adj -= 0.6; bnotes.push(`與${fuyin.map(k => CN[k] + '柱').join('、')}伏吟（變動、反覆）`); }
    if (clashOther) adj -= 0.4;
    if (stemClash.length && (clashDay || clashMonth || clashOther)) { adj -= 0.6; bnotes.push('天克地沖'); }
    const dxc = zw.cells.find(c => xu >= c.daxian[0] && xu <= c.daxian[1]);
    const dzs = dxc ? PA.palaceScore(zw, dxc.branchIdx) : 50;
    // 八字（流年＋大運）與紫微（流年命宮＋大限命宮＋四化）各約一半權重
    const score = g.score + (gD ? gD.score * 0.5 : 0) + (zs - 50) / 15 + (dzs - 50) / 20 + adj;
    return {
      Y, age: Y - d.birthYear, xu, gz: Data.STEMS[p.stemIdx] + Data.BRANCHES[p.branchIdx], god: Data.tenGod(fp.day.stemIdx, p.stemIdx),
      g, bnotes, dy, gD, cell, zs, dxc, dzs, huas, hnotes, clashDay, clashMonth, score
    };
  }

  // 選出不重疊的 3 年視窗
  function pickWindows(rows, len, best) {
    const wins = [];
    for (let i = 0; i + len <= rows.length; i++) {
      const w = rows.slice(i, i + len);
      wins.push({ i, rows: w, sum: w.reduce((a, r) => a + r.score, 0) });
    }
    wins.sort((a, b) => (best ? b.sum - a.sum : a.sum - b.sum) || a.i - b.i);
    const out = [];
    for (const w of wins) {
      if (out.length >= 3) break;
      if (out.every(o => Math.abs(o.i - w.i) >= len)) out.push(w);
    }
    return out.sort((a, b) => a.i - b.i).map((w, k) => ({ ...w, rank: k }))
      .sort((a, b) => (best ? b.sum - a.sum : a.sum - b.sum) || a.i - b.i);
  }

  function windowHTML(d, F, w, best, idx) {
    const { an, fp, zw } = d, adult = d.age >= 18;
    const r0 = w.rows[0], r1 = w.rows[w.rows.length - 1];
    const top = w.rows.slice().sort((a, b) => best ? b.score - a.score : a.score - b.score)[0];
    const ag = x => `${x.age} 歲`;
    const bazi = w.rows.map(r => `${r.Y} ${r.gz}（${r.god}・${r.g.label}）`).join('、');
    const dys = [...new Set(w.rows.filter(r => r.dy).map(r => `${r.dy.gz}（${r.dy.god}・${r.gD.label}）`))];
    const turn = w.rows.find(r => r.dy && r.xu === r.dy.ageFrom);
    const notes = [...new Set(w.rows.flatMap(r => r.g.notes.concat(r.bnotes)))];
    const zwl = w.rows.map(r => `${r.Y}「${pn(r.cell.name)}」${r.cell.main.length ? '（' + PA.H.starList(r.cell.main) + '）' : '（無主星）'}`).join('、');
    const hn = w.rows.filter(r => r.hnotes.length).map(r => `${r.Y} ${r.hnotes.join('、')}`);
    const kind = best ? PAL_GOOD : PAL_BAD;
    const topDom = minorize(kind[top.cell.name] || '', adult);
    const godM = (best ? GOD_GOOD : GOD_BAD)[top.god];
    const items = [];
    items.push(`<strong>八字：</strong>${bazi}${dys.length ? '；所行大運 ' + dys.join('、') : ''}${turn ? `；${turn.Y} 年為起運／換運之年` : ''}${notes.length ? '；' + notes.join('、') : ''}。`);
    items.push(`<strong>紫微：</strong>流年命宮依序落在 ${zwl}${hn.length ? '；' + hn.join('、') : ''}。`);
    if (best) {
      items.push(`<strong>重點年份：</strong>${top.Y} 年（${ag(top)}）流年${top.gz}為${top.god}，主「${godM}」，流年命宮落「${pn(top.cell.name)}」，利於${topDom}；${top.g.advice}`);
      const fav = an.favElems.join('、');
      items.push(`<strong>把握方向：</strong>此段屬喜用（${fav}）得力的時期，宜在${topDom}上積極布局${top.dy ? `，並善用 ${top.dy.gz} 大運的${top.dy.god}能量` : ''}；${adult ? '事業、財務與感情都適合主動出擊，重要決定可優先安排在這幾年。' : '學習、升學與人際都適合主動嘗試，重要的考試或決定可優先安排在這幾年。'}`);
    } else {
      const hjIn = top.huas.find(h => h.type === '忌' && h.rel);
      items.push(`<strong>留意年份：</strong>${top.Y} 年（${ag(top)}）流年${top.gz}為${top.god}，主「${godM}」，流年命宮落「${pn(top.cell.name)}」，需留意${topDom}；${top.g.advice}`);
      const extra = [];
      if (w.rows.some(r => r.clashDay)) extra.push('流年沖日支，作息、居住、出行與親密關係易有變動');
      if (w.rows.some(r => r.clashMonth)) extra.push('流年沖月支，與長輩、師長或原生環境易有波動');
      if (hjIn) extra.push(`流年化忌（${hjIn.star}）入流年${pn(hjIn.rel)}，${PA.K.HUAJI[hjIn.star] ? '易在「' + PA.K.HUAJI[hjIn.star] + '」上卡關' : '該領域較易糾結'}`);
      items.push(`<strong>需要防範：</strong>${extra.length ? extra.join('；') + '。' : '干支與四化的壓力集中，宜保守行事。'}`);
      items.push(`<strong>因應之道：</strong>忌神（${an.badElems.join('、')}）當道的時期，宜沉潛修德、不冒進、不做高風險投資或重大賭注；規律作息、定期健檢，${adult ? '重要合約與感情決定多一道覆核。' : '考試與重要事項多做一次檢查，遇到壓力主動向家人師長求助。'}`);
    }
    const label = best ? ['第一', '第二', '第三'][idx] + '黃金期' : ['第一', '第二', '第三'][idx] + '波折期';
    const sum = w.sum / w.rows.length;
    const tag = best ? (sum >= 1 ? '' : '（相對較佳）') : (sum <= -0.5 ? '' : '（相對較需留意，整體尚屬平穩）');
    const head = `${best ? MEDAL[idx] : '⚠️'} 未來${label}${tag}（約 ${r0.age}–${r1.age} 歲 / 西元 ${r0.Y}–${r1.Y} 年）：`;
    return `<div class="${best ? 'top3-item' : 'warning-item'}"><strong>${head}</strong><ul class="analysis-list" style="margin-top:6px">${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
  }

  // 過去回顧
  function pastHTML(d, F) {
    const { fp, an } = d, now = d.now.y;
    const rows = []; for (let Y = d.birthYear + 1; Y <= now; Y++) rows.push(yearInfo(d, Y));
    const best = rows.slice().sort((a, b) => b.score - a.score).slice(0, 3).filter(r => r.score > 0);
    const worst = rows.slice().sort((a, b) => a.score - b.score).slice(0, 3).filter(r => r.score < 0);
    const passed = fp.dayun.list.filter(x => x.ageFrom <= d.xuAge).map(x => {
      const gr = an.grade(x.stemIdx, x.branchIdx), cur = d.xuAge >= x.ageFrom && d.xuAge <= x.ageTo;
      return `${x.ageFrom}–${Math.min(x.ageTo, d.xuAge)} 歲（虛，西元 ${x.yearFrom}${cur ? ' 起，行運中' : '–' + x.yearTo}）走 <strong>${x.gz}</strong> 大運（${x.god}・${gr.label}）：${gr.advice}`;
    });
    const fmt = r => `${r.Y} 年（${r.age} 歲，${r.gz}・${r.god}・${r.g.label}${r.g.notes.concat(r.bnotes).length ? '：' + r.g.notes.concat(r.bnotes).join('、') : ''}${r.hnotes.length ? '；' + r.hnotes.join('、') : ''}）`;
    const items = [];
    items.push(passed.length ? `<strong>已走過的大運：</strong><br>${passed.join('<br>')}` : `<strong>大運：</strong>${fp.dayun.startText}，尚未起運，此前以原局與流年影響為主。`);
    items.push(`<strong>回顧較順遂的年份：</strong>${best.length ? best.map(fmt).join('；') : '過去沒有特別突出的順遂年份，整體起伏平均。'}`);
    items.push(`<strong>回顧變動較大的年份：</strong>${worst.length ? worst.map(fmt).join('；') : '過去沒有特別突出的波折年份。'}`);
    items.push('<strong>回想提示：</strong>可對照那幾年是否有轉學、搬家、換班、換環境、重要考試或關係調整；與實際經驗吻合，才有參考價值。');
    return items;
  }

  function futureHTML(d, F) {
    const rows = []; for (let Y = d.now.y + 1; Y <= d.now.y + 30; Y++) rows.push(yearInfo(d, Y));
    const bestW = pickWindows(rows, 3, true), worstW = pickWindows(rows, 3, false);
    return {
      rows, bestW, worstW,
      best: bestW.map((w, i) => windowHTML(d, F, w, true, i)).join(''),
      worst: worstW.map((w, i) => windowHTML(d, F, w, false, i)).join('')
    };
  }

  PA.TL = { pn, yearInfo, pastHTML, futureHTML, pickWindows, GOD_MEAN, PAL_GOOD, PAL_BAD, MEDAL };
})(typeof window !== 'undefined' ? window : globalThis);
