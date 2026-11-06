/* ============================================================
 * 模組三：曆法（儒略日、日柱、農曆、真太陽時、四柱）
 * ============================================================ */
const Cal = (function () {
    const { STEMS, BRANCHES } = Data;

    function jdn(y, m, d) {
        const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
        return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    }
    const dayJiazi = (y, m, d) => (((jdn(y, m, d) + 49) % 60) + 60) % 60;

    // 均時差（分鐘）
    function equationOfTime(y, m, d) {
        const N = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
        const B = 2 * Math.PI * (N - 81) / 365;
        return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    }

    // 農曆：內嵌 1899~2101 年資料表（每年 6 碼：正月初一距 1/21 之日數、閏月、各月大小）
    const LUNAR_START = 1899;
    const LUNAR_TAB = "k00ad5a816d2t00752i00ea585164aq0064be00a9b441556n0056ac00b59121752k00752961b25s00b25g00a4b5514abo002add0056b220b69l00da9b71d92u00e92i00d25751a4dq00a56f002b63415b5n006d4c00ea9221e92k00e92960d26r0052bg00a575512b6o00b5ae006d4330ec9l00749a71693t00a93i0052b660a5bp00aadf0056a441b55n00ba4c00b49121a93k00a9587152dr00536g00aad6515aao005b2d00da5331d4am00d4aa80a95s00a97i00556760ab5p00ad5f006d2440ea5n00ea5c0064a030c97j00a9b97155ar0056ag00b69651752p00b52d00b2524164bl00a4ba814abs002adh0056d760b69q00da9f00d92441d25n00d25ca1a4du00a56j002b68605b5r006d5g00ea9651e92p00e92e00d26230a56k00a57a814d6t0035ah006d57516c9q00749f0069334152bm0052bb00a5b12155aj0056a871b55s00ba4h00b49551a93o00a95d0052d240aadk00ab5a915aat005d2i00da5761d4aq00d4af00c9544152em00556b00ab51215b2k006d2860ea5r00725g0064b550c97n00cabd0055a230ad6l00b69ab1752t00b52i00b25761a4bp00a4be004ab35055bm005adb00b6a121b52k00d92971d25r00d25g00a555514ado004b6c005b5230daal00ec9b81e92t00e92i00d26760a56p00a57e004d63406d5m00755c00749030e93j0069387152br0052bf00a5b55155ao0056ad00b6524174al00b4aa81a95t00a95h0052d660aadp00ab5f005aa340ba5m00da5c00d4a131c95j00c9687194er00556g00ab55515b2o006d2d00ea5340e4ak0068b980c97s004abh0055b660ad6p00b6af00752441725m00b45b00a8b02149bj004ab87095b";
    function lunarYearInfo(ly) {
        const i = (ly - LUNAR_START) * 6;
        if (i < 0 || i + 6 > LUNAR_TAB.length) throw new Error("出生年份超出支援範圍 (1900~2100)");
        const off = parseInt(LUNAR_TAB[i], 36), leap = parseInt(LUNAR_TAB[i + 1], 36), bits = parseInt(LUNAR_TAB.substr(i + 2, 4), 16);
        const months = []; let m = 1, k = 0;
        for (; k < (leap ? 13 : 12); k++) {
            const isLeap = leap > 0 && k === leap;           // 閏月緊接在同數字之月後
            months.push({ month: isLeap ? leap : m, leap: isLeap, days: (bits >> k) & 1 ? 30 : 29 });
            if (!isLeap) m++;
        }
        return { start: jdn(ly, 1, 21) + off, leap, months };
    }
    // 回傳 {year, month, day, leap}
    function lunarOf(y, m, d) {
        const j = jdn(y, m, d);
        let ly = y;
        if (j < lunarYearInfo(ly).start) ly--;
        const info = lunarYearInfo(ly);
        let rest = j - info.start;
        for (const mo of info.months) {
            if (rest < mo.days) return { year: ly, month: mo.month, leap: mo.leap, day: rest + 1 };
            rest -= mo.days;
        }
        throw new Error("農曆轉換失敗");
    }
    const MONTH_CN = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
    const DAY_CN = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十", "十一", "十二", "十三", "十四", "十五",
        "十六", "十七", "十八", "十九", "二十", "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];
    const lunarText = l => `${STEMS[(l.year - 4) % 10]}${BRANCHES[(l.year - 4) % 12]}年${l.leap ? "閏" : ""}${MONTH_CN[l.month - 1]}月${DAY_CN[l.day - 1]}`;
    const hourBranchOf = h => Math.floor(((h + 1) % 24) / 2);

    /**
     * 依輸入換算各種時間基準
     * inp: {y,m,d,H,M, lon, tz, useTST, zishi:'next'|'same'}
     */
    function resolveTime(inp) {
        const clockMs = Date.UTC(inp.y, inp.m - 1, inp.d, inp.H, inp.M);
        const instantMs = clockMs - inp.tz * 3600000;                 // 真實時刻 (UTC)
        let offsetMin = 0;
        if (inp.useTST) offsetMin = (inp.lon - inp.tz * 15) * 4 + equationOfTime(inp.y, inp.m, inp.d);
        const eff = new Date(clockMs + Math.round(offsetMin * 60000));
        const ey = eff.getUTCFullYear(), em = eff.getUTCMonth() + 1, ed = eff.getUTCDate(), eh = eff.getUTCHours(), emin = eff.getUTCMinutes();
        const hourBranch = hourBranchOf(eh);
        const late = (eh === 23);                                       // 晚子時
        const nextDay = new Date(Date.UTC(ey, em - 1, ed + 1));
        const nd = { y: nextDay.getUTCFullYear(), m: nextDay.getUTCMonth() + 1, d: nextDay.getUTCDate() };
        const own = { y: ey, m: em, d: ed };
        const dayRef = (late && inp.zishi === "next") ? nd : own;       // 日柱、農曆日所採日期
        const hourStemRef = late ? nd : own;                            // 時干起算之日（晚子時皆用次日日干）
        return { clockMs, instantMs, offsetMin, effText: `${ey}-${String(em).padStart(2, "0")}-${String(ed).padStart(2, "0")} ${String(eh).padStart(2, "0")}:${String(emin).padStart(2, "0")}`,
            hourBranch, late, dayRef, hourStemRef };
    }

    // 四柱
    function fourPillars(inp) {
        const t = resolveTime(inp);
        const { prev, next } = Astro.nearestTerms(t.instantMs);
        const bzYear = prev.idx === 0 ? prev.year - 1 : prev.year;       // 小寒(1月)仍屬前一年，立春後換年
        const yStem = ((bzYear - 4) % 10 + 10) % 10, yBranch = ((bzYear - 4) % 12 + 12) % 12;
        const mBranch = (prev.idx + 1) % 12;
        const mStem = ((yStem % 5) * 2 + 2 + ((mBranch - 2 + 12) % 12)) % 10;
        const dj = dayJiazi(t.dayRef.y, t.dayRef.m, t.dayRef.d);
        const dStem = dj % 10, dBranch = dj % 12;
        const hj = dayJiazi(t.hourStemRef.y, t.hourStemRef.m, t.hourStemRef.d);
        const hStem = (((hj % 10) % 5) * 2 + t.hourBranch) % 10;
        const mk = (s, b) => ({ stemIdx: s, branchIdx: b, stem: STEMS[s], branch: BRANCHES[b], gz: STEMS[s] + BRANCHES[b], jiazi: Data.jiazi(s, b) });
        return { time: t, prevTerm: prev, nextTerm: next, bzYear,
            year: mk(yStem, yBranch), month: mk(mStem, mBranch), day: mk(dStem, dBranch), hour: mk(hStem, t.hourBranch) };
    }

    return { jdn, dayJiazi, equationOfTime, lunarOf, lunarText, MONTH_CN, DAY_CN, hourBranchOf, resolveTime, fourPillars };
})();
