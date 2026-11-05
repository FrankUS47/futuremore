/* 國曆 / 農曆 轉換(需先載入 data.js、lunar_table.js) */
(function (root) {
  const ZW = root.ZW;
  const info = () => ZW.lunarInfo;
  const BASE_UTC = Date.UTC(1900, 0, 31); // 農曆 1900 正月初一

  ZW.isSolarLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  ZW.solarMonthDays = (y, m) => [31, ZW.isSolarLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

  ZW.lunarMonthList = function (y) {
    const v = info()[y - 1900], lm = v & 0xf, list = [];
    for (let m = 1; m <= 12; m++) {
      list.push({ m, leap: false, days: v & (0x10000 >> m) ? 30 : 29 });
      if (m === lm) list.push({ m, leap: true, days: v & 0x10000 ? 30 : 29 });
    }
    return list;
  };
  ZW.lunarYearDays = (y) => ZW.lunarMonthList(y).reduce((s, x) => s + x.days, 0);
  ZW.lunarMonthDays = function (y, m, leap) {
    const it = ZW.lunarMonthList(y).find((x) => x.m === m && x.leap === !!leap);
    return it ? it.days : 0;
  };

  ZW.solarToLunar = function (y, m, d) {
    let offset = Math.round((Date.UTC(y, m - 1, d) - BASE_UTC) / 86400000);
    if (offset < 0) return null;
    let ly = 1900;
    while (ly <= ZW.MAX_YEAR && offset >= ZW.lunarYearDays(ly)) { offset -= ZW.lunarYearDays(ly); ly++; }
    if (ly > ZW.MAX_YEAR) return null;
    let lm = 1, leap = false;
    for (const it of ZW.lunarMonthList(ly)) {
      if (offset < it.days) { lm = it.m; leap = it.leap; break; }
      offset -= it.days;
    }
    return { year: ly, month: lm, leap, day: offset + 1 };
  };

  ZW.lunarToSolar = function (y, m, leap, d) {
    if (y < ZW.MIN_YEAR || y > ZW.MAX_YEAR) return null;
    let off = 0, found = false;
    for (const it of ZW.lunarMonthList(y)) {
      if (it.m === m && it.leap === !!leap) {
        if (d < 1 || d > it.days) return null;
        off += d - 1; found = true; break;
      }
      off += it.days;
    }
    if (!found) return null;
    for (let yy = 1900; yy < y; yy++) off += ZW.lunarYearDays(yy);
    const dt = new Date(BASE_UTC + off * 86400000);
    return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
  };

  ZW.addDays = function (s, n) {
    const dt = new Date(Date.UTC(s.year, s.month - 1, s.day) + n * 86400000);
    return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
  };

  ZW.ganZhiOfYear = (y) => ZW.stems[ZW.mod(y - 4, 10)] + ZW.branches[ZW.mod(y - 4, 12)];
})(typeof window !== "undefined" ? window : globalThis);
