/* French: page shell, preferences chrome, category labels, and option display labels (values stay English in state). */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const raw = (params.get('lang') || 'en').toLowerCase();
  window.CF_LOCALE = raw.startsWith('fr') ? 'fr' : 'en';

  const PACK = {
    en: {
      requiredTag: 'Required',
      errLanguage: 'Select English or French to apply your preferences.',
      errModality: 'A modality must be selected',
      announceLanguage: 'Select English or French to apply.',
      announceModality: 'A modality must be selected',
      srLanguage: 'Required. Select English or French.',
      srModality: 'Required. Select Video or Voice.',
    },
    fr: {
      errLanguage: 'Sélectionnez l\u2019anglais ou le français pour appliquer vos préférences.',
      errModality: 'Une modalité doit être sélectionnée',
      announceLanguage: 'Sélectionnez l\u2019anglais ou le français pour appliquer.',
      announceModality: 'Une modalité doit être sélectionnée',
      srLanguage: 'Obligatoire. Sélectionnez l\u2019anglais ou le français.',
      srModality: 'Obligatoire. Sélectionnez Vidéo ou Voix.',
    },
  };

  const UI = {
    en: {
      selectedCount: (n) => n + ' selected',
      selectedBadge: (n) => n + ' selected',
      showMore: (n) => 'Show ' + n + ' more',
      showFewer: 'Show fewer',
      noOptionsMatch: (label, q) => 'No ' + label.toLowerCase() + ' options match \u201c' + q + '\u201d.',
      chipsAria: 'Selected preferences',
      removeAria: (v) => 'Remove ' + v,
      resultHint: ' Only language changes who is listed. Other choices change the order in Best fit.',
      speakPrefix: 'Speak ',
      joinAnd: 'and',
      joinOr: 'or',
      counsellorWord: (n) => (n === 1 ? ' counsellor' : ' counsellors'),
      clearSearch: 'Clear search',
      catSelected: (n) => n + ' selected',
    },
    fr: {
      selectedCount: (n) => n + (n === 1 ? ' sélectionné' : ' sélectionnés'),
      selectedBadge: (n) => n + (n === 1 ? ' sélectionné' : ' sélectionnés'),
      showMore: (n) => 'Afficher ' + n + ' de plus',
      showFewer: 'Afficher moins',
      noOptionsMatch: (label, q) => 'Aucune option «\u00a0' + label + '\u00a0» ne correspond à \u00ab\u00a0' + q + '\u00a0».',
      chipsAria: 'Préférences sélectionnées',
      removeAria: (v) => 'Retirer ' + v,
      resultHint: ' Seule la langue change qui est affiché. Les autres choix modifient l\u2019ordre dans Meilleure adéquation.',
      speakPrefix: 'Parle ',
      joinAnd: 'et',
      joinOr: 'ou',
      counsellorWord: (n) => (n === 1 ? ' conseiller' : ' conseillers'),
      clearSearch: 'Effacer la recherche',
      catSelected: (n) => n + (n === 1 ? ' sélectionné' : ' sélectionnés'),
    },
  };

  function syncPack() {
    window.CF_I18N = window.CF_LOCALE === 'fr' ? { ...PACK.en, ...PACK.fr } : { ...PACK.en };
  }
  syncPack();

  window.cfUi = function cfUi() {
    return UI[window.CF_LOCALE] || UI.en;
  };

  const CAT = {
    en: {
      format: { label: 'Modality', chip: 'Modality', helper: 'Select at least one: Video or Voice.' },
      language: { label: 'Language', chip: 'Language', helper: 'Select at least one: English or French. You can also select additional languages.', search: 'Search languages' },
      availability: { label: 'Availability', chip: 'Availability', helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.' },
      specialty: { label: 'Specialty', chip: 'Specialty', helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.', search: 'Search specialties' },
      gender: { label: 'Gender identity', chip: 'Gender', helper: 'Optional. This describes the counsellor. Choices change the order in Best fit.' },
      designation: { label: 'Designation', chip: 'Designation', helper: 'Optional. Choices are shown on cards that meet them. They do not change the order.' },
      lived: { label: 'Lived experience', chip: 'Lived experience', helper: 'Optional. This describes the counsellor. Choices change the order in Best fit.', search: 'Search lived experience' },
      diagnosis: { label: 'Diagnosis', chip: 'Diagnosis', helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.', search: 'Search diagnoses' },
      approach: { label: 'Approach to care', chip: 'Approach', helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.', search: 'Search approaches' },
      religion: { label: 'Religious or spirituality expertise', chip: 'Spirituality', helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.' },
      race: { label: 'Racial or ethnic background', chip: 'Background', helper: 'Optional. This describes the counsellor. Choices change the order in Best fit.' },
    },
    fr: {
      format: { label: 'Modalité', chip: 'Modalité', helper: 'Sélectionnez au moins une option\u00a0: vidéo ou voix.' },
      language: { label: 'Langue', chip: 'Langue', helper: 'Sélectionnez au moins l\u2019anglais ou le français. Vous pouvez ajouter d\u2019autres langues.', search: 'Rechercher des langues' },
      availability: { label: 'Disponibilité', chip: 'Disponibilité', helper: 'Facultatif. Ces choix modifient l\u2019ordre dans Meilleure adéquation. Ils ne retirent pas de conseillers.' },
      specialty: { label: 'Spécialité', chip: 'Spécialité', helper: 'Facultatif. Ces choix modifient l\u2019ordre dans Meilleure adéquation. Ils ne retirent pas de conseillers.', search: 'Rechercher des spécialités' },
      gender: { label: 'Identité de genre', chip: 'Genre', helper: 'Facultatif. Décrit le conseiller. Ces choix modifient l\u2019ordre dans Meilleure adéquation.' },
      designation: { label: 'Désignation', chip: 'Désignation', helper: 'Facultatif. Affiché sur les fiches qui correspondent. N\u2019affecte pas l\u2019ordre.' },
      lived: { label: 'Expérience vécue', chip: 'Expérience vécue', helper: 'Facultatif. Décrit le conseiller. Ces choix modifient l\u2019ordre dans Meilleure adéquation.', search: 'Rechercher une expérience vécue' },
      diagnosis: { label: 'Diagnostic', chip: 'Diagnostic', helper: 'Facultatif. Ces choix modifient l\u2019ordre dans Meilleure adéquation. Ils ne retirent pas de conseillers.', search: 'Rechercher des diagnostics' },
      approach: { label: 'Approche de soins', chip: 'Approche', helper: 'Facultatif. Ces choix modifient l\u2019ordre dans Meilleure adéquation. Ils ne retirent pas de conseillers.', search: 'Rechercher des approches' },
      religion: { label: 'Expertise religieuse ou spirituelle', chip: 'Spiritualité', helper: 'Facultatif. Ces choix modifient l\u2019ordre dans Meilleure adéquation. Ils ne retirent pas de conseillers.' },
      race: { label: 'Origine raciale ou ethnique', chip: 'Origine', helper: 'Facultatif. Décrit le conseiller. Ces choix modifient l\u2019ordre dans Meilleure adéquation.' },
    },
  };

  const PAGE = {
    en: {
      htmlLang: 'en',
      back: 'Back to Counselling Home',
      eyebrow: 'Individual Counselling',
      h1: 'Match with a Counsellor',
      lede: 'Use the filters to explore all available counsellors based on what\u2019s important to you like designation, specialty, or language.',
      preferences: 'Preferences',
      myFav: 'My Favourites',
      sortBy: 'Sort by',
      bestFit: 'Best fit',
      nextAvail: 'Next availability',
      clearChoices: 'Clear choices',
      emptyTitle: 'No counsellors match your language choices.',
      emptyBody: 'Select English or French, or add another language.',
      modalTitle: 'Preferences',
      modalClear: 'Clear Preferences',
      cancel: 'Cancel',
      apply: 'Apply Preferences',
      navLang: 'EN',
      navLangTitle: 'Switch to French',
      hidePrefs: 'Hide preferences',
      pendingChanges: 'You have changes that are not applied.',
      docTitle: 'Counsellor Directory',
      requiredTag: 'Required',
    },
    fr: {
      htmlLang: 'fr',
      back: 'Retour à l\u2019accueil du counselling',
      eyebrow: 'Counselling individuel',
      h1: 'Trouver un conseiller',
      lede: 'Utilisez les filtres pour explorer les conseillers disponibles selon ce qui compte pour vous, comme la désignation, la spécialité ou la langue.',
      preferences: 'Préférences',
      myFav: 'Mes favoris',
      sortBy: 'Trier par',
      bestFit: 'Meilleure adéquation',
      nextAvail: 'Prochaine disponibilité',
      clearChoices: 'Effacer les choix',
      emptyTitle: 'Aucun conseiller ne correspond à vos choix de langue.',
      emptyBody: 'Sélectionnez l\u2019anglais ou le français, ou ajoutez une autre langue.',
      modalTitle: 'Préférences',
      modalClear: 'Effacer les préférences',
      cancel: 'Annuler',
      apply: 'Appliquer les préférences',
      hidePrefs: 'Masquer les préférences',
      pendingChanges: 'Vous avez des modifications non appliquées.',
      navLang: 'FR',
      navLangTitle: 'Passer à l\u2019anglais',
      docTitle: 'Répertoire de conseillers',
      requiredTag: 'Obligatoire',
    },
  };

  window.CF_PAGE = PAGE[window.CF_LOCALE];

  window.CF_CAT = CAT;

  /** Category copy for the active locale (used when rendering filter UI). */
  window.cfLocalizedOption = function cfLocalizedOption(catId, value) {
    if (window.CF_LOCALE !== 'fr' || value == null || value === '') return value;
    const map = window.CF_OPT_FR;
    if (!map) return value;
    return map[value] || value;
  };

  window.cfOptionMatchesSearch = function cfOptionMatchesSearch(catId, value, queryNorm) {
    if (!queryNorm) return true;
    const en = String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (en.includes(queryNorm)) return true;
    if (window.CF_LOCALE !== 'fr') return false;
    const fr = window.cfLocalizedOption(catId, value);
    const frN = String(fr).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return frN.includes(queryNorm);
  };

  window.cfLocalizedCategory = function cfLocalizedCategory(cat) {
    if (!cat || !cat.id) return cat;
    const loc = CAT[window.CF_LOCALE] || CAT.en;
    const en = CAT.en[cat.id] || {};
    const patch = loc[cat.id] || en;
    return {
      label: patch.label || en.label || cat.label,
      chip: patch.chip || en.chip || cat.chip,
      helper: patch.helper !== undefined ? patch.helper : (en.helper !== undefined ? en.helper : cat.helper),
      search: patch.search || en.search || cat.search,
    };
  };

  window.cfApplyLocale = function cfApplyLocale() {
    if (!window.CF_DATA) return;
    const base = CAT.en;
    const loc = CAT[window.CF_LOCALE] || CAT.en;
    window.CF_DATA.CATEGORIES.forEach((cat) => {
      const patch = { ...base[cat.id], ...(loc[cat.id] || {}) };
      if (patch.label) cat.label = patch.label;
      if (patch.chip) cat.chip = patch.chip;
      if (patch.helper !== undefined) cat.helper = patch.helper;
      if (patch.search) cat.search = patch.search;
    });
  };

  window.cfRequiredLabel = function cfRequiredLabel() {
    const p = window.CF_PAGE || PAGE.en;
    return p.requiredTag || PACK.en.requiredTag;
  };

  window.cfSortLabel = function cfSortLabel(sort) {
    const p = window.CF_PAGE || PAGE.en;
    const opt = sort === 'next' ? p.nextAvail : p.bestFit;
    return p.sortBy + ': ' + opt;
  };

  window.cfApplyPageLocale = function cfApplyPageLocale() {
    syncPack();
    const p = PAGE[window.CF_LOCALE] || PAGE.en;
    window.CF_PAGE = p;
    if (typeof window.cfApplyLocale === 'function') window.cfApplyLocale();
    document.documentElement.lang = p.htmlLang;
    if (p.docTitle) document.title = p.docTitle + (document.title.includes('\u00b7') ? document.title.slice(document.title.indexOf('\u00b7')) : '');
    const backLabel = document.querySelector('#pageBack .back__label') || document.querySelector('.back .back__label');
    if (backLabel && p.back) backLabel.textContent = p.back;
    const map = [
      ['#pageEyebrow', null, p.eyebrow],
      ['.eyebrow', null, p.eyebrow],
      ['#pageH1', null, p.h1],
      ['.page__head h1', null, p.h1],
      ['#pageLede', null, p.lede],
      ['.page__head .lede', null, p.lede],
      ['#prefsBtnLabel', null, p.preferences],
      ['#sideTitle', null, p.preferences],
      ['#modalTitle', null, p.modalTitle || p.preferences],
      ['#sideApply', null, p.apply || 'Apply Preferences'],
      ['#sideClear', null, p.modalClear || 'Clear Preferences'],
      ['#modalApply', null, p.apply || 'Apply Preferences'],
      ['#modalCancel', null, p.cancel || 'Cancel'],
      ['#modalClear', null, p.modalClear || 'Clear Preferences'],
      ['#favBtn span', null, p.myFav],
      ['#clearBtn', null, p.clearChoices],
      ['#emptyClear', null, p.clearChoices],
      ['#empty .empty__title', null, p.emptyTitle],
      ['#empty p:not(.empty__title)', null, p.emptyBody],
      ['#pending', null, p.pendingChanges],
    ];
    map.forEach(([sel, mode, text]) => {
      const el = document.querySelector(sel);
      if (!el || text == null) return;
      if (mode === 'lastChild') {
        const count = el.querySelector('.count');
        el.textContent = '';
        if (count) el.appendChild(count);
        el.appendChild(document.createTextNode(' ' + text));
      } else el.textContent = text;
    });
    const sideClose = document.getElementById('sideClose');
    if (sideClose && p.hidePrefs) sideClose.setAttribute('aria-label', p.hidePrefs);
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
      const label = langBtn.querySelector('.nav__lang-label') || langBtn;
      if (label.classList && label.classList.contains('nav__lang-label')) label.textContent = p.navLang;
      else {
        const chev = langBtn.querySelector('svg');
        langBtn.innerHTML = '';
        const span = document.createElement('span');
        span.className = 'nav__lang-label';
        span.textContent = p.navLang;
        langBtn.appendChild(span);
        if (chev) langBtn.appendChild(chev);
      }
      langBtn.title = p.navLangTitle;
      langBtn.setAttribute('aria-label', p.navLangTitle);
    }
    document.documentElement.dataset.cfLocale = window.CF_LOCALE;
    if (typeof window.cfRefreshFilterUi === 'function') window.cfRefreshFilterUi();
  };

  function bindLangToggle() {
    const langBtn = document.getElementById('langToggle');
    if (!langBtn || langBtn.dataset.cfBound) return;
    langBtn.dataset.cfBound = '1';
    langBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const next = window.CF_LOCALE === 'en' ? 'fr' : 'en';
      const u = new URL(location.href);
      u.searchParams.set('lang', next);
      location.href = u.toString();
    });
  }

  function initPageLocale() {
    syncPack();
    cfApplyPageLocale();
    bindLangToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageLocale);
  } else {
    initPageLocale();
  }
})();
