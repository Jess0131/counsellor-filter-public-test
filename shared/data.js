/*
 * Counsellor Directory usability test - fictional data and simulated ranking.
 * All people, dates, and values below are invented for testing.
 *
 *   - Language is the only hard filter.
 *   - Every other category only changes the Best fit order.
 *   - Session format and designation do not change the order. They still count toward the
 *     card's "Meets N preferences" line.
 */
(function () {
  'use strict';

  /* ---- Configuration ---------------------------------------------------------------- */
  const CONFIG = {
    // 'any' = a counsellor is listed if they speak at least one selected language.
    // 'all' = a counsellor must speak every selected language.
    LANGUAGE_MATCH: 'any',
    // 'observed' = Clear keeps session format, sets language to English, removes the rest.
    // 'defaults' = Clear restores Video, Voice, and English.
    CLEAR_BEHAVIOR: 'observed',
    // Category that opens first.
    OPEN_ON: 'language',
    VISIBLE_OPTIONS: 12,
  };

  /* ---- Initial applied state ------------------------------------------------------- */
  const INITIAL_STATE = {
    format: ['Video', 'Voice'],
    language: ['English'],
    availability: [],
    specialty: [],
    gender: ['Man'],
    designation: ['Registered Psychotherapist', 'Social Worker'],
    lived: [],
    diagnosis: [],
    approach: [],
    religion: [],
    race: [],
  };

  /* ---- Languages: 2 required + 10 popular + 34 more = 46 (matches "Show 34 more") -- */
  const LANGUAGES_POPULAR = ['Arabic', 'Cantonese', 'Farsi', 'Hindi', 'Mandarin', 'Portuguese', 'Spanish', 'Tamil', 'Ukrainian', 'Vietnamese'];
  const LANGUAGES_MORE = [
    'Afrikaans', 'Albanian', 'Amharic', 'Armenian', 'Bengali', 'Bosnian', 'Bulgarian', 'Croatian', 'Czech', 'Dutch',
    'Filipino (Tagalog)', 'Finnish', 'German', 'Greek', 'Gujarati', 'Hebrew', 'Hungarian', 'Italian', 'Japanese', 'Korean',
    'Malay', 'Nepali', 'Polish', 'Punjabi', 'Romanian', 'Russian', 'Serbian', 'Somali', 'Swahili', 'Swedish',
    'Turkish', 'Urdu', 'American Sign Language', 'Langue des signes qu\u00e9b\u00e9coise',
  ];

  /* ---- Categories, in the order they appear in the modal --------------------------- */
  const CATEGORIES = [
    {
      id: 'format', label: 'Modality', chip: 'Modality', required: true,
      helper: 'Select at least one: Video or Voice.',
      options: ['Video', 'Voice'],
    },
    {
      id: 'language', label: 'Language', chip: 'Language', required: true, search: 'Search languages',
      helper: 'Select at least one: English or French. You can also select additional languages.',
      pinned: ['English', 'French'],
      options: ['English', 'French'].concat(LANGUAGES_POPULAR, LANGUAGES_MORE),
      popularCount: 10,
    },
    {
      id: 'availability', label: 'Availability', chip: 'Availability', helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.',
      options: ['Weekday daytime', 'Weekday evening', 'Weekend day', 'Weekend evening'],
    },
    {
      id: 'specialty', label: 'Specialty', chip: 'Specialty', search: 'Search specialties',
      helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.',
      options: [
        'Anxiety', 'Body Positivity', 'Chronic illness or pain', 'Continuous displacement or homelessness', 'Depression',
        'Eating Disorders', 'Gender-affirming care (TGNB)', 'Grief and Loss', 'Learning or intellectual disabilities',
        'Life Coaching', 'Parenting', 'Trauma', 'Addiction', 'Anger management', 'Career stress', 'Couples and relationships',
        'Perinatal mental health', 'Sleep', 'Stress', 'Work-life balance',
      ],
    },
    {
      id: 'gender', label: 'Gender identity', chip: 'Gender', helper: 'Optional. This describes the counsellor. Choices change the order in Best fit.',
      options: ['Woman', 'Man', 'Non-Binary', 'Trans Woman', 'Trans Man', 'Two-Spirit', 'Genderqueer'],
    },
    {
      id: 'designation', label: 'Designation', chip: 'Designation', helper: 'Optional. Choices are shown on cards that meet them. They do not change the order.',
      options: ['Registered Psychotherapist', 'Clinical Counsellor', 'Social Worker', 'Psychologist', 'Marriage and Family Therapist'],
    },
    {
      id: 'lived', label: 'Lived experience', chip: 'Lived experience', search: 'Search lived experience',
      helper: 'Optional. This describes the counsellor. Choices change the order in Best fit.',
      options: [
        '2SLGBTQIA+ experience', 'Lived experience as a caregiver', 'Lived experience as a person with a disability',
        'Lived experience as a parent', 'Lived experience as an immigrant or refugee', 'Lived experience with addiction recovery',
        'Lived experience with chronic illness', 'Neurodivergent experience',
      ],
    },
    {
      id: 'diagnosis', label: 'Diagnosis', chip: 'Diagnosis', search: 'Search diagnoses',
      helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.',
      options: [
        'Adjustment Disorder', 'ADHD', 'Anxiety Disorder', 'Autism Spectrum Disorder', 'Bipolar Disorder',
        'Borderline Personality Disorder', 'Eating Disorder', 'Major Depressive Disorder', 'Obsessive-Compulsive Disorder',
        'Panic Disorder', 'Post-Traumatic Stress Disorder', 'Social Anxiety Disorder',
      ],
    },
    {
      id: 'approach', label: 'Approach to care', chip: 'Approach', search: 'Search approaches',
      helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.',
      options: [
        'Acceptance and Commitment Therapy', 'Cognitive Behavioural Therapy', 'Dialectical Behaviour Therapy', 'EMDR',
        'Mindfulness-based', 'Narrative therapy', 'Person-centred', 'Psychodynamic', 'Solution-focused', 'Trauma-informed',
      ],
    },
    {
      id: 'religion', label: 'Religious or spirituality expertise', chip: 'Spirituality', helper: 'Optional. Choices change the order in Best fit. They do not remove counsellors.',
      options: ['Buddhist', 'Christian', 'Hindu', 'Indigenous spirituality', 'Jewish', 'Muslim', 'Sikh', 'Spiritual but not religious'],
    },
    {
      id: 'race', label: 'Racial or ethnic background', chip: 'Background', helper: 'Optional. This describes the counsellor. Choices change the order in Best fit.',
      options: [
        'Black', 'East Asian', 'Indigenous', 'Latin American', 'Middle Eastern or North African', 'South Asian',
        'Southeast Asian', 'White', 'Mixed heritage',
      ],
    },
  ];

  // Card text for designations whose card label differs from the filter label.
  const DESIGNATION_DISPLAY = {
    'Registered Psychotherapist': 'Psychotherapist',
    'Social Worker': "Social Worker - Master's",
  };

  /* ---- Mock counsellors ----------------------------------------------------------- */
  const RP = 'Registered Psychotherapist', CC = 'Clinical Counsellor', SW = 'Social Worker', PSY = 'Psychologist';
  const FB = 'Weekday daytime', FE = 'Weekday evening', WD = 'Weekend day', WE = 'Weekend evening';
  const CBT = 'Cognitive Behavioural Therapy', DBT = 'Dialectical Behaviour Therapy', MIND = 'Mindfulness-based', TI = 'Trauma-informed',
    PC = 'Person-centred', PSD = 'Psychodynamic', SF = 'Solution-focused', ACT = 'Acceptance and Commitment Therapy';
  const IMM = 'Lived experience as an immigrant or refugee', LGB = '2SLGBTQIA+ experience',
    DIS = 'Lived experience as a person with a disability', PAR = 'Lived experience as a parent',
    CHR = 'Lived experience with chronic illness', ND = 'Neurodivergent experience', CARE = 'Lived experience as a caregiver';
  const ANX = 'Anxiety Disorder', MDD = 'Major Depressive Disorder', PTSD = 'Post-Traumatic Stress Disorder', ED = 'Eating Disorder',
    BPD = 'Borderline Personality Disorder', OCD = 'Obsessive-Compulsive Disorder', ADHD = 'ADHD', ADJ = 'Adjustment Disorder',
    PAN = 'Panic Disorder', SOC = 'Social Anxiety Disorder', BIP = 'Bipolar Disorder', ASD = 'Autism Spectrum Disorder';

  function c(id, pronouns, gender, languages, designations, specialties, extra) {
    const num = id.replace(/\D/g, '');
    const name = 'Counsellor ' + String(num).padStart(2, '0');
    return Object.assign({
      id, name, pronouns, gender, languages, designations, specialties,
      diagnosis: [], approach: [], religion: [], race: [], lived: [], availability: [], format: ['Video', 'Voice'],
      next: '2025-03-04T09:00', photo: null,
    }, extra || {});
  }

  const COUNSELLORS = [
    c('c01', 'He/Him, They/Them', ['Man'], ['English', 'Spanish', 'Portuguese'], [RP, SW],
      ['Anxiety', 'Life Coaching', 'Grief and Loss', 'Depression'],
      { diagnosis: [ANX, MDD], approach: [CBT, MIND], race: ['Latin American'], lived: [LGB], availability: [FB, FE], next: '2025-02-26T09:00' }),
    c('c02', 'She/Her', ['Woman'], ['English', 'French', 'Spanish', 'Italian', 'German'], [RP, CC],
      ['Eating Disorders', 'Continuous displacement or homelessness', 'Learning or intellectual disabilities', 'Trauma'],
      { diagnosis: [ED, PTSD], approach: [DBT, TI], religion: ['Christian'], race: ['Black'], lived: [IMM], availability: [FB, WD], format: ['Video'], next: '2025-02-25T14:00' }),
    c('c03', 'He/Him, They/Them', ['Trans Man'], ['English', 'Ukrainian'], [SW, CC],
      ['Anxiety', 'Life Coaching', 'Body Positivity', 'Trauma'],
      { diagnosis: [ANX, ADHD], approach: [PC, SF], race: ['White'], lived: [LGB, ND], availability: [FE, WE], next: '2025-02-27T10:30' }),
    c('c04', 'They/Them', ['Man'], ['French'], [CC, SW],
      ['Life Coaching', 'Parenting', 'Body Positivity'],
      { diagnosis: [ADJ], approach: [SF], race: ['White'], lived: [PAR], availability: [FB], format: ['Voice'], next: '2025-03-03T11:00' }),
    c('c05', 'She/Her', ['Woman'], ['English', 'French', 'Vietnamese'], [RP],
      ['Gender-affirming care (TGNB)', 'Anxiety', 'Life Coaching', 'Trauma'],
      { diagnosis: [ANX, SOC], approach: [PC, TI], race: ['Southeast Asian'], lived: [LGB, IMM], availability: [FE, WD], next: '2025-02-28T16:00' }),
    c('c06', 'She/Her', ['Woman'], ['English'], [RP],
      ['Eating Disorders', 'Continuous displacement or homelessness', 'Learning or intellectual disabilities', 'Depression'],
      { diagnosis: [ED, MDD], approach: [DBT, CBT], race: ['White'], lived: [DIS], availability: [FB], format: ['Video'], next: '2025-03-05T13:30' }),
    c('c07', 'She/Her, They/Them', ['Woman', 'Non-Binary'], ['English', 'French', 'Spanish', 'Italian'], [CC, SW],
      ['Chronic illness or pain', 'Life Coaching', 'Parenting', 'Stress'],
      { diagnosis: [ADJ, ANX], approach: [ACT, MIND], religion: ['Spiritual but not religious'], race: ['Mixed heritage'], lived: [CHR, PAR], availability: [FB, FE, WD], next: '2025-03-01T09:30' }),
    c('c08', 'He/Him', ['Trans Man'], ['English', 'Ukrainian'], [SW, CC],
      ['Body Positivity', 'Continuous displacement or homelessness', 'Learning or intellectual disabilities', 'Anxiety'],
      { diagnosis: [ANX, OCD], approach: [CBT], race: ['White'], lived: [LGB, IMM], availability: [FE, WE], next: '2025-03-02T15:00' }),
    c('c09', 'She/Her', ['Woman'], ['English'], [CC],
      ['Continuous displacement or homelessness', 'Chronic illness or pain', 'Life Coaching', 'Trauma'],
      { diagnosis: [PTSD, MDD], approach: [TI, PSD], religion: ['Muslim'], race: ['Middle Eastern or North African'], lived: [IMM, CHR], availability: [FB, WD], next: '2025-03-04T10:00' }),
    c('c10', 'She/Her', ['Woman'], ['Mandarin', 'Cantonese'], [RP, PSY],
      ['Anxiety', 'Stress', 'Career stress', 'Sleep'],
      { diagnosis: [ANX, PAN], approach: [CBT, MIND], religion: ['Buddhist'], race: ['East Asian'], lived: [IMM], availability: [FE, WE], next: '2025-02-27T18:00' }),
    c('c11', 'He/Him', ['Man'], ['Farsi', 'Arabic'], [CC],
      ['Trauma', 'Grief and Loss', 'Depression'],
      { diagnosis: [PTSD, MDD], approach: [TI, PC], religion: ['Muslim'], race: ['Middle Eastern or North African'], lived: [IMM], availability: [FB, FE], format: ['Voice'], next: '2025-03-06T11:30' }),
    c('c12', 'She/Her', ['Woman'], ['Hindi', 'Tamil'], [SW],
      ['Parenting', 'Couples and relationships', 'Anxiety'],
      { diagnosis: [ANX, ADJ], approach: [SF, ACT], religion: ['Hindu'], race: ['South Asian'], lived: [PAR, IMM], availability: [FB, WD], next: '2025-03-03T09:00' }),
    c('c13', 'She/Her', ['Woman'], ['Spanish', 'Portuguese'], [RP],
      ['Depression', 'Grief and Loss', 'Work-life balance'],
      { diagnosis: [MDD, ADJ], approach: [PSD, PC], religion: ['Christian'], race: ['Latin American'], lived: [IMM], availability: [FE], next: '2025-03-07T17:00' }),
    c('c14', 'She/Her', ['Woman'], ['Arabic', 'French'], [CC, SW],
      ['Trauma', 'Anxiety', 'Parenting'],
      { diagnosis: [PTSD, ANX], approach: [TI, CBT], religion: ['Muslim'], race: ['Middle Eastern or North African'], lived: [IMM, PAR], availability: [FB, WD], next: '2025-03-04T14:30' }),
    c('c15', 'She/Her', ['Woman'], ['French', 'Spanish'], [PSY],
      ['Anxiety', 'Sleep', 'Stress'],
      { diagnosis: [ANX, OCD], approach: [CBT, ACT], race: ['White'], availability: [FB, FE], next: '2025-03-05T09:00' }),
    c('c16', 'He/Him', ['Man'], ['English'], [RP, CC],
      ['Anger management', 'Addiction', 'Depression', 'Life Coaching'],
      { diagnosis: [MDD, BIP], approach: [CBT, SF], race: ['Black'], lived: ['Lived experience with addiction recovery'], availability: [FE, WD, WE], next: '2025-02-26T11:00' }),
    c('c17', 'She/Her', ['Woman'], ['English', 'Hindi', 'Tamil'], [RP, SW],
      ['Anxiety', 'Perinatal mental health', 'Parenting', 'Trauma'],
      { diagnosis: [ANX, PTSD], approach: [MIND, TI], religion: ['Hindu'], race: ['South Asian'], lived: [PAR], availability: [FB, FE], next: '2025-02-27T09:00' }),
    c('c18', 'He/Him', ['Man'], ['English', 'French'], [CC, RP],
      ['Anxiety', 'Career stress', 'Work-life balance', 'Stress'],
      { diagnosis: [ANX, ADJ], approach: [CBT, SF], race: ['White'], availability: [FB], next: '2025-03-03T15:30' }),
    c('c19', 'She/Her', ['Woman'], ['English'], [PSY, RP],
      ['Trauma', 'Depression', 'Grief and Loss', 'Anxiety'],
      { diagnosis: [PTSD, MDD, ANX], approach: [TI, PSD], religion: ['Christian'], race: ['Black'], lived: [IMM], availability: [FB, FE, WD], next: '2025-02-26T14:00' }),
    c('c20', 'They/Them', ['Non-Binary'], ['English', 'Spanish'], [SW, CC],
      ['Gender-affirming care (TGNB)', 'Anxiety', 'Body Positivity', 'Depression'],
      { diagnosis: [ANX, MDD, SOC], approach: [PC, 'Narrative therapy'], race: ['Latin American'], lived: [LGB, ND], availability: [FE, WE], next: '2025-02-28T12:00' }),
    c('c21', 'She/Her', ['Woman'], ['English', 'Mandarin'], [RP],
      ['Anxiety', 'Sleep', 'Eating Disorders', 'Stress'],
      { diagnosis: [ANX, ED, OCD], approach: [CBT, MIND], religion: ['Buddhist'], race: ['East Asian'], lived: [IMM], availability: [FB, WD], next: '2025-03-01T10:00' }),
    c('c22', 'He/Him', ['Man'], ['English', 'German'], [CC],
      ['Addiction', 'Depression', 'Anger management'],
      { diagnosis: [MDD, ADHD], approach: [ACT, CBT], race: ['White'], availability: [FE, WE], format: ['Video'], next: '2025-03-06T16:30' }),
    c('c23', 'She/Her', ['Woman'], ['English', 'French'], [SW, PSY],
      ['Chronic illness or pain', 'Grief and Loss', 'Parenting', 'Anxiety'],
      { diagnosis: [ADJ, ANX], approach: [PC, MIND], religion: ['Jewish'], race: ['White'], lived: [CHR, CARE], availability: [FB, WD], next: '2025-03-02T09:30' }),
    c('c24', 'He/Him', ['Man'], ['English', 'Hindi'], [RP, SW],
      ['Anxiety', 'Life Coaching', 'Stress', 'Trauma'],
      { diagnosis: [ANX, PTSD], approach: [CBT, TI], religion: ['Hindu'], race: ['South Asian'], lived: [IMM], availability: [FB, FE], next: '2025-02-27T13:00' }),
  ];

  window.CF_DATA = { CONFIG, INITIAL_STATE, CATEGORIES, COUNSELLORS, DESIGNATION_DISPLAY };
  if (typeof window.cfApplyLocale === 'function') window.cfApplyLocale();
})();
