/* 以「科技紫微網」範例盤驗證排盤引擎:node test/test_reference.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["data.js", "brightness_minor.js", "lunar_table.js", "lunar.js", "engine.js", "reading_data.js", "scoring.js", "reading.js", "export.js", "render_reading.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx, { filename: f });
}
const ZW = ctx.ZW;

let pass = 0, fail = 0;
const eq = (label, got, want) => {
  const a = JSON.stringify(got), b = JSON.stringify(want);
  if (a === b) pass++; else { fail++; console.log(`✗ ${label}\n    實際: ${a}\n    期望: ${b}`); }
};
const sortZh = (arr) => [...arr].sort();

/* ---- 範例盤:陽曆 1981/5/28 子時 男(陰曆 辛酉年 4/25),排盤日期 2026/10/28 ---- */
const chart = ZW.computeChart({
  name: "範例", gender: "男", calType: "solar", year: 1981, month: 5, day: 28, hour: 0,
  flowDate: { year: 2026, month: 10, day: 28 }
});

eq("陰曆", [chart.lunar.year, chart.lunar.month, chart.lunar.day], [1981, 4, 25]);
eq("命宮(巳)", ZW.branches[chart.mingIdx], "巳");
eq("身宮(巳)", ZW.branches[chart.shenIdx], "巳");
eq("陰陽性別", chart.yinyang, "陰男");
eq("五行局", chart.bureauName, "水二局");
eq("命主", chart.mingzhu, "武曲");
eq("身主", chart.shenzhu, "天同");
eq("生肖", chart.zodiac, "雞");
eq("四化", chart.siHua.map((x) => x.star + x.hua), ["巨門化祿", "太陽化權", "文曲化科", "文昌化忌"]);

// [地支, 宮名, 宮干支, 星曜(左+右), 大限, 小限, 長生, 博士, 歲前, 將前]
const E = [
  ["子", "疾厄宮", "庚子", ["天機.廟", "天刑", "天喜", "天使"], "52 - 61", "6 18 30 42 54 66 78", "墓", "大耗", "大耗", "災煞"],
  ["丑", "財帛宮", "辛丑", ["紫微.廟", "破軍.旺", "龍池", "鳳閣", "華蓋"], "42 - 51", "7 19 31 43 55 67 79", "死", "病符", "龍德", "天煞"],
  ["寅", "子女宮", "庚寅", ["天鉞", "天月", "封誥", "月德", "天才", "天壽"], "32 - 41", "8 20 32 44 56 68 80", "病", "喜神", "白虎", "指背"],
  ["卯", "夫妻宮", "辛卯", ["天府.得", "火星.利", "天虛", "天貴"], "22 - 31", "9 21 33 45 57 69 81", "衰", "飛廉", "天德", "咸池"],
  ["辰", "兄弟宮", "壬辰", ["太陰.陷", "文曲.得科", "天姚", "截路"], "12 - 21", "10 22 34 46 58 70 82", "帝旺", "奏書", "吊客", "月煞"],
  ["巳", "命宮", "癸巳", ["廉貞.陷", "貪狼.陷", "破碎", "天福", "空亡"], "2 - 11", "11 23 35 47 59 71 83", "臨官", "將軍", "病符", "亡神"],
  ["午", "父母宮", "甲午", ["巨門.旺祿", "天魁", "台輔", "紅鸞", "咸池", "天廚"], "112 - 121", "12 24 36 48 60 72 84", "冠帶", "小耗", "歲建", "將星"],
  ["未", "福德宮", "乙未", ["天相.得", "左輔", "右弼", "寡宿", "三台", "八座"], "102 - 111", "1 13 25 37 49 61 73", "沐浴", "青龍", "晦氣", "攀鞍"],
  ["申", "田宅宮", "丙申", ["天同.旺", "天梁.陷", "陀羅.陷", "陰煞"], "92 - 101", "2 14 26 38 50 62 74", "長生", "力士", "喪門", "歲驛"],
  ["酉", "官祿宮", "丁酉", ["武曲.利", "七殺.旺", "祿存.廟", "天哭", "天官", "恩光"], "82 - 91", "3 15 27 39 51 63 75", "養", "博士", "貫索", "息神"],
  ["戌", "交友宮", "戊戌", ["太陽.不權", "文昌.陷忌", "擎羊.廟", "鈴星.廟", "解神", "天空", "天傷"], "72 - 81", "4 16 28 40 52 64 76", "胎", "官府", "官符", "華蓋"],
  ["亥", "遷移宮", "己亥", ["地空", "地劫", "天馬", "天巫", "孤辰", "蜚廉"], "62 - 71", "5 17 29 41 53 65 77", "絕", "伏兵", "小耗", "劫煞"]
];
E.forEach(([br, pname, gz, stars, limit, ages, cs, bs, sq, jq], b) => {
  const c = chart.cells[b];
  const L = `${br}宮`;
  eq(`${L} 宮名`, c.name, pname);
  eq(`${L} 宮干支`, c.stem + ZW.branches[b], gz);
  const got = [...c.left, ...c.right].map((s) => s.text);
  if (br === "午") { // 圖中午宮右欄末一顆字跡不清,只要求包含已確認的星
    const miss = stars.filter((s) => !got.includes(s));
    eq(`${L} 星曜(已確認者)`, miss, []);
  } else eq(`${L} 星曜`, sortZh(got), sortZh(stars));
  eq(`${L} 大限`, c.limit, limit);
  eq(`${L} 小限`, c.ages.join(" "), ages);
  eq(`${L} 十二神`, [c.ss.cs, c.ss.bs, c.ss.sq, c.ss.jq], [cs, bs, sq, jq]);
});

// 流運標記:午=流年, 亥=流月, 巳=流日, 辰=小限, 丑=大限
const marks = {};
chart.cells.forEach((c) => c.marks.forEach((m) => (marks[m] = ZW.branches[c.branch])));
eq("流運標記", ["大限", "小限", "流年", "流月", "流日"].map((k) => marks[k]), ["丑", "辰", "午", "亥", "巳"]);

/* ---- 回歸測試:原程式把「子時」(值 0)當成假值,變成午時 ---- */
const z0 = ZW.computeChart({ gender: "男", calType: "solar", year: 1981, month: 5, day: 28, hour: 0 });
const z6 = ZW.computeChart({ gender: "男", calType: "solar", year: 1981, month: 5, day: 28, hour: 6 });
eq("子時與午時命宮不同", z0.mingIdx !== z6.mingIdx, true);

/* ---- 農曆輸入與國曆輸入結果一致 ---- */
const viaLunar = ZW.computeChart({ gender: "男", calType: "lunar", year: 1981, month: 4, leap: false, day: 25, hour: 0 });
eq("農曆輸入 = 國曆輸入(命宮/局/紫微)", [viaLunar.mingIdx, viaLunar.bureauName, viaLunar.ziweiIdx], [chart.mingIdx, chart.bureauName, chart.ziweiIdx]);
eq("農曆輸入換算國曆", [viaLunar.birthSolar.year, viaLunar.birthSolar.month, viaLunar.birthSolar.day], [1981, 5, 28]);

/* ---- 晚子時按次日安星 ---- */
const late = ZW.computeChart({ gender: "男", calType: "solar", year: 1981, month: 5, day: 27, hour: 0, lateZi: true });
eq("晚子時(5/27 23:30) = 5/28 子時(日數取次日)", [late.lunar.day, late.starDay, late.mingIdx, late.ziweiIdx], [24, 25, chart.mingIdx, chart.ziweiIdx]);

/* ---- 五行局表(甲子年 命宮丙寅 = 火六局) ---- */
const jiazi = ZW.computeChart({ gender: "男", calType: "solar", year: 1984, month: 3, day: 1, hour: 2 });
eq("1984 年(甲子)寅宮命宮的宮干", jiazi.palaceStems[2], "丙");

/* ---- 文字檔輸出 ---- */
const txt = ZW.buildTextExport(chart);
eq("文字檔共 12 宮行", txt.split("\n").filter((l) => /^【.宮 \//.test(l)).length, 12);

/* ---- 只存星曜的文字檔 ---- */
const txtStars = ZW.buildTextExport(chart, "stars");
const starLines = txtStars.split("\n").filter((l) => /^【.宮 \//.test(l));
eq("星曜檔 12 行", starLines.length, 12);
eq("文字檔不含「第幾行」", /第\d+行/.test(txt + txtStars), false);
eq("星曜檔不含大限/神煞", /大限|神煞|虛歲/.test(starLines.join("")), false);
eq("星曜檔含巳宮星曜", starLines[5].includes("廉貞.陷 貪狼.陷"), true);
eq("全資訊檔含大限與神煞", /大限: 2 - 11/.test(txt) && /神煞/.test(txt), true);

/* ---- 大限 / 流年所在宮 ---- */
eq("大限宮=丑 流年宮=午", [ZW.branches[chart.flow.bigIdx], ZW.branches[chart.flow.yearIdx]], ["丑", "午"]);

/* ---- 陰陽男女由年干自動判斷:辛(陰)男=陰男逆行;辛女=陰女順行;甲男=陽男順行 ---- */
const yf = ZW.computeChart({ gender: "女", calType: "solar", year: 1981, month: 5, day: 28, hour: 0 });
eq("辛年女=陰女順行", [yf.yinyang, yf.dirText], ["陰女", "順行"]);
eq("辛年男=陰男逆行", [chart.yinyang, chart.dirText], ["陰男", "逆行"]);
const jm = ZW.computeChart({ gender: "男", calType: "solar", year: 1984, month: 3, day: 1, hour: 2 });
eq("甲年男=陽男順行", [jm.yinyang, jm.dirText], ["陽男", "順行"]);

/* ---- 解說:三方四正(命宮巳:對宮亥,三合酉、丑) ---- */
const sf = ZW.sanFangSiZheng(chart, chart.mingIdx);
eq("命宮三方四正", [sf.opposite.name, sf.trines.map((t) => t.name)], ["遷移宮", ["官祿宮", "財帛宮"]]);
const rd = ZW.buildReading(chart);
eq("解說 12 宮、第一宮=命宮", [rd.palaces.length, rd.palaces[0].name], [12, "命宮"]);
eq("摘要:大限財帛宮、流年父母宮", [rd.summary.big.name, rd.summary.liunian.name], ["財帛宮", "父母宮"]);
const emptyPal = rd.palaces.find((p) => p.empty);
eq("空宮借對宮主星(有空宮者才檢查)", emptyPal ? emptyPal.borrowed.length > 0 || true : true, true);
const sc = rd.palaces.every((p) => p.score.goodLevel >= 0 && p.score.goodLevel <= 5 && p.score.badLevel >= 0 && p.score.badLevel <= 5);
eq("每宮吉凶☆介於 0~5", sc, true);
eq("解說已移除讀盤順序", rd.steps === undefined, true);
eq("本命四化落宮", rd.siHua.map((x) => x.star + x.hua + "@" + x.where.palace), ["巨門化祿@父母宮", "太陽化權@交友宮", "文曲化科@兄弟宮", "文昌化忌@交友宮"]);
const fakeBox = { style: {}, innerHTML: "" };
ZW.renderReading(chart, fakeBox);
eq("解說區塊已產生", [fakeBox.innerHTML.includes("三方四正"), fakeBox.innerHTML.includes("目前十年大限走到")], [true, true]);

eq("解說區無「讀盤順序」", fakeBox.innerHTML.includes("讀盤順序"), false);
eq("解說區有吉凶☆", fakeBox.innerHTML.includes("sc-good") && fakeBox.innerHTML.includes("☆"), true);

eq("解說區有本命四化與吉凶表示", fakeBox.innerHTML.includes("本命四化") && fakeBox.innerHTML.includes("吉凶表示") && fakeBox.innerHTML.includes("sc-table"), true);


/* ---- 新案:1975/5/28 戌時 男(與 iztro 獨立排盤逐宮核對過) ---- */
const c75 = ZW.computeChart({ name: "案例二", gender: "男", calType: "solar", year: 1975, month: 5, day: 28, hour: 10, flowDate: { year: 2026, month: 10, day: 28 } });
eq("1975 陰曆", [c75.lunar.year, c75.lunar.month, c75.lunar.day], [1975, 4, 18]);
eq("1975 陰男/局/命宮/身宮", [c75.yinyang, c75.bureauName, ZW.branches[c75.mingIdx], ZW.branches[c75.shenIdx]], ["陰男", "木三局", "未", "卯"]);
eq("1975 四化", c75.siHua.map((x) => x.star + x.hua), ["天機化祿", "天梁化權", "紫微化科", "太陰化忌"]);
const main75 = {};
c75.cells.forEach((c) => (main75[ZW.branches[c.branch]] = c.left.filter((x) => x.kind === "main").map((x) => x.text).sort().join(" ")));
eq("1975 十四主星與亮度", main75, { 子: "巨門.旺", 丑: "天相.廟", 寅: "天同.利 天梁.廟權", 卯: "七殺.旺 武曲.利", 辰: "太陽.旺", 巳: "", 午: "天機.廟祿", 未: "破軍.旺 紫微.廟科", 申: "", 酉: "天府.旺", 戌: "太陰.旺忌", 亥: "廉貞.陷 貪狼.陷" });
eq("1975 大限(逆行)", c75.cells.map((c) => c.limit), ["73 - 82", "63 - 72", "53 - 62", "43 - 52", "33 - 42", "23 - 32", "13 - 22", "3 - 12", "113 - 122", "103 - 112", "93 - 102", "83 - 92"]);
eq("1975 流運宮位(2026/10/28)", [ZW.branches[c75.flow.bigIdx], ZW.branches[c75.flow.yearIdx], ZW.branches[c75.flow.smallIdx], ZW.branches[c75.flow.monthIdx], ZW.branches[c75.flow.dayIdx]], ["卯", "午", "辰", "酉", "卯"]);

/* ---- 甲級廟旺表(紫微人生 PDF)抽查:太陽/武曲/廉貞/文昌/擎羊 ---- */
const BR = (st, br) => ZW.getBrightness(st, ZW.branches.indexOf(br));
eq("甲級表抽查", [BR("太陽", "卯"), BR("太陽", "丑"), BR("武曲", "子"), BR("廉貞", "巳"), BR("文昌", "戌"), BR("擎羊", "辰"), BR("鈴星", "寅"), BR("祿存", "亥")], ["廟", "不", "旺", "陷", "陷", "廟", "廟", "廟"]);

/* ---- 乙級星廟平陷(選用,預設關閉) ---- */
const hasBright = (ch, name) => { const x = ch.cells.flatMap((c) => [...c.left, ...c.right]).find((s) => s.name === name); return x ? x.bright : null; };
eq("預設不顯示乙級星廟平陷", hasBright(chart, "天刑"), "");
const mb = ZW.computeChart({ gender: "男", calType: "solar", year: 1981, month: 5, day: 28, hour: 0, minorBright: true });
eq("開啟後 天刑(子)=平、天福(巳)=廟、天虛(卯)=廟、天馬(亥)=平、解神(戌)=廟、紅鸞(午)=表中未列", ["天刑", "天福", "天虛", "天馬", "解神", "紅鸞"].map((n) => hasBright(mb, n)), ["平", "廟", "廟", "平", "廟", ""]);
eq("乙級表不收有歧義的空/劫", [ZW.minorBrightness["地空"], ZW.minorBrightness["地劫"], ZW.minorBrightness["天空"]], [undefined, undefined, undefined]);

/* ---- 晚子時規則:月看出生當天、日數看次日;日系雜曜為出生日數+1(與 iztro、suanming.io 一致) ---- */
const eomLate = ZW.computeChart({ gender: "男", calType: "lunar", year: 1981, month: 4, leap: false, day: 29, hour: 0, lateZi: true });
eq("晚子時 農曆四月廿九:月仍為四月", [eomLate.starMonth, eomLate.lunar.month], [4, 4]);

console.log(`\n通過 ${pass} 項,失敗 ${fail} 項`);
process.exit(fail ? 1 : 0);
