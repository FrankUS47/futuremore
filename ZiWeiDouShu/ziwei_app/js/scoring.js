/* 各宮吉凶☆評分(只看本宮星曜、亮度、四化;權重在 reading_data.js) */
(function (root) {
  const ZW = root.ZW;

  ZW.scorePalace = function (cell) {
    const W = ZW.scoreWeights;
    let good = 0, bad = 0;
    const goodSet = new Set(W.goodMinor), badSet = new Set(W.badMinor);

    [...cell.left, ...cell.right].forEach((s) => {
      if (s.kind === "main") {
        const [g, b] = W.mainBright[s.bright] || [0, 0];
        good += g; bad += b;
      } else if (W.goodAux[s.name]) {
        good += W.goodAux[s.name];
      } else if (W.badAux[s.name]) {
        bad += W.badAux[s.name] * (W.badAuxBrightFactor[s.bright] || 1);
      } else if (goodSet.has(s.name)) {
        good += W.minorWeight;
      } else if (badSet.has(s.name)) {
        bad += W.minorWeight;
      }
      if (s.sihua) {
        const [g, b] = W.siHua[s.sihua];
        good += g; bad += b;
      }
    });

    const lv = (x) => Math.max(0, Math.min(W.maxStars, Math.round(x)));
    return { goodScore: good, badScore: bad, goodLevel: lv(good), badLevel: lv(bad) };
  };
})(typeof window !== "undefined" ? window : globalThis);
