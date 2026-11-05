/* 亂數:一律使用瀏覽器的密碼學亂數(crypto),不用 Math.random。 */
window.QQ = window.QQ || {};

QQ.random = (function () {
  const buf = new Uint32Array(1);

  /* 0 ~ n-1 的均勻整數(拒絕取樣,避免取餘數造成偏差) */
  function int(n) {
    const limit = Math.floor(4294967296 / n) * n;
    let x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % n;
  }

  /* Fisher–Yates 洗牌,回傳新陣列 */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return { int, shuffle };
})();
