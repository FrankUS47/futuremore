/* ============================================================
 * 模組六：命理分析（五行權重、身強身弱、格局用神、大運流年吉凶、稱骨、生活建議）
 * ============================================================ */
const Analysis = (function () {
    const D = Data;
    const KEYS = ["year", "month", "day", "hour"];
    const PILLAR_CN = { year: "年", month: "月", day: "日", hour: "時" };

    const BONE_YEAR = [1.2, .9, .6, .7, 1.2, .5, .9, .8, .7, .8, 1.5, .9, 1.6, .8, .8, 1.9, 1.2, .6, .8, .7, .5, 1.5, .6, 1.6, 1.5, .7, .9, 1.2, 1.0, .7,
        1.5, .6, .5, 1.4, 1.4, .9, .7, .7, .9, 1.2, .8, .7, 1.3, .5, 1.4, .5, .9, 1.7, .5, .7, 1.2, .8, .8, .6, 1.9, .6, .8, 1.6, 1.0, .6];
    const BONE_MONTH = [.6, .7, 1.8, .9, .5, 1.6, .9, 1.5, 1.8, .8, .9, .5];
    const BONE_DAY = [.5, 1.0, .8, 1.5, 1.6, 1.5, .8, 1.6, .8, 1.6, .9, 1.7, .8, 1.7, 1.0, .8, .9, 1.8, .5, 1.5, 1.0, .9, .8, .9, 1.5, 1.8, .7, .8, 1.6, .6];
    const BONE_HOUR = [1.6, .6, .7, 1.0, .9, 1.6, 1.0, .8, .8, .9, .6, .6];

    const GAN_DESC = {
        甲: "甲木如參天大樹，正直向上、有抱負，重原則而不易低頭。", 乙: "乙木如花草藤蔓，柔韌變通、善於借力，人緣佳而心思細膩。",
        丙: "丙火如太陽，熱情開朗、光明磊落，樂於付出，但有時急躁。", 丁: "丁火如燈燭星火，內斂溫暖、思慮周密，專注而富洞察力。",
        戊: "戊土如高山厚土，穩重誠信、包容力強，行事踏實但較固執。", 己: "己土如田園之土，謙和內斂、善於涵養萬物，思慮多而偏保守。",
        庚: "庚金如刀劍頑鐵，果斷剛毅、重義氣，執行力強但較直接。", 辛: "辛金如珠玉首飾，精緻敏銳、重品味與面子，自尊心強。",
        壬: "壬水如江河大海，聰明多才、率性自由，具創造力與領導力，但情緒與意志易隨環境起伏。", 癸: "癸水如雨露泉水，柔順細膩、直覺敏銳，善於思考，容易多慮。"
    };
    const JOB = { 木: "教育文化、出版文創、林業木材、紡織服飾、醫藥保健", 火: "能源電力、餐飲、廣告傳媒、娛樂演藝、美容光電", 土: "房地產與建築、仲介、農牧、倉儲、顧問管理",
        金: "電子科技、金融保險、珠寶五金、機械汽車、法務執行", 水: "貿易流通、運輸航運、旅遊觀光、傳播記者、自由業與水產冷凍" };
    const COLOR = { 木: "綠、青", 火: "紅、紫、橙", 土: "黃、咖啡、棕", 金: "白、銀、金", 水: "黑、藍、灰" };
    const DIR = { 木: "東方", 火: "南方", 土: "中央與東北、西南", 金: "西方", 水: "北方" };
    const NUM = { 木: "三、八", 火: "二、七", 土: "五、十、零", 金: "四、九", 水: "一、六" };
    const BODY = { 木: "肝膽、神經、筋骨與頭頸", 火: "心臟、血液循環、眼睛與腦血管", 土: "脾胃、腸胃消化系統與肌肉", 金: "肺與呼吸道、大腸、皮膚", 水: "腎臟、泌尿生殖、耳與骨骼" };
    const PATTERN_JOB = { 正官格: "適合公職、行政管理、法務與制度性工作。", 偏官格: "適合武職、決策與執行性工作，宜在壓力與挑戰中發揮。", 正財格: "適合財務、會計、穩定經營與專業服務。",
        偏財格: "適合業務、投資、商貿與靈活經營。", 食神格: "適合技藝、餐飲、創作、教學與福利事業。", 傷官格: "適合專業技術、創意設計、表演與自由業。",
        正印格: "適合學術、教育、文書與研究工作。", 偏印格: "適合研究、醫藥、宗教哲學與冷門專業。", 建祿格: "適合自力更生、專業技能或自行創業。", 月刃格: "適合競爭性高、需魄力的工作，宜防衝動。", 月劫格: "適合團隊合作與業務拓展，宜防財來財去。" };
    const NAYIN_NOTE = { 木: "木命者生機勃勃、重成長與人情。", 火: "火命者熱情積極、行動力強、重名聲。", 土: "土命者穩重厚實、重信用與安定。", 金: "金命者果決俐落、重原則與效率。", 水: "水命者聰穎靈活、善應變、重智慧。" };

    const pctOf = (items) => {
        const sum = {}; D.ELEMS.forEach(e => sum[e] = 0);
        let total = 0; items.forEach(i => { sum[i.elem] += i.w; total += i.w; });
        const raw = D.ELEMS.map(e => sum[e] / total * 100), fl = raw.map(Math.floor);
        let left = 100 - fl.reduce((a, b) => a + b, 0);
        raw.map((v, i) => [v - fl[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { fl[i]++; left--; } });
        const out = {}; D.ELEMS.forEach((e, i) => out[e] = fl[i]); return out;
    };

    function analyze(fp) {
        const dm = fp.day.stemIdx, dmE = D.STEM_ELEM[dm], dmS = fp.day.stem;
        const res = { dmS, dmE };

        // ① 八字本氣計數
        const counts = {}; D.ELEMS.forEach(e => counts[e] = 0);
        KEYS.forEach(k => { counts[fp[k].stemElem]++; counts[fp[k].branchElem]++; });
        res.counts = counts;
        res.countText = ["金", "木", "水", "火", "土"].map(e => `${e}(${counts[e]})`).join("，");

        // ② 權重項目
        const items = [];
        KEYS.forEach(k => {
            items.push({ elem: fp[k].stemElem, w: 7, kind: "stem", pillar: k, stemIdx: fp[k].stemIdx });
            fp[k].hidden.forEach(h => items.push({ elem: h.elem, w: 12 * h.weight / 100, kind: "hidden", pillar: k, stemIdx: h.stemIdx }));
        });
        res.pctOrig = pctOf(items);

        // ③ 合會
        const bs = KEYS.map(k => fp[k].branch), combos = [];
        D.SAN_HUI.forEach(s => { if (s.slice(0, 3).every(b => bs.includes(b))) combos.push({ type: "三會", set: s.slice(0, 3), elem: s[3], ok: true, text: `${s.slice(0, 3).join("")}三會${s[3]}局` }); });
        D.SAN_HE.forEach(s => { if (s.slice(0, 3).every(b => bs.includes(b))) combos.push({ type: "三合", set: s.slice(0, 3), elem: s[3], ok: true, text: `${s.slice(0, 3).join("")}三合${s[3]}局` }); });
        const monthE = fp.month.branchElem;
        [["year", "month"], ["month", "day"], ["day", "hour"]].forEach(([a, b]) => {
            const e = D.stemHe(fp[a].stem, fp[b].stem);
            if (!e) return;
            const supported = (monthE === e || D.GEN[monthE] === e);
            const ok = supported && a !== "day" && b !== "day";
            combos.push({ type: "天干五合", pillars: [a, b], elem: e, ok, text: `${PILLAR_CN[a]}干${fp[a].stem}與${PILLAR_CN[b]}干${fp[b].stem}相合，${ok ? "月令生助，合化成" + e : (supported ? "涉及日主，合而不化" : "月令不助，合而不化")}` });
        });
        const adj = items.map(i => Object.assign({}, i));
        combos.filter(c => c.ok).forEach(c => {
            if (c.set) adj.forEach(i => { if (i.kind === "hidden" && c.set.includes(fp[i.pillar].branch)) i.elem = c.elem; });
            else adj.forEach(i => { if (i.kind === "stem" && c.pillars.includes(i.pillar)) i.elem = c.elem; });
        });
        res.combos = combos;
        res.pctAdj = pctOf(adj);
        res.comboText = combos.length ? combos.map(c => c.text).join("；") : "無";

        // ④ 日主強弱
        const mE = fp.month.branchElem;
        const status = mE === dmE ? "旺" : D.GEN[mE] === dmE ? "相" : D.GEN[dmE] === mE ? "休" : D.OVER[dmE] === mE ? "囚" : "死";
        const deLing = (status === "旺" || status === "相");
        const lingScore = { 旺: 40, 相: 32, 休: 12, 囚: 8, 死: 4 }[status];
        const others = adj.filter(i => !(i.pillar === "month" && i.kind === "hidden") && !(i.pillar === "day" && i.kind === "stem"));
        const totalO = others.reduce((a, i) => a + i.w, 0);
        const helpO = others.filter(i => { const g = D.groupOfElem(dmE, i.elem); return g === "比劫" || g === "印星"; }).reduce((a, i) => a + i.w, 0);
        const score = Math.round(lingScore + 60 * helpO / totalO);
        const level = score >= 70 ? "身旺" : score >= 55 ? "身強" : score >= 45 ? (deLing ? "中和偏強" : "中和偏弱") : score >= 30 ? "身弱" : "身極弱";
        const isStrong = score >= 50;
        res.strength = { status, deLing, score, level, isStrong };

        // 十神群組比例（合會後）
        const grpPct = {}; D.GROUPS.forEach(g => grpPct[g] = 0);
        D.ELEMS.forEach(e => grpPct[D.groupOfElem(dmE, e)] += res.pctAdj[e]);
        res.groupPct = grpPct;

        // ⑤ 格局
        const tou = ["year", "month", "hour"].map(k => fp[k].stemIdx);
        const mh = fp.month.hidden;
        let pick = mh.find(h => tou.includes(h.stemIdx)), touchu = !!pick;
        if (!pick) pick = mh[0];
        let pname = pick.god === "比肩" ? "建祿格" : pick.god === "劫財" ? (dm % 2 === 0 ? "月刃格" : "月劫格") : pick.god + "格";
        res.pattern = { name: pname, god: pick.god, stem: pick.stem, touchu,
            text: touchu ? `月支${fp.month.branch}藏${pick.stem}，透於天干，取為${pname}。` : `月支${fp.month.branch}本氣${pick.stem}未透干，取月令本氣為${pname}。` };

        // ⑥ 用神喜忌
        let yong, xi, ji;
        if (!isStrong) {
            const top = ["官殺", "財星", "食傷"].sort((a, b) => grpPct[b] - grpPct[a])[0];
            if (top === "財星") { yong = "比劫"; xi = ["印星"]; } else { yong = "印星"; xi = ["比劫"]; }
            ji = ["官殺", "財星", "食傷"];
            res.yongWhy = top === "財星" ? "財星偏重而日主偏弱，取比劫幫身抗財。" : `${top}偏重而日主偏弱，取印星化${top === "官殺" ? "殺" : "洩"}生身。`;
        } else if (grpPct["印星"] > grpPct["比劫"]) {
            yong = "財星"; xi = ["食傷", "官殺"]; ji = ["印星", "比劫"]; res.yongWhy = "印星偏旺而日主強，取財星制印。";
        } else if (grpPct["官殺"] >= 8) {
            yong = "官殺"; xi = ["食傷", "財星"]; ji = ["比劫", "印星"]; res.yongWhy = "比劫偏旺而日主強，取官殺制劫。";
        } else {
            yong = "食傷"; xi = ["財星", "官殺"]; ji = ["比劫", "印星"]; res.yongWhy = "比劫偏旺而日主強，取食傷洩秀。";
        }
        const eOf = g => D.elemOfGroup(dmE, g);
        res.yong = { group: yong, elem: eOf(yong) };
        res.xi = xi.map(g => ({ group: g, elem: eOf(g) }));
        res.ji = ji.map(g => ({ group: g, elem: eOf(g) }));
        const val = {}; val[eOf(yong)] = 2; xi.forEach(g => val[eOf(g)] = 1); ji.forEach(g => val[eOf(g)] = -1);
        res.val = val;
        res.favElems = D.ELEMS.filter(e => val[e] > 0); res.badElems = D.ELEMS.filter(e => val[e] < 0);
        res.favText = res.favElems.join(""); res.badText = res.badElems.join("");
        res.summary = `${dmS}生${fp.month.branch}月，${dmE}${status}，${deLing ? "得令" : "失令"}，日主${level}（${score} 分）。局成${pname}，以${yong}為用神` +
            `，喜${xi.join("、")}，忌${ji.join("、")}；行運喜${res.favText}運，忌${res.badText}運。`;

        // ⑦ 運（流年）吉凶評斷
        const origStems = KEYS.map(k => fp[k].stem), origBranches = KEYS.map(k => fp[k].branch);
        const monthE0 = fp.month.branchElem;
        res.grade = function (stemIdx, branchIdx) {
            const notes = [];
            let se = D.STEM_ELEM[stemIdx];
            const sname = D.STEMS[stemIdx];
            for (const k of KEYS) { const e = D.stemHe(sname, fp[k].stem); if (e) { const ok = (monthE0 === e || D.GEN[monthE0] === e) && k !== "day"; if (ok) se = e; notes.push(`${sname}與${PILLAR_CN[k]}干${fp[k].stem}${ok ? "合化" + e : "合而不化"}`); break; } }
            const bname = D.BRANCHES[branchIdx];
            let be = D.HIDDEN[branchIdx][0][0]; be = D.STEM_ELEM[D.STEMS.indexOf(be)];
            let merged = false;
            for (const s of D.SAN_HE.concat(D.SAN_HUI)) {
                if (s.slice(0, 3).includes(bname) && s.slice(0, 3).filter(b => b !== bname).every(b => origBranches.includes(b))) { be = s[3]; notes.push(`${s.slice(0, 3).join("")}${D.SAN_HE.includes(s) ? "三合" : "三會"}${s[3]}局`); merged = true; break; }
            }
            if (!merged) for (const k of KEYS) { const e = D.branchHe(bname, fp[k].branch); if (e) { const ok = (monthE0 === e || D.GEN[monthE0] === e); if (ok) be = e; notes.push(`${bname}與${PILLAR_CN[k]}支${fp[k].branch}${ok ? "六合" + e : "相合而不化"}`); merged = true; break; } }
            const clashes = KEYS.filter(k => D.isClash(branchIdx, fp[k].branchIdx)).map(k => `沖${PILLAR_CN[k]}支${fp[k].branch}`);
            if (clashes.length) notes.push(`${bname}${clashes.join("、")}`);
            const v = (val[se] || 0) + (val[be] || 0);
            const label = v >= 3 ? "大吉" : v === 2 ? "吉" : v === 1 ? "吉多於凶" : v === 0 ? "平順" : v === -1 ? "凶多於吉" : "凶";
            const cls = v >= 2 ? "good" : v >= 0 ? "neutral" : "bad";
            const advice = v >= 3 ? "干支皆為喜用，運勢順遂，宜積極進取、把握機會。" : v === 2 ? "喜用得力，利於事業與財運推進。" :
                v === 1 ? "吉凶參半而偏吉，穩中求進。" : v === 0 ? "喜忌相抵，平穩度日，宜守成並累積實力。" :
                v === -1 ? "忌神略重，凡事宜保守謹慎，避免冒進。" : "忌神當道，宜靜守待時，注意健康、情緒與人際。";
            return { stemElem: se, branchElem: be, score: v, label, cls, advice, notes, stemVal: val[se] || 0, branchVal: val[be] || 0 };
        };
        return res;
    }

    // 稱骨男女命白話解說（依命重分級；為白話概述，非歌訣原文）
    const BONE_TIER = [
        [3.0, "命重偏輕", "男命：祖業助力有限，須白手起家，早年奔波勞碌，凡事親力親為；重在累積專業與信用，中晚年才漸見安定。", "女命：早年多操勞，婚姻與家庭運需用心經營；宜培養獨立謀生能力，不倚賴他人，日後自能安穩。"],
        [3.5, "命重中下", "男命：中年前辛苦打拚，財來財去，須慎防投機；肯踏實積累，四十歲後生活漸入佳境。", "女命：持家勤儉，早年辛勞，中年後家道漸穩；擇偶重品性，夫妻同心則漸有成。"],
        [4.0, "命重中等", "男命：衣食無憂，事業穩中有進，靠勤勉與人緣成事；宜守本分，不宜好高騖遠。", "女命：性情溫厚，持家有方，家庭和睦；中年後有貴人相助，生活安穩舒適。"],
        [4.5, "命重中上", "男命：事業有成，機會與貴人較多，中年運勢轉旺；能擔任主事或管理之責，須防應酬與過勞。", "女命：聰慧能幹，內外兼顧，常能助夫益子；婚後家運順遂，晚年福氣漸厚。"],
        [5.0, "命重偏上", "男命：福祿較佳，名利可期，易得長輩與上司提攜；宜謙和處世，守住既有成就。", "女命：福分深厚，家庭與事業皆能有所成就，受人敬重；需留意情緒，勿過度操心。"],
        [5.5, "命重上等", "男命：格局較大，能成就事業、獲得名望，一生較少大起大落；宜廣結善緣，以德行守福。", "女命：氣度大方，旺家助人，受家人倚重；晚年生活優渥，子女有成。"],
        [6.0, "命重甚重", "男命：富貴之格，能擔重任、掌權柄，責任亦重；宜持正守信，居安思危。", "女命：貴氣在身，有主見有威望，家業興旺；宜以柔濟剛，婚姻上多包容。"],
        [99, "命重極重", "男命：命格貴重，宜多行善積德，擔當要職而不失本心，福澤延及後代。", "女命：福澤深厚，晚景尊榮；宜謙和低調，廣種福田，則福氣長久。"]
    ];
    function bone(fp) {
        const ly = fp.lunar;
        const yj = D.jiazi(((ly.year - 4) % 10 + 10) % 10, ((ly.year - 4) % 12 + 12) % 12);
        const parts = { year: BONE_YEAR[yj], month: BONE_MONTH[ly.month - 1], day: BONE_DAY[ly.day - 1], hour: BONE_HOUR[fp.time.hourBranch] };
        const total = Math.round((parts.year + parts.month + parts.day + parts.hour) * 10) / 10;
        const liang = Math.floor(total + 1e-9), qian = Math.round((total - liang) * 10);
        const text = total < 3.0 ? "命重偏輕：早年多靠自力更生，起步較辛苦，宜以專業技能與穩定累積取勝，中晚年漸入佳境。"
            : total < 4.0 ? "命重中等：一生衣食無虞，中年後穩定發展，宜守本分、重人緣與口碑，努力可見成果。"
            : total < 5.0 ? "命重中上：福祿較佳，事業財運有成，貴人與機會較多，宜把握中年運勢。"
            : total < 6.0 ? "命重偏重：福厚運佳，名利兼收，宜謙虛處世、廣結善緣以守住福氣。" : "命重極重：命格貴重，宜多行善積德，擔當重任而不失本心。";
        const tier = BONE_TIER.find(t => total < t[0]);
        return { parts, total, liang, qian, label: `${liang}兩${qian ? qian + "錢" : ""}`, text, tierName: tier[1], male: tier[2], female: tier[3] };
    }

    function lifestyle(fp, an) {
        const fav = an.favElems, bad = an.badElems;
        const join = (map, es, sep) => es.map(e => map[e]).join(sep || "；");
        return {
            job: join(JOB, fav, "；"),
            nature: PATTERN_JOB[an.pattern.name] || "",
            dir: fav.map(e => DIR[e]).join("、"),
            color: fav.map(e => `${e}：${COLOR[e]}`).join("；"),
            num: fav.map(e => NUM[e]).join("、"),
            body: bad.map(e => `${e}（${BODY[e]}）`).join("；")
        };
    }

    return { analyze, bone, lifestyle, GAN_DESC, NAYIN_NOTE, KEYS, PILLAR_CN };
})();
