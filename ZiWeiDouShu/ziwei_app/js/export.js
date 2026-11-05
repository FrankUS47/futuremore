/* 純文字檔匯出:12 行,一宮一行。
   mode = "full":全部資訊(宮干、星曜、大限、小限、神煞、流運)
   mode = "stars":只存各宮星曜 */
(function (root) {
  const ZW = root.ZW;

  ZW.buildTextExport = function (chart, mode) {
    mode = mode === "stars" ? "stars" : "full";
    const L = [];
    const bar = "=".repeat(80);
    const starsOf = (c) => [...c.left, ...c.right].map((s) => s.text).join(" ");

    L.push(bar);
    if (mode === "stars") {
      L.push(`【${chart.name} 之紫微斗數命盤 — 各宮星曜 (共12宮,一宮一行)】`);
      L.push(`${chart.yinyang} | ${chart.bureauName} | 陰曆生辰: ${chart.lunarText} ${chart.hourName}`);
      L.push(bar);
      chart.cells.forEach((c, b) => {
        const title = c.name + (c.isShen ? "(身宮)" : "");
        L.push(`【${ZW.branches[b]}宮 / ${title}】 星曜: ${starsOf(c)}`);
      });
      return L.join("\n");
    }

    L.push(`【${chart.name} 之紫微斗數純文字命盤 (共12宮,一宮一行全資訊)】`);
    L.push(`性別: ${chart.yinyang} | 局數: ${chart.bureauName} | 陰曆生辰: ${chart.lunarText} ${chart.hourName} | 命宮: ${ZW.branches[chart.mingIdx]} 身宮: ${ZW.branches[chart.shenIdx]} | 命主: ${chart.mingzhu} 身主: ${chart.shenzhu}`);
    if (chart.flow.enabled) L.push(`流運基準: ${chart.flowDate.year}-${chart.flowDate.month}-${chart.flowDate.day} (流年 ${ZW.ganZhiOfYear(chart.flow.year)},虛歲 ${chart.flow.age})`);
    L.push(bar);
    chart.cells.forEach((c, b) => {
      const title = c.name + (c.isShen ? "(身宮)" : "");
      const mk = c.marks.length ? ` | 流運: ${c.marks.join(" ")}` : "";
      L.push(
        `【${ZW.branches[b]}宮 / ${title}】 (宮干:${c.stem}${ZW.branches[b]}) | 星曜: ${starsOf(c)}` +
        ` | 大限: ${c.limit} 歲 | 虛歲: ${c.ages.join(" ")}` +
        ` | 神煞: 長生:${c.ss.cs || ""} 博士:${c.ss.bs || ""} 歲前:${c.ss.sq || ""} 將前:${c.ss.jq || ""}${mk}`
      );
    });
    return L.join("\n");
  };

  ZW.exportFileName = (chart, mode) => `${chart.name}_紫微命盤_${mode === "stars" ? "星曜" : "全資訊"}.txt`;

  /* 手機:跳出系統「分享/儲存到檔案」面板;電腦或不支援時:直接下載。回傳 Promise<"shared"|"downloaded"|"cancelled"> */
  ZW.downloadText = async function (chart, mode) {
    const text = ZW.buildTextExport(chart, mode);
    const name = ZW.exportFileName(chart, mode);
    try {
      if (navigator.canShare && typeof File === "function") {
        const file = new File([text], name, { type: "text/plain" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: name });
          return "shared";
        }
      }
    } catch (e) {
      if (e && e.name === "AbortError") return "cancelled"; // 使用者自己關掉面板
      /* 其他錯誤:退回下載 */
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "downloaded";
  };
})(typeof window !== "undefined" ? window : globalThis);
