/* ============================================================
 * 模組五：紫微斗數排盤（命宮、五行局、星曜安星、四化、大限、十二神）
 * ============================================================ */
const Ziwei = (function () {
    const { STEMS, BRANCHES } = Data;
    const mod = n => ((n % 12) + 12) % 12;
    const PALACE = ["命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄", "遷移", "交友", "官祿", "田宅", "福德", "父母"];
    const bi = c => BRANCHES.indexOf(c);

    // 主星廟旺利陷（子→亥）
    const BRIGHT = {
        紫微: "平廟旺旺得旺廟廟旺旺得旺", 天機: "廟陷得旺利平廟陷得旺利平", 太陽: "陷不旺廟旺旺旺得得平不陷",
        武曲: "旺廟得利廟平旺廟得利廟平", 天同: "旺不利平平廟陷不旺平平廟", 廉貞: "平利廟平利陷平利廟平利陷",
        天府: "廟廟廟得廟得旺廟得旺廟得", 太陰: "廟廟旺陷陷陷不不利旺旺廟", 貪狼: "旺廟平利廟陷旺廟平利廟陷",
        巨門: "旺不廟廟陷旺旺不廟廟陷旺", 天相: "廟廟廟陷得得廟得廟陷得得", 天梁: "廟旺廟廟廟陷廟旺陷得廟陷",
        七殺: "旺廟廟旺廟平旺廟廟旺廟平", 破軍: "廟旺得陷旺平廟旺得陷旺平",
        文昌: "得廟陷利得廟陷利得廟陷利", 文曲: "得廟平旺得廟陷旺得廟陷旺",
        火星: "陷得廟利陷得廟利陷得廟利", 鈴星: "陷得廟利陷得廟利陷得廟利",
        擎羊: "陷廟陷陷廟陷陷廟陷陷廟陷", 陀羅: "陷廟陷陷廟陷陷廟陷陷廟陷", 祿存: "廟廟廟廟廟廟廟廟廟廟廟廟",
        // 乙級星（廟/平/陷；"-" 表示該宮未列等級）
        解神: "廟-廟廟廟-廟---廟-",
        天刑: "平陷廟廟平平平陷平廟廟平",
        天姚: "平陷平廟平平平陷平廟廟廟",
        地劫: "陷陷平平廟平-平-平平陷",
        天傷: "陷--陷陷-陷陷----",
        地空: "陷廟廟陷陷廟廟陷陷廟廟陷",
        天哭: "-廟-廟----廟---",
        天虛: "-廟-廟----廟---",
        紅鸞: "-廟廟廟廟-----廟廟",
        天喜: "-廟廟廟廟-----廟廟",
        天馬: "--廟--平--廟--平",
        天官: "--廟--廟--廟---",
        天福: "--廟--廟--廟---",
        天使: "-陷-陷陷----陷陷-"
    };
    const MAIN_STARS = ["紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍"];
    const HUA = {   // 生年四干：[祿, 權, 科, 忌]
        甲: ["廉貞", "破軍", "武曲", "太陽"], 乙: ["天機", "天梁", "紫微", "太陰"], 丙: ["天同", "天機", "文昌", "廉貞"],
        丁: ["太陰", "天同", "天機", "巨門"], 戊: ["貪狼", "太陰", "右弼", "天機"], 己: ["武曲", "貪狼", "天梁", "文曲"],
        庚: ["太陽", "武曲", "太陰", "天同"], 辛: ["巨門", "太陽", "文曲", "文昌"], 壬: ["天梁", "紫微", "左輔", "武曲"],
        癸: ["破軍", "巨門", "太陰", "貪狼"]
    };
    const HUA_NAME = ["祿", "權", "科", "忌"];
    const CHANGSHENG = ["長生", "沐浴", "冠帶", "臨官", "帝旺", "衰", "病", "死", "墓", "絕", "胎", "養"];
    const BOSHI = ["博士", "力士", "青龍", "小耗", "將軍", "奏書", "飛廉", "喜神", "病符", "大耗", "伏兵", "官府"];
    const SUIQIAN = ["歲建", "晦氣", "喪門", "貫索", "官符", "小耗", "大耗", "龍德", "白虎", "天德", "弔客", "病符"];
    const JIANGQIAN = ["將星", "攀鞍", "歲驛", "息神", "華蓋", "劫煞", "災煞", "天煞", "指背", "咸池", "月煞", "亡神"];
    const MING_ZHU = ["貪狼", "巨門", "祿存", "文曲", "廉貞", "武曲", "破軍", "武曲", "廉貞", "文曲", "祿存", "巨門"];
    const SHEN_ZHU = ["火星", "天相", "天梁", "天同", "文昌", "天機", "火星", "天相", "天梁", "天同", "文昌", "天機"];
    const MAIN_NOTE = {
        紫微: "尊貴領導、重名望", 天機: "聰明機變、善謀略", 太陽: "熱情外放、重名聲", 武曲: "剛毅務實、主財星",
        天同: "溫和享福、隨緣", 廉貞: "感情複雜、公關能力強", 天府: "穩重保守、庫星", 太陰: "細膩內斂、重不動產",
        貪狼: "多才多藝、慾望強", 巨門: "口才分析、是非多", 天相: "輔佐協調、重形象", 天梁: "清高蔭庇、長者緣",
        七殺: "將星果決、衝勁強", 破軍: "開創變動、破舊立新"
    };
    function grp(y) { // 年支分組：0=寅午戌 1=申子辰 2=巳酉丑 3=亥卯未
        if ([2, 6, 10].includes(y)) return 0;
        if ([8, 0, 4].includes(y)) return 1;
        if ([5, 9, 1].includes(y)) return 2;
        return 3;
    }

    function ziweiPos(day, ju) {
        let x = 0; while ((day + x) % ju !== 0) x++;
        const q = (day + x) / ju;
        const pos = 2 + (q - 1);
        return mod(x % 2 === 1 ? pos - x : pos + x);
    }

    function compute(z) {
        const L = z.lunar, h = z.hourBranch, d = L.day, male = z.male;
        const yS = ((L.year - 4) % 10 + 10) % 10, yB = ((L.year - 4) % 12 + 12) % 12;
        let m = L.month; if (L.leap && L.day > 15) m = m % 12 + 1;     // 閏月十五日後算下月
        const life = mod(2 + (m - 1) - h), body = mod(2 + (m - 1) + h);
        const yinStem = [2, 4, 6, 8, 0][yS % 5];                       // 五虎遁：寅宮天干
        const stemAt = b => (yinStem + mod(b - 2)) % 10;
        const lifeJz = Data.jiazi(stemAt(life), life);
        const ju = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 }[Data.nayinElem(lifeJz)];
        const juName = Data.nayinElem(lifeJz) + ju + "局";
        const fwd = (yS % 2 === 0) === male;                            // 陽男陰女順行

        const cells = [];
        for (let b = 0; b < 12; b++) cells.push({ branchIdx: b, branch: BRANCHES[b], stem: STEMS[stemAt(b)], gz: STEMS[stemAt(b)] + BRANCHES[b],
            name: PALACE[mod(life - b)], main: [], minor: [], isLife: b === life, isBody: b === body, isOrigin: false });
        // 來因宮：宮干與生年干相同之宮（寅、卯在子、丑之前取先者）
        let origin = -1; for (let k = 2; k < 14 && origin < 0; k++) if (stemAt(mod(k)) === yS) origin = mod(k);
        cells[origin].isOrigin = true;
        const hua = HUA[STEMS[yS]];
        const huaOf = n => { const i = hua.indexOf(n); return i < 0 ? "" : HUA_NAME[i]; };
        const put = (n, b, kind) => { b = mod(b); const c = cells[b]; const o = { n, hua: huaOf(n), kind };
            if (kind === "main") { o.br = BRIGHT[n] ? BRIGHT[n][b] : ""; c.main.push(o); } else { if (BRIGHT[n] && BRIGHT[n][b] && BRIGHT[n][b] !== "-") o.br = BRIGHT[n][b]; c.minor.push(o); } return b; };

        // ---- 十四主星 ----
        const zw = ziweiPos(d, ju), tf = mod(4 - zw);
        [["紫微", 0], ["天機", -1], ["太陽", -3], ["武曲", -4], ["天同", -5], ["廉貞", -8]].forEach(([n, o]) => put(n, zw + o, "main"));
        [["天府", 0], ["太陰", 1], ["貪狼", 2], ["巨門", 3], ["天相", 4], ["天梁", 5], ["七殺", 6], ["破軍", 10]].forEach(([n, o]) => put(n, tf + o, "main"));

        // ---- 六吉 ----
        const zuo = put("左輔", 4 + (m - 1), "good"), you = put("右弼", 10 - (m - 1), "good");
        const chang = put("文昌", 10 - h, "good"), qu = put("文曲", 4 + h, "good");
        const KUI = { 甲: [1, 7], 戊: [1, 7], 庚: [1, 7], 乙: [0, 8], 己: [0, 8], 丙: [11, 9], 丁: [11, 9], 壬: [3, 5], 癸: [3, 5], 辛: [6, 2] }[STEMS[yS]];
        put("天魁", KUI[0], "good"); put("天鉞", KUI[1], "good");
        // ---- 六煞、祿存、天馬 ----
        const lu = put("祿存", [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][yS], "good");
        put("擎羊", lu + 1, "bad"); put("陀羅", lu - 1, "bad");
        const g = grp(yB);
        const huoStart = [1, 2, 3, 9][g], lingStart = [3, 10, 10, 10][g];
        put("火星", huoStart + h, "bad"); put("鈴星", lingStart + h, "bad");
        put("地空", 11 - h, "bad"); put("地劫", 11 + h, "bad");
        put("天馬", [8, 2, 11, 5][g], "misc");
        // ---- 雜曜 ----
        const hong = mod(3 - yB); put("紅鸞", hong, "misc"); put("天喜", hong + 6, "misc");
        put("天刑", 9 + (m - 1), "misc"); put("天姚", 1 + (m - 1), "misc");
        put("天哭", 6 - yB, "misc"); put("天虛", 6 + yB, "misc");
        put("龍池", 4 + yB, "misc"); put("鳳閣", 10 - yB, "misc");
        const gu = [[2, 10], [5, 1], [8, 4], [11, 7]][[11, 0, 1].includes(yB) ? 0 : [2, 3, 4].includes(yB) ? 1 : [5, 6, 7].includes(yB) ? 2 : 3];
        put("孤辰", gu[0], "misc"); put("寡宿", gu[1], "misc");
        put("華蓋", [10, 4, 1, 7][g], "misc"); put("咸池", [3, 9, 6, 0][g], "misc");
        put("三台", zuo + d - 1, "misc"); put("八座", you - (d - 1), "misc");
        put("恩光", chang + d - 2, "misc"); put("天貴", qu + d - 2, "misc");
        put("台輔", 6 + h, "misc"); put("封誥", 2 + h, "misc");
        put("天才", life + yB, "misc"); put("天壽", body + yB, "misc");
        put("天空", yB + 1, "misc");
        put("天官", [7, 4, 5, 2, 3, 9, 11, 9, 10, 6][yS], "misc");
        put("天福", [9, 8, 0, 11, 3, 2, 6, 5, 6, 5][yS], "misc");
        put("天廚", [5, 6, 0, 5, 6, 8, 2, 6, 9, 11][yS], "misc");
        put("天月", [10, 5, 4, 2, 7, 3, 11, 7, 2, 6, 10, 2][m - 1], "misc");
        put("天巫", [5, 8, 2, 11, 5, 8, 2, 11, 5, 8, 2, 11][m - 1], "misc");
        put("陰煞", [2, 0, 10, 8, 6, 4, 2, 0, 10, 8, 6, 4][m - 1], "misc");
        put("年解", 10 - yB, "misc");
        put("解神", [8, 8, 10, 10, 0, 0, 2, 2, 4, 4, 6, 6][m - 1], "misc");
        put("蜚廉", [8, 9, 10, 5, 6, 7, 2, 3, 4, 11, 0, 1][yB], "misc");
        put("破碎", [0, 6, 3, 9].includes(yB) ? 5 : [4, 10, 1, 7].includes(yB) ? 1 : 9, "misc");
        const pairs = [[8, 9], [6, 7], [4, 5], [2, 3], [0, 1]][yS % 5];
        put("截路", pairs[0], "misc"); put("空亡", pairs[1], "misc");
        put("天德", 9 + yB, "misc"); put("月德", 5 + yB, "misc");
        put("天傷", cells.findIndex(c => c.name === "交友"), "misc");
        put("天使", cells.findIndex(c => c.name === "疾厄"), "misc");

        // ---- 大限、小限、十二神 ----
        const refB = mod(z.refYear - 4);                                  // 流年支
        const xStart = [4, 10, 7, 1][g];
        const csStart = { 2: 8, 5: 8, 3: 11, 4: 5, 6: 2 }[ju];
        const jqStart = [6, 0, 9, 3][grp(refB)];
        cells.forEach((c, b) => {
            const k = fwd ? mod(b - life) : mod(life - b);
            c.daxian = [ju + 10 * k, ju + 10 * k + 9];
            const a0 = (male ? mod(b - xStart) : mod(xStart - b)) + 1;
            c.xiaoxian = Array.from({ length: 7 }, (_, i) => a0 + 12 * i);
            c.changsheng = CHANGSHENG[fwd ? mod(b - csStart) : mod(csStart - b)];
            c.boshi = BOSHI[fwd ? mod(b - lu) : mod(lu - b)];
            c.suiqian = SUIQIAN[mod(b - refB)];
            c.jiangqian = JIANGQIAN[mod(b - jqStart)];
            c.huaList = [];
        });
        hua.forEach((n, i) => {
            cells.forEach(c => c.main.concat(c.minor).forEach(s => { if (s.n === n) c.huaList.push(n + "化" + HUA_NAME[i]); }));
        });

        // 目前歲數 (虛歲) 與標記
        const nowAge = z.refYear - L.year + 1;
        cells.forEach((c, b) => {
            c.flowYear = (b === refB);
            c.curDaxian = nowAge >= c.daxian[0] && nowAge <= c.daxian[1];
            c.curXiaoxian = (b === (male ? mod(xStart + nowAge - 1) : mod(xStart - (nowAge - 1))));
        });
        let laiyin = null;
        for (let b0 = 2; b0 < 14 && !laiyin; b0++) { const bb = mod(b0); if (stemAt(bb) === yS) laiyin = { branchIdx: bb, gz: STEMS[stemAt(bb)] + BRANCHES[bb], name: cells[bb].name }; }
        return { laiyin, lunar: L, monthUsed: m, hourBranch: h, life, body, ju, juName, fwd, male, yearStem: STEMS[yS], yearBranch: BRANCHES[yB],
            yangYear: yS % 2 === 0, zodiac: Data.ZODIAC[yB], ziweiAt: zw, tianfuAt: tf, mingzhu: MING_ZHU[life], shenzhu: SHEN_ZHU[yB],
            hua: hua.map((n, i) => n + "化" + HUA_NAME[i]), origin, originName: cells[origin].name, birthMonth: m, cells, nowAge, refB, lifeStem: STEMS[stemAt(life)] };
    }


    // 三方四正：本宮、對宮、財帛(+4)、官祿(+8)
    function sanfang(zw, b) { return [b, mod(b + 6), mod(b + 4), mod(b + 8)].map(i => zw.cells[i]); }
    return { compute, sanfang, PALACE, MAIN_NOTE, MAIN_STARS, HUA, HUA_NAME, mod };
})();
