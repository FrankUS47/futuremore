/* ============================================================
 * 模組四：八字排盤（四柱、十神、藏干、納音、空亡、大運）
 * ============================================================ */
const Bazi = (function () {
    const { STEMS, BRANCHES, HIDDEN } = Data;
    const YEAR_MS = 365.2425 * 86400000;

    function kongwang(jiazi) {
        const xun = Math.floor(jiazi / 10);
        return [(10 - 2 * xun + 12) % 12, (11 - 2 * xun + 12) % 12];
    }

    // 某一時刻所屬之「八字年」(以立春換年)
    function baziYearAt(ms) {
        const { prev } = Astro.nearestTerms(ms);
        return prev.idx === 0 ? prev.year - 1 : prev.year;
    }
    const yearPillar = y => ({ stemIdx: ((y - 4) % 10 + 10) % 10, branchIdx: ((y - 4) % 12 + 12) % 12 });

    function compute(inp) {
        const fp = Cal.fourPillars(inp);
        const dm = fp.day.stemIdx;
        const keys = ["year", "month", "day", "hour"];
        keys.forEach(k => {
            const p = fp[k];
            p.stemElem = Data.STEM_ELEM[p.stemIdx];
            p.branchElem = Data.BRANCH_ELEM[p.branchIdx];
            p.god = k === "day" ? "日主" : Data.tenGod(dm, p.stemIdx);
            p.hidden = HIDDEN[p.branchIdx].map(([s, w]) => {
                const si = STEMS.indexOf(s);
                return { stem: s, stemIdx: si, weight: w, elem: Data.STEM_ELEM[si], god: Data.tenGod(dm, si) };
            });
            p.nayin = Data.nayinOf(p.jiazi);
            p.stage = Data.stageOf(dm, p.branchIdx);          // 日主於此支之十二運
            p.selfStage = Data.stageOf(p.stemIdx, p.branchIdx); // 自坐
        });
        const kwYear = kongwang(fp.year.jiazi), kwDay = kongwang(fp.day.jiazi);
        fp.kongwang = { year: kwYear, day: kwDay,
            hit: keys.filter(k => k !== "day" && kwDay.includes(fp[k].branchIdx)).concat(keys.filter(k => k !== "year" && kwYear.includes(fp[k].branchIdx))) };

        // 農曆
        const dr = fp.time.dayRef;
        fp.lunar = Cal.lunarOf(dr.y, dr.m, dr.d);
        fp.zodiac = Data.ZODIAC[fp.year.branchIdx];                 // 八字年生肖(立春換年)
        fp.lunarZodiac = Data.ZODIAC[((fp.lunar.year - 4) % 12 + 12) % 12];

        // ---- 大運 ----
        const male = inp.gender === "男";
        const yangYear = fp.year.stemIdx % 2 === 0;
        const forward = (yangYear && male) || (!yangYear && !male);
        const target = forward ? fp.nextTerm : fp.prevTerm;
        const D = Math.abs(target.ms - fp.time.instantMs) / 86400000;      // 距節氣日數
        const yrs = D / 3;                                                  // 三日折一年
        const yy = Math.floor(yrs), fm = (yrs - yy) * 12, mm = Math.floor(fm), dd = Math.floor((fm - mm) * 30);
        const startAge = yy + 1;                                            // 虛歲
        const bd = new Date(fp.time.clockMs);
        const sd = new Date(Date.UTC(bd.getUTCFullYear() + yy, bd.getUTCMonth() + mm, bd.getUTCDate() + dd));
        const list = [];
        for (let i = 1; i <= 10; i++) {
            const jz = ((fp.month.jiazi + (forward ? i : -i)) % 60 + 60) % 60;
            const s = jz % 10, b = jz % 12;
            list.push({ no: i, jiazi: jz, stemIdx: s, branchIdx: b, gz: STEMS[s] + BRANCHES[b], god: Data.tenGod(dm, s),
                hiddenGods: HIDDEN[b].map(([h]) => Data.tenGod(dm, STEMS.indexOf(h))),
                ageFrom: startAge + 10 * (i - 1), ageTo: startAge + 10 * (i - 1) + 9,
                yearFrom: fp.bzYear + startAge + 10 * (i - 1) - 1 + 0 });
        }
        // 起運西元年以出生民用年計
        const birthCivilYear = new Date(fp.time.clockMs).getUTCFullYear();
        list.forEach(x => { x.yearFrom = birthCivilYear + x.ageFrom - 1; x.yearTo = birthCivilYear + x.ageTo - 1; });
        fp.dayun = { forward, male, yangYear, targetTerm: target, days: D, years: yy, months: mm, remainDays: dd, startAge,
            startText: `出生後 ${yy} 年 ${mm} 個月 ${dd} 天起運`, startDate: `${sd.getUTCFullYear()}年${sd.getUTCMonth() + 1}月${sd.getUTCDate()}日`,
            startYears: yrs, list };
        fp.gender = inp.gender;
        return fp;
    }

    // 以排盤時刻 refMs 求目前歲數、行運
    function nowInfo(fp, refMs) {
        const ageFrac = (refMs - fp.time.instantMs) / YEAR_MS;
        const age = Math.floor(ageFrac);                   // 實歲
        const dy = fp.dayun;
        let cur = null;
        if (ageFrac >= dy.startYears) {
            const i = Math.min(10, Math.floor((ageFrac - dy.startYears) / 10) + 1);
            cur = dy.list[i - 1];
        }
        const y = baziYearAt(refMs);
        return { age, ageFrac, dayun: cur, flowYear: y, flowYearPillar: yearPillar(y) };
    }
    return { compute, nowInfo, baziYearAt, yearPillar, kongwang };
})();
