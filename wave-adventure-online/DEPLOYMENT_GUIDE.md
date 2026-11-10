# DEPLOYMENT_GUIDE — คู่มือนำขึ้นใช้งานจริง

ระบบแบ่งเป็น 2 ส่วน
- **Frontend** (หน้าเว็บ React) → Netlify (ฟรี)
- **Backend** (Cloud Functions + Realtime Database + Auth) → Firebase (Cloud Functions ต้องใช้แพ็กเกจ Blaze ดูคำเตือนใน `FIREBASE_SETUP.md`)

> ⚠ ณ เวลาที่ส่งงาน **ยังไม่ได้ Deploy จริง** ทั้ง Firebase และ Netlify เพราะต้องใช้บัญชีของครูและต้องตัดสินใจเรื่องค่าใช้จ่ายเอง

## ขั้นที่ 1 — Backend (Firebase)
ทำตาม `FIREBASE_SETUP.md` ข้อ 1–6 ให้เสร็จก่อน จนสั่ง `npx firebase deploy --only database,functions` สำเร็จ

## ขั้นที่ 2 — Frontend (Netlify)
1. Netlify → **Add new site → Import an existing project → GitHub** → เลือก repo `KruPung-Physics-Classroom`
2. ตั้งค่า Build
   | ช่อง | ค่า |
   |---|---|
   | Branch to deploy | `main` |
   | Base directory | `wave-adventure-online` |
   | Build command | `npm ci && npm run build` (มีใน `netlify.toml` แล้ว) |
   | Publish directory | `wave-adventure-online/dist` |
3. **Site configuration → Environment variables** ใส่ค่า `VITE_FIREBASE_*` และ `VITE_FUNCTIONS_REGION` ตามตารางใน `FIREBASE_SETUP.md` ข้อ 7
4. **Deploys → Trigger deploy → Clear cache and deploy site**
5. นำโดเมนที่ได้ (เช่น `wave-adventure.netlify.app`) ไปเพิ่มใน Firebase Authentication → Authorized domains

> ถ้ายังไม่ใส่ค่า Firebase หน้าเว็บจะแสดงหน้า “ยังไม่ได้ตั้งค่า Firebase” แทนการทำงานผิดพลาด (ไม่มีการเชื่อมต่อปลอม)

## ขั้นที่ 3 — ตรวจสอบหลัง Deploy
- [ ] เปิดเว็บบนคอมพิวเตอร์ → ครู → Google Sign-in → เห็น Teacher Dashboard
- [ ] Teacher Dashboard → คลังคำถาม → กด “บันทึกชุดเริ่มต้นตอนนี้” (คำถาม 50 ข้อ + การ์ดต้นฉบับ) หรือปล่อยไว้ ระบบจะบันทึกให้เองเมื่อแก้ไขครั้งแรก
- [ ] สร้างห้อง → ขึ้นจอโปรเจกเตอร์ (QR + รหัสห้อง)
- [ ] มือถือนักเรียน 2 เครื่องสแกน QR → ใส่ชื่อ → พร้อม → เริ่มเกม → ทอยลูกเต๋า/ตอบการ์ด
- [ ] จบเกม → ดาวน์โหลด CSV เปิดใน Excel ภาษาไทยไม่เพี้ยน
- [ ] มือถือ: เมนูเบราว์เซอร์ → “เพิ่มไปยังหน้าจอหลัก” (PWA)

## การอัปเดตครั้งต่อไป
- แก้ Frontend → merge เข้า `main` → Netlify build ใหม่อัตโนมัติ
- แก้ `functions/` หรือ `database.rules.json` → สั่ง `npx firebase deploy --only database,functions` อีกครั้ง
- แก้คำถาม/การ์ด/กติกา → ทำผ่าน Teacher Dashboard ได้เลย ไม่ต้อง Deploy

## ฝังในเว็บสื่อการเรียนการสอน
```html
<a href="https://wave-adventure.netlify.app" target="_blank" rel="noopener">🌊 WAVE ADVENTURE ONLINE</a>
```
แนะนำให้เปิดเป็นแท็บใหม่ (ไม่ใช้ iframe) เพราะการเข้าสู่ระบบ Google แบบ popup อาจถูกบล็อกใน iframe

## แก้ปัญหาที่พบบ่อย
| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| ครูเข้าสู่ระบบ Google แล้วยังเข้า Dashboard ไม่ได้ | อีเมลไม่อยู่ใน `TEACHER_EMAILS` → แก้ไฟล์ `functions/.env.<project>` แล้ว deploy functions ใหม่ |
| popup Google ขึ้น `auth/unauthorized-domain` | ยังไม่เพิ่มโดเมน Netlify ใน Authorized domains |
| “เชื่อมต่อเซิร์ฟเวอร์ไม่ได้” | ยังไม่ deploy functions / ค่า `VITE_FUNCTIONS_REGION` ไม่ตรง / อินเทอร์เน็ตโรงเรียนบล็อก `*.cloudfunctions.net` |
| เข้าระบบด้วยเลขประจำตัวไม่ได้ | `SCHOOL_API_URL` ว่าง หรือ Apps Script ยังไม่ได้ทำ “เวอร์ชันใหม่” ที่มีคำสั่ง `verify` |
| Deploy functions ไม่ผ่าน “requires Blaze” | ต้องอัปเกรดแพ็กเกจ Blaze ก่อน |
