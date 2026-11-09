/* =========================================================
   SOUND QUEST — Game engine
   - Profiles, avatars, XP, ranks, medals, badges
   - Level map + unlocking
   - Task runner: multiple choice, numeric input, interactive missions
   - Hints, answer checking, anti double-submit
   ========================================================= */
(function (SQ) {
  'use strict';
  const { h, $, $$, shuffle, fmt, parseNum } = SQ.lib;
  const CFG = SQ.config;
  const XP = CFG.xp;

  /* ---------------- Static data ---------------- */
  const AVATARS = [
    { id: 'a1', emoji: '👩‍🔬', name: 'ดร.คลื่นเสียง' },
    { id: 'a2', emoji: '👨‍🔬', name: 'ศ.ความถี่' },
    { id: 'a3', emoji: '🧑‍🚀', name: 'นักบินอะคูสติก' },
    { id: 'a4', emoji: '🧑‍💻', name: 'วิศวกรเสียง' },
    { id: 'a5', emoji: '🦉', name: 'นกฮูกนักฟัง' },
    { id: 'a6', emoji: '🤖', name: 'หุ่นยนต์โซนาร์' }
  ];
  const RANKS = [
    { xp: 0, name: 'นักเรียนฝึกหัด' },
    { xp: 2000, name: 'ผู้ช่วยนักวิจัย' },
    { xp: 5000, name: 'นักวิทยาศาสตร์เสียง' },
    { xp: 9000, name: 'ผู้เชี่ยวชาญคลื่น' },
    { xp: 13000, name: 'ปรมาจารย์แห่งเสียง' }
  ];
  const MEDALS = {
    gold: { icon: '🥇', name: 'เหรียญทอง', rule: 'ถูก ≥ 90% และไม่ใช้คำใบ้' },
    silver: { icon: '🥈', name: 'เหรียญเงิน', rule: 'ถูก ≥ 75%' },
    bronze: { icon: '🥉', name: 'เหรียญทองแดง', rule: 'ผ่านด่าน (ถูก ≥ 60%)' }
  };
  const MEDAL_RANK = { gold: 3, silver: 2, bronze: 1 };
  const BADGES = [
    { id: 'first', icon: '🚀', name: 'ก้าวแรกสู่โลกเสียง', desc: 'ผ่าน LEVEL 1', test: p => passed(p, 1) },
    { id: 'nohint', icon: '🧠', name: 'ไม่ง้อคำใบ้', desc: 'ผ่านด่านใดก็ได้โดยไม่ใช้คำใบ้', test: p => Object.values(p.levels).some(l => l.bonus) },
    { id: 'perfect', icon: '💯', name: 'สมบูรณ์แบบ', desc: 'ทำถูก 100% ในด่านเดียว', test: p => Object.values(p.levels).some(l => l.bestPct >= 1) },
    { id: 'calc', icon: '🧮', name: 'นักคำนวณ', desc: 'แก้โจทย์คำนวณถูก 10 ข้อ', test: p => p.stats.numOk >= 10 },
    { id: 'lab', icon: '🧪', name: 'นักทดลอง', desc: 'ทำภารกิจทดลองสำเร็จ 5 ภารกิจ', test: p => p.stats.missionOk >= 5 },
    { id: 'gold3', icon: '🏅', name: 'นักล่าเหรียญทอง', desc: 'ได้เหรียญทอง 3 ด่าน', test: p => Object.values(p.levels).filter(l => l.medal === 'gold').length >= 3 },
    { id: 'half', icon: '🌗', name: 'ครึ่งทางแห่งเสียง', desc: 'ผ่าน 4 ด่าน', test: p => countPassed(p) >= 4 },
    { id: 'master', icon: '👑', name: 'ปรมาจารย์แห่งเสียง', desc: 'ผ่านครบทั้ง 8 ด่าน', test: p => countPassed(p) >= 8 }
  ];
  const TOTAL_LEVELS = 8;
  /* Planned level list — shown on the map even before a level's script is loaded */
  const PLAN = [
    { id: 1, code: 'LEVEL 1', title: 'Sound Origin', th: 'กำเนิดเสียง', icon: '🌊' },
    { id: 2, code: 'LEVEL 2', title: 'Sound Speed', th: 'อัตราเร็วเสียง', icon: '⚡' },
    { id: 3, code: 'LEVEL 3', title: 'Sound Properties', th: 'สมบัติของเสียง', icon: '🔀' },
    { id: 4, code: 'LEVEL 4', title: 'Sound Intensity', th: 'ความเข้มเสียง', icon: '📢' },
    { id: 5, code: 'LEVEL 5', title: 'Pitch and Timbre', th: 'ระดับและคุณภาพเสียง', icon: '🎵' },
    { id: 6, code: 'LEVEL 6', title: 'Resonance Challenge', th: 'การสั่นพ้อง', icon: '🎺' },
    { id: 7, code: 'LEVEL 7', title: 'Beat Frequency', th: 'บีตส์', icon: '〰️' },
    { id: 8, code: 'LEVEL 8', title: 'Doppler Mission', th: 'ดอปเพลอร์', icon: '🚑' }
  ];

  /* ---------------- Level registry ---------------- */
  SQ.levels = {};
  const DIFF_ORDER = { 'ง่าย': 0, 'ปานกลาง': 1, 'ยาก': 2 };
  SQ.registerLevel = function (lvl) {
    lvl.questions.forEach(q => {
      if (q.points == null) q.points = q.type === 'num' ? XP.num : XP.mcq;
      q.kind = q.type;
    });
    (lvl.missions || []).forEach(m => { m.type = 'mission'; m.kind = 'mission'; if (m.points == null) m.points = XP.mission; });
    SQ.levels[lvl.id] = lvl;
  };

  /* ---------------- Helpers ---------------- */
  let P = null;          // current profile
  let run = null;        // current level run
  const main = () => $('#main');
  function passed(p, id) { return !!(p.levels[id] && p.levels[id].passed); }
  function countPassed(p) { return Object.values(p.levels).filter(l => l.passed).length; }
  function lvState(id) { return P.levels[id] || (P.levels[id] = { passed: false, bestPct: 0, medal: null, plays: 0, bonus: false }); }
  function isUnlocked(id) { return id === 1 || passed(P, id - 1); }
  function rankOf(xp) { let r = RANKS[0], next = null; for (let i = 0; i < RANKS.length; i++) { if (xp >= RANKS[i].xp) { r = RANKS[i]; next = RANKS[i + 1] || null; } } return { r, next }; }
  function avatarOf(id) { return AVATARS.find(a => a.id === id) || AVATARS[0]; }
  function medalCount(p) { const c = { gold: 0, silver: 0, bronze: 0 }; Object.values(p.levels).forEach(l => { if (l.medal) c[l.medal]++; }); return c; }
  function diffClass(d) { return d === 'ง่าย' ? 'easy' : d === 'ยาก' ? 'hard' : 'mid'; }
  function taskRec(id) { return P.tasks[id] || (P.tasks[id] = { done: false, ok: false, xp: 0, hint: false, attempts: 0 }); }

  function newProfile(name, avatar) {
    return {
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, avatar, createdAt: new Date().toISOString(), xp: 0,
      levels: {}, tasks: {}, badges: [],
      stats: { answered: 0, correct: 0, numOk: 0, missionOk: 0, hints: 0 }
    };
  }
  function save() { SQ.store.save(P); renderTopbar(); }

  /* ---------------- UI primitives ---------------- */
  function toast(msg, cls) {
    const t = h('div', { class: 'toast ' + (cls || ''), text: msg });
    $('#toasts').append(t); setTimeout(() => t.remove(), 3800);
  }
  function xpPop(amount, anchor) {
    if (!amount) return;
    const r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    const el = h('div', { class: 'xp-pop', text: '+' + amount + ' XP', style: { left: (r.left + r.width / 2) + 'px', top: r.top + 'px' } });
    document.body.append(el); setTimeout(() => el.remove(), 1300);
  }
  function openModal(content) {
    const box = $('#modalBox'); box.replaceChildren(content);
    $('#modal').hidden = false;
    const f = box.querySelector('button,input'); if (f) f.focus();
  }
  function closeModal() { $('#modal').hidden = true; $('#modalBox').replaceChildren(); }
  function confirmBox(title, text, okLabel, onOk, danger) {
    openModal(h('div', { class: 'panel' },
      h('h2', { text: title }), h('p', { class: 'muted', text: text }),
      h('div', { class: 'actions' },
        h('button', { class: 'btn ' + (danger ? 'danger' : ''), text: okLabel, onclick: () => { closeModal(); onOk(); } }),
        h('button', { class: 'btn ghost', text: 'ยกเลิก', onclick: closeModal }))));
  }
  function corners() { return ['tl', 'tr', 'bl', 'br'].map(c => h('span', { class: 'corner ' + c })); }
  function cleanupInst() { if (run && run.inst) { try { run.inst.destroy(); } catch (e) {} run.inst = null; } }
  function setScreen(node) {
    cleanupInst();
    if (SQ._heroAnim) { SQ._heroAnim.destroy(); SQ._heroAnim = null; }
    const m = main(); m.replaceChildren(node); m.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- Top bar ---------------- */
  function renderTopbar() {
    const has = !!P;
    $('#playerChip').hidden = !has; $('#navMap').hidden = !has; $('#navSummary').hidden = !has;
    if (has) {
      const { r, next } = rankOf(P.xp);
      $('#chipAvatar').textContent = avatarOf(P.avatar).emoji;
      $('#chipName').textContent = P.name;
      $('#chipXp').textContent = P.xp.toLocaleString() + ' XP';
      $('#chipRank').textContent = r.name;
      const mc = medalCount(P); $('#chipMedals').textContent = `🥇${mc.gold} 🥈${mc.silver} 🥉${mc.bronze}`;
      const pct = next ? (P.xp - r.xp) / (next.xp - r.xp) : 1;
      $('#chipXpFill').style.width = Math.round(pct * 100) + '%';
    }
    const on = SQ.audio.enabled();
    $('#sfxBtn').firstChild.textContent = on ? '🔊' : '🔇';
    $('#sfxBtn').setAttribute('aria-pressed', String(on));
  }

  /* =========================================================
     HOME
     ========================================================= */
  function renderHome() {
    run = null;
    let chosen = AVATARS[0].id;
    const nameInput = h('input', { class: 'input', id: 'nameInput', maxlength: 30, placeholder: 'เช่น ม.5/2 เลขที่ 15 ด.ญ.ใจดี', autocomplete: 'off' });
    const avatarBtns = AVATARS.map(a => h('button', {
      type: 'button', class: 'avatar-opt', role: 'radio', 'aria-checked': String(a.id === chosen), 'aria-label': a.name,
      onclick: () => { chosen = a.id; avatarBtns.forEach((b, i) => b.setAttribute('aria-checked', String(AVATARS[i].id === chosen))); SQ.sfx.select(); }
    }, h('span', { class: 'avatar', text: a.emoji }), h('small', { text: a.name })));

    function start() {
      const name = nameInput.value.trim();
      if (name.length < 2) { toast('กรุณาตั้งชื่อผู้เล่นอย่างน้อย 2 ตัวอักษร', 'warn'); nameInput.focus(); nameInput.classList.add('shake'); setTimeout(() => nameInput.classList.remove('shake'), 500); return; }
      P = newProfile(name, chosen); SQ.store.save(P); SQ.store.setCurrent(P.id);
      SQ.store.logEvent({ type: 'profile_created', profileId: P.id, name: P.name });
      SQ.sfx.unlock(); toast(`ยินดีต้อนรับ ${P.name}! ภารกิจแรกรออยู่บนแผนที่`); renderTopbar(); renderMap();
    }
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') start(); });

    const profiles = SQ.store.list();
    const heroCanvas = h('canvas', { 'aria-hidden': 'true' });
    const node = h('section', { class: 'screen' },
      h('div', { class: 'panel hero' }, corners(),
        h('div', { class: 'tag violet', text: 'Science Adventure · Physics Puzzle · Interactive Quiz' }),
        h('h1', { class: 'mt', text: 'SOUND QUEST' }),
        h('div', { class: 'sub', text: 'ภารกิจพิชิตโลกแห่งเสียง' }),
        h('p', { text: 'ฟิสิกส์ ม.5 เรื่องเสียง · 8 ด่าน · ทดลองจริง คิดจริง คำนวณจริง' }),
        heroCanvas),
      h('div', { class: 'grid2 mt2' },
        h('div', { class: 'panel tilt' }, corners(),
          h('div', { class: 'panel-title' }, h('span', { text: '🧑‍🔬 ลงทะเบียนนักวิทยาศาสตร์คนใหม่' })),
          h('div', { class: 'field' }, h('label', { for: 'nameInput', text: 'ชื่อผู้เล่น' }), nameInput),
          h('div', { class: 'field mt' }, h('label', { text: 'เลือก Avatar' }), h('div', { class: 'avatar-grid', role: 'radiogroup' }, avatarBtns)),
          h('button', { class: 'btn lg block mt2', text: '🚀 เริ่มภารกิจ', onclick: start })),
        h('div', { class: 'panel' }, corners(),
          profiles.length ? h('div', null,
            h('div', { class: 'panel-title' }, h('span', { text: '💾 เล่นต่อจากที่บันทึกไว้ในเครื่องนี้' })),
            h('div', { class: 'profile-list' }, profiles.slice(0, 6).map(p => h('div', { class: 'profile-item' },
              h('span', { class: 'avatar sm', text: avatarOf(p.avatar).emoji }),
              h('div', { class: 'grow' }, h('b', { text: p.name }), h('small', { class: 'muted', text: `${p.xp.toLocaleString()} XP · ผ่าน ${countPassed(p)}/${TOTAL_LEVELS} ด่าน` })),
              h('button', { class: 'btn sm', text: 'เล่นต่อ', onclick: () => { P = SQ.store.get(p.id); SQ.store.setCurrent(P.id); SQ.sfx.select(); renderTopbar(); renderMap(); } }),
              h('button', { class: 'btn sm danger', text: '✕', title: 'ลบผู้เล่น', 'aria-label': 'ลบผู้เล่น ' + p.name,
                onclick: () => confirmBox('ลบผู้เล่น?', `ข้อมูลความคืบหน้าของ "${p.name}" ในเครื่องนี้จะถูกลบถาวร`, 'ลบ', () => { SQ.store.remove(p.id); if (P && P.id === p.id) P = null; renderTopbar(); renderHome(); }, true) })))))
            : null,
          h('div', { class: profiles.length ? 'mt2' : '' },
            h('div', { class: 'panel-title' }, h('span', { text: '📜 กติกาการเก็บ XP' })),
            h('ul', { class: 'rules' },
              h('li', null, 'ตอบปรนัยถูกครั้งแรก ', h('b', { class: 'xp-badge', text: `+${XP.mcq} XP` })),
              h('li', null, 'แก้โจทย์คำนวณถูก ', h('b', { class: 'xp-badge', text: `+${XP.num} XP` })),
              h('li', null, 'ทำภารกิจทดลองสำเร็จ ', h('b', { class: 'xp-badge', text: `+${XP.mission} XP` })),
              h('li', null, 'ตอบถูกหลังใช้คำใบ้ ', h('b', { class: 'xp-badge', text: `+${XP.withHint} XP` })),
              h('li', null, 'ผ่านด่านโดยไม่ใช้คำใบ้ โบนัส ', h('b', { class: 'xp-badge', text: `+${XP.levelBonus} XP` })),
              h('li', null, 'ทำถูก ', h('b', { text: `≥ ${Math.round(CFG.passRatio * 100)}%` }), ' ของด่าน เพื่อปลดล็อกด่านถัดไป'),
              h('li', null, 'XP ได้จากการตอบครั้งแรกของแต่ละข้อเท่านั้น เล่นซ้ำเพื่อฝึกและอัปเกรดเหรียญได้')))))
    );
    setScreen(node);
    SQ._heroAnim = heroWave(heroCanvas);
  }

  /* Animated neon oscilloscope for the hero */
  function heroWave(cv) {
    const st = SQ.lib.canvas(cv, 120, (x, w, hgt, t) => {
      x.clearRect(0, 0, w, hgt);
      const layers = [{ c: 'rgba(34,227,255,.9)', a: 26, k: 2.2, s: 1.6, wd: 3 }, { c: 'rgba(167,139,250,.6)', a: 18, k: 3.4, s: -1.1, wd: 2 }, { c: 'rgba(0,166,255,.5)', a: 12, k: 5.1, s: 2.3, wd: 1.5 }];
      layers.forEach(L => {
        x.beginPath(); x.strokeStyle = L.c; x.lineWidth = L.wd; x.shadowColor = L.c; x.shadowBlur = 12;
        for (let px = 0; px <= w; px += 3) { const u = px / w; const env = Math.sin(Math.PI * u); const y = hgt / 2 + env * L.a * Math.sin(2 * Math.PI * (L.k * u * 2 - L.s * t * 0.5)); px === 0 ? x.moveTo(px, y) : x.lineTo(px, y); }
        x.stroke();
      });
      x.shadowBlur = 0;
    });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) st.start();
    return st;
  }

  /* =========================================================
     LEVEL MAP
     ========================================================= */
  const NODE_POS = [[110, 470], [330, 420], [560, 470], [800, 410], [890, 230], [660, 170], [420, 220], [180, 140]];
  function renderMap() {
    if (!P) return renderHome();
    run = null;
    const svgNS = 'http://www.w3.org/2000/svg';
    const s = (tag, attrs, ...kids) => { const el = document.createElementNS(svgNS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); kids.forEach(c => el.append(c)); return el; };
    const pts = NODE_POS.map(p => p.join(',')).join(' ');
    const doneCount = countPassed(P);
    const svg = s('svg', { viewBox: '0 0 1000 560', class: 'map-svg', role: 'img', 'aria-label': 'แผนที่ด่าน 8 ด่าน' });
    svg.append(s('polyline', { points: pts, class: 'map-path' }));
    const donePts = NODE_POS.slice(0, Math.min(TOTAL_LEVELS, doneCount + 1)).map(p => p.join(',')).join(' ');
    if (doneCount > 0) svg.append(s('polyline', { points: donePts, class: 'map-path-done' }));
    PLAN.forEach((L, i) => {
      const [x, y] = NODE_POS[i];
      const st = lvState(L.id), unlocked = isUnlocked(L.id), ready = !!SQ.levels[L.id];
      const cls = 'node ' + (!unlocked ? 'locked' : st.passed ? 'done' : 'open');
      const g = s('g', { class: cls, tabindex: unlocked ? '0' : '-1', role: 'button', 'aria-label': `${L.code} ${L.title} ${unlocked ? '' : '(ล็อก)'}` });
      if (unlocked && !st.passed) g.append(s('circle', { cx: x, cy: y, r: 46, class: 'halo' }));
      g.append(s('circle', { cx: x, cy: y, r: 46, class: 'ring' }));
      const ico = s('text', { x, y: y + 11, class: 'ico' }); ico.textContent = !unlocked ? '🔒' : (st.medal ? MEDALS[st.medal].icon : L.icon); g.append(ico);
      const num = s('text', { x, y: y - 56, class: 'num' }); num.textContent = L.code; g.append(num);
      const lbl = s('text', { x, y: y + 76, class: 'lbl' }); lbl.textContent = L.title + (ready ? '' : ' (เร็ว ๆ นี้)'); g.append(lbl);
      const open = () => openLevelIntro(L.id);
      g.addEventListener('click', open); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      svg.append(g);
    });

    const cards = PLAN.map(L => {
      const st = lvState(L.id), unlocked = isUnlocked(L.id), ready = !!SQ.levels[L.id];
      return h('button', { class: 'level-card', disabled: !unlocked, onclick: () => openLevelIntro(L.id) },
        h('span', { class: 'ico', text: L.icon }),
        h('div', null, h('b', { text: `${L.code}: ${L.title}` }), h('small', { text: L.th + (ready ? '' : ' · กำลังพัฒนา') }),
          h('div', null, h('small', { text: st.plays ? `ดีที่สุด ${Math.round(st.bestPct * 100)}%` : (unlocked ? 'พร้อมเล่น' : 'ผ่านด่านก่อนหน้าเพื่อปลดล็อก') }))),
        h('span', { class: 'state', text: !unlocked ? '🔒' : st.medal ? MEDALS[st.medal].icon : st.passed ? '✅' : '▶️' }));
    });

    const { r, next } = rankOf(P.xp);
    const node = h('section', { class: 'screen' },
      h('div', { class: 'row spread' },
        h('div', null, h('div', { class: 'tag', text: 'MISSION MAP' }), h('h2', { class: 'mt', text: '🗺️ แผนที่ภารกิจโลกแห่งเสียง' })),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost sm', text: '📊 สรุปผล', onclick: renderSummary }), h('button', { class: 'btn ghost sm', text: '👤 เปลี่ยนผู้เล่น', onclick: () => { P = null; SQ.store.setCurrent(null); renderTopbar(); renderHome(); } }))),
      h('div', { class: 'panel mt' }, corners(),
        h('div', { class: 'row spread' },
          h('div', { class: 'row' }, h('span', { class: 'avatar', text: avatarOf(P.avatar).emoji }),
            h('div', null, h('b', { text: P.name }), h('div', { class: 'muted small', text: `${r.name}${next ? ' · อีก ' + (next.xp - P.xp).toLocaleString() + ' XP สู่ ' + next.name : ''}` }))),
          h('div', { class: 'readout', text: `${doneCount}/${TOTAL_LEVELS} ด่าน · ${P.xp.toLocaleString()} XP` })),
        h('div', { class: 'progress good mt' }, h('div', { class: 'fill', style: { width: '0%' }, 'data-w': (doneCount / TOTAL_LEVELS * 100) + '%' })),
        h('div', { class: 'map-wrap mt' }, svg)),
      h('div', { class: 'level-cards mt2' }, cards));
    setScreen(node);
    requestAnimationFrame(() => $$('.fill[data-w]').forEach(f => f.style.width = f.dataset.w));
  }

  function openLevelIntro(id) {
    const plan = PLAN[id - 1], L = SQ.levels[id], st = lvState(id);
    if (!isUnlocked(id)) { SQ.sfx.wrong(); toast(`🔒 ต้องผ่าน LEVEL ${id - 1} ก่อน`, 'warn'); return; }
    SQ.sfx.select();
    if (!L) {
      openModal(h('div', { class: 'panel' }, h('h2', { text: `${plan.icon} ${plan.code}: ${plan.title}` }), h('p', { class: 'muted', text: 'ด่านนี้กำลังพัฒนา จะเปิดให้เล่นเร็ว ๆ นี้' }), h('div', { class: 'actions' }, h('button', { class: 'btn', text: 'ตกลง', onclick: closeModal }))));
      return;
    }
    const nQ = L.questions.length, nM = (L.missions || []).length;
    const counts = { mcq: L.questions.filter(q => q.type === 'mcq').length, num: L.questions.filter(q => q.type === 'num').length };
    const maxXp = counts.mcq * XP.mcq + counts.num * XP.num + nM * XP.mission + XP.levelBonus;
    openModal(h('div', { class: 'panel' }, corners(),
      h('div', { class: 'tag', text: plan.code }),
      h('h2', { class: 'mt', text: `${L.icon} ${L.title} — ${L.th}` }),
      h('p', { text: L.objective }),
      h('div', { class: 'kpis' },
        h('div', { class: 'kpi' }, h('b', { text: counts.mcq }), h('span', { text: 'ข้อปรนัย' })),
        h('div', { class: 'kpi' }, h('b', { text: counts.num }), h('span', { text: 'โจทย์คำนวณ' })),
        h('div', { class: 'kpi' }, h('b', { text: nM }), h('span', { text: 'ภารกิจทดลอง' })),
        h('div', { class: 'kpi' }, h('b', { text: maxXp.toLocaleString() }), h('span', { text: 'XP สูงสุด' }))),
      h('p', { class: 'muted small mt', text: `ผ่านด่าน: ทำถูกอย่างน้อย ${Math.ceil((nQ + nM) * CFG.passRatio)} จาก ${nQ + nM} ภารกิจ · ${st.plays ? 'ผลดีที่สุด ' + Math.round(st.bestPct * 100) + '%' + (st.medal ? ' ' + MEDALS[st.medal].icon : '') : 'ยังไม่เคยเล่น'}` }),
      st.plays ? h('p', { class: 'practice-note', text: 'ข้อที่เคยตอบแล้วจะเป็นโหมดฝึกซ้อม (ไม่ได้ XP ซ้ำ) แต่ยังอัปเกรดเหรียญและผ่านด่านได้' }) : null,
      h('div', { class: 'actions' },
        h('button', { class: 'btn lg', text: st.plays ? '🔁 เล่นด่านนี้' : '▶ เริ่มด่าน', onclick: () => { closeModal(); startLevel(id); } }),
        h('button', { class: 'btn ghost', text: 'ปิด', onclick: closeModal }))));
  }

  /* =========================================================
     LEVEL RUN
     ========================================================= */
  function buildTasks(L) {
    const qs = [...L.questions].sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
    const ms = L.missions || [];
    const tasks = [...qs];
    // Missions are placed in the middle and at the end of the level
    if (ms.length === 1) tasks.splice(Math.ceil(qs.length / 2), 0, ms[0]);
    else if (ms.length >= 2) { tasks.splice(Math.ceil(qs.length / 2), 0, ms[0]); tasks.push(...ms.slice(1)); }
    return tasks;
  }

  function startLevel(id) {
    const L = SQ.levels[id];
    run = { id, L, tasks: buildTasks(L), i: 0, results: [], xp: 0, hints: 0, locked: false, hintUsed: false, inst: null, selected: null };
    lvState(id).plays++; save();
    SQ.store.logEvent({ type: 'level_start', profileId: P.id, level: id });
    renderPlay();
  }

  function renderPlay() {
    const L = run.L, t = run.tasks[run.i], n = run.tasks.length;
    run.locked = false; run.hintUsed = false; run.selected = null;
    const rec = taskRec(t.id);
    const practice = rec.done;
    if (rec.hint && !rec.done) run.hintUsed = true;       // hint seen in an earlier, unfinished visit
    const kindLabel = t.kind === 'mcq' ? '🔘 ปรนัย 4 ตัวเลือก' : t.kind === 'num' ? '🧮 โจทย์คำนวณ' : '🧪 ภารกิจทดลอง';

    const els = {};
    els.hint = h('div', { class: 'hint-box', hidden: true });
    els.feedback = h('div', { class: 'feedback', hidden: true });
    els.hintBtn = h('button', { class: 'btn warn sm', text: '💡 ใช้คำใบ้', onclick: () => useHint(t, els) });
    els.submit = h('button', { class: 'btn', text: t.kind === 'mission' ? '🧪 ตรวจผลการทดลอง' : '📤 ส่งคำตอบ', onclick: () => submit(t, els) });
    els.next = h('button', { class: 'btn good', text: run.i === n - 1 ? '🏁 ดูผลด่าน' : 'ภารกิจถัดไป →', hidden: true, onclick: nextTask });
    els.body = h('div');

    if (t.kind === 'mcq') {
      const order = shuffle(t.choices.map((c, i) => i));
      els.choices = order.map((ci, k) => h('button', {
        class: 'choice', role: 'radio', 'aria-checked': 'false', 'data-ci': ci,
        onclick: e => { if (run.locked) return; run.selected = ci; els.choices.forEach(b => b.setAttribute('aria-checked', String(b === e.currentTarget))); SQ.sfx.click(); }
      }, h('span', { class: 'key', text: 'ABCD'[k] }), h('span', { text: t.choices[ci] })));
      els.body.append(h('div', { class: 'choices', role: 'radiogroup' }, els.choices));
    } else if (t.kind === 'num') {
      els.input = h('input', { class: 'input', inputmode: 'decimal', autocomplete: 'off', placeholder: 'พิมพ์คำตอบเป็นตัวเลข', 'aria-label': 'คำตอบ' });
      els.input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(t, els); });
      els.body.append(h('div', { class: 'num-answer' }, els.input, h('span', { class: 'unit', text: t.unit || '' }),
        h('div', { class: 'input-help', text: 'รองรับรูปแบบ 340, 0.25, 1,047, 2.5e-3, 2.5×10^-3 · ตอบเป็นหน่วยที่กำหนด · คลาดเคลื่อนได้ไม่เกิน ' + Math.round(((t.tol && t.tol.rel) != null ? t.tol.rel : 0.02) * 100) + '%' })));
    } else {
      const mountEl = h('div', { class: 'mission' });
      els.body.append(mountEl);
      els.attempts = h('div', { class: 'attempts' });
      els.mountEl = mountEl;
    }

    const node = h('section', { class: 'screen' },
      h('div', { class: 'play-head' },
        h('button', { class: 'btn ghost sm', text: '← แผนที่', onclick: () => confirmBox('ออกจากด่าน?', 'ความคืบหน้าของรอบนี้จะไม่ถูกสรุปผล (XP ของข้อที่ตอบไปแล้วยังคงอยู่)', 'ออกจากด่าน', renderMap) }),
        h('div', null, h('div', { class: 'lvl', text: `${PLAN[L.id - 1].code} · ${L.title}` }), h('h2', { text: `${L.icon} ${L.th}` })),
        h('div', { class: 'play-stats' },
          h('span', { class: 'stat-pill', text: `ภารกิจ ${run.i + 1}/${n}` }),
          h('span', { class: 'stat-pill', text: `✅ ${run.results.filter(r => r.ok).length}` }),
          h('span', { class: 'stat-pill', text: `⚡ ${run.xp} XP` }),
          h('span', { class: 'stat-pill', text: `💡 ${run.hints}` }))),
      h('div', { class: 'progress' }, h('div', { class: 'fill', style: { width: (run.i / n * 100) + '%' }, 'data-w': ((run.i + 1) / n * 100) + '%' })),
      h('div', { class: 'panel task-card' }, corners(),
        h('div', { class: 'tags' },
          h('span', { class: 'tag', text: kindLabel }),
          h('span', { class: 'tag ' + diffClass(t.difficulty), text: 'ระดับ: ' + t.difficulty }),
          h('span', { class: 'tag violet', text: t.bloom || 'การประยุกต์' }),
          h('span', { class: 'tag', text: '📚 ' + t.topic }),
          h('span', { class: 'tag', text: `⭐ ${t.points} XP` })),
        t.title ? h('h3', { class: 'mt', text: t.title }) : null,
        h('div', { class: 'prompt', text: t.prompt }),
        practice ? h('div', { class: 'practice-note', text: '↺ ข้อนี้เคยตอบแล้ว — รอบนี้เป็นการฝึกซ้อม ไม่ได้รับ XP' }) : null,
        els.body, els.hint, els.feedback,
        h('div', { class: 'actions' }, els.hintBtn, els.attempts || null, h('span', { class: 'grow' }), els.submit, els.next)));
    setScreen(node);
    if (els.mountEl) { run.inst = t.mount(els.mountEl, { lib: SQ.lib, audio: SQ.audio, sfx: SQ.sfx }); updateAttempts(t, els); }
    requestAnimationFrame(() => $$('.fill[data-w]').forEach(f => f.style.width = f.dataset.w));
    if (run.hintUsed) showHint(t, els, false);
  }

  function updateAttempts(t, els) {
    if (!els.attempts) return;
    const rec = taskRec(t.id);
    const left = Math.max(0, CFG.missionAttempts - (rec.done ? 0 : rec.attempts));
    els.attempts.replaceChildren('ส่งผลได้อีก ', h('b', { text: rec.done ? '∞ (ฝึกซ้อม)' : left }), rec.done ? '' : ' ครั้ง');
  }

  function showHint(t, els, sound) {
    els.hint.replaceChildren(h('b', { text: '💡 คำใบ้: ' }), t.hint);
    els.hint.hidden = false; els.hintBtn.disabled = true; els.hintBtn.textContent = '💡 ใช้คำใบ้แล้ว';
    if (sound) SQ.sfx.hint();
  }
  function useHint(t, els) {
    if (run.locked || run.hintUsed) return;
    run.hintUsed = true; run.hints++;
    const rec = taskRec(t.id);
    if (!rec.done) { rec.hint = true; P.stats.hints++; save(); }
    showHint(t, els, true);
  }

  function submit(t, els) {
    if (run.locked) return;                                 // anti double-submit
    if (t.kind === 'mcq') {
      if (run.selected == null) { toast('เลือกคำตอบก่อนส่ง', 'warn'); return; }
      run.locked = true; lockInputs(els);
      const ok = run.selected === t.answer;
      finalize(t, els, ok, t.choices[run.selected]);
    } else if (t.kind === 'num') {
      const v = parseNum(els.input.value);
      if (!isFinite(v)) { toast('กรุณากรอกคำตอบเป็นตัวเลข เช่น 340 หรือ 2.5×10^-3', 'warn'); els.input.focus(); return; }
      run.locked = true; lockInputs(els);
      finalize(t, els, SQ.lib.close(v, t.answer, t.tol), els.input.value.trim());
    } else {
      const r = run.inst.check();
      if (r.invalid) { toast(r.msg, 'warn'); return; }
      run.locked = true; lockInputs(els);
      const rec = taskRec(t.id);
      if (!rec.done) { rec.attempts++; save(); }
      const left = CFG.missionAttempts - rec.attempts;
      if (r.ok || rec.done || left <= 0) {
        if (!r.ok && rec.done) { /* practice: allow unlimited tries */
          return retryMission(t, els, r.msg, null);
        }
        if (run.inst.lock) run.inst.lock();
        finalize(t, els, r.ok, null, r.msg);
      } else retryMission(t, els, r.msg, left);
    }
  }

  function retryMission(t, els, msg, left) {
    SQ.sfx.wrong();
    els.feedback.className = 'feedback try'; els.feedback.hidden = false;
    els.feedback.replaceChildren(h('div', { class: 'verdict', text: '⚠️ ยังไม่สำเร็จ ลองปรับค่าแล้วตรวจใหม่' }), msg || '', left != null ? `\nเหลือโอกาสส่งผลอีก ${left} ครั้ง` : '');
    updateAttempts(t, els);
    // short cool-down prevents rapid double clicks from consuming attempts
    setTimeout(() => { run.locked = false; els.submit.disabled = false; if (!run.hintUsed) els.hintBtn.disabled = false; }, 700);
  }

  function lockInputs(els) {
    els.submit.disabled = true; els.hintBtn.disabled = true;
    if (els.choices) els.choices.forEach(b => b.disabled = true);
    if (els.input) els.input.disabled = true;
  }

  function finalize(t, els, ok, given, missionMsg) {
    const rec = taskRec(t.id);
    const first = !rec.done;
    const hint = run.hintUsed || rec.hint;
    let xp = 0;
    if (ok && first) xp = hint ? XP.withHint : (t.kind === 'mcq' ? XP.mcq : t.kind === 'num' ? XP.num : XP.mission);
    if (first) {
      Object.assign(rec, { done: true, ok, xp, hint, at: Date.now() });
      P.xp += xp; P.stats.answered++;
      if (ok) { P.stats.correct++; if (t.kind === 'num') P.stats.numOk++; if (t.kind === 'mission') P.stats.missionOk++; }
    }
    run.results.push({ id: t.id, ok, xp, hint, kind: t.kind, title: t.title || t.prompt });
    run.xp += xp;
    save();
    SQ.store.logEvent({ type: 'answer', profileId: P.id, level: run.id, task: t.id, kind: t.kind, ok, xp, hint, practice: !first, given });

    // Reveal: only now (after submission) show the correct answer + explanation
    if (els.choices) els.choices.forEach(b => {
      const ci = +b.dataset.ci;
      if (ci === t.answer) b.classList.add('correct');
      else if (ci === run.selected) b.classList.add('wrong');
    });
    let answerLine = '';
    if (t.kind === 'mcq') answerLine = 'คำตอบที่ถูกต้อง: ' + t.choices[t.answer];
    else if (t.kind === 'num') answerLine = `คำตอบที่ถูกต้อง: ${fmt(t.answer, 4)} ${t.unit || ''}`;
    else if (run.inst && run.inst.solution) answerLine = run.inst.solution();
    els.feedback.className = 'feedback ' + (ok ? 'ok' : 'no'); els.feedback.hidden = false;
    els.feedback.replaceChildren(...[
      h('div', { class: 'verdict', text: ok ? (first ? `✅ ถูกต้อง! +${xp} XP${hint ? ' (ใช้คำใบ้)' : ''}` : '✅ ถูกต้อง! (ฝึกซ้อม)') : (first ? '❌ ยังไม่ถูกต้อง' : '❌ ยังไม่ถูกต้อง (ฝึกซ้อม)') }),
      missionMsg && !ok ? h('div', { text: missionMsg }) : null,
      h('div', { class: 'answer-line', text: answerLine }),
      h('div', { text: '📖 ' + t.explanation })].filter(Boolean));
    if (ok) { SQ.sfx.correct(); xpPop(xp, els.submit); }
    else { SQ.sfx.wrong(); const card = els.feedback.closest('.task-card'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
    els.submit.hidden = true; els.next.hidden = false;
    if (els.attempts) els.attempts.hidden = true;
    $$('.play-stats .stat-pill')[1].textContent = `✅ ${run.results.filter(r => r.ok).length}`;
    $$('.play-stats .stat-pill')[2].textContent = `⚡ ${run.xp} XP`;
    $$('.play-stats .stat-pill')[3].textContent = `💡 ${run.hints}`;
    els.feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function nextTask() {
    if (!run) return;
    if (run.results.length <= run.i) return;               // cannot skip an unanswered task
    if (run.i >= run.tasks.length - 1) return endLevel();
    run.i++; renderPlay();
  }

  /* =========================================================
     LEVEL RESULT
     ========================================================= */
  function endLevel() {
    const id = run.id, L = run.L, st = lvState(id);
    const total = run.tasks.length, correct = run.results.filter(r => r.ok).length, pct = correct / total;
    const isPass = pct >= CFG.passRatio - 1e-9;
    const noHint = run.hints === 0;
    const wasPassed = st.passed;
    let bonus = 0;
    if (isPass && noHint && !st.bonus) { bonus = XP.levelBonus; st.bonus = true; P.xp += bonus; }
    const medal = !isPass ? null : (pct >= 0.9 && noHint) ? 'gold' : pct >= 0.75 ? 'silver' : 'bronze';
    const newMedal = medal && (!st.medal || MEDAL_RANK[medal] > MEDAL_RANK[st.medal]);
    if (newMedal) st.medal = medal;
    st.passed = st.passed || isPass; st.bestPct = Math.max(st.bestPct, pct);
    const unlockedNow = isPass && !wasPassed && id < TOTAL_LEVELS;
    const earned = checkBadges();
    save();
    SQ.store.logEvent({ type: 'level_end', profileId: P.id, level: id, correct, total, pct, pass: isPass, hints: run.hints, xp: run.xp + bonus, medal });

    const runXp = run.xp + bonus;
    const xpEl = h('div', { class: 'big-xp', text: '+0 XP' });
    const node = h('section', { class: 'screen' },
      h('div', { class: 'panel center' }, corners(),
        h('div', { class: 'tag', text: `${PLAN[id - 1].code} COMPLETE` }),
        h('h2', { class: 'mt', text: isPass ? `🎉 ผ่านด่าน ${L.title}!` : `💪 ยังไม่ผ่านด่าน ${L.title}` }),
        h('div', { class: 'medal ' + (medal || 'none'), text: medal ? MEDALS[medal].icon : '🔁' }),
        h('div', { class: 'muted', text: medal ? MEDALS[medal].name + (newMedal ? ' (ใหม่!)' : '') : `ต้องทำถูกอย่างน้อย ${Math.ceil(total * CFG.passRatio)} จาก ${total} ภารกิจ` }),
        xpEl,
        bonus ? h('div', { class: 'xp-badge', text: `🎁 รวมโบนัสผ่านด่านโดยไม่ใช้คำใบ้ +${bonus} XP` }) : null,
        unlockedNow ? h('div', { class: 'tag mt', text: `🔓 ปลดล็อก ${PLAN[id].code}: ${PLAN[id].title} แล้ว!` }) : null,
        h('div', { class: 'kpis' },
          h('div', { class: 'kpi' }, h('b', { text: `${correct}/${total}` }), h('span', { text: 'ทำถูก' })),
          h('div', { class: 'kpi' }, h('b', { text: Math.round(pct * 100) + '%' }), h('span', { text: 'ความแม่นยำ' })),
          h('div', { class: 'kpi' }, h('b', { text: run.hints }), h('span', { text: 'ใช้คำใบ้' })),
          h('div', { class: 'kpi' }, h('b', { text: P.xp.toLocaleString() }), h('span', { text: 'XP สะสม' }))),
        h('div', { class: 'task-list' }, run.results.map((r, i) => h('div', { class: 'task-row' },
          h('span', { text: r.ok ? '✅' : '❌' }), h('span', { class: 'muted', text: `${i + 1}.` }),
          h('span', { class: 'grow', text: r.title }),
          r.hint ? h('span', { text: '💡' }) : null,
          h('b', { class: 'xp-badge', text: r.xp ? '+' + r.xp : '0' })))),
        h('div', { class: 'actions', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost', text: '🔁 เล่นด่านนี้ใหม่', onclick: () => startLevel(id) }),
          (id < TOTAL_LEVELS && isUnlocked(id + 1) && SQ.levels[id + 1]) ? h('button', { class: 'btn', text: `ด่านถัดไป: ${PLAN[id].title} →`, onclick: () => openLevelIntro(id + 1) }) : null,
          h('button', { class: 'btn ghost', text: '🗺️ แผนที่', onclick: renderMap }),
          countPassed(P) >= TOTAL_LEVELS ? h('button', { class: 'btn good', text: '🏆 สรุปผลทั้งเกม', onclick: renderSummary }) : null)));
    cleanupInst(); run = null;
    setScreen(node);
    animateCount(xpEl, runXp, v => '+' + v + ' XP');
    if (isPass) { SQ.sfx.level(); confetti(); } else SQ.sfx.wrong();
    if (unlockedNow) setTimeout(() => { SQ.sfx.unlock(); toast(`🔓 ปลดล็อก ${PLAN[id].code}: ${PLAN[id].title}`); }, 900);
    earned.forEach((b, i) => setTimeout(() => { SQ.sfx.badge(); toast(`${b.icon} ได้รับเหรียญตรา “${b.name}”`, 'gold'); }, 1500 + i * 900));
  }

  function checkBadges() {
    const got = [];
    BADGES.forEach(b => { if (!P.badges.includes(b.id) && b.test(P)) { P.badges.push(b.id); got.push(b); } });
    return got;
  }

  function animateCount(el, to, f) {
    const t0 = performance.now(), dur = 900;
    const step = now => { const k = Math.min(1, (now - t0) / dur); el.textContent = f(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = h('canvas', { style: { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 65 } });
    document.body.append(cv); cv.width = innerWidth; cv.height = innerHeight; const x = cv.getContext('2d');
    const cols = ['#22e3ff', '#3dff9a', '#ffd54a', '#a78bfa', '#ff4fd8', '#ffffff'];
    const parts = Array.from({ length: 150 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - .5) * 15, vy: -Math.random() * 13 - 4, s: Math.random() * 6 + 3, c: SQ.lib.pick(cols), r: Math.random() * 6 }));
    let n = 0; (function f() {
      x.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(p => { p.vy += .33; p.x += p.vx; p.y += p.vy; p.r += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.shadowColor = p.c; x.shadowBlur = 8; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); });
      if (++n < 130) requestAnimationFrame(f); else cv.remove();
    })();
  }

  /* =========================================================
     GAME SUMMARY
     ========================================================= */
  function renderSummary() {
    if (!P) return renderHome();
    run = null;
    const done = Object.values(P.tasks).filter(t => t.done);
    const acc = done.length ? done.filter(t => t.ok).length / done.length : 0;
    const mc = medalCount(P), passedN = countPassed(P);
    const { r } = rankOf(P.xp);
    const node = h('section', { class: 'screen' },
      h('div', { class: 'panel center' }, corners(),
        h('div', { class: 'tag', text: passedN >= TOTAL_LEVELS ? 'QUEST COMPLETE' : 'MISSION REPORT' }),
        h('div', { class: 'mt' }, h('span', { class: 'avatar lg', text: avatarOf(P.avatar).emoji })),
        h('h2', { class: 'mt', text: P.name }),
        h('div', { class: 'muted', text: `ยศ: ${r.name}` }),
        h('div', { class: 'big-xp', text: P.xp.toLocaleString() + ' XP' }),
        h('div', { class: 'progress good mt' }, h('div', { class: 'fill', 'data-w': (passedN / TOTAL_LEVELS * 100) + '%' })),
        h('div', { class: 'kpis' },
          h('div', { class: 'kpi' }, h('b', { text: `${passedN}/${TOTAL_LEVELS}` }), h('span', { text: 'ด่านที่ผ่าน' })),
          h('div', { class: 'kpi' }, h('b', { text: Math.round(acc * 100) + '%' }), h('span', { text: 'ตอบถูกครั้งแรก' })),
          h('div', { class: 'kpi' }, h('b', { text: `🥇${mc.gold} 🥈${mc.silver} 🥉${mc.bronze}` }), h('span', { text: 'เหรียญรางวัล' })),
          h('div', { class: 'kpi' }, h('b', { text: P.stats.hints }), h('span', { text: 'ครั้งที่ใช้คำใบ้' })))),
      h('div', { class: 'panel mt2' }, corners(),
        h('div', { class: 'panel-title', text: '📋 ผลรายด่าน' }),
        h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'tbl' },
          h('thead', null, h('tr', null, ['ด่าน', 'สถานะ', 'ดีที่สุด', 'เหรียญ', 'จำนวนครั้งที่เล่น'].map(t => h('th', { text: t })))),
          h('tbody', null, PLAN.map(Lp => { const s = lvState(Lp.id); return h('tr', null,
            h('td', { text: `${Lp.icon} ${Lp.code}: ${Lp.title}` }),
            h('td', { text: s.passed ? '✅ ผ่าน' : isUnlocked(Lp.id) ? (s.plays ? '⏳ ยังไม่ผ่าน' : '▶️ พร้อมเล่น') : '🔒 ล็อก' }),
            h('td', { text: s.plays ? Math.round(s.bestPct * 100) + '%' : '-' }),
            h('td', { text: s.medal ? MEDALS[s.medal].icon + ' ' + MEDALS[s.medal].name : '-' }),
            h('td', { text: s.plays })); }))))),
      h('div', { class: 'panel mt2' }, corners(),
        h('div', { class: 'panel-title', text: '🎖️ เหรียญตราความสำเร็จ' }),
        h('div', { class: 'badges' }, BADGES.map(b => h('div', { class: 'badge ' + (P.badges.includes(b.id) ? 'on' : 'off') },
          h('div', { class: 'i', text: b.icon }), h('b', { text: b.name }), h('small', { text: b.desc }))))),
      h('div', { class: 'actions', style: { justifyContent: 'center' } },
        h('button', { class: 'btn', text: '🗺️ กลับแผนที่', onclick: renderMap }),
        h('button', { class: 'btn ghost', text: '🖨️ พิมพ์/บันทึกผล', onclick: () => window.print() }),
        h('button', { class: 'btn danger', text: '🔁 เล่นใหม่ตั้งแต่ต้น', onclick: () => confirmBox('เริ่มเกมใหม่ทั้งหมด?', 'XP เหรียญ และด่านที่ปลดล็อกของผู้เล่นนี้จะถูกรีเซ็ตเป็นค่าเริ่มต้น', 'รีเซ็ตและเริ่มใหม่', resetProgress, true) })));
    setScreen(node);
    requestAnimationFrame(() => $$('.fill[data-w]').forEach(f => f.style.width = f.dataset.w));
  }

  function resetProgress() {
    const fresh = newProfile(P.name, P.avatar); fresh.id = P.id; fresh.createdAt = P.createdAt;
    P = fresh; save(); SQ.store.logEvent({ type: 'reset', profileId: P.id });
    toast('รีเซ็ตความคืบหน้าแล้ว เริ่มภารกิจใหม่ได้เลย!'); renderMap();
  }

  /* =========================================================
     Boot
     ========================================================= */
  SQ.game = {
    start() {
      SQ.store.init();
      P = SQ.store.current();
      document.addEventListener('click', e => {
        const nav = e.target.closest('[data-nav]'); if (!nav) return;
        const go = () => { const n = nav.dataset.nav; if (n === 'home') renderHome(); else if (n === 'map') renderMap(); else if (n === 'summary') renderSummary(); };
        if (run && run.results.length < run.tasks.length) confirmBox('ออกจากด่าน?', 'ความคืบหน้าของรอบนี้จะไม่ถูกสรุปผล (XP ของข้อที่ตอบไปแล้วยังคงอยู่)', 'ออกจากด่าน', go);
        else go();
      });
      $('#sfxBtn').addEventListener('click', () => { SQ.store.saveSettings({ sfx: !SQ.audio.enabled() }); renderTopbar(); SQ.sfx.click(); });
      $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
      renderTopbar();
      if (P) renderMap(); else renderHome();
    },
    // exposed for automated tests / teacher tools
    _debug: { get profile() { return P; }, get run() { return run; }, PLAN, BADGES }
  };
})(window.SQ);
