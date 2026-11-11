# TEST_REPORT — รายงานผลการทดสอบ

ทดสอบวันที่ 10 พ.ย. 2569 บนเครื่องพัฒนา (Linux, Node.js 22, Chromium ผ่าน Playwright)
ทดสอบกับ **Firebase Emulator** (Auth + Realtime Database + Security Rules) โปรเจกต์ `demo-wave-adventure`
สถาปัตยกรรมแบบฟรี (Spark): เครื่องครูรัน Host Runtime เป็นผู้ตัดสินเกม · ไม่มี Cloud Functions
> ยังไม่ได้ทดสอบบน Firebase จริง เพราะยังไม่ได้ตั้งค่าโปรเจกต์ด้วยบัญชีของครู

## สรุป
| ชุดทดสอบ | คำสั่ง | ผล |
|---|---|---|
| Unit (Vitest + React Testing Library) | `npm test` | ✅ **59/59** (engine 35 · content 14 · commands 7 · components 3) |
| Integration (Emulator, ครู 1 + นักเรียน 4 + บัญชีเพิ่มเติม) | `npm run test:integration` | ✅ **18/18** |
| E2E (เปิดเว็บจริง: ครู 1 + นักเรียน 3 กลุ่ม (1 กลุ่มจอมือถือ) + ผู้เยี่ยมชม) | `npm run test:e2e` | ✅ **29/29** |
| Apps Script (`SoundQuest.gs` คำสั่ง login / verify / waveLink) | ชุดจำลองบริการ Google | ✅ ผ่าน (PIN ผิด, ม.4, token ปลอม, ไม่ได้ตั้งค่า) |
| TypeScript | `npm run typecheck` / `npm run build` | ✅ ไม่มี error |
| ESLint | `npm run lint` | ✅ ไม่มี error/warning |
| Production Build | `npm run build` | ✅ (JS หลัก 412 kB · gzip 127 kB) |
| สแกน `dist/` หารหัสลับ / เฉลย | grep `AIza`, `private_key`, `WAVE_DB_SECRET`, ข้อความการ์ด/คำถาม | ✅ ไม่พบ (เฉลยอยู่ในฐานข้อมูลส่วนที่ครูอ่านได้เท่านั้น) |
| `npm audit --omit=dev` | | ✅ 0 vulnerabilities |
| เครื่องมือพัฒนา (firebase-tools 14) | | ⚠ มี advisory ใน dependency ของเครื่องมือ ใช้เฉพาะตอนทดสอบในเครื่อง ไม่อยู่ในเว็บที่นักเรียนใช้ |

## Acceptance Tests 1–20
| # | เกณฑ์ | ทดสอบโดย | ผล |
|---|---|---|---|
| 1 | ครูสร้างห้องสำเร็จและได้รหัสห้อง | Integration + E2E | ✅ |
| 2 | นักเรียน 4 คนเข้าห้องเดียวกันจาก 4 sessions | Integration + E2E | ✅ |
| 3 | ทุกเครื่องเห็นรายชื่อผู้เล่นตรงกัน | Integration + E2E | ✅ |
| 4 | Host เริ่มเกมได้ ผู้เล่นทั่วไปเริ่มไม่ได้ | Integration + E2E | ✅ |
| 5 | เฉพาะผู้เล่นที่ถึงตาทอยลูกเต๋าได้ | Integration | ✅ |
| 6 | ลูกเต๋าสุ่มที่เครื่องครู/Host (crypto RNG) ไม่ใช่เครื่องนักเรียน ผลตรงกันทุกเครื่อง | Integration + E2E (คะแนน 4 เครื่องตรงกัน) | ✅ |
| 7 | ตัวเดินเคลื่อนตามแต้มบนพิกัดกระดานจริง | Integration + Unit | ✅ |
| 8 | ช่องคลื่นเปิดการ์ด/คำถามถูกต้อง (ไม่ส่งเฉลยมาก่อน) · การ์ดเปิดหลังลูกเต๋าและตัวเดินหยุด · เห็นเฉพาะครูและกลุ่มที่ถึงตา · ครูปิด/เปิดการ์ดได้ | Integration + E2E | ✅ |
| 9 | นักเรียนแก้คะแนน/ตำแหน่ง/ลูกเต๋าเอง หรือส่งคำสั่งในนามคนอื่นไม่ได้ | Integration (Security Rules) | ✅ |
| 10 | ตอบถูกได้คะแนนตามกติกา | Integration + Unit | ✅ |
| 11 | ส่งคำตอบซ้ำไม่ได้คะแนนซ้ำ (requestId + state machine) | Integration + Unit | ✅ |
| 12 | ช่องฟ้าผ่าเปิดการ์ด ¹ | Integration + Unit | ✅ |
| 13 | หลุดแล้วกลับเข้าห้องเดิมได้ตามสิทธิ์ | Integration (โหลดใหม่ + เข้าจากเครื่องใหม่ด้วยเลขประจำตัว) · หมดเวลาตอบตัดสินโดย Host อัตโนมัติ | ✅ |
| 14 | ถึงเส้นชัยแล้วจบเกมตามกติกา ² | Integration + Unit | ✅ |
| 15 | หน้าสรุปผลแสดงผู้ชนะและคะแนนถูกต้อง | Integration + E2E | ✅ |
| 16 | Teacher Dashboard แสดงผลการเล่น | Integration + E2E | ✅ |
| 17 | ใช้บนมือถือได้ ไม่มีองค์ประกอบล้นจอ | E2E ที่ 360 / 375 / 390 / 430 / 768 px | ✅ |
| 18 | Production Build ไม่มี TypeScript Error | `npm run build` | ✅ |
| 19 | Security Rules ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต | Integration (อ่าน/เขียนโดยตรงถูกปฏิเสธ, ปลอมสิทธิ์ครู/เลขประจำตัวไม่ได้, ครูคนอื่นแก้ห้องไม่ได้, รู้รหัสห้องอย่างเดียวเข้าไม่ได้) + E2E | ✅ |
| 20 | ไม่มี Secret ใน Frontend | สแกน `dist/` | ✅ |

¹ Prompt ระบุว่าช่องฟ้าผ่าเปิด “การ์ดสถานการณ์” แต่กติกาต้นฉบับของครูให้ช่องฟ้าผ่าเปิด **การ์ดพิเศษ** ระบบทำตามต้นฉบับ (ดู ASSET_ANALYSIS.md)
² กระดานต้นฉบับมี **36 ช่อง** ไม่ใช่ 50 ช่อง การทดสอบใช้ช่อง FINISH ของกระดานจริง

## สิ่งที่ยังไม่ได้ทดสอบ
- การเข้าสู่ระบบ Google แบบ popup จริง (ทดสอบด้วย token จำลองของ Auth Emulator)
- Apps Script จริงเชื่อมกับ Firebase จริง (ทดสอบด้วยชุดจำลองบริการ Google + การเขียน studentLinks ใน Emulator)
- Firebase จริงบนอินเทอร์เน็ต / ความหน่วงของเครือข่ายโรงเรียน
- iOS Safari และ Android Chrome บนเครื่องจริง (ทดสอบด้วยขนาดจอจำลองใน Chromium)
- เกมที่มีผู้เล่นพร้อมกันหลายห้องจำนวนมาก (load test)

## ทดสอบซ้ำด้วยตนเอง
```bash
cd wave-adventure-online
npm ci
npm test && npm run lint && npm run build
npm run test:integration
npm run test:e2e
```
