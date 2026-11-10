# TEST_REPORT — รายงานผลการทดสอบ

ทดสอบวันที่ 10 พ.ย. 2569 บนเครื่องพัฒนา (Linux, Node.js 22, Chromium ผ่าน Playwright)
Backend ทดสอบกับ **Firebase Emulator** (Auth + Realtime Database + Cloud Functions) โปรเจกต์ `demo-wave-adventure`
> ยังไม่ได้ทดสอบบน Firebase จริง เพราะยังไม่ได้ Deploy (ต้องใช้บัญชีครู + แพ็กเกจ Blaze)

## สรุป
| ชุดทดสอบ | คำสั่ง | ผล |
|---|---|---|
| Unit (Vitest + React Testing Library) | `npm test` | ✅ **52/52** (engine 35 · content 14 · components 3) |
| Integration (Emulator, ผู้ใช้ 5 sessions: ครู 1 + นักเรียน 4) | `npm run test:integration` | ✅ **17/17** |
| E2E (เปิดเว็บจริง 5 browser contexts: ครู 1 + นักเรียน 4) | `npm run test:e2e` | ✅ **23/23** (รันติดกัน 3 รอบก่อนส่ง + รอบยืนยันล่าสุด) |
| TypeScript | `npm run typecheck` / `npm run build` | ✅ ไม่มี error |
| ESLint | `npm run lint` | ✅ ไม่มี error/warning |
| Production Build | `npm run build` | ✅ (JS หลัก 374 kB · gzip 116 kB) |
| สแกน `dist/` หารหัสลับ / เฉลย | grep `AIza`, `private_key`, ข้อความเฉลยการ์ด | ✅ ไม่พบ (เฉลยอยู่ฝั่ง Backend เท่านั้น) |
| `npm audit --omit=dev` (Frontend) | | ✅ 0 vulnerabilities |
| `npm audit --omit=dev` (functions) | | ⚠ 6 moderate (glob/minimatch ใน dependency ของ firebase-admin, ไม่ถูกเรียกด้วยข้อมูลจากผู้ใช้) |
| เครื่องมือพัฒนา (firebase-tools 14) | | ⚠ มี advisory ใน dependency ของเครื่องมือ ใช้เฉพาะตอนพัฒนา/Deploy ไม่อยู่ในเว็บที่นักเรียนใช้ |

## Acceptance Tests 1–20
| # | เกณฑ์ | ทดสอบโดย | ผล |
|---|---|---|---|
| 1 | ครูสร้างห้องสำเร็จและได้รหัสห้อง | Integration + E2E | ✅ |
| 2 | นักเรียน 4 คนเข้าห้องเดียวกันจาก 4 sessions | Integration + E2E | ✅ |
| 3 | ทุกเครื่องเห็นรายชื่อผู้เล่นตรงกัน | Integration + E2E | ✅ |
| 4 | Host เริ่มเกมได้ ผู้เล่นทั่วไปเริ่มไม่ได้ | Integration + E2E | ✅ |
| 5 | เฉพาะผู้เล่นที่ถึงตาทอยลูกเต๋าได้ | Integration | ✅ |
| 6 | ลูกเต๋าสุ่มที่ Backend (crypto RNG) ผลตรงกันทุกเครื่อง | Integration + E2E (คะแนน 4 เครื่องตรงกัน) | ✅ |
| 7 | ตัวเดินเคลื่อนตามแต้มบนพิกัดกระดานจริง | Integration + Unit | ✅ |
| 8 | ช่องคลื่นเปิดการ์ด/คำถามถูกต้อง (ไม่ส่งเฉลยมาก่อน) | Integration + E2E | ✅ |
| 9 | Client แก้คะแนน/ตำแหน่ง/ลูกเต๋าเองไม่ได้ | Integration (Security Rules) | ✅ |
| 10 | ตอบถูกได้คะแนนตามกติกา | Integration + Unit | ✅ |
| 11 | ส่งคำตอบซ้ำไม่ได้คะแนนซ้ำ (requestId + state machine) | Integration + Unit | ✅ |
| 12 | ช่องฟ้าผ่าเปิดการ์ด ¹ | Integration + Unit | ✅ |
| 13 | หลุดแล้วกลับเข้าห้องเดิมได้ตามสิทธิ์ | Integration (โหลดใหม่ + เข้าจากเครื่องใหม่ด้วยเลขประจำตัว) | ✅ |
| 14 | ถึงเส้นชัยแล้วจบเกมตามกติกา ² | Integration + Unit | ✅ |
| 15 | หน้าสรุปผลแสดงผู้ชนะและคะแนนถูกต้อง | Integration + E2E | ✅ |
| 16 | Teacher Dashboard แสดงผลการเล่น | Integration + E2E | ✅ |
| 17 | ใช้บนมือถือได้ ไม่มีองค์ประกอบล้นจอ | E2E ที่ 360 / 375 / 390 / 430 / 768 px | ✅ |
| 18 | Production Build ไม่มี TypeScript Error | `npm run build` | ✅ |
| 19 | Security Rules ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต | Integration (อ่าน/เขียนโดยตรงถูกปฏิเสธ, รู้รหัสห้องอย่างเดียวเข้าไม่ได้) | ✅ |
| 20 | ไม่มี Secret ใน Frontend | สแกน `dist/` | ✅ |

¹ Prompt ระบุว่าช่องฟ้าผ่าเปิด “การ์ดสถานการณ์” แต่กติกาต้นฉบับของครูให้ช่องฟ้าผ่าเปิด **การ์ดพิเศษ** ระบบทำตามต้นฉบับ (ดู ASSET_ANALYSIS.md)
² กระดานต้นฉบับมี **36 ช่อง** ไม่ใช่ 50 ช่อง การทดสอบใช้ช่อง FINISH ของกระดานจริง

## สิ่งที่ยังไม่ได้ทดสอบ
- การเข้าสู่ระบบ Google แบบ popup จริง (ทดสอบด้วย token จำลองของ Auth Emulator)
- Firebase จริงบนอินเทอร์เน็ต / ความหน่วงของเครือข่ายโรงเรียน
- iOS Safari และ Android Chrome บนเครื่องจริง (ทดสอบด้วยขนาดจอจำลองใน Chromium)
- เกมที่มีผู้เล่นพร้อมกันหลายห้องจำนวนมาก (load test)

## ทดสอบซ้ำด้วยตนเอง
```bash
cd wave-adventure-online
npm ci && npm --prefix functions ci
npm test && npm run lint && npm run build
npm run test:integration
npm run test:e2e
```
