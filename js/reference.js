/* ------------------------------------------------------------------
   Reference data: enumerators, countries, currencies, geography.
   Jackfruit x Open Capital - ECD & childcare centre survey
   ------------------------------------------------------------------ */

const ENUMERATORS = [
  { id: 'hassan',  name: 'Hassan Iya Halakhe',  region: 'N Kenya', country: 'KE' },
  { id: 'michael', name: 'Michael Irungu Mwaura', region: 'Kampala', country: 'UG' },
  { id: 'jalle',   name: 'Micheal Jalle',        region: 'N Kenya', country: 'KE' },
  { id: 'lynda',   name: 'Lynda Kaino',          region: 'N Kenya', country: 'KE' }
];

const COUNTRIES = {
  KE: {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    currencyName: 'Kenyan Shilling',
    locale: 'en-KE',
    adminL1Label: 'County',
    adminL2Label: 'Sub-county',
    adminL3Label: 'Ward',
    adminL4Label: 'Village / location',
    mobileMoney: 'M-Pesa',
    phonePrefix: '+254',
    phoneHint: 'e.g. +254 7XX XXX XXX',
    taxIdLabel: 'Kenya Revenue Authority (KRA) PIN',
    taxIdHint: 'e.g. A012345678Z',
    curriculumOptions: [
      'CBC pre-primary (Kenya)',
      'Kenya ECDE syllabus',
      'Montessori',
      'Faith-based curriculum',
      'Own / informal',
      'Other (specify)'
    ],
    registrationOptions: [
      'County government (Kenya)',
      'Ministry of Education / DCS (Kenya)',
      'Sub-county education office',
      'NGO / CBO registration (Social Services)',
      'Not registered',
      'Other'
    ],
    lenderOptions: [
      'Bank', 'SACCO', 'Microfinance institution', 'FinTech / digital lender',
      'Chama / VSLA / women’s group', 'Mobile money loan (M-Shwari, Fuliza, KCB M-Pesa)',
      'NGO', 'Family / friends', 'Supplier / trade credit',
      'Personal loan used for the business', 'Other'
    ],
    savingsGroupTerm: 'chama / table banking group',
    // Counties in scope for the ECD scoping study
    adminL1: ['Isiolo', 'Samburu', 'Marsabit', 'Turkana', 'Wajir', 'Garissa', 'Mandera', 'Other (specify)'],
    geo: {
      'Isiolo': {
        'Isiolo North (Isiolo)': ['Wabera', 'Bulla Pesa', 'Burat', 'Ngare Mara', 'Oldonyiro', 'Chari', 'Cherab'],
        'Isiolo South (Garbatulla)': ['Garbatulla', 'Kinna', 'Sericho'],
        'Merti': ['Chari', 'Cherab']
      },
      'Samburu': {
        'Samburu West': ['Lodokejek', 'Suguta Marmar', 'Maralal', 'Loosuk', 'Poro'],
        'Samburu North': ['El-Barta', 'Nachola', 'Ndoto', 'Nyiro', 'Angata Nanyokie', 'Baawa'],
        'Samburu East': ['Waso', 'Wamba West', 'Wamba East', 'Wamba North']
      },
      'Marsabit': {
        'Saku': ['Sagante/Jaldesa', 'Karare', 'Marsabit Central'],
        'North Horr': ['Dukana', 'Maikona', 'Turbi', 'North Horr', 'Illeret'],
        'Laisamis': ['Loiyangalani', 'Kargi/South Horr', 'Korr/Ngurunit', 'Log Logo', 'Laisamis'],
        'Moyale': ['Butiye', 'Sololo', 'Heillu/Manyatta', 'Golbo', 'Moyale Township', 'Uran', 'Obbu']
      },
      'Turkana': {
        'Turkana West': ['Kakuma', 'Letea', 'Songot', 'Kalobeyei', 'Lokichoggio', 'Nanaam', 'Lopur'],
        'Turkana Central': ['Kerio Delta', 'Kang’atotha', 'Kalokol', 'Lodwar Township', 'Kanamkemer'],
        'Turkana South': ['Kaputir', 'Katilu', 'Lobokat', 'Kalapata', 'Lokichar']
      }
    },
    settlements: [
      'Not in a settlement',
      'Kakuma refugee camp',
      'Kalobeyei integrated settlement',
      'Dadaab (Hagadera / Ifo / Dagahaley)',
      'Host community adjacent to a settlement',
      'Other (specify)'
    ]
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    currency: 'UGX',
    currencyName: 'Ugandan Shilling',
    locale: 'en-UG',
    adminL1Label: 'District',
    adminL2Label: 'Division / sub-county',
    adminL3Label: 'Parish / ward',
    adminL4Label: 'Village / zone (LC1)',
    mobileMoney: 'MTN MoMo / Airtel Money',
    phonePrefix: '+256',
    phoneHint: 'e.g. +256 7XX XXX XXX',
    taxIdLabel: 'URA Tax Identification Number (TIN)',
    taxIdHint: '10-digit URA TIN',
    curriculumOptions: [
      'Uganda ECD Learning Framework',
      'NCDC pre-primary curriculum (Uganda)',
      'Montessori',
      'Faith-based curriculum',
      'Own / informal',
      'Other (specify)'
    ],
    registrationOptions: [
      'Ministry of Education & Sports (Uganda)',
      'District Education Office',
      'KCCA (Kampala Capital City Authority)',
      'Office of the Prime Minister / settlement authority (Uganda)',
      'NGO Bureau / community development office',
      'Not registered',
      'Other'
    ],
    lenderOptions: [
      'Bank', 'SACCO', 'Microfinance institution (MDI)', 'FinTech / digital lender',
      'VSLA / chama / women’s group', 'Mobile money loan (MoKash, Wewole, Airtel)',
      'NGO', 'Family / friends', 'Supplier / trade credit',
      'Personal loan used for the business', 'Other'
    ],
    savingsGroupTerm: 'VSLA / savings group',
    adminL1: ['Kampala', 'Wakiso', 'Mukono', 'Isingiro', 'Yumbe', 'Adjumani', 'Kyegegwa', 'Other (specify)'],
    geo: {
      'Kampala': {
        'Central Division': ['Bukesa', 'Civic Centre', 'Industrial Area', 'Kagugube', 'Kamwokya II', 'Kisenyi I', 'Kisenyi II', 'Kisenyi III', 'Kololo I', 'Kololo II', 'Kololo III', 'Kololo IV', 'Mengo', 'Nakasero I', 'Nakasero II', 'Nakasero III', 'Nakasero IV', 'Nakivubo/Shauriyako', 'Old Kampala'],
        'Kawempe Division': ['Bwaise I', 'Bwaise II', 'Bwaise III', 'Kanyanya', 'Kawempe I', 'Kawempe II', 'Kazo', 'Kikaya', 'Komamboga', 'Kyebando', 'Makerere III', 'Mpererwe', 'Mulago I', 'Mulago II', 'Mulago III', 'Wandegeya'],
        'Makindye Division': ['Bukasa', 'Buziga', 'Ggaba', 'Kansanga', 'Katwe I', 'Katwe II', 'Kibuye I', 'Kibuye II', 'Kisugu', 'Luwafu', 'Makindye I', 'Makindye II', 'Nsambya Central', 'Nsambya Estates', 'Salaama', 'Wabigalo'],
        'Nakawa Division': ['Bugolobi', 'Bukoto I', 'Bukoto II', 'Butabika', 'Kiswa', 'Kitintale', 'Kyanja', 'Luzira', 'Mbuya I', 'Mbuya II', 'Mutungo', 'Naguru I', 'Naguru II', 'Nakawa', 'Ntinda'],
        'Rubaga Division': ['Busega', 'Kasubi', 'Kikoni (Makerere I)', 'Makerere II', 'Lubya', 'Lungujja', 'Mutundwe', 'Naakulabye', 'Namirembe', 'Ndeeba', 'Nateete', 'Rubaga', 'Kabowa', 'Mutundwe']
      },
      'Wakiso': {
        'Nansana Municipality': ['Nansana', 'Gombe', 'Busukuma', 'Nabweru'],
        'Kira Municipality': ['Kira', 'Bweyogerere', 'Namugongo'],
        'Makindye-Ssabagabo': ['Ndejje', 'Bunamwaya', 'Masajja']
      },
      'Isingiro': { 'Nakivale settlement area': ['Base camp', 'Juru', 'Rubondo'] },
      'Yumbe': { 'Bidi Bidi settlement area': ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'] },
      'Adjumani': { 'Adjumani settlements': ['Nyumanzi', 'Pagirinya', 'Maaji', 'Mungula'] },
      'Kyegegwa': { 'Kyaka II settlement area': ['Bukere', 'Byabakora', 'Sweswe'] }
    },
    settlements: [
      'Not in a settlement',
      'Urban refugee (Kampala)',
      'Nakivale',
      'Kyaka II',
      'Kyangwali',
      'Rwamwanja',
      'Bidi Bidi',
      'Palorinya',
      'Rhino Camp',
      'Imvepi',
      'Adjumani settlements',
      'Oruchinga',
      'Palabek',
      'Kiryandongo',
      'Host community adjacent to a settlement',
      'Other (specify)'
    ]
  }
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
