/* ------------------------------------------------------------------
   PATH A - ECD Centre Questionnaire (Sections 0-VIII + enumerator obs)
   Mirrors the "ECD Centre Questions" tab of the survey guide.
   Runs for every centre type EXCEPT standalone ECD/daycare and
   home-based childcare, which are routed to the daycare instrument.
   ------------------------------------------------------------------ */

const CENTRE_TYPES = [
  'Standalone ECD / daycare centre',
  'Nursery / pre-primary (standalone)',
  'Pre-primary attached to a primary school',
  'Home-based childcare',
  'Community / faith-based ECD centre',
  'Other (please specify)'
];

/* Centre types that are routed to the daycare / home-based instrument */
const DAYCARE_TYPES = [
  'Standalone ECD / daycare centre',
  'Home-based childcare'
];

const isAttachedToPrimary = a => a.centre_type === 'Pre-primary attached to a primary school';

/* Reusable blocks -------------------------------------------------- */

function financialBlock(prefix, scopeLabel) {
  // scopeLabel is shown in every money label so the enumerator always
  // knows whether they are recording ECD-only or whole-school figures.
  const s = scopeLabel ? ` — ${scopeLabel}` : '';
  return [
    { id: prefix + 'monthly_revenue', label: 'Average monthly revenue' + s, type: 'currency', required: true },
    { id: prefix + 'revenue_seasonal', label: 'Does revenue vary by term / season?' + s, type: 'yesno' },
    { id: prefix + 'revenue_peak_trough', label: 'Briefly list peak and trough months', type: 'textarea', indent: true,
      when: a => a[prefix + 'revenue_seasonal'] === 'Yes' },
    { id: prefix + 'rev_src', label: 'Approximate revenue by source (must sum to 100%)' + s, type: 'percentgroup',
      rows: ['Parent fees (out of pocket / mobile money)', 'Government subsidy / capitation', 'Donor / grant funding', 'Other'] },
    { id: prefix + 'collection_days', label: 'On average, how long does it take to collect fees / be paid?' + s, type: 'select',
      options: ['<30 days', '30–60 days', '60–90 days', '90–180 days', '180+ days'] },
    { id: prefix + 'arrears', label: 'Do you have parent fee arrears outstanding?' + s, type: 'yesno' },
    { id: prefix + 'arrears_value', label: 'Approximate value of fee arrears outstanding', type: 'currency', indent: true,
      when: a => a[prefix + 'arrears'] === 'Yes' }
  ];
}

function deepDiveBlock(prefix, scopeLabel) {
  const s = scopeLabel ? ` — ${scopeLabel}` : '';
  return [
    { type: 'subhead', label: 'Historic revenue & enrolment' + s },
    { id: prefix + 'rev_2026', label: 'Revenue so far in 2026', type: 'currency' },
    { id: prefix + 'rev_2025', label: 'Annual revenue in 2025', type: 'currency' },
    { id: prefix + 'rev_2024', label: 'Annual revenue in 2024', type: 'currency' },
    { id: prefix + 'enrol_2025', label: '# children enrolled in 2025', type: 'integer' },
    { id: prefix + 'enrol_2024', label: '# children enrolled in 2024', type: 'integer' },
    { type: 'subhead', label: 'Annual cost base (2025, as available)' + s },
    { id: prefix + 'cost_total', label: 'Total costs', type: 'currency' },
    { id: prefix + 'cost_salaries', label: 'Salaries', type: 'currency', indent: true },
    { id: prefix + 'cost_rent', label: 'Rent', type: 'currency', indent: true },
    { id: prefix + 'cost_food', label: 'Food / feeding', type: 'currency', indent: true },
    { id: prefix + 'cost_materials', label: 'Learning materials & supplies', type: 'currency', indent: true },
    { id: prefix + 'cost_utilities', label: 'Utilities', type: 'currency', indent: true },
    { id: prefix + 'cost_maintenance', label: 'Maintenance', type: 'currency', indent: true },
    { type: 'subhead', label: 'Assets' + s },
    { id: prefix + 'asset_premises', label: 'Purchase value of premises', type: 'currency', indent: true },
    { id: prefix + 'asset_furniture', label: 'Purchase value of furniture & equipment', type: 'currency', indent: true },
    { id: prefix + 'asset_play', label: 'Purchase value of play equipment', type: 'currency', indent: true },
    { id: prefix + 'asset_vehicles', label: 'Purchase value of vehicles', type: 'currency', indent: true }
  ];
}

/* ------------------------------------------------------------------ */

const ECD_SCHEMA = {
  id: 'ecd',
  title: 'ECD & childcare centre questionnaire',
  subtitle: 'Jackfruit × Open Capital — creditworthiness & readiness diagnostic',
  sections: [

  /* ---------------- SECTION 0 ---------------- */
  {
    id: 's0', num: '0', title: 'Basic information',
    note: 'Common to all centres.',
    groups: [
      { title: 'Centre identification', questions: [
        { id: 'centre_name', label: 'Centre name', type: 'text', required: true,
          help: 'If the centre is on the sample list, select it to attach its known records.' },
        { id: 'centre_type', label: 'Centre type', type: 'select', options: CENTRE_TYPES, required: true, locked: true,
          help: 'Set on the start screen. Standalone ECD/daycare and home-based centres use the daycare questionnaire.' },
        { id: 'centre_type_other', label: 'Please specify the centre type', type: 'text', indent: true,
          when: a => a.centre_type === 'Other (please specify)' },
        { id: 'religious_affiliation', label: 'Religious affiliation of centre (if applicable)', type: 'text' },
        { id: 'year_opened', label: 'Year the centre opened', type: 'year', required: true },
        { id: 'years_operating', label: 'How many years have you been in operation?', type: 'number' },
        { id: 'interviewee_name', label: 'Interviewee name', type: 'text', required: true },
        { id: 'interviewee_role', label: 'Interviewee role', type: 'select',
          options: ['Owner / proprietor', 'Head teacher / centre manager', 'Lead caregiver', 'Administrator', 'Other (specify)'], required: true },
        { id: 'interviewee_role_other', label: 'Please specify the role', type: 'text', indent: true,
          when: a => a.interviewee_role === 'Other (specify)' },
        { id: 'owner_is_lead', label: 'Is the owner or primary shareholder also the lead caregiver / head of the centre?', type: 'yesno' },
        { id: 'owner_gender', label: 'Owner / proprietor gender', type: 'select',
          options: ['Female', 'Male', 'Prefer not to say'],
          help: 'Captured for the women-led / women’s-economic-participation lens.' },
        { id: 'ownership_type', label: 'Ownership type', type: 'select',
          options: ['Privately owned business', 'Faith-based organisation', 'Community-based organisation', 'NGO', 'Home-based / individual', 'Other (specify)'] },
        { id: 'ownership_type_other', label: 'Please specify the ownership type', type: 'text', indent: true,
          when: a => a.ownership_type === 'Other (specify)' }
      ]},
      { title: 'Contact details', questions: [
        { id: 'centre_phone', label: 'Centre phone number or WhatsApp', type: 'phone', required: true },
        { id: 'owner_email', label: 'Owner email', type: 'email' },
        { id: 'centre_email', label: 'Centre email (school)', type: 'email' },
        { id: 'physical_address', label: 'Physical address', type: 'textarea' }
      ]},
      { title: 'Location', questions: [
        { id: 'admin_l1', label: '@adminL1Label', type: 'geo_l1', required: true },
        { id: 'admin_l1_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.admin_l1 === 'Other (specify)' },
        { id: 'admin_l2', label: '@adminL2Label', type: 'geo_l2' },
        { id: 'admin_l3', label: '@adminL3Label', type: 'geo_l3' },
        { id: 'admin_l4', label: '@adminL4Label', type: 'text' },
        { id: 'settlement', label: 'Refugee settlement / camp (if applicable)', type: 'geo_settlement' },
        { id: 'setting', label: 'Setting', type: 'select',
          options: ['Inside refugee settlement', 'Host community adjacent to settlement', 'Urban informal settlement', 'Peri-urban', 'Urban residential', 'Rural'], required: true },
        { id: 'gps', label: 'GPS coordinates', type: 'geo',
          help: 'Tap "Use my location" while standing at the centre.' }
      ]},
      { title: 'Attached primary school', when: isAttachedToPrimary, questions: [
        { type: 'note', label: 'This centre is a pre-primary unit inside a primary school. The questions below describe the wider school; financial figures for the ECD unit and for the whole school are collected separately in Sections V and VIII.' },
        { id: 'school_name', label: 'Name of the primary school the ECD unit sits within', type: 'text', required: true },
        { id: 'school_grades', label: 'Grades / classes offered by the whole school', type: 'text',
          placeholder: 'e.g. PP1–Grade 8' },
        { id: 'school_total_enrolment', label: 'Total enrolment of the whole school (all grades, including the ECD unit)', type: 'integer' },
        { id: 'school_ownership', label: 'Who owns / manages the primary school?', type: 'select',
          options: ['Same owner as the ECD unit', 'Government / public school', 'Private proprietor', 'Faith-based organisation', 'Community / CBO', 'NGO', 'Other (specify)'] },
        { id: 'school_ownership_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.school_ownership === 'Other (specify)' },
        { id: 'ecd_separate_accounts', label: 'Are the ECD unit’s fees and accounts kept separately from the rest of the school’s?', type: 'select',
          options: ['Completely separate', 'Partly separate', 'Not separate — one set of accounts'] },
        { id: 'ecd_own_budget', label: 'Does the ECD unit have its own budget?', type: 'yesno' },
        { id: 'ecd_share_of_school_rev', label: 'Approximately what share of total school revenue comes from the ECD unit?', type: 'percent' },
        { id: 'ecd_subsidised_by_school', label: 'Does the wider school subsidise the ECD unit (or vice versa)?', type: 'select',
          options: ['School subsidises the ECD unit', 'ECD unit subsidises the school', 'Neither — each covers its own costs', 'Unsure'] },
        { id: 'borrower_entity', label: 'If the centre borrowed, who would the borrower be?', type: 'select',
          options: ['The whole school', 'The ECD unit only', 'The individual owner / proprietor', 'Unsure'] }
      ]}
    ]
  },

  /* ---------------- SECTION I ---------------- */
  {
    id: 's1', num: 'I', title: 'Enrolment, age groups & fees',
    groups: [
      { title: 'Age groups & operating model', questions: [
        { id: 'age_groups', label: 'Age groups served (select all that apply)', type: 'multiselect',
          options: ['0–2 (infants)', '2–3 (toddlers)', '3–5 (pre-primary)', '6+ (school-age / after-school)'], required: true },
        { id: 'operating_model', label: 'Operating model', type: 'select',
          options: ['Full-day daycare', 'Half-day pre-primary', 'Both full-day and half-day', 'After-school care only'] },
        { id: 'days_open_week', label: 'Days open per week', type: 'integer', min: 1, max: 7 },
        { id: 'hours_open_day', label: 'Hours open per day', type: 'integer', min: 1, max: 24 },
        { id: 'months_open_year', label: 'Months open per year', type: 'integer', min: 1, max: 12,
          help: 'Captures term vs year-round operation.' }
      ]},
      { title: 'Enrolment & attendance', questions: [
        { id: 'enrol_total', label: 'Current total enrolment (# children)', type: 'integer', required: true },
        { id: 'enrol_0_2', label: '# children aged 0–2', type: 'integer', indent: true,
          when: a => (a.age_groups || []).includes('0–2 (infants)') },
        { id: 'enrol_2_3', label: '# children aged 2–3', type: 'integer', indent: true,
          when: a => (a.age_groups || []).includes('2–3 (toddlers)') },
        { id: 'enrol_3_5', label: '# children aged 3–5', type: 'integer', indent: true,
          when: a => (a.age_groups || []).includes('3–5 (pre-primary)') },
        { id: 'enrol_6p', label: '# children aged 6+', type: 'integer', indent: true,
          when: a => (a.age_groups || []).includes('6+ (school-age / after-school)') },
        { id: 'max_capacity', label: 'Maximum capacity (# children)', type: 'integer' },
        { id: 'waiting_list', label: '# children on the waiting list', type: 'integer' },
        { type: 'subhead', label: 'Enrolment trend' },
        { id: 'enrol_this_year', label: 'Enrolment this year', type: 'integer' },
        { id: 'enrol_last_year', label: 'Enrolment last year', type: 'integer' },
        { id: 'enrol_two_years_ago', label: 'Enrolment two years ago', type: 'integer' },
        { type: 'subhead', label: 'Composition' },
        { id: 'pct_girls', label: 'Approximate gender split', type: 'percent', unitLabel: '% girls' },
        { id: 'pct_refugee', label: 'Approximate proportion of children who are refugees vs host community', type: 'percent',
          unitLabel: '% refugee', help: 'Refugee-hosting impact lens.' },
        { id: 'pct_low_income', label: 'Approximate proportion of children from low-income households', type: 'select',
          options: ['<25%', '25–50%', '50–75%', '75%+'] },
        { id: 'avg_daily_attendance', label: 'Average daily attendance (# children)', type: 'integer' },
        { id: 'attendance_recorded', label: 'How often is child attendance recorded?', type: 'select',
          options: ['Daily', 'Periodic', 'Not recorded'] }
      ]},
      { title: 'Fees', questions: [
        { id: 'fee_period', label: 'How are fees charged?', type: 'select',
          options: ['Per day', 'Per week', 'Per month', 'Per term', 'No fees / free'], required: true },
        { id: 'fee_amount', label: 'Typical fee per child', type: 'currency',
          help: 'Per the period selected above.', when: a => a.fee_period && a.fee_period !== 'No fees / free' },
        { id: 'fee_collection', label: 'How are fees collected?', type: 'select',
          options: ['Cash', 'Mobile money', 'Bank transfer', 'Mix'],
          when: a => a.fee_period && a.fee_period !== 'No fees / free' },
        { id: 'fee_flexibility', label: 'Do you offer flexible payment (instalments / credit to parents) or scholarships?', type: 'select',
          options: ['No', 'Instalments', 'Scholarships / subsidised places', 'Both'] },
        { id: 'fee_collected_pct', label: 'Approximately what proportion of fees are collected?', type: 'percent',
          when: a => a.fee_period && a.fee_period !== 'No fees / free' },
        { id: 'provides_transport', label: 'Do you provide transport to children?', type: 'yesno', phase: 2 },
        { id: 'provides_meals', label: 'Do you provide meals / feeding to children?', type: 'yesno', phase: 2 },
        { id: 'meals_per_day', label: '# meals provided per day', type: 'integer', indent: true, phase: 2,
          when: a => a.provides_meals === 'Yes' }
      ]}
    ]
  },

  /* ---------------- SECTION II ---------------- */
  {
    id: 's2', num: 'II', title: 'Early learning & child development quality', phase: 2,
    note: 'Optional at screening — can be completed at deep dive.',
    groups: [
      { title: 'Curriculum & practice', questions: [
        { id: 'has_curriculum', label: 'Do you follow a curriculum or early-learning framework?', type: 'yesno' },
        { id: 'curriculum_which', label: 'Which framework?', type: 'select_country', optionsKey: 'curriculumOptions', indent: true,
          when: a => a.has_curriculum === 'Yes' },
        { id: 'curriculum_other', label: 'Please specify the framework', type: 'text', indent: true,
          when: a => a.curriculum_which === 'Other (specify)' },
        { id: 'lesson_plans', label: 'Do caregivers use lesson plans / a structured daily routine?', type: 'yesno' },
        { id: 'learning_materials', label: 'Learning & play materials available (select all that apply)', type: 'multiselect',
          options: ['Age-appropriate books', 'Learning aids / charts', 'Toys & manipulatives', 'Outdoor play equipment', 'Art / craft materials', 'None'] }
      ]},
      { title: 'Child development & school readiness', questions: [
        { id: 'tracks_milestones', label: 'Do you assess or track children’s developmental milestones / school readiness?', type: 'yesno' },
        { id: 'progress_records', label: 'How are records of children’s progress kept?', type: 'select',
          options: ['Paper records', 'Spreadsheet', 'Management system', 'Not recorded'], indent: true,
          when: a => a.tracks_milestones === 'Yes' },
        { id: 'pct_transition_primary', label: 'Approximate % of children who transition to primary school', type: 'percent',
          help: 'Pre-primary centres; leave blank if not applicable.', allowNA: true }
      ]},
      { title: 'Environment for young children', questions: [
        { id: 'learning_play_space', label: 'Is there a dedicated indoor learning area and an outdoor play space?', type: 'select',
          options: ['Both', 'Indoor only', 'Outdoor only', 'Neither'] },
        { id: 'nap_area', label: 'Is there a nap / rest area for younger children?', type: 'yesno' },
        { id: 'caregiver_ratio', label: 'Approximate caregiver-to-child ratio', type: 'integer',
          prefixLabel: '1 caregiver per', unitLabel: 'children' }
      ]}
    ]
  },

  /* ---------------- SECTION III ---------------- */
  {
    id: 's3', num: 'III', title: 'Facilities, WASH & safeguarding',
    groups: [
      { title: 'Premises & building', questions: [
        { id: 'num_classrooms', label: '# learning rooms / classrooms', type: 'integer' },
        { id: 'capacity_per_room', label: 'Average capacity per room (# children)', type: 'integer' },
        { id: 'wall_construction', label: 'Wall construction (select all that apply)', type: 'multiselect', phase: 2,
          options: ['Concrete', 'Cinderblock', 'Brick', 'Mabati (iron sheets)', 'Mud / wattle', 'Wood'] },
        { id: 'floor_construction', label: 'Floor construction (select all that apply)', type: 'multiselect', phase: 2,
          options: ['Concrete', 'Tile', 'Dirt'] },
        { id: 'premises_tenure', label: 'Are premises owned or leased?', type: 'select', options: ['Owned', 'Leased'] },
        { id: 'lease_expiry', label: 'When does the current lease expire?', type: 'date', indent: true,
          when: a => a.premises_tenure === 'Leased' },
        { id: 'monthly_rent', label: 'What is the monthly rent?', type: 'currency', indent: true,
          when: a => a.premises_tenure === 'Leased' }
      ]},
      { title: 'Water, sanitation & power', phase: 2, questions: [
        { id: 'running_water', label: 'Running water on site?', type: 'yesno' },
        { id: 'safe_drinking_water', label: 'Safe / treated drinking water available?', type: 'yesno' },
        { id: 'handwashing', label: 'Handwashing stations available?', type: 'yesno' },
        { id: 'child_toilets', label: 'Child-friendly toilets available?', type: 'yesno' },
        { id: 'num_toilets', label: '# toilets', type: 'integer' },
        { id: 'electricity', label: 'Electricity connected?', type: 'yesno' },
        { id: 'electricity_source', label: 'Main source of electricity', type: 'select',
          options: ['Grid', 'Solar', 'Generator', 'None'], indent: true,
          when: a => a.electricity === 'Yes' },
        { id: 'kitchen_area', label: 'Dedicated kitchen / food-preparation area?', type: 'yesno',
          when: a => a.provides_meals === 'Yes' }
      ]},
      { title: 'Child safeguarding', phase: 2, questions: [
        { id: 'safeguarding_policy', label: 'Does the centre have a written child safeguarding / protection policy?', type: 'yesno' },
        { id: 'safeguarding_practices', label: 'Safeguarding practices in place (select all that apply)', type: 'multiselect',
          options: ['Caregiver background vetting', 'Child-protection / safeguarding training', 'No corporal punishment', 'Designated child-protection focal point', 'First-aid-trained staff', 'Secure / enclosed compound', 'Zero tolerance for abuse or bullying', 'Other (specify)'] },
        { id: 'safeguarding_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.safeguarding_practices || []).includes('Other (specify)') }
      ]}
    ]
  },

  /* ---------------- SECTION IV ---------------- */
  {
    id: 's4', num: 'IV', title: 'Staff',
    groups: [
      { title: null, questions: [
        { id: 'staff_total', label: '# staff total', type: 'integer', required: true },
        { id: 'staff_trained_ecd', label: '# trained ECD caregivers / teachers', type: 'integer', indent: true },
        { id: 'staff_ecde_qualified', label: '# with an ECDE certificate / diploma or equivalent qualification', type: 'integer', indent: true },
        { id: 'staff_support', label: '# support staff (cook, cleaner, security)', type: 'integer', indent: true },
        { id: 'payroll_monthly', label: 'Average monthly payroll cost', type: 'currency', required: true },
        { id: 'staff_training_freq', label: 'How many times per year do staff attend training / CPD? (approximately)', type: 'integer', phase: 2 },
        { id: 'staff_me', label: 'Do you monitor and evaluate caregiver / teacher performance?', type: 'yesno', phase: 2 },
        { id: 'staff_incentives', label: 'Do staff receive rewards / incentives for good performance?', type: 'yesno', phase: 2 }
      ]}
    ]
  },

  /* ---------------- SECTION V ---------------- */
  {
    id: 's5', num: 'V', title: 'Financial profile (creditworthiness core)',
    noteFn: a => isAttachedToPrimary(a)
      ? 'This centre is a pre-primary unit inside a primary school. Record the figures for the ECD / pre-primary unit ONLY here — whole-school figures are collected in Section V-B.'
      : null,
    groups: [
      { titleFn: a => isAttachedToPrimary(a) ? 'Revenue — ECD / pre-primary unit only' : 'Revenue',
        questions: financialBlock('', null) },
      { title: 'Financial management', questions: [
        { id: 'digital_tools', label: 'Do you use digital tools to manage the business?', type: 'yesno', phase: 2 },
        { id: 'digital_tools_use', label: 'What are these digital tools used for?', type: 'multiselect', indent: true, phase: 2,
          options: ['Back-office processes', 'Payments', 'Learning / records', 'Other'],
          when: a => a.digital_tools === 'Yes' },
        { id: 'bank_account', label: 'Does the centre have a dedicated bank account?', type: 'yesno' },
        { id: 'accounts_tracking', label: 'How do you track management accounts and financials?', type: 'select',
          options: ['Accounting software', 'Spreadsheet / Excel', 'Written records', 'No formal records', 'Other'] },
        { id: 'mobile_money', label: 'Do you use mobile money for fees or for making payments?', type: 'yesno',
          labelFn: (a, c) => `Do you use mobile money (${c.mobileMoney}) for fees or for making payments?` }
      ]},
      { title: 'Supplies', phase: 2, questions: [
        { id: 'supply_shortages', label: 'How often do you run short of essential supplies (food, learning materials)?', type: 'select',
          options: ['Frequently', 'Occasionally', 'Rarely', 'Never'] },
        { id: 'supplier_credit', label: 'When you buy supplies, do you pay cash upfront or do suppliers give you credit?', type: 'select',
          options: ['Cash only', 'Mix of cash and credit', 'Mostly credit'] }
      ]}
    ]
  },

  /* ---------------- SECTION V-B (attached-to-primary only) ---------------- */
  {
    id: 's5b', num: 'V-B', title: 'Financial profile — whole school',
    when: isAttachedToPrimary,
    note: 'Same financial questions, but for the ENTIRE school (all grades, including the ECD / pre-primary unit).',
    groups: [
      { title: 'Revenue — whole school (all grades)', questions: financialBlock('sch_', 'whole school') },
      { title: 'School-level context', questions: [
        { id: 'sch_bank_account', label: 'Does the school have a dedicated bank account (separate from the ECD unit’s)?', type: 'yesno' },
        { id: 'sch_payroll_monthly', label: 'Average monthly payroll cost — whole school', type: 'currency' },
        { id: 'sch_staff_total', label: '# staff total — whole school', type: 'integer' },
        { id: 'sch_fee_per_term', label: 'Typical fee per child per term — primary grades', type: 'currency' }
      ]}
    ]
  },

  /* ---------------- SECTION VI ---------------- */
  {
    id: 's6', num: 'VI', title: 'Loan history, demand & savings-group linkage',
    groups: [
      { title: 'Experience with loans', questions: [
        { id: 'applied_before', label: 'Have you ever applied for a loan before?', type: 'yesno', required: true },
        { id: 'no_loan_reason', label: 'If not, why have you not taken out a loan previously?', type: 'multiselect', indent: true,
          options: ['Not interested', 'Interest rates too high', 'Do not know where to go', 'Applied but rejected', 'No collateral', 'Other (specify)'],
          when: a => a.applied_before === 'No' },
        { id: 'no_loan_reason_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.no_loan_reason || []).includes('Other (specify)') },
        { id: 'loan_outcome', label: 'What was the outcome?', type: 'select', indent: true,
          options: ['Approved & taken', 'Approved but declined', 'Rejected', 'Application in progress'],
          when: a => a.applied_before === 'Yes' },
        { id: 'loan_source', label: 'Who did you source the loan from?', type: 'select_country', optionsKey: 'lenderOptions', indent: true,
          when: a => a.applied_before === 'Yes' },
        { id: 'loan_rejection_reason', label: 'If rejected, briefly explain the reason given (if known)', type: 'textarea', indent: true,
          when: a => a.loan_outcome === 'Rejected' },
        { id: 'loan_interest_rate', label: 'What interest rate did you pay or are you paying?', type: 'percent', indent: true,
          when: a => a.applied_before === 'Yes' }
      ]},
      { title: 'Savings groups & women’s economic participation', questions: [
        { id: 'savings_group_member', label: 'Is the owner or the centre a member of a VSLA, savings group or chama?', type: 'yesno',
          labelFn: (a, c) => `Is the owner or the centre a member of a ${c.savingsGroupTerm}?` },
        { id: 'savings_group_role', label: 'Do savings groups currently help finance the centre or parents’ fees? Briefly describe.', type: 'textarea', indent: true, phase: 2,
          when: a => a.savings_group_member === 'Yes' },
        { id: 'parents_rely_childcare', label: 'Do most parents (especially mothers) rely on this childcare to be able to work or run a business?', type: 'select',
          options: ['Yes, most', 'Some', 'Few', 'Unsure'], phase: 2,
          help: 'Women’s economic-participation impact lens.' }
      ]},
      { title: 'Demand for financing', questions: [
        { id: 'wants_loan', label: 'Are you interested in taking out a new loan?', type: 'yesno', required: true },
        { id: 'loan_purpose', label: 'What would you use the loan for? (select top 1–3)', type: 'multiselect', indent: true, max: 3,
          options: ['Renovation / construction', 'Build or expand premises', 'Land purchase', 'Learning materials & equipment', 'Playground / outdoor equipment', 'WASH improvements', 'Furniture', 'Working capital / cash flow', 'Staff hiring or training', 'Solar / utilities', 'Vehicle', 'Other (specify)'],
          when: a => a.wants_loan === 'Yes' },
        { id: 'loan_purpose_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.loan_purpose || []).includes('Other (specify)') },
        { id: 'loan_size_wanted', label: 'What loan size would you be looking for?', type: 'currency', indent: true,
          when: a => a.wants_loan === 'Yes' },
        { id: 'repay_capacity_month', label: 'Approximately how much could you repay per month?', type: 'currency', indent: true,
          when: a => a.wants_loan === 'Yes' },
        { type: 'subhead', label: 'Would you be willing to use the following as collateral?',
          when: a => a.wants_loan === 'Yes' },
        { id: 'coll_land', label: 'Land or lease', type: 'yesnounsure', indent: true, when: a => a.wants_loan === 'Yes' },
        { id: 'coll_equipment', label: 'Equipment / furniture', type: 'yesnounsure', indent: true, when: a => a.wants_loan === 'Yes' },
        { id: 'coll_vehicle', label: 'Vehicle', type: 'yesnounsure', indent: true, when: a => a.wants_loan === 'Yes' },
        { id: 'coll_personal_guarantee', label: 'Personal guarantee from the owner / director', type: 'yesnounsure', indent: true, when: a => a.wants_loan === 'Yes' },
        { id: 'coll_group_guarantee', label: 'Group / joint guarantee (e.g., via a savings group)', type: 'yesnounsure', indent: true,
          help: 'Relevant for partner-led / group lending (esp. Uganda).', when: a => a.wants_loan === 'Yes' }
      ]},
      { title: 'Investment plans', questions: [
        { id: 'plans_investment', label: 'Are you planning any investments to grow or improve the centre in the next 12 months?', type: 'yesno' },
        { id: 'investment_areas', label: 'What are you planning to invest in?', type: 'multiselect', indent: true,
          options: ['Facility expansion / renovation', 'Learning materials & equipment', 'Playground / outdoor equipment', 'WASH improvements', 'Staff training or hiring', 'Digital tools', 'Other (specify)'],
          when: a => a.plans_investment === 'Yes' },
        { id: 'investment_areas_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.investment_areas || []).includes('Other (specify)') },
        { id: 'investment_goal', label: 'What is the main goal of this investment?', type: 'select', indent: true,
          options: ['Enrol more children / expand capacity', 'Improve learning quality', 'Improve safety / facilities', 'Reduce costs or improve efficiency', 'Other (specify)'],
          when: a => a.plans_investment === 'Yes' },
        { id: 'investment_goal_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.investment_goal === 'Other (specify)' },
        { id: 'investment_cost', label: 'How much do you expect this investment will cost?', type: 'currency', indent: true,
          when: a => a.plans_investment === 'Yes' },
        { id: 'investment_finance', label: 'How are you planning on financing this investment?', type: 'select', indent: true,
          options: ['Retained profits / savings', 'Loan', 'VSLA / savings group', 'Unsure', 'Other (specify)'],
          when: a => a.plans_investment === 'Yes' },
        { id: 'investment_finance_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.investment_finance === 'Other (specify)' }
      ]}
    ]
  },

  /* ---------------- SECTION VII ---------------- */
  {
    id: 's7', num: 'VII', title: 'Registration & compliance',
    groups: [
      { title: null, questions: [
        { id: 'is_registered', label: 'Is the centre registered?', type: 'yesno', required: true },
        { id: 'registered_with', label: 'Registered with (select all that apply)', type: 'multiselect_country',
          optionsKey: 'registrationOptions', indent: true,
          when: a => a.is_registered === 'Yes' },
        { id: 'registered_with_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.registered_with || []).includes('Other') },
        { id: 'registration_number', label: 'Registration / permit number', type: 'text', phase: 2 },
        { id: 'permit_expiry', label: 'Business permit expiry date', type: 'date', phase: 2 },
        { id: 'tax_id', label: '@taxIdLabel', type: 'taxid', phase: 2 },
        { id: 'ecd_licence', label: 'Any required ECD operating licence held?', type: 'select',
          options: ['Yes, current licence', 'No, pending renewal', 'No', 'Unsure'] }
      ]}
    ]
  },

  /* ---------------- SECTION VIII ---------------- */
  {
    id: 's8', num: 'VIII', title: 'Deep-dive financials — Phase 2',
    phase: 2,
    note: 'Phase 2 — complete if the centre is shortlisted on creditworthiness or is interested in a loan. Skippable at screening.',
    noteFn: a => isAttachedToPrimary(a)
      ? 'Phase 2. Record ECD / pre-primary unit figures ONLY here — whole-school deep-dive figures are in Section VIII-B.'
      : null,
    groups: [
      { titleFn: a => isAttachedToPrimary(a) ? 'ECD / pre-primary unit only' : null,
        questions: deepDiveBlock('dd_', null) },
      { title: 'Outstanding obligations', questions: [
        { id: 'has_outstanding_loans', label: 'Do you have any outstanding loans or financial obligations?', type: 'yesno' },
        { id: 'loans', label: 'Outstanding loans', type: 'repeat', indent: true,
          addLabel: 'Add a loan', itemLabel: 'Loan',
          when: a => a.has_outstanding_loans === 'Yes',
          fields: [
            { id: 'type', label: 'Type of loan', type: 'select_country', optionsKey: 'lenderOptions' },
            { id: 'provider', label: 'Provider', type: 'text' },
            { id: 'original_value', label: 'Original value of the loan', type: 'currency' },
            { id: 'interest_rate', label: 'Interest rate', type: 'percent' },
            { id: 'monthly_repayment', label: 'Monthly repayment', type: 'currency' },
            { id: 'balance', label: 'Balance remaining', type: 'currency' }
          ]}
      ]}
    ]
  },

  /* ---------------- SECTION VIII-B ---------------- */
  {
    id: 's8b', num: 'VIII-B', title: 'Deep-dive financials — whole school',
    phase: 2,
    when: isAttachedToPrimary,
    note: 'Same deep-dive financials, but for the ENTIRE school (all grades, including the ECD / pre-primary unit).',
    groups: [
      { title: 'Whole school (all grades)', questions: deepDiveBlock('sdd_', 'whole school') },
      { title: 'Whole-school obligations', questions: [
        { id: 'sch_has_outstanding_loans', label: 'Does the school (as a whole) have any outstanding loans or financial obligations?', type: 'yesno' },
        { id: 'sch_loans', label: 'Outstanding loans — whole school', type: 'repeat', indent: true,
          addLabel: 'Add a loan', itemLabel: 'School loan',
          when: a => a.sch_has_outstanding_loans === 'Yes',
          fields: [
            { id: 'type', label: 'Type of loan', type: 'select_country', optionsKey: 'lenderOptions' },
            { id: 'provider', label: 'Provider', type: 'text' },
            { id: 'original_value', label: 'Original value of the loan', type: 'currency' },
            { id: 'interest_rate', label: 'Interest rate', type: 'percent' },
            { id: 'monthly_repayment', label: 'Monthly repayment', type: 'currency' },
            { id: 'balance', label: 'Balance remaining', type: 'currency' }
          ]}
      ]}
    ]
  },

  /* ---------------- ENUMERATOR OBSERVATIONS ---------------- */
  {
    id: 'obs', num: 'IX', title: 'Enumerator observations',
    note: 'Completed by the enumerator after the interview. NOT shared with the centre.',
    enumeratorOnly: true,
    groups: [
      { title: null, questions: [
        { id: 'obs_admin_l1', label: '@adminL1Label (confirm)', type: 'geo_l1' },
        { id: 'obs_gps', label: 'Geocoordinates', type: 'geo', help: 'Drop a pin at the centre.' },
        { id: 'obs_condition', label: 'Centre condition', type: 'select',
          options: ['Well maintained, professional appearance', 'Some disrepair / maintenance concerns', 'Poor condition'] },
        { id: 'obs_activity', label: 'Children present / activity observed', type: 'select',
          options: ['Busy — many children & activity', 'Moderate', 'Quiet', 'Empty'] },
        { id: 'obs_interaction', label: 'Quality of caregiver–child interaction observed', type: 'select',
          options: ['Warm & engaged', 'Adequate', 'Minimal / none'] },
        { id: 'obs_safety', label: 'Safety of the environment observed', type: 'select',
          options: ['Safe & secure', 'Some concerns', 'Unsafe'] },
        { id: 'obs_owner_financial_knowledge', label: 'Owner’s level of knowledge of financial figures', type: 'select',
          options: ['Clearly knew or could check numbers', 'Reasonable estimates', 'Vague or unclear'] },
        { id: 'obs_area', label: 'Area where centre is located', type: 'select',
          options: ['Refugee settlement', 'Host community', 'Rural', 'Peri-urban', 'Informal urban settlement', 'Urban residential', 'Mixed-income urban'] },
        { id: 'obs_red_flags', label: 'Any concerns or red flags not captured elsewhere', type: 'textarea' },
        { id: 'obs_photos', label: 'Photograph of fee schedule / premises', type: 'photo', multiple: true }
      ]}
    ]
  }
]};
