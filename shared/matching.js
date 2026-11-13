/* Public demo matching: language filters the list; Best fit counts matched preferences (equal weight). */
(function () {
  'use strict';

  const { CONFIG, CATEGORIES, COUNSELLORS } = window.CF_DATA;

  const FIELD = {
    format: 'format', language: 'languages', availability: 'availability', specialty: 'specialties', gender: 'gender',
    designation: 'designations', lived: 'lived', diagnosis: 'diagnosis', approach: 'approach', religion: 'religion', race: 'race',
  };
  const CHIP_ORDER = ['language', 'format', 'availability', 'specialty', 'gender', 'designation', 'lived', 'diagnosis', 'approach', 'religion', 'race'];

  const hasRequiredLanguage = (langs) => langs.includes('English') || langs.includes('French');
  const hasRequiredFormat = (formats) => formats.includes('Video') || formats.includes('Voice');
  const countValues = (s) => CATEGORIES.reduce((n, c) => n + s[c.id].length, 0);

  function emptyState() {
    const s = {};
    CATEGORIES.forEach((c) => { s[c.id] = []; });
    return s;
  }

  function clearedFrom(from) {
    const s = emptyState();
    s.format = CONFIG.CLEAR_BEHAVIOR === 'defaults' ? ['Video', 'Voice'] : from.format.slice();
    s.language = ['English'];
    return s;
  }

  function languageOk(c, langs) {
    if (CONFIG.LANGUAGE_MATCH === 'all') return langs.every((l) => c.languages.includes(l));
    return langs.some((l) => c.languages.includes(l));
  }

  function evaluate(c, applied) {
    const met = [];
    const unmet = [];
    let matchCount = 0;
    CATEGORIES.forEach((cat) => {
      if (cat.id === 'language') return;
      const sel = applied[cat.id];
      if (!sel.length) return;
      const have = c[FIELD[cat.id]];
      sel.forEach((v) => {
        if (have.includes(v)) { met.push(v); matchCount += 1; }
        else unmet.push(v);
      });
    });
    const total = CATEGORIES.reduce((n, cat) => (cat.id === 'language' ? n : n + applied[cat.id].length), 0);
    return { c, raw: matchCount, met, unmet, total };
  }

  function computeResults(applied, sort) {
    const rows = COUNSELLORS.filter((c) => languageOk(c, applied.language)).map((c) => evaluate(c, applied));
    rows.forEach((r) => {
      r.score = r.total ? Math.round((r.met.length / r.total) * 100) : 0;
    });
    const byId = (a, b) => a.c.id.localeCompare(b.c.id);
    const byNext = (a, b) => a.c.next.localeCompare(b.c.next) || byId(a, b);
    if (sort === 'next') rows.sort(byNext);
    else rows.sort((a, b) => (b.raw - a.raw) || byNext(a, b));
    return rows;
  }

  function isRequiredChip(catId, values, value) {
    if (catId === 'language') {
      return (value === 'English' || value === 'French') && values.filter((l) => l === 'English' || l === 'French').length === 1;
    }
    if (catId === 'format') {
      return (value === 'Video' || value === 'Voice') && values.filter((f) => f === 'Video' || f === 'Voice').length === 1;
    }
    return false;
  }

  function categoryDraftError(catId, draft) {
    if (catId === 'language' && !hasRequiredLanguage(draft.language)) return 'language';
    if (catId === 'format' && !hasRequiredFormat(draft.format)) return 'modality';
    return null;
  }

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return n + 'th';
    return n + (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  }
  function nextLabel(iso) {
    const m = iso.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
    const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    const h = d.getHours();
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + ordinal(d.getDate()) + ', ' + h12 + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function languageSentence(langs) {
    if (!langs.length) return '';
    const ui = typeof window.cfUi === 'function' ? window.cfUi() : null;
    const join = CONFIG.LANGUAGE_MATCH === 'all' ? (ui ? ui.joinAnd : 'and') : (ui ? ui.joinOr : 'or');
    const prefix = ui ? ui.speakPrefix : 'Speak ';
    const label = (l) => (typeof window.cfLocalizedOption === 'function' ? window.cfLocalizedOption('language', l) : l);
    if (langs.length === 1) return prefix + label(langs[0]) + '.';
    if (langs.length === 2) return prefix + label(langs[0]) + ' ' + join + ' ' + label(langs[1]) + '.';
    return prefix + langs.slice(0, -1).map(label).join(', ') + ', ' + join + ' ' + label(langs[langs.length - 1]) + '.';
  }

  function counsellorInitials(name) {
    const m = name.match(/Counsellor\s+(\d+)/i);
    if (m) return m[1].length === 1 ? '0' + m[1] : m[1];
    return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  window.CF_MATCH = {
    FIELD, CHIP_ORDER, hasRequiredLanguage, hasRequiredFormat, countValues, emptyState, clearedFrom, computeResults,
    isRequiredChip, categoryDraftError, nextLabel, languageSentence, counsellorInitials,
  };
})();
