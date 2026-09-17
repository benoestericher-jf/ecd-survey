/* ------------------------------------------------------------------
   PATH B - Daycare & Home-Based Care Centre Survey (Sections 1-18)
   Mirrors the "Specific to Day Care" tab of the survey guide.
   Routed to when centre type = Standalone ECD / daycare centre, or
   Home-based childcare.
   ------------------------------------------------------------------ */

const DAYCARE_SCHEMA = {
  id: 'daycare',
  title: 'Daycare & home-based care centre survey',
  subtitle: 'Operations, financial performance, financing needs and credit readiness — children aged 0–5',
  sections: [

  /* ---------------- 1 ---------------- */
  {
    id: 'd1', num: '1', title: 'Centre identification',
    groups: [
      { title: null, questions: [
        { id: 'centre_name', label: 'Centre name', type: 'text', required: true },
        { id: 'centre_type', label: 'Centre type', type: 'select', locked: true,
          options: ['Standalone ECD / daycare centre', 'Home-based childcare'],
          help: 'Set on the start screen.' },
        { id: 'admin_l1', label: '@adminL1Label', type: 'geo_l1', required: true },
        { id: 'admin_l1_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.admin_l1 === 'Other (specify)' },
        { id: 'admin_l2', label: '@adminL2Label', type: 'geo_l2' },
        { id: 'admin_l3', label: '@adminL3Label', type: 'geo_l3' },
        { id: 'admin_l4', label: '@adminL4Label', type: 'text' },
        { id: 'settlement', label: 'Refugee settlement / camp (if applicable)', type: 'geo_settlement' },
        { id: 'gps', label: 'GPS coordinates', type: 'geo', help: 'Tap "Use my location" while standing at the centre.' },
        { id: 'interview_date', label: 'Date of interview', type: 'date', required: true, prefillToday: true },
        { id: 'enumerator_name', label: 'Enumerator name', type: 'text', locked: true },
        { id: 'interviewee_name', label: 'Respondent name', type: 'text', required: true },
        { id: 'centre_phone', label: 'Respondent phone number', type: 'phone', required: true },
        { id: 'interviewee_role', label: 'Respondent’s role', type: 'select',
          options: ['Owner', 'Manager', 'Caregiver', 'Group representative', 'Other'], required: true },
        { id: 'interviewee_role_other', label: 'Please specify the role', type: 'text', indent: true,
          when: a => a.interviewee_role === 'Other' }
      ]}
    ]
  },

  /* ---------------- 2 ---------------- */
  {
    id: 'd2', num: '2', title: 'Centre ownership & structure',
    groups: [
      { title: null, questions: [
        { id: 'dc_centre_type', label: 'What type of centre is this?', type: 'select',
          options: ['Home-based childcare', 'School-based daycare', 'Community-based centre', 'Other'], required: true },
        { id: 'dc_centre_type_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.dc_centre_type === 'Other' },
        { id: 'operator_type', label: 'Who operates / owns the centre?', type: 'select',
          options: ['Individual woman / mama', 'Individual man', 'Women’s group', 'Community group', 'NGO / CBO', 'Faith-based organization', 'Private organization / company', 'Other'], required: true },
        { id: 'operator_type_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.operator_type === 'Other' },
        { id: 'years_operating', label: 'How long has the centre been operating? (years)', type: 'number' },
        { id: 'year_opened', label: 'Year the centre opened', type: 'year' },
        { id: 'is_registered', label: 'Is the centre registered?', type: 'select',
          options: ['Yes', 'No', 'Application in progress', 'Don’t know'], required: true },
        { id: 'registered_with', label: 'If registered, with which authority / organization?', type: 'multiselect_country',
          optionsKey: 'registrationOptions', indent: true,
          when: a => a.is_registered === 'Yes' || a.is_registered === 'Application in progress' },
        { id: 'registered_with_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.registered_with || []).includes('Other') },
        { id: 'premises_owner', label: 'Who owns the premises?', type: 'select',
          options: ['Owner', 'Rented', 'Community-owned', 'Group-owned', 'Organization-owned', 'Other'], required: true },
        { id: 'premises_owner_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.premises_owner === 'Other' },
        { id: 'monthly_rent', label: 'If rented, what is the monthly rent?', type: 'currency', indent: true,
          when: a => a.premises_owner === 'Rented' },
        { id: 'operates_independently', label: 'Does the centre operate independently or receive support from another organization / group?', type: 'select',
          options: ['Operates fully independently', 'Receives support from an organization', 'Receives support from a group', 'Part of a larger organization', 'Other'] },
        { id: 'support_source', label: 'Which organization / group, and what support?', type: 'textarea', indent: true,
          when: a => a.operates_independently && a.operates_independently !== 'Operates fully independently' }
      ]}
    ]
  },

  /* ---------------- 3 ---------------- */
  {
    id: 'd3', num: '3', title: 'Children served',
    groups: [
      { title: 'Current enrolment', questions: [
        { id: 'enrol_by_age', label: 'Enrolment by age', type: 'matrix',
          rows: ['Under 1 year', '1 year', '2 years', '3 years', '4 years', '5 years'],
          rowLabel: 'Age',
          cols: [
            { id: 'boys', label: 'Boys', type: 'integer' },
            { id: 'girls', label: 'Girls', type: 'integer' },
            { id: 'total', label: 'Total', type: 'computed', formula: 'sum' }
          ],
          totalRow: 'Total 0–5 years' },
        { id: 'enrol_total', label: 'How many children are enrolled in total?', type: 'integer', required: true,
          crosscheck: { of: 'enrol_by_age', message: 'This does not match the age table above.' } },
        { id: 'avg_daily_attendance', label: 'On an average day, how many children actually attend?', type: 'integer' },
        { id: 'peak_children', label: 'What is the highest number of children you have cared for at one time?', type: 'integer' },
        { id: 'pct_refugee', label: 'Approximate proportion of children who are refugees vs host community', type: 'percent', unitLabel: '% refugee' }
      ]},
      { title: 'Turnover', questions: [
        { id: 'new_per_month', label: 'How many new children join the centre in an average month?', type: 'integer' },
        { id: 'leave_per_month', label: 'How many children leave in an average month?', type: 'integer' },
        { id: 'why_leave', label: 'Why do children leave?', type: 'multiselect',
          options: ['Start school', 'Parents cannot afford fees', 'Family relocation', 'Move to another centre', 'Centre capacity', 'Other'] },
        { id: 'why_leave_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.why_leave || []).includes('Other') }
      ]}
    ]
  },

  /* ---------------- 4 ---------------- */
  {
    id: 'd4', num: '4', title: 'Services & daily operations',
    groups: [
      { title: 'Services', questions: [
        { id: 'services', label: 'What services does the centre provide?', type: 'multiselect',
          options: ['Daycare / childcare', 'Early learning / ECD', 'Meals', 'Snacks', 'Sleeping / rest', 'Diaper changing', 'Hygiene / bathing', 'Outdoor play', 'Learning materials', 'Health monitoring', 'Other'] },
        { id: 'services_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.services || []).includes('Other') }
      ]},
      { title: 'Opening hours', questions: [
        { id: 'open_time', label: 'What time does the centre open?', type: 'time' },
        { id: 'close_time', label: 'What time does it close?', type: 'time' },
        { id: 'days_operating', label: 'Which days of the week does it operate?', type: 'multiselect', optionsRef: 'WEEKDAYS' },
        { id: 'year_round', label: 'Does it operate throughout the year?', type: 'yesno' },
        { id: 'months_open_year', label: 'If not year-round, how many months per year is it open?', type: 'integer', min: 1, max: 12, indent: true,
          when: a => a.year_round === 'No' }
      ]},
      { title: 'Seasonality', questions: [
        { id: 'busiest_days', label: 'Which days are busiest?', type: 'multiselect', optionsRef: 'WEEKDAYS' },
        { id: 'busiest_months', label: 'Which months are busiest?', type: 'multiselect', optionsRef: 'MONTHS' },
        { id: 'slowest_days', label: 'Which days are slowest?', type: 'multiselect', optionsRef: 'WEEKDAYS' },
        { id: 'slowest_months', label: 'Which months are slowest?', type: 'multiselect', optionsRef: 'MONTHS' }
      ]},
      { title: 'Constraints', questions: [
        { id: 'growth_constraints', label: 'What prevents the centre from serving more children?', type: 'multiselect',
          options: ['Space', 'Staff', 'Money', 'Food', 'Water', 'Learning materials', 'Parent affordability', 'Registration / licensing', 'Other'] },
        { id: 'growth_constraints_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.growth_constraints || []).includes('Other') }
      ]}
    ]
  },

  /* ---------------- 5 ---------------- */
  {
    id: 'd5', num: '5', title: 'Staffing',
    groups: [
      { title: null, questions: [
        { id: 'staff_total', label: 'How many people work at the centre?', type: 'integer', required: true },
        { id: 'staff_table', label: 'Staff breakdown', type: 'matrix',
          rows: ['Caregivers', 'Teachers', 'Cook', 'Cleaner', 'Other'],
          cols: [
            { id: 'number', label: 'Number', type: 'integer' },
            { id: 'paid', label: 'Paid?', type: 'yesno_cell' },
            { id: 'amount', label: 'Amount paid (@CUR / month)', type: 'currency' }
          ]},
        { id: 'pay_frequency', label: 'How often are staff paid?', type: 'select',
          options: ['Daily', 'Weekly', 'Monthly', 'Other'] },
        { id: 'pay_frequency_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.pay_frequency === 'Other' },
        { id: 'caregiver_ratio', label: 'How many children does one caregiver typically supervise?', type: 'integer',
          prefixLabel: '1 caregiver per', unitLabel: 'children' },
        { id: 'staff_ecde_qualified', label: '# staff with an ECDE certificate / diploma or equivalent', type: 'integer' },
        { id: 'turned_away_staff', label: 'Have you ever had to turn away children because you did not have enough staff?', type: 'yesno' }
      ]}
    ]
  },

  /* ---------------- 6 ---------------- */
  {
    id: 'd6', num: '6', title: 'Fees charged to parents',
    groups: [
      { title: 'Fee levels', questions: [
        { id: 'fee_table', label: 'How much do parents pay for childcare?', type: 'matrix',
          rows: ['Per day', 'Per week', 'Per month'],
          rowLabel: 'Payment period',
          cols: [{ id: 'amount', label: 'Amount per child (@CUR)', type: 'currency' }] },
        { id: 'fee_period', label: 'Which payment method is most common?', type: 'select',
          options: ['Daily', 'Weekly', 'Monthly', 'Other'], required: true },
        { id: 'fee_period_other', label: 'Please specify', type: 'text', indent: true,
          when: a => a.fee_period === 'Other' },
        { id: 'fee_collection', label: 'How are fees collected?', type: 'select',
          options: ['Cash', 'Mobile money', 'Bank transfer', 'Mix'],
          labelFn: (a, c) => `How are fees collected? (mobile money = ${c.mobileMoney})` },
        { id: 'fee_varies_by_age', label: 'Do fees vary according to the child’s age?', type: 'yesno' },
        { id: 'meals_charged_separately', label: 'Are meals charged separately?', type: 'yesno' },
        { id: 'meal_charge', label: 'How much are meals charged?', type: 'currency', indent: true,
          when: a => a.meals_charged_separately === 'Yes' }
      ]},
      { title: 'Collection performance', questions: [
        { id: 'pay_on_time', label: 'How many parents normally pay on time?', type: 'select',
          options: ['90–100%', '75–89%', '50–74%', 'Below 50%'], required: true },
        { id: 'arrears_value', label: 'Approximately how much do parents currently owe the centre?', type: 'currency' },
        { id: 'payment_delay', label: 'What is the typical delay in payment?', type: 'select',
          options: ['No delay', 'Less than 1 week', '1–2 weeks', '2–4 weeks', '1–2 months', 'More than 2 months'] },
        { id: 'service_when_unpaid', label: 'Does the centre continue providing services when parents have not paid?', type: 'select',
          options: ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never'] }
      ]},
      { title: 'Parent livelihoods', questions: [
        { id: 'parent_livelihoods', label: 'What are the main livelihood or income-generating activities of the parents who bring their children to this daycare?', type: 'multiselect',
          options: ['Formal employment', 'Self employment / business', 'Casual or temporary work', 'Farming / agriculture', 'Student / trainee', 'Unemployed / not currently engaged in income-generating activities', 'I don’t know'] },
        { id: 'parents_rely_childcare', label: 'Do most parents (especially mothers) rely on this childcare to be able to work or run a business?', type: 'select',
          options: ['Yes, most', 'Some', 'Few', 'Unsure'],
          help: 'Women’s economic-participation impact lens.' }
      ]}
    ]
  },

  /* ---------------- 7 ---------------- */
  {
    id: 'd7', num: '7', title: 'Centre income',
    note: 'For a normal month.',
    groups: [
      { title: null, questions: [
        { id: 'income_table', label: 'Monthly income by source', type: 'matrix',
          rows: ['Childcare fees', 'Meals / food charges', 'Registration / admission fees', 'Donations', 'Government support', 'NGO support', 'Group contributions', 'Other income'],
          rowLabel: 'Income source',
          cols: [{ id: 'amount', label: 'Amount (@CUR / month)', type: 'currency' }],
          totalRow: 'TOTAL MONTHLY INCOME' },
        { id: 'income_highest_12m', label: 'What was the highest monthly income in the last 12 months?', type: 'currency' },
        { id: 'income_lowest_12m', label: 'What was the lowest monthly income?', type: 'currency' },
        { id: 'income_variance_reason', label: 'What caused the difference?', type: 'textarea' }
      ]}
    ]
  },

  /* ---------------- 8 ---------------- */
  {
    id: 'd8', num: '8', title: 'Centre expenses',
    groups: [
      { title: null, questions: [
        { id: 'expense_table', label: 'Monthly expenses', type: 'matrix',
          rows: ['Rent', 'Staff salaries / wages', 'Food', 'Water', 'Electricity', 'Fuel', 'Learning materials', 'Toys / play materials', 'Cleaning supplies', 'Transport', 'Repairs / maintenance', 'Licences / fees', 'Airtime / phone', 'Other'],
          rowLabel: 'Expense',
          cols: [{ id: 'amount', label: 'Amount (@CUR / month)', type: 'currency' }],
          totalRow: 'TOTAL MONTHLY EXPENSES' },
        { id: 'monthly_surplus', label: 'How much remains after all expenses in a normal month?', type: 'currency',
          computeHint: 'income_minus_expense' },
        { id: 'owner_subsidises', label: 'Does the owner ever use personal / household money to support the centre?', type: 'select',
          options: ['Regularly', 'Sometimes', 'Never'] },
        { id: 'centre_supports_household', label: 'Does the centre ever provide money to support the owner’s household?', type: 'select',
          options: ['Regularly', 'Sometimes', 'Never'] }
      ]}
    ]
  },

  /* ---------------- 9 ---------------- */
  {
    id: 'd9', num: '9', title: 'Financial records',
    groups: [
      { title: null, questions: [
        { id: 'records_income', label: 'Does the centre keep records of income?', type: 'yesno' },
        { id: 'records_expenses', label: 'Does it keep records of expenses?', type: 'yesno' },
        { id: 'records_children_fees', label: 'Does it keep records of children and fees?', type: 'yesno' },
        { id: 'records_how', label: 'How are records maintained?', type: 'multiselect',
          options: ['Exercise book', 'Receipt book', 'Mobile money statements', 'Bank statements', 'Computer', 'Other', 'No records'],
          optionsFn: (c) => ['Exercise book', 'Receipt book', `${c.mobileMoney} / mobile money statements`, 'Bank statements', 'Computer', 'Other', 'No records'] },
        { id: 'records_how_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.records_how || []).includes('Other') },
        { id: 'records_frequency', label: 'How frequently are records updated?', type: 'select',
          options: ['Daily', 'Weekly', 'Monthly', 'Irregularly', 'Never'] },
        { id: 'mobile_money_account', label: 'Does the centre have a separate business / mobile money account?', type: 'yesno',
          labelFn: (a, c) => `Does the centre have a separate business / mobile money account (${c.mobileMoney})?` },
        { id: 'bank_account', label: 'Does the centre have a separate bank account?', type: 'yesno' },
        { id: 'money_separation', label: 'Is centre money kept separately from household money?', type: 'select',
          options: ['Completely separate', 'Partly separate', 'Not separate'] }
      ]}
    ]
  },

  /* ---------------- 10 ---------------- */
  {
    id: 'd10', num: '10', title: 'Existing credit & borrowing',
    groups: [
      { title: null, questions: [
        { id: 'applied_before', label: 'Has the centre / owner / group ever taken a loan?', type: 'yesno', required: true },
        { id: 'loan_source', label: 'If yes, who provided the loan?', type: 'multiselect_country',
          optionsKey: 'lenderOptions', indent: true,
          when: a => a.applied_before === 'Yes' },
        { id: 'loan_source_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.loan_source || []).includes('Other') },
        { id: 'loans', label: 'Existing loans', type: 'repeat', indent: true,
          addLabel: 'Add a loan', itemLabel: 'Loan', max: 3,
          when: a => a.applied_before === 'Yes',
          fields: [
            { id: 'lender', label: 'Lender', type: 'text' },
            { id: 'original_amount', label: 'Original amount', type: 'currency' },
            { id: 'balance', label: 'Current balance', type: 'currency' },
            { id: 'instalment', label: 'Instalment', type: 'currency' },
            { id: 'frequency', label: 'Frequency', type: 'select', options: ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'Other'] },
            { id: 'start_date', label: 'Start date', type: 'date' },
            { id: 'completion_date', label: 'Completion date', type: 'date' },
            { id: 'purpose', label: 'Purpose', type: 'text' }
          ]},
        { id: 'missed_repayment', label: 'Have you ever missed a loan repayment?', type: 'select',
          options: ['Never', 'Once', 'Occasionally', 'Frequently'], indent: true,
          when: a => a.applied_before === 'Yes' },
        { id: 'missed_reason', label: 'If yes, what was the reason?', type: 'textarea', indent: true,
          when: a => a.missed_repayment && a.missed_repayment !== 'Never' },
        { id: 'fully_repaid', label: 'Have you ever fully repaid a loan?', type: 'yesno', indent: true,
          when: a => a.applied_before === 'Yes' },
        { id: 'no_loan_reason', label: 'If never borrowed, why not?', type: 'multiselect', indent: true,
          options: ['Not interested', 'Interest rates too high', 'Do not know where to go', 'Applied but rejected', 'No collateral', 'Religious / cultural reasons', 'Other'],
          when: a => a.applied_before === 'No' },
        { id: 'no_loan_reason_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.no_loan_reason || []).includes('Other') }
      ]}
    ]
  },

  /* ---------------- 11 ---------------- */
  {
    id: 'd11', num: '11', title: 'Financing interest — Jackfruit Finance',
    script: 'We would like to understand whether financing could help your centre improve or expand. These questions are intended to understand your financing needs and what level of repayment would be comfortable for the centre.',
    groups: [
      { title: null, questions: [
        { id: 'wants_loan', label: 'Would you consider financing for your centre?', type: 'select',
          options: ['Definitely yes', 'Probably yes', 'Not sure', 'Probably no', 'Definitely no'], required: true },
        { id: 'loan_purpose', label: 'What would you use financing for?', type: 'multiselect',
          options: ['Construction / renovation', 'Additional space', 'Furniture', 'Learning materials', 'Toys / play equipment', 'Food', 'Water / sanitation', 'Staff', 'Working capital', 'Rent', 'Equipment', 'Expansion', 'Other'],
          when: a => ['Definitely yes', 'Probably yes', 'Not sure'].includes(a.wants_loan) },
        { id: 'loan_purpose_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.loan_purpose || []).includes('Other') },
        { id: 'loan_size_wanted', label: 'Approximately how much financing would you need?', type: 'currency',
          when: a => ['Definitely yes', 'Probably yes', 'Not sure'].includes(a.wants_loan) },
        { id: 'loan_size_minimum', label: 'What is the minimum amount you would need to achieve your planned investment?', type: 'currency',
          when: a => ['Definitely yes', 'Probably yes', 'Not sure'].includes(a.wants_loan) },
        { id: 'loan_timing', label: 'When would you need the financing?', type: 'select',
          options: ['Immediately', 'Within 1 month', '1–3 months', '3–6 months', 'More than 6 months'],
          when: a => ['Definitely yes', 'Probably yes', 'Not sure'].includes(a.wants_loan) }
      ]}
    ]
  },

  /* ---------------- 12 ---------------- */
  {
    id: 'd12', num: '12', title: 'Loan repayment capacity',
    groups: [
      { title: null, questions: [
        { id: 'avg_monthly_income', label: 'Average monthly centre income', type: 'currency', carryFrom: 'income_table' },
        { id: 'avg_monthly_expenses', label: 'Average monthly centre expenses', type: 'currency', carryFrom: 'expense_table' },
        { id: 'avg_monthly_surplus', label: 'Average monthly surplus', type: 'currency', computeHint: 'income_minus_expense' },
        { id: 'repay_capacity_month', label: 'How much could you comfortably pay towards a loan each month?', type: 'currency', required: true },
        { id: 'repay_frequency_pref', label: 'What repayment frequency would you prefer?', type: 'select',
          options: ['Daily', 'Weekly', 'Biweekly', 'Monthly'] },
        { id: 'repay_difficult_amount', label: 'What monthly repayment would be difficult for you to manage?', type: 'currency' },
        { id: 'income_dips', label: 'Are there months when centre income falls significantly?', type: 'yesno' },
        { id: 'income_dip_months', label: 'Which months?', type: 'multiselect', optionsRef: 'MONTHS', indent: true,
          when: a => a.income_dips === 'Yes' },
        { id: 'low_month_strategy', label: 'How would you manage repayment during low-income months?', type: 'multiselect',
          options: ['Savings', 'Other business income', 'Household income', 'Group support', 'Reduce expenses', 'Other'] },
        { id: 'low_month_strategy_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.low_month_strategy || []).includes('Other') }
      ]}
    ]
  },

  /* ---------------- 13 ---------------- */
  {
    id: 'd13', num: '13', title: 'Owner / household financial position',
    note: 'For individual mama-run centres.',
    when: a => ['Individual woman / mama', 'Individual man'].includes(a.operator_type),
    groups: [
      { title: null, questions: [
        { id: 'owner_other_income', label: 'Does the owner have other sources of income?', type: 'yesno' },
        { id: 'owner_other_income_sources', label: 'What are the other sources?', type: 'textarea', indent: true,
          when: a => a.owner_other_income === 'Yes' },
        { id: 'owner_other_income_amount', label: 'Approximately how much does the owner earn from other activities per month?', type: 'currency', indent: true,
          when: a => a.owner_other_income === 'Yes' },
        { id: 'owner_income_supports_repayment', label: 'Could other income support loan repayment if centre income temporarily falls?', type: 'select',
          options: ['Yes', 'No', 'Partially'] },
        { id: 'owner_gender', label: 'Owner / proprietor gender', type: 'select',
          options: ['Female', 'Male', 'Prefer not to say'],
          help: 'Captured for the women-led lens.' }
      ]}
    ]
  },

  /* ---------------- 14 ---------------- */
  {
    id: 'd14', num: '14', title: 'Group-based centres',
    note: 'Only complete if operated by a women’s or community group.',
    when: a => ['Women’s group', 'Community group', 'NGO / CBO', 'Faith-based organization'].includes(a.operator_type),
    groups: [
      { title: null, questions: [
        { id: 'group_members', label: 'Number of active group members', type: 'integer' },
        { id: 'group_age', label: 'How long has the group existed? (years)', type: 'number' },
        { id: 'group_constitution', label: 'Does the group have a constitution?', type: 'yesno' },
        { id: 'group_bank_account', label: 'Does the group have a bank account?', type: 'yesno' },
        { id: 'group_mobile_money', label: 'Does it have a mobile money account?', type: 'yesno',
          labelFn: (a, c) => `Does it have a mobile money account (${c.mobileMoney})?` },
        { id: 'group_contribution', label: 'How much does each member contribute?', type: 'currency' },
        { id: 'group_contribution_freq', label: 'How frequently do members contribute?', type: 'select',
          options: ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Other'] },
        { id: 'group_borrowed_before', label: 'Has the group borrowed before?', type: 'yesno' },
        { id: 'group_defaulted', label: 'Has the group ever defaulted?', type: 'yesno' },
        { id: 'group_borrow_approval', label: 'Who approves borrowing?', type: 'text' },
        { id: 'group_guarantee', label: 'Would the group collectively guarantee a loan?', type: 'yesnounsure' },
        { id: 'savings_group_member', label: 'Is the group linked to a VSLA / savings group or chama?', type: 'yesno',
          labelFn: (a, c) => `Is the group linked to a ${c.savingsGroupTerm}?` }
      ]}
    ]
  },

  /* ---------------- 15 ---------------- */
  {
    id: 'd15', num: '15', title: 'Assets & security',
    groups: [
      { title: null, questions: [
        { id: 'has_assets', label: 'Does the centre / owner / group have assets?', type: 'yesno' },
        { id: 'asset_table', label: 'Assets', type: 'matrix', indent: true,
          rows: ['Land', 'Building', 'Furniture', 'Equipment', 'Vehicle', 'Other'],
          rowLabel: 'Asset',
          cols: [
            { id: 'has', label: 'Yes / No', type: 'yesno_cell' },
            { id: 'value', label: 'Estimated value (@CUR)', type: 'currency' }
          ],
          when: a => a.has_assets === 'Yes' },
        { id: 'willing_security', label: 'Would you be willing to provide security for financing?', type: 'select',
          options: ['Yes', 'No', 'Not sure'] },
        { id: 'security_types', label: 'What type of security might be available?', type: 'multiselect', indent: true,
          options: ['Land / title', 'Building', 'Equipment', 'Chattel', 'Savings', 'Group guarantee', 'Guarantor', 'Other'],
          when: a => a.willing_security !== 'No' },
        { id: 'security_types_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.security_types || []).includes('Other') }
      ]}
    ]
  },

  /* ---------------- 16 ---------------- */
  {
    id: 'd16', num: '16', title: 'Growth potential',
    groups: [
      { title: null, questions: [
        { id: 'additional_children', label: 'If financing were available, how many additional children could the centre accommodate?', type: 'integer', unitLabel: 'children' },
        { id: 'growth_requirements', label: 'What would you need to accommodate these additional children?', type: 'textarea' },
        { id: 'growth_investment_cost', label: 'How much would the required investment cost?', type: 'currency' },
        { id: 'additional_staff', label: 'How many additional staff would you need?', type: 'integer' },
        { id: 'additional_staff_cost', label: 'What would additional staff cost per month?', type: 'currency' },
        { id: 'additional_revenue', label: 'How much additional revenue could the centre generate from the additional children?', type: 'currency', unitLabel: 'per month' },
        { id: 'payback_time', label: 'How long would it take for the investment to start generating additional income?', type: 'select',
          options: ['Immediately', 'Less than 1 month', '1–3 months', '3–6 months', '6–12 months', 'More than 12 months'] }
      ]}
    ]
  },

  /* ---------------- 17 ---------------- */
  {
    id: 'd17', num: '17', title: 'Financing challenges & preferences',
    groups: [
      { title: null, questions: [
        { id: 'biggest_challenges', label: 'What are the biggest challenges facing the centre?', type: 'textarea', required: true },
        { id: 'support_type_useful', label: 'What type of financial support would be most useful?', type: 'multiselect',
          options: ['Loan', 'Grant', 'Savings', 'Equipment financing', 'Working capital', 'Training', 'Business management support', 'Other'] },
        { id: 'support_type_other', label: 'Please specify', type: 'text', indent: true,
          when: a => (a.support_type_useful || []).includes('Other') },
        { id: 'loan_concerns', label: 'What concerns would you have about taking a loan?', type: 'textarea' },
        { id: 'comfort_borrowing', label: 'What would make you comfortable borrowing?', type: 'textarea' },
        { id: 'borrowing_blockers', label: 'What would prevent you from taking a loan?', type: 'textarea' },
        { id: 'trusted_financier', label: 'Who would you trust to provide financing to your centre?', type: 'textarea' }
      ]}
    ]
  },

  /* ---------------- 18 ---------------- */
  {
    id: 'd18', num: '18', title: 'Enumerator assessment',
    note: 'Completed by the enumerator after the interview, not by the respondent.',
    enumeratorOnly: true,
    groups: [
      { title: null, questions: [
        { id: 'ea_operational', label: 'Centre appears operational', type: 'yesno' },
        { id: 'ea_children_verified', label: 'Number of children verified / observed', type: 'integer' },
        { id: 'ea_records_seen', label: 'Records seen', type: 'yesno' },
        { id: 'ea_records_credible', label: 'Financial records credible', type: 'select', options: ['High', 'Medium', 'Low'] },
        { id: 'ea_viable', label: 'Centre appears financially viable', type: 'select', options: ['Yes', 'No', 'Unclear'] },
        { id: 'ea_fees_collected', label: 'Fees appear regularly collected', type: 'select', options: ['Yes', 'No', 'Unclear'] },
        { id: 'ea_debt_burden', label: 'Existing debt burden', type: 'select', options: ['Low', 'Medium', 'High'] },
        { id: 'ea_management', label: 'Management quality', type: 'select', options: ['Good', 'Average', 'Weak'] },
        { id: 'ea_growth_potential', label: 'Growth potential', type: 'select', options: ['High', 'Medium', 'Low'] },
        { id: 'ea_financing_interest', label: 'Financing interest', type: 'select', options: ['High', 'Medium', 'Low'] },
        { id: 'ea_ability_to_repay', label: 'Ability to repay', type: 'select', options: ['High', 'Medium', 'Low'] },
        { id: 'ea_security_available', label: 'Security / guarantee available', type: 'select', options: ['Yes', 'No', 'Unclear'] },
        { id: 'ea_overall_potential', label: 'Overall financing potential', type: 'select', options: ['High', 'Medium', 'Low'], required: true },
        { id: 'ea_comments', label: 'Enumerator comments', type: 'textarea' },
        { id: 'obs_photos', label: 'Photographs (fee schedule / premises)', type: 'photo', multiple: true }
      ]}
    ]
  },

  /* ---------------- 19: deep dive ---------------- */
  {
    id: 'd19', num: '19', title: 'Deep-dive financials — Phase 2',
    phase: 2,
    note: 'Phase 2 — complete if the centre is shortlisted on creditworthiness or is interested in a loan. Skippable at screening.',
    groups: [
      { title: 'Historic revenue & enrolment', questions: [
        { id: 'dd_rev_2026', label: 'Revenue so far in 2026', type: 'currency' },
        { id: 'dd_rev_2025', label: 'Annual revenue in 2025', type: 'currency' },
        { id: 'dd_rev_2024', label: 'Annual revenue in 2024', type: 'currency' },
        { id: 'dd_enrol_2025', label: '# children enrolled in 2025', type: 'integer' },
        { id: 'dd_enrol_2024', label: '# children enrolled in 2024', type: 'integer' }
      ]},
      { title: 'Annual cost base (2025, as available)', questions: [
        { id: 'dd_cost_total', label: 'Total costs 2025', type: 'currency' },
        { id: 'dd_cost_salaries', label: 'Salaries', type: 'currency', indent: true },
        { id: 'dd_cost_rent', label: 'Rent', type: 'currency', indent: true },
        { id: 'dd_cost_food', label: 'Food / feeding', type: 'currency', indent: true },
        { id: 'dd_cost_materials', label: 'Learning materials & supplies', type: 'currency', indent: true },
        { id: 'dd_cost_utilities', label: 'Utilities', type: 'currency', indent: true },
        { id: 'dd_cost_maintenance', label: 'Maintenance', type: 'currency', indent: true }
      ]}
    ]
  }
]};
