/* data.js — 基礎資料表：天干地支、五行、藏干、納音、十神、十二長生、合沖
 * （演算法移植自參考程式 index.html，維持與該程式相同的排盤結果） */
(function (g) {
  const PA = g.PA = g.PA || {};
const Data = (function () {
    const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const ZODIAC = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];
    const STEM_ELEM = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
    const BRANCH_ELEM = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];
    const ELEMS = ["木", "火", "土", "金", "水"];
    const GEN = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };   // 相生
    const OVER = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };  // 相剋

    // 地支藏干 [天干, 權重%]（本氣、中氣、餘氣）
    const HIDDEN = [
        [["癸", 100]],
        [["己", 60], ["癸", 30], ["辛", 10]],
        [["甲", 60], ["丙", 30], ["戊", 10]],
        [["乙", 100]],
        [["戊", 60], ["乙", 30], ["癸", 10]],
        [["丙", 60], ["戊", 30], ["庚", 10]],
        [["丁", 70], ["己", 30]],
        [["己", 60], ["丁", 30], ["乙", 10]],
        [["庚", 60], ["壬", 30], ["戊", 10]],
        [["辛", 100]],
        [["戊", 60], ["辛", 30], ["丁", 10]],
        [["壬", 70], ["甲", 30]]
    ];

    const NAYIN = ["海中金", "爐中火", "大林木", "路旁土", "劍鋒金", "山頭火", "澗下水", "城頭土", "白蠟金", "楊柳木",
        "泉中水", "屋上土", "霹靂火", "松柏木", "長流水", "沙中金", "山下火", "平地木", "壁上土", "金箔金",
        "覆燈火", "天河水", "大驛土", "釵釧金", "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水"];

    // 六十甲子序號
    function jiazi(stemIdx, branchIdx) {
        for (let n = stemIdx; n < 60; n += 10) if (n % 12 === branchIdx) return n;
        return -1;
    }
    const jiaziName = n => STEMS[n % 10] + BRANCHES[n % 12];
    const nayinOf = n => NAYIN[Math.floor(n / 2)];
    const nayinElem = n => NAYIN[Math.floor(n / 2)].slice(-1);

    // 十神（七殺依通行排盤稱「偏官」）
    function tenGod(dmIdx, tIdx) {
        const de = STEM_ELEM[dmIdx], te = STEM_ELEM[tIdx];
        const same = (dmIdx % 2) === (tIdx % 2);
        if (de === te) return same ? "比肩" : "劫財";
        if (GEN[de] === te) return same ? "食神" : "傷官";
        if (OVER[de] === te) return same ? "偏財" : "正財";
        if (OVER[te] === de) return same ? "偏官" : "正官";
        return same ? "偏印" : "正印";   // GEN[te] === de
    }
    const GOD_GROUP = { 比肩: "比劫", 劫財: "比劫", 食神: "食傷", 傷官: "食傷", 偏財: "財星", 正財: "財星", 偏官: "官殺", 正官: "官殺", 偏印: "印星", 正印: "印星" };
    const GROUPS = ["比劫", "印星", "食傷", "財星", "官殺"];
    // 某五行相對日主五行屬於哪一類十神
    function groupOfElem(dmElem, e) {
        if (e === dmElem) return "比劫";
        if (GEN[dmElem] === e) return "食傷";
        if (OVER[dmElem] === e) return "財星";
        if (OVER[e] === dmElem) return "官殺";
        return "印星";
    }
    function elemOfGroup(dmElem, g) {
        return ELEMS.find(e => groupOfElem(dmElem, e) === g);
    }

    // 十二長生
    const STAGES = ["長生", "沐浴", "冠帶", "臨官", "帝旺", "衰", "病", "死", "墓", "絕", "胎", "養"];
    const STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];  // 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯
    function stageOf(stemIdx, branchIdx) {
        const s = STAGE_START[stemIdx];
        const k = (stemIdx % 2 === 0) ? (branchIdx - s + 12) % 12 : (s - branchIdx + 12) % 12;
        return STAGES[k];
    }

    // 干合、支合、支沖、三合、三會
    const STEM_HE = { 甲己: "土", 乙庚: "金", 丙辛: "水", 丁壬: "木", 戊癸: "火" };
    function stemHe(a, b) {
        const k1 = a + b, k2 = b + a;
        return STEM_HE[k1] || STEM_HE[k2] || null;
    }
    const BRANCH_HE6 = { 子丑: "土", 寅亥: "木", 卯戌: "火", 辰酉: "金", 巳申: "水", 午未: "火" };
    function branchHe(a, b) { return BRANCH_HE6[a + b] || BRANCH_HE6[b + a] || null; }
    const isClash = (a, b) => Math.abs(a - b) === 6;
    const SAN_HE = [["申", "子", "辰", "水"], ["亥", "卯", "未", "木"], ["寅", "午", "戌", "火"], ["巳", "酉", "丑", "金"]];
    const SAN_HUI = [["寅", "卯", "辰", "木"], ["巳", "午", "未", "火"], ["申", "酉", "戌", "金"], ["亥", "子", "丑", "水"]];

    const ELEM_COLOR = { 木: "#2e7d32", 火: "#c62828", 土: "#8d6e00", 金: "#9a7b00", 水: "#1565c0" };

    return { STEMS, BRANCHES, ZODIAC, STEM_ELEM, BRANCH_ELEM, ELEMS, GEN, OVER, HIDDEN, NAYIN,
        jiazi, jiaziName, nayinOf, nayinElem, tenGod, GOD_GROUP, GROUPS, groupOfElem, elemOfGroup,
        STAGES, stageOf, stemHe, branchHe, isClash, SAN_HE, SAN_HUI, ELEM_COLOR };
})();
  Object.assign(PA, { Data });
})(typeof window !== 'undefined' ? window : globalThis);
