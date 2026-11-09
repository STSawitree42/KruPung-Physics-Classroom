/* =========================================================
   Data layer — แยกจากตัวเกม ทุกส่วนของเกมอ่าน/เขียนข้อมูลผ่าน SQ.store เท่านั้น
   มี 2 โหมด
   1) local  : เก็บใน localStorage ของอุปกรณ์ (ค่าเริ่มต้น)
   2) school : ล็อกอินด้วยเลขประจำตัว + PIN ของระบบห้องเรียนออนไลน์ (Google Apps Script)
               แล้วบันทึกความคืบหน้าเป็นรายบุคคลบน Google Sheets ของครู
               เปิดใช้โดยใส่ URL เว็บแอปใน SQ.config.school.apiUrl
   ========================================================= */
(function (SQ) {
  'use strict';
  const KEY = 'soundquest.v1';
  const EVENTS_KEY = 'soundquest.v1.events';
  const SCHOOL_KEY = 'soundquest.school.session';   // sessionStorage: หายเมื่อปิดแท็บ (ปลอดภัยกับเครื่องที่ใช้ร่วมกัน)

  function read(st, k, d) { try { const v = st.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(st, k, v) { try { st.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  const LS = (() => { try { return window.localStorage; } catch (e) { return null; } })();
  const SS = (() => { try { return window.sessionStorage; } catch (e) { return null; } })();
  const safe = st => st || { getItem: () => null, setItem: () => {}, removeItem: () => {} };

  let db = null;
  const schoolUrl = () => (SQ.config.school && SQ.config.school.apiUrl || '').trim();

  /* ---------------- School (Apps Script) client ---------------- */
  const school = {
    session: null,          // { token, student, profile, dirty, events: [] }
    status: 'idle',         // idle | saving | saved | offline | expired
    listeners: [],
    timer: null, inflight: false, retryMs: 3000,

    async call(body) {
      const res = await fetch(schoolUrl(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
      if (!res.ok) throw new Error('NETWORK ' + res.status);
      const data = await res.json();
      if (!data.ok) { const e = new Error(data.error || 'ERROR'); e.server = true; throw e; }
      return data;
    },
    persist() { write(safe(SS), SCHOOL_KEY, this.session); },
    setStatus(s) { this.status = s; this.listeners.forEach(fn => { try { fn(s); } catch (e) {} }); },
    schedule(ms) { clearTimeout(this.timer); this.timer = setTimeout(() => this.sync(), ms == null ? 1200 : ms); },
    async sync() {
      const s = this.session;
      if (!s || this.inflight || this.status === 'expired') return;
      if (!s.dirty && !s.events.length) { if (this.status !== 'offline') this.setStatus('saved'); return; }
      this.inflight = true; this.setStatus('saving');
      const events = s.events.slice(0, 100);
      const sentProfileAt = s.profile && s.profile.updatedAt;
      try {
        await this.call({ action: 'sync', token: s.token, profile: s.dirty ? s.profile : null, events });
        s.events.splice(0, events.length);
        if (s.profile && s.profile.updatedAt === sentProfileAt) s.dirty = false;
        this.persist(); this.retryMs = 3000;
        this.setStatus(s.dirty || s.events.length ? 'saving' : 'saved');
        if (s.dirty || s.events.length) this.schedule(300);
      } catch (e) {
        if (e.server && /SESSION_EXPIRED/.test(e.message)) this.setStatus('expired');
        else { this.setStatus('offline'); this.schedule(this.retryMs); this.retryMs = Math.min(60000, this.retryMs * 2); }
      } finally { this.inflight = false; }
    },
    /* last-chance save when the tab is hidden/closed */
    beacon() {
      const s = this.session;
      if (!s || (!s.dirty && !s.events.length) || !navigator.sendBeacon) return;
      try {
        navigator.sendBeacon(schoolUrl(), new Blob([JSON.stringify({ action: 'sync', token: s.token, profile: s.dirty ? s.profile : null, events: s.events.slice(0, 100) })], { type: 'text/plain;charset=utf-8' }));
      } catch (e) {}
    }
  };

  SQ.store = {
    init() {
      db = read(safe(LS), KEY, { currentId: null, profiles: {}, settings: { sfx: true } });
      db.profiles = db.profiles || {}; db.settings = db.settings || { sfx: true };
      if (this.isSchool()) {
        school.session = read(safe(SS), SCHOOL_KEY, null);
        if (school.session) { school.session.events = school.session.events || []; school.schedule(500); }
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') school.beacon(); });
        window.addEventListener('pagehide', () => school.beacon());
      }
      return this;
    },
    isSchool() { return !!schoolUrl(); },

    /* ----- profiles ----- */
    list() { return this.isSchool() ? [] : Object.values(db.profiles).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); },
    get(id) { return this.isSchool() ? (school.session && school.session.profile && school.session.profile.id === id ? school.session.profile : null) : db.profiles[id] || null; },
    current() {
      if (this.isSchool()) return school.session && school.session.profile || null;
      return db.currentId ? db.profiles[db.currentId] || null : null;
    },
    setCurrent(id) { if (!this.isSchool()) { db.currentId = id; write(safe(LS), KEY, db); } },
    save(profile) {
      profile.updatedAt = Date.now();
      if (this.isSchool()) {
        if (!school.session) return;
        school.session.profile = profile; school.session.dirty = true; school.persist(); school.schedule();
        return;
      }
      db.profiles[profile.id] = profile; write(safe(LS), KEY, db);
    },
    remove(id) { if (this.isSchool()) return; delete db.profiles[id]; if (db.currentId === id) db.currentId = null; write(safe(LS), KEY, db); },

    /* ----- settings (always per device) ----- */
    settings() { return db.settings; },
    saveSettings(s) { db.settings = Object.assign(db.settings, s); write(safe(LS), KEY, db); },

    /* ----- answer / level logs ----- */
    logEvent(evt) {
      evt.at = new Date().toISOString();
      if (this.isSchool()) { if (school.session) { school.session.events.push(evt); school.persist(); school.schedule(); } return; }
      const ev = read(safe(LS), EVENTS_KEY, []); ev.push(evt); write(safe(LS), EVENTS_KEY, ev.slice(-500));
    },
    events() { return read(safe(LS), EVENTS_KEY, []); },

    /* ----- school mode only ----- */
    student() { return school.session && school.session.student || null; },
    async login(studentId, pin) {
      const data = await school.call({ action: 'login', studentId: String(studentId).trim(), pin: String(pin).trim() });
      const prev = school.session;
      // keep unsent progress if the same student logs in again after the session expired
      const keep = prev && prev.student && prev.student.studentId === data.student.studentId && (prev.dirty || prev.events.length);
      school.session = {
        token: data.token, student: data.student,
        profile: keep && prev.profile ? prev.profile : data.profile,
        dirty: !!(keep && prev.dirty), events: keep ? prev.events : []
      };
      school.persist(); school.setStatus('saved');
      if (keep) school.schedule(100);
      return { student: data.student, profile: school.session.profile };
    },
    async logout() {
      const s = school.session;
      if (s) {
        clearTimeout(school.timer);
        if (s.dirty || s.events.length) { try { await school.sync(); } catch (e) {} }
        try { await school.call({ action: 'logout', token: s.token }); } catch (e) {}
      }
      school.session = null; safe(SS).removeItem(SCHOOL_KEY); school.setStatus('idle');
    },
    pending() { const s = school.session; return !!(s && (s.dirty || s.events.length)); },
    syncNow() { return school.sync(); },
    syncStatus() { return school.status; },
    onSyncStatus(fn) { school.listeners.push(fn); }
  };
})(window.SQ);
