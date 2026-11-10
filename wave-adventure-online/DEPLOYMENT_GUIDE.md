# DEPLOYMENT_GUIDE — คู่มือนำขึ้นใช้งานจริง

ระบบแบ่งเป็น 2 ส่วน
- **Frontend** (หน้าเว็บ React) → Netlify (ฟรี)
- **Backend** (Auth + Realtime Database + Security Rules) → Firebase แพ็กเกจฟรี **Spark** (ไม่ต้องผูกบัตร)
- **ตัวตัดสินเกม** → หน้าควบคุมห้องบนเครื่องครู (Host Runtime) · ไม่ใช้ Cloud Functions

ทั้งสองบริการ **ฟรีและไม่ต้องผูกบัตร** · ทำผ่านหน้าเว็บทั้งหมด ไม่ต้องติดตั้งโปรแกรม

> ⚠ ณ เวลาที่ส่งงาน **ยังไม่ได้ Deploy จริง** ทั้ง Firebase และ Netlify เพราะต้องใช้บัญชีของครู

## ขั้นที่ 1 — Firebase
ทำตาม `FIREBASE_SETUP.md` ข้อ 1–5 (สร้างโปรเจกต์, เปิด Auth, สร้างฐานข้อมูล + วาง Rules, ให้สิทธิ์ครู, คัดลอกค่า firebaseConfig)

## ขั้นที่ 2 — Frontend (Netlify)
1. Netlify → **Add new site → Import an existing project → GitHub** → เลือก repo `KruPung-Physics-Classroom`
2. ตั้งค่า Build
   | ช่อง | ค่า |
   |---|---|
   | Branch to deploy | `main` |
   | Base directory | `wave-adventure-online` |
   | Build command | `npm ci && npm run build` (มีใน `netlify.toml` แล้ว) |
   | Publish directory | `wave-adventure-online/dist` |
3. **Site configuration → Environment variables** ใส่ค่า `VITE_FIREBASE_*` (และ `VITE_SCHOOL_API_URL` ถ้าใช้) ตามตารางใน `FIREBASE_SETUP.md` ข้อ 5
4. **Deploys → Trigger deploy → Clear cache and deploy site**
5. นำโดเมนที่ได้ (เช่น `wave-adventure.netlify.app`) ไปเพิ่มใน Firebase Authentication → Authorized domains

> ถ้ายังไม่ใส่ค่า Firebase หน้าเว็บจะแสดงหน้า “ยังไม่ได้ตั้งค่า Firebase” แทนการทำงานผิดพลาด (ไม่มีการเชื่อมต่อปลอม)

## ขั้นที่ 3 — ตรวจสอบหลัง Deploy
- [ ] เปิดเว็บบนคอมพิวเตอร์ → ครู → Google Sign-in → เห็น Teacher Dashboard
- [ ] Teacher Dashboard → คลังคำถาม → **นำเข้าชุดเริ่มต้น** → เลือกไฟล์ `setup/wave-content.json` (FIREBASE_SETUP.md ข้อ 6)
- [ ] สร้างห้อง → ขึ้นจอโปรเจกเตอร์ (QR + รหัสห้อง) **เปิดหน้านี้ค้างไว้ตลอดการเล่น**
- [ ] มือถือนักเรียน 2 เครื่องสแกน QR → ใส่ชื่อ → พร้อม → เริ่มเกม → ทอยลูกเต๋า/ตอบการ์ด
- [ ] จบเกม → ดาวน์โหลด CSV เปิดใน Excel ภาษาไทยไม่เพี้ยน
- [ ] มือถือ: เมนูเบราว์เซอร์ → “เพิ่มไปยังหน้าจอหลัก” (PWA)

## การอัปเดตครั้งต่อไป
- แก้ Frontend → merge เข้า `main` → Netlify build ใหม่อัตโนมัติ
- แก้ `database.rules.json` → วางใหม่ใน Firebase Console → Realtime Database → Rules → Publish
- แก้ชุดการ์ดเริ่มต้นใน `shared/data/` → `npm run content` เพื่อสร้าง `setup/wave-content.json` ใหม่
- แก้คำถาม/การ์ด/กติกา → ทำผ่าน Teacher Dashboard ได้เลย ไม่ต้อง Deploy

## ฝังในเว็บสื่อการเรียนการสอน
```html
<a href="https://wave-adventure.netlify.app" target="_blank" rel="noopener">🌊 WAVE ADVENTURE ONLINE</a>
```
แนะนำให้เปิดเป็นแท็บใหม่ (ไม่ใช้ iframe) เพราะการเข้าสู่ระบบ Google แบบ popup อาจถูกบล็อกใน iframe

## แก้ปัญหาที่พบบ่อย
| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| ครูเข้าสู่ระบบ Google แล้วขึ้น “ยังไม่ได้รับสิทธิ์ครู” | เพิ่ม key ที่หน้าเว็บแสดงใน `config/teacherEmails` (FIREBASE_SETUP.md ข้อ 4) |
| popup Google ขึ้น `auth/unauthorized-domain` | ยังไม่เพิ่มโดเมน Netlify ใน Authorized domains |
| นักเรียนขึ้น “เครื่องครูไม่ตอบสนอง” / แถบ “เครื่องครูยังไม่ได้เปิดหน้าควบคุมห้อง” | ครูปิดหน้าควบคุมห้องหรือเครื่องครูหลุดอินเทอร์เน็ต → เปิดลิงก์ `/host/...` เดิมอีกครั้ง เกมเล่นต่อได้ทันที |
| สร้างห้องไม่ได้ “ยังไม่มีคลังการ์ด” | ยังไม่ได้นำเข้า `setup/wave-content.json` |
| ขึ้น “ไม่มีสิทธิ์ทำรายการนี้” ทุกอย่าง | ยังไม่ได้วาง `database.rules.json` ในแท็บ Rules หรือวางไม่ครบไฟล์ |
| เข้าระบบด้วยเลขประจำตัวไม่ได้ | `VITE_SCHOOL_API_URL` ว่าง / Apps Script ยังไม่ได้ทำ “เวอร์ชันใหม่” ที่มีคำสั่ง `waveLink` / ยังไม่ได้ใส่ Script properties 3 ค่า |
