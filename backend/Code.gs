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
var BACKEND_VERSION = "ecd-3";  // bump when this file changes, so the app can report it

// Centre types routed to the daycare & home-based questionnaire (its own tab).
var DAYCARE_TYPES = ["Standalone ECD / daycare centre", "Home-based childcare"];

// Friendly column order placed first when a tab is created; everything else
// is appended automatically as it appears.
var LEAD_COLS = ["submitted_at", "submission_id", "enumerator", "centre_type", "country", "currency", "region", "gps_lat", "gps_lng", "gps_accuracy_m"];

function doGet(e) {
  // ?ping=1 lets the app's "Test sync" confirm the deployment before fieldwork.
  return json({
    ok: true,
    service: "JF ECD Survey",
    version: BACKEND_VERSION,
    spreadsheet: (SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet()).getName(),
    time: new Date().toISOString()
  });
}

/* Normalise the incoming body so this script accepts BOTH payload shapes:
   the current app  { id, centreType, answers, ... }
   the first build  { record:{id,questionnaire,...}, flat:{...} }
   A device running an older build therefore still syncs instead of being
   rejected with "Malformed payload". */
function normalise_(body) {
  if (body && body.record && (body.flat || body.answers)) {
    var r = body.record;
    return {
      id: r.id,
      enumerator: r.enumerator,
      centreType: r.centreType || (r.questionnaire === "daycare" ? "Standalone ECD / daycare centre" : "Nursery / pre-primary (standalone)"),
      country: r.country, currency: r.currency, region: r.region || "",
      answers: body.flat || body.answers || {},
      centreRef: body.centreRef || null,
      autoGeo: body.autoGeo || null,
      createdAt: r.createdAt, completedAt: r.submittedAt || r.updatedAt,
      action: body.action
    };
  }
  return body || {};
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var raw = JSON.parse(e.postData.contents);

    if (SHARED_SECRET && raw.secret !== SHARED_SECRET && (!raw.token || raw.token !== SHARED_SECRET)) {
      return json({ ok: false, error: "unauthorized: the shared secret does not match" });
    }

    var data = normalise_(raw);

    if (data.action === "ping") {
      return json({
        ok: true, version: BACKEND_VERSION,
        spreadsheet: (SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet()).getName()
      });
    }

    if (data.action === "delete") {
      return handleDelete(data);
    }

    if (!data.id) {
      return json({ ok: false, error: "no submission id in the payload", got: Object.keys(raw).join(",") });
    }
    if (!data.answers || typeof data.answers !== "object") {
      return json({ ok: false, error: "no answers in the payload", got: Object.keys(raw).join(",") });
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
    return json({ ok: true, id: data.id, tab: tabName, version: BACKEND_VERSION });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
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
   HOUSEKEEPING: clear test rows before go-live, keeping the header.
   Run clearTestRows() once from the Apps Script editor (Run ▸ clearTestRows).
   Column order does not need seeding — writeRow() creates the header on the
   first submission and appends any new column as it appears.
   ===================================================================== */
function clearTestRows() {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var cleared = 0;
  ["ECD centres", "Daycare & home-based"].forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) return;
    var last = sh.getLastRow();
    if (last > 1) { sh.deleteRows(2, last - 1); cleared += last - 1; }
  });
  SpreadsheetApp.getActive().toast("Cleared " + cleared + " test row(s). Headers kept.");
}
