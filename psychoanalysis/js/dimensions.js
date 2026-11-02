/* dimensions.js — 原版 18 個分析維度（標題、標籤、五星評比結構照舊），內容依實際排盤結果產生 */
(function (g) {
  const PA = g.PA = g.PA || {};
  const { ul, starList } = PA.H;
  const { Data, Bazi } = PA;
  const K = PA.K, YI = PA.yi, TRN = PA.TRAIT_NAME, TL = PA.TL;
  const MEDAL = ['🥇', '🥈', '🥉'];

  const TAGLAB = { psych: '心理學', bazi: '八字', ziwei: '紫微斗數', astro: '西洋占星', yijing: '周易卦象', yehe: '野鶴增刪卜易', zhuge: '諸葛預知術' };
  const tg = t => { const [c, l] = Array.isArray(t) ? t : [t]; return `<span class="tag tag-${c}">${l || TAGLAB[c]}</span>`; };

  // 五星評比：以各體系訊號（+1 有利 / −1 風險 / 0 中性）計數
  function calcStars(S) {
    const pos = S.filter(s => s[1] > 0).length, neg = S.filter(s => s[1] < 0).length;
    const dom = Math.max(pos, neg);
    const zeros = S.length - pos - neg;
    return { sim: Math.max(1, Math.min(5, Math.round(1 + 4 * (dom + 0.5 * zeros) / S.length))), ji: Math.min(5, 1 + pos), xiong: Math.min(5, 1 + neg) };
  }
  function starsHTML(r) {
    const mk = (n, c) => `<span class="${c}">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
    return `<div class="star-box">
      <div class="star-item"><span>跨系統相似度:</span>${mk(r.sim, 'star-gold')}</div>
      <div class="star-item"><span>吉 (有利星數):</span>${mk(r.ji, 'star-green')}</div>
      <div class="star-item"><span>凶 (風險星數):</span>${mk(r.xiong, 'star-red')}</div></div>`;
  }
  const block = o => `<div class="report-section"><h3>${o.title}</h3>${starsHTML(calcStars(o.S))}
    <div class="tag-group">${o.tags.map(tg).join('')}</div>${o.custom || ''}${o.items && o.items.length ? ul(o.items) : ''}</div>`;

  const bn = n => `《${n}卦》（${YI.INFO[n][0]}）`;
  const sgn = x => x > 0 ? 1 : x < 0 ? -1 : 0;
  const pm = x => x >= 1 ? 1 : x <= -1 ? -1 : 0;

  function ctx(d) {
    if (!d._F) { d._F = PA.facts(d); d._T = PA.chartTraits(d._F); }
    const F = d._F, T = d._T, lv = k => PA.level(T[k]);
    return { F, T, lv, traitS: k => lv(k) === 'high' ? 1 : lv(k) === 'low' ? -1 : 0, yi: F.yi, P: F.P, fp: F.fp, an: F.an, zw: F.zw, gp: F.gp };
  }
  const yrsOf = (d, test, n) => {
    const out = [];
    for (let Y = d.now.y + 1; Y <= d.now.y + 30 && out.length < n; Y++) {
      const p = Bazi.yearPillar(Y);
      if (test(p, Y)) out.push(`${Y}（${Y - d.birthYear}歲，${Data.STEMS[p.stemIdx]}${Data.BRANCHES[p.branchIdx]}）`);
    }
    return out;
  };
  const DIMS = {};

  /* 🏆 前三多優勢 */
  DIMS.top3 = d => {
    const { F, yi, P, gp, an, fp } = ctx(d);
    const sc = (p) => (p.score - 50) / 10;
    const aux = ['命宮', '官祿', '福德'].reduce((n, k) => n + P(k).c.minor.filter(s => s.n === '文昌' || s.n === '文曲').length, 0);
    const A = [
      { t: '長輩貴人與庇蔭資源多 (長輩緣 / 師長運)', sc: sc(P('父母')) + F.eff('印星'),
        ev: `八字印星占 ${gp('印星')}%（${F.gtag('印星')}；${an.strength.level}，${an.yong.group}為用神）；紫微父母宮 ${P('父母').list}${P('父母').huaTxt.length ? '（' + P('父母').huaTxt.join('、') + '）' : ''}；周易本卦${bn(yi.ben)}。` },
      { t: '智慧思考與才華創作多 (學習與表達能力)', sc: sc(P('命宮')) * 0.5 + F.eff('食傷') + aux * 0.7,
        ev: `八字食傷占 ${gp('食傷')}%（${F.gtag('食傷')}）；紫微命宮 ${P('命宮').list}${aux ? '，且昌曲入命／官祿／福德' : ''}；太陽${d.sunSign}（${K.SIGN_TEXT[d.sunSign]}）。` },
      { t: '人際同理與感情緣分多 (人緣與感情安穩)', sc: sc(P('交友')) + (d.age >= 18 ? sc(P('夫妻')) : 0) + (F.xianchi ? 1 : 0) + F.eff(F.sg),
        ev: `八字${F.sg}（配偶星）占 ${gp(F.sg)}%（${F.gtag(F.sg)}）${F.xianchi ? '、見咸池' : ''}；紫微交友宮 ${P('交友').list}；周易互卦${bn(yi.hu)}。` },
      { t: '事業財運與成就多 (學業 / 事業 / 資源)', sc: sc(P('官祿')) + sc(P('財帛')) + (F.eff('財星') + F.eff('官殺')) / 2,
        ev: `八字財星 ${gp('財星')}%（${F.gtag('財星')}）、官殺 ${gp('官殺')}%（${F.gtag('官殺')}）；紫微官祿宮 ${P('官祿').list}、財帛宮 ${P('財帛').list}。` },
      { t: '身心福氣與內在安定多 (身心健康 / 福德)', sc: sc(P('福德')) + sc(P('疾厄')) + (/中和/.test(an.strength.level) ? 1 : 0),
        ev: `八字日主 ${F.dmS}${F.dmE}（${an.strength.level}）；紫微福德宮 ${P('福德').list}、疾厄宮 ${P('疾厄').list}；周易體用「${yi.rel}」。` },
      { t: '外出發展與環境適應力強 (遷移 / 異地運)', sc: sc(P('遷移')) + (yi.v > 0 ? 0.5 : 0),
        ev: `紫微遷移宮 ${P('遷移').list}；周易變卦${bn(yi.bian)}。` }
    ].map((x, i) => ({ ...x, i })).sort((a, c) => c.sc - a.sc || a.i - c.i).slice(0, 3);
    const names = ['第一多', '第二多', '第三多'], lu = F.hua['祿'];
    return block({
      title: '🏆 命盤最具優勢的前三多領域 (Top 3 Advantages)', tags: ['bazi', 'ziwei', 'astro', 'yijing'],
      S: [['bazi', an.strength.score >= 45 && an.strength.score <= 65 ? 1 : 0], ['ziwei', pm(sc(P('命宮')))], ['yijing', yi.v], ['astro', 0]],
      custom: `<div class="top3-box">${A.map((a, i) => `<div class="top3-item"><strong>${MEDAL[i]} ${names[i]}：${a.t}</strong><br>• ${a.ev}</div>`).join('')}</div>
        <p class="note">依實際命盤各項訊號加總排序（規則式計算），並非跨系統投票。紫微生年化祿入「${lu.palace}宮」（${lu.star}），也是較能順勢發展的領域。</p>`, items: []
    });
  };

  /* 🔮 時間軸 */
  DIMS.future_timing = d => {
    const { F, yi, P, fp, an, zw } = ctx(d);
    const fut = TL.futureHTML(d, F), past = TL.pastHTML(d, F);
    const nowInfo = d.nowInfo, cur = nowInfo.dayun, dxCell = zw.cells.find(c => c.curDaxian), fyCell = zw.cells.find(c => c.flowYear);
    const gF = an.grade(nowInfo.flowYearPillar.stemIdx, nowInfo.flowYearPillar.branchIdx), gD = cur ? an.grade(cur.stemIdx, cur.branchIdx) : null;
    const lr = d.todayLiu;
    const custom = `
      <div style="background:#edf2f7;padding:15px;border-radius:8px;margin-bottom:20px;border-left:4px solid #3182ce">
        <h4 style="margin:0 0 8px 0;color:#2b6cb0">📜 1. 過去階段回顧 (西元 ${d.birthYear}–${d.now.y} 年 / 0–${d.age} 歲)</h4>
        <ul class="analysis-list" style="font-size:.95rem">${past.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>
      <div class="top3-box" style="background:#e8f8f5;border-color:#a3e4d7">
        <h4 style="color:#117a65;margin-top:0">🌟 2. 未來運勢最佳前三時間段 (自現年 ${d.age} 歲起往後推算 30 年)</h4>${fut.best}</div>
      <div class="warning-box">
        <h4 style="color:#c62828;margin-top:0">⚠️ 3. 未來運勢最差/應注意前三時間段 (自現年 ${d.age} 歲起往後推算 30 年)</h4>${fut.worst}</div>
      <p class="note">排序方式：每年依「八字流年吉凶（依用神喜忌與合沖）＋所行大運吉凶 ×0.5＋紫微流年命宮三方四正評分＋流年四化落宮＋沖日支／月支」加總，取連續 3 年的最高／最低三個不重疊區間。為規則式相對排序，不是事件預言。</p>`;
    return block({
      title: `🔮 運勢時間軸剖析：過去階段回顧 vs 未來運勢最佳/最差 Top 3 (以現年 ${d.age} 歲往後看)`,
      tags: ['bazi', 'ziwei', 'yijing', 'zhuge'],
      S: [['bazi', gF.score > 0 ? 1 : gF.score < 0 ? -1 : 0], ['ziwei', dxCell ? P(dxCell.name).v : 0], ['yijing', sgn(YI.INFO[yi.bian][1])], ['zhuge', lr.v]],
      custom,
      items: [
        `<strong>目前位置：</strong>${cur ? `八字行 ${cur.gz} 大運（${cur.god}・${gD.label}），${gD.advice}` : '八字尚未起運'}；${nowInfo.flowYear} 年流年 ${Data.STEMS[nowInfo.flowYearPillar.stemIdx]}${Data.BRANCHES[nowInfo.flowYearPillar.branchIdx]}（${gF.label}）${gF.notes.length ? '，' + gF.notes.join('、') : ''}；${gF.advice}`,
        `<strong>紫微位置：</strong>${dxCell ? `大限走「${dxCell.name}宮」（${dxCell.daxian[0]}-${dxCell.daxian[1]} 歲，${starList(dxCell.main)}）` : ''}；流年命宮落「${fyCell.name}宮」（${starList(fyCell.main)}）。`,
        `<strong>周易（梅花易數，依出生時間起卦）：</strong>本卦${bn(yi.ben)}、互卦${bn(yi.hu)}、變卦${bn(yi.bian)}，動爻在第 ${yi.mv} 爻；${yi.relText}。本卦看起點、互卦看過程、變卦看趨勢——趨勢卦為${yi.bian}，意涵「${YI.INFO[yi.bian][0]}」。`,
        `<strong>《諸葛武侯馬前課（小六壬）》今日（${d.now.y}/${d.now.m}/${d.now.d}）落「${lr.name}」：</strong>${lr.text}。「吉凶動靜，各有其時；順天應人，吉無不利。」逢吉時宜積極進取，逢衰時宜韜光養晦、修德守靜。`
      ]
    });
  };

  /* ⚠️ 災厄血光預警 */
  DIMS.calamity_warning = d => {
    const { F, yi, P, fp, an, zw } = ctx(d), kp = F.kp, ji = F.hua['忌'];
    const dayClash = yrsOf(d, p => Data.isClash(p.branchIdx, fp.day.branchIdx), 3);
    const yearClash = yrsOf(d, p => Data.isClash(p.branchIdx, fp.year.branchIdx), 3);
    const monthClash = yrsOf(d, p => Data.isClash(p.branchIdx, fp.month.branchIdx), 3);
    const eIn = Data.elemOfGroup(F.dmE, '印星'), eCai = Data.elemOfGroup(F.dmE, '財星'), eBi = Data.elemOfGroup(F.dmE, '比劫');
    const motherY = yrsOf(d, p => Data.STEM_ELEM[p.stemIdx] === eCai && Data.BRANCH_ELEM[p.branchIdx] === eCai, 3);
    const fatherY = yrsOf(d, p => Data.STEM_ELEM[p.stemIdx] === eBi && Data.BRANCH_ELEM[p.branchIdx] === eBi, 3);
    const parent = P('父母'), parentJi = parent.huaTxt.some(t => /忌/.test(t));
    const handoff = fp.dayun.list.slice(0, 7).map(x => `${x.ageFrom - 1}–${x.ageFrom} 歲（${x.gz}運）`);
    const kpTxt = (kp.falls.length || kp.po.length)
      ? `命盤地支${kp.falls.length ? '「落空」：' + kp.falls.join('、') : ''}${kp.falls.length && kp.po.length ? '；' : ''}${kp.po.length ? '「月破」：' + kp.po.join('、') : ''}`
      : `命盤地支未見落空或月破（日柱旬空為 ${kp.kongNames.join('、')}、月破之支為 ${kp.poBranch}）`;
    const bads = P('疾厄').bads;
    return block({
      title: '⚠️ 災厄與風險預警 (關煞、血光之災、親人健康 - 野鶴老人法門)', tags: ['yehe', 'zhuge', 'bazi', 'ziwei'],
      S: [['bazi', F.hasYangren ? -1 : (dayClash.length ? 0 : 1)], ['ziwei', ji.palace === '疾厄' || parentJi ? -1 : P('疾厄').v], ['yehe', (kp.falls.length || kp.po.length) ? -1 : 1], ['zhuge', d.birthLiu.v], ['yijing', yi.v]],
      items: [
        `<strong>血光之災與外傷風險預警：</strong>${F.hasYangren ? '八字四柱見「羊刃」，傳統認為個性較急、需留意衝動與外傷；' : '八字四柱未見羊刃；'}紫微疾厄宮 ${P('疾厄').list}${bads.length ? '，見煞星 ' + bads.join('、') : ''}${P('疾厄').huaTxt.length ? '（' + P('疾厄').huaTxt.join('、') + '）' : ''}。流年地支沖日支的年份：${dayClash.length ? dayClash.join('、') : '近 30 年無'}——作息與環境易有變動，出行、運動多留意安全，避免高風險極限運動。民間「年初捐血、洗牙以主動見血化解」的說法並無實證，但定期捐血、洗牙本身對健康無害。`,
        `<strong>大劫數與人生重大轉折關隘：</strong>大運交接關口：${handoff.join('、')}；流年沖年支的年份：${yearClash.length ? yearClash.join('、') : '近 30 年無'}。此時易出現環境或抉擇的轉換，宜秉持《周易》「蹇卦反身修德」精神，不冒進、不投機高風險投資。`,
        `<strong>失去親人與長輩健康關煞：</strong>八字以正印為母、偏財為父（月柱代表父母與長輩宮）。財星（${eCai}）強旺之年易剋印星（${eIn}），需關注母系長輩健康：${motherY.length ? motherY.join('、') : '近 30 年無明顯年份'}；比劫（${eBi}）強旺之年易剋財星，需關注父系長輩健檢：${fatherY.length ? fatherY.join('、') : '近 30 年無明顯年份'}；流年沖月支的年份：${monthClash.length ? monthClash.join('、') : '近 30 年無'}。紫微父母宮 ${parent.list}${parentJi ? '，且有化忌疊入，宜定期陪同長輩健檢並多加陪伴' : ''}。`,
        `<strong>《野鶴老人增刪卜易全書》趨吉避凶法門：</strong>典籍載「卦逢動爻月破，避之則吉；避空避破，積德化解」。${kpTxt}。周易動爻在第 ${yi.mv} 爻，本卦${bn(yi.ben)}，${yi.relText}；若卜得關煞動爻，宜主動出外避氣，或透過樂善好施、誦經積德來轉化心態。`,
        `<strong>諸葛馬前課（小六壬）本命落「${d.birthLiu.name}」：</strong>${d.birthLiu.text}。`,
        '<strong>理性心理學防禦：</strong>預警旨在「提前預防與風險控管」，絕非必然發生之宿命。建立定期健檢習慣與安全防護意識，能大幅降低實體風險。'
      ]
    });
  };

  /* ⛩️ 鬼神信仰 */
  DIMS.religion = d => {
    const { F, yi, P, lv, traitS, gp } = ctx(d), fude = P('福德');
    let pts = 0; const why = [];
    if (lv('O') === 'high') { pts++; why.push('開放性傾向偏高'); }
    if (F.huagai) { pts++; why.push('八字見華蓋'); }
    if (gp('印星') >= 25) { pts++; why.push(`印星偏旺（${gp('印星')}%）`); }
    const misc = fude.c.minor.filter(s => ['華蓋', '天巫', '天月', '天福', '天德'].includes(s.n)).map(s => s.n);
    if (misc.length) { pts++; why.push('紫微福德宮見' + misc.join('、')); }
    if (fude.main.some(s => ['天機', '天梁', '巨門'].includes(s.n))) { pts++; why.push('福德宮見偏思辨／內省的星'); }
    if (['坎', '艮', '巽', '觀', '震'].includes(yi.ben) || ['坎', '艮', '巽'].includes(yi.ti)) { pts++; why.push('周易卦象偏內省／感通'); }
    const level = pts >= 3 ? '偏高' : pts >= 1 ? '中等' : '偏低';
    const style = (gp('印星') >= 25 || F.huagai) ? '道教／儒家天命哲學（易理與修身）、大乘佛教／禪宗（觀心與慈悲）、冥想與身心靈實修' : '偏行動關懷型：透過志工、慈善與社群參與體現信念，亦可選擇傳統宗教的社群活動';
    return block({
      title: '⛩️ 對鬼神信仰程度與適合宗教 (Gods/Spiritual Belief & Religious Affinity)', tags: [['bazi', '八字 偏印/華蓋'], ['ziwei', '紫微 華蓋/天巫/福德'], ['yijing', '周易 卦象'], ['psych', '心理學 超個人心理']],
      S: [['bazi', (F.huagai || gp('印星') >= 25) ? 1 : 0], ['ziwei', fude.v], ['yijing', yi.v], ['psych', traitS('O')]],
      items: [
        `<strong>對鬼神與神秘力量信仰程度（${level}）：</strong>${why.length ? '依據：' + why.join('、') + '。' : '命盤沒有特別明顯的靈性訊號。'}傳統上以印星、華蓋、福德宮與卦象判斷對靈性事物的親近度；心理學上則與開放性、對意義的追尋有關。`,
        `<strong>適合之宗教與靈性修持領域：</strong>${style}。紫微福德宮：${fude.line}${fude.text ? '——' + fude.text : ''}。`,
        `<strong>周易與心理學統整：</strong>周易本卦${bn(yi.ben)}；心理學上信仰常提供意義、社群支持與情緒安定。建議抱持敬畏而不迷信的理性態度，將信仰轉化為內在慈悲與處世智慧。`
      ]
    });
  };

  /* 💼 事業 */
  DIMS.career_job = d => {
    const { F, yi, P, lv, an, fp } = ctx(d), guan = P('官祿'), gs = F.fgroups.slice(0, 2), caut = F.groups.filter(x => x[1] >= 20 && F.gval(x[0]) < 0).map(x => x[0]);
    const zjob = ['官祿', '財帛', '命宮'].map(n => { const p = P(n); return p.main.length ? `${TL.pn(n)} ${p.main.map(x => x.n).join('、')} → ${p.main.map(x => PA.K.STAR_JOB[x.n]).join('；')}` : ''; }).filter(Boolean);
    const TF = { O: '研究與科技、設計與創作、媒體與傳播、教育出版', C: '工程與資訊、法務會計、行政與專案管理、醫療專業', E: '業務公關、教學培訓、創業管理、活動企劃', A: '醫護社工、心理諮商、教育輔導、客戶服務' };
    const tf = ['O', 'C', 'E', 'A'].filter(k => lv(k) === 'high').map(k => `${TRN[k]}傾向偏高 → ${TF[k]}`);
    return block({
      title: '💼 合適事業與工作領域 (Suitable Career & Jobs)', tags: [['bazi', '八字 十神/五行'], ['ziwei', '紫微 官祿宮'], ['yijing', '周易 卦象'], ['psych', '心理學 人格傾向']],
      S: [['bazi', gs.some(k => F.fav.includes(Data.elemOfGroup(F.dmE, k))) ? 1 : 0], ['ziwei', guan.v], ['yijing', yi.v], ['psych', tf.length ? 1 : 0]],
      items: [
        `<strong>合適行業類別（依用神喜忌）：</strong>命局喜${an.favText}，適合 ${F.life.job}。`,
        `<strong>職業性質：</strong>局成${an.pattern.name}，${F.life.nature}`,
        `<strong>八字十神視角（取喜用者）：</strong>${gs.map(k => `${k}（占 ${F.gp(k)}%，${F.gtag(k)}，${PA.K.GROUP_TEXT[k]}）→ ${PA.K.GROUP_FIELDS[k]}`).join('；')}。${caut.length ? `${caut.join('、')}雖偏旺但屬忌神，這類壓力型或耗損型的工作宜量力而為、不宜勉強。` : ''}`,
        `<strong>紫微星曜取向：</strong>${zjob.join('；') || '官祿、財帛、命宮均無主星，借對宮星曜判讀'}。`,
        `<strong>紫微官祿宮：</strong>${guan.line}${guan.text ? '——' + guan.text : ''}${guan.goods.length ? '；吉星：' + guan.goods.join('、') : ''}${guan.bads.length ? '；煞星：' + guan.bads.join('、') : ''}。`,
        `<strong>周易視角：</strong>本卦${bn(yi.ben)}，體用「${yi.rel}」——${yi.relText}。`,
        tf.length ? `<strong>心理學視角（由命盤推估的人格傾向）：</strong>${tf.join('；')}。` : '<strong>心理學視角：</strong>各面向傾向居中，適合多方嘗試、以實作收斂興趣。',
        PA.edgeNote(an) ? `<strong>用神提醒：</strong>日主強弱評分貼近分級邊界，八字對「官殺是否為忌」的判斷可能不同；與紫微官祿宮（${guan.list}）取向差異較大時，宜以實際經歷與紫微一併參考。` : '',
        '<strong>提醒：</strong>興趣、能力與價值觀仍需以實習、專案與課程驗證，命盤只是縮小探索範圍。'
      ]
    });
  };

  /* 🗺️ 地點與方位 */
  DIMS.location = d => {
    const { F, yi, P, an } = ctx(d), qian = P('遷移');
    const tone = qian.huaTxt.some(t => /忌/.test(t)) ? '外出較需要時間適應，宜先做功課再行動' : qian.huaTxt.length ? '外出與換環境時較易得到助力' : qian.v > 0 ? '遷移宮吉星居多，外出發展助力較足' : qian.v < 0 ? '遷移宮煞星較重，外出發展宜謹慎評估' : '外出發展的助力與阻力屬一般';
    return block({
      title: '🗺️ 合適工作地點與發展方位 (Suitable Work Location & Direction)', tags: [['bazi', '八字 喜用方位'], ['ziwei', '紫微 遷移宮/天馬'], ['yijing', '周易 變卦']],
      S: [['bazi', 1], ['ziwei', qian.v], ['yijing', sgn(YI.INFO[yi.bian][1])]],
      items: [
        `<strong>最佳發展方位：</strong>日主 ${F.dmS}${F.dmE}（${an.strength.level}），命局喜${an.favText}，吉利方位為 ${F.life.dir}；幸運色彩 ${F.life.color}。（用神 ${an.yong.group}／${an.yong.elem}，忌 ${an.badText}。）`,
        `<strong>外地／出國發展運勢：</strong>紫微遷移宮 ${qian.line}${qian.c.minor.some(s => s.n === '天馬') ? '，見天馬，利奔波與外出' : ''}；${tone}。周易變卦${bn(yi.bian)}，意指趨勢「${YI.INFO[yi.bian][0]}」。`,
        '<strong>心理學觀點：</strong>環境適配比方位更重要——是否有支持你的人際、符合作息與價值觀、通勤與生活壓力是否可承受。'
      ]
    });
  };

  /* 💖 性傾向（沿用原版「分析結論」寫法，依命盤配偶星推導） */
  DIMS.orientation = d => {
    const { F, yi, P, fp } = ctx(d), sp = P('夫妻'), male = F.male;
    const zheng = male ? '正財' : '正官', pian = male ? '偏財' : '偏官', spouseP = male ? '妻宮' : '夫宮';
    const vis = ['year', 'month', 'hour'].filter(k => fp[k].god === zheng).map(k => K.PCN[k] + '干');
    const hid = ['year', 'month', 'day', 'hour'].filter(k => fp[k].hidden.some(h => h.god === zheng)).map(k => K.PCN[k] + '支' + fp[k].branch);
    const dayHidZ = fp.day.hidden.some(h => h.god === zheng), dayHidP = fp.day.hidden.some(h => h.god === pian);
    const hasPianVis = ['year', 'month', 'hour'].some(k => fp[k].god === pian);
    const spPct = F.gp(F.sg);
    let concl;
    if (vis.length || dayHidZ) {
      concl = `${vis.length ? '天干透出' + zheng + '（' + vis.join('、') + '）' : zheng + '藏於' + hid.join('、')}${dayHidZ ? '，地支' + fp.day.branch + '（' + spouseP + '）藏' + zheng : ''}，陰陽五行相配順暢，情感吸引力呈現傳統且穩健之異性戀傾向。`;
    } else if (hasPianVis || dayHidP) {
      concl = `配偶星以${pian}為主${dayHidP ? '，並坐於' + spouseP + fp.day.branch : ''}，情感投射強烈而自主，偏好有個性、有張力的對象；吸引力模式仍以異性戀為主，對關係的形式不拘泥傳統角色分工。`;
    } else if (spPct < 8) {
      concl = `命局配偶星（${F.sg}）不顯（僅占 ${spPct}%），情感投射不以傳統配偶角色為重心，偏重精神契合與相處默契，吸引力模式仍以異性戀為主，屬較被動、慢熟而含蓄的情感表達${sp.huaTxt.some(t => /忌/.test(t)) ? '；夫妻宮見化忌，感情中易多慮，宜多溝通' : ''}。`;
    } else {
      concl = `${F.sg}藏而不透（占 ${spPct}%），情感吸引力以異性戀為主且較為含蓄，需經時間相處才會明朗，屬慢熟、重安全感的情感投射。`;
    }
    return block({
      title: '💖 性傾向與情感吸引模型 (Sexual Orientation & Romantic Identity)', tags: [['psych', '心理學 金賽光譜'], ['bazi', '八字 財星/官殺投射'], ['ziwei', '紫微 夫妻宮'], ['yijing', '周易 咸卦/恆卦']],
      S: [['bazi', (vis.length || dayHidZ) ? 1 : 0], ['ziwei', sp.v], ['yijing', yi.v]],
      items: [
        `<strong>分析結論：</strong>${concl}`,
        `<strong>八字配偶宮：</strong>日支 ${fp.day.branch}（${spouseP}），藏干十神 ${fp.day.hidden.map(h => h.god).join('、')}；配偶星（${F.sg}）合會後占 ${spPct}%。`,
        `<strong>紫微夫妻宮：</strong>${sp.line}${sp.text ? '——' + sp.text : ''}${sp.huaTxt.length ? '；' + sp.huaTxt.join('、') : ''}。`,
        `<strong>周易與心理學：</strong>周易咸恆之義：感情重「相感、恆久」，互卦${bn(yi.hu)}；心理學金賽光譜視性吸引為連續光譜，上述為命理象徵的情感投射描述。`
      ]
    });
  };

  /* 👴 長輩緣 */
  DIMS.elders = d => {
    const { F, yi, P, fp, traitS, lv, gp } = ctx(d), par = P('父母'), mp = fp.month, yin = gp('印星');
    return block({
      title: '👴 長輩緣與貴人庇蔭運 (Relationships with Elders & Mentors)', tags: [['bazi', '八字 印星/月柱'], ['ziwei', '紫微 父母宮'], ['yijing', '周易 體卦'], ['psych', '心理學 親和性']],
      S: [['bazi', yin >= 25 ? 1 : yin < 10 ? -1 : 0], ['ziwei', par.v], ['yijing', sgn(yi.relVal)], ['psych', traitS('A')]],
      items: [
        `<strong>長輩緣分：</strong>月柱 ${mp.gz}（${mp.god}，代表父母與長輩宮），印星占 ${yin}%，${yin >= 25 ? '印星較旺，傳統上師長與前輩的照顧、學習資源較多' : yin < 10 ? '印星偏弱，貴人需主動經營' : '印星一般，貴人緣中等，主動請益更能得助'}${F.an.yong.group === '印星' ? '；且印星正是用神，長輩與學習資源對你特別有幫助' : ''}。`,
        `<strong>紫微父母宮：</strong>${par.line}${par.text ? '——' + par.text : ''}${par.huaTxt.length ? '；' + par.huaTxt.join('、') : ''}${par.goods.length ? '；吉星：' + par.goods.join('、') : ''}${par.bads.length ? '；煞星：' + par.bads.join('、') : ''}。`,
        `<strong>周易：</strong>體卦「${yi.ti}」（${YI.TRI_TEXT[yi.ti]}）、用卦「${yi.yong}」，${yi.relText}。`,
        `<strong>心理學：</strong>親和性傾向${PA.LV_NAME[lv('A')]}；主動請教、定期回報進度、表達感謝，是最有效的「貴人經營」方式。`
      ]
    });
  };

  /* 🌸 桃花 */
  DIMS.romance = d => {
    const { F, yi, P, fp, traitS, lv, gp } = ctx(d);
    const tao = ['貪狼', '廉貞'].filter(s => F.zw.cells.some(c => c.main.some(m => m.n === s) && ['命宮', '夫妻', '交友'].includes(c.name)));
    const zheng = F.male ? '正財' : '正官', zhengOn = ['year', 'month', 'hour'].some(k => fp[k].god === zheng) || fp.day.hidden.some(h => h.god === zheng);
    const items = [
      `<strong>桃花類型：</strong>${F.xianchi ? '八字四柱見咸池（桃花），人緣與異性緣較明顯，也提醒要拿捏分寸；' : '八字未見明顯咸池，人緣靠真誠與互動累積；'}${zhengOn ? zheng + '現於天干或坐配偶宮，屬正緣型桃花、感情較專一。' : F.sg + '占 ' + gp(F.sg) + '%，' + (gp(F.sg) >= 15 ? '配偶星有力，異性緣不差。' : '配偶星較弱，感情宜主動經營。')}`,
      `<strong>紫微：</strong>${tao.length ? tao.join('、') + '落於命宮／夫妻宮／交友宮，傳統視為魅力與社交活躍的象徵。' : '命宮、夫妻宮、交友宮未見貪狼、廉貞，魅力型態偏穩健。'}${d.age >= 18 ? '夫妻宮：' + P('夫妻').list + '。' : '交友宮：' + P('交友').list + '。'}`,
      `<strong>周易互卦${bn(yi.hu)}：</strong>象徵感情的過程面；本卦${bn(yi.ben)}。`,
      `<strong>心理學：</strong>外向性傾向${PA.LV_NAME[lv('E')]}、親和性傾向${PA.LV_NAME[lv('A')]}；真誠、尊重與穩定的情緒比外表更能長期維繫好感。`
    ];
    if (d.age < 18) items.push('<strong>年齡提醒：</strong>現階段把重心放在友誼、自我探索與學習，感情不必著急；尊重彼此界線、懂得說「不」同樣重要。');
    return block({
      title: '🌸 桃花運與異性魅力 (Romantic Fortune & Attraction)', tags: [['bazi', '八字 咸池/配偶星'], ['ziwei', '紫微 夫妻/交友宮'], ['yijing', '周易 互卦'], ['psych', '心理學 人際吸引']],
      S: [['bazi', F.xianchi || zhengOn ? 1 : 0], ['ziwei', d.age >= 18 ? P('夫妻').v : P('交友').v], ['yijing', sgn(YI.INFO[yi.hu][1])], ['psych', traitS('E')]], items
    });
  };

  /* 💍 另一半 */
  DIMS.partner = d => {
    const { F, yi, P, fp } = ctx(d), sp = P('夫妻'), sign = d.sunSign, comp = K.compatSigns(sign);
    const items = [];
    items.push(`<strong>紫微夫妻宮：</strong>${sp.line}${sp.text ? '——傳統描述的伴侶特質：' + sp.text : ''}${sp.goods.length ? '；吉星：' + sp.goods.join('、') : ''}${sp.bads.length ? '；煞星：' + sp.bads.join('、') : ''}`);
    items.push(`<strong>八字配偶宮：</strong>日支 ${fp.day.branch}（${F.male ? '妻宮' : '夫宮'}），藏干十神 ${fp.day.hidden.map(h => h.god).join('、')}；日支與日主的十二運為「${fp.day.stage}」。`);
    if (d.age < 18) items.push(`<strong>友誼與相處（成年前以友誼為主）：</strong>紫微交友宮 ${P('交友').line}。`);
    items.push(`<strong>理想星座契合：</strong>太陽${sign}（${K.SIGN_ELEM[sign]}象），傳統上較易合拍：${comp.join('、')}。研究並不支持用星座預測關係品質，價值觀與溝通方式更關鍵。`);
    items.push(`<strong>周易：</strong>互卦${bn(yi.hu)}。`);
    return block({
      title: '💍 另一半個性與理想星座特質 (Partner Traits & Zodiac Compatibility)', tags: [['bazi', '八字 日支配偶宮'], ['ziwei', '紫微 夫妻宮'], ['astro', '占星 太陽星座'], ['yijing', '周易 互卦']],
      S: [['bazi', 0], ['ziwei', sp.v], ['astro', 0], ['yijing', sgn(YI.INFO[yi.hu][1])]], items
    });
  };

  /* 🧠 身心 */
  DIMS.physical_mental = d => {
    const { F, yi, P, lv, traitS, an } = ctx(d), ji = P('疾厄'), fu = P('福德');
    const el = Object.values(an.pctAdj), spread = Math.max(...el) - Math.min(...el);
    return block({
      title: '🧠 身心狀態與心理健康 (Physical & Mental State)', tags: [['psych', '心理學 情緒穩定'], ['bazi', '八字 五行'], ['ziwei', '紫微 疾厄/福德宮'], ['yijing', '周易 體用五行']],
      S: [['bazi', spread < 25 ? 1 : spread >= 35 ? -1 : 0], ['ziwei', pm((ji.score + fu.score - 100) / 10)], ['yijing', sgn(yi.relVal)], ['psych', traitS('ES')]],
      items: [
        `<strong>心理調適：</strong>情緒穩定性傾向${PA.LV_NAME[lv('ES')]}。${PA.PSY_TEXT.ES[lv('ES')]}規律睡眠、運動與曬太陽是最穩定的情緒基礎。`,
        `<strong>八字五行：</strong>${Data.ELEMS.map(e => `${e}${an.pctAdj[e]}%`).join('、')}（${spread >= 25 ? '落差 ' + spread + '%，五行偏枯' : '落差 ' + spread + '%，尚稱均衡'}）；日主${an.strength.level}。命局忌${an.badText}，宜留意 ${F.life.body}（傳統五行對應臟腑，僅作定期留意的提醒，並非診斷）。`,
        `<strong>紫微：</strong>疾厄宮 ${ji.line}${ji.text ? '——' + ji.text : ''}${ji.bads.length ? '；煞星：' + ji.bads.join('、') : ''}；福德宮 ${fu.list}。`,
        `<strong>周易：</strong>體卦「${yi.ti}」屬${yi.tiEl}，${yi.relText}。`,
        `<strong>求助：</strong>持續兩週以上的情緒低落、失眠或食慾改變，請找${F.adult ? '' : '學校輔導室、'}心理師或醫師評估。`
      ]
    });
  };

  /* 👤 個性 */
  DIMS.personality = d => {
    const { F, yi, P, T, lv, an } = ctx(d), m = P('命宮');
    const bars = ['E', 'A', 'C', 'ES', 'O'].map(k => `<div class="trait-row"><span class="trait-name">${TRN[k]}</span><div class="bar"><div class="bar-fill" style="width:${(T[k] / 7 * 100).toFixed(0)}%"></div></div><span class="trait-val">${PA.LV_NAME[lv(k)]}</span></div>`).join('');
    return block({
      title: '👤 個性特質與認知模式 (Personality & Cognitive Mode)', tags: [['psych', '心理學 大五人格'], ['ziwei', '紫微 命宮星曜'], ['bazi', '八字 十神性情'], ['astro', '占星 太陽星座'], ['yijing', '周易 體卦']],
      S: [['psych', 0], ['ziwei', m.v], ['bazi', /中和/.test(an.strength.level) ? 1 : 0], ['yijing', sgn(yi.relVal)], ['astro', 0]],
      custom: bars + '<p class="note">以下人格傾向是由命宮主星、十神與五行「象徵推估」，不是量表測量結果；描述與你的經驗吻合才有參考價值。</p>',
      items: [
        `<strong>大五人格特質（推估）：</strong>${['E', 'A', 'C', 'ES', 'O'].map(k => `${TRN[k]}${PA.LV_NAME[lv(k)]}`).join('、')}。`,
        `<strong>紫微命宮：</strong>${m.line}${m.text ? '——' + m.text : ''}`,
        `<strong>八字日主：</strong>${F.dmS}${F.dmE}（${PA.Analysis.GAN_DESC[F.dmS]}）日主${an.strength.level}；十神以 ${F.groups.slice(0, 2).map(x => x[0] + ' ' + x[1] + '%').join('、')} 較突出，局成${an.pattern.name}。`,
        `<strong>周易：</strong>體卦「${yi.ti}」象徵自我：${YI.TRI_TEXT[yi.ti]}。太陽星座${d.sunSign}：${K.SIGN_TEXT[d.sunSign]}。`
      ]
    });
  };

  /* ⚡ 習慣 */
  DIMS.habits = d => {
    const { F, yi, P, lv, traitS } = ctx(d), ji = F.hua['忌'], bads = P('命宮').bads;
    return block({
      title: '⚡ 行為習慣與定式 (Habits & Behavioral Patterns)', tags: [['psych', '心理學 習慣迴路'], ['ziwei', '紫微 化忌/煞星定式'], ['yijing', '周易 互卦']],
      S: [['psych', traitS('C')], ['ziwei', P('命宮').v], ['yijing', sgn(YI.INFO[yi.hu][1])]],
      items: [
        `<strong>習慣定式：</strong>紫微生年化忌（${ji.star}）落在「${ji.palace}宮」，${K.HUAJI[ji.star] ? `容易在「${K.HUAJI[ji.star]}」上卡關，` : ''}宜養成檢核清單與二次核對的習慣。${bads.length ? '命宮見煞星 ' + bads.join('、') + '，情緒或行動上易有急、躁、反覆的定式，遇事先停一下再決定。' : ''}`,
        `<strong>習慣迴路：</strong>提示 → 行動 → 獎勵。把想養成的行為綁在固定提示上（如${F.adult ? '早餐後先處理最重要的一件事 15 分鐘' : '放學回家先複習 15 分鐘'}），完成後給自己小獎勵。盡責性傾向${PA.LV_NAME[lv('C')]}：${PA.PSY_TEXT.C[lv('C')]}`,
        `<strong>周易互卦${bn(yi.hu)}：</strong>代表行為的過程與潛在慣性，提醒自己「${YI.INFO[yi.hu][0]}」。`,
        (F.adult ? '<strong>重要場合準備：</strong>重要簽約、面談或報告前，先列檢核清單、分段準備並做呼吸放鬆，可降低緊張與疏漏。' : '<strong>考前準備：</strong>情境依賴複誦、分散複習與考前呼吸放鬆，可降低緊張與粗心。')
      ]
    });
  };

  /* 🎨 嗜好 */
  DIMS.hobbies = d => {
    const { F, yi, P, lv, gp } = ctx(d), fu = P('福德');
    const sug = [];
    if (lv('O') === 'high') sug.push('閱讀、科學探索、藝術創作、旅行');
    if (lv('E') === 'high') sug.push('團體運動、社團、表演與活動籌辦');
    if (lv('E') === 'low') sug.push('閱讀、寫作、單人運動、手作與音樂');
    if (lv('C') === 'high') sug.push('棋藝、程式、模型等需持續精進的技藝');
    if (lv('A') === 'high') sug.push('志工、烘焙、照顧動物與陪伴型活動');
    return block({
      title: '🎨 嗜好興趣與享受 (Hobbies & Interests)', tags: [['ziwei', '紫微 福德宮'], ['bazi', '八字 食傷'], ['yijing', '周易 用卦'], ['astro', '占星 太陽星座']],
      S: [['ziwei', fu.v], ['bazi', gp('食傷') >= 25 ? 1 : 0], ['yijing', sgn(YI.INFO[yi.ben][1])], ['astro', 0]],
      items: [
        `<strong>精神享樂：</strong>紫微福德宮 ${fu.line}${fu.text ? '——' + fu.text : ''}。`,
        `<strong>八字：</strong>食傷占 ${gp('食傷')}%，${gp('食傷') >= 25 ? '表達與創作慾望較強，適合以作品抒發' : '創作表達屬一般，可從模仿與練習中培養'}；命局喜${F.an.favText}，亦可親近 ${F.life.color} 等色彩與相應的環境。`,
        sug.length ? `<strong>依人格傾向的嘗試方向：</strong>${sug.join('；')}。` : '<strong>建議：</strong>每學期試一個新活動，留下讓你「忘記時間」的那個。',
        `<strong>周易用卦「${yi.yong}」：</strong>${YI.TRI_TEXT[yi.yong]}，提示享受的方式偏向此類型活動。`
      ]
    });
  };

  /* 🌟 氣質 */
  DIMS.features = d => {
    const { F, yi, P, lv, fp } = ctx(d), m = P('命宮');
    return block({
      title: '🌟 外在氣質與風采 (Personal Features & Persona)', tags: [['ziwei', '紫微 命宮氣場'], ['bazi', '八字 日主五行'], ['astro', '占星 太陽星座'], ['yijing', '周易 上下卦']],
      S: [['ziwei', m.v], ['bazi', 0], ['astro', 0], ['yijing', sgn(YI.INFO[yi.ben][1])]],
      items: [
        `<strong>氣質風采：</strong>紫微命宮 ${m.line}${m.text ? '——給人的印象：' + m.text : ''}。`,
        `<strong>八字日主五行（${F.dmE}）：</strong>傳統形容 ${K.EL_LOOK[F.dmE]}；年柱納音「${fp.year.nayin}」。`,
        `<strong>太陽星座（${d.sunSign}）：</strong>${K.SIGN_TEXT[d.sunSign]}。`,
        `<strong>周易：</strong>上卦「${yi.upper}」（${YI.TRI_TEXT[yi.upper]}）、下卦「${yi.lower}」（${YI.TRI_TEXT[yi.lower]}），本卦${bn(yi.ben)}。第一印象主要來自眼神、語速與姿態，這些都可以練習。`
      ]
    });
  };

  /* 🌀 前世因果 */
  DIMS.past_life = d => {
    const { F, yi, P, fp } = ctx(d), fu = P('福德'), tz = P('田宅'), nian = fp.year, ji = F.hua['忌'];
    return block({
      title: '🌀 前世因果與業力 (Past Life & Spiritual Karma)', tags: [['ziwei', '紫微 福德/田宅'], ['bazi', '八字 年柱'], ['yijing', '周易 互卦']],
      S: [['ziwei', pm((fu.score + tz.score - 100) / 10)], ['bazi', 0], ['yijing', sgn(YI.INFO[yi.hu][1])]],
      items: [
        '<strong>說明：</strong>前世與業力無法驗證，本程式以命盤的象徵位置，整理「家族傳承與內在課題」供自我探索。',
        `<strong>因果祖德：</strong>紫微福德宮（先天福分）${fu.line}${fu.text ? '——' + fu.text : ''}；田宅宮（家庭根基）${tz.line}。八字年柱 ${nian.gz}（${nian.god}，納音${nian.nayin}）象徵祖上與早年環境。`,
        `<strong>反覆課題：</strong>${ji.star}化忌入${ji.palace}宮，象徵需要學習放下或調整的主題（${K.PAL_DOMAIN[ji.palace]}）；周易互卦${bn(yi.hu)}為潛在的因由。`,
        '<strong>心理學對應：</strong>早年經驗與家庭互動會形成反覆出現的信念與行為「劇本」；覺察劇本、重新選擇回應，就是最實際的「轉化」。'
      ]
    });
  };

  /* 🚀 今生使命 */
  DIMS.present_life = d => {
    const { F, yi, P, lv, an } = ctx(d), guan = P('官祿'), lu = F.hua['祿'], top = F.fgroups[0];
    const zjob = ['命宮', '官祿', '財帛'].map(n => P(n)).filter(p => p.main.length).slice(0, 2).map(p => `${TL.pn(p.name)}${p.main.map(x => x.n).join('、')}（${p.main.map(x => PA.K.STAR_JOB[x.n]).join('；')}）`);
    return block({
      title: '🚀 今生使命與發揮 (Present Life Mission & Realization)', tags: [['bazi', '八字 天賦發揮'], ['ziwei', '紫微 官祿/化祿'], ['yijing', '周易 變卦'], ['astro', '占星 太陽星座']],
      S: [['bazi', 1], ['ziwei', guan.v], ['yijing', sgn(YI.INFO[yi.bian][1])], ['astro', 0]],
      items: [
        `<strong>今生使命：</strong>八字日主 ${F.dmS}${F.dmE}（${an.strength.level}），局成${an.pattern.name}，以${an.yong.group}為用神；十神中以 ${top}（占 ${F.gp(top)}%，${F.gtag(top)}，${K.GROUP_TEXT[top]}）最能助力，可朝 ${K.GROUP_FIELDS[top]} 發揮。`,
        zjob.length ? `<strong>紫微星曜取向：</strong>${zjob.join('；')}。` : '',
        `<strong>紫微：</strong>官祿宮 ${guan.list}；生年化祿入${lu.palace}宮（${lu.star}）——${K.PAL_DOMAIN[lu.palace]}是較能順勢發展的領域。`,
        `<strong>周易變卦${bn(yi.bian)}：</strong>指向的成長方向。`,
        `<strong>實作練習：</strong>寫下三個最在意的價值，觀察什麼活動讓你忘記時間、又讓他人受益；使命是在行動中逐步清晰的。開放性傾向${PA.LV_NAME[lv('O')]}。`
      ]
    });
  };

  /* 📋 全面建議 */
  DIMS.recommendations = d => {
    const { F, yi, P, T, an, fp } = ctx(d), kp = F.kp;
    const lowK = ['E', 'A', 'C', 'ES', 'O'].sort((a, c) => T[a] - T[c])[0];
    const fut = TL.futureHTML(d, F);
    const yrs = ws => ws.map(w => `${w.rows[0].Y}–${w.rows[w.rows.length - 1].Y}`).join('、');
    return block({
      title: '📋 全面建議與跨工具統整分析 (Comprehensive Recommendations & Blueprint)', tags: ['bazi', 'ziwei', 'astro', 'yijing', 'yehe', 'zhuge', 'psych'],
      S: [['bazi', an.strength.score >= 45 && an.strength.score <= 65 ? 1 : 0], ['ziwei', P('命宮').v], ['yijing', yi.v], ['zhuge', d.birthLiu.v], ['psych', 0]],
      items: [
        `<strong>【八字命理統整】</strong>${an.summary}宜朝 ${F.life.job} 發展，吉利方位 ${F.life.dir}。`,
        `<strong>【紫微斗數統整】</strong>命宮 ${P('命宮').list}；生年化祿入${F.hua['祿'].palace}宮是助力，化忌（${F.hua['忌'].star}）入${F.hua['忌'].palace}宮需預先防呆。`,
        `<strong>【西洋占星統整】</strong>太陽${d.sunSign}（${K.SIGN_TEXT[d.sunSign]}）；上升與月亮星座需精確星曆，本程式未計算。`,
        `<strong>【周易與諸葛預知術統整】</strong>梅花易數本卦${bn(yi.ben)}→變卦${bn(yi.bian)}，${yi.relText}；馬前課本命「${d.birthLiu.name}」、今日「${d.todayLiu.name}」。順應「吉凶動靜，各有其時」，順遂之年勇於開創，變動之年韜光養晦。未來較順遂的區間：${yrs(fut.bestW)}；較需調適的區間：${yrs(fut.worstW)}。`,
        `<strong>【野鶴老人避險法門統整】</strong>${kp.falls.length || kp.po.length ? '命盤地支' + (kp.falls.length ? '落空：' + kp.falls.join('、') : '') + (kp.po.length ? ' 月破：' + kp.po.join('、') : '') + '，宜避空避破、不冒進。' : '命盤地支未見空、破。'}大運交接年與沖年多做健檢與風險控管，並多關心長輩健康。`,
        `<strong>【心理學實務統整】</strong>由命盤推估，${TRN[lowK]}相對較需要支持，可訂定小目標；運用「習慣迴路」克服拖延，${F.adult ? '重要場合前先列檢核清單並做呼吸降焦' : '考前實施情境依賴複誦與呼吸降焦'}。長期情緒低落或睡眠${F.adult ? '、工作' : '、學習'}受影響時，請找${F.adult ? '' : '學校輔導室、'}心理師或醫師。`
      ]
    });
  };

  // 八字與紫微並重：以兩者各自指數取代原本的訊號計數星等，並顯示相似度
  Object.keys(DIMS).forEach(k => {
    const orig = DIMS[k];
    DIMS[k] = d => {
      const html = orig(d), v = PA.Dual.dual(ctx(d).F, d, k);
      return v ? html.replace(/<div class="star-box">(?:[\s\S]*?<\/div>){4}/, PA.Dual.box(v)) : html;
    };
  });
  PA.DIMS = DIMS;
})(typeof window !== 'undefined' ? window : globalThis);
