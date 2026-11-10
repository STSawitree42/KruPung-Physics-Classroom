# FIREBASE_SETUP — ตั้งค่า Firebase (Backend)

> ⚠ **เรื่องค่าใช้จ่าย:** Cloud Functions ต้องใช้แพ็กเกจ **Blaze (จ่ายตามการใช้งาน)** ซึ่งต้องผูกบัตรเครดิต/บัญชีเรียกเก็บเงิน
> แพ็กเกจนี้มีโควตาฟรีรายเดือน (เช่น เรียกฟังก์ชัน 2 ล้านครั้ง/เดือน) การใช้งานในห้องเรียนทั่วไปน่าจะอยู่ในโควตาฟรี
> แต่ **ครูต้องเป็นผู้ตัดสินใจเปิดเอง** ระบบนี้ยังไม่ได้เปิดบริการใดที่มีค่าใช้จ่าย แนะนำให้ตั้ง **Budget alert** ไว้ที่ 50–100 บาท

ทำตามลำดับ ใช้เวลาประมาณ 30–45 นาที

## 1. สร้าง Firebase Project
1. เข้า https://console.firebase.google.com → **Add project** (สร้างโปรเจกต์)
2. ตั้งชื่อ เช่น `wave-adventure-yingyuad` (จะได้ Project ID เช่น `wave-adventure-yingyuad`)
3. Google Analytics: ปิดได้

## 2. เปิด Authentication
1. **Build → Authentication → Get started**
2. แท็บ **Sign-in method** เปิด 2 วิธี:
   - **Anonymous** (นักเรียนเข้าเล่นโดยไม่ต้องสมัคร)
   - **Google** (ครูเข้าสู่ระบบ) → ใส่อีเมลติดต่อ → Save
3. แท็บ **Settings → Authorized domains** → **Add domain** ใส่โดเมน Netlify เช่น `wave-adventure.netlify.app`

## 3. เปิด Realtime Database
1. **Build → Realtime Database → Create Database**
2. เลือกตำแหน่ง **Singapore (asia-southeast1)** (ใกล้ไทยที่สุด)
3. เลือก **Start in locked mode** (กฎจริงจะถูก deploy ในขั้นที่ 6)
4. คัดลอก URL ฐานข้อมูล เช่น `https://wave-adventure-yingyuad-default-rtdb.asia-southeast1.firebasedatabase.app`

## 4. อัปเกรดเป็น Blaze (จำเป็นสำหรับ Cloud Functions)
1. มุมซ้ายล่าง **Upgrade → Blaze** → ผูกบัญชีเรียกเก็บเงิน
2. ตั้ง **Budget alert** (Google Cloud Console → Billing → Budgets & alerts)

## 5. ตั้งค่า Cloud Functions (Environment)
สร้างไฟล์ `functions/.env.<Project ID>` เช่น `functions/.env.wave-adventure-yingyuad`
```
TEACHER_EMAILS=sawitree@yingyuad.ac.th
SCHOOL_API_URL=https://script.google.com/macros/s/XXXX/exec
```
- `TEACHER_EMAILS` อีเมล Google ของครูที่มีสิทธิ์สร้างห้องและแก้คลังคำถาม (หลายคนคั่นด้วยจุลภาค)
- `SCHOOL_API_URL` URL เว็บแอป Apps Script ของระบบห้องเรียนออนไลน์ (ตัวเดียวกับ SOUND QUEST) เว้นว่างได้ถ้าไม่ใช้การเข้าสู่ระบบด้วยเลขประจำตัว
- ค่าเหล่านี้ไม่ใช่รหัสลับ แต่ไม่ควร commit อีเมลจริงลง GitHub สาธารณะ (ไฟล์ `.env.<project>` อยู่ใน .gitignore ยกเว้นไฟล์ทดสอบ demo)

### ใช้การเข้าสู่ระบบด้วยเลขประจำตัว + PIN (ไม่บังคับ)
1. อัปเดตไฟล์ `SoundQuest.gs` ใน Apps Script ให้เป็นเวอร์ชันล่าสุดจาก `sound-quest/gas/SoundQuest.gs` (มีคำสั่ง `verify`)
2. **การทำให้ใช้งานได้ → จัดการ → แก้ไข → เวอร์ชันใหม่** (URL เดิม)
3. ใส่ URL ใน `SCHOOL_API_URL` · นักเรียนใช้ PIN ชุดเดิมของ SOUND QUEST และจำกัดเฉพาะ ม.5 เหมือนเดิม
4. ถ้าต้องการบังคับทุกห้อง ให้เปิด “ต้องเข้าสู่ระบบด้วยเลขประจำตัว + PIN” ใน Game Settings

## 6. Deploy Backend (ทำจากคอมพิวเตอร์ที่ติดตั้ง Node.js 22)
```bash
cd wave-adventure-online
npm ci
npm --prefix functions ci
npx firebase login
npx firebase use --add          # เลือก Project ที่สร้าง แล้วตั้งชื่อ alias เช่น prod
npx firebase deploy --only database,functions
```
คำสั่งนี้ deploy
- `database.rules.json` (Security Rules)
- Cloud Functions 16 ตัวในภูมิภาค `asia-southeast1`

## 7. ค่าสำหรับ Frontend (นำไปใส่ใน Netlify)
**Project settings (⚙) → General → Your apps → Add app → Web (</>)** → ตั้งชื่อ → คัดลอกค่า `firebaseConfig`

| Netlify Environment Variable | ค่าจาก firebaseConfig |
|---|---|
| `VITE_FIREBASE_API_KEY` | apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_DATABASE_URL` | databaseURL (URL จากขั้นที่ 3) |
| `VITE_FIREBASE_APP_ID` | appId |
| `VITE_FUNCTIONS_REGION` | `asia-southeast1` |

ค่าเหล่านี้เป็น “ตัวระบุโปรเจกต์” ที่ออกแบบให้อยู่ใน Frontend ได้ ความปลอดภัยมาจาก Security Rules และ Cloud Functions

## 8. ตรวจสอบหลัง Deploy
1. เปิดเว็บ → **ครู** → เข้าสู่ระบบด้วย Google (อีเมลใน TEACHER_EMAILS) → ควรเห็น Teacher Dashboard
2. สร้างห้อง → ใช้มือถืออีกเครื่องสแกน QR เข้าร่วม → เล่น 2–3 ตา
3. Firebase Console → Realtime Database → ควรเห็น `rooms/…`

## ทดสอบในเครื่องด้วย Emulator (ไม่ต้องมีบัญชี ไม่มีค่าใช้จ่าย)
```bash
npm ci && npm --prefix functions ci
npm run test:integration       # Backend + Rules (17 การทดสอบ)
npm run test:e2e               # เปิดเว็บจริง ครู 1 + นักเรียน 4 browser (23 การตรวจ)
# หรือเปิดเล่นเอง:
npm --prefix functions run build
npx firebase emulators:start --project demo-wave-adventure --only auth,database,functions
npm run dev:emulator           # อีกหน้าต่าง → http://127.0.0.1:5173
```
ในโหมด Emulator มีปุ่ม “เข้าสู่ระบบครู (ทดสอบ)” ใช้อีเมล `teacher@school.test`
