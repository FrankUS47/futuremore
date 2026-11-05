/* 表單互動:下拉選單、曆法切換、排盤、匯出 */
(function () {
  const ZW = window.ZW;
  const $ = (id) => document.getElementById(id);
  let lastChart = null;

  /* 填入選項;selected 不存在時依序嘗試「去掉閏月標記」、第一項 */
  function fill(sel, items, selected) {
    sel.innerHTML = "";
    items.forEach((it) => {
      const o = document.createElement("option");
      o.value = String(it.value);
      o.textContent = it.text;
      sel.appendChild(o);
    });
    const values = items.map((i) => String(i.value));
    const s = selected === undefined ? "" : String(selected);
    if (values.includes(s)) sel.value = s;
    else if (values.includes(String(parseInt(s, 10)))) sel.value = String(parseInt(s, 10));
    else if (items.length) sel.value = values[0];
  }

  const isLunar = () => $("calType").value === "lunar";
  const parseMonth = (v) => ({ m: parseInt(v, 10), leap: String(v).endsWith("L") });
  const monthValue = (m, leap) => (leap ? m + "L" : String(m));

  function initYear(sel) {
    const items = [];
    for (let y = ZW.MIN_YEAR; y <= ZW.MAX_YEAR; y++) items.push({ value: y, text: `${y} 年 (${ZW.ganZhiOfYear(y)}年)` });
    fill($("birthYear"), items, sel);
  }
  function initMonth(sel) {
    const y = parseInt($("birthYear").value, 10), items = [];
    if (isLunar()) ZW.lunarMonthList(y).forEach((it) => items.push({ value: monthValue(it.m, it.leap), text: it.leap ? `閏 ${it.m} 月` : `${it.m} 月` }));
    else for (let m = 1; m <= 12; m++) items.push({ value: m, text: `${m} 月` });
    fill($("birthMonth"), items, sel);
  }
  function initDay(sel) {
    const y = parseInt($("birthYear").value, 10), { m, leap } = parseMonth($("birthMonth").value);
    const n = isLunar() ? ZW.lunarMonthDays(y, m, leap) : ZW.solarMonthDays(y, m), items = [];
    for (let d = 1; d <= n; d++) items.push({ value: d, text: `${d} 日` });
    let s = parseInt(sel, 10);
    if (!(s >= 1)) s = 1;
    fill($("birthDay"), items, Math.min(s, n));
  }
  function initShichen(sel) { fill($("birthShichen"), ZW.shichenLabels.map((x) => ({ value: x.value, text: x.text })), sel); }

  /* 切換曆法時把目前日期換算成另一種曆法 */
  function onCalTypeChange() {
    const y = parseInt($("birthYear").value, 10), { m, leap } = parseMonth($("birthMonth").value), d = parseInt($("birthDay").value, 10);
    let ty = y, tm = m, tl = false, td = d;
    if (isLunar()) { // 國曆 → 農曆
      const l = ZW.solarToLunar(y, m, d);
      if (l) { ty = l.year; tm = l.month; tl = l.leap; td = l.day; }
    } else { // 農曆 → 國曆
      const s = ZW.lunarToSolar(y, m, leap, d);
      if (s) { ty = s.year; tm = s.month; td = s.day; }
    }
    initYear(ty); initMonth(monthValue(tm, tl)); initDay(td);
    $("msg").textContent = "";
  }

  function todayParts() {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() };
  }
  const pad = (n) => String(n).padStart(2, "0");

  function readOptions() {
    const { m, leap } = parseMonth($("birthMonth").value);
    const sc = $("birthShichen").value;
    let flowDate = null;
    const fv = $("flowDate").value; // yyyy-mm-dd
    if (fv) { const p = fv.split("-").map(Number); flowDate = { year: p[0], month: p[1], day: p[2] }; }
    return {
      name: $("userName").value.trim() || "命主",
      gender: $("gender").value,
      calType: $("calType").value,
      year: parseInt($("birthYear").value, 10),
      month: m, leap,
      day: parseInt($("birthDay").value, 10),
      hour: sc === "L" ? 0 : parseInt(sc, 10), // 注意:子時 = 0,不可用 || 取預設值
      lateZi: sc === "L",
      minorBright: $("minorBright").checked,
      flowDate
    };
  }

  function generate() {
    $("msg").textContent = "";
    try {
      lastChart = ZW.computeChart(readOptions());
    } catch (e) {
      $("msg").textContent = e.message;
      return null;
    }
    ZW.renderChart(lastChart, $("gridBoard"));
    ZW.renderReading(lastChart, $("reading"));
    const box = $("chartContainer");
    box.style.display = "block";
    if (box.scrollIntoView) box.scrollIntoView({ behavior: "smooth" });
    return lastChart;
  }

  function setup() {
    const t = todayParts();
    $("flowDate").value = `${t.year}-${pad(t.month)}-${pad(t.day)}`;
    // 預設帶入「科技紫微網」範例盤(1981/5/28 子時 男),方便對照
    initYear(1981); initMonth(5); initDay(28); initShichen("0");
    $("calType").addEventListener("change", onCalTypeChange);
    $("birthYear").addEventListener("change", () => { const m = $("birthMonth").value, d = $("birthDay").value; initMonth(m); initDay(d); });
    $("birthMonth").addEventListener("change", () => initDay($("birthDay").value));
    $("ziweiForm").addEventListener("submit", (e) => { e.preventDefault(); generate(); });
    $("btnExport").addEventListener("click", () => {
      const c = generate();
      if (c) ZW.downloadText(c, $("exportMode").value);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
