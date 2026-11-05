# 紫微斗數線上排盤系統

雙擊 `index.html` 即可使用(不需要伺服器)。

| 檔案 | 內容 |
|---|---|
| index.html | 頁面與表單 |
| css/style.css | 樣式 |
| js/data.js | 常數、甲級星亮度表(依紫微人生甲級星廟旺利陷表)、十二神名稱 |
| js/brightness_minor.js | 乙級星(雜曜)廟平陷表(選用,表單勾選才顯示) |
| js/lunar_table.js | 農曆資料表 1900–2030 |
| js/lunar.js | 國曆/農曆互換 |
| js/engine.js | 排盤引擎(命宮、五行局、星曜、四化、十二神、大小限、流運) |
| js/reading_data.js | 宮義、星曜象意、四化、讀盤步驟(解說用文字資料) |
| js/reading.js | 產生解說結構(三方四正、空宮借星、四化) |
| js/render.js | 盤面繪製 |
| js/render_reading.js | 命盤下方解說區繪製 |
| js/export.js | 12 行純文字檔(全部資訊 / 只存星曜) |
| js/app.js | 表單互動 |
| test/test_reference.js | 以範例盤驗證:`node test/test_reference.js` |
| test/compare_iztro.js | 與獨立的 iztro 程式庫大量對照(選用):`npm install iztro` 後執行 `node test/compare_iztro.js 3000` |
| manifest.webmanifest | PWA 設定(名稱、圖示、主題色) |
| sw.js | Service Worker:第一次連線後把全部檔案存進手機,之後離線可用 |
| js/version.js | 版本號(**改任何檔案後請 +1**,手機才會換成新版) |
| js/pwa.js | 離線狀態、Android「安裝到手機」按鈕、iPhone 加入主畫面提示 |
| icons/ | App 圖示(一般、遮罩版、iOS 用) |
| tools/build_single.py | 合併成單一 HTML:`python3 tools/build_single.py` → `dist/ziwei_single.html` |
| dist/ziwei_single.html | 單一檔案版(CSS/JS 全內嵌),Android 可直接從檔案開啟 |
| 手機安裝說明.md | iPhone / Android 安裝與離線使用步驟 |
