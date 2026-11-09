/**
 * ============================================================
 *  SOUND QUEST × ระบบห้องเรียนออนไลน์
 *  ไฟล์เสริม: เพิ่มเป็นไฟล์ใหม่ชื่อ "SoundQuest.gs" ในโปรเจกต์ Apps Script เดิม
 *  (ไม่ต้องแก้ Code.gs เดิม — ไฟล์นี้ใช้ฟังก์ชัน ss_, str_, idKey_, sameId_,
 *   findStudent_ และ withLock_ จาก Code.gs)
 * ============================================================
 *  วิธีติดตั้ง
 *  1) ในโปรเจกต์ Apps Script เดิม กด + ข้างคำว่า "ไฟล์" > สคริปต์ > ตั้งชื่อ SoundQuest
 *     แล้ววางโค้ดทั้งหมดนี้ > บันทึก
 *  2) เลือกฟังก์ชัน sqSetup แล้วกด "เรียกใช้"
 *     - สร้างชีต SQ_Pins, SQ_Progress, SQ_Log
 *     - สร้างรหัส PIN 6 หลักให้นักเรียนทุกคนในชีต Students (ดู/พิมพ์แจกได้ที่ชีต SQ_Pins)
 *  3) การทำให้ใช้งานได้ > จัดการการทำให้ใช้งานได้ > ✏️ แก้ไข > เวอร์ชัน: "เวอร์ชันใหม่" > ทำให้ใช้งานได้
 *     (URL เว็บแอปเดิมไม่เปลี่ยน)
 *  4) นำ URL เว็บแอป (ลงท้ายด้วย /exec) ไปใส่ใน sound-quest/js/config.js ที่ school.apiUrl
 *
 *  จำกัดระดับชั้น: แก้ SQ_ALLOWED_CLASSES ด้านล่าง (ค่าเริ่มต้น เฉพาะ ม.5)
 *  ภายหลังมีนักเรียนใหม่: เพิ่มในระบบตามปกติ แล้วเรียกใช้ sqGeneratePins อีกครั้ง
 *  (สร้าง PIN ให้เฉพาะคนที่ยังไม่มี) · เปลี่ยน PIN รายคน: แก้ในชีต SQ_Pins ได้เลย
 * ============================================================
 */

var SQ_DEF = {
  PINS: { name: 'SQ_Pins', headers: ['studentId', 'name', 'classroom', 'number', 'pin', 'updatedAt'], numeric: [] },
  PROGRESS: {
    name: 'SQ_Progress',
    headers: ['studentId', 'name', 'classroom', 'number', 'avatar', 'xp', 'levelsPassed', 'gold', 'silver', 'bronze', 'accuracy', 'hints', 'badges', 'lastPlayed', 'profileJson'],
    numeric: ['xp', 'levelsPassed', 'gold', 'silver', 'bronze', 'accuracy', 'hints', 'badges']
  },
  LOG: {
    name: 'SQ_Log',
    headers: ['time', 'studentId', 'name', 'classroom', 'type', 'level', 'task', 'kind', 'ok', 'xp', 'hint', 'practice', 'given'],
    numeric: ['level', 'xp']
  }
};
var SQ_TOKEN_SECONDS = 6 * 3600;   // อายุการเข้าสู่ระบบในเกม
var SQ_MAX_FAILS = 5;              // ใส่ PIN ผิดได้กี่ครั้ง
var SQ_LOCK_SECONDS = 10 * 60;     // ล็อกชั่วคราวหลังใส่ผิดครบ
var SQ_MAX_PROFILE = 45000;        // ขนาดข้อมูลสูงสุดต่อคน (ตัวอักษร)

/* ระดับชั้นที่เล่นเกมได้: ตรวจจากคอลัมน์ classroom ในชีต Students
   ห้องที่ "ขึ้นต้น" ด้วยค่าในรายการนี้จะเล่นได้ (ไม่สนใจช่องว่างและจุด เช่น "ม.5/1", "ม. 5/2", "ม5/3")
   เพิ่มระดับชั้นได้ เช่น ['ม.5', 'ม.6'] · เว้นเป็น [] = ทุกระดับชั้นเล่นได้ */
var SQ_ALLOWED_CLASSES = ['ม.5'];

/* ======================= รับคำขอจากเกม ======================= */

function doPost(e) {
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    out = sqHandle_(req);
  } catch (err) {
    out = { ok: false, error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function sqHandle_(req) {
  switch (req.action) {
    case 'login': return sqLogin_(req.studentId, req.pin);
    case 'sync': return sqSync_(req.token, req.profile, req.events);
    case 'logout': CacheService.getScriptCache().remove('SQ_' + str_(req.token)); return { ok: true };
    case 'ping': return { ok: true, app: 'soundquest' };
    default: throw new Error('คำสั่งไม่ถูกต้อง');
  }
}

/* ======================= เข้าสู่ระบบ ======================= */

function sqLogin_(studentId, pin) {
  var cache = CacheService.getScriptCache();
  var failKey = 'SQF_' + idKey_(studentId);
  var fails = Number(cache.get(failKey) || 0);
  if (fails >= SQ_MAX_FAILS) throw new Error('ใส่รหัสผิดหลายครั้ง กรุณารอ ' + Math.round(SQ_LOCK_SECONDS / 60) + ' นาทีแล้วลองใหม่');
  var bad = function () {
    cache.put(failKey, String(fails + 1), SQ_LOCK_SECONDS);
    throw new Error('เลขประจำตัวหรือรหัส PIN ไม่ถูกต้อง');
  };
  if (!str_(studentId) || !str_(pin)) throw new Error('กรุณากรอกเลขประจำตัวและรหัส PIN');
  var st;
  try { st = findStudent_(studentId); } catch (e) { bad(); }
  if (!sqAllowed_(st)) throw new Error('เกมนี้เปิดให้เฉพาะนักเรียน ' + SQ_ALLOWED_CLASSES.join(', ') + ' หากเลขประจำตัวถูกต้องแต่เข้าไม่ได้ กรุณาติดต่อครู');
  var pinRow = sqRead_(SQ_DEF.PINS).filter(function (r) { return sameId_(r.studentId, st.studentId); })[0];
  if (!pinRow || !str_(pinRow.pin)) throw new Error('ยังไม่มีรหัส PIN สำหรับเลขประจำตัวนี้ กรุณาติดต่อครู');
  if (str_(pin) !== str_(pinRow.pin)) bad();
  cache.remove(failKey);

  var sid = str_(st.studentId);
  var token = Utilities.getUuid();
  cache.put('SQ_' + token, sid, SQ_TOKEN_SECONDS);

  var prog = sqRead_(SQ_DEF.PROGRESS).filter(function (r) { return sameId_(r.studentId, sid); })[0];
  var profile = null;
  if (prog && str_(prog.profileJson)) { try { profile = JSON.parse(prog.profileJson); } catch (e) { profile = null; } }
  return {
    ok: true, token: token,
    student: { studentId: sid, name: str_(st.name), classroom: str_(st.classroom), number: str_(st.number) },
    profile: profile
  };
}

function sqAuth_(token) {
  var sid = token ? CacheService.getScriptCache().get('SQ_' + str_(token)) : null;
  if (!sid) throw new Error('SESSION_EXPIRED');
  var st = findStudent_(sid);
  if (!sqAllowed_(st)) throw new Error('SESSION_EXPIRED');
  return st;
}

/** นักเรียนอยู่ในระดับชั้นที่เปิดให้เล่นหรือไม่ */
function sqAllowed_(st) {
  if (!SQ_ALLOWED_CLASSES || !SQ_ALLOWED_CLASSES.length) return true;
  var norm = function (v) { return str_(v).replace(/[\s.]/g, '').toLowerCase(); };
  var room = norm(st && st.classroom);
  return SQ_ALLOWED_CLASSES.some(function (c) {
    var p = norm(c);
    // "ม5" ต้องตามด้วย / หรือจบคำ จึงไม่ปนกับ "ม51"
    return room === p || room.indexOf(p + '/') === 0;
  });
}

/* ======================= บันทึกความคืบหน้า ======================= */

function sqSync_(token, profile, events) {
  var st = sqAuth_(token);
  var sid = str_(st.studentId);
  return withLock_(function () {
    var saved = false, logged = 0;
    if (profile && typeof profile === 'object') {
      profile.studentId = sid;                    // ผูกข้อมูลกับนักเรียนที่ล็อกอินเท่านั้น
      var json = JSON.stringify(profile);
      if (json.length > SQ_MAX_PROFILE) throw new Error('ข้อมูลความคืบหน้ามีขนาดใหญ่เกินไป');
      var sum = sqSummary_(profile);
      var row = {
        studentId: sid, name: str_(st.name), classroom: str_(st.classroom), number: str_(st.number),
        avatar: str_(profile.avatar), xp: sum.xp, levelsPassed: sum.levelsPassed,
        gold: sum.gold, silver: sum.silver, bronze: sum.bronze, accuracy: sum.accuracy,
        hints: sum.hints, badges: sum.badges, lastPlayed: new Date().toISOString(), profileJson: json
      };
      var ex = sqRead_(SQ_DEF.PROGRESS).filter(function (r) { return sameId_(r.studentId, sid); })[0];
      sqWrite_(SQ_DEF.PROGRESS, ex ? ex._row : null, row);
      saved = true;
    }
    if (events && events.length) {
      var rows = events.slice(0, 100).map(function (ev) {
        ev = ev || {};
        return {
          time: str_(ev.at) || new Date().toISOString(), studentId: sid, name: str_(st.name), classroom: str_(st.classroom),
          type: str_(ev.type), level: Number(ev.level) || '', task: str_(ev.task), kind: str_(ev.kind),
          ok: ev.ok === undefined ? '' : (ev.ok ? 'TRUE' : 'FALSE'), xp: Number(ev.xp) || 0,
          hint: ev.hint ? 'TRUE' : '', practice: ev.practice ? 'TRUE' : '', given: str_(ev.given).slice(0, 200)
        };
      });
      sqAppend_(SQ_DEF.LOG, rows);
      logged = rows.length;
    }
    return { ok: true, saved: saved, logged: logged, at: new Date().toISOString() };
  });
}

function sqSummary_(p) {
  var levels = p.levels || {}, tasks = p.tasks || {};
  var s = { xp: Number(p.xp) || 0, levelsPassed: 0, gold: 0, silver: 0, bronze: 0, accuracy: 0, hints: 0, badges: (p.badges || []).length };
  Object.keys(levels).forEach(function (k) {
    var l = levels[k] || {};
    if (l.passed) s.levelsPassed++;
    if (l.medal === 'gold') s.gold++; else if (l.medal === 'silver') s.silver++; else if (l.medal === 'bronze') s.bronze++;
  });
  var done = 0, ok = 0;
  Object.keys(tasks).forEach(function (k) { var t = tasks[k] || {}; if (t.done) { done++; if (t.ok) ok++; } if (t.hint) s.hints++; });
  s.accuracy = done ? Math.round(ok / done * 100) : 0;
  return s;
}

/* ======================= ฟังก์ชันสำหรับครู (เรียกใช้จากหน้า Apps Script) ======================= */

/** ติดตั้งครั้งแรก: สร้างชีตของเกม และสร้าง PIN ให้นักเรียนทุกคน */
function sqSetup() {
  [SQ_DEF.PINS, SQ_DEF.PROGRESS, SQ_DEF.LOG].forEach(sqSheet_);
  var n = sqGeneratePins();
  Logger.log('ติดตั้ง SOUND QUEST เรียบร้อย สร้าง PIN ใหม่ ' + n + ' คน ดูได้ที่ชีต SQ_Pins');
}

/** สร้าง PIN 6 หลักให้นักเรียนที่ยังไม่มี PIN และอัปเดตชื่อ/ห้องให้ตรงกับชีต Students */
function sqGeneratePins() {
  return withLock_(function () {
    var students = read_(SH.STUDENTS);
    var pins = sqRead_(SQ_DEF.PINS);
    var byId = {};
    pins.forEach(function (p) { byId[idKey_(p.studentId)] = p; });
    var created = 0, now = new Date().toISOString();
    students.forEach(function (s) {
      var sid = str_(s.studentId);
      if (!sid || !sqAllowed_(s)) return;          // สร้าง PIN เฉพาะระดับชั้นที่เปิดให้เล่น
      var ex = byId[idKey_(sid)];
      var row = { studentId: sid, name: str_(s.name), classroom: str_(s.classroom), number: str_(s.number),
        pin: ex && str_(ex.pin) ? str_(ex.pin) : sqNewPin_(), updatedAt: ex && str_(ex.pin) ? str_(ex.updatedAt) : now };
      var changed = !ex || !str_(ex.pin) || str_(ex.name) !== row.name || str_(ex.classroom) !== row.classroom || str_(ex.number) !== row.number;
      if (!changed) return;
      if (!ex || !str_(ex.pin)) created++;
      sqWrite_(SQ_DEF.PINS, ex ? ex._row : null, row);
      if (!ex) byId[idKey_(sid)] = row;
    });
    // ลบ PIN ของนักเรียนที่ไม่อยู่ในระดับชั้นที่เปิดให้เล่น หรือไม่มีในชีต Students แล้ว
    var keep = {};
    students.forEach(function (s) { if (str_(s.studentId) && sqAllowed_(s)) keep[idKey_(s.studentId)] = 1; });
    var sh = sqSheet_(SQ_DEF.PINS);
    pins.filter(function (p) { return !keep[idKey_(p.studentId)]; })
      .map(function (p) { return p._row; }).sort(function (a, b) { return b - a; })
      .forEach(function (r) { sh.deleteRow(r); });
    return created;
  });
}

/** เปลี่ยน PIN ของนักเรียนหนึ่งคนเป็นเลขสุ่มใหม่ เช่น sqResetPin('10001') */
function sqResetPin(studentId) {
  var p = sqRead_(SQ_DEF.PINS).filter(function (r) { return sameId_(r.studentId, studentId); })[0];
  if (!p) throw new Error('ไม่พบนักเรียนในชีต SQ_Pins');
  p.pin = sqNewPin_(); p.updatedAt = new Date().toISOString();
  sqWrite_(SQ_DEF.PINS, p._row, p);
  Logger.log('PIN ใหม่ของ ' + p.studentId + ' คือ ' + p.pin);
}

function sqNewPin_() {
  var s = '';
  for (var i = 0; i < 6; i++) s += Math.floor(Math.random() * 10);
  return s;
}

/* ======================= ตัวช่วยจัดการชีตของเกม ======================= */

function sqSheet_(def) {
  var ss = ss_();
  var sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]).setFontWeight('bold').setBackground('#cffafe');
    sh.setFrozenRows(1);
    def.headers.forEach(function (h, i) {
      if (def.numeric.indexOf(h) < 0) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@');
    });
  }
  return sh;
}

function sqRead_(def) {
  var sh = sqSheet_(def);
  var v = sh.getDataRange().getValues();
  var h = v.shift() || [];
  return v.map(function (r, i) {
    var o = { _row: i + 2 };
    h.forEach(function (k, j) { var x = r[j]; o[k] = x instanceof Date ? x.toISOString() : x; });
    return o;
  }).filter(function (o) { return str_(o[h[0]]) !== ''; });
}

function sqCells_(def, obj) {
  return def.headers.map(function (k) {
    var v = obj[k];
    if (v === undefined || v === null) return '';
    return def.numeric.indexOf(k) >= 0 && v !== '' ? Number(v) || 0 : String(v);
  });
}

function sqTextFormat_(sh, def, row, count) {
  def.headers.forEach(function (h, i) {
    if (def.numeric.indexOf(h) < 0) sh.getRange(row, i + 1, count || 1, 1).setNumberFormat('@');
  });
}

function sqWrite_(def, row, obj) {
  var sh = sqSheet_(def);
  var r = row || sh.getLastRow() + 1;
  sqTextFormat_(sh, def, r, 1);
  sh.getRange(r, 1, 1, def.headers.length).setValues([sqCells_(def, obj)]);
}

function sqAppend_(def, objs) {
  if (!objs.length) return;
  var sh = sqSheet_(def);
  var r = sh.getLastRow() + 1;
  sqTextFormat_(sh, def, r, objs.length);
  sh.getRange(r, 1, objs.length, def.headers.length).setValues(objs.map(function (o) { return sqCells_(def, o); }));
}
