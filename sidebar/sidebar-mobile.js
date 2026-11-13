/* Prototype B on compact screens. Runs after Prototype B's app.js and only opens and closes the drawer.
   Draft, sections, Apply, Clear and validation stay in app.js. */
(function () {
  'use strict';

  const mq = window.matchMedia('(max-width: 820px)');
  const isCompact = () => (typeof window.cfIsCompactTest === 'function' ? window.cfIsCompactTest() : mq.matches);
  const $ = (sel) => document.querySelector(sel);
  const side = $('#side');
  const prefsBtn = $('#prefsBtn');

  const scrim = document.createElement('div');
  scrim.className = 'drawer-scrim';
  scrim.id = 'drawerScrim';
  scrim.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scrim);

  // Everything behind the drawer is inert while it is open, which keeps focus inside it.
  const behind = ['.skip-link', 'header.nav', '.page__crumbs', '.page__head', '.main-col'].map((s) => $(s)).filter(Boolean);
  let open = false;

  function setOpen(next, opts) {
    opts = opts || {};
    open = next && isCompact();
    document.body.classList.toggle('is-drawer-open', open);
    behind.forEach((el) => { el.inert = open; });
    if (isCompact()) prefsBtn.setAttribute('aria-expanded', String(open));
    if (open && opts.focus !== false) {
      const head = $('.sec__head');
      if (head) head.focus({ preventScroll: true });
    }
    if (!open && opts.returnFocus) prefsBtn.focus();
  }

  function syncMode() {
    if (isCompact()) {
      side.setAttribute('role', 'dialog');
      side.setAttribute('aria-modal', 'true');
      setOpen(false);
    } else {
      side.removeAttribute('role');
      side.removeAttribute('aria-modal');
      setOpen(false);
      prefsBtn.setAttribute('aria-expanded', String(!$('#layout').classList.contains('is-collapsed')));
    }
  }
  if (!document.documentElement.dataset.testViewport) {
    mq.addEventListener('change', syncMode);
  }
  syncMode();

  const applyBlocked = () => !!$('[data-sec="language"] .sec__error');

  document.addEventListener('click', (e) => {
    if (!isCompact()) return;
    const t = e.target;
    if (t.closest('#prefsBtn')) { setOpen(true); return; }
    if (t.closest('#sideClose') || t === scrim) { setOpen(false, { returnFocus: true }); return; }
    // Apply closes the drawer, as Apply closes the dialog in A. A blocked Apply keeps it open on Language.
    if (t.closest('#sideApply')) { if (!applyBlocked()) setOpen(false, { returnFocus: true }); return; }
    if (t.closest('#sessionReset')) { setOpen(false); return; }
  });

  document.addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape' && $('#sortMenu').hidden) setOpen(false, { returnFocus: true });
  });
})();
