八字紫微排盤 —— 手機離線版（不需 App Store / Google Play）
==========================================================

這是一個 PWA（可安裝到主畫面的網頁程式）。第一次透過「網址」打開並加入主畫面後，
之後完全不需要網路即可使用，所有運算都在手機上完成，資料不會上傳。

一、把整個資料夾放到可以用「https 網址」開啟的位置（只需做一次）
    免費方式擇一：
    1. GitHub Pages：建立公開儲存庫，把本資料夾全部檔案上傳，Settings → Pages 開啟。
    2. Cloudflare Pages / Netlify：到 app.netlify.com/drop，直接把本資料夾拖進網頁即可。
    3. 自己的網站空間：上傳整個資料夾，用 https 開啟 index.html。
    ※ 必須是 https（或 localhost），否則手機不會啟用離線功能。

二、iPhone（Safari）
    1. 用 Safari 開啟網址，等頁面完整載入。
    2. 點下方「分享」→「加入主畫面」→「加入」。
    3. 從主畫面圖示開啟；之後即使飛航模式也能使用。
    ※ iPhone 請務必使用 Safari 安裝（其他瀏覽器無法加入主畫面離線）。

三、Android（Chrome）
    1. 用 Chrome 開啟網址，等頁面載入。
    2. 右上角選單 →「安裝應用程式」或「加到主畫面」。
    3. 從主畫面圖示開啟；離線可用。

四、更新版本
    更換檔案後，把 sw.js 第一行的 VERSION（例如 bazi-v1）改成 bazi-v2，
    重新上傳；手機連網開啟一次即會自動換成新版。

五、檔案說明（模組化，可單獨修正）
    index.html            頁面骨架
    css/style.css         主要樣式
    css/mobile.css        手機版面（iPhone / Android）
    js/astro.js           節氣（太陽黃經）
    js/data.js            天干地支、五行、藏干、納音等資料表
    js/calendar.js        農曆、日柱、真太陽時、四柱
    js/bazi.js            八字排盤、大運
    js/ziwei.js           紫微斗數排盤（星曜、四化、大限、來因宮、亮度）
    js/bone_data.js       稱骨逐重量解說
    js/analysis.js        五行強弱、格局用神、大運流年吉凶、稱骨
    js/places.js          出生地點與經度
    js/summary.js         八字×紫微綜合總結
    js/flow.js            流年／流月／流日／流時查詢
    js/ui.js              畫面與報告輸出
    js/main.js            啟動與離線註冊
    sw.js                 離線快取
    manifest.webmanifest  安裝設定
    icons/                圖示

六、不想架網站時的替代方式
    直接使用單檔版 Z8.html（內含全部程式，不需網路）：
    - Android：用「檔案」App 以 Chrome 開啟即可。
    - iPhone：Safari 無法直接開啟本機檔案，可先存到「檔案」，再用支援 HTML 的
      檔案瀏覽 App 開啟（例如 Documents by Readdle 的內建瀏覽器）。
    此方式沒有主畫面圖示，建議優先使用第一～三項。
