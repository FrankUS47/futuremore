/* 啟動與離線（Service Worker）註冊 */
document.addEventListener("DOMContentLoaded", UI.init);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
