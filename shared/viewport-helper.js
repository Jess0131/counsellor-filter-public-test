/* Shared compact check for modal/sidebar mobile layers. */
(function () {
  'use strict';
  const mq = window.matchMedia('(max-width: 820px)');
  window.cfTestViewport = function cfTestViewport() {
    const mode = document.documentElement.dataset.testViewport;
    if (mode === 'mobile') return 'mobile';
    if (mode === 'desktop') return 'desktop';
    return mq.matches ? 'mobile' : 'desktop';
  };
  window.cfIsCompactTest = function cfIsCompactTest() {
    return window.cfTestViewport() === 'mobile';
  };
})();
