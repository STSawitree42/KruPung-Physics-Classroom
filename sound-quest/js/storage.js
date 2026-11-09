/* =========================================================
   Data layer — แยกจากตัวเกม เพื่อเปลี่ยนไปใช้ฐานข้อมูลจริงได้ภายหลัง
   ทุกส่วนของเกมเรียกผ่าน SQ.store เท่านั้น
   ========================================================= */
(function (SQ) {
  'use strict';
  const KEY = 'soundquest.v1';
  const EVENTS_KEY = 'soundquest.v1.events';

  function read(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /* ---------- Adapter 1: localStorage (prototype) ---------- */
  const LocalAdapter = {
    load() { return read(KEY, { currentId: null, profiles: {}, settings: { sfx: true } }); },
    save(db) { return write(KEY, db); },
    logEvent(evt) { const ev = read(EVENTS_KEY, []); ev.push(evt); write(EVENTS_KEY, ev.slice(-500)); }
  };

  /* ---------- Adapter 2: remote API (ready for later) ----------
     ส่งข้อมูลเป็น JSON ด้วย POST ไปที่ SQ.config.apiBaseUrl
       { action: 'saveProfile', profile }   — เมื่อความคืบหน้าเปลี่ยน
       { action: 'logEvent',   event }      — ทุกครั้งที่ส่งคำตอบ / จบด่าน
     ฝั่งเซิร์ฟเวอร์ (เช่น Google Apps Script) บันทึกลงตาราง แล้วตอบ {ok:true}
     localStorage ยังเป็นแหล่งข้อมูลหลัก เกมจึงเล่นต่อได้แม้ออฟไลน์ */
  const RemoteAdapter = {
    post(body) {
      const url = SQ.config.apiBaseUrl; if (!url) return;
      try {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), keepalive: true })
          .catch(() => {});
      } catch (e) { /* offline: ignore */ }
    },
    saveProfile(p) { this.post({ action: 'saveProfile', profile: p }); },
    logEvent(e) { this.post({ action: 'logEvent', event: e }); }
  };

  const remote = () => SQ.config.storage === 'remote' && SQ.config.apiBaseUrl;
  let db = null;

  SQ.store = {
    init() { db = LocalAdapter.load(); db.profiles = db.profiles || {}; db.settings = db.settings || { sfx: true }; return this; },
    list() { return Object.values(db.profiles).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); },
    get(id) { return db.profiles[id] || null; },
    current() { return db.currentId ? db.profiles[db.currentId] || null : null; },
    setCurrent(id) { db.currentId = id; LocalAdapter.save(db); },
    save(profile) {
      profile.updatedAt = Date.now();
      db.profiles[profile.id] = profile; LocalAdapter.save(db);
      if (remote()) RemoteAdapter.saveProfile(profile);
    },
    remove(id) { delete db.profiles[id]; if (db.currentId === id) db.currentId = null; LocalAdapter.save(db); },
    settings() { return db.settings; },
    saveSettings(s) { db.settings = Object.assign(db.settings, s); LocalAdapter.save(db); },
    logEvent(evt) { evt.at = new Date().toISOString(); LocalAdapter.logEvent(evt); if (remote()) RemoteAdapter.logEvent(evt); },
    events() { return read(EVENTS_KEY, []); }
  };
})(window.SQ);
