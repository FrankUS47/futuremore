/* 把命盤資料畫成 4x4 盤面(只負責 DOM) */
(function (root) {
  const ZW = root.ZW;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* 地支 → 盤面位置(巳在左上,順時針) */
  const LAYOUT = [
    { b: 5, r: 1, c: 1 }, { b: 6, r: 1, c: 2 }, { b: 7, r: 1, c: 3 }, { b: 8, r: 1, c: 4 },
    { b: 9, r: 2, c: 4 }, { b: 10, r: 3, c: 4 }, { b: 11, r: 4, c: 4 }, { b: 0, r: 4, c: 3 },
    { b: 1, r: 4, c: 2 }, { b: 2, r: 4, c: 1 }, { b: 3, r: 3, c: 1 }, { b: 4, r: 2, c: 1 }
  ];

  function starHtml(s) {
    let attr = "";
    if (s.bright || s.sihua) {
      attr = "." + esc(s.bright) + (s.sihua ? `<span class="hua-${s.sihua}">${s.sihua}</span>` : "");
    }
    return `<div class="star-item star-${s.kind}">${esc(s.name)}<span class="star-attr">${attr}</span></div>`;
  }

  function centerHtml(ch) {
    const sh = ch.hourName;
    const b = ch.birthSolar;
    const hint = ch.lateZi ? "(晚子時,按次日農曆日安星)" : "";
    const flow = ch.flow.enabled
      ? `<b>流運：</b>${ch.flowDate.year}/${ch.flowDate.month}/${ch.flowDate.day}　流年 ${ZW.ganZhiOfYear(ch.flow.year)}　虛歲 ${ch.flow.age}<br>`
      : "";
    const tags = ch.siHua.map((x) => `<span class="tag-sihua">${esc(x.star)}<b>${x.hua}</b></span>`).join("");
    return `
      <div class="center-title">${esc(ch.name)} 的紫微命盤</div>
      <div class="center-info">
        <b>${ch.yinyang}</b> ${ch.bureauName}　生肖 ${ch.zodiac}<br>
        <span class="muted">${ch.yearStem}年屬${ch.yearStem && "甲丙戊庚壬".includes(ch.yearStem) ? "陽" : "陰"}干、${ch.gender}命,大限${ch.dirText}</span><br>
        <b>陽曆：</b>西元 ${b.year} 年 ${b.month} 月 ${b.day} 日 ${sh}<br>
        <b>陰曆：</b>${ch.lunarText} ${sh}${hint}<br>
        <b>命宮：</b>${ZW.branches[ch.mingIdx]} ｜ <b>身宮：</b>${ZW.branches[ch.shenIdx]}<br>
        <b>命主：</b>${ch.mingzhu} ｜ <b>身主：</b>${ch.shenzhu}<br>
        ${flow}
      </div>
      <div class="center-sihua">${tags}</div>`;
  }

  function cellHtml(c) {
    const ages = c.ages;
    const marks = c.marks.map((m) => `<span class="mark mark-${m}">${m}</span>`).join("");
    return `
      <div class="star-cols">
        <div class="star-col">${c.left.map(starHtml).join("")}</div>
        <div class="star-col star-col-right">${c.right.map(starHtml).join("")}</div>
      </div>
      <div class="middle-section">
        <div class="xusui-list">${ages.slice(0, 5).join(" ")}<br>${ages.slice(5).join(" ")}</div>
        <div class="daxian-range">${c.limit}</div>
      </div>
      <div class="bottom-section">
        <div class="shensha-top-line"><span class="ss-changsheng">${c.ss.cs || ""}</span><span class="ss-suiqian">${c.ss.sq || ""}</span></div>
        <div class="shensha-bottom-line"><span class="ss-boshi">${c.ss.bs || ""}</span><span class="ss-jiangqian">${c.ss.jq || ""}</span></div>
        <div class="palace-footer">
          <span class="palace-name ${c.isMing ? "is-ming" : ""}">${c.name}${c.isShen ? " / 身宮" : ""}</span>
          <span class="marks">${marks}</span>
          <span class="gan-zhi">${c.stem}${ZW.branches[c.branch]}</span>
        </div>
      </div>`;
  }

  ZW.renderChart = function (chart, board) {
    board.innerHTML = "";
    const center = document.createElement("div");
    center.className = "center-cell";
    center.innerHTML = centerHtml(chart);
    board.appendChild(center);
    LAYOUT.forEach((pos) => {
      const div = document.createElement("div");
      const mk = chart.cells[pos.b].marks;
      div.className = "palace-cell" + (mk.includes("大限") ? " is-daxian" : "") + (mk.includes("流年") ? " is-liunian" : "");
      div.style.setProperty("--r", pos.r);   // 電腦/平板:4x4 傳統盤面
      div.style.setProperty("--c", pos.c);
      div.style.setProperty("--o", ZW.mod(chart.mingIdx - pos.b, 12)); // 手機:由命宮起依序排列
      div.innerHTML = cellHtml(chart.cells[pos.b]);
      board.appendChild(div);
    });
  };
})(typeof window !== "undefined" ? window : globalThis);
