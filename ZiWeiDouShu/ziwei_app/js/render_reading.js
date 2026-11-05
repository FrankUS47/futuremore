/* 把解說結構畫在命盤下方(只負責 DOM) */
(function (root) {
  const ZW = root.ZW;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const list = (arr) => (arr.length ? arr.map(esc).join("、") : "(無星)");
  const refLine = (label, r) =>
    `<li><b>${label}</b> ${esc(r.name)}(${r.branch}):${r.main.length ? "主星 " + list(r.main) : "空宮"}${r.stars.length > r.main.length ? `<span class="muted">;其餘 ${list(r.stars.filter((t) => !r.main.includes(t)))}</span>` : ""}</li>`;

  function summaryHtml(sm, ch) {
    if (!sm.enabled) return `<p class="muted">未設定流運基準日,未顯示大限與流年。</p>`;
    const sfBlock = (x) => x
      ? `<span class="muted">三方四正:對宮 ${esc(x.sf.opposite.name)}(${x.sf.opposite.branch})、三合 ${esc(x.sf.trines[0].name)}(${x.sf.trines[0].branch})、${esc(x.sf.trines[1].name)}(${x.sf.trines[1].branch})</span>`
      : "";
    const big = sm.big
      ? `<div class="sum-item sum-big"><span class="mark mark-大限">大限</span> 目前十年大限走到 <b>${esc(sm.big.name)}(${sm.big.branchName})</b>,${sm.big.limit} 歲。這十年以此宮為「大限命宮」來看。<br>${sfBlock(sm.big)}</div>`
      : `<div class="sum-item sum-big"><span class="mark mark-大限">大限</span> 虛歲 ${sm.age},尚未起運(${ch.bureauName}自 ${ch.bureauNum} 歲起運)。</div>`;
    const ln = sm.liunian
      ? `<div class="sum-item sum-ln"><span class="mark mark-流年">流年</span> ${sm.year} 年(${esc(sm.yearGZ)})流年走到 <b>${esc(sm.liunian.name)}(${sm.liunian.branchName})</b>,虛歲 ${sm.age}。<br>${sfBlock(sm.liunian)}</div>`
      : "";
    const small = sm.small
      ? `<div class="sum-item"><span class="mark mark-小限">小限</span> 小限落在 ${esc(sm.small.name)}(${sm.small.branchName})。</div>`
      : "";
    return big + ln + small;
  }

  function scoreHtml(sc) {
    const row = (cls, label, n) => `<span class="${cls}">${label} ${n ? "☆".repeat(n) : "—"}</span>`;
    return row("sc-good", "吉", sc.goodLevel) + row("sc-bad", "凶", sc.badLevel);
  }

  function palaceHtml(p) {
    const tags = [
      p.isMing ? `<span class="tag tag-ming">命宮</span>` : "",
      p.isShen ? `<span class="tag tag-shen">身宮</span>` : "",
      ...p.marks.map((m) => `<span class="mark mark-${m}">${m}</span>`)
    ].join("");
    const empty = p.empty
      ? `<p class="note-empty">空宮(無主星),傳統上借對宮主星來看:${p.borrowed.length ? list(p.borrowed) : "對宮亦無主星"}。</p>` : "";
    const stars = p.starNotes.length
      ? `<ul class="star-notes">${p.starNotes.map((s) => `<li><b class="sn-${s.kind}">${esc(s.text)}</b>${s.meaning ? " — " + esc(s.meaning) : ""}${s.hua ? `<br><span class="hua-note">${esc(s.hua)}</span>` : ""}</li>`).join("")}</ul>`
      : `<p class="muted">本宮無主星與六吉六煞。</p>`;
    const hua = p.huaInGroup.length
      ? `<p class="hua-group"><b>三方四正內的四化:</b>${p.huaInGroup.map((h) => `${esc(h.star)}${h.hua}(${esc(h.palace)}${h.self ? "·本宮" : ""})`).join("、")}</p>` : "";
    return `
      <article class="rd-card${p.isMing ? " rd-ming" : ""}${p.marks.includes("大限") ? " rd-big" : ""}${p.marks.includes("流年") ? " rd-ln" : ""}">
        <h4>${esc(p.name)} <span class="gz">${p.stem}${p.branchName}</span> ${tags}</h4>
        <div class="rd-score">${scoreHtml(p.score)}</div>
        <p class="rd-look"><b>看什麼:</b>${esc(p.meaning.look)}——${esc(p.meaning.topics)}</p>
        ${empty}
        ${stars}
        <div class="sfsz">
          <b>三方四正</b>
          <ul>
            ${refLine("本宮", p.sf.self)}
            ${refLine("對宮", p.sf.opposite)}
            ${refLine("三合", p.sf.trines[0])}
            ${refLine("三合", p.sf.trines[1])}
          </ul>
        </div>
        ${hua}
      </article>`;
  }

  function siHuaHtml(list) {
    const chips = list.map((x) => `<span class="tag-sihua hua-chip-${x.h}">${esc(x.star)}<b>${esc(x.hua)}</b></span>`).join("");
    const rows = list.map((x) => `
      <li><span class="tag-sihua hua-chip-${x.h}">${esc(x.star)}<b>${esc(x.hua)}</b></span>
        ${x.where ? `落在 <b>${esc(x.where.palace)}(${x.where.branchName})</b>${x.where.bright ? `,${esc(x.where.bright)}位` : ""}${x.where.isMing ? ",就在命宮" : ""}。` : ""}
        ${esc(x.star)}:${esc(x.starMeaning)}。化${esc(x.h)}:${esc(x.huaMeaning)}。
      </li>`).join("");
    return `<h3>本命四化</h3><div class="center-sihua rd-chips">${chips}</div><ul class="hua-list">${rows}</ul>`;
  }

  function scoreTableHtml(palaces) {
    const rows = palaces.map((p) => `<tr><td>${esc(p.name)}(${p.branchName})</td><td class="sc-good">${p.score.goodLevel ? "☆".repeat(p.score.goodLevel) : "—"}</td><td class="sc-bad">${p.score.badLevel ? "☆".repeat(p.score.badLevel) : "—"}</td></tr>`).join("");
    return `<h3>吉凶表示</h3>
      <p class="muted">每宮最多 5 顆☆,由弱到強。<b class="sc-good">紅色☆ = 吉</b>、<b class="sc-bad">黑色☆ = 凶</b>;「—」表示該項不到 0.5 分(沒有)。吉凶兩列分開計算、不互相抵銷,所以同一宮可兩邊都有☆。</p>
      <p class="muted">計分依據:本宮主星亮度(廟旺加吉、陷加凶)、六吉星(左輔右弼文昌文曲天魁天鉞)與祿存加吉、六煞星(羊陀火鈴空劫)加凶、雜曜小幅加減,以及生年四化(祿權科加吉,忌加凶)。屬簡化估算,不是傳統吉凶斷語。</p>
      <table class="sc-table"><thead><tr><th>宮位</th><th>吉</th><th>凶</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  ZW.renderReading = function (ch, box) {
    const rd = ZW.buildReading(ch);
    box.innerHTML = `
      <h2>命盤解說</h2>
      <p class="muted">依盤面資料自動整理,星曜象意為簡化重點,僅供文化參考,不是吉凶判斷;同一顆星要結合亮度、四化與三方四正整體來看。</p>
      <div class="rd-legend">
        <span class="mark mark-大限">大限</span> 目前十年大限所在宮(盤面為洋紅色粗框)
        <span class="mark mark-流年">流年</span> 今年流年所在宮(盤面為藍色粗框)
        <span class="mark mark-小限">小限</span> 小限
      </div>
      <p class="muted">宮名旁的 ☆ 是本宮吉凶程度(最多 5 顆,由弱到強):<b class="sc-good">紅色 = 吉</b>、<b class="sc-bad">黑色 = 凶</b>。依本宮星曜、亮度與生年四化加總的簡化估算,權重可在 js/reading_data.js 調整。</p>
      <h3>目前大限與流年</h3>
      <div class="rd-summary">${summaryHtml(rd.summary, ch)}</div>
      <h3>十二宮解說(從命宮起依序)</h3>
      <div class="rd-grid">${rd.palaces.map(palaceHtml).join("")}</div>
      ${siHuaHtml(rd.siHua)}
      ${scoreTableHtml(rd.palaces)}`;
    box.style.display = "block";
  };
})(typeof window !== "undefined" ? window : globalThis);
