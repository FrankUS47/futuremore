/* ============================================================
 * 模組九：八字 × 紫微 綜合總結（各面向指數、相似度、吉凶程度）
 *   指數 0~100：50 為中性，越高越吉。屬輔助參考的啟發式評分。
 * ============================================================ */
const Summary = (function () {
    const D = Data;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const BR = { 廟: 2, 旺: 2, 得: 1, 利: 1, 平: 0, 不: -1, 陷: -2 };
    const HUA = { 祿: 2, 權: 1.5, 科: 1, 忌: -2 };

    // 紫微：某宮三方四正評分
    function palaceScore(zw, branchIdx) {
        const cells = Ziwei.sanfang(zw, branchIdx);
        let raw = 0;
        cells.forEach((c, i) => {
            const w = i === 0 ? 1.5 : 1;
            c.main.forEach(s => { raw += w * ((BR[s.br] || 0) + (HUA[s.hua] || 0)); });
            c.minor.forEach(s => {
                if (s.kind === "good") raw += w * (1 + (HUA[s.hua] || 0));
                else if (s.kind === "bad") raw -= w * 1.5;
            });
        });
        return clamp(Math.round(32 + raw * 3.5), 5, 95);   // 以 1500 組隨機命盤校準，使各宮分數中位數約 50
    }
    // 八字：某十神群組面向
    function groupScore(an, g) {
        const e = D.elemOfGroup(an.dmE, g), v = an.val[e] || 0, p = an.groupPct[g];
        return clamp(Math.round(50 + 12 * v + (p < 6 ? -6 : p >= 15 ? 4 : 0)), 10, 95);
    }
    const idxOfGrade = g => clamp(Math.round((g.score + 2) / 6 * 100), 5, 95);
    const labelOf = s => s >= 75 ? "大吉" : s >= 62 ? "吉" : s >= 53 ? "吉多於凶" : s >= 45 ? "平順" : s >= 35 ? "凶多於吉" : "偏凶";
    const clsOf = s => s >= 62 ? "good" : s >= 45 ? "neutral" : "bad";
    const simOf = d => d <= 12 ? "高度一致" : d <= 25 ? "大致相近" : "有所分歧";

    function build(fp, an, zw, now, inp) {
        const male = inp.gender === "男";
        // 八字運勢
        const fy = now.flowYearPillar, gF = an.grade(fy.stemIdx, fy.branchIdx);
        const gD = now.dayun ? an.grade(now.dayun.stemIdx, now.dayun.branchIdx) : null;
        const fortuneB = gD ? Math.round(idxOfGrade(gD) * 0.5 + idxOfGrade(gF) * 0.5) : idxOfGrade(gF);
        // 紫微運勢
        const dxCell = zw.cells.find(c => c.curDaxian), fyCell = zw.cells.find(c => c.flowYear);
        const fortuneZ = Math.round((palaceScore(zw, dxCell ? dxCell.branchIdx : zw.life) + palaceScore(zw, fyCell.branchIdx)) / 2);
        // 格局
        const pctYong = an.groupPct[an.yong.group];
        const patB = clamp(Math.round(55 + (pctYong - 12) * 1.2 + (/極/.test(an.strength.level) ? -10 : 0)), 15, 90);
        const spread = Math.max(...Object.values(an.pctAdj)) - Math.min(...Object.values(an.pctAdj));
        const healthB = clamp(Math.round(100 - spread * 1.1 + (/中和/.test(an.strength.level) ? 8 : /極/.test(an.strength.level) ? -8 : 0)), 15, 90);
        const pal = n => palaceScore(zw, zw.cells.find(c => c.name === n).branchIdx);
        const rows = [
            { name: "整體格局", b: patB, z: pal("命宮"), bn: `用神${an.yong.group}占 ${pctYong}%，日主${an.strength.level}`, zn: "命宮三方四正星曜吉煞" },
            { name: "事業官運", b: groupScore(an, "官殺"), z: pal("官祿"), bn: `官殺為${an.val[D.elemOfGroup(an.dmE, "官殺")] > 0 ? "喜" : "忌"}`, zn: "官祿宮三方四正" },
            { name: "財運財源", b: groupScore(an, "財星"), z: pal("財帛"), bn: `財星為${an.val[D.elemOfGroup(an.dmE, "財星")] > 0 ? "喜" : "忌"}，占 ${an.groupPct["財星"]}%`, zn: "財帛宮三方四正" },
            { name: "感情婚姻", b: groupScore(an, male ? "財星" : "官殺"), z: pal("夫妻"), bn: `${male ? "財星" : "官殺"}為配偶星`, zn: "夫妻宮三方四正" },
            { name: "身體健康", b: healthB, z: pal("疾厄"), bn: `五行${spread >= 25 ? "偏枯" : "尚稱均衡"}（落差 ${spread}%）`, zn: "疾厄宮三方四正" },
            { name: "當前運勢", b: fortuneB, z: fortuneZ, bn: `${gD ? now.dayun.gz + "大運" + gD.label + "、" : ""}${now.flowYear}流年${gF.label}`, zn: `大限${dxCell ? dxCell.name + "宮" : ""}、流年${fyCell.name}宮` }
        ];
        rows.forEach(r => { r.diff = Math.abs(r.b - r.z); r.sim = simOf(r.diff); r.c = Math.round(r.b * 0.7 + r.z * 0.3); r.label = labelOf(r.c); });
        const avgDiff = rows.reduce((a, r) => a + r.diff, 0) / rows.length;
        const similarity = clamp(Math.round(100 - avgDiff * 1.6), 0, 100);
        const overall = Math.round(rows.reduce((a, r) => a + r.c, 0) / rows.length);
        const same = rows.filter(r => r.diff <= 12).length;
        const sorted = rows.filter(r => r.name !== "當前運勢").slice().sort((a, b) => b.c - a.c);
        const best = sorted.slice(0, 2), worst = sorted.slice(-2).reverse();
        const split = rows.filter(r => r.diff > 25);
        return { rows, similarity, overall, label: labelOf(overall), cls: clsOf(overall), same, best, worst, split, fortuneB, fortuneZ };
    }

    function render(S) {
        const bar = (v, cls) => `<div class="sbar"><div class="sbar-fill sb-${cls}" style="width:${v}%"></div><span>${v}</span></div>`;
        const body = S.rows.map(r => `<tr><td><b>${r.name}</b></td>
            <td>${bar(r.b, clsOf(r.b))}<small>${r.bn}</small></td><td>${bar(r.z, clsOf(r.z))}<small>${r.zn}</small></td>
            <td>${r.sim}<br><small>差 ${r.diff}</small></td><td><span class="badge b-${clsOf(r.c)}">${r.label}</span><br><small>${r.c} 分</small></td></tr>`).join("");
        return `<h2 class="sec-title">【 八 字 × 紫 微 綜 合 總 結 】</h2>
        <div class="card"><div class="sum-head">
            <div><small>兩者相似度</small><b>${S.similarity}%</b><span>${S.same}／${S.rows.length} 項高度一致</span></div>
            <div><small>綜合吉凶程度（八字 7 成、紫微 3 成）</small><b>${S.overall} 分</b><span class="badge b-${S.cls}">${S.label}</span></div></div>
          <table class="tbl small"><thead><tr><th>面向</th><th>八字指數</th><th>紫微指數</th><th>相似程度</th><th>綜合</th></tr></thead><tbody>${body}</tbody></table>
          <ul>
            <li><b>相對有利</b>：${S.best.map(r => `${r.name}（${r.c} 分・${r.label}）`).join("、")}，可作為發展重心。</li>
            <li><b>需要留意</b>：${S.worst.map(r => `${r.name}（${r.c} 分・${r.label}）`).join("、")}，宜多加防範或補強。</li>
            ${S.split.length ? `<li><b>兩者分歧</b>：${S.split.map(r => `${r.name}（八字 ${r.b}／紫微 ${r.z}）`).join("、")}。八字看五行喜忌的整體氣勢，紫微看星曜落宮的事件窗口，分歧處宜以八字為主、紫微為輔。</li>` : `<li><b>兩者分歧</b>：各面向走向大致相同，互相印證度高。</li>`}
          </ul>
          <p class="note">指數以 50 為中性、越高越吉；八字依用神喜忌、十神與運歲吉凶計算，紫微依三方四正星曜廟陷、吉煞星與四化計算。為輔助判讀之啟發式評分，不代表命運定論。</p></div>`;
    }
    return { build, render, palaceScore, labelOf, clsOf };
})();
