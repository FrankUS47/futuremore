/* dual.js — 八字與紫微並重：每個維度各算一個 0–100 指數（50 為中性、越高越吉），
 * 兩者各占 50% 得綜合分，並顯示兩者相似度（差距越小越一致）。指數為啟發式評分，僅供參考。 */
(function (g) {
  const PA = g.PA = g.PA || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const idxOfGrade = gr => clamp(Math.round((gr.score + 2) / 6 * 100), 5, 95);
  const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 50;

  // 各維度：返回 {b, z, bn, zn}（八字指數、紫微指數與依據說明）
  function scores(F, d) {
    const { an, fp, zw } = F, P = n => F.P(n).score, gt = F.gtag, gs = F.gsc;
    const spread = Math.max(...Object.values(an.pctAdj)) - Math.min(...Object.values(an.pctAdj));
    const level = an.strength.level;
    const patB = clamp(Math.round(55 + (F.gp(an.yong.group) - 12) * 1.2 + (/極/.test(level) ? -10 : 0)), 15, 90);
    const healthB = clamp(Math.round(100 - spread * 1.1 + (/中和/.test(level) ? 8 : /極/.test(level) ? -8 : 0)), 15, 90);
    const sg = F.sg, mid = (...a) => avg(a);
    const yrs = []; for (let Y = d.now.y; Y < d.now.y + 10; Y++) yrs.push(PA.TL.yearInfo(d, Y));
    const fortB = avg(yrs.map(r => idxOfGrade(r.g) * 0.5 + (r.gD ? idxOfGrade(r.gD) : 50) * 0.5));
    const fortZ = avg(yrs.map(r => r.zs * 0.5 + r.dzs * 0.5));
    const risk = clamp(75 - (F.hasYangren ? 15 : 0) - (F.kp.falls.length + F.kp.po.length) * 8 - (spread >= 25 ? 10 : 0), 15, 90);
    const spirit = clamp(50 + (F.huagai ? 12 : 0) + (gs('印星') - 50) * 0.4, 15, 90);
    const nameOf = n => F.P(n).list;
    const m = {
      top3: { b: patB, z: P('命宮'), bn: `用神${an.yong.group}占 ${F.gp(an.yong.group)}%，日主${level}`, zn: '命宮三方四正' },
      future_timing: { b: fortB, z: fortZ, bn: '未來十年流年與大運吉凶平均', zn: '未來十年流年命宮與大限宮位平均' },
      calamity_warning: { b: risk, z: mid(P('疾厄'), P('父母')), bn: `羊刃${F.hasYangren ? '有' : '無'}、空破${F.kp.falls.length + F.kp.po.length}處、五行落差${spread}%`, zn: '疾厄宮與父母宮三方四正' },
      religion: { b: spirit, z: P('福德'), bn: `華蓋${F.huagai ? '有' : '無'}、印星${gt('印星')}`, zn: '福德宮三方四正' },
      career_job: { b: mid(gs('官殺'), gs(F.fgroups[0])), z: mid(P('官祿'), P('財帛')), bn: `官殺${gt('官殺')}、${F.fgroups[0]}${gt(F.fgroups[0])}`, zn: '官祿宮與財帛宮' },
      location: { b: patB, z: mid(P('遷移'), P('命宮')), bn: '用神旺衰與格局', zn: '遷移宮與命宮' },
      orientation: { b: gs(sg), z: P('夫妻'), bn: `配偶星（${sg}）${gt(sg)}`, zn: '夫妻宮' },
      elders: { b: gs('印星'), z: P('父母'), bn: `印星${gt('印星')}、占 ${F.gp('印星')}%`, zn: '父母宮' },
      romance: { b: mid(gs(sg), F.xianchi ? 65 : 50), z: mid(P('夫妻'), P('交友')), bn: `配偶星${gt(sg)}、咸池${F.xianchi ? '有' : '無'}`, zn: '夫妻宮與交友宮' },
      partner: { b: gs(sg), z: P('夫妻'), bn: `配偶星${gt(sg)}、日支配偶宮`, zn: '夫妻宮' },
      physical_mental: { b: healthB, z: mid(P('疾厄'), P('福德')), bn: `五行落差 ${spread}%、日主${level}`, zn: '疾厄宮與福德宮' },
      personality: { b: clamp(100 - Math.abs(an.strength.score - 50) * 1.2, 20, 90), z: P('命宮'), bn: `日主強弱評分 ${an.strength.score}（越接近中和越平衡）`, zn: '命宮' },
      habits: { b: mid(gs('比劫'), gs('官殺')), z: mid(P('命宮'), P('福德')), bn: '比劫與官殺的自律／壓力結構', zn: '命宮與福德宮' },
      hobbies: { b: gs('食傷'), z: P('福德'), bn: `食傷${gt('食傷')}`, zn: '福德宮' },
      features: { b: healthB, z: P('命宮'), bn: '五行均衡度', zn: '命宮' },
      past_life: { b: gs('印星'), z: mid(P('福德'), P('田宅')), bn: '印星（祖蔭）喜忌', zn: '福德宮與田宅宮' },
      present_life: { b: patB, z: mid(P('命宮'), P('官祿'), P('福德')), bn: '格局與用神', zn: '命宮、官祿宮、福德宮' },
      recommendations: { b: mid(patB, healthB, fortB), z: mid(P('命宮'), P('官祿'), P('財帛'), P('福德'), fortZ), bn: '格局、健康、近十年運勢', zn: '命、官、財、福與近十年運勢' }
    };
    return m;
  }
  const label = s => s >= 75 ? '大吉' : s >= 62 ? '吉' : s >= 53 ? '吉多於凶' : s >= 45 ? '平順' : s >= 35 ? '凶多於吉' : '偏凶';
  const simText = df => df <= 12 ? '高度一致' : df <= 25 ? '大致相近' : '有所分歧';

  function dual(F, d, key) {
    const r = scores(F, d)[key]; if (!r) return null;
    const b = Math.round(r.b), z = Math.round(r.z), df = Math.abs(b - z), c = Math.round((b + z) / 2);
    const sim = clamp(Math.round(100 - df * 1.6), 0, 100);
    return { b, z, df, c, sim, simText: simText(df), label: label(c), bn: r.bn, zn: r.zn,
      stars: { sim: clamp(Math.ceil(sim / 20), 1, 5), ji: clamp(Math.round(c / 20), 1, 5), xiong: clamp(Math.round((100 - c) / 20), 1, 5) } };
  }
  function box(v) {
    const mk = (n, c) => `<span class="${c}">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
    const bar = (x, t) => `<span class="dv"><b>${t}</b> ${x} 分</span>`;
    const split = v.df > 25 ? `　<span class="dv-warn">兩者分歧較大，八字看五行喜忌的整體氣勢、紫微看星曜落宮，宜兩邊都參考。</span>` : '';
    return `<div class="star-box">
      <div class="star-item"><span>跨系統相似度:</span>${mk(v.stars.sim, 'star-gold')}</div>
      <div class="star-item"><span>吉 (有利星數):</span>${mk(v.stars.ji, 'star-green')}</div>
      <div class="star-item"><span>凶 (風險星數):</span>${mk(v.stars.xiong, 'star-red')}</div></div>
      <div class="dual-line">${bar(v.b, '八字指數')}${bar(v.z, '紫微指數')}<span class="dv"><b>相似度</b> ${v.sim}%（${v.simText}）</span><span class="dv"><b>綜合（各占 50%）</b> ${v.c} 分・${v.label}</span>
      <small>依據：八字—${v.bn}；紫微—${v.zn}。${split}</small></div>`;
  }
  PA.Dual = { scores, dual, box };
})(typeof window !== 'undefined' ? window : globalThis);
