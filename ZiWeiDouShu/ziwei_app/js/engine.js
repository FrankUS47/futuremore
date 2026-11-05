/* 排盤引擎:輸入出生資料,回傳整張命盤的資料結構(不碰 DOM) */
(function (root) {
  const ZW = root.ZW;
  const mod = ZW.mod;
  const { stems, branches } = ZW;

  /* 三合局分組:以地支 % 4 查表。0=申子辰 1=巳酉丑 2=寅午戌 3=亥卯未 */
  const T = {
    tianma:   [2, 11, 8, 5],     // 天馬
    huoBase:  [2, 3, 1, 9],      // 火星起子宮
    lingBase: [10, 10, 3, 10],   // 鈴星起子宮
    jiangxing:[0, 9, 6, 3],      // 將星
    huagai:   [4, 1, 10, 7],     // 華蓋(雜曜)
    xianchi:  [9, 6, 3, 0],      // 咸池(雜曜)
    xiaoxian: [10, 7, 4, 1]      // 小限起一歲的宮位
  };
  const KUI_YUE = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [6, 2], [3, 5], [3, 5]];
  const LUCUN = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
  const TIANFU_STEM = [9, 8, 0, 11, 3, 2, 6, 5, 6, 5];   // 天福(年干)
  const TIANGUAN_STEM = [7, 4, 5, 2, 3, 9, 11, 9, 10, 6]; // 天官(年干)
  const TIANCHU_STEM = [5, 6, 0, 5, 6, 8, 2, 6, 9, 11];   // 天廚(年干)
  const JIEKONG = [[8, 9], [6, 7], [4, 5], [2, 3], [0, 1]]; // 截路、空亡(年干 % 5)
  const FEILIAN = [8, 9, 10, 5, 6, 7, 2, 3, 4, 11, 0, 1];  // 蜚廉(年支)
  const JIESHEN = [8, 8, 10, 10, 0, 0, 2, 2, 4, 4, 6, 6];  // 解神(月)
  const TIANWU = [5, 8, 2, 11, 5, 8, 2, 11, 5, 8, 2, 11];  // 天巫(月)
  const TIANYUE = [10, 5, 4, 2, 7, 3, 11, 7, 2, 6, 10, 2]; // 天月(月)
  const YINSHA = [2, 0, 10, 8, 6, 4, 2, 0, 10, 8, 6, 4];   // 陰煞(月)
  const GUCHEN = [2, 5, 8, 11], GUASU = [10, 1, 4, 7];     // 孤辰寡宿(亥子丑/寅卯辰/巳午未/申酉戌)
  const MINGZHU = ["貪狼", "巨門", "祿存", "文曲", "廉貞", "武曲", "破軍", "武曲", "廉貞", "文曲", "祿存", "巨門"]; // 依命宮地支
  const SHENZHU = ["火星", "天相", "天梁", "天同", "文昌", "天機"]; // 依年支 % 6

  ZW.computeChart = function (opts) {
    const gender = opts.gender === "女" ? "女" : "男";
    const H = opts.hour; // 0~11
    if (!(H >= 0 && H <= 11)) throw new Error("時辰錯誤");

    /* 1. 出生日期 → 農曆。晚子時按次日農曆日安星 */
    let birthSolar = opts.calType === "lunar"
      ? ZW.lunarToSolar(opts.year, opts.month, opts.leap, opts.day)
      : { year: opts.year, month: opts.month, day: opts.day };
    if (!birthSolar) throw new Error("無法換算該日期,請重新選擇。");
    /* 晚子時(23:00~24:00):年、月(含閏月判斷)依出生當天的農曆,
       只有「日」改用次日的農曆日安星(日系星曜隨之順推一位),與 suanming.io、iztro 一致。 */
    const calcSolar = opts.lateZi ? ZW.addDays(birthSolar, 1) : birthSolar;
    const lunar = ZW.solarToLunar(birthSolar.year, birthSolar.month, birthSolar.day);
    const nextLunar = opts.lateZi ? ZW.solarToLunar(calcSolar.year, calcSolar.month, calcSolar.day) : lunar;
    if (!lunar || !nextLunar) throw new Error("日期超出可換算範圍(1900~2030)。");

    const year = lunar.year, D = nextLunar.day;
    let M = lunar.month;
    if (lunar.leap && lunar.day > 15) M = M % 12 + 1; // 閏月:上半月按本月,十六日起按次月
    const yearStemIdx = mod(year - 4, 10), yearBranchIdx = mod(year - 4, 12);
    const yb = yearBranchIdx;
    const yearGanZhi = ZW.ganZhiOfYear(year);

    /* 2. 命宮、身宮:寅起正月順數到生月,再由該宮起子時,逆數到生時為命宮,順數為身宮 */
    const mingIdx = mod(2 + (M - 1) - H, 12);
    const shenIdx = mod(2 + (M - 1) + H, 12);

    /* 3. 宮干(五虎遁) */
    const yinStem = (yearStemIdx % 5) * 2 + 2;
    const palaceStems = [];
    for (let b = 0; b < 12; b++) palaceStems[b] = stems[(yinStem + mod(b - 2, 12)) % 10];

    /* 4. 五行局:天干(甲乙1 丙丁2 戊己3 庚辛4 壬癸5)+ 地支(子丑午未1 寅卯申酉2 辰巳戌亥3),>5 減 5 */
    const mingStemIdx = stems.indexOf(palaceStems[mingIdx]);
    let sum = Math.floor(mingStemIdx / 2) + 1 + Math.floor((mingIdx % 6) / 2) + 1;
    if (sum > 5) sum -= 5;
    const bureauMap = { 1: ["木三局", 3], 2: ["金四局", 4], 3: ["水二局", 2], 4: ["火六局", 6], 5: ["土五局", 5] };
    const [bureauName, bureauNum] = bureauMap[sum];

    /* 5. 紫微星:日數 + 補數 X 能被局數整除,商 Q 從寅起數;X 奇數退、偶數進 */
    let X = 0;
    while ((D + X) % bureauNum !== 0) X++;
    const Q = (D + X) / bureauNum;
    const ziweiIdx = mod(2 + (Q - 1) + (X % 2 === 1 ? -X : X), 12);

    const cells = Array.from({ length: 12 }, (_, b) => ({ branch: b, left: [], right: [], ss: {}, marks: [] }));
    const put = (b, side, name) => cells[mod(b, 12)][side].push({ name });

    /* 6. 十四主星 */
    put(ziweiIdx, "left", "紫微");
    put(ziweiIdx - 1, "left", "天機");
    put(ziweiIdx - 3, "left", "太陽");
    put(ziweiIdx - 4, "left", "武曲");
    put(ziweiIdx - 5, "left", "天同");
    put(ziweiIdx - 8, "left", "廉貞");
    const tianfu = mod(4 - ziweiIdx, 12);
    [["天府", 0], ["太陰", 1], ["貪狼", 2], ["巨門", 3], ["天相", 4], ["天梁", 5], ["七殺", 6], ["破軍", 10]]
      .forEach(([n, off]) => put(tianfu + off, "left", n));

    /* 7. 六吉六煞、祿存、天馬(左欄) */
    const zuofu = mod(4 + (M - 1), 12), youbi = mod(10 - (M - 1), 12);
    const wenchang = mod(10 - H, 12), wenqu = mod(4 + H, 12);
    put(zuofu, "left", "左輔"); put(youbi, "left", "右弼");
    put(wenchang, "left", "文昌"); put(wenqu, "left", "文曲");
    put(KUI_YUE[yearStemIdx][0], "left", "天魁"); put(KUI_YUE[yearStemIdx][1], "left", "天鉞");
    const lucun = LUCUN[yearStemIdx];
    put(lucun, "left", "祿存"); put(lucun + 1, "left", "擎羊"); put(lucun - 1, "left", "陀羅");
    put(T.huoBase[yb % 4] + H, "left", "火星"); put(T.lingBase[yb % 4] + H, "left", "鈴星");
    put(11 - H, "left", "地空"); put(11 + H, "left", "地劫");
    put(T.tianma[yb % 4], "left", "天馬");

    /* 8. 雜曜(右欄) */
    put(9 + (M - 1), "right", "天刑");
    put(1 + (M - 1), "right", "天姚");
    put(JIESHEN[M - 1], "right", "解神");
    put(TIANWU[M - 1], "right", "天巫");
    put(TIANYUE[M - 1], "right", "天月");
    put(YINSHA[M - 1], "right", "陰煞");
    put(6 + H, "right", "台輔");
    put(2 + H, "right", "封誥");
    /* 日系雜曜:晚子時為「出生日數順推一位」(月底時為 30→31,不會跳回初一);
       紫微星系與五行局則按次日農曆日 */
    const Dd = opts.lateZi ? lunar.day + 1 : D;
    put(zuofu + Dd - 1, "right", "三台");
    put(youbi - (Dd - 1), "right", "八座");
    put(wenchang + Dd - 2, "right", "恩光");
    put(wenqu + Dd - 2, "right", "天貴");
    put(3 - yb, "right", "紅鸞"); put(3 - yb + 6, "right", "天喜");
    const g = Math.floor(mod(yb + 1, 12) / 3);
    put(GUCHEN[g], "right", "孤辰"); put(GUASU[g], "right", "寡宿");
    put(4 + yb, "right", "龍池"); put(10 - yb, "right", "鳳閣");
    put(mingIdx + yb, "right", "天才"); put(shenIdx + yb, "right", "天壽");
    put(6 - yb, "right", "天哭"); put(6 + yb, "right", "天虛");
    put(yb + 1, "right", "天空");
    put(FEILIAN[yb], "right", "蜚廉");
    put(5 + yb, "right", "月德");
    put([0, 3, 6, 9].includes(yb) ? 5 : [2, 5, 8, 11].includes(yb) ? 9 : 1, "right", "破碎");
    put(T.huagai[yb % 4], "right", "華蓋"); put(T.xianchi[yb % 4], "right", "咸池");
    put(TIANFU_STEM[yearStemIdx], "right", "天福");
    put(TIANGUAN_STEM[yearStemIdx], "right", "天官");
    put(TIANCHU_STEM[yearStemIdx], "right", "天廚");
    put(JIEKONG[yearStemIdx % 5][0], "right", "截路"); put(JIEKONG[yearStemIdx % 5][1], "right", "空亡");
    put(mingIdx - 7, "right", "天傷"); // 交友宮
    put(mingIdx - 5, "right", "天使"); // 疾厄宮

    /* 9. 生年四化 */
    const siHuaRow = ZW.siHuaTable[yearStemIdx];
    const sihuaOf = {};
    siHuaRow.forEach((star, i) => (sihuaOf[star] = ZW.siHuaNames[i]));

    /* 10. 星曜附加亮度、四化、排序、顏色 */
    const order = (list, name) => { const i = list.indexOf(name); return i < 0 ? 999 : i; };
    cells.forEach((c, b) => {
      c.left.sort((a, z) => order(ZW.mainStars.concat(ZW.auxStars), a.name) - order(ZW.mainStars.concat(ZW.auxStars), z.name));
      c.right.sort((a, z) => order(ZW.minorOrder, a.name) - order(ZW.minorOrder, z.name));
      [...c.left, ...c.right].forEach((s) => {
        s.bright = ZW.getBrightness(s.name, b) || (opts.minorBright ? ZW.getMinorBrightness(s.name, b) : "") || "";
        s.sihua = sihuaOf[s.name] || "";
        s.kind = ZW.mainStars.includes(s.name) ? "main" : ZW.goodStars.includes(s.name) ? "good" : ZW.badStars.includes(s.name) ? "bad" : "minor";
        s.text = s.name + (s.bright || s.sihua ? "." + s.bright + s.sihua : "");
      });
    });

    /* 11. 流運基準:歲前、將前依「流年」地支安排;沒有基準日則用出生年 */
    const fd = opts.flowDate || null;
    const flowLunar = fd ? ZW.solarToLunar(fd.year, fd.month, fd.day) : null;
    const flowYear = flowLunar ? flowLunar.year : fd ? fd.year : year;
    const flowBranch = mod(flowYear - 4, 12);

    /* 12. 四組十二神 */
    const forward = (gender === "男" && yearStemIdx % 2 === 0) || (gender === "女" && yearStemIdx % 2 === 1); // 陽男陰女順
    const csBase = { "木三局": 11, "金四局": 5, "水二局": 8, "火六局": 2, "土五局": 8 }[bureauName];
    for (let i = 0; i < 12; i++) {
      cells[mod(csBase + (forward ? i : -i), 12)].ss.cs = ZW.changshengNames[i];
      cells[mod(lucun + (forward ? i : -i), 12)].ss.bs = ZW.boshiNames[i];
      cells[mod(flowBranch + i, 12)].ss.sq = ZW.suiqianNames[i];
      cells[mod(T.jiangxing[flowBranch % 4] + i, 12)].ss.jq = ZW.jiangqianNames[i];
    }

    /* 13. 大限(起運歲數 = 局數,陽男陰女順、陰男陽女逆) */
    for (let i = 0; i < 12; i++) {
      const c = cells[mod(mingIdx + (forward ? i : -i), 12)];
      c.limitStart = bureauNum + i * 10;
      c.limit = `${c.limitStart} - ${c.limitStart + 9}`;
    }

    /* 14. 小限(虛歲):男順女逆,依年支三合起一歲 */
    const xxDir = gender === "男" ? 1 : -1;
    const xxStart = T.xiaoxian[yb % 4];
    cells.forEach((c) => (c.ages = []));
    for (let age = 1; age <= 84; age++) cells[mod(xxStart + (age - 1) * xxDir, 12)].ages.push(age);

    /* 15. 宮名、宮干、命身標記 */
    cells.forEach((c, b) => {
      c.stem = palaceStems[b];
      c.name = ZW.palaceNames[mod(mingIdx - b, 12)];
      c.isMing = b === mingIdx;
      c.isShen = b === shenIdx;
    });

    /* 16. 流運標記:大限、小限、流年、流月(斗君)、流日 */
    const flow = { enabled: !!fd, year: flowYear, branch: flowBranch, age: flowYear - year + 1 };
    if (fd) {
      const bigIdx = cells.findIndex((c) => flow.age >= c.limitStart && flow.age <= c.limitStart + 9);
      if (bigIdx >= 0) cells[bigIdx].marks.push("大限");
      const smallIdx = cells.findIndex((c) => c.ages.includes(flow.age));
      if (smallIdx >= 0) cells[smallIdx].marks.push("小限");
      cells[flowBranch].marks.push("流年");
      flow.bigIdx = bigIdx; flow.smallIdx = smallIdx; flow.yearIdx = flowBranch; // bigIdx/smallIdx = -1 表示尚未起運/超出範圍
      if (flowLunar) {
        let fm = flowLunar.month;
        if (flowLunar.leap && flowLunar.day > 15) fm = fm % 12 + 1;
        const douJun = mod(flowBranch - (M - 1) + H, 12); // 流年支逆數生月,再順數生時
        const monthIdx = mod(douJun + (fm - 1), 12);
        const dayIdx = mod(monthIdx + (flowLunar.day - 1), 12);
        cells[monthIdx].marks.push("流月");
        cells[dayIdx].marks.push("流日");
        flow.lunar = flowLunar; flow.monthIdx = monthIdx; flow.dayIdx = dayIdx;
      }
    }

    const lunarText = `${yearGanZhi}年 ${lunar.leap ? "閏" : ""}${ZW.lunarMonthNames[lunar.month - 1]}月${ZW.lunarDayNames[lunar.day - 1]}`;
    const hourName = branches[H] + "時";

    return {
      name: opts.name || "命主", gender, yinyang: (yearStemIdx % 2 === 0 ? "陽" : "陰") + gender,
      zodiac: ZW.zodiac[yb], forward, yearStem: stems[yearStemIdx],
      dirText: forward ? "順行" : "逆行",
      bureauName, bureauNum, birthSolar, calcSolar, lunar, starDay: D, starMonth: M, lunarText, yearGanZhi,
      lateZi: !!opts.lateZi, hour: H, hourName: opts.lateZi ? "晚子時" : hourName,
      mingIdx, shenIdx, mingzhu: MINGZHU[mingIdx], shenzhu: SHENZHU[yb % 6],
      ziweiIdx, palaceStems, cells, siHua: siHuaRow.map((s, i) => ({ star: s, hua: "化" + ZW.siHuaNames[i] })),
      flow, flowDate: fd
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
