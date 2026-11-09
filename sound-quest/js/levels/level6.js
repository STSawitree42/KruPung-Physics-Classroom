/* =========================================================
   LEVEL 6: Resonance Challenge — การสั่นพ้องในท่อปลายปิด/ปลายเปิด
   (ไม่คิดค่าแก้ปลายท่อ)
   ========================================================= */
(function (SQ) {
  'use strict';
  const TOPIC = 'การสั่นพ้องและคลื่นนิ่งของเสียง';
  const V = 340;

  const questions = [
    { id: 'L6-Q01', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'ท่อปลายปิดด้านหนึ่ง (อีกด้านเปิด) จะเกิดการสั่นพ้องได้ที่ฮาร์มอนิกใดบ้าง',
      choices: ['ทุกฮาร์มอนิก (1, 2, 3, …)', 'เฉพาะฮาร์มอนิกคี่ (1, 3, 5, …)', 'เฉพาะฮาร์มอนิกคู่ (2, 4, 6, …)', 'เฉพาะฮาร์มอนิกที่ 1'],
      answer: 1,
      hint: 'ปลายปิดต้องเป็นบัพ ปลายเปิดต้องเป็นปฏิบัพ ความยาวท่อจึงเป็นกี่ส่วนสี่ของ λ',
      explanation: 'ท่อปลายปิด: L = λ/4, 3λ/4, 5λ/4, … ⇒ f = (2n − 1)v/4L เกิดเฉพาะฮาร์มอนิกคี่' },

    { id: 'L6-Q02', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'ท่อปลายเปิดทั้งสองด้าน จะเกิดการสั่นพ้องได้ที่ฮาร์มอนิกใดบ้าง',
      choices: ['เฉพาะฮาร์มอนิกคี่', 'เฉพาะฮาร์มอนิกคู่', 'ทุกฮาร์มอนิก (1, 2, 3, …)', 'ไม่เกิดการสั่นพ้อง'],
      answer: 2,
      hint: 'ปลายเปิดทั้งสองข้างเป็นปฏิบัพ ระยะระหว่างปฏิบัพที่ติดกัน = λ/2',
      explanation: 'ท่อปลายเปิด: L = nλ/2 (n = 1, 2, 3, …) ⇒ f = nv/2L เกิดได้ทุกฮาร์มอนิก' },

    { id: 'L6-Q03', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'ที่ปลายปิดของท่อเรโซแนนซ์ อนุภาคอากาศมีการกระจัดอย่างไร',
      choices: ['เป็นบัพ (การกระจัดเป็นศูนย์)', 'เป็นปฏิบัพ (การกระจัดมากที่สุด)', 'การกระจัดเป็นครึ่งหนึ่งของค่าสูงสุด', 'ขึ้นกับความถี่ของเสียง'],
      answer: 0,
      hint: 'อากาศที่ติดผนังปิดเคลื่อนที่ทะลุผนังได้หรือไม่',
      explanation: 'อากาศที่ติดผนังปิดเคลื่อนที่ไม่ได้ จึงเป็นบัพของการกระจัด (และเป็นปฏิบัพของความดัน) ส่วนปลายเปิดเป็นปฏิบัพของการกระจัด' },

    { id: 'L6-Q04', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'ในการทดลองกับหลอดเรโซแนนซ์ ระยะห่างระหว่างตำแหน่งที่เกิดการสั่นพ้อง 2 ครั้งที่อยู่ติดกัน เท่ากับเท่าใด',
      choices: ['λ/4', 'λ/2', 'λ', '2λ'],
      answer: 1,
      hint: 'การสั่นพ้องเกิดที่ L = λ/4, 3λ/4, 5λ/4, … ลองหาผลต่าง',
      explanation: '3λ/4 − λ/4 = λ/2 ระยะระหว่างการสั่นพ้องที่ติดกันจึงเป็น λ/2 ใช้หาอัตราเร็วเสียงได้จาก v = 2fΔL' },

    { id: 'L6-Q05', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ท่อปลายปิดด้านหนึ่งยาว 0.25 m อัตราเร็วเสียงในอากาศ 340 m/s ความถี่มูลฐานของท่อเป็นกี่เฮิรตซ์',
      answer: 340, unit: 'Hz', tol: { rel: 0.01 },
      hint: 'ความถี่มูลฐานของท่อปลายปิด: L = λ/4',
      explanation: 'λ = 4L = 4 × 0.25 = 1.0 m\nf₁ = v/λ = 340 / 1.0 = 340 Hz' },

    { id: 'L6-Q06', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ขลุ่ยถือว่าเป็นท่อปลายเปิดทั้งสองด้าน ยาว 0.85 m อัตราเร็วเสียง 340 m/s ความถี่มูลฐานเป็นกี่เฮิรตซ์',
      answer: 200, unit: 'Hz', tol: { rel: 0.01 },
      hint: 'ความถี่มูลฐานของท่อปลายเปิด: L = λ/2',
      explanation: 'λ = 2L = 1.7 m\nf₁ = v/λ = 340 / 1.7 = 200 Hz' },

    { id: 'L6-Q07', type: 'num', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 200,
      prompt: 'เคาะส้อมเสียงความถี่ 500 Hz เหนือปากหลอดเรโซแนนซ์ (ปลายล่างปิดด้วยลูกสูบ) อัตราเร็วเสียง 340 m/s การสั่นพ้องครั้งแรกเกิดเมื่อลำอากาศยาวกี่เซนติเมตร',
      answer: 17, unit: 'cm', tol: { rel: 0.01 },
      hint: 'การสั่นพ้องครั้งแรก L₁ = λ/4',
      explanation: 'λ = v/f = 340/500 = 0.68 m\nL₁ = λ/4 = 0.17 m = 17 cm' },

    { id: 'L6-Q08', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'ทดลองกับส้อมเสียง 512 Hz พบการสั่นพ้องสองครั้งติดกันที่ลำอากาศยาวต่างกัน 34.0 cm อัตราเร็วเสียงในอากาศขณะนั้นเป็นกี่ m/s',
      answer: 348.16, unit: 'm/s', tol: { rel: 0.01 },
      hint: 'ΔL = λ/2 แล้วใช้ v = fλ',
      explanation: 'λ = 2ΔL = 2 × 0.340 = 0.680 m\nv = fλ = 512 × 0.680 ≈ 348 m/s' },

    { id: 'L6-Q09', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'ท่อปลายปิดด้านหนึ่งมีความถี่มูลฐาน 150 Hz ความถี่ถัดไปที่สูงกว่าความถี่มูลฐานและทำให้ท่อนี้เกิดการสั่นพ้องได้ คือกี่เฮิรตซ์',
      answer: 450, unit: 'Hz', tol: { rel: 0.005 },
      hint: 'ท่อปลายปิดเกิดเฉพาะฮาร์มอนิกคี่',
      explanation: 'ความถี่สั่นพ้องของท่อปลายปิด: f₁, 3f₁, 5f₁, …\nความถี่ถัดไป = 3 × 150 = 450 Hz (300 Hz ไม่เกิด เพราะเป็นฮาร์มอนิกคู่)' },

    { id: 'L6-Q10', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'ใช้ส้อมเสียง 425 Hz กับหลอดเรโซแนนซ์ พบการสั่นพ้องครั้งแรกที่ลำอากาศยาว 20 cm และครั้งที่สองที่ 60 cm อัตราเร็วเสียงขณะนั้นเป็นเท่าใด',
      choices: ['170 m/s', '255 m/s', '340 m/s', '680 m/s'],
      answer: 2,
      hint: 'ΔL = 60 − 20 = 40 cm = λ/2',
      explanation: 'ΔL = 0.60 − 0.20 = 0.40 m = λ/2 ⇒ λ = 0.80 m\nv = fλ = 425 × 0.80 = 340 m/s (ตรวจสอบ: L₁ = λ/4 = 0.20 m ✓)' },

    { id: 'L6-Q11', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 100,
      prompt: 'นักร้องเปล่งเสียงที่ความถี่หนึ่งแล้วแก้วไวน์สั่นแรงขึ้นเรื่อย ๆ จนแตก เป็นผลจากปรากฏการณ์ใด',
      choices: ['การเลี้ยวเบน', 'การสั่นพ้อง', 'บีตส์', 'ปรากฏการณ์ดอปเพลอร์'],
      answer: 1,
      hint: 'ความถี่ของเสียงตรงกับความถี่ธรรมชาติของแก้ว',
      explanation: 'เมื่อความถี่ของแรงกระตุ้น (เสียง) ตรงกับความถี่ธรรมชาติของแก้ว แก้วจะสั่นพ้อง ได้รับพลังงานสะสมจนแอมพลิจูดมากพอให้แตก' },

    { id: 'L6-Q12', type: 'num', difficulty: 'ยาก', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ท่อปลายเปิดทั้งสองด้านยาว 0.50 m อัตราเร็วเสียง 340 m/s ฮาร์มอนิกที่ 3 ของท่อนี้มีความถี่กี่เฮิรตซ์',
      answer: 1020, unit: 'Hz', tol: { rel: 0.005 },
      hint: 'ท่อปลายเปิด: fₙ = nv/2L',
      explanation: 'f₃ = 3v/2L = 3 × 340 / (2 × 0.50) = 1,020 Hz' },

    { id: 'L6-Q13', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'ท่อปลายปิดด้านหนึ่งมีความถี่มูลฐาน f ถ้าเปิดปลายที่ปิดออก (กลายเป็นท่อปลายเปิดยาวเท่าเดิม) ความถี่มูลฐานใหม่เป็นเท่าใด',
      choices: ['f/2', 'f', '2f', '4f'],
      answer: 2,
      hint: 'เปรียบเทียบ f₁ = v/4L กับ f₁ = v/2L',
      explanation: 'ปลายปิด: f = v/4L · ปลายเปิด: f′ = v/2L = 2(v/4L) = 2f' }
  ];

  /* ---------------- Shared tube renderer ---------------- */
  function tubeSim(x, w, hh, t, o) {
    // o: { L (m), lam (m), closed (bool), amp (0..1), maxL (m) }
    x.clearRect(0, 0, w, hh);
    const left = 40, scale = (w - 90) / o.maxL, cy = hh / 2, r = 46;
    const right = left + o.L * scale;
    // tube walls
    x.strokeStyle = '#8fb0cf'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(left, cy - r); x.lineTo(o.closed ? left + o.maxL * scale : right, cy - r);
    x.moveTo(left, cy + r); x.lineTo(o.closed ? left + o.maxL * scale : right, cy + r); x.stroke();
    if (o.closed) {   // piston
      x.fillStyle = '#ff4fd8'; x.shadowColor = '#ff4fd8'; x.shadowBlur = 12;
      x.fillRect(right, cy - r + 2, 10, 2 * r - 4); x.shadowBlur = 0;
      x.fillStyle = 'rgba(255,79,216,.25)'; x.fillRect(right + 10, cy - 4, Math.max(0, left + o.maxL * scale - right - 10), 8);
    }
    // standing-wave displacement envelope (antinode at the open left end)
    const k = 2 * Math.PI / o.lam, A = (r - 8) * (0.15 + 0.85 * o.amp), osc = Math.cos(2 * Math.PI * 1.2 * t);
    x.lineWidth = 2.5;
    [1, -1].forEach(sgn => {
      x.strokeStyle = 'rgba(34,227,255,.9)'; x.shadowColor = '#22e3ff'; x.shadowBlur = 8; x.beginPath();
      for (let px = 0; px <= o.L * scale; px += 2) { const X = px / scale; const y = cy + sgn * A * Math.cos(k * X) * osc; px ? x.lineTo(left + px, y) : x.moveTo(left + px, y); }
      x.stroke();
    });
    x.shadowBlur = 0;
    // scale
    x.fillStyle = '#8fb0cf'; x.font = '12px Kanit, sans-serif'; x.textAlign = 'center';
    for (let m = 0; m <= o.maxL + 1e-9; m += 0.1) { const px = left + m * scale; x.fillRect(px, hh - 24, 1, 5); if (Math.round(m * 10) % 2 === 0) x.fillText(m.toFixed(1) + ' m', px, hh - 7); }
    x.fillText('ปลายเปิด', left + 18, 38);
    x.fillText(o.closed ? 'ลูกสูบ (ปลายปิด)' : 'ปลายเปิด', Math.min(w - 50, right + (o.closed ? 5 : 0)), 38);
    x.textAlign = 'left';
  }
  function meterEl(h) { const fill = h('div'); return { el: h('div', { class: 'meter' }, fill), set(a) { fill.style.width = Math.round(a * 100) + '%'; } }; }
  const peak = d => 1 / (1 + Math.pow(d / 0.05, 2));

  /* ---------------- Mission 1: Closed tube — move the piston ---------------- */
  const CLOSED = [{ f: 500, n: 2 }, { f: 425, n: 2 }, { f: 680, n: 3 }, { f: 850, n: 3 }, { f: 400, n: 2 }];
  const ORD = ['', 'ครั้งแรก', 'ครั้งที่สอง', 'ครั้งที่สาม'];
  const closedTube = {
    id: 'L6-M01', title: '🧪 ภารกิจทดลอง: หลอดเรโซแนนซ์ปลายปิด', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 150,
    prompt: 'ส้อมเสียงสั่นอยู่ที่ปากหลอด (ปลายเปิด) เลื่อนลูกสูบเพื่อเปลี่ยนความยาวลำอากาศ ให้เกิดการสั่นพ้องตามเงื่อนไขที่กำหนด\nแถบความดังจะสูงสุดเมื่อเกิดการสั่นพ้อง แต่ต้องเลือกให้ถูก “ครั้ง”',
    hint: 'ท่อปลายปิดเกิดการสั่นพ้องเมื่อ L = λ/4, 3λ/4, 5λ/4, … หา λ = v/f ก่อน การสั่นพ้องครั้งที่ n อยู่ที่ L = (2n − 1)λ/4',
    explanation: 'การสั่นพ้องในท่อปลายปิดเกิดเมื่อปลายเปิดเป็นปฏิบัพและปลายปิดเป็นบัพของการกระจัด ความยาวลำอากาศจึงต้องเป็น (2n − 1)λ/4 และแต่ละครั้งห่างกัน λ/2',
    mount(el, api) {
      const { h, canvas, slider, segmented, shuffle, pick, fmt } = api.lib;
      const S = pick(CLOSED), lam = V / S.f, Lreq = (2 * S.n - 1) * lam / 4;
      const st = { L: 0.05, tone: null };
      const ampOf = L => { const xx = 4 * L / lam; const m = Math.max(1, 2 * Math.round((xx - 1) / 2) + 1); return peak(Math.abs(xx - m)); };
      const cv = h('canvas', { 'aria-label': 'หลอดเรโซแนนซ์ปลายปิด' });
      const meter = meterEl(h);
      const c = canvas(cv, 200, (x, w, hh, t) => tubeSim(x, w, hh, t, { L: st.L, lam, closed: true, amp: ampOf(st.L), maxL: 1.0 }));
      c.start();
      const upd = () => { const a = ampOf(st.L); meter.set(a); if (st.tone) st.tone.set([S.f], [0.1 + 0.9 * a]); };
      const lSl = slider({ label: 'ความยาวลำอากาศ L', min: 0.05, max: 1.0, step: 0.005, value: 0.05, steps: [-0.05, -0.005, 0.005, 0.05], format: v => (v * 100).toFixed(1) + ' cm', onInput: v => { st.L = v; upd(); } });
      const listen = h('button', { class: 'btn ghost sm', type: 'button', text: '🎧 ฟังเสียงจากหลอด', onclick: () => {
        if (st.tone) { st.tone.stop(); st.tone = null; listen.textContent = '🎧 ฟังเสียงจากหลอด'; return; }
        st.tone = api.audio.tones([S.f], { volume: 0.14, amps: [0.1 + 0.9 * ampOf(st.L)] }); listen.textContent = '⏹ หยุดฟัง'; } });
      const opts = [S.n - 1, S.n, S.n + 1, 2 * S.n];
      const q2 = segmented(shuffle(opts.map(v => ({ value: v, label: v + ' ตำแหน่ง' }))), () => api.sfx.click());
      upd();
      el.append(h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: `RESONANCE TUBE · f = ${S.f} Hz` }), cv),
        h('div', { class: 'sim-controls' }, lSl.el, h('div', { class: 'control' }, h('label', null, h('span', { text: 'ความดังของเสียงจากหลอด' })), meter.el, listen)),
        h('div', { class: 'qpart' }, h('h4', { text: `ส่วนที่ 1: ส้อมเสียง ${S.f} Hz · v = ${V} m/s · ปรับให้เกิดการสั่นพ้อง${ORD[S.n]}` }),
          h('div', { class: 'muted small', text: 'ยอมรับคลาดเคลื่อน ±1 cm · ไม่คิดค่าแก้ปลายท่อ' })),
        h('div', { class: 'qpart' }, h('h4', { text: 'ส่วนที่ 2: ที่การสั่นพ้องนี้ ลำอากาศมีบัพของการกระจัดกี่ตำแหน่ง (รวมที่ผิวลูกสูบ)' }), q2.el));
      return {
        check() {
          if (q2.value == null) return { invalid: true, msg: 'ตอบส่วนที่ 2 ก่อนส่งผล' };
          const ok1 = Math.abs(st.L - Lreq) <= 0.01, ok2 = q2.value === S.n;
          let note = '';
          if (!ok1) note = ampOf(st.L) > 0.5 ? ' · เกิดการสั่นพ้องแล้ว แต่ยังไม่ใช่ครั้งที่กำหนด' : ' · ตำแหน่งนี้ยังไม่เกิดการสั่นพ้อง';
          return { ok: ok1 && ok2, msg: `ผลตรวจ: ถูก ${[ok1, ok2].filter(Boolean).length} จาก 2 ส่วน${note}` };
        },
        solution() { return `เฉลย: λ = ${V}/${S.f} = ${fmt(lam)} m ⇒ การสั่นพ้อง${ORD[S.n]} L = ${2 * S.n - 1}λ/4 = ${(Lreq * 100).toFixed(1)} cm · มีบัพ ${S.n} ตำแหน่ง`; },
        lock() { lSl.disable(true); q2.disable(true); },
        destroy() { c.destroy(); if (st.tone) st.tone.stop(); },
        _debug: () => ({ L: Lreq, n: S.n })
      };
    }
  };

  /* ---------------- Mission 2: Open tube — tune the frequency ---------------- */
  const OPEN = [{ L: 0.85, n: 3 }, { L: 0.5, n: 2 }, { L: 0.68, n: 2 }, { L: 1.0, n: 3 }, { L: 0.85, n: 2 }];
  const openTube = {
    id: 'L6-M02', title: '🎺 ภารกิจทดลอง: ปรับความถี่ท่อปลายเปิด', difficulty: 'ยาก', bloom: 'การประยุกต์', topic: TOPIC, points: 150,
    prompt: 'ลำโพงความถี่ปรับได้วางอยู่ที่ปลายท่อปลายเปิดทั้งสองด้าน ปรับความถี่ให้ท่อเกิดการสั่นพ้องที่ฮาร์มอนิกตามเงื่อนไข',
    hint: 'ท่อปลายเปิด: fₙ = nv/2L · ฮาร์มอนิกที่ n มีบัพของการกระจัดภายในท่อ n ตำแหน่ง',
    explanation: 'ท่อปลายเปิดมีปฏิบัพที่ปลายทั้งสอง ความยาวท่อจึงเป็น nλ/2 ทำให้ fₙ = nv/2L เกิดได้ทุกฮาร์มอนิก จำนวนบัพภายในท่อเท่ากับลำดับฮาร์มอนิก n',
    mount(el, api) {
      const { h, canvas, slider, segmented, shuffle, pick } = api.lib;
      const S = pick(OPEN), fReq = S.n * V / (2 * S.L);
      const st = { f: 150, tone: null };
      const ampOf = f => { const xx = 2 * S.L * f / V; const n = Math.max(1, Math.round(xx)); return peak(Math.abs(xx - n)); };
      const cv = h('canvas', { 'aria-label': 'ท่อปลายเปิดทั้งสองด้าน' });
      const meter = meterEl(h);
      const c = canvas(cv, 200, (x, w, hh, t) => tubeSim(x, w, hh, t, { L: S.L, lam: V / st.f, closed: false, amp: ampOf(st.f), maxL: 1.05 }));
      c.start();
      const upd = () => { const a = ampOf(st.f); meter.set(a); if (st.tone) st.tone.set([st.f], [0.1 + 0.9 * a]); };
      const fSl = slider({ label: 'ความถี่ของลำโพง f', min: 100, max: 1200, step: 1, value: 150, steps: [-10, -1, 1, 10], format: v => v + ' Hz', onInput: v => { st.f = v; upd(); } });
      const listen = h('button', { class: 'btn ghost sm', type: 'button', text: '🎧 ฟังเสียงจากท่อ', onclick: () => {
        if (st.tone) { st.tone.stop(); st.tone = null; listen.textContent = '🎧 ฟังเสียงจากท่อ'; return; }
        st.tone = api.audio.tones([st.f], { volume: 0.14, amps: [0.1 + 0.9 * ampOf(st.f)] }); listen.textContent = '⏹ หยุดฟัง'; } });
      const q2 = segmented(shuffle([S.n - 1, S.n, S.n + 1, 2 * S.n].map(v => ({ value: v, label: v + ' ตำแหน่ง' }))), () => api.sfx.click());
      upd();
      el.append(h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: `OPEN PIPE · L = ${S.L.toFixed(2)} m` }), cv),
        h('div', { class: 'sim-controls' }, fSl.el, h('div', { class: 'control' }, h('label', null, h('span', { text: 'ความดังของเสียงจากท่อ' })), meter.el, listen)),
        h('div', { class: 'qpart' }, h('h4', { text: `ส่วนที่ 1: ท่อยาว ${S.L.toFixed(2)} m · v = ${V} m/s · ปรับให้เกิดการสั่นพ้องที่ฮาร์มอนิกที่ ${S.n}` }),
          h('div', { class: 'muted small', text: 'ยอมรับคลาดเคลื่อน ±3 Hz · ไม่คิดค่าแก้ปลายท่อ' })),
        h('div', { class: 'qpart' }, h('h4', { text: `ส่วนที่ 2: ที่ฮาร์มอนิกที่ ${S.n} ภายในท่อมีบัพของการกระจัดกี่ตำแหน่ง` }), q2.el));
      return {
        check() {
          if (q2.value == null) return { invalid: true, msg: 'ตอบส่วนที่ 2 ก่อนส่งผล' };
          const ok1 = Math.abs(st.f - fReq) <= 3, ok2 = q2.value === S.n;
          let note = '';
          if (!ok1) note = ampOf(st.f) > 0.5 ? ' · เกิดการสั่นพ้องแล้ว แต่เป็นฮาร์มอนิกอื่น' : ' · ความถี่นี้ยังไม่เกิดการสั่นพ้อง';
          return { ok: ok1 && ok2, msg: `ผลตรวจ: ถูก ${[ok1, ok2].filter(Boolean).length} จาก 2 ส่วน${note}` };
        },
        solution() { return `เฉลย: f${S.n} = ${S.n}v/2L = ${S.n} × ${V} / (2 × ${S.L}) = ${Math.round(fReq)} Hz · ภายในท่อมีบัพ ${S.n} ตำแหน่ง`; },
        lock() { fSl.disable(true); q2.disable(true); },
        destroy() { c.destroy(); if (st.tone) st.tone.stop(); },
        _debug: () => ({ f: fReq, n: S.n })
      };
    }
  };

  SQ.registerLevel({
    id: 6, code: 'LEVEL 6', title: 'Resonance Challenge', th: 'การสั่นพ้อง', icon: '🎺', topic: TOPIC,
    objective: 'ปรับความยาวท่อและความถี่ให้เกิดการสั่นพ้องตามเงื่อนไขของท่อปลายปิดและท่อปลายเปิด ใช้ L = (2n − 1)λ/4 และ L = nλ/2 วิเคราะห์ตำแหน่งบัพ–ปฏิบัพ และหาอัตราเร็วเสียงจากการทดลอง',
    questions, missions: [closedTube, openTube]
  });
})(window.SQ);
