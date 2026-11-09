/* =========================================================
   LEVEL 7: Beat Frequency — บีตส์ f_b = |f₁ − f₂|
   ========================================================= */
(function (SQ) {
  'use strict';
  const TOPIC = 'บีตส์';

  const questions = [
    { id: 'L7-Q01', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'บีตส์ (beats) เกิดจากปรากฏการณ์ใด',
      choices: ['การสะท้อนของเสียงจากผนัง', 'การแทรกสอดของคลื่นเสียง 2 ขบวนที่มีความถี่ต่างกันเล็กน้อย', 'การหักเหของเสียงในอากาศต่างอุณหภูมิ', 'การสั่นพ้องของอากาศในท่อ'],
      answer: 1,
      hint: 'ต้องมีคลื่นเสียง 2 ขบวนมารวมกัน',
      explanation: 'คลื่นเสียง 2 ขบวนที่ความถี่ต่างกันเล็กน้อยรวมกัน บางขณะเฟสตรงกัน (เสริม → ดัง) บางขณะเฟสตรงข้าม (หักล้าง → ค่อย) จึงได้ยินเสียงดัง–ค่อยเป็นจังหวะ' },

    { id: 'L7-Q02', type: 'num', difficulty: 'ง่าย', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'เคาะส้อมเสียงความถี่ 512 Hz และ 508 Hz พร้อมกัน จะได้ยินบีตส์กี่เฮิรตซ์',
      answer: 4, unit: 'Hz', tol: { abs: 0.01 },
      hint: 'f_b = |f₁ − f₂|',
      explanation: 'f_b = |512 − 508| = 4 Hz (ได้ยินเสียงดัง 4 ครั้งต่อวินาที)' },

    { id: 'L7-Q03', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'โดยทั่วไปหูคนจะรับรู้บีตส์เป็นจังหวะดัง–ค่อยได้ชัดเจน เมื่อความถี่บีตส์ไม่เกินประมาณเท่าใด',
      choices: ['7 Hz', '70 Hz', '700 Hz', '7,000 Hz'],
      answer: 0,
      hint: 'ถ้าดัง–ค่อยเร็วเกินไป หูจะแยกเป็นจังหวะไม่ได้',
      explanation: 'ถ้าความถี่ต่างกันมากกว่าประมาณ 7 Hz เสียงดัง–ค่อยจะเกิดถี่จนหูแยกเป็นจังหวะไม่ได้ จะได้ยินเป็นเสียงหยาบหรือ 2 เสียงแยกกัน' },

    { id: 'L7-Q04', type: 'num', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 200,
      prompt: 'นักเรียนเปิดเครื่องกำเนิดเสียง 2 เครื่องพร้อมกัน แล้วนับเสียงดังได้ 20 ครั้งในเวลา 5.0 s ความถี่บีตส์เป็นกี่เฮิรตซ์',
      answer: 4, unit: 'Hz', tol: { abs: 0.01 },
      hint: 'ความถี่บีตส์ = จำนวนครั้งที่ดัง ÷ เวลา',
      explanation: 'f_b = 20 ครั้ง / 5.0 s = 4 Hz' },

    { id: 'L7-Q05', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'เครื่องกำเนิดเสียง A ให้ความถี่ 440 Hz เมื่อเปิดพร้อมเครื่อง B ได้ยินบีตส์ 5 Hz และทราบว่าเครื่อง B ให้ความถี่สูงกว่า A เครื่อง B ให้ความถี่กี่เฮิรตซ์',
      answer: 445, unit: 'Hz', tol: { abs: 0.01 },
      hint: 'f_B = f_A ± f_b เลือกเครื่องหมายจากเงื่อนไข',
      explanation: 'f_B = 440 ± 5 = 435 หรือ 445 Hz\nเพราะ B สูงกว่า A ⇒ f_B = 445 Hz' },

    { id: 'L7-Q06', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 100,
      prompt: 'ช่างตั้งเสียงเปียโนใช้ส้อมเสียงมาตรฐานเทียบกับสายเปียโน เขาจะรู้ว่าสายเปียโนมีความถี่ตรงกับส้อมเสียงแล้วเมื่อใด',
      choices: ['เมื่อได้ยินบีตส์เร็วที่สุด', 'เมื่อบีตส์หายไป เสียงนิ่งสม่ำเสมอ', 'เมื่อเสียงดังที่สุดเท่านั้น', 'เมื่อได้ยินบีตส์ 7 Hz พอดี'],
      answer: 1,
      hint: 'ถ้า f₁ = f₂ แล้ว |f₁ − f₂| = ?',
      explanation: 'เมื่อความถี่ทั้งสองเท่ากัน f_b = 0 ไม่มีจังหวะดัง–ค่อย เสียงจะนิ่ง ช่างจึงปรับความตึงสายจนบีตส์ช้าลงและหายไป' },

    { id: 'L7-Q07', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'เสียงจากแหล่งกำเนิด 2 แหล่งมีความถี่ 300.0 Hz และ 302.5 Hz ช่วงเวลาระหว่างเสียงดังที่สุด 2 ครั้งที่ติดกันเป็นกี่วินาที',
      answer: 0.4, unit: 's', tol: { rel: 0.01 },
      hint: 'หาความถี่บีตส์ก่อน แล้วคาบของบีตส์ = 1/f_b',
      explanation: 'f_b = |302.5 − 300.0| = 2.5 Hz\nคาบของบีตส์ T_b = 1/f_b = 1/2.5 = 0.4 s' },

    { id: 'L7-Q08', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'เปิดเสียงความถี่ 400 Hz และ 404 Hz พร้อมกัน ผู้ฟังจะได้ยินเสียงอย่างไร',
      choices: ['เสียงระดับประมาณ 402 Hz ที่ดัง–ค่อยสลับ 4 ครั้งต่อวินาที', 'เสียง 4 Hz ที่ทุ้มมาก', 'เสียง 804 Hz ที่ดังคงที่', 'เสียง 400 Hz และ 404 Hz แยกกันชัดเจนตลอดเวลา'],
      answer: 0,
      hint: 'คลื่นรวมมีความถี่เฉลี่ยของทั้งสอง และแอมพลิจูดเปลี่ยนตามความถี่บีตส์',
      explanation: 'คลื่นรวมมีความถี่ประมาณค่าเฉลี่ย (400 + 404)/2 = 402 Hz และแอมพลิจูดขึ้น–ลงด้วยความถี่บีตส์ |404 − 400| = 4 Hz' },

    { id: 'L7-Q09', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'ดีดสายกีตาร์พร้อมเคาะส้อมเสียง 440 Hz ได้ยินบีตส์ 3 Hz เมื่อขันสายให้ตึงขึ้นเล็กน้อย (ความถี่ของสายเพิ่มขึ้น) บีตส์ลดลง ความถี่เดิมของสายกีตาร์เป็นกี่เฮิรตซ์',
      answer: 437, unit: 'Hz', tol: { abs: 0.01 },
      hint: 'สายอาจเป็น 437 หรือ 443 Hz ถ้าความถี่สายเพิ่มขึ้นแล้วบีตส์ลดลง แสดงว่าสายกำลังเข้าใกล้ 440 จากด้านใด',
      explanation: 'ความถี่สายเป็นไปได้ 440 ± 3 = 437 หรือ 443 Hz\nเพิ่มความถี่สายแล้วบีตส์ลดลง ⇒ ความถี่สายเข้าใกล้ 440 จากด้านล่าง ⇒ ความถี่เดิม 437 Hz' },

    { id: 'L7-Q10', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'ส้อมเสียง A ความถี่ 256 Hz เคาะพร้อมส้อมเสียง B ได้ยินบีตส์ 4 Hz เมื่อติดดินน้ำมันที่ขาส้อมเสียง B (ทำให้ความถี่ของ B ลดลงเล็กน้อย) บีตส์เพิ่มเป็น 6 Hz ความถี่เดิมของส้อมเสียง B เป็นกี่เฮิรตซ์',
      answer: 252, unit: 'Hz', tol: { abs: 0.01 },
      hint: 'B เป็นได้ 252 หรือ 260 Hz ถ้า B ลดลงแล้วบีตส์เพิ่ม แสดงว่า B กำลังห่างจาก 256 ไปทางไหน',
      explanation: 'f_B = 256 ± 4 = 252 หรือ 260 Hz\nถ้า f_B = 260 เมื่อลดลง (เช่น 258) บีตส์จะลดเป็น 2 Hz ไม่ตรงกับข้อมูล\nถ้า f_B = 252 เมื่อลดลงเป็น 250 บีตส์เพิ่มเป็น 6 Hz ✓ ⇒ f_B = 252 Hz' },

    { id: 'L7-Q11', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'เครื่องกำเนิดเสียง A ตั้งไว้ที่ 500 Hz ส่วนเครื่อง B ค่อย ๆ เพิ่มความถี่จาก 495 Hz ไปถึง 505 Hz ความถี่บีตส์ที่ได้ยินเปลี่ยนไปอย่างไร',
      choices: ['เพิ่มขึ้นตลอด', 'ลดลงตลอด', 'ลดลงจนเป็นศูนย์ที่ 500 Hz แล้วเพิ่มขึ้นอีก', 'คงที่ 5 Hz ตลอด'],
      answer: 2,
      hint: 'คำนวณ |f_A − f_B| ที่ 495, 500 และ 505 Hz',
      explanation: 'ที่ 495 Hz: f_b = 5 Hz → ที่ 500 Hz: f_b = 0 → ที่ 505 Hz: f_b = 5 Hz บีตส์จึงช้าลงจนหายไปแล้วเร็วขึ้นอีก' },

    { id: 'L7-Q12', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'บีตส์ต่างจากการแทรกสอดของเสียงจากลำโพง 2 ตัวที่ความถี่เท่ากันอย่างไร',
      choices: ['บีตส์ดัง–ค่อยเปลี่ยนตาม “เวลา” ที่ตำแหน่งเดิม ส่วนลำโพงความถี่เท่ากันดัง–ค่อยเปลี่ยนตาม “ตำแหน่ง”', 'บีตส์ดัง–ค่อยเปลี่ยนตามตำแหน่ง ส่วนลำโพงความถี่เท่ากันเปลี่ยนตามเวลา', 'บีตส์ไม่ใช่การแทรกสอด', 'ไม่มีความแตกต่างกัน'],
      answer: 0,
      hint: 'ยืนนิ่งอยู่จุดเดียว กรณีใดที่ยังได้ยินเสียงดัง–ค่อยเป็นจังหวะ',
      explanation: 'บีตส์เป็นการแทรกสอดที่ขึ้นกับเวลา: ยืนนิ่งก็ได้ยินดัง–ค่อยเป็นจังหวะ ส่วนแหล่งกำเนิดความถี่เท่ากันให้รูปแบบการแทรกสอดคงที่ตามตำแหน่ง ต้องเดินเปลี่ยนตำแหน่งจึงได้ยินดัง–ค่อย' },

    { id: 'L7-Q13', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'เคาะส้อมเสียงความถี่ 340 Hz และ 345 Hz พร้อมกัน ในเวลา 3.0 s จะได้ยินเสียงดังทั้งหมดกี่ครั้ง',
      answer: 15, unit: 'ครั้ง', tol: { abs: 0.01 },
      hint: 'หาความถี่บีตส์ (ครั้งต่อวินาที) แล้วคูณด้วยเวลา',
      explanation: 'f_b = |345 − 340| = 5 Hz = 5 ครั้งต่อวินาที\nใน 3.0 s ได้ยินเสียงดัง 5 × 3.0 = 15 ครั้ง' }
  ];

  /* ---------------- Shared beat envelope display ---------------- */
  function beatScope(api, cv, getDf) {
    return api.lib.canvas(cv, 200, (x, w, hh, t) => {
      x.clearRect(0, 0, w, hh);
      const WIN = 2;                      // seconds shown
      x.strokeStyle = 'rgba(34,227,255,.15)'; x.lineWidth = 1;
      for (let s = 0; s <= 4; s++) { const px = s / 4 * w; x.beginPath(); x.moveTo(px, 20); x.lineTo(px, hh - 22); x.stroke(); }
      x.fillStyle = '#8fb0cf'; x.font = '12px Kanit, sans-serif';
      ['0', '0.5 s', '1.0 s', '1.5 s', '2.0 s'].forEach((l, i) => { x.textAlign = i === 0 ? 'left' : i === 4 ? 'right' : 'center'; x.fillText(l, i / 4 * w, hh - 6); });
      x.textAlign = 'left';
      const df = getDf(), cy = (hh - 20) / 2 + 10, A = (hh - 60) / 2;
      const env = tt => Math.abs(Math.cos(Math.PI * df * tt));
      // envelope fill
      x.fillStyle = 'rgba(34,227,255,.12)'; x.beginPath();
      for (let px = 0; px <= w; px += 2) { const tt = px / w * WIN + t; const y = cy - A * env(tt); px ? x.lineTo(px, y) : x.moveTo(px, y); }
      for (let px = w; px >= 0; px -= 2) { const tt = px / w * WIN + t; x.lineTo(px, cy + A * env(tt)); }
      x.closePath(); x.fill();
      // illustrative carrier (drawn slower than the real one)
      x.strokeStyle = '#22e3ff'; x.lineWidth = 1.4; x.shadowColor = '#22e3ff'; x.shadowBlur = 6; x.beginPath();
      for (let px = 0; px <= w; px += 1) { const tt = px / w * WIN + t; const y = cy - A * Math.cos(Math.PI * df * tt) * Math.sin(2 * Math.PI * 45 * tt); px ? x.lineTo(px, y) : x.moveTo(px, y); }
      x.stroke(); x.shadowBlur = 0;
      x.fillStyle = 'rgba(232,247,255,.7)'; x.textAlign = 'right'; x.fillText('ซองของคลื่นรวม (คลื่นพาหะวาดช้ากว่าความจริง)', w - 8, 14); x.textAlign = 'left';
    });
  }

  /* ---------------- Mission 1: Beat generator ---------------- */
  const generator = {
    id: 'L7-M01', title: '🎛️ ภารกิจทดลอง: เครื่องกำเนิดบีตส์', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 150,
    prompt: 'เครื่องกำเนิดเสียง A ตั้งค่าคงที่ไว้ ปรับความถี่ของเครื่อง B ให้ได้ความถี่บีตส์ตามเป้าหมาย และเป็นไปตามเงื่อนไขที่กำหนด',
    hint: 'f_b = |f_A − f_B| ⇒ f_B = f_A + f_b หรือ f_A − f_b เลือกค่าที่ตรงกับเงื่อนไข สังเกตจำนวนครั้งที่ซองคลื่นพองใน 1 วินาทีบนกราฟ',
    explanation: 'ความถี่บีตส์เท่ากับผลต่างของความถี่ทั้งสอง ค่าเดียวกันของ f_b เกิดได้ 2 กรณี (สูงกว่าหรือต่ำกว่า) จึงต้องใช้ข้อมูลเพิ่มเติมตัดสินว่าเป็นกรณีใด',
    mount(el, api) {
      const { h, slider, pick, rnd } = api.lib;
      const fA = rnd(300, 500), fb = pick([2, 3, 4, 5, 6]), higher = Math.random() < 0.5;
      const fReq = higher ? fA + fb : fA - fb;
      const st = { fB: fA + (higher ? -7.5 : 7.5), tone: null };
      const cv = h('canvas', { 'aria-label': 'กราฟซองคลื่นบีตส์' });
      const c = beatScope(api, cv, () => Math.abs(st.fB - fA)); c.start();
      const bSl = slider({ label: 'ความถี่เครื่อง B', min: fA - 15, max: fA + 15, step: 0.5, value: st.fB, steps: [-1, -0.5, 0.5, 1], format: v => v.toFixed(1) + ' Hz',
        onInput: v => { st.fB = v; if (st.tone) st.tone.set([fA, v]); } });
      const play = h('button', { class: 'btn ghost sm', type: 'button', text: '🔊 เปิดเสียง A + B', onclick: () => {
        if (st.tone) { st.tone.stop(); st.tone = null; play.textContent = '🔊 เปิดเสียง A + B'; return; }
        st.tone = api.audio.tones([fA, st.fB], { volume: 0.12 }); play.textContent = '⏹ ปิดเสียง'; } });
      el.append(h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: 'BEAT SCOPE' }), cv),
        h('div', { class: 'sim-controls' },
          h('div', { class: 'control' }, h('label', null, h('span', { text: 'ความถี่เครื่อง A (คงที่)' }), h('b', { text: fA + '.0 Hz' })), play),
          bSl.el),
        h('div', { class: 'qpart' }, h('h4', { text: `เป้าหมาย: ความถี่บีตส์ ${fb} Hz และเครื่อง B ต้องมีความถี่${higher ? 'สูงกว่า' : 'ต่ำกว่า'}เครื่อง A` })));
      return {
        check() {
          const diff = st.fB - fA;
          const okBeat = Math.abs(Math.abs(diff) - fb) <= 0.1, okSide = higher ? diff > 0 : diff < 0;
          let msg = `ขณะนี้ความถี่บีตส์ = ${Math.abs(diff).toFixed(1)} Hz`;
          if (okBeat && !okSide) msg += ' · ความถี่บีตส์ถูกแล้ว แต่ยังไม่ตรงเงื่อนไขสูง/ต่ำ';
          return { ok: okBeat && okSide, msg };
        },
        solution() { return `เฉลย: f_B = ${fA} ${higher ? '+' : '−'} ${fb} = ${fReq} Hz`; },
        lock() { bSl.disable(true); },
        destroy() { c.destroy(); if (st.tone) st.tone.stop(); },
        _debug: () => ({ f: fReq })
      };
    }
  };

  /* ---------------- Mission 2: Mystery tuning fork ---------------- */
  const mystery = {
    id: 'L7-M02', title: '🔍 ภารกิจทดลอง: ไขปริศนาส้อมเสียงไร้ป้าย', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 150,
    prompt: 'ส้อมเสียง X หลุดป้ายบอกความถี่ เปิดเครื่องกำเนิดเสียง G พร้อมกับส้อมเสียง X\nส่วนที่ 1: นับความถี่บีตส์ “ก่อนปรับ” จากกราฟ  ส่วนที่ 2: ปรับ G จนบีตส์หายไป เพื่อหาความถี่ของ X',
    hint: 'ส่วนที่ 1: นับจำนวนครั้งที่ซองคลื่นพองขึ้นในช่วง 1.0 s (จาก 0 ถึง 1.0 s) · ส่วนที่ 2: ยิ่ง f_G เข้าใกล้ f_X บีตส์ยิ่งช้า เมื่อเท่ากันพอดีซองคลื่นจะเรียบไม่มีจังหวะ',
    explanation: 'จำนวนครั้งที่เสียงดังต่อวินาทีคือความถี่บีตส์ |f_X − f_G| เมื่อปรับจน f_b = 0 แสดงว่า f_G = f_X นี่คือหลักการตั้งเสียงเครื่องดนตรี',
    mount(el, api) {
      const { h, slider, rnd, pick, parseNum } = api.lib;
      const fX = rnd(600, 1000) / 2;                       // 300.0 – 500.0 Hz in 0.5 steps
      const d0 = pick([2, 3, 4, 5]) * (Math.random() < 0.5 ? 1 : -1);
      const g0 = fX + d0;
      const lo = Math.floor(fX - rnd(12, 28)), hi = Math.ceil(fX + rnd(12, 28));
      const st = { fG: g0, tone: null };
      const cv = h('canvas', { 'aria-label': 'กราฟซองคลื่นบีตส์' });
      const c = beatScope(api, cv, () => Math.abs(st.fG - fX)); c.start();
      const gSl = slider({ label: 'ความถี่เครื่องกำเนิด G', min: lo, max: hi, step: 0.5, value: g0, steps: [-1, -0.5, 0.5, 1], format: v => v.toFixed(1) + ' Hz',
        onInput: v => { st.fG = v; if (st.tone) st.tone.set([fX, v]); } });
      const play = h('button', { class: 'btn ghost sm', type: 'button', text: '🔊 ฟังเสียง X + G', onclick: () => {
        if (st.tone) { st.tone.stop(); st.tone = null; play.textContent = '🔊 ฟังเสียง X + G'; return; }
        st.tone = api.audio.tones([fX, st.fG], { volume: 0.12 }); play.textContent = '⏹ ปิดเสียง'; } });
      const countIn = h('input', { class: 'input', inputmode: 'decimal', placeholder: 'เช่น 3', style: { maxWidth: '160px' }, 'aria-label': 'ความถี่บีตส์ก่อนปรับ' });
      el.append(h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: 'BEAT SCOPE · X + G' }), cv),
        h('div', { class: 'qpart' }, h('h4', { text: `ส่วนที่ 1: ตอนเริ่มต้น G = ${g0.toFixed(1)} Hz ความถี่บีตส์ที่วัดได้จากกราฟเป็นกี่ Hz` }),
          h('div', { class: 'num-answer', style: { marginTop: 0 } }, countIn, h('span', { class: 'unit', text: 'Hz' })),
          h('div', { class: 'muted small', text: 'ตอบส่วนที่ 1 ก่อนเลื่อนแถบ G (กราฟจะเปลี่ยนตามค่า G)' })),
        h('div', { class: 'sim-controls' }, gSl.el, h('div', { class: 'control' }, h('label', null, h('span', { text: 'ส้อมเสียง X' }), h('b', { text: '??? Hz' })), play)),
        h('div', { class: 'qpart' }, h('h4', { text: 'ส่วนที่ 2: ปรับ G จนบีตส์หายไป แล้วกดตรวจผล (ยอมรับคลาดเคลื่อน ±0.5 Hz)' })));
      return {
        check() {
          const n = parseNum(countIn.value);
          if (!isFinite(n)) return { invalid: true, msg: 'กรอกความถี่บีตส์ในส่วนที่ 1 เป็นตัวเลขก่อน' };
          const ok1 = Math.abs(n - Math.abs(d0)) <= 0.25, ok2 = Math.abs(st.fG - fX) <= 0.5;
          return { ok: ok1 && ok2, msg: `ผลตรวจ: ถูก ${[ok1, ok2].filter(Boolean).length} จาก 2 ส่วน` + (ok2 ? '' : ` · ยังมีบีตส์ ${Math.abs(st.fG - fX).toFixed(1)} Hz`) };
        },
        solution() { return `เฉลย: ส้อมเสียง X = ${fX.toFixed(1)} Hz · ตอนเริ่ม G = ${g0.toFixed(1)} Hz จึงมีบีตส์ |${g0.toFixed(1)} − ${fX.toFixed(1)}| = ${Math.abs(d0)} Hz`; },
        lock() { gSl.disable(true); countIn.disabled = true; },
        destroy() { c.destroy(); if (st.tone) st.tone.stop(); },
        _debug: () => ({ f: fX, n: Math.abs(d0) })
      };
    }
  };

  SQ.registerLevel({
    id: 7, code: 'LEVEL 7', title: 'Beat Frequency', th: 'บีตส์', icon: '〰️', topic: TOPIC,
    objective: 'ปรับความถี่ของเครื่องกำเนิดเสียงสองแหล่งให้เกิดความถี่บีตส์ตามเป้าหมาย อ่านความถี่บีตส์จากกราฟซองคลื่น ใช้ f_b = |f₁ − f₂| วิเคราะห์โจทย์ตั้งเสียงเครื่องดนตรี',
    questions, missions: [generator, mystery]
  });
})(window.SQ);
