/****************************************************************************
 * Jackfruit x Open Capital — ECD & Childcare Survey — Apps Script backend
 * --------------------------------------------------------------------------
 * Receives survey submissions from the offline PWA and writes them to a
 * Google Sheet (one tab per questionnaire type), saving any photos to a
 * Google Drive folder and storing the links.
 *
 * The Sheet and Drive folder live in YOUR Google account, so viewing the
 * data requires a Google login that you have shared with. The web app
 * endpoint itself is public (enumerators are anonymous in the field); set
 * SHARED_SECRET below if you want to require a token on every submission.
 *
 * SETUP: see SETUP.md. In short:
 *   1. Create a Google Sheet, open Extensions ▸ Apps Script, paste this file.
 *   2. Set SHEET_ID and PHOTO_FOLDER_ID below (or leave blank to auto-create).
 *   3. Deploy ▸ New deployment ▸ Web app ▸ Execute as: Me ▸ Access: Anyone.
 *   4. Copy the /exec URL into the app’s Settings (☰) → Sync URL.
 ****************************************************************************/

// ---- CONFIG ---------------------------------------------------------------
var SHEET_ID = "";          // leave "" to use the bound spreadsheet
var PHOTO_FOLDER_ID = "";   // leave "" to auto-create a "JF ECD Survey Photos" folder
var SHARED_SECRET = "";     // optional: require {secret:"..."} in payload to accept

// Centre types routed to the daycare & home-based questionnaire (its own tab).
var DAYCARE_TYPES = ["Standalone ECD / daycare centre", "Home-based childcare"];

// Friendly column order placed first when a tab is created; everything else
// is appended automatically as it appears.
var LEAD_COLS = ["submitted_at", "submission_id", "enumerator", "centre_type", "country", "currency", "region", "gps_lat", "gps_lng", "gps_accuracy_m"];

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "JF ECD Survey", time: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var data = JSON.parse(e.postData.contents);

    if (SHARED_SECRET && data.secret !== SHARED_SECRET) {
      return json({ ok: false, error: "unauthorized" });
    }

    if (data.action === "delete") {
      return handleDelete(data);
    }

    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    var tabName = DAYCARE_TYPES.indexOf(data.centreType) >= 0 ? "Daycare & home-based" : "ECD centres";
    var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

    // Build a flat row object
    var row = {};
    row["submitted_at"] = new Date(data.completedAt || Date.now());
    row["submission_id"] = data.id || "";
    row["enumerator"] = data.enumerator || "";
    row["centre_type"] = data.centreType || "";
    row["country"] = data.country || "";
    row["currency"] = data.currency || "";
    row["region"] = data.region || "";
    if (data.autoGeo) {
      row["gps_lat"] = data.autoGeo.lat;
      row["gps_lng"] = data.autoGeo.lng;
      row["gps_accuracy_m"] = data.autoGeo.accuracy;
    }

    var answers = data.answers || {};
    Object.keys(answers).forEach(function (key) {
      var v = answers[key];
      if (Array.isArray(v) && v.length && v[0] && v[0].dataUrl) {
        // photos -> save to Drive, store links
        row[key] = savePhotos(v, data.id, key).join(" , ");
      } else if (Array.isArray(v) && v.length && typeof v[0] === "object") {
        // repeat groups (e.g. outstanding loans) -> readable text
        row[key] = v.map(function (o, i) {
          return "Loan " + (i + 1) + ": " + Object.keys(o).map(function (k) { return k + "=" + o[k]; }).join("; ");
        }).join(" || ");
      } else {
        row[key] = v;
      }
    });

    writeRow(sheet, row);
    return json({ ok: true, id: data.id, tab: tabName });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// Delete a submission: remove its row(s) from either tab and trash
// any photos saved under its id.
function handleDelete(data) {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var id = String(data.id || "");
  if (!id) return json({ ok: false, error: "no id" });
  var removed = 0;

  ["ECD centres", "Daycare & home-based"].forEach(function (tabName) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) return;
    var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;
    var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idCol = header.indexOf("submission_id");
    if (idCol < 0) return;
    var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
    for (var r = ids.length - 1; r >= 0; r--) {           // bottom-up so indexes stay valid
      if (String(ids[r][0]) === id) { sheet.deleteRow(r + 2); removed++; }
    }
  });

  // Trash photos named "<id>_..."
  try {
    var folder = getPhotoFolder();
    var it = folder.getFiles();
    while (it.hasNext()) {
      var f = it.next();
      if (f.getName().indexOf(id + "_") === 0) f.setTrashed(true);
    }
  } catch (e) { /* ignore photo cleanup errors */ }

  return json({ ok: true, id: id, rowsRemoved: removed });
}

// Write a row, expanding the header to include any new keys. If a row with the
// same submission_id already exists, UPDATE it in place (so re-submitted edits
// don't create duplicates); otherwise append a new row.
function writeRow(sheet, row) {
  var lastCol = sheet.getLastColumn();
  var header = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];

  if (header.length === 0) {
    header = LEAD_COLS.slice();
  }
  // add any new columns
  Object.keys(row).forEach(function (k) {
    if (header.indexOf(k) === -1) header.push(k);
  });
  sheet.getRange(1, 1, 1, header.length).setValues([header]);
  sheet.getRange(1, 1, 1, header.length).setFontWeight("bold").setBackground("#193F44").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  var line = header.map(function (h) { return (h in row) ? row[h] : ""; });

  // Upsert: look for an existing row with the same submission_id.
  var idCol = header.indexOf("submission_id");
  var targetRow = 0;
  if (idCol >= 0 && row["submission_id"]) {
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
      for (var r = 0; r < ids.length; r++) {
        if (String(ids[r][0]) === String(row["submission_id"])) { targetRow = r + 2; break; }
      }
    }
  }
  if (targetRow) {
    sheet.getRange(targetRow, 1, 1, line.length).setValues([line]);
  } else {
    sheet.appendRow(line);
  }
}

// Save base64 photos to a Drive folder; return shareable links.
function savePhotos(photos, subId, key) {
  var folder = getPhotoFolder();
  var links = [];
  photos.forEach(function (p, i) {
    try {
      var parts = p.dataUrl.split(",");
      var meta = parts[0]; // data:image/jpeg;base64
      var b64 = parts[1];
      var contentType = meta.substring(meta.indexOf(":") + 1, meta.indexOf(";")) || "image/jpeg";
      var bytes = Utilities.base64Decode(b64);
      var name = (subId || "sub") + "_" + key + "_" + (i + 1) + ".jpg";
      var blob = Utilities.newBlob(bytes, contentType, name);
      var file = folder.createFile(blob);
      links.push(file.getUrl());
    } catch (e) {
      links.push("ERROR:" + e);
    }
  });
  return links;
}

function getPhotoFolder() {
  if (PHOTO_FOLDER_ID) return DriveApp.getFolderById(PHOTO_FOLDER_ID);
  var name = "JF ECD Survey Photos";
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* =====================================================================
   RESET: re-seed both tabs so their columns match the CURRENT survey
   schema exactly. Run resetSurveySheets() once from the Apps Script
   editor. WARNING: this clears existing rows in those two tabs
   (intended for cleaning up test data before go-live).
   These header lists are generated from schema.js.
   ===================================================================== */
var ECD_HEADERS = [
  "submitted_at",
  "submission_id",
  "enumerator",
  "centre_type",
  "country",
  "currency",
  "region",
  "gps_lat",
  "gps_lng",
  "gps_accuracy_m",
  "centre_name",
  "centre_type__other",
  "year_opened",
  "years_operating",
  "religious_affiliation",
  "ownership_type",
  "ownership_type__other",
  "owner_gender",
  "owner_is_lead",
  "interviewee_name",
  "interviewee_role",
  "interviewee_role__other",
  "admin_l1",
  "admin_l1__other",
  "admin_l2",
  "admin_l2__other",
  "admin_l3",
  "admin_l3__other",
  "admin_l4",
  "settlement",
  "settlement__other",
  "setting",
  "school_name",
  "school_grades",
  "school_total_enrolment",
  "school_ownership",
  "school_ownership__other",
  "ecd_separate_accounts",
  "ecd_own_budget",
  "ecd_share_of_school_rev",
  "ecd_subsidised_by_school",
  "borrower_entity",
  "age_groups",
  "operating_model",
  "days_open_week",
  "hours_open_day",
  "months_open_year",
  "enrol_total",
  "enrol_0_2",
  "enrol_2_3",
  "enrol_3_5",
  "enrol_6p",
  "max_capacity",
  "waiting_list",
  "avg_daily_attendance",
  "attendance_recorded",
  "enrol_this_year",
  "enrol_last_year",
  "enrol_two_years_ago",
  "pct_girls",
  "pct_refugee",
  "pct_low_income",
  "fee_period",
  "fee_amount",
  "fee_collection",
  "fee_flexibility",
  "fee_collected_pct",
  "fee_schedule_photo",
  "fee_schedule_note",
  "provides_transport",
  "provides_meals",
  "meals_per_day",
  "has_curriculum",
  "curriculum_which",
  "curriculum_which__other",
  "lesson_plans",
  "learning_materials",
  "tracks_milestones",
  "progress_records",
  "pct_transition_primary",
  "learning_play_space",
  "nap_area",
  "caregiver_ratio",
  "num_classrooms",
  "capacity_per_room",
  "wall_construction",
  "floor_construction",
  "premises_tenure",
  "lease_expiry",
  "monthly_rent",
  "running_water",
  "safe_drinking_water",
  "handwashing",
  "child_toilets",
  "num_toilets",
  "electricity",
  "electricity_source",
  "kitchen_area",
  "safeguarding_policy",
  "safeguarding_practices",
  "safeguarding_practices__other",
  "staff_total",
  "staff_trained_ecd",
  "staff_ecde_qualified",
  "staff_support",
  "payroll_monthly",
  "staff_training_freq",
  "staff_me",
  "staff_incentives",
  "monthly_revenue",
  "revenue_seasonal",
  "revenue_peak_trough",
  "rev_pct_fees",
  "rev_pct_government",
  "rev_pct_donor",
  "rev_pct_other",
  "collection_days",
  "arrears",
  "arrears_value",
  "digital_tools",
  "digital_tools_use",
  "digital_tools_use__other",
  "bank_account",
  "accounts_tracking",
  "accounts_tracking__other",
  "mobile_money",
  "supply_shortages",
  "supplier_credit",
  "sch_monthly_revenue",
  "sch_revenue_seasonal",
  "sch_revenue_peak_trough",
  "sch_rev_pct_fees",
  "sch_rev_pct_government",
  "sch_rev_pct_donor",
  "sch_rev_pct_other",
  "sch_collection_days",
  "sch_arrears",
  "sch_arrears_value",
  "sch_fee_per_term",
  "sch_staff_total",
  "sch_payroll_monthly",
  "sch_bank_account",
  "applied_before",
  "no_loan_reason",
  "no_loan_reason__other",
  "loan_outcome",
  "loan_source",
  "loan_source__other",
  "loan_rejection_reason",
  "loan_interest_rate",
  "savings_group_member",
  "savings_group_role",
  "parents_rely_childcare",
  "wants_loan",
  "loan_use",
  "loan_use__other",
  "loan_size_wanted",
  "repay_capacity_month",
  "coll_land",
  "coll_equipment",
  "coll_vehicle",
  "coll_personal_guarantee",
  "coll_group_guarantee",
  "plans_investment",
  "investment_areas",
  "investment_areas__other",
  "investment_goal",
  "investment_goal__other",
  "investment_cost",
  "investment_finance",
  "investment_finance__other",
  "is_registered",
  "registered_with",
  "registered_with__other",
  "registration_number",
  "permit_expiry",
  "tax_id",
  "ecd_licence",
  "dd_rev_2026",
  "dd_rev_2025",
  "dd_rev_2024",
  "dd_enrol_2025",
  "dd_enrol_2024",
  "cost_total",
  "cost_salaries",
  "cost_rent",
  "cost_food",
  "cost_materials",
  "cost_utilities",
  "cost_maintenance",
  "asset_premises",
  "asset_furniture",
  "asset_play",
  "asset_vehicles",
  "outstanding_loans",
  "num_outstanding_loans",
  "outstanding_loan_list",
  "sdd_rev_2026",
  "sdd_rev_2025",
  "sdd_rev_2024",
  "sdd_enrol_2025",
  "sdd_enrol_2024",
  "sdd_cost_total",
  "sdd_cost_salaries",
  "sdd_cost_rent",
  "sdd_cost_food",
  "sdd_cost_other",
  "sch_outstanding_loans",
  "sch_num_outstanding_loans",
  "sch_outstanding_loan_list",
  "centre_phone",
  "owner_email",
  "centre_email",
  "physical_address",
  "obs_admin_l1",
  "obs_geocoordinates",
  "obs_centre_condition",
  "obs_activity",
  "obs_interaction",
  "obs_safety",
  "obs_owner_financial_knowledge",
  "obs_area",
  "obs_red_flags",
  "obs_premises_photo",
  "obs_consent_form",
  "matched_sample"
];

var DAYCARE_HEADERS = [
  "submitted_at",
  "submission_id",
  "enumerator",
  "centre_type",
  "country",
  "currency",
  "region",
  "gps_lat",
  "gps_lng",
  "gps_accuracy_m",
  "centre_name",
  "centre_type__other",
  "year_opened",
  "years_operating",
  "religious_affiliation",
  "ownership_type",
  "ownership_type__other",
  "owner_gender",
  "owner_is_lead",
  "interviewee_name",
  "interviewee_role",
  "interviewee_role__other",
  "admin_l1",
  "admin_l1__other",
  "admin_l2",
  "admin_l2__other",
  "admin_l3",
  "admin_l3__other",
  "admin_l4",
  "settlement",
  "settlement__other",
  "setting",
  "school_name",
  "school_grades",
  "school_total_enrolment",
  "school_ownership",
  "school_ownership__other",
  "ecd_separate_accounts",
  "ecd_own_budget",
  "ecd_share_of_school_rev",
  "ecd_subsidised_by_school",
  "borrower_entity",
  "dc_centre_type",
  "dc_centre_type__other",
  "operator_type",
  "operator_type__other",
  "dc_years_operating",
  "dc_is_registered",
  "dc_registered_with",
  "dc_registered_with__other",
  "premises_owner",
  "premises_owner__other",
  "dc_monthly_rent",
  "operates_independently",
  "support_source",
  "enrol_u1_boys",
  "enrol_u1_girls",
  "enrol_1_boys",
  "enrol_1_girls",
  "enrol_2_boys",
  "enrol_2_girls",
  "enrol_3_boys",
  "enrol_3_girls",
  "enrol_4_boys",
  "enrol_4_girls",
  "enrol_5_boys",
  "enrol_5_girls",
  "enrol_total",
  "avg_daily_attendance",
  "peak_children",
  "pct_refugee",
  "new_per_month",
  "leave_per_month",
  "why_leave",
  "why_leave__other",
  "services",
  "services__other",
  "open_time",
  "close_time",
  "days_operating",
  "year_round",
  "dc_months_open_year",
  "busiest_days",
  "busiest_months",
  "slowest_days",
  "slowest_months",
  "growth_constraints",
  "growth_constraints__other",
  "staff_total",
  "staff_caregivers",
  "staff_caregivers_pay",
  "staff_teachers",
  "staff_teachers_pay",
  "staff_cook",
  "staff_cook_pay",
  "staff_cleaner",
  "staff_cleaner_pay",
  "staff_ecde_qualified",
  "pay_frequency",
  "pay_frequency__other",
  "caregiver_ratio",
  "turned_away_staff",
  "fee_per_day",
  "fee_per_week",
  "fee_per_month",
  "fee_period",
  "fee_period__other",
  "fee_collection",
  "fee_varies_by_age",
  "meals_charged_separately",
  "meal_charge",
  "fee_schedule_photo",
  "pay_on_time",
  "arrears_value",
  "payment_delay",
  "service_when_unpaid",
  "parent_livelihoods",
  "parents_rely_childcare",
  "inc_childcare_fees",
  "inc_meals",
  "inc_registration",
  "inc_donations",
  "inc_government",
  "inc_ngo",
  "inc_group",
  "inc_other",
  "inc_total",
  "income_highest_12m",
  "income_lowest_12m",
  "income_variance_reason",
  "exp_rent",
  "exp_salaries",
  "exp_food",
  "exp_water",
  "exp_electricity",
  "exp_fuel",
  "exp_learning",
  "exp_toys",
  "exp_cleaning",
  "exp_transport",
  "exp_repairs",
  "exp_licences",
  "exp_airtime",
  "exp_other",
  "exp_total",
  "monthly_surplus",
  "owner_subsidises",
  "centre_supports_household",
  "records_income",
  "records_expenses",
  "records_children_fees",
  "records_how",
  "records_how__other",
  "records_frequency",
  "records_photo",
  "mobile_money_account",
  "bank_account",
  "money_separation",
  "applied_before",
  "loan_source",
  "loan_source__other",
  "outstanding_loans",
  "num_outstanding_loans",
  "outstanding_loan_list",
  "missed_repayment",
  "missed_reason",
  "fully_repaid",
  "no_loan_reason",
  "no_loan_reason__other",
  "wants_loan",
  "loan_use",
  "loan_use__other",
  "loan_size_wanted",
  "loan_size_minimum",
  "loan_timing",
  "repay_capacity_month",
  "repay_frequency_pref",
  "repay_difficult_amount",
  "income_dips",
  "income_dip_months",
  "low_month_strategy",
  "low_month_strategy__other",
  "owner_other_income",
  "owner_other_income_sources",
  "owner_other_income_amount",
  "owner_income_supports_repayment",
  "group_members",
  "group_age",
  "group_constitution",
  "group_bank_account",
  "group_mobile_money",
  "savings_group_member",
  "group_contribution",
  "group_contribution_freq",
  "group_contribution_freq__other",
  "group_borrowed_before",
  "group_defaulted",
  "group_borrow_approval",
  "group_guarantee",
  "has_assets",
  "asset_land",
  "asset_building",
  "asset_furniture",
  "asset_equipment",
  "asset_vehicle",
  "asset_other",
  "willing_security",
  "security_types",
  "security_types__other",
  "additional_children",
  "growth_requirements",
  "growth_investment_cost",
  "additional_staff",
  "additional_staff_cost",
  "additional_revenue",
  "payback_time",
  "biggest_challenges",
  "support_type_useful",
  "support_type_useful__other",
  "loan_concerns",
  "comfort_borrowing",
  "borrowing_blockers",
  "trusted_financier",
  "dd_rev_2026",
  "dd_rev_2025",
  "dd_rev_2024",
  "dd_enrol_2025",
  "dd_enrol_2024",
  "cost_total",
  "cost_salaries",
  "cost_rent",
  "cost_food",
  "cost_materials",
  "cost_utilities",
  "cost_maintenance",
  "centre_phone",
  "owner_email",
  "centre_email",
  "physical_address",
  "obs_admin_l1",
  "obs_geocoordinates",
  "ea_operational",
  "ea_children_verified",
  "ea_records_seen",
  "ea_records_credible",
  "ea_viable",
  "ea_fees_collected",
  "ea_debt_burden",
  "ea_management",
  "ea_growth_potential",
  "ea_financing_interest",
  "ea_ability_to_repay",
  "ea_security_available",
  "obs_centre_condition",
  "obs_area",
  "ea_overall_potential",
  "ea_comments",
  "obs_premises_photo",
  "obs_consent_form",
  "matched_sample"
];

function resetSurveySheets() {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  seedSheet_(ss, "ECD centres", ECD_HEADERS);
  seedSheet_(ss, "Daycare & home-based", DAYCARE_HEADERS);
  SpreadsheetApp.getActive().toast("Both tabs reset to the current survey columns.");
}

function seedSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();                         // remove old data + stale columns
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold").setBackground("#193F44").setFontColor("#ffffff");
  sh.setFrozenRows(1);
}
