/* Run in <head> before styles: locks layout to mobile or desktop test mode (not fluid responsive). */
(function () {
  'use strict';
  const p = new URLSearchParams(location.search);
  const mode = (p.get('viewport') || 'auto').toLowerCase();
  const root = document.documentElement;
  if (mode === 'mobile' || mode === 'desktop') {
    root.dataset.testViewport = mode;
  }
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  if (mode === 'mobile') {
    meta.setAttribute('content', 'width=390, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content');
  } else if (mode === 'desktop') {
    meta.setAttribute('content', 'width=1440, initial-scale=1, viewport-fit=cover');
  }
})();
