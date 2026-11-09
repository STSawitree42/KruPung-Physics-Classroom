/* =========================================================
   LEVEL 5: Pitch and Timbre — ระดับเสียง คุณภาพเสียง ฮาร์มอนิก
   ========================================================= */
(function (SQ) {
  'use strict';
  const TOPIC = 'ระดับเสียงและคุณภาพเสียง';

  const questions = [
    { id: 'L5-Q01', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'ระดับเสียง (เสียงสูง–เสียงต่ำ) ขึ้นอยู่กับปริมาณใดของคลื่นเสียง',
      choices: ['แอมพลิจูด', 'ความถี่', 'ความเข้มเสียง', 'อัตราเร็วเสียง'],
      answer: 1,
      hint: 'เสียงแหลมของนกหวีดกับเสียงทุ้มของกลองต่างกันที่อะไร',
      explanation: 'ความถี่สูง → เสียงสูง (แหลม) ความถี่ต่ำ → เสียงต่ำ (ทุ้ม) ส่วนแอมพลิจูด/ความเข้มเสียงกำหนดความดัง' },

    { id: 'L5-Q02', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'ช่วงความถี่ของเสียงที่หูมนุษย์โดยทั่วไปได้ยิน คือข้อใด',
      choices: ['2 – 2,000 Hz', '20 – 20,000 Hz', '200 – 200,000 Hz', '20,000 – 2,000,000 Hz'],
      answer: 1,
      hint: 'ขีดบนประมาณ 20 kHz',
      explanation: 'มนุษย์ได้ยินเสียงความถี่ประมาณ 20 Hz ถึง 20,000 Hz (20 kHz) ขีดบนลดลงตามอายุ' },

    { id: 'L5-Q03', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'เสียงที่มีความถี่ต่ำกว่า 20 Hz เช่น เสียงที่ช้างใช้สื่อสารกันในระยะไกล เรียกว่าอะไร',
      choices: ['อัลตราซาวด์', 'อินฟราซาวด์', 'โซนาร์', 'เสียงก้อง'],
      answer: 1,
      hint: 'infra = ต่ำกว่า, ultra = เหนือกว่า',
      explanation: 'อินฟราซาวด์ (infrasound) คือเสียงความถี่ต่ำกว่า 20 Hz ส่วนอัลตราซาวด์ (ultrasound) คือเสียงความถี่สูงกว่า 20,000 Hz' },

    { id: 'L5-Q04', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'ไวโอลินและฟลุตเล่นโน้ตเดียวกัน (ความถี่มูลฐานเท่ากัน) ดังเท่ากัน แต่เรายังแยกได้ว่าเป็นเครื่องดนตรีต่างชนิด เพราะสิ่งใดต่างกัน',
      choices: ['ความถี่มูลฐาน', 'อัตราเร็วเสียง', 'จำนวนและความเข้มของฮาร์มอนิก (คุณภาพเสียง)', 'ความยาวคลื่นของความถี่มูลฐาน'],
      answer: 2,
      hint: 'รูปคลื่นของเครื่องดนตรีแต่ละชนิดไม่เหมือนกัน เพราะมีอะไรผสมอยู่',
      explanation: 'เครื่องดนตรีแต่ละชนิดมีฮาร์มอนิกผสมอยู่ต่างกัน รูปคลื่นจึงต่างกัน เรียกว่า “คุณภาพเสียง” (timbre)' },

    { id: 'L5-Q05', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'เสียงจากเครื่องดนตรีชิ้นหนึ่งมีความถี่มูลฐาน 220 Hz ฮาร์มอนิกที่ 3 ของเสียงนี้มีความถี่กี่เฮิรตซ์',
      answer: 660, unit: 'Hz', tol: { rel: 0.005 },
      hint: 'ฮาร์มอนิกที่ n มีความถี่ n × f₁',
      explanation: 'f₃ = 3 × f₁ = 3 × 220 = 660 Hz' },

    { id: 'L5-Q06', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'โน้ตโด (C4) มีความถี่ประมาณ 262 Hz โน้ตโดที่สูงกว่านี้ 2 อ็อกเทฟ (C6) มีความถี่ประมาณกี่เฮิรตซ์',
      answer: 1048, unit: 'Hz', tol: { rel: 0.01 },
      hint: 'สูงขึ้น 1 อ็อกเทฟ ความถี่เพิ่มเป็น 2 เท่า',
      explanation: 'สูงขึ้น 2 อ็อกเทฟ ⇒ ความถี่ × 2² = 262 × 4 = 1,048 Hz' },

    { id: 'L5-Q07', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'สัญญาณเสียงบนจอออสซิลโลสโคปมีคาบ 2.5 ms เสียงนี้มีความถี่กี่เฮิรตซ์',
      answer: 400, unit: 'Hz', tol: { rel: 0.01 },
      hint: 'f = 1/T และ 1 ms = 10⁻³ s',
      explanation: 'T = 2.5 ms = 2.5 × 10⁻³ s\nf = 1/T = 1 / 0.0025 = 400 Hz' },

    { id: 'L5-Q08', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 100,
      prompt: 'ข้อใดเป็นการใช้ประโยชน์จากอัลตราซาวด์',
      choices: ['การตรวจดูทารกในครรภ์', 'การฟังวิทยุ AM', 'การเตือนภัยแผ่นดินไหวจากเสียงความถี่ต่ำ', 'การส่งสัญญาณโทรทัศน์'],
      answer: 0,
      hint: 'อัลตราซาวด์คือเสียงความถี่สูงที่หูมนุษย์ไม่ได้ยิน ใช้สะท้อนภาพอวัยวะภายใน',
      explanation: 'อัลตราซาวด์มีความยาวคลื่นสั้น สะท้อนจากรอยต่อของเนื้อเยื่อได้ดี จึงใช้สร้างภาพทางการแพทย์ เช่น ตรวจทารกในครรภ์ วิทยุและโทรทัศน์ใช้คลื่นแม่เหล็กไฟฟ้า' },

    { id: 'L5-Q09', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'รูปคลื่นของเสียง A และ B บนออสซิลโลสโคปมีคาบเท่ากันและแอมพลิจูดสูงสุดเท่ากัน แต่รูปร่างต่างกัน (A เป็นรูปไซน์เรียบ B เป็นรูปหยัก) ข้อสรุปใดถูกต้อง',
      choices: ['ระดับเสียงเท่ากัน คุณภาพเสียงต่างกัน', 'ระดับเสียงต่างกัน คุณภาพเสียงเท่ากัน', 'ดังต่างกัน ระดับเสียงต่างกัน', 'เป็นเสียงเดียวกันทุกประการ'],
      answer: 0,
      hint: 'คาบเท่ากันบอกอะไร รูปร่างคลื่นต่างกันบอกอะไร',
      explanation: 'คาบเท่ากัน ⇒ ความถี่มูลฐานเท่ากัน ⇒ ระดับเสียงเท่ากัน ส่วนรูปร่างต่างกันแสดงว่ามีฮาร์มอนิกผสมต่างกัน ⇒ คุณภาพเสียงต่างกัน' },

    { id: 'L5-Q10', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'แหล่งกำเนิดเสียงใดให้รูปคลื่นใกล้เคียง “คลื่นไซน์บริสุทธิ์” มากที่สุด',
      choices: ['ส้อมเสียง', 'กีตาร์ไฟฟ้าที่ใช้เอฟเฟกต์เสียงแตก', 'เสียงพูดของคน', 'กลองชุด'],
      answer: 0,
      hint: 'แหล่งกำเนิดใดสั่นด้วยความถี่เดียวเกือบไม่มีฮาร์มอนิก',
      explanation: 'ส้อมเสียงสั่นด้วยความถี่มูลฐานเกือบเพียงความถี่เดียว ฮาร์มอนิกน้อยมาก รูปคลื่นจึงใกล้เคียงคลื่นไซน์ ส่วนแหล่งอื่นมีฮาร์มอนิกและความถี่ผสมจำนวนมาก' },

    { id: 'L5-Q11', type: 'num', difficulty: 'ยาก', bloom: 'การประยุกต์', topic: TOPIC, points: 200,
      prompt: 'นกหวีดสำหรับฝึกสุนัขให้เสียงความถี่ 25 kHz ซึ่งคนไม่ได้ยินแต่สุนัขได้ยิน ถ้าอัตราเร็วเสียงในอากาศ 340 m/s เสียงนี้มีความยาวคลื่นกี่เซนติเมตร',
      answer: 1.36, unit: 'cm', tol: { rel: 0.01 },
      hint: 'λ = v/f โดย f = 25,000 Hz แล้วแปลงเมตรเป็นเซนติเมตร',
      explanation: 'λ = v/f = 340 / 25,000 = 0.0136 m = 1.36 cm' },

    { id: 'L5-Q12', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'โดยทั่วไปเสียงพูดของผู้หญิงมีระดับเสียงสูงกว่าผู้ชาย สาเหตุทางฟิสิกส์ที่เหมาะสมที่สุดคือข้อใด',
      choices: ['เส้นเสียงสั้นและบางกว่า จึงสั่นด้วยความถี่สูงกว่า', 'เส้นเสียงยาวและหนากว่า จึงสั่นด้วยความถี่สูงกว่า', 'เสียงผู้หญิงเคลื่อนที่เร็วกว่าในอากาศ', 'เสียงผู้หญิงมีแอมพลิจูดมากกว่า'],
      answer: 0,
      hint: 'เปรียบเทียบสายกีตาร์เส้นเล็ก–สั้น กับเส้นใหญ่–ยาว',
      explanation: 'วัตถุที่สั้น บาง และมีมวลน้อยกว่าจะสั่นด้วยความถี่ธรรมชาติสูงกว่า เส้นเสียงผู้หญิงโดยเฉลี่ยสั้นและบางกว่า จึงให้ความถี่มูลฐานสูงกว่า อัตราเร็วเสียงในอากาศเท่ากัน' },

    { id: 'L5-Q13', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'ตั้งออสซิลโลสโคปที่ฐานเวลา 1 ms ต่อช่อง พบว่าคลื่นเสียง 1 รอบกว้าง 4 ช่องพอดี เสียงนี้มีความถี่กี่เฮิรตซ์',
      answer: 250, unit: 'Hz', tol: { rel: 0.01 },
      hint: 'คาบ = จำนวนช่อง × เวลาต่อช่อง',
      explanation: 'T = 4 ช่อง × 1 ms = 4 ms = 0.004 s\nf = 1/T = 250 Hz' }
  ];

  /* ---------------- shared drawing: oscilloscope grid ---------------- */
  function scopeGrid(x, w, hh, divs) {
    x.strokeStyle = 'rgba(34,227,255,.12)'; x.lineWidth = 1;
    for (let i = 0; i <= divs; i++) { const px = i * w / divs; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, hh); x.stroke(); }
    for (let j = 0; j <= 4; j++) { const py = j * hh / 4; x.beginPath(); x.moveTo(0, py); x.lineTo(w, py); x.stroke(); }
  }

  /* ---------------- Mission 1: Pitch match ---------------- */
  const pitchMatch = {
    id: 'L5-M01', title: '🎼 ภารกิจทดลอง: จับคู่เสียงสูง–ต่ำกับความถี่', difficulty: 'ปานกลาง', bloom: 'การวิเคราะห์', topic: TOPIC, points: 150,
    prompt: 'เครื่องกำเนิดสัญญาณ 3 เครื่อง (A, B, C) ให้เสียงความถี่ต่างกัน ฟังเสียง และ/หรือ นับจำนวนรอบบนจอออสซิลโลสโคป (กว้าง 10 ms) แล้วจับคู่แต่ละเสียงกับความถี่ให้ถูกต้อง',
    hint: 'นับจำนวนรอบที่เห็นในจอ 10 ms แล้วหารด้วย 0.010 s จะได้ความถี่ เช่น 3 รอบใน 10 ms = 300 Hz · เสียงที่สูงกว่ามีจำนวนรอบมากกว่า',
    explanation: 'ความถี่คือจำนวนรอบต่อวินาที f = (จำนวนรอบ)/(เวลา) เสียงที่ความถี่สูงกว่าฟังแล้วสูง (แหลม) กว่า และบนจอเห็นจำนวนรอบในเวลาเท่ากันมากกว่า',
    mount(el, api) {
      const { h, canvas, segmented, shuffle } = api.lib;
      const pool = shuffle([200, 300, 400, 500, 600, 800]);
      const freqs = pool.slice(0, 3), distractor = pool[3];
      const choices = [...freqs, distractor].sort((a, b) => a - b).map(f => ({ value: f, label: f + ' Hz' }));
      const names = ['A', 'B', 'C'];
      const tones = [];
      const canvases = [];
      const segs = freqs.map(() => segmented(choices, () => api.sfx.click()));
      const cards = freqs.map((f, i) => {
        const cv = h('canvas', { 'aria-label': `จอสัญญาณ ${names[i]}` });
        const c = canvas(cv, 90, (x, w, hh) => {
          x.clearRect(0, 0, w, hh); scopeGrid(x, w, hh, 10);
          x.strokeStyle = '#22e3ff'; x.lineWidth = 2.2; x.shadowColor = '#22e3ff'; x.shadowBlur = 8; x.beginPath();
          for (let px = 0; px <= w; px++) { const tt = px / w * 0.010; const y = hh / 2 - (hh * 0.38) * Math.sin(2 * Math.PI * f * tt); px ? x.lineTo(px, y) : x.moveTo(px, y); }
          x.stroke(); x.shadowBlur = 0;
          x.fillStyle = '#8fb0cf'; x.font = '11px Kanit, sans-serif'; x.fillText('0', 3, hh - 4); x.textAlign = 'right'; x.fillText('10 ms', w - 3, hh - 4); x.textAlign = 'left';
        });
        canvases.push(c);
        const play = h('button', { class: 'btn ghost sm', type: 'button', text: `▶ ฟังเสียง ${names[i]}`, onclick: () => {
          tones.forEach(t => t && t.stop());
          tones[i] = api.audio.tones([f], { duration: 1.2, volume: 0.15 });
        } });
        return h('div', { class: 'qpart' }, h('div', { class: 'row spread' }, h('h4', { text: `สัญญาณ ${names[i]}` }), play),
          h('div', { class: 'sim', style: { marginBottom: '10px' } }, cv), segs[i].el);
      });
      el.append(...cards);
      return {
        check() {
          if (segs.some(s => s.value == null)) return { invalid: true, msg: 'จับคู่ให้ครบทั้ง 3 สัญญาณก่อน' };
          const n = segs.filter((s, i) => s.value === freqs[i]).length;
          return { ok: n === 3, msg: `ผลตรวจ: จับคู่ถูก ${n} จาก 3 สัญญาณ` };
        },
        solution() { return 'เฉลย: ' + freqs.map((f, i) => `${names[i]} = ${f} Hz (${f / 100} รอบใน 10 ms)`).join(' · '); },
        lock() { segs.forEach(s => s.disable(true)); },
        destroy() { canvases.forEach(c => c.destroy()); tones.forEach(t => t && t.stop()); },
        _debug: () => ({ freqs })
      };
    }
  };

  /* ---------------- Mission 2: Timbre lab (harmonic synthesis) ---------------- */
  const F0 = 220;
  const timbreLab = {
    id: 'L5-M02', title: '🎛️ ภารกิจทดลอง: Timbre Lab สร้างรูปคลื่นจากฮาร์มอนิก', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 150,
    prompt: 'เสียงปริศนามีความถี่มูลฐาน 220 Hz ผสมกับฮาร์มอนิกที่ 2, 3 และ 4 ด้วยแอมพลิจูดต่าง ๆ\nปรับแถบเลื่อนให้รูปคลื่นของคุณ (สีฟ้า) ทับรูปคลื่นปริศนา (เส้นประสีเหลือง) พอดี แล้วตอบส่วนที่ 2',
    hint: 'ปรับทีละตัว: ฮาร์มอนิกที่ 2 ทำให้มี “ลูกคลื่นเล็ก” 2 ลูกต่อ 1 รอบใหญ่ ฮาร์มอนิกที่ 3 มี 3 ลูก ฯลฯ ดูว่าส่วนไหนของรูปคลื่นยังไม่ทับกัน · ความถี่มูลฐานคงที่ ระดับเสียงจึงไม่เปลี่ยน',
    explanation: 'เสียงจริงประกอบด้วยความถี่มูลฐาน f₁ และฮาร์มอนิก 2f₁, 3f₁, … รวมกัน สัดส่วนแอมพลิจูดของฮาร์มอนิกกำหนดรูปคลื่นและ “คุณภาพเสียง” ส่วนระดับเสียงยังคงกำหนดโดยความถี่มูลฐาน',
    mount(el, api) {
      const { h, canvas, slider, segmented, shuffle } = api.lib;
      let target; do { target = [1, ...[0, 0, 0].map(() => [0, 0.25, 0.5, 0.75, 1][Math.floor(Math.random() * 5)])]; } while (target.slice(1).every(a => a === 0) || target.slice(1).filter(a => a > 0).length < 2);
      const mine = [1, 0, 0, 0];
      let tone = null;
      const wave = (amps, u) => amps.reduce((s, a, k) => s + a * Math.sin(2 * Math.PI * (k + 1) * u), 0);
      const norm = Math.max(...[target, [1, 1, 1, 1]].map(a => a.reduce((s, v) => s + v, 0)));
      const cv = h('canvas', { 'aria-label': 'รูปคลื่นเป้าหมายเทียบกับรูปคลื่นที่สร้าง' });
      const c = canvas(cv, 220, (x, w, hh) => {
        x.clearRect(0, 0, w, hh); scopeGrid(x, w, hh, 8);
        const draw = (amps, col, dash) => {
          x.setLineDash(dash); x.strokeStyle = col; x.lineWidth = dash.length ? 2.5 : 3; x.shadowColor = col; x.shadowBlur = dash.length ? 0 : 10;
          x.beginPath(); for (let px = 0; px <= w; px += 2) { const y = hh / 2 - (hh * 0.42) * wave(amps, px / w * 2) / norm; px ? x.lineTo(px, y) : x.moveTo(px, y); } x.stroke();
          x.setLineDash([]); x.shadowBlur = 0;
        };
        draw(target, 'rgba(255,213,74,.95)', [8, 6]); draw(mine, '#22e3ff', []);
        x.fillStyle = '#8fb0cf'; x.font = '12px Kanit, sans-serif'; x.fillText('แสดง 2 คาบของความถี่มูลฐาน', 8, hh - 6);
      });
      const sliders = [1, 2, 3].map(k => slider({ label: `ฮาร์มอนิกที่ ${k + 1} (${(k + 1) * F0} Hz)`, min: 0, max: 1, step: 0.25, value: 0, format: v => v.toFixed(2),
        onInput: v => { mine[k] = v; c.redraw(); if (tone && tone.which === 'mine') tone.h.set([F0, 2 * F0, 3 * F0, 4 * F0], mine.map(a => a / 2.5)); } }));
      const play = (which) => {
        if (tone) { const old = tone; tone = null; old.h.stop(); if (old.which === which) return; }
        const amps = (which === 'target' ? target : mine).map(a => a / 2.5);
        tone = { which, h: api.audio.tones([F0, 2 * F0, 3 * F0, 4 * F0], { amps, volume: 0.2, duration: 2.5, onend: () => { tone = null; } }) };
      };
      const q2 = segmented(shuffle([
        { value: 'same', label: 'เท่ากัน (ความถี่มูลฐานเท่ากัน)' }, { value: 'higher', label: 'สูงกว่า เพราะมีฮาร์มอนิกมากกว่า' },
        { value: 'lower', label: 'ต่ำกว่า เพราะรูปคลื่นซับซ้อนกว่า' }, { value: 'amp', label: 'ขึ้นกับแอมพลิจูดของฮาร์มอนิกที่ 4' }]), () => api.sfx.click());
      el.append(h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: 'HARMONIC SYNTHESIZER · f₁ = 220 Hz' }), cv),
        h('div', { class: 'sim-controls' },
          h('button', { class: 'btn ghost sm', type: 'button', text: '🔈 ฟังเสียงปริศนา', onclick: () => play('target') }),
          h('button', { class: 'btn ghost sm', type: 'button', text: '🔉 ฟังเสียงของฉัน', onclick: () => play('mine') }),
          h('span', { class: 'muted small', text: 'ฮาร์มอนิกที่ 1 (220 Hz) แอมพลิจูด = 1.00 คงที่' })),
        h('div', { class: 'sim-controls' }, sliders.map(s => s.el)),
        h('div', { class: 'qpart' }, h('h4', { text: 'ส่วนที่ 2: เสียงที่คุณสร้าง เทียบกับเสียงฮาร์มอนิกที่ 1 อย่างเดียว (220 Hz) มีระดับเสียงอย่างไร' }), q2.el));
      return {
        check() {
          if (q2.value == null) return { invalid: true, msg: 'ตอบส่วนที่ 2 ก่อนส่งผล' };
          const ok1 = mine.every((a, k) => Math.abs(a - target[k]) < 0.13);
          const ok2 = q2.value === 'same';
          return { ok: ok1 && ok2, msg: `ผลตรวจ: ถูก ${[ok1, ok2].filter(Boolean).length} จาก 2 ส่วน` + (ok1 ? '' : ' · รูปคลื่นยังไม่ทับกัน') };
        },
        solution() { return `เฉลย: แอมพลิจูดฮาร์มอนิกที่ 2, 3, 4 = ${target.slice(1).map(a => a.toFixed(2)).join(', ')} · ระดับเสียงเท่ากัน เพราะความถี่มูลฐานยังเป็น 220 Hz`; },
        lock() { sliders.forEach(s => s.disable(true)); q2.disable(true); },
        destroy() { c.destroy(); if (tone) tone.h.stop(); },
        _debug: () => ({ target })
      };
    }
  };

  SQ.registerLevel({
    id: 5, code: 'LEVEL 5', title: 'Pitch and Timbre', th: 'ระดับเสียงและคุณภาพเสียง', icon: '🎵', topic: TOPIC,
    objective: 'เชื่อมโยงระดับเสียงกับความถี่ อ่านค่าความถี่จากออสซิลโลสโคป เข้าใจช่วงการได้ยิน อินฟราซาวด์–อัลตราซาวด์ และวิเคราะห์รูปคลื่นที่มีฮาร์มอนิกต่างกัน (คุณภาพเสียง)',
    questions, missions: [pitchMatch, timbreLab]
  });
})(window.SQ);
