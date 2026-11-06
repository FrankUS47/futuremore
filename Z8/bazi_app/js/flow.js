/* ============================================================
 * 模組十：流運查詢（流年、流月、流日、流時；八字＋紫微）
 *   八字：取查詢時刻的年/月/日/時柱，對原局論沖合刑害與喜忌。
 *   紫微：斗君法 —— 流年宮起正月逆數至生月，再由該宮起子時順數至生時為斗君(流年正月)；
 *         流月＝斗君順數 (流月-1)，流日＝流月宮順數 (日-1)，流時＝流日宮起子順數至該時辰。
 *         各層四化取該層天干(流年取農曆年干；流月以五虎遁依農曆月；流日/流時取日柱/時柱干；大限取大限宮干)。
 * ============================================================ */
const Flow = (function () {
    const D = Data, mod = n => ((n % 12) + 12) % 12;
    const BR = D.BRANCHES, PN = { year: "年", month: "月", day: "日", hour: "時" };
    const XING = [[2, 5], [5, 8], [8, 2], [1, 10], [10, 7], [7, 1], [0, 3]];
    const SELF = [4, 6, 9, 11];
    const HAI = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
    const has = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

    function relations(b, fp) {
        const out = [];
        ["year", "month", "day", "hour"].forEach(k => {
            const o = fp[k].branchIdx, name = `${PN[k]}支${BR[o]}`;
            if (D.isClash(b, o)) out.push({ t: "沖", k, text: `${BR[b]}沖${name}` });
            const he = D.branchHe(BR[b], BR[o]); if (he) out.push({ t: "合", k, text: `${BR[b]}合${name}（${he}）` });
            if (has(XING, b, o) || (b === o && SELF.includes(b))) out.push({ t: "刑", k, text: `${BR[b]}刑${name}` });
            if (has(HAI, b, o)) out.push({ t: "害", k, text: `${BR[b]}害${name}` });
        });
        return out;
    }
    const locate = (zw, star) => { for (const c of zw.cells) if (c.main.concat(c.minor).some(s => s.n === star)) return c; return null; };

    function huaPlaces(zw, stemChar) {
        const hs = Ziwei.HUA[stemChar];
        return hs.map((n, i) => { const c = locate(zw, n); return { hua: Ziwei.HUA_NAME[i], star: n, cell: c }; });
    }

    // inp: 排盤輸入；q: {y,m,d,H,M}
    function compute(ctx, q) {
        const { inp, fp, an, zw } = ctx;
        const f = Cal.fourPillars({ y: q.y, m: q.m, d: q.d, H: q.H, M: q.M, lon: inp.lon, tz: inp.tz, useTST: inp.useTST, zishi: inp.zishi });
        const L = Cal.lunarOf(f.time.dayRef.y, f.time.dayRef.m, f.time.dayRef.d);
        const lyS = ((L.year - 4) % 10 + 10) % 10, lyB = ((L.year - 4) % 12 + 12) % 12;
        // ---- 八字 ----
        const bz = ["year", "month", "day", "hour"].map(k => {
            const p = f[k], g = an.grade(p.stemIdx, p.branchIdx);
            return { key: k, label: "流" + PN[k], gz: p.gz, stemIdx: p.stemIdx, branchIdx: p.branchIdx, god: D.tenGod(fp.day.stemIdx, p.stemIdx),
                hidden: D.HIDDEN[p.branchIdx].map(([h]) => D.tenGod(fp.day.stemIdx, D.STEMS.indexOf(h))), grade: g, rel: relations(p.branchIdx, fp) };
        });
        // ---- 紫微 ----
        let fm = L.month; if (L.leap && L.day > 15) fm = fm % 12 + 1;
        const birthM = zw.monthUsed, birthH = zw.hourBranch;
        const dj = mod(lyB - (birthM - 1) + birthH);                 // 斗君
        const mP = mod(dj + (fm - 1)), dP = mod(mP + (L.day - 1)), hP = mod(dP + f.time.hourBranch);
        const age = L.year - fp.lunar.year + 1;                       // 農曆虛歲
        const dx = zw.cells.find(c => age >= c.daxian[0] && age <= c.daxian[1]) || null;
        const levels = [
            { label: "大限", pos: dx ? dx.branchIdx : null, stem: dx ? dx.stem : null, note: dx ? `${dx.daxian[0]}～${dx.daxian[1]}歲` : "未入大限" },
            { label: "流年", pos: lyB, stem: D.STEMS[lyS], note: `${D.STEMS[lyS]}${BR[lyB]}年（農曆）` },
            { label: "流月", pos: mP, stem: D.STEMS[([2, 4, 6, 8, 0][lyS % 5] + fm - 1) % 10], note: `農曆${Cal.MONTH_CN[fm - 1]}月（月干依五虎遁）` },
            { label: "流日", pos: dP, stem: f.day.stem, note: `農曆${Cal.DAY_CN[L.day - 1]}，日柱${f.day.gz}` },
            { label: "流時", pos: hP, stem: f.hour.stem, note: `${BR[f.time.hourBranch]}時，時柱${f.hour.gz}` }
        ].map(v => {
            if (v.pos === null) return v;
            const cell = zw.cells[v.pos], ji = zw.cells[mod(v.pos - 5)];
            const sanfang = Ziwei.sanfang(zw, v.pos);
            const bad = sanfang.reduce((a, c) => a + c.minor.filter(s => s.kind === "bad").length, 0);
            v.cell = cell; v.ji = ji; v.score = Summary.palaceScore(zw, v.pos); v.bad = bad;
            v.hua = huaPlaces(zw, v.stem);
            v.jiHit = v.hua.find(h => h.hua === "忌");
            return v;
        });
        return { f, L, bz, levels, dj, age };
    }

    const colored = (t, e) => `<span class="el el-${e}">${t}</span>`;
    function render(r, ctx) {
        const { fp, an } = ctx;
        const tag = x => `<span class="badge b-${x.grade.cls}">${x.grade.label}</span>`;
        const bzRows = r.bz.map(x => `<tr><td><b>${x.label}</b></td><td class="gz">${colored(x.gz[0], D.STEM_ELEM[x.stemIdx])}${colored(x.gz[1], D.BRANCH_ELEM[x.branchIdx])}</td>
            <td>${x.god}<br><small>${x.hidden.join("/")}</small></td><td>${tag(x)}</td>
            <td class="left"><small>${x.rel.length ? x.rel.map(y => `<span class="rel rel-${y.t}">${y.text}</span>`).join("　") : "與原局無沖合刑害"}${x.grade.notes.length ? "<br>" + x.grade.notes.join("；") : ""}</small></td></tr>`).join("");
        const zwRows = r.levels.map(v => {
            if (!v.cell) return `<tr><td><b>${v.label}</b></td><td colspan="5" class="left">${v.note}</td></tr>`;
            const mains = (v.cell.main.length ? v.cell.main : zw0(ctx).cells[mod(v.pos + 6)].main).map(s => s.n + (s.hua ? "化" + s.hua : "")).join("、") || "無主星";
            const sha = v.cell.minor.filter(s => s.kind === "bad").map(s => s.n).join("、");
            const jiSha = v.ji.minor.filter(s => s.kind === "bad").map(s => s.n).join("、");
            const huaTxt = v.hua.map(h => `<span class="hua hua-${h.hua}">化${h.hua}</span>${h.star}→${h.cell ? h.cell.name : "—"}`).join("　");
            return `<tr><td><b>${v.label}</b><br><small>${v.note}</small></td><td>${BR[v.pos]}宮（本命${v.cell.name}）</td>
                <td class="left">${mains}${sha ? `<br><small>煞：${sha}</small>` : ""}</td>
                <td>${v.ji.name === "疾厄" ? "" : ""}${BR[v.ji.branchIdx]}宮（${v.ji.name}）<br><small>${v.ji.main.map(s => s.n).join("、") || "無主星"}${jiSha ? "；煞：" + jiSha : ""}</small></td>
                <td><span class="badge b-${Summary.clsOf(v.score)}">${Summary.labelOf(v.score)}</span><br><small>${v.score} 分</small></td>
                <td class="left"><small>${huaTxt}</small></td></tr>`;
        }).join("");
        const hits = [];
        r.bz.forEach(x => x.rel.filter(y => y.t === "沖" || y.t === "刑").forEach(y => { if (y.k === "day") hits.push(`${x.label}${y.text}（動及日支，主自身）`); else if (y.k === "hour") hits.push(`${x.label}${y.text}（動及時支）`); }));
        r.levels.forEach(v => { if (v.jiHit && v.jiHit.cell && v.cell && (v.jiHit.cell.branchIdx === v.pos || v.jiHit.cell.branchIdx === v.ji.branchIdx)) hits.push(`${v.label}化忌（${v.jiHit.star}）入${v.jiHit.cell.name === v.cell.name ? "流命" : "疾厄"}相關宮位`); });
        return `<table class="tbl small"><thead><tr><th>層級</th><th>干支</th><th>十神</th><th>吉凶</th><th>與原局沖合刑害</th></tr></thead><tbody>${bzRows}</tbody></table>
            <table class="tbl small"><thead><tr><th>紫微層級</th><th>流命宮落點</th><th>流命宮星曜</th><th>該層疾厄宮</th><th>吉煞</th><th>該層四化落宮</th></tr></thead><tbody>${zwRows}</tbody></table>
            <p><b>留意訊號</b>：${hits.length ? hits.join("；") : "此刻八字與紫微均未出現明顯的沖刑日支或化忌入命/疾厄訊號"}。</p>
            <p class="note">查詢時刻：${r.f.time.effText}（農曆${Cal.lunarText(r.L)}）；斗君在${BR[r.dj]}宮。流月/日/時以斗君法逐層順推，四化取各層天干。僅供參考。</p>`;
    }
    const zw0 = ctx => ctx.zw;
    return { compute, render, relations };
})();
