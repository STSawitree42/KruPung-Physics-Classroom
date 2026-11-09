/* =========================================================
   LEVEL 2: Sound Speed — อัตราเร็วเสียง v = 331 + 0.6T
   ========================================================= */
(function (SQ) {
  'use strict';
  const TOPIC = 'อัตราเร็วเสียง';

  const questions = [
    { id: 'L2-Q01', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'เมื่ออุณหภูมิของอากาศสูงขึ้น อัตราเร็วเสียงในอากาศจะเป็นอย่างไร',
      choices: ['ลดลง', 'เพิ่มขึ้น', 'คงเดิม', 'เป็นศูนย์'],
      answer: 1,
      hint: 'ดูสมการ v = 331 + 0.6T เมื่อ T เพิ่ม v จะเป็นอย่างไร',
      explanation: 'จาก v = 331 + 0.6T (T เป็น °C) อุณหภูมิสูงขึ้น 1 °C อัตราเร็วเสียงเพิ่มประมาณ 0.6 m/s เพราะโมเลกุลอากาศเคลื่อนที่เร็วขึ้น ส่งต่อการสั่นได้เร็วขึ้น' },

    { id: 'L2-Q02', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'โดยทั่วไป เสียงเคลื่อนที่ได้เร็วที่สุดในตัวกลางใด',
      choices: ['อากาศ', 'น้ำ', 'เหล็ก', 'สุญญากาศ'],
      answer: 2,
      hint: 'อนุภาคในตัวกลางใดยึดติดกันแน่นที่สุด',
      explanation: 'โดยทั่วไป v ในของแข็ง > ของเหลว > แก๊ส เช่น เหล็กประมาณ 5,000 m/s น้ำประมาณ 1,500 m/s อากาศประมาณ 340 m/s ส่วนในสุญญากาศเสียงเคลื่อนที่ไม่ได้' },

    { id: 'L2-Q03', type: 'num', difficulty: 'ง่าย', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'อากาศมีอุณหภูมิ 25 °C อัตราเร็วเสียงในอากาศเป็นกี่ m/s',
      answer: 346, unit: 'm/s', tol: { abs: 0.5 },
      hint: 'แทนค่า T = 25 ใน v = 331 + 0.6T',
      explanation: 'v = 331 + 0.6T = 331 + 0.6(25) = 331 + 15 = 346 m/s' },

    { id: 'L2-Q04', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ยอดดอยในฤดูหนาวมีอุณหภูมิ −5 °C อัตราเร็วเสียงในอากาศเป็นกี่ m/s',
      answer: 328, unit: 'm/s', tol: { abs: 0.5 },
      hint: 'ระวังเครื่องหมายลบ: 0.6 × (−5) = ?',
      explanation: 'v = 331 + 0.6(−5) = 331 − 3 = 328 m/s' },

    { id: 'L2-Q05', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'นักเรียนวัดอัตราเร็วเสียงในห้องเรียนได้ 343 m/s อุณหภูมิของห้องขณะนั้นเป็นกี่องศาเซลเซียส',
      answer: 20, unit: '°C', tol: { abs: 0.5 },
      hint: 'จัดรูปสมการ: T = (v − 331) / 0.6',
      explanation: '343 = 331 + 0.6T\n0.6T = 12\nT = 12 / 0.6 = 20 °C' },

    { id: 'L2-Q06', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'อัตราเร็วเสียงในอากาศ (แก๊ส) แปรผันตรงกับปริมาณใด',
      choices: ['อุณหภูมิในหน่วยองศาเซลเซียส', 'รากที่สองของอุณหภูมิในหน่วยเคลวิน', 'กำลังสองของอุณหภูมิในหน่วยเคลวิน', 'ความถี่ของเสียง'],
      answer: 1,
      hint: 'สูตร v = 331 + 0.6T เป็นสูตรประมาณ ความสัมพันธ์จริงเกี่ยวกับอุณหภูมิสัมบูรณ์',
      explanation: 'อัตราเร็วเสียงในแก๊ส v ∝ √T เมื่อ T เป็นเคลวิน จึงได้ v₁/v₂ = √(T₁/T₂) ส่วน v = 331 + 0.6T เป็นสูตรประมาณที่ใช้ได้ดีช่วงอุณหภูมิปกติ' },

    { id: 'L2-Q07', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 100,
      prompt: 'เสียงความถี่ 1,000 Hz เคลื่อนที่จากอากาศ (v ≈ 340 m/s) ลงไปในน้ำ (v ≈ 1,500 m/s) ข้อใดถูกต้อง',
      choices: ['ความถี่เพิ่มขึ้น ความยาวคลื่นเท่าเดิม', 'ความถี่เท่าเดิม ความยาวคลื่นสั้นลง', 'ความถี่เท่าเดิม ความยาวคลื่นยาวขึ้น', 'ความถี่ลดลง ความยาวคลื่นยาวขึ้น'],
      answer: 2,
      hint: 'ความถี่ขึ้นอยู่กับแหล่งกำเนิด ส่วน v = fλ',
      explanation: 'ความถี่ขึ้นกับแหล่งกำเนิดจึงคงเดิม เมื่อ v เพิ่มจาก 340 เป็น 1,500 m/s และ λ = v/f ความยาวคลื่นจึงยาวขึ้น (0.34 m → 1.5 m)' },

    { id: 'L2-Q08', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ส้อมเสียงความถี่ 500 Hz สั่นในอากาศที่อุณหภูมิ 20 °C ความยาวคลื่นเสียงเป็นกี่เมตร',
      answer: 0.686, unit: 'm', tol: { rel: 0.01 },
      hint: 'หา v จากอุณหภูมิก่อน แล้วใช้ λ = v/f',
      explanation: 'v = 331 + 0.6(20) = 343 m/s\nλ = v/f = 343 / 500 = 0.686 m' },

    { id: 'L2-Q09', type: 'num', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 200,
      prompt: 'คืนหนึ่งอากาศมีอุณหภูมิ 30 °C เห็นฟ้าแลบแล้วอีก 3.0 s จึงได้ยินเสียงฟ้าร้อง ฟ้าแลบเกิดห่างออกไปกี่เมตร (แสงมาถึงเกือบทันที)',
      answer: 1047, unit: 'm', tol: { rel: 0.01 },
      hint: 'เสียงเดินทางทางเดียวจากฟ้าแลบถึงผู้ฟัง: s = vt',
      explanation: 'v = 331 + 0.6(30) = 349 m/s\ns = vt = 349 × 3.0 = 1,047 m' },

    { id: 'L2-Q10', type: 'num', difficulty: 'ยาก', bloom: 'การประยุกต์', topic: TOPIC, points: 200,
      prompt: 'ยืนตะโกนหน้าหน้าผาในวันที่อากาศ 15 °C ได้ยินเสียงสะท้อนกลับมาหลังตะโกน 1.5 s หน้าผาอยู่ห่างกี่เมตร',
      answer: 255, unit: 'm', tol: { rel: 0.01 },
      hint: 'เสียงเดินทางไปถึงหน้าผาแล้วสะท้อนกลับ ระยะทางรวม = 2s',
      explanation: 'v = 331 + 0.6(15) = 340 m/s\nเสียงเดินทางไป-กลับ: 2s = vt = 340 × 1.5 = 510 m\ns = 255 m' },

    { id: 'L2-Q11', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'ที่อุณหภูมิ 27 °C เสียงมีอัตราเร็วค่าหนึ่ง ถ้าต้องการให้อัตราเร็วเสียงในอากาศเพิ่มเป็น 2 เท่า อากาศต้องมีอุณหภูมิกี่องศาเซลเซียส (ใช้ v ∝ √T)',
      answer: 927, unit: '°C', tol: { rel: 0.01 },
      hint: 'เปลี่ยน 27 °C เป็นเคลวินก่อน ถ้า v เพิ่ม 2 เท่า T (เคลวิน) ต้องเพิ่มกี่เท่า',
      explanation: 'T₁ = 27 + 273 = 300 K\nv₂/v₁ = √(T₂/T₁) = 2 ⇒ T₂ = 4T₁ = 1,200 K\nT₂ = 1,200 − 273 = 927 °C' },

    { id: 'L2-Q12', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'นักเรียนยืนที่จุดเดิมและวัดเวลาที่เสียงตบมือสะท้อนกลับจากผนังตึกเดิม 2 วัน วันแรก 20 °C วันที่สอง 35 °C ผลการวัดวันที่สองเป็นอย่างไร',
      choices: ['ใช้เวลานานขึ้น เพราะอากาศร้อนดูดกลืนเสียง', 'ใช้เวลาเท่าเดิม เพราะระยะทางเท่าเดิม', 'ใช้เวลาสั้นลง เพราะเสียงเคลื่อนที่เร็วขึ้น', 'ไม่ได้ยินเสียงสะท้อน เพราะอากาศร้อนเกินไป'],
      answer: 2,
      hint: 'ระยะทางเท่าเดิม แต่ v เปลี่ยนอย่างไร แล้ว t = 2s/v จะเปลี่ยนอย่างไร',
      explanation: 'วันที่ 35 °C: v = 352 m/s มากกว่าวันที่ 20 °C (343 m/s) ระยะทางไป-กลับเท่าเดิม t = 2s/v จึงสั้นลง' }
  ];

  /* ---------------- Mission: Sonic pulse timing ---------------- */
  const SCENARIOS = [
    { T: 20, t: 2.0 }, { T: 30, t: 3.0 }, { T: 10, t: 2.0 }, { T: -10, t: 2.0 }, { T: 40, t: 2.0 }, { T: 25, t: 1.5 }
  ].map(s => ({ ...s, v: 331 + 0.6 * s.T, d: Math.round((331 + 0.6 * s.T) * s.t) }));

  const mission = {
    id: 'L2-M01', title: '🧪 ภารกิจทดลอง: ยิงพัลส์เสียงให้ถึงเป้าตรงเวลา', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 150,
    prompt: 'ห้องทดลองควบคุมอุณหภูมิอากาศได้ ปรับอุณหภูมิให้พัลส์เสียงจากลำโพงเดินทางถึงเครื่องรับในเวลาที่กำหนดพอดี\nยิงพัลส์ทดสอบได้เพียง 3 ครั้ง ควรคำนวณก่อนทดลอง!',
    hint: 'หาอัตราเร็วที่ต้องการก่อนจาก v = s/t แล้วแก้สมการ v = 331 + 0.6T หาค่า T',
    explanation: 'อัตราเร็วเสียงที่ต้องการ v = s/t จากนั้นใช้ v = 331 + 0.6T ⇒ T = (v − 331)/0.6 เมื่ออุณหภูมิสูงขึ้น เสียงเคลื่อนที่เร็วขึ้น จึงใช้เวลาน้อยลง',
    mount(el, api) {
      const { h, canvas, slider, fmt } = api.lib;
      const S = api.lib.pick(SCENARIOS);
      const st = { T: 0, tests: 3, anim: null, measured: null, locked: false };
      const vOf = T => 331 + 0.6 * T;

      const cv = h('canvas', { 'aria-label': 'ภาพจำลองการยิงพัลส์เสียง' });
      const sim = h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: 'SONIC PULSE RANGE' }), cv);
      const readout = h('div', { class: 'readout', text: 'ยังไม่ได้ทดสอบ' });
      const testsEl = h('div', { class: 'attempts' });
      const showTests = () => testsEl.replaceChildren('พัลส์ทดสอบคงเหลือ ', h('b', { text: st.tests }), ' ครั้ง');

      const c = canvas(cv, 230, (x, w, hh) => {
        x.clearRect(0, 0, w, hh);
        const left = 70, right = w - 50, ground = hh - 46;
        // ground + distance ruler
        x.strokeStyle = 'rgba(34,227,255,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(20, ground); x.lineTo(w - 20, ground); x.stroke();
        x.fillStyle = '#8fb0cf'; x.font = '13px Kanit, sans-serif'; x.textAlign = 'center';
        x.fillText(`ระยะทาง s = ${S.d.toLocaleString()} m`, (left + right) / 2, ground + 22);
        x.strokeStyle = 'rgba(143,176,207,.6)'; x.lineWidth = 1; x.beginPath(); x.moveTo(left, ground + 8); x.lineTo(right, ground + 8); x.stroke();
        // speaker
        x.fillStyle = '#13295a'; x.strokeStyle = '#22e3ff'; x.lineWidth = 2;
        x.fillRect(left - 34, ground - 70, 30, 70); x.strokeRect(left - 34, ground - 70, 30, 70);
        x.beginPath(); x.arc(left - 19, ground - 35, 9, 0, Math.PI * 2); x.stroke();
        // receiver
        x.beginPath(); x.moveTo(right, ground); x.lineTo(right, ground - 80); x.stroke();
        x.fillStyle = '#ff4fd8'; x.beginPath(); x.moveTo(right, ground - 80); x.lineTo(right + 26, ground - 70); x.lineTo(right, ground - 60); x.fill();
        x.fillStyle = '#e8f7ff'; x.fillText('เครื่องรับ', right, ground - 88);
        // thermometer
        const tx = 26, ty = 40, th = 80, frac = (st.T + 20) / 70;
        x.strokeStyle = '#8fb0cf'; x.lineWidth = 2; x.strokeRect(tx, ty, 10, th);
        x.fillStyle = st.T >= 30 ? '#ff5577' : st.T <= 0 ? '#00a6ff' : '#ffc53d';
        x.fillRect(tx + 2, ty + th * (1 - frac), 6, th * frac);
        x.beginPath(); x.arc(tx + 5, ty + th + 8, 9, 0, Math.PI * 2); x.fill();
        x.textAlign = 'left'; x.fillStyle = '#e8f7ff'; x.font = '600 14px Kanit, sans-serif';
        x.fillText(`${st.T} °C`, tx + 22, ty + 12);
        x.textAlign = 'center'; x.fillStyle = '#ffd54a'; x.font = '600 14px Kanit, sans-serif';
        x.fillText(`เป้าหมาย: ถึงเครื่องรับใน ${S.t.toFixed(2)} s พอดี`, w / 2, 22);
        // pulse
        if (st.anim) {
          const el = (performance.now() - st.anim.start) / 1000, frac2 = Math.min(1, el / st.anim.dur);
          const px = left + (right - left) * frac2;
          for (let k = 0; k < 4; k++) {
            x.strokeStyle = `rgba(34,227,255,${0.9 - k * 0.2})`; x.lineWidth = 3; x.shadowColor = '#22e3ff'; x.shadowBlur = 12;
            x.beginPath(); x.arc(px - k * 10, ground - 35, 26 - k * 3, -0.7, 0.7); x.stroke();
          }
          x.shadowBlur = 0;
          x.fillStyle = '#e8f7ff'; x.font = '13px Kanit, sans-serif';
          x.fillText(`t = ${Math.min(el, st.anim.dur).toFixed(2)} s`, px, ground - 72);
          if (frac2 >= 1 && !st.anim.done) { st.anim.done = true; finishTest(); }
        }
        x.textAlign = 'left';
      });
      c.start();

      const temp = slider({ label: 'อุณหภูมิอากาศในห้องทดลอง', min: -20, max: 50, step: 1, value: 0, steps: [-5, -1, 1, 5], format: v => v + ' °C', onInput: v => { st.T = v; } });
      const testBtn = h('button', { class: 'btn ghost', type: 'button', text: '🔊 ยิงพัลส์ทดสอบ', onclick: fire });
      function fire() {
        if (st.locked || st.anim && !st.anim.done) return;
        if (st.tests <= 0) { api.sfx.wrong(); readout.textContent = 'พัลส์ทดสอบหมดแล้ว คำนวณแล้วส่งผลได้เลย'; return; }
        st.tests--; showTests();
        const dur = S.d / vOf(st.T);
        st.anim = { start: performance.now(), dur, T: st.T, done: false };
        testBtn.disabled = true; temp.disable(true); api.sfx.click();
        readout.textContent = '⏱ กำลังวัดเวลา...';
      }
      function finishTest() {
        st.measured = st.anim; api.sfx.select();
        readout.textContent = `ที่ ${st.anim.T} °C พัลส์ถึงเครื่องรับใน ${st.anim.dur.toFixed(3)} s (เป้าหมาย ${S.t.toFixed(3)} s)`;
        if (!st.locked) { testBtn.disabled = st.tests <= 0; temp.disable(false); }
      }
      showTests();

      el.append(sim, h('div', { class: 'sim-controls' }, temp.el, h('div', { class: 'control' }, testBtn, testsEl, readout)),
        h('div', { class: 'qpart' }, h('h4', { text: 'ข้อมูลภารกิจ' }),
          h('div', { text: `ระยะลำโพง–เครื่องรับ s = ${S.d.toLocaleString()} m · เวลาที่ต้องการ t = ${S.t.toFixed(2)} s · ใช้ v = 331 + 0.6T` }),
          h('div', { class: 'muted small', text: 'ตั้งอุณหภูมิที่คำนวณได้ แล้วกด “ตรวจผลการทดลอง” (ยอมรับคลาดเคลื่อน ±1 °C)' })));

      return {
        check() {
          if (st.anim && !st.anim.done) return { invalid: true, msg: 'รอให้พัลส์ทดสอบถึงเครื่องรับก่อน' };
          const ok = Math.abs(st.T - S.T) <= 1;
          const tNow = S.d / vOf(st.T);
          return { ok, msg: `ที่ ${st.T} °C เสียงจะใช้เวลา ${tNow.toFixed(3)} s ซึ่ง${tNow > S.t ? 'ช้ากว่า' : 'เร็วกว่า'}เป้าหมาย` };
        },
        solution() { return `เฉลย: v = s/t = ${S.d} / ${S.t} = ${fmt(S.v, 4)} m/s ⇒ T = (${fmt(S.v, 4)} − 331)/0.6 = ${S.T} °C`; },
        lock() { st.locked = true; temp.disable(true); testBtn.disabled = true; },
        destroy() { c.destroy(); },
        _debug: () => ({ T: S.T })
      };
    }
  };

  SQ.registerLevel({
    id: 2, code: 'LEVEL 2', title: 'Sound Speed', th: 'อัตราเร็วเสียง', icon: '⚡', topic: TOPIC,
    objective: 'คำนวณอัตราเร็วเสียงในอากาศที่อุณหภูมิต่าง ๆ ด้วย v = 331 + 0.6T ใช้ v = fλ และ s = vt แก้ปัญหาเสียงสะท้อนและฟ้าร้อง และควบคุมอุณหภูมิให้พัลส์เสียงถึงเป้าตรงเวลา',
    questions, missions: [mission]
  });
})(window.SQ);
