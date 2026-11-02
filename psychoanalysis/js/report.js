/* report.js — 排盤結果顯示（八字四柱、五行、用神、大運流年、紫微命盤）與報告組裝 */
(function (g) {
  const PA = g.PA = g.PA || {};
  const { esc } = PA.H;
  const { Data: D, Bazi, Ziwei, Cal } = PA;
  const KEYS = ['year', 'month', 'day', 'hour'];
  const eb = e => `<span class="el el-${e}">${e}</span>`;
  const colored = (txt, e) => `<span class="el el-${e}">${esc(txt)}</span>`;
  const pad = n => String(n).padStart(2, '0');
  const fmtMs = ms => { const x = new Date(ms + 8 * 3600000); return `${x.getUTCFullYear()}/${x.getUTCMonth() + 1}/${x.getUTCDate()} ${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}`; };

  function pillarTable(fp) {
    const row = (label, f, cls) => `<tr><th>${label}</th>${KEYS.map(k => `<td${cls ? ` class="${cls}"` : ''}>${f(fp[k], k)}</td>`).join('')}</tr>`;
    const kwHit = (p, k) => {
      const hit = [];
      if (k !== 'day' && fp.kongwang.day.includes(p.branchIdx)) hit.push('日空');
      if (k !== 'year' && fp.kongwang.year.includes(p.branchIdx)) hit.push('年空');
      return hit.length ? `<span class="kw">${hit.join('、')}</span>` : '';
    };
    return `<table class="tbl"><thead><tr><th></th><th>年柱</th><th>月柱</th><th>日柱</th><th>時柱</th></tr></thead><tbody>
      ${row('十神', (p, k) => k === 'day' ? '<span class="badge">日主</span>' : p.god)}
      ${row('天干', p => colored(p.stem, p.stemElem) + `<small>${p.stemElem}</small>`, 'gz')}
      ${row('地支', (p, k) => colored(p.branch, p.branchElem) + `<small>${p.branchElem}</small>` + kwHit(p, k), 'gz')}
      ${row('藏干', p => p.hidden.map(h => colored(h.stem, h.elem)).join(' '))}
      ${row('藏干十神', p => p.hidden.map(h => h.god).join('<br>'))}
      ${row('十二運', p => `${p.stage}<small>（自坐${p.selfStage}）</small>`)}
      ${row('納音', p => p.nayin)}
      ${row('所屬旬', p => { const x = Math.floor(p.jiazi / 10); return `甲${D.BRANCHES[(12 - 2 * x) % 12]}旬<br><small>空亡：${Bazi.kongwang(p.jiazi).map(i => D.BRANCHES[i]).join('')}</small>`; })}
    </tbody></table>`;
  }
  const bars = (pct, dmE) => D.ELEMS.map(e => `<div class="bar-row"><span class="bar-label">${eb(e)} <small>${e === dmE ? '命主・' : ''}${D.groupOfElem(dmE, e)}</small></span>
      <div class="bar-bg"><div class="bar-fill el-bg-${e}" style="width:${Math.max(pct[e], 1)}%"></div></div><span class="bar-val">${pct[e]}%</span></div>`).join('');

  function dayunTable(d) {
    const { fp, an, nowInfo } = d;
    return `<table class="tbl small"><thead><tr><th>年齡(虛)</th><th>西元</th><th>大運</th><th>十神</th><th>吉凶</th><th>說明</th></tr></thead><tbody>` +
      fp.dayun.list.map(x => {
        const gr = an.grade(x.stemIdx, x.branchIdx), cur = nowInfo.dayun && nowInfo.dayun.no === x.no;
        return `<tr class="${cur ? 'cur' : ''}"><td>${x.ageFrom} - ${x.ageTo}</td><td>${x.yearFrom}</td><td class="gz">${colored(x.gz[0], D.STEM_ELEM[x.stemIdx])}${colored(x.gz[1], D.BRANCH_ELEM[x.branchIdx])}</td>
          <td>${x.god}<br><small>${x.hiddenGods.join('/')}</small></td><td><span class="badge b-${gr.cls}">${gr.label}</span>${cur ? '<br><small>行運中</small>' : ''}</td>
          <td class="left"><small>干${eb(gr.stemElem)}${gr.stemVal > 0 ? '喜' : gr.stemVal < 0 ? '忌' : '平'}、支${eb(gr.branchElem)}${gr.branchVal > 0 ? '喜' : gr.branchVal < 0 ? '忌' : '平'}${gr.notes.length ? '；' + esc(gr.notes.join('；')) : ''}</small><br>${gr.advice}</td></tr>`;
      }).join('') + '</tbody></table>';
  }
  function flowTable(d) {
    const { fp, an, nowInfo } = d, refY = nowInfo.flowYear; let rows = '';
    for (let y = refY; y < refY + 10; y++) {
      const p = Bazi.yearPillar(y), gr = an.grade(p.stemIdx, p.branchIdx), age = y - d.birthYear + 1;
      const dy = fp.dayun.list.find(x => age >= x.ageFrom && age <= x.ageTo);
      rows += `<tr class="${y === refY ? 'cur' : ''}"><td>${y}</td><td>${age}</td><td class="gz">${colored(D.STEMS[p.stemIdx], D.STEM_ELEM[p.stemIdx])}${colored(D.BRANCHES[p.branchIdx], D.BRANCH_ELEM[p.branchIdx])}</td>
        <td>${D.tenGod(fp.day.stemIdx, p.stemIdx)}</td><td>${dy ? dy.gz : '未起運'}</td><td><span class="badge b-${gr.cls}">${gr.label}</span></td><td class="left"><small>${esc(gr.notes.join('；'))}</small></td></tr>`;
    }
    return `<table class="tbl small"><thead><tr><th>流年</th><th>虛歲</th><th>干支</th><th>十神</th><th>所行大運</th><th>吉凶</th><th>合沖</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  const GRID = [[5, 6, 7, 8], [4, null, null, 9], [3, null, null, 10], [2, 1, 0, 11]], GR = {};
  GRID.forEach((r, ri) => r.forEach((b, ci) => { if (b !== null) GR[b] = [ri + 1, ci + 1]; }));
  function ziweiGrid(d) {
    const { zw, fp } = d, kindCls = { good: 's-good', bad: 's-bad', misc: 's-misc' };
    const star = (s, main) => `<span class="${main ? 's-main' : kindCls[s.kind]}">${esc(s.n)}${s.br ? `<i>${s.br}</i>` : ''}${s.hua ? `<b class="hua hua-${s.hua}">化${s.hua}</b>` : ''}</span>`;
    const cellHtml = b => {
      const c = zw.cells[b];
      const tags = [c.isLife ? '命' : '', c.isBody ? '身' : ''].filter(Boolean).map(t => `<em class="ztag">${t}</em>`).join('');
      const flows = [c.curDaxian ? '大限' : '', c.curXiaoxian ? '小限' : '', c.flowYear ? '流年' : ''].filter(Boolean).map(t => `<em class="flow">${t}</em>`).join('');
      return `<div class="zcell${c.isLife ? ' is-life' : ''}${c.curDaxian ? ' cur-dx' : ''}" style="grid-row:${GR[b][0]};grid-column:${GR[b][1]}">
        <div class="z-stars"><div class="z-main">${c.main.map(s => star(s, true)).join('')}</div><div class="z-minor">${c.minor.map(s => star(s, false)).join('')}</div></div>
        <div class="z-mid"><span class="z-cs">${c.changsheng}</span><span class="z-dx">${c.daxian[0]} - ${c.daxian[1]}</span><span class="z-fl">${flows}</span></div>
        <div class="z-low"><span class="z-small">${c.boshi}<br>${c.suiqian}<br>${c.jiangqian}</span>
          <span class="z-name">${tags}<b>${c.name}</b><br><small>${c.gz}</small></span></div></div>`;
    };
    const center = `<div class="zcenter"><h4>紫微斗數命盤</h4><table class="zinfo">
      <tr><th>姓名</th><td>${esc(d.name)}（${d.gender}命）</td></tr>
      <tr><th>陽曆</th><td>${esc(d.clockText)}</td></tr>
      <tr><th>農曆</th><td>${Cal.lunarText(fp.lunar)} ${D.BRANCHES[fp.time.hourBranch]}時</td></tr>
      <tr><th>八字</th><td>${KEYS.map(k => fp[k].gz).join('　')}</td></tr>
      <tr><th>五行局</th><td>${zw.yangYear ? '陽' : '陰'}${d.gender}　${zw.juName}　生肖${fp.lunarZodiac}</td></tr>
      <tr><th>命宮／身宮</th><td>${D.BRANCHES[zw.life]}宮／${D.BRANCHES[zw.body]}宮（身宮在${zw.cells[zw.body].name}）</td></tr>
      <tr><th>命主／身主</th><td>${zw.mingzhu}／${zw.shenzhu}</td></tr>
      <tr><th>生年四化</th><td>${zw.hua.join('、')}</td></tr>
      <tr><th>大限</th><td>${zw.fwd ? '順行' : '逆行'}　${d.now.y} 年虛歲 ${zw.nowAge}</td></tr></table></div>`;
    return `<div class="zgrid">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(cellHtml).join('')}${center}</div>`;
  }
  function ziweiFocus(d) {
    const { zw } = d, base = zw.cells.find(c => c.name === '命宮'), sf = Ziwei.sanfang(zw, base.branchIdx);
    const labels = ['本宮', '對宮', '三合(財帛位)', '三合(官祿位)'];
    const starsOf = c => c.main.length ? c.main.map(s => s.n + (s.br ? `(${s.br})` : '') + (s.hua ? `化${s.hua}` : '')).join('、') : '無主星（借對宮星曜）';
    const rows = sf.map((c, i) => `<tr><td>${labels[i]}</td><td>${c.name}（${c.gz}）</td><td>${starsOf(c)}</td><td>${c.minor.filter(s => ['good', 'bad'].includes(s.kind)).map(s => s.n + (s.hua ? '化' + s.hua : '')).join('、') || '—'}</td></tr>`).join('');
    const mains = (base.main.length ? base.main : zw.cells[(base.branchIdx + 6) % 12].main).map(s => `${s.n}：${Ziwei.MAIN_NOTE[s.n]}`).join('；');
    const bads = sf.reduce((a, c) => a + c.minor.filter(s => s.kind === 'bad').length, 0), goods = sf.reduce((a, c) => a + c.minor.filter(s => s.kind === 'good').length, 0);
    const huas = sf.flatMap(c => c.huaList.map(h => `${c.name}${h}`));
    const tone = goods - bads >= 2 ? '吉星多於煞星，助力較足。' : goods - bads >= 0 ? '吉煞互見，宜穩中求進。' : '煞星較重，行事宜謹慎、避免冒進。';
    return `<h4>命宮（整體格局）三方四正</h4><table class="tbl small"><thead><tr><th>位置</th><th>宮位</th><th>主星</th><th>吉煞輔星</th></tr></thead><tbody>${rows}</tbody></table>
      <p><b>星性提示</b>：${esc(mains)}。</p><p><b>四化引動</b>：${huas.length ? huas.join('、') : '三方四正無生年四化'}。${tone}</p>`;
  }

  function chartSection(d) {
    const { fp, an, nowInfo } = d, dm = an.dmS, dmE = an.dmE;
    const XUN = j => '甲' + D.BRANCHES[(12 - 2 * Math.floor(j / 10)) % 12] + '旬';
    const kwText = `年柱${XUN(fp.year.jiazi)}、日柱${XUN(fp.day.jiazi)}；年柱空亡：${fp.kongwang.year.map(i => D.BRANCHES[i]).join('')}；日柱空亡：${fp.kongwang.day.map(i => D.BRANCHES[i]).join('')}`;
    const curTxt = nowInfo.dayun ? `命造今年實歲 ${nowInfo.age} 歲（虛歲 ${nowInfo.age + 1}），行 ${nowInfo.dayun.gz} 大運。` : `命造今年實歲 ${nowInfo.age} 歲，尚未起運（${fp.dayun.startText}）。`;
    const fyP = nowInfo.flowYearPillar, fyG = an.grade(fyP.stemIdx, fyP.branchIdx), fyGz = D.STEMS[fyP.stemIdx] + D.BRANCHES[fyP.branchIdx];
    const curDyG = nowInfo.dayun ? an.grade(nowInfo.dayun.stemIdx, nowInfo.dayun.branchIdx) : null;
    const warn = [];
    const dTerm = Math.min(Math.abs(fp.time.instantMs - fp.prevTerm.ms), Math.abs(fp.nextTerm.ms - fp.time.instantMs)) / 3600000;
    if (dTerm < 36) warn.push(`<p class="warn">⚠️ 出生時間距離節氣「${fp.prevTerm.name}／${fp.nextTerm.name}」不到 36 小時，月柱（甚至年柱）可能因出生時刻不同而改變，建議以精確出生時刻重算。</p>`);
    if (d.birthMode === 'shichen') warn.push('<p class="note">目前以時辰代表時間；若實際出生時間接近時辰交界，時柱可能不同。</p>');
    return `<h2 class="sec-title">【 四 柱 八 字 與 紫 微 命 盤（供核對） 】</h2>
      <div class="summary">
        <div><b>陽曆</b>　${esc(d.clockText)}　<small>採標準時間排盤（未做真太陽時校正）</small></div>
        <div><b>農曆</b>　${Cal.lunarText(fp.lunar)}${D.BRANCHES[fp.time.hourBranch]}時　<b>生肖</b> ${fp.zodiac}　<b>出生地</b> ${esc(d.place)}</div>
        <div><b>命主</b>　${colored(dm + dmE, dmE)}　<b>命格</b> ${an.pattern.name}　<b>五行</b> ${an.countText}</div>
        <div><b>空亡</b>　${kwText}　<b>節氣</b> ${fp.prevTerm.name} ${fmtMs(fp.prevTerm.ms)} → ${fp.nextTerm.name} ${fmtMs(fp.nextTerm.ms)}</div>
        <div><b>大運</b>　${fp.gender}命・${fp.dayun.forward ? '順' : '逆'}排，${fp.dayun.startText}（約 ${fp.dayun.startDate} 起運，虛歲 ${fp.dayun.startAge} 歲）</div></div>
      ${warn.join('')}${pillarTable(fp)}
      <div class="rcard"><h3>一、五行結構與日主強弱</h3>
        <div class="two"><div><h4>原局五行結構</h4>${bars(an.pctOrig, dmE)}</div><div><h4>合會化後五行結構</h4>${bars(an.pctAdj, dmE)}</div></div>
        <p><b>合會說明</b>：${esc(an.comboText)}。</p>
        <p><b>日主強弱</b>：${dm}${dmE}生於${fp.month.branch}月，月令${dmE}處於「${an.strength.status}」地，<b>${an.strength.deLing ? '得令' : '失令'}</b>；綜合得令、得地、得勢，評分 ${an.strength.score} 分，判定為 <b>${an.strength.level}</b>。${PA.edgeNote(an)}</p></div>
      <div class="rcard"><h3>二、命盤格局與用神喜忌</h3><ul>
        <li><b>格局</b>：${an.pattern.text}</li>
        <li><b>用神</b>：<span class="badge b-good">${an.yong.group}（${an.yong.elem}）</span>　${esc(an.yongWhy)}</li>
        <li><b>喜神</b>：${an.xi.map(x => `${x.group}（${x.elem}）`).join('、')}　<b>忌神</b>：${an.ji.map(x => `<span class="badge b-bad">${x.group}（${x.elem}）</span>`).join(' ')}</li>
        <li><b>行運</b>：喜${an.favText}運，忌${an.badText}運。</li>
        <li><b>日主特質</b>：${PA.Analysis.GAN_DESC[dm]}</li></ul><div class="quote">${esc(an.summary)}</div></div>
      <div class="rcard"><h3>三、十年大運吉凶</h3><p>${curTxt}</p>${dayunTable(d)}</div>
      <div class="rcard"><h3>四、流年運勢（${nowInfo.flowYear} 年起十年）</h3>
        <p>流年：${nowInfo.flowYear}，${fyGz}年　${nowInfo.dayun ? `大運：${nowInfo.dayun.gz}（${curDyG.label}）` : ''}　今年流年：<span class="badge b-${fyG.cls}">${fyG.label}</span></p>
        <p>${esc(fyG.advice)}${nowInfo.dayun ? '大運' + esc(curDyG.advice) : ''}</p>${flowTable(d)}
        <p class="note">流年運勢以命主之八字喜忌，配合大運與流年干支推算，僅供參考。</p></div>
      <h2 class="sec-title">【 紫 微 斗 數 命 盤 】</h2>
      <div class="rcard">${ziweiGrid(d)}${ziweiFocus(d)}</div>`;
  }

  // 日主強弱評分貼近分級邊界時提醒：用神取法可能因流派而異
  PA.edgeNote = an => {
    const sc = an.strength.score, edge = [30, 45, 55, 70].find(t => Math.abs(sc - t) <= 6);
    if (edge === undefined) return '';
    const weak = sc < edge;
    return `<br><small class="note">⚠️ 評分 ${sc} 分，貼近分級邊界（${edge} 分），日主旺衰在不同流派可能判為${weak ? '較強' : '較弱'}一級；若如此，用神與喜忌會改變${an.strength.isStrong ? '' : '（身強時喜官殺、財、食傷，不喜比劫、印星）'}，建議與紫微命盤、實際經歷一併對照。</small>`;
  };

  const ORDER = ['top3', 'future_timing', 'calamity_warning', 'religion', 'career_job', 'location', 'orientation', 'elders', 'romance', 'partner',
    'physical_mental', 'personality', 'habits', 'hobbies', 'features', 'past_life', 'present_life', 'recommendations'];

  function render(d, selected) {
    const head = `<div class="report-header"><h2>東西方命理、諸葛預知術與周易心理學全景診斷報告</h2>
      <p><strong>命主稱謂：</strong> ${esc(d.name)} (${d.gender}) | <strong>出生日期：</strong> ${esc(d.dateStr)} | <strong>出生時辰：</strong> ${esc(d.timeLabel)}</p>
      <p><strong>當前時間軸心：</strong> 西元 ${d.now.y} 年 (命主現年 ${d.age} 實歲 / ${d.xuAge} 虛歲) | <strong>地點：</strong> ${esc(d.place)}</p></div>`;
    const note = '<p class="note">本程式以傳統命理（八字、紫微斗數、周易、小六壬、星座）搭配心理學觀點整理，星等為依命盤訊號計算的規則式評比，僅供參考。</p>';
    return head + note + chartSection(d) + (PA.Liuri ? PA.Liuri.render(d) : '') + ORDER.filter(k => selected.includes(k) && PA.DIMS[k]).map(k => PA.DIMS[k](d)).join('');
  }
  PA.renderReport = render;
})(typeof window !== 'undefined' ? window : globalThis);
