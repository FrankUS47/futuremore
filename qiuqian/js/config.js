/* 設定檔:新增籤種、調整擲筊靈敏度、解說段落顯示順序,都在這裡改。 */
window.QQ = window.QQ || {};

QQ.config = {
  /* 擲筊規則:需要「連續」幾個聖筊才算神明允准 */
  rules: { options: [1, 3], defaultNeed: 1 },

  /* 晃動偵測(滑鼠/觸控):在 windowMs 內來回換向 minReversals 次,視為開始晃動;
     停止移動超過 stillMs,視為停止 → 擲出筊杯 */
  shake: {
    minReversals: 4,   // 開始晃動所需的換向次數
    windowMs: 1000,    // 計算換向的時間窗
    stillMs: 600,      // 靜止多久算「停下來」
    minShakeMs: 250,   // 晃動至少持續多久才算數(避免不小心掃過)
    minMove: 6,            // 小於這個像素的移動視為抖動雜訊
    maxShakeMs: 5000      // 一直停不下來時,最久幾毫秒後自動擲出
  },

  /* 籤種:enabled=false 會顯示但不能選。poemDirs 依序嘗試(相容 poems/001.json 與 poems/fs100/001.json) */
  series: [
    {
      id: 'fs100', name: '行天宮籤', official: '關聖帝君一百籤', temple: '行天宮',
      patron: '恩主公', total: 100, enabled: true,
      imageDir: 'images', imageExt: '.jpg', poemDirs: ['poems/fs100', 'poems'],
      blurb: '臺北行天宮所用的關聖帝君一百籤,共一百首。'
    },
    {
      id: 'fengtian', name: '奉天宮籤', official: '媽祖六十甲子籤', temple: '新港奉天宮',
      patron: '媽祖', total: 60, enabled: false,
      imageDir: 'images/fengtian', imageExt: '.jpg', poemDirs: ['poems/fengtian'],
      blurb: '籤詩資料準備中,敬請期待。'
    }
  ],

  /* ── 擲筊用的圖片(想換圖,把新檔案放進 img\ 資料夾即可)──
     handsImage — 擲筊前、晃動時顯示的「雙手捧筊」圖(png / jpg / gif 都可以)
     beiAnim    — 停止晃動後,依擲出的結果播放對應動畫(GIF 或 WebP 都可以)
       src 可寫多個檔名,依序找第一個存在的;所以把新的 toss_sheng.gif 放進 img\ 就會優先使用它
       ms  — 動畫要播多久(毫秒)= 格數 × 每格時間,播完才揭曉結果(例:50 格、每格 0.1 秒 = 5000)。
              動畫換了、秒數不同時,請同步改這個數字。
       ※ 自己的 GIF 預設會「一直重播」,結果畫面會跟著回到第一格。請先用 動畫轉檔.html 處理成「只播一次、停在最後一格」,
         它也會告訴您該填的 ms。 */
  handsImage: 'img/hands.png',
  beiAnim: {
    sheng: { src: ['img/toss_sheng.gif', 'img/toss_sheng.webp'], ms: 5000 },   // 聖筊:一陽一陰
    xiao:  { src: ['img/toss_xiao.gif',  'img/toss_xiao.webp'],  ms: 3000 },   // 笑筊:兩個平面朝上
    yin:   { src: ['img/toss_yin.gif',   'img/toss_yin.webp'],   ms: 5000 }    // 陰筊:兩個圓背朝上
  },

  /* 稟告表單:年齡範圍、問事類別(下拉選單) */
  age: { min: 1, max: 150 },
  categories: ['功名', '生意', '疾病', '婚姻', '感情', '出行', '官司', '時運', '求財', '求子', '解夢'],

  /* 手機/平板晃動(devicemotion):加速度(m/s²)超過 threshold 才算在晃動 */
  motion: { threshold: 5, probeMs: 1500 },

  /* 結果頁的解說段落:poems\NNN.json 的 sections 裡有什麼欄位就顯示什麼,日後新增欄位不用改程式。
     order    — 這些欄位優先、依此順序排在前面;其餘欄位依檔案內的順序接在後面
     hide     — 不顯示的欄位(爬蟲抓進來的網頁雜項)
     collapsed— 預設收合的欄位 */
  sections: {
    order: ['解說', '聖意', '解曰', '詩意', '東坡解', '碧仙註', '釋義', '釋字詞', '典故', '故事'],
    hide: ['關聖帝君一百籤', '婚姻', '官司', '求財', '籤詩', '籤詩語譯(多語系)'],
    collapsed: []
  }
};
