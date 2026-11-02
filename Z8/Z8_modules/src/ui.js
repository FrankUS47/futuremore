/* ============================================================
 * 模組八：介面與報告輸出
 * ============================================================ */
const UI = (function () {
    const $ = id => document.getElementById(id);
    const D = Data, A = Analysis;
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const eb = e => `<span class="el el-${e}">${e}</span>`;
    const colored = (txt, e) => `<span class="el el-${e}">${esc(txt)}</span>`;
    const pad = n => String(n).padStart(2, "0");
    const KEYS = A.KEYS, PCN = A.PILLAR_CN;

    /* 年月日下拉：西元年後附民國年 */
    const rocText = y => y >= 1912 ? `民國${y - 1911}年` : `民前${1912 - y}年`;
    function mountDate(id, y, m, d) {
        const box = $(id);
        box.innerHTML = `<select class="dy"></select><select class="dm"></select><select class="dd"></select>`;
        const sy = box.querySelector(".dy"), sm = box.querySelector(".dm"), sd = box.querySelector(".dd");
        for (let i = 1900; i <= 2100; i++) sy.add(new Option(`${i}（${rocText(i).replace("年","")} ${D.STEMS[((i - 4) % 10 + 10) % 10]}${D.BRANCHES[((i - 4) % 12 + 12) % 12]}）`, i));
        for (let i = 1; i <= 12; i++) sm.add(new Option(`${i}月`, i));
        const fillDays = keep => {
            const n = new Date(+sy.value, +sm.value, 0).getDate();
            sd.innerHTML = ""; for (let i = 1; i <= n; i++) sd.add(new Option(`${i}日`, i));
            sd.value = Math.min(keep, n);
        };
        sy.value = y; sm.value = m; fillDays(d);
        sy.onchange = sm.onchange = () => fillDays(+sd.value || 1);
    }
    const getDate = id => { const b = $(id); return `${b.querySelector(".dy").value}-${pad(b.querySelector(".dm").value)}-${pad(b.querySelector(".dd").value)}`; };

    let ctx = null;
    function runFlow() {
        const box = $("flowOut");
        try {
            const [y, m, d] = getDate("flowDate").split("-").map(Number), [H, M] = ($("flowTime").value || "00:00").split(":").map(Number);
            box.innerHTML = Flow.render(Flow.compute(ctx, { y, m, d, H, M }), ctx);
        } catch (e) { box.innerHTML = `<div class="err">查詢失敗：${esc(e.message)}</div>`; }
    }

    function readInput() {
        const date = getDate("birthDate"), time = $("birthTime").value || "00:00";
        if (!date) throw new Error("請輸入出生日期");
        const [y, m, d] = date.split("-").map(Number), [H, M] = time.split(":").map(Number);
        if (y < 1900 || y > 2100) throw new Error("出生年份需介於 1900 ~ 2100 年");
        let lon, tz, place;
        const sel = $("birthPlace").value;
        if (sel === "custom") { lon = parseFloat($("customLon").value); tz = parseFloat($("customTz").value); place = "自訂地點"; if (isNaN(lon) || isNaN(tz)) throw new Error("請輸入自訂地點之經度與時區"); }
        else { const p = Places.LIST[+sel]; lon = p[1]; tz = p[2]; place = p[0]; }
        const ref = getDate("refDate").split("-").map(Number);
        const now = new Date();
        const ry = ref[0] || now.getFullYear(), rm = ref[1] || now.getMonth() + 1, rd = ref[2] || now.getDate();
        return { y, m, d, H, M, lon, tz, place, useTST: $("useTST").checked, zishi: $("zishi").value, gender: $("gender").value,
            name: $("userName").value.trim() || "命主", topic: $("queryTopic").value, ref: { y: ry, m: rm, d: rd } };
    }

    /* ---------- 四柱表 ---------- */
    function pillarTable(fp, inp) {
        const cell = (k, f) => `<td>${f(fp[k])}</td>`;
        const row = (label, f, cls) => `<tr><th>${label}</th>${KEYS.map(k => `<td${cls ? ` class="${cls}"` : ""}>${f(fp[k], k)}</td>`).join("")}</tr>`;
        const kwHit = (p, k) => {
            const hit = [];
            if (k !== "day" && fp.kongwang.day.includes(p.branchIdx)) hit.push("日空");
            if (k !== "year" && fp.kongwang.year.includes(p.branchIdx)) hit.push("年空");
            return hit.length ? `<span class="kw">${hit.join("、")}</span>` : "";
        };
        return `<table class="tbl"><thead><tr><th></th><th>年柱</th><th>月柱</th><th>日柱</th><th>時柱</th></tr></thead><tbody>
            ${row("十神", (p, k) => k === "day" ? `<span class="badge">日主</span>` : p.god)}
            ${row("天干", p => colored(p.stem, p.stemElem) + `<small>${p.stemElem}</small>`, "gz")}
            ${row("地支", (p, k) => colored(p.branch, p.branchElem) + `<small>${p.branchElem}</small>` + kwHit(p, k), "gz")}
            ${row("藏干", p => p.hidden.map(h => colored(h.stem, h.elem)).join(" "))}
            ${row("藏干十神", p => p.hidden.map(h => h.god).join("<br>"))}
            ${row("十二運", p => `${p.stage}<small>（自坐${p.selfStage}）</small>`)}
            ${row("納音", p => p.nayin)}
            ${row("所屬旬", p => { const x = Math.floor(p.jiazi / 10); return `${D.STEMS[0]}${D.BRANCHES[(12 - 2 * x) % 12]}旬<br><small>空亡：${Bazi.kongwang(p.jiazi).map(i => D.BRANCHES[i]).join("")}</small>`; })}
        </tbody></table>`;
    }

    /* ---------- 五行長條 ---------- */
    function barsWithGod(pct, dmE) {
        return D.ELEMS.map(e => {
            const g = D.groupOfElem(dmE, e);
            return `<div class="bar-row"><span class="bar-label">${eb(e)} <small>${e === dmE ? "命主・" : ""}${g}</small></span>
            <div class="bar-bg"><div class="bar-fill el-bg-${e}" style="width:${Math.max(pct[e], 1)}%"></div></div><span class="bar-val">${pct[e]}%</span></div>`;
        }).join("");
    }

    /* ---------- 紫微命盤 ---------- */
    const GRID = [[5, 6, 7, 8], [4, null, null, 9], [3, null, null, 10], [2, 1, 0, 11]];
    function ziweiGrid(zw, fp, inp) {
        const kindCls = { good: "s-good", bad: "s-bad", misc: "s-misc" };
        const star = (s, main) => `<span class="${main ? "s-main" : kindCls[s.kind]}">${esc(s.n)}${s.br ? `<i>${s.br}</i>` : ""}${s.hua ? `<b class="hua hua-${s.hua}">化${s.hua}</b>` : ""}</span>`;
        const cellHtml = b => {
            const c = zw.cells[b];
            const tags = [c.isLife ? "命" : "", c.isBody ? "身" : "", c.isOrigin ? "來" : ""].filter(Boolean).map(t => `<em class="tag">${t}</em>`).join("");
            const flows = [c.curDaxian ? "大限" : "", c.curXiaoxian ? "小限" : "", c.flowYear ? "流年" : ""].filter(Boolean).map(t => `<em class="flow">${t}</em>`).join("");
            return `<div class="zcell${c.isLife ? " is-life" : ""}${c.curDaxian ? " cur-dx" : ""}" style="grid-row:${GR[b][0]};grid-column:${GR[b][1]}">
                <div class="z-stars"><div class="z-main">${c.main.map(s => star(s, true)).join("")}</div><div class="z-minor">${c.minor.map(s => star(s, false)).join("")}</div></div>
                <div class="z-mid"><span class="z-cs">${c.changsheng}</span><span class="z-dx">${c.daxian[0]} - ${c.daxian[1]}</span><span class="z-fl">${flows}</span></div>
                <div class="z-low"><span class="z-small">${c.boshi}<br>${c.suiqian}<br>${c.jiangqian}</span>
                  <span class="z-name">${tags}<b>${c.name}</b><br><small>${c.gz}</small></span></div></div>`;
        };
        const center = `<div class="zcenter"><h4>紫微斗數命盤</h4><table class="zinfo">
              <tr><th>姓名</th><td>${esc(inp.name)}（${inp.gender}命）</td></tr>
              <tr><th>陽曆</th><td>${fp.time.clockText}</td></tr>
              <tr><th>農曆</th><td>${Cal.lunarText(fp.lunar)} ${D.BRANCHES[fp.time.hourBranch]}時</td></tr>
              <tr><th>八字</th><td>${KEYS.map(k => fp[k].gz).join("　")}</td></tr>
              <tr><th>五行局</th><td>${zw.yangYear ? "陽" : "陰"}${inp.gender}　${zw.juName}　生肖${fp.lunarZodiac}</td></tr>
              <tr><th>命宮／身宮</th><td>${D.BRANCHES[zw.life]}宮／${D.BRANCHES[zw.body]}宮（身宮在${zw.cells[zw.body].name}）</td></tr>
              <tr><th>命主／身主</th><td>${zw.mingzhu}／${zw.shenzhu}</td></tr>
              <tr><th>生年四化</th><td>${zw.hua.join("、")}</td></tr>
              <tr><th>來因宮</th><td>${zw.laiyin ? `${zw.laiyin.gz}（${zw.laiyin.name}宮）` : "—"}</td></tr>
              <tr><th>流年四化</th><td>${Ziwei.HUA[D.STEMS[((inp.ref.y - 4) % 10 + 10) % 10]].map((n, i) => n + "化" + Ziwei.HUA_NAME[i]).join("、")}</td></tr>
              <tr><th>大限</th><td>${zw.fwd ? "順行" : "逆行"}　${inp.ref.y} 年虛歲 ${zw.nowAge}</td></tr>
            </table></div>`;
        return `<div class="zgrid">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(cellHtml).join("")}${center}</div>`;
    }
    const GR = {};
    GRID.forEach((r, ri) => r.forEach((b, ci) => { if (b !== null) GR[b] = [ri + 1, ci + 1]; }));

    const TOPIC = { career: ["官祿", "事業發展、升遷轉職"], wealth: ["財帛", "財務狀況、投資理財"], love: ["夫妻", "感情婚姻、人際關係"], health: ["疾厄", "身體健康、疾病預警"], general: ["命宮", "整體格局、人生綜合"] };
    function ziweiFocus(zw, inp) {
        const [pname, desc] = TOPIC[inp.topic];
        const base = zw.cells.find(c => c.name === pname);
        const sf = Ziwei.sanfang(zw, base.branchIdx);
        const labels = ["本宮", "對宮", "三合(財帛位)", "三合(官祿位)"];
        const starsOf = c => c.main.length ? c.main.map(s => s.n + (s.br ? `(${s.br})` : "") + (s.hua ? `化${s.hua}` : "")).join("、") : "無主星（借對宮星曜）";
        const rows = sf.map((c, i) => `<tr><td>${labels[i]}</td><td>${c.name}（${c.gz}）</td><td>${starsOf(c)}</td><td>${c.minor.filter(s => ["good", "bad"].includes(s.kind)).map(s => s.n + (s.hua ? "化" + s.hua : "")).join("、") || "—"}</td></tr>`).join("");
        const mains = (base.main.length ? base.main : zw.cells[(base.branchIdx + 6) % 12].main).map(s => `${s.n}：${Ziwei.MAIN_NOTE[s.n]}`).join("；");
        const bads = sf.reduce((a, c) => a + c.minor.filter(s => s.kind === "bad").length, 0), goods = sf.reduce((a, c) => a + c.minor.filter(s => s.kind === "good").length, 0);
        const huas = sf.flatMap(c => c.huaList.map(h => `${c.name}${h}`));
        const tone = goods - bads >= 2 ? "吉星多於煞星，助力較足。" : goods - bads >= 0 ? "吉煞互見，宜穩中求進。" : "煞星較重，行事宜謹慎、避免冒進。";
        return `<h4>${pname}宮（${desc}）三方四正</h4>
            <table class="tbl small"><thead><tr><th>位置</th><th>宮位</th><th>主星</th><th>吉煞輔星</th></tr></thead><tbody>${rows}</tbody></table>
            <p><b>星性提示</b>：${esc(mains)}。</p>
            <p><b>四化引動</b>：${huas.length ? huas.join("、") : "三方四正無生年四化"}。${tone}</p>`;
    }

    /* ---------- 大運 / 流年 ---------- */
    function dayunTable(fp, an, now) {
        return `<table class="tbl small"><thead><tr><th>年齡(虛)</th><th>西元</th><th>大運</th><th>十神</th><th>吉凶</th><th>說明</th></tr></thead><tbody>` +
            fp.dayun.list.map(x => {
                const g = an.grade(x.stemIdx, x.branchIdx), cur = now.dayun && now.dayun.no === x.no;
                return `<tr class="${cur ? "cur" : ""}"><td>${x.ageFrom} - ${x.ageTo}</td><td>${x.yearFrom}</td><td class="gz">${colored(x.gz[0], D.STEM_ELEM[x.stemIdx])}${colored(x.gz[1], D.BRANCH_ELEM[x.branchIdx])}</td>
                <td>${x.god}<br><small>${x.hiddenGods.join("/")}</small></td><td><span class="badge b-${g.cls}">${g.label}</span>${cur ? '<br><small>行運中</small>' : ""}</td>
                <td class="left"><small>干${eb(g.stemElem)}${g.stemVal > 0 ? "喜" : g.stemVal < 0 ? "忌" : "平"}、支${eb(g.branchElem)}${g.branchVal > 0 ? "喜" : g.branchVal < 0 ? "忌" : "平"}${g.notes.length ? "；" + esc(g.notes.join("；")) : ""}</small><br>${g.advice}</td></tr>`;
            }).join("") + `</tbody></table>`;
    }
    function flowTable(fp, an, now, refY) {
        let rows = "";
        for (let y = refY; y < refY + 10; y++) {
            const p = Bazi.yearPillar(y), g = an.grade(p.stemIdx, p.branchIdx), age = y - fp.time.birthYear + 1;
            const dy = fp.dayun.list.find(x => age >= x.ageFrom && age <= x.ageTo);
            rows += `<tr class="${y === refY ? "cur" : ""}"><td>${y}</td><td>${age}</td><td class="gz">${colored(D.STEMS[p.stemIdx], D.STEM_ELEM[p.stemIdx])}${colored(D.BRANCHES[p.branchIdx], D.BRANCH_ELEM[p.branchIdx])}</td>
              <td>${D.tenGod(fp.day.stemIdx, p.stemIdx)}</td><td>${dy ? dy.gz : "未起運"}</td><td><span class="badge b-${g.cls}">${g.label}</span></td><td class="left"><small>${esc(g.notes.join("；"))}</small></td></tr>`;
        }
        return `<table class="tbl small"><thead><tr><th>流年</th><th>虛歲</th><th>干支</th><th>十神</th><th>所行大運</th><th>吉凶</th><th>合沖</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    /* ---------- 主報告 ---------- */
    function generate() {
        const out = $("result"), err = $("errBox");
        err.style.display = "none";
        try {
            const inp = readInput();
            const fp = Bazi.compute({ y: inp.y, m: inp.m, d: inp.d, H: inp.H, M: inp.M, lon: inp.lon, tz: inp.tz, useTST: inp.useTST, zishi: inp.zishi, gender: inp.gender });
            fp.time.birthYear = inp.y;
            fp.time.clockText = `${inp.y}年${inp.m}月${inp.d}日 ${$("birthTime").selectedOptions[0].text.replace("（", "（").replace(/ ?(早子|晚子)/, " $1")}`;
            const refMs = Date.UTC(inp.ref.y, inp.ref.m - 1, inp.ref.d, 12) - 8 * 3600000;
            const now = Bazi.nowInfo(fp, refMs);
            const an = A.analyze(fp), bone = A.bone(fp), bd = BoneData.get(bone.total), life = A.lifestyle(fp, an);
            const zw = Ziwei.compute({ lunar: fp.lunar, hourBranch: fp.time.hourBranch, male: inp.gender === "男", refYear: inp.ref.y });
            const dm = an.dmS, dmE = an.dmE;
            const tstNote = inp.useTST ? `已依 ${esc(inp.place)}（東經 ${inp.lon}°）換算真太陽時（${fp.time.offsetMin >= 0 ? "+" : ""}${fp.time.offsetMin.toFixed(1)} 分鐘，以時辰中點估算），校正後為${D.BRANCHES[fp.time.hourBranch]}時` : `採標準時間排盤（未做真太陽時校正）`;
            const jieNote = `${fp.prevTerm.name} ${fmtMs(fp.prevTerm.ms)}　→　${fp.nextTerm.name} ${fmtMs(fp.nextTerm.ms)}`;
            const XUN = j => "甲" + D.BRANCHES[(12 - 2 * Math.floor(j / 10)) % 12] + "旬";
            const kwText = `年柱${XUN(fp.year.jiazi)}、日柱${XUN(fp.day.jiazi)}；年柱空亡：${fp.kongwang.year.map(i => D.BRANCHES[i]).join("")}；日柱空亡：${fp.kongwang.day.map(i => D.BRANCHES[i]).join("")}`;
            const curTxt = now.dayun ? `命造今年實歲 ${now.age} 歲（虛歲 ${now.age + 1}），行 ${now.dayun.gz} 大運。` : `命造今年實歲 ${now.age} 歲，尚未起運（${fp.dayun.startText}）。`;
            const fyP = now.flowYearPillar, fyG = an.grade(fyP.stemIdx, fyP.branchIdx), fyGz = D.STEMS[fyP.stemIdx] + D.BRANCHES[fyP.branchIdx];
            const curDyG = now.dayun ? an.grade(now.dayun.stemIdx, now.dayun.branchIdx) : null;

            ctx = { inp, fp, an, zw, now };
            out.innerHTML = `
            <h2 class="sec-title">【 四 柱 八 字 命 盤 】</h2>
            <div class="summary">
              <div><b>陽曆</b>　${fp.time.clockText}　<small>${tstNote}</small></div>
              <div><b>農曆</b>　${Cal.lunarText(fp.lunar)}${D.BRANCHES[fp.time.hourBranch]}時　<b>生肖</b> ${fp.zodiac}　<b>出生地</b> ${esc(inp.place)}</div>
              <div><b>命主</b>　${colored(dm + dmE, dmE)}　<b>命格</b> ${an.pattern.name}　<b>命重</b> ${bone.label}　<b>五行</b> ${an.countText}</div>
              <div><b>空亡</b>　${kwText}　<b>節氣</b> ${jieNote}</div>
              <div><b>大運</b>　${fp.gender}命・${fp.dayun.forward ? "順" : "逆"}排，${fp.dayun.startText}（約 ${fp.dayun.startDate} 起運，虛歲 ${fp.dayun.startAge} 歲）</div>
            </div>
            ${pillarTable(fp, inp)}

            <div class="card"><h3>一、五行結構與日主強弱</h3>
              <div class="two"><div><h4>原局五行結構</h4>${barsWithGod(an.pctOrig, dmE)}</div><div><h4>合會化後五行結構</h4>${barsWithGod(an.pctAdj, dmE)}</div></div>
              <p><b>合會說明</b>：${esc(an.comboText)}。</p>
              <p><b>日主強弱</b>：${dm}${dmE}生於${fp.month.branch}月，月令${dmE}處於「${an.strength.status}」地，<b>${an.strength.deLing ? "得令" : "失令"}</b>；
                 綜合得令、得地、得勢，評分 ${an.strength.score} 分，判定為 <b>${an.strength.level}</b>。</p></div>

            <div class="card"><h3>二、命盤格局與用神喜忌</h3>
              <ul>
                <li><b>格局</b>：${an.pattern.text}</li>
                <li><b>用神</b>：<span class="badge b-good">${an.yong.group}（${an.yong.elem}）</span>　${esc(an.yongWhy)}</li>
                <li><b>喜神</b>：${an.xi.map(x => `${x.group}（${x.elem}）`).join("、")}　<b>忌神</b>：${an.ji.map(x => `<span class="badge b-bad">${x.group}（${x.elem}）</span>`).join(" ")}</li>
                <li><b>行運</b>：喜${an.favText}運，忌${an.badText}運。</li>
                <li><b>日主特質</b>：${A.GAN_DESC[dm]}</li>
              </ul>
              <div class="quote">${esc(an.summary)}</div></div>

            <div class="card"><h3>三、十年大運吉凶</h3><p>${curTxt}</p>${dayunTable(fp, an, now)}</div>

            <div class="card"><h3>四、流年運勢（排盤日期 ${inp.ref.y}/${inp.ref.m}/${inp.ref.d}）</h3>
              <p>流年：${now.flowYear}，${fyGz}年　${now.dayun ? `大運：${now.dayun.gz}（${curDyG.label}）` : ""}　今年流年：<span class="badge b-${fyG.cls}">${fyG.label}</span></p>
              <p>${esc(fyG.advice)}${now.dayun ? "大運" + esc(curDyG.advice) : ""}</p>
              ${flowTable(fp, an, now, now.flowYear)}
              <p class="note">流年運勢以命主之八字喜忌，配合大運與流年干支推算，僅供參考。</p></div>

            <div class="card"><h3>五、趨吉避凶</h3><ul>
              <li><b>行業選擇</b>：命局喜${an.favText}，適合${esc(life.job)}。</li>
              <li><b>職業性質</b>：局成${an.pattern.name}，${esc(life.nature)}</li>
              <li><b>吉利方位</b>：${life.dir}。</li>
              <li><b>幸運色彩</b>：${esc(life.color)}。</li>
              <li><b>幸運數字</b>：${life.num}。</li>
              <li><b>身體保健</b>：命局忌${an.badText}，宜留意 ${esc(life.body)}。</li></ul></div>

            <div class="card"><h3>六、稱骨論命</h3>
              <div class="bone-blk"><span>命重</span><div><b>${bone.label}</b>　<small>年 ${bone.parts.year}＋月 ${bone.parts.month}＋日 ${bone.parts.day}＋時 ${bone.parts.hour}（${esc(inp.gender)}命）</small></div></div>
              <div class="bone-blk"><span>命批</span><div><b>${bone.tierName}</b>：${esc((inp.gender === "男" ? bone.male : bone.female).replace(/^[男女]命：/, ""))}</div></div>
              <div class="bone-blk"><span>歌訣大意</span><div>${esc(inp.gender === "男" ? bd.male : bd.female)}</div></div>
              <div class="bone-blk"><span>說明</span><div><small>1.「稱骨論命」依袁天罡「八字稱骨命術」，以出生農曆年、月、日、時查表相加得命重，男女命的批語不同。<br>2. 此法簡易，僅供參考；歌訣大意為依《秤骨歌》意旨整理的白話概述，非歌訣原文。</small></div></div></div>

            <div class="card"><h3>七、生肖與納音</h3><ul>
              <li><b>陽曆</b>：${fp.time.clockText}　<b>農曆</b>：${Cal.lunarText(fp.lunar)}${D.BRANCHES[fp.time.hourBranch]}時</li>
              <li><b>年柱納音</b>：${fp.year.gz}　${fp.year.nayin}　生肖屬${fp.zodiac}。${esc(A.NAYIN_NOTE[Data.nayinElem(fp.year.jiazi)])}</li></ul></div>

            <h2 class="sec-title">【 紫 微 斗 數 命 盤 】<small>（輔助參考）</small></h2>
            ${ziweiGrid(zw, fp, inp)}
            <div class="card">${ziweiFocus(zw, inp)}
              <p class="note">八字為主、紫微為輔：八字看天賦格局與喜忌取向，紫微看宮位落點與事件窗口，兩者相互參照。</p></div>
            ${Summary.render(Summary.build(fp, an, zw, now, inp))}
            <h2 class="sec-title">【 流 運 查 詢 】<small>（流年・流月・流日・流時）</small></h2>
            <div class="card"><div class="flow-form"><div class="form-group wide"><label>查詢日期</label><div class="dsel" id="flowDate"></div></div>
              <div class="form-group"><label>查詢時間</label><input type="time" id="flowTime" value="08:00"></div>
              <button class="btn small" id="flowBtn">查詢</button></div><div id="flowOut"></div></div>`;
            mountDate("flowDate", inp.ref.y, inp.ref.m, inp.ref.d); $("flowBtn").addEventListener("click", runFlow); runFlow();
            $("result").style.display = "block";
            out.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (e) { err.textContent = "排盤失敗：" + e.message; err.style.display = "block"; }
    }
    function fmtMs(ms) {
        const d = new Date(ms + 8 * 3600000);
        return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    }

    function init() {
        Places.fillSelect($("birthPlace"), "臺北市");
        const now = new Date();
        mountDate("birthDate", 2008, 10, 29);
        mountDate("refDate", now.getFullYear(), now.getMonth() + 1, now.getDate());
        $("birthPlace").addEventListener("change", () => { $("customBox").style.display = $("birthPlace").value === "custom" ? "flex" : "none"; });
        $("genBtn").addEventListener("click", generate);
    }
    return { init, generate, readInput };
})();
