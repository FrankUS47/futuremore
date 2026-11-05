/* 與獨立的 iztro 程式庫大量對照(選用工具,需先 `npm install iztro`)
   用法: node test/compare_iztro.js [張數,預設 3000]
   比對項目:五行局、命宮/身宮、命主身主、四化、十四主星+亮度、六吉六煞、雜曜、大限、長生/博士十二神。
   已知且刻意的差異:
   1. iztro 另外有「天德、旬空、年解」三顆星,本程式不排(範例盤也沒有)。
   2. 「閏月下半月 + 晚子時」iztro 明文不進位到次月,本程式依 suanming.io 一律進位,該組合略過比對。 */
const fs = require("fs"), vm = require("vm"), path = require("path");
let astro;
try { ({ astro } = require("iztro")); } catch (e) { console.error("請先在專案資料夾執行: npm install iztro"); process.exit(2); }

const ctx = { console }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ["data.js", "brightness_minor.js", "lunar_table.js", "lunar.js", "engine.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx);
const ZW = ctx.ZW, B = ZW.branches;

const N = parseInt(process.argv[2], 10) || 3000;
let seed = 20261102; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const IZONLY = new Set(["天德", "旬空", "年解"]);
const AUX = new Set(["左輔", "右弼", "文昌", "文曲", "天魁", "天鉞", "祿存", "擎羊", "陀羅", "火星", "鈴星", "地空", "地劫", "天馬"]);
const MAIN = new Set(ZW.mainStars);
let bad = 0, skipped = 0; const fails = {};
const fail = (k, msg) => { fails[k] = (fails[k] || 0) + 1; if (fails[k] <= 3) console.log("✗", k, msg); bad++; };

for (let i = 0; i < N; i++) {
  const gender = rnd() < 0.5 ? "男" : "女", hourIdx = ri(0, 12), year = ri(1930, 2025);
  let mine, iz, tag, lunarInfo;
  if (rnd() < 0.65) {
    const m = ri(1, 12), d = ri(1, ZW.solarMonthDays(year, m));
    tag = `${year}-${m}-${d} h${hourIdx} ${gender}`;
    mine = ZW.computeChart({ gender, calType: "solar", year, month: m, day: d, hour: hourIdx === 12 ? 0 : hourIdx, lateZi: hourIdx === 12 });
    iz = astro.bySolar(`${year}-${m}-${d}`, hourIdx, gender, true, "zh-TW");
  } else {
    const list = ZW.lunarMonthList(year), it = list[ri(0, list.length - 1)], d = ri(1, it.days);
    tag = `農曆${year}-${it.m}${it.leap ? "閏" : ""}-${d} h${hourIdx} ${gender}`;
    mine = ZW.computeChart({ gender, calType: "lunar", year, month: it.m, leap: it.leap, day: d, hour: hourIdx === 12 ? 0 : hourIdx, lateZi: hourIdx === 12 });
    iz = astro.byLunar(`${year}-${it.m}-${d}`, hourIdx, gender, it.leap, true, "zh-TW");
  }
  if (hourIdx === 12 && mine.lunar.leap && mine.lunar.day > 15) { skipped++; continue; }
  if (mine.bureauName !== iz.fiveElementsClass) fail("五行局", tag);
  if (B[mine.mingIdx] !== iz.earthlyBranchOfSoulPalace || B[mine.shenIdx] !== iz.earthlyBranchOfBodyPalace) fail("命宮/身宮", tag);
  if (mine.mingzhu !== iz.soul || mine.shenzhu !== iz.body) fail("命主身主", tag);
  const hua = new Map(); iz.palaces.forEach((p) => [...p.majorStars, ...p.minorStars].forEach((s) => s.mutagen && hua.set(s.name, s.mutagen)));
  mine.siHua.forEach((x) => { if (hua.get(x.star) !== x.hua.slice(1)) fail("四化", tag + " " + x.star); });
  iz.palaces.forEach((p) => {
    const cell = mine.cells[B.indexOf(p.earthlyBranch)], at = `${tag} ${p.earthlyBranch}`;
    const mm = cell.left.filter((s) => MAIN.has(s.name)).map((s) => s.name + "." + s.bright).sort().join();
    const im = p.majorStars.map((s) => s.name + "." + (s.brightness === "庙" ? "廟" : s.brightness || "")).sort().join();
    if (mm !== im) fail("主星/亮度", `${at} ${mm} vs ${im}`);
    const ma = cell.left.filter((s) => AUX.has(s.name)).map((s) => s.name).sort().join();
    const ia = p.minorStars.map((s) => s.name).filter((x) => AUX.has(x)).sort().join();
    if (ma !== ia) fail("六吉六煞", `${at} ${ma} vs ${ia}`);
    const mj = cell.right.map((s) => s.name).sort().join();
    const ij = p.adjectiveStars.map((s) => s.name).filter((x) => !IZONLY.has(x)).sort().join();
    if (mj !== ij) fail("雜曜", `${at} ${mj} vs ${ij}`);
    if (cell.limit !== `${p.decadal.range[0]} - ${p.decadal.range[1]}`) fail("大限", at);
    if (cell.ss.cs !== p.changsheng12 || cell.ss.bs !== p.boshi12) fail("十二神", at);
  });
}
console.log(`\n比對 ${N - skipped} 張盤(另有 ${skipped} 張屬 iztro 明文例外而略過),不一致項目數: ${bad}`);
process.exit(bad ? 1 : 0);
