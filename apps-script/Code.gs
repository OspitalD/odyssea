// ============================================================
//  Odyssea — Hoss Tracker Backend (Apps Script)
//  Spreadsheet: 1yDzf5Ug_hkEe_x-Td1peTRrYGDAMXQUKzNPi-TccqWU
// ============================================================

const SPREADSHEET_ID = '1yDzf5Ug_hkEe_x-Td1peTRrYGDAMXQUKzNPi-TccqWU';

const SESSION_ROW = { Monday: 8, Wednesday: 36, Friday: 63, Saturday: 90 };
const SLOT_WEIGHT_COL = { 1: 'E', 2: 'K', 3: 'Q', 4: 'W' };
const SLOT_REPS_COL   = { 1: 'F', 2: 'L', 3: 'R', 4: 'X' };
const SLOT_RIR_COL    = { 1: 'G', 2: 'M', 3: 'S', 4: 'Y' };
const SLOT_EXO_COL    = { 1: 'D', 2: 'J', 3: 'P', 4: 'V' };

// ============================================================
//  ROUTING
// ============================================================

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    if (action === 'writeSet') return jsonResponse(writeSet(body));
    if (action === 'readSession') return jsonResponse(readSession(body));
    if (action === 'readWeek') return jsonResponse(readWeek(body));
    if (action === 'writeUserSession') return jsonResponse(writeUserSession(body));
    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var setsExtended = ss.getSheetByName('Sets Extended') !== null;
  var userSessions = ss.getSheetByName('User Sessions') !== null;
  return jsonResponse({
    ok: true,
    message: 'Odyssea backend is live',
    timestamp: new Date().toISOString(),
    actions: ['writeSet', 'readSession', 'readWeek', 'writeUserSession'],
    sheets: {
      'Sets Extended': setsExtended,
      'User Sessions': userSessions
    }
  });
}

// ============================================================
//  SETUP (run once manually from the editor)
// ============================================================

function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var created = [];

  if (!ss.getSheetByName('Sets Extended')) {
    var sh = ss.insertSheet('Sets Extended');
    sh.getRange('A1:R1').setValues([[
      'timestamp', 'week', 'sessionDay', 'exerciseSlot', 'setNumber',
      'exerciseName', 'format', 'weight', 'reps', 'rir', 'e1RM',
      'totalReps', 'durationMinutes', 'jumpHeight', 'jumpDistance',
      'isTopSet', 'isBackOff', 'completedAt'
    ]]);
    sh.setFrozenRows(1);
    created.push('Sets Extended');
  }

  if (!ss.getSheetByName('User Sessions')) {
    var sh = ss.insertSheet('User Sessions');
    sh.getRange('A1:G1').setValues([[
      'timestamp', 'week', 'sessionDay', 'configurationJson',
      'setsJson', 'completedAt', 'notes'
    ]]);
    sh.setFrozenRows(1);
    created.push('User Sessions');
  }

  Logger.log(created.length
    ? 'Created: ' + created.join(', ')
    : 'Both sheets already exist — no-op');
}

// ============================================================
//  HELPERS
// ============================================================

function getSheet(week) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var name = (week === 1)
    ? 'WEEK 1 - Table 1'
    : 'Week ' + week + ' - Table 1';
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet not found: ' + name);
  return sh;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  writeSet  (extended: WEEK N + Sets Extended append)
// ============================================================

function writeSet(data) {
  var week = data.week;
  var sessionDay = data.sessionDay;
  var slot = data.exerciseSlot;
  var setNum = data.setNumber;
  var format = data.format || 'traditional';

  var weekWritten = false;
  var extendedWritten = false;
  var extendedError = null;

  // --- WEEK N write (skip for jump — no weight/reps meaning) ---
  if (format !== 'jump') {
    var sh = getSheet(week);
    var baseRow = SESSION_ROW[sessionDay];
    if (!baseRow) throw new Error('Invalid sessionDay for WEEK sheet: ' + sessionDay);
    var row = baseRow + (setNum - 1);
    if (data.weight != null) sh.getRange(SLOT_WEIGHT_COL[slot] + row).setValue(data.weight);
    if (data.reps != null) sh.getRange(SLOT_REPS_COL[slot] + row).setValue(data.reps);
    if (data.rir != null) sh.getRange(SLOT_RIR_COL[slot] + row).setValue(data.rir);
    weekWritten = true;
  }

  // --- Sets Extended append (all formats) ---
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var ext = ss.getSheetByName('Sets Extended');
    if (ext) {
      ext.appendRow([
        new Date().toISOString(),               // A: timestamp
        week,                                    // B: week
        sessionDay,                              // C: sessionDay
        slot,                                    // D: exerciseSlot
        setNum,                                  // E: setNumber
        data.exerciseName || '',                 // F: exerciseName
        format,                                  // G: format
        data.weight != null ? data.weight : '',  // H: weight
        data.reps != null ? data.reps : '',      // I: reps
        data.rir != null ? data.rir : '',        // J: rir
        data.e1RM != null ? data.e1RM : '',      // K: e1RM
        data.totalReps != null ? data.totalReps : '',       // L: totalReps
        data.durationMinutes != null ? data.durationMinutes : '', // M: durationMinutes
        data.jumpHeight != null ? data.jumpHeight : '',     // N: jumpHeight
        data.jumpDistance != null ? data.jumpDistance : '',  // O: jumpDistance
        data.isTopSet != null ? data.isTopSet : '',         // P: isTopSet
        data.isBackOff != null ? data.isBackOff : '',       // Q: isBackOff
        data.completedAt || ''                               // R: completedAt
      ]);
      extendedWritten = true;
    } else {
      extendedError = "Sheet 'Sets Extended' not found — run setupSheets()";
    }
  } catch (err) {
    extendedError = err.message;
  }

  return {
    ok: true,
    weekWritten: weekWritten,
    extendedWritten: extendedWritten,
    extendedError: extendedError
  };
}

// ============================================================
//  writeUserSession  (Tuesday / Thursday user-configured sessions)
// ============================================================

function writeUserSession(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName('User Sessions');
  if (!sh) {
    return { ok: false, error: "Sheet 'User Sessions' missing — run setupSheets() once" };
  }

  sh.appendRow([
    new Date().toISOString(),                                // A: timestamp
    data.week,                                               // B: week
    data.sessionDay,                                         // C: sessionDay
    JSON.stringify(data.configuration || {}),                 // D: configurationJson
    JSON.stringify(data.sets || []),                          // E: setsJson
    data.completedAt || '',                                   // F: completedAt
    data.notes || ''                                         // G: notes
  ]);

  return { ok: true, action: 'writeUserSession', week: data.week, sessionDay: data.sessionDay };
}

// ============================================================
//  readSession  (untouched)
// ============================================================

function readSession(data) {
  var sh = getSheet(data.week);
  var day = data.sessionDay;
  var base = SESSION_ROW[day];
  if (!base) throw new Error('Invalid sessionDay: ' + day);

  var result = {};
  for (var slot = 1; slot <= 4; slot++) {
    var exoName = sh.getRange(SLOT_EXO_COL[slot] + base).getValue();
    var sets = [];
    for (var s = 0; s < 6; s++) {
      var row = base + s;
      var w = sh.getRange(SLOT_WEIGHT_COL[slot] + row).getValue();
      var r = sh.getRange(SLOT_REPS_COL[slot] + row).getValue();
      var ri = sh.getRange(SLOT_RIR_COL[slot] + row).getValue();
      if (w || r || ri) {
        sets.push({ set: s + 1, weight: w, reps: r, rir: ri });
      }
    }
    result[slot] = { exerciseName: exoName, sets: sets };
  }
  return { ok: true, sessionDay: day, week: data.week, slots: result };
}

// ============================================================
//  readWeek  (untouched)
// ============================================================

function readWeek(data) {
  var days = ['Monday', 'Wednesday', 'Friday', 'Saturday'];
  var result = {};
  for (var i = 0; i < days.length; i++) {
    var resp = readSession({ week: data.week, sessionDay: days[i] });
    result[days[i]] = resp.slots;
  }
  return { ok: true, week: data.week, sessions: result };
}
