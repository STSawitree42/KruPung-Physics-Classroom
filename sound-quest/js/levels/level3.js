/* =========================================================
   LEVEL 3: Sound Properties — สะท้อน หักเห เลี้ยวเบน แทรกสอด
   ========================================================= */
(function (SQ) {
  'use strict';
  const TOPIC = 'สมบัติของเสียง';

  const questions = [
    { id: 'L3-Q01', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'เสียงก้อง (echo) ที่ได้ยินในหุบเขา เกิดจากสมบัติใดของเสียง',
      choices: ['การหักเห', 'การสะท้อน', 'การเลี้ยวเบน', 'การแทรกสอด'],
      answer: 1,
      hint: 'เสียงไปกระทบหน้าผาแล้วกลับมาหาเรา',
      explanation: 'เสียงก้องคือเสียงที่สะท้อนจากสิ่งกีดขวางกลับมาถึงหูช้ากว่าเสียงเดิมอย่างน้อย 0.1 s จนหูแยกได้ว่าเป็นคนละเสียง' },

    { id: 'L3-Q02', type: 'mcq', difficulty: 'ง่าย', bloom: 'ความรู้', topic: TOPIC, points: 100,
      prompt: 'เราได้ยินเสียงแตรรถที่อยู่อีกด้านของมุมตึก แม้มองไม่เห็นรถ เป็นผลจากสมบัติใดของเสียง',
      choices: ['การสะท้อน', 'การหักเห', 'การเลี้ยวเบน', 'การดูดกลืน'],
      answer: 2,
      hint: 'คลื่นเคลื่อนที่อ้อมขอบสิ่งกีดขวางได้',
      explanation: 'เสียงมีความยาวคลื่นใกล้เคียงกับขนาดของสิ่งกีดขวาง (มุมตึก ประตู) จึงเลี้ยวเบนอ้อมไปด้านหลังสิ่งกีดขวางได้ดี' },

    { id: 'L3-Q03', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'ในเวลากลางคืน เรามักได้ยินเสียงรถไฟจากที่ไกล ๆ ได้ชัดกว่าเวลากลางวัน เพราะเหตุใด',
      choices: ['กลางคืนเสียงสะท้อนจากเมฆได้ดีกว่า', 'อากาศใกล้พื้นเย็นกว่าอากาศด้านบน เสียงจึงหักเหโค้งกลับลงสู่พื้น', 'กลางคืนเสียงเลี้ยวเบนได้มากกว่า', 'กลางคืนความถี่ของเสียงสูงขึ้น'],
      answer: 1,
      hint: 'อุณหภูมิของอากาศชั้นล่างและชั้นบนต่างกันอย่างไรในเวลากลางคืน และ v ขึ้นกับอุณหภูมิ',
      explanation: 'กลางคืนพื้นดินคายความร้อนเร็ว อากาศใกล้พื้นเย็นกว่าอากาศด้านบน เสียงในอากาศเย็นเคลื่อนที่ช้ากว่า หน้าคลื่นจึงหักเหโค้งลงสู่พื้น ทำให้ได้ยินได้ไกล' },

    { id: 'L3-Q04', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'นักเรียนเดินผ่านหน้าลำโพง 2 ตัวที่เปิดเสียงความถี่เดียวกัน (เฟสตรงกัน) แล้วได้ยินเสียงดังและค่อยสลับกันตามตำแหน่ง ปรากฏการณ์นี้คือข้อใด',
      choices: ['การแทรกสอด', 'การสะท้อน', 'การหักเห', 'การสั่นพ้อง'],
      answer: 0,
      hint: 'คลื่นจาก 2 แหล่งมารวมกันที่จุดเดียวกัน',
      explanation: 'คลื่นจาก 2 แหล่งอาพันธ์มาซ้อนทับกัน จุดที่ผลต่างระยะทางเป็น nλ เกิดการแทรกสอดแบบเสริม (ดัง) จุดที่ผลต่างระยะทางเป็น (n + ½)λ เกิดแบบหักล้าง (ค่อย)' },

    { id: 'L3-Q05', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'ความเข้าใจ', topic: TOPIC, points: 100,
      prompt: 'เหตุใดเสียงจึงเลี้ยวเบนผ่านประตูห้องเรียนได้ดีกว่าแสง',
      choices: ['เสียงเคลื่อนที่เร็วกว่าแสง', 'ความยาวคลื่นของเสียงใกล้เคียงกับขนาดของประตู แต่แสงมีความยาวคลื่นสั้นมาก', 'เสียงเป็นคลื่นตามขวาง', 'แสงไม่มีพลังงาน'],
      answer: 1,
      hint: 'การเลี้ยวเบนเห็นได้ชัดเมื่อความยาวคลื่นเทียบกับขนาดช่องเปิดเป็นอย่างไร',
      explanation: 'การเลี้ยวเบนเด่นชัดเมื่อความยาวคลื่นใกล้เคียงกับขนาดช่องเปิด เสียงที่ได้ยินมี λ ประมาณ 0.017–17 m ใกล้เคียงขนาดประตู ส่วนแสงมี λ ประมาณ 10⁻⁷ m สั้นกว่าประตูมาก' },

    { id: 'L3-Q06', type: 'num', difficulty: 'ปานกลาง', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'หูของคนแยกเสียงสะท้อนออกจากเสียงเดิมได้เมื่อมาถึงห่างกันอย่างน้อย 0.1 s ถ้าอัตราเร็วเสียง 340 m/s ต้องยืนห่างผนังอย่างน้อยกี่เมตรจึงได้ยินเสียงก้อง',
      answer: 17, unit: 'm', tol: { rel: 0.01 },
      hint: 'ใน 0.1 s เสียงต้องเดินทางไปถึงผนังและกลับมา: 2s = vt',
      explanation: '2s = vt = 340 × 0.1 = 34 m\ns = 17 m' },

    { id: 'L3-Q07', type: 'num', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 200,
      prompt: 'เรือสำรวจส่งคลื่นโซนาร์ลงไปในทะเล (อัตราเร็วเสียงในน้ำทะเล 1,500 m/s) คลื่นสะท้อนจากพื้นทะเลกลับมาในเวลา 0.80 s ทะเลบริเวณนั้นลึกกี่เมตร',
      answer: 600, unit: 'm', tol: { rel: 0.01 },
      hint: 'เสียงเดินทางลงไปและสะท้อนกลับขึ้นมา',
      explanation: '2s = vt = 1,500 × 0.80 = 1,200 m\ns = 600 m' },

    { id: 'L3-Q08', type: 'mcq', difficulty: 'ปานกลาง', bloom: 'การประยุกต์', topic: TOPIC, points: 100,
      prompt: 'ห้องประชุมและโรงภาพยนตร์มักบุผนังด้วยวัสดุนุ่มที่มีรูพรุน จุดประสงค์หลักคือข้อใด',
      choices: ['ทำให้เสียงสะท้อนมากขึ้น', 'ลดการสะท้อนของเสียงเพื่อลดเสียงก้อง', 'เพิ่มความถี่ของเสียง', 'ทำให้เสียงเลี้ยวเบนมากขึ้น'],
      answer: 1,
      hint: 'วัสดุนุ่มและพรุนทำอะไรกับพลังงานเสียงที่ตกกระทบ',
      explanation: 'วัสดุนุ่มที่มีรูพรุนดูดกลืนพลังงานเสียงได้ดี ลดการสะท้อน จึงลดเสียงก้องและทำให้ฟังเสียงพูดหรือเพลงได้ชัดเจน' },

    { id: 'L3-Q09', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'กลางวันที่แดดจัด อากาศใกล้พื้นร้อนกว่าอากาศด้านบน เสียงตะโกนที่ส่งออกไปตามแนวราบจะเป็นอย่างไร',
      choices: ['หักเหโค้งขึ้นด้านบน ผู้ฟังที่อยู่ไกลบนพื้นจึงได้ยินไม่ชัด', 'หักเหโค้งลงสู่พื้น ได้ยินไกลขึ้น', 'เคลื่อนที่เป็นเส้นตรงไม่เปลี่ยนทิศ', 'สะท้อนกลับทั้งหมด'],
      answer: 0,
      hint: 'เสียงในอากาศร้อนเร็วกว่า ส่วนของหน้าคลื่นที่อยู่ด้านล่างจะวิ่งนำ หน้าคลื่นจึงเอียงไปทางใด',
      explanation: 'อากาศใกล้พื้นร้อน เสียงเร็วกว่าอากาศด้านบน หน้าคลื่นส่วนล่างนำหน้า ทำให้คลื่นเสียงหักเหโค้งขึ้นสู่อากาศด้านบน (เบนเข้าหาบริเวณที่เสียงช้ากว่า) ผู้ฟังไกล ๆ บนพื้นจึงได้ยินไม่ชัด' },

    { id: 'L3-Q10', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'ลำโพง A และ B ให้เสียงความถี่ 680 Hz เฟสตรงกัน อัตราเร็วเสียง 340 m/s จุด P อยู่ห่างลำโพง A 3.00 m และห่างลำโพง B 3.75 m ที่จุด P จะได้ยินเสียงอย่างไร',
      choices: ['ดังมาก (แทรกสอดแบบเสริม)', 'ค่อยมาก (แทรกสอดแบบหักล้าง)', 'ดังปานกลาง เพราะเสริมกันครึ่งหนึ่ง', 'ได้ยินเป็นบีตส์'],
      answer: 1,
      hint: 'หา λ = v/f แล้วเทียบผลต่างระยะทาง |PA − PB| ว่าเป็นกี่เท่าของ λ',
      explanation: 'λ = 340/680 = 0.5 m\n|PA − PB| = 3.75 − 3.00 = 0.75 m = 1.5λ = (1 + ½)λ\nผลต่างระยะทางเป็น (n + ½)λ ⇒ แทรกสอดแบบหักล้าง ได้ยินเสียงค่อย' },

    { id: 'L3-Q11', type: 'num', difficulty: 'ยาก', bloom: 'การคำนวณ', topic: TOPIC, points: 200,
      prompt: 'ลำโพง 2 ตัวเฟสตรงกัน ให้เสียงความถี่ 850 Hz อัตราเร็วเสียง 340 m/s ผลต่างระยะทางจากลำโพงทั้งสองที่ “น้อยที่สุด” (ไม่เป็นศูนย์) ซึ่งทำให้ได้ยินเสียงค่อยที่สุด เป็นกี่เมตร',
      answer: 0.2, unit: 'm', tol: { rel: 0.02 },
      hint: 'เสียงค่อยที่สุด = แทรกสอดแบบหักล้าง ผลต่างระยะทาง = (n + ½)λ ใช้ n = 0',
      explanation: 'λ = v/f = 340/850 = 0.4 m\nหักล้างครั้งแรก (n = 0): ผลต่างระยะทาง = λ/2 = 0.2 m' },

    { id: 'L3-Q12', type: 'num', difficulty: 'ยาก', bloom: 'การประยุกต์', topic: TOPIC, points: 200,
      prompt: 'ค้างคาวส่งเสียงอัลตราซาวด์ออกไป แล้วได้ยินเสียงสะท้อนจากแมลงหลังส่ง 0.020 s ถ้าอัตราเร็วเสียง 340 m/s แมลงอยู่ห่างค้างคาวกี่เมตร',
      answer: 3.4, unit: 'm', tol: { rel: 0.01 },
      hint: 'เหมือนโซนาร์: เสียงไปถึงแมลงแล้วสะท้อนกลับ',
      explanation: '2s = vt = 340 × 0.020 = 6.8 m\ns = 3.4 m' },

    { id: 'L3-Q13', type: 'mcq', difficulty: 'ยาก', bloom: 'การวิเคราะห์', topic: TOPIC, points: 100,
      prompt: 'คลื่นเสียงเคลื่อนที่เฉียง ๆ จากชั้นอากาศร้อนเข้าสู่ชั้นอากาศเย็น ข้อใดถูกต้อง',
      choices: ['อัตราเร็วเพิ่มขึ้น หักเหออกจากเส้นแนวฉาก', 'อัตราเร็วลดลง หักเหเข้าหาเส้นแนวฉาก', 'ความถี่ลดลง ทิศไม่เปลี่ยน', 'อัตราเร็วคงเดิม แต่ความยาวคลื่นเพิ่มขึ้น'],
      answer: 1,
      hint: 'ใช้กฎของสเนลล์: sin θ₁ / sin θ₂ = v₁ / v₂',
      explanation: 'อากาศเย็น v น้อยกว่า จาก sin θ₁/sin θ₂ = v₁/v₂ เมื่อ v₂ < v₁ จะได้ θ₂ < θ₁ คลื่นจึงหักเหเข้าหาเส้นแนวฉาก ความถี่คงเดิม ความยาวคลื่นสั้นลง' }
  ];

  /* ---------------- Mission 1: Phenomenon detective ---------------- */
  const PHEN = [
    { value: 'reflect', label: '🪞 การสะท้อน' }, { value: 'refract', label: '↪️ การหักเห' },
    { value: 'diffract', label: '🌀 การเลี้ยวเบน' }, { value: 'interfere', label: '〰️ การแทรกสอด' }];
  const CASES = {
    reflect: [
      { icon: '🏔️', text: 'ตะโกนในหุบเขา แล้วได้ยินเสียงตัวเองย้อนกลับมาหลังผ่านไปครู่หนึ่ง' },
      { icon: '🦇', text: 'ค้างคาวบินหลบผนังถ้ำได้ในความมืด โดยฟังเสียงที่ตัวเองส่งออกไปซึ่งย้อนกลับมา' }],
    refract: [
      { icon: '🌙', text: 'กลางคืนได้ยินเสียงรถไฟจากหมู่บ้านที่อยู่ไกลได้ชัดกว่ากลางวัน' },
      { icon: '🏜️', text: 'กลางวันที่ร้อนจัด เสียงตะโกนจากระยะไกลเบนขึ้นด้านบนจนคนบนพื้นแทบไม่ได้ยิน' }],
    diffract: [
      { icon: '🚪', text: 'ได้ยินเสียงเพื่อนคุยกันในห้องข้าง ๆ ผ่านประตูที่เปิดแง้ม ทั้งที่มองไม่เห็นตัว' },
      { icon: '🏢', text: 'ได้ยินเสียงแตรรถที่จอดอยู่อีกด้านของมุมตึก' }],
    interfere: [
      { icon: '🔊', text: 'เดินผ่านหน้าลำโพงคู่ที่เปิดเสียงเดียวกัน ได้ยินเสียงดัง–ค่อยสลับกันเป็นช่วง ๆ ตามตำแหน่ง' },
      { icon: '🎧', text: 'หูฟังตัดเสียงรบกวนสร้างคลื่นเสียงที่มีเฟสตรงข้ามกับเสียงรบกวน ทำให้เสียงรบกวนหายไป' }]
  };
  const detective = {
    id: 'L3-M01', title: '🕵️ ภารกิจ: นักสืบปรากฏการณ์เสียง', difficulty: 'ปานกลาง', bloom: 'การวิเคราะห์', topic: TOPIC, points: 150,
    prompt: 'มีรายงานเหตุการณ์แปลก ๆ เกี่ยวกับเสียง 4 คดี วิเคราะห์ว่าแต่ละคดีเกิดจากสมบัติใดของเสียง\n(ต้องถูกครบทั้ง 4 คดีจึงสำเร็จ)',
    hint: 'สะท้อน = เสียงกลับมา · หักเห = เสียงเปลี่ยนทิศเพราะอุณหภูมิ/ตัวกลางต่างกัน · เลี้ยวเบน = เสียงอ้อมสิ่งกีดขวาง · แทรกสอด = คลื่น 2 ขบวนรวมกันเกิดดัง–ค่อย',
    explanation: 'การสะท้อน: เสียงกระทบสิ่งกีดขวางแล้วกลับ (เสียงก้อง โซนาร์) · การหักเห: เสียงเปลี่ยนทิศเมื่ออัตราเร็วเปลี่ยน เช่น อากาศต่างอุณหภูมิ · การเลี้ยวเบน: เสียงอ้อมขอบสิ่งกีดขวาง · การแทรกสอด: คลื่นซ้อนทับกันเกิดเสริมหรือหักล้าง',
    mount(el, api) {
      const { h, segmented, shuffle, pick } = api.lib;
      const cards = shuffle(Object.keys(CASES).map(k => ({ key: k, ...pick(CASES[k]) })));
      const segs = cards.map(() => segmented(PHEN, () => api.sfx.click()));
      el.append(...cards.map((c, i) => h('div', { class: 'qpart' },
        h('h4', null, `คดีที่ ${i + 1}  `, h('span', { style: { fontSize: '1.6rem' }, text: c.icon })),
        h('p', { style: { margin: '4px 0 10px' }, text: c.text }), segs[i].el)));
      return {
        check() {
          if (segs.some(s => s.value == null)) return { invalid: true, msg: 'วิเคราะห์ให้ครบทั้ง 4 คดีก่อน' };
          const n = segs.filter((s, i) => s.value === cards[i].key).length;
          return { ok: n === 4, msg: `ผลตรวจ: วิเคราะห์ถูก ${n} จาก 4 คดี` };
        },
        solution() { return 'เฉลย: ' + cards.map((c, i) => `คดี ${i + 1} = ${PHEN.find(p => p.value === c.key).label}`).join(' · '); },
        lock() { segs.forEach(s => s.disable(true)); },
        destroy() {},
        _debug: () => ({ keys: cards.map(c => c.key) })
      };
    }
  };

  /* ---------------- Mission 2: Find the quiet spot (interference) ---------------- */
  const V = 340, D = 1.2, L = 4.0;          // speaker separation and distance to the mic track (m)
  const interference = {
    id: 'L3-M02', title: '🎤 ภารกิจทดลอง: ตามหาจุดเงียบ', difficulty: 'ยาก', bloom: 'การประยุกต์', topic: TOPIC, points: 150,
    prompt: 'ลำโพง S₁ และ S₂ ห่างกัน 1.2 m ให้เสียงความถี่เดียวกันและเฟสตรงกัน (v = 340 m/s)\nเลื่อนไมโครโฟนตามแนวเส้นประ (ห่างลำโพง 4.0 m) ไปยัง “จุดเงียบจุดแรก” ที่อยู่ใกล้เส้นกึ่งกลางมากที่สุด',
    hint: 'จุดเงียบแรกคือจุดที่เกิดการแทรกสอดแบบหักล้างครั้งแรก: |S₁P − S₂P| = λ/2 คำนวณ λ = v/f ก่อน แล้วดูค่าผลต่างระยะทางบนหน้าจอ',
    explanation: 'ที่เส้นกึ่งกลาง ผลต่างระยะทางเป็นศูนย์ เสียงเสริมกัน (ดัง) เมื่อเลื่อนออกไป ผลต่างระยะทางเพิ่มขึ้น จุดเงียบแรกเกิดเมื่อ |S₁P − S₂P| = λ/2 ซึ่งคลื่นจากลำโพงทั้งสองมาถึงด้วยเฟสตรงข้ามกันและหักล้างกัน',
    mount(el, api) {
      const { h, canvas, slider, pick, fmt } = api.lib;
      const f = pick([340, 425, 680]), lam = V / f;
      const st = { y: 0, locked: false, reveal: false, tone: null };
      const r1 = y => Math.hypot(L, y - D / 2), r2 = y => Math.hypot(L, y + D / 2);
      const dPath = y => Math.abs(r1(y) - r2(y));
      const amp = y => Math.abs(Math.cos(Math.PI * dPath(y) / lam));
      // exact answer by bisection (first minimum above the centre line)
      let lo = 0, hi = 2.5; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (dPath(m) < lam / 2) lo = m; else hi = m; }
      const yAns = (lo + hi) / 2;

      const cv = h('canvas', { 'aria-label': 'ภาพจำลองการแทรกสอดจากลำโพงสองตัว' });
      const sim = h('div', { class: 'sim' }, h('span', { class: 'sim-label', text: 'INTERFERENCE LAB' }), cv);
      const meterFill = h('div'); const meter = h('div', { class: 'meter' }, meterFill);
      const read = h('div', { class: 'readout' });
      const Y0 = -0.5, X0 = -0.6, X1 = L + 0.5, YR = 2.6;
      const c = canvas(cv, 300, (x, w, hh, t) => {
        x.clearRect(0, 0, w, hh);
        const sx = w / (X1 - X0), sy = hh / (2 * YR), s = Math.min(sx, sy);
        const ox = (w - (X1 - X0) * s) / 2 - X0 * s, oy = hh / 2;
        const P = (X, Y) => [ox + X * s, oy - Y * s];
        if (st.reveal) {   // interference map after the mission
          const step = 6;
          for (let px = P(0, 0)[0]; px < w; px += step) for (let py = 0; py < hh; py += step) {
            const X = (px - ox) / s, Y = (oy - py) / s; if (X < 0.05) continue;
            const a = Math.abs(Math.cos(Math.PI * Math.abs(Math.hypot(X, Y - D / 2) - Math.hypot(X, Y + D / 2)) / lam));
            x.fillStyle = `rgba(34,227,255,${0.35 * a * a})`; x.fillRect(px, py, step, step);
          }
        }
        // animated crests
        const phase = (t * 0.6) % 1;
        [[0, D / 2], [0, -D / 2]].forEach(([X, Y], i) => {
          const [cx, cy] = P(X, Y);
          for (let n = 0; n < 40; n++) {
            const r = (n + phase) * lam * s; if (r > w) break;
            x.strokeStyle = i ? 'rgba(167,139,250,.35)' : 'rgba(34,227,255,.35)'; x.lineWidth = 1.2;
            x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2); x.stroke();
          }
          x.fillStyle = '#13295a'; x.strokeStyle = i ? '#a78bfa' : '#22e3ff'; x.lineWidth = 2;
          x.fillRect(cx - 14, cy - 12, 14, 24); x.strokeRect(cx - 14, cy - 12, 14, 24);
          x.fillStyle = '#e8f7ff'; x.font = '600 13px Kanit, sans-serif'; x.fillText(i ? 'S₂' : 'S₁', cx - 34, cy + 5);
        });
        // centre line + mic track
        const [cx0, cy0] = P(0, 0), [mx] = P(L, 0);
        x.setLineDash([3, 6]); x.strokeStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.moveTo(cx0, cy0); x.lineTo(w, cy0); x.stroke();
        x.strokeStyle = 'rgba(255,213,74,.6)'; x.beginPath(); x.moveTo(mx, 6); x.lineTo(mx, hh - 6); x.stroke(); x.setLineDash([]);
        // paths + mic
        const [px, py] = P(L, st.y);
        x.strokeStyle = 'rgba(34,227,255,.7)'; x.beginPath(); x.moveTo(...P(0, D / 2)); x.lineTo(px, py); x.stroke();
        x.strokeStyle = 'rgba(167,139,250,.7)'; x.beginPath(); x.moveTo(...P(0, -D / 2)); x.lineTo(px, py); x.stroke();
        x.fillStyle = '#ff4fd8'; x.shadowColor = '#ff4fd8'; x.shadowBlur = 14; x.beginPath(); x.arc(px, py, 9, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
        x.fillStyle = '#e8f7ff'; x.font = '13px Kanit, sans-serif'; x.fillText('🎤', px + 10, py + 5);
      });
      c.start();

      function update() {
        const a = amp(st.y);
        meterFill.style.width = Math.round(a * a * 100) + '%';
        read.textContent = `S₁P = ${r1(st.y).toFixed(3)} m · S₂P = ${r2(st.y).toFixed(3)} m · |S₁P − S₂P| = ${dPath(st.y).toFixed(3)} m`;
        if (st.tone) st.tone.set([f], [0.15 + 0.85 * a * a]);
      }
      const ySl = slider({ label: 'ตำแหน่งไมโครโฟน (วัดจากเส้นกึ่งกลาง)', min: -2.5, max: 2.5, step: 0.01, value: 0, steps: [-0.1, -0.01, 0.01, 0.1], format: v => (v >= 0 ? '+' : '') + v.toFixed(2) + ' m', onInput: v => { st.y = v; update(); } });
      const listen = h('button', { class: 'btn ghost sm', type: 'button', text: '🎧 ฟังเสียงที่ไมโครโฟน', onclick: () => {
        if (st.tone) { st.tone.stop(); st.tone = null; listen.textContent = '🎧 ฟังเสียงที่ไมโครโฟน'; return; }
        st.tone = api.audio.tones([f], { volume: 0.12, amps: [0.15 + 0.85 * amp(st.y) ** 2] }); listen.textContent = '⏹ หยุดฟัง';
      } });
      update();
      el.append(sim,
        h('div', { class: 'sim-controls' }, ySl.el,
          h('div', { class: 'control' }, h('label', null, h('span', { text: 'ความดังที่ไมโครโฟนวัดได้' })), meter, listen)),
        h('div', { class: 'qpart' }, h('h4', { text: `ข้อมูล: ความถี่ f = ${f} Hz · v = ${V} m/s` }), read,
          h('div', { class: 'muted small', text: 'ยอมรับเมื่อผลต่างระยะทางคลาดจากค่าที่ถูกไม่เกิน 0.04λ' })));
      return {
        check() {
          const ratio = dPath(st.y) / lam;
          const ok = Math.abs(ratio - 0.5) <= 0.04;
          return { ok, msg: `ที่ตำแหน่งนี้ ผลต่างระยะทาง = ${ratio.toFixed(2)}λ ${ratio < 0.5 ? '(ยังน้อยเกินไป)' : '(มากเกินไป)'}` };
        },
        solution() { return `เฉลย: λ = ${V}/${f} = ${fmt(lam)} m ⇒ จุดเงียบแรกเมื่อ |S₁P − S₂P| = λ/2 = ${fmt(lam / 2)} m อยู่ที่ประมาณ ±${yAns.toFixed(2)} m จากเส้นกึ่งกลาง (แถบมืดในแผนภาพ = แนวบัพ)`; },
        lock() { st.locked = true; st.reveal = true; ySl.disable(true); },
        destroy() { c.destroy(); if (st.tone) st.tone.stop(); },
        _debug: () => ({ y: yAns })
      };
    }
  };

  SQ.registerLevel({
    id: 3, code: 'LEVEL 3', title: 'Sound Properties', th: 'สมบัติของเสียง', icon: '🔀', topic: TOPIC,
    objective: 'วิเคราะห์ปรากฏการณ์การสะท้อน การหักเห การเลี้ยวเบน และการแทรกสอดของเสียงจากสถานการณ์จริง คำนวณระยะจากเสียงสะท้อน และใช้เงื่อนไขผลต่างระยะทางหาจุดที่เสียงหักล้างกัน',
    questions, missions: [detective, interference]
  });
})(window.SQ);
