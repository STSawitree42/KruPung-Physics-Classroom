# SOUND QUEST: ภารกิจพิชิตโลกแห่งเสียง

เกมการเรียนรู้ฟิสิกส์เรื่อง **เสียง ม.5** แบบ Science Adventure + Physics Puzzle + Interactive Quiz
HTML / CSS / JavaScript ล้วน ไม่ต้อง build · เล่นได้ทั้งมือถือและคอมพิวเตอร์ · พร้อม Deploy บน Netlify

## โครงสร้างโปรเจกต์
```
sound-quest/
├─ index.html            หน้าเกม (Home, แผนที่ด่าน, เล่นด่าน, สรุปผล)
├─ netlify.toml          ค่า Deploy
├─ css/style.css         ธีม Futuristic Lab (Dark Navy + Neon Cyan)
├─ assets/favicon.svg
└─ js/
   ├─ config.js          ค่าตั้งเกม: XP, เกณฑ์ผ่านด่าน, การเชื่อมฐานข้อมูล
   ├─ lib.js             ตัวช่วย DOM, ตรวจคำตอบตัวเลข, Canvas
   ├─ storage.js         ชั้นข้อมูล (localStorage + โครง Remote API)
   ├─ audio.js           เสียงเอฟเฟกต์ + เครื่องกำเนิดเสียงสำหรับภารกิจ
   ├─ engine.js          ระบบเกม: ผู้เล่น/Avatar, แผนที่, XP, คำใบ้, ปลดล็อก, เหรียญ
   ├─ levels/levelN.js   คลังคำถาม + ภารกิจทดลองของแต่ละด่าน
   └─ main.js            เริ่มเกม
```

## ระบบคะแนน (ตั้งค่าได้ใน `js/config.js`)
| เหตุการณ์ | XP |
|---|---|
| ตอบปรนัยถูกครั้งแรก | +100 |
| ตอบถูกหลังใช้คำใบ้ (ทุกประเภท) | +60 |
| ทำภารกิจทดลองสำเร็จ | +150 |
| แก้โจทย์คำนวณถูก | +200 |
| ผ่านด่านโดยไม่ใช้คำใบ้ (ครั้งแรก) | +100 |

- ผ่านด่านเมื่อทำถูก ≥ 60% → ปลดล็อกด่านถัดไป
- เหรียญรางวัลต่อด่าน: 🥇 ถูก ≥ 90% และไม่ใช้คำใบ้ · 🥈 ถูก ≥ 75% · 🥉 ผ่านด่าน
- เหรียญตราความสำเร็จ 8 แบบ (เช่น นักคำนวณ นักทดลอง ปรมาจารย์แห่งเสียง)

### การป้องกันการได้คะแนนโดยไม่สมควร
- ตรวจคำตอบทุกครั้งก่อนให้ XP · ไม่แสดงเฉลยจนกว่าจะส่งคำตอบ
- ปุ่มส่งถูกล็อกทันทีที่กด (กดซ้ำ/กด Enter ซ้ำไม่ได้คะแนนซ้ำ)
- XP ได้เฉพาะ “การตอบครั้งแรก” ของแต่ละข้อ เล่นซ้ำเป็นโหมดฝึกซ้อม
- คำใบ้ที่เปิดดูแล้วถูกบันทึกทันที ออกจากด่านแล้วเข้าใหม่ก็ยังนับว่าใช้คำใบ้
- ภารกิจทดลองส่งผลได้ 3 ครั้ง และนับต่อเนื่องแม้ออกจากด่าน

## Deploy บน Netlify
**วิธีที่ 1 (เร็วที่สุด):** ลากโฟลเดอร์ `sound-quest` ไปวางที่ https://app.netlify.com/drop

**วิธีที่ 2 (เชื่อม GitHub):** Add new site → Import from Git → เลือก repo นี้
- Base directory: `sound-quest`
- Build command: *(เว้นว่าง)*
- Publish directory: `sound-quest` (หรือ `.` ตาม `netlify.toml`)

ฝังในเว็บสื่อการสอน:
```html
<iframe src="https://YOUR-SITE.netlify.app/" style="width:100%;height:900px;border:0;border-radius:16px"
        allow="autoplay; fullscreen" allowfullscreen title="SOUND QUEST"></iframe>
```

## เชื่อมต่อฐานข้อมูลภายหลัง
ทุกส่วนของเกมอ่าน/เขียนข้อมูลผ่าน `SQ.store` ใน `js/storage.js` เท่านั้น
1. ตั้ง `storage: 'remote'` และ `apiBaseUrl` ใน `js/config.js`
2. เกมจะ POST JSON ไปที่ API: `{action:'saveProfile', profile}` และ `{action:'logEvent', event}`
   (event มี `type` = `answer`, `level_start`, `level_end`, `profile_created`, `reset`)
3. localStorage ยังเป็นข้อมูลหลัก เกมจึงเล่นต่อได้แม้เน็ตหลุด

## เพิ่ม/แก้คำถาม
แก้ใน `js/levels/levelN.js` ทุกข้อมีฟิลด์:
`id, type ('mcq'|'num'), difficulty, bloom, topic, prompt, choices, answer, unit, tol, hint, explanation, points`
- `answer` ของปรนัย = ลำดับตัวเลือกที่ถูก (เริ่มที่ 0) ตัวเลือกจะถูกสลับตำแหน่งตอนแสดงผล
- `tol` = ค่าคลาดเคลื่อนที่ยอมรับของโจทย์คำนวณ (ค่าเริ่มต้น 2%)
