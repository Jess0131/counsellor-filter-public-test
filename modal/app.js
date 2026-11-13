/* Prototype A - Counsellor filter modal.
   Plain JavaScript. No build step, no network calls, no storage. State lives in memory only. */
(function () {
  'use strict';

  const { CONFIG, INITIAL_STATE, CATEGORIES, COUNSELLORS, DESIGNATION_DISPLAY } = window.CF_DATA;
  const M = window.CF_MATCH;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const ic = (id, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>';
  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const catLoc = (cat) => (typeof window.cfLocalizedCategory === 'function' ? window.cfLocalizedCategory(cat) : cat);
  const optLabel = (catId, value) => (typeof window.cfLocalizedOption === 'function' ? window.cfLocalizedOption(catId, value) : value);
  const optMatches = (catId, value, q) => (typeof window.cfOptionMatchesSearch === 'function' ? window.cfOptionMatchesSearch(catId, value, q) : norm(value).includes(q));
  const i18n = () => window.CF_I18N || {};
  const draftError = (catId) => M.categoryDraftError(catId, ui.draft);
  const errorMessage = (kind) => (kind === 'modality' ? i18n().errModality : i18n().errLanguage) || (kind === 'modality' ? 'A modality must be selected' : 'Select English or French to apply your preferences.');
  const isRequiredChip = (catId, values, value) => M.isRequiredChip(catId, values, value);

  /* ---------------------------------------------------------------- State */
  const state = { applied: clone(INITIAL_STATE), sort: 'best', favs: new Set() };
  const ui = { open: false, draft: null, cat: CONFIG.OPEN_ON, search: {}, expanded: {}, returnFocus: null };

  const hasRequiredLanguage = (langs) => M.hasRequiredLanguage(langs);
  const countValues = (s) => M.countValues(s);
  const sortByOptionOrder = (cat, values) => values.slice().sort((a, b) => cat.options.indexOf(a) - cat.options.indexOf(b));
  const emptyState = () => M.emptyState();
  const clearedFrom = (from) => M.clearedFrom(from);

  /* ---------------------------------------------------------------- Log, toast, announcements */
  const logEntries = [];
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

  function computeResults() {
    return M.computeResults(state.applied, state.sort);
  }

  /* ---------------------------------------------------------------- Directory */

  function chipsHtml(sel) {
    const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
    const out = [];
    M.CHIP_ORDER.forEach((id) => {
      sel[id].forEach((v) => {
        const display = optLabel(id, v);
        const required = isRequiredChip(id, sel[id], v);
        if (required) {
          out.push('<li class="chip chip--required" data-chip="' + id + '">' + esc(display) + '</li>');
        } else {
          const removeLabel = u ? u.removeAria(display) : ('Remove ' + display);
          out.push('<li class="chip" data-chip="' + id + '">' + esc(display) +
            '<button type="button" data-remove="' + id + '" data-value="' + esc(v) + '" aria-label="' + esc(removeLabel) + '">' + ic('xcircle') + '</button></li>');
        }
      });
    });
    return out.join('');
  }

  function cardHtml(r, i) {
    const c = r.c;
    const applied = state.applied;
    const designations = c.designations.map((d) => ({ label: DESIGNATION_DISPLAY[d] || d, met: applied.designation.includes(d) }));
    const specs = c.specialties.slice().sort((a, b) => applied.specialty.includes(b) - applied.specialty.includes(a)).slice(0, 3);
    const meets = r.total
      ? '<span class="meets' + (r.met.length ? '' : ' meets--none') + '" title="' + esc((r.met.length ? 'Meets: ' + r.met.join(', ') + '. ' : '') + (r.unmet.length ? 'Does not meet: ' + r.unmet.join(', ') + '.' : '')) + '">' +
        ic('checkcircle') + 'Meets ' + r.met.length + (r.met.length === 1 ? ' preference' : ' preferences') + '</span>'
      : '';
    const photo = c.photo
      ? '<img src="' + c.photo + '" alt="" width="113" height="123">'
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
    const rows = computeResults();
    const n = rows.length;
    $('#prefsCount').textContent = countValues(state.applied);
    const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
    $('#resultCount').textContent = n + (u ? u.counsellorWord(n) : (n === 1 ? ' counsellor' : ' counsellors'));
    $('#resultHint').textContent = M.languageSentence(state.applied.language) + (u ? u.resultHint : ' Only language changes who is listed. Other choices change the order in Best fit.');
    $('#chips').innerHTML = chipsHtml(state.applied);
    $('#grid').innerHTML = rows.map(cardHtml).join('');
    $('#grid').hidden = n === 0;
    $('#empty').hidden = n !== 0;
    $('#sortLabel').textContent = typeof window.cfSortLabel === 'function'
      ? window.cfSortLabel(state.sort)
      : 'Sort by: ' + (state.sort === 'best' ? 'Best fit' : 'Next availability');
    return rows;
  }

  /* ---------------------------------------------------------------- Sort menu */
  const sortOptions = () => {
    const p = window.CF_PAGE;
    if (p) return [['best', p.bestFit], ['next', p.nextAvail]];
    return [['best', 'Best fit'], ['next', 'Next availability']];
  };
  function renderSortMenu() {
    $('#sortMenu').innerHTML = sortOptions().map(([id, label]) =>
      '<li role="option" tabindex="-1" data-sort="' + id + '" aria-selected="' + (state.sort === id) + '">' + label + (state.sort === id ? ic('check') : '') + '</li>').join('');
  }
  function toggleSortMenu(open) {
    const btn = $('#sortBtn');
    const menu = $('#sortMenu');
    const willOpen = open === undefined ? menu.hidden : open;
    menu.hidden = !willOpen;
    btn.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) {
      renderSortMenu();
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

  /* ---------------------------------------------------------------- Modal */
  function openModal(catId) {
    ui.returnFocus = document.activeElement;
    $('#toast').classList.remove('is-on');
    ui.draft = clone(state.applied);
    ui.cat = catId || CONFIG.OPEN_ON;
    ui.search = {};
    ui.expanded = {};
    ui.open = true;
    $('#overlay').hidden = false;
    document.body.classList.add('is-modal-open');
    const main = $('#main');
    if (main) main.inert = true;
    renderCats();
    renderPane();
    log('Opened Preferences (' + countValues(state.applied) + ' applied)');
    const tab = $('.cat[aria-selected="true"]');
    if (tab) tab.focus();
  }

  function closeModal(reason) {
    if (!ui.open) return;
    ui.open = false;
    $('#overlay').hidden = true;
    document.body.classList.remove('is-modal-open');
    const main = $('#main');
    if (main) main.inert = false;
    if (reason) log(reason);
    const target = ui.returnFocus && document.contains(ui.returnFocus) ? ui.returnFocus : $('#prefsBtn');
    target.focus();
  }

  function renderCats() {
    const req = typeof window.cfRequiredLabel === 'function' ? window.cfRequiredLabel() : (i18n().requiredTag || 'Required');
    $('#cats').innerHTML = CATEGORIES.map((cat) => {
      const L = catLoc(cat);
      const on = cat.id === ui.cat;
      const n = ui.draft[cat.id].length;
      const errKind = draftError(cat.id);
      const err = !!errKind;
      const sr = errKind === 'modality' ? (i18n().srModality || 'Required. Select Video or Voice.') : (i18n().srLanguage || 'Required. Select English or French.');
      const reqTag = cat.required ? '<span class="tag tag--cat' + (err ? ' tag--error' : '') + '">' + esc(req) + '</span>' : '';
      let trail = '';
      if (err) trail = '<span class="cat__err">' + ic('alert') + '<span class="sr-only">' + esc(sr) + '</span></span>';
      else if (n) {
        const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
        const lab = u ? u.catSelected(n) : (n + ' selected');
        trail = '<span class="cat__n" aria-label="' + esc(lab) + '">' + n + '</span>';
      }
      return '<button type="button" class="cat" role="tab" id="tab-' + cat.id + '" data-cat="' + cat.id + '" aria-selected="' + on + '" aria-controls="pane" tabindex="' + (on ? 0 : -1) + '">' +
        '<span class="cat__text"><span class="cat__name">' + esc(L.label) + '</span></span>' + reqTag +
        trail +
        '</button>';
    }).join('');
  }

  function paneHeadHtml(cat) {
    const L = catLoc(cat);
    const errKind = draftError(cat.id);
    const invalid = !!errKind;
    const req = typeof window.cfRequiredLabel === 'function' ? window.cfRequiredLabel() : (i18n().requiredTag || 'Required');
    const paneTitle = cat.required
      ? '<h3 id="paneTitle" class="sr-only">' + esc(L.label) + '</h3><span class="tag' + (invalid ? ' tag--error' : '') + '">' + esc(req) + '</span>'
      : '<h3 id="paneTitle">' + esc(L.label) + '</h3>';
    return '<div class="pane__title">' + paneTitle + '</div>' +
      '<p class="pane__helper">' + esc(L.helper) + '</p>' +
      (invalid ? '<p class="pane__error" role="alert">' + ic('alert') + esc(errorMessage(errKind)) + '</p>' : '');
  }

  function renderPane() {
    const cat = catById[ui.cat];
    const pane = $('#pane');
    pane.setAttribute('aria-labelledby', 'tab-' + cat.id);
    pane.innerHTML =
      '<div class="pane__scroll" id="paneScroll"><div id="paneHead">' + paneHeadHtml(cat) + '</div>' +
      (cat.search
        ? (function () {
          const L = catLoc(cat);
          return '<div class="search"><label class="sr-only" for="search">' + esc(L.search) + '</label>' + ic('search') +
          '<input id="search" type="search" autocomplete="off" placeholder="' + esc(L.search) + '" value="' + esc(ui.search[cat.id] || '') + '">' +
          '<button type="button" class="search__clear" id="searchClear" aria-label="' + esc((typeof window.cfUi === 'function' ? window.cfUi().clearSearch : 'Clear search')) + '"' + (ui.search[cat.id] ? '' : ' hidden') + '>' + ic('x') + '</button></div>';
        })()
        : '') +
      '<div id="optsWrap"></div></div><div class="sum" id="sum"></div>';
    renderOptions();
    renderSummary();
  }

  function renderPaneHead() {
    $('#paneHead').innerHTML = paneHeadHtml(catById[ui.cat]);
  }

  function renderOptions() {
    const cat = catById[ui.cat];
    const q = norm((ui.search[cat.id] || '').trim());
    let list = cat.options;
    let moreCount = 0;
    let expanded = !!ui.expanded[cat.id];
    if (q) {
      list = list.filter((o) => optMatches(cat.id, o, q));
      expanded = true;
    } else if (!expanded && list.length > CONFIG.VISIBLE_OPTIONS) {
      moreCount = list.length - CONFIG.VISIBLE_OPTIONS;
      list = list.slice(0, CONFIG.VISIBLE_OPTIONS);
    }
    const selected = ui.draft[cat.id];
    let html = '<div class="opts" role="group" aria-labelledby="paneTitle">' + list.map((o) => {
      const on = selected.includes(o);
      return '<button type="button" class="opt' + (on ? ' is-on' : '') + '" role="checkbox" aria-checked="' + on + '" data-opt="' + esc(o) + '">' +
        '<span>' + esc(optLabel(cat.id, o)) + '</span><span class="opt__box">' + (on ? ic('check') : '') + '</span></button>';
    }).join('') + (list.length ? '' : (function () {
      const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
      const Lc = catLoc(cat);
      const msg = u ? u.noOptionsMatch(Lc.label, ui.search[cat.id] || '') : ('No ' + Lc.label.toLowerCase() + ' options match \u201c' + (ui.search[cat.id] || '') + '\u201d.');
      return '<p class="opts__none">' + esc(msg) + '</p>';
    })()) + '</div>';
    if (!q && cat.options.length > CONFIG.VISIBLE_OPTIONS) {
      const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
      html += moreCount
        ? '<button type="button" class="more" id="more" aria-expanded="false">' + esc(u ? u.showMore(moreCount) : ('Show ' + moreCount + ' more')) + '</button>'
        : '<button type="button" class="more" id="more" aria-expanded="true">' + esc(u ? u.showFewer : 'Show fewer') + '</button>';
    }
    $('#optsWrap').innerHTML = html;
  }

  function renderSummary() {
    const n = countValues(ui.draft);
    const u = typeof window.cfUi === 'function' ? window.cfUi() : null;
    $('#sum').innerHTML = '<p class="sum__count" aria-live="polite">' + esc(u ? u.selectedCount(n) : (n + ' selected')) + '</p><ul class="chips" aria-label="' + esc(u ? u.chipsAria : 'Selected preferences') + '">' + chipsHtml(ui.draft) + '</ul>';
  }

  function rerenderModalKeepFocus() {
    const active = document.activeElement;
    const key = active && active.dataset ? (active.dataset.opt || (active.dataset.remove ? 'rm:' + active.dataset.remove + ':' + active.dataset.value : null)) : null;
    renderCats();
    renderPaneHead();
    renderOptions();
    renderSummary();
    if (key) {
      const match = $$('[data-opt]').find((el) => el.dataset.opt === key) ||
        $$('[data-remove]').find((el) => 'rm:' + el.dataset.remove + ':' + el.dataset.value === key);
      if (match) match.focus();
    }
  }

  function toggleOption(value) {
    const cat = catById[ui.cat];
    const sel = ui.draft[cat.id];
    const idx = sel.indexOf(value);
    if (idx >= 0) sel.splice(idx, 1);
    else ui.draft[cat.id] = sortByOptionOrder(cat, sel.concat(value));
    rerenderModalKeepFocus();
    const nowOn = idx < 0;
    const tail = draftError(cat.id) === 'language' ? (' ' + (i18n().announceLanguage || 'Select English or French to apply.'))
      : draftError(cat.id) === 'modality' ? (' ' + (i18n().announceModality || 'A modality must be selected.')) : '';
    announce(value + (nowOn ? ' selected.' : ' removed.') + tail);
    log((nowOn ? 'Checked ' : 'Unchecked ') + cat.label + ': ' + value);
  }

  function removeDraftChip(catId, value) {
    const sel = ui.draft[catId];
    const i = sel.indexOf(value);
    if (i >= 0) sel.splice(i, 1);
    // Keep focus on a sensible chip.
    const chips = $$('#sum [data-remove]');
    const pos = chips.findIndex((b) => b.dataset.remove === catId && b.dataset.value === value);
    renderCats();
    renderPaneHead();
    renderOptions();
    renderSummary();
    const next = $$('#sum [data-remove]');
    const target = next[Math.min(pos, next.length - 1)];
    if (target) target.focus();
    else $('#modalClear').focus();
    const errKind = draftError(catId);
    const tail = errKind === 'language' ? (' ' + (i18n().announceLanguage || 'Select English or French to apply.'))
      : errKind === 'modality' ? (' ' + (i18n().announceModality || 'A modality must be selected.')) : '';
    announce(value + ' removed.' + tail);
    log('Removed chip in dialog: ' + catById[catId].chip + ': ' + value);
  }

  function applyDraft() {
    if (!hasRequiredLanguage(ui.draft.language)) {
      ui.cat = 'language';
      renderCats();
      renderPane();
      const first = $('[data-opt="English"]');
      if (first) first.focus();
      announce(i18n().announceLanguage || 'Select English or French to apply.');
      log('Apply blocked: English or French is required');
      return;
    }
    if (!M.hasRequiredFormat(ui.draft.format)) {
      ui.cat = 'format';
      renderCats();
      renderPane();
      const first = $('[data-opt="Video"]') || $('[data-opt="Voice"]');
      if (first) first.focus();
      announce('Preferences not applied. ' + (i18n().announceModality || 'A modality must be selected.'));
      log('Apply blocked: modality is required');
      return;
    }
    const before = countValues(state.applied);
    state.applied = clone(ui.draft);
    closeModal('Applied Preferences (' + before + ' to ' + countValues(state.applied) + ' selected)');
    const rows = renderDirectory();
    announce('Preferences applied. ' + rows.length + ' counsellors listed.');
    toast('Preferences applied. ' + rows.length + (rows.length === 1 ? ' counsellor' : ' counsellors') + '.');
  }

  function clearDraft() {
    ui.draft = clearedFrom(ui.draft);
    rerenderModalKeepFocus();
    announce('Preferences cleared in this dialog. Select Apply Preferences to save.');
    log('Clear Preferences in dialog (' + (CONFIG.CLEAR_BEHAVIOR === 'defaults' ? 'restores Video, Voice, English' : 'keeps session format, language set to English') + ')');
  }

  function selectCat(id, focus) {
    ui.cat = id;
    renderCats();
    renderPane();
    $('#paneScroll').scrollTop = 0;
    if (focus) $('#tab-' + id).focus();
    log('Opened category: ' + catById[id].label);
  }

  /* ---------------------------------------------------------------- Directory actions */
  function clearApplied() {
    const before = countValues(state.applied);
    state.applied = clearedFrom(state.applied);
    const rows = renderDirectory();
    announce('Choices cleared. ' + rows.length + ' counsellors listed.');
    toast('Choices cleared. Language set to English.');
    log('Clear choices (' + before + ' to ' + countValues(state.applied) + ' selected)');
  }

  function removeAppliedChip(catId, value) {
    const sel = state.applied[catId];
    const pos = $$('#chips [data-remove]').findIndex((b) => b.dataset.remove === catId && b.dataset.value === value);
    const i = sel.indexOf(value);
    if (i >= 0) sel.splice(i, 1);
    const rows = renderDirectory();
    const chips = $$('#chips [data-remove]');
    (chips[Math.min(pos, chips.length - 1)] || $('#prefsBtn')).focus();
    announce(value + ' removed. ' + rows.length + ' counsellors listed.');
    log('Removed chip: ' + catById[catId].chip + ': ' + value);
  }

  function resetSession() {
    state.applied = clone(INITIAL_STATE);
    state.sort = 'best';
    state.favs = new Set();
    ui.search = {};
    ui.expanded = {};
    toggleSortMenu(false);
    if (ui.open) {
      ui.open = false;
      $('#overlay').hidden = true;
      document.body.classList.remove('is-modal-open');
    }
    renderDirectory();
    announce('Session reset. 6 preferences applied.');
    toast('Session reset to the start state.');
  }

  /* ---------------------------------------------------------------- Events */
  document.addEventListener('click', (e) => {
    const t = e.target;
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
      if (rm.closest('#sum')) removeDraftChip(rm.dataset.remove, rm.dataset.value);
      else removeAppliedChip(rm.dataset.remove, rm.dataset.value);
      return;
    }
    const sortItem = t.closest('[data-sort]');
    if (sortItem) { chooseSort(sortItem.dataset.sort); return; }
    const cat = t.closest('[data-cat]');
    if (cat) { selectCat(cat.dataset.cat); return; }
    const opt = t.closest('[data-opt]');
    if (opt) { toggleOption(opt.dataset.opt); return; }

    if (t.closest('#more')) {
      const id = ui.cat;
      ui.expanded[id] = !ui.expanded[id];
      renderOptions();
      const more = $('#more');
      if (more) more.focus();
      log((ui.expanded[id] ? 'Expanded ' : 'Collapsed ') + catById[id].label + ' options');
      return;
    }
    if (t.closest('#searchClear')) {
      ui.search[ui.cat] = '';
      $('#search').value = '';
      $('#searchClear').hidden = true;
      renderOptions();
      $('#search').focus();
      return;
    }
    if (t.closest('#sortBtn')) { toggleSortMenu(); return; }
    if (t.closest('#prefsBtn')) { openModal(); return; }
    if (t.closest('#favBtn')) { toast(state.favs.size + ' saved this session. The favourites list is not part of this prototype.'); return; }
    if (t.closest('#clearBtn') || t.closest('#emptyClear')) { clearApplied(); return; }
    if (t.closest('#modalApply')) { applyDraft(); return; }
    if (t.closest('#modalCancel')) { closeModal('Cancelled Preferences (no changes applied)'); return; }
    if (t.closest('#modalClose')) { closeModal('Closed Preferences (no changes applied)'); return; }
    if (t.closest('#modalClear')) { clearDraft(); return; }
    if (t === $('#overlay')) { closeModal('Closed Preferences by clicking outside (no changes applied)'); return; }

    if (t.closest('#sessionReset')) { resetSession(); return; }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'search') {
      ui.search[ui.cat] = e.target.value;
      $('#searchClear').hidden = !e.target.value;
      renderOptions();
      const n = $$('[data-opt]').length;
      announce(n + (n === 1 ? ' option' : ' options') + ' shown.');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#sortMenu').hidden) { toggleSortMenu(false); $('#sortBtn').focus(); return; }
      if (ui.open) { closeModal('Closed Preferences with Escape (no changes applied)'); }
      return;
    }
    // Focus trap in the dialog.
    if (ui.open && e.key === 'Tab') {
      const nodes = $$('#modal button:not([hidden]):not([tabindex="-1"]), #modal input').filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    // Arrow keys move through categories.
    if (ui.open && e.target.closest && e.target.closest('#cats') && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      const ids = CATEGORIES.map((c) => c.id);
      const cur = ids.indexOf(e.target.closest('[data-cat]').dataset.cat);
      const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      selectCat(ids[(cur + dir + ids.length) % ids.length], true);
      return;
    }
    // Sort menu keys.
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
    if (ui.open) rerenderModalKeepFocus();
  };

  /* ---------------------------------------------------------------- Boot */
  if (typeof window.cfApplyPageLocale === 'function') window.cfApplyPageLocale();
  else {
    if (typeof window.cfApplyLocale === 'function') window.cfApplyLocale();
    renderDirectory();
  }
})();
