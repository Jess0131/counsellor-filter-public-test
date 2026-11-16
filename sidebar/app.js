/* Prototype B - Counsellor filter sidebar.
   Same data (shared/data.js) and the same rules (shared/matching.js) as Prototype A. Only the filter
   presentation differs: a persistent sidebar with accordion sections instead of a modal.
   Selections are a draft until Apply. */
(function () {
  'use strict';

  const { CONFIG, INITIAL_STATE, CATEGORIES, COUNSELLORS, DESIGNATION_DISPLAY } = window.CF_DATA;
  const M = window.CF_MATCH;

  const ASSET_BASE = '../shared/';
  // Six options before "Show N more" (Language: 6 shown, "Show 40 more").
  const SIDE_VISIBLE_OPTIONS = 6;
  // Accordion sections start collapsed so participants open categories as needed.
  const DEFAULT_OPEN = [];

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const ic = (id, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>';
  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sortByOptionOrder = (cat, values) => values.slice().sort((a, b) => cat.options.indexOf(a) - cat.options.indexOf(b));
  const catLoc = (cat) => (typeof window.cfLocalizedCategory === 'function' ? window.cfLocalizedCategory(cat) : cat);
  const optLabel = (catId, value) => (typeof window.cfLocalizedOption === 'function' ? window.cfLocalizedOption(catId, value) : value);
  const optMatches = (catId, value, q) => (typeof window.cfOptionMatchesSearch === 'function' ? window.cfOptionMatchesSearch(catId, value, q) : norm(value).includes(q));
  const i18n = () => window.CF_I18N || {};
  const errorMessage = (kind) => (kind === 'modality' ? i18n().errModality : i18n().errLanguage) || (kind === 'modality' ? 'A modality must be selected' : 'Select English or French to apply your preferences.');

  /* ---------------------------------------------------------------- State */
  const state = { applied: clone(INITIAL_STATE), sort: 'best', favs: new Set() };
  const ui = { draft: clone(INITIAL_STATE), sideOpen: false, openSecs: new Set(DEFAULT_OPEN), search: {}, expanded: {} };
  const isDirty = () => JSON.stringify(ui.draft) !== JSON.stringify(state.applied);
  const eventTargetEl = (e) => {
    const t = e.target;
    if (t instanceof Element) return t;
    return t && t.parentElement instanceof Element ? t.parentElement : null;
  };

  /* ---------------------------------------------------------------- Log, toast, announcements */
  function log() {}
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
  }
  function announce(msg) {
    const el = $('#live');
    el.textContent = '';
    setTimeout(() => { el.textContent = msg; }, 30);
  }

  /* ---------------------------------------------------------------- Chips (same markup as Prototype A) */
  function chipsHtml(sel, scope) {
    const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
    const out = [];
    M.CHIP_ORDER.forEach((id) => {
      sel[id].forEach((v) => {
        const display = optLabel(id, v);
        const required = M.isRequiredChip(id, sel[id], v);
        if (required) {
          out.push('<li class="chip chip--required">' + esc(display) + '</li>');
        } else {
          const removeLabel = u ? u.removeAria(display) : ('Remove ' + display);
          out.push('<li class="chip">' + esc(display) +
            '<button type="button" data-remove="' + id + '" data-value="' + esc(v) + '" data-scope="' + scope + '" aria-label="' + esc(removeLabel) + '">' + ic('xcircle') + '</button></li>');
        }
      });
    });
    return out.join('');
  }

  /* ---------------------------------------------------------------- Directory (same cards as Prototype A) */
  function cardHtml(r) {
    const c = r.c;
    const applied = state.applied;
    const designations = c.designations.map((d) => ({ label: DESIGNATION_DISPLAY[d] || d, met: applied.designation.includes(d) }));
    const specs = c.specialties.slice().sort((a, b) => applied.specialty.includes(b) - applied.specialty.includes(a)).slice(0, 3);
    const meets = r.total
      ? '<span class="meets' + (r.met.length ? '' : ' meets--none') + '" title="' + esc((r.met.length ? 'Meets: ' + r.met.join(', ') + '. ' : '') + (r.unmet.length ? 'Does not meet: ' + r.unmet.join(', ') + '.' : '')) + '">' +
        ic('checkcircle') + 'Meets ' + r.met.length + (r.met.length === 1 ? ' preference' : ' preferences') + '</span>'
      : '';
    const photo = c.photo
      ? '<img src="' + ASSET_BASE + c.photo + '" alt="" width="113" height="123">'
      : '<div class="card__initials" aria-hidden="true">' + esc(M.counsellorInitials(c.name)) + '</div>';
    const fav = state.favs.has(c.id);
    return '<li class="card" data-id="' + c.id + '">' +
      '<div class="card__top">' +
        '<div class="card__photo">' + photo +
          '<button type="button" class="heart" data-fav="' + c.id + '" aria-pressed="' + fav + '" aria-label="Save ' + esc(c.name) + ' to My Favourites">' + ic(fav ? 'heart-fill' : 'heart') + '</button></div>' +
        '<div class="card__info"><h2 class="card__name">' + esc(c.name) + '</h2>' +
          '<p class="card__meta">' + esc(c.pronouns) + '</p><p class="card__meta">' + esc(c.gender.join(', ')) + '</p>' +
          '<p class="card__meta" title="' + esc(c.languages.join(', ')) + '">' + esc(c.languages.join(', ')) + '</p></div>' +
      '</div>' +
      '<div class="card__body">' + meets +
        '<p class="next">' + ic('cal') + 'Next availability: ' + esc(M.nextLabel(c.next)) + '</p>' +
        '<div><p class="card__label">Designations</p><ul class="bullets">' +
          designations.map((d) => '<li' + (d.met ? ' class="is-match"' : '') + '>' + esc(d.label) + '</li>').join('') + '</ul></div>' +
        '<div><p class="card__label">Specialities</p><ul class="bullets">' +
          specs.map((s) => '<li' + (applied.specialty.includes(s) ? ' class="is-match"' : '') + '>' + esc(s) + '</li>').join('') + '</ul></div>' +
        '<p class="card__hint">Select View profile to learn more about this counsellor</p>' +
      '</div>' +
      '<div class="card__actions"><button type="button" class="btn btn--outline btn--wide" data-stub="Profiles are not part of this prototype.">View Profile</button></div>' +
    '</li>';
  }

  function renderDirectory() {
    const rows = M.computeResults(state.applied, state.sort);
    const n = rows.length;
    $('#prefsCount').textContent = M.countValues(state.applied);
    const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
    $('#resultCount').textContent = n + (u ? u.counsellorWord(n) : (n === 1 ? ' counsellor' : ' counsellors'));
    $('#resultHint').textContent = u ? u.resultSubtext : 'Results are prioritized based on your preferences.';
    $('#chips').innerHTML = chipsHtml(state.applied, 'applied');
    $('#grid').innerHTML = rows.map(cardHtml).join('');
    $('#grid').hidden = n === 0;
    $('#empty').hidden = n !== 0;
    $('#sortLabel').textContent = typeof window.cfSortLabel === 'function'
      ? window.cfSortLabel(state.sort)
      : 'Sort by: ' + (state.sort === 'best' ? 'Best fit' : 'Next availability');
    return rows;
  }

  /* ---------------------------------------------------------------- Sort menu (same as Prototype A) */
  const sortOptions = () => {
    const p = window.CF_PAGE;
    if (p) return [['best', p.bestFit], ['next', p.nextAvail]];
    return [['best', 'Best fit'], ['next', 'Next availability']];
  };
  function toggleSortMenu(open) {
    const menu = $('#sortMenu');
    const willOpen = open === undefined ? menu.hidden : open;
    menu.hidden = !willOpen;
    $('#sortBtn').setAttribute('aria-expanded', String(willOpen));
    if (willOpen) {
      menu.innerHTML = sortOptions().map(([id, label]) =>
        '<li role="option" tabindex="-1" data-sort="' + id + '" aria-selected="' + (state.sort === id) + '">' + label + (state.sort === id ? ic('check') : '') + '</li>').join('');
      const sel = $('[aria-selected="true"]', menu);
      if (sel) sel.focus();
    }
  }
  function chooseSort(id) {
    state.sort = id;
    toggleSortMenu(false);
    $('#sortBtn').focus();
    renderDirectory();
    log('Sort set to ' + (id === 'best' ? 'Best fit' : 'Next availability'));
    announce('Sorted by ' + (id === 'best' ? 'Best fit' : 'Next availability') + '.');
  }

  /* ---------------------------------------------------------------- Sidebar */
  function optionsHtml(cat) {
    const q = norm((ui.search[cat.id] || '').trim());
    let list = cat.options;
    let moreCount = 0;
    if (q) list = list.filter((o) => optMatches(cat.id, o, q));
    else if (!ui.expanded[cat.id] && list.length > SIDE_VISIBLE_OPTIONS) {
      moreCount = list.length - SIDE_VISIBLE_OPTIONS;
      list = list.slice(0, SIDE_VISIBLE_OPTIONS);
    }
    const sel = ui.draft[cat.id];
    let html = '<div class="sopts" role="group" aria-labelledby="sectitle-' + cat.id + '">' + list.map((o) => {
      const on = sel.includes(o);
      return '<button type="button" class="sopt' + (on ? ' is-on' : '') + '" role="checkbox" aria-checked="' + on + '" data-cat="' + cat.id + '" data-opt="' + esc(o) + '">' +
        '<span class="opt__box">' + (on ? ic('check') : '') + '</span><span>' + esc(optLabel(cat.id, o)) + '</span></button>';
    }).join('') + (list.length ? '' : (function () {
      const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
      const Lc = catLoc(cat);
      const msg = u ? u.noOptionsMatch(Lc.label, ui.search[cat.id] || '') : ('No ' + Lc.label.toLowerCase() + ' options match \u201c' + (ui.search[cat.id] || '') + '\u201d.');
      return '<p class="sopts__none">' + esc(msg) + '</p>';
    })()) + '</div>';
    if (!q && cat.options.length > SIDE_VISIBLE_OPTIONS) {
      const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
      html += moreCount
        ? '<button type="button" class="more" data-more="' + cat.id + '" aria-expanded="false">' + esc(u ? u.showMore(moreCount) : ('Show ' + moreCount + ' more')) + '</button>'
        : '<button type="button" class="more" data-more="' + cat.id + '" aria-expanded="true">' + esc(u ? u.showFewer : 'Show fewer') + '</button>';
    }
    return html;
  }

  function sectionHeadInner(cat) {
    const L = catLoc(cat);
    const n = ui.draft[cat.id].length;
    const errKind = M.categoryDraftError(cat.id, ui.draft);
    const invalid = !!errKind;
    const req = typeof window.cfRequiredLabel === 'function' ? window.cfRequiredLabel() : (i18n().requiredTag || 'Required');
    let badge = '';
    if (cat.required) badge = '<span class="sec__badge' + (invalid ? ' sec__badge--error' : '') + '">' + esc(req) + '</span>';
    else if (n) {
      const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
      badge = '<span class="sec__badge">' + esc(u ? u.selectedBadge(n) : (n + ' selected')) + '</span>';
    }
    return '<span class="sec__title" id="sectitle-' + cat.id + '">' + esc(L.label) + '</span>' + badge + ic('chev', 'sec__chev');
  }

  function sectionMetaHtml(cat) {
    const L = catLoc(cat);
    const errKind = M.categoryDraftError(cat.id, ui.draft);
    return '<p class="sec__helper">' + esc(L.helper) + '</p>' +
      (errKind ? '<p class="sec__error" role="alert">' + ic('alert') + esc(errorMessage(errKind)) + '</p>' : '');
  }

  function renderSections() {
    $('#sections').innerHTML = CATEGORIES.map((cat) => {
      const L = catLoc(cat);
      const open = ui.openSecs.has(cat.id);
      return '<section class="sec" data-sec="' + cat.id + '">' +
        '<button type="button" class="sec__head" id="sechead-' + cat.id + '" data-toggle="' + cat.id + '" aria-expanded="' + open + '" aria-controls="secbody-' + cat.id + '">' + sectionHeadInner(cat) + '</button>' +
        '<div class="sec__body" id="secbody-' + cat.id + '" role="region" aria-labelledby="sectitle-' + cat.id + '"' + (open ? '' : ' hidden') + '>' +
          '<div data-meta="' + cat.id + '">' + sectionMetaHtml(cat) + '</div>' +
          (cat.search
            ? '<div class="search"><label class="sr-only" for="search-' + cat.id + '">' + esc(L.search) + '</label>' + ic('search') +
              '<input id="search-' + cat.id + '" data-search="' + cat.id + '" type="search" autocomplete="off" placeholder="' + esc(L.search) + '" value="' + esc(ui.search[cat.id] || '') + '">' +
              '<button type="button" class="search__clear" data-search-clear="' + cat.id + '" aria-label="' + esc((typeof window.cfUi === 'function' ? window.cfUi().clearSearch : 'Clear search')) + '"' + (ui.search[cat.id] ? '' : ' hidden') + '>' + ic('x') + '</button></div>'
            : '') +
          '<div data-opts="' + cat.id + '">' + optionsHtml(cat) + '</div>' +
        '</div></section>';
    }).join('');
  }

  function renderSum() {
    const n = M.countValues(ui.draft);
    const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
    $('#sideSum').innerHTML = '<p class="side__sum-count" aria-live="polite"><strong>' + esc(u ? u.selectedCount(n) : (n + ' selected')) + '</strong></p>' +
      '<ul class="chips" aria-label="' + esc(u ? u.chipsAria : 'Selected preferences') + '">' + chipsHtml(ui.draft, 'draft') + '</ul>';
  }

  function renderFoot() {
    const dirty = isDirty();
    $('#pending').hidden = !dirty;
  }

  // Update one section in place so focus and scroll position survive a change.
  function refreshSection(id) {
    const cat = catById[id];
    const head = $('#sechead-' + id);
    if (head) head.innerHTML = sectionHeadInner(cat);
    const meta = $('[data-meta="' + id + '"]');
    if (meta) meta.innerHTML = sectionMetaHtml(cat);
    const opts = $('[data-opts="' + id + '"]');
    if (opts) opts.innerHTML = optionsHtml(cat);
  }

  function refreshSidebar(changedIds) {
    const active = document.activeElement;
    const key = active && active.dataset
      ? (active.dataset.opt ? 'o:' + active.dataset.cat + ':' + active.dataset.opt : active.dataset.remove ? 'r:' + active.dataset.scope + ':' + active.dataset.remove + ':' + active.dataset.value : null)
      : null;
    (changedIds || CATEGORIES.map((c) => c.id)).forEach(refreshSection);
    renderSum();
    renderFoot();
    if (key) {
      const match = $$('[data-opt]').find((el) => 'o:' + el.dataset.cat + ':' + el.dataset.opt === key) ||
        $$('[data-remove]').find((el) => 'r:' + el.dataset.scope + ':' + el.dataset.remove + ':' + el.dataset.value === key);
      if (match) match.focus();
    }
  }

  function renderSidebar() {
    renderSum();
    renderSections();
    renderFoot();
    scheduleSideViewportHeight();
  }

  const SIDE_STICKY_TOP_PX = 16;
  const SIDE_STICKY_BOTTOM_PX = 16;

  function isDesktopSidebarLayout() {
    if ($('#layout').classList.contains('is-collapsed')) return false;
    return !(typeof window.cfIsCompactTest === 'function' && window.cfIsCompactTest());
  }

  /** Sets --side-available-height from viewport minus measured top inset (header, crumbs, test bar, etc.). */
  function syncSideViewportHeight() {
    const side = $('#side');
    const root = document.documentElement;
    if (!side || !isDesktopSidebarLayout()) {
      root.style.removeProperty('--side-available-height');
      root.style.removeProperty('--sidebar-offset');
      return;
    }
    root.style.setProperty('--side-sticky-top', SIDE_STICKY_TOP_PX + 'px');
    root.style.setProperty('--side-sticky-bottom', SIDE_STICKY_BOTTOM_PX + 'px');
    const topInset = Math.max(SIDE_STICKY_TOP_PX, side.getBoundingClientRect().top);
    const offset = topInset + SIDE_STICKY_BOTTOM_PX;
    root.style.setProperty('--sidebar-offset', offset + 'px');
    root.style.setProperty('--side-available-height', 'calc(100dvh - ' + offset + 'px)');
  }

  let sideHeightRaf = 0;
  function scheduleSideViewportHeight() {
    if (sideHeightRaf) return;
    sideHeightRaf = requestAnimationFrame(() => {
      sideHeightRaf = 0;
      syncSideViewportHeight();
    });
  }

  function setSideOpen(open, focusTarget) {
    ui.sideOpen = open;
    $('#layout').classList.toggle('is-collapsed', !open);
    $('#prefsBtn').setAttribute('aria-expanded', String(open));
    if (focusTarget) focusTarget.focus();
    scheduleSideViewportHeight();
    if (open) requestAnimationFrame(() => scheduleSideViewportHeight());
  }

  function openSection(id) {
    if (!ui.openSecs.has(id)) {
      ui.openSecs.add(id);
      const head = $('#sechead-' + id);
      head.setAttribute('aria-expanded', 'true');
      $('#secbody-' + id).hidden = false;
    }
  }

  /* ---------------------------------------------------------------- Draft actions */
  function toggleOption(catId, value) {
    const cat = catById[catId];
    const sel = ui.draft[catId];
    const idx = sel.indexOf(value);
    if (idx >= 0) sel.splice(idx, 1);
    else ui.draft[catId] = sortByOptionOrder(cat, sel.concat(value));
    refreshSidebar([catId]);
    const nowOn = idx < 0;
    const errKind = M.categoryDraftError(catId, ui.draft);
    const tail = errKind === 'language' ? (' ' + (i18n().announceLanguage || 'Select English or French to apply.'))
      : errKind === 'modality' ? (' ' + (i18n().announceModality || 'A modality must be selected.')) : '';
    announce(value + (nowOn ? ' selected.' : ' removed.') + tail);
    log((nowOn ? 'Checked ' : 'Unchecked ') + cat.label + ': ' + value);
  }

  function removeDraftChip(catId, value) {
    const chips = $$('#sideSum [data-remove]');
    const pos = chips.findIndex((b) => b.dataset.remove === catId && b.dataset.value === value);
    const sel = ui.draft[catId];
    const i = sel.indexOf(value);
    if (i >= 0) sel.splice(i, 1);
    refreshSidebar([catId]);
    const next = $$('#sideSum [data-remove]');
    (next[Math.min(pos, next.length - 1)] || $('#sideClear')).focus();
    const errKind = M.categoryDraftError(catId, ui.draft);
    const tail = errKind === 'language' ? (' ' + (i18n().announceLanguage || 'Select English or French to apply.'))
      : errKind === 'modality' ? (' ' + (i18n().announceModality || 'A modality must be selected.')) : '';
    announce(value + ' removed.' + tail);
    log('Removed chip in sidebar: ' + catById[catId].chip + ': ' + value);
  }

  function applyDraft() {
    if (!M.hasRequiredLanguage(ui.draft.language)) {
      openSection('language');
      refreshSection('language');
      const sec = $('[data-sec="language"]');
      sec.scrollIntoView({ block: 'start', behavior: 'smooth' });
      const first = $('[data-cat="language"][data-opt="English"]');
      if (first) first.focus({ preventScroll: true });
      announce(i18n().announceLanguage || 'Select English or French to apply.');
      log('Apply blocked: English or French is required');
      return;
    }
    if (!M.hasRequiredFormat(ui.draft.format)) {
      openSection('format');
      refreshSection('format');
      const sec = $('[data-sec="format"]');
      if (sec) sec.scrollIntoView({ block: 'start', behavior: 'smooth' });
      const first = $('[data-cat="format"][data-opt="Video"]') || $('[data-cat="format"][data-opt="Voice"]');
      if (first) first.focus({ preventScroll: true });
      announce('Preferences not applied. ' + (i18n().announceModality || 'A modality must be selected.'));
      log('Apply blocked: modality is required');
      return;
    }
    const before = M.countValues(state.applied);
    state.applied = clone(ui.draft);
    const rows = renderDirectory();
    renderFoot();
    log('Applied Preferences (' + before + ' to ' + M.countValues(state.applied) + ' selected)');
    announce('Preferences applied. ' + rows.length + ' counsellors listed.');
    toast('Preferences applied. ' + rows.length + (rows.length === 1 ? ' counsellor' : ' counsellors') + '.');
  }

  function clearDraft() {
    ui.draft = M.clearedFrom(ui.draft);
    refreshSidebar();
    announce('Preferences cleared in the sidebar. Select Apply Preferences to save.');
    log('Clear Preferences in sidebar (' + (CONFIG.CLEAR_BEHAVIOR === 'defaults' ? 'restores Video, Voice, English' : 'keeps session format, language set to English') + ')');
  }

  /* ---------------------------------------------------------------- Directory actions */
  function clearApplied() {
    const before = M.countValues(state.applied);
    state.applied = M.clearedFrom(state.applied);
    ui.draft = clone(state.applied);
    const rows = renderDirectory();
    refreshSidebar();
    announce('Choices cleared. ' + rows.length + ' counsellors listed.');
    toast('Choices cleared. Language set to English.');
    log('Clear choices (' + before + ' to ' + M.countValues(state.applied) + ' selected)');
  }

  // Removing an applied chip applies at once, as in Prototype A, and also removes it from the draft.
  function removeAppliedChip(catId, value) {
    const pos = $$('#chips [data-remove]').findIndex((b) => b.dataset.remove === catId && b.dataset.value === value);
    [state.applied[catId], ui.draft[catId]].forEach((sel) => {
      const i = sel.indexOf(value);
      if (i >= 0) sel.splice(i, 1);
    });
    const rows = renderDirectory();
    refreshSidebar([catId]);
    const chips = $$('#chips [data-remove]');
    (chips[Math.min(pos, chips.length - 1)] || $('#prefsBtn')).focus();
    announce(value + ' removed. ' + rows.length + ' counsellors listed.');
    log('Removed chip: ' + catById[catId].chip + ': ' + value);
  }

  function resetSession() {
    state.applied = clone(INITIAL_STATE);
    state.sort = 'best';
    state.favs = new Set();
    ui.draft = clone(INITIAL_STATE);
    ui.openSecs = new Set(DEFAULT_OPEN);
    ui.search = {};
    ui.expanded = {};
    toggleSortMenu(false);
    setSideOpen(false);
    renderDirectory();
    renderSidebar();
    $('#sideScroll').scrollTop = 0;
    announce('Session reset. 6 preferences applied.');
    toast('Session reset to the start state.');
  }

  /* ---------------------------------------------------------------- Events */
  document.addEventListener('click', (e) => {
    const t = eventTargetEl(e);
    if (!t) return;
    const stub = t.closest('[data-stub]');
    if (stub) { toast(stub.dataset.stub); log('Tapped a control outside this prototype: ' + stub.textContent.trim().replace(/\s+/g, ' ')); return; }
    if (!t.closest('.sort')) toggleSortMenu(false);

    const fav = t.closest('[data-fav]');
    if (fav) {
      const id = fav.dataset.fav;
      if (state.favs.has(id)) state.favs.delete(id); else state.favs.add(id);
      const on = state.favs.has(id);
      fav.setAttribute('aria-pressed', String(on));
      fav.innerHTML = ic(on ? 'heart-fill' : 'heart');
      log((on ? 'Saved ' : 'Removed ') + COUNSELLORS.find((c) => c.id === id).name + (on ? ' to' : ' from') + ' favourites');
      return;
    }
    const rm = t.closest('[data-remove]');
    if (rm) {
      if (rm.dataset.scope === 'draft') removeDraftChip(rm.dataset.remove, rm.dataset.value);
      else removeAppliedChip(rm.dataset.remove, rm.dataset.value);
      return;
    }
    const sortItem = t.closest('[data-sort]');
    if (sortItem) { chooseSort(sortItem.dataset.sort); return; }
    const opt = t.closest('[data-opt]');
    if (opt) { toggleOption(opt.dataset.cat, opt.dataset.opt); return; }
    const tog = t.closest('[data-toggle]');
    if (tog) {
      const id = tog.dataset.toggle;
      const open = !ui.openSecs.has(id);
      if (open) ui.openSecs.add(id); else ui.openSecs.delete(id);
      tog.setAttribute('aria-expanded', String(open));
      $('#secbody-' + id).hidden = !open;
      log((open ? 'Expanded section: ' : 'Collapsed section: ') + catById[id].label);
      return;
    }
    const more = t.closest('[data-more]');
    if (more) {
      const id = more.dataset.more;
      ui.expanded[id] = !ui.expanded[id];
      $('[data-opts="' + id + '"]').innerHTML = optionsHtml(catById[id]);
      const again = $('[data-more="' + id + '"]');
      if (again) again.focus();
      log((ui.expanded[id] ? 'Expanded ' : 'Collapsed ') + catById[id].label + ' options');
      return;
    }
    const sc = t.closest('[data-search-clear]');
    if (sc) {
      const id = sc.dataset.searchClear;
      ui.search[id] = '';
      const input = $('#search-' + id);
      input.value = '';
      sc.hidden = true;
      $('[data-opts="' + id + '"]').innerHTML = optionsHtml(catById[id]);
      input.focus();
      return;
    }
    if (t.closest('#sortBtn')) { toggleSortMenu(); return; }
    if (t.closest('#prefsBtn')) {
      if (!ui.sideOpen) { setSideOpen(true); log('Showed preferences sidebar'); }
      $('#side').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const firstHead = $('.sec__head');
      if (firstHead) firstHead.focus({ preventScroll: true });
      return;
    }
    if (t.closest('#sideClose')) { setSideOpen(false, $('#prefsBtn')); log('Hid preferences sidebar'); return; }
    if (t.closest('#favBtn')) { toast(state.favs.size + ' saved this session. The favourites list is not part of this prototype.'); return; }
    if (t.closest('#clearBtn') || t.closest('#emptyClear')) { clearApplied(); return; }
    if (t.closest('#sideApply')) { applyDraft(); return; }
    if (t.closest('#sideClear')) { clearDraft(); return; }
    if (t.closest('#sessionReset')) { resetSession(); return; }
  });

  document.addEventListener('input', (e) => {
    const id = e.target.dataset && e.target.dataset.search;
    if (id) {
      ui.search[id] = e.target.value;
      $('[data-search-clear="' + id + '"]').hidden = !e.target.value;
      $('[data-opts="' + id + '"]').innerHTML = optionsHtml(catById[id]);
      const n = $$('[data-opts="' + id + '"] [data-opt]').length;
      announce(n + (n === 1 ? ' option' : ' options') + ' shown.');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#sortMenu').hidden) { toggleSortMenu(false); $('#sortBtn').focus(); return; }
    if (e.target.closest && e.target.closest('#sortMenu')) {
      const items = $$('#sortMenu [role="option"]');
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseSort(document.activeElement.dataset.sort); }
    }
  });

  window.cfRefreshFilterUi = function cfRefreshFilterUi() {
    if (typeof window.cfApplyLocale === 'function') window.cfApplyLocale();
    renderDirectory();
    renderSidebar();
    scheduleSideViewportHeight();
  };

  window.addEventListener('resize', scheduleSideViewportHeight);
  window.addEventListener('scroll', scheduleSideViewportHeight, { passive: true });
  window.addEventListener('load', scheduleSideViewportHeight);

  /* ---------------------------------------------------------------- Boot */
  if (typeof window.cfApplyPageLocale === 'function') window.cfApplyPageLocale();
  else {
    if (typeof window.cfApplyLocale === 'function') window.cfApplyLocale();
    renderDirectory();
    renderSidebar();
  }
  setSideOpen(false);
})();
