/* facts.js — 把排盤結果（fp 八字、an 分析、zw 紫微）整理成各維度共用的「事實」，並提供 HTML 輔助函式 */
(function (g) {
  const PA = g.PA = g.PA || {};
  const { Data, Analysis, Ziwei } = PA;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ul = items => `<ul class="analysis-list">${items.filter(Boolean).map(i => `<li>${i}</li>`).join('')}</ul>`;
  const starTxt = s => s.n + (s.br ? `(${s.br})` : '') + (s.hua ? `化${s.hua}` : '');
  const starList = arr => arr.map(starTxt).join('、') || '無主星';

  const GROUP_TEXT = {
    比劫: '自我意識、獨立與同儕競合', 食傷: '表達、創意與不受拘束的傾向', 財星: '務實、資源管理與現實感',
    官殺: '規範、責任感與外在壓力', 印星: '學習、思考與被保護、被滋養的感受'
  };
  const GROUP_FIELDS = {
    比劫: '自主創業、運動競技、合夥與團隊型工作', 食傷: '創作設計、媒體傳播、技術研發、教學表達',
    財星: '商業貿易、財務金融、行銷與資源整合', 官殺: '公職法政、管理、紀律性與高責任職務',
    印星: '教育研究、文化出版、醫療與專業證照型工作'
  };
  const EL_LOOK = { 木: '身形偏修長、氣質清秀', 火: '神采明亮、氣色紅潤、表情豐富', 土: '厚實穩重、給人可靠感', 金: '輪廓分明、氣質端正俐落', 水: '圓潤靈動、眼神有神' };
  const PAL_DOMAIN = {
    命宮: '自我發展', 兄弟: '手足與同儕', 夫妻: '親密關係', 子女: '創造力與晚輩', 財帛: '財務與資源', 疾厄: '身心健康',
    遷移: '外出與環境適應', 交友: '朋友與人脈', 官祿: '學業與事業', 田宅: '居家與資產', 福德: '精神享受與內在平靜', 父母: '長輩與師長緣'
  };
  const HUAJI = {
    文昌: '細節與核對（粗心、考試與文書失誤）', 文曲: '細節與表達（口誤、粗心）', 天機: '思慮過多、反覆推敲', 太陰: '情緒起伏與敏感',
    巨門: '口舌誤會與疑慮', 廉貞: '情感糾結與自我要求', 武曲: '財務壓力與固執', 太陽: '勞心付出卻不被看見', 天同: '依賴、拖延與逃避', 貪狼: '慾望與分心',
    紫微: '自尊與掌控', 天梁: '操心與說教', 破軍: '動盪與破舊立新', 左輔: '助力不穩', 右弼: '助力不穩'
  };
  const SIGN_ELEM = { 白羊座: '火', 獅子座: '火', 射手座: '火', 雙子座: '風', 天秤座: '風', 水瓶座: '風', 金牛座: '土', 處女座: '土', 摩羯座: '土', 巨蟹座: '水', 天蠍座: '水', 雙魚座: '水' };
  const SIGN_TEXT = {
    白羊座: '直接、有衝勁', 金牛座: '穩定、重感官與安全感', 雙子座: '好奇、善溝通', 巨蟹座: '敏感、重情感連結',
    獅子座: '自信、愛表現', 處女座: '細心、重條理', 天秤座: '重和諧與公平', 天蠍座: '深刻、專注、重隱私',
    射手座: '樂觀、愛探索', 摩羯座: '務實、有責任感', 水瓶座: '獨立、重理念', 雙魚座: '富同理心、想像力豐富'
  };
  const SIGNS = ['白羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'];
  const ELEM_PAIR = { 火: ['火', '風'], 風: ['風', '火'], 土: ['土', '水'], 水: ['水', '土'] };
  const compatSigns = sign => SIGNS.filter(s => ELEM_PAIR[SIGN_ELEM[sign]].includes(SIGN_ELEM[s]) && s !== sign);
  const sunSignOf = ms => SIGNS[Math.floor(PA.Astro.sunLongitude(PA.Astro.jdFromMs(ms)) / 30)];

  const STAR_JOB = {
    紫微: '領導管理、公職主管、品牌與高階決策', 天機: '企劃顧問、研究分析、資訊技術、教學', 太陽: '公職、教育傳播、公益服務、對外公關',
    武曲: '金融財會、工程技術、投資與執行管理', 天同: '服務福利、餐飲設計、藝術療癒、人際協調', 廉貞: '法政、公關、技術研發、人事與監督',
    天府: '財務行政、金融保險、資產管理', 太陰: '財會文書、房地產、設計美學、細膩型服務', 貪狼: '業務行銷、演藝娛樂、公關社交、多元創意',
    巨門: '教學律師、傳播口才、研究與分析', 天相: '行政秘書、人事法務、輔佐與協調', 天梁: '醫療照護、教育輔導、顧問與公益',
    七殺: '開創型事業、軍警、工程與外科', 破軍: '創業開拓、變革型工作、重整與改造'
  };
  const KEYS = ['year', 'month', 'day', 'hour'];
  const PCN = { year: '年', month: '月', day: '日', hour: '時' };

  function facts(d) {
    const { fp, an, zw } = d;
    const gpct = an.groupPct, gp = k => gpct[k] || 0;
    const groups = Object.entries(gpct).sort((a, c) => c[1] - a[1]);
    const life = Analysis.lifestyle(fp, an);
    // 十神群組「喜忌加權」：同樣占比，用神／喜神為正、忌神為負（與參考程式 groupScore 相同算法）
    const gval = k => an.val[Data.elemOfGroup(an.dmE, k)] || 0;
    // 喜忌影響依該十神在命局中的「實際占比」放大或縮小：喜用但幾乎不存在（如 0%）不算助力，忌神不存在也不算壓力
    const gsc = k => Math.max(10, Math.min(95, Math.round(50 + 12 * gval(k) * Math.min(1.2, gp(k) / 15) + (gp(k) < 6 ? -6 : gp(k) >= 15 ? 4 : 0))));
    const eff = k => (gsc(k) - 50) / 10;
    const gtag = k => gval(k) > 0 ? '喜用' : gval(k) < 0 ? '忌神' : '中性';
    const fgroups = Object.keys(gpct).filter(k => gval(k) > 0 && gp(k) >= 8).sort((a, c) => gsc(c) - gsc(a) || gp(c) - gp(a));
    if (!fgroups.length) fgroups.push(groups[0][0]);
    const male = d.gender === '男';

    const hua = {};
    zw.cells.forEach(c => c.main.concat(c.minor).forEach(s => { if (s.hua) hua[s.hua] = { palace: c.name, star: s.n }; }));

    const P = name => {
      const c = zw.cells.find(x => x.name === name);
      let main = c.main, borrowed = false;
      if (!main.length) { main = zw.cells[(c.branchIdx + 6) % 12].main; borrowed = true; }
      const score = PA.palaceScore(zw, c.branchIdx);
      const goods = c.minor.filter(s => s.kind === 'good').map(s => s.n);
      const bads = c.minor.filter(s => s.kind === 'bad').map(s => s.n);
      const huaTxt = c.main.concat(c.minor).filter(s => s.hua).map(s => `${s.n}化${s.hua}`);
      const text = main.slice(0, 2).map(s => `${s.n}：${PA.STAR_TEXT[s.n]}`).join('；');
      const list = starList(main);
      return {
        c, name, main, borrowed, score, v: score >= 58 ? 1 : score <= 42 ? -1 : 0, goods, bads, huaTxt, list, text,
        minorTxt: c.minor.filter(s => s.kind !== 'misc').map(starTxt).join('、'),
        line: `${name}（${c.gz}）${borrowed ? '無主星，借對宮：' : ''}${list}`
      };
    };

    // 神煞（粗略）：咸池（桃花）、華蓋、羊刃
    const sanhe = br => ({ 0: 0, 4: 0, 8: 0, 2: 1, 6: 1, 10: 1, 5: 2, 9: 2, 1: 2, 11: 3, 3: 3, 7: 3 }[br]);
    const brs = KEYS.map(k => fp[k].branchIdx), src = [fp.year.branchIdx, fp.day.branchIdx];
    const xianchi = src.some(s => brs.includes([9, 3, 6, 0][sanhe(s)]));
    const huagai = src.some(s => brs.includes([4, 10, 1, 7][sanhe(s)]));
    const yangren = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 }[fp.day.stemIdx];
    const hasYangren = yangren !== undefined && brs.includes(yangren);

    // 空亡與月破（野鶴老人重視的「空、破」）
    const kwD = fp.kongwang.day, kwY = fp.kongwang.year, poB = (fp.month.branchIdx + 6) % 12;
    const kp = {
      kongNames: kwD.map(i => Data.BRANCHES[i]), poBranch: Data.BRANCHES[poB],
      falls: KEYS.filter(k => k !== 'day' && kwD.includes(fp[k].branchIdx)).map(k => `${PCN[k]}柱（${fp[k].branch}，日空）`)
        .concat(KEYS.filter(k => k !== 'year' && kwY.includes(fp[k].branchIdx)).map(k => `${PCN[k]}柱（${fp[k].branch}，年空）`)),
      po: KEYS.filter(k => k !== 'month' && fp[k].branchIdx === poB).map(k => `${PCN[k]}柱（${fp[k].branch}）`)
    };

    const lun = fp.lunar, hb = fp.time.hourBranch;
    const yi = PA.yi.meihua({ yb: ((lun.year - 4) % 12 + 12) % 12, month: lun.month, day: lun.day, hb });
    const liu = PA.yi.xiaoLiuRen(lun.month, lun.day, hb);
    const sg = male ? '財星' : '官殺';
    return {
      d, fp, an, zw, male, adult: d.age >= 18, dmS: an.dmS, dmE: an.dmE, gp, groups, gval, gsc, eff, gtag, fgroups, life, hua, P, sg,
      xianchi, huagai, hasYangren, kp, yi, liu, fav: an.favElems, bad: an.badElems,
      fav2: an.favElems.join('、'), bad2: an.badElems.join('、'), dirs: life.dir
    };
  }

  Object.assign(PA, {
    H: { esc, ul, starList, starTxt },
    K: { STAR_JOB, GROUP_TEXT, GROUP_FIELDS, EL_LOOK, PAL_DOMAIN, HUAJI, SIGN_ELEM, SIGN_TEXT, SIGNS, compatSigns, sunSignOf, KEYS, PCN },
    facts
  });
})(typeof window !== 'undefined' ? window : globalThis);
