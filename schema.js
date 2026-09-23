/* =====================================================================
   Jackfruit × Open Capital — ECD & Childcare Centre Survey · schema
   ---------------------------------------------------------------------
   Data-driven definition of both questionnaires (ECD centre and
   Daycare / home-based). The form engine (app.js) renders these and
   applies the skip logic.

   Question types:
     text        single line free text
     textarea    multi-line free text
     integer     whole number
     number      decimal number
     phone       phone / WhatsApp number
     percent     0–100 with % suffix (set allowUnknown:true to add Unknown)
     date        date (Day/Month/Year). Add monthOnly:true for Month/Year only.
     select      choose one (options[]); add other:true for "Other (specify)"
     multiselect choose many (options[]); add other:true for "Other (specify)"
     yesno       Yes / No buttons
     yesnounsure Yes / No / Unsure buttons
     photo       camera / file capture
     geo         GPS coordinates (auto-captured, refreshable)
     repeat      repeating sub-form, countField drives number of instances

   unit:"MONEY"  renders the enumerator's currency (KES or UGX)
   help          text shown behind a tappable ⓘ "explanation bubble"
   half          render two fields side by side on one line
   noflags       suppress the Refused / Doesn't know chips
   dropdown      render a select as a native dropdown (long option lists)

   Country-dependent option lists and labels resolve at render time from
   the enumerator's country — see COUNTRY in app.js. Use:
     optionsKey:"curriculumOptions"   country-specific option list
     label:"@adminL1Label"            country-specific label
   ===================================================================== */

/* ---------------------------------------------------------------- */
/* Enumerators — the name chosen on the first screen sets the country */
/* ---------------------------------------------------------------- */
const ENUMERATORS = [
  { name: "Hassan Iya Halakhe",   region: "N Kenya", country: "KE" },
  { name: "Michael Irungu Mwaura", region: "Kampala", country: "UG" },
  { name: "Micheal Jalle",         region: "N Kenya", country: "KE" },
  { name: "Lynda Kaino",           region: "N Kenya", country: "KE" },
];

/* ---------------------------------------------------------------- */
/* Country packs                                                     */
/* ---------------------------------------------------------------- */
const COUNTRIES = {
  KE: {
    code: "KE", name: "Kenya", currency: "KES",
    adminL1Label: "County", adminL2Label: "Sub-county",
    adminL3Label: "Ward", adminL4Label: "Village / location",
    mobileMoney: "M-Pesa", phonePrefix: "+254", phoneHint: "e.g. 0712 345 678",
    taxIdLabel: "Kenya Revenue Authority (KRA) PIN", taxIdHint: "e.g. A012345678Z",
    savingsGroupTerm: "chama / table-banking group",
    adminL1: ["Isiolo","Samburu","Marsabit","Turkana","Wajir","Garissa","Mandera"],
    curriculumOptions: [
      "CBC pre-primary (Kenya)","Kenya ECDE syllabus","Montessori",
      "Faith-based curriculum","Own / informal",
    ],
    registrationOptions: [
      "County government (Kenya)","Ministry of Education / DCS (Kenya)",
      "Sub-county education office","NGO / CBO registration (Social Services)",
      "Not registered",
    ],
    lenderOptions: [
      "Bank","SACCO","Microfinance institution","FinTech / digital lender",
      "Chama / VSLA / women's group","Mobile money loan (M-Shwari, Fuliza, KCB M-Pesa)",
      "NGO","Family / friends","Supplier / trade credit",
      "Personal loan used for the business",
    ],
    settlements: [
      "Not in a settlement","Kakuma refugee camp","Kalobeyei integrated settlement",
      "Dadaab (Hagadera / Ifo / Dagahaley)","Host community adjacent to a settlement",
    ],
    geo: {
      "Isiolo": {
        "Isiolo North (Isiolo)": ["Wabera","Bulla Pesa","Burat","Ngare Mara","Oldonyiro","Chari","Cherab"],
        "Isiolo South (Garbatulla)": ["Garbatulla","Kinna","Sericho"],
        "Merti": ["Chari","Cherab"],
      },
      "Samburu": {
        "Samburu West": ["Lodokejek","Suguta Marmar","Maralal","Loosuk","Poro"],
        "Samburu North": ["El-Barta","Nachola","Ndoto","Nyiro","Angata Nanyokie","Baawa"],
        "Samburu East": ["Waso","Wamba West","Wamba East","Wamba North"],
      },
      "Marsabit": {
        "Saku": ["Sagante/Jaldesa","Karare","Marsabit Central"],
        "North Horr": ["Dukana","Maikona","Turbi","North Horr","Illeret"],
        "Laisamis": ["Loiyangalani","Kargi/South Horr","Korr/Ngurunit","Log Logo","Laisamis"],
        "Moyale": ["Butiye","Sololo","Heillu/Manyatta","Golbo","Moyale Township","Uran","Obbu"],
      },
      "Turkana": {
        "Turkana West": ["Kakuma","Letea","Songot","Kalobeyei","Lokichoggio","Nanaam","Lopur"],
        "Turkana Central": ["Kerio Delta","Kang'atotha","Kalokol","Lodwar Township","Kanamkemer"],
        "Turkana South": ["Kaputir","Katilu","Lobokat","Kalapata","Lokichar"],
      },
    },
  },
  UG: {
    code: "UG", name: "Uganda", currency: "UGX",
    adminL1Label: "District", adminL2Label: "Division / sub-county",
    adminL3Label: "Parish / ward", adminL4Label: "Village / zone (LC1)",
    mobileMoney: "MTN MoMo / Airtel Money", phonePrefix: "+256", phoneHint: "e.g. 0772 123 456",
    taxIdLabel: "URA Tax Identification Number (TIN)", taxIdHint: "10-digit URA TIN",
    savingsGroupTerm: "VSLA / savings group",
    adminL1: ["Kampala","Wakiso","Mukono","Isingiro","Yumbe","Adjumani","Kyegegwa"],
    curriculumOptions: [
      "Uganda ECD Learning Framework","NCDC pre-primary curriculum (Uganda)","Montessori",
      "Faith-based curriculum","Own / informal",
    ],
    registrationOptions: [
      "Ministry of Education & Sports (Uganda)","District Education Office",
      "KCCA (Kampala Capital City Authority)",
      "Office of the Prime Minister / settlement authority (Uganda)",
      "NGO Bureau / community development office","Not registered",
    ],
    lenderOptions: [
      "Bank","SACCO","Microfinance institution (MDI)","FinTech / digital lender",
      "VSLA / chama / women's group","Mobile money loan (MoKash, Wewole, Airtel)",
      "NGO","Family / friends","Supplier / trade credit",
      "Personal loan used for the business",
    ],
    settlements: [
      "Not in a settlement","Urban refugee (Kampala)","Nakivale","Kyaka II","Kyangwali",
      "Rwamwanja","Bidi Bidi","Palorinya","Rhino Camp","Imvepi","Adjumani settlements",
      "Oruchinga","Palabek","Kiryandongo","Host community adjacent to a settlement",
    ],
    geo: {
      "Kampala": {
        "Central Division": ["Bukesa","Civic Centre","Industrial Area","Kagugube","Kamwokya II","Kisenyi I","Kisenyi II","Kisenyi III","Kololo I","Kololo II","Kololo III","Kololo IV","Mengo","Nakasero I","Nakasero II","Nakasero III","Nakasero IV","Nakivubo/Shauriyako","Old Kampala"],
        "Kawempe Division": ["Bwaise I","Bwaise II","Bwaise III","Kanyanya","Kawempe I","Kawempe II","Kazo","Kikaya","Komamboga","Kyebando","Makerere III","Mpererwe","Mulago I","Mulago II","Mulago III","Wandegeya"],
        "Makindye Division": ["Bukasa","Buziga","Ggaba","Kansanga","Katwe I","Katwe II","Kibuye I","Kibuye II","Kisugu","Luwafu","Makindye I","Makindye II","Nsambya Central","Nsambya Estates","Salaama","Wabigalo"],
        "Nakawa Division": ["Bugolobi","Bukoto I","Bukoto II","Butabika","Kiswa","Kitintale","Kyanja","Luzira","Mbuya I","Mbuya II","Mutungo","Naguru I","Naguru II","Nakawa","Ntinda"],
        "Rubaga Division": ["Busega","Kasubi","Kikoni (Makerere I)","Makerere II","Lubya","Lungujja","Mutundwe","Naakulabye","Namirembe","Ndeeba","Nateete","Rubaga","Kabowa"],
      },
      "Wakiso": {
        "Nansana Municipality": ["Nansana","Gombe","Busukuma","Nabweru"],
        "Kira Municipality": ["Kira","Bweyogerere","Namugongo"],
        "Makindye-Ssabagabo": ["Ndejje","Bunamwaya","Masajja"],
      },
      "Isingiro": { "Nakivale settlement area": ["Base camp","Juru","Rubondo"] },
      "Yumbe": { "Bidi Bidi settlement area": ["Zone 1","Zone 2","Zone 3","Zone 4","Zone 5"] },
      "Adjumani": { "Adjumani settlements": ["Nyumanzi","Pagirinya","Maaji","Mungula"] },
      "Kyegegwa": { "Kyaka II settlement area": ["Bukere","Byabakora","Sweswe"] },
    },
  },
};

/* ---------------------------------------------------------------- */
/* Centre types and branch routing                                   */
/* ---------------------------------------------------------------- */
const CENTRE_TYPES = [
  "Standalone ECD / daycare centre",
  "Nursery / pre-primary (standalone)",
  "Pre-primary attached to a primary school",
  "Home-based childcare",
  "Community / faith-based ECD centre",
];
/* These two run the daycare & home-based questionnaire. */
const DAYCARE_TYPES = ["Standalone ECD / daycare centre", "Home-based childcare"];
const ATTACHED_TYPE = "Pre-primary attached to a primary school";

/* ---------------------------------------------------------------- */
/* Shared option lists                                               */
/* ---------------------------------------------------------------- */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const PAY_WINDOWS = ["<30 days","30–60 days","60–90 days","90–180 days","180+ days"];
const SETTING = ["Inside refugee settlement","Host community adjacent to settlement","Urban informal settlement","Peri-urban","Urban residential","Rural"];
const LOW_INCOME = ["<25%","25–50%","50–75%","75%+"];
const LOW_INCOME_HELP = "'Low income' = households that would struggle to pay fees without support, or that would qualify for a subsidised place.";
const COSTS_HELP = "'Costs' = operating expenses, excluding depreciation & amortisation, interest and tax.";
const OOP_HELP = "Fees paid directly by parents, as opposed to government capitation or donor funding.";
const CENTRE_CONDITION = ["Well maintained, professional appearance","Some disrepair / maintenance concerns","Poor condition"];
const AREA_TYPE = ["Refugee settlement","Host community","Rural","Peri-urban","Informal urban settlement","Urban residential","Mixed-income urban"];
const NO_LOAN_REASONS = ["Not interested","Interest rates too high","Do not know where to go","Applied but rejected","No collateral"];
const LOAN_USES = ["Renovation / construction","Build or expand premises","Land purchase","Learning materials & equipment","Playground / outdoor equipment","WASH improvements","Furniture","Working capital / cash flow","Staff hiring or training","Solar / utilities","Vehicle"];
const INVEST_IN = ["Facility expansion / renovation","Learning materials & equipment","Playground / outdoor equipment","WASH improvements","Staff training or hiring","Digital tools"];
const FINANCE_OPTS = ["Retained profits / savings","Loan","VSLA / savings group","Unsure"];

/* repeating loan sub-form — daycare sheet's own columns */
const DAYCARE_LOAN_ITEM = [
  { id:"loan_lender", label:"Lender", type:"text" },
  { id:"loan_original_amount", label:"Original amount", type:"integer", unit:"MONEY" },
  { id:"loan_current_balance", label:"Current balance", type:"integer", unit:"MONEY" },
  { id:"loan_instalment", label:"Instalment", type:"integer", unit:"MONEY" },
  { id:"loan_frequency", label:"Frequency", type:"select",
    options:["Daily","Weekly","Biweekly","Monthly","Quarterly"] },
  { id:"loan_start_date", label:"Start date", type:"date", monthOnly:true },
  { id:"loan_completion_date", label:"Completion date", type:"date", monthOnly:true },
  { id:"loan_purpose", label:"Purpose", type:"text" },
];

/* repeating "outstanding loan" sub-form — ECD sheet's own columns */
const OUTSTANDING_LOAN_ITEM = [
  { id:"loan_type", label:"What type of loan is this?", type:"select", optionsKey:"lenderOptions" },
  { id:"loan_provider", label:"Who provided the loan?", type:"text" },
  { id:"loan_original_value", label:"Original value of the loan", type:"integer", unit:"MONEY" },
  { id:"loan_interest", label:"Interest rate you are paying", type:"percent" },
  { id:"loan_monthly_repayment", label:"Monthly repayment", type:"integer", unit:"MONEY" },
  { id:"loan_remaining", label:"How much is left to repay?", type:"integer", unit:"MONEY" },
];

/* =====================================================================
   SECTION 0 — common to every centre
   ===================================================================== */
const SECTION_0 = {
  section: "Section 0 · Basic information",
  groups: [
    { title: "Centre identification", questions: [
      { id:"centre_name", label:"Centre name", type:"text", required:true, noflags:true,
        placeholder:"Enter the centre's name" },
      { id:"centre_type", label:"Centre type", type:"select", required:true, other:true, noflags:true,
        options:CENTRE_TYPES,
        help:"Standalone ECD / daycare and home-based childcare use the daycare questionnaire. Everything else uses the ECD centre questionnaire." },
      { id:"year_opened", label:"Year the centre opened", type:"integer", placeholder:"e.g. 2016", half:true },
      { id:"years_operating", label:"How many years have you been in operation?", type:"number" },
      { id:"religious_affiliation", label:"Religious affiliation of centre (if any)", type:"text" },
      { id:"ownership_type", label:"Ownership type", type:"select", other:true,
        options:["Privately owned business","Faith-based organisation","Community-based organisation","NGO","Home-based / individual"] },
      { id:"owner_gender", label:"Owner / proprietor gender", type:"select",
        options:["Female","Male","Prefer not to say"],
        help:"Captured for the women-led / women's economic-participation lens." },
      { id:"owner_is_lead", label:"Is the owner also the lead caregiver / head of the centre?", type:"yesno" },
    ]},
    { title: "Interviewee", questions: [
      { id:"interviewee_name", label:"Interviewee name", type:"text" },
      { id:"interviewee_role", label:"Interviewee role", type:"select", other:true,
        options:["Owner / proprietor","Head teacher / centre manager","Lead caregiver","Administrator"] },
    ]},
    { title: "Location", questions: [
      { id:"admin_l1", label:"@adminL1Label", type:"select", dropdown:true, other:true, optionsKey:"adminL1" },
      { id:"admin_l2", label:"@adminL2Label", type:"select", dropdown:true, other:true, cascade:"l2" },
      { id:"admin_l3", label:"@adminL3Label", type:"select", dropdown:true, other:true, cascade:"l3" },
      { id:"admin_l4", label:"@adminL4Label", type:"text" },
      { id:"settlement", label:"Refugee settlement / camp (if applicable)", type:"select", dropdown:true, other:true, optionsKey:"settlements" },
      { id:"setting", label:"Setting", type:"select", options:SETTING },
    ]},
    { title: "Attached primary school", note:"Only for a pre-primary unit inside a primary school. Financials for the unit and for the whole school are collected separately later.", questions: [
      { id:"school_name", label:"Name of the primary school the ECD unit sits within", type:"text",
        showIf:{ field:"centre_type", eq:ATTACHED_TYPE } },
      { id:"school_total_enrolment", label:"Total enrolment of the whole school (all grades)", type:"integer",
        showIf:{ field:"centre_type", eq:ATTACHED_TYPE } },
      { id:"school_ownership", label:"Who owns / manages the primary school?", type:"select", other:true,
        options:["Same owner as the ECD unit","Government / public school","Private proprietor","Faith-based organisation","Community / CBO","NGO"],
        showIf:{ field:"centre_type", eq:ATTACHED_TYPE } },
      { id:"ecd_separate_accounts", label:"Are the ECD unit's fees and accounts kept separately from the school's?", type:"select",
        options:["Completely separate","Partly separate","Not separate — one set of accounts"],
        showIf:{ field:"centre_type", eq:ATTACHED_TYPE } },
      { id:"ecd_own_budget", label:"Does the ECD unit have its own budget?", type:"yesno",
        showIf:{ field:"centre_type", eq:ATTACHED_TYPE } },
      { id:"ecd_share_of_school_rev", label:"Approximate share of total school revenue from the ECD unit", type:"percent", allowUnknown:true,
        showIf:{ field:"centre_type", eq:ATTACHED_TYPE } },
      { id:"ecd_subsidised_by_school", label:"Does the wider school subsidise the ECD unit, or the other way round?", type:"select",
        options:["School subsidises the ECD unit","ECD unit subsidises the school","Neither — each covers its own costs","Unsure"],
        showIf:{ field:"centre_type", eq:ATTACHED_TYPE } },
    ]},
  ]
};

/* shared: contact details, recorded with the enumerator observations */
const CONTACT_OBS = [
  { id:"centre_phone", label:"Centre phone number or WhatsApp", type:"phone" },
  { id:"owner_email", label:"Owner email", type:"text", inputType:"email", half:true },
  { id:"centre_email", label:"Centre email", type:"text", inputType:"email", half:true },
  { id:"physical_address", label:"Physical address", type:"textarea" },
];

/* =====================================================================
   ECD CENTRE QUESTIONNAIRE
   (nursery / pre-primary, attached pre-primary, community / faith-based)
   ===================================================================== */
const ECD_SECTIONS = [
  {
    section: "Section I · Enrolment, age groups & fees",
    groups: [
      { title:"Age groups & operating model", questions:[
        { id:"age_groups", label:"Age groups served (select all)", type:"multiselect",
          options:["0–2 (infants)","2–3 (toddlers)","3–5 (pre-primary)","6+ (school-age / after-school)"] },
        { id:"operating_model", label:"Operating model", type:"select",
          options:["Full-day daycare","Half-day pre-primary","Both full-day and half-day","After-school care only"] },
        { id:"days_open_week", label:"Days open per week", type:"integer", half:true },
        { id:"hours_open_day", label:"Hours open per day", type:"integer", half:true },
        { id:"months_open_year", label:"Months open per year", type:"integer",
          help:"Captures whether the centre runs by term or year-round." },
      ]},
      { title:"Enrolment & attendance", questions:[
        { id:"enrol_total", label:"Current total enrolment (# children)", type:"integer" },
        { id:"enrol_0_2", label:"# children aged 0–2", type:"integer", half:true,
          showIf:{ field:"age_groups", contains:"0–2 (infants)" } },
        { id:"enrol_2_3", label:"# children aged 2–3", type:"integer", half:true,
          showIf:{ field:"age_groups", contains:"2–3 (toddlers)" } },
        { id:"enrol_3_5", label:"# children aged 3–5", type:"integer", half:true,
          showIf:{ field:"age_groups", contains:"3–5 (pre-primary)" } },
        { id:"enrol_6p", label:"# children aged 6+", type:"integer", half:true,
          showIf:{ field:"age_groups", contains:"6+ (school-age / after-school)" } },
        { id:"max_capacity", label:"Maximum capacity (# children)", type:"integer", half:true },
        { id:"waiting_list", label:"# children on the waiting list", type:"integer", half:true },
        { id:"avg_daily_attendance", label:"Average daily attendance (# children)", type:"integer" },
        { id:"attendance_recorded", label:"How often is child attendance recorded?", type:"select",
          options:["Daily","Periodic","Not recorded"] },
      ]},
      { title:"Enrolment trend", questions:[
        { id:"enrol_this_year", label:"Enrolment this year", type:"integer", half:true },
        { id:"enrol_last_year", label:"Enrolment last year", type:"integer", half:true },
        { id:"enrol_two_years_ago", label:"Enrolment two years ago", type:"integer", half:true },
      ]},
      { title:"Who the centre serves", questions:[
        { id:"pct_girls", label:"Approximate gender split", unit:"% girls", type:"percent", allowUnknown:true },
        { id:"pct_refugee", label:"Approximate proportion who are refugees (vs host community)", type:"percent", allowUnknown:true,
          help:"Refugee-hosting impact lens." },
        { id:"pct_low_income", label:"Approximate proportion from low-income households", type:"select",
          options:LOW_INCOME, help:LOW_INCOME_HELP },
      ]},
      { title:"Fees", questions:[
        { id:"fee_period", label:"How are fees charged?", type:"select",
          options:["Per day","Per week","Per month","Per term","No fees / free"] },
        { id:"fee_amount", label:"Typical fee per child", type:"integer", unit:"MONEY",
          help:"For the period selected above.",
          showIf:{ field:"fee_period", ne:"No fees / free" } },
        { id:"fee_collection", label:"How are fees collected?", type:"select",
          options:["Cash","Mobile money","Bank transfer","Mix"],
          showIf:{ field:"fee_period", ne:"No fees / free" } },
        { id:"fee_flexibility", label:"Do you offer instalments, credit to parents or scholarships?", type:"select",
          options:["No","Instalments","Scholarships / subsidised places","Both"] },
        { id:"fee_collected_pct", label:"Approximately what proportion of fees are actually collected?", type:"percent", allowUnknown:true,
          showIf:{ field:"fee_period", ne:"No fees / free" } },
      ]},
      { title:"Transport & meals", questions:[
        { id:"provides_transport", label:"Do you provide transport to children?", type:"yesno", half:true },
        { id:"provides_meals", label:"Do you provide meals / feeding?", type:"yesno", half:true },
        { id:"meals_per_day", label:"# meals provided per day", type:"integer",
          showIf:{ field:"provides_meals", eq:"Yes" } },
      ]},
    ]
  },

  {
    section: "Section II · Early learning & child development",
    note: "Optional at screening — can be completed at deep dive.",
    groups: [
      { title:"Curriculum & practice", questions:[
        { id:"has_curriculum", label:"Do you follow a curriculum or early-learning framework?", type:"yesno" },
        { id:"curriculum_which", label:"Which framework?", type:"select", other:true, optionsKey:"curriculumOptions",
          showIf:{ field:"has_curriculum", eq:"Yes" } },
        { id:"lesson_plans", label:"Do caregivers use lesson plans or a structured daily routine?", type:"yesno" },
        { id:"learning_materials", label:"Learning & play materials available (select all)", type:"multiselect",
          options:["Age-appropriate books","Learning aids / charts","Toys & manipulatives","Outdoor play equipment","Art / craft materials","None"] },
      ]},
      { title:"Child development & school readiness", questions:[
        { id:"tracks_milestones", label:"Do you assess or track children's developmental milestones?", type:"yesno" },
        { id:"progress_records", label:"How are records of children's progress kept?", type:"select",
          options:["Paper records","Spreadsheet","Management system","Not recorded"],
          showIf:{ field:"tracks_milestones", eq:"Yes" } },
        { id:"pct_transition_primary", label:"Approximate % of children who transition to primary school", type:"percent", allowUnknown:true,
          help:"Pre-primary centres. Leave blank if not applicable." },
      ]},
      { title:"Environment for young children", questions:[
        { id:"learning_play_space", label:"Is there a dedicated indoor learning area and an outdoor play space?", type:"select",
          options:["Both","Indoor only","Outdoor only","Neither"] },
        { id:"nap_area", label:"Is there a nap / rest area for younger children?", type:"yesno" },
        { id:"caregiver_ratio", label:"Approximate caregiver-to-child ratio", type:"integer",
          unit:"children per caregiver" },
      ]},
    ]
  },

  {
    section: "Section III · Facilities, WASH & safeguarding",
    groups: [
      { title:"Premises & building", questions:[
        { id:"num_classrooms", label:"# learning rooms / classrooms", type:"integer", half:true },
        { id:"capacity_per_room", label:"Average capacity per room", type:"integer", half:true },
        { id:"wall_construction", label:"Wall construction (select all)", type:"multiselect",
          options:["Concrete","Cinderblock","Brick","Mabati (iron sheets)","Mud / wattle","Wood"] },
        { id:"floor_construction", label:"Floor construction (select all)", type:"multiselect",
          options:["Concrete","Tile","Dirt"] },
        { id:"premises_tenure", label:"Are the premises owned or leased?", type:"select", options:["Owned","Leased"] },
        { id:"lease_expiry", label:"When does the current lease expire?", type:"date", monthOnly:true,
          showIf:{ field:"premises_tenure", eq:"Leased" } },
        { id:"monthly_rent", label:"Monthly rent", type:"integer", unit:"MONEY",
          showIf:{ field:"premises_tenure", eq:"Leased" } },
      ]},
      { title:"Water, sanitation & power", questions:[
        { id:"running_water", label:"Running water on site?", type:"yesno", half:true },
        { id:"safe_drinking_water", label:"Safe / treated drinking water?", type:"yesno", half:true },
        { id:"handwashing", label:"Handwashing stations available?", type:"yesno", half:true },
        { id:"child_toilets", label:"Child-friendly toilets available?", type:"yesno", half:true },
        { id:"num_toilets", label:"# toilets", type:"integer" },
        { id:"electricity", label:"Electricity connected?", type:"yesno" },
        { id:"electricity_source", label:"Main source of electricity", type:"select",
          options:["Grid","Solar","Generator","None"],
          showIf:{ field:"electricity", eq:"Yes" } },
        { id:"kitchen_area", label:"Dedicated kitchen / food-preparation area?", type:"yesno",
          showIf:{ field:"provides_meals", eq:"Yes" } },
      ]},
      { title:"Child safeguarding", questions:[
        { id:"safeguarding_policy", label:"Is there a written child safeguarding / protection policy?", type:"yesno" },
        { id:"safeguarding_practices", label:"Safeguarding practices in place (select all)", type:"multiselect", other:true,
          options:["Caregiver background vetting","Child-protection / safeguarding training","No corporal punishment","Designated child-protection focal point","First-aid-trained staff","Secure / enclosed compound","Zero tolerance for abuse or bullying"] },
      ]},
    ]
  },

  {
    section: "Section IV · Staff",
    groups: [
      { title:"Staffing", questions:[
        { id:"staff_total", label:"# staff in total", type:"integer" },
        { id:"staff_trained_ecd", label:"# trained ECD caregivers / teachers", type:"integer", half:true },
        { id:"staff_ecde_qualified", label:"# with an ECDE certificate / diploma", type:"integer", half:true },
        { id:"staff_support", label:"# support staff (cook, cleaner, security)", type:"integer" },
        { id:"payroll_monthly", label:"Average monthly payroll cost", type:"integer", unit:"MONEY" },
      ]},
      { title:"Development & performance", questions:[
        { id:"staff_training_freq", label:"How many times per year do staff attend training / CPD?", type:"integer" },
        { id:"staff_me", label:"Do you monitor and evaluate caregiver performance?", type:"yesno", half:true },
        { id:"staff_incentives", label:"Do staff receive rewards or incentives?", type:"yesno", half:true },
      ]},
    ]
  },

  {
    section: "Section V · Financial profile",
    note: "Record the ECD / pre-primary unit only — whole-school figures come next.",
    groups: [
      { title:"Revenue", questions:[
        { id:"monthly_revenue", label:"Average monthly revenue", type:"integer", unit:"MONEY" },
        { id:"revenue_seasonal", label:"Does revenue vary by term or season?", type:"yesno" },
        { id:"revenue_peak_trough", label:"Briefly list the peak and trough months", type:"textarea",
          showIf:{ field:"revenue_seasonal", eq:"Yes" } },
        { id:"rev_pct_fees", label:"Revenue from: parent fees", type:"percent", help:OOP_HELP },
        { id:"rev_pct_government", label:"Revenue from: government subsidy / capitation", type:"percent" },
        { id:"rev_pct_donor", label:"Revenue from: donor / grant funding", type:"percent" },
        { id:"rev_pct_other", label:"Revenue from: other", type:"percent" },
      ]},
      { title:"Collection", questions:[
        { id:"collection_days", label:"On average, how long does it take to collect fees?", type:"select", options:PAY_WINDOWS },
        { id:"arrears", label:"Do you have parent fee arrears outstanding?", type:"yesno" },
        { id:"arrears_value", label:"Approximate value of fee arrears outstanding", type:"integer", unit:"MONEY",
          showIf:{ field:"arrears", eq:"Yes" } },
      ]},
      { title:"Financial management", questions:[
        { id:"digital_tools", label:"Do you use digital tools to manage the centre?", type:"yesno" },
        { id:"digital_tools_use", label:"What are these digital tools used for?", type:"multiselect", other:true,
          options:["Back-office processes","Payments","Learning / records"],
          showIf:{ field:"digital_tools", eq:"Yes" } },
        { id:"bank_account", label:"Does the centre have a dedicated bank account?", type:"yesno" },
        { id:"accounts_tracking", label:"How do you track management accounts and financials?", type:"select", other:true,
          options:["Accounting software","Spreadsheet / Excel","Written records","No formal records"] },
        { id:"mobile_money", label:"Do you use mobile money for fees or payments?", type:"yesno" },
      ]},
      { title:"Supplies", questions:[
        { id:"supply_shortages", label:"How often do you run short of essential supplies?", type:"select",
          options:["Frequently","Occasionally","Rarely","Never"],
          help:"Food, learning materials and other consumables." },
        { id:"supplier_credit", label:"Do you pay suppliers cash upfront, or do they give you credit?", type:"select",
          options:["Cash only","Mix of cash and credit","Mostly credit"] },
      ]},
    ]
  },

  {
    section: "Section V-B · Financial profile — whole school",
    note: "The same questions for the ENTIRE school, all grades, including the ECD unit.",
    showIf: { field:"centre_type", eq:ATTACHED_TYPE },
    groups: [
      { title:"Revenue — whole school", questions:[
        { id:"sch_monthly_revenue", label:"Average monthly revenue — whole school", type:"integer", unit:"MONEY" },
        { id:"sch_revenue_seasonal", label:"Does school revenue vary by term or season?", type:"yesno" },
        { id:"sch_revenue_peak_trough", label:"Briefly list the peak and trough months", type:"textarea",
          showIf:{ field:"sch_revenue_seasonal", eq:"Yes" } },
        { id:"sch_rev_pct_fees", label:"School revenue from: parent fees", type:"percent" },
        { id:"sch_rev_pct_government", label:"School revenue from: government subsidy / capitation", type:"percent" },
        { id:"sch_rev_pct_donor", label:"School revenue from: donor / grant funding", type:"percent" },
        { id:"sch_rev_pct_other", label:"School revenue from: other", type:"percent" },
      ]},
      { title:"Collection & scale — whole school", questions:[
        { id:"sch_collection_days", label:"How long does it take the school to collect fees?", type:"select", options:PAY_WINDOWS },
        { id:"sch_arrears", label:"Does the school have fee arrears outstanding?", type:"yesno" },
        { id:"sch_arrears_value", label:"Approximate value of school fee arrears", type:"integer", unit:"MONEY",
          showIf:{ field:"sch_arrears", eq:"Yes" } },
        { id:"sch_fee_per_term", label:"Typical fee per child per term — primary grades", type:"integer", unit:"MONEY" },
        { id:"sch_staff_total", label:"# staff in total — whole school", type:"integer", half:true },
        { id:"sch_payroll_monthly", label:"Monthly payroll — whole school", type:"integer", unit:"MONEY", half:true },
        { id:"sch_bank_account", label:"Does the school have its own bank account, separate from the ECD unit's?", type:"yesno" },
      ]},
    ]
  },

  {
    section: "Section VI · Loans, savings groups & financing demand",
    groups: [
      { title:"Experience with loans", questions:[
        { id:"applied_before", label:"Have you ever applied for a loan before?", type:"yesno" },
        { id:"no_loan_reason", label:"Why have you not taken out a loan?", type:"multiselect", other:true,
          options:NO_LOAN_REASONS, showIf:{ field:"applied_before", eq:"No" } },
        { id:"loan_outcome", label:"What was the outcome?", type:"select",
          options:["Approved & taken","Approved but declined","Rejected","Application in progress"],
          showIf:{ field:"applied_before", eq:"Yes" } },
        { id:"loan_source", label:"Who did you source the loan from?", type:"select", other:true, optionsKey:"lenderOptions",
          showIf:{ field:"applied_before", eq:"Yes" } },
        { id:"loan_rejection_reason", label:"If rejected, what reason were you given?", type:"textarea",
          showIf:{ field:"loan_outcome", eq:"Rejected" } },
        { id:"loan_interest_rate", label:"What interest rate did you pay, or are you paying?", type:"percent", allowUnknown:true,
          showIf:{ field:"applied_before", eq:"Yes" } },
      ]},
      { title:"Savings groups & women's economic participation", questions:[
        { id:"savings_group_member", label:"Is the owner or the centre a member of a savings group?", type:"yesno" },
        { id:"savings_group_role", label:"Do savings groups help finance the centre or parents' fees? Briefly describe.", type:"textarea",
          showIf:{ field:"savings_group_member", eq:"Yes" } },
        { id:"parents_rely_childcare", label:"Do most parents rely on this childcare to be able to work?", type:"select",
          options:["Yes, most","Some","Few","Unsure"],
          help:"Women's economic-participation impact lens — mothers in particular." },
      ]},
      { title:"Demand for financing", questions:[
        { id:"wants_loan", label:"Are you interested in taking out a new loan?", type:"yesno" },
        { id:"loan_use", label:"What would you use the loan for? (select top 1–3)", type:"multiselect", other:true, maxSelect:3,
          options:LOAN_USES, showIf:{ field:"wants_loan", eq:"Yes" } },
        { id:"loan_size_wanted", label:"What loan size would you be looking for?", type:"integer", unit:"MONEY",
          showIf:{ field:"wants_loan", eq:"Yes" } },
        { id:"repay_capacity_month", label:"Approximately how much could you repay per month?", type:"integer", unit:"MONEY",
          showIf:{ field:"wants_loan", eq:"Yes" } },
      ]},
      { title:"Collateral", note:"Only asked where there is interest in a loan.", questions:[
        { id:"coll_land", label:"Land or lease", type:"yesnounsure", showIf:{ field:"wants_loan", eq:"Yes" } },
        { id:"coll_equipment", label:"Equipment / furniture", type:"yesnounsure", showIf:{ field:"wants_loan", eq:"Yes" } },
        { id:"coll_vehicle", label:"Vehicle", type:"yesnounsure", showIf:{ field:"wants_loan", eq:"Yes" } },
        { id:"coll_personal_guarantee", label:"Personal guarantee from the owner / director", type:"yesnounsure", showIf:{ field:"wants_loan", eq:"Yes" } },
        { id:"coll_group_guarantee", label:"Group / joint guarantee (e.g. via a savings group)", type:"yesnounsure",
          help:"Relevant for partner-led / group lending, especially in Uganda.",
          showIf:{ field:"wants_loan", eq:"Yes" } },
      ]},
      { title:"Investment plans", questions:[
        { id:"plans_investment", label:"Are you planning any investments to grow or improve the centre in the next 12 months?", type:"yesno" },
        { id:"investment_areas", label:"What are you planning to invest in?", type:"multiselect", other:true,
          options:INVEST_IN, showIf:{ field:"plans_investment", eq:"Yes" } },
        { id:"investment_goal", label:"What is the main goal of this investment?", type:"select", other:true,
          options:["Enrol more children / expand capacity","Improve learning quality","Improve safety / facilities","Reduce costs or improve efficiency"],
          showIf:{ field:"plans_investment", eq:"Yes" } },
        { id:"investment_cost", label:"How much do you expect this investment to cost?", type:"integer", unit:"MONEY",
          showIf:{ field:"plans_investment", eq:"Yes" } },
        { id:"investment_finance", label:"How are you planning on financing this investment?", type:"select", other:true,
          options:FINANCE_OPTS, showIf:{ field:"plans_investment", eq:"Yes" } },
      ]},
    ]
  },

  {
    section: "Section VII · Registration & compliance",
    groups: [
      { title:"Registration information", questions:[
        { id:"is_registered", label:"Is the centre registered?", type:"yesno" },
        { id:"registered_with", label:"Registered with (select all)", type:"multiselect", other:true, optionsKey:"registrationOptions",
          showIf:{ field:"is_registered", eq:"Yes" } },
        { id:"registration_number", label:"Registration / permit number", type:"text" },
        { id:"permit_expiry", label:"Business permit expiry date", type:"date", monthOnly:true },
        { id:"tax_id", label:"@taxIdLabel", type:"text" },
        { id:"ecd_licence", label:"Is the required ECD operating licence held?", type:"select",
          options:["Yes, current licence","No, pending renewal","No","Unsure"] },
      ]},
    ]
  },

  {
    section: "Section VIII · Deep-dive financials",
    note: "Phase 2 — for centres shortlisted on creditworthiness or interested in a loan. Skippable at screening.",
    groups: [
      { title:"Historic revenue & enrolment", questions:[
        { id:"dd_rev_2026", label:"Revenue so far in 2026", type:"integer", unit:"MONEY" },
        { id:"dd_rev_2025", label:"Annual revenue in 2025", type:"integer", unit:"MONEY", half:true },
        { id:"dd_rev_2024", label:"Annual revenue in 2024", type:"integer", unit:"MONEY", half:true },
        { id:"dd_enrol_2025", label:"# children enrolled in 2025", type:"integer", half:true },
        { id:"dd_enrol_2024", label:"# children enrolled in 2024", type:"integer", half:true },
      ]},
      { title:"2025 cost breakdown (as available)", note:COSTS_HELP, questions:[
        { id:"cost_total", label:"Total costs", type:"integer", unit:"MONEY", help:COSTS_HELP },
        { id:"cost_salaries", label:"Salaries", type:"integer", unit:"MONEY", half:true },
        { id:"cost_rent", label:"Rent", type:"integer", unit:"MONEY", half:true },
        { id:"cost_food", label:"Food / feeding", type:"integer", unit:"MONEY", half:true },
        { id:"cost_materials", label:"Learning materials & supplies", type:"integer", unit:"MONEY", half:true },
        { id:"cost_utilities", label:"Utilities", type:"integer", unit:"MONEY", half:true },
        { id:"cost_maintenance", label:"Maintenance", type:"integer", unit:"MONEY", half:true },
      ]},
      { title:"Assets", questions:[
        { id:"asset_premises", label:"Purchase value of premises", type:"integer", unit:"MONEY", half:true },
        { id:"asset_furniture", label:"Purchase value of furniture & equipment", type:"integer", unit:"MONEY", half:true },
        { id:"asset_play", label:"Purchase value of play equipment", type:"integer", unit:"MONEY", half:true },
        { id:"asset_vehicles", label:"Purchase value of vehicles", type:"integer", unit:"MONEY", half:true },
      ]},
      { title:"Outstanding obligations", questions:[
        { id:"outstanding_loans", label:"Do you have any outstanding loans or financial obligations?", type:"yesno" },
        { id:"num_outstanding_loans", label:"How many outstanding loans or obligations?", type:"integer",
          showIf:{ field:"outstanding_loans", eq:"Yes" } },
        { id:"outstanding_loan_list", label:"Details for each outstanding loan", type:"repeat",
          countField:"num_outstanding_loans", item:OUTSTANDING_LOAN_ITEM,
          showIf:{ field:"outstanding_loans", eq:"Yes" } },
      ]},
    ]
  },

  {
    section: "Section VIII-B · Deep-dive financials — whole school",
    note: "The same deep dive for the ENTIRE school, all grades.",
    showIf: { field:"centre_type", eq:ATTACHED_TYPE },
    groups: [
      { title:"Historic revenue — whole school", questions:[
        { id:"sdd_rev_2026", label:"School revenue so far in 2026", type:"integer", unit:"MONEY" },
        { id:"sdd_rev_2025", label:"School annual revenue in 2025", type:"integer", unit:"MONEY", half:true },
        { id:"sdd_rev_2024", label:"School annual revenue in 2024", type:"integer", unit:"MONEY", half:true },
        { id:"sdd_enrol_2025", label:"School enrolment in 2025", type:"integer", half:true },
        { id:"sdd_enrol_2024", label:"School enrolment in 2024", type:"integer", half:true },
      ]},
      { title:"2025 cost base — whole school", questions:[
        { id:"sdd_cost_total", label:"Total costs — whole school", type:"integer", unit:"MONEY", help:COSTS_HELP },
        { id:"sdd_cost_salaries", label:"Salaries", type:"integer", unit:"MONEY", half:true },
        { id:"sdd_cost_rent", label:"Rent", type:"integer", unit:"MONEY", half:true },
        { id:"sdd_cost_food", label:"Food / feeding", type:"integer", unit:"MONEY", half:true },
        { id:"sdd_cost_other", label:"Other operating costs", type:"integer", unit:"MONEY", half:true },
      ]},
      { title:"Whole-school obligations", questions:[
        { id:"sch_outstanding_loans", label:"Does the school have outstanding loans or obligations?", type:"yesno" },
        { id:"sch_num_outstanding_loans", label:"How many?", type:"integer",
          showIf:{ field:"sch_outstanding_loans", eq:"Yes" } },
        { id:"sch_outstanding_loan_list", label:"Details for each school loan", type:"repeat",
          countField:"sch_num_outstanding_loans", item:OUTSTANDING_LOAN_ITEM,
          showIf:{ field:"sch_outstanding_loans", eq:"Yes" } },
      ]},
    ]
  },

  {
    section: "Section IX · Enumerator observations",
    note: "Completed by the enumerator. Not shared with the centre.",
    groups: [
      { title:"Contact details", questions: CONTACT_OBS },
      { title:"Enumerator observations", questions:[
        { id:"obs_admin_l1", label:"@adminL1Label", type:"select", dropdown:true, optionsKey:"adminL1" },
        { id:"obs_geocoordinates", label:"Geocoordinates", type:"geo" },
        { id:"obs_centre_condition", label:"Centre condition", type:"select", options:CENTRE_CONDITION },
        { id:"obs_activity", label:"Children present / activity observed", type:"select",
          options:["Busy — many children & activity","Moderate","Quiet","Empty"] },
        { id:"obs_interaction", label:"Quality of caregiver–child interaction observed", type:"select",
          options:["Warm & engaged","Adequate","Minimal / none"] },
        { id:"obs_safety", label:"Safety of the environment observed", type:"select",
          options:["Safe & secure","Some concerns","Unsafe"] },
        { id:"obs_owner_financial_knowledge", label:"Owner's knowledge of their financial figures", type:"select",
          options:["Clearly knew or could check numbers","Reasonable estimates","Vague or unclear"] },
        { id:"obs_area", label:"Area where the centre is located", type:"select", options:AREA_TYPE },
        { id:"obs_red_flags", label:"Any concerns or red flags not captured elsewhere", type:"textarea" },
        { id:"obs_premises_photo", label:"Photograph of premises", type:"photo",
          help:"Tap again to add more than one photo." },
      ]},
    ]
  },

];

/* =====================================================================
   DAYCARE & HOME-BASED CARE QUESTIONNAIRE
   (centre type = Standalone ECD / daycare centre, or Home-based childcare)
   ===================================================================== */
const DAYCARE_SECTIONS = [
  {
    section: "Section 1 · Centre ownership & structure",
    groups: [
      { title:"Ownership", questions:[
        { id:"dc_centre_type", label:"What type of centre is this?", type:"select", other:true,
          options:["Home-based childcare","School-based daycare","Community-based centre"] },
        { id:"operator_type", label:"Who operates or owns the centre?", type:"select", other:true,
          options:["Individual woman / mama","Individual man","Women's group","Community group","NGO / CBO","Faith-based organization","Private organization / company"] },
        { id:"dc_years_operating", label:"How long has the centre been operating? (years)", type:"number" },
      ]},
      { title:"Registration & premises", questions:[
        { id:"dc_is_registered", label:"Is the centre registered?", type:"select",
          options:["Yes","No","Application in progress","Don't know"] },
        { id:"dc_registered_with", label:"If registered, with which authority?", type:"multiselect", other:true, optionsKey:"registrationOptions",
          showIf:{ field:"dc_is_registered", in:["Yes","Application in progress"] } },
        { id:"premises_owner", label:"Who owns the premises?", type:"select", other:true,
          options:["Owner","Rented","Community-owned","Group-owned","Organization-owned"] },
        { id:"dc_monthly_rent", label:"If rented, what is the monthly rent?", type:"integer", unit:"MONEY",
          showIf:{ field:"premises_owner", eq:"Rented" } },
        { id:"operates_independently", label:"Does the centre operate independently, or with support from another organization or group?", type:"select",
          options:["Operates fully independently","Receives support from an organization","Receives support from a group","Part of a larger organization"] },
      ]},
    ]
  },

  {
    section: "Section 2 · Children served",
    groups: [
      { title:"Enrolment by age", note:"Record boys and girls for each age band.", questions:[
        { id:"enrol_u1_boys", label:"Under 1 year — boys", type:"integer", half:true },
        { id:"enrol_u1_girls", label:"Under 1 year — girls", type:"integer", half:true },
        { id:"enrol_1_boys", label:"1 year — boys", type:"integer", half:true },
        { id:"enrol_1_girls", label:"1 year — girls", type:"integer", half:true },
        { id:"enrol_2_boys", label:"2 years — boys", type:"integer", half:true },
        { id:"enrol_2_girls", label:"2 years — girls", type:"integer", half:true },
        { id:"enrol_3_boys", label:"3 years — boys", type:"integer", half:true },
        { id:"enrol_3_girls", label:"3 years — girls", type:"integer", half:true },
        { id:"enrol_4_boys", label:"4 years — boys", type:"integer", half:true },
        { id:"enrol_4_girls", label:"4 years — girls", type:"integer", half:true },
        { id:"enrol_5_boys", label:"5 years — boys", type:"integer", half:true },
        { id:"enrol_5_girls", label:"5 years — girls", type:"integer", half:true },
      ]},
      { title:"Totals & attendance", questions:[
        { id:"enrol_total", label:"How many children are enrolled in total?", type:"integer" },
        { id:"avg_daily_attendance", label:"On an average day, how many children actually attend?", type:"integer" },
        { id:"peak_children", label:"Highest number of children cared for at one time?", type:"integer" },
        { id:"pct_refugee", label:"Approximate proportion who are refugees (vs host community)", type:"percent", allowUnknown:true },
      ]},
      { title:"Turnover", questions:[
        { id:"new_per_month", label:"How many new children join in an average month?", type:"integer", half:true },
        { id:"leave_per_month", label:"How many children leave in an average month?", type:"integer", half:true },
        { id:"why_leave", label:"Why do children leave? (select all)", type:"multiselect", other:true,
          options:["Start school","Parents cannot afford fees","Family relocation","Move to another centre","Centre capacity"] },
      ]},
    ]
  },

  {
    section: "Section 3 · Services & daily operations",
    groups: [
      { title:"Services", questions:[
        { id:"services", label:"What services does the centre provide? (select all)", type:"multiselect", other:true,
          options:["Daycare / childcare","Early learning / ECD","Meals","Snacks","Sleeping / rest","Diaper changing","Hygiene / bathing","Outdoor play","Learning materials","Health monitoring"] },
      ]},
      { title:"Opening hours", questions:[
        { id:"open_time", label:"What time does the centre open?", type:"text", placeholder:"e.g. 6:30am", half:true },
        { id:"close_time", label:"What time does it close?", type:"text", placeholder:"e.g. 6:00pm", half:true },
        { id:"days_operating", label:"Which days of the week does it operate?", type:"multiselect", options:WEEKDAYS },
        { id:"year_round", label:"Does it operate throughout the year?", type:"yesno" },
        { id:"dc_months_open_year", label:"If not, how many months per year?", type:"integer",
          showIf:{ field:"year_round", eq:"No" } },
      ]},
      { title:"Seasonality", questions:[
        { id:"busiest_days", label:"Which days are busiest?", type:"multiselect", options:WEEKDAYS },
        { id:"busiest_months", label:"Which months are busiest?", type:"multiselect", options:MONTHS },
        { id:"slowest_days", label:"Which days are slowest?", type:"multiselect", options:WEEKDAYS },
        { id:"slowest_months", label:"Which months are slowest?", type:"multiselect", options:MONTHS },
      ]},
      { title:"Constraints", questions:[
        { id:"growth_constraints", label:"What prevents the centre from serving more children? (select all)", type:"multiselect", other:true,
          options:["Space","Staff","Money","Food","Water","Learning materials","Parent affordability","Registration / licensing"] },
      ]},
    ]
  },

  {
    section: "Section 4 · Staffing",
    groups: [
      { title:"Who works here", questions:[
        { id:"staff_total", label:"How many people work at the centre?", type:"integer" },
        { id:"staff_caregivers", label:"# caregivers", type:"integer", half:true },
        { id:"staff_caregivers_pay", label:"Caregivers — paid per month (each)", type:"integer", unit:"MONEY", half:true },
        { id:"staff_teachers", label:"# teachers", type:"integer", half:true },
        { id:"staff_teachers_pay", label:"Teachers — paid per month (each)", type:"integer", unit:"MONEY", half:true },
        { id:"staff_cook", label:"# cooks", type:"integer", half:true },
        { id:"staff_cook_pay", label:"Cook — paid per month", type:"integer", unit:"MONEY", half:true },
        { id:"staff_cleaner", label:"# cleaners", type:"integer", half:true },
        { id:"staff_cleaner_pay", label:"Cleaner — paid per month", type:"integer", unit:"MONEY", half:true },
        { id:"staff_ecde_qualified", label:"# staff with an ECDE certificate / diploma", type:"integer" },
      ]},
      { title:"Pay & ratios", questions:[
        { id:"pay_frequency", label:"How often are staff paid?", type:"select", other:true,
          options:["Daily","Weekly","Monthly"] },
        { id:"caregiver_ratio", label:"How many children does one caregiver typically supervise?", type:"integer",
          unit:"children per caregiver" },
        { id:"turned_away_staff", label:"Have you ever turned children away for lack of staff?", type:"yesno" },
      ]},
    ]
  },

  {
    section: "Section 5 · Fees charged to parents",
    groups: [
      { title:"Fee levels", questions:[
        { id:"fee_per_day", label:"Fee per child — per day", type:"integer", unit:"MONEY", half:true },
        { id:"fee_per_week", label:"Fee per child — per week", type:"integer", unit:"MONEY", half:true },
        { id:"fee_per_month", label:"Fee per child — per month", type:"integer", unit:"MONEY", half:true },
        { id:"fee_period", label:"Which payment period is most common?", type:"select", other:true,
          options:["Daily","Weekly","Monthly"] },
        { id:"fee_collection", label:"How are fees collected?", type:"select",
          options:["Cash","Mobile money","Bank transfer","Mix"] },
        { id:"fee_varies_by_age", label:"Do fees vary by the child's age?", type:"yesno", half:true },
        { id:"meals_charged_separately", label:"Are meals charged separately?", type:"yesno", half:true },
        { id:"meal_charge", label:"How much are meals charged?", type:"integer", unit:"MONEY",
          showIf:{ field:"meals_charged_separately", eq:"Yes" } },
      ]},
      { title:"Collection performance", questions:[
        { id:"pay_on_time", label:"How many parents normally pay on time?", type:"select",
          options:["90–100%","75–89%","50–74%","Below 50%"] },
        { id:"arrears_value", label:"Approximately how much do parents currently owe the centre?", type:"integer", unit:"MONEY" },
        { id:"payment_delay", label:"What is the typical delay in payment?", type:"select",
          options:["No delay","Less than 1 week","1–2 weeks","2–4 weeks","1–2 months","More than 2 months"] },
        { id:"service_when_unpaid", label:"Do you keep providing care when parents have not paid?", type:"select",
          options:["Always","Usually","Sometimes","Rarely","Never"] },
      ]},
      { title:"Parent livelihoods", questions:[
        { id:"parent_livelihoods", label:"Main livelihoods of the parents who use this daycare (select all)", type:"multiselect",
          options:["Formal employment","Self employment / business","Casual or temporary work","Farming / agriculture","Student / trainee","Unemployed / not currently earning","I don't know"] },
        { id:"parents_rely_childcare", label:"Do most parents rely on this childcare to be able to work?", type:"select",
          options:["Yes, most","Some","Few","Unsure"],
          help:"Women's economic-participation impact lens — mothers in particular." },
      ]},
    ]
  },

  {
    section: "Section 6 · Centre income",
    note: "For a normal month.",
    groups: [
      { title:"Monthly income by source", questions:[
        { id:"inc_childcare_fees", label:"Childcare fees", type:"integer", unit:"MONEY", half:true },
        { id:"inc_meals", label:"Meals / food charges", type:"integer", unit:"MONEY", half:true },
        { id:"inc_registration", label:"Registration / admission fees", type:"integer", unit:"MONEY", half:true },
        { id:"inc_donations", label:"Donations", type:"integer", unit:"MONEY", half:true },
        { id:"inc_government", label:"Government support", type:"integer", unit:"MONEY", half:true },
        { id:"inc_ngo", label:"NGO support", type:"integer", unit:"MONEY", half:true },
        { id:"inc_group", label:"Group contributions", type:"integer", unit:"MONEY", half:true },
        { id:"inc_other", label:"Other income", type:"integer", unit:"MONEY", half:true },
        { id:"inc_total", label:"TOTAL monthly income", type:"integer", unit:"MONEY" },
      ]},
      { title:"Variability", questions:[
        { id:"income_highest_12m", label:"Highest monthly income in the last 12 months", type:"integer", unit:"MONEY", half:true },
        { id:"income_lowest_12m", label:"Lowest monthly income", type:"integer", unit:"MONEY", half:true },
        { id:"income_variance_reason", label:"What caused the difference?", type:"textarea" },
      ]},
    ]
  },

  {
    section: "Section 7 · Centre expenses",
    groups: [
      { title:"Monthly expenses", questions:[
        { id:"exp_rent", label:"Rent", type:"integer", unit:"MONEY", half:true },
        { id:"exp_salaries", label:"Staff salaries / wages", type:"integer", unit:"MONEY", half:true },
        { id:"exp_food", label:"Food", type:"integer", unit:"MONEY", half:true },
        { id:"exp_water", label:"Water", type:"integer", unit:"MONEY", half:true },
        { id:"exp_electricity", label:"Electricity", type:"integer", unit:"MONEY", half:true },
        { id:"exp_fuel", label:"Fuel", type:"integer", unit:"MONEY", half:true },
        { id:"exp_learning", label:"Learning materials", type:"integer", unit:"MONEY", half:true },
        { id:"exp_toys", label:"Toys / play materials", type:"integer", unit:"MONEY", half:true },
        { id:"exp_cleaning", label:"Cleaning supplies", type:"integer", unit:"MONEY", half:true },
        { id:"exp_transport", label:"Transport", type:"integer", unit:"MONEY", half:true },
        { id:"exp_repairs", label:"Repairs / maintenance", type:"integer", unit:"MONEY", half:true },
        { id:"exp_licences", label:"Licences / fees", type:"integer", unit:"MONEY", half:true },
        { id:"exp_airtime", label:"Airtime / phone", type:"integer", unit:"MONEY", half:true },
        { id:"exp_other", label:"Other", type:"integer", unit:"MONEY", half:true },
        { id:"exp_total", label:"TOTAL monthly expenses", type:"integer", unit:"MONEY" },
      ]},
      { title:"Surplus & household", questions:[
        { id:"monthly_surplus", label:"How much remains after all expenses in a normal month?", type:"integer", unit:"MONEY" },
        { id:"owner_subsidises", label:"Does the owner ever use household money to support the centre?", type:"select",
          options:["Regularly","Sometimes","Never"] },
        { id:"centre_supports_household", label:"Does the centre ever provide money to the owner's household?", type:"select",
          options:["Regularly","Sometimes","Never"] },
      ]},
    ]
  },

  {
    section: "Section 8 · Financial records",
    groups: [
      { title:"Record keeping", questions:[
        { id:"records_income", label:"Does the centre keep records of income?", type:"yesno", half:true },
        { id:"records_expenses", label:"Does it keep records of expenses?", type:"yesno", half:true },
        { id:"records_children_fees", label:"Does it keep records of children and fees?", type:"yesno" },
        { id:"records_how", label:"How are records maintained? (select all)", type:"multiselect", other:true,
          options:["Exercise book","Receipt book","Mobile money statements","Bank statements","Computer","No records"] },
        { id:"records_frequency", label:"How frequently are records updated?", type:"select",
          options:["Daily","Weekly","Monthly","Irregularly","Never"] },
      ]},
      { title:"Separation of money", questions:[
        { id:"mobile_money_account", label:"Is there a separate business mobile money account?", type:"yesno" },
        { id:"bank_account", label:"Is there a separate bank account?", type:"yesno" },
        { id:"money_separation", label:"Is centre money kept separately from household money?", type:"select",
          options:["Completely separate","Partly separate","Not separate"] },
      ]},
    ]
  },

  {
    section: "Section 9 · Existing credit & borrowing",
    groups: [
      { title:"Experience with loans", questions:[
        { id:"applied_before", label:"Has the centre, owner or group ever taken a loan?", type:"yesno" },
        { id:"loan_source", label:"If yes, who provided the loan? (select all)", type:"multiselect", other:true, optionsKey:"lenderOptions",
          showIf:{ field:"applied_before", eq:"Yes" } },
        { id:"outstanding_loans", label:"Are any of those loans still outstanding?", type:"yesno",
          showIf:{ field:"applied_before", eq:"Yes" } },
        { id:"num_outstanding_loans", label:"How many outstanding loans?", type:"integer",
          showIf:{ field:"outstanding_loans", eq:"Yes" } },
        { id:"outstanding_loan_list", label:"Existing loans", type:"repeat",
          countField:"num_outstanding_loans", item:DAYCARE_LOAN_ITEM, max:3,
          showIf:{ field:"outstanding_loans", eq:"Yes" } },
        { id:"missed_repayment", label:"Have you ever missed a loan repayment?", type:"select",
          options:["Never","Once","Occasionally","Frequently"],
          showIf:{ field:"applied_before", eq:"Yes" } },
        { id:"missed_reason", label:"If yes, what was the reason?", type:"textarea",
          showIf:{ field:"missed_repayment", ne:"Never" } },
        { id:"fully_repaid", label:"Have you ever fully repaid a loan?", type:"yesno",
          showIf:{ field:"applied_before", eq:"Yes" } },
        { id:"no_loan_reason", label:"If never borrowed, why not? (select all)", type:"multiselect", other:true,
          options:["Not interested","Interest rates too high","Do not know where to go","Applied but rejected","No collateral","Religious / principle reasons"],
          showIf:{ field:"applied_before", eq:"No" } },
      ]},
    ]
  },

  {
    section: "Section 10 · Financing interest",
    note: "Read the introduction aloud before asking these questions.",
    script: "We would like to understand whether financing could help your centre improve or expand. These questions are to understand your financing needs and what level of repayment would be comfortable for the centre.",
    groups: [
      { title:"Interest in financing", questions:[
        { id:"wants_loan", label:"Would you consider financing for your centre?", type:"select",
          options:["Definitely yes","Probably yes","Not sure","Probably no","Definitely no"] },
        { id:"loan_use", label:"What would you use financing for? (select all)", type:"multiselect", other:true,
          options:["Construction / renovation","Additional space","Furniture","Learning materials","Toys / play equipment","Food","Water / sanitation","Staff","Working capital","Rent","Equipment","Expansion"],
          showIf:{ field:"wants_loan", in:["Definitely yes","Probably yes","Not sure"] } },
        { id:"loan_size_wanted", label:"Approximately how much financing would you need?", type:"integer", unit:"MONEY",
          showIf:{ field:"wants_loan", in:["Definitely yes","Probably yes","Not sure"] } },
        { id:"loan_size_minimum", label:"What is the minimum amount you would need to achieve your planned investment?", type:"integer", unit:"MONEY",
          showIf:{ field:"wants_loan", in:["Definitely yes","Probably yes","Not sure"] } },
        { id:"loan_timing", label:"When would you need the financing?", type:"select",
          options:["Immediately","Within 1 month","1–3 months","3–6 months","More than 6 months"],
          showIf:{ field:"wants_loan", in:["Definitely yes","Probably yes","Not sure"] } },
      ]},
    ]
  },

  {
    section: "Section 11 · Repayment capacity",
    groups: [
      { title:"What the centre could afford", questions:[
        { id:"repay_capacity_month", label:"How much could you comfortably repay each month?", type:"integer", unit:"MONEY" },
        { id:"repay_frequency_pref", label:"What repayment frequency would you prefer?", type:"select",
          options:["Daily","Weekly","Biweekly","Monthly"] },
        { id:"repay_difficult_amount", label:"What monthly repayment would be difficult to manage?", type:"integer", unit:"MONEY" },
      ]},
      { title:"Low-income months", questions:[
        { id:"income_dips", label:"Are there months when income falls significantly?", type:"yesno" },
        { id:"income_dip_months", label:"Which months?", type:"multiselect", options:MONTHS,
          showIf:{ field:"income_dips", eq:"Yes" } },
        { id:"low_month_strategy", label:"How would you manage repayment in those months? (select all)", type:"multiselect", other:true,
          options:["Savings","Other business income","Household income","Group support","Reduce expenses"] },
      ]},
    ]
  },

  {
    section: "Section 12 · Owner & household",
    note: "For individually-run centres.",
    showIf: { field:"operator_type", in:["Individual woman / mama","Individual man"] },
    groups: [
      { title:"Owner's other income", questions:[
        { id:"owner_other_income", label:"Does the owner have other sources of income?", type:"yesno" },
        { id:"owner_other_income_sources", label:"What are the other sources?", type:"textarea",
          showIf:{ field:"owner_other_income", eq:"Yes" } },
        { id:"owner_other_income_amount", label:"Approximately how much per month from other activities?", type:"integer", unit:"MONEY",
          showIf:{ field:"owner_other_income", eq:"Yes" } },
        { id:"owner_income_supports_repayment", label:"Could other income cover repayment if centre income dipped?", type:"select",
          options:["Yes","No","Partially"] },
      ]},
    ]
  },

  {
    section: "Section 13 · Group-based centres",
    note: "Only for centres run by a women's or community group.",
    showIf: { field:"operator_type", in:["Women's group","Community group","NGO / CBO","Faith-based organization"] },
    groups: [
      { title:"The group", questions:[
        { id:"group_members", label:"Number of active group members", type:"integer", half:true },
        { id:"group_age", label:"How long has the group existed? (years)", type:"number", half:true },
        { id:"group_constitution", label:"Does the group have a constitution?", type:"yesno", half:true },
        { id:"group_bank_account", label:"Does the group have a bank account?", type:"yesno", half:true },
        { id:"group_mobile_money", label:"Does it have a mobile money account?", type:"yesno" },
      ]},
      { title:"Contributions & borrowing", questions:[
        { id:"group_contribution", label:"How much does each member contribute?", type:"integer", unit:"MONEY", half:true },
        { id:"group_contribution_freq", label:"How often do members contribute?", type:"select", other:true,
          options:["Daily","Weekly","Biweekly","Monthly"], half:true },
        { id:"group_borrowed_before", label:"Has the group borrowed before?", type:"yesno", half:true },
        { id:"group_defaulted", label:"Has the group ever defaulted?", type:"yesno", half:true },
        { id:"group_borrow_approval", label:"Who approves borrowing?", type:"text" },
        { id:"group_guarantee", label:"Would the group collectively guarantee a loan?", type:"yesnounsure" },
      ]},
    ]
  },

  {
    section: "Section 14 · Assets & security",
    groups: [
      { title:"Assets", questions:[
        { id:"has_assets", label:"Does the centre, owner or group have assets?", type:"yesno" },
        { id:"asset_land", label:"Land — estimated value", type:"integer", unit:"MONEY", half:true,
          showIf:{ field:"has_assets", eq:"Yes" } },
        { id:"asset_building", label:"Building — estimated value", type:"integer", unit:"MONEY", half:true,
          showIf:{ field:"has_assets", eq:"Yes" } },
        { id:"asset_furniture", label:"Furniture — estimated value", type:"integer", unit:"MONEY", half:true,
          showIf:{ field:"has_assets", eq:"Yes" } },
        { id:"asset_equipment", label:"Equipment — estimated value", type:"integer", unit:"MONEY", half:true,
          showIf:{ field:"has_assets", eq:"Yes" } },
        { id:"asset_vehicle", label:"Vehicle — estimated value", type:"integer", unit:"MONEY", half:true,
          showIf:{ field:"has_assets", eq:"Yes" } },
        { id:"asset_other", label:"Other assets — estimated value", type:"integer", unit:"MONEY", half:true,
          showIf:{ field:"has_assets", eq:"Yes" } },
      ]},
      { title:"Security for financing", questions:[
        { id:"willing_security", label:"Would you be willing to provide security for financing?", type:"select",
          options:["Yes","No","Not sure"] },
        { id:"security_types", label:"What type of security might be available? (select all)", type:"multiselect", other:true,
          options:["Land / title","Building","Equipment","Chattel","Savings","Group guarantee","Guarantor"],
          showIf:{ field:"willing_security", ne:"No" } },
      ]},
    ]
  },

  {
    section: "Section 15 · Growth potential",
    groups: [
      { title:"If financing were available", questions:[
        { id:"additional_children", label:"How many additional children could the centre accommodate?", type:"integer",
          unit:"children" },
        { id:"growth_requirements", label:"What would you need to accommodate them?", type:"textarea" },
        { id:"growth_investment_cost", label:"How much would that investment cost?", type:"integer", unit:"MONEY" },
        { id:"additional_staff", label:"How many additional staff would you need?", type:"integer", half:true },
        { id:"additional_staff_cost", label:"Additional staff cost per month", type:"integer", unit:"MONEY", half:true },
        { id:"additional_revenue", label:"Additional monthly revenue from those children", type:"integer", unit:"MONEY" },
        { id:"payback_time", label:"How long would it take for the investment to start generating additional income?", type:"select",
          options:["Immediately","Less than 1 month","1–3 months","3–6 months","6–12 months","More than 12 months"] },
      ]},
    ]
  },

  {
    section: "Section 16 · Challenges & preferences",
    groups: [
      { title:"Challenges", questions:[
        { id:"biggest_challenges", label:"What are the biggest challenges facing the centre?", type:"textarea" },
        { id:"support_type_useful", label:"What type of financial support would be most useful?", type:"multiselect", other:true,
          options:["Loan","Grant","Savings","Equipment financing","Working capital","Training","Business management support"] },
      ]},
      { title:"Attitudes to borrowing", questions:[
        { id:"loan_concerns", label:"What concerns would you have about taking a loan?", type:"textarea" },
        { id:"comfort_borrowing", label:"What would make you comfortable borrowing?", type:"textarea" },
        { id:"borrowing_blockers", label:"What would prevent you from taking a loan?", type:"textarea" },
        { id:"trusted_financier", label:"Who would you trust to provide financing?", type:"textarea" },
      ]},
    ]
  },

  {
    section: "Section 17 · Deep-dive financials",
    note: "Phase 2 — for centres shortlisted on creditworthiness. Skippable at screening.",
    groups: [
      { title:"Historic revenue & enrolment", questions:[
        { id:"dd_rev_2026", label:"Revenue so far in 2026", type:"integer", unit:"MONEY" },
        { id:"dd_rev_2025", label:"Annual revenue in 2025", type:"integer", unit:"MONEY", half:true },
        { id:"dd_rev_2024", label:"Annual revenue in 2024", type:"integer", unit:"MONEY", half:true },
        { id:"dd_enrol_2025", label:"# children enrolled in 2025", type:"integer", half:true },
        { id:"dd_enrol_2024", label:"# children enrolled in 2024", type:"integer", half:true },
      ]},
      { title:"2025 cost base (as available)", note:COSTS_HELP, questions:[
        { id:"cost_total", label:"Total costs 2025", type:"integer", unit:"MONEY", help:COSTS_HELP },
        { id:"cost_salaries", label:"Salaries", type:"integer", unit:"MONEY", half:true },
        { id:"cost_rent", label:"Rent", type:"integer", unit:"MONEY", half:true },
        { id:"cost_food", label:"Food / feeding", type:"integer", unit:"MONEY", half:true },
        { id:"cost_materials", label:"Learning materials & supplies", type:"integer", unit:"MONEY", half:true },
        { id:"cost_utilities", label:"Utilities", type:"integer", unit:"MONEY", half:true },
        { id:"cost_maintenance", label:"Maintenance", type:"integer", unit:"MONEY", half:true },
      ]},
    ]
  },

  {
    section: "Section 18 · Enumerator assessment",
    note: "Completed by the enumerator after the interview, not by the respondent.",
    groups: [
      { title:"Contact details", questions: CONTACT_OBS },
      { title:"Enumerator assessment", questions:[
        { id:"obs_admin_l1", label:"@adminL1Label", type:"select", dropdown:true, optionsKey:"adminL1" },
        { id:"obs_geocoordinates", label:"Geocoordinates", type:"geo" },
        { id:"ea_operational", label:"Centre appears operational", type:"yesno" },
        { id:"ea_children_verified", label:"Number of children verified / observed", type:"integer" },
        { id:"ea_records_seen", label:"Records seen", type:"yesno" },
        { id:"ea_records_credible", label:"Financial records credible", type:"select", options:["High","Medium","Low"] },
        { id:"ea_viable", label:"Centre appears financially viable", type:"select", options:["Yes","No","Unclear"] },
        { id:"ea_fees_collected", label:"Fees appear regularly collected", type:"select", options:["Yes","No","Unclear"] },
        { id:"ea_debt_burden", label:"Existing debt burden", type:"select", options:["Low","Medium","High"] },
        { id:"ea_management", label:"Management quality", type:"select", options:["Good","Average","Weak"] },
        { id:"ea_growth_potential", label:"Growth potential", type:"select", options:["High","Medium","Low"] },
        { id:"ea_financing_interest", label:"Financing interest", type:"select", options:["High","Medium","Low"] },
        { id:"ea_ability_to_repay", label:"Ability to repay", type:"select", options:["High","Medium","Low"] },
        { id:"ea_security_available", label:"Security / guarantee available", type:"select", options:["Yes","No","Unclear"] },
        { id:"obs_centre_condition", label:"Centre condition", type:"select", options:CENTRE_CONDITION },
        { id:"obs_area", label:"Area where the centre is located", type:"select", options:AREA_TYPE },
        { id:"ea_overall_potential", label:"Overall financing potential", type:"select", options:["High","Medium","Low"] },
        { id:"ea_comments", label:"Enumerator comments", type:"textarea" },
        { id:"obs_premises_photo", label:"Photograph of premises", type:"photo",
          help:"Tap again to add more than one photo." },
      ]},
    ]
  },

];

/* Assemble the full survey for a given branch. Section 0 is always first. */
function buildSections(centreType) {
  const branch = DAYCARE_TYPES.includes(centreType) ? DAYCARE_SECTIONS : ECD_SECTIONS;
  return [SECTION_0, ...branch];
}

window.SURVEY = {
  SECTION_0,
  ECD_SECTIONS,
  DAYCARE_SECTIONS,
  buildSections,
  ENUMERATORS,
  COUNTRIES,
  CENTRE_TYPES,
  DAYCARE_TYPES,
  ATTACHED_TYPE,
};
