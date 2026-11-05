/* 判斷目前是電腦還是行動裝置(手機/平板)。
 * 行動裝置沒有滑鼠,擲筊改用「晃動手機」;電腦則用「晃動滑鼠」。
 * 測試時可在網址後加 ?mode=mobile 或 ?mode=desktop 強制指定。 */
window.QQ = window.QQ || {};

QQ.device = (function () {
  const ua = navigator.userAgent || '';
  const q = /[?&]mode=(mobile|desktop|tablet)\b/.exec(location.search);
  const forced = q ? q[1] : null;

  const isIPhone = /iPhone|iPod/.test(ua);
  const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);   // iPadOS 偽裝成 Mac
  const isAndroid = /Android/.test(ua);
  const uaMobileFlag = !!(navigator.userAgentData && navigator.userAgentData.mobile);
  const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse) and (hover: none)').matches);

  let kind = 'desktop';
  if (isIPad || (isAndroid && !/Mobile/.test(ua))) kind = 'tablet';
  else if (isIPhone || isAndroid || uaMobileFlag || /Mobile|Windows Phone|BlackBerry/.test(ua)) kind = 'mobile';
  else if (coarse) kind = Math.min(screen.width, screen.height) >= 600 ? 'tablet' : 'mobile';
  if (forced) kind = forced;

  const isMobile = kind !== 'desktop';
  const label = { desktop: '電腦', mobile: '手機', tablet: '平板' }[kind];

  /* 回傳擲筊用的偵測器:行動裝置且感應器可用 → 晃動裝置;否則 → 滑鼠/手指滑動 */
  function createDetector(handlers) {
    if (isMobile && QQ.motion && QQ.motion.state === 'ready') return new QQ.MotionDetector(handlers);
    return new QQ.ShakeDetector(handlers);
  }

  return { kind, label, isMobile, forced, createDetector };
})();
