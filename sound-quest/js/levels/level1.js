/* =========================================================
   LEVEL 1: Sound Origin — การเกิดเสียงและคลื่นเสียงตามยาว
   ========================================================= */
(function (SQ) {
  'use strict';
  const TOPIC = 'การเกิดเสียงและคลื่นตามยาว';

  const questions = [
    { id: 'L1-Q01', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'เสียงเกิดขึ้นได้อย่างไร',
      choices: ['เกิดจากการสั่นของแหล่งกำเนิดเสียง', 'เกิดจากการเคลื่อนที่ของแสง', 'เกิดจากการไหลของกระแสไฟฟ้าเท่านั้น', 'เกิดจากความร้อนของอากาศ'],
      answer: 0,
      hint: 'ลองใช้นิ้วแตะลำคอขณะพูด จะรู้สึกถึงอะไร',
      explanation: 'เสียงเกิดจากการสั่นของแหล่งกำเนิด เช่น เส้นเสียง สายกีตาร์ หรือแผ่นลำโพง การสั่นนี้ทำให้อนุภาคของตัวกลางรอบ ๆ สั่นตาม แล้วถ่ายทอดพลังงานต่อกันไปเป็นคลื่นเสียง' },

    { id: 'L1-Q02', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'เสียงจัดเป็นคลื่นชนิดใด',
      choices: ['คลื่นแม่เหล็กไฟฟ้า', 'คลื่นกลตามขวาง', 'คลื่นกลตามยาว', 'คลื่นที่ไม่ต้องอาศัยตัวกลาง'],
      answer: 2,
      hint: 'เสียงต้องมีตัวกลางหรือไม่? และอนุภาคตัวกลางสั่นในแนวใดเทียบกับทิศของคลื่น',
      explanation: 'เสียงต้องอาศัยตัวกลางในการเคลื่อนที่จึงเป็น “คลื่นกล” และอนุภาคตัวกลางสั่นในแนวเดียวกับทิศการเคลื่อนที่ของคลื่น จึงเป็น “คลื่นตามยาว”' },

    { id: 'L1-Q03', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'เหตุใดเสียงจึงเคลื่อนที่ผ่านสุญญากาศไม่ได้',
      choices: ['สุญญากาศมีอุณหภูมิต่ำเกินไป', 'ไม่มีอนุภาคตัวกลางที่จะส่งต่อการสั่น', 'สุญญากาศดูดกลืนพลังงานเสียงทั้งหมด', 'เสียงเคลื่อนที่เร็วเกินไปในสุญญากาศ'],
      answer: 1,
      hint: 'คลื่นกลส่งพลังงานผ่านอะไร',
      explanation: 'คลื่นเสียงถ่ายทอดพลังงานโดยอนุภาคตัวกลางชนและผลักกันต่อ ๆ ไป ในสุญญากาศไม่มีอนุภาค จึงไม่มีอะไรส่งต่อการสั่น เสียงจึงเคลื่อนที่ผ่านไม่ได้' },

    { id: 'L1-Q04', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'ขณะคลื่นเสียงเคลื่อนที่ผ่านอากาศ อนุภาคอากาศแต่ละอนุภาคเคลื่อนที่อย่างไร',
      choices: ['เคลื่อนที่ไปพร้อมกับคลื่นจากแหล่งกำเนิดจนถึงผู้ฟัง', 'สั่นขึ้นลงในแนวตั้งฉากกับทิศการเคลื่อนที่ของคลื่น', 'เคลื่อนที่เป็นวงกลมรอบแหล่งกำเนิด', 'สั่นกลับไปมารอบตำแหน่งสมดุล ในแนวเดียวกับทิศการเคลื่อนที่ของคลื่น'],
      answer: 3,
      hint: 'คลื่นพาพลังงานไป แต่อนุภาคตัวกลางเดินทางไปด้วยหรือไม่',
      explanation: 'คลื่นถ่ายโอนพลังงาน ไม่ได้พาอนุภาคไปด้วย อนุภาคอากาศเพียงสั่นกลับไปมารอบตำแหน่งสมดุลของตัวเอง และเพราะเป็นคลื่นตามยาว แนวการสั่นจึงขนานกับทิศการเคลื่อนที่ของคลื่น' },

    { id: 'L1-Q05', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'ข้อใดอธิบาย “ส่วนอัด” (compression) ของคลื่นเสียงได้ถูกต้อง',
      choices: ['อนุภาคอยู่ชิดกัน ความดันสูงกว่าความดันปกติ', 'อนุภาคอยู่ห่างกัน ความดันสูงกว่าความดันปกติ', 'อนุภาคอยู่ชิดกัน ความดันต่ำกว่าความดันปกติ', 'อนุภาคอยู่ห่างกัน ความดันต่ำกว่าความดันปกติ'],
      answer: 0,
      hint: 'เมื่ออนุภาคถูกอัดเข้ามาอยู่รวมกันในพื้นที่เล็กลง ความดันจะเป็นอย่างไร',
      explanation: 'ส่วนอัดคือบริเวณที่อนุภาคเบียดชิดกัน ความหนาแน่นและความดันสูงกว่าปกติ ส่วนขยาย (rarefaction) คือบริเวณที่อนุภาคอยู่ห่างกัน ความดันต่ำกว่าปกติ' },

    { id: 'L1-Q06', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 100,
      prompt: 'นักบินอวกาศ 2 คนยืนห่างกัน 2 เมตรบนผิวดวงจันทร์ ต้องคุยกันผ่านวิทยุสื่อสาร เหตุผลหลักคือข้อใด',
      choices: ['อุณหภูมิบนดวงจันทร์ต่ำมากจนเสียงแข็งตัว', 'แรงโน้มถ่วงต่ำทำให้เสียงลอยหายไป', 'บนดวงจันทร์แทบไม่มีอากาศเป็นตัวกลางให้เสียงเคลื่อนที่', 'เสียงบนดวงจันทร์มีความถี่สูงเกินกว่าหูจะได้ยิน'],
      answer: 2,
      hint: 'ดวงจันทร์มีบรรยากาศหรือไม่',
      explanation: 'ดวงจันทร์แทบไม่มีบรรยากาศ จึงไม่มีอากาศเป็นตัวกลางนำเสียง ส่วนคลื่นวิทยุเป็นคลื่นแม่เหล็กไฟฟ้า เคลื่อนที่ผ่านสุญญากาศได้ จึงใช้สื่อสารแทน' },

    { id: 'L1-Q07', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'ระยะห่างระหว่างกึ่งกลางส่วนอัดกับกึ่งกลางส่วนขยายที่อยู่ถัดกัน เท่ากับเท่าใด (λ = ความยาวคลื่น)',
      choices: ['λ/4', 'λ/2', 'λ', '2λ'],
      answer: 1,
      hint: 'ส่วนอัดถึงส่วนอัดถัดไปห่างกัน 1λ แล้วส่วนขยายอยู่ตรงไหนระหว่างนั้น',
      explanation: 'ส่วนอัดที่อยู่ติดกันห่างกัน 1 ความยาวคลื่น (λ) และส่วนขยายอยู่กึ่งกลางระหว่างส่วนอัดทั้งสอง ระยะจากส่วนอัดถึงส่วนขยายที่ถัดกันจึงเท่ากับ λ/2' },

    { id: 'L1-Q08', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'คลื่นเสียงในอากาศมีส่วนอัดที่อยู่ติดกันห่างกัน 0.68 m ถ้าอัตราเร็วเสียงในอากาศเป็น 340 m/s เสียงนี้มีความถี่กี่เฮิรตซ์',
      answer: 500, unit: 'Hz', tol: { rel: 0.01 },
      hint: 'ระยะระหว่างส่วนอัดที่ติดกัน = ความยาวคลื่น λ แล้วใช้ v = fλ',
      explanation: 'λ = 0.68 m (ระยะระหว่างส่วนอัดที่ติดกัน)\nf = v/λ = 340 / 0.68 = 500 Hz' },

    { id: 'L1-Q09', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'แผ่นลำโพงสั่นด้วยความถี่ 250 Hz อนุภาคอากาศหน้าลำโพงสั่นด้วยคาบกี่มิลลิวินาที (ms)',
      answer: 4, unit: 'ms', tol: { rel: 0.01 },
      hint: 'อนุภาคตัวกลางสั่นด้วยความถี่เดียวกับแหล่งกำเนิด และ T = 1/f',
      explanation: 'อนุภาคอากาศสั่นด้วยความถี่เท่ากับแหล่งกำเนิด f = 250 Hz\nT = 1/f = 1/250 = 0.004 s = 4 ms' },

    { id: 'L1-Q10', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'ณ ขณะหนึ่ง ตำแหน่งที่อนุภาคอากาศมี “การกระจัดเป็นศูนย์” (อยู่ที่ตำแหน่งสมดุลพอดี) ความดันอากาศที่ตำแหน่งนั้นเป็นอย่างไร',
      choices: ['เท่ากับความดันปกติเสมอ', 'อนุภาคอยู่นิ่งและความดันเป็นศูนย์', 'เปลี่ยนแปลงไปจากปกติมากที่สุด (เป็นกึ่งกลางส่วนอัดหรือส่วนขยาย)', 'เปลี่ยนแปลงไปครึ่งหนึ่งของค่าสูงสุด'],
      answer: 2,
      hint: 'ดูอนุภาคสองข้างของตำแหน่งนั้น ถ้าทั้งคู่เคลื่อนเข้าหา (หรือออกจาก) ตำแหน่งนั้นมากที่สุด จะเกิดอะไรขึ้น',
      explanation: 'ที่ตำแหน่งการกระจัดเป็นศูนย์ อนุภาคทั้งสองข้างถูกกระจัดเข้าหากัน (เกิดส่วนอัด) หรือออกจากกัน (เกิดส่วนขยาย) มากที่สุด ความดันจึงเปลี่ยนไปจากปกติมากที่สุด ส่วนตำแหน่งที่การกระจัดมากที่สุด ความดันเท่ากับความดันปกติ' },

    { id: 'L1-Q11', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'คลื่นการกระจัดของอนุภาคอากาศ กับคลื่นความดันของเสียงขบวนเดียวกัน มีเฟสต่างกันเท่าใด',
      choices: ['0°', '90° (π/2 เรเดียน)', '180° (π เรเดียน)', '360° (2π เรเดียน)'],
      answer: 1,
      hint: 'ใช้ผลจากข้อที่แล้ว: การกระจัดสูงสุดตรงกับความดันปกติ และการกระจัดศูนย์ตรงกับความดันเปลี่ยนสูงสุด',
      explanation: 'จุดที่การกระจัดมากที่สุด ความดันเท่าปกติ (ค่าการเปลี่ยนความดัน = 0) และจุดที่การกระจัดเป็นศูนย์ ความดันเปลี่ยนมากที่สุด กราฟทั้งสองจึงเลื่อนกัน 1/4 รอบ หรือมีเฟสต่างกัน 90°' },

    { id: 'L1-Q12', type: 'num', difficulty: 'ยาก', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ไมโครโฟนตัวหนึ่งนับได้ว่ามีส่วนอัดของคลื่นเสียงเคลื่อนผ่าน 1,700 ส่วนอัดในเวลา 2 วินาที และส่วนอัดที่อยู่ติดกันห่างกัน 0.40 m อัตราเร็วของเสียงนี้เป็นกี่ m/s',
      answer: 340, unit: 'm/s', tol: { rel: 0.01 },
      hint: 'จำนวนส่วนอัดที่ผ่านต่อวินาที = ความถี่ f จากนั้นใช้ v = fλ',
      explanation: 'f = 1,700 / 2 = 850 Hz และ λ = 0.40 m\nv = fλ = 850 × 0.40 = 340 m/s' }
  ];

  /* ---------------- Mission: Longitudinal-wave lab ---------------- */
  const mission = {
    id: 'L1-M01', title: '🧪 ภารกิจทดลอง: ถอดรหัสคลื่นตามยาว', difficulty: 'ปานกลาง', bloom: 'การวิเคราะห์', topic: TOPIC, points: 150,
    prompt: 'ภาพจำลองแสดงอนุภาคอากาศขณะมีคลื่นเสียงจากแหล่งกำเนิดที่ซ่อนอยู่เคลื่อนผ่าน\nสังเกตอนุภาคสีเหลือง แล้วตอบให้ครบทั้ง 3 ส่วน จากนั้นกด “ตรวจผลการทดลอง”',
    hint: 'ติดตามอนุภาคสีเหลืองเพียงตัวเดียว: มันไปไกลจากเส้นประหรือไม่? ทิศของคลื่นดูได้จาก “กลุ่มอนุภาคที่เบียดกัน” ว่าเลื่อนไปทางไหน ส่วนอัดคือบริเวณที่อนุภาคชิดกันที่สุด ลองลดความเร็วแล้วกดหยุดภาพก่อนแตะ',
    explanation: 'อนุภาคอากาศสั่นกลับไปมารอบตำแหน่งสมดุลในแนวขนานกับทิศการเคลื่อนที่ของคลื่น (คลื่นตามยาว) ไม่ได้เดินทางไปกับคลื่น สิ่งที่เคลื่อนที่ไปคือรูปแบบของส่วนอัดและส่วนขยาย ซึ่งพาพลังงานไปในทิศการแผ่ของคลื่น',
    mount(el, api) {
      const { h, canvas, segmented, shuffle } = api.lib;
      const dir = Math.random() < 0.5 ? 1 : -1;         // propagation direction (hidden source)
      const st = { paused: false, tau: 0, last: null, speed: 0.6, mark: null, markTau: 0, reveal: false, locked: false };
      const OMEGA = 2 * Math.PI * 0.7;
      let layout = null;

      const cv = h('canvas', { 'aria-label': 'ภาพจำลองอนุภาคอากาศ แตะเพื่อระบุตำแหน่งส่วนอัดเมื่อหยุดภาพ' });
      const info = h('div', { class: 'muted small', text: '▶ กำลังเล่น · กดหยุดภาพแล้วแตะบนภาพเพื่อปักหมุดส่วนอัด' });
      const sim = h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: 'AIR PARTICLE SIMULATOR' }), cv);

      function phaseAt(x0, tau) { return layout.k * x0 - dir * OMEGA * tau; }
      const c = canvas(cv, 240, (x, w, hh, t) => {
        if (st.last == null) st.last = t;
        const dt = Math.min(0.05, t - st.last); st.last = t;
        if (!st.paused) st.tau += dt * st.speed;
        const cols = Math.max(26, Math.min(56, Math.round(w / 16))), rows = 7;
        const sp = w / cols, lam = w / 2.5;
        layout = { k: 2 * Math.PI / lam, sp, cols, rows, w, hh };
        const A = sp * 0.95;
        x.clearRect(0, 0, w, hh);
        // reveal: pressure colouring after the mission is finished
        if (st.reveal) {
          for (let px = 0; px < w; px += 4) {
            const d = -Math.cos(phaseAt(px, st.tau));
            x.fillStyle = d > 0 ? `rgba(255,85,119,${0.28 * d})` : `rgba(0,166,255,${-0.22 * d})`;
            x.fillRect(px, 24, 4, hh - 48);
          }
        }
        const track = Math.floor(cols / 2), trackRow = 3;
        const x0t = (track + 0.5) * sp;
        x.setLineDash([4, 5]); x.strokeStyle = 'rgba(255,213,74,.55)'; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(x0t, 22); x.lineTo(x0t, hh - 22); x.stroke(); x.setLineDash([]);
        for (let i = 0; i < cols; i++) {
          const x0 = (i + 0.5) * sp, disp = A * Math.sin(phaseAt(x0, st.tau));
          for (let j = 0; j < rows; j++) {
            const y = 34 + j * (hh - 68) / (rows - 1);
            const isT = i === track && j === trackRow;
            x.beginPath(); x.arc(x0 + disp, y, isT ? 7 : 3.6, 0, Math.PI * 2);
            x.fillStyle = isT ? '#ffd54a' : 'rgba(150,235,255,.92)';
            x.shadowColor = isT ? '#ffd54a' : '#22e3ff'; x.shadowBlur = isT ? 14 : 6; x.fill();
          }
        }
        x.shadowBlur = 0;
        if (st.mark != null) {
          x.strokeStyle = '#ff4fd8'; x.lineWidth = 3; x.shadowColor = '#ff4fd8'; x.shadowBlur = 10;
          x.beginPath(); x.moveTo(st.mark, 16); x.lineTo(st.mark, hh - 16); x.stroke(); x.shadowBlur = 0;
          x.fillStyle = '#ff4fd8'; x.font = '600 13px Kanit, sans-serif'; x.textAlign = 'center';
          x.fillText('📍 ส่วนอัด?', Math.min(w - 40, Math.max(40, st.mark)), 14); x.textAlign = 'left';
        }
        x.fillStyle = 'rgba(143,176,207,.8)'; x.font = '12px Kanit, sans-serif';
        x.fillText('เส้นประ = ตำแหน่งสมดุลของอนุภาคสีเหลือง', 10, hh - 6);
      });
      c.start();

      cv.addEventListener('pointerdown', e => {
        if (st.locked) return;
        if (!st.paused) { info.textContent = '⏸ กรุณากด “หยุดภาพ” ก่อน แล้วจึงแตะเพื่อปักหมุดส่วนอัด'; api.sfx.wrong(); return; }
        st.mark = api.lib.pointer(cv, e).x; st.markTau = st.tau; api.sfx.click();
        info.textContent = '📍 ปักหมุดแล้ว (แตะใหม่เพื่อย้ายตำแหน่ง)';
      });
      const pauseBtn = h('button', { class: 'btn ghost sm', type: 'button', text: '⏸ หยุดภาพ', onclick: () => {
        if (st.locked && !st.reveal) return;
        st.paused = !st.paused;
        pauseBtn.textContent = st.paused ? '▶ เล่นต่อ' : '⏸ หยุดภาพ';
        if (!st.paused && !st.locked) { st.mark = null; info.textContent = '▶ กำลังเล่น · หมุดถูกล้างเมื่อเล่นต่อ'; }
        else if (st.paused) info.textContent = '⏸ หยุดภาพแล้ว · แตะบนภาพเพื่อปักหมุดตำแหน่ง “ส่วนอัด” 1 ตำแหน่ง';
      } });
      const speed = api.lib.slider({ label: 'ความเร็วการเล่น (slow motion)', min: 0.15, max: 1, step: 0.05, value: 0.6, format: v => '×' + v.toFixed(2), onInput: v => st.speed = v });

      const motionOpts = shuffle([
        { value: 'long', label: 'สั่นกลับไปมา ซ้าย–ขวา รอบตำแหน่งเดิม' },
        { value: 'trans', label: 'สั่นขึ้น–ลง ตั้งฉากกับทิศคลื่น' },
        { value: 'travel', label: 'เคลื่อนที่ไปพร้อมคลื่นจนสุดขอบภาพ' },
        { value: 'still', label: 'อยู่นิ่ง ไม่เคลื่อนที่' }]);
      const motion = segmented(motionOpts, () => api.sfx.click());
      const direction = segmented([{ value: -1, label: '⬅ คลื่นแผ่ไปทางซ้าย' }, { value: 1, label: 'คลื่นแผ่ไปทางขวา ➡' }], () => api.sfx.click());

      el.append(sim, h('div', { class: 'sim-controls' }, pauseBtn, speed.el), info,
        h('div', { class: 'qpart' }, h('h4', { text: 'ส่วนที่ 1: อนุภาคสีเหลืองเคลื่อนที่อย่างไร' }), motion.el),
        h('div', { class: 'qpart' }, h('h4', { text: 'ส่วนที่ 2: คลื่นเสียงแผ่ไปทางใด' }), direction.el),
        h('div', { class: 'qpart' }, h('h4', { text: 'ส่วนที่ 3: หยุดภาพ แล้วแตะบนภาพเพื่อปักหมุดที่ “กึ่งกลางส่วนอัด” 1 ตำแหน่ง' }),
          h('div', { class: 'muted small', text: 'ส่วนอัด = บริเวณที่อนุภาคเบียดชิดกันมากที่สุด' })));

      return {
        check() {
          if (motion.value == null || direction.value == null || st.mark == null)
            return { invalid: true, msg: 'ตอบให้ครบทั้ง 3 ส่วนก่อน (เลือกการเคลื่อนที่ เลือกทิศคลื่น และปักหมุดส่วนอัด)' };
          const c1 = motion.value === 'long';
          const c2 = direction.value === dir;
          const cond = -Math.cos(phaseAt(st.mark, st.markTau));     // +1 = centre of a compression
          const c3 = cond >= 0.6;
          const n = [c1, c2, c3].filter(Boolean).length;
          return { ok: n === 3, msg: `ผลตรวจ: ถูก ${n} จาก 3 ส่วน` };
        },
        solution() {
          return `เฉลย: (1) อนุภาคสั่นซ้าย–ขวารอบตำแหน่งสมดุล (2) คลื่นแผ่ไปทาง${dir === 1 ? 'ขวา ➡' : 'ซ้าย ⬅'} (3) ส่วนอัดคือแถบสีแดงที่อนุภาคเบียดกัน (แถบสีฟ้า = ส่วนขยาย)`;
        },
        lock() {
          st.locked = true; st.reveal = true; motion.disable(true); direction.disable(true);
          if (st.paused) { st.paused = false; pauseBtn.textContent = '⏸ หยุดภาพ'; }
          st.mark = null; info.textContent = 'แสดงเฉลย: สีแดง = ส่วนอัด (ความดันสูง) · สีฟ้า = ส่วนขยาย (ความดันต่ำ)';
        },
        destroy() { c.destroy(); },
        _debug: () => ({ dir, tau: st.tau, k: layout.k, omega: OMEGA })
      };
    }
  };

  SQ.registerLevel({
    id: 1, code: 'LEVEL 1', title: 'Sound Origin', th: 'กำเนิดเสียง', icon: '🌊', topic: TOPIC,
    objective: 'ระบุการเคลื่อนที่ของอนุภาคอากาศ ทิศการแผ่ของคลื่นเสียง และตำแหน่งส่วนอัด–ส่วนขยาย เข้าใจว่าเสียงเป็นคลื่นกลตามยาวที่เกิดจากการสั่นของแหล่งกำเนิด',
    questions, missions: [mission]
  });
})(window.SQ);
