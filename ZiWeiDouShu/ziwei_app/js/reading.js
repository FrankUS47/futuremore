/* 由命盤資料產生解說結構(不碰 DOM):每宮的宮義、本宮星曜、三方四正、四化 */
(function (root) {
  const ZW = root.ZW;
  const mod = ZW.mod;

  const shortName = (n) => n.replace(/宮$/, "");
  const mainOf = (c) => c.left.filter((s) => s.kind === "main");
  const refOf = (ch, b) => {
    const c = ch.cells[b];
    return { branch: ZW.branches[b], name: c.name, stars: [...c.left, ...c.right].map((s) => s.text), main: mainOf(c).map((s) => s.text) };
  };

  /* 三方四正:本宮、對宮(+6)、兩個三合宮(+4、-4) */
  ZW.sanFangSiZheng = function (ch, b) {
    return {
      self: refOf(ch, b),
      opposite: refOf(ch, mod(b + 6, 12)),
      trines: [refOf(ch, mod(b + 4, 12)), refOf(ch, mod(b - 4, 12))]
    };
  };

  ZW.buildReading = function (ch) {
    const palaces = [];
    for (let k = 0; k < 12; k++) {
      const b = mod(ch.mingIdx - k, 12);
      const c = ch.cells[b];
      const key = shortName(c.name);
      const sf = ZW.sanFangSiZheng(ch, b);
      const mains = mainOf(c);
      const empty = mains.length === 0;
      const oppMains = mainOf(ch.cells[mod(b + 6, 12)]);

      /* 本宮星曜象意(主星 + 六吉六煞 + 祿存天馬) */
      const starNotes = c.left.map((s) => ({
        text: s.text, kind: s.kind,
        meaning: ZW.starMeaning[s.name] || "",
        hua: s.sihua ? `化${s.sihua}:${ZW.siHuaMeaning[s.sihua]}` : ""
      }));

      /* 三方四正內的四化(本宮、對宮、兩三合) */
      const group = [b, mod(b + 6, 12), mod(b + 4, 12), mod(b - 4, 12)];
      const huaInGroup = [];
      group.forEach((gb) => {
        [...ch.cells[gb].left, ...ch.cells[gb].right].forEach((s) => {
          if (s.sihua) huaInGroup.push({ star: s.name, hua: "化" + s.sihua, palace: ch.cells[gb].name, self: gb === b });
        });
      });

      palaces.push({
        branch: b, branchName: ZW.branches[b], name: c.name, stem: c.stem, key,
        meaning: ZW.palaceMeaning[key], isMing: c.isMing, isShen: c.isShen, marks: c.marks.slice(),
        limit: c.limit, empty, borrowed: empty ? oppMains.map((s) => s.text) : [],
        starNotes, sf, huaInGroup, score: ZW.scorePalace(c)
      });
    }

    /* 目前大限 / 流年 / 小限 摘要 */
    const f = ch.flow;
    const summary = { enabled: f.enabled };
    if (f.enabled) {
      summary.year = f.year; summary.yearGZ = ZW.ganZhiOfYear(f.year); summary.age = f.age;
      const pick = (idx) => (idx >= 0 && idx != null ? { branchName: ZW.branches[idx], name: ch.cells[idx].name, sf: ZW.sanFangSiZheng(ch, idx) } : null);
      summary.big = pick(f.bigIdx);
      if (summary.big) summary.big.limit = ch.cells[f.bigIdx].limit;
      summary.small = pick(f.smallIdx);
      summary.liunian = pick(f.yearIdx);
    }
    /* 本命四化:各化星落在哪一宮 */
    const siHua = ch.siHua.map((x) => {
      let where = null;
      ch.cells.forEach((c) => {
        const st = [...c.left, ...c.right].find((q) => q.name === x.star);
        if (st) where = { branchName: ZW.branches[c.branch], palace: c.name, bright: st.bright, isMing: c.isMing };
      });
      const h = x.hua.replace("化", "");
      return { star: x.star, hua: x.hua, h, starMeaning: ZW.starMeaning[x.star] || "", huaMeaning: ZW.siHuaMeaning[h], where };
    });
    return { summary, palaces, siHua };
  };
})(typeof window !== "undefined" ? window : globalThis);
