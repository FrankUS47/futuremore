/* 乙級星(雜曜)廟平陷表 — 依「紫微人生」乙級星廟旺利陷表。
   只收名稱沒有歧義的星;表中單字「空」「劫」無法確定是天空/地空、地劫或天劫,故不收。
   表中沒列出的宮位代表該星在該宮沒有廟平陷註記(與甲級星「未列即陷」不同)。 */
(function (root) {
  const ZW = root.ZW;
  const NAME = { 解: "解神", 哭: "天哭", 虛: "天虛", 鸞: "紅鸞", 喜: "天喜", 馬: "天馬", 刑: "天刑", 姚: "天姚", 官: "天官", 福: "天福", 傷: "天傷", 使: "天使" };
  /* 每宮 [廟, 平, 陷](子丑寅卯辰巳午未申酉戌亥) */
  const ROWS = [
    ["解", "刑姚", "傷"], ["哭虛鸞喜", "", "姚刑使"], ["馬刑解官福鸞喜", "姚", ""], ["刑解姚哭虛鸞喜", "", "傷使"],
    ["解鸞喜", "刑姚", "傷使"], ["官福", "馬刑姚", ""], ["解", "刑姚", "傷"], ["", "", "刑傷姚"],
    ["官福馬哭虛", "刑姚", ""], ["刑姚", "", "使"], ["解姚刑鸞喜", "", "使"], ["姚鸞喜", "馬刑", ""]
  ];
  const LEVEL = ["廟", "平", "陷"];
  ZW.minorBrightness = {};
  Object.values(NAME).forEach((n) => (ZW.minorBrightness[n] = Array(12).fill("")));
  ROWS.forEach((row, b) => row.forEach((cell, ci) => [...cell].forEach((ch) => { ZW.minorBrightness[NAME[ch]][b] = LEVEL[ci]; })));
  ZW.getMinorBrightness = (star, b) => (ZW.minorBrightness[star] ? ZW.minorBrightness[star][b] : "");
})(typeof window !== "undefined" ? window : globalThis);
