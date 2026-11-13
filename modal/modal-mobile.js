/* Prototype A on compact screens. Runs after Prototype A's app.js and only switches the dialog between
   the category list and one category. Selections, Apply, Cancel, Clear and validation stay in app.js. */
(function () {
  'use strict';

  const mq = window.matchMedia('(max-width: 820px)');
  const isCompact = () => (typeof window.cfIsCompactTest === 'function' ? window.cfIsCompactTest() : mq.matches);
  const $ = (sel) => document.querySelector(sel);
  const overlay = $('#overlay');
  const modal = $('#modal');

  const back = document.createElement('button');
  back.type = 'button';
  back.id = 'modalBack';
  back.className = 'icon-btn modal__back';
  back.setAttribute('aria-label', 'Back to all preferences');
  back.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-arrow-left"/></svg>';
  modal.querySelector('.modal__head').prepend(back);

  function show(view) {
    modal.classList.toggle('is-list', view === 'list');
    modal.classList.toggle('is-pane', view === 'pane');
  }

  function focusPaneTitle() {
    const title = $('#paneTitle');
    if (!title) return;
    title.tabIndex = -1;
    title.focus();
  }

  // The dialog always opens on the category list.
  new MutationObserver(() => { if (!overlay.hidden) show('list'); })
    .observe(overlay, { attributes: true, attributeFilter: ['hidden'] });
  show('list');

  document.addEventListener('click', (e) => {
    if (!isCompact() || overlay.hidden) return;
    const t = e.target;
    if (t.closest('#modalBack')) {
      show('list');
      const tab = $('.cat[aria-selected="true"]');
      if (tab) tab.focus();
      return;
    }
    // app.js re-renders the list on select, so the tapped button is already detached from #cats here.
    if (t.closest('.cat[data-cat]')) { show('pane'); focusPaneTitle(); return; }
    // Still open after Apply means English or French is missing. app.js has opened Language but could not
    // focus English while the list was showing, so focus it once the pane is visible.
    if (t.closest('#modalApply')) {
      show('pane');
      const english = $('#pane [data-opt="English"]');
      if (english) english.focus();
    }
  });
})();
