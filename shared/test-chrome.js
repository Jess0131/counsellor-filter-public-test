/* Test harness: home link + optional mode label. Loads after DOM is available. */
(function () {
  'use strict';

  function testHomeUrl() {
    const p = new URLSearchParams(location.search);
    const u = new URL('../index.html', location.href);
    const lang = p.get('lang');
    if (lang) u.searchParams.set('lang', lang);
    const from = p.get('from');
    const vp = p.get('viewport');
    if (from === 'mobile' || vp === 'mobile') u.hash = 'mobileTitle';
    else if (from === 'french' || (lang && lang.toLowerCase().startsWith('fr'))) u.hash = 'frenchTitle';
    else u.hash = 'desktopTitle';
    return u.pathname + u.search + u.hash;
  }

  function bindHome() {
    const el = document.getElementById('testHome');
    if (!el) return;
    el.href = testHomeUrl();
  }

  function modeBanner() {
    const mode = document.documentElement.dataset.testViewport;
    if (!mode) return;
    const bar = document.createElement('p');
    bar.className = 'test-mode-bar';
    bar.setAttribute('role', 'status');
    bar.textContent = mode === 'mobile'
      ? 'Mobile test mode (fixed 390px layout). Resize the window will not change this view.'
      : 'Desktop test mode (fixed 1440px layout).';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { bindHome(); modeBanner(); });
  } else {
    bindHome();
    modeBanner();
  }
})();
