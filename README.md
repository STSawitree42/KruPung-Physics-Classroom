# KruPung-Physics-Classroom
Physics Teacher Toolkit by Sawitree Theekhabhorn

---

## 🔊 Sound Quest – เกมฟิสิกส์เรื่องเสียง ม.5 (`sound-game.html`)

เกมไฟล์เดียว (HTML + CSS + JavaScript) ไม่ต้องติดตั้งอะไร เปิดในเบราว์เซอร์ได้ทันที รองรับคอมพิวเตอร์ แท็บเล็ต และมือถือ

### ภารกิจในเกม
| ภารกิจ | รายละเอียด |
|---|---|
| 🧠 Sound Quiz | ตอบคำถาม 10 ข้อ/รอบ (แนวคิด + คำนวณที่สุ่มตัวเลขใหม่ทุกครั้ง) มีเฉลยพร้อมวิธีคิดทุกข้อ, 3 หัวใจ, คอมโบ, ตัวช่วย 50:50 |
| 🎧 นักสืบบีตส์ | ฟังเสียงจริงจากส้อมเสียง 2 อัน แล้วนับความถี่บีตส์ พร้อมกราฟแอมพลิจูด |
| 🎻 จูนเสียงให้ตรง | ปรับความถี่ให้ตรงเสียงปริศนา โดยฟังให้บีตส์หายไป |

หัวข้อที่ครอบคลุม: ธรรมชาติของเสียง • อัตราเร็วเสียง • ความเข้มเสียงและเดซิเบล • ระดับเสียง คุณภาพเสียง และบีตส์ • การสั่นพ้องและคลื่นนิ่ง • ดอปเพลอร์และคลื่นกระแทก
มีหน้า “สรุปสูตร” และตารางคะแนน (บันทึกในเครื่องที่เล่น)

### วิธีนำไปใส่ในเว็บสื่อการเรียนการสอน

1. เปิด GitHub Pages ของ repo นี้ (Settings → Pages → Branch: `main` / root) เกมจะอยู่ที่
   `https://stsawitree42.github.io/KruPung-Physics-Classroom/sound-game.html`
2. วางโค้ดนี้ในหน้าเว็บ (Google Sites: แทรก → ฝัง → ฝังโค้ด, หรือเว็บ HTML ทั่วไป)

```html
<iframe
  src="https://stsawitree42.github.io/KruPung-Physics-Classroom/sound-game.html"
  style="width:100%; height:860px; border:0; border-radius:16px;"
  allow="autoplay; fullscreen"
  allowfullscreen
  title="Sound Quest เกมฟิสิกส์เรื่องเสียง ม.5"></iframe>
```

> ต้องมี `allow="autoplay"` เพื่อให้ภารกิจที่ 2 และ 3 เล่นเสียงได้ และ `allowfullscreen` สำหรับปุ่มเต็มจอ

**ลิงก์ตรงไปยังภารกิจ/หัวข้อเฉพาะ** (เติมท้าย URL)
- `?mode=quiz&topic=speed` — เปิดหน้าเลือกหัวข้อ เลือก “อัตราเร็วเสียง” ไว้ให้
  (topic: `nature`, `speed`, `intensity`, `pitch`, `resonance`, `doppler`, `all`)
- `?mode=beats` — เข้าภารกิจนักสืบบีตส์
- `?mode=tuning` — เข้าภารกิจจูนเสียง

**(ไม่บังคับ) ให้ iframe ปรับความสูงอัตโนมัติ และรับคะแนนของนักเรียน**
```html
<script>
window.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'krupung-sound-game:resize') {
    document.querySelector('iframe[title^="Sound Quest"]').style.height = (d.height + 20) + 'px';
  }
  if (d.type === 'krupung-sound-game:score') {
    console.log(d.name, d.mode, d.score); // นำไปบันทึกต่อ เช่น ส่งเข้า Google Sheets
  }
});
</script>
```

---

## 🚀 SOUND QUEST: ภารกิจพิชิตโลกแห่งเสียง (โฟลเดอร์ `sound-quest/`)

เกม Science Adventure 8 ด่าน (คำถาม 102 ข้อ + ภารกิจทดลองแบบโต้ตอบ 13 ภารกิจ) พร้อมระบบ XP เหรียญรางวัล คำใบ้ และปลดล็อกด่าน
พร้อม Deploy บน Netlify: ลากโฟลเดอร์ `sound-quest` ไปที่ https://app.netlify.com/drop หรือเชื่อม repo โดยตั้ง Base directory = `sound-quest`
รายละเอียดทั้งหมดอยู่ที่ [`sound-quest/README.md`](sound-quest/README.md)

---

## 🌊 WAVE ADVENTURE ONLINE: การผจญภัยในโลกคลื่น (โฟลเดอร์ `wave-adventure-online/`)

บอร์ดเกมฟิสิกส์ออนไลน์หลายผู้เล่น เรื่องคลื่นกล ม.5 (ดัดแปลงจากบอร์ดเกมต้นฉบับ) ครูเปิดห้อง + QR นักเรียนเล่นเป็นกลุ่มผ่านมือถือ
React + TypeScript + Firebase (เซิร์ฟเวอร์ตัดสินลูกเต๋า/คะแนน) · Teacher Dashboard · คลังคำถาม 50 ข้อ · ส่งออก CSV · PWA
เริ่มอ่านที่ [`wave-adventure-online/README.md`](wave-adventure-online/README.md) → ตั้งค่าตาม `FIREBASE_SETUP.md` และ `DEPLOYMENT_GUIDE.md`
