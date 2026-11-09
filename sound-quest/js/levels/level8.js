/* =========================================================
   LEVEL 8: Doppler Mission — ปรากฏการณ์ดอปเพลอร์และคลื่นกระแทก
   f′ = f (v ± v_o) / (v ∓ v_s)
   ========================================================= */
(function (SQ) {
  'use strict';
  const TOPIC = 'ปรากฏการณ์ดอปเพลอร์';
  const V = 340;

  const questions = [
    { id: 'L8-Q01', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'รถพยาบาลเปิดไซเรนวิ่ง “เข้าหา” ผู้ฟังที่ยืนนิ่ง ผู้ฟังจะได้ยินเสียงไซเรนอย่างไร',
      choices: ['ความถี่ต่ำกว่าที่ไซเรนปล่อยออกมา', 'ความถี่สูงกว่าที่ไซเรนปล่อยออกมา', 'ความถี่เท่าเดิมแต่ดังขึ้นเท่านั้น', 'ความถี่เท่าเดิมแต่ค่อยลงเท่านั้น'],
      answer: 1,
      hint: 'หน้าคลื่นด้านหน้ารถถูกอัดชิดกันหรือห่างกัน',
      explanation: 'แหล่งกำเนิดเคลื่อนที่เข้าหา หน้าคลื่นด้านหน้าอัดชิดกัน λ สั้นลง ผู้ฟังจึงได้รับหน้าคลื่นถี่ขึ้น ได้ยินความถี่สูงขึ้น' },

    { id: 'L8-Q02', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'หลังจากรถพยาบาลวิ่งผ่านผู้ฟังไปแล้ว และกำลังวิ่งห่างออกไป ผู้ฟังจะได้ยินเสียงไซเรนเป็นอย่างไร',
      choices: ['ความถี่สูงกว่าเดิม', 'ความถี่ต่ำกว่าเดิม', 'ความถี่เท่าเดิม', 'ไม่ได้ยินเสียงเลย'],
      answer: 1,
      hint: 'ด้านหลังแหล่งกำเนิด หน้าคลื่นห่างกันมากขึ้น',
      explanation: 'แหล่งกำเนิดเคลื่อนที่ออกห่าง หน้าคลื่นด้านหลังห่างกันมากขึ้น λ ยาวขึ้น ผู้ฟังได้ยินความถี่ต่ำลง' },

    { id: 'L8-Q03', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'รถพยาบาลเปิดไซเรนความถี่ 640 Hz วิ่งเข้าหาผู้ฟังที่ยืนนิ่งด้วยอัตราเร็ว 20 m/s อัตราเร็วเสียง 340 m/s ผู้ฟังได้ยินเสียงความถี่กี่เฮิรตซ์',
      answer: 680, unit: 'Hz', tol: { rel: 0.005 },
      hint: 'แหล่งกำเนิดเคลื่อนที่เข้าหา: f′ = f·v/(v − v_s)',
      explanation: 'f′ = f·v/(v − v_s) = 640 × 340 / (340 − 20) = 640 × 340/320 = 680 Hz' },

    { id: 'L8-Q04', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'รถไฟเปิดหวูดความถี่ 720 Hz แล่นออกห่างจากผู้ฟังที่ยืนบนชานชาลาด้วยอัตราเร็ว 20 m/s (อัตราเร็วเสียง 340 m/s) ผู้ฟังได้ยินเสียงความถี่กี่เฮิรตซ์',
      answer: 680, unit: 'Hz', tol: { rel: 0.005 },
      hint: 'แหล่งกำเนิดเคลื่อนที่ออกห่าง: f′ = f·v/(v + v_s)',
      explanation: 'f′ = f·v/(v + v_s) = 720 × 340 / 360 = 680 Hz' },

    { id: 'L8-Q05', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ผู้ฟังขี่จักรยานยนต์เข้าหาลำโพงที่อยู่นิ่งด้วยอัตราเร็ว 34 m/s ลำโพงให้เสียงความถี่ 500 Hz (อัตราเร็วเสียง 340 m/s) ผู้ฟังได้ยินเสียงความถี่กี่เฮิรตซ์',
      answer: 550, unit: 'Hz', tol: { rel: 0.005 },
      hint: 'ผู้ฟังเคลื่อนที่เข้าหา: f′ = f(v + v_o)/v',
      explanation: 'f′ = f(v + v_o)/v = 500 × (340 + 34)/340 = 500 × 1.1 = 550 Hz' },

    { id: 'L8-Q06', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'เมื่อแหล่งกำเนิดเสียงเคลื่อนที่ ความยาวคลื่นของเสียงด้าน “หน้า” แหล่งกำเนิดเป็นอย่างไร เมื่อเทียบกับขณะแหล่งกำเนิดอยู่นิ่ง',
      choices: ['ยาวขึ้น', 'สั้นลง', 'เท่าเดิม', 'เป็นศูนย์'],
      answer: 1,
      hint: 'แหล่งกำเนิดไล่ตามหน้าคลื่นที่ตัวเองปล่อยออกไป',
      explanation: 'ด้านหน้าแหล่งกำเนิด λ′ = (v − v_s)/f สั้นกว่า λ = v/f ส่วนด้านหลัง λ′ = (v + v_s)/f ยาวขึ้น' },

    { id: 'L8-Q07', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'เครื่องบินขับไล่บินด้วยอัตราเร็ว 680 m/s ในอากาศที่อัตราเร็วเสียง 340 m/s เครื่องบินมีเลขมัคเท่าใด',
      answer: 2, unit: '', tol: { rel: 0.005 },
      hint: 'เลขมัค M = v_s / v',
      explanation: 'M = v_s / v = 680 / 340 = 2 (เร็วเป็น 2 เท่าของเสียง จึงเกิดคลื่นกระแทก)' },

    { id: 'L8-Q08', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'เครื่องบินมีเลขมัค 2 มุมครึ่งหนึ่งของยอดกรวยคลื่นกระแทก (θ) มีค่าเท่าใด',
      choices: ['30°', '45°', '60°', '90°'],
      answer: 0,
      hint: 'sin θ = v / v_s = 1/M',
      explanation: 'sin θ = 1/M = 1/2 ⇒ θ = 30°' },

    { id: 'L8-Q09', type: 'num', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 200,
      prompt: 'ผู้ฟังยืนนิ่งข้างถนน ได้ยินเสียงไซเรนรถพยาบาลความถี่ 612 Hz ขณะรถวิ่งเข้าหา และ 544 Hz หลังรถวิ่งผ่านไปแล้ว (อัตราเร็วเสียง 340 m/s) รถพยาบาลวิ่งด้วยอัตราเร็วกี่ m/s',
      answer: 20, unit: 'm/s', tol: { rel: 0.02 },
      hint: 'เขียน 2 สมการ: 612 = f·v/(v − v_s) และ 544 = f·v/(v + v_s) แล้วหารกัน',
      explanation: '612/544 = (v + v_s)/(v − v_s) = 9/8\n8(340 + v_s) = 9(340 − v_s)\n17v_s = 340 ⇒ v_s = 20 m/s\n(และความถี่จริงของไซเรน f = 612 × 320/340 = 576 Hz)' },

    { id: 'L8-Q10', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 100,
      prompt: 'ข้อใดเป็นการประยุกต์ใช้ปรากฏการณ์ดอปเพลอร์',
      choices: ['การวัดอัตราการไหลของเลือดด้วยอัลตราซาวด์ดอปเพลอร์', 'การบุผนังห้องด้วยวัสดุดูดกลืนเสียง', 'การจูนกีตาร์ด้วยบีตส์', 'การใช้ท่อเรโซแนนซ์หาอัตราเร็วเสียง'],
      answer: 0,
      hint: 'ต้องเกี่ยวกับการเปลี่ยนความถี่เพราะมีการเคลื่อนที่',
      explanation: 'อัลตราซาวด์ที่สะท้อนจากเม็ดเลือดที่กำลังเคลื่อนที่มีความถี่เปลี่ยนไปตามอัตราเร็วการไหล จึงใช้วัดการไหลของเลือดได้ (หลักเดียวกับเครื่องตรวจจับความเร็วรถ)' },

    { id: 'L8-Q11', type: 'num', difficulty: 'ยาก', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'รถพยาบาลเปิดไซเรน 500 Hz วิ่งด้วยอัตราเร็ว 20 m/s เข้าหารถจักรยานยนต์ที่วิ่งสวนมาด้วยอัตราเร็ว 20 m/s (อัตราเร็วเสียง 340 m/s) ผู้ขับจักรยานยนต์ได้ยินเสียงความถี่กี่เฮิรตซ์',
      answer: 562.5, unit: 'Hz', tol: { rel: 0.005 },
      hint: 'ทั้งผู้ฟังและแหล่งกำเนิดเคลื่อนที่เข้าหากัน: f′ = f(v + v_o)/(v − v_s)',
      explanation: 'f′ = f(v + v_o)/(v − v_s) = 500 × (340 + 20)/(340 − 20) = 500 × 360/320 = 562.5 Hz' },

    { id: 'L8-Q12', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'ผู้ฟังยืนห่างจากถนน 10 m รถพยาบาลวิ่งผ่านด้วยอัตราเร็วคงที่ ขณะรถอยู่ที่จุดใกล้ผู้ฟังที่สุด (แนวจากรถถึงผู้ฟังตั้งฉากกับถนน) ผู้ฟังได้ยินความถี่ประมาณเท่าใด',
      choices: ['เท่ากับความถี่จริงของไซเรน', 'สูงที่สุดตลอดการเคลื่อนที่', 'ต่ำที่สุดตลอดการเคลื่อนที่', 'เป็นศูนย์'],
      answer: 0,
      hint: 'ปรากฏการณ์ดอปเพลอร์ขึ้นกับองค์ประกอบของความเร็วที่ “เข้าหา” ผู้ฟัง',
      explanation: 'ที่จุดใกล้ที่สุด ความเร็วของรถตั้งฉากกับแนวที่เชื่อมรถกับผู้ฟัง องค์ประกอบความเร็วที่เข้าหาเป็นศูนย์ ความถี่ที่ได้ยินจึงประมาณเท่าความถี่จริง (ไม่คิดเวลาที่เสียงใช้เดินทาง) ความถี่ลดลงอย่างต่อเนื่องจากสูงไปต่ำขณะรถผ่าน' },

    { id: 'L8-Q13', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'ข้อใดอธิบายเสียงซอนิกบูม (sonic boom) จากเครื่องบินที่บินเร็วกว่าเสียงได้ถูกต้อง',
      choices: ['เกิดต่อเนื่องตลอดเวลาที่บินเร็วกว่าเสียง ผู้ฟังได้ยินเมื่อกรวยคลื่นกระแทกเคลื่อนผ่านตัว', 'เกิดเพียงครั้งเดียวขณะเครื่องบินทะลุกำแพงเสียง', 'เกิดจากเครื่องยนต์ระเบิด', 'ได้ยินเฉพาะนักบินในเครื่องบิน'],
      answer: 0,
      hint: 'หน้าคลื่นซ้อนกันเป็นกรวยที่ติดตามเครื่องบินไปตลอด',
      explanation: 'เมื่อ v_s > v หน้าคลื่นซ้อนกันเป็นกรวยคลื่นกระแทกที่เคลื่อนตามเครื่องบินไปตลอด ผู้ฟังแต่ละคนบนพื้นได้ยินเสียงดังมากเมื่อกรวยกวาดผ่านตำแหน่งของตน ไม่ได้เกิดครั้งเดียว' }
  ];

  /* ---------------- Mission 1: Set the ambulance speed ---------------- */
  const SPEEDS = [{ f: 640, ft: 680, vs: 20 }, { f: 600, ft: 680, vs: 40 }, { f: 480, ft: 510, vs: 20 }, { f: 544, ft: 578, vs: 20 }, { f: 595, ft: 680, vs: 42.5 }];
  const speedMission = {
    id: 'L8-M01', title: '🚑 ภารกิจทดลอง: ตั้งความเร็วรถพยาบาล', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 150,
    prompt: 'ไซเรนของรถพยาบาลมีความถี่คงที่ ผู้สังเกตยืนนิ่งอยู่ข้างหน้ารถ ตั้งอัตราเร็วของรถเพื่อให้ผู้สังเกตได้ยินความถี่ตามเป้าหมาย\nขับทดสอบได้ 3 ครั้ง ควรคำนวณก่อน!',
    hint: 'แหล่งกำเนิดเคลื่อนที่เข้าหา: f′ = f·v/(v − v_s) จัดรูปเป็น v_s = v(1 − f/f′)',
    explanation: 'จาก f′ = f·v/(v − v_s) ⇒ v − v_s = f·v/f′ ⇒ v_s = v(1 − f/f′) รถยิ่งเร็ว หน้าคลื่นด้านหน้ายิ่งอัดชิด ความถี่ที่ได้ยินยิ่งสูง',
    mount(el, api) {
      const { h, canvas, slider, pick, fmt } = api.lib;
      const S = pick(SPEEDS);
      const st = { vs: 0, tests: 3, run: null, tone: null, locked: false };
      const fObs = vs => S.f * V / (V - vs);
      const readout = h('div', { class: 'readout', text: 'ยังไม่ได้ขับทดสอบ' });
      const testsEl = h('div', { class: 'attempts' });
      const showTests = () => testsEl.replaceChildren('ขับทดสอบได้อีก ', h('b', { text: st.tests }), ' ครั้ง');
      const cv = h('canvas', { 'aria-label': 'ภาพจำลองรถพยาบาลและหน้าคลื่นเสียง' });
      const C = 180;                       // visual sound speed (px/s)
      const c = canvas(cv, 230, (x, w, hh, t) => {
        x.clearRect(0, 0, w, hh);
        const road = hh - 50, obsX = w - 60;
        x.fillStyle = 'rgba(143,176,207,.18)'; x.fillRect(0, road + 18, w, 16);
        x.setLineDash([14, 12]); x.strokeStyle = 'rgba(255,213,74,.5)'; x.beginPath(); x.moveTo(0, road + 26); x.lineTo(w, road + 26); x.stroke(); x.setLineDash([]);
        // observer
        x.font = '30px sans-serif'; x.textAlign = 'center'; x.fillText('🧍', obsX, road + 12);
        x.font = '12px Kanit, sans-serif'; x.fillStyle = '#e8f7ff'; x.fillText('ผู้สังเกต', obsX, road + 50);
        let carX = 70;
        if (st.run) {
          const el = (performance.now() - st.run.t0) / 1000, u = C * st.run.vs / V;
          carX = Math.min(obsX - 70, 70 + u * el);
          // wavefronts emitted every 0.18 s from the car's past positions
          for (let te = 0; te <= el; te += 0.18) {
            const ex = 70 + u * te, r = C * (el - te);
            if (r > w * 1.2) continue;
            x.strokeStyle = `rgba(34,227,255,${Math.max(0.08, 0.7 - r / w)})`; x.lineWidth = 1.5;
            x.beginPath(); x.arc(ex, road - 4, r, Math.PI, 2 * Math.PI); x.stroke();
          }
          if (el > 3.2 && !st.run.done) { st.run.done = true; finishRun(); }
        }
        x.font = '34px sans-serif'; x.save(); x.translate(carX, road + 10); x.scale(-1, 1); x.fillText('🚑', 0, 0); x.restore();
        x.font = '600 13px Kanit, sans-serif'; x.fillStyle = '#ffd54a';
        x.fillText(`ไซเรน f = ${S.f} Hz · เป้าหมาย: ผู้สังเกตได้ยิน ${S.ft} Hz`, w / 2, 22);
        x.textAlign = 'left';
      });
      c.start();
      const vSl = slider({ label: 'อัตราเร็วรถพยาบาล v_s', min: 0, max: 60, step: 0.5, value: 0, steps: [-5, -0.5, 0.5, 5], format: v => v.toFixed(1) + ' m/s', onInput: v => { st.vs = v; } });
      const drive = h('button', { class: 'btn ghost', type: 'button', text: '🚑 ขับทดสอบ', onclick: () => {
        if (st.locked || (st.run && !st.run.done)) return;
        if (st.tests <= 0) { api.sfx.wrong(); readout.textContent = 'หมดโควตาขับทดสอบ คำนวณแล้วส่งผลได้เลย'; return; }
        st.tests--; showTests(); st.run = { t0: performance.now(), vs: st.vs, done: false };
        drive.disabled = true; vSl.disable(true); readout.textContent = '🎧 กำลังฟังเสียงที่ผู้สังเกต...';
        if (st.tone) st.tone.stop();
        st.tone = api.audio.tones([fObs(st.vs)], { type: 'triangle', volume: 0.08, duration: 3 });
      } });
      function finishRun() {
        readout.textContent = `ที่ v_s = ${st.run.vs.toFixed(1)} m/s ผู้สังเกตได้ยิน ${fmt(fObs(st.run.vs), 4)} Hz`;
        if (!st.locked) { drive.disabled = st.tests <= 0; vSl.disable(false); }
      }
      showTests();
      el.append(h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: 'DOPPLER STREET · v = 340 m/s' }), cv),
        h('div', { class: 'sim-controls' }, vSl.el, h('div', { class: 'control' }, drive, testsEl, readout)),
        h('div', { class: 'qpart' }, h('h4', { text: `เงื่อนไข: ไซเรน ${S.f} Hz · ต้องการให้ผู้สังเกตได้ยิน ${S.ft} Hz · v = ${V} m/s` }),
          h('div', { class: 'muted small', text: 'ยอมรับคลาดเคลื่อน ±0.5 m/s' })));
      return {
        check() {
          if (st.run && !st.run.done) return { invalid: true, msg: 'รอให้การขับทดสอบจบก่อน' };
          const ok = Math.abs(st.vs - S.vs) <= 0.5;
          return { ok, msg: `ที่ ${st.vs.toFixed(1)} m/s ผู้สังเกตจะได้ยิน ${fmt(fObs(st.vs), 4)} Hz ${fObs(st.vs) > S.ft ? '(สูงเกินไป)' : '(ต่ำเกินไป)'}` };
        },
        solution() { return `เฉลย: v_s = v(1 − f/f′) = 340 × (1 − ${S.f}/${S.ft}) = ${S.vs} m/s`; },
        lock() { st.locked = true; vSl.disable(true); drive.disabled = true; },
        destroy() { c.destroy(); if (st.tone) st.tone.stop(); },
        _debug: () => ({ vs: S.vs })
      };
    }
  };

  /* ---------------- Mission 2: Analyse a recorded pass-by ---------------- */
  const PASSES = [{ f: 576, vs: 20 }, { f: 720, vs: 20 }, { f: 990, vs: 34 }];
  const passMission = {
    id: 'L8-M02', title: '📈 ภารกิจวิเคราะห์: ถอดรหัสเสียงรถพยาบาลที่วิ่งผ่าน', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 150,
    prompt: 'เครื่องบันทึกเสียงข้างถนนวัดความถี่ไซเรนขณะรถพยาบาลวิ่งผ่านด้วยอัตราเร็วคงที่ ได้กราฟความถี่–เวลาดังภาพ\nใช้ข้อมูลจากกราฟหา (1) อัตราเร็วของรถ และ (2) ความถี่จริงของไซเรน',
    hint: 'ช่วงเข้าใกล้ f_a = f·v/(v − v_s) และช่วงผ่านไปแล้ว f_r = f·v/(v + v_s) หารกันได้ f_a/f_r = (v + v_s)/(v − v_s) ⇒ v_s = v(f_a − f_r)/(f_a + f_r) จากนั้น f = f_a(v − v_s)/v',
    explanation: 'สองสมการดอปเพลอร์ (เข้าใกล้และออกห่าง) มีตัวแปรที่ไม่ทราบ 2 ตัว (f และ v_s) จึงแก้ได้ ผลลัพธ์ v_s = v(f_a − f_r)/(f_a + f_r) ไม่ขึ้นกับความถี่จริงของไซเรน',
    mount(el, api) {
      const { h, canvas, pick, parseNum, fmt } = api.lib;
      const S = pick(PASSES);
      const fa = S.f * V / (V - S.vs), fr = S.f * V / (V + S.vs);
      const D = 6, TMAX = 8;                              // observer 6 m from the road, ±8 s
      const fAt = t => { const x = S.vs * t, r = Math.hypot(x, D), toward = S.vs * (-x) / r; return S.f * V / (V - toward); };
      let tone = null, timer = null;
      const cv = h('canvas', { 'aria-label': 'กราฟความถี่ที่ได้ยินเทียบกับเวลา' });
      const lo = fr - 0.12 * (fa - fr), hi = fa + 0.12 * (fa - fr);
      const c = canvas(cv, 230, (x, w, hh) => {
        x.clearRect(0, 0, w, hh);
        const L = 56, R = w - 16, T = 30, B = hh - 34;
        const px = t => L + (t + TMAX) / (2 * TMAX) * (R - L), py = f => B - (f - lo) / (hi - lo) * (B - T);
        x.strokeStyle = 'rgba(34,227,255,.15)'; x.lineWidth = 1; x.fillStyle = '#8fb0cf'; x.font = '11px Kanit, sans-serif';
        for (let t = -8; t <= 8; t += 2) { x.beginPath(); x.moveTo(px(t), T); x.lineTo(px(t), B); x.stroke(); x.textAlign = 'center'; x.fillText(t + ' s', px(t), B + 16); }
        [fr, S.f, fa].forEach(f => { x.beginPath(); x.moveTo(L, py(f)); x.lineTo(R, py(f)); x.stroke(); });
        x.textAlign = 'right'; x.fillText(fmt(fa, 4), L - 4, py(fa) + 4); x.fillText(fmt(fr, 4), L - 4, py(fr) + 4);
        x.strokeStyle = '#22e3ff'; x.lineWidth = 3; x.shadowColor = '#22e3ff'; x.shadowBlur = 10; x.beginPath();
        for (let i = 0; i <= 400; i++) { const t = -TMAX + 2 * TMAX * i / 400; const X = px(t), Y = py(fAt(t)); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }
        x.stroke(); x.shadowBlur = 0;
        x.textAlign = 'left'; x.fillStyle = '#e8f7ff'; x.font = '600 12px Kanit, sans-serif';
        x.fillText(`ช่วงเข้าใกล้ (ไกลมาก): ${fmt(fa, 4)} Hz`, px(-7.6), py(fa) - 8);
        x.textAlign = 'right'; x.fillText(`ช่วงผ่านไปแล้ว (ไกลมาก): ${fmt(fr, 4)} Hz`, px(7.6), py(fr) + 18);
        x.textAlign = 'center'; x.fillStyle = '#ffd54a'; x.fillText('t = 0 : รถอยู่ใกล้ผู้ฟังที่สุด', px(0), T - 10);
        x.textAlign = 'left';
      });
      const play = h('button', { class: 'btn ghost sm', type: 'button', text: '🔊 ฟังเสียงที่บันทึกไว้ (เร่งความเร็ว ×4)', onclick: () => {
        if (tone) { tone.stop(); tone = null; clearInterval(timer); return; }
        const t0 = performance.now();
        tone = api.audio.tones([fAt(-TMAX)], { type: 'triangle', volume: 0.08, duration: 4, onend: () => { clearInterval(timer); tone = null; } });
        timer = setInterval(() => { const tt = -TMAX + (performance.now() - t0) / 1000 * 4; if (tone) tone.set([fAt(Math.min(TMAX, tt))]); }, 40);
      } });
      const vIn = h('input', { class: 'input', inputmode: 'decimal', placeholder: 'อัตราเร็วรถ', style: { maxWidth: '180px' }, 'aria-label': 'อัตราเร็วรถพยาบาล' });
      const fIn = h('input', { class: 'input', inputmode: 'decimal', placeholder: 'ความถี่จริง', style: { maxWidth: '180px' }, 'aria-label': 'ความถี่จริงของไซเรน' });
      el.append(h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: 'RECORDED FREQUENCY f′(t)' }), cv),
        h('div', { class: 'sim-controls' }, play, h('span', { class: 'muted small', text: `อัตราเร็วเสียง v = ${V} m/s` })),
        h('div', { class: 'qpart' }, h('h4', { text: 'ส่วนที่ 1: อัตราเร็วของรถพยาบาล' }), h('div', { class: 'num-answer', style: { marginTop: 0 } }, vIn, h('span', { class: 'unit', text: 'm/s' }))),
        h('div', { class: 'qpart' }, h('h4', { text: 'ส่วนที่ 2: ความถี่จริงของไซเรน' }), h('div', { class: 'num-answer', style: { marginTop: 0 } }, fIn, h('span', { class: 'unit', text: 'Hz' })),
          h('div', { class: 'muted small', text: 'ยอมรับคลาดเคลื่อน 2%' })));
      return {
        check() {
          const v = parseNum(vIn.value), f = parseNum(fIn.value);
          if (!isFinite(v) || !isFinite(f)) return { invalid: true, msg: 'กรอกคำตอบทั้ง 2 ส่วนเป็นตัวเลข' };
          const ok1 = api.lib.close(v, S.vs, { rel: 0.02 }), ok2 = api.lib.close(f, S.f, { rel: 0.02 });
          return { ok: ok1 && ok2, msg: `ผลตรวจ: ถูก ${[ok1, ok2].filter(Boolean).length} จาก 2 ส่วน` };
        },
        solution() { return `เฉลย: v_s = 340 × (${fmt(fa, 4)} − ${fmt(fr, 4)}) / (${fmt(fa, 4)} + ${fmt(fr, 4)}) = ${S.vs} m/s · f = ${fmt(fa, 4)} × (340 − ${S.vs})/340 = ${S.f} Hz`; },
        lock() { vIn.disabled = true; fIn.disabled = true; },
        destroy() { c.destroy(); clearInterval(timer); if (tone) tone.stop(); },
        _debug: () => ({ vs: S.vs, f: S.f })
      };
    }
  };

  SQ.registerLevel({
    id: 8, code: 'LEVEL 8', title: 'Doppler Mission', th: 'ปรากฏการณ์ดอปเพลอร์', icon: '🚑', topic: TOPIC,
    objective: 'วิเคราะห์เสียงรถพยาบาลที่เคลื่อนที่ คำนวณความถี่ที่ผู้สังเกตได้รับเมื่อแหล่งกำเนิดหรือผู้ฟังเคลื่อนที่ อ่านกราฟความถี่–เวลาเพื่อหาอัตราเร็วรถ และเข้าใจเลขมัคกับคลื่นกระแทก',
    questions, missions: [speedMission, passMission]
  });
})(window.SQ);
