/* 離線與安裝:註冊 Service Worker、顯示離線狀態、Android 安裝按鈕、iPhone 加入主畫面提示 */
(function () {
  const ZW = window.ZW || {};
  const info = () => document.getElementById("appInfo");
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  let deferredPrompt = null;
  let state = { offline: false, updated: false };

  function render() {
    const el = info();
    if (!el) return;
    const parts = [`版本 ${ZW.VERSION || "?"}`];
    if (location.protocol === "file:") parts.push("本機檔案模式(不需網路;無法加入主畫面)");
    else if (state.offline) parts.push('<span class="ok">已可離線使用 ✓</span>');
    else if ("serviceWorker" in navigator) parts.push("首次載入中…完成後即可離線使用");
    else parts.push("此瀏覽器不支援離線快取");
    if (state.updated) parts.push("已下載新版,關閉後重新開啟即生效");
    let html = parts.join(" · ");
    if (deferredPrompt) html += ' <button type="button" id="btnInstall">安裝到手機</button>';
    else if (isIOS && !standalone && location.protocol !== "file:") html += "<br>iPhone:用 Safari 開啟,點下方「分享」→「加入主畫面」即可像 App 一樣使用";
    el.innerHTML = html;
    const b = document.getElementById("btnInstall");
    if (b) b.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => {});
      deferredPrompt = null;
      render();
    });
  }

  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; render(); });
  window.addEventListener("appinstalled", () => { deferredPrompt = null; render(); });

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (w) w.addEventListener("statechange", () => { if (w.state === "installed" && hadController) { state.updated = true; render(); } });
      });
    }).catch(() => {});
    navigator.serviceWorker.ready.then(() => { state.offline = true; render(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render); else render();
})();
