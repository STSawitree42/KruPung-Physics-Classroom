/* =========================================================
   LEVEL 4: Sound Intensity — I = P/4πr², β = 10 log(I/I₀)
   ========================================================= */
(function (SQ) {
  'use strict';
  const TOPIC = 'ความเข้มเสียงและระดับความเข้มเสียง';

  const questions = [
    { id: 'L4-Q01', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'ความเข้มเสียงน้อยที่สุดที่หูคนปกติเริ่มได้ยิน (I₀) มีค่าเท่าใด',
      choices: ['1 W/m²', '10⁻⁶ W/m²', '10⁻¹² W/m²', '10¹² W/m²'],
      answer: 2,
      hint: 'ค่านี้ทำให้ β = 0 dB',
      explanation: 'I₀ = 10⁻¹² W/m² คือขีดเริ่มได้ยิน (0 dB) ส่วนประมาณ 1 W/m² (120 dB) คือขีดเริ่มเจ็บปวด' },

    { id: 'L4-Q02', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'ความดังของเสียงที่หูรับรู้ ขึ้นอยู่กับปริมาณใดของคลื่นเสียงโดยตรง',
      choices: ['ความถี่', 'ความเข้มเสียง ซึ่งขึ้นกับแอมพลิจูด', 'ความยาวคลื่น', 'อัตราเร็วเสียง'],
      answer: 1,
      hint: 'เสียงดัง–ค่อย ต่างจากเสียงสูง–ต่ำ',
      explanation: 'ความดังขึ้นกับความเข้มเสียง (กำลังเสียงต่อพื้นที่) ซึ่งแปรผันตรงกับกำลังสองของแอมพลิจูด ส่วนเสียงสูง–ต่ำขึ้นกับความถี่' },

    { id: 'L4-Q03', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'ถ้าระยะห่างจากแหล่งกำเนิดเสียงแบบจุดเพิ่มขึ้นเป็น 2 เท่า ความเข้มเสียงจะเป็นกี่เท่าของเดิม',
      choices: ['2 เท่า', '1/2 เท่า', '1/4 เท่า', '1/8 เท่า'],
      answer: 2,
      hint: 'พลังงานเสียงกระจายบนผิวทรงกลมพื้นที่ 4πr²',
      explanation: 'I = P/(4πr²) ⇒ I ∝ 1/r² เมื่อ r เพิ่ม 2 เท่า I ลดลงเหลือ 1/2² = 1/4 เท่า' },

    { id: 'L4-Q04', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ลำโพงให้กำลังเสียง 20 W กระจายออกรอบทิศทางเท่ากัน ความเข้มเสียงที่ระยะ 5.0 m เป็นกี่ W/m²',
      answer: 20 / (4 * Math.PI * 25), unit: 'W/m²', tol: { rel: 0.02 },
      hint: 'I = P/(4πr²)',
      explanation: 'I = P/(4πr²) = 20 / (4π × 5.0²) = 20 / 314.2 ≈ 0.0637 W/m²' },

    { id: 'L4-Q05', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'เสียงมีความเข้ม 10⁻⁵ W/m² ระดับความเข้มเสียงเป็นกี่เดซิเบล (I₀ = 10⁻¹² W/m²)',
      answer: 70, unit: 'dB', tol: { abs: 0.5 },
      hint: 'β = 10 log(I/I₀) และ 10⁻⁵ / 10⁻¹² = 10⁷',
      explanation: 'β = 10 log(10⁻⁵ / 10⁻¹²) = 10 log(10⁷) = 10 × 7 = 70 dB' },

    { id: 'L4-Q06', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ถนนที่มีรถหนาแน่นมีระดับความเข้มเสียง 80 dB ความเข้มเสียงเป็นกี่ W/m² (ตอบในรูป 1×10^-4 หรือ 1e-4 ได้)',
      answer: 1e-4, unit: 'W/m²', tol: { rel: 0.02 },
      hint: '80 = 10 log(I/10⁻¹²) ⇒ I/10⁻¹² = 10⁸',
      explanation: '80 = 10 log(I / 10⁻¹²)\nlog(I / 10⁻¹²) = 8 ⇒ I = 10⁸ × 10⁻¹² = 10⁻⁴ W/m²' },

    { id: 'L4-Q07', type: 'num', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 200,
      prompt: 'เครื่องจักร 1 เครื่องทำให้ระดับเสียง ณ จุดหนึ่งเป็น 70 dB ถ้าเปิดเครื่องจักรแบบเดียวกันพร้อมกัน 10 เครื่อง ระดับเสียง ณ จุดเดิมเป็นกี่เดซิเบล',
      answer: 80, unit: 'dB', tol: { abs: 0.5 },
      hint: 'ความเข้มเสียงรวมกันได้ (I รวม = 10I) แต่เดซิเบลบวกกันตรง ๆ ไม่ได้',
      explanation: 'ความเข้มรวม = 10 เท่า\nΔβ = 10 log(10) = 10 dB\nβ = 70 + 10 = 80 dB (ไม่ใช่ 700 dB)' },

    { id: 'L4-Q08', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'เสียงในห้องเรียนเงียบมีระดับ 60 dB ส่วนเสียงคอนเสิร์ตมีระดับ 90 dB ความเข้มเสียงคอนเสิร์ตเป็นกี่เท่าของเสียงในห้องเรียน',
      answer: 1000, unit: 'เท่า', tol: { rel: 0.01 },
      hint: 'β₂ − β₁ = 10 log(I₂/I₁)',
      explanation: '90 − 60 = 10 log(I₂/I₁)\nlog(I₂/I₁) = 3 ⇒ I₂/I₁ = 10³ = 1,000 เท่า' },

    { id: 'L4-Q09', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'ที่ระยะ 1.0 m จากลำโพง วัดระดับเสียงได้ 100 dB ที่ระยะ 10 m ระดับเสียงเป็นกี่เดซิเบล (ไม่คิดการดูดกลืนและการสะท้อน)',
      answer: 80, unit: 'dB', tol: { abs: 0.5 },
      hint: 'ระยะเพิ่ม 10 เท่า ความเข้มลดลงกี่เท่า แล้วแปลงเป็นเดซิเบล',
      explanation: 'I ∝ 1/r² ⇒ ระยะ ×10 ความเข้มลดลง 100 เท่า\nΔβ = 10 log(1/100) = −20 dB\nβ = 100 − 20 = 80 dB' },

    { id: 'L4-Q10', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 100,
      prompt: 'ตามมาตรฐานความปลอดภัยในการทำงาน ลูกจ้างไม่ควรได้รับเสียงที่มีระดับเสียงเฉลี่ยตลอดการทำงาน 8 ชั่วโมงเกินเท่าใด',
      choices: ['40 dB(A)', '60 dB(A)', '85 dB(A)', '140 dB(A)'],
      answer: 2,
      hint: 'เป็นค่าที่ถ้าเกินต้องใช้อุปกรณ์ป้องกันเสียง เช่น ที่อุดหู',
      explanation: 'ระดับเสียงเฉลี่ย 8 ชั่วโมงไม่ควรเกิน 85 dB(A) ถ้าดังกว่านี้ต้องลดเวลาที่สัมผัสเสียงหรือใช้อุปกรณ์ป้องกันอันตรายจากเสียง เพื่อป้องกันการสูญเสียการได้ยิน' },

    { id: 'L4-Q11', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'ลำโพง 1 ตัวทำให้ระดับเสียง ณ จุดหนึ่งเป็น 60 dB ถ้าเปิดลำโพงแบบเดียวกันเพิ่มอีก 1 ตัว (รวมเป็น 2 ตัว ไม่คิดการแทรกสอด) ระดับเสียง ณ จุดเดิมประมาณเท่าใด',
      choices: ['63 dB', '66 dB', '120 dB', '60 dB'],
      answer: 0,
      hint: 'ความเข้มเพิ่มเป็น 2 เท่า และ log 2 ≈ 0.301',
      explanation: 'ความเข้มรวม = 2I ⇒ Δβ = 10 log 2 ≈ 3 dB\nβ ≈ 60 + 3 = 63 dB' },

    { id: 'L4-Q12', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'ถ้าระดับความเข้มเสียงเพิ่มขึ้น 20 dB แอมพลิจูดของคลื่นเสียงจะเพิ่มขึ้นกี่เท่า',
      choices: ['2 เท่า', '10 เท่า', '20 เท่า', '100 เท่า'],
      answer: 1,
      hint: 'หาก่อนว่าความเข้มเพิ่มกี่เท่า แล้วใช้ I ∝ A²',
      explanation: 'Δβ = 20 dB ⇒ I₂/I₁ = 10² = 100\nI ∝ A² ⇒ A₂/A₁ = √100 = 10 เท่า' },

    { id: 'L4-Q13', type: 'num', difficulty: 'ยาก', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ที่ระยะ 2.0 m จากแหล่งกำเนิดเสียงแบบจุด ความเข้มเสียงเป็น 4.0×10⁻³ W/m² ที่ระยะ 4.0 m ความเข้มเสียงเป็นกี่ W/m²',
      answer: 1e-3, unit: 'W/m²', tol: { rel: 0.02 },
      hint: 'I₂/I₁ = (r₁/r₂)²',
      explanation: 'I₂ = I₁ (r₁/r₂)² = 4.0×10⁻³ × (2/4)² = 4.0×10⁻³ × 1/4 = 1.0×10⁻³ W/m²' }
  ];

  /* ---------------- Mission: Broken decibel meter ---------------- */
  const P_W = 4 * Math.PI;            // speaker power ≈ 12.57 W  ⇒  I = 1/r²
  const I0 = 1e-12;
  const TARGETS = [90, 94, 96, 100, 106, 110];
  const mission = {
    id: 'L4-M01', title: '🧪 ภารกิจทดลอง: เครื่องวัดเดซิเบลเสีย!', difficulty: 'ยาก', bloom: 'การประยุกต์', topic: TOPIC, points: 150,
    prompt: 'ลำโพงทดสอบให้กำลังเสียง P = 4π W (≈ 12.57 W) กระจายรอบทิศทาง แต่เครื่องวัดเดซิเบลเสีย แสดงได้แค่ “ความเข้มเสียง I”\nเลื่อนไมโครโฟนไปยังระยะที่ระดับเสียงเท่ากับค่าเป้าหมาย แล้วตอบคำถามส่วนที่ 2',
    hint: 'แปลง dB เป็นความเข้มก่อน: I = I₀ × 10^(β/10) แล้วหาระยะจาก r = √(P / 4πI) (ลำโพงนี้ให้ I = 1/r² พอดี)',
    explanation: 'จาก β = 10 log(I/I₀) ⇒ I = I₀·10^(β/10) และ I = P/(4πr²) ⇒ r = √(P/(4πI)) เมื่อระยะเพิ่ม 2 เท่า ความเข้มลดเหลือ 1/4 ระดับเสียงลดลง 10 log 4 ≈ 6 dB',
    mount(el, api) {
      const { h, canvas, slider, pick, segmented, shuffle, fmt } = api.lib;
      const target = pick(TARGETS);
      const Ireq = I0 * Math.pow(10, target / 10), rReq = Math.sqrt(P_W / (4 * Math.PI * Ireq));
      const st = { r: 1, locked: false };
      const Iof = r => P_W / (4 * Math.PI * r * r);
      const beta = r => 10 * Math.log10(Iof(r) / I0);

      const cv = h('canvas', { 'aria-label': 'ภาพจำลองลำโพงและไมโครโฟน' });
      const sim = h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: 'ACOUSTIC FIELD · P = 4π W' }), cv);
      const readout = h('div', { class: 'readout' });
      const RMAX = 40;
      const c = canvas(cv, 250, (x, w, hh, t) => {
        x.clearRect(0, 0, w, hh);
        const ox = 50, oy = hh / 2 + 10, s = (w - 90) / RMAX;
        // expanding rings, brightness ∝ 1/r²
        for (let k = 0; k < 14; k++) {
          const r = ((t * 6 + k * 3) % RMAX);
          const a = Math.min(0.8, 1.5 / Math.max(1, r * 0.35));
          x.strokeStyle = `rgba(34,227,255,${a})`; x.lineWidth = 2;
          x.beginPath(); x.arc(ox, oy, r * s, -1.1, 1.1); x.stroke();
        }
        // sphere through the mic
        x.setLineDash([5, 6]); x.strokeStyle = 'rgba(255,79,216,.6)'; x.lineWidth = 1.5;
        x.beginPath(); x.arc(ox, oy, st.r * s, -1.2, 1.2); x.stroke(); x.setLineDash([]);
        // scale
        x.fillStyle = '#8fb0cf'; x.font = '12px Kanit, sans-serif'; x.textAlign = 'center';
        for (let m = 0; m <= RMAX; m += 5) { const px = ox + m * s; x.fillRect(px, hh - 26, 1, 6); x.fillText(m + ' m', px, hh - 8); }
        // speaker
        x.fillStyle = '#13295a'; x.strokeStyle = '#22e3ff'; x.lineWidth = 2;
        x.fillRect(ox - 30, oy - 26, 26, 52); x.strokeRect(ox - 30, oy - 26, 26, 52);
        // mic
        const mx = ox + st.r * s;
        x.fillStyle = '#ff4fd8'; x.shadowColor = '#ff4fd8'; x.shadowBlur = 14;
        x.beginPath(); x.arc(mx, oy, 8, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
        x.fillStyle = '#e8f7ff'; x.font = '600 13px Kanit, sans-serif';
        x.fillText(`r = ${st.r.toFixed(2)} m`, mx, oy - 22);
        x.fillStyle = '#ffd54a'; x.fillText(`เป้าหมาย: ${target} dB`, w / 2, 20);
        x.textAlign = 'left';
      });
      c.start();

      const upd = () => { readout.textContent = `ความเข้มที่วัดได้ I = ${fmt(Iof(st.r), 3)} W/m² · ระดับเสียง = ??? dB`; };
      const rSl = slider({ label: 'ระยะไมโครโฟนจากลำโพง r', min: 1, max: RMAX, step: 0.05, value: 1, steps: [-1, -0.1, 0.1, 1], format: v => v.toFixed(2) + ' m', onInput: v => { st.r = v; upd(); } });
      upd();
      const q2opts = shuffle([
        { value: 6, label: `ประมาณ ${target - 6} dB` }, { value: 3, label: `ประมาณ ${target - 3} dB` },
        { value: 20, label: `ประมาณ ${target - 20} dB` }, { value: 50, label: `ประมาณ ${target / 2} dB` }]);
      const q2 = segmented(q2opts, () => api.sfx.click());
      el.append(sim,
        h('div', { class: 'sim-controls' }, rSl.el, h('div', { class: 'control' }, h('label', null, h('span', { text: '📟 เครื่องวัด (โหมดความเข้มเท่านั้น)' })), readout)),
        h('div', { class: 'qpart' }, h('h4', { text: `ส่วนที่ 1: วางไมโครโฟนให้ระดับเสียงเท่ากับ ${target} dB (คลาดเคลื่อนได้ ±0.5 dB)` }),
          h('div', { class: 'muted small', text: 'I₀ = 10⁻¹² W/m² · β = 10 log(I/I₀) · I = P/(4πr²)' })),
        h('div', { class: 'qpart' }, h('h4', { text: 'ส่วนที่ 2: ถ้าเลื่อนไมโครโฟนออกไปไกลเป็น 2 เท่าของระยะที่หาได้ ระดับเสียงจะเป็นเท่าใด' }), q2.el));
      return {
        check() {
          if (q2.value == null) return { invalid: true, msg: 'ตอบส่วนที่ 2 ก่อนส่งผล' };
          const b = beta(st.r);
          const ok1 = Math.abs(b - target) <= 0.5, ok2 = q2.value === 6;
          return { ok: ok1 && ok2, msg: `ผลตรวจ: ถูก ${[ok1, ok2].filter(Boolean).length} จาก 2 ส่วน` + (ok1 ? '' : ` · ตำแหน่งนี้ระดับเสียง${b > target ? 'สูง' : 'ต่ำ'}กว่าเป้าหมาย`) };
        },
        solution() {
          return `เฉลย: I = 10⁻¹² × 10^(${target}/10) = ${fmt(Ireq, 3)} W/m² ⇒ r = √(1/I) = ${rReq.toFixed(2)} m · ที่ระยะ 2r ระดับเสียง ≈ ${target} − 6 = ${target - 6} dB`;
        },
        lock() { st.locked = true; rSl.disable(true); q2.disable(true); readout.textContent = `ระดับเสียงที่ระยะ ${st.r.toFixed(2)} m = ${beta(st.r).toFixed(1)} dB`; },
        destroy() { c.destroy(); },
        _debug: () => ({ r: rReq, label: `ประมาณ ${target - 6} dB` })
      };
    }
  };

  SQ.registerLevel({
    id: 4, code: 'LEVEL 4', title: 'Sound Intensity', th: 'ความเข้มเสียง', icon: '📢', topic: TOPIC,
    objective: 'คำนวณความเข้มเสียง I = P/4πr² และระดับความเข้มเสียง β = 10 log(I/I₀) เข้าใจกฎกำลังสองผกผัน การรวมเสียงหลายแหล่ง และเกณฑ์ความปลอดภัยของการได้ยิน',
    questions, missions: [mission]
  });
})(window.SQ);
