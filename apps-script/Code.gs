/**
 * ECD & Childcare Centre Survey — Google Sheets receiver.
 *
 * Deploy as a Web App (Execute as: Me; Who has access: Anyone) and paste
 * the /exec URL into the app's "Sync & export" screen.
 *
 * Writes one row per response, one sheet per questionnaire, and adds new
 * columns automatically if the app ever sends a field the sheet has not
 * seen before. Re-syncing the same response updates its row in place.
 */

// Optional. If set, the app must send the same value in "Shared token".
var SHARED_TOKEN = '';

var SHEETS = { ecd: 'ECD centres', daycare: 'Daycare & home-based' };
var LOG_SHEET = 'Sync log';

function doGet(e) {
  if (e && e.parameter && e.parameter.ping) {
    return json({ ok: true, sheet: SpreadsheetApp.getActiveSpreadsheet().getName() });
  }
  return json({ ok: true, message: 'ECD survey receiver is running.' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return json({ ok: false, error: 'Sheet busy, try again.' });
  }
  try {
    var body = JSON.parse(e.postData.contents);

    if (SHARED_TOKEN && body.token !== SHARED_TOKEN) {
      return json({ ok: false, error: 'Invalid token.' });
    }
    if (!body.flat || !body.record || !body.record.id) {
      return json({ ok: false, error: 'Malformed payload.' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var name = SHEETS[body.record.questionnaire] || 'Responses';
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.setFrozenRows(1);
    }

    var flat = body.flat;
    var keys = Object.keys(flat);

    // Header row — create or extend
    var lastCol = Math.max(1, sh.getLastColumn());
    var header = sh.getLastRow() > 0
      ? sh.getRange(1, 1, 1, lastCol).getValues()[0].filter(String)
      : [];
    var added = [];
    keys.forEach(function (k) { if (header.indexOf(k) === -1) { header.push(k); added.push(k); } });
    if (added.length || sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, header.length).setValues([header]);
      sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#dcf0e3');
      sh.setFrozenRows(1);
    }

    var row = header.map(function (k) {
      var v = flat[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    });

    // Upsert on response_id
    var idCol = header.indexOf('response_id') + 1;
    var target = 0;
    if (idCol > 0 && sh.getLastRow() > 1) {
      var ids = sh.getRange(2, idCol, sh.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(body.record.id)) { target = i + 2; break; }
      }
    }
    if (target) {
      sh.getRange(target, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
      target = sh.getLastRow();
    }

    logSync(ss, body, target, added.length);
    return json({ ok: true, row: target, newColumns: added.length, sheet: name });

  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function logSync(ss, body, row, newCols) {
  var log = ss.getSheetByName(LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(LOG_SHEET);
    log.appendRow(['Received at', 'Response ID', 'Questionnaire', 'Enumerator', 'Country', 'Centre name', 'Row', 'New columns', 'App version']);
    log.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#dcf0e3');
    log.setFrozenRows(1);
  }
  log.appendRow([
    new Date(),
    body.record.id,
    body.record.questionnaire,
    body.record.enumerator || '',
    body.record.country || '',
    (body.flat && body.flat.centre_name) || '',
    row,
    newCols,
    body.appVersion || ''
  ]);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
