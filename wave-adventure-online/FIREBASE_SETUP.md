# FIREBASE_SETUP — ตั้งค่า Firebase แบบฟรี 100% (ไม่ต้องผูกบัตร)

> ✅ ใช้ **Firebase แพ็กเกจ Spark (ฟรี)** ซึ่ง **ไม่ต้องผูกบัตรเครดิตหรือบัญชีเรียกเก็บเงิน** และไม่มีทางถูกเรียกเก็บเงิน
> (ถ้าใช้เกินโควตา Firebase จะหยุดให้บริการชั่วคราว ไม่ใช่เรียกเก็บเงิน)
> ทุกขั้นตอนทำผ่านหน้าเว็บ **ไม่ต้องติดตั้งโปรแกรมใด ๆ** ใช้เวลาประมาณ 20–30 นาที

## ระบบทำงานอย่างไรเมื่อไม่มี Cloud Functions
- **เครื่องครู = เซิร์ฟเวอร์ของเกม**: หน้าควบคุมห้อง (`/host/...`) ที่ครูเปิดบนโปรเจกเตอร์เป็นผู้ทอยลูกเต๋า ตรวจคำตอบ ให้คะแนน และตรวจหมดเวลา
- **นักเรียนส่งได้แค่ “คำสั่ง”** (ทอย / ตอบ / เลือก) ของตัวเอง Security Rules ห้ามนักเรียนเขียนคะแนน ตำแหน่ง ลูกเต๋า หรืออ่านเฉลย
- **เข้าสู่ระบบด้วยเลขประจำตัว + PIN** ตรวจโดย Apps Script ของครู (ไม่บังคับ)
- ⚠ **ครูต้องเปิดหน้าควบคุมห้องค้างไว้ตลอดการเล่น** ถ้าปิด/หลุด เกมจะหยุดรอ และเล่นต่อได้ทันทีเมื่อเปิดหน้าเดิมอีกครั้ง (คะแนนไม่หาย)

โควตาฟรีของ Spark (Realtime Database): ผู้ใช้พร้อมกัน 100 การเชื่อมต่อ · พื้นที่ 1 GB · ดาวน์โหลด 10 GB/เดือน — เพียงพอสำหรับหลายห้องเรียนพร้อมกัน (1 ห้อง ≈ ครู 1 + กลุ่ม 2–6 เครื่อง)

## 1. สร้าง Firebase Project
1. เข้า https://console.firebase.google.com → **Create a project**
2. ตั้งชื่อ เช่น `wave-adventure-yingyuad` · Google Analytics: ปิดได้
3. ตรวจมุมซ้ายล่างว่าแพ็กเกจเป็น **Spark (No-cost)** — **ไม่ต้องกด Upgrade**

## 2. เปิด Authentication
1. **Build → Authentication → Get started**
2. แท็บ **Sign-in method** เปิด 2 วิธี
   - **Anonymous** (นักเรียนเข้าเล่นโดยไม่ต้องสมัคร)
   - **Google** (ครูเข้าสู่ระบบ) → ใส่อีเมลติดต่อ → Save
3. แท็บ **Settings → Authorized domains → Add domain** ใส่โดเมน Netlify เช่น `wave-adventure.netlify.app`

## 3. สร้าง Realtime Database + ใส่ Security Rules
1. **Build → Realtime Database → Create Database** → ตำแหน่ง **Singapore (asia-southeast1)** → **Start in locked mode**
2. คัดลอก URL ฐานข้อมูล เช่น `https://wave-adventure-yingyuad-default-rtdb.asia-southeast1.firebasedatabase.app`
3. แท็บ **Rules** → ลบของเดิมทั้งหมด → วางเนื้อหาไฟล์ [`database.rules.json`](database.rules.json) ทั้งไฟล์ → **Publish**

## 4. ให้สิทธิ์ครู
แท็บ **Data** → กด **+** ที่ราก แล้วสร้างโครงสร้าง
```
config
 └─ teacherEmails
     └─ sawitree@yingyuad,ac,th : true
```
- key คืออีเมล Google ของครู **โดยเปลี่ยนจุด `.` เป็นจุลภาค `,`** (ฐานข้อมูลห้ามใช้จุดในชื่อ) ตัวพิมพ์เล็กทั้งหมด
- ค่า (value) เป็น `true` (ชนิด boolean) · เพิ่มครูหลายคนได้
- ถ้าลืมวิธีเขียน key: เข้าเว็บ → ครู → เข้าสู่ระบบ Google หน้าเว็บจะแสดง key ที่ต้องใส่ให้คัดลอก
- นักเรียนเพิ่มสิทธิ์ตัวเองไม่ได้ (Rules ห้ามเขียน `config/teacherEmails`)

## 5. ค่าสำหรับ Frontend (นำไปใส่ใน Netlify)
**Project settings (⚙) → General → Your apps → Web (</>)** → ตั้งชื่อ → **Register app** → คัดลอกค่าใน `firebaseConfig` (ไม่ต้องเลือก Firebase Hosting)

| Netlify Environment Variable | ค่าจาก firebaseConfig |
|---|---|
| `VITE_FIREBASE_API_KEY` | apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_DATABASE_URL` | databaseURL (URL จากขั้นที่ 3) |
| `VITE_FIREBASE_APP_ID` | appId |
| `VITE_SCHOOL_API_URL` | (ไม่บังคับ) URL `/exec` ของ Apps Script ดูขั้นที่ 7 |

ค่าเหล่านี้เป็น “ตัวระบุโปรเจกต์” ที่ออกแบบให้อยู่ใน Frontend ได้ ความปลอดภัยมาจาก Security Rules

## 6. นำเข้าคลังการ์ดและคำถาม (ครั้งแรกครั้งเดียว)
เฉลยไม่ได้ฝังอยู่ในเว็บ (นักเรียนเปิดดูโค้ดเว็บก็ไม่เห็นเฉลย) จึงต้องนำเข้าเองครั้งแรก
1. ดาวน์โหลดไฟล์ [`setup/wave-content.json`](setup/wave-content.json) จาก GitHub (ปุ่ม Download raw file)
2. เปิดเว็บ → **ครู** → เข้าสู่ระบบ Google → **Teacher Dashboard → คลังคำถาม** → **นำเข้าชุดเริ่มต้น** → เลือกไฟล์
3. ได้การ์ดสถานการณ์ 20 ใบ + การ์ดพิเศษ 12 ใบ + คำถาม 50 ข้อ (แก้ไขต่อได้ในหน้าเดียวกัน)

## 7. (ไม่บังคับ) เข้าสู่ระบบด้วยเลขประจำตัว + PIN ผ่าน Apps Script
1. อัปเดตไฟล์ `SoundQuest.gs` ใน Apps Script ให้เป็นเวอร์ชันล่าสุดจาก [`sound-quest/gas/SoundQuest.gs`](../sound-quest/gas/SoundQuest.gs) (มีคำสั่ง `waveLink`)
2. Apps Script → ⚙ **การตั้งค่าโปรเจกต์ → คุณสมบัติของสคริปต์ → เพิ่ม** 3 ค่า
   | คุณสมบัติ | ค่า |
   |---|---|
   | `WAVE_DB_URL` | URL ฐานข้อมูลจากขั้นที่ 3 |
   | `WAVE_DB_SECRET` | Firebase → ⚙ Project settings → **Service accounts → Database secrets → Show** (คัดลอก) |
   | `WAVE_API_KEY` | ค่า apiKey จากขั้นที่ 5 |
   > `WAVE_DB_SECRET` เป็น **รหัสลับ** ใส่ใน Apps Script เท่านั้น ห้ามใส่ใน Netlify หรือ GitHub
3. **การทำให้ใช้งานได้ → จัดการ → แก้ไข → เวอร์ชันใหม่** (URL เดิม) · ครั้งแรก Google จะขอสิทธิ์ “เชื่อมต่อบริการภายนอก” ให้กดอนุญาต
4. ใส่ URL `/exec` ใน Netlify ที่ `VITE_SCHOOL_API_URL` · นักเรียนใช้ PIN ชุดเดิมของ SOUND QUEST และจำกัดเฉพาะ ม.5 เหมือนเดิม
5. ถ้าต้องการบังคับทุกห้อง ให้เปิด “ต้องเข้าสู่ระบบด้วยเลขประจำตัว + PIN” ใน Game Settings

## 8. ตรวจสอบหลังตั้งค่า
1. เปิดเว็บ → **ครู** → เข้าสู่ระบบ Google → เห็นหน้าสร้างห้อง (ถ้าขึ้นว่ายังไม่ได้รับสิทธิ์ ให้ตรวจขั้นที่ 4)
2. สร้างห้อง → มือถืออีกเครื่องสแกน QR เข้าร่วม → เล่น 2–3 ตา
3. Firebase Console → Realtime Database → Data → ควรเห็น `rooms/…`

## ทดสอบในเครื่องด้วย Emulator (สำหรับนักพัฒนา)
```bash
cd wave-adventure-online
npm ci
npm test                    # Unit 59 การทดสอบ
npm run test:integration    # Security Rules + เล่นหลายเครื่อง (18 การทดสอบ)
npm run test:e2e            # เปิดเว็บจริง ครู 1 + นักเรียน 3 browser (25 การตรวจ)
# หรือเปิดเล่นเอง:
npx firebase emulators:start --project demo-wave-adventure --only auth,database
npm run dev:emulator        # อีกหน้าต่าง → http://127.0.0.1:5173
```
ในโหมด Emulator ต้องเพิ่ม `config/teacherEmails/teacher@school,test = true` และนำเข้า `setup/wave-content.json` ก่อน (คำสั่ง `node tests/e2e/seed.mjs` ทำให้อัตโนมัติ)
